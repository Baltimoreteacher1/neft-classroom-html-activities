// Day -> date mapping for the exports. `days` is the district pacing calendar (data/pacing-baseline-2026-27.json days[]),
// or null for plain Monday-Friday weekdays. Pure: no fetch, no clock.

const NOT_TAUGHT = new Set(["MCAP / Testing"]);

const addDay = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const isWeekday = (iso) => {
  const w = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return w >= 1 && w <= 5;
};

/** True when the pacing calendar teaches on this day (a school day that is not a testing day). */
export const isTeachingDay = (day) =>
  day.schoolStatus === "school" && !NOT_TAUGHT.has(day.plan?.dayType);

/**
 * The next `count` teaching dates on or after `start`.
 * With a pacing calendar: its teaching days. Without: Monday-Friday.
 * Returns null when the calendar runs out, so the caller can say so instead of inventing dates.
 */
export function pickDates(days, start, count) {
  if (days) {
    const out = [];
    for (const d of days) {
      if (out.length === count) break;
      if (d.date >= start && isTeachingDay(d)) out.push(d.date);
    }
    return out.length === count ? out : null;
  }
  const out = [];
  let cur = start;
  while (out.length < count) {
    if (isWeekday(cur)) out.push(cur);
    cur = addDay(cur);
  }
  return out;
}
