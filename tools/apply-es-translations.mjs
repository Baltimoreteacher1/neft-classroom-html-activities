#!/usr/bin/env node
// apply-es-translations.mjs — projects data/es-translations/*.json onto every
// small-group practice item, filling stemEs / choicesEs / explanationEs / hintsEs.
//
//   node tools/apply-es-translations.mjs [--dry-run]
//
// Idempotent and additive: an item that already has a Spanish field keeps it, so
// hand-authored translations in the configs always outrank the memory. Parallel
// arrays are all-or-nothing — `choicesEs` is written only when every non-numeric
// choice has a translation, because a half-Spanish option list is worse for a
// student than an all-English one.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  isNumericOnly,
  LESSONS_DIR,
  loadTranslations,
  practiceItems,
  smallGroupLessons,
} from "./es-parity-lib.mjs";
import { translateChoice } from "./lib/es-unit-lexicon.mjs";

const DRY = process.argv.includes("--dry-run");
const memory = loadTranslations();
const blank = (value) => !String(value ?? "").trim();

/** Spanish for a parallel array, or null when any element is missing one.
 *  Hand-authored memory always outranks the lexicon. */
function translateArray(values, { useLexicon = false } = {}) {
  const out = [];
  for (const value of values) {
    if (useLexicon && isNumericOnly(value)) {
      out.push(value);
      continue;
    }
    const spanish = memory.get(value) || (useLexicon ? translateChoice(value) : null);
    if (!spanish) return null;
    out.push(spanish);
  }
  return out;
}

let fieldsWritten = 0;
let filesChanged = 0;

for (const lesson of smallGroupLessons()) {
  const file = join(LESSONS_DIR, lesson, "config.json");
  const config = JSON.parse(readFileSync(file, "utf8"));
  let changed = 0;

  for (const item of practiceItems(config)) {
    if (item.stem && blank(item.stemEs) && memory.has(item.stem)) {
      item.stemEs = memory.get(item.stem);
      changed++;
    }
    if (item.explanation && blank(item.explanationEs) && memory.has(item.explanation)) {
      item.explanationEs = memory.get(item.explanation);
      changed++;
    }
    if (Array.isArray(item.choices) && !Array.isArray(item.choicesEs)) {
      const translated = translateArray(item.choices, { useLexicon: true });
      if (translated) {
        item.choicesEs = translated;
        changed++;
      }
    }
    if (Array.isArray(item.hints) && item.hints.length && !Array.isArray(item.hintsEs)) {
      const translated = translateArray(item.hints);
      if (translated) {
        item.hintsEs = translated;
        changed++;
      }
    }
  }

  if (!changed) continue;
  fieldsWritten += changed;
  filesChanged++;
  if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

console.log(
  `${DRY ? "[dry-run] " : ""}es parity: ${fieldsWritten} field(s) filled across ${filesChanged} config(s) from ${memory.size} memory entries`,
);
