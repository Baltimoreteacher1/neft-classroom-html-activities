// Authoring helpers for Language City content. Every learner-facing string is a { en, es } pair, written once.
// A mission is a chain of steps; each step is one real language task:
//   choose  read a sign or menu, listen to a character, pick a reply, ask for clarification, repair a misunderstanding
//   build   put word tiles in order to make a question or reply (tap tiles; no dragging needed)
//   say     write the line in your own words; the wording check from Real-Life Scenarios looks at your words only
// Supports are what the learner chooses before a mission: none, a word bank, or a sentence frame. Hints and supports never
// state the answer (tools/access-language-city.test.mjs enforces it).

/** A bilingual string. */
export const bi = (en, es) => ({ en, es });

/** A printed document: a sign, a menu, a bill, a label, a schedule. `lines` are [en, es] pairs. */
export const doc = (kind, headEn, headEs, lines) => ({
  type: "doc",
  kind,
  head: bi(headEn, headEs),
  lines: lines.map(([en, es]) => bi(en, es)),
});

/** A character's spoken line. The learner can hear it; the written words stay hidden until asked for. */
export const speech = (en, es) => ({ type: "speech", ...bi(en, es) });

const bank = (pairs) => pairs.map(([en, es]) => bi(en, es));
const opts = (rows) =>
  rows.map(([id, en, es, whyEn, whyEs]) => ({ id, en, es, why: bi(whyEn, whyEs) }));

/**
 * One pick-an-answer step. `role` is read | listen | respond | clarify | repair. `target` (optional) is a language target
 * from src/lang/scenarios.js TAGS. Options are [id, en, es, whyEn, whyEs]; every option explains itself, and the wrong ones
 * name the slip without saying what to pick instead.
 */
export function choose({
  id,
  role,
  target = "",
  mood = "neutral",
  stim,
  ask,
  options,
  answer,
  words,
  frame,
  hint,
}) {
  return {
    id,
    kind: "choose",
    role,
    target,
    mood,
    stim,
    ask: bi(...ask),
    opts: opts(options),
    answer,
    bank: bank(words),
    frame: bi(...frame),
    hint: bi(...hint),
  };
}

/**
 * One word-tile step. `tiles` are in display order (already scrambled). `ok` lists every accepted tile order; `slips` are
 * [order, whyEn, whyEs] for the mistakes learners really make, each explained without the fix.
 */
export function build({
  id,
  role,
  target,
  mood = "neutral",
  intent,
  tiles,
  ok,
  slips,
  words,
  frame,
  hint,
}) {
  return {
    id,
    kind: "build",
    role,
    target,
    mood,
    intent: bi(...intent),
    tiles,
    ok,
    slips: slips.map(([order, whyEn, whyEs]) => ({ order, why: bi(whyEn, whyEs) })),
    bank: bank(words),
    frame: bi(...frame),
    hint: bi(...hint),
  };
}

/** The closing step: the learner writes the line themselves. */
export function say({ id, target, mood = "pleased", prompt, words, frame }) {
  return {
    id,
    kind: "say",
    role: "say",
    target,
    mood,
    prompt: bi(...prompt),
    bank: bank(words),
    frame: bi(...frame),
  };
}

/** A mission: 5-6 chained steps in one building with one character. */
export function mission({ id, place, title, goal, use, steps }) {
  return { id, place, title: bi(...title), goal: bi(...goal), use, steps };
}
