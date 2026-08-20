#!/usr/bin/env node
/**
 * notebook-prompt.test.mjs — the notebook prompt must never invent a claim.
 *
 * Two of these tests exist because the repo has already shipped the failure
 * they pin. The copy-panel system REQUIRED a panel on every checkpoint, so
 * lessons with nothing quotable were given invented content and 39 of 84 rules
 * ended up stating another lesson's mathematics. The rule that came out of it —
 * derive or stay silent, absence is a pass — is what "stays silent" and "never
 * manufactures a step count" below are holding.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  NOTEBOOK_PROMPT_TYPES,
  SCREEN_IS_THE_WORK_SURFACE,
  derivedStepCount,
  notebookPromptFor,
} from "./notebook-prompt.js";

test("a multiple-choice item gets a numbered prompt in both languages", () => {
  const p = notebookPromptFor({ type: "multiple-choice", stem: "Which is prime?" }, 3);
  assert.ok(p, "multiple-choice is the primary target and must get a prompt");
  assert.match(p.en, /#3/, "the prompt must name the problem number the card shows");
  assert.match(p.es, /#3/);
  assert.notEqual(p.es, p.en, "Spanish must not be the English string");
  assert.equal(p.steps, null, "a multiple-choice item carries no step array");
});

test("an error-analysis item reports the step count it actually has", () => {
  const p = notebookPromptFor(
    {
      type: "error-analysis",
      workedExample: [{ work: "a" }, { work: "b" }, { work: "c" }, { work: "d" }],
    },
    7,
  );
  assert.equal(p.steps, 4);
  assert.match(p.en, /About 4 steps/);
  assert.match(p.es, /Unos 4 pasos/);
});

test("NEVER manufactures a step count from prose", () => {
  // `explanation` is prose. Counting its sentences to produce "about 3 steps"
  // would be inventing a claim about the mathematics — the copy-panel failure
  // in a new costume.
  const p = notebookPromptFor(
    {
      type: "multiple-choice",
      explanation: "First find the factors. Then check each one. Then compare. Finally choose.",
    },
    2,
  );
  assert.equal(p.steps, null);
  assert.doesNotMatch(p.en, /steps/i, "no step count may be asserted without a real step array");
});

test("stays silent for every type where the screen is the work surface", () => {
  for (const type of SCREEN_IS_THE_WORK_SURFACE) {
    assert.equal(
      notebookPromptFor({ type }, 1),
      null,
      `${type} is a manipulative — telling a student to do it on paper is wrong`,
    );
  }
});

test("stays silent for types this phase does not target", () => {
  // Absence is a PASS. These are not defects to be filled in later by giving
  // every item a prompt.
  for (const type of ["open-response", "drag-sort", "fill-table", "matching", "matching-game"]) {
    assert.equal(notebookPromptFor({ type }, 1), null, `${type} must not get a prompt in phase 1`);
  }
});

test("an unknown or missing type stays silent, so a new type defaults to off", () => {
  assert.equal(notebookPromptFor({ type: "some-future-kind" }, 1), null);
  assert.equal(notebookPromptFor({}, 1), null);
  assert.equal(notebookPromptFor(null, 1), null);
  assert.equal(notebookPromptFor(undefined, 1), null);
});

test("no number means no prompt", () => {
  // An unlabelled "do this in your notebook" is the generic nag this design
  // exists to avoid — the student cannot find the page again.
  assert.equal(notebookPromptFor({ type: "multiple-choice" }, null), null);
  assert.equal(notebookPromptFor({ type: "multiple-choice" }, ""), null);
  assert.equal(notebookPromptFor({ type: "multiple-choice" }, undefined), null);
  assert.ok(notebookPromptFor({ type: "multiple-choice" }, 0), "problem 0 is a number, not absence");
});

test("derivedStepCount ignores a single-element array", () => {
  // One "step" is not a sequence worth announcing, and "About 1 steps" is the
  // kind of line that tells a student nobody read this.
  assert.equal(derivedStepCount({ workedExample: [{ work: "a" }] }), null);
  assert.equal(derivedStepCount({ workedExample: [] }), null);
  assert.equal(derivedStepCount({ correctWork: "not an array" }), null);
  assert.equal(derivedStepCount({}), null);
});

test("the targeted and excluded sets never overlap", () => {
  const both = [...NOTEBOOK_PROMPT_TYPES].filter((t) => SCREEN_IS_THE_WORK_SURFACE.has(t));
  assert.deepEqual(both, [], "a type cannot both be targeted and be a manipulative");
});

test("the prompt asserts no mathematics of its own", () => {
  // Shared code printing a mathematical claim reaches every lesson that renders
  // it — `data-live.js` once printed one lesson's histogram-vs-bar-chart
  // reasoning under every bar chart on the site. This copy must stay
  // procedural: it may name the problem NUMBER and a counted step total,
  // nothing else numeric.
  for (const type of NOTEBOOK_PROMPT_TYPES) {
    const p = notebookPromptFor({ type, workedExample: [{}, {}, {}] }, 5);
    for (const lane of [p.en, p.es]) {
      const numbers = lane.match(/\d+/g) || [];
      assert.deepEqual(
        numbers.sort(),
        ["3", "5"].sort(),
        `${type}: the only numbers may be the problem number and the counted steps — got "${lane}"`,
      );
    }
  }
});
