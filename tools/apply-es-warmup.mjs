#!/usr/bin/env node
// apply-es-warmup.mjs — project data/es-translations/warmup.json onto the
// WARM-UP of every lesson that carries a translated question.
//
//   node tools/apply-es-warmup.mjs [--dry-run] [--unit 2] [--refresh]
//
// Same architecture as tools/apply-es-concept-intro.mjs, and for the same
// reason: a warm-up question appears in up to FOUR configs (the core lesson and
// its group1 / group2 / catch-up variants, which are generator output), so
// translating in configs means writing one sentence four times and losing all
// of it on the next regeneration. Keyed by the exact English string, one
// question has one Spanish rendering site-wide.
//
// ALL-OR-NOTHING PER QUESTION, not per field. `choicesEs` is a parallel array
// that the renderer indexes positionally, and a question showing a Spanish stem
// above English choices above a Spanish explanation reads as a broken page
// rather than as support. A question that is only partly covered is reported
// and left entirely alone.
//
// ADDITIVE AND IDEMPOTENT. A question that already carries `stemEs` keeps it,
// so a hand-authored translation always outranks the memory. `--refresh`
// reverses that for a correction pass, so a fix made once in the memory reaches
// all four places the question appears.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadMemory } from "./apply-es-concept-intro.mjs";

const LESSONS_DIR = "lessons";

const DRY = process.argv.includes("--dry-run");
const REFRESH = process.argv.includes("--refresh");
const unitIx = process.argv.indexOf("--unit");
const ONLY_UNIT = unitIx !== -1 ? process.argv[unitIx + 1] : null;

const blank = (value) => !String(value ?? "").trim();

/**
 * A choice like "117", "$4.80", "2 1/2" or "x + 7" reads identically in both
 * languages, so it needs no memory entry — but `choicesEs` is a POSITIONAL
 * array, and omitting one shifts every later choice onto the wrong option.
 * These pass through unchanged, which `stackContent` renders as the English
 * alone (it returns one lane when the two agree).
 *
 * The test is a run of two or more letters: a bare variable ("x", "n") is
 * notation, while any real word ("units", "and", "vans") is language.
 *
 * SI SYMBOLS ARE THE ONE EXCEPTION, and the distinction is not cosmetic. An SI
 * symbol is defined to be the same in every language — "36 cm³" is written
 * exactly that way in Spanish — so requiring a translation for it would mean
 * storing 40 identity entries that say nothing. US customary abbreviations are
 * ENGLISH WORDS shortened, and they do change: "12 in" is "12 pulg", "3 ft" is
 * "3 pies". Those are NOT on this list, so they are reported as untranslated
 * rather than passed through — a missing translation is recoverable, a wrong
 * one reaches a student as fact.
 */
const NEUTRAL_TOKENS = new Set([
  // SI, identical in Spanish by definition.
  "mm",
  "cm",
  "dm",
  "km",
  "mL",
  "kL",
  "mg",
  "kg",
  // Digital storage: international symbols, unchanged in Spanish.
  "kB",
  "MB",
  "GB",
  "TB",
  // Bare algebraic products ("12ab") are notation, not words.
  "ab",
  "bh",
  "lw",
  "xy",
]);

export function languageNeutral(value) {
  const words = String(value ?? "").match(/[A-Za-z]{2,}/g);
  if (!words) return true;
  return words.every((word) => NEUTRAL_TOKENS.has(word));
}

/**
 * The Spanish for one warm-up question, or null when it is not fully covered.
 * @returns {{ stemEs: string, choicesEs: string[], explanationEs?: string } | null}
 */
export function questionTranslation(question, memory) {
  if (!question || blank(question.stem) || !Array.isArray(question.choices)) return null;
  const stemEs = memory.get(question.stem);
  if (!stemEs) return null;
  const choicesEs = [];
  for (const choice of question.choices) {
    const es = memory.get(String(choice)) || (languageNeutral(choice) ? String(choice) : null);
    if (!es) return null;
    choicesEs.push(es);
  }
  const out = { stemEs, choicesEs };
  if (!blank(question.explanation)) {
    const es = memory.get(question.explanation);
    if (!es && !languageNeutral(question.explanation)) return null;
    if (es) out.explanationEs = es;
  }
  return out;
}

/** How many of a question's strings the memory covers, for the partial report. */
export function coverage(question, memory) {
  const strings = [question?.stem, ...(question?.choices || []), question?.explanation].filter(
    (s) => !blank(s),
  );
  const covered = strings.filter((s) => memory.has(String(s)) || languageNeutral(s));
  return { have: covered.length, total: strings.length };
}

function lessonDirs() {
  return readdirSync(LESSONS_DIR)
    .filter((name) => {
      if (!existsSync(join(LESSONS_DIR, name, "config.json"))) return false;
      if (!statSync(join(LESSONS_DIR, name)).isDirectory()) return false;
      if (!ONLY_UNIT) return true;
      return new RegExp(`^${ONLY_UNIT}-\\d+(?:-(?:group1|group2|catchup))?$`).test(name);
    })
    .sort();
}

function main() {
  const memory = loadMemory();
  if (!memory.size) {
    console.error("No translations found in data/es-translations/");
    process.exit(1);
  }

  let written = 0;
  let filled = 0;
  const partial = [];

  for (const lesson of lessonDirs()) {
    const file = join(LESSONS_DIR, lesson, "config.json");
    const config = JSON.parse(readFileSync(file, "utf8"));
    const questions = config.warmup?.questions;
    if (!Array.isArray(questions) || !questions.length) continue;
    let changed = false;

    questions.forEach((question, index) => {
      const done =
        !blank(question.stemEs) &&
        Array.isArray(question.choicesEs) &&
        question.choicesEs.length === (question.choices || []).length;
      if (done && !REFRESH) return;
      const translated = questionTranslation(question, memory);
      if (!translated) {
        const { have, total } = coverage(question, memory);
        if (have) partial.push(`${lesson}.q${index + 1} (${have}/${total})`);
        return;
      }
      if (
        question.stemEs === translated.stemEs &&
        JSON.stringify(question.choicesEs) === JSON.stringify(translated.choicesEs) &&
        question.explanationEs === translated.explanationEs
      ) {
        return;
      }
      question.stemEs = translated.stemEs;
      question.choicesEs = translated.choicesEs;
      if (translated.explanationEs) question.explanationEs = translated.explanationEs;
      changed = true;
      filled += 1;
    });

    if (!changed) continue;
    if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    written += 1;
  }

  console.log(
    `${DRY ? "[dry-run] " : ""}warm-up Spanish: ${filled} question(s) filled across ${written} lesson(s).`,
  );
  if (partial.length) {
    console.log(
      `\n${partial.length} question(s) are PARTLY covered and were left alone — finish the missing strings or the question stays English:`,
    );
    for (const item of partial.slice(0, 40)) console.log(`  ${item}`);
    if (partial.length > 40) console.log(`  … and ${partial.length - 40} more`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
