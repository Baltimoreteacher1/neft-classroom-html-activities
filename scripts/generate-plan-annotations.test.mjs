#!/usr/bin/env node
/**
 * The rollup's one non-negotiable property: the teacher's own words never leave
 * D1. `body` and `bodyAlt` are Joel writing about his own classes; only the
 * controlled-vocabulary fields are published into data/plan-annotations.json.
 *
 * This is asserted rather than left as a convention because the failure is
 * silent — a rollup that started including note bodies would look completely
 * normal, and the free text would just quietly be in a committed file.
 */

import assert from "node:assert/strict";
import { rollup } from "./generate-plan-annotations.mjs";

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
};

console.log("plan-annotations rollup");

const SECRET = "Period 3 always melts down here, especially after lunch";

const rows = [
  {
    anchor_key: "lesson:4-4",
    kind: "watch-for",
    misconception_tags: '["fraction-keep-denominator"]',
    standards: "[]",
    activity_refs: "[]",
    level: null,
    timing_min: null,
    origin: "hand",
    body: SECRET,
    body_alt: "",
  },
  {
    anchor_key: "lesson:4-4",
    kind: "swap",
    misconception_tags: "[]",
    standards: "[]",
    activity_refs: "[]",
    level: 1,
    timing_min: null,
    origin: "ai",
    body: SECRET,
    body_alt: SECRET,
  },
  {
    anchor_key: "lesson:4-4",
    kind: "timing",
    misconception_tags: "[]",
    standards: "[]",
    activity_refs: "[]",
    level: null,
    timing_min: 12,
    origin: "hand",
  },
  {
    anchor_key: "doc:abc",
    kind: "watch-for",
    misconception_tags: '["fraction-keep-denominator","decimal-place-value"]',
    standards: "[]",
    activity_refs: '["/games/factor-frenzy/"]',
    level: null,
    timing_min: null,
    origin: "hand",
  },
];

const out = rollup(rows);
const serialized = JSON.stringify(out);

test("no note body reaches the rollup", () => {
  assert.equal(
    serialized.includes(SECRET),
    false,
    "free text leaked into data/plan-annotations.json",
  );
  assert.equal(serialized.includes("body"), false, "a body field leaked into the rollup");
});

test("plans are grouped by anchor and counted", () => {
  assert.equal(out.planCount, 2);
  assert.equal(out.noteCount, 4);
  const l44 = out.plans.find((p) => p.anchorKey === "lesson:4-4");
  assert.equal(l44.noteCount, 3);
  assert.equal(l44.lessonId, "4-4");
});

test("AI-drafted notes stay distinguishable from hand-written ones", () => {
  const l44 = out.plans.find((p) => p.anchorKey === "lesson:4-4");
  assert.equal(l44.aiDrafted, 1, "the rollup must not blur drafted notes into hand-written ones");
});

test("minutes and levels roll up", () => {
  const l44 = out.plans.find((p) => p.anchorKey === "lesson:4-4");
  assert.equal(l44.notedMinutes, 12);
  assert.deepEqual(l44.levelsAddressed, [1]);
});

test("misconceptions are deduped per plan and ranked across plans", () => {
  const top = out.misconceptionsByFrequency[0];
  assert.equal(top.tag, "fraction-keep-denominator");
  assert.equal(top.plans, 2, "a tag on two plans must count twice, not once");
  assert.deepEqual(top.lessons, ["4-4"], "only linked plans contribute a lesson id");
});

test("a doc anchor with no lesson link still rolls up", () => {
  const doc = out.plans.find((p) => p.anchorKey === "doc:abc");
  assert.equal(doc.lessonId, null);
  assert.deepEqual(doc.activities, ["/games/factor-frenzy/"]);
});

test("an empty database produces an empty rollup, not a crash", () => {
  const empty = rollup([]);
  assert.equal(empty.planCount, 0);
  assert.deepEqual(empty.plans, []);
});

console.log(`\n${passed} passed`);
