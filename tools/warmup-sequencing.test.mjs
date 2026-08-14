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
const titleOf = new Map(
  order.map((id) => [
    id,
    JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8")).title,
  ]),
);

/** Unresolved by the 2026-08-13 audit; see reports/warmup-sequencing-audit.md. */
// Empty, and it should stay that way. All 24 stale references were resolved by
// direct inspection: the last 7 were re-read against their questions, which
// showed 5 to be genuine spirals (their named skill IS taught earlier) and 2 to
// be sequencing defects — 2-2 assessed box plots taught at 2-4, and 3-10
// assessed percent, which is unit 4. Adding an entry here requires the same
// standard of proof that emptying it did.
const KNOWN_STALE = new Set([]);

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

  // The card PRINTS prevLessonTitle, so a title that no longer belongs to
  // prevLessonId is a student-facing lie even when the sequence is sound. This
  // is the half the position check cannot see: 39 warmups printed a pre-renumber
  // Reveal name — "Warmup: Previous Lesson Check (Write Inequalities)" on 8-5,
  // whose prevLessonId 7-4 is "Compare and Order Integers and Rational Numbers"
  // — and 26 of those names were not lessons in this curriculum at all. A
  // warmup that cannot name its predecessor honestly should be kind:"spiral"
  // and name the SKILL instead.
  const claimed = String(warmup.prevLessonTitle || "")
    .replace(/^Lesson \d+-\d+:?\s*/, "")
    .trim();
  if (claimed) {
    const actual = titleOf.get(prev);
    if (actual && claimed !== actual) {
      failures.push(
        `${id}: prevLessonTitle "${claimed}" is not the title of ${prev} ("${actual}") — ` +
          "the warmup card prints this to students",
      );
    }
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
