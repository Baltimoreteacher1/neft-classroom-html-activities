// Assembly Matrix rounds: exponents (6-3), expressions (6-4, 6-5), equivalent
// expressions and the distributive property (6-6, 6-8, 6-14), simplifying by
// combining like terms (6-15); 6.AT.5, 6.AT.6a, 6.AT.6c, 6.AT.7.
// Pure functions, no DOM: the game and its node test share them. Integers only.

import { gcd, pick, randInt } from "../core/math.js";

export const MODES = ["unpack", "pack", "fuse", "power"];
export const T1_MAX = 60; // unpack track 1 crate dial
export const T2_MAX = 100; // unpack track 2 crate dial
export const G_MAX = 12; // pack outer factor dial (1..12)
export const IN_MAX = 30; // pack inner term dials
export const OUT_MAX = 130; // power output dial
export const PODS_MAX = 8;
export const TILE_MAX = 60; // Tier 2 algebra tiles per round

/** Round mode by machine number: every mode appears in machines 1-4. */
export function modeFor(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

/** "3x", "x", "5"; kind "1" is a constant. */
export function termText(kind, coef) {
  if (kind === "1") return String(coef);
  return coef === 1 ? kind : `${coef}${kind}`;
}

// ---------- UNPACK: a(b + c) -> ab + ac ----------
/** @param {number} level @param {() => number} next */
export function makeUnpack(level, next) {
  for (;;) {
    const numeric = level === 1 && next() < 0.5;
    const a = randInt(next, 2, level <= 2 ? 6 : 9);
    const p = numeric
      ? randInt(next, 2, 9)
      : level === 1
        ? 1
        : randInt(next, 1, level >= 3 ? 5 : 3);
    const c = randInt(next, 1, level <= 2 ? 9 : 12);
    const u = { a, p, c, numeric, t1: a * p, t2: a * c };
    if (u.t1 <= T1_MAX && u.t2 <= T2_MAX && a * (p + c) <= TILE_MAX) return u;
  }
}

export function unpackText(u) {
  return `${u.a}(${u.numeric ? u.p : termText("x", u.p)} + ${u.c})`;
}

/** @returns {"ok"|"firstOnly"|"t1High"|"t1Low"|"t2High"|"t2Low"} */
export function judgeUnpack(u, k1, k2) {
  if (k1 === u.t1 && k2 === u.t2) return "ok";
  if (k1 === u.t1 && k2 === u.c) return "firstOnly";
  if (k1 !== u.t1) return k1 > u.t1 ? "t1High" : "t1Low";
  return k2 > u.t2 ? "t2High" : "t2Low";
}

// ---------- PACK: A·x + B -> G(m·x + n) ----------
/** @param {number} level @param {() => number} next */
export function makePack(level, next) {
  for (;;) {
    const numeric = level === 1;
    const G = randInt(next, 2, level <= 2 ? 6 : 9);
    const m = randInt(next, 1, 6);
    const n = randInt(next, 1, 6);
    if (gcd(m, n) !== 1 || (numeric && m === n)) continue;
    if (G * (m + n) > TILE_MAX) continue;
    return { G, m, n, numeric, A: G * m, B: G * n };
  }
}

/** The two loose terms on the input tracks: "12x" and "18" (or "12" and "18"). */
export function packTerms(p) {
  return [p.numeric ? String(p.A) : termText("x", p.A), String(p.B)];
}

/**
 * @returns {"ok"|"needFactor"|"oneTerm"|"t1High"|"t1Low"|"t2High"|"t2Low"|"bigger"}
 */
export function judgePack(p, level, g, i1, i2) {
  if (g < 2) return "needFactor";
  const ok1 = g * i1 === p.A;
  const ok2 = g * i2 === p.B;
  if (ok1 && !ok2 && i2 === p.B) return "oneTerm";
  if (!ok1) return g * i1 > p.A ? "t1High" : "t1Low";
  if (!ok2) return g * i2 > p.B ? "t2High" : "t2Low";
  if (level >= 3 && g < p.G) return "bigger";
  return "ok";
}

// ---------- FUSE: combine like terms ----------
/** @param {number} level @param {() => number} next */
export function makeFuse(level, next) {
  const kinds = level >= 3 ? ["x", "y", "1"] : ["x", "1"];
  const count = level === 1 ? 4 : level === 2 ? 5 : 6;
  for (;;) {
    const pods = [];
    for (let i = 0; i < count; i++)
      pods.push({ kind: pick(next, kinds), coef: randInt(next, 1, 9) });
    const present = new Set(pods.map((p) => p.kind));
    if (present.size < 2) continue;
    if (present.size === pods.length) continue; // nothing to combine: would start solved
    return { pods };
  }
}

/** Expression text of the live pods, in field order. */
export function fieldText(pods, alive) {
  const parts = [];
  for (let i = 0; i < pods.length; i++)
    if (!alive || alive[i]) parts.push(termText(pods[i].kind, pods[i].coef));
  return parts.join(" + ");
}

/** Kind -> total coefficient. Independent of the order pods were fused. */
export function simplified(pods) {
  const out = new Map();
  for (const p of pods) out.set(p.kind, (out.get(p.kind) || 0) + p.coef);
  return out;
}

/** @param {number[]} kindsAlive kind of each live pod @returns {"ok"|"likeRemain"} */
export function judgeFuse(kindsAlive) {
  return new Set(kindsAlive).size === kindsAlive.length ? "ok" : "likeRemain";
}

// ---------- POWER: base^exponent ----------
const POWERS = [
  [1, 2, 3],
  [1, 3, 2],
  [1, 4, 2],
  [1, 5, 2],
  [1, 6, 2],
  [1, 2, 4],
  [1, 10, 2],
  [2, 3, 3],
  [2, 7, 2],
  [2, 8, 2],
  [2, 9, 2],
  [2, 2, 5],
  [2, 4, 3],
  [3, 3, 4],
  [3, 5, 3],
  [3, 2, 6],
  [3, 11, 2],
  [3, 2, 7],
];

/** @param {number} level @param {() => number} next */
export function makePower(level, next) {
  const pool = POWERS.filter(([lv]) => lv <= Math.min(level, 3));
  const [, b, e] = pick(next, pool);
  return { b, e, value: b ** e };
}

const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
export function powerText(pw) {
  return `${pw.b}${SUP[pw.e]}`;
}

/** "3 × 3 × 3" */
export function expandText(pw) {
  return Array(pw.e).fill(String(pw.b)).join(" × ");
}

/** @returns {"ok"|"timesExp"|"addExp"|"high"|"low"} */
export function judgePower(pw, v) {
  if (v === pw.value) return "ok";
  if (v === pw.b * pw.e) return "timesExp";
  if (v === pw.b + pw.e) return "addExp";
  return v > pw.value ? "high" : "low";
}
