import assert from "node:assert/strict";
import test from "node:test";
import {
  familyPatch,
  getFamily,
  TRIP_STOPS,
  tripWeekStreak,
} from "../access-practice-lab/src/family/state.js";
import {
  nextStopIds,
  stopProgress,
  suggestSkill,
} from "../access-practice-lab/src/family/trip-plan.js";
import { CORE_DOMAINS } from "../access-practice-lab/src/util.js";

const rows = CORE_DOMAINS.flatMap((domain) =>
  ["A", "B", "C"].flatMap((level) =>
    Array.from({ length: 6 }, (_, i) => ({
      band: "6-8",
      domain,
      level,
      id: `${domain}-${level}-${i}`,
      title: `T${i}`,
      type: "choice",
      minutes: 5,
    })),
  ),
);
const recordsWith = (doneIds) => (r) => ({
  complete: doneIds.filter((id) => id.startsWith(`${r.domain}-${r.level}-`)),
  results: {},
});

test("the suggested skill is the one with the least finished practice", () => {
  const done = rows.filter((r) => r.domain !== "Speaking").map((r) => r.id);
  assert.equal(suggestSkill(rows, recordsWith(done)), "Speaking");
  assert.equal(suggestSkill(rows, recordsWith([])), CORE_DOMAINS[0], "a tie keeps skill order");
});

test("a stop is planned from the chosen skill and advances as work is finished", () => {
  const args = { rows, band: "6-8", skill: "Reading", minutes: 10 };
  const first = nextStopIds({ ...args, recordFor: recordsWith([]) });
  assert.ok(first.length > 0 && first.every((id) => id.startsWith("Reading-")));
  const second = nextStopIds({ ...args, recordFor: recordsWith(first) });
  assert.ok(second.length > 0);
  assert.equal(
    second.filter((id) => first.includes(id)).length,
    0,
    "finished activities are not planned again",
  );
});

test("stop progress counts finished activities and flags a finished stop", () => {
  const ids = ["Reading-A-0", "Reading-A-1"];
  assert.deepEqual(stopProgress(ids, rows, recordsWith([ids[0]])), {
    done: 1,
    total: 2,
    finished: false,
  });
  assert.deepEqual(stopProgress(ids, rows, recordsWith(ids)), {
    done: 2,
    total: 2,
    finished: true,
  });
  assert.equal(stopProgress([], rows).finished, false);
});

test("saved trip state is sanitized and never carries anything but a skill, a stop count and activity ids", () => {
  assert.equal(getFamily({}).trip, null);
  const good = getFamily(
    familyPatch({}, { trip: { skill: "Reading", stop: 2, ids: ["a", "b"] } }),
  ).trip;
  assert.deepEqual(good, { skill: "Reading", stop: 2, ids: ["a", "b"] });
  const dirty = getFamily({
    family: { trip: { skill: "Reading", stop: 99, ids: ["ok", 5, "x".repeat(200)], name: "Sam" } },
  }).trip;
  assert.deepEqual(dirty, { skill: "Reading", stop: 0, ids: ["ok"] });
  assert.equal(getFamily({ family: { trip: { skill: "Math", stop: 1, ids: [] } } }).trip, null);
  assert.equal(TRIP_STOPS, 6);
});

test("Family Trip streak counts only completed-stop weeks in a recent consecutive run", () => {
  const today = new Date("2026-10-28T12:00:00Z");
  assert.equal(tripWeekStreak(["2026-10-12", "2026-10-19", "2026-10-26"], today), 3);
  assert.equal(tripWeekStreak(["2026-10-05", "2026-10-19", "2026-10-26"], today), 2);
  assert.equal(tripWeekStreak(["2026-10-05", "2026-10-12"], today), 0);
});
