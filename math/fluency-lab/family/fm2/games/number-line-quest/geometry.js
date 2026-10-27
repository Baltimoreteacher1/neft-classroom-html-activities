// Exact geometry of a Number Line Quest round: where a marker may sit, what counts as close enough, and how far off a
// placement is. Everything is rational; roots are decided by comparing integer powers, never by Math.sqrt alone.
// @fm2 FM-052 FM-053 FM-054 FM-055
import { add, cmp, div, frac, isInt, mul, sub, toNumber } from "../../rational.js";

export const ZERO = frac(0);
export const absF = (a) => (a.n < 0 ? frac(-a.n, a.d) : a);
export const asFrac = (v) =>
  v && Number.isSafeInteger(v.n) && Number.isSafeInteger(v.d) && v.d > 0 ? frac(v.n, v.d) : null;
export const at = (min, step, k) => add(min, mul(step, frac(k)));
export const gridCount = (min, max, step) => {
  const k = div(sub(max, min), step);
  if (!isInt(k)) throw new RangeError("line length must be a whole number of steps");
  return k.n;
};
// The grid index of x, or null when x is not exactly on a step.
export const gridIndex = (min, step, x) => {
  const k = div(sub(x, min), step);
  return isInt(k) ? k.n : null;
};
export const floorOf = (a) => Math.floor(a.n / a.d);

// Sign of x^index - radicand for a rational x >= 0, by integer arithmetic.
const cmpPower = (x, index, radicand) => Math.sign(x.n ** index - radicand * x.d ** index);

// Largest integer r with r^index <= m (exact).
export function iroot(m, index) {
  let r = Math.floor(m ** (1 / index));
  while ((r + 1) ** index <= m) r += 1;
  while (r ** index > m) r -= 1;
  return r;
}

// Is |x - index-th root of radicand| <= tol?  x - tol <= root  and  root <= x + tol, decided with integer powers.
export function rootWithin(index, radicand, x, tol) {
  const lower = sub(x, tol);
  const upper = add(x, tol);
  const aboveLower = lower.n <= 0 || cmpPower(lower, index, radicand) <= 0;
  const belowUpper = upper.n >= 0 && cmpPower(upper, index, radicand) >= 0;
  return aboveLower && belowUpper;
}

// A rational within 1/scale of the root (floor), derived from integer roots only.
export const rootApprox = (index, radicand, scale = 1000) =>
  frac(iroot(radicand * scale ** index, index), scale);

export const targetOf = (round) =>
  round.radical ? rootApprox(round.radical.index, round.radical.radicand) : round.target;

export function placeAccepts(round, x) {
  if (round.radical) return rootWithin(round.radical.index, round.radical.radicand, x, round.tol);
  return cmp(absF(sub(x, round.target)), round.tol) <= 0;
}

// Marker positions that make the round true, nearest the target first (empty if the grid misses the tolerance).
export function acceptedSpots(round) {
  const { min, step } = round.line;
  const count = gridCount(min, round.line.max, step);
  const around = Math.min(count, Math.max(0, floorOf(div(sub(targetOf(round), min), step))));
  const spots = [];
  for (let k = Math.max(0, around - 2); k <= Math.min(count, around + 3); k += 1) {
    const x = at(min, step, k);
    if (placeAccepts(round, x)) spots.push(x);
  }
  const target = targetOf(round);
  return spots.sort((a, b) => toNumber(absF(sub(a, target))) - toNumber(absF(sub(b, target))));
}
