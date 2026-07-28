/* =============================================================================
 * 3D game score events — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * The engine3d runtime (games/engine3d/progress.js -> reportScore) POSTs a
 * score event to /api/scores on every correct/incorrect step. Before this
 * handler existed there was no /api/scores route, so every score silently
 * 404'd and the client re-queued it forever. This persists each event so the
 * results pipeline can report not just the score but WHICH sub-skill failed
 * (via the misconceptionTag carried on the payload).
 *
 * Routes (catch-all under /api/scores):
 *   POST /api/scores            { gameId, standard, level, points, correct,
 *                                 total, steps, misconceptionTag, ts, ... }
 *   GET  /api/scores/health     -> { ok, backend, d1 }
 *   GET  /api/scores?gameId=ID  -> { ok, events: [...] }   (recent events)
 *
 * Storage: Cloudflare D1, bound as `env.DB` (the same binding as
 * functions/api/progress). SAFETY: if the binding is absent, data routes
 * return HTTP 503 and the client engine keeps queuing/using localStorage —
 * nothing breaks. The binding is intentionally NOT added to wrangler.toml yet;
 * see SAVE_RESUME_SYSTEM.md for the one-time enablement steps.
 *
 * No authentication (local-dev friendly). Keep stored data minimal and free of
 * anything sensitive.
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

function clamp(s, n) {
  return typeof s === "string" ? s.slice(0, n) : "";
}

function intOr(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

async function ensureSchema(db) {
  // Idempotent: safe to call on every request.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS game_scores (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id         TEXT NOT NULL,
        standard        TEXT,
        level           INTEGER,
        points          INTEGER DEFAULT 0,
        correct         INTEGER DEFAULT 0,
        total           INTEGER DEFAULT 0,
        steps           INTEGER DEFAULT 0,
        misconception_tag TEXT,
        save_code       TEXT,
        created_at      TEXT NOT NULL
      )`,
    )
    .run();
  // Latest per-game progress mirror (one row per game/saveCode).
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS game_progress (
        game_id     TEXT NOT NULL,
        save_code   TEXT NOT NULL DEFAULT '',
        level       INTEGER,
        total       INTEGER DEFAULT 0,
        steps       INTEGER DEFAULT 0,
        state_json  TEXT,
        updated_at  TEXT NOT NULL,
        PRIMARY KEY (game_id, save_code)
      )`,
    )
    .run();
}

async function upsertProgress(db, body) {
  const nowIso = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO game_progress
         (game_id, save_code, level, total, steps, state_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(game_id, save_code) DO UPDATE SET
         level = excluded.level,
         total = excluded.total,
         steps = excluded.steps,
         state_json = excluded.state_json,
         updated_at = excluded.updated_at`,
    )
    .bind(
      clamp(body.gameId, 120) || "unknown-game",
      clamp(body.saveCode, 40) || "",
      intOr(body.level, 1),
      intOr(body.total, 0),
      intOr(body.steps, 0),
      JSON.stringify(body),
      nowIso,
    )
    .run();
  return nowIso;
}

/**
 * `total` on a game_scores row is the number of ATTEMPTS the row represents —
 * the denominator of an accuracy ratio — and `correct` is how many of them were
 * right. A client that posts a running score here (engine3d did until 2026-07-28)
 * silently destroys every accuracy figure downstream: SUM(total) became a sum of
 * scores, so the usage report showed "18 correct / 1455 attempted", and negative
 * scores wrote total = -4. Storage is the last place that can refuse nonsense,
 * so the invariant is enforced here rather than trusted from the client:
 *   total >= 1  and  0 <= correct <= total
 * Clamping (not rejecting) keeps this fail-open — a miscounting game still
 * records that play happened instead of vanishing from telemetry entirely.
 */
function normalizeAttempts(body) {
  const total = Math.max(1, intOr(body.total, 1));
  const correct = Math.min(body.correct ? intOr(body.correct, 1) || 1 : 0, total);
  return { total, correct: Math.max(0, correct) };
}

