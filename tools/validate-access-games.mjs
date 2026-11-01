#!/usr/bin/env node
// Content contract for the Reading Ladder and the Puzzle Den (access-practice-lab/content/{ladder,puzzles}).
// Every grid must have exactly one solution, every sentence puzzle must be buildable from its own tiles,
// answers must not sit in one position, hints must never state the answer, and no text may claim a
// proficiency, Lexile, grade or WIDA level (platform rule 1 in access-practice-lab/PLATFORM.md).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LADDER_STEPS } from "../access-practice-lab/src/ladder.js";
import { gridSolutions, PUZZLE_TYPES } from "../access-practice-lab/src/puzzles.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "access-practice-lab", "content");
const load = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

const CLAIM = /lexile|wida level|grade level|reading level|proficien|fluency score|\bexit\b/i;
const strings = (value) =>
  typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(strings)
      : [];
const words = (text) => text.trim().split(/\s+/).length;
const sentences = (text) => text.split(/[.!?]+["”]?\s+/).filter(Boolean).length;
const mean = (list) => list.reduce((a, b) => a + b, 0) / (list.length || 1);
const cluesOnly = (text) => text.toLowerCase();

// ---- Reading Ladder
const ladder = load("ladder/passages.json");
const KINDS = new Set(["detail", "word", "inference", "main-idea"]);
if (ladder.steps !== LADDER_STEPS)
  fail("ladder", `steps is ${ladder.steps}, the engine has ${LADDER_STEPS}`);
const ids = new Set();
const positions = [0, 0, 0];
let longest = 0;
let questions = 0;
for (const p of ladder.passages) {
  const at = `ladder/${p.id}`;
  if (ids.has(p.id)) fail(at, "duplicate id");
  ids.add(p.id);
  if (!Number.isInteger(p.step) || p.step < 1 || p.step > LADDER_STEPS)
    fail(at, "step out of range");
  if (!p.title || !p.text) fail(at, "missing title or text");
  if (p.questions.length !== 3) fail(at, `has ${p.questions.length} questions, expected 3`);
  const own = new Set();
  for (const [i, q] of p.questions.entries()) {
    const qa = `${at} q${i + 1}`;
    questions += 1;
    if (!KINDS.has(q.kind)) fail(qa, `unknown kind ${q.kind}`);
    if (q.choices.length !== 3 || new Set(q.choices).size !== 3)
      fail(qa, "needs three distinct choices");
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 2)
      fail(qa, "answer index out of range");
    if (!q.hint || !q.why) fail(qa, "missing hint or why");
    const right = q.choices[q.answer];
    if (
      right &&
      right.length >= 8 &&
      cluesOnly(q.hint).includes(right.toLowerCase().replace(/[.]$/, ""))
    )
      fail(qa, "hint states the answer");
    positions[q.answer] += 1;
    own.add(q.answer);
    if (q.choices.every((c, j) => j === q.answer || c.length < right.length)) longest += 1;
  }
  if (own.size < 2) fail(at, "every correct answer sits in the same position");
}
for (let step = 1; step <= LADDER_STEPS; step += 1) {
  const here = ladder.passages.filter((p) => p.step === step);
  if (here.length < 3) fail(`ladder step ${step}`, `has ${here.length} passages, needs at least 3`);
}
const byStep = (fn) =>
  Array.from({ length: LADDER_STEPS }, (_, i) =>
    mean(ladder.passages.filter((p) => p.step === i + 1).map(fn)),
  );
const length = byStep((p) => words(p.text));
const sentenceLength = byStep((p) => words(p.text) / sentences(p.text));
for (let i = 1; i < LADDER_STEPS; i += 1) {
  if (length[i] < length[i - 1])
    fail(
      "ladder",
      `step ${i + 1} passages (${length[i].toFixed(0)} words) are shorter than step ${i} (${length[i - 1].toFixed(0)})`,
    );
}
if (sentenceLength[LADDER_STEPS - 1] <= sentenceLength[0] * 1.3)
  fail("ladder", "top-step sentences are not longer than step 1 sentences");
const share = (n) => n / questions;
for (const [i, n] of positions.entries())
  if (share(n) < 0.25 || share(n) > 0.42)
    fail(
      "ladder",
      `correct answers sit in position ${i + 1} ${(share(n) * 100).toFixed(0)}% of the time`,
    );
if (share(longest) > 0.5)
  fail(
    "ladder",
    `the correct choice is the longest in ${(share(longest) * 100).toFixed(0)}% of questions`,
  );
for (const text of strings(ladder))
  if (CLAIM.test(text.replace(ladder.note, "")))
    fail("ladder", `claim wording: "${text.slice(0, 60)}"`);

// ---- Puzzle Den
const den = load("puzzles/puzzles.json");
const seen = new Set();
const oddAt = new Set();
const perBand = {};
for (const p of den.puzzles) {
  const at = `puzzle/${p.id}`;
  if (seen.has(p.id)) fail(at, "duplicate id");
  seen.add(p.id);
  if (!PUZZLE_TYPES.includes(p.type)) fail(at, `unknown type ${p.type}`);
  if (!["3-5", "6-8", "both"].includes(p.band)) fail(at, "band must be 3-5, 6-8 or both");
  if (![1, 2, 3].includes(p.rank)) fail(at, "rank must be 1, 2 or 3");
  if (!p.title || !p.prompt) fail(at, "missing title or prompt");
  if (!Array.isArray(p.hints) || p.hints.length !== 3 || p.hints.some((h) => !h))
    fail(at, "needs exactly three hints");
  for (const band of p.band === "both" ? ["3-5", "6-8"] : [p.band]) {
    perBand[band] ??= {};
    perBand[band][p.type] = (perBand[band][p.type] || 0) + 1;
  }
  const hintText = (p.hints || []).join(" ").toLowerCase();
  if (p.type === "order") {
    if (![".", "?", "!"].includes(p.end)) fail(at, "end must be . ? or !");
    const sorted = (list) => [...list].sort().join("|");
    for (const answer of p.answers) {
      if (sorted(answer) !== sorted(p.tiles))
        fail(at, `answer "${answer.join(" ")}" does not use exactly the tiles`);
      if (hintText.includes(answer.join(" ").toLowerCase()))
        fail(at, "a hint states the whole answer");
      if (answer.every((tile, i) => tile === p.tiles[i]))
        fail(at, "the tiles start in an answer order");
    }
    if (new Set(p.answers.map((a) => a.join(" "))).size !== p.answers.length)
      fail(at, "duplicate answers");
  }
  if (p.type === "grid") {
    if (p.people.length !== p.options.length) fail(at, "people and options must match in number");
    if (new Set(p.people).size !== p.people.length || new Set(p.options).size !== p.options.length)
      fail(at, "duplicate person or option");
    for (const clue of p.clues) {
      const r = clue.rule;
      const named = [r.p, ...(r.ps || [])].filter(Boolean);
      const options = [r.o, ...(r.os || [])].filter(Boolean);
      if (!clue.text) fail(at, "clue without text");
      if (named.some((n) => !p.people.includes(n)) || options.some((o) => !p.options.includes(o)))
        fail(at, `clue "${clue.text}" names an unknown person or option`);
    }
    const solutions = gridSolutions(p);
    if (solutions.length !== 1) fail(at, `has ${solutions.length} solutions, needs exactly 1`);
    for (const i of p.clues.keys()) {
      const without = { ...p, clues: p.clues.filter((_, j) => j !== i) };
      if (gridSolutions(without).length === 1) fail(at, `clue ${i + 1} is not needed`);
    }
  }
  if (p.type === "odd") {
    if (p.words.length !== 4 || new Set(p.words).size !== 4) fail(at, "needs four distinct words");
    if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer > 3)
      fail(at, "answer index out of range");
    if (!p.rule) fail(at, "missing rule");
    oddAt.add(p.answer);
    const target = p.words[p.answer]?.toLowerCase();
    if (target && new RegExp(`\\b${target}\\b`).test(hintText))
      fail(at, "a hint names the answer word");
  }
}
if (oddAt.size < 3) fail("puzzles", "odd-one-out answers use fewer than three positions");
for (const band of ["3-5", "6-8"]) {
  for (const type of PUZZLE_TYPES)
    if ((perBand[band]?.[type] || 0) < 2) fail(`puzzles ${band}`, `fewer than two ${type} puzzles`);
}
for (const text of strings(den))
  if (CLAIM.test(text.replace(den.note, "")))
    fail("puzzles", `claim wording: "${text.slice(0, 60)}"`);

if (errors.length) {
  console.error(`FAIL validate-access-games: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `PASS validate-access-games: ${ladder.passages.length} passages / ${questions} questions, ${den.puzzles.length} puzzles`,
);
