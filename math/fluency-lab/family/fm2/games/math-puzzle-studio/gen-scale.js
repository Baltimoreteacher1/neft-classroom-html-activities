// Equation balance-scale rounds for grades 6 to 8: one-step equations, two-step equations, and variables on both
// sides. The scale starts balanced; every x-box holds the same hidden weight `xv` (an exact fraction), so every
// reading the scale gives is true. @fm2 FM-017 FM-051 FM-058 FM-060
import { frac, mul } from "../../rational.js";
import { int, pick, T } from "./gen-kit.js";

const xText = (n) => (n === 1 ? "x" : `${n}x`);
const side = ({ x, k }) => (x && k ? `${xText(x)} + ${k}` : x ? xText(x) : String(k));
export const equationText = (eq) => `${side(eq.l)} = ${side(eq.r)}`;

function scaleRound(rng, level, pans, xv) {
  const mirror = rng() < 0.5;
  const eq = mirror ? { l: pans.r, r: pans.l } : pans;
  const weight = (p) => mul(frac(p.x), xv).n / mul(frac(p.x), xv).d + p.k;
  const text = equationText(eq);
  return {
    kind: "scale",
    layout: "scale",
    level,
    eq,
    xv,
    equationText: text,
    ref: Math.max(weight(eq.l), weight(eq.r)),
    seed: int(rng, 1, 999999999),
    prompt: T(
      `The scale is balanced: ${text}. Every x-box weighs the same. Use moves that keep it balanced to get one x-box alone on a pan.`,
      `La balanza está equilibrada: ${text}. Todas las cajas x pesan lo mismo. Usa movimientos que la mantengan equilibrada para dejar una caja x sola en un platillo.`,
    ),
  };
}

// A value for x: a whole number, or (level 3) a fraction a/b from a split that does not come out even.
export function oneStep(level, rng) {
  const kind =
    level === 1
      ? "add"
      : level === 2
        ? pick(rng, ["add", "times"])
        : pick(rng, ["times", "times", "add"]);
  if (kind === "add") {
    const top = level === 3 ? 40 : level === 2 ? 25 : 12;
    const x = int(rng, 2, top);
    const a = int(rng, 1, level === 1 ? 9 : 20);
    return scaleRound(rng, level, { l: { x: 1, k: a }, r: { x: 0, k: x + a } }, frac(x));
  }
  const a = int(rng, 2, 5);
  if (level === 3) {
    let b = int(rng, a + 1, 6 * a);
    if (b % a === 0) b += int(rng, 1, a - 1);
    return scaleRound(rng, level, { l: { x: a, k: 0 }, r: { x: 0, k: b } }, frac(b, a));
  }
  const x = int(rng, 2, 9);
  return scaleRound(rng, level, { l: { x: a, k: 0 }, r: { x: 0, k: a * x } }, frac(x));
}

export function twoStep(level, rng) {
  const a = int(rng, 2, level === 1 ? 4 : 6);
  const b = int(rng, 1, level === 1 ? 9 : 15);
  if (level === 3) {
    let total = int(rng, b + a + 1, b + 7 * a);
    if ((total - b) % a === 0) total += int(rng, 1, a - 1);
    return scaleRound(rng, level, { l: { x: a, k: b }, r: { x: 0, k: total } }, frac(total - b, a));
  }
  const x = int(rng, 2, level === 1 ? 9 : 12);
  return scaleRound(rng, level, { l: { x: a, k: b }, r: { x: 0, k: a * x + b } }, frac(x));
}

export function bothSides(level, rng) {
  const c = int(rng, 1, 3);
  const gap = level === 1 ? 1 : int(rng, 2, 3);
  const a = c + gap;
  const b = int(rng, 1, 8);
  if (level === 3) {
    const top = 6 * gap;
    let diff = int(rng, gap + 1, top);
    if (diff % gap === 0) diff += int(rng, 1, gap - 1);
    return scaleRound(rng, level, { l: { x: a, k: b }, r: { x: c, k: b + diff } }, frac(diff, gap));
  }
  const x = int(rng, 2, 9);
  return scaleRound(rng, level, { l: { x: a, k: b }, r: { x: c, k: b + gap * x } }, frac(x));
}
