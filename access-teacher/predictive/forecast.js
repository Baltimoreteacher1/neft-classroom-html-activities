// Workspace layer over the gated forecasting engine (access-practice-lab/src/predict). It builds series and
// transitions from official results, runs the engine's validation once per series and era, and turns the
// engine's answer into a status chip. A number is shown ONLY when the engine's validation for the target era
// is "validated"; a provisional (experimental) model never shows a number here. The overall series is the
// REPORTED overall level; domain levels are never averaged into a composite.
import { SCALE_RESET_YEAR } from "../../access-practice-lab/src/lang/dna.js";
import { OFFICIAL_DOMAINS } from "../../access-practice-lab/src/lang/official-scores.js";
import { transitionsFromSeries } from "../../access-practice-lab/src/predict/models.js";
import {
  eraOf,
  forecastNext,
  validateEra,
} from "../../access-practice-lab/src/predict/validate.js";

export const SERIES_KEYS = Object.freeze([...OFFICIAL_DOMAINS, "Overall"]);
export const ERAS = Object.freeze(["pre-2025-reset", "post-2025-reset"]);
export { eraOf, SCALE_RESET_YEAR };

export const STATUS_WORDS = Object.freeze({
  validated: "Validated",
  experimental: "Experimental",
  insufficient: "Insufficient data",
  hypothetical: "Hypothetical",
});

/** "2024-25" -> "2025-26" */
export const nextYear = (y) => {
  const a = Number(y.slice(0, 4)) + 1;
  return `${a}-${String((a + 1) % 100).padStart(2, "0")}`;
};
export const prevYear = (y) => {
  const a = Number(y.slice(0, 4)) - 1;
  return `${a}-${String((a + 1) % 100).padStart(2, "0")}`;
};

/** School year a date falls in (July starts a new school year). */
export function schoolYearOf(date = new Date()) {
  const d = new Date(date);
  const start = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** One student's reported series for a domain or "Overall", oldest first: [{ year, level }]. */
export function seriesFor(student, key) {
  return (student.official || [])
    .map((r) => ({ year: r.year, level: key === "Overall" ? r.overall : r.levels?.[key] }))
    .filter((p) => typeof p.level === "number" && Number.isFinite(p.level))
    .sort((a, b) => a.year.localeCompare(b.year));
}

/** Transitions per series key from every student given (real class, or the synthetic training cohort). */
export function transitionsByKey(students) {
  const out = Object.fromEntries(SERIES_KEYS.map((k) => [k, []]));
  for (const st of students)
    for (const k of SERIES_KEYS) out[k].push(...transitionsFromSeries(st.id, k, seriesFor(st, k)));
  return out;
}

/** Engine validation for every series key and era. */
export function validateAll(byKey, { asOf = new Date().toISOString().slice(0, 10) } = {}) {
  return Object.fromEntries(
    SERIES_KEYS.map((k) => [
      k,
      Object.fromEntries(ERAS.map((era) => [era, validateEra(byKey[k], era, { asOf })])),
    ]),
  );
}

/** The year a forecast would be for: the year after the last report, or after the current school year. */
export function targetYearFor(series, today = new Date()) {
  return series.length ? nextYear(series.at(-1).year) : nextYear(schoolYearOf(today));
}

/** Descriptive trend over consecutive same-era reports. Arithmetic on reported levels, not a forecast. */
export function trendOf(series) {
  const steps = [];
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1];
    const b = series[i];
    if (nextYear(a.year) !== b.year) continue;
    steps.push({
      from: a.year,
      to: b.year,
      change: Math.round((b.level - a.level) * 10) / 10,
      crossesReset: eraOf(a.year) !== eraOf(b.year),
    });
  }
  const sameEra = steps.filter((x) => !x.crossesReset);
  const mean = sameEra.length ? sameEra.reduce((s, x) => s + x.change, 0) / sameEra.length : null;
  return {
    reports: series.length,
    last: series.at(-1) || null,
    steps,
    meanChange: mean == null ? null : Math.round(mean * 100) / 100,
    crossesReset: series.length > 1 && eraOf(series[0].year) !== eraOf(series.at(-1).year),
  };
}

/** Plain-language summary of why no number is shown. */
export function plainReason(reasons = []) {
  const text = reasons.join(" ");
  if (/No official result/.test(text)) return "No official result is on file for this domain yet.";
  if (/reset/.test(text))
    return `The last result is from before the ${SCALE_RESET_YEAR} ACCESS scale change, so it cannot be compared with the year being forecast.`;
  if (/training transitions|held-out|outcome year/.test(text))
    return "There are not enough past results in this scale era to test a forecasting model on students it has not seen. Forecasts stay hidden until a model passes that test.";
  if (/No model met/.test(text))
    return "No model passed the accuracy and calibration checks, so no number is shown.";
  return reasons[0] || "No validated model is available.";
}

/**
 * Forecast one student's series key. Returns `{ status, numbers|null, reasons, plain, targetYear, era,
 * trend, model }`; `numbers` exists only for status "validated".
 */
export function forecastFor({
  student,
  key,
  validations,
  byKey,
  threshold = null,
  today = new Date(),
}) {
  const series = seriesFor(student, key);
  const targetYear = targetYearFor(series, today);
  const era = eraOf(targetYear);
  const validation = validations?.[key]?.[era] || null;
  const trend = trendOf(series);
  let f;
  try {
    f = forecastNext({
      series,
      target: { year: targetYear, threshold },
      validation,
      transitions: byKey?.[key] || [],
      student: student.id,
      domain: key,
    });
  } catch (e) {
    f = { status: "insufficient-data", reasons: [e.message], numbers: null };
  }
  const validated = f.status === "validated" && f.production === true && f.numbers;
  const status = validated
    ? "validated"
    : f.status === "provisional"
      ? "experimental"
      : "insufficient";
  return {
    key,
    status,
    numbers: validated ? f.numbers : null,
    reasons: f.reasons || [],
    plain: validated
      ? ""
      : status === "experimental"
        ? "A model was fitted but did not pass every validation check, so its estimate is not shown."
        : plainReason(f.reasons),
    targetYear,
    era,
    trend,
    model: validated ? f.model : null,
    series,
  };
}
