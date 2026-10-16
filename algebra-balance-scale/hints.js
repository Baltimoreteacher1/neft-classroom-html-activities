/**
 * The hint ladder. Help is earned, not handed out: nothing unlocks until the
 * student has tried (a wrong entry or a move that does not undo the operation),
 * the first rung names a METHOD, the second names a concrete next MOVE, and no rung
 * ever states a result, a solution, or the numbers the student has still to type.
 * Returns string keys and values; strings.js turns them into EN or ES text.
 */
import { moveText, nextStep, unsimplified } from "./balance-model.js";

export const MAX_RUNGS = 2;

function methodKey(eq) {
  const step = nextStep(eq);
  if (step.kind === "cancelX") return step.negative ? "hintMethodNegX" : "hintMethodX";
  if (step.kind === "scale") return step.move.op === "\u00f7" ? "hintMethodMul" : "hintMethodDiv";
  return "hintMethodConst";
}

/** Help while the student is choosing a move. */
export function moveHint(eq, rung, v) {
  const step = nextStep(eq);
  if (rung === 0 || !step.move) return { key: methodKey(eq), vars: { v } };
  return { key: "hintStepMove", vars: { move: moveText(step.move, v) } };
}

/** Help while the student is writing what each side becomes. */
export function entryHint(pre, move, rung, v, wrongSide) {
  if (rung === 0) return { key: "hintEntryMethod", vars: { v } };
  const s = wrongSide === "right" ? pre.r : pre.l;
  return {
    key: "hintEntryStep",
    vars: { side: wrongSide, work: unsimplified(s, move, v) },
  };
}

/** Help while graphing an inequality's answer. */
export function graphHint(rung) {
  return { key: rung === 0 ? "hintGraphMethod" : "hintGraphStep", vars: {} };
}
