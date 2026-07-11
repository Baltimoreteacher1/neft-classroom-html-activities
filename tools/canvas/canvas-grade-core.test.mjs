/**
 * canvas-grade-core.test.mjs — contract test for assets/canvas-grade-core.js.
 *
 * Locks the scale → match → export behavior that the Canvas Grade Bridge relies
 * on (teacher-tools/canvas-grades — the completion-code AND the live-gradebook
 * pull) and that the Canvas dashboard shares. The tool mirrors this exact math,
 * so if the contract drifts these assertions catch it before a push.
 *
 * Lives under tools/ (not deployed) and is picked up by `npm test`
 * (tools/run-tests.mjs). Lives or dies by top-level assertions + exit code.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const CORE = resolve(dirname(fileURLToPath(import.meta.url)), "../../assets/canvas-grade-core.js");
require(CORE); // CommonJS module attaches its API to the global.
const G = globalThis.NeftGradeCore;
assert.ok(G && typeof G.applyScores === "function", "NeftGradeCore attached to global");

/* 1. scaleGrade: a percent scales to the assignment's points; raw fallback. */
assert.equal(G.scaleGrade(90, 9, 20), 18, "90% of 20 pts = 18");
assert.equal(G.scaleGrade(75, 3, 20), 15, "75% of 20 pts = 15");
assert.equal(G.scaleGrade(null, 7, 20), 7, "no percent -> raw score");
assert.equal(G.scaleGrade(80, null, null), 0, "no points-possible and no raw -> 0");
assert.equal(G.scaleGrade(100, 5, 100), 100, "100% of 100 = 100");

/* 2. Name matching tolerates "Last, First" vs "First Last", case & spacing. */
const roster = [
  { name: "Garcia, Maria", id: "101", sis: "mgarcia", section: "601" },
  { name: "Nguyen, Binh", id: "102", sis: "bnguyen", section: "601" },
  { name: "Smith, John", id: "103", sis: "jsmith", section: "602" },
];
const lookup = G.rosterLookup(roster);
assert.equal(G.matchIndex(lookup, "Maria Garcia"), 0, "First Last matches Last, First");
assert.equal(G.matchIndex(lookup, "binh   nguyen"), 1, "case/whitespace-insensitive match");
assert.equal(G.matchIndex(lookup, "Binĥ Nguyêñ"), 1, "accented names match normalized roster entries");
assert.equal(G.matchIndex(lookup, "Nobody Here"), -1, "unknown name -> -1");

/* 3. applyScores + buildImportCsv end-to-end — mirrors the live-gradebook path
 *    (name-matched entries → scaled grades → a Canvas-import grid). */
const entries = [
  { name: "Maria Garcia", percent: 90, score: 9, max: 10 },
  { name: "Binh Nguyen", percent: 75, score: 3, max: 4 },
  { name: "Ghost Student", percent: 60, score: 6, max: 10 }, // not in roster
];
const res = G.applyScores(roster, entries, 20);
assert.equal(res.matched.length, 2, "2 matched");
assert.equal(res.unmatched.length, 1, "1 unmatched");
assert.equal(res.unmatched[0].name, "Ghost Student", "unmatched name surfaced");
assert.deepEqual(res.missing, ["Smith, John"], "Smith has no submission");
assert.equal(res.gradeByIndex[0], 18, "Maria -> 18");
assert.equal(res.gradeByIndex[1], 15, "Binh -> 15");

/* 3b. Optional per-entry label overrides the default score/max text (used by
 *     the live-gradebook source, which carries only a percent). */
const live = G.applyScores(
  roster,
  [{ name: "Maria Garcia", percent: 90, score: 90, label: "90%" }],
  20,
);
assert.equal(live.matched[0].code, "90%", "custom label passthrough");
assert.equal(live.matched[0].grade, 18, "live percent scales with score fallback");

const grid = G.buildImportCsv(roster, "Ratios Lesson", 20, res.gradeByIndex);
assert.deepEqual(
  grid[0],
  ["Student", "ID", "SIS Login ID", "Section", "Ratios Lesson"],
  "Canvas import header",
);
assert.deepEqual(grid[1], ["    Points Possible", "", "", "", "20"], "points-possible row");
assert.deepEqual(grid[2], ["Garcia, Maria", "101", "mgarcia", "601", "18"], "Maria row scaled");
assert.deepEqual(grid[4], ["Smith, John", "103", "jsmith", "602", ""], "no submission -> blank");

console.log("canvas-grade-core: all assertions passed");
