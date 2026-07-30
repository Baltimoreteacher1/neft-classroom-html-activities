#!/usr/bin/env node
// Guards the quality of `choiceFeedback` in lessons/*/config.json.
//
// `choiceFeedback[i]` is what a student reads after picking wrong answer i.
// House standard: name the specific error and give the corrective move.
// "Check your work." teaches nothing, and a self-contradicting sentence
// ("6² = 36, not 36.") actively confuses.
//
// Two checks, both written to be false-positive free so the gate stays trusted:
//
//   1. VAGUE — opens with a hedge verb AND carries no concrete detail.
//      "Check the units — a wrapped surface is square, not cubic" passes:
//      it opens with a hedge but names the actual error.
//   2. SELF-CONTRADICTION — "= N, not N", the same value on both sides of a
//      contrast. Deliberate contrasts ("-4, not 4", "8 ÷ 6, not 6 ÷ 8") differ
//      on one side and are not flagged.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const LESSONS = "lessons";

const HEDGE =
  /^(check|double-check|recheck|try|remember|make sure|review|look|think|consider|be careful|careful)\b/i;

// concrete detail: a number, an operator, or a math noun/verb
const SPECIFIC =
  /\d|½|÷|×|·|\bper\b|\badd|\bsubtract|\bmultipl|\bdivid|\bsquare|\bcubic|\bnumerator|\bdenominator|\bsign|\bnegative|\bopposite|\bborrow|\bregroup|\bdecimal|\bunit|\bbase\b|\bheight|\bwidth|\blength|\bperimeter|\barea\b|\bvolume|\bnot\b|\binstead\b|\brather than|\bparallel|\bcoordinate|\bx-axis|\by-axis|\breciprocal|\bexponent|\binverse/i;

// The trailing guards let a sentence-ending "." through while still rejecting
// a longer number ("36" must not match inside "365" or "36.5").
const CONTRADICTION = /=\s*(-?\d+(?:\.\d+)?)\s*,\s*not\s+\1(?!\d)(?!\.\d)(?!\w)/;

function isVague(text) {
  if (!HEDGE.test(text)) return false;
  return !SPECIFIC.test(text) || text.trim().split(/\s+/).length <= 7;
}

function walk(node, visit) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
  } else if (node && typeof node === "object") {
    visit(node);
    for (const value of Object.values(node)) walk(value, visit);
  }
}

const vague = [];
const contradictions = [];
let lessonCount = 0;
let feedbackCount = 0;

for (const entry of readdirSync(LESSONS).sort()) {
  const configPath = join(LESSONS, entry, "config.json");
  let raw;
  try {
    if (!statSync(configPath).isFile()) continue;
    raw = readFileSync(configPath, "utf8");
  } catch {
    continue;
  }
  lessonCount += 1;
  const config = JSON.parse(raw);

  walk(config, (obj) => {
    const feedback = obj.choiceFeedback;
    if (!Array.isArray(feedback)) return;
    feedback.forEach((text, index) => {
      if (typeof text !== "string" || !text.trim()) return;
      feedbackCount += 1;
      const where = `${entry} [choice ${index}]`;
      if (isVague(text)) vague.push(`${where}: ${text}`);
      if (CONTRADICTION.test(text)) contradictions.push(`${where}: ${text}`);
    });
  });
}

const problems = [];
if (vague.length) {
  problems.push(
    `${vague.length} vague wrong-answer message(s) — name the student's actual error instead:\n` +
      vague.map((v) => `    ${v}`).join("\n"),
  );
}
if (contradictions.length) {
  problems.push(
    `${contradictions.length} self-contradicting message(s) — same value on both sides of "not":\n` +
      contradictions.map((c) => `    ${c}`).join("\n"),
  );
}

if (problems.length) {
  console.error("distractor-feedback: FAIL\n");
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

console.log(
  `distractor-feedback: PASS (${feedbackCount} messages across ${lessonCount} lesson configs)`,
);
