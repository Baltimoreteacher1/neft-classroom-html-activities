#!/usr/bin/env node
// Unit tests for the ACCESS Practice Lab's pure logic: scoring, answer
// reducers, order seeding, teaching order, and the content index. Runs in
// `npm test`; the browser walk is tools/access-lab-e2e.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeWriting,
  correctAnswerText,
  isAnswered,
  isCorrect,
} from "../access-practice-lab/src/grade.js";
import { initialOrder, reduceAnswer } from "../access-practice-lab/src/items.js";
import { bandOfId } from "../access-practice-lab/src/util.js";
import { allActivities, buildIndex, orderedActivities } from "./lib/access-lab-content.mjs";

const mc = {
  id: "m",
  type: "multipleChoice",
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  answer: "b",
};
const ms = {
  id: "s",
  type: "multiSelect",
  options: [{ id: "a" }, { id: "b" }, { id: "c" }],
  answers: ["a", "c"],
};
const order = {
  id: "water",
  type: "order",
  items: [
    { id: "1", text: "one" },
    { id: "2", text: "two" },
    { id: "3", text: "three" },
  ],
  answer: ["1", "2", "3"],
};
const cloze = {
  id: "c",
  type: "cloze",
  segments: [{ text: "It is " }, { blank: { id: "b1", options: ["hot", "cold"], answer: "cold" } }],
};
const sort = {
  id: "so",
  type: "sort",
  categories: ["X", "Y"],
  items: [
    { id: "i1", text: "p", answer: "X" },
    { id: "i2", text: "q", answer: "Y" },
  ],
};
const fakeInput = (value, attrs = {}) => ({
  value,
  matches: (sel) => sel === "[data-ans-choice]",
  closest: () => null,
  dataset: {},
  ...attrs,
});
const fakeButton = (attr, dataset) => ({
  matches: () => false,
  closest: (sel) => (sel === `[${attr}]` ? { dataset } : null),
});

test("scoring per type", () => {
  assert.equal(isCorrect(mc, "b"), true);
  assert.equal(isCorrect(mc, "a"), false);
  assert.equal(isCorrect(ms, ["c", "a"]), true, "multi-select ignores order");
  assert.equal(isCorrect(ms, ["a"]), false);
  assert.equal(isCorrect(order, ["1", "2", "3"]), true);
  assert.equal(isCorrect(order, ["2", "1", "3"]), false);
  assert.equal(isCorrect(cloze, { b1: "cold" }), true);
  assert.equal(isCorrect(sort, { i1: "X", i2: "Y" }), true);
  assert.equal(isCorrect(sort, { i1: "X" }), false);
});

test("answered detection", () => {
  assert.equal(isAnswered(mc, undefined), false);
  assert.equal(isAnswered(mc, "a"), true);
  assert.equal(isAnswered({ type: "constructed" }, "   "), false);
  assert.equal(isAnswered(cloze, { b1: "" }), false);
});

test("correct answer text is human-readable", () => {
  assert.equal(correctAnswerText(mc), "B");
  assert.match(correctAnswerText(order), /^1\. one/);
});

test("multi-select toggles by membership, not by the input's checked state", () => {
  // A click is handled directly (default prevented), so input.checked is stale.
  let a = reduceAnswer(ms, undefined, fakeInput("a", { checked: false }));
  assert.deepEqual(a, ["a"]);
  a = reduceAnswer(ms, a, fakeInput("a", { checked: true }));
  assert.deepEqual(a, []);
});

test("order moves and seeding", () => {
  const seed = initialOrder(order);
  assert.notDeepEqual(seed, order.answer, "the seeded order is never already solved");
  assert.deepEqual([...seed].sort(), ["1", "2", "3"]);
  assert.deepEqual(initialOrder(order), seed, "seeding is deterministic");
  const moved = reduceAnswer(
    order,
    ["1", "3", "2"],
    fakeButton("data-ans-move", { ansMove: "2", dir: "-1" }),
  );
  assert.deepEqual(moved, ["1", "2", "3"]);
});

test("sort chips set one category per item", () => {
  const next = reduceAnswer(
    sort,
    { i1: "Y" },
    fakeButton("data-ans-sort", { ansSort: "i1", cat: "X" }),
  );
  assert.deepEqual(next, { i1: "X" });
});

test("writing feedback counts, never grades", () => {
  const r = analyzeWriting(
    "First we plant seeds. Then they grow because of sun and water.",
    { wordBank: ["seeds", "grow"] },
    "A",
  );
  assert.ok(r.usedWords.includes("seeds"));
  assert.ok(r.connectors.includes("because"));
  assert.equal(r.checks.length, 4);
});

test("band is decided by id prefix", () => {
  assert.equal(bandOfId("g35-l-a-x"), "3-5");
  assert.equal(bandOfId("classroom-directions"), "6-8");
});

test("teaching order follows category strands and keeps every activity", () => {
  const level = {
    categories: [{ activityIds: ["b", "a"] }],
    activities: [{ id: "a" }, { id: "b" }, { id: "c" }],
  };
  assert.deepEqual(
    orderedActivities(level).map((a) => a.id),
    ["b", "a", "c"],
  );
});

test("content: ids unique, both bands present, index lists every activity", () => {
  const all = allActivities();
  const ids = all.map((x) => x.activity.id);
  assert.equal(new Set(ids).size, ids.length);
  const index = buildIndex();
  assert.ok(index.bands["3-5"] && index.bands["6-8"]);
  const indexed = Object.values(index.bands).flatMap((b) =>
    Object.values(b.domains).flatMap((d) =>
      Object.values(d.levels).flatMap((l) => l.activities.map((r) => r[0])),
    ),
  );
  assert.equal(indexed.length, ids.length);
});
