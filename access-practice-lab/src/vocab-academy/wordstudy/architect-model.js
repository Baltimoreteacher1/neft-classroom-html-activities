// Word Architect — pure model (no DOM, no storage). Node tests import it directly.
import { AFFIXES, ROOTS, SPELLING } from "./architect-data.js";

export const ARCH_KEY = "accessPracticeLab:v1:wordArchitect";
export const rootById = (id) => ROOTS.find((r) => r.id === id) || null;

/** Letters of the part as it is spelled inside a word ("trans-" → "trans", "-ation" → "ation"). */
export const partText = (id) => (AFFIXES[id] ? AFFIXES[id].form.replace(/-/g, "") : "");

/** The spelling rule that applies when this prefix meets this root, or null. */
export function spellingRule(root, p) {
  if (!p) return null;
  const pre = partText(p);
  return SPELLING.find((r) => pre.endsWith(r.prefixEnds) && root.form.startsWith(r.rootStarts)) || null;
}

/** The pieces as spelled inside the word, in order, after the SPELLING rules (ex + spect → ex | pect). */
export function pieces(root, p, s) {
  const out = [];
  if (p) out.push({ kind: "prefix", id: p, text: partText(p) });
  const rule = spellingRule(root, p);
  out.push({ kind: "root", id: root.id, text: rule ? root.form.slice(rule.rootStarts.length) : root.form, form: root.form });
  if (s) out.push({ kind: "suffix", id: s, text: partText(s) });
  return out;
}
export const joined = (root, p, s) =>
  pieces(root, p, s)
    .map((x) => x.text)
    .join("");

/**
 * What a combination is. Never a guess: every combination of a root's tiles is listed in the data.
 * → { kind: "word" | "rare" | "nonword" | "root" | "unlisted", word, entry }
 */
export function classify(root, p = "", s = "") {
  const word = joined(root, p, s);
  const match = (e) => e.p === p && e.s === s;
  const entry = root.words.find(match);
  if (entry) return { kind: "word", word, entry };
  const rare = root.rare.find(match);
  if (rare) return { kind: "rare", word, entry: rare };
  const non = root.nonwords.find(match);
  if (non) return { kind: "nonword", word, entry: non };
  if (!p && !s && root.rootAlone) return { kind: "root", word, entry: { why: root.rootAlone } };
  return { kind: "unlisted", word, entry: null };
}

/** Every [prefix, suffix] pair a learner can make with this root's tiles, including none. */
export function combos(root) {
  const out = [];
  for (const p of ["", ...root.prefixes]) for (const s of ["", ...root.suffixes]) out.push([p, s]);
  return out;
}

/** Parts of speech a word can fill: its main one plus any `also`. */
export const posList = (entry) => [entry.pos, ...(entry.also || [])];

/** Saved progress, always the same shape whatever was stored. */
export function normalizeProgress(raw) {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const map = (v) => {
    const out = {};
    if (v && typeof v === "object" && !Array.isArray(v))
      for (const [k, list] of Object.entries(v))
        if (rootById(k) && Array.isArray(list))
          out[k] = [...new Set(list.filter((x) => typeof x === "string"))].slice(0, 40);
    return out;
  };
  const sentences = {};
  if (o.sentences && typeof o.sentences === "object")
    for (const [k, t] of Object.entries(o.sentences))
      if (typeof t === "string" && /^[a-z]{2,30}$/.test(k)) sentences[k] = t.slice(0, 400);
  const transfer = {};
  if (o.transfer && typeof o.transfer === "object")
    for (const k of Object.keys(o.transfer)) if (rootById(k)) transfer[k] = true;
  return {
    v: 1,
    root: rootById(o.root) ? o.root : ROOTS[0].id,
    built: map(o.built),
    found: map(o.found),
    sentences,
    transfer,
  };
}
