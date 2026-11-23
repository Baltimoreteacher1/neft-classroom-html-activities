// Vocabulary Academy — the unit test: one short form over every lesson of a unit. Pure: no DOM, no storage.
//
//   buildUnitTest(merged, lessons, { seed, perLesson }) -> { items, warnings }
//
// `merged` is data.js mergeLessons(...) (all the unit's words, so wrong choices can come from any lesson); `lessons`
// are the lesson files in order. From each lesson it samples `perLesson` words and asks one question per word, turning
// through four kinds (Finding Meanings, Just the Right Word, which word matches the meaning, closest in meaning) so the
// test looks like the exercises. A kind the word's data cannot support falls back to the next one; a word with no
// usable kind is reported in `warnings`, never asked badly. Scoring is assessment.js scoreAssessment.
import { rngFor } from "../rng.js";
import {
  clozeItem,
  defToWordItem,
  findMeaningItem,
  synonymItem,
  wordToDefItem,
} from "../lessons/items.js";

const KINDS = [
  (u, w, rng) => findMeaningItem(u, w, rng, "U"),
  (u, w, rng) => clozeItem(u, w, rng, "U", 2) || clozeItem(u, w, rng, "U", 1),
  (u, w, rng) => defToWordItem(u, w, rng, "U"),
  (u, w, rng) => synonymItem(u, w, rng, "U") || wordToDefItem(u, w, rng, "U"),
];

export function buildUnitTest(merged, lessons, { seed = merged.id, perLesson = 5 } = {}) {
  const rng = rngFor(`${seed}:unit-test`);
  const items = [];
  const warnings = [];
  let turn = 0;
  for (const lesson of lessons) {
    const words = rng.shuffle([...(lesson.words || [])]).slice(0, perLesson);
    for (const w of words) {
      let item = null;
      for (let k = 0; k < KINDS.length && !item; k++) item = KINDS[(turn + k) % KINDS.length](merged, w, rng);
      turn += 1;
      if (item) items.push({ ...item, lessonId: lesson.id, lessonN: lesson.n });
      else warnings.push(`no question could be built for ${w.id}`);
    }
  }
  return { items, warnings };
}
