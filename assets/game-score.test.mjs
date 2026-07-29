/* =============================================================================
 * game-score.test.mjs — guards the counting contract in assets/game-score.js.
 * -----------------------------------------------------------------------------
 * The value of this module is entirely in its honesty rules, and every one of
 * them is a rule about what must NOT be written: no row when nothing was
 * attempted, no second row when a game both finishes and unloads, and never a
 * `total` that means maxScore instead of attempts. A bug in any of those is
 * invisible in production — it just quietly produces plausible, wrong numbers,
 * exactly like the engine3d attempts/score swap did.
 *
 * Runs under plain node via tools/run-tests.mjs with a hand-rolled DOM stub;
 * the module only touches document/window in ways this can fake.
 * ========================================================================== */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(resolve(import.meta.dirname, "game-score.js"), "utf8");

/** Fresh sandbox per case, so state never leaks between assertions. */
function load() {
  const recorded = [];
  const listeners = {};
  const scriptEl = {
    addEventListener(evt, fn) {
      // Resolve the bridge load immediately so report() completes in-band.
      if (evt === "load") setTimeout(fn, 0);
    },
  };
  const win = {
    location: { pathname: "/math/unit-4/unit-rate-duel/index.html" },
    EduPulse: { record: (p) => recorded.push(p) },
    addEventListener(evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
  };
  const doc = {
    visibilityState: "visible",
    querySelector: () => scriptEl,
    createElement: () => scriptEl,
    body: { appendChild() {} },
    addEventListener(evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
  };
  const fn = new Function("window", "document", "setTimeout", "Promise", "Date", `${SRC}\nreturn window.NeftScore;`);
  const NeftScore = fn(win, doc, setTimeout, Promise, Date);
  const fire = (evt) => (listeners[evt] || []).forEach((f) => f());
  return { NeftScore, recorded, fire };
}

const flush = () => new Promise((r) => setTimeout(r, 5));

/* --- total means ATTEMPTS, not maxScore ---------------------------------- */
{
  const { NeftScore, recorded } = load();
  NeftScore.init({ gameId: "unit-rate-duel", standard: "6.RP.A.2" });
  NeftScore.attempt(true);
  NeftScore.attempt(false);
  NeftScore.attempt(true);
  NeftScore.finish();
  await flush();
  assert.equal(recorded.length, 1, "one row for one finished game");
  const row = recorded[0];
  assert.equal(row.problemsAttempted, 3, "attempts counts wrong answers too");
  assert.equal(row.problemsCorrect, 2, "correct counts only right answers");
  assert.equal(row.score, 2, "score is the correct count, not the attempt count");
  assert.equal(row.activityId, "unit-rate-duel");
  assert.equal(row.standard, "6.RP.A.2");
}

/* --- a game that judged nothing must stay ABSENT, not report 0% ---------- */
{
  const { NeftScore, recorded } = load();
  NeftScore.init({ gameId: "unit-rate-duel" });
  NeftScore.finish();
  await flush();
  assert.equal(recorded.length, 0, "opened-and-abandoned writes no row");
}

/* --- finish() then pagehide must not double-count ------------------------ */
{
  const { NeftScore, recorded, fire } = load();
  NeftScore.init({ gameId: "unit-rate-duel" });
  NeftScore.attempt(true);
  NeftScore.finish();
  NeftScore.finish();
  fire("pagehide");
  await flush();
  assert.equal(recorded.length, 1, "reporting is idempotent across both paths");
}

/* --- abandoning mid-game still reports what really happened -------------- */
{
  const { NeftScore, recorded, fire } = load();
  NeftScore.init({ gameId: "unit-rate-duel" });
  NeftScore.attempt(true);
  NeftScore.attempt(false);
  fire("pagehide");
  await flush();
  assert.equal(recorded.length, 1, "partial play is real data");
  assert.equal(recorded[0].problemsAttempted, 2);
  assert.equal(recorded[0].problemsCorrect, 1);
}

/* --- an all-wrong run reports honestly rather than staying silent -------- */
{
  const { NeftScore, recorded } = load();
  NeftScore.init({ gameId: "unit-rate-duel" });
  NeftScore.attempt(false);
  NeftScore.attempt(false);
  NeftScore.finish();
  await flush();
  assert.equal(recorded.length, 1, "struggling students must be visible");
  assert.equal(recorded[0].problemsCorrect, 0);
  assert.equal(recorded[0].problemsAttempted, 2);
}

/* --- gameId falls back to the folder the audit joins on ------------------ */
{
  const { NeftScore, recorded } = load();
  NeftScore.init({});
  NeftScore.attempt(true);
  NeftScore.finish();
  await flush();
  assert.equal(recorded[0].activityId, "unit-rate-duel", "inferred from pathname");
}

console.log("game-score: 6 cases passed");

/* --- batch grading: re-checking must not multiply attempts --------------- */
{
  const { NeftScore, recorded } = load();
  NeftScore.init({ gameId: "6-ns-b-3review" });
  NeftScore.tally("categorize", 6, 3);
  NeftScore.tally("categorize", 6, 5); // student fixed two and pressed Check again
  NeftScore.finish();
  await flush();
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].problemsAttempted, 6, "re-check replaces, never accumulates");
  assert.equal(recorded[0].problemsCorrect, 5, "latest state of that exercise wins");
}

/* --- batches and per-answer grading coexist without clobbering ----------- */
{
  const { NeftScore, recorded } = load();
  NeftScore.init({ gameId: "mixed" });
  NeftScore.attempt(true);
  NeftScore.tally("sort", 4, 2);
  NeftScore.attempt(false);
  NeftScore.tally("match", 3, 3);
  NeftScore.finish();
  await flush();
  assert.equal(recorded[0].problemsAttempted, 2 + 4 + 3, "singles + every batch");
  assert.equal(recorded[0].problemsCorrect, 1 + 2 + 3);
}

console.log("game-score: batch cases passed");
