#!/usr/bin/env node
/* =============================================================================
 * invent-first.test.mjs — strategy detection, and the promises around it.
 * -----------------------------------------------------------------------------
 * A classifier that shows a child "your way looks like X" must be right when it
 * speaks and quiet when it is not sure. These tests pin:
 *   • a table of move sets → strategy, including the ambiguous ones, which must
 *     answer "unsure" and never pick a favourite;
 *   • determinism (order, repeat, no mutation) and robustness to junk;
 *   • that the methods it can name are the lesson's OWN words, literally;
 *   • that nothing it produces states the problem's answer.
 * The scene itself is covered in invent-scene.test.mjs.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  classifyStrategy,
  inventFirstToolFor,
  LIMITS,
  normalizeMoves,
  PILOT_LESSONS,
  SIGNALS,
  validateConfig,
} from "./invent-first.js";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const config = read("../../data/invent-first/4-3.json");
const lesson = read("../../lessons/4-3/config.json");

// The problem is 23% of $240. In your head: 10% = 24, 5% = 12, 20% = 48,
// 25% = 60, 50% = 120.
const m = (p, x = null) => ({ p, x });

// ── the table ────────────────────────────────────────────────────────────────
const CASES = [
  {
    name: "a friendly percent close to 23%, estimate at its amount",
    moves: { marks: [m(25, 60)], estimate: 60 },
    id: "benchmark",
    thinking: "scaling",
  },
  {
    name: "a friendly percent with no amount typed — the amount is read from the whole",
    moves: { marks: [m(25)], estimate: 62 },
    id: "benchmark",
  },
  {
    name: "an estimate that sits between two friendly marks, at neither",
    moves: { marks: [m(10, 24), m(25, 60)], estimate: 45 },
    id: "between",
    thinking: "scaling",
  },
  {
    name: "built up from 10% and the pieces added",
    moves: { marks: [m(10, 24), m(20, 48), m(2, 5)], estimate: 53 },
    id: "ten-chunks",
    thinking: "adding",
    also: ["combine", "halving"],
  },
  {
    name: "friendly pieces added to about 23%",
    moves: { marks: [m(20, 48), m(5, 12)], estimate: 60 },
    id: "combine",
    thinking: "adding",
  },
  {
    name: "a mark halved, and the estimate not at a benchmark",
    moves: { marks: [m(50, 120), m(25, 60)], estimate: 30 },
    id: "halving",
    thinking: "scaling",
  },
  {
    name: "a mark doubled",
    moves: { marks: [m(10, 24), m(20, 48)], estimate: 80 },
    id: "halving",
  },
  {
    name: "an easier number for the whole, nothing else",
    moves: { marks: [], whole: 250, estimate: 58 },
    id: "compatible",
    thinking: null,
  },
  {
    name: "an easier whole AND a friendly percent: the lesson's both-together",
    moves: { marks: [m(25, 62.5)], whole: 250, estimate: 62 },
    id: "both",
    also: ["benchmark", "compatible"],
  },
  {
    name: "three tries at the target percent with different amounts",
    moves: { marks: [m(23, 50), m(23, 55), m(23, 58)], estimate: 58 },
    id: "guess-check",
    thinking: null,
  },
  // ── doubt must be spoken, not guessed away ────────────────────────────────
  {
    name: "benchmark and ten-chunks equally specific: unsure, both named",
    moves: { marks: [m(10, 24), m(20, 48), m(5, 12), m(25, 60)], estimate: 60 },
    id: "unsure",
    candidates: ["benchmark", "ten-chunks"],
  },
  {
    name: "halving and combining tie: unsure",
    moves: { marks: [m(40, 96), m(20, 48), m(5, 12)], estimate: 60 },
    id: "unsure",
    candidates: ["combine", "halving"],
  },
  { name: "nothing entered", moves: {}, id: "unsure", candidates: [] },
  { name: "only an estimate", moves: { marks: [], estimate: 55 }, id: "unsure", candidates: [] },
  {
    name: "marks with no pattern",
    moves: { marks: [m(3, 1), m(61, 9), m(88, 400)], estimate: 7 },
    id: "unsure",
    candidates: [],
  },
  {
    name: "two tries at 23% is not yet guess-and-check",
    moves: { marks: [m(23, 50), m(23, 55)], estimate: 55 },
    id: "unsure",
    candidates: [],
  },
  {
    name: "three tries with the same amount are not guesses",
    moves: { marks: [m(23, 50), m(23, 50), m(23, 50)], estimate: 50 },
    id: "unsure",
    candidates: [],
  },
  // ── the edges of each rule ────────────────────────────────────────────────
  {
    name: "a benchmark 5 points away still counts as near",
    moves: { marks: [m(25, 60)], estimate: 60 },
    id: "benchmark",
  },
  {
    name: "a benchmark 6 points away does not",
    moves: { marks: [m(50, 120), m(75, 180)], estimate: 120 },
    id: "unsure",
    candidates: [],
  },
  {
    name: "an estimate 11.7% off the benchmark amount is still at it",
    moves: { marks: [m(25, 60)], estimate: 67 },
    id: "benchmark",
  },
  {
    name: "an estimate 13.3% off is not, and not between either",
    moves: { marks: [m(25, 60)], estimate: 68 },
    id: "unsure",
    candidates: [],
  },
  {
    name: "a whole 25% away counts as an easier number",
    moves: { marks: [], whole: 300, estimate: 70 },
    id: "compatible",
  },
  {
    name: "a whole 26% away is a different number, not an easier one",
    moves: { marks: [], whole: 302, estimate: 70 },
    id: "unsure",
    candidates: [],
  },
  {
    name: "the same whole typed back is not a change",
    moves: { marks: [], whole: 240, estimate: 55 },
    id: "unsure",
    candidates: [],
  },
];

for (const c of CASES) {
  test(`detects: ${c.name}`, () => {
    const out = classifyStrategy(config, c.moves);
    assert.equal(out.id, c.id, `${c.name}: got ${out.id} (${out.candidates})`);
    if ("thinking" in c) assert.equal(out.thinking, c.thinking);
    if (c.also) assert.deepEqual([...out.also].sort(), [...c.also].sort());
    if (c.candidates) assert.deepEqual([...out.candidates].sort(), [...c.candidates].sort());
    if (c.id !== "unsure") assert.deepEqual(out.candidates, []);
  });
}

test("adding and scaling are told apart: sums of pieces add, halves and doubles scale", () => {
  const strategies = Object.fromEntries(config.strategies.map((s) => [s.id, s.thinking]));
  assert.equal(strategies["ten-chunks"], "adding");
  assert.equal(strategies.combine, "adding");
  for (const id of ["benchmark", "between", "halving", "both"]) {
    assert.equal(strategies[id], "scaling", id);
  }
});

// ── determinism and robustness ───────────────────────────────────────────────
test("the answer does not depend on the order the marks were added", () => {
  for (const c of CASES) {
    const marks = c.moves.marks || [];
    const reversed = classifyStrategy(config, { ...c.moves, marks: [...marks].reverse() });
    const forward = classifyStrategy(config, c.moves);
    assert.equal(reversed.id, forward.id, c.name);
    assert.deepEqual([...reversed.candidates].sort(), [...forward.candidates].sort(), c.name);
  }
});

test("the same moves always give the same answer, and the input is left alone", () => {
  const moves = { marks: [m(10, 24), m(25, 60)], estimate: 45 };
  const frozen = JSON.stringify(moves);
  const first = JSON.stringify(classifyStrategy(config, moves));
  for (let i = 0; i < 50; i += 1) assert.equal(JSON.stringify(classifyStrategy(config, moves)), first);
  assert.equal(JSON.stringify(moves), frozen);
});

test("junk never throws and never invents a strategy", () => {
  const junk = [
    null,
    undefined,
    42,
    "x",
    { marks: "no" },
    { marks: [null, 1, "a", {}, { p: "abc" }, { p: -5 }, { p: 0 }, { p: 9999, x: "q" }] },
    { marks: [{ p: 25, x: -1 }], estimate: "lots", whole: -3 },
    { marks: [{ p: Number.NaN, x: Number.POSITIVE_INFINITY }], estimate: Number.NaN },
  ];
  for (const raw of junk) {
    const out = classifyStrategy(config, raw);
    assert.equal(out.id, "unsure", JSON.stringify(raw));
  }
});

test("fuzz: 3,000 random move sets always return a known id and are repeatable", () => {
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const known = new Set([...config.strategies.map((s) => s.id), "unsure"]);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  for (let i = 0; i < 3000; i += 1) {
    const marks = Array.from({ length: Math.floor(rand() * 7) }, () => ({
      p: pick([1, 5, 10, 20, 23, 25, 30, 50, 75, 100, Math.round(rand() * 120)]),
      x: rand() < 0.2 ? null : Math.round(rand() * 400 * 100) / 100,
    }));
    const moves = {
      marks,
      estimate: rand() < 0.2 ? null : Math.round(rand() * 300),
      whole: rand() < 0.3 ? pick([200, 230, 250, 300, 240]) : null,
    };
    const a = classifyStrategy(config, moves);
    assert.ok(known.has(a.id), `unknown id ${a.id}`);
    assert.deepEqual(a, classifyStrategy(config, moves));
    if (a.id === "unsure") assert.ok(Array.isArray(a.candidates));
  }
});

test("moves are cleaned, not repaired", () => {
  const out = normalizeMoves({
    marks: [
      { p: "25", x: "60" },
      { p: 25, x: "" },
      { p: 0.004, x: 3 },
      { p: 300, x: 1 },
      { p: 10, x: -4 },
      { p: "ten", x: 4 },
    ],
    whole: "250",
    estimate: "  ",
  });
  assert.deepEqual(out.marks, [
    { p: 25, x: 60 },
    { p: 25, x: null },
    { p: 10, x: null },
  ]);
  assert.equal(out.whole, 250);
  assert.equal(out.estimate, null);
  const many = normalizeMoves({ marks: Array.from({ length: 40 }, () => ({ p: 10 })) });
  assert.equal(many.marks.length, LIMITS.marks);
});

// ── the config is a contract ─────────────────────────────────────────────────
test("the 4-3 file meets the contract, and every pilot lesson has a file", () => {
  assert.deepEqual(validateConfig(config), []);
  assert.equal(config.lesson, "4-3");
  for (const id of PILOT_LESSONS) {
    assert.equal(read(`../../data/invent-first/${id}.json`).lesson, id);
  }
});

test("the contract fails the shapes that would shortchange a student", () => {
  const edit = (mutate) => {
    const copy = structuredClone(config);
    mutate(copy);
    return validateConfig(copy);
  };
  const bites = (problems, pattern) => assert.ok(problems.some((p) => pattern.test(p)), problems.join("\n"));
  bites(edit((c) => delete c.title.es), /title needs en and es/);
  bites(edit((c) => (c.strategies[0].name.es = "")), /bilingual name/);
  bites(edit((c) => (c.strategies[0].needs = ["telepathy"])), /known signals/);
  bites(edit((c) => (c.strategies[0].method = "nope")), /unknown lesson method/);
  bites(edit((c) => c.strategies.push({ ...c.strategies[0] })), /duplicated or reserved/);
  bites(edit((c) => (c.strategies[1].id = "unsure")), /duplicated or reserved/);
  bites(edit((c) => (c.methods[0].quote.es = "")), /bilingual name and quote/);
  bites(edit((c) => (c.unsure.mixed.es = "")), /unsure.mixed/);
  bites(edit((c) => (c.tolerance.estimate = 0)), /tolerance.estimate/);
  bites(edit((c) => (c.problem.percent = 100)), /problem needs/);
  bites(edit((c) => (c.schemaVersion = 2)), /schemaVersion/);
  assert.deepEqual(validateConfig(null).length > 0, true);
});

test("every signal a strategy needs exists, and every signal is used by some strategy", () => {
  const used = new Set(config.strategies.flatMap((s) => s.needs));
  for (const need of used) assert.ok(need in SIGNALS, need);
  for (const name of Object.keys(SIGNALS)) {
    if (name === "estimateBetween" || name === "bracketBenchmarks") assert.ok(used.has("estimateBetween"));
    else assert.ok(used.has(name) || ["nearBenchmark", "estimateAtBenchmark"].includes(name), `${name} unused`);
  }
});

// ── the methods are the lesson's own words ───────────────────────────────────
const leaves = (value, out = []) => {
  if (typeof value === "string") out.push(value);
  else if (value && typeof value === "object") for (const v of Object.values(value)) leaves(v, out);
  return out;
};
const lessonText = leaves(lesson);
const inLesson = (quote) => lessonText.some((text) => text.includes(quote));

test("each method quotes the lesson literally, in English and in Spanish", () => {
  for (const method of config.methods) {
    assert.ok(inLesson(method.quote.en), `${method.id}: English quote is not in lessons/4-3`);
    assert.ok(inLesson(method.quote.es), `${method.id}: Spanish quote is not in lessons/4-3`);
  }
});

test("the names the scene uses for the lesson's two core ideas are the lesson's vocabulary", () => {
  const term = (name) => lesson.vocabulary.find((v) => v.term === name);
  const benchmark = config.methods.find((x) => x.id === "benchmark").name;
  const compatible = config.methods.find((x) => x.id === "compatible").name;
  assert.equal(benchmark.en.toLowerCase(), term("benchmark percent").term);
  assert.equal(benchmark.es.toLowerCase(), term("benchmark percent").termEs);
  assert.equal(compatible.en.toLowerCase(), term("compatible numbers").term);
  assert.equal(compatible.es.toLowerCase(), term("compatible numbers").termEs);
});

test("the practice problem is new: the lesson's own examples are not reused", () => {
  assert.ok(!lessonText.some((t) => t.includes("23%")), "the lesson already uses 23%");
  assert.ok(!lessonText.some((t) => t.includes("$240")), "the lesson already uses $240");
});

test("the Spanish is its own writing, not the English copied across", () => {
  const pairs = [];
  const walk = (node) => {
    if (node && typeof node === "object") {
      if (typeof node.en === "string" && typeof node.es === "string") pairs.push(node);
      for (const v of Object.values(node)) walk(v);
    }
  };
  walk(config);
  assert.ok(pairs.length > 40, `only ${pairs.length} bilingual strings`);
  for (const pair of pairs) assert.notEqual(pair.en, pair.es, pair.en);
});

test("no timer, score or pressure language anywhere in the file", () => {
  const text = JSON.stringify(config).toLowerCase();
  for (const word of ["timer", "countdown", "seconds", "hurry", "score", "points", "wrong", "incorrect"]) {
    if (word === "timer") {
      // "there is no timer" is the promise itself.
      assert.ok(text.includes("no hay cronómetro") && text.includes("no timer"));
      continue;
    }
    assert.ok(!text.includes(word), `"${word}" found`);
  }
});

// ── it must never hand over the answer ───────────────────────────────────────
test("nothing the classifier returns states the problem's answer", () => {
  const exact = (config.problem.percent / 100) * config.problem.whole; // 55.2
  for (const c of CASES) {
    const out = JSON.stringify(classifyStrategy(config, c.moves));
    assert.ok(!out.includes(String(exact)), `${c.name} leaks ${exact}`);
    assert.ok(!/answer|exact|correct/i.test(Object.keys(classifyStrategy(config, c.moves)).join()));
  }
});

// ── offered to pilot lessons only ────────────────────────────────────────────
test("the scene is offered to lesson 4-3 and its variants, nowhere else", () => {
  for (const id of ["4-3", "4-3-group1", "4-3-group2", "4-3-part2", "4-3-catchup"]) {
    assert.deepEqual(inventFirstToolFor({ lessonId: id }), { kind: "invent-first", lesson: "4-3" });
  }
  for (const id of ["4-2", "4-4", "4-30", "3-4-3", "14-3", "", undefined, null]) {
    assert.equal(inventFirstToolFor({ lessonId: id }), null, String(id));
  }
  assert.equal(inventFirstToolFor(null), null);
});
