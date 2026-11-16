import assert from "node:assert/strict";
import test from "node:test";
import pack from "../access-practice-lab/src/content/journey/m01.js";
import {
  currentOutcome,
  followInstruction,
  init,
} from "../access-practice-lab/src/journey/engines/scene.js";

const task = pack.bands["3-5"].discover;
test("an unclear instruction leaves the scene unchanged", () => {
  const state = init(task);
  const result = followInstruction(task, state, "opening", "close");
  assert.equal(result.result, "unclear");
  assert.strictEqual(result.state, state);
  assert.equal(currentOutcome(task, state).key, "chaos");
});
test("specific instructions change the named object, not the other one", () => {
  const state = init(task);
  const window = followInstruction(task, state, "window", "close");
  assert.equal(window.result, "followed");
  assert.equal(currentOutcome(task, window.state).key, "escape");
  const cage = followInstruction(task, window.state, "cage", "close");
  assert.equal(currentOutcome(task, cage.state).key, "calm");
  const opened = followInstruction(task, cage.state, "window", "open");
  assert.equal(currentOutcome(task, opened.state).key, "breezy");
});
test("unsupported actions do not change the world", () => {
  const state = init(task);
  const result = followInstruction(task, state, "window", "remove");
  assert.equal(result.result, "invalid");
  assert.strictEqual(result.state, state);
});
