// Sentence frames for differentiated versions. WIDA-aligned original practice (never official WIDA material): the
// frames are generic, grammatical sentence starters keyed to the four WIDA Key Language Uses (Narrate, Inform,
// Explain, Argue) plus two the studio already uses (evidence from a text, show your steps in math). `full` frames
// give the whole structure; `partial` frames give only the start. The player shows a question's `frame` on the hint
// ladder when supports.frames is on (player/question.js), and the worksheet prints it (print/worksheet.js).
//
// A teacher's own frame is never replaced: frames are only added to questions whose `frame` is empty.

import { blocksOf, passageText } from "./differentiate-util.js";
import { questionsOf } from "./schema.js";

export const FRAME_BANK = Object.freeze({
  narrate: { full: "First, ___. Next, ___. Last, ___.", partial: "First, ___. Next, ___." },
  inform: {
    full: "___ is ___. One fact is ___. Another fact is ___.",
    partial: "___ is ___. One fact is ___.",
  },
  explain: {
    full: "I know ___ because ___. This shows ___.",
    partial: "I know ___ because ___.",
  },
  argue: {
    full: "I think ___ because ___. One reason is ___.",
    partial: "I think ___ because ___.",
  },
  evidence: { full: "The text says ___. This shows ___.", partial: "The text says ___." },
  math: {
    full: "First I ___. Then I ___. So the answer is ___.",
    partial: "First I ___. So the answer is ___.",
  },
  error: {
    full: "The mistake is in step ___. A better way is ___.",
    partial: "The mistake is in step ___.",
  },
  retell: {
    full: "The text is about ___. One detail is ___. This shows ___.",
    partial: "The text is about ___.",
  },
  choose: { full: "I choose ___ because ___.", partial: "" },
});

const FORMATS_FULL = new Set(["short", "error", "choice", "multi", "number"]);
const FORMATS_PARTIAL = new Set(["short", "error"]);
const TEXTY = /\b(text|passage|story|author|details?|evidence|paragraph|article)\b/i;
const ARGUE = /\b(agree|disagree|opinion|claim|argue|convince|should|better|best|prove|justify)\b/i;
const NARRATE = /\b(retell|what happened|sequence|events?)\b/i;
const EXPLAIN = /\b(why|how|explain|reason|because)\b/i;
const MATHISH = /math|algebra|geometry|number/i;

/** The frame family that fits a question: by its format first, then by the language it asks for. */
export function frameKey(q, activity) {
  if (q.format === "error") return "error";
  if (q.format === "choice" || q.format === "multi") return "choose";
  if (q.format === "number") return "math";
  const subject = activity.context.subject;
  if (blocksOf(activity, "passage").length && TEXTY.test(q.prompt)) return "evidence";
  if (ARGUE.test(q.prompt)) return "argue";
  if (NARRATE.test(q.prompt)) return "narrate";
  if (MATHISH.test(subject)) return "math";
  if (q.kind === "explain" || EXPLAIN.test(q.prompt) || /science|social/i.test(subject))
    return "explain";
  return "inform";
}

/**
 * Add frames to questions that have none.
 * @param {"full"|"partial"} level `full` also frames choice, number and select-all questions; `partial` only short and error.
 * @returns {string[]} ids of the questions that received a frame
 */
export function addFrames(activity, level) {
  const allowed = level === "full" ? FORMATS_FULL : FORMATS_PARTIAL;
  const done = [];
  for (const q of questionsOf(activity)) {
    if (q.frame || !allowed.has(q.format)) continue;
    const frame = FRAME_BANK[frameKey(q, activity)][level];
    if (!frame) continue;
    q.frame = frame;
    done.push(q.id);
  }
  return done;
}

/** True when the activity has a passage to quote from (used by the evidence frame and the challenge items). */
export const hasPassage = (activity) => passageText(activity).trim().length > 0;
