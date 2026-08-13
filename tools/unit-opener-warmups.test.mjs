// Every unit-opening lesson must open with a warmup, and it must not claim a
// previous lesson it cannot have.
//
// WHY THIS GATE EXISTS
// --------------------
// An audit of the ten unit openers found four distinct ways this fails silently,
// none of which any existing check could see:
//
//   • 7-1 shipped with NO warmup, so the lesson started cold and two teacher
//     surfaces that hang off the warmup (Quick Reteach, the Do-Now generator)
//     had nothing to work with for that unit.
//   • 2-1 and 5-1 "warmed up" on the lesson's OWN objective — 5-1 handed
//     students the parallelogram area relationship the lesson exists to teach.
//   • 4-1 warmed up on 4-2, a lesson students had not taken, and its
//     prevLessonId pointed FORWARD to it.
//   • 6-1 named a prevLessonId (1-7) that does not exist at all, left behind by
//     the Reveal TOC renumber.
//
// A unit opener has no previous lesson in its unit. Where the questions are
// prerequisite retrieval — which is what a unit opener should do — the warmup is
// marked `kind: "spiral"` and names the SKILL in `spiralFrom` rather than
// inventing a lesson. That is the contract this pins.
//
// EXCEPTIONS are allowed but must be declared here, in code, with a reason. An
// undeclared opener without a warmup fails.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
const order = manifest.lessons.map((l) => l.lessonId || l.id);
const position = new Map(order.map((id, i) => [id, i]));

/** Unit openers that intentionally ship without a warmup. Empty, and it should
 *  stay that way; add an entry only with a reason a reader can evaluate. */
const DOCUMENTED_EXCEPTIONS = Object.freeze({
  // "11-1": "reason a human can check",
});

const openers = order.filter((id) => /^\d+-1$/.test(id));
assert.ok(openers.length >= 10, `expected the ten unit openers, found ${openers.length}`);

const failures = [];
const fail = (id, message) => failures.push(`${id}: ${message}`);

for (const id of openers) {
  const config = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));
  const warmup = config.warmup;

  if (!warmup) {
    if (!DOCUMENTED_EXCEPTIONS[id]) {
      fail(id, "unit opener has no warmup and no documented exception");
    }
    continue;
  }

  const questions = Array.isArray(warmup.questions) ? warmup.questions : [];
  if (questions.length < 2) {
    fail(id, `warmup has ${questions.length} question(s); a warmup needs at least 2`);
  }
  for (const [i, q] of questions.entries()) {
    if (!q.explanation || !String(q.explanation).trim()) {
      fail(id, `warmup question ${i + 1} has no explanation — a miss would say only "Incorrect"`);
    }
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      fail(id, `warmup question ${i + 1} is not answerable (needs choices)`);
    } else if (!Number.isInteger(q.correctIndex) || !q.choices[q.correctIndex]) {
      fail(id, `warmup question ${i + 1} has no valid correctIndex`);
    }
  }

  if (warmup.kind === "spiral") {
    if (!warmup.spiralFrom || !String(warmup.spiralFrom).trim()) {
      fail(id, "a spiral warmup must name the prerequisite skill in `spiralFrom`");
    }
    if (warmup.prevLessonId) {
      fail(id, "a spiral warmup must not also claim a prevLessonId");
    }
    continue;
  }

  // Not spiral: it claims a real previous lesson, so that lesson must exist and
  // must come EARLIER in the teaching sequence.
  const prev = warmup.prevLessonId;
  if (!prev) {
    fail(id, 'warmup is neither kind:"spiral" nor anchored to a prevLessonId');
    continue;
  }
  if (!position.has(prev)) {
    fail(id, `prevLessonId "${prev}" is not a lesson in the curriculum manifest`);
    continue;
  }
  if (position.get(prev) >= position.get(id)) {
    fail(
      id,
      `prevLessonId "${prev}" does not come before it — students have not taken that lesson`,
    );
  }
  const prevUnit = prev.split("-")[0];
  if (prevUnit === id.split("-")[0]) {
    fail(
      id,
      `prevLessonId "${prev}" is inside its own unit; a unit opener has no previous lesson there`,
    );
  }
}

assert.deepEqual(failures, [], `unit-opening warmup defects:\n  ${failures.join("\n  ")}`);

console.log(
  `PASS unit-opener-warmups: ${openers.length} unit openers, all with a valid warmup ` +
    `(${openers.filter((id) => JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8")).warmup?.kind === "spiral").length} prerequisite/spiral, ` +
    `${Object.keys(DOCUMENTED_EXCEPTIONS).length} documented exception(s))`,
);
