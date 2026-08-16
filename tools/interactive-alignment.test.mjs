#!/usr/bin/env node
/**
 * interactive-alignment.test.mjs — the detectors behind validate:interactive-alignment,
 * plus the two properties that gate cannot state about itself.
 *
 * 1. CROSS-LESSON LEAKAGE. Lesson 1-4's trapezoid carried the label "Garden
 *    footprint…" — a context from a different lesson entirely. That is the
 *    generic failure: a tool configuration copied from one lesson to another,
 *    bringing its numbers, its labels and its story with it. The tests below use
 *    deliberately unlike lessons (a surface-area lesson and an absolute-value
 *    lesson) so a leak is unmistakable rather than arguable.
 *
 * 2. VARIANT DRIFT. Small-group variants inherit the parent's tools, so a parent
 *    defect arrives in triplicate — and a variant that quietly authors DIFFERENT
 *    mathematics from its parent is the opposite failure. Neither is caught by
 *    any per-lesson check, because each file is internally consistent.
 *
 * Differentiation is protected on purpose: a variant using a more concrete
 * representation than its parent is correct and must not be flagged. What is
 * flagged is a variant pointing at a different mathematical TOPIC.
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractElements,
  labelContextMisses,
  lessonNumbers,
  lessonText,
  loadStandardTopics,
  readFleet,
  TOOL_TOPICS,
  toolNumbers,
  topicAgrees,
  withoutInteractives,
} from "./lib/interactive-alignment.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const topics = loadStandardTopics(ROOT);
const fleet = readFleet(ROOT);
const byId = new Map(fleet.map((l) => [l.id, l]));

let passed = 0;
function t(name, fn) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const bareText = (id) => lessonText(withoutInteractives(byId.get(id).config));
const bareNumbers = (id) => lessonNumbers(withoutInteractives(byId.get(id).config));

/* ── The fleet is actually being read ──────────────────────────────────────── */

t("the sweep sees the whole fleet, not a subset", () => {
  assert.equal(fleet.filter((l) => l.canonical).length, 84, "canonical lesson count moved");
  assert.equal(fleet.filter((l) => !l.canonical).length, 204, "variant count moved");
  const elements = fleet.reduce((n, l) => n + extractElements(l.config).length, 0);
  assert.ok(
    elements > 900,
    `only ${elements} interactive elements found — the reader has stopped matching`,
  );
});

/* ── Cross-lesson leakage ──────────────────────────────────────────────────── */

t("a label from another lesson is detected as foreign", () => {
  // 5-6 is surface area of a gift box; 7-3 is absolute value at sea level.
  // Nothing about one belongs in the other.
  const giftBox = { label: "Gift Box Face Pairs in square inches" };
  const ownLesson = labelContextMisses(giftBox, bareText("5-6"));
  const foreign = labelContextMisses(giftBox, bareText("7-3"));
  assert.deepEqual(ownLesson, [], "the label was called foreign in its OWN lesson");
  assert.ok(foreign.length > 0, "a gift-box label was accepted in a sea-level lesson");
  assert.ok(foreign.includes("gift"), `expected "gift" to be foreign to 7-3, got ${foreign}`);
});

t("numbers from another lesson are detected as foreign", () => {
  // 5-7's chest is 3 x 2 x 2 ft with a 32 sq ft surface; 2-1 is a statistics
  // lesson that never mentions any of it.
  const chest = { kind: "bar-chart", a: 12, b: 8, total: 32 };
  const here = [...toolNumbers(chest).values()].filter((v) => bareNumbers("5-7").has(v));
  const there = [...toolNumbers(chest).values()].filter((v) => bareNumbers("2-1").has(v));
  assert.ok(here.length > 0, "the chest's own numbers were not found in its own lesson");
  assert.ok(there.length < here.length, "a foreign lesson matched the numbers just as well");
});

