// Phonics Path content gate: every lesson in the three levels must pass validateLesson, ids must be unique, and the
// sequence must stay comprehensive. `node tools/sor-sequence.test.mjs [1|2|3]` checks one level while it is being authored.
import assert from "node:assert/strict";
import {
  LEVELS,
  lessonById,
  READING_LESSONS,
  validateSequence,
} from "../access-practice-lab/src/sor/sequence.js";

const only = Number(process.argv[2]) || 0;
const errors = validateSequence().filter((e) => {
  if (!only) return true;
  const lessonId = e.split(":")[0];
  const lesson = lessonById(lessonId);
  return lesson
    ? lesson.level === only
    : e.startsWith(`level ${only}`) || e.startsWith(`unit l${only}`);
});
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
if (!only) {
  assert.equal(LEVELS.length, 3);
  for (const level of LEVELS)
    assert.ok(level.units.length >= 4, `level ${level.level} has too few units`);
  assert.ok(
    READING_LESSONS.length >= 54,
    `expected at least 54 lessons, found ${READING_LESSONS.length}`,
  );
  for (const id of ["cvc-short-a", "digraph-sh", "long-a-vce", "prefix-un"])
    assert.ok(lessonById(id), `saved-progress id ${id} must stay`);
  assert.equal(READING_LESSONS.at(-1).next, null);
}
console.log(
  `sor-sequence: ${READING_LESSONS.filter((l) => !only || l.level === only).length} lessons valid`,
);
