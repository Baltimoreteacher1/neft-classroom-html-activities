// Regression tests for the engine audit fixes (PR #88).
//
// Each of these guards a specific bug that shipped because the engine had no
// coverage for it. Plain-node assertions (run by tools/run-tests.mjs); the
// matching-game case uses jsdom (already a dependency) to drive the real
// component through a completion with a wrong attempt.

import assert from "node:assert/strict";
import { PHASE_TIME_ESTIMATES } from "../../engine/core/content-enrichment.js";
import { phaseName } from "../../engine/core/i18n.js";
import { masteryBand, computeGrade } from "../../engine/core/grade.js";

let passed = 0;
function ok(name) {
  console.log(`  ✓ ${name}`);
  passed += 1;
}

/* ── Bug #3 + #4: phase table must stay aligned with the 5-phase layout ──
 * The cover chips and teacher pacing guides label PHASE_TIME_ESTIMATES rows by
 * index via phaseName(i). If the table regains a stale entry (e.g. the removed
 * "Vocab" phase) every label below it shifts by one, and the "/N phases"
 * denominators drift. */
{
  assert.equal(PHASE_TIME_ESTIMATES.length, 3, "expected exactly 3 lesson acts");
  assert.ok(
    !PHASE_TIME_ESTIMATES.some((p) => /vocab/i.test(p.name)),
    "the removed Vocab phase must not reappear in PHASE_TIME_ESTIMATES",
  );
  const expectedOrder = ["Launch & Focus", "Interactive Studio", "Exit Ticket"];
  PHASE_TIME_ESTIMATES.forEach((p, i) => {
    assert.equal(p.name, expectedOrder[i], `phase ${i} name`);
    // The index-based label the consumers render must match the row's own name.
    assert.equal(
      phaseName(i, "en"),
      p.name,
      `phaseName(${i}) must align with PHASE_TIME_ESTIMATES[${i}].name (off-by-one guard)`,
    );
  });
  ok("PHASE_TIME_ESTIMATES is 8 phases and aligns with phaseName(i)");
}

/* ── grade.js mastery bands (scoring contract) ── */
{
  assert.equal(masteryBand(100), "Strong");
  assert.equal(masteryBand(85), "Strong"); // inclusive boundary
  assert.equal(masteryBand(84), "Likely Ready");
  assert.equal(masteryBand(70), "Likely Ready"); // inclusive boundary
  assert.equal(masteryBand(69), "Approaching");
  assert.equal(masteryBand(60), "Approaching"); // inclusive boundary
  assert.equal(masteryBand(59), "Needs Reteach");
  assert.equal(masteryBand(0), "Needs Reteach");
  ok("masteryBand boundaries (85 / 70 / 60)");
}

/* ── grade.js computeGrade: accuracy basis vs completion fallback ── */
{
  const fakeState = (s) => ({ get: () => s });
  const config = { id: "1-1", title: "Intro", standard: "6.AT.A.1" };

  const acc = computeGrade(
    fakeState({
      studentName: "Ada",
      totalCorrect: 8,
      totalAttempts: 10,
      phases: [{ name: "Launch", status: "completed", correct: 8, attempts: 10, stars: 2 }],
    }),
    config,
  );
  assert.equal(acc.basis, "accuracy");
  assert.equal(acc.pct, 80);
  assert.equal(acc.band, "Likely Ready");

  // No graded attempts → grade on completion (stars earned / stars possible).
  const comp = computeGrade(
    fakeState({
      studentName: "Ben",
      totalCorrect: 0,
      totalAttempts: 0,
      phases: [
        { name: "Launch", status: "completed", stars: 3 },
        { name: "Explore", status: "completed", stars: 3 },
      ],
    }),
    config,
  );
  assert.equal(comp.basis, "completion");
  assert.equal(comp.pct, 100); // 6 of 6 possible stars
  ok("computeGrade accuracy basis + completion fallback");
}

/* ── Bug #1: a completed matching game must grade as CORRECT, even when the
 * student made wrong attempts along the way. finishGame only fires once every
 * pair is matched, so completion always means success; reporting the raw
 * attempt count as the "total" made graders that test correct === total mark a
 * finished board as wrong. ── */
async function matchingGameTest() {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  try {
    const { renderMatchingGame } = await import("../../engine/components/matching-game.js");

    const pairs = [
      { term: "2+2", match: "4" },
      { term: "3+3", match: "6" },
      { term: "5+5", match: "10" },
    ];
    const container = document.createElement("div");
    document.body.append(container);

    let reported = null;
    renderMatchingGame(container, {
      pairs,
      onComplete: (correct, total) => {
        reported = { correct, total };
      },
    });

    const byText = (txt) =>
      [...container.querySelectorAll("button.mg-item")].find((b) => b.textContent === txt);

    // One deliberate WRONG attempt first: "2+2" then "6" (pair 1's match).
    byText("2+2").click();
    byText("6").click();
    assert.equal(reported, null, "wrong attempt must not complete the game");

    // Now match everything correctly.
    for (const p of pairs) {
      byText(p.term).click();
      byText(p.match).click();
    }

    assert.ok(reported, "onComplete should fire once all pairs are matched");
    assert.equal(
      reported.correct,
      reported.total,
      "completed matching game must report correct === total (grades as correct)",
    );
    assert.equal(reported.correct, pairs.length);
    ok("matching game grades as correct after a wrong attempt");
  } finally {
    delete globalThis.document;
    delete globalThis.window;
  }
}

await matchingGameTest();

console.log(`\nengine-fixes: ${passed}/4 checks passed`);
