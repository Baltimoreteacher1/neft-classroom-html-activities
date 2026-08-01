#!/usr/bin/env node
/* ==========================================================================
 * long-division-builder.test.mjs — the Long Division Lab must teach the
 * STANDARD algorithm, correctly.
 *
 * The widget this guards used to render partial quotients: it computed the
 * whole answer the moment you pressed a button, and there was nothing for a
 * student to do. The rewrite drills the real cycle — Divide, Multiply,
 * Subtract, Bring Down, repeat — and a widget that DRILLS is a widget that can
 * mark a right answer wrong. That is a worse failure than a dull one: a student
 * who enters the correct product and is told it is wrong learns to distrust
 * their own arithmetic.
 *
 * So this file checks the arithmetic itself, not the DOM. For each case it
 * re-derives the algorithm from the emitted steps and asserts the invariants a
 * teacher would check on the board:
 *
 *   • every cycle's quotient digit, product and difference agree;
 *   • the difference is ALWAYS less than the divisor (the "your digit was too
 *     small" error, which is the one students actually make);
 *   • each brought-down digit is the next digit of the dividend, in order;
 *   • the quotient digits concatenate to the true quotient and remainder;
 *   • the step labels cycle Divide → Multiply → Subtract → Bring Down, with
 *     Bring Down absent from the final cycle only.
 *
 * It also fails if it exercises zero cases, so a broken import cannot report a
 * clean run.
 * ========================================================================== */

import assert from "node:assert/strict";
import {
  buildNarration,
  createNarrationCursor,
} from "../engine/components/long-division-narration.js";
import {
  buildLongDivision,
  CYCLE_LABELS,
  checkInputs,
} from "../engine/components/long-division-steps.js";

let checked = 0;
const failures = [];

function check(name, fn) {
  checked += 1;
  try {
    fn();
  } catch (err) {
    failures.push(`${name}: ${err && err.message ? err.message : err}`);
  }
}

/**
 * Re-derive the division from the emitted plan and assert every invariant.
 * @param {number} dividend
 * @param {number} divisor
 */
function verifyWhole(dividend, divisor) {
  const plan = buildLongDivision({ dividend, divisor });
  const label = `${dividend} ÷ ${divisor}`;

  assert.equal(plan.divisor, divisor, `${label}: divisor should pass through unchanged`);
  assert.equal(plan.shift, 0, `${label}: a whole-number problem must not move the point`);
  assert.equal(
    plan.digits.join(""),
    String(dividend),
    `${label}: digit array must be the dividend`,
  );
  assert.equal(plan.pointAt, plan.digits.length, `${label}: no fractional columns`);

  // Cycle-by-cycle arithmetic.
  assert.ok(plan.cycles.length > 0, `${label}: at least one cycle`);
  plan.cycles.forEach((c, i) => {
    const at = `${label} cycle ${i + 1}`;
    assert.ok(
      Number.isInteger(c.quotientDigit) && c.quotientDigit >= 0 && c.quotientDigit <= 9,
      `${at}: quotient digit ${c.quotientDigit} is not a single digit`,
    );
    assert.equal(c.product, c.quotientDigit * divisor, `${at}: product must be digit × divisor`);
    assert.equal(
      c.difference,
      c.current - c.product,
      `${at}: difference must be current − product`,
    );
    assert.ok(c.difference >= 0, `${at}: difference ${c.difference} went negative`);
    assert.ok(
      c.difference < divisor,
      `${at}: difference ${c.difference} is not less than the divisor ${divisor} — the quotient digit was too small`,
    );
    if (i === 0) {
      const prefix = Number(plan.digits.slice(0, c.index + 1).join(""));
      assert.equal(c.current, prefix, `${at}: first working number must be the leading prefix`);
    } else {
      const prev = plan.cycles[i - 1];
      assert.ok(prev.bringDown, `${at}: the previous cycle must have brought a digit down`);
      assert.equal(
        prev.bringDown.index,
        c.index,
        `${at}: brought-down digit is in the wrong column`,
      );
      assert.equal(
        prev.bringDown.digit,
        plan.digits[c.index],
        `${at}: brought-down digit is not the dividend's next digit`,
      );
      assert.equal(
        c.current,
        prev.difference * 10 + prev.bringDown.digit,
        `${at}: working number must be the difference with the next digit beside it`,
      );
    }
    // "Bring Down" exists on every cycle except the last.
    const last = i === plan.cycles.length - 1;
    assert.equal(
      c.bringDown === null,
      last,
      `${at}: bring-down should be ${last ? "absent on the final cycle" : "present"}`,
    );
  });

  // The answer itself.
  const trueQ = Math.floor(dividend / divisor);
  const trueR = dividend % divisor;
  assert.equal(plan.quotientText, String(trueQ), `${label}: quotient should be ${trueQ}`);
  assert.equal(plan.remainder, trueR, `${label}: remainder should be ${trueR}`);
  assert.equal(
    plan.quotientDigits.map((d) => (d === null ? "" : d)).join(""),
    String(trueQ),
    `${label}: the written quotient digits must concatenate to ${trueQ}`,
  );
  assert.equal(
    divisor * trueQ + trueR,
    dividend,
    `${label}: multiply-back check must return the dividend`,
  );
  assert.equal(
    plan.checkText,
    `${divisor} × ${trueQ}${trueR ? ` + ${trueR}` : ""} = ${dividend}`,
    `${label}: check line`,
  );

  verifyStepOrder(plan, label);
  return plan;
}

