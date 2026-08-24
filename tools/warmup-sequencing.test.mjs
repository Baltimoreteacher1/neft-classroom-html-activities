// A warmup may never assess a lesson students have not taken yet, and it must
// name the lesson it actually reviews.
//
// WHY THIS GATE EXISTS
// --------------------
// Two separate failures put mathematics students had never met into a warmup.
//
// 1. STALE REFERENCES. The Reveal TOC renumber left warmups citing a
//    prevLessonId that either did not exist or came LATER. 5-2 (Area of
//    Triangles) opened by asking for the area of a TRAPEZOID — the next lesson.
//
// 2. NUMERIC ADJACENCY. Every previous version of this gate ordered lessons by
//    the curriculum MANIFEST, which is book order. This district does not teach
//    in book order. Its Pre-Unit is assembled — 1-1 → 2-6 → 2-7 → 6-1 → 6-2 —
//    so book order says 2-6 follows 2-5 (interquartile range) and 6-1 follows
//    5-10 (volume). Students sat in neither. Judged against book order, 2-8's
//    warmup on 2-7 looked correct; in the sequence students actually experience,
//    2-7 was taught in AUGUST and 2-8 in APRIL, eight months apart.
//
// The order therefore comes from shared/curriculum/instructional-sequence.js,
// which derives it from the same pacing files the Teach picker and the planner
// read. There is no second list here to drift from them.
//
// THREE SHAPES ARE LEGITIMATE, and they are semantically different:
//   • Previous Lesson Check — `reviews` and `prevLessonId` name the lesson
//     immediately before this one in the instructional sequence.
//   • Prerequisite / Spiral — `kind:"spiral"` + `spiralFrom` names the SKILL,
//     `reviews` is null, and no prevLessonId is claimed. Allowed only where
//     there IS no previous taught lesson, or where the previous lesson carries
//     no assessable mathematics (an MPP practice-standard lesson such as 1-1
//     "Math is Mine", whose objective is to tell your math story).
//   • A variant (small group, catch-up) INHERITS its parent's warmup verbatim.
//     They used to carry 197 independent copies; 94 of them had drifted into a
//     forward reference, a title that was not the named lesson's title, or both.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  baseLessonId,
  buildInstructionalSequence,
  getPreviousTaughtLesson,
} from "../shared/curriculum/instructional-sequence.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const manifest = read("data/curriculum-launch-manifest.json");
const sequence = buildInstructionalSequence({
  ranges: read("data/pacing-unit-ranges.json"),
  authored: read("data/pacing-unit-lessons.json"),
  manifest,
});
const meta = new Map(manifest.lessons.map((l) => [l.id, l]));
const config = (id) => read(`lessons/${id}/config.json`);

/** A lesson carries no assessable mathematics when its standard is a
 *  mathematical-practice code rather than a content code. Derived, not listed:
 *  a new reflection lesson gets the same treatment without an edit here. */
const isPracticeOnly = (id) => String(meta.get(id)?.standard || "").startsWith("MPP");

const failures = [];
const folders = readdirSync(join(ROOT, "lessons")).filter((d) =>
  existsSync(join(ROOT, "lessons", d, "config.json")),
);

let coreChecked = 0;
let prerequisite = 0;
let variantsChecked = 0;

