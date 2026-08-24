#!/usr/bin/env node
// apply-es-notice-wonder.mjs — project data/es-translations/notice-wonder.json
// onto the NOTICE & WONDER card (`config.noticeAndWonder`) of every lesson.
//
//   node tools/apply-es-notice-wonder.mjs [--dry-run] [--unit 2] [--refresh]
//
// This is the first thing a student sees in a lesson: a picture, and two boxes
// asking what they notice and what they wonder. It is also where they WRITE —
// so an English-only starter chip is not a missing translation, it is a
// sentence a student has to translate before they can borrow it.
//
// The starter arrays are POSITIONAL and ALL-OR-NOTHING for the usual reason:
// the renderer pairs chip i with its translation i, and it refuses a mismatched
// array outright rather than pairing the wrong two.
//
// `imageAltEs` is deliberately included. Alt text is the picture for a student
// using a screen reader, and leaving it English while the caption above it is
// Spanish is the same defect as a half-translated stem.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadMemory } from "./apply-es-concept-intro.mjs";
import { languageNeutral } from "./apply-es-warmup.mjs";

const LESSONS_DIR = "lessons";
const DRY = process.argv.includes("--dry-run");
const REFRESH = process.argv.includes("--refresh");
const unitIx = process.argv.indexOf("--unit");
const ONLY_UNIT = unitIx !== -1 ? process.argv[unitIx + 1] : null;

const blank = (value) => !String(value ?? "").trim();

const TEXT_FIELDS = ["context", "imageAlt", "caption"];
const LIST_FIELDS = ["noticeStarters", "wonderStarters"];

/**
 * The Spanish for one Notice & Wonder block, or null when it is not fully
 * covered. All-or-nothing across the WHOLE card: a Spanish caption above
 * English starter chips reads as a broken page.
 */
export function noticeWonderTranslation(nw, memory) {
  if (!nw || typeof nw !== "object") return null;
  const out = {};
  let any = false;

  for (const field of TEXT_FIELDS) {
    if (blank(nw[field])) continue;
    const value = String(nw[field]);
    const es = memory.get(value) || (languageNeutral(value) ? value : null);
    if (!es) return null;
    if (es !== value) out[`${field}Es`] = es;
    any = true;
  }

  for (const field of LIST_FIELDS) {
    const list = nw[field];
    if (!Array.isArray(list) || !list.length) continue;
    const translated = [];
    for (const item of list) {
      if (blank(item)) {
        // Keep the slot so index i still means starter i after the renderer's
        // blank filter runs.
        translated.push("");
        continue;
      }
      const value = String(item);
      const es = memory.get(value) || (languageNeutral(value) ? value : null);
      if (!es) return null;
      translated.push(es);
    }
    out[`${field}Es`] = translated;
    any = true;
  }

  return any ? out : null;
}

/** How much of the card the memory covers, for the partial report. */
export function coverage(nw, memory) {
  const strings = [
    ...TEXT_FIELDS.map((f) => nw?.[f]),
    ...LIST_FIELDS.flatMap((f) => (Array.isArray(nw?.[f]) ? nw[f] : [])),
  ].filter((s) => !blank(s));
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
  const partial = [];

  for (const lesson of lessonDirs()) {
    const file = join(LESSONS_DIR, lesson, "config.json");
    const config = JSON.parse(readFileSync(file, "utf8"));
    const nw = config.noticeAndWonder;
    if (!nw || typeof nw !== "object") continue;

    const done = !blank(nw.contextEs) || Array.isArray(nw.noticeStartersEs);
    if (done && !REFRESH) continue;

    const translated = noticeWonderTranslation(nw, memory);
    if (!translated) {
      const { have, total } = coverage(nw, memory);
      if (have) partial.push(`${lesson} (${have}/${total})`);
      continue;
    }
    let changed = false;
    for (const [key, value] of Object.entries(translated)) {
      if (JSON.stringify(nw[key]) === JSON.stringify(value)) continue;
      nw[key] = value;
      changed = true;
    }
    if (!changed) continue;
    if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    written += 1;
  }

  console.log(`${DRY ? "[dry-run] " : ""}Notice & Wonder Spanish: ${written} lesson(s) filled.`);
  if (partial.length) {
    console.log(
      `\n${partial.length} card(s) are PARTLY covered and were left alone — finish the missing strings or the card stays English:`,
    );
    for (const item of partial.slice(0, 40)) console.log(`  ${item}`);
    if (partial.length > 40) console.log(`  … and ${partial.length - 40} more`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
