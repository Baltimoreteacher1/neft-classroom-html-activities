// The live class quiz key (shared/class-platform/quiz-key.json) is generated from the lab's item bank. It must be
// current, list only items a phone can show alone, and agree with the bank on every correct option.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { allActivities } from "./lib/access-lab-content.mjs";
import { buildQuizKey, quizEligible } from "./lib/access-quiz-key.mjs";

const committed = JSON.parse(
  readFileSync(new URL("../shared/class-platform/quiz-key.json", import.meta.url), "utf8"),
);

test("the committed quiz key is current (run node tools/access-lab-index.mjs)", () => {
  assert.deepEqual(committed, buildQuizKey());
  assert.ok(Object.keys(committed.items).length >= 20, "enough items for a real round");
});

test("every key item is single-answer, text-only and its answer is a real option", () => {
  const rows = new Map(allActivities().map((r) => [r.activity.id, r]));
  for (const [id, entry] of Object.entries(committed.items)) {
    const row = rows.get(id);
    assert.ok(row, `${id} exists in the bank`);
    assert.ok(quizEligible(row), `${id} is eligible`);
    assert.equal(row.activity.answer, entry.answer, id);
    assert.ok(
      row.activity.options.some((o) => o.id === entry.answer),
      id,
    );
    assert.equal(row.domain === "Model-Test", false, "test-format items are not quiz material");
  }
});
