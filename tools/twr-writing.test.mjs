#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { renderTwrWriting } from "@eduwonderlab/engine/components/twr-writing.js";
import { deriveTWR } from "@eduwonderlab/engine/core/twr.js";

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

assert.equal(lessonIds.length, 84, "expected the complete 84-lesson curriculum");

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
  assert.equal(result.checklist.length, 3, `${lessonId}: checklist must have three criteria`);
  // The teacher copy must say something the student page did not — it used to
  // be the student checklist reprinted verbatim under "Teacher Copy".
  assert.ok(result.teacherCriteria.length >= 3, `${lessonId}: teacher criteria missing`);
  assert.notDeepEqual(
    result.teacherCriteria,
    result.checklist,
    `${lessonId}: teacher criteria must not reprint the student checklist`,
  );
  // No support level may hand out a sentence frame another level already
  // printed — duplicated frames are how the writing block read as boilerplate.
  const frameTexts = result.levels.flatMap((level) => level.frames.map((f) => f.en));
  assert.equal(
    new Set(frameTexts).size,
    frameTexts.length,
    `${lessonId}: duplicate sentence frame across support levels`,
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
  assert.match(notes, /class="topbar-actions"/, `${lessonId}: mobile toolbar hook is missing`);
  assert.match(
    notes,
    /@media\(max-width:640px\)\{\.topbar\{/,
    `${lessonId}: mobile toolbar layout is missing`,
  );
  const sectionMatch = notes.match(/<section class="section twr">([\s\S]*?)<\/section>/);
  assert.ok(sectionMatch, `${lessonId}: generated writing section is missing`);
  const writingSection = sectionMatch[1];
  // Compact contract (2026-08): question → word bank → leveled frames → 3-item
  // check, with none of the old four-step guide headers ("1. Understand the
  // Question" …) that made the writing block a lesson of its own.
  assert.match(writingSection, /twr-focus-question/, `${lessonId}: missing focus question`);
  assert.match(writingSection, /twr-word-grid/, `${lessonId}: missing word bank`);
  assert.match(writingSection, /twr-checklist/, `${lessonId}: missing checklist`);
  assert.doesNotMatch(
    writingSection,
    /\d\.\s(Understand the Question|Plan Your Math Words|Build Your Explanation|Check Your Explanation)/,
    `${lessonId}: old four-step guide headers remain`,
  );
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
  assert.match(documentXml, /Write About the Math/, `${lessonId}: DOCX missing writing block`);
  assert.match(documentXml, /Check Your Explanation/, `${lessonId}: DOCX missing Check`);
  assert.doesNotMatch(
    documentXml,
    /1\. Understand the Question/,
    `${lessonId}: DOCX still has the old four-step guide`,
  );
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
    url: "https://example.test/lessons/6-9/",
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
// Compact layout (2026-07): the focus question + one inline write box show up
// front; the heavy scaffolding (math words, extra levels, self-check) lives in a
// collapsed "Need help?" panel. All three support-level write boxes and the
// vocab/checklist inputs are still present (in the DOM) so save/resume and the
// pedagogy are unchanged — just visually compact.
assert.match(container.textContent, /Write About the Math/);
assert.match(container.textContent, /Your job:/);
assert.ok(
  container.querySelector("details.twr-help"),
  "scaffolding must live in a collapsible Need help panel",
);
assert.match(container.querySelector("details.twr-help summary").textContent, /Need help\?/);
assert.equal(container.querySelectorAll("[data-support-level]").length, 3);
assert.equal(container.querySelectorAll('input[type="checkbox"]').length >= 5, true);
assert.equal(container.querySelectorAll("textarea").length, 3);
assert.doesNotMatch(container.textContent, bannedLegacyLanguage);
dom.window.close();
delete globalThis.window;
delete globalThis.document;

console.log(`twr-writing: PASS (${lessonIds.length} lesson configurations)`);