/** The D-M-S-B strip must actually cycle, and only the last cycle may skip B. */
function verifyStepOrder(plan, label) {
  const byCycle = new Map();
  for (const s of plan.steps) {
    if (!byCycle.has(s.cycle)) byCycle.set(s.cycle, []);
    byCycle.get(s.cycle).push(s);
  }
  assert.equal(byCycle.size, plan.cycles.length, `${label}: one step group per cycle`);
  for (const [cycle, steps] of byCycle) {
    const last = cycle === plan.cycles.length - 1;
    const want = last ? CYCLE_LABELS.slice(0, 3) : CYCLE_LABELS;
    assert.deepEqual(
      steps.map((s) => s.label),
      [...want],
      `${label} cycle ${cycle + 1}: steps must run ${want.join(" → ")}`,
    );
    assert.deepEqual(
      steps.map((s) => s.type),
      last ? ["divide", "multiply", "subtract"] : ["divide", "multiply", "subtract", "bringdown"],
      `${label} cycle ${cycle + 1}: step types`,
    );
    const c = plan.cycles[cycle];
    assert.equal(
      steps[0].expected,
      c.quotientDigit,
      `${label}: DIVIDE asks for the quotient digit`,
    );
    assert.equal(steps[1].expected, c.product, `${label}: MULTIPLY asks for the product`);
    assert.equal(steps[2].expected, c.difference, `${label}: SUBTRACT asks for the difference`);
    if (!last) {
      assert.equal(
        steps[3].expected,
        c.bringDown.digit,
        `${label}: BRING DOWN names the next digit`,
      );
    }
    for (const s of steps) {
      assert.ok(s.prompt && s.prompt.length > 4, `${label}: every step needs a prompt`);
      assert.ok(s.hint && s.hint.length > 4, `${label}: every step needs a corrective hint`);
      assert.ok(
        Number.isInteger(s.expected) && s.expected >= 0,
        `${label}: expected must be a number`,
      );
    }
  }
}

// ── 1. Whole-number cases ──────────────────────────────────────────────────
// exact, remainder, an interior zero in the quotient, a leading skip, and a
// two-digit divisor (the lesson 1-4 problems are 1344÷12 and 1680÷24).
const WHOLE = [
  [1344, 12], // 112, exact, 2-digit divisor, leading skip (1 < 12)
  [754, 6], // 125 R 4
  [2408, 8], // 301 — zero in the middle of the quotient
  [5005, 5], // 1001 — two interior zeros
  [987, 3], // 329, exact
  [1680, 24], // 70, exact — trailing zero in the quotient
  [432, 8], // 54 — leading skip
  [10000, 7], // 1428 R 4 — 5-digit dividend
  [98765, 43], // 2296 R 37 — 5-digit dividend, 2-digit divisor
  [5, 6], // 0 R 5 — divisor bigger than the dividend
  [1234, 12], // 102 R 10 — zero cycle where the difference outgrows the product
  [90000, 9], // 10000 — quotient ends in four zeros
];

for (const [dividend, divisor] of WHOLE) {
  check(`whole ${dividend}/${divisor}`, () => verifyWhole(dividend, divisor));
}

