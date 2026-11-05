// Forecast validation and the gate that decides whether ANY number may be shown.
// Split: students are separated (a student is in train or test, never both) AND time is respected (the test
// outcomes are the latest school year; training outcomes are earlier). Transitions that cross the 2025-26
// scale reset are dropped and counted. A model is "validated" only when it meets every criterion below on
// that held-out set; anything less withholds numerical forecasts.
import { SCALE_RESET_YEAR } from "../lang/dna.js";
import { fitModel, IMPLEMENTED, LEVEL_MAX, LEVEL_MIN } from "./models.js";
import { hash32, mean, normalCdf, normalInv } from "./stats.js";

export const VALIDATION_VERSION = "2026-11-05.1";
export const VALIDATION_CONFIG = Object.freeze({
  minTrain: 400,
  minTest: 200,
  intervalLevel: 0.8,
  coverageBand: [0.72, 0.88],
  maxCalibrationError: 0.06,
  minGainOverBaseline: 0.03, // a non-baseline model must cut MAE by 3% against persistence
  thresholds: [3.0, 3.5, 4.0, 4.5],
  testShare: 0.3,
});

export const eraOf = (year) => (year >= SCALE_RESET_YEAR ? "post-2025-reset" : "pre-2025-reset");
const sameEra = (t) => eraOf(t.from.year) === eraOf(t.to.year);

/** Probability that the REPORTED level (one decimal) is at least `threshold`. */
export const probAtLeast = (pred, threshold) =>
  1 - normalCdf((threshold - 0.05 - pred.mean) / pred.sd);

export function interval(pred, level = VALIDATION_CONFIG.intervalLevel) {
  const z = normalInv(0.5 + level / 2);
  return [
    Math.max(LEVEL_MIN, pred.mean - z * pred.sd),
    Math.min(LEVEL_MAX, pred.mean + z * pred.sd),
  ];
}

function calibration(pairs) {
  // pairs: [{ p, y }] ; ten equal-width bins; expected calibration error weighted by bin size.
  const bins = Array.from({ length: 10 }, (_, i) => ({
    lo: i / 10,
    hi: (i + 1) / 10,
    n: 0,
    p: 0,
    y: 0,
  }));
  for (const { p, y } of pairs) {
    const b = bins[Math.min(9, Math.floor(p * 10))];
    b.n++;
    b.p += p;
    b.y += y;
  }
  const rows = bins
    .filter((b) => b.n)
    .map((b) => ({ lo: b.lo, hi: b.hi, n: b.n, predicted: b.p / b.n, observed: b.y / b.n }));
  const ece = rows.reduce(
    (s, r) => s + (r.n / pairs.length) * Math.abs(r.predicted - r.observed),
    0,
  );
  return { rows, ece };
}

function score(model, test) {
  const err = [];
  let covered = 0;
  const brier = {};
  const probs = [];
  for (const thr of VALIDATION_CONFIG.thresholds) brier[thr] = [];
  for (const t of test) {
    const pred = model.predict(t);
    err.push(t.to.level - pred.mean);
    const [lo, hi] = interval(pred);
    if (t.to.level >= lo - 1e-9 && t.to.level <= hi + 1e-9) covered++;
    for (const thr of VALIDATION_CONFIG.thresholds) {
      const p = probAtLeast(pred, thr);
      const y = t.to.level >= thr ? 1 : 0;
      brier[thr].push((p - y) ** 2);
      probs.push({ p, y });
    }
  }
  const cal = calibration(probs);
  return {
    n: test.length,
    mae: mean(err.map(Math.abs)),
    rmse: Math.sqrt(mean(err.map((e) => e * e))),
    bias: mean(err),
    coverage: covered / test.length,
    brier: Object.fromEntries(Object.entries(brier).map(([k, v]) => [k, mean(v)])),
    calibrationError: cal.ece,
    calibration: cal.rows,
    residualSd: model.sd,
  };
}

/**
 * Split transitions for one era. Temporal when there are at least two outcome years; otherwise student-only,
 * which can never produce a "validated" status.
 */
export function splitTransitions(transitions, era) {
  const rows = transitions.filter((t) => eraOf(t.to.year) === era);
  const years = [...new Set(rows.map((t) => t.to.year))].sort();
  const isTest = (t) => (hash32(t.student) % 1000) / 1000 < VALIDATION_CONFIG.testShare;
  if (years.length >= 2) {
    const latest = years.at(-1);
    const test = rows.filter((t) => t.to.year === latest && isTest(t));
    const testStudents = new Set(test.map((t) => t.student));
    const train = rows.filter((t) => t.to.year < latest && !testStudents.has(t.student));
    return { train, test, temporal: true, outcomeYears: years, testYear: latest };
  }
  return {
    train: rows.filter((t) => !isTest(t)),
    test: rows.filter(isTest),
    temporal: false,
    outcomeYears: years,
    testYear: years[0] || null,
  };
}

