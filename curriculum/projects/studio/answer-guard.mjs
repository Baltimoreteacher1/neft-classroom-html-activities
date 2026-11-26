/**
 * Hidden-answer guard shared by the family designers. Pure (no DOM).
 *
 * The Studio hides each Test answer until the student matches it (or the viewer is the teacher).
 * A designer may compute anything, but any number it derives that equals a still-hidden answer is
 * shown as "?". The answers come from math.mjs `model(...).checks`, so there is one source of truth.
 */
import { model } from "./math.mjs";
import { eq, num } from "./exact.mjs";

/** Exact values of the answers that are still hidden for this student and design. */
export function hiddenAnswers(project, state) {
  if (!state || state.role === "teacher") return [];
  const m = model(project, state.design || {});
  return m.checks
    .filter((q) => state.checked?.[q.id] !== true)
    .map((q) => num(q.answer))
    .filter(Boolean);
}

/** True when `x` (an exact value) equals one of the hidden answers. */
export const isHidden = (hidden, x) => !!x && hidden.some((h) => eq(h, x));
