// Scaffold Studio fading: the student-facing four-step view of the Language Quest ladder.
//
// The lab already owns a five-rung ladder and its fading rule (src/quest/engine.js RUNGS, src/quest/pathway.js
// suggestRung). This module does NOT add a second rule. It maps those rungs onto the four words students and teachers
// see (full frame, partial frame, one hint, none) and wraps the rule so that:
//   * fading only ever SUGGESTS. The student can pick any step at any time;
//   * "I need more help" is always one tap, moves exactly one step up, and carries no penalty: it is recorded as help,
//     never as an error, a miss or a score, and a run that used it is simply not counted toward the next fade.
import { RUNGS, rungIndex } from "../quest/engine.js";
import { suggestRung } from "../quest/pathway.js";

export const STEPS = Object.freeze(["full", "partial", "hint", "none"]);
export const STEP_LABEL = Object.freeze({
  full: { en: "Full frame", es: "Marco completo" },
  partial: { en: "Part of the frame", es: "Parte del marco" },
  hint: { en: "One hint", es: "Una pista" },
  none: { en: "On my own", es: "Por mi cuenta" },
});

// model and frame both read as "full": the picture-and-model rung is an extra the student can open from the full step.
const RUNG_TO_STEP = Object.freeze({ model: "full", frame: "full", partial: "partial", cue: "hint", independent: "none" });
const STEP_TO_RUNG = Object.freeze({ full: "frame", partial: "partial", hint: "cue", none: "independent" });

export const stepForRung = (rung) => RUNG_TO_STEP[rung] || "full";
export const rungForStep = (step) => STEP_TO_RUNG[step] || "frame";
export const stepIndex = (step) => Math.max(0, STEPS.indexOf(step));

/** Suggest a starting step from past runs (the same record shape src/quest stores: { rung, help, hints, requiredMet }). */
export function suggestStep(history = [], teacher = {}) {
  const r = suggestRung(history, teacher);
  return { step: stepForRung(r.rung), why: r.why, suggestedOnly: true };
}

/** One step more support than `step`. At the top ("full") the same step, with the model rung offered instead. */
export function needMoreHelp(step) {
  const i = stepIndex(step);
  if (i === 0) return { step: "full", openModel: true };
  return { step: STEPS[i - 1], openModel: false };
}

/** A run as the profile stores it. `help` is neutral bookkeeping, not a mistake. */
export function makeRun({ step, helpAsked = false, hints = 0, requiredMet = true, at = "" }) {
  return { rung: rungForStep(step), help: Boolean(helpAsked), hints: Math.max(0, hints | 0), requiredMet: Boolean(requiredMet), at };
}

export { RUNGS, rungIndex };
