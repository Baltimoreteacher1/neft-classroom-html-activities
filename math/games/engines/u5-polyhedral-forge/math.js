// Polyhedral Forge rounds: area of parallelograms, triangles and trapezoids
// (6.GR.1), nets and surface area (6.GR.4), volume with fractional edges (6.GR.2).
// Pure functions, no DOM: the game and tools/engines/u5-polyhedral-forge.test.mjs
// share them. All answers are exact: areas in half units, volumes in eighths.

import { frac, fracText, pick, randInt } from "../core/math.js";

// [height, horizontal offset, slanted side]: right triangles with whole sides,
// so the slanted side a student might mistake for the height is a whole number.
const TRIPLES = [
  [4, 3, 5],
  [3, 4, 5],
  [8, 6, 10],
  [6, 8, 10],
  [12, 5, 13],
];

export const AREA_MAX = 160;
export const SA_MAX = 300;
export const COUNT_MAX = 10;
export const VOL_MAX = 50;

/** Mixed-number text of n/d ("15 3/8", "12", "1/2"). */
export function mixed(n, d) {
  return fracText(frac(n, d), true);
}

/**
 * A shield plate. kind "para": base b, top shifted right by off.
 * "tri": base b, apex above x = b - off. "trap": bases b (bottom) and b2 (top),
 * a slanted left leg and a vertical right leg. Area is stored in halves.
 * @param {number} level @param {() => number} next
 */
export function makeShield(level, next) {
  const kind = pick(next, level === 1 ? ["para", "tri"] : ["para", "tri", "trap"]);
  const [h, off, slant] = pick(next, level <= 2 ? TRIPLES.slice(0, 4) : TRIPLES);
  if (kind === "para") {
    const b = randInt(next, off + 1, off + 8);
    return { kind, b, b2: 0, h, off, slant, areaHalves: 2 * b * h };
  }
  if (kind === "tri") {
    const b = randInt(next, off + 1, off + 9);
    return { kind, b, b2: 0, h, off, slant, areaHalves: b * h };
  }
  const b2 = randInt(next, 2, 9);
  const b = b2 + off;
  return { kind, b, b2, h, off, slant, areaHalves: (b + b2) * h };
}

/**
 * Judge a charge-dial value (square units, halves allowed).
 * @returns {{key: string, tag?: string}}
 */
export function judgeShield(s, value) {
  const twice = Math.round(value * 2);
  if (twice === s.areaHalves) return { key: "ok" };
  const slantHalves =
    s.kind === "para"
      ? 2 * s.b * s.slant
      : s.kind === "tri"
        ? s.b * s.slant
        : (s.b + s.b2) * s.slant;
  if (twice === slantHalves) return { key: "slant", tag: "slant-as-height" };
  if (s.kind !== "para" && twice === 2 * s.areaHalves)
    return { key: "forgotHalf", tag: "forgot-half" };
  return twice > s.areaHalves
    ? { key: "high", tag: "value-high" }
    : { key: "low", tag: "value-low" };
}

/**
 * A solid to unfold. kind "prism": L x W x H. kind "pyramid": square base s,
 * triangle faces of slant height l (l > s/2). Surface area is a whole number.
 * @param {number} level @param {() => number} next
 */
export function newSolid(level, next) {
  const kind = level === 1 ? "prism" : pick(next, ["prism", "pyramid"]);
  if (kind === "prism") {
    const L = randInt(next, 2, level >= 3 ? 8 : 6);
    const W = randInt(next, 2, 6);
    const H = randInt(next, 2, 6);
    return { kind, L, W, H, s: 0, l: 0, sa: 2 * (L * W + L * H + W * H) };
  }
  const s = randInt(next, 2, 8);
  const l = randInt(next, Math.floor(s / 2) + 1, Math.floor(s / 2) + 6);
  return { kind, L: 0, W: 0, H: 0, s, l, sa: s * s + 2 * s * l };
}

/** Face areas in halves, in the order foldSolid lays the faces out. */
export function faceHalves(solid) {
  if (solid.kind === "prism") {
    const { L, W, H } = solid;
    return [2 * L * W, 2 * L * H, 2 * L * H, 2 * W * H, 2 * W * H, 2 * L * W];
  }
  const t = solid.s * solid.l;
  return [2 * solid.s * solid.s, t, t, t, t];
}

/** @returns {{key: string, tag?: string}} */
export function checkSolid(solid, value) {
  const v = Math.round(value);
  if (v === solid.sa) return { key: "ok" };
  if (solid.kind === "prism") {
    const { L, W, H } = solid;
    if (v === L * W + L * H + W * H) return { key: "halfFaces", tag: "half-the-faces" };
    if (v === L * W * H) return { key: "volumeNot", tag: "volume-not-area" };
  } else {
    const { s, l } = solid;
    if (v === s * s + 4 * s * l) return { key: "triHalf", tag: "forgot-half" };
    if (v === 2 * s * l) return { key: "missingBase", tag: "missing-base" };
  }
  return v > solid.sa ? { key: "saHigh", tag: "value-high" } : { key: "saLow", tag: "value-low" };
}

const HALF_PI = Math.PI / 2;

/**
 * Fold kinematics, allocation-free. Writes the solid's face vertices (x, y, z)
 * into `out` for unfold amount uq/10000 (0 = closed solid, 1 = flat net).
 * Every face turns rigidly about its hinge edge: prism walls by u·90°, the lid
 * by u·90° more about the back wall's top edge; pyramid triangles from the
 * dihedral angle out to the floor. Integer arguments only (no boxed doubles).
 * kind 0: prism (a, b, c) = (L, W, H), 24 vertices: base, front, back, left, right, top.
 * kind 1: pyramid (a, b) = (s, l), 16 vertices: base, front, back, left, right.
 * @param {Float64Array} out
 */
