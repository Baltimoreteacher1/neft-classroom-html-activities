// Math Literacy Studio: the problem-family registry. Four modules own the generators (one per grade band);
// this file merges them and is the only entry point: generate(familyId, params, { seed, level, ctx }).
// Each family is { title, grades, defaults, gen(rng, params, opts), check?(problem, params) } (docs/math-literacy/architecture.md).
import { makeRng } from "./kit.js";
import { FAMILIES as g12 } from "./families/g12.js";
import { FAMILIES as g34 } from "./families/g34.js";
import { FAMILIES as g56 } from "./families/g56.js";
import { FAMILIES as g78 } from "./families/g78.js";

export const FAMILIES = { ...g12, ...g34, ...g56, ...g78 };

/** One Problem. The same arguments always return the same Problem. */
export function generate(familyId, params = {}, { seed = 1, level = 1, ctx = "store" } = {}) {
  const fam = FAMILIES[familyId];
  if (!fam) throw new Error(`unknown problem family: ${familyId}`);
  const rng = makeRng(`${familyId}:${seed}:${level}:${ctx}`);
  const p = fam.gen(rng, { ...(fam.defaults || {}), ...params }, { level, ctx });
  p.seed = seed;
  return p;
}

/** n distinct Problems (distinct by spec), drawing seeds upward from `seed`. Gives up after 8n tries rather than looping. */
export function generateSet(familyId, params, { seed = 1, level = 1, ctx = "store", n = 6 } = {}) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < n && i < n * 8; i++) {
    const p = generate(familyId, params, { seed: seed + i, level, ctx });
    const k = JSON.stringify(p.spec);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}
