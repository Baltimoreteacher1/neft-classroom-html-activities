import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTO_SUPPORT_DISTINCT_MISSES,
  chooseAdaptivePath,
  createAutoSupportTracker,
} from "@eduwonderlab/engine/core/small-group-innovation.js";

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

test("auto support opens once misses spread across different problems", () => {
  const tracker = createAutoSupportTracker();

  assert.equal(tracker.recordAttempt({ correct: false, key: "i0" }), false);
  assert.equal(tracker.recordAttempt({ correct: false, key: "i3" }), true);
  assert.equal(tracker.missedCount, AUTO_SUPPORT_DISTINCT_MISSES);
});

test("hammering ONE problem never escalates the whole set", () => {
  // The per-card rule already opens this card's own supports on its second try.
  // If repeat misses counted here too, one hard problem would scaffold every
  // other problem in the set — including the ones going fine.
  const tracker = createAutoSupportTracker();

  for (let i = 0; i < 6; i++) {
    assert.equal(tracker.recordAttempt({ correct: false, key: "i2" }), false);
  }
  assert.equal(tracker.missedCount, 1);
  assert.equal(tracker.fired, false);
});

test("correct attempts never escalate, and escalation fires exactly once", () => {
  const tracker = createAutoSupportTracker();

  for (const key of ["i0", "i1", "i2"]) {
    assert.equal(tracker.recordAttempt({ correct: true, key }), false);
  }
  assert.equal(tracker.fired, false, "a clean run must not open supports");

  tracker.recordAttempt({ correct: false, key: "i0" });
  assert.equal(tracker.recordAttempt({ correct: false, key: "i1" }), true);
  // Every later miss returns false, so the banner is announced a single time.
  assert.equal(tracker.recordAttempt({ correct: false, key: "i5" }), false);
  assert.equal(tracker.recordAttempt({ correct: false, key: "i6" }), false);
});

test("unidentifiable items are ignored rather than counted as new problems", () => {
  // An item with no `_practiceIndex` and no stem yields an empty key. Counting
  // those as distinct problems would let two unidentified attempts escalate.
  const tracker = createAutoSupportTracker();

  assert.equal(tracker.recordAttempt({ correct: false, key: "" }), false);
  assert.equal(tracker.recordAttempt({ correct: false, key: null }), false);
  assert.equal(tracker.recordAttempt({ correct: false }), false);
  assert.equal(tracker.missedCount, 0);
});
