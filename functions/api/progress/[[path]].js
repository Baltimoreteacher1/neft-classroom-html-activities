/* =============================================================================
 * Save / Resume backend — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Routes (catch-all under /api/progress):
 *   POST /api/progress/create   { saveCode, activityId, ... , state }
 *   POST /api/progress/save     { saveCode, ... , state }
 *   GET  /api/progress/load?code=XXXX   -> { ok, record }
 *   GET  /api/progress/health           -> { ok, backend, d1 }
 *
 * Storage: Cloudflare D1, bound as `env.DB`.
 *
 * SAFETY / GRACEFUL DEGRADATION:
 *   This mirrors the existing functions/api/state.js pattern — if the D1 binding
 *   is absent (not configured yet), every data route returns HTTP 503 and the
 *   client engine simply keeps using localStorage. Nothing breaks. The binding
 *   is intentionally NOT added to wrangler.toml yet; see SAVE_RESUME_SYSTEM.md
 *   for the one-time enablement steps.
 *
 * No authentication is required (local-dev friendly). Student data is kept
 * minimal: a code, optional name/section, the activity id, and the state blob.
 * Do not store sensitive data in activity state.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  // Permit cross-origin use (e.g. lessons served from a custom domain).
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

// Loose validation of a resume code: PREFIX-SUFFIX, safe characters only.
function validCode(code) {
  return (
    typeof code === "string" && /^[A-Z0-9]{1,12}-[A-Z0-9]{3,8}$/.test(code)
  );
}

function clamp(s, n) {
  return typeof s === "string" ? s.slice(0, n) : "";
}

async function ensureSchema(db) {
  // Idempotent: safe to call on every request. Mirrors migrations/0001.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS student_progress (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        save_code     TEXT UNIQUE NOT NULL,
        activity_id   TEXT NOT NULL,
        activity_title TEXT,
        student_name  TEXT,
        section       TEXT,
        state_json    TEXT NOT NULL,
        progress_percent INTEGER DEFAULT 0,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      )`,
    )
    .run();
}

function recordFromRow(row) {
  let state = {};
  try {
    state = JSON.parse(row.state_json || "{}");
  } catch (e) {
    state = {};
  }
  return {
    schema: 1,
    saveCode: row.save_code,
    activityId: row.activity_id,
    activityTitle: row.activity_title,
    studentName: row.student_name,
    section: row.section,
    progressPercent: row.progress_percent,
    state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function upsert(db, body, isCreate) {
  const code = body.saveCode;
  const stateJson = JSON.stringify(body.state || {});
  const nowIso = new Date().toISOString();
  const progress = Number(body.progressPercent) || 0;
  if (isCreate) {
    await db
      .prepare(
        `INSERT INTO student_progress
           (save_code, activity_id, activity_title, student_name, section,
            state_json, progress_percent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(save_code) DO UPDATE SET
            state_json = excluded.state_json,
            progress_percent = excluded.progress_percent,
            updated_at = excluded.updated_at`,
      )
      .bind(
        code,
        clamp(body.activityId, 200),
        clamp(body.activityTitle, 300),
        clamp(body.studentName, 60),
        clamp(body.section, 40),
        stateJson,
        progress,
        body.createdAt || nowIso,
        nowIso,
      )
      .run();
  } else {
    // Save: update if present, else insert (covers cross-device first save).
    const res = await db
      .prepare(
        `UPDATE student_progress
            SET state_json = ?, progress_percent = ?, updated_at = ?,
                student_name = COALESCE(NULLIF(?, ''), student_name),
                section = COALESCE(NULLIF(?, ''), section)
          WHERE save_code = ?`,
      )
      .bind(
        stateJson,
        progress,
        nowIso,
        clamp(body.studentName, 60),
        clamp(body.section, 40),
        code,
      )
      .run();
    if (!res.meta || res.meta.changes === 0) {
      await upsert(db, body, true);
    }
  }
  return nowIso;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  // params.path is an array of the segments after /api/progress/.
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

    if (seg === "load" && method === "GET") {
      const code = (
        new URL(request.url).searchParams.get("code") || ""
      ).toUpperCase();
      if (!validCode(code)) return json({ ok: false, error: "bad-code" }, 400);
      const row = await env.DB.prepare(
        "SELECT * FROM student_progress WHERE save_code = ?",
      )
        .bind(code)
        .first();
      if (!row) return json({ ok: false, error: "not-found" }, 404);
      return json({ ok: true, record: recordFromRow(row) });
    }

    if ((seg === "create" || seg === "save") && method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !validCode(body.saveCode))
        return json({ ok: false, error: "bad-payload" }, 400);
      const updatedAt = await upsert(env.DB, body, seg === "create");
      return json({ ok: true, saveCode: body.saveCode, updatedAt });
    }

    return json({ ok: false, error: "not-found", route: seg }, 404);
  } catch (err) {
    return json(
      { ok: false, error: "server-error", message: String(err) },
      500,
    );
  }
}
