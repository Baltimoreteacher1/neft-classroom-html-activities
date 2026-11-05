/**
 * Your Turn: which three problems a family sees, and in what order.
 *
 *   A  Understand it   a concept check: what the notation or the model means (authored basic item 1)
 *   B  Solve it        a strategy item: represent or carry out the method (authored basic item 3)
 *   C  Use it          transfer: the lesson's own new-situation problem (`v3.transfer`)
 *
 * Every problem is authored for the lesson (sidecar `basicPractice` and `v3.transfer`); nothing is
 * generated. The rest of the basic items follow, so Check & Improve has authored fresh problems
 * that are not the three the family just did. A lesson with fewer than three basic items (Unit 10,
 * mindset lessons) keeps its existing order and plain numbering.
 */

import { extractLessonKeywords, scoreTextAlignment } from "../homework-alignment.mjs";

/** The transfer item in the same shape as a basic item, so scoring, hints and the answer sheet are unchanged. */
export function transferAsProblem(notes) {
  const t = notes?.v3?.transfer;
  if (!t?.stem?.en || !Array.isArray(t.choices) || !t.choices.length) return null;
  const correctIndex = t.choices.findIndex((c) => c.correct);
  if (correctIndex < 0) return null;
  const corner = notes.corner || {};
  const hintSet = [
    corner.frame && { en: corner.frame.en, es: corner.frame.es },
    corner.watchOut && { en: corner.watchOut.en, es: corner.watchOut.es },
    notes.bigIdea && { en: notes.bigIdea.en, es: notes.bigIdea.es },
  ].filter(Boolean);
  const wrong = (c) => !c.correct;
  return {
    type: "multiple-choice",
    stem: t.stem.en,
    stemEs: t.stem.es,
    choices: t.choices.map((c) => c.en),
    choicesEs: t.choices.map((c) => c.es),
    correctIndex,
    explanation: t.reasoning.en,
    explanationEs: t.reasoning.es,
    choiceFeedback: t.choices.map((c) =>
      wrong(c) ? t.reasoning.en : `Correct. ${t.reasoning.en}`,
    ),
    choiceFeedbackEs: t.choices.map((c) =>
      wrong(c) ? t.reasoning.es : `Correcto. ${t.reasoning.es}`,
    ),
    choiceEvidence: t.choices.map((c) => ({ misconception: c.misconception || null })),
    hints: hintSet.map((h) => h.en),
    hintsEs: hintSet.map((h) => h.es),
    topic: notes.v3.topicKey,
    isTransfer: true,
  };
}

/**
 * Order the authored items as A, B, C, then the rest. `roles[i]` is "A" | "B" | "C" for the first three, else "".
 * The transfer problem is C unless the repo's own alignment scoring reads its stem as another lesson's topic
 * (a cube-volume stem under exponents trips the anti-keywords); then C is the lesson's last basic item and the
 * transfer stays in the optional "A new challenge" stop (`transferUsed` false).
 */
export function selectYourTurn(basic, notes, config) {
  let transfer = transferAsProblem(notes);
  if (transfer && config && scoreTextAlignment(transfer.stem, extractLessonKeywords(config)) < 0) {
    transfer = null;
  }
  const pool = basic.slice();
  const take = (i) => (i < pool.length ? pool.splice(i, 1)[0] : null);
  const a = pool.length >= 2 || transfer ? take(0) : null;
  const b = a ? take(pool.length >= 2 ? 1 : 0) : null; // the third of six once the first is out
  const c = transfer || (a && b ? take(pool.length - 1) : null);
  if (!a || !b || !c) return { ordered: basic, roles: [], transferUsed: false };
  return { ordered: [a, b, c, ...pool], roles: ["A", "B", "C"], transferUsed: Boolean(transfer) };
}

export const ROLE_LABELS = {
  A: { en: "A · Understand it", es: "A · Entiéndelo" },
  B: { en: "B · Solve it", es: "B · Resuélvelo" },
  C: { en: "C · Use it", es: "C · Úsalo" },
};
