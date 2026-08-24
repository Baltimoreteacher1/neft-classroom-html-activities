#!/usr/bin/env node
// apply-es-explore.mjs — project data/es-translations/explore.json onto the
// EXPLORE lab (`config.explore`) of every lesson.
//
//   node tools/apply-es-explore.mjs [--dry-run] [--unit 2] [--refresh]
//
// Explore is the hands-on lab: the goal line, the task instructions, the
// question a manipulative asks, the column headers of a fill-in table, the
// sentence frame a student writes into, and the labels on drag cards.
//
// FIELD-BY-FIELD, NOT WHOLE-CARD. Unlike the warm-up or the exit ticket, this
// surface is a tree of independent components — a translated drag-sort and an
// untranslated bar model on the same page are two separate widgets, not one
// half-rendered page. What IS all-or-nothing is each POSITIONAL array
// (`columns`/`headers`), because those index against the English.
//
// DERIVED STRINGS ARE COMPOSED (tools/lib/es-explore-compose.mjs): the deeper
// and warm-up variants of a task both quote its instructions verbatim, so
// translating them separately means writing one set of instructions three times.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadMemory } from "./apply-es-concept-intro.mjs";
import { languageNeutral } from "./apply-es-warmup.mjs";
import { derive } from "./lib/es-explore-compose.mjs";

const LESSONS_DIR = "lessons";
const DRY = process.argv.includes("--dry-run");
const REFRESH = process.argv.includes("--refresh");
const unitIx = process.argv.indexOf("--unit");
const ONLY_UNIT = unitIx !== -1 ? process.argv[unitIx + 1] : null;

const blank = (value) => !String(value ?? "").trim();

// Scalar text fields, translated independently wherever they appear.
const TEXT_FIELDS = [
  "goal",
  "questionText",
  "instructions",
  "explanation",
  "hint",
  "label",
  "prompt",
  "sentenceFrame",
  "text",
  "title",
  "caption",
  "intro",
  "xLabel",
  "yLabel",
  "totalLabel",
  "solveFirstTaskCaption",
  "solveFirstToolCaption",
  "problem",
  "wordProblem",
];
// Positional arrays: all-or-nothing, because the renderer indexes them.
const LIST_FIELDS = ["hints", "columns", "headers"];

/** The Spanish for one string, or null when it is not covered. */
function spanish(value, memory) {
  const text = String(value);
  return derive(text, memory) || (languageNeutral(text) ? text : null);
}

/**
 * Walk the explore subtree and fill every `*Es` it can. Returns how many fields
 * were written and how many were left because the memory did not cover them.
 */
export function fillExplore(node, memory, { refresh = false } = {}) {
  let filled = 0;
  let missed = 0;

  const visit = (o) => {
    if (Array.isArray(o)) {
      for (const item of o) visit(item);
      return;
    }
    if (!o || typeof o !== "object") return;

    for (const field of TEXT_FIELDS) {
      const value = o[field];
      if (typeof value !== "string" || blank(value)) continue;
      if (!refresh && !blank(o[`${field}Es`])) continue;
      const es = spanish(value, memory);
      if (!es) {
        missed += 1;
        continue;
      }
      if (es !== value && o[`${field}Es`] !== es) {
        o[`${field}Es`] = es;
        filled += 1;
      }
    }

    for (const field of LIST_FIELDS) {
      const list = o[field];
      if (!Array.isArray(list) || !list.length) continue;
      if (!list.every((x) => typeof x === "string")) continue;
      const already = o[`${field}Es`];
      if (!refresh && Array.isArray(already) && already.length === list.length) continue;
      const out = [];
      let complete = true;
      for (const item of list) {
        if (blank(item)) {
          out.push("");
          continue;
        }
        const es = spanish(item, memory);
        if (!es) {
          complete = false;
          break;
        }
        out.push(es);
      }
      if (!complete) {
        missed += 1;
        continue;
      }
      // Identical to the English throughout means the column names are pure
      // notation; writing the array would add noise, not support.
      if (out.every((es, i) => es === list[i])) continue;
      if (JSON.stringify(already) !== JSON.stringify(out)) {
        o[`${field}Es`] = out;
        filled += 1;
      }
    }

    for (const value of Object.values(o)) {
      if (value && typeof value === "object") visit(value);
    }
  };

  visit(node);
  return { filled, missed };
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
  let fields = 0;
  let uncovered = 0;

  for (const lesson of lessonDirs()) {
    const file = join(LESSONS_DIR, lesson, "config.json");
    const raw = readFileSync(file, "utf8");
    const config = JSON.parse(raw);
    if (!config.explore) continue;
    const { filled, missed } = fillExplore(config.explore, memory, { refresh: REFRESH });
    fields += filled;
    uncovered += missed;
    if (!filled) continue;
    const next = `${JSON.stringify(config, null, 2)}\n`;
    if (next === raw) continue;
    if (!DRY) writeFileSync(file, next);
    written += 1;
  }

  console.log(
    `${DRY ? "[dry-run] " : ""}Explore Spanish: ${fields} field(s) filled across ${written} lesson(s).`,
  );
  if (uncovered) {
    console.log(`${uncovered} field(s) had no translation in the memory and were left English.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
