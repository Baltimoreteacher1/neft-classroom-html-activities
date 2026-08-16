/* =============================================================================
 * Global warmup-timer duration — shared across every device and teacher.
 * -----------------------------------------------------------------------------
 *   GET /api/settings/warmup             -> { ok, seconds, source }  (public)
 *   PUT /api/settings/warmup { seconds }  -> { ok, seconds }         (TEACHER_KEY)
 *
 * The warmup countdown length is a single global setting so that whatever a
 * teacher sets applies universally: every student and every teacher device
 * renders the SAME time on the interactive-lesson Phase 1 Warmup.
 *
 * Read is public (students must see the teacher-set time). Write is gated by
 * env.TEACHER_KEY (?key= or x-teacher-key header), mirroring the auth in
 * functions/api/progress/[[path]].js + functions/api/supports/[[path]].js.
 *
 * Storage: one row in D1 `site_settings` (bound as env.DB). Binding or key
 * absent -> graceful 503 and the client falls back to its own local value, so
 * the timer always works even when the shared backend is unavailable.
 * ========================================================================== */

const KEY = "warmup_seconds";
const DEFAULT_SECONDS = 300;
const MIN_SECONDS = 15;
const MAX_SECONDS = 3600;

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "cache-control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

function clampSeconds(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return null;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, v));
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT
      )`,
    )
    .run();
}

// Mirrors functions/api/progress + supports: no key configured -> not-configured
// (503), wrong/missing key -> unauthorized (401), correct key -> ok.
function teacherAuthorized(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok: true, seconds: DEFAULT_SECONDS, source: "default" });
  try {
    await ensureSchema(env.DB);
    const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = ?")
      .bind(KEY)
      .first();
    const seconds = row ? clampSeconds(row.value) : null;
    return json({
      ok: true,
      seconds: seconds == null ? DEFAULT_SECONDS : seconds,
      source: seconds == null ? "default" : "d1",
    });
  } catch {
    return json({ ok: true, seconds: DEFAULT_SECONDS, source: "default" });
  }
}

export async function onRequestPut({ request, env }) {
  const url = new URL(request.url);
  const auth = teacherAuthorized(env, request, url);
  if (auth === "not-configured")
    return json(
      {
        ok: false,
        error: "not-configured",
        message: "Set the TEACHER_KEY env var on the Pages project to enable shared settings.",
      },
      503,
    );
  if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);
  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const seconds = clampSeconds(body && body.seconds);
  if (seconds == null) return json({ ok: false, error: "bad-seconds" }, 400);

  try {
    await ensureSchema(env.DB);
    await env.DB.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
      .bind(KEY, String(seconds), new Date().toISOString())
      .run();
    return json({ ok: true, seconds });
  } catch {
    return json({ ok: false, error: "write-failed" }, 500);
  }
}
