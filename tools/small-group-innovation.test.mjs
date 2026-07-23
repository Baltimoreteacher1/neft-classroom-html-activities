import assert from "node:assert/strict";
import test from "node:test";

import { chooseAdaptivePath } from "../engine/core/small-group-innovation.js";

test("recommends stabilize when the group needs another supported entry point", () => {
  assert.equal(chooseAdaptivePath({ before: 2 }, "group1").id, "stabilize");
  assert.equal(chooseAdaptivePath({ before: 4, incorrectAttempts: 2 }, "group2").id, "stabilize");
  assert.equal(chooseAdaptivePath({ before: 4, hints: 2 }, "group2").id, "stabilize");
});

test("recommends stretch for a ready Group 2 session with successful practice", () => {
  const result = chooseAdaptivePath(
    { before: 4, attempts: 2, incorrectAttempts: 0, hints: 0, solved: 2 },
    "group2",
  );

  assert.equal(result.id, "stretch");
});

test("recommends connect for the productive middle path", () => {
  assert.equal(
    chooseAdaptivePath(
      { before: 3, attempts: 2, incorrectAttempts: 1, hints: 0, solved: 1 },
      "group1",
    ).id,
    "connect",
  );
});

test("returns an explainable pathway and all student-selectable alternatives", () => {
  const result = chooseAdaptivePath({ before: 3 }, "group1");

  assert.equal(typeof result.label, "string");
  assert.equal(typeof result.reason, "string");
  assert.equal(typeof result.prompt, "string");
  assert.deepEqual(
    result.alternatives.map((path) => path.id),
    ["stabilize", "connect", "stretch"],
  );
  for (const path of result.alternatives) {
    assert.ok(path.label);
    assert.ok(path.prompt);
  }
});

test("recommends stretch for clean group1 and catch-up sessions too (variant parity)", () => {
  const clean = { before: 4, attempts: 3, incorrectAttempts: 0, hints: 0, solved: 2 };
  assert.equal(chooseAdaptivePath(clean, "group1").id, "stretch");
  assert.equal(chooseAdaptivePath(clean, "catchup").id, "stretch");
});