// A wider sweep: the invariants must hold for every dividend in a range, not
// just the hand-picked ones. This is what catches an off-by-one in the leading
// skip or a lost interior zero.
check("sweep 1..900 over several divisors", () => {
  let seen = 0;
  for (const divisor of [3, 6, 7, 8, 12, 24, 25]) {
    for (let dividend = 1; dividend <= 900; dividend += 7) {
      const plan = buildLongDivision({ dividend, divisor });
      assert.equal(
        plan.quotientText,
        String(Math.floor(dividend / divisor)),
        `${dividend}/${divisor}`,
      );
      assert.equal(plan.remainder, dividend % divisor, `${dividend}/${divisor} remainder`);
      for (const c of plan.cycles) {
        assert.ok(c.difference < divisor, `${dividend}/${divisor}: difference ≥ divisor`);
        assert.equal(c.product, c.quotientDigit * divisor, `${dividend}/${divisor}: product`);
      }
      seen += 1;
    }
  }
  assert.ok(seen > 800, `sweep should have run hundreds of cases, ran ${seen}`);
});

// ── 2. Decimal path ────────────────────────────────────────────────────────
// The point moves in the divisor first, the same number of places moves in the
// dividend, and the quotient's point lands above the dividend's.
const DECIMALS = [
  { dividend: 12.6, divisor: 4, quotient: "3.15", shift: 0, working: "12.60" },
  { dividend: 7.5, divisor: 0.25, quotient: "30", shift: 2, working: "750" },
  { dividend: 3, divisor: 4, quotient: "0.75", shift: 0, working: "3.00" },
  { dividend: 0.75, divisor: 0.25, quotient: "3", shift: 2, working: "75" },
  { dividend: 9.66, divisor: 2.1, quotient: "4.6", shift: 1, working: "96.6" },
  { dividend: 45.6, divisor: 8, quotient: "5.7", shift: 0, working: "45.6" },
  { dividend: 1.2, divisor: 0.03, quotient: "40", shift: 2, working: "120" },
];

for (const t of DECIMALS) {
  check(`decimal ${t.dividend}/${t.divisor}`, () => {
    const plan = buildLongDivision({ dividend: t.dividend, divisor: t.divisor, decimal: true });
    const label = `${t.dividend} ÷ ${t.divisor}`;
    assert.equal(plan.shift, t.shift, `${label}: the point should move ${t.shift} place(s)`);
    assert.equal(plan.divisor, Number(t.divisor) * 10 ** t.shift, `${label}: shifted divisor`);
    assert.equal(plan.workingDividendText, t.working, `${label}: shifted dividend`);
    assert.equal(plan.quotientText, t.quotient, `${label}: quotient`);
    // Independent check against the real value.
    assert.ok(
      Math.abs(Number(plan.quotientText) - t.dividend / t.divisor) < 1e-9,
      `${label}: quotient ${plan.quotientText} does not match ${t.dividend / t.divisor}`,
    );
    // An even decimal division checks back against the ORIGINAL numbers.
    if (plan.remainder === 0) {
      assert.equal(
        plan.checkText,
        `${t.divisor} × ${t.quotient} = ${t.dividend}`,
        `${label}: the multiply-back check should use the numbers the student was handed`,
      );
    }
    // Same cycle structure as the whole-number path.
    verifyStepOrder(plan, label);
    for (const c of plan.cycles) {
      assert.ok(c.difference < plan.divisor, `${label}: difference ≥ divisor`);
      assert.equal(c.product, c.quotientDigit * plan.divisor, `${label}: product`);
    }
  });
}

check("decimal division that does not end is cut at maxPlaces", () => {
  const plan = buildLongDivision({ dividend: 1, divisor: 3, decimal: true, maxPlaces: 4 });
  assert.equal(plan.quotientText, "0.3333", "1 ÷ 3 to four places");
  assert.equal(plan.exact, false, "it should report that it did not come out even");
  assert.ok(plan.remainder > 0, "there should still be something left over");
});

check("whole-number mode ignores fractional input, as it always did", () => {
  const plan = buildLongDivision({ dividend: 754.9, divisor: 6.7 });
  assert.equal(plan.quotientText, "125", "754 ÷ 6 = 125");
  assert.equal(plan.remainder, 4, "remainder 4");
  assert.equal(plan.shift, 0, "no point moves in whole-number mode");
});

