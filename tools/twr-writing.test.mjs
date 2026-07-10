#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { renderTwrWriting } from "../engine/components/twr-writing.js";
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

for (const lessonId of lessonIds) {
  const notesPath = join(lessonsDir, lessonId, "notes.html");
  const notes = readFileSync(notesPath, "utf8");
  const sectionMatch = notes.match(/<section class="section twr">([\s\S]*?)<\/section>/);
  assert.ok(sectionMatch, `${lessonId}: generated writing section is missing`);
  const writingSection = sectionMatch[1];
  assert.match(writingSection, /1\. Understand the Question/, `${lessonId}: missing Understand`);
  assert.match(writingSection, /2\. Plan Your Math Words/, `${lessonId}: missing Plan`);
  assert.match(writingSection, /3\. Build Your Explanation/, `${lessonId}: missing Build`);
  assert.match(writingSection, /4\. Check Your Explanation/, `${lessonId}: missing Check`);
  assert.match(writingSection, /data-support-level="start"/, `${lessonId}: missing Start support`);
  assert.match(writingSection, /data-support-level="build"/, `${lessonId}: missing Build support`);
  assert.match(
    writingSection,
    /data-support-level="explain"/,
    `${lessonId}: missing Explain support`,
  );
  assert.doesNotMatch(
    writingSection,
    bannedLegacyLanguage,
    `${lessonId}: old generated prompt remains`,
  );
}

for (const lessonId of lessonIds) {
  const docxPath = join(lessonsDir, lessonId, "downloads", `${lessonId}-notes.docx`);
  const documentXml = execFileSync("unzip", ["-p", docxPath, "word/document.xml"], {
    encoding: "utf8",
  });
  assert.match(documentXml, /Understand the Question/, `${lessonId}: DOCX missing Understand`);
  assert.match(documentXml, /Plan Your Math Words/, `${lessonId}: DOCX missing Plan`);
  assert.match(documentXml, /Build Your Explanation/, `${lessonId}: DOCX missing Build`);
  assert.match(documentXml, /Check Your Explanation/, `${lessonId}: DOCX missing Check`);
  assert.doesNotMatch(documentXml, bannedLegacyLanguage, `${lessonId}: DOCX has old prompts`);
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

const interactiveConfig = JSON.parse(readFileSync(join(lessonsDir, "2-2", "config.json"), "utf8"));
const dom = new JSDOM(
  "<!doctype html><html><head></head><body><main id=app></main></body></html>",
  {
    url: "https://example.test/lessons/2-2/",
  },
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const container = document.querySelector("#app");
let renderError;
try {
  renderTwrWriting(container, interactiveConfig);
} catch (error) {
  renderError = error;
}
assert.equal(renderError, undefined, `interactive renderer failed: ${renderError?.message}`);
assert.match(container.textContent, /1\. Understand the Question/);
assert.match(container.textContent, /2\. Plan Your Math Words/);
assert.match(container.textContent, /3\. Build Your Explanation/);
assert.match(container.textContent, /4\. Check Your Explanation/);
assert.equal(container.querySelectorAll("[data-support-level]").length, 3);
assert.equal(container.querySelectorAll('input[type="checkbox"]').length >= 5, true);
assert.equal(container.querySelectorAll("textarea").length, 3);
assert.doesNotMatch(container.textContent, bannedLegacyLanguage);
dom.window.close();
delete globalThis.window;
delete globalThis.document;

console.log(`twr-writing: PASS (${lessonIds.length} lesson configurations)`);
