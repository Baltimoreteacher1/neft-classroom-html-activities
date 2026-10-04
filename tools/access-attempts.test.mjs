import assert from "node:assert/strict";
import test from "node:test";
import {
  startIndependentAttempt,
  updateActivityAnswer,
} from "../access-practice-lab/src/attempts.js";
import { answerOf } from "../access-practice-lab/src/store.js";

test("all selected-response shapes invalidate old evidence only when the answer changes", () => {
  for (const [before, after] of [
    ["a", "b"],
    [["a"], ["b"]],
    [{ slot: "a" }, { slot: "b" }],
  ]) {
    const record = {
      answers: { x: before },
      complete: ["x", "other"],
      results: { x: { ok: true } },
    };
    assert.equal(updateActivityAnswer(record, "x", before), false);
    assert.deepEqual(record.complete, ["x", "other"]);
    assert.equal(updateActivityAnswer(record, "x", after), true);
    assert.deepEqual(record.complete, ["other"]);
    assert.equal(record.results.x.evidence, "draft");
    assert.equal(record.results.x.meaningful, false);
  }
});

test("fresh attempts mask legacy answers, keep authored text, and bound history", () => {
  const record = {
    answers: {},
    selected: { x: "a" },
    complete: ["x"],
    notes: { x: "Keep notes" },
    drafts: { x: { first: "Keep first" } },
    reflections: { x: "Keep reflection" },
    supportUsed: { x: true },
    attempts: { x: 3 },
    results: { x: { ok: true, evidence: "supported" } },
  };
  startIndependentAttempt(record, "x");
  assert.equal(answerOf(record, "x"), null);
  assert.equal(record.attemptHistory.x[0].result.evidence, "supported");
  assert.equal(record.attemptHistory.x[0].supportUsed, true);
  assert.equal(record.attemptHistory.x[0].attempts, 3);
  for (let i = 0; i < 7; i++) startIndependentAttempt(record, "x");
  assert.equal(record.attemptHistory.x.length, 5);
  assert.equal(record.notes.x, "Keep notes");
  assert.equal(record.drafts.x.first, "Keep first");
  assert.equal(record.reflections.x, "Keep reflection");
});