// ── 3. Bad input fails loudly instead of looping ───────────────────────────
for (const bad of [0, -1, -12.5, Number.NaN, Number.POSITIVE_INFINITY, "abc", null, undefined]) {
  check(`divisor ${String(bad)} is rejected`, () => {
    assert.throws(
      () => buildLongDivision({ dividend: 100, divisor: bad, decimal: true }),
      RangeError,
      `divisor ${String(bad)} must throw a RangeError, not hang`,
    );
  });
}
check("a negative dividend is rejected", () => {
  assert.throws(() => buildLongDivision({ dividend: -50, divisor: 5 }), RangeError);
});
check("a zero dividend still produces a usable plan", () => {
  const plan = buildLongDivision({ dividend: 0, divisor: 7 });
  assert.equal(plan.quotientText, "0");
  assert.equal(plan.remainder, 0);
  assert.equal(plan.cycles.length, 1, "one cycle: 7 does not fit into 0");
});

// ── 4. The lesson configs that already author this widget must work ────────
check("the problems lessons 1-4 / 1-4-group1 / 1-4-group2 author all resolve", () => {
  for (const [dividend, divisor, quotient] of [
    [1344, 12, "112"],
    [754, 6, "125"],
    [1680, 24, "70"],
  ]) {
    const plan = buildLongDivision({ dividend, divisor });
    assert.equal(plan.quotientText, quotient, `${dividend} ÷ ${divisor}`);
    assert.ok(plan.steps.length >= 3, "there must be steps for the student to work");
  }
});

// ── 5. Watch mode ──────────────────────────────────────────────────────────
// "Watch it solved" narrates the SAME algorithm solve mode drills. Two failures
// matter here and neither shows up as an exception: narration that drifts out of
// D-M-S-B order (so the strip lights one step while the sentence describes
// another), and a sentence carrying a number the board never writes. A student
// watching a worked example trusts the sentence more than the notation, so a
// wrong number in the narration is worse than a wrong number in the grid.
//
// Every integer in a step's sentence is therefore checked against the set of
// numbers that step is ALLOWED to mention — not just that the required ones are
// present, which a stray digit would sail past.

/** Every integer token in a sentence, so an unexpected number cannot hide. */
function numbersIn(text) {
  return (text.match(/\d+/g) || []).map(Number);
}

/** Numbers a given step's sentence may legitimately contain. */
function allowedNumbers(plan, step) {
  const c = plan.cycles[step.cycle];
  const v = plan.divisor;
  const column = plan.digits[c.index];
  if (step.type === "divide") {
    return new Set([
      v,
      c.current,
      c.quotientDigit,
      c.product,
      c.quotientDigit + 1,
      c.product + v,
      column,
      0,
    ]);
  }
  if (step.type === "multiply") return new Set([c.quotientDigit, v, c.product, c.current]);
  if (step.type === "subtract") {
    return new Set([c.current, c.product, c.difference, v, c.quotientDigit]);
  }
  const next = plan.cycles[step.cycle + 1];
  const made = next ? next.current : c.difference * 10 + c.bringDown.digit;
  return new Set([c.bringDown.digit, c.difference, made, step.cycle + 1, v]);
}

/** Numbers a step's sentence MUST contain — the ones it is actually about. */
function requiredNumbers(plan, step) {
  const c = plan.cycles[step.cycle];
  if (step.type === "divide") return [plan.divisor, c.current, c.quotientDigit];
  if (step.type === "multiply") return [c.quotientDigit, plan.divisor, c.product];
  if (step.type === "subtract") return [c.current, c.product, c.difference];
  const next = plan.cycles[step.cycle + 1];
  const made = next ? next.current : c.difference * 10 + c.bringDown.digit;
  return [c.bringDown.digit, c.difference, made, step.cycle + 1];
}

/**
 * Assert the whole watch-mode script for one plan.
 * @param {ReturnType<typeof buildLongDivision>} plan
 * @param {string} label
 */
