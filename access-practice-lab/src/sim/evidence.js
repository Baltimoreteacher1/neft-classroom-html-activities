// Living Language Simulation Engine: language evidence. Speak, write, revise and transfer tasks go through the
// shared feedback loop (src/intel/loop.js, src "sim"), so each one is also a ledger entry and Passport, the Time
// Machine and the class summary see the same record as every other Part 2 surface. Feedback comes from the shared
// engine (src/intel/engine.js buildFeedback); this module never writes its own.
// The mission evidence report is plain text for the class review queue: the path taken, the evidence collected, the
// decision, the outcome and each piece of the learner's language, every part labelled, with work done on the
// learner's own kept apart from work done with supports. Nothing is sent unless the learner presses Share.
import { getLoop, loadIntel, recordStage, saveIntel, startLoop } from "../intel/loop.js";
import { inClass, shareWithClass } from "../intel/share.js";
import { DEFAULT_OBJECTIVE } from "./missions/index.js";
import { missionReport } from "./report.js";
import { evidenceOf } from "./schema.js";

export { inClass, missionReport };

/** What the feedback engine may treat as the task's source: the evidence the learner holds, and the mission words. */
export function sourceOf(def, state) {
  const held = Object.keys(state.evidence || {})
    .map((id) => evidenceOf(def, id)?.body?.[0])
    .filter(Boolean);
  return {
    sourceText: held.join(" ").slice(0, 2000),
    sourceTerms: (def.vocabulary || []).map((v) => v.term).slice(0, 40),
  };
}

async function engine() {
  try {
    return await import("../intel/engine.js");
  } catch {
    return null;
  }
}

/** Feedback for one piece of language, or null when the shared engine cannot be loaded. Stored nowhere. */
export async function feedbackOn(def, state, task, { text, source, supports, band }) {
  const mod = await engine();
  if (!mod?.buildFeedback) return null;
  try {
    return mod.buildFeedback({
      text,
      keyUse: task.keyUse,
      domain: task.domain,
      source,
      task: { id: `${def.id}:${task.id}`, prompt: task.prompt[0], ...sourceOf(def, state) },
      supports,
      band,
    });
  } catch {
    return null;
  }
}

/**
 * Record one language task in the loop store. A speak or write task starts a loop (response + feedback); a revision
 * and a transfer are stages of the loop of the task they follow (`of`).
 * @returns {Promise<{ loopId: string, feedback: object | null }>}
 */
export async function recordLanguage(
  def,
  state,
  task,
  { text, source = "typed", supports = {}, band, objective },
) {
  const intel = loadIntel();
  const follows = task.type === "revise" || task.type === "transfer";
  let loop = follows ? getLoop(intel, state.loops?.[task.of]) : null;
  let feedback = null;
  if (loop && task.type === "revise") recordStage(intel, loop.id, "revision", { text, supports });
  else if (loop && task.type === "transfer")
    recordStage(intel, loop.id, "transfer", {
      prompt: task.prompt[0].slice(0, 600),
      text,
      supports: {},
    });
  else {
    // A first response (or a follow-up whose first loop is no longer on this device) begins its own loop.
    loop = startLoop(intel, {
      src: "sim",
      band,
      objective: objective || def.objective || DEFAULT_OBJECTIVE,
      task: {
        id: `${def.id}:${task.id}`,
        title: `${def.title[0]}: ${task.type}`,
        prompt: task.prompt[0],
        keyUse: task.keyUse,
        domain: task.domain,
      },
    });
    recordStage(intel, loop.id, "response", {
      text,
      source,
      supports,
      uncertain: source === "transcript",
    });
    if (!follows) {
      feedback = await feedbackOn(def, state, task, { text, source, supports, band });
      if (feedback)
        recordStage(intel, loop.id, "feedback", { feedback, feedbackSource: "local-rule" });
    }
  }
  saveIntel(intel);
  return { loopId: loop.id, feedback };
}

/** The feedback saved for a task's loop (null when there is none). */
export function savedFeedback(state, taskId) {
  const loop = getLoop(loadIntel(), state.loops?.[taskId]);
  return loop?.stages?.feedback?.feedback || null;
}

const en = (pair) => (Array.isArray(pair) ? pair[0] : String(pair || ""));

/** Send the mission evidence report to the class review queue (only ever from a learner's Share press). */
export function shareReport(def, state, fetchImpl) {
  return shareWithClass(
    { label: `Simulation: ${en(def.title)}`.slice(0, 80), text: missionReport(def, state) },
    fetchImpl,
  );
}
