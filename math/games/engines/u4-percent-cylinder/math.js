// Calibration Cylinder rounds: percent (6.AT.4; lessons 4-1..4-5).
// Pure functions, no DOM: the game and tools/engines/u4-percent-cylinder.test.mjs
// share them. Levels are integer thousandths of the cylinder, or integer units,
// and every comparison is integer arithmetic — no repeating decimals anywhere.

import { frac, gcd, pick, randInt } from "../core/math.js";

export const MODES = ["calibrate", "part", "whole"];
export const CAP_MIN = 1;
export const CAP_MAX = 150;

/** Round 1 calibrate, 2 part of a number, 3 whole from a part, then repeat. */
export function modeForRound(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

/** Decimal text of an integer count of thousandths: 600 → "0.6", 375 → "0.375". */
export function thouText(t) {
  const whole = Math.floor(t / 1000);
  let rest = String(t % 1000).padStart(3, "0");
  while (rest.endsWith("0")) rest = rest.slice(0, -1);
  return rest ? `${whole}.${rest}` : String(whole);
}

/** Percent text of thousandths: 600 → "60%", 375 → "37.5%". */
export function percentText(t) {
  return t % 10 === 0 ? `${t / 10}%` : `${Math.floor(t / 10)}.${t % 10}%`;
}

/** Reduced fraction text of thousandths: 600 → "3/5". */
export function fractionText(t) {
  const f = frac(t, 1000);
  return `${f.n}/${f.d}`;
}

const DENS = {
  1: [2, 4, 5, 10, 20, 25],
  2: [4, 5, 10, 20, 25, 50],
  3: [5, 20, 25, 50, 100],
  4: [8, 40, 200, 125],
};

/**
 * CALIBRATE: a target level in thousandths, given in ONE form.
 * Levels 1-3 land on hundredths; level 4 needs the thousandths wheel.
 */
export function makeCalibrate(level, next) {
  const forms = level === 1 ? ["fraction", "percent"] : ["fraction", "percent", "decimal"];
  const form = pick(next, forms);
  for (;;) {
    const den = pick(next, DENS[level]);
    const num = randInt(next, 1, den - 1);
    if (gcd(num, den) !== 1) continue;
    const T = (num * 1000) / den;
    if (!Number.isInteger(T) || T <= 0 || T >= 1000) continue;
    if (level < 4 && T % 10 !== 0) continue;
    if (level === 4 && T % 10 === 0) continue;
    return { mode: "calibrate", form, T, num, den, thou: level === 4 };
  }
}

/** The target as text in one form. */
export function formText(T, form) {
  return form === "fraction" ? fractionText(T) : form === "decimal" ? thouText(T) : percentText(T);
}

/** @returns {"ok"|"shift"|"numTenths"|"high"|"low"} — v in thousandths. */
export function judgeCalibrate(q, v) {
  if (v === q.T) return "ok";
  const f = frac(q.T, 1000);
  if (q.form === "percent" && v * 10 === q.T) return "shift";
  if (q.form === "fraction" && f.n < 10 && v === f.n * 100) return "numTenths";
  return v > q.T ? "high" : "low";
}

const FRIENDLY = {
  1: [10, 20, 25, 50, 75],
  2: [10, 20, 25, 30, 40, 50, 60, 75, 80],
  3: [5, 15, 30, 35, 40, 45, 60, 70, 90],
  4: [5, 12, 15, 35, 45, 65, 85, 95],
};
const BENCH = [10, 20, 25, 50, 75];

/**
 * PART: p% of a capacity N. variant "exact": p·N/100 is a whole number.
 * variant "estimate" (4-3): a benchmark percent of an unfriendly N; any whole
 * number within 1 unit of the exact value is accepted.
 */
export function makePart(level, next) {
  const estimate = level >= 2 && next() < 0.4;
  if (estimate) {
    const p = pick(next, BENCH);
    for (;;) {
      const N = randInt(next, 21, 119);
      if ((p * N) % 100 === 0) continue;
      return { mode: "part", variant: "estimate", p, N, exact100: p * N };
    }
  }
  const p = pick(next, FRIENDLY[level]);
  const unit = 100 / gcd(p, 100);
  const lo = Math.ceil(20 / unit);
  const hi = Math.floor(120 / unit);
  const N = unit * randInt(next, lo, hi);
  return { mode: "part", variant: "exact", p, N, part: (p * N) / 100, exact100: p * N };
}

/** @returns {"ok"|"pctAsUnits"|"complement"|"high"|"low"} — v in whole units. */
export function judgePart(q, v) {
  const diff100 = v * 100 - q.exact100;
  if (q.variant === "estimate") {
    if (Math.abs(diff100) <= 100) return "ok";
    return diff100 > 0 ? "high" : "low";
  }
  if (diff100 === 0) return "ok";
  if (v === q.p && q.N !== 100) return "pctAsUnits";
  if (v === q.N - q.part) return "complement";
  return diff100 > 0 ? "high" : "low";
}

/**
 * WHOLE (4-5): a known part P fills to p%; find the capacity C = 100·P / p.
 */
export function makeWhole(level, next) {
  const list =
    level === 1 ? [10, 20, 25, 50] : level === 2 ? [20, 25, 40, 50, 75] : [15, 30, 40, 60, 75, 80];
  const p = pick(next, list);
  const unit = 100 / gcd(p, 100);
  const lo = Math.ceil(20 / unit);
  const hi = Math.floor(120 / unit);
  const C = unit * randInt(next, lo, hi);
  return { mode: "whole", p, C, P: (p * C) / 100 };
}

/** @returns {"ok"|"times"|"partAsWhole"|"high"|"low"} — c is the capacity setting. */
export function judgeWhole(q, c) {
  const lhs = c * q.p;
  const rhs = 100 * q.P;
  if (lhs === rhs) return "ok";
  if (c === q.P) return "partAsWhole";
  if (c * 100 === q.P * q.p) return "times";
  return lhs > rhs ? "high" : "low";
}

export function makeRound(mode, level, next) {
  if (mode === "calibrate") return makeCalibrate(level, next);
  if (mode === "part") return makePart(level, next);
  return makeWhole(level, next);
}
