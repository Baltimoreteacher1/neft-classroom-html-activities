/* =============================================================================
 * Today's lesson — one plan, shared by every device.
 * -----------------------------------------------------------------------------
 *   GET /api/settings/today            -> { ok, plan, source }   (public)
 *   PUT /api/settings/today { plan }   -> { ok, plan }            (TEACHER_KEY)
 *
 * `plan` maps a section label to the lesson that section is doing today:
 *
 *   { "601": { "lessonId": "4-4", "title": "Dividing Fractions" },
 *     "602": { "lessonId": "4-3", "title": "Multiplying Fractions" },
 *     "*":   { "lessonId": "4-4", "title": "Dividing Fractions" } }
 *
 * The "*" entry is the fallback for a student whose section isn't listed, so a
 * teacher who runs the same lesson everywhere sets ONE entry and is done.
 *
 * Read is public — students must see the teacher-set lesson. Write is gated by
 * env.TEACHER_KEY (?key= or x-teacher-key header), matching the auth posture of
 * functions/api/settings/warmup.js, whose storage row (D1 `site_settings`,
 * bound as env.DB) this endpoint shares. Unlike warmup it is built on the
 * shared handler in functions/_lib/http.js, as new endpoints are required to be
 * (see functions/api-contract.test.mjs).
 *
 * Binding absent -> the GET returns an EMPTY PLAN rather than an error, because
 * /today must still render: it just shows no assigned lesson and falls back to
 * "choose a lesson". Nothing in the student flow depends on this succeeding.
 * ========================================================================== */

import { badRequest, handler, json, unauthorized } from "../../_lib/http.js";

const KEY = "today_plan";
const MAX_SECTIONS = 20;

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

/* Accept only the shape /today reads, and cap it — this row is written by a
   teacher UI but is still untrusted input arriving over a public endpoint. */
function cleanPlan(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  let n = 0;
  for (const [section, entry] of Object.entries(raw)) {
    if (n >= MAX_SECTIONS) break;
    if (!entry || typeof entry !== "object") continue;
    const lessonId = String(entry.lessonId || "").slice(0, 32);
    if (!/^[a-zA-Z0-9._-]+$/.test(lessonId)) continue;
    const key = String(section).slice(0, 40);
    if (!key) continue;
    out[key] = { lessonId, title: String(entry.title || "").slice(0, 200) };
    n++;
  }
  return out;
}

async function readPlan(env) {
  if (!env.DB) return { ok: true, plan: {}, source: "unconfigured" };
  try {
    await ensureSchema(env.DB);
    const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = ?")
      .bind(KEY)
      .first();
    if (!row) return { ok: true, plan: {}, source: "empty" };
    return { ok: true, plan: cleanPlan(JSON.parse(row.value)) || {}, source: "d1" };
  } catch {
    // A malformed row must not take the student's Today screen down with it.
    return { ok: true, plan: {}, source: "error" };
  }
}

async function writePlan({ env, request, url, body }) {
  if (!env.TEACHER_KEY) return json({ ok: false, error: "TEACHER_KEY is not configured" }, 503);
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  if (key !== env.TEACHER_KEY) return unauthorized();
  if (!env.DB) return json({ ok: false, error: "D1 binding 'DB' is not set" }, 503);

  const plan = cleanPlan(body && body.plan);
  if (!plan) return badRequest("plan must be an object of { section: { lessonId, title } }");

  await ensureSchema(env.DB);
  await env.DB.prepare(
    `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value,
                                      updated_at = excluded.updated_at`,
  )
    .bind(KEY, JSON.stringify(plan), new Date().toISOString())
    .run();
  return { ok: true, plan };
}

export const onRequest = handler({
  methods: ["GET", "PUT"],
  rateLimit: { max: 120, windowMs: 60_000 },
  async handle(context) {
    const url = new URL(context.request.url);
    if (context.request.method.toUpperCase() === "GET") return readPlan(context.env);
    return writePlan({ ...context, url });
  },
});
