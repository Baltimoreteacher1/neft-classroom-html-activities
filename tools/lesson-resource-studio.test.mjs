import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { FLAGSHIP_DATA } from "../assets/curriculum-studio/flagship-data.mjs";
import { diagnoseResponse } from "../assets/curriculum-studio/misconception-engine.mjs";
import { inspectLessonResources } from "../scripts/inspect-lesson-resources.mjs";
import { buildCanonicalResourceCatalog } from "../scripts/lib/canonical-resource-registry.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("canonical resource catalog covers all 84 lessons with student-safe paths", () => {
  const catalog = buildCanonicalResourceCatalog(ROOT);
  assert.equal(catalog.lessonCount, 84);
  assert.ok(catalog.resourceCount > 900);
  for (const l of catalog.lessons) {
    for (const r of l.resources) {
      assert.ok(
        !/slides|teacher|answer-key|\.docx|\.pdf/i.test(r.href),
        `Teacher path leaked: ${r.href}`,
      );
    }
  }
});

test("resource quality & alignment inspector reports 0 high-severity issues", () => {
  const report = inspectLessonResources(ROOT);
  assert.equal(report.highCount, 0, JSON.stringify(report.findings, null, 2));
  assert.equal(report.passed, true);
});

test("lesson 6-4 units directory and map discrepancies are resolved", () => {
  const unitsHtml = readFileSync(join(ROOT, "curriculum/units/index.html"), "utf8");
  assert.ok(
    !unitsHtml.includes(
      "I can evaluate algebraic expressions by substituting values for the variables.",
    ),
  );
  assert.ok(
    unitsHtml.includes(
      "I can write numerical expressions from a real situation and evaluate them using the order of operations, including powers.",
    ),
  );
  const mapHtml = readFileSync(join(ROOT, "curriculum/map/index.html"), "utf8");
  assert.ok(!mapHtml.includes("6-2 Evaluate Expressions"));
  assert.ok(mapHtml.includes("6-4 Write and Evaluate Numerical Expressions with Exponents"));
});

test("flagship lessons (6-5, 5-1, 2-3) have complete interactive & reasoning configs", () => {
  for (const id of ["6-5", "5-1", "2-3"]) {
    const f = FLAGSHIP_DATA[id];
    assert.ok(f, `Missing flagship data for ${id}`);
    assert.ok(f.theater.predictOptions.some((o) => o.correct));
    assert.equal(f.guidedNotes.steps.length, 3);
    assert.ok(f.reasoning.spotFlaw.choices.some((c) => c.correct));
    assert.ok(f.collaboration.correctMatch);
    assert.ok(f.family.goalPlain && f.family.goalPlainEs);
  }
});

test("misconception engine classifies key errors and provides aligned reattempts", () => {
  const swap = diagnoseResponse({ lessonId: "6-5", response: "50t + 12", expected: "12t+50" });
  assert.equal(swap.status, "misconception");
  assert.equal(swap.misconceptionId, "6-5-coeff-constant-swap");
  assert.ok(swap.reattempt?.expected);

  const rev = diagnoseResponse({ lessonId: "6-5", response: "5 - x", expected: "x-5" });
  assert.equal(rev.misconceptionId, "6-5-subtraction-reversal");

  const slant = diagnoseResponse({ lessonId: "5-1", response: "154", expected: "126" });
  assert.equal(slant.misconceptionId, "5-1-slant-height");

  const unord = diagnoseResponse({
    lessonId: "2-3",
    response: "8",
    expected: "9",
    context: { unsortedMid: 8 },
  });
  assert.equal(unord.misconceptionId, "2-3-unordered-median");

  const ok = diagnoseResponse({ lessonId: "6-5", response: "12t + 50", expected: "12t+50" });
  assert.equal(ok.correct, true);
});
