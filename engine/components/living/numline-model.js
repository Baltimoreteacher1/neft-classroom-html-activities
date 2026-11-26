// living/numline-model.js — pure helpers shared by the integers-cluster plays
// (opposites-line, rational-line, absolute-distance, order-line). No DOM.
//
// Every position a number line draws comes from `geometry()`, so one function
// decides where a value sits and the tests can prove the spacing is equal.

export const MINUS = "−";

export const near = (x, y) => Math.abs(x - y) < 1e-9;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const okNum = (v, lo, hi) =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** "−2.5", "3", "0.75": a real minus sign, no float noise, no "-0". */
export function num(v) {
  const r = Math.round(v * 1e4) / 1e4;
  if (r === 0) return "0";
  return (r < 0 ? MINUS : "") + String(Math.abs(r));
}
export const withUnit = (v, unit = "") => `${num(v)}${unit}`;

/** Reduced improper fraction of a value on a 1/den grid: 2.5 -> "5/2", -0.5 -> "−1/2". */
export function fracText(v, den) {
  const n = Math.round(v * den);
  if (!near(n, v * den)) return num(v);
  const g = gcd(n, den) || 1;
  if (den / g === 1) return num(n / g);
  return `${n < 0 ? MINUS : ""}${Math.abs(n) / g}/${den / g}`;
}

/** The two consecutive integers a non-integer value sits between, or null. */
export function betweenInts(v) {
  if (Number.isInteger(v)) return null;
  const lo = Math.floor(v);
  return [lo, lo + 1];
}

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(seed % options.length, 0, correct);
  return rest;
}

/** "1 degree" / "9 degrees": the count with the unit word in the right number, per language. */
export function count(x, w) {
  const one = Math.abs(x) === 1;
  const en = one ? w.en.replace(/s$/, "") : w.en;
  const es = one ? w.es.replace(/dades$/, "dad").replace(/s$/, "") : w.es;
  return { en: `${Math.abs(x)} ${en}`, es: `${Math.abs(x)} ${es}` };
}

/** A slot in 1..n-1 that varies with `seed`: the correct choice is never first. */
export const slotFor = (seed, n) => 1 + (Math.abs(Math.round(seed)) % (n - 1));

/** A non-empty {en, es} pair (a plain string serves both), clipped; or null. */
export function pairOf(p, max = 80) {
  const clip = (s) => String(s).trim().slice(0, max);
  if (typeof p === "string" && p.trim()) return { en: clip(p), es: clip(p) };
  if (p && typeof p.en === "string" && p.en.trim())
    return {
      en: clip(p.en),
      es: typeof p.es === "string" && p.es.trim() ? clip(p.es) : clip(p.en),
    };
  return null;
}

/** Integers lo, lo+step, … ≤ hi (index-based, so no float drift). */
export function tickValues(lo, hi, step) {
  const out = [];
  for (let i = 0; lo + i * step <= hi + 1e-9; i++)
    out.push(Math.round((lo + i * step) * 1e6) / 1e6);
  return out;
}

/**
 * Where values sit on the stage. Axis "h" runs left→right along y = axis.y,
 * axis "v" runs bottom→top along x = axis.x. `at(v, off)` steps `off` units
 * perpendicular to the axis (h: up for +off; v: right for +off).
 */
export function geometry({ axis, min, max, W, H, at: line, pad }) {
  const h = axis !== "v";
  const a0 = h ? pad : H - pad; // coordinate of min
  const a1 = h ? W - pad : pad; // coordinate of max
  const pos = (v) => a0 + ((v - min) / (max - min)) * (a1 - a0);
  const at = (v, off = 0) => (h ? { x: pos(v), y: line - off } : { x: line + off, y: pos(v) });
  return { h, min, max, pos, at, unit: Math.abs(a1 - a0) / (max - min), axisAt: line };
}
