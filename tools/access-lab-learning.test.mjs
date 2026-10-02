#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeWriting, SPEAKING_CHECKS } from "../access-practice-lab/src/grade.js";
import { TIERS } from "../access-practice-lab/src/util.js";

test("word-bank feedback does not reward embedded substrings", () => {
  const feedback = analyzeWriting(
    "The train brought sunshine.",
    { wordBank: ["rain", "sun"] },
    "A",
  );
  assert.deepEqual(feedback.usedWords, []);
});

test("word-bank feedback recognizes whole phrases and accented words", () => {
  const feedback = analyzeWriting(
    "The WATER cycle brings rain. We visit the café.",
    {
      wordBank: ["water cycle", "rain", "café", "water cycle"],
    },
    "B",
  );
  assert.deepEqual(feedback.usedWords, ["water cycle", "rain", "café"]);
  assert.deepEqual(
    analyzeWriting("Water moves through a cycle.", { wordBank: ["water cycle"] }, "A").usedWords,
    [],
  );
});

test("feedback labels communicate mechanical observations, not proficiency", () => {
  const feedback = analyzeWriting("Rain.", { wordBank: ["rain"] }, "A");
  assert.equal(feedback.checks.length, 4);
  assert.match(feedback.checks[0].label, /Optional/);
  assert.equal(feedback.checks[3].label, "Capital letter and end punctuation");
  assert.ok(
    !feedback.checks.some((check) => /Complete sentences|proficiency|WIDA/.test(check.label)),
  );
});

test("a task without a word bank does not ask for missing resources", () => {
  const feedback = analyzeWriting("I see a bird.", {}, "A");
  assert.equal(feedback.checks[2].label, "No word bank for this task");
  assert.equal(feedback.checks[2].ok, true);
});

test("support choices preserve route keys without claiming official scores", () => {
  assert.deepEqual(Object.keys(TIERS), ["A", "B", "C"]);
  for (const tier of Object.values(TIERS)) assert.doesNotMatch(tier.range, /WIDA|\d/);
  assert.match(
    SPEAKING_CHECKS.find((check) => check.id === "clear").label,
    /words, phrases, or sentences/,
  );
});
