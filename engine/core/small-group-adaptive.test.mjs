import assert from "node:assert/strict";
import {
  AUTO_STEP_DOWN_MISSES,
  AUTO_STEP_UP_SOLVES,
  PATH_ORDER,
  createAutoPilot,
  pickWorkedModel,
} from "./small-group-adaptive.js";

// ── createAutoPilot ──

// Two consecutive misses step down from connect to stabilize.
{
  const pilot = createAutoPilot(null);
  assert.equal(pilot.recordAttempt(false), null);
  const move = pilot.recordAttempt(false);
  assert.deepEqual(move, { move: "down", path: "stabilize", atFloor: false });
  assert.equal(pilot.path(), "stabilize");
}

// A correct answer between misses resets the miss counter.
{
  const pilot = createAutoPilot(null);
  pilot.recordAttempt(false);
  pilot.recordAttempt(true);
  assert.equal(pilot.recordAttempt(false), null, "miss counter must reset after a solve");
}

// Three clean solves step up; a fourth move needs three MORE (counters reset).
{
  const pilot = createAutoPilot("connect");
  assert.equal(pilot.recordAttempt(true), null);
  assert.equal(pilot.recordAttempt(true), null);
  const up = pilot.recordAttempt(true);
  assert.deepEqual(up, { move: "up", path: "stretch", atFloor: false });
  assert.equal(pilot.recordAttempt(true), null, "counters must reset after a move");
}

// A hinted solve is supported, not clean — it must not count toward step-up.
{
  const pilot = createAutoPilot("connect");
  pilot.recordAttempt(true);
  pilot.recordAttempt(true);
  pilot.noteHint();
  assert.equal(pilot.recordAttempt(true), null, "hinted solve must reset the clean-solve run");
  pilot.recordAttempt(true);
  pilot.recordAttempt(true);
  assert.deepEqual(pilot.recordAttempt(true), { move: "up", path: "stretch", atFloor: false });
}

// At the ceiling, clean solves produce no move; at the floor, a double miss
// still reports (atFloor) so callers can open supports.
{
  const pilot = createAutoPilot("stretch");
  pilot.recordAttempt(true);
  pilot.recordAttempt(true);
  assert.equal(pilot.recordAttempt(true), null, "no move above stretch");
  const floor = createAutoPilot("stabilize");
  floor.recordAttempt(false);
  assert.deepEqual(floor.recordAttempt(false), {
    move: "down",
    path: "stabilize",
    atFloor: true,
  });
}

// Unknown restored paths fall back to connect.
{
  assert.equal(createAutoPilot("bogus").path(), "connect");
  assert.equal(createAutoPilot(undefined).path(), "connect");
}

// Full ladder walk: stretch → stabilize needs two separate double-misses.
{
  const pilot = createAutoPilot("stretch");
  pilot.recordAttempt(false);
  assert.deepEqual(pilot.recordAttempt(false), { move: "down", path: "connect", atFloor: false });
  pilot.recordAttempt(false);
  assert.deepEqual(pilot.recordAttempt(false), {
    move: "down",
    path: "stabilize",
    atFloor: false,
  });
}

// ── pickWorkedModel ──

// Only solved items with a real explanation qualify; unsolved never leak.
{
  const items = [
    { stem: "unsolved", explanation: "secret", _practiceIndex: 0 },
    { stem: "solved, no explanation", _practiceIndex: 1 },
    { stem: "solved with explanation", explanation: "model this", _practiceIndex: 2 },
  ];
  const solved = new Set([1, 2]);
  const model = pickWorkedModel(items, (index) => solved.has(index));
  assert.equal(model?.stem, "solved with explanation");
}

// Nothing solved → null (callers fall back to hint-ladder supports).
{
  assert.equal(
    pickWorkedModel([{ stem: "a", explanation: "x", _practiceIndex: 0 }], () => false),
    null,
  );
  assert.equal(pickWorkedModel(null, () => true), null);
  assert.equal(pickWorkedModel([{ stem: "no index", explanation: "x" }], () => true), null);
}

// Guard the constants the classroom rule was agreed on.
assert.equal(AUTO_STEP_DOWN_MISSES, 2);
assert.equal(AUTO_STEP_UP_SOLVES, 3);
assert.deepEqual(PATH_ORDER, ["stabilize", "connect", "stretch"]);

console.log("small-group-adaptive: all assertions passed");