function verifyNarration(plan, label) {
  const frames = buildNarration(plan);
  const wantShift = plan.shift > 0 ? 1 : 0;

  assert.equal(
    frames.length,
    plan.steps.length + wantShift + 1,
    `${label}: one frame per step, plus the point-move when there is one, plus the result`,
  );

  // The point-move frame exists exactly when the point actually moves.
  const shiftFrames = frames.filter((f) => f.kind === "shift");
  assert.equal(shiftFrames.length, wantShift, `${label}: point-move frame`);
  if (wantShift) {
    assert.equal(frames[0].kind, "shift", `${label}: the point moves before anything else`);
    assert.equal(frames[0].shiftDone, false, `${label}: the point has not moved yet on frame 1`);
    assert.equal(frames[0].shown, 0, `${label}: nothing is on the board before the point moves`);
    for (const text of [plan.divisorText, plan.workingDivisorText, plan.workingDividendText]) {
      assert.ok(frames[0].text.includes(text), `${label}: the point-move line must show ${text}`);
    }
  }

  // ONE frame per step, in order, holding the very step object solve mode uses.
  const stepFrames = frames.filter((f) => f.kind === "step");
  assert.equal(stepFrames.length, plan.steps.length, `${label}: one frame per step`);
  stepFrames.forEach((f, i) => {
    assert.equal(
      f.step,
      plan.steps[i],
      `${label}: frame ${i + 1} must BE step ${i + 1} — watch and solve share one step list`,
    );
    assert.equal(f.shown, i + 1, `${label}: frame ${i + 1} should reveal ${i + 1} steps`);
    assert.equal(f.shiftDone, true, `${label}: the point has moved by the time steps run`);
    assert.equal(f.cycle, plan.steps[i].cycle, `${label}: frame ${i + 1} cycle`);
    assert.ok(f.text.length > 20, `${label}: frame ${i + 1} needs a real sentence`);
    assert.ok(
      f.headline.includes(f.label.toUpperCase()),
      `${label}: frame ${i + 1} headline must name the step`,
    );
    // The cycle restart is announced on the bring-down and nowhere else.
    assert.equal(
      f.cycleRestart,
      f.step.type === "bringdown",
      `${label}: frame ${i + 1} should ${f.step.type === "bringdown" ? "" : "not "}announce the repeat`,
    );
    if (f.step.type === "bringdown") {
      assert.ok(
        /REPEAT the cycle/.test(f.text),
        `${label}: the bring-down line must say the cycle repeats`,
      );
    }
    // Every number in the line, checked both ways.
    const allowed = allowedNumbers(plan, f.step);
    for (const n of numbersIn(f.text)) {
      assert.ok(
        allowed.has(n),
        `${label} frame ${i + 1} (${f.step.type}): the sentence says ${n}, which is not a number this step is about — "${f.text}"`,
      );
    }
    for (const n of requiredNumbers(plan, f.step)) {
      assert.ok(
        numbersIn(f.text).includes(n),
        `${label} frame ${i + 1} (${f.step.type}): the sentence never mentions ${n} — "${f.text}"`,
      );
    }
  });

  // D → M → S → B per cycle, with B absent from the final cycle only.
  const byCycle = new Map();
  for (const f of stepFrames) {
    if (!byCycle.has(f.cycle)) byCycle.set(f.cycle, []);
    byCycle.get(f.cycle).push(f);
  }
  assert.equal(byCycle.size, plan.cycles.length, `${label}: one narrated group per cycle`);
  for (const [cycle, group] of byCycle) {
    const last = cycle === plan.cycles.length - 1;
    assert.deepEqual(
      group.map((f) => f.label),
      last ? CYCLE_LABELS.slice(0, 3) : [...CYCLE_LABELS],
      `${label} cycle ${cycle + 1}: narration must run ${last ? "D → M → S" : "D → M → S → B"}`,
    );
    assert.equal(
      group.some((f) => f.label === "Bring Down"),
      !last,
      `${label} cycle ${cycle + 1}: "Bring Down" must be ${last ? "absent on the final cycle" : "present"}`,
    );
  }

  // The closing frame states the answer, and the remainder, correctly.
  const end = frames[frames.length - 1];
  assert.equal(end.kind, "finish", `${label}: the script must end with the result`);
  assert.equal(end.shown, plan.steps.length, `${label}: the finished board shows every step`);
  assert.ok(end.text.includes(plan.quotientText), `${label}: the result must state the quotient`);
  if (plan.remainder === 0) {
    assert.ok(/exact/i.test(end.text), `${label}: an exact division should say so`);
    assert.ok(
      !/remainder \d/.test(end.text),
      `${label}: an exact division must not claim a remainder`,
    );
  } else {
    assert.ok(
      end.text.includes(plan.remainderText),
      `${label}: ${plan.remainderText} is left over and the result must say so — "${end.text}"`,
    );
    assert.ok(
      /remainder|left over/i.test(end.text),
      `${label}: the leftover must be named as a remainder`,
    );
  }
  return frames;
}

