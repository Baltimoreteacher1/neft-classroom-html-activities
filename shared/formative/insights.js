// What the class numbers mean: the dominant misconception, the top error types, the weekly trend, and CSV rows.
// Pure and deterministic. Every tie is broken the same way everywhere: higher count, then the catalog's own order,
// then the id (so two teachers looking at the same data see the same card).
import { LIMITS, recentWeeks } from "./constants.js";

const order = (catalog) => new Map(catalog.map((e, i) => [e.id, i]));

/** Total count per error id across rows [{ errorType, weekStart, count }]. */
export function totalsByType(rows) {
  const totals = new Map();
  for (const r of rows || [])
    totals.set(r.errorType, (totals.get(r.errorType) || 0) + (Number(r.count) || 0));
  return totals;
}

function ranked(rows, catalog) {
  const rank = order(catalog);
  return [...totalsByType(rows)]
    .filter(([id, n]) => n > 0 && rank.has(id))
    .sort((a, b) => b[1] - a[1] || rank.get(a[0]) - rank.get(b[0]) || (a[0] < b[0] ? -1 : 1))
    .map(([id, count]) => ({ entry: catalog[rank.get(id)], count }));
}

/**
 * The dominant misconception for a class on one ticket.
 *  - Nobody scored yet: null (nothing to say).
 *  - Everyone proficient: { needsReteach: false } with no card, so the Studio does not invent a problem.
 *  - Otherwise the most-tallied catalog entry; with no tallies, or a tie, the catalog order decides, so the unit's own
 *    common_language_misconception (always first) is the default.
 * @returns {null | { entry, count, basis: "tallies" | "unit-default", needsReteach: boolean, struggling: number }}
 */
export function dominantMisconception({ catalog, rows, dist }) {
  if (!dist.scored || !catalog.length) return null;
  const struggling = dist.counts.emerging + dist.counts.developing;
  if (!struggling) return { entry: null, count: 0, basis: "none", needsReteach: false, struggling };
  const top = ranked(rows, catalog)[0];
  if (top) return { ...top, basis: "tallies", needsReteach: true, struggling };
  return { entry: catalog[0], count: 0, basis: "unit-default", needsReteach: true, struggling };
}

/** The top error types (default 3) with their entry, total and share of all tallies. */
export function topErrors(rows, catalog, n = LIMITS.topErrors) {
  const list = ranked(rows, catalog);
  const all = list.reduce((s, r) => s + r.count, 0);
  return list
    .slice(0, n)
    .map((r) => ({ ...r, share: all ? Math.round((r.count * 100) / all) : 0 }));
}

/**
 * Weekly counts for the top error types, zero-filled, oldest week first. `direction` compares the latest week with
 * the one before it: "new" (first seen this week), "up", "down" or "flat".
 */
export function errorTrend(
  rows,
  catalog,
  now,
  { weeks = LIMITS.trendWeeks, n = LIMITS.topErrors } = {},
) {
  const span = recentWeeks(now, weeks);
  const series = topErrors(rows, catalog, n).map(({ entry }) => {
    const counts = span.map((w) =>
      (rows || [])
        .filter((r) => r.errorType === entry.id && r.weekStart === w)
        .reduce((s, r) => s + (Number(r.count) || 0), 0),
    );
    const last = counts[counts.length - 1];
    const before = counts[counts.length - 2] ?? 0;
    const direction =
      last && !before && counts.slice(0, -1).every((c) => !c)
        ? "new"
        : last > before
          ? "up"
          : last < before
            ? "down"
            : "flat";
    return { entry, counts, direction };
  });
  return { weeks: span, series };
}

// ---- CSV (the teacher's own download; nothing is sent anywhere) ---------------------------------------

/** One cell: quoted when needed, and a leading = + - @ or tab/CR is neutralised so a spreadsheet never runs it as a formula. */
export function csvCell(value) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export const toCsv = (header, rows) =>
  [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

export const SCORE_HEADER = ["unit", "ticket", "alias", "scored_by", "level"];
/** Rows for the scores file: one per scored alias per scorer. `roster` supplies the aliases. */
export function scoreRows({ ticketId, unitId, roster, scores }) {
  const out = [];
  for (const by of ["teacher", "self"])
    for (const s of roster)
      if (scores[by][s.studentId])
        out.push([unitId, ticketId, s.alias, by, scores[by][s.studentId]]);
  return out;
}

export const TREND_HEADER = ["unit", "error_type", "description", "week_start", "count"];
/** Rows for the error-trend file: every non-zero tally, oldest week first. */
export function trendRows({ unitId, rows, catalog }) {
  const by = new Map(catalog.map((e) => [e.id, e]));
  return [...(rows || [])]
    .filter((r) => r.count > 0 && by.has(r.errorType))
    .sort((a, b) =>
      a.weekStart < b.weekStart
        ? -1
        : a.weekStart > b.weekStart
          ? 1
          : a.errorType < b.errorType
            ? -1
            : 1,
    )
    .map((r) => [unitId, r.errorType, by.get(r.errorType).label, r.weekStart, r.count]);
}
