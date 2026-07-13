/* =============================================================================
 * Learning Supports v2 backend — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Per-student IEP / WIDA roster + assignment store. Lets a teacher record which
 * accommodations (from a fixed allow-list) and WIDA proficiency level apply to
 * each student, keyed by (section, initials). Student-facing pages read their
 * own row (public) so lessons can auto-enable the right supports; the roster
 * editor is teacher-gated.
 *
 * Routes (catch-all under /api/supports):
 *   GET    /api/supports/health                       -> { ok, d1 }               PUBLIC
 *   GET    /api/supports/sections                     -> { ok, sections }         PUBLIC
 *   GET    /api/supports/for?section=&initials=       -> { ok, widaLevel, iepItems }  PUBLIC
 *   GET    /api/supports/roster[?section=]            -> { ok, roster }           TEACHER
 *   POST   /api/supports/roster { entries:[...] }      -> { ok, count }            TEACHER
 *   DELETE /api/supports/roster { section, initials }  -> { ok }                   TEACHER
 *
 * Storage: Cloudflare D1, bound as `env.DB`.
 *
 * SAFETY / GRACEFUL DEGRADATION (mirrors functions/api/progress/[[path]].js):
 *   - No D1 binding on a PUBLIC read -> return the empty shape with ok:true so
 *     lessons keep working (fail-open), never a 500.
 *   - TEACHER routes: no TEACHER_KEY env -> 503 not-configured; wrong/missing
 *     key -> 401 unauthorized; no D1 -> 503 backend-not-configured.
 *   - Bad input is sanitized and skipped, never a 500.
 *
 * No timestamps are minted server-side (the runtime may forbid Date): updated_at
 * stores whatever ISO string the client sends, else stays null.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
};

function json(obj, status = 200, extraHeaders) {
  const headers = extraHeaders ? { ...JSON_HEADERS, ...extraHeaders } : JSON_HEADERS;
  return new Response(JSON.stringify(obj), { status, headers });
}

// Fixed allow-list of accommodation keys. Anything not here is dropped on write.
const ALLOW_LIST = [
  "tts",
  "text-large",
  "contrast",
  "tint",
  "ruler",
  "focus",
  "comfort",
  "vocab",
  "example",
  "model",
  "misconceptions",
  "frames",
  "notepad",
  "calculator",
  "numberline",
  "multchart",
  "placevalue",
  "translate",
  "fewer",
  "time",
];
const ALLOW_SET = new Set(ALLOW_LIST);

// --- sanitizers (never throw) ----------------------------------------------
function cleanSection(v) {
  return typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, 8) : "";
}
function cleanInitials(v) {
  return typeof v === "string" || typeof v === "number"
    ? String(v).trim().toUpperCase().slice(0, 6)
    : "";
}
function cleanWida(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.min(6, Math.max(0, n));
}
// Filter an array of keys to the allow-list, de-dupe, JSON string for storage.
function cleanIepItemsJson(v) {
  if (!Array.isArray(v)) return "[]";
  const seen = new Set();
  for (const item of v) {
    const key = typeof item === "string" ? item.trim() : "";
    if (ALLOW_SET.has(key)) seen.add(key);
  }
  return JSON.stringify([...seen]);
}
// Parse stored JSON back to an array on read; tolerate corruption.
function parseIepItems(s) {
  try {
    const arr = JSON.parse(s || "[]");
    return Array.isArray(arr) ? arr.filter((x) => ALLOW_SET.has(x)) : [];
  } catch (e) {
    return [];
  }
}
// Accept an ISO string from the body if present, else null. Never mint one.
function cleanUpdatedAt(v) {
  return typeof v === "string" && v ? v.slice(0, 30) : null;
}

async function ensureSchema(db) {
  // Idempotent: safe to call on every request.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS supports_roster (
        section    TEXT NOT NULL,
        initials   TEXT NOT NULL,
        wida_level INTEGER DEFAULT 0,
        iep_items  TEXT DEFAULT '[]',
        updated_at TEXT,
        PRIMARY KEY (section, initials)
      )`,
    )
    .run();
}

// Gating mirrors progress: no key configured -> not-configured; else compare.
function teacherAuthorized(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

function rowToEntry(r) {
  return {
    section: r.section,
    initials: r.initials,
    widaLevel: Number(r.wida_level) || 0,
    iepItems: parseIepItems(r.iep_items),
  };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  // params.path is an array of the segments after /api/supports/.
  const seg = (params.path && params.path[0]) || "";

  // Health works even without D1 so the client can probe availability.
  if (seg === "health") {
    return json({ ok: true, d1: !!env.DB });
  }

  // --- PUBLIC reads --------------------------------------------------------
  // Fail-open: no D1 -> return the empty shape with ok:true, never 500.
  if (seg === "sections" && method === "GET") {
    if (!env.DB) return json({ ok: true, sections: {} });
    try {
      await ensureSchema(env.DB);
      const res = await env.DB.prepare(
        "SELECT section, initials FROM supports_roster ORDER BY section, initials",
      ).all();
      const sections = {};
      for (const r of res.results || []) {
        (sections[r.section] || (sections[r.section] = [])).push(r.initials);
      }
      for (const k of Object.keys(sections)) sections[k].sort();
      return json({ ok: true, sections });
    } catch (e) {
      return json({ ok: true, sections: {} });
    }
  }

  if (seg === "for" && method === "GET") {
    const section = cleanSection(url.searchParams.get("section"));
    const initials = cleanInitials(url.searchParams.get("initials"));
    if (!env.DB || !section || !initials) {
      return json({ ok: true, widaLevel: 0, iepItems: [] });
    }
    try {
      await ensureSchema(env.DB);
      const row = await env.DB.prepare(
        "SELECT wida_level, iep_items FROM supports_roster WHERE section = ? AND initials = ?",
      )
        .bind(section, initials)
        .first();
      if (!row) return json({ ok: true, widaLevel: 0, iepItems: [] });
      return json({
        ok: true,
        widaLevel: Number(row.wida_level) || 0,
        iepItems: parseIepItems(row.iep_items),
      });
    } catch (e) {
      return json({ ok: true, widaLevel: 0, iepItems: [] });
    }
  }

  // --- TEACHER roster (read / upsert / delete) -----------------------------
  if (seg === "roster") {
    const auth = teacherAuthorized(env, request, url);
    if (auth === "not-configured")
      return json(
        {
          ok: false,
          error: "not-configured",
          message: "Set the TEACHER_KEY env var on the Pages project to enable the roster.",
        },
        503,
      );
    if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

    try {
      await ensureSchema(env.DB);

      if (method === "GET") {
        const filter = cleanSection(url.searchParams.get("section"));
        const res = filter
          ? await env.DB.prepare(
              "SELECT * FROM supports_roster WHERE section = ? ORDER BY initials",
            )
              .bind(filter)
              .all()
          : await env.DB.prepare("SELECT * FROM supports_roster ORDER BY section, initials").all();
        return json({ ok: true, roster: (res.results || []).map(rowToEntry) });
      }

      if (method === "POST") {
        const body = await request.json().catch(() => null);
        const entries = (body && Array.isArray(body.entries) && body.entries) || [];
        const stmt = env.DB.prepare(
          `INSERT INTO supports_roster (section, initials, wida_level, iep_items, updated_at)
             VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(section, initials) DO UPDATE SET
             wida_level = excluded.wida_level,
             iep_items  = excluded.iep_items,
             updated_at = excluded.updated_at`,
        );
        const batch = [];
        for (const e of entries.slice(0, 2000)) {
          if (!e || typeof e !== "object") continue;
          const section = cleanSection(e.section);
          const initials = cleanInitials(e.initials);
          if (!section || !initials) continue; // skip entries missing either key
          batch.push(
            stmt.bind(
              section,
              initials,
              cleanWida(e.widaLevel),
              cleanIepItemsJson(e.iepItems),
              cleanUpdatedAt(e.updatedAt),
            ),
          );
        }
        if (batch.length) await env.DB.batch(batch);
        return json({ ok: true, count: batch.length });
      }

      if (method === "DELETE") {
        const body = await request.json().catch(() => null);
        const section = cleanSection(body && body.section);
        const initials = cleanInitials(body && body.initials);
        if (section && initials) {
          await env.DB.prepare("DELETE FROM supports_roster WHERE section = ? AND initials = ?")
            .bind(section, initials)
            .run();
        }
        return json({ ok: true });
      }

      return json({ ok: false, error: "method-not-allowed" }, 405);
    } catch (err) {
      return json({ ok: false, error: "server-error", message: String(err) }, 500);
    }
  }

  return json({ ok: false, error: "not-found", route: seg }, 404);
}
