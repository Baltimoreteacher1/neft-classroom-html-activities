// long-division-narration.js — the "Watch it solved" half of the Long Division
// Lab, with no DOM in it.
//
// Solve mode asks the student for every number. Watch mode works the SAME
// problem itself, one Divide → Multiply → Subtract → Bring Down step at a time,
// saying out loud what it is doing and why. The two modes must never disagree
// about the algorithm, so this file derives the narration from the very step
// list solve mode drills — `plan.steps` from ./long-division-steps.js — one
// frame per step, in order, holding the step object itself rather than a copy.
//
// A frame is everything the board needs to redraw at that moment:
//   shown      how many of plan.steps are on the board (the drawing cursor)
//   step       the LDStep being narrated, or null for the point-move and finish
//   shiftDone  false only while the decimal point still has to move
//   headline   "Step 2 — MULTIPLY"
//   text       plain language, naming the numbers: "1 × 12 = 12. Write 12 under the 13."
//
// tools/long-division-builder.test.mjs drives this file directly.

import { labT } from "./lab-strings-es.js";
import { stepPosition } from "./long-division-steps.js";

/** @typedef {import("./long-division-steps.js").LDStep} LDStep */
/** @typedef {ReturnType<typeof import("./long-division-steps.js").buildLongDivision>} LDPlan */

/**
 * @typedef {Object} LDFrame
 * @property {"shift"|"step"|"finish"} kind
 * @property {number} shown        Steps of `plan.steps` visible on the board.
 * @property {LDStep|null} step    The step this frame narrates.
 * @property {boolean} shiftDone   Has the decimal point already moved?
 * @property {number} cycle        Zero-based cycle index.
 * @property {string} label        "Divide", "Bring Down", "Move the point", "Finished".
 * @property {string} headline     Short heading for the narration line.
 * @property {string} text         The sentence a student reads or hears.
 * @property {boolean} cycleRestart True when this frame announces the repeat.
 */

/**
 * One sentence for one step, naming every number it touches.
 * @param {LDPlan} plan
 * @param {LDStep} step
 * @returns {string}
 */
function sentence(plan, step) {
  const v = plan.divisor;
  const c = plan.cycles[step.cycle];
  const column = plan.digits[c.index];
  if (step.type === "divide") {
    if (c.quotientDigit === 0) {
      return labT(
        "long-division-narration.divide-zero",
        "How many {v}s fit into {current}? None — {v} is bigger than {current}. Write 0 above the {column} and keep going, because that 0 holds the place.",
        { v, current: c.current, column },
      );
    }
    return labT(
      "long-division-narration.divide-digit",
      "How many {v}s fit into {current}? {digit}, because {digit} × {v} = {product}, and {next} × {v} = {bigger} would be too big. Write {digit} above the {column}.",
      {
        v,
        current: c.current,
        digit: c.quotientDigit,
        product: c.product,
        next: c.quotientDigit + 1,
        bigger: c.product + v,
        column,
      },
    );
  }
  if (step.type === "multiply") {
    const groups =
      c.quotientDigit === 1
        ? labT("long-division-narration.one-group", "1 group")
        : labT("long-division-narration.n-groups", "{n} groups", { n: c.quotientDigit });
    return labT(
      "long-division-narration.multiply",
      "{digit} × {v} = {product}. Write {product} under the {current} — that is how much of the {current} is used up by {groups} of {v}.",
      { digit: c.quotientDigit, v, product: c.product, current: c.current, groups },
    );
  }
  if (step.type === "subtract") {
    return labT(
      "long-division-narration.subtract",
      "{current} − {product} = {difference}. The {difference} left over is smaller than {v}, which is how you know {digit} was the right digit — if {difference} were {v} or more, another {v} would still fit.",
      {
        current: c.current,
        product: c.product,
        difference: c.difference,
        v,
        digit: c.quotientDigit,
      },
    );
  }
  const brought = c.bringDown ? c.bringDown.digit : 0;
  const next = plan.cycles[step.cycle + 1];
  const made = next ? next.current : c.difference * 10 + brought;
  return labT(
    "long-division-narration.bringdown",
    "Pull the next digit, {brought}, straight down beside the {difference} to make {made}. That finishes cycle {n} — now REPEAT the cycle from the top: divide {made} by {v}.",
    { brought, difference: c.difference, made, n: step.cycle + 1, v },
  );
}

/**
 * The closing frame: what the answer is, and why the division stopped.
 * @param {LDPlan} plan
 * @returns {LDFrame}
 */
