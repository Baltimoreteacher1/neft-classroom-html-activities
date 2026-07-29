/**
 * teacher-clear.test.mjs — behavior tests for state.clearPhaseResponses, which
 * backs the teacher-only per-page "Clear answers" control (engine/core/
 * teacher-clear.js → window.__ntLessonClearApi.clearPages). Proves a per-page
 * clear removes ONLY that phase's responses + zeroes that phase's answer-driven
 * progress (stars/xp/attempts/correct) and adjusts global xp, while leaving
 * every other page, coins, streaks, and identity untouched — i.e. "clear a page,
 * not reset everything."
 *
 * state.js reads localStorage directly (no window needed for createState), so
 * the test installs a localStorage shim on globalThis then drives the real
 * public API — mirroring tools/nt-signal.test.mjs.
 *
 * Lives under tools/ (not deployed) and runs via `npm test` (tools/run-tests.mjs)
 * or directly: node --test tools/teacher-clear.test.mjs
 */

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

function makeStorageShim() {
  const map = new Map();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    __map: map,
  };
}

globalThis.localStorage = makeStorageShim();

const here = dirname(fileURLToPath(import.meta.url));
const { createState } = await import(pathToFileURL(resolve(here, "../engine/core/state.js")).href);

const PHASES = [
  { name: "Launch", icon: "🚀" },
  { name: "Explore", icon: "🔍" },
  { name: "Practice", icon: "✏️" },
  { name: "Connect", icon: "🌎" },
  { name: "Reflect", icon: "💡" },
];

function freshState() {
  globalThis.localStorage.__map.clear();
  const state = createState("test-1-1", "demo");
  state.initPhases(PHASES);
  // Seed typed answers across three different pages.
  state.saveResponse(0, "launch1", "LAUNCH ANS");
  state.saveResponse(2, "prac1", "PRACTICE ANS");
  state.saveResponse(4, "reflect1", "REFLECT ANS");
  // Seed answer-driven progress + a cross-page counter (coins) that must survive.
  const s = state.get();
  s.phases[0].xpEarned = 20;
  s.phases[0].stars = 2;
  s.phases[0].attempts = 3;
  s.phases[0].correct = 2;
  s.phases[2].xpEarned = 15;
  s.phases[2].stars = 3;
  s.xp = 35;
  s.coins = 7;
  s.bestStreak = 4;
  return state;
}

test("clears only the target page's responses", () => {
  const state = freshState();
  state.clearPhaseResponses(0);
  assert.deepEqual(Object.keys(state.get().responses).sort(), ["2_prac1", "4_reflect1"]);
});

test("zeroes the cleared page's progress and adjusts global xp", () => {
  const state = freshState();
  state.clearPhaseResponses(0);
  const p0 = state.get().phases[0];
  assert.equal(p0.xpEarned, 0);
  assert.equal(p0.stars, 0);
  assert.equal(p0.attempts, 0);
  assert.equal(p0.correct, 0);
  assert.equal(state.get().xp, 15); // 35 − Launch's 20
});

test("leaves other pages and cross-page state untouched", () => {
  const state = freshState();
  state.clearPhaseResponses(0);
  const s = state.get();
  assert.equal(s.phases[2].xpEarned, 15);
  assert.equal(s.phases[2].stars, 3);
  assert.equal(s.coins, 7);
  assert.equal(s.bestStreak, 4);
});

test("clearing several pages removes each and keeps the rest", () => {
  const state = freshState();
  [0, 4].forEach((i) => state.clearPhaseResponses(i));
  assert.deepEqual(Object.keys(state.get().responses), ["2_prac1"]);
});

test("persists the cleared state to storage", () => {
  const state = freshState();
  state.clearPhaseResponses(0);
  const raw = JSON.parse(globalThis.localStorage.getItem("rma_test-1-1_demo"));
  assert.ok(!("0_launch1" in raw.responses));
  assert.ok("2_prac1" in raw.responses);
});

test("clearing a page with no responses is a safe no-op", () => {
  const state = freshState();
  state.clearPhaseResponses(1); // Explore had no seeded responses
  assert.deepEqual(Object.keys(state.get().responses).sort(), [
    "0_launch1",
    "2_prac1",
    "4_reflect1",
  ]);
  assert.equal(state.get().xp, 35); // unchanged (Explore xpEarned was 0)
});

test("never lets global xp go negative", () => {
  const state = freshState();
  state.get().xp = 5; // less than Launch's 20 xpEarned
  state.clearPhaseResponses(0);
  assert.equal(state.get().xp, 0);
});
