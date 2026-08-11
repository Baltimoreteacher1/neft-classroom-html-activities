#!/usr/bin/env node
// validate-es-parity.mjs — every small-group practice item must speak Spanish.
//
// WHY THIS IS A GATE AND NOT A REPORT
//
// These lessons are the support and challenge groups for a class with many
// multilingual learners, and the Spanish fields are not decoration: the renderer
// shows stemEs / choicesEs / explanationEs / hintsEs beside the English, so a
// missing one silently drops a student back into English-only text at exactly
// the moment they needed the scaffold. Before this gate existed, 707 items had
// no Spanish at all and nothing in the build could see it.
//
// Three failure modes are checked:
//
//   1. MISSING — an English field with no Spanish counterpart.
//   2. RAGGED PARALLEL ARRAY — choicesEs/hintsEs of a different length than the
//      English array. The renderer indexes them positionally, so a short array
//      pairs a Spanish hint with the wrong English one.
//   3. UNTRANSLATED COPY — a prose Spanish string byte-identical to its English.
//      Short formulaic strings ("4 × 4.", "0, 25, 50, 75, 100.") are identical
//      by design and exempt; only strings with real sentences are checked.
//
// Repair: node tools/extract-es-gap.mjs → author into data/es-translations/ →
// node tools/apply-es-translations.mjs

import { missingStrings, practiceItems, readConfig, smallGroupLessons } from "./es-parity-lib.mjs";

/** Words of two or more letters — the signal that a string is prose, not math. */
const proseWords = (text) => String(text ?? "").match(/[A-Za-z]{2,}/g) || [];
const isProse = (text) => proseWords(text).length >= 4;

const failures = [];
const note = (lesson, detail) => failures.push(`${lesson}: ${detail}`);

/** Both families of check for one item. Exported shape kept simple for the self-test. */
export function checkItem(item, label) {
  const problems = [];
  const missing = missingStrings(item);
  for (const field of ["stem", "explanation", "choices", "hints"])
    if (missing[field].length) problems.push(`${label} missing ${field}Es`);

  for (const [english, spanish, field] of [
    [item.choices, item.choicesEs, "choices"],
    [item.hints, item.hintsEs, "hints"],
  ]) {
    if (!Array.isArray(english) || !Array.isArray(spanish)) continue;
    if (english.length !== spanish.length)
      problems.push(
        `${label} ${field}Es has ${spanish.length} entries for ${english.length} ${field}`,
      );
  }

  for (const [english, spanish, field] of [
    [item.stem, item.stemEs, "stem"],
    [item.explanation, item.explanationEs, "explanation"],
  ]) {
    if (!english || !spanish) continue;
    if (isProse(english) && english.trim() === String(spanish).trim())
      problems.push(`${label} ${field}Es is a verbatim copy of the English`);
  }
  return problems;
}

function selfTest() {
  const clean = {
    stem: "A booth charges $4.50 for 9 games. What is the unit rate?",
    stemEs: "Un puesto cobra $4.50 por 9 juegos. ¿Cuál es la tasa por unidad?",
    choices: ["$0.50", "$0.45"],
    choicesEs: ["$0.50", "$0.45"],
    hints: ["Divide."],
    hintsEs: ["Divide."],
  };
  const cases = [
    [clean, 0],
    [{ ...clean, stemEs: "" }, 1],
    [{ ...clean, choicesEs: ["$0.50"] }, 1],
    [{ ...clean, stemEs: clean.stem }, 1],
    // Short formulaic text that is identical in both languages must NOT fail.
    [{ stem: "4 × 4.", stemEs: "4 × 4." }, 0],
  ];
  cases.forEach(([item, expected], index) => {
    const found = checkItem(item, "selftest").length;
    if (found !== expected)
      throw new Error(`selftest case ${index}: expected ${expected} problem(s), got ${found}`);
  });
}

selfTest();

let items = 0;
for (const lesson of smallGroupLessons()) {
  practiceItems(readConfig(lesson)).forEach((item, index) => {
    items++;
    for (const problem of checkItem(item, `practice[${index}]`)) note(lesson, problem);
  });
}

if (failures.length) {
  console.error(`Spanish parity: ${failures.length} problem(s) across ${items} items`);
  for (const failure of failures.slice(0, 40)) console.error(`  ${failure}`);
  if (failures.length > 40) console.error(`  …and ${failures.length - 40} more`);
  console.error("\nRepair: node tools/extract-es-gap.mjs → author into data/es-translations/ →");
  console.error("        node tools/apply-es-translations.mjs");
  process.exit(1);
}
console.log(`✓ Spanish parity: ${items} small-group practice items complete in both languages`);
