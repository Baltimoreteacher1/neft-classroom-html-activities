/* =============================================================================
 * Class Boss shared progress — Cloudflare Pages Function.
 * -----------------------------------------------------------------------------
 * GET  /api/class-boss?weekKey=2026-W31[&cohort=24]
 *   -> { ok, weekKey, hits, misses, damage, hp, defeated, contributors,
 *        byTag: { <tag>: { hits, misses } } }
 * POST /api/class-boss   { weekKey, tag, correct, device, cohort }
 *   -> the same aggregate, recomputed after the write.
 *
 * This is the ONLY student-facing write path in the raid, so it is deliberately
 * the narrowest thing that can still hold a shared health bar:
 *   - AGGREGATE COUNTERS ONLY. Two integers per (week, tag). Nothing else is
 *     stored — no name, no section, no lesson, no free text, no timestamps
 *     finer than the row's own updated_at.
 *   - THE DEVICE ID IS NEVER STORED. It is hashed to one of 64 buckets on
 *     arrival and only the bucket number is written, so "how many people played"
 *     survives and "who played" does not. The raw id never touches the database.
 *   - CLOSED TAG VOCABULARY. A tag the repo does not know is rejected, so
 *     nothing a client sends can be reflected back to other students' screens.
 *   - RATE LIMITED per (weekKey, bucket): one write a second. A held-down key
 *     cannot spam the class bar.
 * No auth: this is a student surface, and there is nothing here worth guarding
 * that clamping and the closed vocabulary do not already cover.
 *
 * Storage/degradation mirror functions/api/class-pulse.js and
 * functions/api/misconception-heatmap.js exactly: D1 as env.DB, idempotent
 * CREATE TABLE IF NOT EXISTS, OPTIONS -> 204, and — because the raid must never
 * show a student an error — a well-formed `offline: true` body instead of a 5xx
 * when the binding is missing. The page then keeps score in localStorage.
 * ========================================================================== */

// Kept in sync with data/misconception-labels.json (generated from
// engine/core/misconceptions.js), same as the TAG_LABELS block in
// functions/api/class-pulse.js. Inlined because Pages Functions cannot read
// repo data files at runtime.
const KNOWN_TAGS = new Set([
  "decimal-place-value",
  "exponent-as-multiplication",
  "fraction-added-denominators",
  "fraction-no-reciprocal",
  "fraction-straight-across-division",
  "measure-area-perimeter-swap",
  "op-added-instead-of-multiplied",
  "op-divided-instead-of-multiplied",
  "op-multiplied-instead-of-added",
  "op-multiplied-instead-of-divided",
  "op-reversed-division",
  "op-reversed-subtraction",
  "order-of-operations-left-to-right",
  "percent-scale-off-by-100",
  "percent-used-as-whole-number",
  "rate-not-per-one",
  "ratio-inverted",
  "sign-dropped",
  "stat-summed-instead-of-averaged",
]);

// Must match curriculum/class-boss/boss.js.
const BASE_HP = 60;
// Class-size floor, mirroring curriculum/class-boss/boss.js: health must never
// shrink, so it is computed from the LARGEST class size seen this week and can
// never start below a real section.
const MIN_COHORT = 12;
const DAMAGE = 10;
const MISS_COST = 3;

const BUCKETS = 64; // contributor granularity — coarse on purpose
const WRITE_INTERVAL_MS = 1000; // one write per second per (weekKey, bucket)
const MAX_COHORT = 200;
const WEEK_KEY = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

/** FNV-1a, then fold to a bucket. The input is discarded immediately after. */
function bucketOf(deviceId) {
  const str = String(deviceId || "");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % BUCKETS;
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS class_boss_progress (
        week_key   TEXT NOT NULL,
        tag        TEXT NOT NULL,
        hits       INTEGER NOT NULL DEFAULT 0,
        misses     INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (week_key, tag)
      )`,
    )
    .run();
  // Anonymous contributor buckets. `bucket` is a number 0-63 derived from a
  // per-device id that is never itself written down.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS class_boss_writers (
        week_key   TEXT NOT NULL,
        bucket     INTEGER NOT NULL,
        writes     INTEGER NOT NULL DEFAULT 0,
        last_ms    INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (week_key, bucket)
      )`,
    )
    .run();
  // One row per week holding the largest class size the pulse has reported, so
  // the boss's health does not shrink when half the class logs off.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS class_boss_week (
        week_key   TEXT PRIMARY KEY,
        cohort     INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
}

function clampCohort(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_COHORT) : 0;
}

