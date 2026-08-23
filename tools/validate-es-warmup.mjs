#!/usr/bin/env node
/**
 * validate-es-warmup.mjs — the warm-up's Spanish holds together.
 *
 * The warm-up is the first thing a student does in every lesson, and it is the
 * one surface where a translation defect is worse than no translation at all,
 * because `choicesEs` is POSITIONAL. The renderer pairs choice i with
 * choicesEs[i]. Drop one entry and every later choice is labelled with the
 * previous option's Spanish — a student in Spanish mode reads "20 camionetas,
 * sobran 10" next to the radio button for "21 vans, 2 left over" and is marked
 * wrong for picking exactly what they read. A missing translation costs a
 * student English they can still work through; a shifted one costs them the
 * question.
 *
 * So the rule is ALL-OR-NOTHING PER QUESTION: a question either has a Spanish
 * stem, a complete parallel `choicesEs`, and (when it has an explanation) an
 * `explanationEs`, or it has none of them. Mixed state fails here.
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping, because
 * a detector that has stopped firing reports a perfectly translated warm-up.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { languageNeutral } from "./apply-es-warmup.mjs";

const LESSONS = "lessons";
const problems = [];
const blank = (value) => !String(value ?? "").trim();

/* ── detector ────────────────────────────────────────────────────────────── */

/**
 * Spanish opens a question with `¿`, and leaving it off is not a typo a reader
 * skims past — the opening mark is what tells them the sentence is a question
 * before they reach the end of it, which is the whole reason the language has
 * one. Four shipped this way ("12 es el 25% de qué número?"), all from
 * translating an English sentence left to right and punctuating at the end.
 *
 * Exempt: a line that ENDS in a bare arithmetic prompt ("7 × (60 + 2) = ?",
 * "625 ÷ 60 ≈ ?"), which is notation rather than a sentence and takes no
 * opening mark in either language.
 */
export function missingOpeningMark(value) {
  const text = String(value ?? "").trim();
  if (!text.endsWith("?")) return false;
  if (/[=≈≤≥<>+\-−×÷]\s*\?$/.test(text)) return false;
  return !text.includes("¿");
}

/** Everything that can be wrong with one question's Spanish. */
export function questionProblems(id, index, question) {
  const out = [];
  const where = `${id}.q${index + 1}`;
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const hasStem = !blank(question.stemEs);
  const hasChoices = Array.isArray(question.choicesEs);
  const hasExplanation = !blank(question.explanationEs);

  // Untranslated is a legitimate state — but only if NOTHING is translated.
  if (!hasStem && !hasChoices && !hasExplanation) return out;

  if (!hasStem) out.push(`${where}: has Spanish choices or explanation but no stemEs`);
  if (!hasChoices) {
    out.push(`${where}: has a Spanish stem but no choicesEs — the options stay English`);
  } else if (question.choicesEs.length !== choices.length) {
    out.push(
      `${where}: choicesEs has ${question.choicesEs.length} entries for ${choices.length} choices — ` +
        "the array is positional, so every later option is labelled with the wrong Spanish",
    );
  } else {
    question.choicesEs.forEach((choice, i) => {
      if (blank(choice)) out.push(`${where}: choicesEs[${i}] is blank`);
      else if (choice === choices[i] && !languageNeutral(choices[i])) {
        out.push(`${where}: choicesEs[${i}] is identical to the English "${choices[i]}"`);
      }
    });
  }

  if (!blank(question.explanation) && !hasExplanation && !languageNeutral(question.explanation)) {
    out.push(
      `${where}: translated question with no explanationEs — the feedback on a miss is English`,
    );
  }
  if (hasExplanation && question.explanationEs === question.explanation) {
    out.push(`${where}: explanationEs is identical to the English`);
  }
  if (hasStem && question.stemEs === question.stem) {
    out.push(`${where}: stemEs is identical to the English`);
  }
  if (hasStem && missingOpeningMark(question.stemEs)) {
    out.push(`${where}: stemEs is a question with no opening "¿"`);
  }
  (hasChoices ? question.choicesEs : []).forEach((choice, i) => {
    if (missingOpeningMark(choice)) {
      out.push(`${where}: choicesEs[${i}] is a question with no opening "¿"`);
    }
  });
  return out;
}