/** Validate every implemented model for one era and decide the status. Deterministic for the same input. */
export function validateEra(transitions, era, { asOf = null } = {}) {
  const usable = transitions.filter(sameEra);
  const excludedCrossReset = transitions.length - usable.length;
  const { train, test, temporal, outcomeYears, testYear } = splitTransitions(usable, era);
  const reasons = [];
  const base = {
    version: VALIDATION_VERSION,
    era,
    asOf,
    nTrain: train.length,
    nTest: test.length,
    trainStudents: new Set(train.map((t) => t.student)).size,
    testStudents: new Set(test.map((t) => t.student)).size,
    temporal,
    outcomeYears,
    testYear,
    excludedCrossReset,
    config: VALIDATION_CONFIG,
  };
  if (train.length < VALIDATION_CONFIG.minTrain)
    reasons.push(
      `${train.length} training transitions in ${era}; at least ${VALIDATION_CONFIG.minTrain} are required.`,
    );
  if (test.length < VALIDATION_CONFIG.minTest)
    reasons.push(
      `${test.length} held-out transitions in ${era}; at least ${VALIDATION_CONFIG.minTest} are required.`,
    );
  if (!temporal)
    reasons.push(
      `Only ${outcomeYears.length} outcome year${outcomeYears.length === 1 ? "" : "s"} in ${era}; a time-based test needs at least two.`,
    );
  if (train.length < 30 || test.length < 1)
    return { ...base, status: "insufficient-data", reasons, models: {}, selected: null };

  const models = {};
  for (const id of IMPLEMENTED) {
    try {
      models[id] = score(fitModel(id, train), test);
    } catch (e) {
      models[id] = { error: e.message };
    }
  }
  const baseline = models.persistence;
  const passes = (id) => {
    const m = models[id];
    if (!m || m.error) return false;
    const [lo, hi] = VALIDATION_CONFIG.coverageBand;
    if (
      m.coverage < lo ||
      m.coverage > hi ||
      m.calibrationError > VALIDATION_CONFIG.maxCalibrationError
    )
      return false;
    return (
      id === "persistence" || m.mae <= baseline.mae * (1 - VALIDATION_CONFIG.minGainOverBaseline)
    );
  };
  const candidates = IMPLEMENTED.filter(passes).sort((a, b) => models[a].mae - models[b].mae);
  for (const id of IMPLEMENTED) models[id].passes = passes(id);
  const selected = candidates[0] || null;
  if (!selected)
    reasons.push(
      "No model met the coverage, calibration and baseline criteria on held-out students.",
    );
  const status =
    reasons.length === 0 ? "validated" : selected ? "provisional" : "insufficient-data";
  return { ...base, status, reasons, models, selected };
}

/**
 * Forecast for one student's next report. Numbers are returned ONLY when the validation for the target era
 * is "validated" (or "provisional", labelled experimental and never shown as a production forecast).
 * `series` is the student's own ordered reports in the target era, `target` `{ year, threshold }`.
 */
export function forecastNext({
  series,
  target,
  validation,
  transitions,
  formative = null,
  student = "self",
  domain = "",
}) {
  const reasons = [];
  const era = eraOf(target.year);
  const lastPoint = series.at(-1);
  if (!lastPoint) reasons.push("No official result is on file for this domain.");
  else if (eraOf(lastPoint.year) !== era)
    reasons.push(
      `The last result (${lastPoint.year}) is on the other side of the ${SCALE_RESET_YEAR} scale reset from ${target.year}; the two are not comparable.`,
    );
  if (!validation || validation.era !== era) reasons.push(`No validation has been run for ${era}.`);
  else if (validation.status === "insufficient-data") reasons.push(...validation.reasons);
  if (reasons.length) return { status: "insufficient-data", reasons, numbers: null };

  const model = fitModel(
    validation.selected,
    splitTransitions(transitions.filter(sameEra), era).train,
  );
  const t = {
    student,
    domain,
    from: lastPoint,
    to: { year: target.year, level: null },
    history: series.slice(0, -1).map((p) => p.level),
    formative,
  };
  const pred = model.predict(t);
  const [lo, hi] = interval(pred);
  return {
    status: validation.status,
    production: validation.status === "validated",
    label:
      validation.status === "validated"
        ? "Validated model"
        : "Experimental estimate: not validated",
    reasons: validation.reasons,
    model: {
      id: model.id,
      version: VALIDATION_VERSION,
      trainedOn: model.n,
      validatedAs: validation.status,
      testMae: validation.models[model.id].mae,
      testCoverage: validation.models[model.id].coverage,
    },
    numbers: {
      expected: Math.round(pred.mean * 10) / 10,
      interval80: [Math.round(lo * 10) / 10, Math.round(hi * 10) / 10],
      probabilityAtLeastTarget:
        target.threshold == null
          ? null
          : Math.round(probAtLeast(pred, target.threshold) * 100) / 100,
      sd: pred.sd,
    },
  };
}
