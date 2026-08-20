/**
 * notebook-prompt.js — the notebook is where the math work happens.
 *
 * THE PROBLEM. 760 of the 1,646 core-lesson practice items are multiple-choice
 * and a further 262 are error-analysis: roughly 1,022 items that accept an
 * answer requiring no visible work, and in the multiple-choice case possibly no
 * work at all. A student can tap through a practice set having written nothing.
 *
 * WHAT THIS DOES, AND WHY IT IS NOT A NAG. The first version of this file
 * emitted one line — "Do #2 in your notebook, then choose your answer." It was
 * rejected on sight, correctly: it TELLS rather than HELPS. Willingness is not
 * the barrier. The barrier is a blank page and no idea what the first mark
 * should be.
 *
 * So this returns a SETUP, not a sentence:
 *
 *   • a heading naming the problem number, so the page can be found again;
 *   • when the lesson states one, THE MODEL to write down first — the lesson's
 *     own formula, quoted;
 *   • two short steps describing how the page should look.
 *
 * A student who copies the model and the number has already started, which is
 * the whole objective.
 *
 * IT NEVER BLOCKS THE ANSWER. The software cannot see the notebook, so a gate
 * would enforce a CLAIM rather than the work, and the tap that dismisses it
 * becomes muscle memory within days. Honor system; monitoring is separate.
 *
 * TWO HARD RULES, both load-bearing:
 *
 *  1. NOTHING IS AUTHORED PER ITEM. Every string is generic instruction copy or
 *     quoted from a field the lesson already has. No lesson may be asked to add
 *     anything to get a prompt, and absence is a PASS. The copy-panel system ran
 *     the other experiment: a gate REQUIRED a panel on every checkpoint, lessons
 *     with nothing quotable had to be given something, and 39 of 84 box-2 rules
 *     ended up stating another lesson's mathematics. Full coverage was the shape
 *     the invented content took.
 *
 *  2. THE MODEL IS QUOTED, NEVER COMPOSED. It is read from an explicit
 *     `Formula:` label inside the lesson's own `launch.conceptIntro.keyIdea`
 *     (37 of 84 lessons carry one). Inferring a formula by pattern-matching
 *     `X = Y` across the prose was tried and rejected: it found only 10 lessons
 *     AND mis-parsed 6-11's "Total Amount ÷ Group Size = Number of Groups" down
 *     to "Group Size = Number of Groups", which is a different and false claim.
 *     A label an author wrote is evidence; a regex over prose is a guess.
 *
 * EXCLUSIONS. For a manipulative the SCREEN is the work surface: telling a
 * student to fold a net or drag algebra tiles on paper is wrong. Keyed off the
 * item's own `type`, never a lesson-id list.
 *
 * SPANISH. The wrapper copy is translated. The MODEL is shown identically in
 * both lanes because no lesson authors `keyIdeaEs` (0 of 84) — the formula is
 * the same English-labelled string the lesson already shows in Learn It, and
 * translating it here would be this module inventing mathematics vocabulary the
 * curriculum has not chosen.
 */

/**
 * @typedef {{
 *   type?: string,
 *   steps?: unknown[],
 *   correctWork?: unknown[],
 *   workedExample?: unknown[],
 * }} PracticeItem
 */

/**
 * @typedef {{
 *   head: string, headEs: string,
 *   model: string|null,
 *   steps: Array<{en: string, es: string}>,
 *   stepCount: number|null,
 * }} NotebookPrompt
 */

export const NOTEBOOK_PROMPT_TYPES = new Set(["multiple-choice", "error-analysis"]);

/**
 * Types where the screen is the work surface. Listed explicitly rather than
 * inferred as "everything not included", so a NEW item type defaults to no
 * prompt and has to be added on purpose — silence is the safe direction.
 */
export const SCREEN_IS_THE_WORK_SURFACE = new Set([
  "number-line",
  "balance-scale",
  "coordinate-grid",
  "coordinate-plane",
  "bar-model",
  "net-folder",
  "fraction-bars",
  "algebra-tiles",
]);

/** An explicit `Formula:` label inside the lesson's own key idea. */
const FORMULA_LABEL = /\bFormula:\s*([^.]{4,70}?)\s*(?=\.\s|\.$|\s+\d\.|$)/;

/**
 * The model a student should write down first, quoted from the lesson.
 *
 * Returns null when the lesson states no formula — which is 47 of 84 lessons,
 * and correct. Those items still get the setup structure; they simply have no
 * formula to copy, and manufacturing one would be rule 2's failure.
 *
 * @param {{launch?: {conceptIntro?: {keyIdea?: string}}}|null|undefined} config  a lesson config
 * @returns {string|null}
 */
export function lessonModelFrom(config) {
  const keyIdea = config?.launch?.conceptIntro?.keyIdea;
  if (typeof keyIdea !== "string") return null;
  const m = keyIdea.match(FORMULA_LABEL);
  if (!m) return null;
  const model = m[1].trim();
  // A "formula" with no relational operator is a phrase, not a model to copy.
  if (!/[=:≈≥≤<>]/.test(model)) return null;
  return model;
}

/**
 * How many steps of written work this item genuinely takes, or null.
 *
 * Only counts an actual array the item already carries. Counting sentences in
 * `explanation` to manufacture a number would assert a claim about the
 * mathematics — rule 1 wearing a different hat.
 *
 * @param {PracticeItem} def
 * @returns {number|null}
 */
export function derivedStepCount(def = {}) {
  for (const c of [def.correctWork, def.workedExample, def.steps]) {
    if (Array.isArray(c) && c.length > 1) return c.length;
  }
  return null;
}

/**
 * The notebook setup for an item, or null if it should stay silent.
 *
 * @param {PracticeItem|null|undefined} def
 * @param {number|string|null|undefined} number  the problem number the card shows
 * @param {string|null} [model]  from lessonModelFrom(), when the lesson has one
 * @returns {NotebookPrompt|null}
 */
export function notebookPromptFor(def, number, model = null) {
  if (!def || typeof def !== "object") return null;
  // The number is the label the student writes at the top of the page. Without
  // it this is the generic nag the design exists to avoid.
  if (number == null || number === "") return null;

  const type = def.type;
  if (!NOTEBOOK_PROMPT_TYPES.has(type)) return null;
  if (SCREEN_IS_THE_WORK_SURFACE.has(type)) return null;

  const stepCount = derivedStepCount(def);
  const steps = [];

  if (model) {
    steps.push({
      en: "Copy the model, then fill in what you know.",
      es: "Copia el modelo y completa lo que sabes.",
    });
  } else if (type === "error-analysis") {
    steps.push({
      en: "Write out the correct work, line by line.",
      es: "Escribe el trabajo correcto, línea por línea.",
    });
  } else {
    steps.push({
      en: `Write #${number} and what you are finding.`,
      es: `Escribe el #${number} y qué debes hallar.`,
    });
  }

  steps.push(
    stepCount != null
      ? {
          en: `Show each step — about ${stepCount} — then circle your answer.`,
          es: `Muestra cada paso — unos ${stepCount} — y encierra tu respuesta.`,
        }
      : {
          en: "Show each step, then circle your answer.",
          es: "Muestra cada paso y encierra tu respuesta.",
        },
  );

  return {
    head: `In your notebook — #${number}`,
    headEs: `En tu cuaderno — #${number}`,
    model: model || null,
    steps,
    stepCount,
  };
}
