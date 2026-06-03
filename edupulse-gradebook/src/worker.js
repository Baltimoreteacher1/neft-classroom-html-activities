/**
 * edupulse-gradebook API — Cloudflare Worker (ES module).
 *
 * Endpoints:
 *   OPTIONS *            CORS preflight                              -> 204
 *   GET  /api/health     liveness                                   -> { ok, service, time }
 *   POST /api/scores     ingest (x-ingest-key)                      -> { ok, written, skipped }
 *   GET  /api/scores     read rows (x-admin-key)                    -> { ok, rows }
 *   GET  /api/summary    aggregations (x-admin-key)                 -> { ok, ... }
 *   GET  /api/export.csv CSV download (x-admin-key)                 -> text/csv
 *
 * Security model (see README): INGEST_KEY is a write-only key that ships in the
 * game client; it can ONLY append rows, never read/export. ADMIN_KEY is the
 * read/export key and never ships to clients. Both are Wrangler secrets.
 */

const SERVICE = "edupulse-gradebook-api";

/* ------------------------------------------------------------------ *
 * Column model — client sends camelCase, we store snake_case.
 * ------------------------------------------------------------------ */

// DB column -> client field. `received_at` is server-assigned (no client field).
const FIELD_MAP = {
  event_id: "eventId",
  ts: "timestamp",
  device_id: "deviceId",
  student_id: "studentId",
  student_name: "studentName",
  class_period: "classPeriod",
  activity_id: "activityId",
  activity_title: "activityTitle",
  standard: "standard",
  score: "score",
  max_score: "maxScore",
  percent: "percent",
  stars: "stars",
  problems_correct: "problemsCorrect",
  problems_attempted: "problemsAttempted",
  misconceptions: "misconceptions",
  duration_sec: "durationSec",
};

// Ordered column list for INSERT (received_at handled separately).
const INSERT_COLUMNS = [
  "event_id", "ts", "received_at", "device_id", "student_id", "student_name",
  "class_period", "activity_id", "activity_title", "standard", "score",
  "max_score", "percent", "stars", "problems_correct", "problems_attempted",
  "misconceptions", "duration_sec",
];

const INT_COLS = new Set([
  "stars", "problems_correct", "problems_attempted", "duration_sec",
]);
const REAL_COLS = new Set(["score", "max_score", "percent"]);

/* ------------------------------------------------------------------ *
 * CORS
 * ------------------------------------------------------------------ */

function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGINS || "*").trim();
  const origin = request.headers.get("Origin") || "";
  let allowOrigin = "*";
  if (allowed !== "*") {
    const list = allowed.split(",").map((s) => s.trim()).filter(Boolean);
    allowOrigin = list.includes(origin) ? origin : list[0] || "*";
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-ingest-key, x-admin-key",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status, env, request, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env, request),
      ...(extraHeaders || {}),
    },
  });
}

/* ------------------------------------------------------------------ *
 * Coercion / validation
 * ------------------------------------------------------------------ */

