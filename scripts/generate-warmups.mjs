#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(process.cwd());
const BANK_PATH = join(ROOT, "spiral-review", "bank.json");
const LESSONS_DIR = join(ROOT, "lessons");

const bank = JSON.parse(readFileSync(BANK_PATH, "utf8"));
const questions = bank.questions;

// Index questions by lessonId
const questionsByLesson = {};
for (const q of questions) {
  if (!q.lessonId) continue;
  if (!questionsByLesson[q.lessonId]) {
    questionsByLesson[q.lessonId] = [];
  }
  questionsByLesson[q.lessonId].push(q);
}

// Ordered list of base lessons across 10 units
const ALL_LESSON_IDS = [
  "1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "1-7",
  "2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "2-7",
  "3-1", "3-2", "3-3", "3-4", "3-5", "3-6",
  "4-1", "4-2", "4-3", "4-4", "4-5", "4-6", "4-7", "4-8", "4-9",
  "5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "5-7",
  "6-1", "6-2", "6-3", "6-4", "6-5", "6-6",
  "7-1", "7-2", "7-3", "7-4", "7-5", "7-6", "7-7", "7-8",
  "8-1", "8-2", "8-3", "8-4", "8-5", "8-6", "8-7",
  "9-1", "9-2", "9-3", "9-4", "9-5", "9-6",
  "10-1", "10-2", "10-3", "10-4", "10-5"
];

function getPrevLessonId(baseId) {
  const idx = ALL_LESSON_IDS.indexOf(baseId);
  if (idx > 0) {
    return ALL_LESSON_IDS[idx - 1];
  }
  return baseId; // Fallback to current lesson if 1-1
}

function getBaseLessonId(folderName) {
  // e.g. "1-2-group1" -> "1-2", "10-1-flagship" -> "10-1"
  const m = folderName.match(/^(\d+-\d+)/);
  return m ? m[1] : folderName;
}

function pickWarmupQuestions(prevLessonId, currentLessonId) {
  const pool = questionsByLesson[prevLessonId] || questionsByLesson[currentLessonId] || questions;
  
  // Filter for approaching / on-level questions (easy but not too easy)
  let candidates = pool.filter(q => q.tier === "approaching" || q.tier === "on-level");
  if (candidates.length < 3) {
    candidates = pool;
  }

  // Pick 3-4 questions deterministically based on currentLessonId
  let seed = 0;
  for (let i = 0; i < currentLessonId.length; i++) {
    seed += currentLessonId.charCodeAt(i);
  }

  const picked = [];
  const cloned = [...candidates];
  
  const count = (seed % 2 === 0) ? 3 : 4;

  while (picked.length < count && cloned.length > 0) {
    const idx = (seed + picked.length * 7) % cloned.length;
    const q = cloned.splice(idx, 1)[0];
    picked.push({
      id: `warmup-${currentLessonId}-${picked.length + 1}`,
      stem: q.stem,
      choices: q.choices,
      correctIndex: q.correctIndex,
      explanation: q.explanation || "Review previous lesson concept."
    });
  }

  return picked;
}

let countUpdated = 0;

for (const dirName of readdirSync(LESSONS_DIR)) {
  const configPath = join(LESSONS_DIR, dirName, "config.json");
  if (!existsSync(configPath)) continue;

  try {
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    const baseId = getBaseLessonId(dirName);
    const prevId = getPrevLessonId(baseId);
    
    // Find prev lesson title from config if possible
    let prevTitle = `Lesson ${prevId}`;
    const prevConfigPath = join(LESSONS_DIR, prevId, "config.json");
    if (existsSync(prevConfigPath)) {
      const prevCfg = JSON.parse(readFileSync(prevConfigPath, "utf8"));
      if (prevCfg.title) prevTitle = prevCfg.title;
    }

    const warmupQuestions = pickWarmupQuestions(prevId, baseId);

    cfg.warmup = {
      title: "Warmup: Previous Lesson Check",
      prevLessonId: prevId,
      prevLessonTitle: prevTitle,
      questions: warmupQuestions
    };

    writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");
    countUpdated++;
  } catch (err) {
    console.error(`Error updating ${configPath}:`, err.message);
  }
}

console.log(`Successfully generated and injected 3-4 autograded Warmup questions into ${countUpdated} lesson configs!`);
