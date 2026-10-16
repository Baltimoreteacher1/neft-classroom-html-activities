/* =============================================================================
 * Family engagement counters — Cloudflare Pages Function (aggregate-only)
 * -----------------------------------------------------------------------------
 *   POST /api/family-engagement   { event, route, tab?, lang?, device? }  -> 204
 *   GET  /api/family-engagement?weeks=8   (x-teacher-key)  -> weekly aggregate
 *
 * Answers one question for the teacher: "Are families using the practice, and
 * which way?" — which route they chose (quick / core / full), which tabs they
 * moved through, in which language, on which class of device, by week.
 *
 * NO IDENTIFIERS, BY CONSTRUCTION
 *   - The write is a counter: one row per (week, event, route, tab, lang,
 *     device) holding a number. There is no student id, save code, family,
 *     lesson, path, IP, user agent, session or timestamp finer than a week, so
 *     the table cannot be turned back into a person's visit.
 *   - Every field is a CLOSED vocabulary. Anything else is dropped, never
 *     stored, so a hostile beacon cannot put a string of its own in the table.
 *   - The read applies small-count suppression (K = 5, with complementary
 *     suppression) so a quiet week cannot single out one family by language or
 *     device. The read is teacher-gated; the write is open because it must come
 *     from a family's phone with no login, and the worst a forged write can do
 *     is nudge a counter.
 *   - The write path logs nothing, and errors never echo what was sent. The
 *     teacher key travels in the x-teacher-key header only, never the query.
 *
 * The table is created idempotently on first write, the same way
 * functions/api/signal creates its counters: no migration to apply.
 * ========================================================================== */

import { createRateLimiter, handler, json } from "../_lib/http.js";

export const ROUTES = Object.freeze(["quick", "core", "full"]);
export const TABS = Object.freeze(["learn", "words", "check", "play", "done"]);
export const LANGS = Object.freeze(["en", "es"]);
export const DEVICES = Object.freeze(["mobile", "tablet", "desktop"]);
/** open = the practice page opened on this route; route = a family chose it; tab = a tab was completed. */
export const EVENTS = Object.freeze(["open", "route", "tab"]);

/** Cells smaller than this are never shown to the teacher. */
export const K_ANONYMITY = 5;
const MAX_WEEKS = 26;
const DAY_MS = 86_400_000;

const pick = (value, list, fallback) => {
  const v = String(value == null ? "" : value)
    .trim()
    .toLowerCase();
  return list.includes(v) ? v : fallback;
};

