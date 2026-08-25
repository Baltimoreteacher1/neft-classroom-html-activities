// extractDivisionDiagram mounts a full standard-algorithm workspace, so a
// false positive puts another lesson's mathematics on the page. Both negative
// cases here SHIPPED on 2026-08-19 and are pinned exactly as found.

import assert from "node:assert/strict";
import test from "node:test";
import { extractDivisionDiagram } from "./division-helper.js";

test("a real division task mounts the workspace", () => {
  const d = extractDivisionDiagram({ stem: "Find 1,344 ÷ 12 using the standard algorithm." });
  assert.equal(d?.kind, "long-division-builder");
  assert.equal(d.dividend, 1344);
  assert.equal(d.divisor, 12);
  const w = extractDivisionDiagram({ stem: "Divide 252 by 6. Give the quotient and remainder." });
  assert.equal(w?.dividend, 252);
});

test("a post-solve explanation cannot mount a workspace (lesson 1-1's leak)", () => {
  // "Math is Mine" (MPP.3): the item is an estimation check; its explanation
  // mentioned "200 ÷ 22 ≈ 9" and students got 2-6's long-division lab.
  assert.equal(
    extractDivisionDiagram({
      stem: "Is the estimate of about 4 riders per car reasonable?",
      explanation: "200 riders shared across 22 cars is about 9 per car (200 ÷ 22 ≈ 9).",
    }),
    null,
  );
});

test("an approximation in the task is an estimate, not an algorithm", () => {
  assert.equal(
    extractDivisionDiagram({ stem: "About how much is 200 ÷ 22? Estimate first." }),
    null,
  );
});

test("fraction division never mounts a whole-number tableau (6-2's leak)", () => {
  // "3/4 ÷ 1/2" regex-matched as the whole-number "4 ÷ 1".
  assert.equal(
    extractDivisionDiagram({
      prompt: "Is 3/4 ÷ 1/2 the same as 1/2 ÷ 3/4? Solve both and explain why or why not.",
    }),
    null,
  );
});

test("an authored diagram always wins", () => {
  const authored = { kind: "long-division-builder", dividend: 936, divisor: 4 };
  assert.equal(extractDivisionDiagram({ stem: "anything", diagram: authored }), authored);
});
