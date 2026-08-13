// A warmup may never assess a lesson students have not taken yet.
//
// WHY THIS GATE EXISTS
// --------------------
// The Reveal TOC renumber left 24 warmups citing a prevLessonId that either does
// not exist or comes LATER in the teaching sequence. That is not a cosmetic
// reference bug: the warmup card prints the named lesson, Quick Reteach reteaches
// it, and eight of those warmups genuinely quizzed students on mathematics they
// had not met. 5-2 (Area of Triangles) opened by asking for the area of a
// TRAPEZOID — the next lesson. 7-9 asked students to reflect points, which is
// 7-9's own objective.
//
// Three shapes are legitimate and semantically different:
//   • Previous Lesson Check — prevLessonId is the lesson immediately before.
//   • Prerequisite / Spiral — kind:"spiral" + spiralFrom names the SKILL, and no
//     prevLessonId is claimed at all.
//   • An earlier lesson — allowed, as long as it truly comes earlier.
//
// KNOWN_STALE is the audit's remaining unresolved set. Each entry is a warmup
// whose questions and named skill are coherent but whose target could not be
// identified from evidence, so it was deliberately left alone rather than
// re-filed from a legacy number. Entries may be REMOVED as they are resolved;
// adding one requires the same standard of proof.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
const order = manifest.lessons.map((l) => l.lessonId || l.id);
const position = new Map(order.map((id, i) => [id, i]));

/** Unresolved by the 2026-08-13 audit; see reports/warmup-sequencing-audit.md. */
const KNOWN_STALE = new Set(["2-2", "2-5", "2-9", "3-7", "3-10", "5-10", "7-5"]);

const failures = [];
for (const id of order) {
  const config = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));
  const warmup = config.warmup;
  if (!warmup) continue;

  const spiral = String(warmup.kind || "") === "spiral";
  if (spiral) {
    if (!warmup.spiralFrom) failures.push(`${id}: spiral warmup names no prerequisite skill`);
    if (warmup.prevLessonId) failures.push(`${id}: spiral warmup also claims a prevLessonId`);
    continue;
  }

  const prev = warmup.prevLessonId;
  if (!prev) continue; // nothing claimed; the unit-opener gate covers openers
  if (KNOWN_STALE.has(id)) continue;

  if (!position.has(prev)) {
    failures.push(`${id}: prevLessonId "${prev}" is not a lesson in the manifest`);
    continue;
  }
  if (position.get(prev) >= position.get(id)) {
    failures.push(
      `${id}: prevLessonId "${prev}" comes at or after it — the warmup would assess ` +
        "mathematics students have not been taught",
    );
  }
}

assert.deepEqual(failures, [], `warmup sequencing defects:\n  ${failures.join("\n  ")}`);

const spirals = order.filter((id) => {
  const w = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8")).warmup;
  return String(w?.kind || "") === "spiral";
}).length;

console.log(
  `PASS warmup-sequencing: no warmup assesses a later lesson ` +
    `(${spirals} spiral/prerequisite, ${KNOWN_STALE.size} known-stale awaiting review)`,
);
