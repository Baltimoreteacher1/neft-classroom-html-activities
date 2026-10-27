// Small helpers shared by the round generators. @fm2 FM-061
import { pick, sample } from "../../rng.js";
import { cmp, frac, gcd } from "../../rational.js";
import { INGREDIENTS } from "./copy.js";

export const clamp = (g, lo, hi) => Math.min(hi, Math.max(lo, g));
export const ingredient = (rng) => pick(rng, INGREDIENTS);
export const POOL = [2, 3, 4, 5, 6, 8, 10, 12];
export const reducedNumerator = (rng, b, lo = 1, hi = b - 1) => {
  const options = [];
  for (let a = lo; a <= hi; a += 1) if (gcd(a, b) === 1) options.push(a);
  return pick(rng, options);
};
export const tickOptions = (rng, must, count, pool = POOL) => {
  const set = new Set(must);
  const rest = sample(
    rng,
    pool.filter((p) => !set.has(p)),
    Math.max(0, count - set.size),
  );
  return [...set, ...rest].sort((a, b) => a - b);
};
export const unit = (e) => frac(1, e);
export const descending = (fractions) => [...fractions].sort((a, b) => cmp(b, a));
