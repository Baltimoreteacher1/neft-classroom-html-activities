#!/usr/bin/env node
/**
 * generator-safety.test.mjs — the BEHAVIOUR the source-level gate cannot prove.
 *
 * validate:generator-safety greps for the containment assertion and the overlay
 * merge. A grep proves the code is present, never that it works — and the two
 * defects this exists for both shipped with correct-looking code in the file.
 * So these tests drive the merge itself, with the shapes that actually broke:
 *
 *   - the Spanish overlay, which lives INSIDE practice items, several levels
 *     down inside arrays;
 *   - `launch.conceptIntro.interactiveVisual`, a lesson's explicit statement of
 *     which tool it wants, which regeneration deleted three days after it was
 *     authored;
 *   - array reordering, where merging by INDEX would be worse than losing the
 *     data: it attaches the Spanish for one question to a different question,
 *     and a student reads a correct-looking answer to a question nobody asked.
 */
import assert from "node:assert/strict";
import { authoredPaths, mergeAuthoredOverlay } from "./lib/authored-overlay.mjs";
import {
  assertWriteSetContained,
  recordWrite,
  resetWriteSet,
  setWriteSetRoot,
} from "./lib/write-set.mjs";

let passed = 0;
function t(name, fn) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

/* ── The overlay ───────────────────────────────────────────────────────────── */

t("the Spanish overlay survives regeneration, nested inside practice items", () => {
  const generated = {
    practice: { onLevel: [{ id: "q1", stem: "What is 2 x 3?", choices: ["6", "5"] }] },
  };
  const prior = {
    practice: {
      onLevel: [
        {
          id: "q1",
          stem: "What is 2 x 3?",
          choices: ["6", "5"],
          stemEs: "¿Cuánto es 2 x 3?",
          choicesEs: ["6", "5"],
          hintsEs: ["Multiplica."],
        },
      ],
    },
  };
  const merged = mergeAuthoredOverlay(generated, prior);
  assert.equal(merged.practice.onLevel[0].stemEs, "¿Cuánto es 2 x 3?");
  assert.deepEqual(merged.practice.onLevel[0].hintsEs, ["Multiplica."]);
});

t("an authored interactiveVisual survives regeneration", () => {
  const generated = { launch: { conceptIntro: { heading: "New heading" } } };
  const prior = {
    launch: {
      conceptIntro: { heading: "Old heading", interactiveVisual: { kind: "prism-volume", l: 2 } },
    },
  };
  const merged = mergeAuthoredOverlay(generated, prior);
  assert.equal(merged.launch.conceptIntro.heading, "New heading", "the generator must still win");
  assert.deepEqual(merged.launch.conceptIntro.interactiveVisual, { kind: "prism-volume", l: 2 });
});

t("the generator wins wherever it speaks — a correction is not blocked by the overlay", () => {
  const merged = mergeAuthoredOverlay({ keyIdea: "corrected" }, { keyIdea: "stale" });
  assert.equal(merged.keyIdea, "corrected");
});

t("reordered items keep THEIR OWN translation, not their neighbour's", () => {
  // The failure that makes index-merging worse than data loss.
  const generated = {
    items: [
      { id: "b", stem: "second" },
      { id: "a", stem: "first" },
    ],
  };
  const prior = {
    items: [
      { id: "a", stem: "first", stemEs: "primero" },
      { id: "b", stem: "second", stemEs: "segundo" },
    ],
  };
  const merged = mergeAuthoredOverlay(generated, prior);
  assert.equal(merged.items[0].stemEs, "segundo", "translation attached to the wrong item");
  assert.equal(merged.items[1].stemEs, "primero", "translation attached to the wrong item");
});

t("an item the generator no longer produces is REPORTED, never silently dropped", () => {
  const dropped = [];
  mergeAuthoredOverlay(
    { items: [{ id: "a", stem: "kept" }] },
    {
      items: [
        { id: "a", stem: "kept" },
        { id: "gone", stem: "removed", stemEs: "eliminado" },
      ],
    },
    { onDrop: (p) => dropped.push(p) },
  );
  assert.equal(dropped.length, 1, "a lost authored value was not reported");
  assert.match(dropped[0], /gone/);
});

t("an item with no identity is left to the generator rather than guessed at", () => {
  const merged = mergeAuthoredOverlay({ tags: ["a", "b"] }, { tags: ["x", "y"] });
  assert.deepEqual(merged.tags, ["a", "b"]);
});

t("authoredPaths names what a merge is protecting", () => {
  const paths = authoredPaths(
    { launch: { conceptIntro: { heading: "h" } } },
    { launch: { conceptIntro: { heading: "h", interactiveVisual: { kind: "x" } } } },
  );
  assert.deepEqual(paths, ["launch.conceptIntro.interactiveVisual"]);
});

/* ── Write-set containment ─────────────────────────────────────────────────── */

t("a run that writes only its scope passes containment", () => {
  setWriteSetRoot("/repo");
  resetWriteSet();
  recordWrite("/repo/lessons/5-10-group1/config.json");
  recordWrite("/repo/functions/teacher-small-group/_facilitation-data.js");
  assertWriteSetContained({
    scope: "--only 5-10",
    allow: (p) =>
      /^lessons\/5-10(-group\d+|-catchup)?\//.test(p) ||
      p === "functions/teacher-small-group/_facilitation-data.js",
  });
});

t("a run that strays outside its scope FAILS, naming the files", () => {
  setWriteSetRoot("/repo");
  resetWriteSet();
  recordWrite("/repo/lessons/5-10-group1/config.json");
  recordWrite("/repo/lessons/1-1-group1/config.json");
  assert.throws(
    () =>
      assertWriteSetContained({
        scope: "--only 5-10",
        allow: (p) => /^lessons\/5-10(-group\d+|-catchup)?\//.test(p),
      }),
    /1-1-group1/,
    "a stray write was not caught, or was caught without naming the file",
  );
  resetWriteSet();
});

console.log(`generator safety (behaviour): ${passed} assertions passed.`);
