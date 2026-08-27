/**
 * mstar-lesson-map.test.mjs — the MSTAR engine may not invent a lesson, and may
 * not rename one.
 *
 * tools/mstar-worksheet-engine/lib/lesson-data-map.mjs is a hand-authored
 * catalog: MSTAR items, bilingual vocabulary, SVG configurations. None of that
 * is in question here. What is in question is lesson IDENTITY, which
 * data/curriculum-manifest.json owns, and which this file had drifted from —
 * four lessons that do not exist, and 62 of the remaining 68 naming another
 * lesson's title and standard, because the list still described the numbering
 * used before the 2026-08-10 Reveal TOC renumber.
 *
 * Both id spaces are \d+-\d+, so a stale id does not miss — it HITS and returns
 * a different lesson. That is why this is a test and not a comment: the
 * engine writes lesson.title and lesson.standard straight into the worksheet's
 * <h1> and its TWR section, so a drifted entry hands a class the right worksheet
 * under the wrong lesson's name.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  curriculumIdentities,
  LESSON_MAP,
  RECONCILIATION,
  reconcileWithCurriculum,
} from "./mstar-worksheet-engine/lib/lesson-data-map.mjs";

const identities = curriculumIdentities();

test("the curriculum is readable and non-empty — a zero sweep proves nothing", () => {
  assert.ok(
    Object.keys(identities).length >= 80,
    `read ${Object.keys(identities).length} lessons from the manifest; a sweep this small has verified nothing`,
  );
});

test("every lesson the engine would generate exists in the curriculum", () => {
  const ghosts = Object.keys(LESSON_MAP).filter((id) => !identities[id]);
  assert.deepEqual(
    ghosts,
    [],
    `the engine would write worksheets for lesson(s) the curriculum does not have: ${ghosts.join(", ")}. ` +
      `A folder with worksheets and no config.json is what crashed five gates on 2026-08-27.`,
  );
});

test("every lesson carries the curriculum's own title and standard", () => {
  const wrong = [];
  for (const [id, lesson] of Object.entries(LESSON_MAP)) {
    const real = identities[id];
    if (!real) continue;
    if (real.title && lesson.title !== real.title) {
      wrong.push(`${id} title: "${lesson.title}" ≠ "${real.title}"`);
    }
    if (real.standard && lesson.standard !== real.standard) {
      wrong.push(`${id} standard: ${lesson.standard} ≠ ${real.standard}`);
    }
  }
  assert.deepEqual(wrong, [], `identity drift from the curriculum:\n  ${wrong.join("\n  ")}`);
});

test("the reconciliation actually ran and reported what it changed", () => {
  assert.ok(RECONCILIATION, "the map must reconcile itself at import time");
  assert.ok(Array.isArray(RECONCILIATION.dropped), "dropped must be reported, not silent");
  assert.ok(Array.isArray(RECONCILIATION.relabelled), "relabelled must be reported, not silent");
});

/* Negative controls: a detector that has stopped firing reports a clean map. */
test("a ghost lesson is dropped, not generated", () => {
  const map = { "1-1": { title: "T", standard: "S" }, "99-9": { title: "Ghost", standard: "X" } };
  const r = reconcileWithCurriculum(map, { "1-1": { title: "T", standard: "S" } });
  assert.deepEqual(r.dropped, ["99-9"]);
  assert.ok(!("99-9" in map), "the ghost must be gone from the map, not merely listed");
});

test("a drifted title and standard are corrected to the curriculum's", () => {
  const map = { "2-6": { title: "Interquartile Range (IQR)", standard: "6.DS.3" } };
  const r = reconcileWithCurriculum(map, {
    "2-6": { title: "Divide Multi-Digit Numbers Using an Algorithm", standard: "6.NOS.2" },
  });
  assert.equal(map["2-6"].title, "Divide Multi-Digit Numbers Using an Algorithm");
  assert.equal(map["2-6"].standard, "6.NOS.2");
  assert.equal(r.relabelled.length, 2, "both fields must be reported as changed");
});

test("a lesson already agreeing with the curriculum is left alone", () => {
  const map = { "1-1": { title: "Math is Mine", standard: "MPP.3" } };
  const r = reconcileWithCurriculum(map, { "1-1": { title: "Math is Mine", standard: "MPP.3" } });
  assert.deepEqual(r.dropped, []);
  assert.deepEqual(r.relabelled, []);
});
