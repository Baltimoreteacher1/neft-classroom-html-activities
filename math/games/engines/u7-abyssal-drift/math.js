// Abyssal Drift rounds: rational numbers and the coordinate plane (Unit 7).
// Pure functions, no DOM: the game and tools/engines/u7-abyssal-drift.test.mjs share them.
//
// The ocean surface is the x-axis (y = 0). Negative y is depth below the
// surface, positive y is altitude above it. Every value sits on the level's
// step (1, or 0.5 from level 3), so all arithmetic here is exact in binary.

import { pick, randInt } from "../core/math.js";

export const RANGE = 10; // the map and both thruster sliders run -10..10
export const TETHER_MAX = 20;
export const MODES = ["nav", "hull", "tether", "mirror"];

/** Round modes cycle so all four appear in rounds 1-4. */
export function modeFor(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

/** Slider step: whole units at levels 1-2, halves (rational coordinates) from level 3. */
export function stepFor(level) {
  return level >= 3 ? 0.5 : 1;
}

/** Largest magnitude a generated coordinate may have at this level. */
function reach(level) {
  return level === 1 ? 6 : level === 2 ? 8 : 9;
}

/** A positive value 1..max, or (level 3+, half the time) an odd number of halves. */
function magnitude(next, level, max) {
  if (level >= 3 && next() < 0.5) return (randInt(next, 1, max - 1) * 2 + 1) / 2;
  return randInt(next, 1, max);
}

/** A nonzero signed coordinate. */
function coord(next, level, max) {
  return (next() < 0.5 ? -1 : 1) * magnitude(next, level, max);
}

// ---------- NAVIGATE (7-5, 7-8): plot an ordered pair in any quadrant ----------

export function makeNav(level, next) {
  const max = reach(level);
  let x = coord(next, level, max);
  let y = coord(next, level, max);
  // x and y must differ so a swapped pair lands somewhere else.
  while (x === y) y = coord(next, level, max);
  return { x, y };
}

/**
 * @returns {{verdict: "ok" | "swapped" | "miss", dx: number, dy: number}}
 * dx/dy: sign of (set - true) on each axis.
 */
export function judgePoint(target, x, y) {
  const dx = Math.sign(x - target.x);
  const dy = Math.sign(y - target.y);
  if (dx === 0 && dy === 0) return { verdict: "ok", dx, dy };
  if (x === target.y && y === target.x) return { verdict: "swapped", dx, dy };
  return { verdict: "miss", dx, dy };
}

// ---------- HULL (7-1..7-4): opposites, absolute value, compare and order ----------

export const HULL_VARIANTS_L1 = ["match", "deepest", "highest"];
export const HULL_VARIANTS = ["match", "deepest", "highest", "closest", "farthest", "middle"];

/** Distinct-magnitude readings, at least one above and one below the surface. */
function readings(next, level) {
  const max = reach(level);
  for (;;) {
    const r = [coord(next, level, max), coord(next, level, max), coord(next, level, max)];
    const a = r.map(Math.abs);
    if (a[0] === a[1] || a[0] === a[2] || a[1] === a[2]) continue;
    if (!r.some((v) => v < 0) || !r.some((v) => v > 0)) continue;
    return r;
  }
}

const byValue = (r) => r.slice().sort((p, q) => p - q);
const byDistance = (r) => r.slice().sort((p, q) => Math.abs(p) - Math.abs(q));

/** The reading each order variant asks for, and the reading a sign/distance mix-up picks. */
export function hullAnswer(variant, r) {
  const v = byValue(r);
  const d = byDistance(r);
  switch (variant) {
    case "deepest":
      return { answer: v[0], trap: d[2], tag: "absolute-value-for-order" };
    case "highest":
      return { answer: v[2], trap: d[2], tag: "absolute-value-for-order" };
    case "middle":
      return { answer: v[1], trap: d[1], tag: "absolute-value-for-order" };
    case "closest":
      return { answer: d[0], trap: v[0], tag: "value-for-distance" };
    default:
      return { answer: d[2], trap: v[2], tag: "value-for-distance" };
  }
}

export function makeHull(level, next) {
  const variant = pick(next, level === 1 ? HULL_VARIANTS_L1 : HULL_VARIANTS);
  if (variant === "match") {
    const k = magnitude(next, level, reach(level));
    const drone = next() < 0.5; // drone in the air (+k) -> dive to -k; buoy anchor (-k) -> rise to +k
    const given = drone ? k : -k;
    return {
      variant,
      drone,
      given,
      readings: [],
      answer: -given,
      trap: given,
      tag: "sign-ignored",
    };
  }
  for (;;) {
    const r = readings(next, level);
    const h = hullAnswer(variant, r);
    if (h.trap === h.answer) continue; // every order round must be able to catch the mix-up
    return {
      variant,
      drone: false,
      given: 0,
      readings: r,
      answer: h.answer,
      trap: h.trap,
      tag: h.tag,
    };
  }
}

/** @returns {{verdict: "ok" | "trap" | "miss", dir: number}} dir = sign(set - answer) */
export function judgeHull(q, d) {
  const dir = Math.sign(d - q.answer);
  if (dir === 0) return { verdict: "ok", dir };
  if (d === q.trap) return { verdict: "trap", dir };
  return { verdict: "miss", dir };
}

// ---------- TETHER (7-6, 7-7): distance between points sharing a coordinate ----------

export function makeTether(level, next) {
  const horizontal = next() < 0.5; // horizontal: beacons share y; vertical: share x
  const across = level === 1 ? next() < 0.5 : next() < 0.75;
  const max = reach(level);
  let a;
  let b;
  for (;;) {
    const m = magnitude(next, level, max);
    const n = magnitude(next, level, max);
    if (m === n) continue;
    if (across) {
      a = -m;
      b = n;
    } else {
      const s = next() < 0.5 ? -1 : 1;
      a = s * m;
      b = s * n;
    }
    if (next() < 0.5) [a, b] = [b, a];
    break;
  }
  const shared = coord(next, level, Math.min(max, 8));
  const A = horizontal ? { x: a, y: shared } : { x: shared, y: a };
  const B = horizontal ? { x: b, y: shared } : { x: shared, y: b };
  return { horizontal, across, a, b, shared, A, B, distance: Math.abs(b - a) };
}

/** @returns {{verdict: "ok" | "subtracted" | "added" | "miss", dir: number}} */
export function judgeTether(q, length) {
  const dir = Math.sign(length - q.distance);
  if (dir === 0) return { verdict: "ok", dir };
  const ma = Math.abs(q.a);
  const mb = Math.abs(q.b);
  if (q.across && length === Math.abs(ma - mb)) return { verdict: "subtracted", dir };
  if (!q.across && length === ma + mb) return { verdict: "added", dir };
  return { verdict: "miss", dir };
}

// ---------- MIRROR (7-9): reflect a point across an axis ----------

export function makeMirror(level, next) {
  const max = Math.min(reach(level), 8);
  const p = { x: coord(next, level, max), y: coord(next, level, max) };
  const axis = next() < 0.5 ? "x" : "y";
  const image = axis === "x" ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y };
  return { p, axis, image };
}

/** @returns {{verdict: "ok" | "unchanged" | "wrongAxis" | "bothFlipped" | "miss", dx: number, dy: number}} */
export function judgeMirror(q, x, y) {
  const dx = Math.sign(x - q.image.x);
  const dy = Math.sign(y - q.image.y);
  if (dx === 0 && dy === 0) return { verdict: "ok", dx, dy };
  if (x === q.p.x && y === q.p.y) return { verdict: "unchanged", dx, dy };
  if (x === -q.p.x && y === -q.p.y) return { verdict: "bothFlipped", dx, dy };
  const other = q.axis === "x" ? { x: -q.p.x, y: q.p.y } : { x: q.p.x, y: -q.p.y };
  if (x === other.x && y === other.y) return { verdict: "wrongAxis", dx, dy };
  return { verdict: "miss", dx, dy };
}

/** Signed number text with a true minus sign: -4 -> "−4", 2.5 -> "2.5". */
export function num(v) {
  return v < 0 ? `−${-v}` : String(v);
}