async function aggregate(db, weekKey) {
  const rows = await db
    .prepare(`SELECT tag, hits, misses FROM class_boss_progress WHERE week_key = ? LIMIT 64`)
    .bind(weekKey)
    .all();

  const byTag = {};
  let hits = 0;
  let misses = 0;
  for (const row of rows.results || []) {
    if (!KNOWN_TAGS.has(row.tag)) continue; // defensive: never echo a stray tag
    const h = Math.max(0, Number(row.hits) || 0);
    const m = Math.max(0, Number(row.misses) || 0);
    byTag[row.tag] = { hits: h, misses: m };
    hits += h;
    misses += m;
  }

  const writers = await db
    .prepare(`SELECT COUNT(*) AS n FROM class_boss_writers WHERE week_key = ?`)
    .bind(weekKey)
    .first();
  const contributors = Math.max(0, Number(writers?.n) || 0);

  const week = await db
    .prepare(`SELECT cohort FROM class_boss_week WHERE week_key = ?`)
    .bind(weekKey)
    .first();
  const cohort = Math.max(MIN_COHORT, clampCohort(week?.cohort), contributors);

  const hp = BASE_HP * cohort;
  const damage = Math.max(0, Math.min(hp, hits * DAMAGE - misses * MISS_COST));

  return {
    ok: true,
    weekKey,
    hits,
    misses,
    damage,
    hp,
    defeated: damage >= hp,
    contributors,
    byTag,
  };
}

async function noteCohort(db, weekKey, cohort, nowIso) {
  if (!cohort) return;
  await db
    .prepare(
      `INSERT INTO class_boss_week (week_key, cohort, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(week_key) DO UPDATE SET
           cohort = MAX(class_boss_week.cohort, excluded.cohort),
           updated_at = excluded.updated_at`,
    )
    .bind(weekKey, cohort, nowIso)
    .run();
}

/** true when this bucket is allowed to write right now. */
async function takeWriteSlot(db, weekKey, bucket, now) {
  const row = await db
    .prepare(`SELECT last_ms FROM class_boss_writers WHERE week_key = ? AND bucket = ?`)
    .bind(weekKey, bucket)
    .first();
  if (row && now - (Number(row.last_ms) || 0) < WRITE_INTERVAL_MS) return false;
  await db
    .prepare(
      `INSERT INTO class_boss_writers (week_key, bucket, writes, last_ms) VALUES (?, ?, 1, ?)
         ON CONFLICT(week_key, bucket) DO UPDATE SET
           writes = class_boss_writers.writes + 1,
           last_ms = excluded.last_ms`,
    )
    .bind(weekKey, bucket, now)
    .run();
  return true;
}

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  const text = await request.text();
  if (!text || text.length > 2000) return null; // nothing legitimate is bigger
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (method !== "GET" && method !== "POST") {
    return json({ ok: false, error: "method-not-allowed" }, 405);
  }

  try {
    if (method === "GET") {
      const weekKey = String(url.searchParams.get("weekKey") || "");
      if (!WEEK_KEY.test(weekKey)) return json({ ok: false, error: "bad-week-key" }, 400);
      // No database bound: an honest, well-formed "play locally" answer rather
      // than an error the class would see as a broken screen.
      if (!env.DB) return json({ ok: true, offline: true, weekKey });

      await ensureSchema(env.DB);
      const cohort = clampCohort(url.searchParams.get("cohort"));
      if (cohort) await noteCohort(env.DB, weekKey, cohort, new Date().toISOString());
      return json(await aggregate(env.DB, weekKey));
    }

    const body = await readBody(request);
    if (!body) return json({ ok: false, error: "bad-body" }, 400);

    const weekKey = String(body.weekKey || "");
    const tag = String(body.tag || "");
    if (!WEEK_KEY.test(weekKey)) return json({ ok: false, error: "bad-week-key" }, 400);
    if (!KNOWN_TAGS.has(tag)) return json({ ok: false, error: "unknown-tag" }, 400);
    if (typeof body.correct !== "boolean") return json({ ok: false, error: "bad-correct" }, 400);
    if (!env.DB) return json({ ok: true, offline: true, weekKey });

    await ensureSchema(env.DB);

    const now = Date.now();
    const bucket = bucketOf(body.device); // raw id dies with this expression
    if (!(await takeWriteSlot(env.DB, weekKey, bucket, now))) {
      return json({ ok: false, error: "rate-limited", throttled: true }, 429);
    }

    const nowIso = new Date(now).toISOString();
    await noteCohort(env.DB, weekKey, clampCohort(body.cohort), nowIso);
    await env.DB.prepare(
      `INSERT INTO class_boss_progress (week_key, tag, hits, misses, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(week_key, tag) DO UPDATE SET
           hits = class_boss_progress.hits + excluded.hits,
           misses = class_boss_progress.misses + excluded.misses,
           updated_at = excluded.updated_at`,
    )
      .bind(weekKey, tag, body.correct ? 1 : 0, body.correct ? 0 : 1, nowIso)
      .run();

    return json(await aggregate(env.DB, weekKey));
  } catch (err) {
    return json({ ok: false, error: "server-error", message: String(err) }, 500);
  }
}

export const __test__ = {
  KNOWN_TAGS,
  bucketOf,
  clampCohort,
  WEEK_KEY,
  BASE_HP,
  MIN_COHORT,
  DAMAGE,
  MISS_COST,
};
