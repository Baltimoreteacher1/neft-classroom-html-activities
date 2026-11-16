// Math Gaming Runtime — the deterministic core, proved on a toy world.
// Timeline: rewind restores the exact prior state, branches stay independent,
// replay reproduces every recorded hash. Multiverse: a shift changes one
// condition and everything else stays invariant. Apprentice: knowledge only
// advances on defined evidence. Evidence: no speed measure can be recorded.
import assert from "node:assert/strict";
import { Apprentice, STATUS, TELL } from "../../math/games/universe/runtime/apprentice.js";
import { EvidenceLog } from "../../math/games/universe/runtime/evidence.js";
import { Multiverse, PRIME, SHIFTED } from "../../math/games/universe/runtime/multiverse.js";
import { IN, q, rand, Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

// A cart on a line: input moves it, `gain` (the mathematical condition) scales
// the push, and the world's own PRNG adds a gust so replay must reproduce rng too.
const rules = {
  step(w, mask) {
    const push = (mask & IN.RIGHT ? 1 : 0) - (mask & IN.LEFT ? 1 : 0);
    w.v = q(w.v * 0.9 + push * w.gain * 0.1 + (rand(w) - 0.5) * 0.01);
    w.x = q(w.x + w.v);
  },
  apply(w, action) {
    if (action.type === "gain") w.gain = action.value;
  },
  applyChange(w, change) {
    w[change.variable] = change.to;
  },
  measure: (w) => ({ gain: w.gain, x: w.x, mass: w.mass }),
};
const fresh = (seed = 7) => ({ rng: seed, x: 0, v: 0, gain: 2, mass: 5 });
const run = (tl, mask, n) => {
  for (let i = 0; i < n; i++) tl.step(mask);
};

// ---- Timeline: rewind restores exactly ----
{
  const sim = new Simulation(rules, fresh());
  const tl = new Timeline(sim);
  run(tl, IN.RIGHT, 90);
  const beforeDecision = sim.snapshot();
  const a = tl.mark("gain", { en: "gain 3", es: "ganancia 3" }, { type: "gain", value: 3 });
  tl.resolve({ ok: false, key: "tooFast" });
  run(tl, IN.RIGHT, 120);
  const endA = sim.hash();
  const xA = sim.world.x;

  tl.rewindTo(a);
  assert.equal(
    sim.snapshot(),
    beforeDecision,
    "rewind restores the exact state before the decision",
  );
  assert.equal(sim.world.gain, 2, "the mathematical variable is restored, not just the picture");

  const b = tl.mark("gain", { en: "gain 1", es: "ganancia 1" }, { type: "gain", value: 1 });
  tl.resolve({ ok: true, key: "arrived" });
  run(tl, IN.RIGHT, 120);
  tl.close();
  assert.notEqual(sim.world.x, xA, "the new branch really diverges");

  // Branches are independent: the original is intact.
  assert.equal(tl.nodes[a].endHash, endA, "original branch end is preserved");
  assert.deepEqual(tl.leaves(), [a, b]);
  const cmp = tl.compare(a, b);
  assert.deepEqual(cmp.shared, [0]);
  assert.deepEqual([cmp.a, cmp.b], [[a], [b]]);
  assert.equal(tl.firstFailure(a), a, "the failing decision is identified");
  assert.equal(tl.firstFailure(b), -1);

  // Replay both branches: every recorded state must be reproduced.
  for (const leaf of [a, b]) {
    const here = sim.snapshot();
    const r = tl.replay(leaf);
    let ticks = 0;
    while (r.pump()) ticks++;
    assert.equal(ticks, r.total);
    assert.ok(r.verify(), `replay of branch ${leaf} reproduces its hashes`);
    assert.equal(sim.hash(), tl.nodes[leaf].endHash);
    r.end();
    assert.equal(sim.snapshot(), here, "leaving replay returns the student to where they were");
  }

  // A corrupted input stream must be DETECTED, or verify() proves nothing.
  // (Branch a: the head's own tail is refreshed from live play on every replay.)
  const saved = tl.nodes[a].tail.slice();
  tl.nodes[a].tail = [IN.LEFT, 120];
  const bad = tl.replay(a);
  while (bad.pump());
  assert.equal(bad.verify(), false, "replay notices a branch that no longer reproduces");
  bad.end();
  tl.nodes[a].tail = saved;

  // Multi-step path: rewind to the FIRST of two decisions, keep both originals.
  const c = tl.mark("gain", { en: "gain 4", es: "ganancia 4" }, { type: "gain", value: 4 });
  run(tl, IN.LEFT, 40);
  tl.rewindTo(b);
  assert.equal(sim.snapshot(), beforeDecision);
  const d = tl.mark("gain", { en: "gain 5", es: "ganancia 5" }, { type: "gain", value: 5 });
  run(tl, 0, 30);
  for (const leaf of [a, c, d]) {
    const r = tl.replay(leaf);
    while (r.pump());
    assert.ok(r.verify(), `branch ${leaf} still replays after later rewinds`);
    r.end();
  }

  // Save and resume: the revived timeline replays the same.
  const copy = new Simulation(rules, fresh());
  const tl2 = Timeline.revive(copy, JSON.parse(JSON.stringify(tl.serialize())));
  copy.restore(sim.snapshot());
  const r2 = tl2.replay(tl2.leaves()[0]);
  while (r2.pump());
  assert.ok(r2.verify(), "a saved timeline replays after reload");
  r2.end();
  assert.throws(() => tl.rewindTo(0), /past the start/);
}

// ---- Determinism across seeds: same seed + inputs => same hash; different seed differs ----
{
  const play = (seed) => {
    const sim = new Simulation(rules, fresh(seed));
    for (let i = 0; i < 500; i++) sim.step(i % 7 < 4 ? IN.RIGHT : IN.LEFT);
    return sim.hash();
  };
  for (let seed = 1; seed <= 50; seed++) assert.equal(play(seed), play(seed));
  assert.notEqual(play(1), play(2));
}

// ---- Multiverse: one changed condition, everything else invariant ----
{
  const mv = new Multiverse(rules, fresh());
  for (let i = 0; i < 60; i++) mv.step(IN.RIGHT);
  const atFork = mv.worlds[PRIME].x;
  mv.shift({ variable: "gain", from: 2, to: 4 });
  assert.equal(mv.worlds[SHIFTED].x, atFork, "the fork starts from the same state");
  assert.equal(mv.worlds[PRIME].gain, 2, "the original timeline is never overwritten");
  for (let i = 0; i < 60; i++) mv.step(IN.RIGHT);
  const inv = mv.investigate();
  assert.deepEqual(inv.changed.map((c) => c.key).sort(), ["gain", "x"]);
  assert.deepEqual(
    inv.invariant.map((c) => c.key),
    ["mass"],
  );
  assert.ok(mv.worlds[SHIFTED].x > mv.worlds[PRIME].x, "a bigger gain goes farther");
  assert.equal(mv.worlds[SHIFTED].rng, mv.worlds[PRIME].rng, "same randomness in both realities");

  // The prime reality is exactly what it would have been with no shift at all.
  const solo = new Simulation(rules, fresh());
  for (let i = 0; i < 120; i++) solo.step(IN.RIGHT);
  assert.equal(
    JSON.stringify(mv.worlds[PRIME]),
    solo.snapshot(),
    "shifting never disturbs the prime world",
  );

  // Reversible, and rewindable on a timeline.
  const tl = new Timeline(mv);
  const s = tl.mark(
    "shift",
    { en: "gain 2→6", es: "ganancia 2→6" },
    {
      type: "shift",
      change: { variable: "gain", from: 2, to: 6 },
    },
  );
  run(tl, IN.RIGHT, 30);
  mv.apply({ type: "switch", reality: SHIFTED });
  assert.equal(mv.world.gain, 6);
  tl.rewindTo(s);
  assert.equal(mv.change.to, 4, "rewinding across a shift restores the earlier alternate reality");
  mv.collapse();
  assert.equal(mv.shifted, false);
  assert.equal(mv.active, PRIME);
  assert.equal(mv.history.length, 1, "branch history keeps what was changed");
}

// ---- Apprentice: knowledge advances only on defined evidence ----
{
  const concept = {
    id: "exp",
    lessons: ["6-3"],
    misconceptionTag: "exponent-as-multiplication",
    misconception: { en: "2^3 is 2 × 3", es: "2^3 es 2 × 3" },
    knowledge: { en: "2^3 is 2 × 2 × 2", es: "2^3 es 2 × 2 × 2" },
    distinctions: [
      { id: "repeat", label: { en: "the base repeats", es: "la base se repite" } },
      {
        id: "count",
        label: { en: "the exponent counts factors", es: "el exponente cuenta factores" },
      },
    ],
    accepts: ["model", "counterexample", "compare"],
    needKinds: 2,
    ability: { en: "Twin spark", es: "Chispa doble" },
  };
  const task = { needs: ["repeat", "count"], correct: 81, misconceived: 12, signature: "3^4" };
  const ap = new Apprentice([concept]);
  assert.equal(ap.status("exp"), STATUS.HOLDS);
  assert.equal(ap.attempt("exp", task).answer, 12, "it starts by using its misconception");

  // Telling the answer, an invalid model and an unaccepted kind change nothing.
  for (let i = 0; i < 5; i++)
    ap.observe("exp", { kind: TELL, valid: true, shows: ["repeat", "count"] });
  ap.observe("exp", { kind: "model", valid: false, shows: ["repeat", "count"] });
  ap.observe("exp", { kind: "guide", valid: true, shows: ["repeat", "count"] });
  ap.observe("exp", { kind: "model", valid: true, shows: ["not-a-distinction"] });
  assert.equal(ap.status("exp"), STATUS.HOLDS, "no evidence, no learning");
  assert.equal(ap.transfer("exp", task).passed, false);

  ap.observe("exp", { kind: "model", valid: true, shows: ["repeat"], signature: "2^3" });
  assert.equal(ap.status("exp"), STATUS.CHALLENGED);
  const partial = ap.attempt("exp", task);
  assert.equal(partial.rule, "misconception");
  assert.equal(partial.missing.id, "count", "the missing distinction is named");

  // All distinctions but only ONE kind of demonstration: not ready yet.
  ap.observe("exp", { kind: "model", valid: true, shows: ["count"], signature: "2^4" });
  assert.equal(ap.status("exp"), STATUS.CHALLENGED);
  ap.observe("exp", { kind: "counterexample", valid: true, shows: ["count"], signature: "2^3" });
  assert.equal(ap.status("exp"), STATUS.READY);
  assert.equal(ap.has("exp"), false, "ready is not learned: the transfer task decides");

  assert.throws(
    () => ap.transfer("exp", { ...task, signature: "2^3" }),
    /repeats a teaching example/,
    "a transfer task may not duplicate a teaching example",
  );
  const t = ap.transfer("exp", task);
  assert.ok(t.passed);
  assert.equal(t.answer, 81);
  assert.equal(ap.status("exp"), STATUS.LEARNED);
  assert.ok(ap.has("exp"));

  // State survives a save: a revived apprentice remembers.
  const again = new Apprentice([concept], JSON.parse(JSON.stringify(ap.state)));
  assert.ok(again.has("exp"));
  assert.equal(again.attempt("exp", task).rule, "correct");
}

// ---- Evidence: strands stay separate; speed cannot be recorded ----
{
  const log = new EvidenceLog({ gameId: "t" });
  log.decision("L1", "6-3", "power", false, { misconception: "exponent-as-multiplication" });
  log.decision("L1", "6-3", "power", true, { support: "factor-view" });
  log.decision("L1", "6-3", "power", true);
  log.record({
    level: "L1",
    lesson: "6-3",
    mechanic: "power",
    strand: "reasoning",
    ok: true,
    detail: { kind: "prediction" },
  });
  log.record({ level: "L1", lesson: "6-3", mechanic: "power", strand: "completion", ok: true });
  const s = log.summary();
  assert.equal(s.decisions, 3);
  assert.equal(s.accepted, 2);
  assert.equal(s.revised, 1, "a miss followed by a fix is a revision");
  assert.equal(s.independent, 1, "a supported solve is not counted as independent");
  assert.equal(s.predictionsHeld, 1);
  assert.deepEqual(s.levelsCompleted, ["L1"]);
  assert.equal(s.misconceptions["exponent-as-multiplication"], 1);
  assert.throws(
    () =>
      log.record({ level: "L1", lesson: "6-3", mechanic: "p", strand: "accuracy", elapsedMs: 900 }),
    /speed measure/,
  );
  assert.throws(
    () =>
      log.record({
        level: "L1",
        lesson: "6-3",
        mechanic: "p",
        strand: "accuracy",
        detail: { reactionMs: 3 },
      }),
    /speed measure/,
  );
  assert.throws(
    () => log.record({ level: "L1", lesson: "6-3", mechanic: "p", strand: "speed" }),
    /unknown strand/,
  );
  const back = EvidenceLog.revive("t", JSON.parse(JSON.stringify(log.serialize())));
  assert.deepEqual(back.summary(), s);
}

console.log("PASS universe runtime: timeline, multiverse, apprentice, evidence");
