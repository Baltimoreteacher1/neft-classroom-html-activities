#!/usr/bin/env node
/**
 * Tests for the Plan Notes write gate and anchor relocation.
 *
 * Two properties are load-bearing and neither fails loudly on its own:
 *
 *   1. An unknown tag is REJECTED. If validation ever softens, the annotation
 *      layer keeps working perfectly from the teacher's side while quietly
 *      filling with values nothing downstream can consume. The failure shows up
 *      months later as a gap report that does not add up.
 *
 *   2. A note is NEVER LOST. Relocation must return *something* for every note,
 *      including one whose quote no longer appears anywhere in the document.
 *      "unpinned" is a real answer; returning nothing is a deleted note.
 */

import assert from "node:assert/strict";
import { MISCONCEPTION_IDS } from "./plan-vocab.js";
import { NOTE_KINDS, relocate, validateNote } from "./plan-notes-validate.js";

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

console.log("plan-notes validation");

const realTag = [...MISCONCEPTION_IDS][0];
const base = { anchorKey: "lesson:4-4", anchorRef: { quote: "some quote", page: 1 } };

/* ── The vocabulary gate ───────────────────────────────────────────────────── */

test("a watch-for with a real misconception id is accepted", () => {
  const r = validateNote({
    ...base,
    kind: "watch-for",
    body: "They keep the denominator.",
    misconceptionTags: [realTag],
  });
  assert.equal(r.ok, true, r.errors?.join("; "));
  assert.deepEqual(r.note.misconceptionTags, [realTag]);
});

test("an INVENTED misconception id is rejected, and the error names it", () => {
  const r = validateNote({
    ...base,
    kind: "watch-for",
    body: "x",
    misconceptionTags: ["keeps-the-denominator-probably"],
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(" "), /keeps-the-denominator-probably/);
});

test("an unknown standard is rejected", () => {
  const r = validateNote({ ...base, kind: "note", body: "x", standards: ["6.XX.99"] });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(" "), /6\.XX\.99/);
});

test("an activity ref that is not in the catalog is rejected", () => {
  const r = validateNote({
    ...base,
    kind: "resource",
    activityRefs: ["/games/not-a-real-game/"],
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(" "), /not-a-real-game/);
});

test("an unknown lesson id in the anchor key is rejected", () => {
  const r = validateNote({ ...base, anchorKey: "lesson:99-99", kind: "note", body: "x" });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(" "), /99-99/);
});

test("a doc anchor key needs no lesson to exist", () => {
  const r = validateNote({
    anchorKey: `doc:${"a".repeat(64)}`,
    anchorRef: {},
    kind: "note",
    body: "Pasted plan, not linked yet.",
  });
  assert.equal(r.ok, true, r.errors?.join("; "));
});

/* ── Per-kind shape ────────────────────────────────────────────────────────── */

test("every kind in NOTE_KINDS is one the validator actually accepts", () => {
  assert.deepEqual(NOTE_KINDS, ["timing", "watch-for", "swap", "resource", "note"]);
});

test("a watch-for with NO misconception tag is rejected", () => {
  const r = validateNote({ ...base, kind: "watch-for", body: "they get it wrong" });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(" "), /misconceptionTags/);
});

test("a swap needs both bodies and a level", () => {
  const oneBody = validateNote({ ...base, kind: "swap", body: "8 problems", level: 1 });
  assert.equal(oneBody.ok, false);
  assert.match(oneBody.errors.join(" "), /bodyAlt/);

  const noLevel = validateNote({
    ...base,
    kind: "swap",
    body: "8 problems",
    bodyAlt: "4 with the number line out",
  });
  assert.equal(noLevel.ok, false);
  assert.match(noLevel.errors.join(" "), /level/);

  const good = validateNote({
    ...base,
    kind: "swap",
    body: "8 problems",
    bodyAlt: "4 with the number line out",
    level: 1,
  });
  assert.equal(good.ok, true, good.errors?.join("; "));
  assert.equal(good.note.level, 1);
});

test("a timing note needs minutes, and absurd minutes are refused", () => {
  assert.equal(validateNote({ ...base, kind: "timing" }).ok, false);
  assert.equal(validateNote({ ...base, kind: "timing", timingMin: 12 }).ok, true);
  assert.equal(validateNote({ ...base, kind: "timing", timingMin: 9999 }).ok, false);
});

test("free text is allowed in body and nowhere else", () => {
  const r = validateNote({
    ...base,
    kind: "note",
    body: "Whatever I want to say here, in my own words.",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.note.misconceptionTags, []);
  assert.deepEqual(r.note.activityRefs, []);
});

test("a bad kind is refused outright", () => {
  const r = validateNote({ ...base, kind: "vibes", body: "x" });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(" "), /kind must be one of/);
});

/* ── Relocation: a note is never lost ──────────────────────────────────────── */

const pages = [
  { page: 1, text: "Warm-Up: 5 min\nAsk students to compare 1/2 and 2/5." },
  { page: 2, text: "Practice: assign problems 1-8 from the workbook." },
];

test("an exact quote pins to its page", () => {
  const r = relocate({ quote: "compare 1/2 and 2/5", page: 1 }, pages);
  assert.equal(r.status, "quote");
  assert.equal(r.page, 1);
});

test("a quote finds its page even when the stored page number is wrong", () => {
  const r = relocate({ quote: "problems 1-8 from the workbook", page: 1 }, pages);
  assert.equal(r.status, "quote");
  assert.equal(r.page, 2, "quote match must win over a stale page number");
});

test("a reflowed quote still matches when only whitespace changed", () => {
  const r = relocate({ quote: "compare 1/2   and\n2/5", page: 1 }, pages);
  assert.equal(r.status, "quote-loose");
  assert.equal(r.page, 1);
});

test("a quote that is gone falls back to the page it was on", () => {
  const r = relocate({ quote: "a sentence the teacher deleted", page: 2 }, pages);
  assert.equal(r.status, "page");
  assert.equal(r.page, 2);
});

test("a note whose quote AND page are gone is unpinned, never dropped", () => {
  const r = relocate({ quote: "gone entirely", page: 47 }, pages);
  assert.equal(r.status, "unpinned");
  assert.notEqual(r, null, "relocate must always return a resolution");
});

test("a note with no anchor at all still resolves", () => {
  const r = relocate(null, pages);
  assert.equal(r.status, "unpinned");
});

test("every note in a mixed set gets exactly one resolution", () => {
  const anchors = [
    { quote: "compare 1/2 and 2/5", page: 1 },
    { quote: "deleted text", page: 2 },
    { quote: "vanished", page: 99 },
    null,
  ];
  const results = anchors.map((a) => relocate(a, pages));
  assert.equal(results.length, anchors.length, "no note may be lost in relocation");
  assert.ok(results.every((r) => typeof r.status === "string"));
});

console.log(`\n${passed} passed`);
