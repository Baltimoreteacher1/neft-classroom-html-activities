/* =============================================================================
 * Owner dashboard overview API (GET /api/owner/overview?days=14).
 *
 * Strictly read-only and gated by `x-teacher-key` == env.TEACHER_KEY.
 * Returns aggregate telemetry and class-platform counts only — zero student
 * aliases, student IDs, keys, or individual work rows are ever returned.
 * ========================================================================== */

import { sameKey } from "../../_lib/class-platform/store.js";
import { handler, json } from "../../_lib/http.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDayOffset(now, daysAgo) {
  return new Date(now - daysAgo * DAY_MS).toISOString().slice(0, 10);
}

async function safeAll(db, sql, ...binds) {
  try {
    const res = await db
      .prepare(sql)
      .bind(...binds)
      .all();
    return res?.results || [];
  } catch {
    return [];
  }
}

async function safeFirst(db, sql, ...binds) {
  try {
    return (
      (await db
        .prepare(sql)
        .bind(...binds)
        .first()) || null
    );
  } catch {
    return null;
  }
}

export const onRequest = handler({
  methods: ["GET"],
  async handle({ request, env }) {
    if (!env.TEACHER_KEY) {
      return json({ ok: false, error: "teacher-key-not-configured" }, 503);
    }
    const supplied = request.headers.get("x-teacher-key") || "";
    if (!supplied || !sameKey(supplied, env.TEACHER_KEY)) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    if (!env.DB) {
      return json({ ok: false, error: "backend-not-configured" }, 503);
    }

    const url = new URL(request.url);
    const days = Math.min(90, Math.max(1, Math.trunc(Number(url.searchParams.get("days")) || 14)));
    const now = Date.now();
    const sinceDay = utcDayOffset(now, days - 1);
    const errorSinceDay = utcDayOffset(now, Math.min(days, 7) - 1);
    const weekAgoMs = now - 7 * DAY_MS;

    const [
      usageTotals,
      usageByArea,
      usageByDevice,
      topPages,
      errorTotals,
      topErrors,
      vitalsRows,
      classRows,
      studentCountRow,
      astatusRows,
      libraryRows,
    ] = await Promise.all([
      safeFirst(
        env.DB,
        `SELECT COALESCE(SUM(views), 0) AS views, COUNT(DISTINCT path) AS pages FROM usage_signal WHERE day >= ?`,
        sinceDay,
      ),
      safeAll(
        env.DB,
        `SELECT COALESCE(area, 'other') AS area, SUM(views) AS views
         FROM usage_signal WHERE day >= ?
         GROUP BY area ORDER BY views DESC LIMIT 12`,
        sinceDay,
      ),
      safeAll(
        env.DB,
        `SELECT COALESCE(device, 'unknown') AS device, SUM(views) AS views
         FROM usage_signal WHERE day >= ?
         GROUP BY device ORDER BY views DESC`,
        sinceDay,
      ),
      safeAll(
        env.DB,
        `SELECT path, COALESCE(area, 'other') AS area, SUM(views) AS views
         FROM usage_signal WHERE day >= ?
         GROUP BY path ORDER BY views DESC LIMIT 15`,
        sinceDay,
      ),
      safeFirst(
        env.DB,
        `SELECT COALESCE(SUM(count), 0) AS total, COUNT(*) AS distinct_errors FROM client_error WHERE day >= ?`,
        errorSinceDay,
      ),
      safeAll(
        env.DB,
        `SELECT path, message, SUM(count) AS count, MAX(day) AS last_day
         FROM client_error WHERE day >= ?
         GROUP BY path, message ORDER BY count DESC LIMIT 10`,
        errorSinceDay,
      ),
      safeAll(
        env.DB,
        `SELECT metric, rating, SUM(samples) AS samples
         FROM web_vital WHERE day >= ?
         GROUP BY metric, rating`,
        sinceDay,
      ),
      safeAll(
        env.DB,
        `SELECT app, COUNT(*) AS classes,
                SUM(CASE WHEN last_active_at >= ? THEN 1 ELSE 0 END) AS active_7d
         FROM class_platform_class
         WHERE expires_at >= ?
         GROUP BY app`,
        weekAgoMs,
        now,
      ),
      safeFirst(
        env.DB,
        `SELECT COUNT(*) AS seats
         FROM class_platform_student s
         JOIN class_platform_class c ON c.code = s.code
         WHERE c.expires_at >= ?`,
        now,
      ),
      safeAll(env.DB, `SELECT state, COUNT(*) AS count FROM class_platform_astatus GROUP BY state`),
      safeAll(
        env.DB,
        `SELECT kind, COUNT(*) AS count FROM class_platform_teacher_library WHERE deleted = 0 GROUP BY kind`,
      ),
    ]);

    const vitals = {};
    for (const r of vitalsRows) {
      vitals[r.metric] ||= { good: 0, "needs-improvement": 0, poor: 0 };
      vitals[r.metric][r.rating] = Number(r.samples) || 0;
    }

    const classesByApp = {};
    let totalClasses = 0;
    let activeClasses7d = 0;
    for (const r of classRows) {
      const n = Number(r.classes) || 0;
      const a = Number(r.active_7d) || 0;
      classesByApp[r.app] = { classes: n, active7d: a };
      totalClasses += n;
      activeClasses7d += a;
    }

    const assignmentStates = {};
    for (const r of astatusRows) assignmentStates[r.state] = Number(r.count) || 0;

    const libraryByKind = {};
    for (const r of libraryRows) libraryByKind[r.kind] = Number(r.count) || 0;

    return {
      ok: true,
      generatedAt: now,
      windowDays: days,
      usage: {
        views: Number(usageTotals?.views) || 0,
        uniquePages: Number(usageTotals?.pages) || 0,
        byArea: usageByArea.map((r) => ({ area: r.area, views: Number(r.views) || 0 })),
        byDevice: usageByDevice.map((r) => ({ device: r.device, views: Number(r.views) || 0 })),
        topPages: topPages.map((r) => ({
          path: r.path,
          area: r.area,
          views: Number(r.views) || 0,
        })),
      },
      errors: {
        total: Number(errorTotals?.total) || 0,
        distinct: Number(errorTotals?.distinct_errors) || 0,
        top: topErrors.map((r) => ({
          path: r.path,
          message: r.message,
          count: Number(r.count) || 0,
          lastDay: r.last_day,
        })),
      },
      vitals,
      platform: {
        totalClasses,
        activeClasses7d,
        classesByApp,
        studentSeats: Number(studentCountRow?.seats) || 0,
        assignmentStates,
        libraryByKind,
      },
    };
  },
});
