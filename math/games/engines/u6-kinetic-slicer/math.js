// Kinetic Slicer rounds: dividing with fractions (6.NOS.1), lessons 6-1, 6-2,
// 6-9, 6-10, 6-11. Pure functions, no DOM: the game and its node test share them.
// Every value is an exact fraction {n, d}; nothing is compared as a float.

import { frac, lcm, pick, randInt } from "../core/math.js";

export const MODES = ["predict", "aperture", "mixed"];
export const WHOLE_MAX = 12; // whole-block dial 0..12
export const NUM_MAX = 11; // leftover numerator 0..11
export const DEN_MAX = 12; // leftover denominator 1..12
export const AP_MAX = 12; // aperture numerator / denominator 1..12
export const RIBBON_MAX = 6; // ruler is at most 6 wholes
export const PAVE_MAX = 60; // Tier 2 paving tiles per round
export const CONTEXTS = ["cable", "ribbon", "rope", "pipe"];

/** Round mode by machine number: every mode appears in machines 1-3. */
export function modeFor(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

export const whole = (n) => ({ n, d: 1 });
export const mul = (p, q) => frac(p.n * q.n, p.d * q.d);
export const div = (p, q) => frac(p.n * q.d, p.d * q.n);
export const sub = (p, q) => frac(p.n * q.d - q.n * p.d, p.d * q.d);
export const add = (p, q) => frac(p.n * q.d + q.n * p.d, p.d * q.d);
export const same = (p, q) => p.n * q.d === q.n * p.d;
export const cmp = (p, q) => Math.sign(p.n * q.d - q.n * p.d);
export const value = (p) => p.n / p.d;

/** Whole part and leftover fraction of a positive fraction. */
export function split(f) {
  const w = Math.floor(f.n / f.d);
  return { w, r: frac(f.n - w * f.d, f.d) };
}

/** Is the round inside every control range and drawable? */
function fits(r) {
  const { ribbon, ap } = r;
  if (ribbon.n <= 0 || ap.n <= 0) return false;
  if (value(ribbon) > RIBBON_MAX || value(ap) > RIBBON_MAX) return false;
  if (ribbon.d > DEN_MAX || ap.n > AP_MAX || ap.d > AP_MAX) return false;
  const q = div(ribbon, ap);
  const { w } = split(q);
  if (w > WHOLE_MAX || q.d > DEN_MAX) return false;
  if (r.mode === "aperture") {
    if (same(ap, whole(1))) return false; // the dial parks at 1/1
    if (ribbon.n * r.blocks > PAVE_MAX) return false;
  } else if (value(ribbon) * r.paveUnits > PAVE_MAX) return false;
  return true;
}

/**
 * A round. predict / mixed: ribbon and aperture given, find ribbon ÷ aperture.
 * aperture: ribbon and a whole block count given, find the aperture.
 * @param {string} mode @param {number} level @param {() => number} next
 */
export function makeRound(mode, level, next) {
  for (let tries = 0; tries < 500; tries++) {
    const r =
      mode === "aperture"
        ? apertureRound(level, next)
        : mode === "mixed"
          ? mixedRound(level, next)
          : predictRound(level, next);
    r.mode = mode;
    r.q = div(r.ribbon, r.ap);
    r.paveUnits = mode === "aperture" ? r.ribbon.d * r.blocks : lcm(r.ribbon.d, r.ap.d);
    if (fits(r)) return r;
  }
  throw new Error(`kinetic-slicer: no ${mode} round at level ${level}`);
}

function predictRound(level, next) {
  if (level === 1) {
    // 6-9: whole number ÷ a fraction (often a unit fraction).
    const D = pick(next, [2, 3, 4, 5, 6]);
    const C = next() < 0.5 ? 1 : randInt(next, 1, D - 1);
    return { ribbon: whole(randInt(next, 1, 4)), ap: frac(C, D) };
  }
  // 6-1 / 6-2: fraction ÷ fraction; level 4 allows an improper aperture.
  const B = pick(next, level === 2 ? [2, 3, 4, 6, 8] : [2, 3, 4, 5, 6, 8, 10]);
  const D = pick(next, level === 2 ? [2, 3, 4, 6, 8] : [2, 3, 4, 5, 6, 8]);
  let C = randInt(next, 1, level === 4 ? 2 * D - 1 : D - 1);
  if (C === D) C = 1;
  return { ribbon: frac(randInt(next, 1, (level === 2 ? 4 : 5) * B), B), ap: frac(C, D) };
}

function mixedRound(level, next) {
  // 6-10 / 6-11: a mixed-number length cut into fractional (or mixed) pieces.
  const B = pick(next, [2, 3, 4, 8]);
  const ribbon = frac(randInt(next, 1, level >= 3 ? 4 : 3) * B + randInt(next, 1, B - 1), B);
  let ap;
  if (level >= 3 && next() < 0.35)
    ap = pick(next, [frac(3, 2), frac(5, 4), frac(4, 3), frac(7, 4)]);
  else {
    const D = pick(next, [2, 3, 4, 6, 8]);
    ap = frac(randInt(next, 1, D - 1), D);
  }
  return { ribbon, ap, context: pick(next, CONTEXTS) };
}

function apertureRound(level, next) {
  // Work order: exactly `blocks` equal blocks, no scrap. Find the aperture.
  const blocks = randInt(next, 2, level === 1 ? 6 : 8);
  const D = pick(next, level === 1 ? [2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 8]);
  let C = level === 1 ? 1 : randInt(next, 1, level >= 3 ? 2 * D - 1 : D - 1);
  if (C === D) C = 1;
  const ap = frac(C, D);
  return { ribbon: mul(whole(blocks), ap), ap, blocks };
}

/**
 * Judge a predicted quotient w + n/d.
 * @returns {"ok"|"improper"|"remainderWhole"|"inverted"|"high"|"low"}
 */
export function judgePredict(r, w, n, d) {
  if (n >= d && n > 0) return "improper";
  const p = frac(w * d + n, d);
  if (same(p, r.q)) return "ok";
  const { w: qw, r: rem } = split(r.q);
  const scrapWholes = sub(r.ribbon, mul(whole(qw), r.ap));
  if (rem.n !== 0 && !same(scrapWholes, rem) && same(p, add(whole(qw), scrapWholes)))
    return "remainderWhole";
  if (same(p, mul(r.ribbon, r.ap)) || same(p, div(r.ap, r.ribbon))) return "inverted";
  return cmp(p, r.q) > 0 ? "high" : "low";
}

/**
 * Judge an aperture c/d for an exact-blocks work order.
 * @returns {"ok"|"inverted"|"wide"|"narrow"}
 */
export function judgeAperture(r, c, d) {
  const a = frac(c, d);
  if (same(div(r.ribbon, a), whole(r.blocks))) return "ok";
  if (same(a, div(whole(r.blocks), r.ribbon))) return "inverted";
  return cmp(a, r.ap) > 0 ? "wide" : "narrow";
}

/** The keyboard answer for a round: dial values that solve it. */
export function answerFor(r) {
  if (r.mode === "aperture") return { c: r.ap.n, d: r.ap.d };
  const { w, r: rem } = split(r.q);
  return { w, n: rem.n, d: rem.n === 0 ? 1 : rem.d };
}
