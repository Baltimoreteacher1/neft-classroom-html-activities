/* =============================================================================
 * Save / Resume backend — Cloudflare Pages Function (optional, opt-in)
 * -----------------------------------------------------------------------------
 * Routes (catch-all under /api/progress):
 *   POST /api/progress/create   { saveCode, activityId, ... , state }
 *   POST /api/progress/save     { saveCode, ... , state }
 *   GET  /api/progress/load?code=XXXX   -> { ok, record }
 *   GET  /api/progress/health           -> { ok, backend, d1 }
 *   GET  /api/progress/exemplars?activity=ID        -> { ok, exemplars } (public, redacted)
 *   GET  /api/progress/digest?since=ISO&section=    -> per-student rollup (TEACHER_KEY)
 *   GET  /api/progress/mastery-rollup?section=      -> standards rollup   (TEACHER_KEY)
 *   GET  /api/progress/struggles?minutes=N&section= -> recent risk rows   (TEACHER_KEY)
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

function json(obj, status = 200, extraHeaders) {
  const headers = extraHeaders ? { ...JSON_HEADERS, ...extraHeaders } : JSON_HEADERS;
  return new Response(JSON.stringify(obj), { status, headers });
}

// Loose validation of a resume code: PREFIX-SUFFIX, safe characters only.
function validCode(code) {
  return typeof code === "string" && /^[A-Z0-9]{1,12}-[A-Z0-9]{3,8}$/.test(code);
}

// --- /load anti-enumeration guard ------------------------------------------
// A harvester can't be blocked by auth (students resume with only a code), so
// we cap how many *guesses* (misses) a single IP can make per window. Valid
// resumes never count, so real students — even a whole class on one NAT — are
// never throttled. Miss buckets are pruned opportunistically so the table stays
// tiny. See the /load route for the rationale.
const LOAD_WINDOW_SEC = 300; // 5-minute window
const LOAD_MAX_MISSES = 50; // misses per IP per window before 429
// Public exemplar-gallery reads share the same window/table. Every hit counts
// (there is no "valid guess" to exempt), so the cap is generous enough for a
// whole class on one NAT loading a project page, yet stops id enumeration.
const EXEMPLAR_MAX_HITS = 120; // gallery reads per IP per window before 429

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "?";
}
function loadBucket() {
  return Math.floor(Date.now() / 1000 / LOAD_WINDOW_SEC);
}
async function ensureLoadGuardSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS load_miss (
        ip     TEXT NOT NULL,
        bucket INTEGER NOT NULL,
        hits   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (ip, bucket)
      )`,
    )
    .run();
}
async function loadMissCount(db, ip, bucket) {
  const row = await db
    .prepare("SELECT hits FROM load_miss WHERE ip = ? AND bucket = ?")
    .bind(ip, bucket)
    .first();
  return row ? Number(row.hits) || 0 : 0;
}
async function noteLoadMiss(db, ip, bucket) {
  await db
    .prepare(
      `INSERT INTO load_miss (ip, bucket, hits) VALUES (?, ?, 1)
         ON CONFLICT(ip, bucket) DO UPDATE SET hits = hits + 1`,
    )
    .bind(ip, bucket)
    .run();
  // Opportunistic cleanup of stale windows keeps the table from growing.
  try {
    await db
      .prepare("DELETE FROM load_miss WHERE bucket < ?")
      .bind(bucket - 1)
      .run();
  } catch (_e) {
    /* prune is best-effort */
  }
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

/* Columns added by migrations/0007 that link a progress row back to the student
   who owns it. They are added lazily so a database that has not had the
   migration applied still works — but ALTER TABLE on every request would be
   wasteful, so the result is cached per isolate. A cold isolate pays one
   PRAGMA; everything after is free.

   Deliberately additive: older clients that never send these fields keep
   saving exactly as before, they just don't appear on the /today screen until
   the student next opens the activity. Nothing breaks, nothing is lost. */
const STUDENT_LINK_COLUMNS = ["student_id", "class_code", "activity_url"];
// progressPercent is the engine's own heuristic (filled fields / total), so it
// rarely lands exactly on 100 even when a student is finished. Treat "almost
// entirely filled in" as done rather than nagging them back into a lesson they
// have effectively completed.
const DONE_PERCENT = 95;
let studentLinkReady = false;

async function ensureStudentLinkColumns(db) {
  if (studentLinkReady) return;
  const info = await db.prepare("PRAGMA table_info(student_progress)").all();
  const have = new Set((info.results || []).map((r) => r.name));
  for (const col of STUDENT_LINK_COLUMNS) {
    if (have.has(col)) continue;
    try {
      await db.prepare(`ALTER TABLE student_progress ADD COLUMN ${col} TEXT`).run();
    } catch (_e) {
      // Raced with another request that added it — harmless either way.
    }
  }
  try {
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_student_progress_student
           ON student_progress (class_code, student_id, updated_at DESC)`,
      )
      .run();
  } catch (_e) {
    /* index is an optimisation, not a correctness requirement */
  }
  studentLinkReady = true;
}

async function ensureTelemetrySchema(db) {
  // Idempotent: created on first telemetry write — no separate migration needed.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS lesson_telemetry (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_slug  TEXT,
        lesson_title TEXT,
        standard     TEXT,
        student_name TEXT,
        section      TEXT,
        event_type   TEXT,
        payload_json TEXT,
        created_at   TEXT NOT NULL
      )`,
    )
    .run();
}