async function insertEvent(db, body) {
  const nowIso = new Date().toISOString();
  const { total, correct } = normalizeAttempts(body);
  await db
    .prepare(
      `INSERT INTO game_scores
         (game_id, standard, level, points, correct, total, steps,
          misconception_tag, save_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      clamp(body.gameId, 120) || "unknown-game",
      clamp(body.standard, 120),
      intOr(body.level, 1),
      intOr(body.points, 0),
      correct,
      total,
      intOr(body.steps, 0),
      clamp(body.misconceptionTag, 120) || null,
      clamp(body.saveCode, 40) || null,
      body.ts ? new Date(body.ts).toISOString() : nowIso,
    )
    .run();
  return nowIso;
}

function rowToEvent(row) {
  return {
    gameId: row.game_id,
    standard: row.standard,
    level: row.level,
    points: row.points,
    correct: !!row.correct,
    total: row.total,
    steps: row.steps,
    misconceptionTag: row.misconception_tag,
    createdAt: row.created_at,
  };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const seg = (params.path && params.path[0]) || "";

  // Health works even without D1 so the client can probe availability.
  if (seg === "health") {
    return json({ ok: true, backend: "cloudflare", d1: !!env.DB });
  }

  // All data routes require the D1 binding. Absent -> graceful 503.
  if (!env.DB) {
    return json(
      {
        ok: false,
        error: "backend-not-configured",
        message:
          "D1 binding 'DB' is not set. Falling back to local storage. See SAVE_RESUME_SYSTEM.md.",
      },
      503,
    );
  }

  try {
    await ensureSchema(env.DB);

    // POST /api/scores  -> record a score event.
    if (method === "POST" && (seg === "" || seg === "report")) {
      const body = await request.json().catch(() => null);
      if (!body || !body.gameId) return json({ ok: false, error: "bad-payload" }, 400);
      const ts = await insertEvent(env.DB, body);
      return json({ ok: true, ts });
    }

    // GET /api/scores?gameId=ID -> recent events for a game (teacher view).
    if (method === "GET" && seg === "") {
      const gameId = clamp(new URL(request.url).searchParams.get("gameId") || "", 120);
      const stmt = gameId
        ? env.DB.prepare(
            "SELECT * FROM game_scores WHERE game_id = ? ORDER BY id DESC LIMIT 200",
          ).bind(gameId)
        : env.DB.prepare("SELECT * FROM game_scores ORDER BY id DESC LIMIT 200");
      const { results } = await stmt.all();
      return json({ ok: true, events: (results || []).map(rowToEvent) });
    }

    // POST /api/scores/progress -> upsert the per-game progress mirror.
    if (method === "POST" && seg === "progress") {
      const body = await request.json().catch(() => null);
      if (!body || !body.gameId) return json({ ok: false, error: "bad-payload" }, 400);
      const ts = await upsertProgress(env.DB, body);
      return json({ ok: true, ts });
    }

    // GET /api/scores/progress?gameId=ID[&saveCode=CODE] -> latest progress.
    if (method === "GET" && seg === "progress") {
      const url = new URL(request.url);
      const gameId = clamp(url.searchParams.get("gameId") || "", 120);
      const saveCode = clamp(url.searchParams.get("saveCode") || "", 40);
      if (!gameId) return json({ ok: false, error: "bad-gameId" }, 400);
      const row = await env.DB.prepare(
        "SELECT * FROM game_progress WHERE game_id = ? AND save_code = ?",
      )
        .bind(gameId, saveCode)
        .first();
      if (!row) return json({ ok: false, error: "not-found" }, 404);
      let state = {};
      try {
        state = JSON.parse(row.state_json || "{}");
      } catch {
        state = {};
      }
      return json({ ok: true, ...state });
    }

    return json({ ok: false, error: "not-found", route: seg }, 404);
  } catch (err) {
    return json({ ok: false, error: "server-error", message: String(err) }, 500);
  }
}
