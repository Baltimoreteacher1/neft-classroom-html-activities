// Ratio Rush — mathematics recomputed independently, every level played by a
// scripted driver through the real rules, and the Reality Shift proved honest:
// two realities differ only by the one condition changed.
import assert from "node:assert/strict";
import { createWorld, LEVELS } from "../../math/games/universe/games/ratio-rush/levels.js";
import {
  additive,
  compare,
  distanceAt,
  equivalent,
  simplest,
  table,
  timeFor,
} from "../../math/games/universe/games/ratio-rush/math.js";
import { arrivalTicks, rules, standingAt, stopAt } from "../../math/games/universe/games/ratio-rush/rules.js";
import { Multiverse, PRIME, SHIFTED } from "../../math/games/universe/runtime/multiverse.js";
import { IN } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

// ---------- mathematics against first principles ----------
for (let a = 1; a <= 12; a++)
  for (let b = 1; b <= 12; b++)
    for (let k = 1; k <= 5; k++) {
      assert.ok(equivalent({ d: a, t: b }, { d: a * k, t: b * k }));
      if (k > 1) assert.ok(!equivalent({ d: a, t: b }, additive({ d: a, t: b }, k - 1)) || a === b);
      assert.equal(compare({ d: a, t: b }, { d: a * k, t: b * k }), 0);
      const s = simplest({ d: a * k, t: b * k });
      assert.equal(s.d * b, s.t * a);
      const dist = distanceAt({ d: a, t: b }, k);
      assert.equal(dist.n * b, a * k * dist.d);
      const tf = timeFor({ d: a, t: b }, k);
      assert.equal(tf.n * a, k * b * tf.d);
    }
assert.deepEqual(table({ d: 3, t: 2 }, 3), [
  { d: 3, t: 2 },
  { d: 6, t: 4 },
  { d: 9, t: 6 },
]);
// Arrival ticks: equivalent rates arrive on the same tick, always.
for (let d = 1; d <= 12; d++)
  for (let t = 1; t <= 12; t++)
    for (const L of [4, 6, 8, 10, 15])
      assert.equal(arrivalTicks({ d, t }, L), arrivalTicks({ d: d * 3, t: t * 3 }, L));

// ---------- authored levels are solvable, and only by the mathematics ----------
for (const s of LEVELS[0].stops) {
  const good = [];
  for (const d of s.dOptions)
    for (let t = 1; t <= s.tMax; t++) if (equivalent({ d, t }, s.partner)) good.push(`${d}:${t}`);
  assert.ok(good.length > 0, `${s.id} has an equivalent gear`);
  assert.ok(!s.dOptions.includes(s.partner.d) || s.partner.t > s.tMax || s.id !== "c1", "c1 cannot copy the partner");
}
const branchTime = (b) => (b.len * b.rate.t) / b.rate.d;
const answers = LEVELS[1].stops.map((s) => (branchTime(s.upper) < branchTime(s.lower) ? 1 : 2));
assert.deepEqual(answers, [2, 1, 2], "junction answers vary, so 'always lower' does not work");
for (const s of LEVELS[1].stops) assert.notEqual(branchTime(s.upper), branchTime(s.lower), `${s.id} is not a tie`);
const need = LEVELS[2].stops.map((s) => (s.span * s.rate.t) / s.rate.d);
assert.ok(need.every(Number.isInteger), "every leg needs a whole number of cells");
assert.equal(LEVELS[2].budget, need.reduce((a, b) => a + b) + 2, "the budget allows exactly one small mistake");

