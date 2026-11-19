// Factory Run (the 3D runner for Lesson 6-5): the rules, played without a browser.
// Every stage can be finished by running through right gates; a wrong gate or
// the walled lane repeats the question; one card per gate row is right; hazards
// never close all three lanes with no jump or slide; and nothing ends the run.
import assert from "node:assert/strict";
import {
  input,
  LANES,
  newRun,
  STAGES,
  stars,
  stepOf,
  tick,
} from "../../math/games/universe/games/expression-factory/run/track.js";

const DT = 1 / 60;

/** Steer toward the next gate row's right card (or the wrong one when asked), dodging when it can. */
function autoplay(s, { wrongFirst = false, dodge = true } = {}) {
  const log = [];
  let guard = 0;
  const missed = new Set();
  while (!s.done && guard++ < 200000) {
    const gates = s.objs.filter((o) => o.kind === "gate" && !o.passed && o.z > s.dist);
    const nextZ = Math.min(...gates.map((g) => g.z));
    const row = gates.filter((g) => g.z === nextZ);
    const key = `${s.at}:${s.step}`;
    const want =
      wrongFirst && !missed.has(key)
        ? row.find((g) => !g.right) || row.find((g) => g.right)
        : row.find((g) => g.right);
    if (want && nextZ - s.dist < 18) input(s, want.lane);
    if (dodge) {
      const ahead = s.objs.find(
        (o) => o.lane === s.lane && !o.gone && o.z > s.dist && o.z - s.dist < 2.2,
      );
      if (ahead?.kind === "barrier" || ahead?.kind === "orb") input(s, "jump");
      if (ahead?.kind === "pipe") input(s, "slide");
    }
    for (const e of tick(s, DT)) {
      log.push(e);
      if (e.type === "gate" && !e.ok) missed.add(key);
    }
  }
  return log;
}

let gatesSeen = 0;
for (let i = 0; i < STAGES.length; i++) {
  const s = newRun(i, { pace: "normal" });
  const log = autoplay(s);
  assert.ok(s.done, `stage ${STAGES[i].id} finishes`);
  assert.equal(s.at, STAGES[i].items.length, "every crate packed");
  assert.equal(s.firstTry, s.items.length, "right gates every time is all first try");
  assert.equal(stars(s.firstTry, s.items.length), 3);
  assert.ok(log.some((e) => e.type === "stageDone"));
  assert.ok(s.gears > 0, "gears are collected");
  if (STAGES[i].boss) assert.equal(s.bossHp, 0, "the Glitch Bot is beaten");
  gatesSeen += log.filter((e) => e.type === "gate").length;
}
assert.ok(gatesSeen >= 60, "lots of practice: every step is a gate");

// Wrong gates repeat the question with the cards moved; the miss is tagged when there is a tag.
{
  const s = newRun(0, { pace: "chill" });
  const log = autoplay(s, { wrongFirst: true });
  assert.ok(s.done, "a stage with a miss on every step still finishes");
  assert.equal(s.firstTry, 0, "no crate counts as first try after a miss");
  const misses = log.filter((e) => e.type === "gate" && !e.ok);
  assert.ok(misses.length >= s.items.length, "every crate was missed once");
  assert.ok(
    misses.some((e) => e.misconception === "op-reversed-subtraction"),
    "the reversal slip is tagged",
  );
  assert.equal(stars(0, 8), 1);
}

// Each gate row: one right card, the step's own cards, and a wall in the spare lane of a two-card row.
for (let i = 0; i < STAGES.length; i++) {
  const s = newRun(i, { pace: "chill", seed: 99 });
  for (let n = 0; n < 40 && !s.done; n++) {
    const st = stepOf(s);
    const seg = s.seq;
    const row = s.objs.filter((o) => o.seg === seg && o.kind === "gate");
    assert.equal(row.length, st.choices.length);
    assert.equal(row.filter((g) => g.right).length, 1, "one right gate");
    assert.deepEqual(row.map((g) => g.choice).sort(), [...st.choices].sort());
    assert.equal(new Set(row.map((g) => g.lane)).size, row.length, "one card per lane");
    if (row.length === 2)
      assert.ok(
        s.objs.some((o) => o.seg === seg && o.kind === "wall"),
        "spare lane walled",
      );
    // Hazard rows never close all three lanes.
    const rows = new Map();
    for (const o of s.objs.filter(
      (o) => o.seg === seg && ["barrier", "pipe", "block", "orb"].includes(o.kind),
    ))
      rows.set(o.z, (rows.get(o.z) || 0) + 1);
    for (const c of rows.values()) assert.ok(c <= 2, "a hazard row leaves a lane open");
    // Answer by number key, then run to the gate.
    input(s, row.find((g) => g.right).lane);
    const z = row[0].z;
    while (s.dist < z + 0.5 && !s.done) tick(s, DT);
  }
}

// Hazards: a hit is a stumble (slower, combo lost), a shield takes one hit, nothing ends the run.
{
  const s = newRun(0);
  s.objs = [{ kind: "block", z: 3, lane: 1, seg: 0 }];
  s.combo = 4;
  let e = [];
  while (s.dist < 4) e = e.concat(tick(s, DT));
  assert.ok(e.some((x) => x.type === "stumble"));
  assert.equal(s.combo, 0);
  assert.equal(s.done, 0, "a stumble never ends the run");
  s.shield = 1;
  s.objs = [{ kind: "block", z: s.dist + 3, lane: 1, seg: 0 }];
  e = [];
  const end = s.dist + 4;
  while (s.dist < end) e = e.concat(tick(s, DT));
  assert.ok(e.some((x) => x.type === "shieldPop"));
  assert.equal(s.shield, 0);
  // Jumping clears a barrier; sliding clears a pipe.
  s.objs = [{ kind: "barrier", z: s.dist + 2.5, lane: 1, seg: 0 }];
  input(s, "jump");
  e = [];
  const end2 = s.dist + 4;
  while (s.dist < end2) e = e.concat(tick(s, DT));
  assert.ok(
    e.some((x) => x.type === "dodge" && x.kind === "barrier"),
    "a jump clears a barrier",
  );
  s.objs = [{ kind: "pipe", z: s.dist + 2, lane: 1, seg: 0 }];
  input(s, "slide");
  e = [];
  const end3 = s.dist + 3;
  while (s.dist < end3) e = e.concat(tick(s, DT));
  assert.ok(
    e.some((x) => x.type === "dodge" && x.kind === "pipe"),
    "a slide clears a pipe",
  );
  assert.equal(LANES.length, 3);
}

// Determinism: the same seed lays out the same track.
{
  const a = newRun(2, { seed: 5 });
  const b = newRun(2, { seed: 5 });
  assert.deepEqual(a.objs, b.objs);
}

console.log(
  "PASS factory run: five stages finished, misses repeat the question, hazards fair, deterministic",
);
