import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOneStepEqPlay, validateOneStepEq } from "./one-step-equation.js";
import { eqChoices, oneStepEqCopy, solveEq } from "./one-step-equation-model.js";

test("rejects bad one-step equation configs", () => {
  for (const bad of [
    null,
    {},
    { op: "*", k: 3, rhs: 12 },
    { op: "+", k: 10, rhs: 10 }, // solution = 0
    { op: "+", k: 5, rhs: 10 }, // solution = k = 5
    { op: "+", k: 0, rhs: 8 },
  ]) {
    assert.equal(validateOneStepEq(bad), null, JSON.stringify(bad));
    assert.equal(buildOneStepEqPlay(bad), null, JSON.stringify(bad));
  }
});

test("recomputes 8-2 (x + 7 = 15 → x = 8)", () => {
  const cfg = { varName: "x", op: "+", k: 7, rhs: 15 };
  const v = validateOneStepEq(cfg);
  assert.ok(v);
  assert.equal(solveEq(v).solution, 8);
  assert.equal(solveEq(v).wrongSameOp, 22);
  const copy = oneStepEqCopy(v);
  assert.match(copy.printSummary.en, /x = 8/);
  assert.match(copy.printSummary.es, /x = 8/);
  const opts = eqChoices(v);
  assert.equal(opts.find((o) => o.correct).value, 8);
  assert.ok(opts.some((o) => o.kind === "wrongOp" && o.value === 22));
  const play = buildOneStepEqPlay(cfg);
  assert.equal(play.scenes.length, 5);
  assert.ok(play.scenes.every((s) => s.askChild?.en && s.askChild?.es));
});
