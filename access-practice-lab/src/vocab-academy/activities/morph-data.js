// morphology.json (Word Study agent) is optional: it is loaded lazily and every consumer tolerates its absence.
import { CONTENT_BASE } from "../contract.js";

let DATA = null;
export const setMorphology = (data) => {
  DATA = data && Array.isArray(data.parts) ? data : null;
};
export const morphology = (ctx) => ctx?.morph || DATA;
export async function preloadMorphology(url = `${CONTENT_BASE}/morphology.json`) {
  try {
    const res = await fetch(url);
    if (res.ok) setMorphology(await res.json());
  } catch {
    /* absent or offline: engines fall back to unit data only */
  }
  return DATA;
}

/** Word parts as [{t, s, m}] from the word's own morph block, else from a matching derivation. */
export function segsOf(word, ctx) {
  const own = word.morph?.segs;
  if (own?.length) return own.map(({ t, s, m }) => ({ t, s, m: m || "" }));
  const data = morphology(ctx);
  const d = data?.derivations?.find((x) => x.word === word.hw && (!x.pos || x.pos === word.pos));
  if (!d) return [];
  const byId = new Map(data.parts.map((p) => [p.id, p]));
  return d.parts
    .map((id) => {
      if (id.startsWith("base:")) return { t: "base", s: id.slice(5), m: "" };
      const p = byId.get(id);
      return p ? { t: p.type, s: p.form, m: p.meaning || "" } : null;
    })
    .filter(Boolean);
}
/** Every known part (unit data first, then the dataset) as unique {t, s, m}. */
export function allParts(unit, ctx) {
  const out = new Map();
  const add = (t, s, m) => s && !out.has(s) && out.set(s, { t, s, m: m || "" });
  for (const w of unit.words || []) for (const g of w.morph?.segs || []) add(g.t, g.s, g.m);
  for (const p of unit.study?.parts || []) add(p.type, p.p, p.m);
  for (const p of morphology(ctx)?.parts || []) add(p.type, p.form, p.meaning);
  return [...out.values()];
}
