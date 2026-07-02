/* =============================================================================
 * Monster Math Academy — cross-device save codes. Cloudflare Pages Function.
 * -----------------------------------------------------------------------------
 * Routes (catch-all under /api/monster-save/):
 *   GET  /api/monster-save/health           -> { ok, backend, d1 }
 *   POST /api/monster-save/save  { code?, state } -> { ok, code, updatedAt }
 *   GET  /api/monster-save/load?code=XXXX   -> { ok, state, updatedAt }
 *
 * Storage: Cloudflare D1, bound as `env.DB` (same binding as functions/api/progress).
 *
 * Privacy: this table has NO name/section/email columns — it is structurally
 * impossible to store a student identity here. `state` is exactly the local
 * app's own AppState blob (monster appearance choices, kernel mind state,
 * teaching history) — the same no-PII data already kept in localStorage,
 * just also reachable by a code so a student can pick up on another device.
 * The code is the only secret; anyone holding it can read/overwrite that save,
 * the same trust model as every other save-code system on this site.
 *
 * Graceful degradation: no D1 binding -> 503, client keeps using localStorage.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

// Same code shape as the rest of the site (PREFIX-SUFFIX, unambiguous alphabet).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
const CODE_RE = /^MMA-[A-Z0-9]{5,8}$/;

function validCode(code) {
  return typeof code === "string" && CODE_RE.test(code);
}

function randomCode() {
  let suffix = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return `MMA-${suffix}`;
}

const MAX_STATE_BYTES = 50_000; // generous for a monster + minds + 50-entry history

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS monster_saves (
        save_code  TEXT PRIMARY KEY,
        state_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const seg = (params.path && params.path[0]) || "";

  if (seg === "health") {
    return json({ ok: true, backend: "cloudflare", d1: !!env.DB });
  }

  if (!env.DB) {
    return json(
      {
        ok: false,
        error: "backend-not-configured",
        message:
          "D1 binding 'DB' is not set. Falling back to localStorage only.",
      },
      503,
    );
  }

  try {
    await ensureSchema(env.DB);

    if (seg === "load" && method === "GET") {
      const url = new URL(request.url);
      const code = (url.searchParams.get("code") || "").toUpperCase();
      if (!validCode(code)) return json({ ok: false, error: "bad-code" }, 400);
      const row = await env.DB.prepare(
        "SELECT state_json, updated_at FROM monster_saves WHERE save_code = ?",
      )
        .bind(code)
        .first();
      if (!row) return json({ ok: false, error: "not-found" }, 404);
      let state;
      try {
        state = JSON.parse(row.state_json);
      } catch {
        return json({ ok: false, error: "corrupt-record" }, 500);
      }
      return json({ ok: true, state, updatedAt: row.updated_at });
    }

    if (seg === "save" && method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || typeof body.state !== "object" || body.state === null) {
        return json({ ok: false, error: "bad-payload" }, 400);
      }
      const stateJson = JSON.stringify(body.state);
      if (stateJson.length > MAX_STATE_BYTES) {
        return json({ ok: false, error: "state-too-large" }, 413);
      }

      let code = typeof body.code === "string" ? body.code.toUpperCase() : "";
      if (code && !validCode(code)) {
        return json({ ok: false, error: "bad-code" }, 400);
      }
      if (!code) {
        // Generate a fresh, unused code (collision odds are astronomically low
        // at this alphabet/length, but check anyway — it's one cheap SELECT).
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = randomCode();
          const existing = await env.DB.prepare(
            "SELECT 1 FROM monster_saves WHERE save_code = ?",
          )
            .bind(candidate)
            .first();
          if (!existing) {
            code = candidate;
            break;
          }
        }
        if (!code) return json({ ok: false, error: "server-error" }, 500);
      }

      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO monster_saves (save_code, state_json, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(save_code) DO UPDATE SET
           state_json = excluded.state_json,
           updated_at = excluded.updated_at`,
      )
        .bind(code, stateJson, nowIso, nowIso)
        .run();

      return json({ ok: true, code, updatedAt: nowIso });
    }

    return json({ ok: false, error: "not-found", route: seg }, 404);
  } catch (err) {
    return json(
      { ok: false, error: "server-error", message: String(err) },
      500,
    );
  }
}