/** Monday of the UTC week, as YYYY-MM-DD. The finest time resolution ever stored. */
export function weekStart(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - back * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The whole write surface as a pure function. Returns the one counter to bump,
 * or null to drop the beacon. Unknown values never reach the database.
 */
export function normalizeEngagement(body) {
  if (!body || typeof body !== "object") return null;
  const event = pick(body.event, EVENTS, "");
  const route = pick(body.route, ROUTES, "");
  if (!event || !route) return null;
  const tab = event === "tab" ? pick(body.tab, TABS, "") : "";
  if (event === "tab" && !tab) return null;
  return {
    event,
    route,
    tab,
    lang: pick(body.lang, LANGS, "en"),
    device: pick(body.device, DEVICES, "desktop"),
  };
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS family_engagement (
         week   TEXT NOT NULL,
         event  TEXT NOT NULL,
         route  TEXT NOT NULL,
         tab    TEXT NOT NULL,
         lang   TEXT NOT NULL,
         device TEXT NOT NULL,
         n      INTEGER NOT NULL DEFAULT 0,
         PRIMARY KEY (week, event, route, tab, lang, device)
       )`,
    )
    .run();
}

async function bump(db, entry, week) {
  await db
    .prepare(
      `INSERT INTO family_engagement (week, event, route, tab, lang, device, n)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)
       ON CONFLICT (week, event, route, tab, lang, device) DO UPDATE SET n = n + 1`,
    )
    .bind(week, entry.event, entry.route, entry.tab, entry.lang, entry.device)
    .run();
}

/* ------------------------------------------------------------- the read -- */

/**
 * One breakdown with small-count suppression. A value under K becomes null. If
 * exactly one cell was hidden, the smallest remaining one is hidden too: with a
 * visible total, a single hidden cell could otherwise be recovered by
 * subtraction. Zero is shown as zero (it names nobody).
 */
export function suppress(counts, k = K_ANONYMITY) {
  const out = {};
  for (const [key, n] of Object.entries(counts)) out[key] = n > 0 && n < k ? null : n;
  const hidden = Object.values(out).filter((v) => v === null).length;
  if (hidden === 1) {
    const next = Object.entries(out)
      .filter(([, v]) => v !== null && v > 0)
      .sort((a, b) => a[1] - b[1])[0];
    if (next) out[next[0]] = null;
  }
  return out;
}

const zero = (list) => Object.fromEntries(list.map((v) => [v, 0]));

/** Roll raw counter rows up into weekly marginals, suppressed for display. */
export function aggregate(rows, k = K_ANONYMITY) {
  const weeks = new Map();
  for (const r of rows) {
    if (!weeks.has(r.week)) weeks.set(r.week, new Map());
    const events = weeks.get(r.week);
    if (!events.has(r.event)) {
      events.set(r.event, {
        total: 0,
        route: zero(ROUTES),
        tab: zero(TABS),
        lang: zero(LANGS),
        device: zero(DEVICES),
      });
    }
    const cell = events.get(r.event);
    const n = Number(r.n) || 0;
    cell.total += n;
    cell.route[r.route] = (cell.route[r.route] || 0) + n;
    if (r.tab) cell.tab[r.tab] = (cell.tab[r.tab] || 0) + n;
    cell.lang[r.lang] = (cell.lang[r.lang] || 0) + n;
    cell.device[r.device] = (cell.device[r.device] || 0) + n;
  }
  return [...weeks.keys()].sort().map((week) => {
    const out = { week };
    for (const event of EVENTS) {
      const cell = weeks.get(week).get(event);
      if (!cell || cell.total === 0) {
        out[event] = { total: 0 };
      } else if (cell.total < k) {
        out[event] = { total: null, suppressed: true };
      } else {
        out[event] = {
          total: cell.total,
          route: suppress(cell.route, k),
          lang: suppress(cell.lang, k),
          device: suppress(cell.device, k),
          ...(event === "tab" ? { tab: suppress(cell.tab, k) } : {}),
        };
      }
    }
    return out;
  });
}

function weeksParam(raw) {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_WEEKS) : 8;
}

/** Header only: a key in the query string would be written into request logs. */
function teacherAuthorized(env, request) {
  if (!env.TEACHER_KEY) return "not-configured";
  return request.headers.get("x-teacher-key") === env.TEACHER_KEY ? "ok" : "unauthorized";
}

const accepted = () => new Response(null, { status: 204 });

/** A beacon from another origin is dropped without a word. */
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

const writeLimiter = createRateLimiter({ max: 120, windowMs: 60_000 });
const clientKey = (request) => request.headers.get("CF-Connecting-IP") || "anon";

export const onRequest = handler({
  methods: ["GET", "POST"],
  async handle({ request, env, body }) {
    const url = new URL(request.url);

    if (request.method === "POST") {
      // Fire-and-forget: a family's page never learns whether this counted.
      if (!env.DB || !sameOrigin(request) || writeLimiter(clientKey(request))) return accepted();
      const entry = normalizeEngagement(body);
      if (!entry) return accepted();
      try {
        await ensureSchema(env.DB);
        await bump(env.DB, entry, weekStart());
      } catch {
        /* a counter that cannot count is dropped, never surfaced */
      }
      return accepted();
    }

    const auth = teacherAuthorized(env, request);
    if (auth !== "ok") {
      return json({ ok: false, error: auth }, auth === "not-configured" ? 503 : 401);
    }
    if (!env.DB) return json({ ok: false, error: "d1-unavailable" }, 503);
    const weeks = weeksParam(url.searchParams.get("weeks"));
    const from = weekStart(new Date(Date.now() - (weeks - 1) * 7 * DAY_MS));
    await ensureSchema(env.DB);
    const res = await env.DB.prepare(
      `SELECT week, event, route, tab, lang, device, n
         FROM family_engagement WHERE week >= ?1 ORDER BY week`,
    )
      .bind(from)
      .all();
    return json({ ok: true, k: K_ANONYMITY, since: from, weeks: aggregate(res.results || []) });
  },
});
