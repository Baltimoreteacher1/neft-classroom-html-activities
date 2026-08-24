/* =============================================================================
 * Usage + error signal — Cloudflare Pages Function (additive, deploy-safe)
 * -----------------------------------------------------------------------------
 * The instrument the site never had. assets/nt-usage.js beacons here on page
 * hide; this aggregates into two daily counter tables so `npm run brief` and
 * scripts/usage-report.mjs can finally answer "what do students actually open"
 * and "what is throwing errors in the field".
 *
 * Routes (catch-all under /api/signal):
 *   POST /api/signal/view    { path, dwellMs, device }              -> { ok }
 *   POST /api/signal/error   { path, message, source, line }        -> { ok }
 *   POST /api/signal/vital   { path, metric, value, device }        -> { ok }
 *   POST /api/signal/practice{ lessonId, source }                    -> { ok }
 *   GET  /api/signal/health                                         -> { ok, d1 }
 *   GET  /api/signal/status                                         -> aggregate health only
 *   GET  /api/signal/usage?days=14&limit=100   (TEACHER_KEY)        -> { ok, rows }
 *   GET  /api/signal/errors?days=7&limit=100   (TEACHER_KEY)        -> { ok, rows }
 *   GET  /api/signal/vitals?days=28&limit=200  (TEACHER_KEY)        -> { ok, rows }
 *   GET  /api/signal/practice?days=28          (TEACHER_KEY)        -> { ok, rows, totals }
 *
 * WRITES ARE UNAUTHENTICATED — they must be, they come from student devices
 * with no login. That is only safe because a write can express nothing worth
 * forging: every field is normalized, clamped, and same-origin-checked here on
 * the server, and the tables are counters with no per-person key. The worst a
 * hostile POST achieves is inflating a view count.
 * READS ARE TEACHER-GATED — aggregate usage is operational data, not public.
 *
 * SAFETY: if env.DB is absent every route degrades to a 204/503 and the client
 * silently drops the beacon. Nothing on the page depends on this succeeding.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
  "Cache-Control": "no-store",
};

/** Coarse area buckets, longest-prefix-first. Keeps `area` a closed vocabulary
 *  instead of "whatever the first path segment happened to be". */
const AREAS = [
  "curriculum",
  "lessons",
  "math",
  "games",
  "teacher-tools",
  "practice",
  "activities",
  "graphic-novels",
  "families",
  "futures",
  "esol",
  "reveal-math",
];

/* Where a family started the optional practice from. A CLOSED vocabulary: the
 * question this answers is "does posting the week actually move practice
 * opens?", and that only needs to tell the posted week apart from browsing. An
 * open referrer field would be a tracking surface for no extra answer. */
const PRACTICE_SOURCES = new Set(["week", "library", "spotlight", "other"]);
const LESSON_ID = /^\d{1,2}-\d{1,2}(?:-flagship)?$/;

const MAX_PATH = 200;
const MAX_MESSAGE = 300;
const MAX_SOURCE = 200;
const VITAL_LIMITS = { CLS: 10, INP: 60000, LCP: 60000 };
const VITAL_THRESHOLDS = {
  CLS: [0.1, 0.25],
  INP: [200, 500],
  LCP: [2500, 4000],
};
/** 8h. A dwell longer than a school day is a forgotten tab, not attention. */
const MAX_DWELL_MS = 8 * 60 * 60 * 1000;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

/** Beacons are fire-and-forget: never make the client retry, never leak why. */
function accepted() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

function clamp(value, max) {
  const s = typeof value === "string" ? value : "";
  return s.length > max ? s.slice(0, max) : s;
}

