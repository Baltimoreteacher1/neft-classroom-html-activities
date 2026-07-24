#!/usr/bin/env node
/**
 * Neft Teacher — Spiral Review / MCAP Prep bank builder
 * --------------------------------------------------------------------------
 * READ-ONLY over ../lessons/<id>/config.json. Emits ./bank.json: a pool of
 * cumulative review questions pulled from each lesson's practice
 * (approaching / onLevel / extending / optional) plus a few vocab checks.
 *
 * Every emitted question uses an engine-supported shape:
 *   multiple-choice: { type, stem, choices[], correctIndex, explanation }
 *
 * Each item is tagged: { id, unit, lessonId, standard, lessonTitle, type,
 *                        tier, source } so the activity can mix + spiral.
 *
 * Usage:  node spiral-review/build-bank.mjs
 * Output: spiral-review/bank.json
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LESSONS_DIR = join(__dirname, "..", "lessons");
const OUT_FILE = join(__dirname, "bank.json");

const PRACTICE_TIERS = ["approaching", "onLevel", "extending", "optional"];
// Max vocab-check questions generated per lesson (keeps the pool balanced).
const MAX_VOCAB_PER_LESSON = 2;

/* ── helpers ─────────────────────────────────────────────────────────── */

function listLessonDirs() {
  return readdirSync(LESSONS_DIR)
    .filter((name) => {
      if (name.startsWith("_") || name.startsWith(".")) return false;
      const full = join(LESSONS_DIR, name);
      try {
        return statSync(full).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function readConfig(lessonDir) {
  const file = join(LESSONS_DIR, lessonDir, "config.json");
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function isValidMultipleChoice(q) {
  return (
    q &&
    q.type === "multiple-choice" &&
    typeof q.stem === "string" &&
    q.stem.trim().length > 0 &&
    Array.isArray(q.choices) &&
    q.choices.length >= 2 &&
    q.choices.every((c) => typeof c === "string") &&
    Number.isInteger(q.correctIndex) &&
    q.correctIndex >= 0 &&
    q.correctIndex < q.choices.length
  );
}

// Stable, readable id so optional gradebook writes + de-dupe stay consistent.
function makeId(lessonId, tier, n) {
  return `${lessonId}::${tier}::${n}`;
}

/* ── deterministic answer-position shuffle ───────────────────────────── */
// Lesson-config practice always lists the correct answer first, so a raw copy
// makes the correct answer choice #1 in almost every warm-up item. Shuffle the
// choices with a seeded PRNG (seeded by the item id) so the correct answer is
// distributed across positions — deterministic, so rebuilds stay stable.
function seedFromString(str) {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns { choices, correctIndex } with choices reordered (seeded Fisher-Yates)
// and correctIndex tracked to the correct choice's new position.
function shuffleChoices(choices, correctIndex, seed) {
  const rng = mulberry32(seedFromString(seed));
  const order = choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return {
    choices: order.map((i) => choices[i]),
    correctIndex: order.indexOf(correctIndex),
  };
}

/* ── vocab-check generation (vocab -> multiple-choice) ───────────────── */

// From an "examples" list ({ text, isExample, why }) build a "which is X"
// multiple-choice item: one correct example vs. distractor non-examples.
function vocabFromExamples(term, examples) {
  const yes = examples.filter((e) => e && e.isExample && e.text);
  const no = examples.filter((e) => e && e.isExample === false && e.text);
  if (yes.length < 1 || no.length < 1) return null;

  const correct = yes[0];
  const distractors = no.slice(0, 3);
  const choices = [correct, ...distractors];
  // light deterministic shuffle by rotating so the answer is not always #1
  const rot = (term.length + choices.length) % choices.length;
  const rotated = choices.slice(rot).concat(choices.slice(0, rot));
  const correctIndex = rotated.findIndex((c) => c === correct);

  return {
    type: "multiple-choice",
    stem: `Which one is an example of "${term}"?`,
    choices: rotated.map((c) => String(c.text)),
    correctIndex,
    explanation: correct.why
      ? `${correct.text}: ${correct.why}`
      : `${correct.text} is an example of ${term}.`,
  };
}

// From a "sentences" list ({ text, correct }) build a "which statement is
// true" multiple-choice item.
function vocabFromSentences(term, sentences) {
  const yes = sentences.filter((s) => s && s.correct && s.text);
  const no = sentences.filter((s) => s && s.correct === false && s.text);
  if (yes.length < 1 || no.length < 1) return null;

  const correct = yes[0];
  const distractors = no.slice(0, 3);
  const choices = [correct, ...distractors];
  const rot = (term.length + 1) % choices.length;
  const rotated = choices.slice(rot).concat(choices.slice(0, rot));
  const correctIndex = rotated.findIndex((c) => c === correct);

  return {
    type: "multiple-choice",
    stem: `Which statement about "${term}" is true?`,
    choices: rotated.map((c) => String(c.text)),
    correctIndex,
    explanation: `Correct: ${correct.text}`,
  };
}

function buildVocabChecks(vocabulary) {
  const out = [];
  for (const v of vocabulary || []) {
    if (out.length >= MAX_VOCAB_PER_LESSON) break;
    const term = v && (v.term || v.word);
    if (!term) continue;
    let q = null;
    if (Array.isArray(v.examples)) q = vocabFromExamples(term, v.examples);
    if (!q && Array.isArray(v.sentences)) q = vocabFromSentences(term, v.sentences);
    if (q && isValidMultipleChoice(q)) out.push(q);
  }
  return out;
}

/* ── main build ──────────────────────────────────────────────────────── */

function build() {
  const dirs = listLessonDirs();
  const questions = [];
  const perUnit = {};
  const perStandard = {};
  let lessonsWithPractice = 0;
  const seenStems = new Set(); // de-dupe identical stems across tiers

  for (const dir of dirs) {
    const cfg = readConfig(dir);
    if (!cfg) continue;

    const lessonId = String(cfg.lessonId || dir);
    const unit = Number(cfg.unit) || Number(String(lessonId).split("-")[0]) || 0;
    const standard = String(cfg.standard || "").trim();
    const lessonTitle = String(cfg.title || lessonId);
    const practice = cfg.practice;

    let added = 0;

    // 1) Practice multiple-choice across all four tiers.
    if (practice && typeof practice === "object") {
      for (const tier of PRACTICE_TIERS) {
        const list = Array.isArray(practice[tier]) ? practice[tier] : [];
        let n = 0;
        for (const q of list) {
          if (!isValidMultipleChoice(q)) continue;
          const stemKey = `${lessonId}|${q.stem.trim().toLowerCase()}`;
          if (seenStems.has(stemKey)) continue;
          seenStems.add(stemKey);
          const id = makeId(lessonId, tier, n);
          const shuffled = shuffleChoices(q.choices.slice(), q.correctIndex, id);
          questions.push({
            id,
            unit,
            lessonId,
            standard,
            lessonTitle,
            tier,
            source: "practice",
            type: "multiple-choice",
            stem: q.stem,
            choices: shuffled.choices,
            correctIndex: shuffled.correctIndex,
            explanation: typeof q.explanation === "string" ? q.explanation : "",
          });
          n += 1;
          added += 1;
        }
      }
    }

    // 2) A few vocab checks per lesson.
    const vocabChecks = buildVocabChecks(cfg.vocabulary);
    vocabChecks.forEach((q, i) => {
      const stemKey = `${lessonId}|vocab|${q.stem.trim().toLowerCase()}`;
      if (seenStems.has(stemKey)) return;
      seenStems.add(stemKey);
      questions.push({
        id: makeId(lessonId, "vocab", i),
        unit,
        lessonId,
        standard,
        lessonTitle,
        tier: "vocab",
        source: "vocab",
        type: "multiple-choice",
        stem: q.stem,
        choices: q.choices,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      });
      added += 1;
    });

    if (added > 0) {
      lessonsWithPractice += 1;
      perUnit[unit] = (perUnit[unit] || 0) + added;
      if (standard) perStandard[standard] = (perStandard[standard] || 0) + added;
    }
  }

  // Units present, sorted ascending — the activity uses this for ranges.
  const units = Array.from(new Set(questions.map((q) => q.unit))).sort(
    (a, b) => a - b,
  );

  const bank = {
    meta: {
      generatedAt: new Date().toISOString(),
      generator: "spiral-review/build-bank.mjs",
      brand: "Neft Teacher",
      totalQuestions: questions.length,
      lessonsWithQuestions: lessonsWithPractice,
      units,
      countsByUnit: perUnit,
      countsByStandard: perStandard,
    },
    questions,
  };

  writeFileSync(OUT_FILE, JSON.stringify(bank, null, 2) + "\n", "utf8");

  // Console summary.
  console.log("Spiral Review bank built ->", OUT_FILE);
  console.log("Total questions:", questions.length);
  console.log("Lessons contributing:", lessonsWithPractice);
  console.log("Units:", units.join(", "));
  console.log("Counts by unit:");
  for (const u of units) console.log(`  Unit ${u}: ${perUnit[u]}`);
}

build();
