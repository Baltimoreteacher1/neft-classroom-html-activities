// Our Class Investigation — the arithmetic.
//
// Pure functions over arrays of numbers. Two jobs:
//   1. Draw the class's data (bins for a histogram, counts for a bar chart).
//   2. CHECK a student's own answer. The tools never hand a student a result:
//      the student types the median, the percent, the ratio, and these functions
//      only say whether what they typed is right.
//
// Conventions match Grade 6 / Reveal Math and the engine's box-plot-builder:
// the median of an odd-sized list belongs to neither half when finding quartiles,
// and a value sitting on a bin boundary belongs to the bin it STARTS.

const EPS = 1e-9;

export const sortedCopy = (values) => [...values].sort((a, b) => a - b);

export function median(values) {
  if (!values.length) return null;
  const s = sortedCopy(values);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export const range = (values) => (values.length ? Math.max(...values) - Math.min(...values) : null);

/** Q1 / median / Q3 with the median left out of both halves when n is odd. */
export function quartiles(values) {
  if (values.length < 4) return null;
  const s = sortedCopy(values);
  const mid = Math.floor(s.length / 2);
  return {
    q1: median(s.slice(0, mid)),
    median: median(s),
    q3: median(s.length % 2 ? s.slice(mid + 1) : s.slice(mid)),
  };
}

export function iqr(values) {
  const q = quartiles(values);
  return q ? q.q3 - q.q1 : null;
}

/** Mean absolute deviation: the average distance from the mean. */
export function mad(values) {
  const m = mean(values);
  return m === null ? null : values.reduce((a, v) => a + Math.abs(v - m), 0) / values.length;
}

function standardDeviation(values) {
  const m = mean(values);
  if (m === null || values.length < 2) return null;
  return Math.sqrt(values.reduce((a, v) => a + (v - m) ** 2, 0) / values.length);
}

/**
 * Where the data bunches up. Pearson's second skewness, 3(mean - median) / sd.
 * Close to zero is "balanced"; positive means a long tail toward big numbers.
 * @returns {"balanced"|"low"|"high"|"borderline-low"|"borderline-high"|null}
 *   low  = bunched at the low end, tail to the right
 *   high = bunched at the high end, tail to the left
 */
export function shapeOf(values) {
  const sd = standardDeviation(values);
  if (values.length < 8 || !sd) return null;
  const skew = (3 * (mean(values) - median(values))) / sd;
  const a = Math.abs(skew);
  if (a < 0.2) return "balanced";
  const side = skew > 0 ? "low" : "high";
  return a < 0.4 ? `borderline-${side}` : side;
}

/** Tally of a categorical field: { walk: 6, bus: 9, ... } (only ids seen). */
export function countBy(values) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const v of values) out[v] = (out[v] || 0) + 1;
  return out;
}

export const percentOf = (part, whole) => (whole > 0 ? (part / whole) * 100 : null);

/** Pearson correlation coefficient, or null when it is not defined. */
export function correlation(pairs) {
  if (pairs.length < 3) return null;
  const mx = mean(pairs.map((p) => p.x));
  const my = mean(pairs.map((p) => p.y));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const { x, y } of pairs) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

/**
 * How two variables move together, in words a Grade 6 student can check against
 * the dots. Weak correlations are "borderline" so the tool can say a careful
 * answer either way is reasonable instead of marking a fair reading wrong.
 * @returns {"up"|"down"|"none"|"borderline-up"|"borderline-down"|null}
 */
export function trendOf(pairs) {
  const r = correlation(pairs);
  if (r === null) return null;
  const a = Math.abs(r);
  if (a < 0.25) return "none";
  const dir = r > 0 ? "up" : "down";
  return a < 0.5 ? `borderline-${dir}` : dir;
}

export function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

/** Whole-number multiple of a decimal with at most 3 places, else null. */
function scaleToWhole(a, b) {
  for (const k of [1, 2, 10, 100, 1000]) {
    const A = a * k;
    const B = b * k;
    if (Math.abs(A - Math.round(A)) < EPS && Math.abs(B - Math.round(B)) < EPS) {
      return [Math.round(A), Math.round(B)];
    }
  }
  return null;
}

/** a : b in simplest whole-number terms, e.g. 17.5 : 15 -> [7, 6]. */
export function simplestRatio(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  const whole = scaleToWhole(a, b);
  if (!whole) return null;
  const g = gcd(whole[0], whole[1]);
  return [whole[0] / g, whole[1] / g];
}

/**
 * Equal-width bins that cover the data, with a width from a short "nice" list so
 * the axis reads in 1s, 2s, 5s, 10s... A value on a boundary starts the next bin.
 * @returns {{ start: number, width: number, bins: { lo: number, hi: number, count: number }[] }}
 */
export function niceBins(values, targetBins = 8) {
  if (!values.length) return { start: 0, width: 1, bins: [] };
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const rough = Math.max((hi - lo) / targetBins, 0.5);
  const width = [0.5, 1, 2, 5, 10, 20, 50].find((w) => w >= rough) ?? 100;
  const start = Math.floor(lo / width) * width;
  const bins = [];
  for (let b = start; b <= hi; b += width) {
    bins.push({
      lo: b,
      hi: b + width,
      count: values.filter((v) => v >= b && v < b + width).length,
    });
  }
  return { start, width, bins };
}

/** Compact number for labels: 17.5, 18, never 17.500000001. */
export function fmt(n, places = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  const rounded = Math.round(n * 10 ** places) / 10 ** places;
  return String(rounded);
}

/** Is `given` the same as `expected` once both are rounded to `places`? */
export function sameNumber(expected, given, tolerance = 0.005) {
  return Number.isFinite(given) && Math.abs(expected - given) <= tolerance + EPS;
}
