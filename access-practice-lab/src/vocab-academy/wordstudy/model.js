// Word Study — pure logic over the morphology dataset (no DOM, no network). Everything here takes the dataset or the
// index built from it, so it runs in node tests and in the browser alike.
export const GRADE_ORDER = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
export const gradeRank = (g) => {
  const i = GRADE_ORDER.indexOf(String(g ?? "").toUpperCase());
  return i < 0 ? GRADE_ORDER.length - 1 : i;
};
const lc = (w) => String(w ?? "").trim().toLowerCase();
const isBase = (id) => String(id).startsWith("base:");
export const baseWord = (id) => String(id).slice(5);

/** Build lookup tables once per dataset. */
export function buildIndex(data) {
  const parts = Array.isArray(data?.parts) ? data.parts : [];
  const partById = new Map(parts.map((p) => [p.id, p]));
  const derivs = Array.isArray(data?.derivations) ? data.derivations : [];
  const derivByWord = new Map();
  const derivByKey = new Map();
  const bases = new Set();
  for (const d of derivs) {
    const k = lc(d.word);
    if (!derivByWord.has(k)) derivByWord.set(k, []);
    derivByWord.get(k).push(d);
    derivByKey.set(d.parts.join("|"), d);
    for (const id of d.parts) if (isBase(id)) bases.add(baseWord(id));
  }
  const compounds = Array.isArray(data?.compounds) ? data.compounds : [];
  const compoundByWord = new Map(compounds.map((c) => [lc(c.word), c]));
  for (const c of compounds) for (const p of c.parts) bases.add(p);
  const falseFriends = Array.isArray(data?.falseFriends) ? data.falseFriends : [];
  const falseByWord = new Map(falseFriends.map((f) => [lc(f.word), f]));
  const inflBases = new Set();
  for (const r of data?.inflections || []) for (const e of r.examples) inflBases.add(lc(e.base));
  return { data, parts, partById, derivs, derivByWord, derivByKey, bases, compounds, compoundByWord, falseFriends, falseByWord, inflBases, families: data?.families || [] };
}

/** The lowest grade at which a part is offered (K = 0). */
export const partMinRank = (p) => (p?.grades?.length ? Math.min(...p.grades.map(gradeRank)) : GRADE_ORDER.length - 1);
export const partsForGrade = (idx, g) => idx.parts.filter((p) => partMinRank(p) <= gradeRank(g));
/** The grade at which a derivation first becomes available: the latest of its parts' first grades. */
export const derivRank = (idx, d) =>
  Math.max(0, ...d.parts.map((id) => (isBase(id) ? 0 : partMinRank(idx.partById.get(id)))));
export const derivationsForGrade = (idx, g) => idx.derivs.filter((d) => derivRank(idx, d) <= gradeRank(g));

/** The pieces of a derivation exactly as spelled (surface), falling back to each part's own form. */
export function surfaceOf(idx, d) {
  if (d.surface) return d.surface;
  return d.parts.map((id) => (isBase(id) ? baseWord(id) : idx.partById.get(id).form.replace(/-/g, "")));
}
export const displayForm = (idx, id) => (isBase(id) ? baseWord(id) : idx.partById.get(id)?.form || id);
export const partMeaning = (idx, id) => (isBase(id) ? "" : idx.partById.get(id)?.meaning || "");

const segmentsOf = (idx, d) => {
  const surf = surfaceOf(idx, d);
  return d.parts.map((id, i) => {
    const p = isBase(id) ? null : idx.partById.get(id);
    return { id, text: surf[i], type: p ? p.type : "base", form: displayForm(idx, id), meaning: p ? p.meaning : "", origin: p?.origin_certain ? p.origin : "" };
  });
};