// '' -> null; otherwise pass through trimmed string (or original).
function coerceText(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function coerceInt(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
}

function coerceReal(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Build a positional row from a client event. Returns { row, error }.
function buildRow(ev, receivedAt) {
  if (!ev || typeof ev !== "object") return { error: "event is not an object" };

  const eventId = coerceText(ev.eventId);
  if (!eventId) return { error: "missing eventId" };

  const valueFor = (col) => {
    if (col === "received_at") return receivedAt;
    const clientKey = FIELD_MAP[col];
    const raw = ev[clientKey];
    if (INT_COLS.has(col)) return coerceInt(raw);
    if (REAL_COLS.has(col)) return coerceReal(raw);
    return coerceText(raw);
  };

  const row = INSERT_COLUMNS.map(valueFor);
  return { row };
}

/* ------------------------------------------------------------------ *
 * Auth helpers
 * ------------------------------------------------------------------ */

function requireKey(request, headerName, expected) {
  if (!expected) return "server key not configured";
  const got = request.headers.get(headerName);
  if (!got || got !== expected) return "unauthorized";
  return null;
}

/* ------------------------------------------------------------------ *
 * Handlers
 * ------------------------------------------------------------------ */

async function handleIngest(request, env) {
  const authErr = requireKey(request, "x-ingest-key", env.INGEST_KEY);
  if (authErr) return json({ ok: false, error: authErr }, 401, env, request);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid JSON body" }, 400, env, request);
  }

  const events = body && Array.isArray(body.events) ? body.events : null;
  if (!events) {
    return json({ ok: false, error: "body must be { events: [...] }" }, 400, env, request);
  }
  if (events.length === 0) {
    return json({ ok: true, written: 0, skipped: 0 }, 200, env, request);
  }
  if (events.length > 500) {
    return json({ ok: false, error: "batch too large (max 500)" }, 413, env, request);
  }

  const receivedAt = new Date().toISOString();
  const placeholders = INSERT_COLUMNS.map(() => "?").join(", ");
  const sql =
    `INSERT OR IGNORE INTO scores (${INSERT_COLUMNS.join(", ")}) VALUES (${placeholders})`;

  const stmts = [];
  let invalid = 0;
  // De-dupe within the batch itself so a repeated eventId in one payload
  // counts as a single attempt.
  const seen = new Set();
  for (const ev of events) {
    const { row, error } = buildRow(ev, receivedAt);
    if (error) { invalid++; continue; }
    const id = row[0];
    if (seen.has(id)) { continue; }
    seen.add(id);
    stmts.push(env.DB.prepare(sql).bind(...row));
  }

  let written = 0;
  if (stmts.length > 0) {
    const results = await env.DB.batch(stmts);
    for (const r of results) {
      const changes = r && r.meta ? (r.meta.changes || 0) : 0;
      written += changes;
    }
  }
  const skipped = events.length - written;

  return json({ ok: true, written, skipped }, 200, env, request);
}

async function handleGetScores(request, env, url) {
  const authErr = requireKey(request, "x-admin-key", env.ADMIN_KEY);
  if (authErr) return json({ ok: false, error: authErr }, 401, env, request);

  const where = [];
  const binds = [];
  const q = url.searchParams;

  const standard = coerceText(q.get("standard"));
  if (standard) { where.push("standard = ?"); binds.push(standard); }

  const classPeriod = coerceText(q.get("classPeriod"));
  if (classPeriod) { where.push("class_period = ?"); binds.push(classPeriod); }

  const studentId = coerceText(q.get("studentId"));
  if (studentId) { where.push("student_id = ?"); binds.push(studentId); }

  const since = coerceText(q.get("since"));
  if (since) { where.push("ts >= ?"); binds.push(since); }

  let limit = coerceInt(q.get("limit"));
  if (limit === null || limit <= 0) limit = 500;
  if (limit > 5000) limit = 5000;

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql =
    `SELECT * FROM scores ${whereSql} ORDER BY ts DESC LIMIT ?`;
  const stmt = env.DB.prepare(sql).bind(...binds, limit);
  const { results } = await stmt.all();

  return json({ ok: true, count: results.length, rows: results }, 200, env, request);
}

async function handleSummary(request, env) {
  const authErr = requireKey(request, "x-admin-key", env.ADMIN_KEY);
  if (authErr) return json({ ok: false, error: authErr }, 401, env, request);

  // Per-standard: count, avg percent, mastery rate (% of events with percent >= 80).
  const perStandard = (await env.DB.prepare(
    `SELECT standard,
            COUNT(*)                                            AS count,
            ROUND(AVG(percent), 1)                              AS avgPercent,
            ROUND(100.0 * SUM(CASE WHEN percent >= 80 THEN 1 ELSE 0 END) / COUNT(*), 1) AS masteryRate
       FROM scores
      WHERE standard IS NOT NULL
      GROUP BY standard
      ORDER BY standard`
  ).all()).results;

  // Per-student: avg percent, count, last activity time.
  const perStudent = (await env.DB.prepare(
    `SELECT student_id   AS studentId,
            MAX(student_name) AS studentName,
            MAX(class_period) AS classPeriod,
            COUNT(*)          AS count,
            ROUND(AVG(percent), 1) AS avgPercent,
            MAX(ts)           AS lastActivity
       FROM scores
      WHERE student_id IS NOT NULL
      GROUP BY student_id
      ORDER BY avgPercent ASC`
  ).all()).results;

  // Misconception frequency — split the pipe-delimited field server-side.
  const misconceptionRows = (await env.DB.prepare(
    `SELECT misconceptions FROM scores WHERE misconceptions IS NOT NULL AND misconceptions <> ''`
  ).all()).results;
  const freq = new Map();
  for (const r of misconceptionRows) {
    for (const part of String(r.misconceptions).split("|")) {
      const tag = part.trim();
      if (!tag) continue;
      freq.set(tag, (freq.get(tag) || 0) + 1);
    }
  }
  const misconceptions = [...freq.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  // Overall roll-up for the Momentum Brief.
  const overall = (await env.DB.prepare(
    `SELECT COUNT(*) AS count, ROUND(AVG(percent), 1) AS avgPercent FROM scores`
  ).first());

  return json(
    { ok: true, perStandard, perStudent, misconceptions, overall },
    200, env, request
  );
}

/* CSV helpers */
function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function handleExportCsv(request, env) {
  const authErr = requireKey(request, "x-admin-key", env.ADMIN_KEY);
  if (authErr) return json({ ok: false, error: authErr }, 401, env, request);

  const { results } = await env.DB.prepare(
    `SELECT ${INSERT_COLUMNS.join(", ")} FROM scores ORDER BY ts DESC`
  ).all();

  const header = INSERT_COLUMNS.join(",");
  const lines = [header];
  for (const row of results) {
    lines.push(INSERT_COLUMNS.map((c) => csvEscape(row[c])).join(","));
  }
  // UTF-8 BOM so Excel reads encoding correctly.
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="edupulse-scores-${stamp}.csv"`,
      ...corsHeaders(env, request),
    },
  });
}

/* ------------------------------------------------------------------ *
 * Router
 * ------------------------------------------------------------------ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    try {
      if (pathname === "/api/health" && request.method === "GET") {
        return json(
          { ok: true, service: SERVICE, time: new Date().toISOString() },
          200, env, request
        );
      }
      if (pathname === "/api/scores" && request.method === "POST") {
        return await handleIngest(request, env);
      }
      if (pathname === "/api/scores" && request.method === "GET") {
        return await handleGetScores(request, env, url);
      }
      if (pathname === "/api/summary" && request.method === "GET") {
        return await handleSummary(request, env);
      }
      if (pathname === "/api/export.csv" && request.method === "GET") {
        return await handleExportCsv(request, env);
      }
      return json({ ok: false, error: "not found" }, 404, env, request);
    } catch (err) {
      return json(
        { ok: false, error: "internal error", detail: String(err && err.message || err) },
        500, env, request
      );
    }
  },
};
