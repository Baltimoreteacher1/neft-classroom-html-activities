#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const OUTPUT = join(ROOT, "assets", "learning-supports", "manifest.json");
const PROFILES = [
  "read-understand",
  "focus-organize",
  "build-math",
  "express-thinking",
  "language-support",
  "challenge-extend",
];

function clean(value, max = 900) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function unique(values, maxItems = 24) {
  return [...new Set(values.map((value) => clean(value)).filter(Boolean))].slice(0, maxItems);
}

function canonicalIds() {
  return readdirSync(LESSONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+-\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });
}

function buildVocabulary(config) {
  return (config.vocabulary || []).slice(0, 12).map((item) => ({
    term: clean(item.term, 80),
    termEs: clean(item.termEs, 80),
    definition: clean(item.definition, 280),
    definitionEs: clean(item.definitionEs, 280),
    visual: clean(item.visual, 280),
  }));
}

function buildLesson(lessonId) {
  const config = JSON.parse(readFileSync(join(LESSONS, lessonId, "config.json"), "utf8"));
  const discussions = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  const sentenceFrames = [];
  const wordBank = [];
  const extensionPrompts = [];

  if (config.explore?.discourse?.sentenceFrame) {
    sentenceFrames.push(config.explore.discourse.sentenceFrame);
  }
  for (const discussion of discussions) {
    for (const stem of discussion.stems || []) {
      sentenceFrames.push(stem.en);
      if (stem.es) sentenceFrames.push(stem.es);
    }
    wordBank.push(...(discussion.wordBank || []));
    if (discussion.extend) extensionPrompts.push(discussion.extend);
  }

  const workedExample = unique(config.launch?.conceptIntro?.iDo?.lines || [], 8);
  const vocabulary = buildVocabulary(config);
  wordBank.push(...vocabulary.map((item) => item.term));

  return {
    lessonId,
    title: clean(config.title, 140),
    standard: clean(config.standard, 40),
    contentObjective: clean(config.contentObjective, 300),
    languageObjective: clean(config.languageObjective, 300),
    vocabulary,
    workedExample,
    sentenceFrames: unique(sentenceFrames, 18),
    wordBank: unique(wordBank, 24),
    extensionPrompts: unique(extensionPrompts, 4),
    readinessHref: `/lessons/${lessonId}/readiness/`,
    profiles: [...PROFILES],
  };
}

const lessons = canonicalIds().map(buildLesson);
const manifest = {
  schemaVersion: 1,
  generatedFrom: "canonical Reveal Math lesson configs",
  lessons,
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${lessons.length} Learning Supports manifest entries`);
