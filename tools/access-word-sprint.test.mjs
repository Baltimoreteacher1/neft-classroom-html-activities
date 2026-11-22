// Word Round (src/word-sprint.js keeps the old file name for the precache list; it replaced the timed 60-second Word Sprint).
// The round is untimed, has no best score, never uses randomness, and ends instead of wrapping around.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const {
  ROUND_SIZE,
  advanceRound,
  closeRound,
  recordRoundAnswer,
  roundStatus,
  roundWordId,
  startRound,
} = await import("../access-practice-lab/src/word-sprint.js");

const items = Array.from({ length: 10 }, (_, i) => ({ id: `w${i}` }));
const NOW = Date.parse("2026-11-20T10:00:00Z");

test("a round is six words in an order fixed for the day, with no deadline", () => {
  const a = startRound(items, NOW);
  const b = startRound(items, NOW + 3_600_000);
  assert.equal(a.order.length, ROUND_SIZE);
  assert.deepEqual(a.order, b.order, "same day, same order");
  assert.equal(new Set(a.order).size, ROUND_SIZE);
  assert.ok(!("deadline" in a));
  assert.notDeepEqual(
    a.order,
    startRound(items, NOW + 86_400_000).order,
    "a new day changes the order",
  );
  assert.equal(
    startRound(items.slice(0, 3), NOW).order.length,
    3,
    "a short list gives a short round",
  );
});

test("the round runs through its words once and then ends", () => {
  let round = startRound(items, NOW);
  const seen = [];
  assert.equal(roundStatus(undefined), "none");
  while (roundStatus(round) === "running") {
    seen.push(roundWordId(round));
    round = advanceRound(recordRoundAnswer(round, seen.length % 2 === 0));
  }
  assert.deepEqual(seen, round.order);
  assert.equal(roundStatus(round), "done");
  assert.deepEqual([round.answered, round.correct], [6, 3]);
});

test("answers count and advancing clears the checked state", () => {
  let round = recordRoundAnswer(startRound(items, NOW), true);
  assert.deepEqual([round.answered, round.correct, round.checked], [1, 1, true]);
  round = advanceRound(round);
  assert.deepEqual([round.index, round.checked], [1, false]);
});

test("closing a round keeps the learner's word progress and drops the round and any old sprint score", () => {
  const next = closeRound({
    cursor: 2,
    items: { a: { due: 5 } },
    round: { index: 1 },
    sprint: { deadline: 1 },
    sprintBest: 9,
  });
  assert.deepEqual(next, { cursor: 2, items: { a: { due: 5 } } });
});

test("nothing in the Word Builder is timed, random or scored against a best", () => {
  for (const f of ["word-sprint.js", "views/vocabulary.js"]) {
    const src = readFileSync(new URL(`../access-practice-lab/src/${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /setInterval|setTimeout|Math\.random|deadline|Time is up/, f);
    if (f === "views/vocabulary.js")
      assert.doesNotMatch(src, /sprintBest/, "no best score is shown");
  }
});
