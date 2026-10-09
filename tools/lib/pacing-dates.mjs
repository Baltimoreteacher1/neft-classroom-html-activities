/**
 * SY26-27 unit date helpers shared by the pacing importer and the parity gate.
 *
 * Canonical calendar dates live in docs/pacing-sources/plan-baseline.json and
 * are imported into data/pacing-unit-ranges.json. Any other representation of
 * those dates must be generated from, or compared against, that import.
 */

/** ISO `YYYY-MM-DD` → hub `M/D/YY` (local calendar, not UTC). */
export function usDate(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return null;
  return `${m}/${d}/${String(y).slice(2)}`;
}

/**
 * Compact per-sequence date map used as the hub's generated fallback.
 * Keys are strings because JSON / `window.__NT_PACING_DATES` stringify them.
 * Keys are the DISTRICT SEQUENCE (1 = Pre-Unit, 2 = Unit 3, …), never the
 * curriculum unit number, so every entry carries its `curriculum_unit` (null
 * for MSTAR). A consumer that labels curriculum units must resolve through
 * that field: looking `dates[unitNumber]` up directly put "Now" on Unit 2
 * while Unit 3 was being taught.
 */
export function datesFromRanges(ranges) {
  const units = Array.isArray(ranges) ? ranges : ranges?.units;
  const out = {};
  for (const unit of units || []) {
    out[String(unit.sequence)] = {
      start_date: usDate(unit.startDate),
      end_date: usDate(unit.endDate),
      instructional_days: unit.instructionalDays,
      curriculum_unit: unit.curriculumUnit ?? null,
    };
  }
  return out;
}

/**
 * Compact per-day schedule for the hub's "today's lesson" card:
 * `[date, lessonId, dayType, planTitle]` for every school day of the plan.
 * planTitle is emitted only when the day has no lesson, so a lesson's name is
 * always read from the curriculum manifest and can never go stale here.
 */
export function pacingDays(days) {
  return (days || [])
    .filter((day) => day.schoolStatus === "school")
    .map((day) => {
      const plan = day.plan || {};
      return [
        day.date,
        plan.lessonId || "",
        plan.dayType || "",
        plan.lessonId ? "" : plan.planTitle || "",
      ];
    });
}

export function diffPacingDates(expected, actual) {
  const diffs = [];
  const keys = new Set([...Object.keys(expected || {}), ...Object.keys(actual || {})]);
  for (const sequence of [...keys].sort((a, b) => Number(a) - Number(b))) {
    const want = expected?.[sequence];
    const got = actual?.[sequence];
    if (!want) {
      diffs.push({ sequence, kind: "extra" });
      continue;
    }
    if (!got) {
      diffs.push({ sequence, kind: "missing" });
      continue;
    }
    for (const field of ["start_date", "end_date", "instructional_days", "curriculum_unit"]) {
      if (want[field] !== got[field]) {
        diffs.push({ sequence, field, expected: want[field], actual: got[field] });
      }
    }
  }
  return diffs;
}

/**
 * True when the hand-authored district-pacing crosswalk still types its own
 * `start_date` / `end_date`. The generated `window.__NT_PACING_DATES` file is
 * the fallback; those keys may appear there, never in the crosswalk literals.
 */
export function authoredHasIndependentDates(src) {
  const cut = src.search(/window\.__NT_PACING_DATES|PACING-DATES:BEGIN|GENERATED_PACING_DATES/);
  const authored = cut >= 0 ? src.slice(0, cut) : src;
  return /\bstart_date\s*:/.test(authored) || /\bend_date\s*:/.test(authored);
}

/** Script tag that must load before the hub pacing module. */
export const PACING_DATES_SCRIPT = "/assets/pacing-unit-dates.generated.js";
export const PACING_DATES_MODULE = "assets/curriculum-district-pacing.js";