for (const id of folders) {
  const warmup = config(id).warmup;
  if (!warmup) continue;

  const base = baseLessonId(id);
  if (base !== id) {
    /* VARIANT. One rule, and it is equality: the small-group and catch-up
     * sessions for lesson X warm up on exactly what X warms up on. Anything
     * else is a second copy, and a second copy is what rotted. */
    variantsChecked++;
    const parentPath = join(ROOT, "lessons", base, "config.json");
    if (!existsSync(parentPath)) {
      failures.push(`${id}: has a warmup but its parent ${base} does not exist`);
      continue;
    }
    const parent = config(base).warmup;
    const strip = (w) =>
      JSON.stringify({ ...w, questions: w.questions.map(({ id: _drop, ...q }) => q) });
    if (strip(warmup) !== strip(parent)) {
      failures.push(
        `${id}: warmup has drifted from its parent ${base}. A variant inherits the parent's ` +
          "warmup; it does not author its own.",
      );
    }
    continue;
  }

  if (!sequence.entries.has(id)) {
    failures.push(`${id}: is not in the instructional sequence, so its warmup has no anchor`);
    continue;
  }
  coreChecked++;

  const prev = getPreviousTaughtLesson(id, sequence);
  const spiral = String(warmup.kind || "") === "spiral";

  /* EVERY warmup records what it reviews. Without this the only evidence of a
   * warmup's target is prose in `spiralFrom`, which no gate can check — and 27
   * spiral warmups were reviewing the wrong lesson behind exactly that gap. */
  if (!("reviews" in warmup)) {
    failures.push(`${id}: warmup does not record what it reviews (missing \`reviews\`)`);
    continue;
  }

  if (warmup.reviews === null) {
    prerequisite++;
    if (!spiral || !warmup.spiralFrom) {
      failures.push(`${id}: reviews nothing, so it must be kind:"spiral" and name a skill`);
    }
    if (warmup.prevLessonId) {
      failures.push(
        `${id}: reviews nothing but still claims prevLessonId "${warmup.prevLessonId}"`,
      );
    }
    /* Prerequisite retrieval is honest ONLY where there is nothing to retrieve
     * from. Anywhere else it is a warmup quietly skipping yesterday's lesson. */
    if (prev !== null && !isPracticeOnly(prev)) {
      failures.push(
        `${id}: opens with prerequisite review, but ${prev} ("${meta.get(prev)?.title}") was ` +
          "taught immediately before it and has mathematics to retrieve",
      );
    }
    continue;
  }

  if (prev === null) {
    failures.push(
      `${id}: claims to review "${warmup.reviews}" but nothing is taught before it — ` +
        'it must be kind:"spiral"',
    );
    continue;
  }
  if (warmup.reviews !== prev) {
    failures.push(
      `${id}: reviews "${warmup.reviews}" but the lesson taught immediately before it is ` +
        `"${prev}" (${meta.get(prev)?.title})`,
    );
    continue;
  }
  if (warmup.prevLessonId !== prev) {
    failures.push(`${id}: prevLessonId "${warmup.prevLessonId}" does not match reviews "${prev}"`);
  }
  /* The card PRINTS prevLessonTitle, so a title that no longer belongs to the
   * named lesson is a student-facing lie even when the sequence is sound. */
  const claimed = String(warmup.prevLessonTitle || "")
    .replace(/^Lesson \d+-\d+:?\s*/, "")
    .trim();
  const actual = meta.get(prev)?.title;
  if (claimed !== actual) {
    failures.push(`${id}: prevLessonTitle "${claimed}" is not the title of ${prev} ("${actual}")`);
  }

  /* A warmup is 2–4 short retrieval items, not a second lesson. */
  const questions = Array.isArray(warmup.questions) ? warmup.questions : [];
  if (questions.length < 2 || questions.length > 4) {
    failures.push(`${id}: warmup has ${questions.length} questions; a warmup is 2–4 items`);
  }
  for (const [i, q] of questions.entries()) {
    if (!q.explanation || !String(q.explanation).trim()) {
      failures.push(
        `${id}: question ${i + 1} has no explanation — a miss would say only "Incorrect"`,
      );
    }
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      failures.push(`${id}: question ${i + 1} is not answerable`);
    } else if (!Number.isInteger(q.correctIndex) || !q.choices[q.correctIndex]) {
      failures.push(`${id}: question ${i + 1} has no valid correctIndex`);
    }
  }
}

assert.deepEqual(failures, [], `warmup sequencing defects:\n  ${failures.join("\n  ")}`);

console.log(
  `PASS warmup-sequencing: ${coreChecked} core warmups follow the instructional sequence ` +
    `(${prerequisite} prerequisite/spiral where no mathematics precedes them), ` +
    `${variantsChecked} variants inherit their parent`,
);
