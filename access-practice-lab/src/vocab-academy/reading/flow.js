// Vocabulary Academy reader — the "After" move: questions one at a time, evidence taps, and what finishing records. PURE.
// Free retry, no score, no timer. A miss never shows the reason or the right answer (that is for the right answer only);
// it says the choice was not it and invites another try. An `evidence` question with `ev` has no choices: the learner taps
// the sentence in the text that proves it.
import { sentenceSpans, wordSpans, norm } from "./text.js";

/** What a question's result counts toward in the learning model (SPEC §4: dimensions rec/mean/ctx/…). Others record nothing. */
export const SKILL_DIM = { "word-meaning": "mean", context: "ctx" };

export const MISS_CHOICE = [
  "Not quite. Read the question again, look back at the text, and try another choice.",
  "Casi. Lee la pregunta otra vez, mira el texto y prueba otra opción.",
];
export const MISS_EVIDENCE = [
  "That sentence does not prove it. Read the question again and look for the sentence that does.",
  "Esa oración no lo demuestra. Lee la pregunta otra vez y busca la oración que sí lo hace.",
];

/** An evidence question the learner answers by tapping the text: it carries `ev` and the sentence is really in the text. */
export function isTapEvidence(q, paras) {
  if (!q?.ev) return false;
  const p = paras?.[q.ev.para];
  return typeof p === "string" && p.includes(q.ev.text);
}

/**
 * Does tapping sentence `sentence` of paragraph `para` prove it? Right when the tapped sentence and `ev.text` overlap by at
 * least half of the shorter of the two, in the same paragraph (a quoted line that holds two sentences accepts either).
 */
export function checkEvidenceTap(q, paras, { para, sentence }) {
  if (!isTapEvidence(q, paras) || para !== q.ev.para) return false;
  const p = paras[para];
  const sents = sentenceSpans(p);
  const s = sents[sentence];
  if (!s) return false;
  const start = p.indexOf(q.ev.text);
  const end = start + q.ev.text.length;
  const overlap = Math.min(end, s.end) - Math.max(start, s.start);
  return overlap > 0 && overlap >= Math.min(end - start, s.end - s.start) / 2;
}

/** A choice answer: pure verdict plus the learner-facing feedback. `why` appears only with a right answer. */
export function checkChoice(q, index) {
  const ok = index === q.a;
  return ok ? { ok, kind: "right", why: q.why } : { ok, kind: "retry", text: MISS_CHOICE };
}
export const checkEvidence = (q, paras, tap) => {
  const ok = checkEvidenceTap(q, paras, tap);
  return ok ? { ok, kind: "right", why: q.why } : { ok, kind: "retry", text: MISS_EVIDENCE };
};

/** Gentle feedback on the right answer: the learner has earned the reason. */
export const RIGHT_TEXT = ["Yes. That is right.", "Sí. Es correcto."];

/**
 * The learning-model records finishing produces: [{ wordId, dim, ok }]. Only questions of a skill in SKILL_DIM that name
 * exactly one lesson word count; `ok` is the FIRST attempt, so free retry never hides what the learner knew at first.
 * `ans` is state.ans ({ [qid]: { first, tries } }); unanswered questions record nothing.
 */
export function planResults(reading, words, ans) {
  const out = [];
  for (const q of reading.qs || []) {
    const dim = SKILL_DIM[q.skill];
    const a = ans?.[q.id];
    if (!dim || !a) continue;
    const named = namedWords(q.q, words);
    if (named.length === 1) out.push({ wordId: named[0], dim, ok: a.first === true });
  }
  return out;
}

/** The lesson words a question's own stem names (inflections count). */
export const namedWords = (stem, words) => [...new Set(wordSpans(stem, words).map((w) => w.id))];

/** "Spot the words": how many of the words the learner tapped really are in the text. */
export function spotSummary(textWordIds, picked) {
  const inText = new Set(textWordIds);
  const hit = [...new Set(picked)].filter((id) => inText.has(id));
  const extra = [...new Set(picked)].filter((id) => !inText.has(id));
  return {
    hit: hit.length,
    total: inText.size,
    extra: extra.length,
    missed: [...inText].filter((id) => !hit.includes(id)).length,
  };
}

/** Index of the next question the learner has not answered right yet (state.ans), or -1 when all are done. */
export function nextOpen(reading, ans) {
  return (reading.qs || []).findIndex((q) => !ans?.[q.id]?.right);
}

/** True when every question has been answered correctly at least once. */
export const allAnswered = (reading, ans) =>
  (reading.qs || []).length > 0 && nextOpen(reading, ans) === -1;

/** Shuffle-free check that a question's right choice is not always first: used by the content sweeps. */
export const rightPositions = (qs) => (qs || []).map((q) => q.a);

export const sameSentence = (a, b) => norm(a) === norm(b);