function intOr(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** UTC date only — deliberately no clock time. See the migration's privacy note. */
function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Normalize a client-supplied path to a safe, same-origin, storable key.
 * Returns "" when the input cannot be trusted, which the caller treats as a
 * silent drop. Rejects absolute URLs, protocol-relative paths, and traversal
 * so a hostile beacon cannot write an arbitrary string into the table.
 */
function normalizePath(raw) {
  let p = clamp(raw, MAX_PATH).trim();
  if (!p.startsWith("/")) return "";
  if (p.startsWith("//")) return "";
  if (p.includes("..")) return "";
  // Query strings and fragments are per-session noise; the page is the unit.
  const cut = p.search(/[?#]/);
  if (cut !== -1) p = p.slice(0, cut);
  // Collapse directory-index forms so "/curriculum" and "/curriculum/index.html"
  // are one row, not two.
  p = p.replace(/index\.html?$/i, "");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function areaOf(path) {
  const first = path.split("/")[1] || "";
  return AREAS.includes(first) ? first : "other";
}

function normalizeDevice(raw) {
  return raw === "mobile" || raw === "tablet" || raw === "desktop" ? raw : "desktop";
}

function teacherAuthorized(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS usage_signal (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         path TEXT NOT NULL, area TEXT, day TEXT NOT NULL, device TEXT,
         views INTEGER DEFAULT 0, dwell_ms_sum INTEGER DEFAULT 0,
         dwell_n INTEGER DEFAULT 0, updated_at TEXT NOT NULL)`,
    ),
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_signal_key
         ON usage_signal (path, day, device)`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS client_error (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         path TEXT NOT NULL, message TEXT NOT NULL, source TEXT, line INTEGER,
         day TEXT NOT NULL, hits INTEGER DEFAULT 0,
         first_seen TEXT NOT NULL, last_seen TEXT NOT NULL)`,
    ),
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_client_error_key
         ON client_error (path, message, day)`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS web_vital (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         path TEXT NOT NULL, area TEXT, day TEXT NOT NULL, device TEXT,
         metric TEXT NOT NULL, rating TEXT NOT NULL,
         samples INTEGER DEFAULT 0, value_sum REAL DEFAULT 0,
         value_max REAL DEFAULT 0, updated_at TEXT NOT NULL)`,
    ),
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_web_vital_key
         ON web_vital (path, day, device, metric, rating)`,
    ),
    /* Same counter shape and the same privacy posture as usage_signal: one row
     * per (lesson, source, day) with no person key, so it can count opens and
     * can never reconstruct a family's session. */
    db.prepare(
      `CREATE TABLE IF NOT EXISTS family_practice_open (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         lesson_id TEXT NOT NULL, source TEXT NOT NULL, day TEXT NOT NULL,
         opens INTEGER DEFAULT 0, updated_at TEXT NOT NULL)`,
    ),
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_family_practice_key
         ON family_practice_open (lesson_id, source, day)`,
    ),
  ]);
}

/** The whole write surface of the practice counter, as a pure function so the
 *  closed vocabulary is testable without a database. Returns null to reject. */
export function normalizePracticeOpen(body) {
  const lessonId = clamp(body && body.lessonId, 40).trim();
  const source = clamp(body && body.source, 20)
    .trim()
    .toLowerCase();
  if (!LESSON_ID.test(lessonId) || !PRACTICE_SOURCES.has(source)) return null;
  return { lessonId, source };
}

async function recordPracticeOpen(db, body) {
  const entry = normalizePracticeOpen(body);
  if (!entry) return false;
  const { lessonId, source } = entry;
  const day = utcDay();
  await db
    .prepare(
      `INSERT INTO family_practice_open (lesson_id, source, day, opens, updated_at)
       VALUES (?1, ?2, ?3, 1, ?4)
       ON CONFLICT (lesson_id, source, day) DO UPDATE SET
         opens = opens + 1,
         updated_at = ?4`,
    )
    .bind(lessonId, source, day, new Date().toISOString())
    .run();
  return true;
}

async function recordView(db, body) {
  const path = normalizePath(body && body.path);
  if (!path) return false;

  const day = utcDay();
  const device = normalizeDevice(body && body.device);
  const area = areaOf(path);
  // A dwell of 0 is "reported nothing", not "stayed zero ms" — only count
  // samples that carry a real number so the mean is not dragged to zero.
  const dwell = Math.min(Math.max(intOr(body && body.dwellMs, 0), 0), MAX_DWELL_MS);
  const dwellN = dwell > 0 ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO usage_signal (path, area, day, device, views, dwell_ms_sum, dwell_n, updated_at)
       VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7)
       ON CONFLICT (path, day, device) DO UPDATE SET
         views        = views + 1,
         dwell_ms_sum = dwell_ms_sum + ?5,
         dwell_n      = dwell_n + ?6,
         updated_at   = ?7`,
    )
    .bind(path, area, day, device, dwell, dwellN, new Date().toISOString())
    .run();
  return true;
}

async function recordError(db, body) {
  const path = normalizePath(body && body.path);
  const message = clamp(body && body.message, MAX_MESSAGE).trim();
  if (!path || !message) return false;

  const day = utcDay();
  const now = new Date().toISOString();
  // Stacks are NOT stored: template-literal pages can interpolate student
  // input into a thrown message's stack frame. Source + line locate it well
  // enough to debug without that risk.
  const source = clamp(body && body.source, MAX_SOURCE);
  const line = Math.max(intOr(body && body.line, 0), 0);

  await db
    .prepare(
      `INSERT INTO client_error (path, message, source, line, day, hits, first_seen, last_seen)
       VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6)
       ON CONFLICT (path, message, day) DO UPDATE SET
         hits = hits + 1, last_seen = ?6`,
    )
    .bind(path, message, source, line, day, now)
    .run();
  return true;
}

export function vitalRating(metric, value) {
  const thresholds = VITAL_THRESHOLDS[metric];
  if (!thresholds || !Number.isFinite(value) || value < 0) return "";
  if (value <= thresholds[0]) return "good";
  if (value <= thresholds[1]) return "needs-improvement";
  return "poor";
}

async function recordVital(db, body) {
  const path = normalizePath(body && body.path);
  const metric = String((body && body.metric) || "").toUpperCase();
  const rawValue = Number(body && body.value);
  const rating = vitalRating(metric, rawValue);
  if (!path || !rating) return false;

  const value = Math.min(rawValue, VITAL_LIMITS[metric]);
  const day = utcDay();
  const device = normalizeDevice(body && body.device);
  const area = areaOf(path);
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO web_vital
         (path, area, day, device, metric, rating, samples, value_sum, value_max, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?7, ?8)
       ON CONFLICT (path, day, device, metric, rating) DO UPDATE SET
         samples = samples + 1,
         value_sum = value_sum + ?7,
         value_max = MAX(value_max, ?7),
         updated_at = ?8`,
    )
    .bind(path, area, day, device, metric, rating, value, now)
    .run();
  return true;
}

/** Reject oversized bodies before parsing — a beacon is a few hundred bytes. */
async function readBody(request) {
  const length = intOr(request.headers.get("content-length"), 0);
  if (length > 4096) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function sinceDay(days) {
  const n = Math.min(Math.max(intOr(days, 14), 1), 400);
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

export function assessFieldHealth({ errors = 0, views = 0, vitals = [] } = {}) {
  const errorHits = Math.max(Number(errors) || 0, 0);
  const viewCount = Math.max(Number(views) || 0, 0);
  const errorRate = viewCount ? errorHits / viewCount : 0;
  const errorAlert = errorHits >= 10 && errorRate >= 0.02;
  const vitalChecks = vitals.map((row) => {
    const samples = Math.max(Number(row.samples) || 0, 0);
    const good = Math.max(Number(row.good) || 0, 0);
    const goodPercent = samples ? Math.round((1000 * good) / samples) / 10 : null;
    return {
      metric: row.metric,
      device: row.device,
      samples,
      goodPercent,
      status: samples < 20 ? "insufficient-data" : goodPercent >= 75 ? "good" : "alert",
    };
  });
  const vitalAlert = vitalChecks.some((row) => row.status === "alert");
  return {
    ok: !errorAlert && !vitalAlert,
    clientErrors: {
      hits: errorHits,
      views: viewCount,
      ratePercent: viewCount ? Math.round(errorRate * 1000) / 10 : 0,
      status: errorAlert ? "alert" : "good",
    },
    vitals: vitalChecks,
  };
}

async function fieldStatus(db) {
  const recent = sinceDay(1);
  const vitalsFrom = sinceDay(28);
  const [errorResult, viewResult, vitalResult] = await Promise.all([
    db
      .prepare("SELECT COALESCE(SUM(hits), 0) AS n FROM client_error WHERE day >= ?1")
      .bind(recent)
      .first(),
    db
      .prepare("SELECT COALESCE(SUM(views), 0) AS n FROM usage_signal WHERE day >= ?1")
      .bind(recent)
      .first(),
    db
      .prepare(
        `SELECT metric, device, SUM(samples) AS samples,
              SUM(CASE WHEN rating = 'good' THEN samples ELSE 0 END) AS good
         FROM web_vital WHERE day >= ?1
        GROUP BY metric, device ORDER BY metric, device`,
      )
      .bind(vitalsFrom)
      .all(),
  ]);
  return {
    ...assessFieldHealth({
      errors: errorResult && errorResult.n,
      views: viewResult && viewResult.n,
      vitals: (vitalResult && vitalResult.results) || [],
    }),
    windows: { clientErrors: "2 UTC calendar days", vitals: "29 UTC calendar days" },
  };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const route = (
    Array.isArray(params.path) ? params.path.join("/") : params.path || ""
  ).toLowerCase();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  if (route === "health") {
    return json({ ok: true, backend: "d1", d1: Boolean(env.DB) });
  }

  if (!env.DB) {
    // No binding: swallow writes (client must not retry), 503 reads.
    return request.method === "POST"
      ? accepted()
      : json({ ok: false, error: "d1-unavailable" }, 503);
  }

  try {
    if (
      request.method === "POST" &&
      (route === "view" || route === "error" || route === "vital" || route === "practice")
    ) {
      const body = await readBody(request);
      if (!body) return accepted();
      await ensureSchema(env.DB);
      if (route === "view") await recordView(env.DB, body);
      else if (route === "error") await recordError(env.DB, body);
      else if (route === "practice") await recordPracticeOpen(env.DB, body);
      else await recordVital(env.DB, body);
      return accepted();
    }

    if (request.method === "GET" && route === "status") {
      await ensureSchema(env.DB);
      return json({ backend: "d1", ...(await fieldStatus(env.DB)) });
    }

    if (request.method === "GET" && route === "practice") {
      const auth = teacherAuthorized(env, request, url);
      if (auth !== "ok") {
        return json(
          {
            ok: false,
            error: auth,
            message:
              auth === "not-configured"
                ? "Set the TEACHER_KEY env var on the Pages project to read signal."
                : "A valid teacher key is required.",
          },
          auth === "not-configured" ? 503 : 401,
        );
      }
      await ensureSchema(env.DB);
      const from = sinceDay(url.searchParams.get("days"));
      const rows = await env.DB.prepare(
        `SELECT lesson_id, source, SUM(opens) AS opens, MAX(day) AS last_day
           FROM family_practice_open WHERE day >= ?1
          GROUP BY lesson_id, source
          ORDER BY opens DESC LIMIT 500`,
      )
        .bind(from)
        .all();
      const totals = {};
      for (const row of rows.results || []) {
        totals[row.source] = (totals[row.source] || 0) + Number(row.opens || 0);
      }
      return json({ ok: true, since: from, rows: rows.results || [], totals });
    }

    if (
      request.method === "GET" &&
      (route === "usage" || route === "errors" || route === "vitals")
    ) {
      const auth = teacherAuthorized(env, request, url);
      if (auth !== "ok") {
        return json(
          {
            ok: false,
            error: auth,
            message:
              auth === "not-configured"
                ? "Set the TEACHER_KEY env var on the Pages project to read signal."
                : "A valid teacher key is required.",
          },
          auth === "not-configured" ? 503 : 401,
        );
      }
      await ensureSchema(env.DB);
      const limit = Math.min(Math.max(intOr(url.searchParams.get("limit"), 100), 1), 1000);
      const from = sinceDay(url.searchParams.get("days"));

      let sql;
      if (route === "usage") {
        sql = `SELECT path, area,
                    SUM(views) AS views,
                    SUM(dwell_ms_sum) AS dwell_sum,
                    SUM(dwell_n) AS dwell_n,
                    MAX(day) AS last_day
               FROM usage_signal WHERE day >= ?1
              GROUP BY path, area ORDER BY views DESC LIMIT ?2`;
      } else if (route === "errors") {
        sql = `SELECT path, message, source, line,
                    SUM(hits) AS hits, MAX(last_seen) AS last_seen
               FROM client_error WHERE day >= ?1
              GROUP BY path, message, source, line
              ORDER BY hits DESC LIMIT ?2`;
      } else {
        sql = `SELECT path, area, device, metric,
                      SUM(samples) AS samples,
                      ROUND(SUM(value_sum) / SUM(samples), 3) AS average,
                      MAX(value_max) AS maximum,
                      SUM(CASE WHEN rating = 'good' THEN samples ELSE 0 END) AS good,
                      SUM(CASE WHEN rating = 'needs-improvement' THEN samples ELSE 0 END) AS needs_improvement,
                      SUM(CASE WHEN rating = 'poor' THEN samples ELSE 0 END) AS poor,
                      MAX(day) AS last_day
                 FROM web_vital WHERE day >= ?1
                GROUP BY path, area, device, metric
                ORDER BY samples DESC LIMIT ?2`;
      }

      const { results } = await env.DB.prepare(sql).bind(from, limit).all();
      return json({ ok: true, since: from, rows: results || [] });
    }

    return json({ ok: false, error: "not-found" }, 404);
  } catch (err) {
    if (request.method === "POST") return accepted();
    return json({ ok: false, error: String((err && err.message) || err) }, 500);
  }
}
