#!/usr/bin/env node
/* =============================================================================
 * validate-family-no-leakage: a family homework page may not print another lesson's content.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * Until v3.0 the Learn stop's co-learning content came from a unit-level topic bank that defaulted
 * to "ratios". 89 of 166 pages printed a smoothie recipe, "Jordan says 3:5" or a generic 3-part tape
 * under a lesson about percents, area or equations. No per-lesson gate could see it: each page was
 * well-formed and every string was true somewhere. The data half of the fix is validate-family-v3
 * (lesson-keyed content, no fallback). This gate holds the OUTPUT and the CODE:
 *
 *   SIGNATURE  ratio-only phrases (smoothie, compost, "Jordan says 3:5", ...) on a non-Unit-3 page
 *   TAPE       the generic "Ratio Tape Model" figure anywhere outside Unit 3
 *   LEGACY     the old dev-style bar ("Completed: 0/0 · Accuracy · Streak") or per-problem "Model Bridge"
 *   SOURCE     scripts/lib/homework-*.mjs may not reintroduce a topic bank or a `topic = "ratios"` default
 * Self-tests run first against fixtures; a sweep of zero pages FAILS.
 *
 *   node tools/validate-family-no-leakage.mjs
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const SIGNATURES = [
  "3 cups of berries",
  "Jordan says 3:5",
  "keep the taste/color the same",
  "compost with 6 scoops",
  "cross-multiply or set up proportions",
  "double number lines to see equivalent ratios",
];
const LEGACY = [
  "hw_colearn_hud",
  "Completed:",
  "Accuracy:",
  "Model Bridge",
  "Caregiver Co-Pilot",
  "Print-to-Fridge",
];
const SOURCE_BANS = [/TOPIC_CO_LEARNING_BANK/, /topic\s*=\s*["']ratios["']/, /Ratio Tape Model/];

export function pageProblems(id, html) {
  const out = [];
  const ratioUnit = /^3-/.test(id);
  if (!ratioUnit) {
    for (const s of SIGNATURES)
      if (html.includes(s)) out.push(`${id}: ratio boilerplate "${s}" on a non-ratio lesson`);
    if (html.includes("Ratio Tape Model")) out.push(`${id}: generic "Ratio Tape Model" figure`);
  }
  for (const s of LEGACY) if (html.includes(s)) out.push(`${id}: legacy chrome "${s}"`);
  return out;
}

export function sourceProblems(file, text) {
  return SOURCE_BANS.filter((re) => re.test(text)).map((re) => `${file}: banned ${re}`);
}

function selfTest() {
  assert.deepEqual(pageProblems("4-5", "<p>Find the whole</p>"), []);
  assert(
    pageProblems("4-5", "<p>3 cups of berries</p>").some((m) => m.includes("ratio boilerplate")),
  );
  assert.deepEqual(
    pageProblems("3-1", "<p>3 cups of berries</p>"),
    [],
    "ratio lessons may use ratio content",
  );
  assert(
    pageProblems("5-1", "<svg>Ratio Tape Model · 3 equal parts</svg>").some((m) =>
      m.includes("generic"),
    ),
  );
  assert(pageProblems("5-1", '<section id="hw_colearn_hud">').some((m) => m.includes("legacy")));
  assert(pageProblems("5-1", "Completed: 0/0").some((m) => m.includes("legacy")));
  assert(sourceProblems("x.mjs", "const TOPIC_CO_LEARNING_BANK = {}").length === 1);
  assert(sourceProblems("x.mjs", 'function f(topic = "ratios") {}').length === 1);
  assert.deepEqual(sourceProblems("x.mjs", "const bank = {}"), []);
}

function main() {
  selfTest();
  const problems = [];
  let pages = 0;
  for (const id of listLessonDirs()) {
    const file = lessonPath(id, "homework.html");
    if (!existsSync(file)) continue;
    pages++;
    problems.push(...pageProblems(id, readFileSync(file, "utf8")));
  }
  if (pages === 0)
    throw new Error("swept zero homework pages: a sweep that checks nothing verifies nothing");
  const libDir = join(REPO_ROOT, "scripts", "lib");
  const sources = readdirSync(libDir)
    .filter((f) => /^homework-.*\.mjs$/.test(f))
    .map((f) => `scripts/lib/${f}`);
  sources.push("scripts/generate-homework-html.mjs", "scripts/homework-guided-notes.mjs");
  for (const f of sources)
    problems.push(...sourceProblems(f, readFileSync(join(REPO_ROOT, f), "utf8")));
  if (problems.length) {
    console.error(
      `FAIL validate-family-no-leakage (${problems.length} problems across ${pages} pages)`,
    );
    for (const p of problems.slice(0, 60)) console.error(`  - ${p}`);
    if (problems.length > 60) console.error(`  ... and ${problems.length - 60} more`);
    process.exit(1);
  }
  console.log(
    `OK validate-family-no-leakage: ${pages} pages and ${sources.length} sources carry no wrong-lesson content (self-tests passed)`,
  );
}
main();