// ---------- a driver that plays through the real rules ----------
function play(index) {
  const mv = new Multiverse(rules, createWorld(index, 50 + index));
  const tl = new Timeline(mv);
  const log = [];
  const tick = (mask = 0) => {
    tl.step(mask);
    mv.drain(log);
  };
  const w = () => mv.world;
  const driveTo = (x, limit = 6000) => {
    for (let i = 0; i < limit; i++) {
      const tr = w().train;
      if (tr.mode !== "drive") {
        tick();
        continue;
      }
      if (tr.x >= x - 0.02 && Math.abs(tr.v) < 0.0004) return;
      // Pass a maintenance cart on the side track: up at the crossover before it,
      // wait at the crossover after it until the cart is clear, then back down.
      const cart = w().carts.find((c) => c.lane === 0 && c.x > tr.x && c.x - tr.x < 2.4);
      const xo = w().crossovers.find((c) => Math.abs(c - tr.x) < 0.3);
      const clear = !w().carts.some((c) => c.lane === 0 && Math.abs(c.x - tr.x) < 0.9);
      const fwd = tr.x < x - 0.9 ? IN.RIGHT : tr.v > 0.006 ? IN.LEFT : tr.x < x - 0.02 ? IN.RIGHT : 0;
      let mask = fwd;
      if (tr.laneT) mask = 0;
      else if (tr.lane === 0 && cart && xo !== undefined) mask = IN.UP;
      else if (tr.lane === 0 && cart && cart.x - tr.x < 1) mask = tr.v > 0 ? IN.LEFT : 0;
      else if (tr.lane === 1 && xo !== undefined && !w().carts.some((c) => c.lane === 0 && c.x > tr.x)) mask = clear ? IN.DOWN : tr.v > 0 ? IN.LEFT : 0;
      tick(mask);
    }
    assert.fail(`level ${index}: driver stuck at ${w().train.x.toFixed(2)} lane ${w().train.lane} (target ${x})`);
  };
  const settle = (limit = 4000) => {
    for (let i = 0; i < limit && w().train.mode !== "drive"; i++) tick();
    assert.equal(w().train.mode, "drive", "the run settled");
  };
  const outcomes = () => log.filter((e) => e.type === "outcome" && (e.reality ?? 0) === mv.active);
  return { mv, tl, log, tick, w, driveTo, settle, outcomes };
}

// ---------- Level 1: Coupling Run ----------
{
  const g = play(0);
  const { w, tl, mv } = g;
  g.driveTo(4);
  assert.equal(standingAt(w())?.id, "c1", "the train stops at the first signal");

  // The additive misconception: 3:2 + 2 → 5:4 is not in the gear box, but 4:3 (3:2 + 1) is.
  const wrong = tl.mark("ratio", { en: "4:3", es: "4:3" }, { type: "gear", stop: "c1", d: 4, t: 3 });
  g.settle();
  let o = g.outcomes().at(-1);
  assert.deepEqual([o.ok, o.key, o.misconception], [false, "coupleLate", "ratio-scaled-additively"]);
  assert.equal(w().train.x, 4, "a missed coupling returns the train to the signal");

  // Reality Shift: open a second reality with 6:4; both realities run the same departure.
  tl.mark("shift", { en: "shift", es: "shift" }, { type: "shift", change: { stop: "c1", variable: "gear", from: { d: 4, t: 3 }, to: { d: 6, t: 4 } } });
  const inv = mv.investigate();
  assert.deepEqual(inv.changed.map((c) => c.key).sort(), ["after2", "arrive", "yourRate"]);
  assert.ok(inv.invariant.some((c) => c.key === "partnerRate") && inv.invariant.some((c) => c.key === "distance"));
  tl.mark("ratio", { en: "run", es: "run" }, { type: "gear", stop: "c1", d: 4, t: 3, only: PRIME });
  // Mid-run, the shifted train is exactly level with its partner; the prime one is not.
  for (let i = 0; i < 90; i++) g.tick();
  const [A, B] = mv.worlds;
  assert.equal(B.run.you, B.run.them, "6:4 keeps pace with 3:2 at every tick");
  assert.notEqual(A.run.you, A.run.them);
  g.settle();
  for (let i = 0; i < 400 && mv.worlds.some((x) => x.train.mode !== "drive"); i++) g.tick();
  assert.equal(stopAt(mv.worlds[SHIFTED], "c1").done, 1, "the shifted reality couples");
  assert.equal(stopAt(mv.worlds[PRIME], "c1").done, 0, "the first reality does not");
  tl.mark("switch", { en: "switch", es: "switch" }, { type: "switch", reality: SHIFTED });
  assert.equal(mv.active, SHIFTED);
  tl.mark("collapse", { en: "c", es: "c" }, { type: "collapse" });
  assert.equal(mv.active, PRIME);

  // Time Machine back to before the wrong gear, then the right one.
  tl.rewindTo(wrong);
  assert.equal(w().train.x, 4);
  assert.equal(mv.shifted, false, "rewinding before the shift closes the second reality");
  tl.mark("ratio", { en: "6:4", es: "6:4" }, { type: "gear", stop: "c1", d: 6, t: 4 });
  g.settle();
  assert.equal(g.outcomes().at(-1).ok, true);
  assert.equal(w().train.x, 10.2);

  // c2 needs a scale factor: 5:4 with gears 10/15/20.
  g.driveTo(16);
  tl.mark("ratio", { en: "15:12", es: "15:12" }, { type: "gear", stop: "c2", d: 15, t: 12 });
  g.settle();
  assert.equal(g.outcomes().at(-1).ok, true);
  // c3: 6:8 (= 3:4); the inverted 8:6-style 9:… is wrong, 9:12 is right.
  g.driveTo(31);
  tl.mark("ratio", { en: "12:9", es: "12:9" }, { type: "gear", stop: "c3", d: 12, t: 9 });
  g.settle();
  assert.equal(g.outcomes().at(-1).ok, false);
  tl.mark("ratio", { en: "9:12", es: "9:12" }, { type: "gear", stop: "c3", d: 9, t: 12 });
  g.settle();
  assert.equal(g.outcomes().at(-1).ok, true);
  g.driveTo(43.5);
  assert.ok(g.log.some((e) => e.type === "complete"), "level 1 completes");
  const r = tl.replay(tl.head);
  while (r.pump());
  assert.ok(r.verify(), "the whole run replays deterministically across rewinds and shifts");
  r.end();
}

