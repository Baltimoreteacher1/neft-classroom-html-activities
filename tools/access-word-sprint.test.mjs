import assert from "node:assert/strict";
import test from "node:test";

const {
  SPRINT_SECONDS,
  advanceSprint,
  clockText,
  closeSprint,
  recordSprintAnswer,
  sprintStatus,
  sprintWordId,
  startSprint,
} = await import("../access-practice-lab/src/word-sprint.js");

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
const NOW = 1_000_000;
const noShuffle = () => 0.999999;

test("a sprint lasts 60 seconds and runs through every word once in a shuffled order", () => {
  const sprint = startSprint(items, NOW, noShuffle);
  assert.equal(SPRINT_SECONDS, 60);
  assert.equal(sprint.deadline, NOW + 60_000);
  assert.deepEqual([...sprint.order].sort(), ["a", "b", "c"]);
  assert.deepEqual(
    items.map((item) => item.id),
    ["a", "b", "c"],
    "input order is not mutated",
  );
});

test("status moves from running to over exactly at the deadline", () => {
  const sprint = startSprint(items, NOW, noShuffle);
  assert.equal(sprintStatus(undefined, NOW), "none");
  assert.equal(sprintStatus(sprint, NOW + 59_999), "running");
  assert.equal(sprintStatus(sprint, NOW + 60_000), "over");
});

test("the word on screen wraps around the order so a fast learner never runs out", () => {
  let sprint = startSprint(items, NOW, noShuffle);
  const seen = [];
  for (let i = 0; i < 5; i += 1) {
    seen.push(sprintWordId(sprint));
    sprint = advanceSprint(sprint);
  }
  assert.deepEqual(seen, [
    sprint.order[0],
    sprint.order[1],
    sprint.order[2],
    sprint.order[0],
    sprint.order[1],
  ]);
});

test("answers count toward correct and answered, and advancing clears the checked state", () => {
  let sprint = startSprint(items, NOW, noShuffle);
  sprint = recordSprintAnswer(sprint, true);
  assert.deepEqual([sprint.answered, sprint.correct, sprint.checked], [1, 1, true]);
  sprint = advanceSprint(sprint);
  sprint = recordSprintAnswer(sprint, false);
  assert.deepEqual(
    [sprint.answered, sprint.correct, sprint.checked, sprint.index],
    [2, 1, true, 1],
  );
});

test("closing a sprint keeps the best correct count for the band and drops the active sprint", () => {
  const first = closeSprint({
    cursor: 2,
    items: { a: { due: 5 } },
    sprint: { correct: 4, answered: 6 },
  });
  assert.deepEqual(first, { cursor: 2, items: { a: { due: 5 } }, sprintBest: 4 });
  const second = closeSprint({ ...first, sprint: { correct: 3, answered: 4 } });
  assert.equal(second.sprintBest, 4, "a lower score never replaces the best");
  assert.equal("sprint" in second, false);
});

test("clock text reads minutes and seconds and never goes negative", () => {
  assert.equal(clockText(60_000), "1:00");
  assert.equal(clockText(42_100), "0:43");
  assert.equal(clockText(0), "0:00");
  assert.equal(clockText(-500), "0:00");
});
