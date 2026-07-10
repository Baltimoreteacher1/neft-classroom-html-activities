#!/usr/bin/env node

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { deriveTWR } from "../engine/core/twr.js";

const root = new URL("../", import.meta.url).pathname;
const lessonsDir = join(root, "lessons");
const lessonIds = readdirSync(lessonsDir)
  .filter((id) => /^\d+-\d+(?:-flagship)?$/.test(id))
  .filter((id) => {
    try {
      readFileSync(join(lessonsDir, id, "config.json"));
      return true;
    } catch {
      return false;
    }
  })
  .sort();

assert.equal(lessonIds.length, 74, "expected the complete 74-lesson curriculum");

const bannedLegacyLanguage = /matters in math|Wow,|Sentence Types|Show excitement/i;

for (const lessonId of lessonIds) {
  const config = JSON.parse(readFileSync(join(lessonsDir, lessonId, "config.json"), "utf8"));
  const result = deriveTWR(config);

  assert.ok(result.focus, `${lessonId}: missing focus`);
  assert.equal(typeof result.focus.questionEn, "string", `${lessonId}: missing English question`);
  assert.match(result.focus.questionEn, /\?$/, `${lessonId}: focus must be a question`);
  assert.ok(
    ["explain", "compare", "describe", "justify"].includes(result.focus.action),
    `${lessonId}: unsupported action ${result.focus.action}`,
  );
  assert.ok(result.vocabulary.length >= 3, `${lessonId}: needs at least three vocabulary terms`);
  assert.deepEqual(
    result.levels.map((level) => level.id),
    ["start", "build", "explain"],
    `${lessonId}: support levels are incomplete`,
  );
  assert.equal(result.checklist.length, 5, `${lessonId}: checklist must have five criteria`);
  assert.deepEqual(
    result.teacherCriteria,
    result.checklist,
    `${lessonId}: student and teacher criteria must match`,
  );

  const configuredTerms = new Set(
    (config.vocabulary || []).map((item) => String(item.term || "").toLowerCase()),
  );
  for (const word of result.vocabulary) {
    assert.ok(
      configuredTerms.has(String(word.term || "").toLowerCase()),
      `${lessonId}: invented vocabulary term ${word.term}`,
    );
  }

  assert.doesNotMatch(
    JSON.stringify(result),
    bannedLegacyLanguage,
    `${lessonId}: legacy generic prompt remains`,
  );
}

const noSpanish = {
  lessonId: "test-no-spanish",
  title: "Compare Ratios",
  contentObjective: "I can compare two ratios.",
  vocabulary: [
    { term: "ratio", definition: "A comparison of two quantities." },
    { term: "equivalent ratio", definition: "Ratios that name the same comparison." },
    { term: "table", definition: "Values arranged in rows and columns." },
  ],
  turnAndTalk: [
    {
      phase: "explore",
      question: "Which ratio is greater, and how do you know?",
      stems: [{ en: "The greater ratio is ___ because ___." }],
      wordBank: ["ratio", "equivalent ratio", "table"],
    },
  ],
};
const englishOnly = deriveTWR(noSpanish);
assert.equal(englishOnly.focus.questionEs, "", "must not fabricate a Spanish focus question");
assert.ok(
  englishOnly.vocabulary.every((word) => word.termEs === "" && word.definitionEs === ""),
  "must not fabricate Spanish vocabulary",
);

console.log(`twr-writing: PASS (${lessonIds.length} lesson configurations)`);