async function ensureFamilySignoffSchema(db) {
  // Idempotent: created on first sign-off write — no separate migration needed.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS family_signoff (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id    TEXT NOT NULL,
        lesson_title TEXT,
        parent_name  TEXT,
        note         TEXT,
        student_name TEXT,
        section      TEXT,
        signed_on    TEXT,
        created_at   TEXT NOT NULL,
        UNIQUE (lesson_id, parent_name, student_name)
      )`,
    )
    .run();
}

/* Family homework sign-off. The parent types their name on the family page to
   confirm they reviewed the work with their student; until now that was written
   to localStorage only, so the teacher never saw it and it died with the
   device's browser storage.
   Best-effort like telemetry: always 204 so a family on a bad connection never
   sees an error, and the page keeps localStorage as its source of truth. */
async function storeFamilySignoff(env, body) {
  if (!env.DB || !body || !body.lessonId) return;
  await ensureFamilySignoffSchema(env.DB);
  const now = new Date().toISOString();
  const trim = (v, max) => (v == null ? "" : String(v).slice(0, max));
  await env.DB.prepare(
    `INSERT INTO family_signoff
       (lesson_id, lesson_title, parent_name, note, student_name, section, signed_on, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (lesson_id, parent_name, student_name)
     DO UPDATE SET note = excluded.note,
                   section = excluded.section,
                   signed_on = excluded.signed_on,
                   created_at = excluded.created_at`,
  )
    .bind(
      trim(body.lessonId, 64),
      trim(body.lessonTitle, 200),
      trim(body.parentName, 120),
      trim(body.note, 1000),
      trim(body.studentName, 120),
      trim(body.section, 64),
      trim(body.date, 40),
      now,
    )
    .run();
}

// Best-effort telemetry sink. NEVER throws into the client: returns 204 whether
// or not D1 is configured, so the fire-and-forget client never errors or retries.
async function storeTelemetry(env, body) {
  if (!env.DB || !body) return;
  const events = Array.isArray(body.events) ? body.events : [];
  if (!events.length) return;
  await ensureTelemetrySchema(env.DB);
  const slug = clamp(body.activityId, 200);
  const title = clamp(body.activityTitle, 300);
  const standard = clamp(body.standard, 20);
  const name = clamp(body.studentName, 60);
  const section = clamp(body.section, 40);
  const nowIso = new Date().toISOString();
  const stmt = env.DB.prepare(
    `INSERT INTO lesson_telemetry
       (lesson_slug, lesson_title, standard, student_name, section, event_type, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  // Bound batch; one statement per event keeps it simple and within D1 limits.
  const batch = events
    .slice(0, 100)
    .map((e) =>
      stmt.bind(
        slug,
        title,
        standard,
        name,
        section,
        clamp(e && (e.type || e.event || e.kind), 40),
        clamp(JSON.stringify(e), 2000),
        (e && typeof (e.at || e.ts) === "string" && (e.at || e.ts).slice(0, 30)) || nowIso,
      ),
    );
  await env.DB.batch(batch);
}

// --- Teacher admin (roster / grades export) --------------------------------
// All routes below are gated by env.TEACHER_KEY, mirroring the telemetry GET
// pattern. Student data is never world-readable: no key → 503, wrong key → 401.

function teacherAuthorized(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

// Add the teacher-editable columns once. SQLite has no "ADD COLUMN IF NOT
// EXISTS", so we ALTER and swallow the "duplicate column" error. Idempotent.
async function ensureAdminColumns(db) {
  for (const ddl of [
    "ALTER TABLE student_progress ADD COLUMN manual_grade TEXT",
    "ALTER TABLE student_progress ADD COLUMN teacher_note TEXT",
    "ALTER TABLE student_progress ADD COLUMN exemplar_approved INTEGER DEFAULT 0",
    "ALTER TABLE student_progress ADD COLUMN exemplar_note TEXT",
  ]) {
    try {
      await db.prepare(ddl).run();
    } catch (_e) {
      /* column already exists — fine */
    }
  }
}

// Best-effort score extraction from the activity state blob. The save-resume
// engine records marked scores under a few common shapes; fall back to null.
function scoreFromState(state) {
  if (!state || typeof state !== "object") return null;
  const cand = [state.score, state.percent, state.percentCorrect, state.grade];
  for (const c of cand) {
    const n = Number(c);
    if (Number.isFinite(n)) return Math.round(n);
  }
  if (Number.isFinite(Number(state.correct)) && Number(state.total) > 0) {
    return Math.round((Number(state.correct) / Number(state.total)) * 100);
  }
  return null;
}

// --- Public exemplar redaction ----------------------------------------------
// The exemplars route is the ONLY unauthenticated read of student work, so it
// exposes strictly redacted data: a first name + last initial (never the full
// name) and a whitelisted excerpt of free-text responses/self-assessment only.
// Nothing else in state_json (scores, codes, timestamps, ids) ever leaves.

function firstNameInitial(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "A student";
  const last = parts.length > 1 ? " " + parts[parts.length - 1].charAt(0).toUpperCase() + "." : "";
  return parts[0] + last;
}

const EXCERPT_MAX_CHARS = 400;
const EXCERPT_MAX_COUNT = 3;

function collectExcerptText(value, out) {
  if (out.length >= EXCERPT_MAX_COUNT) return;
  if (typeof value === "string") {
    const t = value.trim();
    // Skip trivial fragments ("3", "true") — only real written work qualifies.
    if (t.length >= 20) out.push(t.slice(0, EXCERPT_MAX_CHARS));
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectExcerptText(v, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const k of ["text", "answer", "response", "value"]) {
      if (typeof value[k] === "string") collectExcerptText(value[k], out);
    }
  }
}

function exemplarExcerpts(state) {
  const out = [];
  if (!state || typeof state !== "object") return out;
  // Whitelist: student free-text responses + self-assessment. Nothing else.
  collectExcerptText(state.responses, out);
  collectExcerptText(state.selfAssessment, out);
  collectExcerptText(state.selfassess, out);
  return out.slice(0, EXCERPT_MAX_COUNT);
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function rowsToCsv(headers, rows) {
  const head = headers.map(csvCell).join(",");
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  // Leading BOM so Excel opens UTF-8 names (accents) correctly.
  return "﻿" + head + "\n" + body + "\n";
}

function xmlEsc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Excel 2003 SpreadsheetML — a single .xls XML file that opens natively in
// Excel and Google Sheets with MULTIPLE named tabs, zero dependencies, no zip.
function sheetXml(name, headers, rows) {
  const cell = (v, forceText) => {
    const num = !forceText && v !== "" && v != null && Number.isFinite(Number(v));
    const type = num ? "Number" : "String";
    const val = num ? Number(v) : xmlEsc(v);
    return `<Cell><Data ss:Type="${type}">${val}</Data></Cell>`;
  };
  const headRow = "<Row>" + headers.map((h) => cell(h, true)).join("") + "</Row>";
  const bodyRows = rows
    .map((r) => "<Row>" + r.map((c) => cell(c, false)).join("") + "</Row>")
    .join("");
  return (
    `<Worksheet ss:Name="${xmlEsc(name)}"><Table>` + headRow + bodyRows + "</Table></Worksheet>"
  );
}

function workbookXls(sheets) {
  return (
    '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
    'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
    sheets.map((s) => sheetXml(s.name, s.headers, s.rows)).join("") +
    "</Workbook>"
  );
}

const ROSTER_HEADERS = [
  "Save Code",
  "Student Name",
  "Class",
  "Activity",
  "Progress %",
  "Score %",
  "Grade",
  "Note",
  "Last Saved",
];

function rosterRowValues(r) {
  let state = {};
  try {
    state = JSON.parse(r.state_json || "{}");
  } catch (_e) {
    state = {};
  }
  return {
    code: r.save_code,
    name: r.student_name || "",
    section: r.section || "",
    activity: r.activity_title || r.activity_id || "",
    progress: r.progress_percent == null ? "" : r.progress_percent,
    score: scoreFromState(state),
    grade: r.manual_grade || "",
    note: r.teacher_note || "",
    // Exemplar gallery approval (JSON consumers only; CSV/XLS columns unchanged).
    exemplarApproved: r.exemplar_approved ? 1 : 0,
    exemplarNote: r.exemplar_note || "",
    updatedAt: r.updated_at || "",
  };
}

function recordFromRow(row) {
  let state = {};
  try {
    state = JSON.parse(row.state_json || "{}");
  } catch (_e) {
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
  await ensureStudentLinkColumns(db);
  const studentId = clamp(body.studentId, 64);
  const classCode = clamp(body.classCode, 12).toUpperCase();
  const activityUrl = clamp(body.url, 300);
  if (isCreate) {
    await db
      .prepare(
        `INSERT INTO student_progress
           (save_code, activity_id, activity_title, student_name, section,
            state_json, progress_percent, created_at, updated_at,
            student_id, class_code, activity_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(save_code) DO UPDATE SET
            state_json = excluded.state_json,
            progress_percent = excluded.progress_percent,
            updated_at = excluded.updated_at,
            student_id = COALESCE(NULLIF(excluded.student_id, ''), student_progress.student_id),
            class_code = COALESCE(NULLIF(excluded.class_code, ''), student_progress.class_code),
            activity_url = COALESCE(NULLIF(excluded.activity_url, ''), student_progress.activity_url)`,
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
        studentId,
        classCode,
        activityUrl,
      )
      .run();
  } else {
    // Save: update if present, else insert (covers cross-device first save).
    // Identity fields only ever fill in — a client that doesn't know the
    // student's roster id must never blank one that an earlier save recorded.
    const res = await db
      .prepare(
        `UPDATE student_progress
            SET state_json = ?, progress_percent = ?, updated_at = ?,
                student_name = COALESCE(NULLIF(?, ''), student_name),
                section = COALESCE(NULLIF(?, ''), section),
                student_id = COALESCE(NULLIF(?, ''), student_id),
                class_code = COALESCE(NULLIF(?, ''), class_code),
                activity_url = COALESCE(NULLIF(?, ''), activity_url)
          WHERE save_code = ?`,
      )
      .bind(
        stateJson,
        progress,
        nowIso,
        clamp(body.studentName, 60),
        clamp(body.section, 40),
        studentId,
        classCode,
        activityUrl,
        code,
      )
      .run();
    if (!res.meta || res.meta.changes === 0) {
      await upsert(db, body, true);
    }
  }
  return nowIso;
}

// --- Insight Signal (second-brain substrate) -------------------------------
// Persists Insight Brief's per-student diagnosis as a timestamped snapshot so
// the signal becomes longitudinal + joinable instead of ephemeral. Stores only
// DERIVED signal (tier + counts + weak standards), never raw student work.
async function ensureInsightSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS insight_signal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        captured_at TEXT NOT NULL,
        section TEXT,
        student_name TEXT,
        tier TEXT,
        risk INTEGER DEFAULT 0,
        activities INTEGER DEFAULT 0,
        struggles INTEGER DEFAULT 0,
        misconceptions INTEGER DEFAULT 0,
        avg_score INTEGER,
        weak_standards_json TEXT,
        mastery_standards_json TEXT,
        source TEXT DEFAULT 'insight-brief'
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_insight_signal_section ON insight_signal (section, captured_at)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_insight_signal_student ON insight_signal (student_name, captured_at)`,
    )
    .run();
}

function parseJsonOr(text, fallback) {
  try {
    return JSON.parse(text || "");
  } catch (_e) {
    return fallback;
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  // params.path is an array of the segments after /api/progress/.
  const seg = (params.path && params.path[0]) || "";

  // Health works even without D1 so the client can probe availability.
  if (seg === "health") {
    return json({ ok: true, backend: "cloudflare", d1: !!env.DB });
  }

  // Family sign-off. POST is fire-and-forget (204 regardless of D1) so a family
  // never sees an error; GET is the teacher's read and is TEACHER_KEY-gated and
  // closed by default, like every other route that returns student data.
  // Must come BEFORE the D1 guard below.
  if (seg === "family-signoff") {
    if (method === "POST") {
      try {
        await storeFamilySignoff(env, await request.json());
      } catch (_e) {}
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }
    if (method === "GET") {
      if (!env.TEACHER_KEY) {
        return json(
          {
            ok: false,
            error: "not-configured",
            message: "Set the TEACHER_KEY env var to enable family sign-off review.",
          },
          503,
        );
      }
      const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
      if (key !== env.TEACHER_KEY) return json({ ok: false, error: "unauthorized" }, 401);
      if (!env.DB) return json({ ok: false, error: "no-d1" }, 503);
      await ensureFamilySignoffSchema(env.DB);
      const section = url.searchParams.get("section") || "";
      const since = url.searchParams.get("since") || "";
      const rows = section
        ? await env.DB.prepare(
            `SELECT * FROM family_signoff WHERE section = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 500`,
          )
            .bind(section, since || "0000")
            .all()
        : await env.DB.prepare(
            `SELECT * FROM family_signoff WHERE created_at >= ? ORDER BY created_at DESC LIMIT 500`,
          )
            .bind(since || "0000")
            .all();
      return json({ ok: true, signoffs: rows.results || [] });
    }
    return json({ ok: false, error: "method-not-allowed" }, 405);
  }

  // Telemetry is fire-and-forget: accept (204) regardless of D1 so the client
  // never errors or retries. Persist only when the binding exists. Must come
  // BEFORE the D1 guard below.
  if (seg === "telemetry") {
    // GET = teacher mastery dashboard read. Gated by TEACHER_KEY and closed by
    // default (student data must never be world-readable). Set TEACHER_KEY as a
    // Pages env var to enable the dashboard at /teacher-tools/mastery/.
    if (method === "GET") {
      if (!env.TEACHER_KEY) {
        return json(
          {
            ok: false,
            error: "not-configured",
            message: "Set the TEACHER_KEY env var to enable the mastery dashboard.",
          },
          503,
        );
      }
      const url = new URL(request.url);
      const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
      if (key !== env.TEACHER_KEY) return json({ ok: false, error: "unauthorized" }, 401);
      if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);
      try {
        await ensureTelemetrySchema(env.DB);
        const limit = Math.min(Number(url.searchParams.get("limit")) || 2000, 5000);
        const rows = await env.DB.prepare(
          `SELECT lesson_slug, lesson_title, standard, student_name, section,
                  event_type, payload_json, created_at
             FROM lesson_telemetry ORDER BY id DESC LIMIT ?`,
        )
          .bind(limit)
          .all();
        const events = (rows.results || []).map((r) => {
          let props = {};
          try {
            props = JSON.parse(r.payload_json || "{}");
          } catch (_e) {
            props = {};
          }
          return {
            lessonSlug: r.lesson_slug,
            lessonTitle: r.lesson_title,
            standard: r.standard,
            studentName: r.student_name || "",
            section: r.section || "",
            type: r.event_type,
            props,
            at: r.created_at,
          };
        });
        return json({ ok: true, count: events.length, events });
      } catch (err) {
        return json({ ok: false, error: "server-error", message: String(err) }, 500);
      }
    }
    // POST = fire-and-forget ingest: accept (204) regardless of D1 so the client
    // never errors or retries. Persist only when the binding exists.
    if (method !== "POST") {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }
    try {
      const body = await request.json().catch(() => null);
      await storeTelemetry(env, body);
    } catch (_e) {
      // Swallow — telemetry must never fail loudly.
    }
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  // --- Small-group class view (aggregate-only) -------------------------------
  // Section-level rollup of the name-free small_group_evidence events for one
  // base lesson, consumed by the in-studio Facilitation Console. Ungated by
  // design BECAUSE it can only ever return counts/averages: the source rows
  // carry no student names (the studio never sends them) and no individual
  // event, payload, or free text is echoed back. Anything per-student stays
  // behind the TEACHER_KEY-gated /telemetry route above.
  if (seg === "small-group-summary" && method === "GET") {
    const base = clamp(url.searchParams.get("lesson"), 10);
    if (!/^\d{1,2}-\d{1,2}$/.test(base)) return json({ ok: false, error: "invalid-lesson" }, 400);
    if (!env.DB) return json({ ok: true, devicesReporting: 0, groups: [] });
    try {
      await ensureTelemetrySchema(env.DB);
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const rows = await env.DB.prepare(
        `SELECT lesson_slug, section, payload_json
           FROM lesson_telemetry
          WHERE event_type = 'small_group_evidence'
            AND (lesson_slug LIKE ? OR lesson_slug LIKE ?)
            AND created_at >= ?
          ORDER BY id DESC LIMIT 500`,
      )
        .bind(`${base}-group%`, `${base}-catchup`, since)
        .all();
      const groups = new Map();
      for (const row of rows.results || []) {
        const payload = parseJsonOr(row.payload_json, {});
        const variant =
          payload.variant || String(row.lesson_slug).replace(`${base}-`, "") || "unknown";
        const key = `${row.section || "—"}|${variant}`;
        const group = groups.get(key) || {
          section: row.section || "—",
          variant,
          completions: 0,
          inProgress: 0,
          solvedSum: 0,
          totalSum: 0,
          hintHeavy: 0,
          devicesReporting: 0,
        };
        // Coverage denominator (epistemic policy): each event declares
        // reported:1, so a group whose counts are 0 can be told apart from a
        // group nobody's device ever reported from.
        group.devicesReporting += Number(payload.reported) || 0;
        if (payload.kind === "checkpoint") {
          group.inProgress++;
        } else {
          group.completions++;
          group.solvedSum += Number(payload.practiceSolved) || 0;
          group.totalSum += Number(payload.practiceTotal) || 0;
          if ((Number(payload.hints) || 0) >= 3) group.hintHeavy++;
        }
        groups.set(key, group);
      }
      const groupList = [...groups.values()];
      return json({
        ok: true,
        lesson: base,
        devicesReporting: groupList.reduce((sum, g) => sum + g.devicesReporting, 0),
        groups: groupList.map((group) => ({
          section: group.section,
          variant: group.variant,
          completions: group.completions,
          inProgress: group.inProgress,
          avgSolved: group.completions ? Math.round(group.solvedSum / group.completions) : 0,
          avgTotal: group.completions ? Math.round(group.totalSum / group.completions) : 0,
          hintHeavy: group.hintHeavy,
          devicesReporting: group.devicesReporting,
        })),
      });
    } catch (_err) {
      return json({ ok: true, devicesReporting: 0, groups: [] });
    }
  }

  // --- Next move (the policy) ------------------------------------------------
  // The classroom asks one question every day: given yesterday, what should these
  // students do for the next fifteen minutes? Until now the system had 232
  // navigable surfaces, telemetry flowing IN, and nothing flowing OUT — the whole
  // action space built and no controller. This is the controller.
  //
  // It answers three things and refuses to answer more: which lesson is next,
  // which lane to pull, and the two named misconceptions to watch for. The teacher
  // overrides it freely; it is a recommendation, not an assignment.
  //
  // Honesty rules (docs/specs/epistemic-policy.md):
  //   - Every response carries `devicesReporting` and a `confidence` band. An
  //     aggregate over 2 devices is not the same claim as one over 22, and a
  //     surface that hides its own denominator invites a teacher to act on noise.
  //   - With no evidence at all it says so and recommends nothing. A default
  //     recommendation dressed as a data-driven one is worse than a blank.
  // Aggregate-only and ungated for the same reason as small-group-summary above:
  // the source rows carry no names and nothing per-student is echoed back.
  if (seg === "next-move" && method === "GET") {
    const section = clamp(url.searchParams.get("section") || "", 40);
    if (!section) return json({ ok: false, error: "section-required" }, 400);
    if (!env.DB) return json({ ok: true, evidence: false, reason: "backend-not-configured" });
    try {
      await ensureTelemetrySchema(env.DB);
      const days = Math.min(30, Math.max(1, Number(url.searchParams.get("days")) || 10));
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const rows = await env.DB.prepare(
        `SELECT lesson_slug, payload_json, created_at
           FROM lesson_telemetry
          WHERE event_type = 'small_group_evidence'
            AND section = ?
            AND created_at >= ?
          ORDER BY id DESC LIMIT 400`,
      )
        .bind(section, since)
        .all();

      const events = (rows.results || []).map((row) => ({
        slug: String(row.lesson_slug || ""),
        at: row.created_at,
        payload: parseJsonOr(row.payload_json, {}),
      }));
      if (!events.length) {
        return json({
          ok: true,
          evidence: false,
          section,
          devicesReporting: 0,
          reason: "no-evidence-in-window",
          note: `No small-group evidence from ${section} in the last ${days} days. Nothing here is a recommendation.`,
        });
      }

      // Coverage denominator. Each completion event declares reported:1.
      const devicesReporting = events.reduce(
        (sum, event) => sum + (Number(event.payload.reported) || 0),
        0,
      );

      // The most recent base lesson with evidence anchors "what is next".
      const latest = events[0];
      const base = latest.slug.replace(/-(?:group[12]|catchup)$/, "");

      // Band mix decides the lane. Independent evidence (checkBand, scored on
      // first attempt across the exit ticket and its transfer item) outranks the
      // session band, which is inflated by hints and retries.
      const bands = { approaching: 0, meeting: 0, exceeding: 0 };
      let scored = 0;
      for (const event of events) {
        if (event.slug.replace(/-(?:group[12]|catchup)$/, "") !== base) continue;
        const band = event.payload.checkBand || event.payload.band;
        if (band && bands[band] !== undefined) {
          bands[band] += 1;
          scored += 1;
        }
      }
      const share = (key) => (scored ? bands[key] / scored : 0);
      const lane = !scored
        ? null
        : share("approaching") >= 0.5
          ? "group1"
          : share("exceeding") >= 0.5
            ? "group2"
            : "group1";

      // Named misconceptions, summed across the window. This is the only part of
      // the recommendation a teacher can act on in the moment.
      const counts = {};
      for (const event of events) {
        const bag = event.payload.misconceptions;
        if (!bag || typeof bag !== "object") continue;
        for (const [id, count] of Object.entries(bag)) {
          const n = Number(count);
          if (Number.isFinite(n) && n > 0) counts[id] = (counts[id] || 0) + n;
        }
      }
      const watchFor = Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 2)
        .map(([id, count]) => ({ id, count }));

      // Reach: which tabs students actually arrived at. A lesson nobody reaches
      // the check on is a pacing problem, not a comprehension one.
      const reachEvents = events.filter((event) => Array.isArray(event.payload.reachedTabs));
      const reachedCheck = reachEvents.filter((event) =>
        event.payload.reachedTabs.some((tab) => String(tab).includes("practice")),
      ).length;

      // Confidence is about the denominator, not the effect size.
      const confidence =
        devicesReporting >= 8 ? "good" : devicesReporting >= 3 ? "thin" : "very-thin";

      return json({
        ok: true,
        evidence: true,
        section,
        windowDays: days,
        devicesReporting,
        confidence,
        lastLesson: base,
        recommendedLane: lane,
        laneBasis: scored ? bands : null,
        watchFor,
        pacing:
          reachEvents.length && reachedCheck / reachEvents.length < 0.6
            ? "Fewer than 60% of reporting devices reached the practice check — cut a section before adding one."
            : null,
        note:
          confidence === "very-thin"
            ? "One or two devices reported. Treat this as an anecdote, not a pattern."
            : null,
      });
    } catch (_err) {
      // A recommendation that fails should vanish, not guess.
      return json({ ok: true, evidence: false, reason: "unavailable" });
    }
  }

  // --- Public exemplar gallery ----------------------------------------------
  // Approved-only, heavily redacted student work for the "From students like
  // you" cards on project pages. Rows appear here ONLY after a teacher flips
  // exemplar_approved via the gated roster POST below. Anti-abuse: reuses the
  // /load per-IP throttle table (prefixed key, own generous cap) so a scraper
  // enumerating activity ids gets 429'd while a class loading one page never is.
  if (seg === "exemplars") {
    if (method !== "GET") return json({ ok: false, error: "not-found", route: seg }, 404);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);
    const activity = clamp(url.searchParams.get("activity") || "", 200);
    if (!activity) return json({ ok: false, error: "bad-activity" }, 400);
    try {
      const ip = "ex:" + clientIp(request);
      const bucket = loadBucket();
      await ensureLoadGuardSchema(env.DB);
      if ((await loadMissCount(env.DB, ip, bucket)) > EXEMPLAR_MAX_HITS) {
        return json({ ok: false, error: "rate-limited" }, 429, {
          "Retry-After": String(LOAD_WINDOW_SEC),
        });
      }
      await noteLoadMiss(env.DB, ip, bucket);
      await ensureSchema(env.DB);
      await ensureAdminColumns(env.DB);
      // Same shape whether the activity exists or has no approvals: an empty
      // list. Never confirms/denies activity ids (anti-enumeration).
      const rows = await env.DB.prepare(
        `SELECT student_name, section, state_json, exemplar_note, updated_at
           FROM student_progress
          WHERE activity_id = ? AND exemplar_approved = 1
          ORDER BY updated_at DESC LIMIT 12`,
      )
        .bind(activity)
        .all();
      const exemplars = (rows.results || []).map((r) => {
        let state = {};
        try {
          state = JSON.parse(r.state_json || "{}");
        } catch (_e) {
          state = {};
        }
        return {
          firstNameInitial: firstNameInitial(r.student_name),
          section: r.section || "",
          excerpts: exemplarExcerpts(state),
          note: r.exemplar_note || "",
          updatedAt: r.updated_at || "",
        };
      });
      return json({ ok: true, activity, count: exemplars.length, exemplars });
    } catch (err) {
      return json({ ok: false, error: "server-error", message: String(err) }, 500);
    }
  }

  // --- Insight Signal (second-brain substrate) -----------------------------
  // Teacher-gated read/write of Insight Brief's per-student diagnosis, captured
  // as timestamped snapshots so the signal becomes longitudinal + joinable
  // (student -> standard/misconception -> over time) instead of ephemeral.
  //   POST { section, generatedAt, students:[{ name, section, tier, risk,
  //          activities, struggles, misconceptions, avg, weakStandards, mastery }] }
  //        -> saves one snapshot row per student
  //   GET  ?section=&student=&since=ISO&limit=N  -> snapshot history
  if (seg === "insight") {
    const auth = teacherAuthorized(env, request, url);
    if (auth === "not-configured")
      return json(
        {
          ok: false,
          error: "not-configured",
          message: "Set the TEACHER_KEY env var to enable Insight Signal persistence.",
        },
        503,
      );
    if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

    try {
      await ensureInsightSchema(env.DB);

      if (method === "POST") {
        const body = await request.json().catch(() => null);
        const students = (body && Array.isArray(body.students) && body.students) || [];
        if (!students.length) return json({ ok: false, error: "no-students" }, 400);
        const capturedAt =
          (body && typeof body.generatedAt === "string" && body.generatedAt.slice(0, 30)) ||
          new Date().toISOString();
        const stmt = env.DB.prepare(
          `INSERT INTO insight_signal
             (captured_at, section, student_name, tier, risk, activities,
              struggles, misconceptions, avg_score, weak_standards_json,
              mastery_standards_json, source)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        );
        const rows = students.slice(0, 300).map((s) => {
          const avg = s && Number.isFinite(s.avg) ? Math.round(s.avg) : null;
          return stmt.bind(
            capturedAt,
            clamp((s && (s.section || body.section)) || "", 60),
            clamp((s && s.name) || "", 120),
            clamp((s && s.tier) || "", 20),
            Math.max(0, Math.round((s && s.risk) || 0)),
            Math.max(0, Math.round((s && s.activities) || 0)),
            Math.max(0, Math.round((s && s.struggles) || 0)),
            Math.max(0, Math.round((s && s.misconceptions) || 0)),
            avg,
            JSON.stringify((s && s.weakStandards) || {}),
            JSON.stringify((s && s.mastery) || []),
            "insight-brief",
          );
        });
        // Dedupe: one snapshot per section per calendar day (latest open wins),
        // so the trend log is a daily pulse — not one row per tab-open.
        const day = capturedAt.slice(0, 10);
        const sectionSet = {};
        students.forEach((s) => {
          sectionSet[clamp((s && (s.section || body.section)) || "", 60)] = true;
        });
        const del = env.DB.prepare(
          `DELETE FROM insight_signal
             WHERE substr(captured_at, 1, 10) = ? AND section = ? AND source = 'insight-brief'`,
        );
        const dels = Object.keys(sectionSet).map((sec) => del.bind(day, sec));
        await env.DB.batch(dels.concat(rows));
        return json({ ok: true, saved: rows.length, capturedAt });
      }

      if (method === "GET") {
        const section = clamp(url.searchParams.get("section") || "", 60);
        const student = clamp(url.searchParams.get("student") || "", 120);
        const since = clamp(url.searchParams.get("since") || "", 30);
        const limit = Math.min(Number(url.searchParams.get("limit")) || 1000, 5000);
        const where = [];
        const binds = [];
        if (section) {
          where.push("section = ?");
          binds.push(section);
        }
        if (student) {
          where.push("student_name = ?");
          binds.push(student);
        }
        if (since) {
          where.push("captured_at >= ?");
          binds.push(since);
        }
        const sql =
          `SELECT captured_at, section, student_name, tier, risk, activities,
                  struggles, misconceptions, avg_score, weak_standards_json,
                  mastery_standards_json
             FROM insight_signal` +
          (where.length ? " WHERE " + where.join(" AND ") : "") +
          " ORDER BY captured_at DESC, id DESC LIMIT ?";
        binds.push(limit);
        const res = await env.DB.prepare(sql)
          .bind(...binds)
          .all();
        const snapshots = (res.results || []).map((r) => ({
          capturedAt: r.captured_at,
          section: r.section || "",
          student: r.student_name || "",
          tier: r.tier || "",
          risk: r.risk || 0,
          activities: r.activities || 0,
          struggles: r.struggles || 0,
          misconceptions: r.misconceptions || 0,
          avg: r.avg_score,
          weakStandards: parseJsonOr(r.weak_standards_json, {}),
          mastery: parseJsonOr(r.mastery_standards_json, []),
        }));
        return json({ ok: true, count: snapshots.length, snapshots });
      }

      return json({ ok: false, error: "method-not-allowed" }, 405);
    } catch (err) {
      return json({ ok: false, error: "server-error", message: String(err) }, 500);
    }
  }

  // --- Teacher admin routes (roster + grades export/import) ----------------
  // Gated by TEACHER_KEY. Closed by default so student data is never exposed.
  if (seg === "roster" || seg === "grades") {
    const auth = teacherAuthorized(env, request, url);
    if (auth === "not-configured")
      return json(
        {
          ok: false,
          error: "not-configured",
          message: "Set the TEACHER_KEY env var on the Pages project to enable the gradebook.",
        },
        503,
      );
    if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

    try {
      await ensureSchema(env.DB);
      await ensureAdminColumns(env.DB);

      // Bulk roster sync: assign names/classes/grades/notes to save codes.
      // Body: { rows: [{ saveCode, studentName?, section?, grade?, note? }] }
      //   - Real student save codes are updated in place.
      //   - Codes that do not exist yet (e.g. manually-added students with a
      //     synthetic "MAN-XXXX" code, or names imported ahead of a student's
      //     first save) are inserted as a placeholder roster row. When the real
      //     student later hits /create|/save, their state fills in but the
      //     teacher-entered name/class is preserved (that route only touches
      //     state/progress on conflict).
      // Body alt: { delete: [saveCode, ...] } removes manual-only rows. Never
      //     touches a row with real activity progress — only activity_id='manual'.
      if (seg === "roster" && method === "POST") {
        const body = await request.json().catch(() => null);

        // --- Delete (manual rows only) -------------------------------------
        const del = (body && Array.isArray(body.delete) && body.delete) || [];
        if (del.length) {
          let removed = 0;
          const dstmt = env.DB.prepare(
            "DELETE FROM student_progress WHERE save_code = ? AND activity_id = 'manual'",
          );
          const dbatch = [];
          for (const c of del.slice(0, 2000)) {
            const code = String(c || "").toUpperCase();
            if (!validCode(code)) continue;
            dbatch.push(dstmt.bind(code));
            removed++;
          }
          if (dbatch.length) await env.DB.batch(dbatch);
          return json({ ok: true, removed });
        }

        // --- Upsert names/classes/grades/notes -----------------------------
        const rows = (body && Array.isArray(body.rows) && body.rows) || [];
        let updated = 0;
        const nowIso = new Date().toISOString();
        const stmt = env.DB.prepare(
          `INSERT INTO student_progress
             (save_code, activity_id, activity_title, student_name, section,
              state_json, progress_percent, manual_grade, teacher_note,
              exemplar_approved, exemplar_note,
              created_at, updated_at)
           VALUES (?, 'manual', 'Manual entry', NULLIF(?, ' '), NULLIF(?, ' '),
                   '{}', 0, NULLIF(?, ' '), NULLIF(?, ' '), ?, NULLIF(?, ' '), ?, ?)
           ON CONFLICT(save_code) DO UPDATE SET
             student_name = COALESCE(excluded.student_name, student_name),
             section      = COALESCE(excluded.section, section),
             manual_grade = COALESCE(excluded.manual_grade, manual_grade),
             teacher_note = COALESCE(excluded.teacher_note, teacher_note),
             exemplar_approved = COALESCE(excluded.exemplar_approved, exemplar_approved),
             exemplar_note     = COALESCE(excluded.exemplar_note, exemplar_note)`,
        );
        const batch = [];
        for (const r of rows.slice(0, 2000)) {
          const code = (r && r.saveCode ? String(r.saveCode) : "").toUpperCase();
          if (!validCode(code)) continue;
          // " " sentinel = field omitted → keep existing value. An explicit
          // empty string overwrites (clears) the field. NULLIF maps the
          // sentinel to NULL so COALESCE on conflict keeps the old value.
          const f = (v) => (v === undefined ? " " : clamp(v, 300));
          // exemplar_approved is an INTEGER: omitted → NULL (COALESCE keeps the
          // old value on conflict); provided → strict 0/1.
          const approved =
            r.exemplarApproved === undefined ? null : Number(r.exemplarApproved) ? 1 : 0;
          batch.push(
            stmt.bind(
              code,
              f(r.studentName),
              f(r.section),
              f(r.grade),
              f(r.note),
              approved,
              f(r.exemplarNote),
              nowIso,
              nowIso,
            ),
          );
          updated++;
        }
        if (batch.length) await env.DB.batch(batch);
        return json({ ok: true, updated });
      }

      // GET roster (all save codes) or grades (pivot). format=csv|xls|json.
      const all = await env.DB.prepare(
        `SELECT * FROM student_progress ORDER BY section, student_name, save_code`,
      ).all();
      const records = (all.results || []).map(rosterRowValues);
      const format = (url.searchParams.get("format") || "json").toLowerCase();

      const rosterMatrix = (recs) =>
        recs.map((r) => [
          r.code,
          r.name,
          r.section,
          r.activity,
          r.progress,
          r.score == null ? "" : r.score,
          r.grade,
          r.note,
          r.updatedAt,
        ]);

      if (seg === "roster") {
        const rows = rosterMatrix(records);
        if (format === "csv")
          return new Response(rowsToCsv(ROSTER_HEADERS, rows), {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": 'attachment; filename="neft-save-codes.csv"',
              "Access-Control-Allow-Origin": "*",
            },
          });
        if (format === "xls")
          return new Response(
            workbookXls([{ name: "Save Codes", headers: ROSTER_HEADERS, rows }]),
            {
              headers: {
                "Content-Type": "application/vnd.ms-excel; charset=utf-8",
                "Content-Disposition": 'attachment; filename="neft-save-codes.xls"',
                "Access-Control-Allow-Origin": "*",
              },
            },
          );
        return json({ ok: true, count: records.length, records });
      }

      // seg === "grades": pivot students (rows) × activities (columns).
      // Manually-added students (MAN- codes) are placeholders with no real
      // activity: they keep their row (so the class roster is complete) but
      // their "Manual entry" never becomes a graded column.
      const isManual = (r) => typeof r.code === "string" && r.code.indexOf("MAN-") === 0;
      const activities = [];
      const seenAct = new Set();
      for (const r of records) {
        if (r.activity && !isManual(r) && !seenAct.has(r.activity)) {
          seenAct.add(r.activity);
          activities.push(r.activity);
        }
      }
      const byStudent = new Map();
      for (const r of records) {
        const sid = (r.section || "—") + "" + (r.name || r.code);
        if (!byStudent.has(sid))
          byStudent.set(sid, {
            name: r.name || "(unnamed)",
            section: r.section || "",
            cells: {},
          });
        if (isManual(r) || !r.activity) continue;
        // cell = manual grade ?? extracted score ?? progress percent
        const cellVal =
          r.grade !== "" && r.grade != null ? r.grade : r.score != null ? r.score : r.progress;
        byStudent.get(sid).cells[r.activity] = cellVal;
      }
      const gradeHeaders = ["Student Name", "Class", ...activities, "Average"];
      const gradeRows = [];
      for (const s of byStudent.values()) {
        const cells = activities.map((a) => (s.cells[a] == null ? "" : s.cells[a]));
        // Average numeric cells only; blanks and letter grades are skipped
        // (Number("") === 0 would otherwise drag the average down).
        const nums = cells
          .filter((c) => c !== "" && c != null)
          .map(Number)
          .filter((n) => Number.isFinite(n));
        const avg = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : "";
        gradeRows.push([s.name, s.section, ...cells, avg]);
      }
      if (format === "csv")
        return new Response(rowsToCsv(gradeHeaders, gradeRows), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="neft-grades.csv"',
            "Access-Control-Allow-Origin": "*",
          },
        });
      if (format === "xls")
        return new Response(
          workbookXls([
            { name: "Grades", headers: gradeHeaders, rows: gradeRows },
            {
              name: "Save Codes",
              headers: ROSTER_HEADERS,
              rows: rosterMatrix(records),
            },
          ]),
          {
            headers: {
              "Content-Type": "application/vnd.ms-excel; charset=utf-8",
              "Content-Disposition": 'attachment; filename="neft-gradebook.xls"',
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      return json({
        ok: true,
        activities,
        headers: gradeHeaders,
        rows: gradeRows,
      });
    } catch (err) {
      return json({ ok: false, error: "server-error", message: String(err) }, 500);
    }
  }

  // --- Teacher analytics (digest / mastery-rollup / struggles) --------------
  // Read-only rollups powering the weekly family digest, the class standards
  // heatmap, and the intervention radar. Same TEACHER_KEY gate as roster:
  // no key configured → 503, wrong key → 401, no DB → 503. game_scores is
  // owned by functions/api/scores and created lazily there, so its queries are
  // individually guarded — if the table does not exist yet, the rollups simply
  // carry no game data instead of erroring.
  if (
    seg === "digest" ||
    seg === "mastery-rollup" ||
    seg === "standards-matrix" ||
    seg === "struggles"
  ) {
    const auth = teacherAuthorized(env, request, url);
    if (auth === "not-configured")
      return json(
        {
          ok: false,
          error: "not-configured",
          message: "Set the TEACHER_KEY env var on the Pages project to enable teacher analytics.",
        },
        503,
      );
    if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);
    if (method !== "GET") return json({ ok: false, error: "not-found", route: seg }, 404);

    try {
      await ensureSchema(env.DB);
      await ensureAdminColumns(env.DB);
      await ensureTelemetrySchema(env.DB);
      const section = clamp(url.searchParams.get("section") || "", 40);

      // Shared: pull a misconception tag out of a telemetry payload blob.
      const payloadTag = (payloadJson) => {
        try {
          const p = JSON.parse(payloadJson || "{}");
          return clamp(p.tag || p.misconceptionTag || "", 60);
        } catch (_e) {
          return "";
        }
      };
      const isMastery = (t) => t === "mastery_reached" || t === "mastery-reached";
      const rate2 = (correct, attempts) =>
        attempts > 0 ? Math.round((correct / attempts) * 100) / 100 : null;

      // GET digest?since=ISO&section= — per-student "what happened" rollup.
      if (seg === "digest") {
        const sinceMs = Date.parse(url.searchParams.get("since") || "");
        const since = Number.isFinite(sinceMs)
          ? new Date(sinceMs).toISOString()
          : new Date(Date.now() - 7 * 86400000).toISOString(); // default: last 7 days
        const prog = await (
          section
            ? env.DB.prepare(
                `SELECT * FROM student_progress WHERE updated_at >= ? AND section = ?
                ORDER BY section, student_name`,
              ).bind(since, section)
            : env.DB.prepare(
                `SELECT * FROM student_progress WHERE updated_at >= ?
                ORDER BY section, student_name`,
              ).bind(since)
        ).all();
        const tel = await (
          section
            ? env.DB.prepare(
                `SELECT standard, student_name, section, event_type FROM lesson_telemetry
                WHERE created_at >= ? AND section = ? ORDER BY id DESC LIMIT 5000`,
              ).bind(since, section)
            : env.DB.prepare(
                `SELECT standard, student_name, section, event_type FROM lesson_telemetry
                WHERE created_at >= ? ORDER BY id DESC LIMIT 5000`,
              ).bind(since)
        ).all();

        const students = new Map();
        const entry = (name, sec) => {
          const k = (sec || "") + "|" + name;
          if (!students.has(k))
            students.set(k, {
              studentName: name,
              section: sec || "",
              activities: [],
              telemetryCounts: {},
              masteryReached: [],
            });
          return students.get(k);
        };
        for (const r of prog.results || []) {
          if (r.activity_id === "manual") continue; // roster placeholders aren't activity
          const s = entry(r.student_name || r.save_code, r.section);
          let state = {};
          try {
            state = JSON.parse(r.state_json || "{}");
          } catch (_e) {
            state = {};
          }
          s.activities.push({
            activityId: r.activity_id,
            activityTitle: r.activity_title || r.activity_id,
            progressPercent: r.progress_percent == null ? null : Number(r.progress_percent),
            scorePct: scoreFromState(state),
          });
        }
        for (const r of tel.results || []) {
          if (!r.student_name) continue; // unattributed events can't join a per-student digest
          const s = entry(r.student_name, r.section);
          const type = r.event_type || "unknown";
          s.telemetryCounts[type] = (s.telemetryCounts[type] || 0) + 1;
          if (isMastery(type) && r.standard && !s.masteryReached.includes(r.standard))
            s.masteryReached.push(r.standard);
        }
        const list = [...students.values()].sort(
          (a, b) =>
            a.section.localeCompare(b.section) || a.studentName.localeCompare(b.studentName),
        );
        return json({ ok: true, since, section, count: list.length, students: list });
      }

      // GET standards-matrix?section=&days=N — (student, standard) mastery grid.
      // The per-STUDENT companion to mastery-rollup: one row per student, one
      // cell per standard, from the same lesson_telemetry + game_scores signal.
      // Counts and rates only — raw student work never leaves the server.
      if (seg === "standards-matrix") {
        const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 180);
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const students = new Map();
        const cellOf = (name, sec, std) => {
          const sk = (sec || "") + "|" + name;
          if (!students.has(sk))
            students.set(sk, {
              studentName: name,
              section: sec || "",
              cells: new Map(),
            });
          const stu = students.get(sk);
          if (!stu.cells.has(std))
            stu.cells.set(std, {
              standard: std,
              attempts: 0,
              correct: 0,
              masteryCount: 0,
              struggleCount: 0,
              misconceptionCount: 0,
            });
          return stu.cells.get(std);
        };

        const tel = await (
          section
            ? env.DB.prepare(
                `SELECT standard, student_name, event_type, payload_json, section
                 FROM lesson_telemetry
                 WHERE created_at >= ? AND section = ? ORDER BY id DESC LIMIT 10000`,
              ).bind(since, section)
            : env.DB.prepare(
                `SELECT standard, student_name, event_type, payload_json, section
                 FROM lesson_telemetry
                 WHERE created_at >= ? ORDER BY id DESC LIMIT 10000`,
              ).bind(since)
        ).all();
        for (const r of tel.results || []) {
          if (!r.student_name || !r.standard) continue;
          const cell = cellOf(r.student_name, r.section, r.standard);
          const type = r.event_type || "";
          if (type === "item_attempt" || type === "item-attempt") {
            let props = {};
            try {
              props = JSON.parse(r.payload_json || "{}");
            } catch (_e) {
              props = {};
            }
            const result = props.result || props.props?.result;
            const correct =
              result === "correct" || props.correct === true || props.props?.correct === true;
            const incorrect =
              result === "incorrect" || props.correct === false || props.props?.correct === false;
            if (correct || incorrect) {
              cell.attempts += 1;
              if (correct) cell.correct += 1;
            }
          } else if (isMastery(type)) cell.masteryCount += 1;
          else if (type === "struggle" || type === "hint-exhausted") cell.struggleCount += 1;
          else if (type === "misconception") cell.misconceptionCount += 1;
        }

        try {
          const scores = await (
            section
              ? env.DB.prepare(
                  `SELECT gs.standard AS standard, gs.correct AS correct,
                          sp.student_name AS student_name, sp.section AS section
                     FROM game_scores gs
                     JOIN student_progress sp ON sp.save_code = gs.save_code
                    WHERE gs.created_at >= ? AND sp.section = ?
                    ORDER BY gs.id DESC LIMIT 10000`,
                ).bind(since, section)
              : env.DB.prepare(
                  `SELECT gs.standard AS standard, gs.correct AS correct,
                          sp.student_name AS student_name, sp.section AS section
                     FROM game_scores gs
                     JOIN student_progress sp ON sp.save_code = gs.save_code
                    WHERE gs.created_at >= ?
                    ORDER BY gs.id DESC LIMIT 10000`,
                ).bind(since)
          ).all();
          for (const r of scores.results || []) {
            if (!r.student_name || !r.standard) continue;
            const cell = cellOf(r.student_name, r.section, r.standard);
            cell.attempts += 1;
            if (r.correct) cell.correct += 1;
          }
        } catch (_e) {
          /* game_scores not created yet — matrix carries telemetry only */
        }

        const list = [...students.values()]
          .map((stu) => ({
            studentName: stu.studentName,
            section: stu.section,
            standards: [...stu.cells.values()]
              .map((c) => ({
                standard: c.standard,
                attempts: c.attempts,
                correctRate: rate2(c.correct, c.attempts),
                masteryCount: c.masteryCount,
                struggleCount: c.struggleCount,
                misconceptionCount: c.misconceptionCount,
              }))
              .sort((a, b) => a.standard.localeCompare(b.standard)),
          }))
          .sort(
            (a, b) =>
              a.section.localeCompare(b.section) || a.studentName.localeCompare(b.studentName),
          );
        return json({ ok: true, section, days, count: list.length, students: list });
      }

      // GET mastery-rollup?section= — (section, standard) grid for the heatmap.
      if (seg === "mastery-rollup") {
        const groups = new Map();
        const agg = (sec, std) => {
          const k = (sec || "") + "|" + std;
          if (!groups.has(k))
            groups.set(k, {
              section: sec || "",
              standard: std,
              attempts: 0,
              correct: 0,
              masteryCount: 0,
              struggleCount: 0,
              misconceptionCount: 0,
              tags: {},
            });
          return groups.get(k);
        };
        const tel = await (
          section
            ? env.DB.prepare(
                `SELECT standard, section, event_type, payload_json FROM lesson_telemetry
                WHERE section = ? ORDER BY id DESC LIMIT 10000`,
              ).bind(section)
            : env.DB.prepare(
                `SELECT standard, section, event_type, payload_json FROM lesson_telemetry
                ORDER BY id DESC LIMIT 10000`,
              )
        ).all();
        for (const r of tel.results || []) {
          if (!r.standard) continue;
          const g = agg(r.section, r.standard);
          const type = r.event_type || "";
          if (isMastery(type)) g.masteryCount += 1;
          else if (type === "struggle" || type === "hint-exhausted") g.struggleCount += 1;
          else if (type === "misconception") {
            g.misconceptionCount += 1;
            const tag = payloadTag(r.payload_json);
            if (tag) g.tags[tag] = (g.tags[tag] || 0) + 1;
          }
        }
        try {
          const scores = await (
            section
              ? env.DB.prepare(
                  `SELECT gs.standard AS standard, gs.correct AS correct,
                        gs.misconception_tag AS tag, sp.section AS section
                   FROM game_scores gs
                   LEFT JOIN student_progress sp ON sp.save_code = gs.save_code
                  WHERE sp.section = ? ORDER BY gs.id DESC LIMIT 10000`,
                ).bind(section)
              : env.DB.prepare(
                  `SELECT gs.standard AS standard, gs.correct AS correct,
                        gs.misconception_tag AS tag, sp.section AS section
                   FROM game_scores gs
                   LEFT JOIN student_progress sp ON sp.save_code = gs.save_code
                  ORDER BY gs.id DESC LIMIT 10000`,
                )
          ).all();
          for (const r of scores.results || []) {
            if (!r.standard) continue;
            const g = agg(r.section, r.standard);
            g.attempts += 1;
            if (r.correct) g.correct += 1;
            if (r.tag) g.tags[r.tag] = (g.tags[r.tag] || 0) + 1;
          }
        } catch (_e) {
          /* game_scores not created yet — rollup carries telemetry only */
        }
        const bySection = new Map();
        for (const g of groups.values()) {
          if (!bySection.has(g.section)) bySection.set(g.section, []);
          bySection.get(g.section).push({
            standard: g.standard,
            attempts: g.attempts,
            correctRate: rate2(g.correct, g.attempts),
            masteryCount: g.masteryCount,
            struggleCount: g.struggleCount,
            misconceptionCount: g.misconceptionCount,
            topMisconceptions: Object.entries(g.tags)
              .map(([tag, count]) => ({ tag, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5),
          });
        }
        const sections = [...bySection.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([sec, standards]) => ({
            section: sec,
            standards: standards.sort((a, b) => a.standard.localeCompare(b.standard)),
          }));
        return json({ ok: true, section, sections });
      }

      // GET struggles?minutes=N&section= — newest-first risk rows for the radar.
      const minutes = Math.min(Math.max(Number(url.searchParams.get("minutes")) || 30, 5), 1440);
      const since = new Date(Date.now() - minutes * 60000).toISOString();
      const rows = [];
      const tel = await (
        section
          ? env.DB.prepare(
              `SELECT lesson_slug, lesson_title, standard, student_name, section,
                    event_type, payload_json, created_at
               FROM lesson_telemetry
              WHERE created_at >= ? AND section = ?
                AND event_type IN ('struggle', 'misconception', 'hint-exhausted')
              ORDER BY id DESC LIMIT 200`,
            ).bind(since, section)
          : env.DB.prepare(
              `SELECT lesson_slug, lesson_title, standard, student_name, section,
                    event_type, payload_json, created_at
               FROM lesson_telemetry
              WHERE created_at >= ?
                AND event_type IN ('struggle', 'misconception', 'hint-exhausted')
              ORDER BY id DESC LIMIT 200`,
            ).bind(since)
      ).all();
      for (const r of tel.results || []) {
        rows.push({
          at: r.created_at,
          signal: r.event_type,
          studentName: r.student_name || "",
          section: r.section || "",
          lessonSlug: r.lesson_slug || "",
          lessonTitle: r.lesson_title || "",
          standard: r.standard || "",
          tag: payloadTag(r.payload_json),
          source: "lesson",
        });
      }
      try {
        // Recent low performance: per (game, save code, standard) within the
        // window, ≥2 attempts with under 60% correct. Named via the roster join.
        const low = await (
          section
            ? env.DB.prepare(
                `SELECT gs.game_id AS game_id, gs.standard AS standard,
                      gs.save_code AS save_code,
                      COUNT(*) AS attempts, SUM(gs.correct) AS correct_sum,
                      MAX(gs.created_at) AS last_at, MAX(gs.misconception_tag) AS tag,
                      MAX(sp.student_name) AS student_name, MAX(sp.section) AS section
                 FROM game_scores gs
                 LEFT JOIN student_progress sp ON sp.save_code = gs.save_code
                WHERE gs.created_at >= ? AND sp.section = ?
                GROUP BY gs.game_id, gs.save_code, gs.standard
               HAVING COUNT(*) >= 2 AND (SUM(gs.correct) * 1.0) / COUNT(*) < 0.6
                ORDER BY last_at DESC LIMIT 100`,
              ).bind(since, section)
            : env.DB.prepare(
                `SELECT gs.game_id AS game_id, gs.standard AS standard,
                      gs.save_code AS save_code,
                      COUNT(*) AS attempts, SUM(gs.correct) AS correct_sum,
                      MAX(gs.created_at) AS last_at, MAX(gs.misconception_tag) AS tag,
                      MAX(sp.student_name) AS student_name, MAX(sp.section) AS section
                 FROM game_scores gs
                 LEFT JOIN student_progress sp ON sp.save_code = gs.save_code
                WHERE gs.created_at >= ?
                GROUP BY gs.game_id, gs.save_code, gs.standard
               HAVING COUNT(*) >= 2 AND (SUM(gs.correct) * 1.0) / COUNT(*) < 0.6
                ORDER BY last_at DESC LIMIT 100`,
              ).bind(since)
        ).all();
        for (const r of low.results || []) {
          rows.push({
            at: r.last_at,
            signal: "low-score",
            studentName: r.student_name || "",
            section: r.section || "",
            gameId: r.game_id || "",
            standard: r.standard || "",
            tag: r.tag || "",
            saveCode: r.save_code || "",
            attempts: Number(r.attempts) || 0,
            correctRate: rate2(Number(r.correct_sum) || 0, Number(r.attempts) || 0),
            source: "game",
          });
        }
      } catch (_e) {
        /* game_scores not created yet — radar shows lesson signals only */
      }
      rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
      const trimmed = rows.slice(0, 200);
      return json({ ok: true, minutes, section, count: trimmed.length, rows: trimmed });
    } catch (err) {
      return json({ ok: false, error: "server-error", message: String(err) }, 500);
    }
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
      const code = (new URL(request.url).searchParams.get("code") || "").toUpperCase();
      if (!validCode(code)) return json({ ok: false, error: "bad-code" }, 400);

      // Anti-enumeration guard. /load is a bearer lookup — anyone holding a save
      // code can resume that work, which is the whole point of Save/Resume. The
      // real risk is a brute-force harvester guessing codes to scrape student
      // names + work. We throttle by counting only *misses* (404s) per client IP
      // per window, and block that IP once it exceeds the cap — capping any
      // single IP to LOAD_MAX_MISSES guesses per window. Legitimate resumes
      // return a real record and never count as a miss, so a normal class (even
      // a whole school behind one NAT) never fills its bucket and is never
      // throttled. The only collateral is a client sharing an IP with an active
      // guess-flood, which clears when the window rolls.
      const ip = clientIp(request);
      const bucket = loadBucket();
      await ensureLoadGuardSchema(env.DB);
      if ((await loadMissCount(env.DB, ip, bucket)) > LOAD_MAX_MISSES) {
        return json({ ok: false, error: "rate-limited" }, 429, {
          "Retry-After": String(LOAD_WINDOW_SEC),
        });
      }
      const row = await env.DB.prepare("SELECT * FROM student_progress WHERE save_code = ?")
        .bind(code)
        .first();
      if (!row) {
        await noteLoadMiss(env.DB, ip, bucket);
        return json({ ok: false, error: "not-found" }, 404);
      }
      return json({ ok: true, record: recordFromRow(row) });
    }

    /* GET /api/progress/mine?code=CLASSCODE&student=ID
       -> { ok, resume, recent:[...], done:[activityId] }

       Everything this student has going, newest first. This is the query that
       makes the /today screen possible: `resume` is the single most recently
       touched unfinished piece of work (the big "Continue" button), `recent`
       is the rest of the unfinished work, and `done` is a bare list of
       activity ids so the lesson picker can show checkmarks without shipping
       the state blobs for finished work.

       Auth posture matches /load: a class code plus a roster student id is a
       bearer credential, so it gets the SAME per-IP miss throttle. It is a
       weaker secret than a random save code (a classmate knows both), so the
       response deliberately carries no state_json — only titles, percentages
       and the save codes needed to resume. Reading a classmate's row tells you
       what lesson they're on, which is what the classroom wall already shows.
    */
    if (seg === "mine" && method === "GET") {
      const params2 = new URL(request.url).searchParams;
      const classCode = (params2.get("code") || "").toUpperCase().trim();
      const studentId = (params2.get("student") || "").trim();
      if (!/^[A-Z0-9]{4,12}$/.test(classCode) || !studentId || studentId.length > 64) {
        return json({ ok: false, error: "bad-request" }, 400);
      }

      const ip = clientIp(request);
      const bucket = loadBucket();
      await ensureLoadGuardSchema(env.DB);
      if ((await loadMissCount(env.DB, ip, bucket)) > LOAD_MAX_MISSES) {
        return json({ ok: false, error: "rate-limited" }, 429, {
          "Retry-After": String(LOAD_WINDOW_SEC),
        });
      }

      await ensureStudentLinkColumns(env.DB);
      const res = await env.DB.prepare(
        `SELECT save_code, activity_id, activity_title, activity_url,
                progress_percent, updated_at
           FROM student_progress
          WHERE class_code = ? AND student_id = ?
          ORDER BY updated_at DESC
          LIMIT 60`,
      )
        .bind(classCode, studentId)
        .all();
      const rows = res.results || [];
      // An unknown pair is indistinguishable from a student who has simply not
      // started anything, so it counts as a miss for throttling purposes but
      // still returns 200 — a brand-new student must not see an error screen.
      if (!rows.length) await noteLoadMiss(env.DB, ip, bucket);

      const open = [];
      const done = [];
      for (const r of rows) {
        const percent = Number(r.progress_percent) || 0;
        if (percent >= DONE_PERCENT) {
          done.push(r.activity_id);
          continue;
        }
        open.push({
          saveCode: r.save_code,
          activityId: r.activity_id,
          activityTitle: r.activity_title || r.activity_id,
          url: r.activity_url || "",
          percent,
          updatedAt: r.updated_at,
        });
      }
      return json({ ok: true, resume: open[0] || null, recent: open.slice(1), done });
    }

    if ((seg === "create" || seg === "save") && method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !validCode(body.saveCode)) return json({ ok: false, error: "bad-payload" }, 400);
      const updatedAt = await upsert(env.DB, body, seg === "create");
      return json({ ok: true, saveCode: body.saveCode, updatedAt });
    }

    return json({ ok: false, error: "not-found", route: seg }, 404);
  } catch (err) {
    return json({ ok: false, error: "server-error", message: String(err) }, 500);
  }
}
