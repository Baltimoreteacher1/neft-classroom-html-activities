// The Math Check's verify step and interpret step need different frames.
//
// The Group 2 Math Check runs solve → verify → interpret. Steps 2 and 3 both
// rendered `topic.frame`, so all 84 challenge lessons handed the same sentence
// frame to two questions that are not the same question. On 6-13 step 3 asked
// "How does your factor check match the original number?" and offered "My
// factors work because ___ × ___ = ___, and each factor is prime." — a student
// could satisfy the interpretation step by restating the verification they had
// just written, which is the one move that step exists to prevent.
//
// CONNECT_FRAMES is keyed identically to MATH_CHECKS. That lockstep is the
// thing worth pinning: a new lesson added to one map and forgotten in the other
// silently falls back to the generic frame, which reads fine and teaches less.

import assert from "node:assert/strict";
import test from "node:test";

import { CONNECT_FRAMES, MATH_CHECKS, mathCheckFor } from "./small-group-math-check.js";

test("every math check has its own interpretation frame", () => {
  const missing = Object.keys(MATH_CHECKS).filter((k) => !CONNECT_FRAMES[k]);
  assert.deepEqual(missing, [], "MATH_CHECKS entries with no CONNECT_FRAMES entry");
});

test("no interpretation frame is orphaned", () => {
  const orphan = Object.keys(CONNECT_FRAMES).filter((k) => !MATH_CHECKS[k]);
  assert.deepEqual(orphan, [], "CONNECT_FRAMES entries with no MATH_CHECKS entry");
});

test("the two steps never hand out the same frame", () => {
  const same = Object.keys(MATH_CHECKS).filter(
    (k) => MATH_CHECKS[k].frame.trim() === CONNECT_FRAMES[k].trim(),
  );
  assert.deepEqual(same, [], "lessons whose verify and interpret frames are identical");
});

test("every frame is a frame — it leaves the student something to write", () => {
  const noBlank = Object.entries(CONNECT_FRAMES)
    .filter(([, v]) => !v.includes("___"))
    .map(([k]) => k);
  assert.deepEqual(noBlank, [], "interpretation frames with no blank to fill");
});

test("mathCheckFor hands the renderer both frames", () => {
  const topic = mathCheckFor({ lessonId: "6-13-group2" });
  assert.equal(topic.frame, MATH_CHECKS["6-13"].frame);
  assert.equal(topic.connectFrame, CONNECT_FRAMES["6-13"]);
  assert.notEqual(topic.frame, topic.connectFrame);
});

test("an unknown lesson still gets a distinct interpretation frame", () => {
  // The fallback path is the one most likely to regress unnoticed, because a
  // lesson only reaches it by being absent from the map.
  const topic = mathCheckFor({ lessonId: "99-9-group2" });
  assert.ok(topic.connectFrame.includes("___"));
  assert.notEqual(topic.frame, topic.connectFrame);
});
