// retrieval-portable.js — can a lesson's question be asked AWAY from its lesson?
//
// One rule for both consumers: scripts/generate-retrieval-bank.mjs (which
// builds data/retrieval-bank.json at build time) and engine/core/spiral-review.js
// (which lifts a lesson's exit ticket / Connect checks into the warm-up's spiral
// review at runtime). Two copies of this rule would drift, and the failure it
// guards against — a review card asking about "the table above" with no table —
// is the worst one a review can have: the student is not wrong, the question is.

const MAX_STEM_CHARS = 220;

// Stems that only make sense next to something on the lesson page.
const CONTEXT_DEPENDENT =
  /\b(above|below|shown|this (?:table|graph|diagram|figure|model|number line|plot)|the (?:table|graph|diagram|figure|model|plot) (?:above|below|shown)|following (?:table|graph|diagram))\b/i;

// 128 stems open with the lesson they were written for — "(Lesson 4.4) A student
// scored 72 out of 90…". Inside its own lesson that prefix is orientation; on a
// review card three weeks later it is a distraction pointing at the wrong place.
const LESSON_PREFIX = /^\(Lesson\s+[\d.]+\)\s*/;

/** The stem as a review card should ask it. */
export function reviewStem(raw) {
  return String(raw ?? "")
    .trim()
    .replace(LESSON_PREFIX, "")
    .trim();
}

/** Is this item answerable on its own, away from the lesson that authored it? */
export function isPortableItem(item) {
  if (!item || item.type !== "multiple-choice") return false;
  if (!Array.isArray(item.choices) || item.choices.length < 3) return false;
  if (!Number.isInteger(item.correctIndex)) return false;
  if (item.correctIndex < 0 || item.correctIndex >= item.choices.length) return false;
  const stem = reviewStem(item.stem);
  if (stem.length < 10 || stem.length > MAX_STEM_CHARS) return false;
  if (CONTEXT_DEPENDENT.test(stem)) return false;
  // Choices that are not all distinct strings give more than one "correct"
  // button and cannot be scored.
  const choices = item.choices.map((c) => String(c).trim());
  if (choices.some((c) => !c)) return false;
  if (new Set(choices).size !== choices.length) return false;
  // A per-item figure cannot come along, so an item that needs one is out.
  if (item.diagram) return false;
  return true;
}
