// Pulse Matrix rounds: mean as the balance point, mean absolute deviation, and
// the five-number summary (6.DS.1, 6.DS.3-6). Pure functions, no DOM: the game
// and tools/engines/u2-pulse-matrix.test.mjs share them.
//
// All judging is exact: every control sits on a half or quarter grid, so the
// comparisons are done on integers (2·value or 4·value) times the count.

import { randInt } from "../core/math.js";

export const MAXV = 12;
export const MAX_N = 11;
export const MAX_STACK = 5;
export const MODES = ["balance", "tension", "clamp"];

/** Round 1, 2, 3, 4… → balance, tension, clamp, balance… */
export function modeForRound(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

export function sortedCopy(values) {
  return Array.from(values).sort((a, b) => a - b);
}

export function sumOf(values) {
  let s = 0;
  for (let i = 0; i < values.length; i++) s += values[i];
  return s;
}

/** Median of an ascending list (integer or .5 for integer data). */
export function medianSorted(s) {
  const n = s.length;
  const h = n >> 1;
  return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

/**
 * Q1, median, Q3 by the median-of-halves rule the curriculum teaches: for an
 * odd count the median stays out of both halves. `inclusive` keeps it in (the
 * common error), used only to name that misconception.
 */
export function quartiles(values, inclusive = false) {
  const s = sortedCopy(values);
  const n = s.length;
  const h = n >> 1;
  const lowEnd = n % 2 && inclusive ? h + 1 : h;
  const highStart = n % 2 && !inclusive ? h + 1 : h;
  return {
    q1: medianSorted(s.slice(0, lowEnd)),
    med: medianSorted(s),
    q3: medianSorted(s.slice(highStart)),
    min: s[0],
    max: s[n - 1],
  };
}

/** Total distance from an integer mean: Σ|x − m|. */
export function totalStretch(values, m) {
  let t = 0;
  for (let i = 0; i < values.length; i++) t += Math.abs(values[i] - m);
  return t;
}

function maxFrequency(values) {
  const c = new Array(MAXV + 1).fill(0);
  let top = 0;
  for (const v of values) top = Math.max(top, ++c[v]);
  return top;
}

const N_RANGE = [null, [7, 8], [7, 10], [8, 11], [9, 11]];

/** A clustered set with an optional long tail, mirrored half the time. */
function rawData(level, next, n, skew) {
  const centre = skew ? randInt(next, 1, 4) : randInt(next, 3, 6);
  const spread = level === 1 ? 4 : 5;
  const tail = skew ? randInt(next, 1, Math.max(1, (n / 4) | 0)) : 0;
  const mirror = next() < 0.5;
  const out = [];
  for (let i = 0; i < n; i++) {
    let v = i < tail ? randInt(next, centre + 5, MAXV) : centre + randInt(next, 0, spread);
    if (v > MAXV) v = MAXV;
    out.push(mirror ? MAXV - v : v);
  }
  return out;
}

/**
 * One round's data for a mode. Values are integers 0..12, 7-11 points, no
 * column taller than the shelf holds, and the target statistic lands on the
 * control grid (mean on halves, MAD on quarters, quartiles on halves).
 * @param {"balance"|"tension"|"clamp"} mode @param {number} level @param {() => number} next
 */
export function makeRound(mode, level, next) {
  const [lo, hi] = N_RANGE[level];
  for (let tries = 0; tries < 20000; tries++) {
    const n = randInt(next, lo, hi);
    const skew = mode === "balance" ? level >= 2 : level >= 3 && next() < 0.5;
    const values = rawData(level, next, n, skew);
    if (maxFrequency(values) > MAX_STACK) continue;
    const sum = sumOf(values);
    const q = quartiles(values);
    if (mode === "balance") {
      if ((2 * sum) % n) continue; // mean on the half grid
      const mean = sum / n;
      if (mean < 1 || mean > MAXV - 1) continue;
      if (level >= 2 && Math.abs(sum - q.med * n) < n) continue; // mean and median at least 1 apart
      return { mode, values: sortedCopy(values), n, mean, median: q.med };
    }
    if (mode === "tension") {
      if (sum % n) continue; // integer mean: the anchor sits on a whole mark
      const mean = sum / n;
      const stretch = totalStretch(values, mean);
      if ((4 * stretch) % n) continue; // MAD on the quarter grid
      const mad = stretch / n;
      if (mad < 0.5 || mad > 6) continue;
      if (level >= 3 && Number.isInteger(mad) && next() < 0.7) continue;
      return { mode, values: sortedCopy(values), n, mean, stretch, mad };
    }
    if (level >= 3 && n % 2 && next() < 0.5) continue; // more even counts (half-value quartiles)
    if (q.med < 2) continue; // the parked clamps (0, 1, 2) can never already match
    return {
      mode,
      values: sortedCopy(values),
      n,
      q1: q.q1,
      med: q.med,
      q3: q.q3,
      min: q.min,
      max: q.max,
    };
  }
  throw new Error(`pulse-matrix: no ${mode} data for level ${level}`);
}

/** Where the balance fulcrum parks: the end of the shelf farther from the mean. */
export function parkFulcrum(mean) {
  return mean >= MAXV / 2 ? 0 : MAXV;
}

export const CLAMP_PARK = { q1: 0, med: 1, q3: 2 };

/**
 * Lock the fulcrum at f (on the half grid).
 * @returns {"ok"|"median"|"low"|"high"} low = fulcrum left of the balance point
 */
export function judgeBalance(round, f) {
  const sum = sumOf(round.values);
  const twice = 2 * f * round.n; // integer: f is on the half grid
  if (twice === 2 * sum) return "ok";
  if (f === round.median) return "median";
  return twice < 2 * sum ? "low" : "high";
}

/**
 * Set the MAD dial to d (quarter grid).
 * @returns {"ok"|"sum"|"low"|"high"}
 */
export function judgeTension(round, d) {
  const want = 4 * round.stretch; // 4·Σ|x−m|
  const got = Math.round(4 * d) * round.n; // 4·d·n
  if (got === want) return "ok";
  if (d === round.stretch) return "sum";
  return got < want ? "low" : "high";
}

/**
 * Judge the three clamps in teaching order: median, then Q1, then Q3.
 * @returns {{verdict: "ok"|"medHigh"|"medLow"|"q1High"|"q1Low"|"q3High"|"q3Low", included: boolean}}
 */
export function judgeClamp(round, q1, med, q3) {
  const inc = quartiles(round.values, true);
  const odd = round.n % 2 === 1;
  if (med !== round.med)
    return { verdict: med > round.med ? "medHigh" : "medLow", included: false };
  if (q1 !== round.q1)
    return { verdict: q1 > round.q1 ? "q1High" : "q1Low", included: odd && q1 === inc.q1 };
  if (q3 !== round.q3)
    return { verdict: q3 > round.q3 ? "q3High" : "q3Low", included: odd && q3 === inc.q3 };
  return { verdict: "ok", included: false };
}

/** Decimal text for halves and quarters without binary noise. */
export function numText(v) {
  return String(Math.round(v * 100) / 100);
}
