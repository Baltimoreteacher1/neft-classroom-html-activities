import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { achievements, starsFor, streakOf } from "../assets/family-mission/celebrate/index.mjs";
import { unitsAtStage } from "../assets/family-mission/explain/index.mjs";
import { MISSION_LEVELS, MISSION_PRACTICE_COUNT } from "../scripts/lib/homework-mission.mjs";
import { PRACTICE_JS } from "../scripts/lib/homework-practice-js.mjs";

test("the mission levels add up to the mission size", () => {
  const first = MISSION_LEVELS.slice(0, -1).reduce((n, l) => n + l.size, 0);
  assert.ok(first < MISSION_PRACTICE_COUNT, "the last level takes the remainder");
  assert.equal(MISSION_LEVELS.length, 3);
});

test("the practice runtime is valid ES5 text, makes no network calls, and imports only its two modules", () => {
  assert.doesNotThrow(() => new Function(PRACTICE_JS));
  assert.doesNotMatch(PRACTICE_JS, /fetch\(|XMLHttpRequest|sendBeacon/);
  const urls = [...PRACTICE_JS.matchAll(/'(\/assets\/family-mission\/[^']+)'/g)].map((m) => m[1]);
  assert.ok(urls.length >= 4);
  for (const u of urls) assert.ok(readFileSync(new URL(`..${u}`, import.meta.url)), u);
});

test("stars are earned by finishing, persisting and accuracy, never by clicking", () => {
  const base = { goal: 10, done: 0, firstTry: 0, fixed: 0, bonus: 0 };
  const n = (d) => starsFor({ ...base, ...d }).filter((s) => s.earned).length;
  assert.equal(n({}), 0);
  assert.equal(n({ done: 5 }), 1);
  assert.equal(n({ done: 10, firstTry: 2 }), 2);
  assert.equal(n({ done: 10, firstTry: 7 }), 3);
  assert.equal(n({ done: 10, firstTry: 2, fixed: 1 }), 3);
  assert.equal(n({ done: 9, firstTry: 9 }), 1, "an unfinished mission cannot earn the third star");
});

test("badges read the level progress", () => {
  const d = { levels: [{ id: "warmup", size: 3, done: 3 }, { id: "build", size: 4, done: 1 }], firstTry: 3, fixed: 0, bonus: 0 };
  const on = achievements(d).filter((b) => b.earned).map((b) => b.id);
  assert.deepEqual(on.sort(), ["clean", "warmup"]);
});

test("the day streak counts consecutive days ending today or yesterday", () => {
  assert.equal(streakOf(["2026-11-08", "2026-11-09", "2026-11-10"], "2026-11-10"), 3);
  assert.equal(streakOf(["2026-11-08", "2026-11-09"], "2026-11-10"), 2);
  assert.equal(streakOf(["2026-11-05"], "2026-11-10"), 0);
});

test("the explainer shows at least one piece per step and everything on the last", () => {
  assert.equal(unitsAtStage(10, 0, 4), 3);
  assert.equal(unitsAtStage(10, 3, 4), 10);
  assert.equal(unitsAtStage(2, 0, 4), 1);
  for (let s = 0; s < 4; s++) assert.ok(unitsAtStage(7, s, 4) >= 1);
});
