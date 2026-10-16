// Our Class Investigation — what each unit asks of the class's data.
//
// Every function here CHECKS a number or choice the student produced. None of
// them returns the answer for display: the student types the ratio, the percent,
// the median, the point, and gets back a short code ("correct", "flipped", ...)
// that the page turns into a hint. A wrong answer never prints the solution; the
// hint ladder (see hintStage) goes method first, then one concrete step, then a
// nudge toward the teacher, and never the answer itself.
//
// Pure: no DOM, no network.

import {
  gcd,
  iqr,
  mean,
  median,
  percentOf,
  range,
  sameNumber,
  shapeOf,
  simplestRatio,
  trendOf,
} from "./stats.js";

const isNum = (n) => typeof n === "number" && Number.isFinite(n);

/**
 * Which rung of the hint ladder a student is on, from how many tries they have
 * made on this question. 0 tries = no hint yet.
 * @returns {0|1|2|3}
 */
export function hintStage(tries) {
  if (tries <= 0) return 0;
  return /** @type {1|2|3} */ (Math.min(tries, 3));
}

/* ── Unit 3: ratios and rates ─────────────────────────────────────────────── */

/**
 * "Write the ratio A : B in simplest form." The student gives two whole numbers.
 * @returns {{ code: "correct"|"equivalent"|"flipped"|"wrong"|"invalid" }}
 */
export function checkRatio(a, b, given) {
  const { p, q } = given ?? {};
  if (!isNum(p) || !isNum(q) || p <= 0 || q <= 0) return { code: "invalid" };
  const want = simplestRatio(a, b);
  if (!want) return { code: "invalid" };
  const sameRatio = Math.abs(p * b - q * a) < 1e-6;
  const flipped = Math.abs(p * a - q * b) < 1e-6;
  if (sameRatio) {
    const simplest = Number.isInteger(p) && Number.isInteger(q) && gcd(p, q) === 1;
    return { code: simplest ? "correct" : "equivalent" };
  }
  return { code: flipped ? "flipped" : "wrong" };
}

/**
 * "For every 1 of B, how many of A?" to the nearest hundredth.
 * @returns {{ code: "correct"|"flipped"|"wrong"|"invalid" }}
 */
export function checkUnitRate(a, b, given) {
  if (!isNum(given) || given <= 0 || !(b > 0)) return { code: "invalid" };
  if (sameNumber(a / b, given, 0.0051)) return { code: "correct" };
  if (sameNumber(b / a, given, 0.0051)) return { code: "flipped" };
  return { code: "wrong" };
}

/* ── Unit 4: percentages ──────────────────────────────────────────────────── */

/**
 * "What percent of the class chose this?" A whole-number percent is fine; the
 * exact percent is fine too.
 * @returns {{ code: "correct"|"count"|"decimal"|"wrong"|"invalid" }}
 */
export function checkPercent(part, whole, given) {
  if (!isNum(given) || given < 0 || !(whole > 0)) return { code: "invalid" };
  const exact = percentOf(part, whole);
  if (Math.abs(exact - given) <= 0.5 + 1e-9) return { code: "correct" };
  if (given === part) return { code: "count" };
  if (given <= 1 && Math.abs(part / whole - given) <= 0.005) return { code: "decimal" };
  return { code: "wrong" };
}

/* ── Unit 7: the coordinate plane ─────────────────────────────────────────── */

/**
 * "Read the ordered pair of the highlighted dot." Half-step data, so reading to
 * the nearest whole unit is the honest tolerance.
 * @returns {{ code: "correct"|"swapped"|"wrong"|"invalid" }}
 */
export function checkReadPoint(point, given) {
  const { x, y } = given ?? {};
  if (!isNum(x) || !isNum(y)) return { code: "invalid" };
  const close = (want, got) => Math.abs(want - got) <= 1 + 1e-9;
  if (close(point.x, x) && close(point.y, y)) return { code: "correct" };
  if (close(point.x, y) && close(point.y, x)) return { code: "swapped" };
  return { code: "wrong" };
}

/* ── Unit 9: relationships between two variables ──────────────────────────── */

/**
 * "As x gets bigger, y tends to ..." choice is "up" | "down" | "none".
 * @returns {{ code: "correct"|"close"|"wrong"|"invalid" }}
 */
export function checkTrend(pairs, choice) {
  const truth = trendOf(pairs);
  if (!truth || !["up", "down", "none"].includes(choice)) return { code: "invalid" };
  if (truth === choice) return { code: "correct" };
  if (truth === `borderline-${choice}` || (choice === "none" && truth.startsWith("borderline"))) {
    return { code: "close" };
  }
  return { code: "wrong" };
}

/**
 * "Pick an x. About what y would you expect?" Reasonable = inside the span of the
 * y values of the five dots nearest that x, give or take one step.
 * @returns {{ code: "correct"|"low"|"high"|"invalid" }}
 */
export function checkPrediction(pairs, x, given, step = 0.5) {
  if (!isNum(given) || !isNum(x) || pairs.length < 5) return { code: "invalid" };
  const near = [...pairs].sort((p, q) => Math.abs(p.x - x) - Math.abs(q.x - x)).slice(0, 5);
  const ys = near.map((p) => p.y);
  const lo = Math.min(...ys) - step;
  const hi = Math.max(...ys) + step;
  if (given < lo) return { code: "low" };
  if (given > hi) return { code: "high" };
  return { code: "correct" };
}

/** The five dots a prediction is judged against, so a hint can point at them. */
export function nearestPairs(pairs, x, n = 5) {
  return [...pairs].sort((p, q) => Math.abs(p.x - x) - Math.abs(q.x - x)).slice(0, n);
}

/* ── Unit 2: center, spread, shape ────────────────────────────────────────── */

export const STAT_KINDS = Object.freeze(["median", "mean", "range", "iqr"]);

const STAT_FN = { median, mean, range, iqr };

/**
 * The student types a statistic. Mean is accepted to the nearest tenth.
 * @returns {{ code: "correct"|"wrong"|"invalid" }}
 */
export function checkStat(kind, values, given) {
  const fn = STAT_FN[kind];
  if (!fn || !isNum(given) || values.length < 4) return { code: "invalid" };
  const want = fn(values);
  const tol = kind === "mean" ? 0.05 : 0.0051;
  return { code: sameNumber(want, given, tol) ? "correct" : "wrong" };
}

/**
 * "Where does the data bunch up?" choice is "balanced" | "low" | "high".
 * A close call accepts either honest reading.
 * @returns {{ code: "correct"|"close"|"wrong"|"invalid" }}
 */
export function checkShape(values, choice) {
  const truth = shapeOf(values);
  if (!truth || !["balanced", "low", "high"].includes(choice)) return { code: "invalid" };
  if (truth === choice) return { code: "correct" };
  if (
    truth.startsWith("borderline") &&
    (choice === "balanced" || truth === `borderline-${choice}`)
  ) {
    return { code: "close" };
  }
  return { code: "wrong" };
}

/** Everything the page may SHOW after a student has committed their own answers. */
export function classSummary(values) {
  return {
    n: values.length,
    median: median(values),
    mean: mean(values),
    range: range(values),
    iqr: iqr(values),
    shape: shapeOf(values),
  };
}
