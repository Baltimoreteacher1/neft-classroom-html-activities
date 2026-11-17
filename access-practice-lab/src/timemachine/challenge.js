// Language Time Machine — "Try it in a new context": a new task that keeps the language goal (the Key Language Use)
// and changes the context, so the learner can see whether the language travels.
//   original  "Explain why plants need sunlight."
//   new task  "Explain how reduced sunlight could affect an ecosystem."
// The prompt comes from the Language Intelligence Engine's `transferFor` (passed in). The response is saved as a NEW
// loop in src/intel/loop.js (src "time-machine", stage "transfer"), so it becomes the newest piece to compare.
//
// Rules this module keeps:
//  * Help is closed by default. Opening it marks the work supported, and that is never undone.
//  * Earlier work is not touched: the new response is a new loop; the link back to the piece it came from is kept in
//    this feature's own key (reflect.js `links`).
import { FRAMES } from "../lang/lexicon.js";
import { recordStage, startLoop } from "../intel/loop.js";

export const TASK_PREFIX = "tm-";
export const MIN_WORDS = 3;
const words = (t) =>
  String(t || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/**
 * The new-context task for one item.
 * @param {object} from a collected item
 * @param {{transferFor:Function, done?:string[]}} deps `done` = task ids of challenges already answered
 */
export function challengeFor(from, { transferFor, done = [] }) {
  const ownId = String(from.taskId || "").startsWith(TASK_PREFIX)
    ? from.taskId.slice(TASK_PREFIX.length)
    : from.taskId;
  const exclude = done
    .filter((id) => id.startsWith(TASK_PREFIX))
    .map((id) => id.slice(TASK_PREFIX.length));
  const t = transferFor({
    keyUse: from.keyUse || "Explain",
    taskId: ownId,
    prompt: from.prompt,
    exclude,
  });
  const prompt = Array.isArray(t?.prompt)
    ? t.prompt
    : [String(t?.prompt || ""), String(t?.prompt || "")];
  return {
    id: `${TASK_PREFIX}${t?.id || ownId}`,
    prompt: [prompt[0], prompt[1] || prompt[0]],
    keyUse: t?.keyUse || from.keyUse || "Explain",
    domain: from.domain,
    fromId: from.id,
    fromPrompt: from.prompt || from.taskTitle,
  };
}

/** The optional help for a challenge: sentence frames for this kind of response. Shown only when opened. */
export const helpFrames = (keyUse) =>
  (FRAMES[keyUse]?.guided || FRAMES.Explain?.guided || []).slice(0, 3);

export const canSave = (text) => words(text) >= MIN_WORDS;

/**
 * Save a finished challenge as a new loop and remember which piece it came from.
 * @returns {{loop:object, entry:object} | null} null when there are not enough words to save
 */
export function saveChallenge(
  intel,
  tm,
  challenge,
  { text, supports = {}, audioId = "", source = "typed", band = "6-8" },
  opts = {},
) {
  if (!canSave(text)) return null;
  const loop = startLoop(
    intel,
    {
      src: "time-machine",
      band,
      task: {
        id: challenge.id,
        title: challenge.prompt[0],
        prompt: challenge.prompt[0],
        keyUse: challenge.keyUse,
        domain: challenge.domain,
      },
    },
    opts.now,
  );
  const entry = recordStage(
    intel,
    loop.id,
    "transfer",
    { prompt: challenge.prompt[0], text, supports, source, ...(audioId ? { audioId } : {}) },
    { ledger: opts.ledger !== false, ...(opts.now ? { now: opts.now } : {}) },
  );
  tm.links[challenge.id] = challenge.fromId;
  return { loop, entry };
}
