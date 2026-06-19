// Live-room state machine tests. Exits non-zero on failure (repo test convention).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(here, "room-state.js"), "utf8");
const sandbox = { module: { exports: {} }, self: {}, console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const R = sandbox.module.exports;

const room = R.makeRoom({
  code: "MATH42",
  standard: "6.RP.A.2",
  title: "Unit Rate Race",
  questions: [
    { prompt: "12 apples for $6, unit price?", choices: ["$0.50", "$2", "$3"], answerIndex: 0, skill: "unit-rate", limitMs: 20000 },
    { prompt: "Best buy per oz?", choices: ["A", "B"], answerIndex: 1, skill: "unit-rate", limitMs: 20000 },
  ],
});

// lobby join
assert.equal(R.addPlayer(room, "p1", "Ava").ok, true);
assert.equal(R.addPlayer(room, "p2", "Ben").ok, true);
assert.equal(R.addPlayer(room, "p1", "Ava").ok, true, "idempotent rejoin");

let t = 1000;
assert.equal(R.start(room, t).ok, true);
assert.equal(room.phase, "question");

// Ava answers correctly and fast; Ben wrong
const ava = R.submitAnswer(room, "p1", 0, t + 2000);
assert.equal(ava.correct, true);
assert.ok(ava.gained > 800, "fast correct => high points");
const ben = R.submitAnswer(room, "p2", 2, t + 5000);
assert.equal(ben.correct, false);
assert.equal(ben.gained, 0);
// double-answer blocked
assert.equal(R.submitAnswer(room, "p1", 1, t + 6000).ok, false, "no double answer");
// no answer key leaked in public state
const pub = R.publicState(room);
assert.equal(pub.question.choices.length, 3);
assert.equal(pub.question.answerIndex, undefined, "answer key not in public state");

R.reveal(room);
assert.equal(room.phase, "reveal");
const adv = R.next(room, t + 8000);
assert.equal(adv.ended, false);
assert.equal(room.current, 1);

// Q2: Ben correct (slow), Ava wrong
R.submitAnswer(room, "p2", 1, t + 8000 + 19000);
R.submitAnswer(room, "p1", 0, t + 8000 + 1000);
const end = R.next(room, t + 40000);
assert.equal(end.ended, true);
assert.equal(room.phase, "ended");

// leaderboard sorted
const lb = R.leaderboard(room);
assert.equal(lb.length, 2);
assert.ok(lb[0].score >= lb[1].score, "leaderboard sorted desc");

// results feed the mastery engine
const results = R.toResults(room, "2026-06-19T12:00:00Z");
assert.equal(results.length, 2);
const avaRes = results.find((r) => r.studentAlias === "Ava");
assert.equal(avaRes.standard, "6.RP.A.2");
assert.equal(avaRes.scorePercent, 50, "Ava: 1/2 correct => 50%");
assert.equal(avaRes.schema, "nt_result_v1");
assert.equal(avaRes.activityId, "live:MATH42");

console.log("✓ live room-state: all assertions passed");
