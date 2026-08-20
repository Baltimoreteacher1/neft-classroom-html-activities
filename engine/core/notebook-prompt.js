/**
 * notebook-prompt.js — the notebook is where the math work happens.
 *
 * THE PROBLEM. 760 of the 1,646 core-lesson practice items are multiple-choice
 * and a further 262 are error-analysis: roughly 1,022 items that accept an
 * answer which required no visible work, and in the multiple-choice case may
 * have required no work at all. A student can tap through a practice set having
 * written nothing.
 *
 * WHAT THIS DOES. Derives one short instruction telling the student to do THIS
 * problem in their notebook, labelled with the problem number so the page can be
 * found again. It never blocks the answer input — the software cannot see the
 * notebook, so any "I worked it out" gate enforces a CLAIM rather than the work,
 * and the tap becomes muscle memory within days. Honor system, monitored
 * separately.
 *
 * TWO HARD RULES, both load-bearing:
 *
 *  1. NOTHING IS AUTHORED PER ITEM. Every string here is either generic
 *     instruction copy or derived from a field the item already has. No lesson
 *     may be asked to add a field to get a prompt, and absence is a PASS.
 *     This is not fastidiousness: the copy-panel system ran the other
 *     experiment. A gate REQUIRED a `copyPanel` on every checkpoint, so lessons
 *     with nothing quotable had to be given something, and the only available
 *     something was invention — 39 of 84 box-2 rules ended up stating another
 *     lesson's mathematics. Full 84/84 coverage was the shape the invented
 *     content took, not evidence of success.
 *
 *  2. A STEP COUNT IS ONLY EVER REPORTED WHEN THE ITEM ACTUALLY HAS ONE.
 *     Error-analysis items carry `workedExample`, a real array of steps, so
 *     "about 4 steps" is a fact about that item. Multiple-choice items carry no
 *     such array — `explanation` is prose, and counting its sentences to
 *     manufacture a number would be inventing a claim about the mathematics,
 *     which is rule 1 wearing a different hat. Those items get no number.
 *
 * EXCLUSIONS. For a manipulative the SCREEN is the work surface: telling a
 * student to fold a net or drag algebra tiles on paper is simply wrong. Keyed
 * off the item's own `type`, never a hand-maintained list of lesson ids, so a
 * lesson that adopts a manipulative is excluded the moment it does.
 */

/**
 * The fields of a practice item this module reads. Declared rather than typed
 * as `object`, which tsc treats as having no properties at all — and rather
 * than `any`, which would let a rename slip through silently. Every field is
 * optional: an item that carries none of them derives no prompt, which is the
 * correct silent default.
 *
 * @typedef {{
 *   type?: string,
 *   steps?: unknown[],
 *   correctWork?: unknown[],
 *   workedExample?: unknown[],
 * }} PracticeItem
 */

/**
 * Item types this prompt is FOR.
 *
 * Deliberately the two "selection" types, where an answer can be produced with
 * no written work. `open-response` already asks for writing; `drag-sort`,
 * `fill-table` and the matching types are on-screen manipulation whose work is
 * visible in the interaction itself.
 */
export const NOTEBOOK_PROMPT_TYPES = new Set(["multiple-choice", "error-analysis"]);

/**
 * Types where the screen is the work surface. Listed explicitly rather than
 * inferred as "everything not included", so that a NEW item type defaults to no
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

/** Generic instruction copy, per targeted type. Not lesson content. */
const COPY = {
  "multiple-choice": {
    en: (n) => `Do #${n} in your notebook, then choose your answer.`,
    es: (n) => `Haz el #${n} en tu cuaderno y luego elige tu respuesta.`,
  },
  "error-analysis": {
    en: (n) => `Write out the correct work for #${n} in your notebook.`,
    es: (n) => `Escribe el trabajo correcto del #${n} en tu cuaderno.`,
  },
};

/** Suffix naming a REAL step count. Never called without one. */
const STEPS = {
  en: (k) => ` About ${k} steps.`,
  es: (k) => ` Unos ${k} pasos.`,
};

/**
 * How many steps of written work this item genuinely takes, or null.
 *
 * Only counts an actual array of steps the item already carries. Returns null
 * rather than guessing — see rule 2 above.
 *
 * @param {PracticeItem} def  a practice item
 * @returns {number|null}
 */
export function derivedStepCount(def = {}) {
  const candidates = [def.correctWork, def.workedExample, def.steps];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 1) return c.length;
  }
  return null;
}

/**
 * The notebook instruction for an item, or null if it should stay silent.
 *
 * @param {PracticeItem|null|undefined} def  a practice item
 * @param {number|string|null|undefined} number  the problem number already shown on the card
 * @returns {{en: string, es: string, steps: number|null}|null}
 */
export function notebookPromptFor(def, number) {
  if (!def || typeof def !== "object") return null;
  // A number is required: the whole point is a label the student can write at
  // the top of the page and find again. An unlabelled "do this in your
  // notebook" is the generic nag this design exists to avoid.
  if (number == null || number === "") return null;

  const type = def.type;
  if (!NOTEBOOK_PROMPT_TYPES.has(type)) return null;
  // Belt and braces: a type can never be both, but if the sets are ever edited
  // carelessly the exclusion must win.
  if (SCREEN_IS_THE_WORK_SURFACE.has(type)) return null;

  const copy = COPY[type];
  if (!copy) return null;

  let en = copy.en(number);
  let es = copy.es(number);

  const steps = derivedStepCount(def);
  if (steps != null) {
    en += STEPS.en(steps);
    es += STEPS.es(steps);
  }

  return { en, es, steps };
}