// The same cases solve mode is drilled on, plus the two the widget is authored
// with in lessons 1-4 and 1-7.
const WATCH = [
  [2408, 8], // zero digit in the middle of the quotient
  [1344, 12], // exact, two-digit divisor, leading skip
  [754, 6], // remainder
  [1680, 24], // exact, two-digit divisor, trailing zero
  [987, 3], // exact, no skip
  [10000, 7], // 5-digit dividend, remainder
  [5, 6], // divisor bigger than the dividend: quotient 0
  [0, 7], // nothing to divide
  [90000, 9], // a run of zero digits
];
for (const [dividend, divisor] of WATCH) {
  check(`watch ${dividend}/${divisor}`, () => {
    verifyNarration(buildLongDivision({ dividend, divisor }), `watch ${dividend} ÷ ${divisor}`);
  });
}

for (const t of DECIMALS) {
  check(`watch decimal ${t.dividend}/${t.divisor}`, () => {
    const plan = buildLongDivision({ dividend: t.dividend, divisor: t.divisor, decimal: true });
    const frames = verifyNarration(plan, `watch ${t.dividend} ÷ ${t.divisor}`);
    if (t.shift > 0) {
      assert.equal(frames[0].kind, "shift", "a shifted problem opens by moving the point");
      assert.ok(
        frames[0].text.includes(t.shift === 1 ? "1 place" : `${t.shift} places`),
        "the point-move line must say how far the point moves",
      );
    }
  });
}

check("watch mode never invents a step solve mode does not have", () => {
  let seen = 0;
  for (const divisor of [3, 7, 12, 25]) {
    for (let dividend = 1; dividend <= 400; dividend += 11) {
      const plan = buildLongDivision({ dividend, divisor });
      const frames = buildNarration(plan);
      const steps = frames.filter((f) => f.kind === "step").map((f) => f.step);
      assert.equal(steps.length, plan.steps.length, `${dividend}/${divisor}: step count`);
      steps.forEach((s, i) =>
        assert.equal(s, plan.steps[i], `${dividend}/${divisor}: step ${i + 1} identity`),
      );
      seen += 1;
    }
  }
  assert.ok(seen > 100, `the identity sweep should have run over 100 plans, ran ${seen}`);
});

check("a decimal division that is cut short still reports what is left over", () => {
  const plan = buildLongDivision({ dividend: 1, divisor: 3, decimal: true, maxPlaces: 4 });
  const frames = verifyNarration(plan, "watch 1 ÷ 3 to four places");
  const end = frames[frames.length - 1];
  assert.ok(end.text.includes("0.3333"), "the quotient it reached");
  assert.ok(/left over|cut off/.test(end.text), "and that it did not come out even");
});

check("buildNarration refuses anything that is not a built plan", () => {
  for (const bad of [null, undefined, {}, { steps: [] }, { steps: [], cycles: [] }, 42]) {
    assert.throws(
      () => buildNarration(/** @type {never} */ (bad)),
      RangeError,
      `buildNarration(${JSON.stringify(bad)}) must throw rather than narrate nothing`,
    );
  }
});

check("the playback cursor walks the frames and stops at both ends", () => {
  const frames = buildNarration(buildLongDivision({ dividend: 754, divisor: 6 }));
  const cursor = createNarrationCursor(frames);
  assert.equal(cursor.length, frames.length, "cursor length");
  assert.ok(cursor.atStart(), "starts at the beginning");
  assert.equal(cursor.frame(), frames[0], "first frame");
  assert.equal(cursor.back(), frames[0], "back at the start is a no-op, not an underflow");
  for (let i = 1; i < frames.length; i += 1) {
    assert.equal(cursor.next(), frames[i], `next lands on frame ${i + 1}`);
  }
  assert.ok(cursor.atEnd(), "reaches the end");
  assert.equal(cursor.next(), frames[frames.length - 1], "next at the end is a no-op");
  assert.equal(cursor.back(), frames[frames.length - 2], "back steps one frame");
  assert.equal(cursor.reset(), frames[0], "replay returns to the first frame");
  assert.equal(cursor.goto(3), frames[3], "goto");
  assert.equal(cursor.goto(9999), frames[frames.length - 1], "goto clamps high");
  assert.equal(cursor.goto(-4), frames[0], "goto clamps low");
  assert.throws(() => createNarrationCursor([]), RangeError, "no frames is an error, not a hang");
});

