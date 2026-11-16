// Inequality Invasion — every gate sorts every glimmer by the rule. Mathematics
// against first principles, every mission's wave proven to test its boundary,
// every room played through the rules, and the two classic slips recognised.
import assert from "node:assert/strict";
import { createWorld, LEVELS } from "../../math/games/universe/games/inequality-invasion/levels.js";
import {
  linearText,
  passesAll,
  sameOn,
  satisfies,
  slipOf,
  solveLinear,
} from "../../math/games/universe/games/inequality-invasion/math.js";
import { rules } from "../../math/games/universe/games/inequality-invasion/rules.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

// ---------- mathematics ----------
for (let k = -5; k <= 15; k++)
  for (let v = -10; v <= 20; v++) {
    assert.equal(satisfies({ sym: "<", k }, v), v < k);
    assert.equal(satisfies({ sym: "≤", k }, v), v <= k);
    assert.equal(satisfies({ sym: ">", k }, v), v > k);
    assert.equal(satisfies({ sym: "≥", k }, v), v >= k);
  }
assert.ok(
  sameOn({ sym: "≤", k: 8 }, { sym: "<", k: 9 }, -50, 50),
  "on whole numbers, x ≤ 8 and x < 9 agree",
);
assert.equal(slipOf({ sym: "≤", k: 8 }, { sym: "<", k: 8 }), "inequality-boundary-inclusion");
assert.equal(slipOf({ sym: "≤", k: 8 }, { sym: "≥", k: 8 }), "inequality-direction-flipped");
assert.equal(linearText({ a: 3, b: 2, sym: "≤", c: 20 }), "3x + 2 ≤ 20");
assert.equal(linearText({ a: 1, b: -4, sym: ">", c: 3 }), "x − 4 > 3");

// ---------- every mission is consistent, and its wave tests the boundary ----------
for (const L of LEVELS)
  for (const r of L.rooms) {
    if (r.kind === "solve") {
      const s = solveLinear(r.p);
      assert.ok(Number.isInteger(s.k), `${linearText(r.p)} has a whole-number boundary`);
      assert.deepEqual(s, r.want[0], `${linearText(r.p)} solves to the gate it requires`);
      // The two-step form and the solved form accept the same glimmers.
      for (let v = -10; v <= 30; v++)
        assert.equal(satisfies({ sym: r.p.sym, k: r.p.c }, r.p.a * v + r.p.b), satisfies(s, v));
    }
    if (r.kind === "between")
      for (let v = -10; v <= 30; v++)
        assert.equal(passesAll(r.want, v), v >= r.lo && v <= r.hi, `between ${r.lo} and ${r.hi}`);
    // Boundary in the wave: every wanted rule meets a glimmer AT its boundary and on both sides of it.
    for (const w of r.want) {
      const edge =
        w.sym === "<" || w.sym === ">"
          ? [w.k, w.sym === "<" ? w.k - 1 : w.k + 1]
          : [w.k, w.sym === "≤" ? w.k + 1 : w.k - 1];
      for (const v of edge)
        assert.ok(r.wave.includes(v), `${L.id}: the wave tests ${v} for ${w.sym} ${w.k}`);
    }
    // No wrong single rule sorts the wave right by luck: flipped and boundary slips both fail it.
    for (const [i, w] of r.want.entries())
      for (const slip of [
        { sym: { "<": "≤", "≤": "<", ">": "≥", "≥": ">" }[w.sym], k: w.k },
        { sym: { "<": ">", "≤": "≥", ">": "<", "≥": "≤" }[w.sym], k: w.k },
      ]) {
        const rulesTried = r.want.map((x, j) => (j === i ? slip : x));
        assert.ok(
          r.wave.some((v) => passesAll(rulesTried, v) !== passesAll(r.want, v)),
          `${L.id}: the wave catches ${slip.sym} ${slip.k}`,
        );
      }
  }

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 5));
  const tl = new Timeline(sim);
  const log = [];
  const act = (a) => {
    tl.mark("x", { en: a.type, es: a.type }, a);
    sim.drain(log);
  };
  const release = (room) => {
    act({ type: "release", room });
    for (let i = 0; i < 2000 && sim.world.rooms[room].run; i++) {
      tl.step(0);
      sim.drain(log);
    }
    return log.filter((e) => e.type === "outcome").at(-1);
  };
  const set = (room, gate, sym, k) => act({ type: "rule", room, gate, sym, k });
  return { sim, tl, log, release, set, w: () => sim.world };
}

{
  const g = play(0);
  g.set(0, 0, "<", 8);
  let o = g.release(0);
  assert.deepEqual(
    [o.ok, o.misconception, o.vars.wrong],
    [false, "inequality-boundary-inclusion", "8"],
    "the 8-glimmer shows the boundary",
  );
  assert.ok(g.log.some((e) => e.type === "divert" && e.v === 8));
  g.set(0, 0, "≤", 8);
  assert.equal(g.release(0).ok, true);
  g.set(1, 0, "<", 4);
  o = g.release(1);
  assert.deepEqual([o.ok, o.misconception], [false, "inequality-direction-flipped"]);
  g.set(1, 0, ">", 4);
  assert.equal(g.release(1).ok, true);
  g.set(2, 0, ">", 9);
  assert.equal(g.release(2).ok, true, "x > 9 sorts whole numbers like x ≥ 10");
}
{
  const g = play(1);
  g.set(0, 0, "≤", 20);
  assert.equal(g.release(0).ok, false, "the unsolved boundary lets too many through");
  g.set(0, 0, "≤", 6);
  assert.equal(g.release(0).ok, true);
  g.set(1, 0, ">", 7);
  assert.equal(g.release(1).ok, true);
  g.set(2, 0, "<", 7);
  assert.equal(g.release(2).ok, true);
}
{
  const g = play(2);
  g.set(0, 0, "≥", 5);
  assert.equal(g.release(0).ok, false, "one gate is not enough for 'between'");
  g.set(0, 1, "≤", 9);
  assert.equal(g.release(0).ok, true);
  g.set(1, 0, "≥", 3);
  g.set(1, 1, "≤", 7);
  assert.equal(g.release(1).ok, true);
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}

console.log(
  "PASS inequality invasion: mathematics, waves test every boundary, three levels played, slips recognised",
);
