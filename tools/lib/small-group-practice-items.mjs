/**
 * small-group-practice-items.mjs — authored small-group practice
 * (data/small-group-practice/<lesson>.json, docs/specs/small-group-practice-v1.md)
 * in the item shapes the rest of the curriculum prints and grades.
 *
 * The studio renders the authored problems itself. Two other surfaces reuse
 * them — the Apply Day leveled tables (scripts/generate-part-two.mjs) and the
 * small-group printed worksheets (scripts/generate-worksheets.mjs) — and both
 * speak the older practice-item vocabulary (`multiple-choice`, `guided-fill`).
 * This is the one translation, so a problem reads the same on screen, at the
 * Apply Day table and on paper.
 */

/** Studio notation → print text: {3/4} → 3/4, 2{1/2} → 2 1/2, ⟶ → →. */
export const plainMath = (s) =>
  String(s ?? "")
    .replace(/(\d)\{(\d+)\/(\d+)\}/g, "$1 $2/$3")
    .replace(/\{(\d+)\/(\d+)\}/g, "$1/$2")
    .replace(/\s*⟶\s*/g, " → ");

/** Worked steps as one explanation sentence ("Put the values in order: 1, 3, 5. …"). */
export function stepText(steps, es = false) {
  return (steps || [])
    .map((st) => {
      const lead = es ? st.doEs : st.do;
      const math = es && st.mathEs !== undefined ? st.mathEs : st.math;
      const m = Array.isArray(math) ? math.join("; ") : math;
      return m === undefined ? lead : `${String(lead).replace(/[.:]\s*$/, "")}: ${m}`;
    })
    .map(plainMath)
    .join(" ");
}

/**
 * One authored problem (On my own / Check / Challenge / catch-up, or a Build
 * "Your turn") → a `multiple-choice` item when it has choices, otherwise a
 * one-answer `guided-fill`. Its figure travels as `buildFigure`, a Build
 * figure spec the caller draws with engine/core/small-group-build-figures.js.
 */
export function toPracticeItem(it) {
  const common = {
    stem: plainMath(it.problem),
    stemEs: plainMath(it.problemEs),
    hints: it.hint ? [plainMath(it.hint)] : [],
    hintsEs: it.hintEs ? [plainMath(it.hintEs)] : [],
    explanation: stepText(it.steps, false),
    explanationEs: stepText(it.steps, true),
    ...(it.figure ? { buildFigure: it.figure } : {}),
  };
  if (Array.isArray(it.choices))
    return {
      type: "multiple-choice",
      ...common,
      choices: it.choices.map(plainMath),
      choicesEs: (it.choicesEs || []).map(plainMath),
      correctIndex: it.correct,
      choiceFeedback: (it.choiceWhy || []).map(plainMath),
    };
  return { type: "guided-fill", ...common, answer: plainMath(it.answer) };
}

/**
 * A Practice Together problem → a `guided-fill` whose steps are the questions
 * the group answered, so the printed sheet walks the same path.
 */
export function togetherToPracticeItem(t) {
  return {
    type: "guided-fill",
    stem: plainMath(t.problem),
    stemEs: plainMath(t.problemEs),
    steps: t.steps.map((s) => ({
      prompt: plainMath(s.ask),
      promptEs: plainMath(s.askEs),
      answer: plainMath(s.answer),
    })),
    answer: plainMath(t.answer),
    ...(t.figure ? { buildFigure: t.figure } : {}),
  };
}
