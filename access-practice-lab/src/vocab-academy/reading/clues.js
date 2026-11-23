// Vocabulary Academy reader — "Find the clue". PURE.
// A clue says where, inside one paragraph, the text itself explains a word. The learner picks a word, then taps a word of
// the phrase that explains it. A right tap earns a labelled highlight of the whole phrase; a wrong tap earns a neutral
// message that carries NOTHING about the phrase (no offsets, no text, no hint of direction), so retry is always free.
import { norm, sentenceSpans, tokenSpans } from "./text.js";

export const CLUE_TYPES = ["definition", "example", "contrast", "synonym", "restatement"];

/** Labels for the clue types, in words and with a shape so the type is never carried by colour alone: [en, es, glyph, name]. */
export const CLUE_LABEL = {
  definition: [
    "Definition clue",
    "Pista de definición",
    "▭",
    "A definition says what the word means.",
  ],
  example: ["Example clue", "Pista de ejemplo", "◆", "An example shows the word in action."],
  contrast: [
    "Contrast clue",
    "Pista de contraste",
    "⇄",
    "A contrast tells what the word is not like.",
  ],
  synonym: ["Synonym clue", "Pista de sinónimo", "＝", "A synonym is a word that means the same."],
  restatement: [
    "Restatement clue",
    "Pista de repetición",
    "↻",
    "A restatement says the same thing again in other words.",
  ],
};

/** What the learner is told after a tap that did not land on the explaining phrase. Never varies, never leaks. */
export const MISS_TEXT = [
  "That does not explain the word. Look again.",
  "Eso no explica la palabra. Mira otra vez.",
];

/** Where a clue's phrase sits: { para, start, end } by exact match in its paragraph, or null when the text is not there. */
export function clueSpan(paras, clue) {
  const p = paras?.[clue?.para];
  if (typeof p !== "string" || !clue?.text) return null;
  const start = p.indexOf(clue.text);
  return start < 0 ? null : { para: clue.para, start, end: start + clue.text.length };
}

/** The clues that can really be played: they name a type we know and their phrase is in the text. */
export const playableClues = (paras, clues) =>
  (clues || []).filter((c) => CLUE_TYPES.includes(c.type) && clueSpan(paras, c));

/**
 * Which clue (index into `clues`) a tap finds for `wordId`: the tap must be on a word of the phrase, in the clue's own
 * paragraph. `tap` is { para, charIndex }. Returns -1 for a miss. Only the clues of that word are considered, so a tap on
 * another word's phrase is a miss.
 */
export function findClueAt(paras, clues, wordId, tap) {
  const hit = (clues || []).findIndex((c) => {
    if (c.word !== wordId || c.para !== tap?.para) return false;
    const span = clueSpan(paras, c);
    if (!span || !(tap.charIndex >= span.start && tap.charIndex < span.end)) return false;
    // Only a tap on a letter or digit counts, never on the blank between words.
    return tokenSpans(paras[c.para]).some((t) => tap.charIndex >= t.start && tap.charIndex < t.end);
  });
  return hit;
}

export const blankClueState = () => ({ target: "", found: [] });

/**
 * One step of the clue game. `act` is { select: wordId } or { tap: { para, charIndex } }. Returns
 *   { state, event }   event: "selected" | "no-clue-for-word" | "pick-word-first" | "tapped-the-word" | "found" | "again" | "miss"
 * `state.found` holds indexes of found clues. The result of a miss is { event: "miss" } and the state unchanged: a miss
 * never reveals the phrase and never counts against the learner.
 */
export function clueStep(state, paras, clues, act, { wordAt } = {}) {
  const s = { target: state.target || "", found: [...(state.found || [])] };
  if (act.select !== undefined) {
    const has = (clues || []).some((c) => c.word === act.select);
    if (!has) return { state: { ...s, target: "" }, event: "no-clue-for-word" };
    return { state: { ...s, target: act.select }, event: "selected" };
  }
  if (!s.target) return { state: s, event: "pick-word-first" };
  if (wordAt?.(act.tap) === s.target) return { state: s, event: "tapped-the-word" };
  const i = findClueAt(paras, clues, s.target, act.tap);
  if (i < 0) return { state: s, event: "miss" };
  if (s.found.includes(i)) return { state: s, event: "again", clue: i };
  s.found.push(i);
  s.target = "";
  return { state: s, event: "found", clue: i };
}

/** The found clues as highlight ranges per paragraph: { [para]: [{ start, end, type, clue }] }, sorted. */
export function foundRanges(paras, clues, found) {
  const out = {};
  for (const i of found || []) {
    const c = clues?.[i];
    const span = c && clueSpan(paras, c);
    if (!span) continue;
    (out[c.para] ||= []).push({ start: span.start, end: span.end, type: c.type, clue: i });
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.start - b.start);
  return out;
}

/** A clue's type is one of the five; anything else is treated as a plain restatement label. */
export const clueLabel = (type) => CLUE_LABEL[type] || CLUE_LABEL.restatement;

/**
 * The sentence index a phrase starts in, for a tap-target explanation ("This clue is in sentence 2" is NOT shown to
 * learners before they find it; it is for the teacher key and tests).
 */
export function clueSentence(paras, clue) {
  const span = clueSpan(paras, clue);
  if (!span) return -1;
  return sentenceSpans(paras[clue.para]).findIndex(
    (s) => span.start >= s.start && span.start < s.end,
  );
}

/** A tap target comparison that ignores case and spacing, shared with evidence checks. */
export const sameText = (a, b) => norm(a) === norm(b);
