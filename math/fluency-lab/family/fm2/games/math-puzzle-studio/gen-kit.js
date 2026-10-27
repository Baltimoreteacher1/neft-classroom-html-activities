// Helpers shared by the round generators: bilingual strings, tile pools, and the common round shape.
// @fm2 FM-017 FM-061
import { int, shuffle } from "../../rng.js";

export const T = (en, es) => ({ en, es });
export { int, pick, sample, shuffle } from "../../rng.js";

// Tiles get stable ids t0, t1, ... in the order given.
export function makePool(items) {
  return items.map((item, i) => ({ id: `t${i}`, ...item }));
}

// A pool of whole-number tiles. `include` are always in; `named` are [value, why] distractors that stand for a
// specific mistake; the rest is filled from lo..hi at random without touching `exclude` (values that would be correct).
export function numberPool(rng, { include = [], exclude = [], named = [], lo, hi, fillHi = hi, size }) {
  const chosen = new Map();
  for (const v of include) chosen.set(v, null);
  for (const [v, why] of named) {
    if (v >= lo && v <= hi && !exclude.includes(v) && !chosen.has(v) && chosen.size < size)
      chosen.set(v, why);
  }
  const rest = [];
  for (let v = lo; v <= fillHi; v += 1) if (!chosen.has(v) && !exclude.includes(v)) rest.push(v);
  for (const v of shuffle(rng, rest)) {
    if (chosen.size >= size) break;
    chosen.set(v, null);
  }
  return makePool(
    [...chosen].sort((a, b) => a[0] - b[0]).map(([v, why]) => (why ? { v, why } : { v })),
  );
}

// The common shape of a "place tiles" round.
export function placeRound(rng, base) {
  return { kind: "place", reuse: false, seed: int(rng, 1, 999999999), ...base };
}

export const openCell = () => ({ v: null });
export const given = (v) => ({ v });
export const cmpRule = (l, r, rel = "=") => ({ k: "cmp", rel, l, r });

// Clamp a grade into a skill's range.
export const within = (grade, lo, hi) => Math.min(hi, Math.max(lo, grade));
