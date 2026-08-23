#!/usr/bin/env node
// apply-es-concept-intro.mjs — project data/es-translations/*.json onto the
// WORKED EXAMPLE (`launch.conceptIntro`) of every lesson that carries a
// translated line.
//
//   node tools/apply-es-concept-intro.mjs [--dry-run] [--unit 2]
//
// WHY A TRANSLATION MEMORY, NOT DIRECT EDITS — the same reasoning that already
// governs practice items (tools/es-parity-lib.mjs), and it is stronger here.
// One worked-example line appears in up to FOUR places: the core lesson and its
// group1 / group2 / catch-up variants, which are generator output. Translating
// in configs would mean writing the same sentence four times, drifting between
// the copies, and losing all of it on the next regeneration. Keyed by the exact
// English string, one sentence has one Spanish sentence site-wide, and a
// re-run after any regeneration restores parity in one command.
//
// ALL-OR-NOTHING per stage. `linesEs` is written only when EVERY line of that
// stage has a translation, because both renderers refuse a mismatched array —
// a walkthrough with one Spanish step between two English ones reads as a
// broken page rather than as support. A stage that is partly translated is
// reported, not half-written.
//
// ADDITIVE AND IDEMPOTENT. A stage that already has `linesEs` keeps it, so a
// hand-authored translation always outranks the memory.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LESSONS_DIR = "lessons";
const TRANSLATIONS_DIR = "data/es-translations";
const STAGES = ["iDo", "weDo", "youDo"];
const TEXT_FIELDS = ["heading", "intro", "keyIdea"];

const DRY = process.argv.includes("--dry-run");
const unitIx = process.argv.indexOf("--unit");
const ONLY_UNIT = unitIx !== -1 ? process.argv[unitIx + 1] : null;

/** The flat EN → ES memory, merged across every file in the directory. */
export function loadMemory(dir = TRANSLATIONS_DIR) {
  const memory = new Map();
  if (!existsSync(dir)) return memory;
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    let data;
    try {
      data = JSON.parse(readFileSync(join(dir, file), "utf8"));
    } catch (error) {
      throw new Error(`${file} is not valid JSON: ${error.message}`);
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) continue;
    for (const [en, es] of Object.entries(data)) {
      if (typeof es !== "string" || !es.trim()) continue;
      // First file wins, so a later bulk file cannot silently overwrite a
      // hand-corrected translation in an earlier one.
      if (!memory.has(en)) memory.set(en, es);
    }
  }
  return memory;
}

const blank = (value) => !String(value ?? "").trim();

/**
 * The Spanish for one stage, or null when it is not fully covered.
 * @returns {{ linesEs: string[] } | null}
 */
export function stageTranslation(stage, memory) {
  if (!stage || !Array.isArray(stage.lines) || !stage.lines.length) return null;
  const out = [];
  for (const line of stage.lines) {
    const es = memory.get(line);
    if (!es) return null;
    out.push(es);
  }
  return { linesEs: out };
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
    console.error(`No translations found in ${TRANSLATIONS_DIR}/`);
    process.exit(1);
  }

  let written = 0;
  let stagesFilled = 0;
  const partial = [];
  const untouched = [];

  for (const lesson of lessonDirs()) {
    const file = join(LESSONS_DIR, lesson, "config.json");
    const raw = readFileSync(file, "utf8");
    const config = JSON.parse(raw);
    const ci = config.launch?.conceptIntro;
    if (!ci) continue;
    let changed = false;

    for (const key of TEXT_FIELDS) {
      if (blank(ci[key]) || !blank(ci[`${key}Es`])) continue;
      const es = memory.get(ci[key]);
      if (es) {
        ci[`${key}Es`] = es;
        changed = true;
      }
    }

    for (const name of STAGES) {
      const stage = ci[name];
      if (!stage || !Array.isArray(stage.lines) || !stage.lines.length) continue;
      if (Array.isArray(stage.linesEs) && stage.linesEs.length === stage.lines.length) continue;
      const translated = stageTranslation(stage, memory);
      if (!translated) {
        const have = stage.lines.filter((l) => memory.has(l)).length;
        if (have) partial.push(`${lesson}.${name} (${have}/${stage.lines.length})`);
        continue;
      }
      stage.linesEs = translated.linesEs;
      if (!blank(stage.title) && blank(stage.titleEs)) {
        const es = memory.get(stage.title);
        if (es) stage.titleEs = es;
      }
      changed = true;
      stagesFilled += 1;
    }

    if (!changed) {
      untouched.push(lesson);
      continue;
    }
    if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    written += 1;
  }

  console.log(
    `${DRY ? "[dry-run] " : ""}concept-intro Spanish: ${stagesFilled} stage(s) filled across ${written} lesson(s).`,
  );
  if (partial.length) {
    console.log(
      `\n${partial.length} stage(s) are PARTLY translated and were left alone — finish the missing lines or the stage stays English:`,
    );
    for (const item of partial.slice(0, 40)) console.log(`  ${item}`);
    if (partial.length > 40) console.log(`  … and ${partial.length - 40} more`);
  }
  console.log(`${untouched.length} lesson(s) had nothing to fill.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