// ── 6. Free-entry input, judged in classroom English ───────────────────────
// The lab lets a student type any two numbers, so checkInputs() is the surface
// they actually hit. It must reject what cannot be divided WITH A FIX NAMED,
// and must not reject what merely surprises: a divisor larger than the
// dividend, or a decimal typed into a whole-number lab, are real problems.
const REJECTED = [
  ["", "6", "dividend", /dividend/i],
  ["  ", "6", "dividend", /dividend/i],
  ["754", "", "divisor", /divisor/i],
  ["abc", "6", "dividend", /not a number/i],
  ["754", "six", "divisor", /not a number/i],
  ["754", "0", "divisor", /divide by 0/i],
  ["754", "-3", "divisor", /positive/i],
  ["-50", "5", "dividend", /positive/i],
  ["123456789", "5", "dividend", /digits/i],
  ["754", "12345", "divisor", /digits/i],
];
for (const [dividend, divisor, field, pattern] of REJECTED) {
  check(`input "${dividend}" / "${divisor}" is refused clearly`, () => {
    const v = checkInputs({ dividend, divisor });
    assert.equal(v.ok, false, `"${dividend}" ÷ "${divisor}" should be refused`);
    assert.equal(v.field, field, "the message must point at the box to fix");
    assert.equal(v.tone, "bad", "a refusal is not a notice");
    assert.match(v.message, pattern, "the message must name the problem");
    assert.ok(v.message.length > 20, "and be a sentence, not a code");
  });
}

check("whole-number mode refuses a divisor that would round to 0", () => {
  const v = checkInputs({ dividend: "12.6", divisor: "0.4" });
  assert.equal(v.ok, false, "0.4 becomes 0 here, and 0 cannot divide");
  assert.equal(v.field, "divisor");
  assert.match(v.message, /whole numbers/i);
});

const ACCEPTED = [
  { dividend: "1344", divisor: "12", quiet: true },
  { dividend: "10000", divisor: "7", quiet: true },
  { dividend: "98765", divisor: "43", quiet: true },
  { dividend: "0", divisor: "7", quiet: true },
  { dividend: "5", divisor: "6", quiet: false, pattern: /bigger than/i },
  { dividend: "12.6", divisor: "4", quiet: false, pattern: /whole numbers/i },
  { dividend: "12.6", divisor: "0.4", decimal: true, quiet: true },
  { dividend: "7.5", divisor: "0.25", decimal: true, quiet: true },
  { dividend: "3", divisor: "4", decimal: true, quiet: true },
];
for (const t of ACCEPTED) {
  check(
    `input "${t.dividend}" / "${t.divisor}"${t.decimal ? " (decimal)" : ""} is accepted`,
    () => {
      const v = checkInputs({ dividend: t.dividend, divisor: t.divisor, decimal: t.decimal });
      assert.equal(v.ok, true, `"${t.dividend}" ÷ "${t.divisor}" should be allowed`);
      if (t.quiet) {
        assert.equal(v.message, "", "nothing surprising happened, so say nothing");
      } else {
        assert.match(v.message, t.pattern, "a surprise must be explained, not silently applied");
      }
      // Anything checkInputs waves through must actually build and narrate.
      const plan = buildLongDivision({
        dividend: t.dividend,
        divisor: t.divisor,
        decimal: t.decimal,
      });
      assert.ok(plan.steps.length >= 3, "an accepted problem must produce a workable plan");
      verifyNarration(plan, `accepted ${t.dividend} ÷ ${t.divisor}`);
    },
  );
}

// ── Report ─────────────────────────────────────────────────────────────────
// A test file that exercises nothing is not a passing test file.
assert.ok(
  checked >= 70,
  `expected at least 70 cases, ran ${checked} — the suite stopped exercising`,
);

if (failures.length) {
  console.error(`long division steps: ${failures.length} of ${checked} checks FAILED`);
  for (const f of failures) console.error(`   ✗ ${f}`);
  process.exit(1);
}
console.log(
  `long division steps: ${checked} checks passed (D-M-S-B cycle, alignment columns, decimals, bad input).`,
);
