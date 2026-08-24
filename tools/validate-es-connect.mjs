#!/usr/bin/env node
/**
 * validate-es-connect.mjs — the Connect phase's Spanish holds together.
 *
 * Connect carries a defect class none of the other surfaces has: `keywords` is
 * not only DISPLAYED, it is MATCHED against what the student types
 * (engine/components/open-response.js highlights a chip when the response
 * contains it, and counts the matches). So a half-translated keyword list does
 * not merely look unfinished — it credits the ideas that happen to be in
 * Spanish and silently withholds credit for the rest.
 *
 * That is why `keywordsEs` is checked harder than a display array: it must be
 * complete, non-blank throughout, and NOT a copy of the English, because an
 * English keyword in the Spanish list can never match Spanish writing.
 *
 * The rest is the shape every bilingual surface here shares: parallel arrays
 * stay parallel, and a translated field is not identical to its English.
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { languageNeutral } from "./apply-es-warmup.mjs";

const LESSONS = "lessons";
const blank = (value) => !String(value ?? "").trim();
const LIST_FIELDS = ["keywords", "choices", "answers"];
const TEXT_FIELDS = [
  "prompt",
  "scenario",
  "promptQuestion",
  "modelAnswer",
  "sentenceFrame",
  "stem",
];
const problems = [];

/* ── detectors ───────────────────────────────────────────────────────────── */

/**
 * `keywordsEs` is held to a stricter rule than a display array because the
 * renderer MATCHES it against student text.
 */
export function keywordProblems(where, en, es) {
  if (es === undefined) return [];
  if (!Array.isArray(es)) return [`${where}: keywordsEs is not an array`];
  const source = Array.isArray(en) ? en : [];
  if (es.length !== source.length) {
    return [
      `${where}: keywordsEs has ${es.length} entries for ${source.length} keywords — the list is ` +
        "MATCHED against what a student types, so a short one under-credits the ideas it drops",
    ];
  }
  const out = [];
  source.forEach((word, i) => {
    if (blank(word)) return;
    if (blank(es[i])) out.push(`${where}: keywordsEs[${i}] is blank`);
  });
  // A SINGLE entry identical to the English is not a defect — "divisor",
  // "total", "factor" and "decimal" are the same word in both languages, and
  // flagging every cognate would report a correct list as broken. The real
  // failure is a list nobody translated: every non-neutral entry copied
  // verbatim, which can never match a student writing in Spanish.
  const meaningful = source.filter((w) => !blank(w) && !languageNeutral(w));
  if (meaningful.length && source.every((w, i) => es[i] === w)) {
    out.push(
      `${where}: keywordsEs is a verbatim copy of the English list — it is MATCHED against ` +
        "what a student types, so a Spanish response would match none of it",
    );
  }
  return out;
}

/** An ordinary parallel display array. */
export function listProblems(where, name, en, es) {
  if (es === undefined) return [];
  if (!Array.isArray(es)) return [`${where}: ${name}Es is not an array`];
  const source = Array.isArray(en) ? en : [];
  if (es.length !== source.length) {
    return [
      `${where}: ${name}Es has ${es.length} entries for ${source.length} — the array is positional`,
    ];
  }
  const out = [];
  source.forEach((value, i) => {
    if (!blank(value) && blank(es[i])) out.push(`${where}: ${name}Es[${i}] is blank`);
  });
  return out;
}

export function connectProblems(id, node) {
  const out = [];
  const visit = (o, path) => {
    if (Array.isArray(o)) {
      o.forEach((item, i) => visit(item, `${path}[${i}]`));
      return;
    }
    if (!o || typeof o !== "object") return;
    if (o.keywordsEs !== undefined) {
      out.push(...keywordProblems(`${id}${path}`, o.keywords, o.keywordsEs));
    }
    for (const field of LIST_FIELDS) {
      if (field === "keywords") continue;
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
    "a short keywordsEs is caught",
    () => keywordProblems("x", ["quotient", "divisor"], ["cociente"]).length === 1,
  ],
  [
    "a wholly untranslated keyword list is caught",
    () => keywordProblems("x", ["quotient", "remainder"], ["quotient", "remainder"]).length === 1,
  ],
  [
    "a single COGNATE is not a defect — divisor is the same word in both languages",
    () => keywordProblems("x", ["quotient", "divisor"], ["cociente", "divisor"]).length === 0,
  ],
  [
    "a blank keyword translation is caught",
    () => keywordProblems("x", ["quotient", "divisor"], ["cociente", " "]).length === 1,
  ],
  [
    "a complete keywordsEs passes",
    () => keywordProblems("x", ["quotient", "divisor"], ["cociente", "divisor"]).length === 0,
  ],
  [
    "a language-neutral keyword repeated verbatim is NOT an error",
    () => keywordProblems("x", ["1/2"], ["1/2"]).length === 0,
  ],
  [
    "a short choicesEs is caught",
    () => listProblems("x", "choices", ["a vans", "b"], ["a camionetas"]).length === 1,
  ],
  [
    "a scenario identical to the English is caught",
    () =>
      connectProblems("x", {
        scenario: "A detective has 10 feet of rope.",
        scenarioEs: "A detective has 10 feet of rope.",
      }).length === 1,
  ],
  [
    "an untranslated connect block is not an error",
    () => connectProblems("x", { scenario: "A detective has 10 feet of rope." }).length === 0,
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
    console.error(`FAIL validate:es-connect — self-test did not fire: ${name}`);
    process.exit(1);
  }
}

/* ── sweep ───────────────────────────────────────────────────────────────── */

let blocks = 0;
let translated = 0;

for (const dir of readdirSync(LESSONS).sort()) {
  const file = join(LESSONS, dir, "config.json");
  if (!existsSync(file)) continue;
  const connect = JSON.parse(readFileSync(file, "utf8")).connect;
  if (!connect) continue;
  blocks += 1;
  if (/"(?:scenario|prompt|modelAnswer|stem)Es"/.test(JSON.stringify(connect))) translated += 1;
  problems.push(...connectProblems(dir, connect));
}

if (!blocks) {
  console.error("FAIL validate:es-connect — swept 0 Connect blocks, which verifies nothing");
  process.exit(1);
}

if (problems.length) {
  console.error(`\nFAIL validate:es-connect — ${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

const percent = Math.round((translated / blocks) * 100);
console.log(
  `PASS validate:es-connect — ${translated}/${blocks} Connect blocks carry Spanish (${percent}%); ` +
    `keyword lists complete and really Spanish, arrays parallel; ${selftests.length} self-tests green.`,
);
