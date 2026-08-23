#!/usr/bin/env node
/**
 * validate-es-concept-intro.mjs — the worked example's Spanish holds together.
 *
 * WHAT THIS EXISTS FOR. Every other Spanish check in this repo asks whether a
 * translation is PRESENT. Two things can be present and still wrong here, and
 * both of them would reach a student:
 *
 *   1. A HALF-TRANSLATED STAGE. `linesEs` is a parallel array, and both
 *      renderers refuse a mismatched one — so a stage with 8 lines and 7
 *      translations silently renders entirely in English. Present, counted,
 *      invisible. That is the same shape as the .sg-es bug (see
 *      tools/es-lane-reachable.test.mjs): the data was complete and no student
 *      ever saw it.
 *
 *   2. A QUOTED KEY IDEA THAT DRIFTED. The catch-up lessons quote each covered
 *      lesson's key idea verbatim into a roll-up, and the group variants quote
 *      it into "Remember the key idea: …". If the English is quoted but the
 *      Spanish is paraphrased differently in each place, a student reading 2.7
 *      and then the 2.7 catch-up meets two different Spanish sentences for one
 *      rule. This is the copy-panel defect, in the other language.
 *
 * Composition is what prevents (2): tools/lib/es-concept-compose.mjs REBUILDS
 * every derived string from the atom's own translation. So this gate checks the
 * composer still agrees with what is on disk — if someone hand-edits a roll-up,
 * that is exactly the drift this catches.
 *
 * Self-tests its detectors against known-bad fixtures BEFORE sweeping, because a
 * detector that has stopped firing reports a perfectly translated curriculum.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { derive } from "./lib/es-concept-compose.mjs";

const LESSONS = "lessons";
const TRANSLATIONS = "data/es-translations";
const STAGES = ["iDo", "weDo", "youDo"];

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

/* ── detectors ───────────────────────────────────────────────────────────── */

/** A parallel array must be complete or absent — never partial. */
export function stageProblems(id, name, stage) {
  const out = [];
  if (!stage || !Array.isArray(stage.lines) || !stage.lines.length) return out;
  const es = stage.linesEs;
  if (es === undefined) return out; // not translated yet is a legitimate state
  if (!Array.isArray(es)) {
    out.push(`${id}.${name}: linesEs is not an array`);
    return out;
  }
  if (es.length !== stage.lines.length) {
    out.push(
      `${id}.${name}: linesEs has ${es.length} entries for ${stage.lines.length} lines — ` +
        "both renderers fall back to English entirely, so this stage is invisible in Spanish",
    );
  }
  es.forEach((line, i) => {
    if (!String(line ?? "").trim()) out.push(`${id}.${name}: linesEs[${i}] is blank`);
    if (line === stage.lines[i] && /[a-z]/i.test(String(line))) {
      out.push(`${id}.${name}: linesEs[${i}] is identical to the English`);
    }
  });
  return out;
}

/** A composed string must still match what the composer would build. */
export function driftProblems(id, config, memory) {
  const out = [];
  const ci = config.launch?.conceptIntro;
  if (!ci) return out;
  const check = (label, en, es) => {
    if (!en || !es) return;
    const built = derive(en, memory);
    if (built && built !== es) {
      out.push(
        `${id}.${label}: the Spanish no longer matches what it is quoted FROM — ` +
          "a key idea's translation was edited in one place and not the other",
      );
    }
  };
  check("keyIdea", ci.keyIdea, ci.keyIdeaEs);
  check("heading", ci.heading, ci.headingEs);
  check("intro", ci.intro, ci.introEs);
  for (const name of STAGES) {
    const stage = ci[name];
    if (!stage?.lines || !Array.isArray(stage.linesEs)) continue;
    if (stage.linesEs.length !== stage.lines.length) continue;
    stage.lines.forEach((en, i) => check(`${name}[${i}]`, en, stage.linesEs[i]));
  }
  return out;
}

/* ── self-test: the detectors must fire ──────────────────────────────────── */

const selftests = [
  [
    "a short linesEs is caught",
    () => stageProblems("x", "iDo", { lines: ["a", "b"], linesEs: ["a-es"] }).length === 1,
  ],
  [
    "a blank translation is caught",
    () => stageProblems("x", "iDo", { lines: ["a", "b"], linesEs: ["a-es", "  "] }).length === 1,
  ],
  [
    "an untranslated line left in English is caught",
    () =>
      stageProblems("x", "iDo", { lines: ["hello", "b"], linesEs: ["hello", "b-es"] }).length === 1,
  ],
  [
    "a complete array passes",
    () => stageProblems("x", "iDo", { lines: ["a", "b"], linesEs: ["a-es", "b-es"] }).length === 0,
  ],
  [
    "no linesEs at all is not an error",
    () => stageProblems("x", "iDo", { lines: ["a", "b"] }).length === 0,
  ],
  [
    "a drifted quote is caught",
    () => {
      const memory = new Map([["Do the thing.", "Haz la cosa."]]);
      const config = {
        launch: {
          conceptIntro: {
            keyIdea: "Do the thing.",
            keyIdeaEs: "Haz la cosa.",
            youDo: {
              lines: ["Remember the key idea: Do the thing."],
              // Hand-edited to a DIFFERENT Spanish than the key idea it quotes.
              linesEs: ["Recuerda la idea clave: Realiza la accion."],
            },
          },
        },
      };
      return driftProblems("x", config, memory).length === 1;
    },
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
    console.error(`FAIL validate:es-concept-intro — self-test did not fire: ${name}`);
    process.exit(1);
  }
}

/* ── sweep ───────────────────────────────────────────────────────────────── */

const memory = new Map();
if (existsSync(TRANSLATIONS)) {
  for (const file of readdirSync(TRANSLATIONS).filter((f) => f.startsWith("concept-intro-"))) {
    for (const [en, es] of Object.entries(
      JSON.parse(readFileSync(join(TRANSLATIONS, file), "utf8")),
    )) {
      memory.set(en, es);
    }
  }
}

let lessons = 0;
let stages = 0;
let translated = 0;
let lines = 0;

for (const dir of readdirSync(LESSONS).sort()) {
  const file = join(LESSONS, dir, "config.json");
  if (!existsSync(file)) continue;
  const config = JSON.parse(readFileSync(file, "utf8"));
  const ci = config.launch?.conceptIntro;
  if (!ci) continue;
  lessons += 1;
  for (const name of STAGES) {
    const stage = ci[name];
    if (!stage?.lines?.length) continue;
    stages += 1;
    lines += stage.lines.length;
    if (Array.isArray(stage.linesEs) && stage.linesEs.length === stage.lines.length) {
      translated += 1;
    }
    for (const message of stageProblems(dir, name, stage)) fail("stage", message);
  }
  for (const message of driftProblems(dir, config, memory)) fail("drift", message);
}

if (!stages) {
  console.error("FAIL validate:es-concept-intro — swept 0 stages, which verifies nothing");
  process.exit(1);
}

if (problems.length) {
  console.error(`\nFAIL validate:es-concept-intro — ${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

const percent = Math.round((translated / stages) * 100);
console.log(
  `PASS validate:es-concept-intro — ${translated}/${stages} worked-example stages bilingual ` +
    `(${percent}%) across ${lessons} lessons, ${lines} lines; no partial arrays, no quote drift; ` +
    `${selftests.length} self-tests green.`,
);