/* ── self-test: the detectors must fire ──────────────────────────────────── */

const base = { stem: "What is 6 x 4?", choices: ["24", "20", "10 vans", "18"] };
const selftests = [
  [
    "a short choicesEs is caught",
    () =>
      questionProblems("x", 0, { ...base, stemEs: "es", choicesEs: ["24", "20", "10 camionetas"] })
        .length === 1,
  ],
  [
    "a Spanish stem with no choicesEs is caught",
    () => questionProblems("x", 0, { ...base, stemEs: "es" }).length === 1,
  ],
  [
    "Spanish choices with no stem are caught",
    () =>
      questionProblems("x", 0, { ...base, choicesEs: ["24", "20", "10 camionetas", "18"] })
        .length === 1,
  ],
  [
    "a blank choice translation is caught",
    () =>
      questionProblems("x", 0, { ...base, stemEs: "es", choicesEs: ["24", "20", "  ", "18"] })
        .length === 1,
  ],
  [
    "a choice left in English is caught",
    () =>
      questionProblems("x", 0, { ...base, stemEs: "es", choicesEs: ["24", "20", "10 vans", "18"] })
        .length === 1,
  ],
  [
    "a language-neutral choice repeated verbatim is NOT an error",
    () =>
      questionProblems("x", 0, {
        ...base,
        stemEs: "es",
        choicesEs: ["24", "20", "10 camionetas", "18"],
      }).length === 0,
  ],
  [
    "a missing explanationEs on a translated question is caught",
    () =>
      questionProblems("x", 0, {
        ...base,
        explanation: "Six groups of four.",
        stemEs: "es",
        choicesEs: ["24", "20", "10 camionetas", "18"],
      }).length === 1,
  ],
  [
    "a Spanish question with no opening mark is caught",
    () =>
      questionProblems("x", 0, {
        ...base,
        stemEs: "Cuanto es 6 x 4?",
        choicesEs: ["24", "20", "10 camionetas", "18"],
      }).length === 1,
  ],
  [
    "a bare arithmetic prompt needs no opening mark",
    () => missingOpeningMark("7 × (60 + 2) = ?") === false,
  ],
  ["a properly opened question passes", () => missingOpeningMark("¿Cuánto es 6 × 4?") === false],
  [
    "an untranslated question is not an error",
    () => questionProblems("x", 0, { ...base, explanation: "Six groups of four." }).length === 0,
  ],
];

for (const [name, run] of selftests) {
  let ok = false;
  try {
    ok = run();
  } catch (error) {
    console.error(`self-test threw: ${name} — ${error.message}`);
  }
  if (!ok) {
    console.error(`FAIL validate:es-warmup — self-test did not fire: ${name}`);
    process.exit(1);
  }
}

/* ── sweep ───────────────────────────────────────────────────────────────── */

let lessons = 0;
let questions = 0;
let translated = 0;

for (const dir of readdirSync(LESSONS).sort()) {
  const file = join(LESSONS, dir, "config.json");
  if (!existsSync(file)) continue;
  const config = JSON.parse(readFileSync(file, "utf8"));
  const list = config.warmup?.questions;
  if (!Array.isArray(list) || !list.length) continue;
  lessons += 1;
  list.forEach((question, index) => {
    questions += 1;
    if (!blank(question.stemEs)) translated += 1;
    for (const message of questionProblems(dir, index, question)) problems.push(message);
  });
}

if (!questions) {
  console.error("FAIL validate:es-warmup — swept 0 warm-up questions, which verifies nothing");
  process.exit(1);
}

if (problems.length) {
  console.error(`\nFAIL validate:es-warmup — ${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

const percent = Math.round((translated / questions) * 100);
console.log(
  `PASS validate:es-warmup — ${translated}/${questions} warm-up questions bilingual (${percent}%) ` +
    `across ${lessons} lessons; no shifted choice arrays, no mixed-language questions; ` +
    `${selftests.length} self-tests green.`,
);