// ── analyzing a word ───────────────────────────────────────────────────────────────────────────────────────────
// Spelling-aware forward rules for -s/-es/-ed/-ing/-er/-est, used to explain a plain inflected form of a known word.
const VOWELS = "aeiou";
const isCvc = (w) => /[^aeiou][aeiou][^aeiouwxy]$/.test(w) && w.length <= 5;
export function inflectForm(base, kind, suffix = "") {
  const b = lc(base);
  const y = /[^aeiou]y$/.test(b);
  if (kind === "plural") {
    if (/(s|x|z|ch|sh)$/.test(b)) return `${b}es`;
    return y ? `${b.slice(0, -1)}ies` : `${b}s`;
  }
  if (kind === "past") {
    if (b.endsWith("e")) return `${b}d`;
    if (y) return `${b.slice(0, -1)}ied`;
    return isCvc(b) ? `${b}${b.at(-1)}ed` : `${b}ed`;
  }
  if (kind === "now") {
    if (b.endsWith("e") && !b.endsWith("ee")) return `${b.slice(0, -1)}ing`;
    return isCvc(b) ? `${b}${b.at(-1)}ing` : `${b}ing`;
  }
  if (kind === "compare") {
    const end = suffix === "est" ? "est" : "er";
    if (b.endsWith("e")) return `${b}${end === "est" ? "st" : "r"}`;
    if (y) return `${b.slice(0, -1)}i${end}`;
    return isCvc(b) ? `${b}${b.at(-1)}${end}` : `${b}${end}`;
  }
  return b;
}
const INFLECT_PARTS = { plural: ["suf.s", "suf.es"], past: ["suf.ed"], now: ["suf.ing"], compare: ["suf.er.cmp", "suf.est"] };
function analyzeInflected(idx, w) {
  const known = (stem) => idx.derivByWord.has(stem) || idx.compoundByWord.has(stem) || idx.bases.has(stem) || idx.inflBases.has(stem);
  const tries = [];
  const add = (stem, kind, suffix) => known(stem) && !idx.falseByWord.has(stem) && inflectForm(stem, kind, suffix) === w && tries.push({ stem, kind, suffix });
  if (w.endsWith("es")) add(w.slice(0, -2), "plural");
  if (w.endsWith("ies")) add(`${w.slice(0, -3)}y`, "plural");
  if (w.endsWith("s")) add(w.slice(0, -1), "plural");
  if (w.endsWith("ed")) {
    add(w.slice(0, -2), "past");
    add(w.slice(0, -1), "past");
    add(w.slice(0, -3), "past");
    add(`${w.slice(0, -3)}y`, "past");
  }
  if (w.endsWith("ing")) {
    add(w.slice(0, -3), "now");
    add(`${w.slice(0, -3)}e`, "now");
    add(w.slice(0, -4), "now");
  }
  // -er/-est only for adjectives the dataset already knows how to compare.
  const adj = (s) => idx.derivs.some((d) => d.pos === "adj" && d.parts[0] === `base:${s}`) || idx.inflBases.has(s);
  if (w.endsWith("est")) for (const s of [w.slice(0, -3), w.slice(0, -2), w.slice(0, -4), `${w.slice(0, -4)}y`]) adj(s) && add(s, "compare", "est");
  if (w.endsWith("er")) for (const s of [w.slice(0, -2), w.slice(0, -1), w.slice(0, -3), `${w.slice(0, -3)}y`]) adj(s) && add(s, "compare", "er");
  const hit = tries[0];
  if (!hit) return null;
  const partId = hit.kind === "plural" ? (/(es)$/.test(w) && !/ies$/.test(w) && /(s|x|z|ch|sh)$/.test(hit.stem) ? "suf.es" : "suf.s") : hit.kind === "compare" ? (hit.suffix === "est" ? "suf.est" : "suf.er.cmp") : INFLECT_PARTS[hit.kind][0];
  const p = idx.partById.get(partId);
  // Where the stem ends in the surface word: the longest shared start of stem and word.
  let cut = 0;
  while (cut < w.length && cut < hit.stem.length && w[cut] === hit.stem[cut]) cut++;
  return { stem: hit.stem, kind: hit.kind, part: p, cut, ending: w.slice(cut) };
}

/**
 * Take a word apart. Only words the dataset lists (derivations, compounds, families) or plain inflected forms of such
 * words are split; everything else gets { known:false } and an honest "I am not sure". False friends are never split.
 */
