#!/usr/bin/env node
/**
 * notebook-prompt.test.mjs — the notebook setup must never invent a claim.
 *
 * Two of these exist because the repo has already shipped the failure they pin.
 * The copy-panel system REQUIRED a panel on every checkpoint, so lessons with
 * nothing quotable were given invented content and 39 of 84 rules ended up
 * stating another lesson's mathematics. "Stays silent" and "never manufactures
 * a model" are holding the rule that came out of it: derive or stay quiet,
 * absence is a pass.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  comparableSteps,
  compareYourWorkFor,
  modelParts,
  NOTEBOOK_PROMPT_TYPES,
  SCREEN_IS_THE_WORK_SURFACE,
  derivedStepCount,
  lessonModelFrom,
  notebookPromptFor,
} from "./notebook-prompt.js";

const cfg = (keyIdea) => ({ launch: { conceptIntro: { keyIdea } } });

test("the model is QUOTED from an explicit Formula: label", () => {
  assert.equal(
    lessonModelFrom(cfg("Finding the Whole. Formula: Whole = Part ÷ Percent. 1. Identify the part.")),
    "Whole = Part ÷ Percent",
  );
});

test("the model reads the WHOLE formula, not a tail of it", () => {
  // The regression that killed the infer-from-prose approach: matching `X = Y`
  // across the sentence clipped 6-11 down to "Group Size = Number of Groups",
  // which is a different and false claim.
  const model = lessonModelFrom(
    cfg("Fraction Division. Formula: Total Amount ÷ Group Size = Number of Groups. 1. Identify."),
  );
  assert.equal(model, "Total Amount ÷ Group Size = Number of Groups");
  assert.match(model, /^Total Amount/, "the left-hand side must not be clipped");
});

test("a lesson with no formula yields no model, and that is correct", () => {
  // 47 of 84 lessons state none. They still get the setup structure.
  assert.equal(lessonModelFrom(cfg("Prime factors. 1. Split into factor pairs.")), null);
  assert.equal(lessonModelFrom(cfg("")), null);
  assert.equal(lessonModelFrom(null), null);
  assert.equal(lessonModelFrom({}), null);
});

test("a Formula: label with no relational operator is a phrase, not a model", () => {
  assert.equal(lessonModelFrom(cfg("Formula: think carefully about the units")), null);
});

test("a multiple-choice item gets a setup with a head and two steps", () => {
  const p = notebookPromptFor({ type: "multiple-choice" }, 3);
  assert.ok(p);
  assert.match(p.head, /#3/, "the head must name the number the card shows");
  assert.match(p.headEs, /#3/);
  assert.equal(p.steps.length, 2, "two steps — a third pushes the answers toward the fold");
  assert.equal(p.model, null);
  for (const s of p.steps) assert.notEqual(s.es, s.en, "each step needs a real Spanish lane");
});

test("when the lesson has a model, step one says to copy it", () => {
  const p = notebookPromptFor({ type: "multiple-choice" }, 2, "Whole = Part ÷ Percent");
  assert.equal(p.model, "Whole = Part ÷ Percent");
  assert.match(p.steps[0].en, /Copy the model/);
});

test("a real step array becomes a counted expectation", () => {
  const p = notebookPromptFor(
    { type: "error-analysis", workedExample: [{}, {}, {}, {}] },
    7,
  );
  assert.equal(p.stepCount, 4);
  assert.match(p.steps[1].en, /about 4/);
  assert.match(p.steps[1].es, /unos 4/);
});

test("NEVER manufactures a step count from prose", () => {
  const p = notebookPromptFor(
    { type: "multiple-choice", explanation: "First find factors. Then check. Then compare." },
    2,
  );
  assert.equal(p.stepCount, null);
  for (const s of p.steps) assert.doesNotMatch(s.en, /about \d/i);
});

test("stays silent for every type where the screen is the work surface", () => {
  for (const type of SCREEN_IS_THE_WORK_SURFACE) {
    assert.equal(notebookPromptFor({ type }, 1), null, `${type} is a manipulative`);
  }
});

test("stays silent for untargeted, unknown and missing types", () => {
  for (const type of ["open-response", "drag-sort", "fill-table", "matching", "future-kind"]) {
    assert.equal(notebookPromptFor({ type }, 1), null);
  }
  assert.equal(notebookPromptFor({}, 1), null);
  assert.equal(notebookPromptFor(null, 1), null);
});

test("no number means no setup", () => {
  assert.equal(notebookPromptFor({ type: "multiple-choice" }, null), null);
  assert.equal(notebookPromptFor({ type: "multiple-choice" }, ""), null);
  assert.ok(notebookPromptFor({ type: "multiple-choice" }, 0), "problem 0 is a number");
});

test("derivedStepCount ignores a single-element or non-array", () => {
  assert.equal(derivedStepCount({ workedExample: [{}] }), null, "\"about 1 steps\" helps nobody");
  assert.equal(derivedStepCount({ correctWork: "not an array" }), null);
  assert.equal(derivedStepCount({}), null);
});

test("the targeted and excluded sets never overlap", () => {
  assert.deepEqual(
    [...NOTEBOOK_PROMPT_TYPES].filter((t) => SCREEN_IS_THE_WORK_SURFACE.has(t)),
    [],
  );
});

test("the setup asserts no mathematics of its own", () => {
  // Shared code printing a mathematical claim reaches every lesson that renders
  // it. The only numbers allowed are the problem number and a counted step
  // total; anything else would be this module teaching content.
  for (const type of NOTEBOOK_PROMPT_TYPES) {
    const p = notebookPromptFor({ type, workedExample: [{}, {}, {}] }, 5);
    const text = [p.head, p.headEs, ...p.steps.flatMap((s) => [s.en, s.es])].join(" ");
    const numbers = [...new Set(text.match(/\d+/g) || [])].sort();
    assert.deepEqual(numbers, ["3", "5"], `${type}: unexpected number in "${text}"`);
  }
});



test("compare-your-work stays silent unless a notebook was actually asked for", () => {
  // "Check your written work" is incoherent on an item that never asked for
  // any. The caller passes the fact rather than recomputing it, so the setup
  // and the compare line can never disagree.
  assert.equal(compareYourWorkFor({ type: "multiple-choice" }, { asked: false }), null);
  assert.equal(compareYourWorkFor({ type: "multiple-choice" }, {}), null);
  assert.equal(compareYourWorkFor(null, { asked: true }), null);
});

test("compare-your-work says something different after a miss", () => {
  const ok = compareYourWorkFor({}, { asked: true, correct: true });
  const miss = compareYourWorkFor({}, { asked: true, correct: false });
  assert.match(ok.en, /Check your written work/);
  assert.match(miss.en, /where did your work turn/);
  assert.notEqual(ok.en, miss.en, "a miss should point at where the work diverged");
  for (const c of [ok, miss]) assert.notEqual(c.es, c.en, "both need a real Spanish lane");
});

test("comparableSteps returns real steps and never invents them from prose", () => {
  assert.deepEqual(comparableSteps({ steps: ["a", "b", "c"] }), ["a", "b", "c"]);
  assert.deepEqual(comparableSteps({ workedExample: [{ work: "x" }, { work: "y" }] }), ["x", "y"]);
  // Prose is not a step list. Splitting it would invent a structure the author
  // never wrote — the same failure as manufacturing a step count.
  assert.equal(comparableSteps({ explanation: "First this. Then that. Then this." }), null);
  assert.equal(comparableSteps({ steps: ["only one"] }), null, "one step is not a sequence");
  assert.equal(comparableSteps({ steps: [{}, {}] }), null, "empty step objects yield nothing");
  assert.equal(comparableSteps(null), null);
});

test("guided-fill never gets a setup — small group already has its own cue", () => {
  // Not an omission. Every small-group item carries `.sg-notebook-cue` and the
  // section carries `soloDir`; a setup block here was added and removed on
  // 2026-08-20 because it made a third notebook instruction per problem.
  // Measured live at the time: 7/7 and 4/4 items already had the cue.
  assert.equal(notebookPromptFor({ type: "guided-fill" }, 5), null);
  assert.equal(notebookPromptFor({ type: "guided-fill", steps: [{}, {}, {}] }, 5, "A = b x h"), null);
});

test("a multi-formula model splits into separate parts, pipe never shown", () => {
  // 13 lessons state two or three formulas in one Formula: line. Rendered whole,
  // the separator lands inside a box captioned "Start with:" and a student
  // copying faithfully writes the pipe. Seen live on 9-3.
  const parts = modelParts("y = kx | Dependent = (Unit Rate) \u00D7 Independent");
  assert.deepEqual(parts, ["y = kx", "Dependent = (Unit Rate) \u00D7 Independent"]);
  for (const p of parts) assert.doesNotMatch(p, /\|/, "no part may contain the separator");
});

test("every part stays a VERBATIM substring of the model it came from", () => {
  // Splitting narrows the quote; it must never compose a new one, or the gate's
  // "quoted from this lesson's keyIdea" guarantee would be hollow.
  const model = "Range = Maximum \u2212 Minimum | IQR = Q3 \u2212 Q1";
  for (const part of modelParts(model)) assert.ok(model.includes(part), part);
});

test("a single-formula model is unchanged", () => {
  assert.deepEqual(modelParts("Whole = Part \u00F7 Percent"), ["Whole = Part \u00F7 Percent"]);
});

test("no model yields no parts", () => {
  for (const v of [null, undefined, "", "   "]) assert.deepEqual(modelParts(v), []);
});
