#!/usr/bin/env node
// apply-es-connect.mjs — project data/es-translations/connect.json onto the
// CONNECT phase (`config.connect`) of every lesson.
//
//   node tools/apply-es-connect.mjs [--dry-run] [--unit 2] [--refresh]
//
// Connect is where the lesson's mathematics meets a real situation: the
// scenario a student reads, the written-response prompt and its sentence frame,
// the model answer, and a short multiple-choice check.
//
// `keywords` IS TRANSLATED, AND THAT CHANGES BEHAVIOUR, NOT JUST DISPLAY. The
// keyword chips under a written response are matched against what the student
// TYPES (engine/components/open-response.js). A student writing in Spanish
// never contains the English word "quotient", so their chips never light up and
// the response is scored as missing every key idea it actually made. The array
// is all-or-nothing for that reason: a half-translated list would match half the
// ideas and silently under-credit the rest.

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

const TEXT_FIELDS = [
  "prompt",
  "scenario",
  "promptQuestion",
  "modelAnswer",
  "sentenceFrame",
  "stem",
  "explanation",
  "title",
  "caption",
  "xLabel",
  "yLabel",
  "label",
];
const LIST_FIELDS = ["keywords", "choices", "answers"];

function spanish(value, memory) {
  const text = String(value);
  return memory.get(text) || (languageNeutral(text) ? text : null);
}

/** Walk the connect subtree and fill every `*Es` the memory covers. */
export function fillConnect(node, memory, { refresh = false } = {}) {
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
    if (!config.connect) continue;
    const { filled, missed } = fillConnect(config.connect, memory, { refresh: REFRESH });
    fields += filled;
    uncovered += missed;
    if (!filled) continue;
    const next = `${JSON.stringify(config, null, 2)}\n`;
    if (next === raw) continue;
    if (!DRY) writeFileSync(file, next);
    written += 1;
  }

  console.log(
    `${DRY ? "[dry-run] " : ""}Connect Spanish: ${fields} field(s) filled across ${written} lesson(s).`,
  );
  if (uncovered) {
    console.log(`${uncovered} field(s) had no translation in the memory and were left English.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