// ---------- Level 2: Junction Run ----------
{
  const g = play(1);
  const { tl } = g;
  const pick = (stop, branch) => {
    tl.mark("ratio", { en: stop, es: stop }, { type: "branch", stop, branch });
    g.settle();
    return g.outcomes().at(-1);
  };
  g.driveTo(4);
  let o = pick("j1", 1);
  assert.deepEqual([o.ok, o.key], [false, "junctionLose"], "the longer-but-faster-looking upper branch loses");
  o = pick("j1", 2);
  assert.equal(o.ok, true);
  g.driveTo(18);
  assert.equal(pick("j2", 1).ok, true);
  g.driveTo(32);
  assert.equal(pick("j3", 2).ok, true);
  g.driveTo(45.5);
  assert.ok(g.log.some((e) => e.type === "complete"), "level 2 completes");
}

// ---------- Level 3: Charge Line ----------
{
  const g = play(2);
  const { tl, w } = g;
  const load = (stop, cells) => {
    tl.mark("ratio", { en: stop, es: stop }, { type: "load", stop, cells });
    g.settle();
    return g.outcomes().at(-1);
  };
  g.driveTo(3);
  // 15 / 5 = 3 cells: "per one" forgotten. Coasts 7.5 of 15 miles.
  let o = load("d1", 3);
  assert.deepEqual([o.ok, o.key, o.vars.reach, o.misconception], [false, "chargeShort", 7.5, "rate-not-per-one"]);
  assert.equal(w().budget, 17, "spent cells are gone");
  assert.equal(w().train.x, 3, "the tow brings the train back to the depot");
  o = load("d1", 6);
  assert.deepEqual([o.ok, o.key], [true, "chargeExact"]);
  g.driveTo(20);
  assert.equal(load("d2", 4).ok, true);
  g.driveTo(34);
  // 7 budget left; leg 3 needs 8: the earlier mistake must be undone with the Time Machine.
  assert.equal(w().budget, 7);
  o = load("d3", 8);
  assert.equal(g.log.at(-1).type === "refuse" || o?.stop === undefined, true);
  const first = tl.nodes.find((n) => n.action?.type === "load" && n.action.cells === 3).id;
  tl.rewindTo(first);
  assert.equal(w().budget, 20);
  load("d1", 6);
  g.driveTo(20);
  load("d2", 4);
  g.driveTo(34);
  assert.equal(load("d3", 8).ok, true);
  assert.equal(w().budget, 2);
  g.driveTo(53.8);
  assert.ok(g.log.some((e) => e.type === "complete"), "level 3 completes");
}

console.log("PASS ratio rush: mathematics, three levels played, reality shift and rewind");
