// An authored distractor tag is the ONLY way to diagnose a word problem.
//
// The numeric predictor infers a misconception by re-computing arithmetic it
// can SEE in the stem. 82% of this curriculum's multiple-choice items are prose
// ("A recipe uses 4 cups of milk and 1 cup of cream…"), so for most of the bank
// the predictor has nothing to work with and an authored tag is the whole
// detection path (see reports/misconception-coverage.md).
//
// That path used to accept only 6 short aliases, which silently made the other
// 16 taxonomy entries unauthorable — an author writing "ratio-inverted"
// resolved to nothing, with no warning, and the tag simply never fired. These
// tests pin both accepted forms and, more importantly, pin that an unknown
// string still resolves to NOTHING rather than to a confident wrong diagnosis.

import assert from "node:assert/strict";
import test from "node:test";

import { MISCONCEPTIONS, diagnoseChoice, resolveAuthoredTag } from "./misconceptions.js";

test("short aliases still resolve (111 items were authored against them)", () => {
  assert.equal(resolveAuthoredTag("place-value"), "decimal-place-value");
  assert.equal(resolveAuthoredTag("sign-error"), "sign-dropped");
  assert.equal(resolveAuthoredTag("straight-across"), "fraction-straight-across-division");
  assert.equal(resolveAuthoredTag("triangle-half"), "geom-triangle-area-no-half");
});

test("every taxonomy id is authorable verbatim", () => {
  // The property that matters: no entry in the taxonomy may be unreachable
  // from an authored tag. This is what was broken.
  for (const id of Object.keys(MISCONCEPTIONS)) {
    assert.equal(resolveAuthoredTag(id), id, `${id} must be authorable by its own id`);
  }
});

test("an unknown tag resolves to null, never to a guess", () => {
  assert.equal(resolveAuthoredTag("ratio-invertedd"), null); // typo
  assert.equal(resolveAuthoredTag("not-a-real-error"), null);
  assert.equal(resolveAuthoredTag(""), null);
  assert.equal(resolveAuthoredTag(null), null);
  assert.equal(resolveAuthoredTag(undefined), null);
  assert.equal(resolveAuthoredTag(42), null);
});

test("a PROSE stem with an authored tag diagnoses — the predictor cannot", () => {
  // No arithmetic anywhere in the stem, so predictions() has nothing to model.
  // This is the exact shape of most of the item bank.
  const item = {
    stem: "A recipe uses 4 cups of milk and 1 cup of cream. What is the ratio of milk to cream?",
    choices: ["4:1", "1:4", "4:5", "5:1"],
    correctIndex: 0,
    misconceptionTags: [null, "ratio-inverted", null, null],
  };
  assert.equal(diagnoseChoice(item, 1)?.id, "ratio-inverted");
  // Untagged distractors stay undiagnosed rather than borrowing a neighbour's tag.
  assert.equal(diagnoseChoice(item, 2), null);
  assert.equal(diagnoseChoice(item, 3), null);
  // The correct answer is never a misconception.
  assert.equal(diagnoseChoice(item, 0), null);
});

test("a mistyped authored tag degrades to the predictor, not to a wrong answer", () => {
  const item = {
    stem: "What is the ratio of 4 to 1?",
    choices: ["4:1", "1:4"],
    correctIndex: 0,
    misconceptionTags: [null, "ratio-invertedd"],
  };
  assert.equal(diagnoseChoice(item, 1), null);
});

test("the diagnosis carries the student-facing text, in both languages", () => {
  const item = {
    stem: "A pet store has 5 dogs and 9 cats. What is the ratio of dogs to cats?",
    choices: ["5:9", "9:5"],
    correctIndex: 0,
    misconceptionTags: [null, "ratio-inverted"],
  };
  const hit = diagnoseChoice(item, 1);
  assert.ok(hit.label, "needs a teacher-facing label");
  assert.ok(hit.student, "needs the student-facing sentence");
  assert.ok(MISCONCEPTIONS["ratio-inverted"].labelEs, "and its Spanish");
});
