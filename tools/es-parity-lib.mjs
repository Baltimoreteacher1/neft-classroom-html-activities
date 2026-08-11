// es-parity-lib.mjs — shared vocabulary for the small-group Spanish parity work.
//
// WHY A TRANSLATION MEMORY AND NOT DIRECT EDITS
//
// The 204 small-group lessons are generator output. Translations written
// straight into `lessons/*/config.json` would be one regenerator run away from
// gone, and the same English stem appears in up to three variants (group1,
// group2, catch-up), so editing configs directly means translating the same
// sentence three times and drifting between the copies.
//
// So Spanish lives in `data/es-translations/*.json` keyed by the EXACT English
// string, and `tools/apply-es-translations.mjs` projects it onto every item that
// carries that string. Re-running after a regeneration restores parity in one
// command, and one English sentence has exactly one Spanish sentence site-wide.

import { readFileSync, readdirSync } from "node:fs";
import { translateChoice } from "./lib/es-unit-lexicon.mjs";
import { join } from "node:path";

export const LESSONS_DIR = "lessons";
export const TRANSLATIONS_DIR = "data/es-translations";

/** Small-group and catch-up variants — the fleet this parity work covers. */
export const SMALL_GROUP_RE = /^(\d{1,2})-(\d{1,2})-(group1|group2|catchup)$/;

export const TIERS = ["approaching", "onLevel", "extending", "optional"];

/** A choice with no letters ("$12.75", "1,250") reads identically in Spanish;
 *  translating it would only invite a typo. Everything else needs authoring. */
export const isNumericOnly = (text) => !/[a-zA-Z]/.test(String(text ?? ""));

export function smallGroupLessons() {
  return readdirSync(LESSONS_DIR)
    .filter((name) => SMALL_GROUP_RE.test(name))
    .sort();
}

export function readConfig(lesson) {
  return JSON.parse(readFileSync(join(LESSONS_DIR, lesson, "config.json"), "utf8"));
}

/** Every practice item in a config, flattened across tiers. */
export function practiceItems(config) {
  const practice = config.practice || {};
  return TIERS.flatMap((tier) => practice[tier] || []).filter(
    (item) => item && typeof item === "object",
  );
}

const blank = (value) => !String(value ?? "").trim();

/**
 * The English strings an item still needs Spanish for, by field.
 * `choices` and `hints` are all-or-nothing: a half-filled parallel array would
 * render a Spanish stem above English options.
 */
export function missingStrings(item) {
  const out = { stem: [], choices: [], explanation: [], hints: [] };
  if (item.stem && blank(item.stemEs)) out.stem.push(item.stem);
  if (item.explanation && blank(item.explanationEs)) out.explanation.push(item.explanation);
  if (Array.isArray(item.choices) && !Array.isArray(item.choicesEs))
    out.choices.push(
      ...item.choices.filter((choice) => !isNumericOnly(choice) && !translateChoice(choice)),
    );
  if (Array.isArray(item.hints) && item.hints.length && !Array.isArray(item.hintsEs))
    out.hints.push(...item.hints);
  return out;
}

/** Merge every data/es-translations/*.json part into one English→Spanish map. */
export function loadTranslations(dir = TRANSLATIONS_DIR) {
  const map = new Map();
  let parts = [];
  try {
    parts = readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
  } catch {
    return map;
  }
  for (const part of parts) {
    const entries = JSON.parse(readFileSync(join(dir, part), "utf8"));
    for (const [english, spanish] of Object.entries(entries)) {
      if (!String(spanish ?? "").trim()) continue;
      map.set(english, spanish);
    }
  }
  return map;
}