export function analyze(idx, word) {
  const w = lc(word);
  const empty = { known: false, word: String(word ?? ""), kind: "unknown", segments: [], gloss: "", transparent: true, spell: "", note: "" };
  if (!w || !/^[a-z]+$/.test(w)) return { ...empty, reason: "not-a-word" };
  const ff = idx.falseByWord.get(w);
  if (ff) return { ...empty, kind: "false-friend", reason: "look-alike", falseFriend: ff };
  const ds = idx.derivByWord.get(w);
  if (ds?.length) {
    const d = ds[0];
    return { known: true, word: d.word, kind: "derivation", pos: d.pos, segments: segmentsOf(idx, d), gloss: d.gloss, transparent: d.transparent !== false, spell: d.spell || "", note: d.note || "", derivation: d };
  }
  const c = idx.compoundByWord.get(w);
  if (c) return { known: true, word: c.word, kind: "compound", segments: c.parts.map((t) => ({ id: `base:${t}`, text: t, type: "base", form: t, meaning: "", origin: "" })), gloss: c.gloss, transparent: c.transparent !== false, spell: "", note: "" };
  const inf = analyzeInflected(idx, w);
  if (inf) {
    const stemDeriv = idx.derivByWord.get(inf.stem)?.[0];
    const stemSeg = stemDeriv ? segmentsOf(idx, stemDeriv) : [{ id: `base:${inf.stem}`, text: inf.stem, type: "base", form: inf.stem, meaning: "", origin: "" }];
    const stemText = w.slice(0, inf.cut);
    const segments = stemDeriv ? [...stemSeg] : [{ ...stemSeg[0], text: stemText }];
    segments.push({ id: inf.part.id, text: inf.ending, type: "suffix", form: inf.part.form, meaning: inf.part.meaning, origin: inf.part.origin_certain ? inf.part.origin : "" });
    return { known: true, word: w, kind: "inflection", segments, gloss: "", transparent: true, spell: inf.ending.replace(/^-/, "") !== inf.part.form.replace("-", "") ? "The spelling of the ending changes a little to fit the word." : "", note: "", inflection: inf.kind };
  }
  return { ...empty, reason: "unlisted" };
}

/** Derivations whose every part is in `partIds` (base words as "base:word"). Never invents a word. */
export function buildable(idx, partIds, { grade } = {}) {
  const have = new Set(partIds);
  const pool = grade == null ? idx.derivs : derivationsForGrade(idx, grade);
  return pool.filter((d) => d.parts.every((id) => have.has(id)));
}
export const buildableWords = (idx, partIds, opts) => buildable(idx, partIds, opts).map((d) => d.word);
export const findDerivation = (idx, parts) => idx.derivByKey.get([...parts].join("|")) || null;
export const isRealDerivation = (idx, parts) => Boolean(findDerivation(idx, parts));

/** Other listed words that share the main base or root of this word (same family), excluding the word. */
export const mainAnchor = (d) => d.parts.find(isBase) || d.parts.find((id) => id.startsWith("root.")) || d.parts[0];
export function relatedForms(idx, word) {
  const w = lc(word);
  const ds = idx.derivByWord.get(w);
  if (!ds?.length) return [];
  const anchors = new Set(ds[0].parts.filter((id) => isBase(id) || id.startsWith("root.")));
  const out = new Set();
  for (const d of idx.derivs) if (lc(d.word) !== w && d.parts.some((id) => anchors.has(id))) out.add(d.word);
  return [...out];
}
export const familiesForGrade = (idx, g) => idx.families.filter((f) => f.words.some((w) => idx.derivByWord.get(lc(w)).some((d) => derivRank(idx, d) <= gradeRank(g))));
export const familyWords = (idx, fam, g) => fam.words.filter((w) => idx.derivByWord.get(lc(w)).some((d) => derivRank(idx, d) <= gradeRank(g)));

/** Anchors (a base word or root) with enough derivations at this grade to make a kit. */
export function kitsForGrade(idx, g, min = 3) {
  const by = new Map();
  for (const d of derivationsForGrade(idx, g)) {
    const a = mainAnchor(d);
    if (!by.has(a)) by.set(a, []);
    by.get(a).push(d);
  }
  return [...by.entries()].filter(([, ds]) => ds.length >= min).map(([anchor, ds]) => ({ anchor, derivs: ds })).sort((a, b) => b.derivs.length - a.derivs.length || a.anchor.localeCompare(b.anchor));
}
