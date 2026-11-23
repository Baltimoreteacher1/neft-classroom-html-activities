// Vocabulary Academy games — pure data layer. Turns a validated unit (or a loose list of word
// records) into the "pool" every game engine reads. No DOM, no storage, deterministic.
import { bandOfGrade, GAME_IDS } from "../contract.js";
import { hashSeed } from "../rng.js";
import { clean, findForm, sentencesOf } from "./text.js";

const usable = (w) => Boolean(w && w.id && w.hw && w.def);
const dedupe = (list) => {
  const seen = new Set();
  return list.filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)));
};
function mostCommon(list) {
  const counts = new Map();
  for (const x of list) if (x != null) counts.set(x, (counts.get(x) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * Build the pool a game works from.
 * input: { unit?, words?, review?, grade?, band? }
 *   words  = explicit word records (a "my review words" run); they replace unit.words as the targets
 *   review = earlier-unit word records mixed in by the review games
 */
export function normalize(input = {}) {
  const unit = input.unit || null;
  const explicit = Array.isArray(input.words) && input.words.length ? input.words : null;
  const words = dedupe((explicit || unit?.words || []).filter(usable));
  const ids = new Set(words.map((w) => w.id));
  const review = dedupe((input.review || []).filter(usable)).filter((w) => !ids.has(w.id));
  const all = [...words, ...review];
  const grade = String(input.grade ?? unit?.grade ?? mostCommon(all.map((w) => w.grade)) ?? "6");
  const fromUnit = Boolean(unit && !explicit);
  const id = fromUnit ? unit.id : `words:${hashSeed(all.map((w) => w.id).join("|")).toString(36)}`;
  return {
    id,
    unit,
    fromUnit,
    grade,
    band: input.band || bandOfGrade(grade),
    words,
    review,
    all,
    byId: new Map(all.map((w) => [w.id, w])),
    passage: unit?.passage || null,
    relations: unit?.relations || {},
    study: unit?.study || null,
    title: fromUnit ? unit.title : "My review words",
  };
}

export const seedFor = (gameId, pool, run = 0) => hashSeed(`${gameId}:${pool.id}:${run}`);
export const isGameId = (id) => GAME_IDS.includes(id);

/** Groups of target words that belong together: relations.groups first, then each word's `rel` label. */
export function groupsFor(pool) {
  const ids = new Set(pool.words.map((w) => w.id));
  const fromRel = (pool.relations.groups || [])
    .map((g) => ({ label: clean(g.label), ids: (g.ids || []).filter((id) => ids.has(id)) }))
    .filter((g) => g.label && g.ids.length);
  if (fromRel.length >= 2) return fromRel;
  const byLabel = new Map();
  for (const w of pool.words) {
    const label = clean(w.rel);
    if (!label) continue;
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label).push(w.id);
  }
  const fromWordRel = [...byLabel].map(([label, list]) => ({ label, ids: list }));
  return fromWordRel.length >= 2 ? fromWordRel : fromRel;
}
export const groupOf = (groups, wordId) => groups.find((g) => g.ids.includes(wordId));

/** Target words in the order a theme walks them: group by group, then any ungrouped words in unit order. */
export function themedOrder(pool) {
  const out = [];
  for (const g of groupsFor(pool)) for (const id of g.ids) if (!out.includes(id)) out.push(id);
  for (const w of pool.words) if (!out.includes(w.id)) out.push(w.id);
  return out.map((id) => pool.byId.get(id)).filter(Boolean);
}

/** Other words in the pool, as distractor candidates for `word`. */
export const others = (pool, word) => pool.all.filter((w) => w.id !== word.id);

/**
 * Choose up to n distractor words. Prefers an antonym that is in the pool (clearly wrong), then words from a
 * different relation group; never one that shares a picture glyph, a synonym or the headword with the target.
 */
export function pickDistractors(pool, word, n, rng, { reject = () => false } = {}) {
  const groups = groupsFor(pool);
  const mine = groupOf(groups, word.id);
  const glyphs = new Set(word.visual?.glyphs || []);
  const syn = new Set([...(word.syn || []), ...(word.ant || [])].map((s) => s.toLowerCase()));
  const ok = (w) =>
    !reject(w) &&
    w.hw.toLowerCase() !== word.hw.toLowerCase() &&
    !syn.has(w.hw.toLowerCase()) &&
    !(w.visual?.glyphs || []).some((g) => glyphs.has(g));
  const cand = others(pool, word).filter(ok);
  const ant = (word.ant || []).map((a) => a.toLowerCase());
  const antWords = cand.filter((w) => ant.includes(w.hw.toLowerCase()));
  const rest = cand.filter((w) => !antWords.includes(w));
  const far = rng.shuffle(rest.filter((w) => (mine ? !mine.ids.includes(w.id) : true)));
  const near = rng.shuffle(rest.filter((w) => (mine ? mine.ids.includes(w.id) : false)));
  return [...antWords.slice(0, 1), ...far, ...near].slice(0, n);
}

/** Every sentence of the passage with its paragraph number: [{ p, s, text }]. */
export function passageSentences(pool) {
  const out = [];
  (pool.passage?.paras || []).forEach((para, p) =>
    sentencesOf(para).forEach((text, s) => out.push({ p, s, text })),
  );
  return out;
}
/** Index (into passageSentences) of the first sentence that uses the word, or -1. */
export const locateInPassage = (sentences, word) =>
  sentences.findIndex((s) => findForm(s.text, word));

/** The meanings a word can carry: its main sense plus any taught `senses`. */
export function sensesOf(word) {
  const main = { pos: word.pos, def: word.def, example: word.ex };
  const extra = (word.senses || [])
    .filter((s) => s.def)
    .map((s) => ({ pos: s.pos || word.pos, def: s.def, example: s.example || "" }));
  return [main, ...extra];
}

export const hasCloze = (c) =>
  Boolean(c && typeof c.s === "string" && c.s.split("___").length === 2 && c.f);
/** A grade-aware choice count: 3 for K-2 (fewer things to hold in mind), otherwise 4. */
export const choiceCount = (pool) => (pool.band === "early" ? 3 : 4);