export function foldSolid(out, kind, a, b, c, uq) {
  const u = uq / 10000;
  if (kind === 0) {
    const L = a;
    const W = b;
    const th = u * HALF_PI;
    const hs = c * Math.sin(th);
    const hc = c * Math.cos(th);
    const dy = -W * Math.cos(2 * th);
    const dz = W * Math.sin(2 * th);
    // base
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = L;
    out[4] = 0;
    out[5] = 0;
    out[6] = L;
    out[7] = W;
    out[8] = 0;
    out[9] = 0;
    out[10] = W;
    out[11] = 0;
    // front (hinge y = 0)
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = L;
    out[16] = 0;
    out[17] = 0;
    out[18] = L;
    out[19] = -hs;
    out[20] = hc;
    out[21] = 0;
    out[22] = -hs;
    out[23] = hc;
    // back (hinge y = W)
    out[24] = 0;
    out[25] = W;
    out[26] = 0;
    out[27] = L;
    out[28] = W;
    out[29] = 0;
    out[30] = L;
    out[31] = W + hs;
    out[32] = hc;
    out[33] = 0;
    out[34] = W + hs;
    out[35] = hc;
    // left (hinge x = 0)
    out[36] = 0;
    out[37] = 0;
    out[38] = 0;
    out[39] = 0;
    out[40] = W;
    out[41] = 0;
    out[42] = -hs;
    out[43] = W;
    out[44] = hc;
    out[45] = -hs;
    out[46] = 0;
    out[47] = hc;
    // right (hinge x = L)
    out[48] = L;
    out[49] = 0;
    out[50] = 0;
    out[51] = L;
    out[52] = W;
    out[53] = 0;
    out[54] = L + hs;
    out[55] = W;
    out[56] = hc;
    out[57] = L + hs;
    out[58] = 0;
    out[59] = hc;
    // lid, hinged on the back wall's free edge
    out[60] = 0;
    out[61] = W + hs;
    out[62] = hc;
    out[63] = L;
    out[64] = W + hs;
    out[65] = hc;
    out[66] = L;
    out[67] = W + hs + dy;
    out[68] = hc + dz;
    out[69] = 0;
    out[70] = W + hs + dy;
    out[71] = hc + dz;
    return;
  }
  const s = a;
  const l = b;
  const half = s / 2;
  const beta = (1 - u) * (Math.PI - Math.acos(half / l));
  const lc = l * Math.cos(beta);
  const ls = l * Math.sin(beta);
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = s;
  out[4] = 0;
  out[5] = 0;
  out[6] = s;
  out[7] = s;
  out[8] = 0;
  out[9] = 0;
  out[10] = s;
  out[11] = 0;
  // front triangle (hinge y = 0)
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = s;
  out[16] = 0;
  out[17] = 0;
  out[18] = half;
  out[19] = -lc;
  out[20] = ls;
  // back
  out[21] = 0;
  out[22] = s;
  out[23] = 0;
  out[24] = s;
  out[25] = s;
  out[26] = 0;
  out[27] = half;
  out[28] = s + lc;
  out[29] = ls;
  // left
  out[30] = 0;
  out[31] = 0;
  out[32] = 0;
  out[33] = 0;
  out[34] = s;
  out[35] = 0;
  out[36] = -lc;
  out[37] = half;
  out[38] = ls;
  // right
  out[39] = s;
  out[40] = 0;
  out[41] = 0;
  out[42] = s;
  out[43] = s;
  out[44] = 0;
  out[45] = s + lc;
  out[46] = half;
  out[47] = ls;
}

/**
 * A hollow chamber with edges in half inches (hl/2 x hw/2 x hh/2 in), at least
 * one edge a fraction. cubes = how many 1/2-inch cubes fill it.
 * @param {number} level @param {() => number} next
 */
export function makeChamber(level, next) {
  const lo = level >= 3 ? 3 : 2;
  const hi = level === 1 ? 5 : level === 2 ? 6 : 7;
  let hl = randInt(next, lo, hi);
  const hw = randInt(next, lo, hi);
  const hh = randInt(next, lo, hi);
  if (hl % 2 === 0 && hw % 2 === 0 && hh % 2 === 0) hl = hl + 1 <= hi ? hl + 1 : hl - 1;
  return { hl, hw, hh, cubes: hl * hw * hh };
}

/**
 * Judge cube counts along each edge and the volume dial (cubic inches, eighths).
 * @returns {{key: string, axis?: string, tag?: string}}
 */
export function judgeChamber(c, nl, nw, nh, value) {
  const axes = [
    ["L", nl, c.hl],
    ["W", nw, c.hw],
    ["H", nh, c.hh],
  ];
  for (const [axis, n, t] of axes) {
    if (n > t) return { key: "tooMany", axis, tag: "count-overflow" };
    if (n < t)
      return Math.abs(2 * n - t) <= 1
        ? { key: "inchCubes", axis, tag: "whole-inch-cubes" }
        : { key: "tooFew", axis, tag: "count-gap" };
  }
  const eighths = Math.round(value * 8);
  if (eighths === c.cubes) return { key: "ok" };
  if (eighths === c.cubes * 8) return { key: "cubesAsVolume", tag: "cubes-as-volume" };
  return eighths > c.cubes
    ? { key: "volHigh", tag: "value-high" }
    : { key: "volLow", tag: "value-low" };
}
