// Bio-Resonance Mixer rounds: ratios and rates (6.AT.1, 6.AT.2, 6.AT.3, 6.AT.3a, 6.AT.3c).
// Pure functions, no DOM: the game and tools/engines/u3-ratio-mixer.test.mjs share them.
// Every comparison is integer cross-multiplication or exact quarter arithmetic.

import { gcd, lcm, pick, randInt } from "../core/math.js";

export const MODES = ["equiv", "rate", "compare", "convert"];
export const VALVE_MAX = 50;
export const RATE_MAX = 8;
export const RATE_STEP = 0.25;
export const COMMON_MAX = 60;
export const DIV_STEP = 0.25;
export const DIV_MAX = 10;

/** Round 1 equivalent, 2 unit rate, 3 compare, 4 convert, then repeat. */
export function modeForRound(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

/** Share of A in an A:B mixture as an integer 0..100, or -1 when empty. */
export function mixIndex(a, b) {
  const t = a + b;
  if (t <= 0) return -1;
  return Math.round((100 * a) / t);
}

function coprimePair(next, max) {
  for (;;) {
    const a = randInt(next, 1, max);
    const b = randInt(next, 1, max);
    if (a !== b && gcd(a, b) === 1) return [a, b];
  }
}

/**
 * EQUIVALENT round. variant "scale": the tank holds A = a·k, find B.
 * variant "total": fill exactly (a+b)·k units, find both A and B.
 */
export function makeEquiv(level, next) {
  const [a, b] = coprimePair(next, level >= 3 ? 6 : 5);
  const variant = next() < 0.5 ? "scale" : "total";
  const kCap = level === 1 ? 4 : level === 2 ? 6 : 8;
  const kMax = Math.min(kCap, Math.floor(VALVE_MAX / Math.max(a, b)));
  const k = randInt(next, 2, kMax);
  return { mode: "equiv", variant, a, b, k, A: a * k, B: b * k, total: (a + b) * k };
}

/** @returns {"ok"|"overTotal"|"underTotal"|"additive"|"tooTeal"|"tooAmber"} */
export function judgeEquiv(q, A, B) {
  if (q.variant === "total") {
    const t = A + B;
    if (t > q.total) return "overTotal";
    if (t < q.total) return "underTotal";
  }
  const lhs = A * q.b;
  const rhs = B * q.a;
  if (lhs === rhs && A > 0) return "ok";
  if (q.variant === "scale" && B - A === q.b - q.a) return "additive";
  return lhs > rhs ? "tooTeal" : "tooAmber";
}

/**
 * UNIT RATE round: c cycles delivered q units; the rate is num/den units per
 * cycle on the dial's quarter grid. Level 1 whole, 2 halves, 3-4 halves or quarters.
 */
export function makeRate(level, next) {
  const den = level === 1 ? 1 : level === 2 ? 2 : pick(next, [2, 4]);
  let num;
  do num = randInt(next, Math.max(2, den + 1), 6 * den);
  while (den > 1 && num % den === 0);
  const c = den * randInt(next, 2, den === 4 ? 3 : den === 2 ? 5 : 8);
  return { mode: "rate", den, num, rate: num / den, c, q: (num * c) / den };
}

/** @returns {"ok"|"inverted"|"rateHigh"|"rateLow"} */
export function judgeRate(q, r) {
  const r4 = Math.round(r * 4);
  const lhs = r4 * q.c;
  const rhs = q.q * 4;
  if (lhs === rhs) return "ok";
  if (r4 > 0 && r4 * q.q === 4 * q.c) return "inverted";
  return lhs > rhs ? "rateHigh" : "rateLow";
}

/** COMPARE round: two ratios that are NOT equivalent; which is stronger in A? */
export function makeCompare(level, next) {
  const max = level >= 3 ? 7 : 5;
  for (;;) {
    const [a1, b1] = coprimePair(next, max);
    const [a2, b2] = coprimePair(next, max);
    if (a1 * b2 === a2 * b1) continue;
    if (Math.max(a1, a2) < 2) continue;
    const common = lcm(a1, a2);
    if (common > 30) continue;
    return { mode: "compare", a1, b1, a2, b2, common, stronger: a1 * b2 > a2 * b1 ? 1 : 2 };
  }
}

/** @returns {"ok"|"noPick"|"notCommon1"|"notCommon2"|"wrongPick"} */
export function judgeCompare(q, chosen, v) {
  if (chosen !== 1 && chosen !== 2) return "noPick";
  if (v <= 0 || v % q.a1 !== 0) return "notCommon1";
  if (v % q.a2 !== 0) return "notCommon2";
  return chosen === q.stronger ? "ok" : "wrongPick";
}

/**
 * Conversion pairs. mul = big unit to small unit (multiply by f); div = small
 * to big (divide by f). Steps keep every answer exactly on the output dial.
 */
export const CONVERSIONS = [
  { big: "ft", small: "in", f: 12, mulStep: 1, mulMax: 120, nStep: 1, nMax: 9, divUnit: 0.5 },
  { big: "yd", small: "ft", f: 3, mulStep: 1, mulMax: 40, nStep: 1, nMax: 12, divUnit: 1 },
  { big: "m", small: "cm", f: 100, mulStep: 25, mulMax: 600, nStep: 0.25, nMax: 5, divUnit: 0.25 },
  {
    big: "kg",
    small: "g",
    f: 1000,
    mulStep: 250,
    mulMax: 6000,
    nStep: 0.25,
    nMax: 5,
    divUnit: 0.25,
  },
  { big: "gal", small: "qt", f: 4, mulStep: 1, mulMax: 48, nStep: 1, nMax: 10, divUnit: 0.25 },
];

/** CONVERT round: level 1 big→small, level 2 small→big, 3-4 either. */
export function makeConvert(level, next) {
  const dir = level === 1 ? "mul" : level === 2 ? "div" : pick(next, ["mul", "div"]);
  const c = pick(next, CONVERSIONS);
  if (dir === "mul") {
    const k = randInt(next, 2, Math.round(c.nMax / c.nStep));
    const n = k * c.nStep;
    return {
      mode: "convert",
      dir,
      big: c.big,
      from: c.big,
      to: c.small,
      f: c.f,
      n,
      ans: n * c.f,
      step: c.mulStep,
      max: c.mulMax,
      group: c.nStep,
    };
  }
  const kMin = Math.ceil(1 / c.divUnit);
  const k = randInt(next, kMin, Math.round(8 / c.divUnit));
  const ans = k * c.divUnit;
  return {
    mode: "convert",
    dir,
    big: c.big,
    from: c.small,
    to: c.big,
    f: c.f,
    n: ans * c.f,
    ans,
    step: DIV_STEP,
    max: DIV_MAX,
    group: c.divUnit * c.f,
  };
}

const close = (x, y) => Math.abs(x - y) < 1e-9;

/** @returns {"ok"|"wrongOpMul"|"wrongOpDiv"|"convHigh"|"convLow"} */
export function judgeConvert(q, v) {
  if (close(v, q.ans)) return "ok";
  if (q.dir === "mul" && close(v, q.n / q.f)) return "wrongOpMul";
  if (q.dir === "div" && close(v, q.n * q.f)) return "wrongOpDiv";
  return v > q.ans ? "convHigh" : "convLow";
}

export function makeRound(mode, level, next) {
  if (mode === "equiv") return makeEquiv(level, next);
  if (mode === "rate") return makeRate(level, next);
  if (mode === "compare") return makeCompare(level, next);
  return makeConvert(level, next);
}
