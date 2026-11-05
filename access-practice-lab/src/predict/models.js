// Candidate models for the NEXT reported level of one domain (or the overall composite level) one year ahead.
// Baselines come first and stay in the registry: a richer model is only allowed to replace them when
// validate.js shows it beats them on students and years it never saw. Intervals come from out-of-fold
// residuals, so the width reflects error on unseen students, not the fit to the training rows.
import { clamp, hash32, ols, ridge, sd } from "./stats.js";

export const MODELS_VERSION = "2026-11-05.1";
export const LEVEL_MIN = 1;
export const LEVEL_MAX = 6;
const FOLDS = 5;

/**
 * A transition: one student, one domain, consecutive school years in the same scale era.
 * `history` is every level BEFORE `from` (oldest first). `formative` is the share of independent practice
 * in the year before `to`, or null when the lab has none; it is never time-on-task.
 * `{ student, domain, from: {year, level}, to: {year, level}, history: [..], formative }`
 */
const last = (t) => t.from.level;
const prevChange = (t) => (t.history.length ? t.from.level - t.history.at(-1) : null);

export const MODEL_REGISTRY = Object.freeze([
  {
    id: "persistence",
    family: "baseline",
    implemented: true,
    summary: "Next level equals the last reported level.",
  },
  {
    id: "level-adjusted-growth",
    family: "baseline",
    implemented: true,
    summary: "Typical change depends on the starting level, fitted on training students.",
  },
  {
    id: "shrunk-trend",
    family: "longitudinal",
    implemented: true,
    summary:
      "A student's own trend over 3+ reports, shrunk toward the typical change for the starting level (simple empirical-Bayes-style weight n/(n+k)).",
  },
  {
    id: "ridge",
    family: "regularized-regression",
    implemented: true,
    summary:
      "Ridge regression on last level, last change and, only when available for most rows, independent-practice share.",
  },
  {
    id: "gradient-boosting",
    family: "boosted",
    implemented: false,
    summary:
      "Not implemented. Requires at least 1,000 same-era transitions and a demonstrated gain over ridge before it is built.",
  },
  {
    id: "bayesian-hierarchical",
    family: "bayesian",
    implemented: false,
    summary:
      "Not implemented. The shrunk-trend model is the transparent stand-in; a hierarchical fit needs MCMC and enough students per school and grade.",
  },
]);

const FITTERS = {
  persistence: () => ({ predict: (t) => last(t) }),
  "level-adjusted-growth": (train) => {
    const fit = ols(
      train.map(last),
      train.map((t) => t.to.level - t.from.level),
    );
    return { predict: (t) => last(t) + fit.intercept + fit.slope * last(t) };
  },
  "shrunk-trend": (train, { k = 2 } = {}) => {
    const pop = ols(
      train.map(last),
      train.map((t) => t.to.level - t.from.level),
    );
    return {
      predict: (t) => {
        const popDelta = pop.intercept + pop.slope * last(t);
        const pts = [...t.history, t.from.level];
        if (pts.length < 3) return last(t) + popDelta;
        const slope = ols(
          pts.map((_, i) => i),
          pts,
        ).slope;
        const w = pts.length / (pts.length + k);
        return last(t) + (1 - w) * popDelta + w * slope;
      },
    };
  },
  ridge: (train, { lambda = 1 } = {}) => {
    const useFormative = train.filter((t) => t.formative != null).length / train.length >= 0.8;
    const row = (t) => [
      last(t),
      prevChange(t) ?? 0,
      prevChange(t) == null ? 1 : 0,
      ...(useFormative ? [t.formative ?? 0] : []),
    ];
    const model = ridge(
      train.map(row),
      train.map((t) => t.to.level - t.from.level),
      lambda,
    );
    return { usesFormative: useFormative, predict: (t) => last(t) + model.predict(row(t)) };
  },
};

export const IMPLEMENTED = Object.freeze(Object.keys(FITTERS));

function folds(rows) {
  const f = Array.from({ length: FOLDS }, () => []);
  for (const t of rows) f[hash32(t.student) % FOLDS].push(t);
  return f;
}

/** Out-of-fold residual SD, student-grouped, so interval width reflects error on students the model has not seen. */
function crossResidualSd(id, rows, options) {
  const parts = folds(rows);
  const res = [];
  for (let i = 0; i < FOLDS; i++) {
    const train = parts.filter((_, j) => j !== i).flat();
    if (train.length < 20 || !parts[i].length) continue;
    const m = FITTERS[id](train, options);
    for (const t of parts[i]) res.push(t.to.level - m.predict(t));
  }
  return sd(res);
}

/** Fit a model on training transitions. Returns `{ id, n, sd, predict(t) -> {mean, sd} }`. */
export function fitModel(id, train, options = {}) {
  if (!FITTERS[id]) throw new Error(`model "${id}" is not implemented`);
  if (train.length < 30)
    throw new Error(`only ${train.length} training transitions; need at least 30 to fit`);
  const model = FITTERS[id](train, options);
  const sigma = crossResidualSd(id, train, options);
  return {
    id,
    n: train.length,
    sd: sigma,
    usesFormative: Boolean(model.usesFormative),
    predict: (t) => ({ mean: clamp(model.predict(t), LEVEL_MIN, LEVEL_MAX), sd: sigma }),
  };
}

/** Transitions from one student's ordered series of `{ year, level }` within one era (consecutive school years only). */
export function transitionsFromSeries(student, domain, series, formativeByYear = {}) {
  const out = [];
  const nextYear = (y) =>
    `${Number(y.slice(0, 4)) + 1}-${String((Number(y.slice(0, 4)) + 2) % 100).padStart(2, "0")}`;
  for (let i = 0; i + 1 < series.length; i++) {
    if (nextYear(series[i].year) !== series[i + 1].year) continue;
    out.push({
      student,
      domain,
      from: series[i],
      to: series[i + 1],
      history: series.slice(0, i).map((p) => p.level),
      formative: formativeByYear[series[i + 1].year] ?? null,
    });
  }
  return out;
}

