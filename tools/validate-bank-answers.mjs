#!/usr/bin/env node
/**
 * Answer-key gate for every multiple-choice BANK that is not a lesson config.
 *
 * `npm run validate:math` recomputes the answers in `lessons/<id>/config.json`
 * (1,800+ checks). The banks that feed other surfaces — Spiral Review
 * (`spiral-review/bank.json`), the family homework ladder, part-two practice,
 * the do-now generator, retrieval, the learning labs — were never covered, yet
 * a wrong key there marks a correct student answer wrong with no warning.
 *
 * This sweeps every tracked JSON file for multiple-choice items (a `stem` or
 * `question`, string `choices`, an integer `correctIndex`) and fails on:
 *   BAD_INDEX   correctIndex outside the choices
 *   DUP_TEXT    two choices with identical text
 *   WRONG_KEY   a pure-arithmetic stem ("What is 3.4 × 2.6?") whose exact value
 *               (scripts/lib/rational.mjs, BigInt fractions) matches a choice
 *               other than the keyed one
 *   NO_MATCH    ...whose exact value matches no choice at all
 *   TWO_MATCH   ...whose value matches the keyed choice AND another choice
 *               (a correct answer a student can pick and be told is wrong)
 * Only stems that are NOTHING but arithmetic after the verb are checked, so a
 * word problem is never guessed at. Detectors are proven on seeded defects
 * first, and a sweep below its floor FAILS (a gate that measured nothing).
 *
 * Deliberately not a check: "two choices are numerically equal". Measured at
 * ~200 hits, all intentional (2 × 3 × 5 vs 2 × 15, "30–39" read as subtraction).
 */

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { evaluateExpression, matchesAnswer } from "../scripts/lib/rational.mjs";

const LEAD = /^(?:what is|compute|calculate|evaluate|find|simplify|solve)\s+(?:the value of\s+)?/i;
const UNIT_WORDS = /\b(in|ft|cm|m|sq|cu)\b/g;

/** The arithmetic in a stem, or null when the stem is anything but arithmetic. */
export function arithmeticOf(stem) {
  const text = String(stem ?? "").trim();
  const body = text
    .replace(LEAD, "")
    .replace(/[?.:]\s*$/, "")
    .trim();
  if (body === text) return null;
  if (/[a-zA-Z]{2,}/.test(body.replace(UNIT_WORDS, ""))) return null;
  return evaluateExpression(body) ? body : null;
}

/** Findings for one multiple-choice item: [{ kind, detail }]. */
export function checkItem(item) {
  const out = [];
  const { choices, correctIndex } = item;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= choices.length) {
    return [{ kind: "BAD_INDEX", detail: `correctIndex ${correctIndex} of ${choices.length}` }];
  }
  const norm = choices.map((c) => c.trim().toLowerCase());
  if (new Set(norm).size !== norm.length)
    out.push({ kind: "DUP_TEXT", detail: "identical choices" });
  const expr = arithmeticOf(item.stem);
  if (!expr) return out;
  const exact = evaluateExpression(expr);
  const hits = choices.flatMap((c, i) => (matchesAnswer(exact, c) === true ? [i] : []));
  const shown = (idx) => idx.map((i) => `"${choices[i]}"`).join(", ") || "none";
  if (!hits.includes(correctIndex)) {
    out.push({
      kind: hits.length ? "WRONG_KEY" : "NO_MATCH",
      detail: `${expr} = ${exact}; key "${choices[correctIndex]}"; matches ${shown(hits)}`,
    });
  } else if (hits.length > 1) {
    out.push({ kind: "TWO_MATCH", detail: `${expr} = ${exact}; matches ${shown(hits)}` });
  }
  return out;
}

export function isChoiceItem(o) {
  const stem = o.stem ?? o.question;
  return (
    typeof stem === "string" &&
    Array.isArray(o.choices) &&
    o.choices.length >= 2 &&
    o.choices.every((c) => typeof c === "string") &&
    o.correctIndex !== undefined
  );
}

function* itemsIn(node, path = "") {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) yield* itemsIn(node[i], `${path}[${i}]`);
  } else if (node && typeof node === "object") {
    if (isChoiceItem(node)) yield { item: { ...node, stem: node.stem ?? node.question }, path };
    for (const [k, v] of Object.entries(node)) yield* itemsIn(v, `${path}.${k}`);
  }
}

// ── self-test: every detector must fire on a seeded defect and stay quiet on a clean item ──
function selfTest() {
  const kinds = (item) => checkItem(item).map((f) => f.kind);
  const base = {
    stem: "What is 3.4 × 2.6?",
    choices: ["8.84", "88.4", "0.884", "6"],
    correctIndex: 0,
  };
  assert.deepEqual(kinds(base), [], "clean item");
  assert.deepEqual(kinds({ ...base, correctIndex: 1 }), ["WRONG_KEY"], "keyed the wrong choice");
  assert.deepEqual(
    kinds({ ...base, choices: ["88.4", "0.884", "6", "7"] }),
    ["NO_MATCH"],
    "answer not offered",
  );
  assert.deepEqual(kinds({ ...base, correctIndex: 9 }), ["BAD_INDEX"], "index out of range");
  assert.deepEqual(
    kinds({ ...base, choices: ["8.84", "88.4", "88.4", "6"] }),
    ["DUP_TEXT"],
    "duplicate choices",
  );
  assert.deepEqual(
    kinds({ ...base, choices: ["8.84", "8.840", "0.884", "6"] }),
    ["TWO_MATCH"],
    "two correct choices",
  );
  assert.deepEqual(
    kinds({
      stem: "Maria buys 3 shirts at $12 each. How much?",
      choices: ["36", "15"],
      correctIndex: 1,
    }),
    [],
    "word problems are never guessed at",
  );
  assert.equal(arithmeticOf("What is 12 ÷ 1/2?"), "12 ÷ 1/2", "mixed operators parse");
  assert.equal(arithmeticOf("Which is greater, 1/3 or 1/5?"), null, "non-arithmetic stems skipped");
}

selfTest();

const files = execSync("git ls-files '*.json'", { maxBuffer: 1e9 })
  .toString()
  .trim()
  .split("\n")
  .filter((f) => !/^(node_modules|dist|reports|output|canvas-packages|lumen-harbor)\//.test(f))
  .filter((f) => !f.endsWith("package.json") && !f.endsWith("package-lock.json"));

let items = 0;
let arithmetic = 0;
const problems = [];
for (const file of files) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  for (const { item, path } of itemsIn(data)) {
    items += 1;
    if (arithmeticOf(item.stem)) arithmetic += 1;
    for (const f of checkItem(item)) {
      problems.push(`${f.kind} ${file}${path} :: ${item.stem.slice(0, 60)} | ${f.detail}`);
    }
  }
}

const FLOOR = { items: 8000, arithmetic: 400 };
if (items < FLOOR.items || arithmetic < FLOOR.arithmetic) {
  console.error(
    `FAIL validate-bank-answers: swept ${items} items / ${arithmetic} arithmetic checks, below the floor ${FLOOR.items} / ${FLOOR.arithmetic} — the sweep stopped finding content.`,
  );
  process.exit(1);
}
if (problems.length) {
  console.error(`FAIL validate-bank-answers: ${problems.length} answer-key problem(s)`);
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `PASS validate-bank-answers: ${items} multiple-choice items in ${files.length} JSON files, ${arithmetic} keys recomputed exactly, 0 problems`,
);
