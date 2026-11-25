// Challenge items for the Extension tier, the increase-challenge preset and the writing task. Every item is built
// from the activity's OWN passage or vocabulary (its sentences, title, terms and meanings); nothing is invented, no
// facts or definitions are added, and no sample answer is written. They are short written responses: never
// auto-graded, each with a hint, an explanation for the teacher and a rubric.

import { FRAME_BANK } from "./differentiate-frames.js";
import { blocksOf, freshId, passageText, vocabItems } from "./differentiate-util.js";
import { sentencesOf } from "./parse.js";

const wordsIn = (s) => s.split(/\s+/).filter(Boolean).length;

/** The first plain statement of the passage, 5 to 16 words, used as the sentence to expand. */
export function stemSentence(activity) {
  const stem = sentencesOf(passageText(activity)).find(
    (s) => /[.!]["')\]]*$/.test(s) && !/\[\[/.test(s) && wordsIn(s) >= 5 && wordsIn(s) <= 16,
  );
  return stem ? stem.replace(/["')\]]*$/, "").replace(/[.!]$/, "") : "";
}

function expansion(activity, id) {
  const stem = stemSentence(activity);
  const word = vocabItems(activity)[0];
  const prompt = stem
    ? `Make this sentence from the text longer three ways. Write one sentence with "because", one with "but", and one with "so": "${stem}."`
    : word && vocabItems(activity).length >= 2
      ? `Use the word "${word.term}" (${word.def}) in a sentence. Then make it longer three ways with "because", "but" and "so".`
      : "";
  if (!prompt) return null;
  return {
    id,
    type: "question",
    format: "short",
    kind: "write",
    prompt,
    sample: "",
    rubric: [
      "The because sentence gives a reason that fits",
      "The but sentence shows a different or opposite idea",
      "The so sentence shows what happens as a result",
      stem ? "Keeps the facts from the text" : "Keeps the meaning given in the word list",
    ],
    minWords: 12,
    hint: "Because tells why. But shows a different idea. So tells what happens next.",
    explanation:
      "Because, but and so each build a longer sentence from the same start. Read the three sentences for meaning. This is not scored automatically.",
    skill: "sentence expansion",
  };
}

function evidence(activity, id, withFrame) {
  const passage = blocksOf(activity, "passage")[0];
  const items = vocabItems(activity);
  const base = {
    id,
    type: "question",
    format: "short",
    kind: "explain",
    sample: "",
    skill: "evidence",
  };
  if (passage) {
    const title = passage.title ? `"${passage.title}"` : "the text";
    return {
      ...base,
      prompt: `Use details from ${title} to explain the main idea. Quote or retell at least one detail as evidence.`,
      rubric: [
        "States the main idea in the student's own words",
        "Uses at least one detail from the text as evidence",
        "Explains how the detail supports the main idea",
      ],
      minWords: 15,
      hint: "Reread the text. Find one detail that shows the main idea.",
      explanation:
        "A strong response states the main idea and supports it with a detail from the text. Read each response. This is not scored automatically.",
      frame: withFrame ? FRAME_BANK.evidence.full : "",
    };
  }
  if (items.length < 2) return null;
  return {
    ...base,
    prompt:
      "Choose one word from the word list. Tell what it means and give your own example. Use the meaning given in the list.",
    rubric: [
      "Uses the word correctly",
      "Matches the meaning given in the word list",
      "Gives an example that makes sense",
    ],
    minWords: 8,
    hint: "Read the meaning in the word list. Then think of a time you could use the word.",
    explanation:
      "A strong response uses the word the way the word list defines it and adds an example of the student's own. Read each response. This is not scored automatically.",
    frame: withFrame ? FRAME_BANK.explain.full : "",
  };
}

/**
 * The challenge items the activity's own content can support.
 * @param {object} opts { taken: Set of ids already used, frame: add a sentence frame to the evidence response }
 * @returns {{ questions: object[], reason: string }} `reason` is "" or why nothing could be added
 */
export function challengeItems(activity, { taken, frame = false }) {
  const ids = taken || new Set(activity.blocks.map((b) => b.id));
  const out = [];
  const bbs = expansion(activity, freshId("ext-expand", ids));
  if (bbs) out.push(bbs);
  const ev = evidence(activity, freshId("ext-evidence", ids), frame);
  if (ev) out.push(ev);
  const reason = out.length === 0 ? "no-source" : "";
  return { questions: out, reason };
}
