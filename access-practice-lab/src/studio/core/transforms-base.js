// Shared plumbing for transforms.js and transforms-writing.js.
// A transform turns an activity into a different kind of task using ONLY content it already has. It never drops an
// answer key it keeps, never changes a fact, and carries the lineage and the objective forward.

import {
  clone,
  finish,
  newActivityId,
  newErrors,
  pair,
  suffixedTitle,
  versionLineage,
  withAdded,
} from "./differentiate-util.js";

/** Why a transformation cannot run: one wording, used by availableTransforms and by the transform itself. */
export const NEEDS = {
  vocabPractice: pair(
    "Needs a word list with at least two words and their meanings.",
    "Necesita una lista con al menos dos palabras y sus significados.",
  ),
  exitTicket: pair(
    "Needs at least three questions that check automatically.",
    "Necesita al menos tres preguntas que se comprueben automáticamente.",
  ),
  speakingTask: pair(
    "Needs a reading passage or an audio transcript of about 20 words or more.",
    "Necesita un texto de lectura o la transcripción de un audio de unas 20 palabras o más.",
  ),
  writingTask: pair(
    "Needs a reading passage of about 20 words or more.",
    "Necesita un texto de lectura de unas 20 palabras o más.",
  ),
};


export const DIRECTION_STEPS = (steps) => steps.map((s, i) => `${i + 1}. ${s}`).join("\n\n");

/**
 * Finish a transform: give the draft a fresh identity (unless `deps.inPlace`), point its lineage at the source, list the
 * blocks the transform added, normalize, and report anything the studio's own validation newly objects to.
 * @returns {{ activity: object, notes: {en,es}[], ran: true }}
 */
export function derive(source, draft, { suffix, added = [], notes = [], deps = {} }) {
  const a = draft;
  if (deps.inPlace) {
    a.lineage = source.lineage ? { ...source.lineage } : null;
    withAdded(a, added);
  } else {
    a.id = (deps.newId || newActivityId)();
    a.rev = 0;
    a.createdAt = 0;
    a.updatedAt = 0;
    a.title = suffixedTitle(source.title, suffix);
    a.lineage = versionLineage(source, "", added);
  }
  const activity = finish(a);
  const extra = newErrors(source, activity).map((e) =>
    pair(
      `A check found a new problem. Fix it before sharing: ${e.message}`,
      "Una revisión encontró un problema nuevo. Corrígelo antes de compartir.",
    ),
  );
  return { activity, notes: [...notes, ...extra], ran: true };
}

/** What a transform returns when it cannot run: the activity unchanged and the reason. Never throws. */
export const cannot = (source, reason) => ({
  activity: clone(source),
  notes: [reason],
  ran: false,
});

/** A copy of the source with its blocks replaced (keeps context, supports, look, options and teacher notes). */
export function draftFrom(source, blocks, patch = {}) {
  return { ...clone(source), blocks, ...patch };
}
