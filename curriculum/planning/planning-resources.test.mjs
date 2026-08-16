/* planning-resources.test.mjs — which unit a planned day belongs to.
 *
 * WHY THIS FILE EXISTS. `unitNumberOf` answers "what unit is the teacher in on
 * this date?", and the Week rows, the Month grid and the day card all render
 * its answer. It used to answer with the unit that OWNS the scheduled lesson,
 * which is the same thing for every unit the district inherits from the
 * curriculum's numbering — and a different thing for a unit the district
 * ASSEMBLES. The Pre-Unit borrows 2-6, 2-7, 6-1 and 6-2, so the first two weeks
 * of school rendered as "Unit 2" and "Unit 6".
 *
 * No gate could see it. The function is correct JavaScript, it is typed, it is
 * covered by the planner's own lock, and every value it returns is a real unit
 * number — just not the right one. The last test here is the one that matters:
 * it makes the assertion against the SHIPPED plan rather than a fixture, so a
 * future re-import that reintroduces the confusion fails on the real data.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { indexCurriculum, resourcesFor, unitNumberOf } from "./planning-resources.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const launch = JSON.parse(readFileSync(`${ROOT}/data/curriculum-launch-manifest.json`, "utf8"));
const baseline = JSON.parse(readFileSync(`${ROOT}/data/pacing-baseline-2026-27.json`, "utf8"));
const authored = JSON.parse(readFileSync(`${ROOT}/data/pacing-unit-lessons.json`, "utf8"));
const index = indexCurriculum(launch);

const day = (unitKey, lessonId, dayType = "Core Lesson") => ({
  date: "2026-08-26",
  schoolStatus: "school",
  plan: { unitKey, lessonId, dayType },
});

test("a borrowed lesson belongs to the unit that is being taught, not the unit that owns it", () => {
  assert.equal(unitNumberOf(index, day("PRE", "2-6")), 1);
  assert.equal(unitNumberOf(index, day("PRE", "6-1")), 1);
});

test("a lesson taught in its own unit is unaffected", () => {
  assert.equal(unitNumberOf(index, day("U2", "2-6")), 2);
  assert.equal(unitNumberOf(index, day("U6", "6-1")), 6);
  assert.equal(unitNumberOf(index, day("U3", "3-1")), 3);
});

test("a day with no lesson still resolves from its pacing key", () => {
  assert.equal(unitNumberOf(index, day("PRE", null, "Project")), 1);
  assert.equal(unitNumberOf(index, day("U7", null, "Assessment")), 7);
});

test("a pacing key that names no curriculum unit resolves to nothing", () => {
  assert.equal(unitNumberOf(index, day("MSTAR", null, "MCAP / Testing")), null);
  assert.equal(unitNumberOf(index, day(null, null, "Flex")), null);
});

test("an unkeyed day still falls back to the lesson it schedules", () => {
  /* The fallback is not dead code: it is what keeps a day the plan does not key
   * from losing its unit entirely. */
  assert.equal(unitNumberOf(index, day(null, "4-2")), 4);
});

test("no day in the shipped plan is labelled with a unit the teacher is not in", () => {
  const assembled = new Set(Object.keys(authored.units));
  const paced = new Map(
    (JSON.parse(readFileSync(`${ROOT}/data/pacing-unit-ranges.json`, "utf8")).units || [])
      .filter((u) => u.curriculumUnit != null)
      .map((u) => [u.key, u.curriculumUnit]),
  );
  let borrowed = 0;
  for (const d of baseline.days) {
    if (!d.plan.unitKey || !paced.has(d.plan.unitKey)) continue;
    const expected = paced.get(d.plan.unitKey);
    assert.equal(
      unitNumberOf(index, d),
      expected,
      `${d.date} is paced in ${d.plan.unitKey} but renders as unit ${unitNumberOf(index, d)}`,
    );
    const owner = d.plan.lessonId ? index.byId.get(d.plan.lessonId)?.unit : null;
    if (assembled.has(d.plan.unitKey) && owner != null && owner !== expected) borrowed++;
  }
  assert.ok(
    borrowed >= 4,
    `the plan holds ${borrowed} borrowed lesson days — under 4, this test is no longer exercising the case it exists for`,
  );
});

test("a Pre-Unit lesson day does not offer another unit's culminating project", () => {
  const d = baseline.days.find((x) => x.plan.unitKey === "PRE" && x.plan.lessonId === "2-6");
  assert.ok(d, "the plan no longer teaches 2-6 in the Pre-Unit");
  const labels = resourcesFor(index, d).whole.map((l) => l.label);
  assert.ok(
    !labels.some((l) => /Unit \d+ culminating project/.test(l)),
    `a Pre-Unit lesson day offered ${labels.join(", ")}`,
  );
});
