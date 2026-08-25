#!/usr/bin/env node
/**
 * validate-es-explore.mjs — the Explore lab's Spanish holds together.
 *
 * Explore is a TREE of independent components, not one card, so unlike the
 * warm-up or the exit ticket it is not all-or-nothing per surface: a translated
 * drag-sort beside an untranslated bar model is two widgets, not one broken
 * page. What IS all-or-nothing is each POSITIONAL array — `columns`, `headers`,
 * `hints` — because the renderer indexes them against the English, so a short
 * one labels a column with the previous column's Spanish.
 *
 * The second rule is the one this surface needs most: a column HEADER names
 * what the student must produce in that column. `headersEs` reaching the table
 * while `instructionsEs` does not is fine; `headersEs` being SHORT is not,
 * because the student then types into a cell labelled with the wrong heading.
 *
 * It also re-derives every composed string (tools/lib/es-explore-compose.mjs) —
 * the deeper and warm-up variants of a task quote its instructions verbatim, so
 * a hand-edit makes one activity read two different ways.
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadMemory } from "./apply-es-concept-intro.mjs";
import { languageNeutral } from "./apply-es-warmup.mjs";
import { derive, isComposed } from "./lib/es-explore-compose.mjs";

const LESSONS = "lessons";
const blank = (value) => !String(value ?? "").trim();
const LIST_FIELDS = ["hints", "columns", "headers"];
const TEXT_FIELDS = ["goal", "instructions", "prompt", "sentenceFrame", "label", "text"];
const problems = [];

/* ── detectors ───────────────────────────────────────────────────────────── */

/** A positional array must match its English in length and be really Spanish. */
export function listProblems(where, name, en, es) {
  if (es === undefined) return [];
  if (!Array.isArray(es)) return [`${where}: ${name}Es is not an array`];
  const source = Array.isArray(en) ? en : [];
  if (es.length !== source.length) {
    return [
      `${where}: ${name}Es has ${es.length} entries for ${source.length} — the array is ` +
        "positional, so a cell would be labelled with the wrong column's Spanish",
    ];
  }
  const out = [];
  source.forEach((value, i) => {
    if (!blank(value) && blank(es[i])) out.push(`${where}: ${name}Es[${i}] is blank`);
  });
  // Every entry identical to the English means the array says nothing; the
  // applier declines to write one, so finding one is a hand-edit worth naming.
  if (
    source.length &&
    source.every((v, i) => es[i] === v) &&
    source.some((v) => !languageNeutral(v))
  ) {
    out.push(`${where}: ${name}Es is identical to the English throughout`);
  }
  return out;
}

/** A composed string must still match what the composer would build. */
export function driftProblems(where, field, en, es, memory) {
  if (blank(en) || blank(es) || !isComposed(en)) return [];
  const built = derive(String(en), memory);
  if (built && built !== es) {
    return [
      `${where}.${field}: the Spanish no longer matches the instructions it QUOTES — ` +
        "one variant of this task was edited and the other was not",
    ];
  }
  return [];
}

/** Walk the subtree and collect everything wrong. */
export function exploreProblems(id, node, memory) {
  const out = [];
  const visit = (o, path) => {
    if (Array.isArray(o)) {
      o.forEach((item, i) => visit(item, `${path}[${i}]`));
      return;
    }
    if (!o || typeof o !== "object") return;
    for (const field of LIST_FIELDS) {
      if (o[`${field}Es`] !== undefined) {
        out.push(...listProblems(`${id}${path}`, field, o[field], o[`${field}Es`]));
      }
    }
    for (const field of TEXT_FIELDS) {
      const es = o[`${field}Es`];
      if (blank(es)) continue;
      if (es === o[field] && !languageNeutral(o[field])) {
        out.push(`${id}${path}.${field}Es is identical to the English`);
      }
      out.push(...driftProblems(`${id}${path}`, field, o[field], es, memory));
    }
    for (const [key, value] of Object.entries(o)) {
      if (value && typeof value === "object") visit(value, `${path}.${key}`);
    }
  };
  visit(node, "");
  return out;
}

/* ── self-test: the detectors must fire ──────────────────────────────────── */

const selftests = [
  [
    "a short headers array is caught",
    () => listProblems("x", "headers", ["Shape", "Total area"], ["Figura"]).length === 1,
  ],
  [
    "a blank header translation is caught",
    () => listProblems("x", "headers", ["Shape", "Total area"], ["Figura", " "]).length === 1,
  ],
  [
    "a matching headers array passes",
    () =>
      listProblems("x", "headers", ["Shape", "Total area"], ["Figura", "Área total"]).length === 0,
  ],
  [
    "an all-English array is caught",
    () =>
      listProblems("x", "headers", ["Shape", "Total area"], ["Shape", "Total area"]).length === 1,
  ],
  [
    "a purely notational array repeated verbatim is NOT an error",
    () => listProblems("x", "headers", ["x", "y"], ["x", "y"]).length === 0,
  ],
  [
    "a drifted composed instruction is caught",
    () => {
      const memory = new Map([["Sort these numbers.", "Clasifica estos números."]]);
      return (
        driftProblems(
          "x",
          "instructions",
          "Go deeper: Sort these numbers. As you work, ask yourself WHY it works.",
          "Ve más a fondo: algo completamente distinto. Mientras trabajas, pregúntate por qué funciona.",
          memory,
        ).length === 1
      );
    },
  ],
  [
    "an untranslated tree is not an error",
    () => exploreProblems("x", { instructions: "Sort these numbers." }, new Map()).length === 0,
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
    console.error(`FAIL validate:es-explore — self-test did not fire: ${name}`);
    process.exit(1);
  }
}

/* ── sweep ───────────────────────────────────────────────────────────────── */

const memory = loadMemory();
let labs = 0;
let translated = 0;

for (const dir of readdirSync(LESSONS).sort()) {
  const file = join(LESSONS, dir, "config.json");
  if (!existsSync(file)) continue;
  const explore = JSON.parse(readFileSync(file, "utf8")).explore;
  if (!explore) continue;
  labs += 1;
  const text = JSON.stringify(explore);
  if (/"(?:instructions|label|prompt|text|goal)Es"/.test(text)) translated += 1;
  problems.push(...exploreProblems(dir, explore, memory));
}

if (!labs) {
  console.error("FAIL validate:es-explore — swept 0 labs, which verifies nothing");
  process.exit(1);
}

if (problems.length) {
  console.error(`\nFAIL validate:es-explore — ${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

const percent = Math.round((translated / labs) * 100);
console.log(
  `PASS validate:es-explore — ${translated}/${labs} Explore labs carry Spanish (${percent}%); ` +
    `positional arrays parallel, no quote drift; ${selftests.length} self-tests green.`,
);
