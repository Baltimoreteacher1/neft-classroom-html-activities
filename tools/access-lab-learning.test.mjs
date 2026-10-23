#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import { SPEAKING_CHECKS } from "../access-practice-lab/src/grade.js";
import { analyzeResponse, bankWordsUsed } from "../access-practice-lab/src/lang/analyze.js";
import { TIERS, testingWindowPhase } from "../access-practice-lab/src/util.js";

test("word-bank feedback does not reward embedded substrings", () => {
  assert.deepEqual(bankWordsUsed("The train brought sunshine.", ["rain", "sun"]), []);
});

test("word-bank feedback recognizes whole phrases and accented words", () => {
  assert.deepEqual(
    bankWordsUsed("The WATER cycle brings rain. We visit the café.", [
      "water cycle",
      "rain",
      "café",
      "water cycle",
    ]),
    ["water cycle", "rain", "café"],
  );
  assert.deepEqual(bankWordsUsed("Water moves through a cycle.", ["water cycle"]), []);
  assert.deepEqual(bankWordsUsed("The rains came.", ["rain/rains"]), []);
  assert.deepEqual(bankWordsUsed("Rain fell.", ["rain/rains"]), ["rain/rains"]);
});

test("writing feedback labels communicate observations, not proficiency", () => {
  const feedback = analyzeResponse("Rain fell. we ate because it was cold.", {
    wordBank: ["rain"],
  });
  const spoken = JSON.stringify([feedback.strengths, feedback.nextMoves]);
  assert.doesNotMatch(spoken, /proficien|WIDA|score|level [1-6]/i);
  // a lower-case sentence start after a full stop is caught, not just the first character of the text
  assert.ok(feedback.errors.some((e) => e.id === "capital-punct"));
});

test("a task without a word bank does not ask for missing resources", () => {
  const feedback = analyzeResponse("I see a bird in the tree near my house today.", {
    wordBank: [],
  });
  assert.equal(feedback.word.bankUnused.length, 0);
  assert.ok(!feedback.nextMoves.some((m) => m.id === "try-bank"));
});

test("support choices preserve route keys without claiming official scores", () => {
  assert.deepEqual(Object.keys(TIERS), ["A", "B", "C"]);
  for (const tier of Object.values(TIERS)) assert.doesNotMatch(tier.range, /WIDA|\d/);
  assert.match(
    SPEAKING_CHECKS.find((check) => check.id === "clear").label,
    /words, phrases, or sentences/,
  );
});

test("testing window status ends with the configured regular window", () => {
  const window = { start: "2027-01-06", end: "2027-02-16" };
  assert.deepEqual(testingWindowPhase(window, "2026-10-02"), {
    phase: "upcoming",
    daysAway: 96,
  });
  assert.deepEqual(testingWindowPhase(window, "2027-01-06"), {
    phase: "starting",
    daysAway: 0,
  });
  assert.deepEqual(testingWindowPhase(window, "2027-02-16"), {
    phase: "open",
    daysAway: 0,
  });
  assert.equal(testingWindowPhase(window, "2027-02-17"), null);
});
