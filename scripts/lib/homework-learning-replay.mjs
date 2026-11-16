/**
 * Signature Innovation E: Learning Replay + Family Summary
 *
 * Lightweight mount point per page; the timeline and Optional Family Summary are hydrated
 * from `assets/homework/studio-plus.mjs` using ONLY real recorded evidence on this device.
 */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function renderLearningReplayShell(config, lessonId) {
  const notes = config?.familyNotes || {};
  const askEn =
    notes.v3?.kitchenTable?.en ||
    notes.corner?.question?.en ||
    "Ask your student: What changes in this problem, and what stays the same?";
  const askEs =
    notes.v3?.kitchenTable?.es ||
    notes.corner?.question?.es ||
    "Pregúntale a tu estudiante: ¿Qué cambia en este problema y qué se queda igual?";

  return `<section class="lr-replay" id="hw_learning_replay" data-lesson-id="${esc(lessonId)}" data-lr-ask-en="${esc(askEn)}" data-lr-ask-es="${esc(askEs)}" aria-label="Learning Replay"></section>`;
}
