import assert from "node:assert/strict";
import test from "node:test";

const { clearWeeklyGoal, recordWeeklyCorrect, setWeeklyGoal, weekStart, weeklyProgress } =
  await import("../access-practice-lab/src/word-goal.js");

// Wednesday 2026-11-04 local noon, and the Monday before it.
const WED = new Date(2026, 10, 4, 12);
const MON = "2026-11-02";

test("the week starts on Monday, including on a Sunday", () => {
  assert.equal(weekStart(WED), MON);
  assert.equal(
    weekStart(new Date(2026, 10, 1, 12)),
    "2026-10-26",
    "a Sunday belongs to the week that began the Monday before",
  );
  assert.equal(
    weekStart(new Date(2026, 10, 2, 0, 5)),
    MON,
    "Monday just after midnight starts a new week",
  );
});

test("no goal is set until the learner picks one, and only the offered goals are accepted", () => {
  assert.deepEqual(weeklyProgress({}, WED), { goal: null, count: 0 });
  assert.equal(setWeeklyGoal({}, 15, WED).weekly.goal, null);
  assert.equal(setWeeklyGoal({}, 20, WED).weekly.goal, 20);
});

test("correct builds count toward the week and the goal is kept", () => {
  let band = setWeeklyGoal({ cursor: 3 }, 10, WED);
  band = recordWeeklyCorrect(band, WED);
  band = recordWeeklyCorrect(band, WED);
  assert.deepEqual(weeklyProgress(band, WED), { goal: 10, count: 2 });
  assert.equal(band.cursor, 3, "other band state is preserved");
});

test("a new week resets the count but keeps the chosen goal", () => {
  const band = recordWeeklyCorrect(setWeeklyGoal({}, 20, WED), WED);
  const nextWeek = new Date(2026, 10, 9, 12);
  assert.deepEqual(weeklyProgress(band, nextWeek), { goal: 20, count: 0 });
  assert.deepEqual(weeklyProgress(recordWeeklyCorrect(band, nextWeek), nextWeek), {
    goal: 20,
    count: 1,
  });
});

test("changing the goal mid-week keeps this week's count", () => {
  let band = recordWeeklyCorrect(setWeeklyGoal({}, 10, WED), WED);
  band = setWeeklyGoal(band, 30, WED);
  assert.deepEqual(weeklyProgress(band, WED), { goal: 30, count: 1 });
});

test("clearing the goal hides it without losing the count", () => {
  const band = clearWeeklyGoal(recordWeeklyCorrect(setWeeklyGoal({}, 10, WED), WED));
  assert.deepEqual(weeklyProgress(band, WED), { goal: null, count: 1 });
});
