// Retention: which classes are past their end-of-year deadline, and the job that deletes them.
//
// Policy: a class is deleted GRACE_DAYS (30) after the end of the school year it was created in. The
// school year ends June 30 (UTC). A teacher may shorten the grace period for one class with
// settings_json.retentionGraceDays (0 to 30); a value above 30 or below 0 is ignored, so a class can
// never be kept longer than the default. This runs alongside the existing sweep in
// class-platform/store.js (pruneExpired), which removes a class unused for 120 days.
//
// `expiredClasses` is pure. `runRetention` is callable from a scheduled handler; nothing here is wired
// to a trigger. docs/runbooks/retention.md describes the wiring.
import { deleteClass } from "./delete.js";

export const GRACE_DAYS = 30;
const DAY_MS = 86_400_000;

/** End of the school year that contains `ms`: the next June 30, 23:59:59.999 UTC on or after it. */
export function schoolYearEnd(ms) {
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const thisJune = Date.UTC(year, 5, 30, 23, 59, 59, 999);
  return ms <= thisJune ? thisJune : Date.UTC(year + 1, 5, 30, 23, 59, 59, 999);
}

/** Grace days for a class: its own shorter value if valid, else the default. Never above the default. */
export function graceDaysFor(row, defaultDays = GRACE_DAYS) {
  let own = row.retentionGraceDays;
  if (own === undefined && row.settings_json) {
    try {
      own = JSON.parse(row.settings_json)?.retentionGraceDays;
    } catch {
      own = undefined;
    }
  }
  return Number.isInteger(own) && own >= 0 && own <= defaultDays ? own : defaultDays;
}

/** The moment a class is due for deletion. */
export const deleteAfter = (row, defaultDays = GRACE_DAYS) =>
  schoolYearEnd(Number(row.created_at)) + graceDaysFor(row, defaultDays) * DAY_MS;

/**
 * Codes of classes whose deadline has passed at `now`.
 * @param rows  [{ code, created_at (ms), settings_json? | retentionGraceDays? }]
 * @param retentionDays  default grace days after June 30 (default 30)
 */
export function expiredClasses(rows, now, retentionDays = GRACE_DAYS) {
  return rows
    .filter(
      (row) => Number.isFinite(Number(row.created_at)) && now > deleteAfter(row, retentionDays),
    )
    .map((row) => row.code)
    .sort();
}

/**
 * Scheduled-handler entry point: delete every class past its deadline, one receipt each.
 * Returns { checked, deleted: [{ code, receiptId }], failed: [{ code, error }] }.
 */
export async function runRetention(env, now = Date.now()) {
  if (!env?.DB) throw new Error("no D1 binding");
  const { results } = await env.DB.prepare(
    "SELECT code, created_at, settings_json FROM class_platform_class",
  ).all();
  const due = expiredClasses(results, now);
  const out = { checked: results.length, deleted: [], failed: [] };
  for (const code of due) {
    try {
      const { receipt } = await deleteClass(env.DB, { code, actor: "retention", now });
      out.deleted.push({ code, receiptId: receipt?.id ?? null });
    } catch (error) {
      out.failed.push({ code, error: String(error?.message || error) });
    }
  }
  return out;
}
