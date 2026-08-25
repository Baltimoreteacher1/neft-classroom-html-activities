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
 */
export function datesFromRanges(ranges) {
  const units = Array.isArray(ranges) ? ranges : ranges?.units;
  const out = {};
  for (const unit of units || []) {
    out[String(unit.sequence)] = {
      start_date: usDate(unit.startDate),
      end_date: usDate(unit.endDate),
      instructional_days: unit.instructionalDays,
    };
  }
  return out;
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
    for (const field of ["start_date", "end_date", "instructional_days"]) {
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
