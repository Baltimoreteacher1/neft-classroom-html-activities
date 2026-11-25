// Analyze, then build: carry a Demand Analyzer result into Activity Studio so the teacher can publish or print the
// supported version of a task. Pure data plus one session-storage slot; nothing leaves the device.
//
// What travels: the teacher's own task text (as the reading block), its directions in steps, the pre-teach words that have
// a Word Lab meaning, and the sentence frames for the task's purpose. The task is never rewritten: steps are the same
// words split, and a word with no meaning in the bank is left out rather than given an invented one.
import { safeJson } from "../util.js";

export const HANDOFF_KEY = "accessPracticeLab:v1:handoff-demand";
const SUBJECT_OF = { ela: "ELA", math: "Math", sci: "Science", ss: "Social Studies" };

/** @param {object} result analyzeDemand() output  @param {string} text the teacher's task text */
export function buildHandoff(result, text) {
  if (!result || result.empty) return null;
  const vocab = result.vocabulary.filter((v) => v.gloss);
  const lines = [String(text).trim(), "", ...vocab.map((v) => `${v.word} - ${v.gloss}`)];
  return {
    v: 1,
    text: lines.join("\n"),
    subject: SUBJECT_OF[result.subject] || "",
    steps: result.steps.length > result.stats.sentences ? result.steps : [],
    frames: result.purposes.flatMap((p) => p.frames.guided.slice(0, 2)),
    purposes: result.purposes.map((p) => p.label),
    droppedWords: result.vocabulary.filter((v) => !v.gloss).map((v) => v.word),
  };
}

/** Put the handoff blocks on top of a built activity: directions in steps first, then the frames after the reading. */
export function applyHandoff(activity, handoff) {
  if (!handoff || !activity) return activity;
  const blocks = [...(activity.blocks || [])];
  const top = [];
  if (handoff.steps.length)
    top.push({
      type: "text",
      role: "directions",
      text: handoff.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    });
  const at = blocks.findIndex((b) => b.type === "vocab");
  const frames = handoff.frames.length
    ? [
        {
          type: "text",
          role: "directions",
          text: `Sentence starters:\n${handoff.frames.map((f) => `- ${f}`).join("\n")}`,
        },
      ]
    : [];
  if (at >= 0) blocks.splice(at + 1, 0, ...frames);
  else blocks.push(...frames);
  return { ...activity, blocks: [...top, ...blocks] };
}

export const saveHandoff = (handoff, store = globalThis.sessionStorage) => {
  try {
    store.setItem(HANDOFF_KEY, JSON.stringify(handoff));
    return true;
  } catch {
    return false;
  }
};

/** Read and clear: a handoff is used once, so a later visit to Activity Studio never inherits an old task. */
export function takeHandoff(store = globalThis.sessionStorage) {
  try {
    const h = safeJson(store.getItem(HANDOFF_KEY), null);
    store.removeItem(HANDOFF_KEY);
    return h?.v === 1 && typeof h.text === "string" ? h : null;
  } catch {
    return null;
  }
}
