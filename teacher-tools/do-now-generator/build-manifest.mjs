#!/usr/bin/env node
/**
 * build-manifest.mjs — Neft Teacher Do Now / Warm-up Generator
 *
 * Reads lessons/<id>/config.json (READ ONLY) and emits lessons-manifest.json
 * in this directory. The manifest is the data source for INPUT MODE A
 * (pick-a-lesson dropdown). Re-run whenever lesson configs change:
 *
 *   node teacher-tools/do-now-generator/build-manifest.mjs
 *
 * Each manifest entry: { id, title, standard, unit, lesson, questions:[...] }
 * Questions are warmup-style review items derived from practice
 * (onLevel/approaching multiple-choice) plus vocabulary, so a teacher can
 * seed a Do Now with 3-5 quick review questions for any lesson.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const LESSONS_DIR = join(REPO_ROOT, "lessons");
const OUT = join(HERE, "lessons-manifest.json");

const MAX_QUESTIONS = 5;

function naturalLessonSort(a, b) {
  const pa = a.id.split("-").map((n) => parseInt(n, 10));
  const pb = b.id.split("-").map((n) => parseInt(n, 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return a.id.localeCompare(b.id);
}

/** Pull a clean MC question from a practice item, or null if unusable. */
function mcQuestion(item) {
  if (!item || item.type !== "multiple-choice") return null;
  const stem = String(item.stem || "").trim();
  const choices = Array.isArray(item.choices)
    ? item.choices.map((c) => String(c).trim()).filter(Boolean)
    : [];
  if (!stem || choices.length < 2) return null;
  const ci =
    Number.isInteger(item.correctIndex) &&
    item.correctIndex >= 0 &&
    item.correctIndex < choices.length
      ? item.correctIndex
      : 0;
  return {
    type: "multiple-choice",
    prompt: stem,
    choices,
    correctIndex: ci,
  };
}

/** Build a short-answer review question from a vocabulary entry. */
function vocabQuestion(v) {
  const term = String(v?.term || "").trim();
  if (!term) return null;
  // Prefer a cloze prompt if present; otherwise ask for the definition.
  const cloze = String(v?.cloze || "").trim();
  if (cloze) {
    return {
      type: "short-answer",
      prompt: `Fill in the blank: ${cloze}`,
      answer: term,
    };
  }
  const def = String(v?.definition || "").trim();
  return {
    type: "short-answer",
    prompt: `In your own words, what does "${term}" mean?`,
    answer: def || "",
  };
}

function buildQuestions(config) {
  const out = [];
  const practice = config.practice && typeof config.practice === "object" ? config.practice : {};
  // Prefer onLevel then approaching MC items (warmup = accessible review).
  const mcPool = []
    .concat(Array.isArray(practice.onLevel) ? practice.onLevel : [])
    .concat(Array.isArray(practice.approaching) ? practice.approaching : []);
  for (const item of mcPool) {
    const q = mcQuestion(item);
    if (q) out.push(q);
    if (out.length >= 3) break; // leave room for a vocab item or two
  }
  // Add 1-2 vocabulary recall questions for a balanced warmup.
  const vocab = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  for (const v of vocab) {
    if (out.length >= MAX_QUESTIONS) break;
    const q = vocabQuestion(v);
    if (q) out.push(q);
  }
  // If still short on MC (rare), backfill from any remaining MC items.
  if (out.length < 3) {
    for (const item of mcPool) {
      if (out.length >= MAX_QUESTIONS) break;
      const q = mcQuestion(item);
      if (q && !out.some((e) => e.prompt === q.prompt)) out.push(q);
    }
  }
  return out.slice(0, MAX_QUESTIONS);
}

function main() {
  if (!existsSync(LESSONS_DIR)) {
    console.error(`lessons dir not found: ${LESSONS_DIR}`);
    process.exit(1);
  }
  const entries = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);

  const lessons = [];
  for (const name of entries) {
    const cfgPath = join(LESSONS_DIR, name, "config.json");
    if (!existsSync(cfgPath)) continue;
    let config;
    try {
      config = JSON.parse(readFileSync(cfgPath, "utf8"));
    } catch (err) {
      console.warn(`skip ${name}: bad JSON (${err.message})`);
      continue;
    }
    const id = String(config.lessonId || name);
    const questions = buildQuestions(config);
    lessons.push({
      id,
      title: String(config.title || id),
      standard: String(config.standard || ""),
      unit: Number.isFinite(config.unit) ? config.unit : null,
      lesson: Number.isFinite(config.lesson) ? config.lesson : null,
      questions,
    });
  }

  lessons.sort(naturalLessonSort);

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "lessons/*/config.json",
    count: lessons.length,
    lessons,
  };
  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT} (${lessons.length} lessons)`);
}

main();
