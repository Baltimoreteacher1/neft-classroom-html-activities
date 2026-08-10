#!/usr/bin/env node
/* =============================================================================
 * generate-learning-supports-manifest.mjs — build a student-safe, validated
 * manifest from canonical lesson configurations.
 * ========================================================================== */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");
const OUT_DIR = join(ROOT, "assets", "learning-supports");
const OUT_PATH = join(OUT_DIR, "manifest.json");

const PROFILE_KEYS = [
  "read-understand",
  "focus-organize",
  "build-math",
  "express-thinking",
  "language-support",
  "challenge-extend",
];

// Clean whitespace and strip HTML tags
function cleanText(str, maxLength = 1000) {
  if (typeof str !== "string") return "";
  let cleaned = str
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

function processLesson(lessonId) {
  const configPath = join(LESSONS_DIR, lessonId, "config.json");
  if (!existsSync(configPath)) {
    throw new Error(`Missing config.json for lesson ${lessonId}`);
  }

  const rawConfig = JSON.parse(readFileSync(configPath, "utf8"));

  // 1. Objectives
  const title = cleanText(rawConfig.title);
  const standard = cleanText(rawConfig.standard);
  const contentObjective = cleanText(rawConfig.contentObjective);
  const languageObjective = cleanText(rawConfig.languageObjective);

  // 2. Vocabulary (student-safe, sanitized)
  const vocabulary = (rawConfig.vocabulary || [])
    .map((v) => ({
      term: cleanText(v.term),
      termEs: cleanText(v.termEs),
      definition: cleanText(v.definition),
      definitionEs: cleanText(v.definitionEs),
      visual: cleanText(v.visual),
    }))
    .filter((v) => v.term && v.definition);

  // 3. Worked Example (from launch.conceptIntro.iDo.lines)
  let workedExample = "";
  if (rawConfig.launch?.conceptIntro?.iDo?.lines) {
    workedExample = rawConfig.launch.conceptIntro.iDo.lines
      .map((line) => cleanText(line))
      .filter(Boolean)
      .join("\n");
  }

  // 4. Sentence Frames (from explore.discourse.sentenceFrame and turnAndTalk[*].stems)
  const sentenceFramesSet = new Set();
  if (rawConfig.explore?.discourse?.sentenceFrame) {
    const frame = cleanText(rawConfig.explore.discourse.sentenceFrame);
    if (frame) sentenceFramesSet.add(frame);
  }
  if (Array.isArray(rawConfig.turnAndTalk)) {
    for (const tt of rawConfig.turnAndTalk) {
      if (Array.isArray(tt.stems)) {
        for (const stem of tt.stems) {
          if (stem.en) {
            const enFrame = cleanText(stem.en);
            if (enFrame) sentenceFramesSet.add(enFrame);
          }
          if (stem.es) {
            const esFrame = cleanText(stem.es);
            if (esFrame) sentenceFramesSet.add(esFrame);
          }
        }
      }
    }
  }
  const sentenceFrames = Array.from(sentenceFramesSet);

  // 5. Word Bank (from turnAndTalk[*].wordBank)
  const wordBankSet = new Set();
  if (Array.isArray(rawConfig.turnAndTalk)) {
    for (const tt of rawConfig.turnAndTalk) {
      if (Array.isArray(tt.wordBank)) {
        for (const word of tt.wordBank) {
          const cleanedWord = cleanText(word);
          if (cleanedWord) wordBankSet.add(cleanedWord.toLowerCase());
        }
      }
    }
  }
  // Let's also include vocabulary terms in the word bank (lowercased)
  vocabulary.forEach((v) => {
    wordBankSet.add(v.term.toLowerCase());
    if (v.termEs) wordBankSet.add(v.termEs.toLowerCase());
  });
  const wordBank = Array.from(wordBankSet).sort();

  // 6. Readiness Href
  const readinessHref = `/lessons/${lessonId}/readiness/`;

  // 7. Profiles
  const profiles = {};
  for (const key of PROFILE_KEYS) {
    profiles[key] = true; // All profiles are supported/active by default
  }

  return {
    lessonId,
    title,
    standard,
    contentObjective,
    languageObjective,
    vocabulary,
    workedExample,
    sentenceFrames,
    wordBank,
    readinessHref,
    profiles,
  };
}

function main() {
  console.log("Generating learning supports manifest...");

  const canonicalLessonIds = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+-\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au !== bu ? au - bu : al - bl;
    });

  if (canonicalLessonIds.length !== 82) {
    console.error(`Error: Expected 82 canonical lessons, found ${canonicalLessonIds.length}`);
    process.exit(1);
  }

  const manifest = {};
  for (const lessonId of canonicalLessonIds) {
    manifest[lessonId] = processLesson(lessonId);
  }

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Generated manifest at ${OUT_PATH} containing 64 lessons.`);
}

main();
