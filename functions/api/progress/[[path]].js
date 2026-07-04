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
  return typeof code === "string" && /^[A-Z0-9]{1,12}-[A-Z0-9]{3,8}$/.test(code);
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
  ]) {
    try {
      await db.prepare(ddl).run();
    } catch (e) {
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
  } catch (e) {
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
    updatedAt: r.updated_at || "",
  };
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
      .bind(stateJson, progress, nowIso, clamp(body.studentName, 60), clamp(body.section, 40), code)
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
          } catch (e) {
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
    } catch (e) {
      // Swallow — telemetry must never fail loudly.
    }
    return new Response(null, { status: 204, headers: JSON_HEADERS });
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
              created_at, updated_at)
           VALUES (?, 'manual', 'Manual entry', NULLIF(?, ' '), NULLIF(?, ' '),
                   '{}', 0, NULLIF(?, ' '), NULLIF(?, ' '), ?, ?)
           ON CONFLICT(save_code) DO UPDATE SET
             student_name = COALESCE(excluded.student_name, student_name),
             section      = COALESCE(excluded.section, section),
             manual_grade = COALESCE(excluded.manual_grade, manual_grade),
             teacher_note = COALESCE(excluded.teacher_note, teacher_note)`,
        );
        const batch = [];
        for (const r of rows.slice(0, 2000)) {
          const code = (r && r.saveCode ? String(r.saveCode) : "").toUpperCase();
          if (!validCode(code)) continue;
          // " " sentinel = field omitted → keep existing value. An explicit
          // empty string overwrites (clears) the field. NULLIF maps the
          // sentinel to NULL so COALESCE on conflict keeps the old value.
          const f = (v) => (v === undefined ? " " : clamp(v, 300));
          batch.push(
            stmt.bind(code, f(r.studentName), f(r.section), f(r.grade), f(r.note), nowIso, nowIso),
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
      const row = await env.DB.prepare("SELECT * FROM student_progress WHERE save_code = ?")
        .bind(code)
        .first();
      if (!row) return json({ ok: false, error: "not-found" }, 404);
      return json({ ok: true, record: recordFromRow(row) });
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
