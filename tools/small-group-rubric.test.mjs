import assert from "node:assert/strict";
import test from "node:test";

import { MASTERY_BANDS, masteryBand } from "../engine/core/small-group-rubric.js";

test("empty or unstarted sessions read as approaching", () => {
  assert.equal(masteryBand({}).id, "approaching");
  assert.equal(masteryBand({ total: 10, solved: 0 }).id, "approaching");
});

test("under 60% completion is approaching", () => {
  assert.equal(masteryBand({ total: 10, solved: 5, attempts: 6 }).id, "approaching");
});

test("solid completion with supports is meeting", () => {
  assert.equal(
    masteryBand({ total: 10, solved: 7, attempts: 10, incorrectAttempts: 3, hints: 2 }).id,
    "meeting",
  );
});

test("accurate and independent work is exceeding", () => {
  assert.equal(
    masteryBand({ total: 10, solved: 9, attempts: 10, incorrectAttempts: 1, hints: 1 }).id,
    "exceeding",
  );
});

test("high completion but hint-reliant stays meeting", () => {
  assert.equal(
    masteryBand({ total: 10, solved: 9, attempts: 12, incorrectAttempts: 3, hints: 4 }).id,
    "meeting",
  );
});

test("every band carries teacher-facing copy", () => {
  for (const band of Object.values(MASTERY_BANDS)) {
    assert.ok(band.label);
    assert.ok(band.copy);
    assert.ok(band.emoji);
  }
});