t("the leak that shipped is caught, in the lesson it shipped in", () => {
  // Verbatim, as it was in production.
  const shipped = {
    kind: "area-morph",
    figure: "trapezoid",
    b: 6,
    a: 4,
    h: 2,
    unit: "ft",
    label: "Garden footprint: the 6 ft bed and the 4 ft bed share a 2 ft width",
  };
  assert.ok(
    labelContextMisses(shipped, bareText("1-4")).includes("footprint"),
    "the foreign context is no longer detected",
  );
  assert.equal(
    topicAgrees("area-morph", byId.get("1-4").config.standard, topics),
    false,
    "a plane-area tool on a volume lesson is no longer a topic mismatch",
  );
});

t("no lesson currently mounts a tool whose topic contradicts its standard", () => {
  const bad = [];
  for (const lesson of fleet) {
    for (const el of extractElements(lesson.config)) {
      if (!topicAgrees(el.key, lesson.config.standard, topics)) {
        bad.push(`${lesson.id} ${el.slot} ${el.key}`);
      }
    }
  }
  assert.deepEqual(bad, [], `tools teaching different mathematics from their lesson: ${bad}`);
});

/* ── Variant drift ─────────────────────────────────────────────────────────── */

t("no variant points at different mathematics from its parent", () => {
  // Differentiation is protected: a variant may use a MORE CONCRETE tool than its
  // parent, and a different `kind` in the same slot is expected and fine. What is
  // not fine is a variant whose tool serves a topic the parent's mathematics
  // does not, which is a scaffold that has become a different lesson.
  const drift = [];
  for (const lesson of fleet) {
    if (!lesson.parent) continue;
    const parent = byId.get(lesson.parent);
    if (!parent) continue;
    for (const el of extractElements(lesson.config)) {
      if (topicAgrees(el.key, parent.config.standard, topics)) continue;
      drift.push(
        `${lesson.id} ${el.slot} ${el.key} (parent ${parent.id} is ${parent.config.standard})`,
      );
    }
  }
  assert.deepEqual(drift, [], `variants drifted from their parent's mathematics: ${drift}`);
});

t("a variant inheriting a corrected parent tool has the corrected one", () => {
  const parent = extractElements(byId.get("1-4").config).find((e) => e.slot === "practice.diagram");
  for (const id of ["1-4-group1", "1-4-group2"]) {
    const child = extractElements(byId.get(id).config).find((e) => e.slot === "practice.diagram");
    assert.equal(child.key, parent.key, `${id} did not inherit the corrected practice tool`);
    assert.notEqual(child.key, "area-morph", `${id} still mounts the removed area explorer`);
  }
});

/* ── The detectors' own honesty ────────────────────────────────────────────── */

t("an unknown tool kind or standard yields no opinion, never a false pass claim", () => {
  assert.equal(topicAgrees("some-new-widget", "6.GR.1", topics), true);
  assert.equal(topicAgrees("area-morph", "NOT.A.STANDARD", topics), true);
  // A practice standard constrains no representation, so it must not flag.
  assert.equal(topicAgrees("area-morph", "MPP.3", topics), true);
});

t("every topic named in TOOL_TOPICS exists in the standards registry", () => {
  const known = new Set(topics.values());
  const unknown = new Set();
  for (const list of Object.values(TOOL_TOPICS)) {
    for (const topic of list) if (!known.has(topic)) unknown.add(topic);
  }
  assert.deepEqual([...unknown], [], `TOOL_TOPICS names topics no standard has: ${[...unknown]}`);
});

t("stripping interactives does not damage the rest of the lesson", () => {
  const full = byId.get("1-4").config;
  const bare = withoutInteractives(full);
  assert.equal(bare.title, full.title);
  assert.equal(bare.standard, full.standard);
  assert.equal(bare.practice.approaching.length, full.practice.approaching.length);
  assert.equal(bare.practice.diagram, undefined, "the tool survived the strip");
});

console.log(`\ninteractive-alignment: ${passed} assertions passed.`);
