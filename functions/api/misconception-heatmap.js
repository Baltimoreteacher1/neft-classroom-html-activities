/* =============================================================================
 * Misconception Heatmap rollup — Cloudflare Pages Function (read-only)
 * -----------------------------------------------------------------------------
 * GET /api/misconception-heatmap?days=30
 *   -> { ok, days, since, recentSince, count, rows: [{
 *        lessonSlug, lessonTitle, standard, section,
 *        attempts, misses, hints, misconceptions, struggles, mastery,
 *        students, recentMiss, priorMiss, lastAt, topTags: [{ tag, count }] }] }
 *
 * One aggregate row per (lesson, section) from `lesson_telemetry`, so the
 * teacher heatmap at /teacher-tools/misconception-heatmap/ can show which
 * lessons students miss most, filtered by class period. Counts only — no
 * student names ever leave this endpoint.
 *
 * Auth + storage mirror functions/api/progress/[[path]].js exactly:
 *   - Gated by env.TEACHER_KEY (?key= or x-teacher-key). No key configured
 *     -> 503, wrong key -> 401. Never world-readable.
 *   - D1 bound as `env.DB`; binding absent -> graceful 503.
 *   - No schema changes: the CREATE TABLE IF NOT EXISTS below is the same
 *     idempotent DDL the progress function runs (safe on an empty database).
 *
 * Event vocabulary (see assets/lesson-telemetry.js + assets/adaptive-engine.js
 * + engine/core/lesson-renderer.js): item_attempt, hint_used, misconception,
 * mastery_reached; plus struggle / hint-exhausted, which the progress analytics
 * routes already handle defensively. Wrong item_attempts are detected with
 * LIKE on the raw payload ("correct":false — adaptive engine flat shape — or
 * "result":"incorrect" — lesson-telemetry props shape) instead of
 * json_extract, because payload_json is clamped to 2000 chars at ingest and a
 * truncated blob would abort a JSON-parsing query.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

function clamp(s, n) {
  return typeof s === "string" ? s.slice(0, n) : "";
}

import { teacherAuthorized } from "../_lib/teacher-auth.js";

// Same idempotent DDL as functions/api/progress/[[path]].js ensureTelemetrySchema.
async function ensureTelemetrySchema(db) {
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

// Pull a misconception tag out of a telemetry payload blob. Superset of the
// progress function's payloadTag: telemetry records nest authored props under
// `props`, while the adaptive engine stores a flat shape — check both.
function payloadTag(payloadJson) {
  try {
    const p = JSON.parse(payloadJson || "{}");
    const nested = p.props && typeof p.props === "object" ? p.props : {};
    return clamp(
      p.tag || p.misconceptionTag || p.misconception || nested.tag || nested.misconceptionTag || "",
      60,
    );
  } catch (_e) {
    return "";
  }
}

const MISS_ATTEMPT_SQL = `(event_type = 'item_attempt'
       AND (payload_json LIKE '%"correct":false%' OR payload_json LIKE '%"result":"incorrect"%'))`;

export async function onRequest(context) {
  const { request, env, data } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }
  if (method !== "GET") return json({ ok: false, error: "method-not-allowed" }, 405);

  const auth = teacherAuthorized(env, request, url, data);
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

  try {
    await ensureTelemetrySchema(env.DB);

    const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 180);
    const recentDays = Math.min(7, days);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const recentSince = new Date(Date.now() - recentDays * 86400000).toISOString();

    // One row per (lesson, section). Binds in order of appearance:
    // recentSince (SELECT recent_miss CASE), then since (WHERE).
    const agg = await env.DB.prepare(
      `SELECT lesson_slug,
              MAX(lesson_title) AS lesson_title,
              MAX(standard)     AS standard,
              COALESCE(section, '') AS section,
              SUM(CASE WHEN event_type = 'item_attempt' THEN 1 ELSE 0 END) AS attempts,
              SUM(CASE WHEN ${MISS_ATTEMPT_SQL} THEN 1 ELSE 0 END) AS misses,
              SUM(CASE WHEN event_type = 'hint_used' THEN 1 ELSE 0 END) AS hints,
              SUM(CASE WHEN event_type = 'misconception' THEN 1 ELSE 0 END) AS misconceptions,
              SUM(CASE WHEN event_type IN ('struggle', 'hint-exhausted') THEN 1 ELSE 0 END)
                AS struggles,
              SUM(CASE WHEN event_type IN ('mastery_reached', 'mastery-reached') THEN 1 ELSE 0 END)
                AS mastery,
              COUNT(DISTINCT NULLIF(student_name, '')) AS students,
              SUM(CASE WHEN created_at >= ?
                        AND (event_type IN ('misconception', 'struggle', 'hint-exhausted')
                             OR ${MISS_ATTEMPT_SQL})
                   THEN 1 ELSE 0 END) AS recent_miss,
              MAX(created_at) AS last_at
         FROM lesson_telemetry
        WHERE created_at >= ? AND lesson_slug IS NOT NULL AND lesson_slug != ''
        GROUP BY lesson_slug, COALESCE(section, '')
        LIMIT 500`,
    )
      .bind(recentSince, since)
      .all();

    // Misconception tags per (lesson, section): parsed in JS (see header note).
    const tagRows = await env.DB.prepare(
      `SELECT lesson_slug, COALESCE(section, '') AS section, payload_json
         FROM lesson_telemetry
        WHERE event_type = 'misconception' AND created_at >= ?
          AND lesson_slug IS NOT NULL AND lesson_slug != ''
        ORDER BY id DESC LIMIT 4000`,
    )
      .bind(since)
      .all();

    const tagsByKey = new Map();
    for (const r of tagRows.results || []) {
      const tag = payloadTag(r.payload_json);
      if (!tag) continue;
      const k = r.lesson_slug + "|" + r.section;
      if (!tagsByKey.has(k)) tagsByKey.set(k, {});
      const bucket = tagsByKey.get(k);
      bucket[tag] = (bucket[tag] || 0) + 1;
    }
    const topTagsFor = (k) =>
      Object.entries(tagsByKey.get(k) || {})
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const rows = (agg.results || []).map((r) => {
      const misses = Number(r.misses) || 0;
      const misconceptions = Number(r.misconceptions) || 0;
      const struggles = Number(r.struggles) || 0;
      const recentMiss = Number(r.recent_miss) || 0;
      return {
        lessonSlug: r.lesson_slug,
        lessonTitle: r.lesson_title || r.lesson_slug,
        standard: r.standard || "",
        section: r.section || "",
        attempts: Number(r.attempts) || 0,
        misses,
        hints: Number(r.hints) || 0,
        misconceptions,
        struggles,
        mastery: Number(r.mastery) || 0,
        students: Number(r.students) || 0,
        recentMiss,
        priorMiss: Math.max(0, misses + misconceptions + struggles - recentMiss),
        lastAt: r.last_at || "",
        topTags: topTagsFor(r.lesson_slug + "|" + (r.section || "")),
      };
    });

    return json({ ok: true, days, recentDays, since, recentSince, count: rows.length, rows });
  } catch (err) {
    return json({ ok: false, error: "server-error", message: String(err) }, 500);
  }
}