function finishFrame(plan) {
  const shown = plan.decimal
    ? `${plan.dividendText} ÷ ${plan.divisorText}`
    : `${plan.workingDividendText} ÷ ${plan.workingDivisorText}`;
  let text;
  if (plan.remainder === 0) {
    text = labT(
      "long-division-narration.finish-exact",
      "There is nothing left to bring down and the last difference is 0, so the division is exact: {shown} = {quotient}. Check it by multiplying back: {check}.",
      { shown, quotient: plan.quotientText, check: plan.checkText },
    );
  } else if (plan.decimal) {
    text = labT(
      "long-division-narration.finish-decimal",
      "There is nothing left to bring down at this place and {remainder} is still left over, so {shown} is about {quotient} — the quotient is cut off at that last place.",
      { remainder: plan.remainderText, shown, quotient: plan.quotientText },
    );
  } else {
    text = labT(
      "long-division-narration.finish-remainder",
      "There is nothing left to bring down, so the last difference IS the remainder: {shown} = {quotient} remainder {remainder}. Check it by multiplying back: {check}.",
      { shown, quotient: plan.quotientText, remainder: plan.remainderText, check: plan.checkText },
    );
  }
  return {
    kind: "finish",
    shown: plan.steps.length,
    step: null,
    shiftDone: true,
    cycle: Math.max(0, plan.cycles.length - 1),
    label: labT("long-division-narration.finished", "Finished"),
    headline: labT("long-division-narration.finished", "Finished"),
    text,
    cycleRestart: false,
  };
}

/**
 * Build the whole watch-mode script for a plan.
 *
 * Frame order: the optional point-move, then exactly one frame per entry of
 * `plan.steps` (same order, same objects), then the result.
 *
 * @param {LDPlan} plan
 * @returns {LDFrame[]}
 * @throws {RangeError} when handed something that is not a built plan.
 */
export function buildNarration(plan) {
  if (!plan || !Array.isArray(plan.steps) || !Array.isArray(plan.cycles) || !plan.cycles.length) {
    throw new RangeError("narration needs a built long-division plan");
  }
  /** @type {LDFrame[]} */
  const frames = [];
  if (plan.shift > 0) {
    const places =
      plan.shift === 1
        ? labT("long-division-narration.one-place", "1 place")
        : labT("long-division-narration.n-places", "{n} places", { n: plan.shift });
    frames.push({
      kind: "shift",
      shown: 0,
      step: null,
      shiftDone: false,
      cycle: 0,
      label: labT("long-division-narration.move-point", "Move the point"),
      headline: labT("long-division-narration.step-0-headline", "Step 0 — MOVE THE POINT"),
      text: labT(
        "long-division-narration.shift",
        "The divisor {divisor} is not a whole number, so slide the point {places} to the right in BOTH numbers: {dividend} ÷ {divisor} becomes {workingDividend} ÷ {workingDivisor}. The answer does not change, and now the cycle runs exactly as it does with whole numbers.",
        {
          divisor: plan.divisorText,
          places,
          dividend: plan.dividendText,
          workingDividend: plan.workingDividendText,
          workingDivisor: plan.workingDivisorText,
        },
      ),
      cycleRestart: false,
    });
  }
  plan.steps.forEach((step, i) => {
    frames.push({
      kind: "step",
      shown: i + 1,
      step,
      shiftDone: true,
      cycle: step.cycle,
      label: step.label,
      headline: labT("long-division-narration.step-headline", "Step {n} — {label}", {
        n: stepPosition(step.type) + 1,
        label: step.label.toUpperCase(),
      }),
      text: sentence(plan, step),
      cycleRestart: step.type === "bringdown",
    });
  });
  frames.push(finishFrame(plan));
  return frames;
}

/**
 * A bounded cursor over the frames. Kept here rather than in the DOM file so
 * the playback order is testable without a browser; the caller owns the timer.
 *
 * @param {LDFrame[]} frames
 */
export function createNarrationCursor(frames) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new RangeError("narration playback needs at least one frame");
  }
  let i = 0;
  const clamp = (n) => Math.max(0, Math.min(frames.length - 1, n));
  return {
    get index() {
      return i;
    },
    get length() {
      return frames.length;
    },
    frame: () => frames[i],
    atStart: () => i === 0,
    atEnd: () => i === frames.length - 1,
    next() {
      i = clamp(i + 1);
      return frames[i];
    },
    back() {
      i = clamp(i - 1);
      return frames[i];
    },
    reset() {
      i = 0;
      return frames[i];
    },
    goto(n) {
      i = clamp(Math.floor(Number(n)) || 0);
      return frames[i];
    },
  };
}

export default buildNarration;
