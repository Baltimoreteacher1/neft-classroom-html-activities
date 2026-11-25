// Question builders shared by the vocabulary-based adapters (vocab-academy, bcpss-unit). Same recipes as
// core/generate.js (match sets of at most six, cloze with a fixed word), but built only from terms, meanings,
// examples and Spanish that the source data already holds: nothing is invented, and ids are deterministic.

import { balancedGroups, rotate, seedOf, shorten, text } from "./util.js";

const VOCAB_LIMITS = { term: 80, def: 300, es: 80, example: 300 };

/**
 * A vocabulary block that never loses text to the schema's field limits: an over-long field is shortened at a sentence
 * boundary in the block and its full text goes to `extra` (lines for a teacher-only note), so nothing disappears.
 * Items need a term and meaning; `es` and `example` are optional.
 */
export function vocabBlock(items) {
  const extra = [];
  const fitted = items.map((v) => {
    const out = {};
    for (const [field, max] of Object.entries(VOCAB_LIMITS)) {
      const value = text(v[field]);
      out[field] = shorten(value, max);
      if (out[field] !== value) extra.push(`Full ${field} of "${v.term}": ${value}`);
    }
    return out;
  });
  return { block: { type: "vocab", id: "vocab", items: fitted }, extra };
}

/** Match questions: balanced sets of two to six words each, so every word appears in exactly one set. */
export function matchQuestions(vocab, firstNumber = 1) {
  const groups = balancedGroups(vocab, 6);
  return groups.map((group, i) => ({
    type: "question",
    id: `m${firstNumber + i}`,
    format: "match",
    prompt:
      groups.length > 1
        ? `Match each word to its meaning (set ${i + 1} of ${groups.length}).`
        : "Match each word to its meaning.",
    pairs: group.map((v, n) => ({ id: `p${n + 1}`, left: v.term, right: v.def })),
    hint: "Read each meaning slowly. Start with the one you know best.",
    explanation: group.map((v) => `${v.term}: ${v.def}`).join(" "),
    skill: "vocabulary",
  }));
}

/** A choice question whose options are the answer plus its distractors, in a deterministic (seeded) order. */
export function choiceQuestion({
  id,
  prompt,
  answer,
  distractors,
  hint = "",
  explanation = "",
  frame = "",
  skill = "",
}) {
  const words = [answer, ...distractors];
  const shifted = rotate(words, words.length - (seedOf(prompt) % words.length));
  const options = shifted.map((w, n) => ({ id: `o${n + 1}`, text: text(w) }));
  return {
    type: "question",
    id,
    format: "choice",
    prompt,
    options,
    answer: options.find((o) => o.text === text(answer))?.id ?? "",
    hint,
    frame,
    explanation,
    skill,
  };
}

/** An open response: never auto-graded; `rubric` is the self-check list and `sample` the model response. */
export const openQuestion = ({
  id,
  prompt,
  kind = "explain",
  frame = "",
  rubric = [],
  sample = "",
  hint = "",
}) => ({
  type: "question",
  id,
  format: "short",
  kind,
  prompt,
  frame,
  hint,
  rubric: rubric.map(text).filter(Boolean),
  sample: text(sample),
});
