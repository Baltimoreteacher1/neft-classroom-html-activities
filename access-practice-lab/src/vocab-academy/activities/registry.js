// The activity library: every type, the spec-shaped ACTIVITY_TYPES registry and deterministic item building.
// Pure (no DOM): items are plain JSON built from validated unit data with the seeded RNG, so the same
// (unit, ctx, salt) always yields the same items and tests run in node.
import { DEEPER_TYPES } from "./types-deeper.js";
import { LISTEN_TYPES } from "./types-listen.js";
import { MEANING_TYPES } from "./types-meaning.js";
import { MORPH_TYPES } from "./types-morph.js";
import { PRODUCTIVE_TYPES } from "./types-productive.js";
import { READING_TYPES } from "./types-reading.js";
import { gradeItem } from "./grade.js";
import { gradeNum, makeContext, normCtx, rngForItem, uniqueByStem, wordsOf } from "./core.js";

export const TYPES = [
  ...MEANING_TYPES,
  ...DEEPER_TYPES,
  ...MORPH_TYPES,
  ...READING_TYPES,
  ...PRODUCTIVE_TYPES,
  ...LISTEN_TYPES,
];
export const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t]));

const BAND_GRADES = { early: [0, 2], "upper-elem": [3, 5], middle: [6, 8], high: [9, 12] };
const bandsOf = (t) =>
  Object.entries(BAND_GRADES)
    .filter(([, [lo, hi]]) => t.maxGrade >= lo && t.minGrade <= hi)
    .map(([b]) => b);
const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);

/** SPEC §6 registry. `build/render/grade` close over the engine so a type can be used on its own. */
export const ACTIVITY_TYPES = TYPES.map((t) => ({
  id: t.id,
  label: t.label[0],
  labelEs: t.label[1],
  group: t.group,
  dims: t.dims,
  dim: t.dim,
  bands: bandsOf(t),
  minGrade: t.minGrade,
  maxGrade: t.maxGrade,
  domain: t.domain,
  mode: t.mode,
  scope: t.scope,
  build: (unit, ctx) => buildItems(t.id, unit, ctx),
  grade: (item, response, opts) => gradeItem(item, response, opts),
}));

/** True when the type is meant for this grade (K = 0). */
export const fitsGrade = (t, grade) => {
  const g = gradeNum(grade);
  return g >= t.minGrade && g <= t.maxGrade;
};

/**
 * Items of one type for a unit. ctx: { grade, band, supports, salt, pool (extra words for distractors),
 * onlyWords (ids), limit, force (ignore the grade range), I }. Returns [] when the unit gives the type nothing to say.
 */
export function buildItems(typeId, unit, ctx = {}) {
  const t = TYPE_BY_ID[typeId];
  if (!t) throw new Error(`buildItems: unknown activity type "${typeId}"`);
  if (!unit?.words?.length) return [];
  const c0 = normCtx(ctx, unit);
  if (!ctx.force && !fitsGrade(t, c0.grade)) return [];
  const make = (key, seq, extra = {}, fn = t.make) => {
    const c = makeContext(t, unit, ctx, rngForItem(unit, ctx, t.id, key), extra);
    c.key = key;
    c.seq = seq;
    return asList(fn(c));
  };
  const out = [];
  if (t.scope === "word" || t.scope === "both")
    wordsOf(unit, c0).forEach((w, i) => out.push(...make(w.id, i + 1, { word: w })));
  if (t.scope === "unit") out.push(...make("u", 1));
  if (t.scope === "both" && t.makeUnit) out.push(...make("u", 1, {}, t.makeUnit));
  let items = uniqueByStem(out.filter(Boolean)).map((it, i, all) => ({ ...it, band: c0.band, grade: c0.grade, n: i + 1, of: all.length }));
  if (ctx.limit && items.length > ctx.limit) {
    const keep = new Set(rngForItem(unit, ctx, t.id, "limit").shuffle(items.map((x) => x.id)).slice(0, ctx.limit));
    items = items.filter((x) => keep.has(x.id));
  }
  return items;
}

/** Ids of the types that give this unit at least one item at this grade, in library order. */
export const typesFor = (unit, ctx = {}) =>
  ACTIVITY_TYPES.filter((t) => buildItems(t.id, unit, ctx).length > 0).map((t) => t.id);

/** One mixed set: the first `perType` items of each requested type, interleaved so types alternate. */
export function buildMixed(unit, ctx = {}, typeIds = typesFor(unit, ctx), perType = 2) {
  const lists = typeIds.map((id) => buildItems(id, unit, { ...ctx, limit: perType }).slice(0, perType));
  const out = [];
  for (let i = 0; i < perType; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}
