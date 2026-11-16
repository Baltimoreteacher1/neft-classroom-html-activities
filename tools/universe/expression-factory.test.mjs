// Expression Factory — the line is the expression. Mathematics recomputed with
// an independent evaluator, every order solvable within its slots, every room
// played through the rules, and the slips recognised.
import assert from "node:assert/strict";
import { createWorld, LEVELS } from "../../math/games/universe/games/expression-factory/levels.js";
import {
  equivalent,
  evaluate,
  linear,
  sameChain,
  simplest,
  write,
} from "../../math/games/universe/games/expression-factory/math.js";
import { rules } from "../../math/games/universe/games/expression-factory/rules.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

const M = (op, k) => (k === undefined ? { op } : { op, k });
// Independent evaluator over plain numbers.
const ref = (line, x) =>
  line.reduce(
    (v, m) =>
      ({ "+": v + m.k, "-": v - m.k, "*": v * m.k, "/": v / m.k, "+x": v + x, "-x": v - x })[m.op],
    x,
  );

// ---------- mathematics ----------
for (let x = -5; x <= 9; x++)
  for (const line of [
    [M("*", 3), M("+", 2)],
    [M("+", 1), M("*", 4)],
    [M("+x"), M("+", 2), M("+x"), M("+", 3)],
    [M("+", 3), M("*", 4), M("-x")],
    [M("+", 4), M("/", 2)],
  ]) {
    const v = evaluate(line, x);
    assert.ok(Math.abs(v.n / v.d - ref(line, x)) < 1e-12);
  }
assert.equal(write([M("*", 3), M("+", 2)]), "3x + 2");
assert.equal(write([M("+", 1), M("*", 4)]), "4(x + 1)");
assert.equal(write([M("+", 4), M("/", 2)]), "(x + 4) ÷ 2");
assert.equal(simplest([M("+x"), M("+", 2), M("+x"), M("+", 3)]), "3x + 5");
assert.equal(simplest([M("+", 3), M("*", 4), M("-x")]), "3x + 12");
assert.equal(simplest([M("*", 2), M("-", 1)]), "2x − 1");
assert.ok(equivalent([M("+", 3), M("*", 2)], [M("*", 2), M("+", 6)]));
assert.ok(!equivalent([M("+", 3), M("*", 2)], [M("*", 2), M("+", 3)]));
assert.deepEqual(linear([M("+", 2), M("*", 3)]), { a: { n: 3, d: 1 }, b: { n: 6, d: 1 } });

// ---------- every order is solvable within its slots, and twin rooms have a DIFFERENT answer ----------
const KS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
for (const L of LEVELS)
  for (const r of L.rooms) {
    const machines = r.ops.flatMap((op) => (op === "+x" ? [M("+x")] : KS.map((k) => M(op, k))));
    let found = 0;
    for (const a of machines)
      for (const b of machines) {
        const line = [a, b].slice(0, r.slots);
        if (equivalent(line, r.target) && (r.kind !== "twin" || !sameChain(line, r.target)))
          found++;
      }
    assert.ok(found > 0, `${L.id}: an order (${write(r.target)}) can be built in ${r.slots} slots`);
    if (r.kind === "streamline")
      assert.ok(r.target.length > r.slots, "streamline rooms start with too many machines");
  }

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 9));
  const tl = new Timeline(sim);
  const log = [];
  const act = (a) => {
    tl.mark("x", { en: a.type, es: a.type }, a);
    sim.drain(log);
  };
  const run = (room) => {
    act({ type: "run", room });
    for (let i = 0; i < 1200 && sim.world.rooms[room].run; i++) {
      tl.step(0);
      sim.drain(log);
    }
    return log.filter((e) => e.type === "outcome").at(-1);
  };
  const set = (room, slots) => slots.forEach((m, slot) => act({ type: "set", room, slot, m }));
  return { sim, tl, log, act, run, set, w: () => sim.world };
}

// Level 1: building expressions; the reversed order is the classic slip.
{
  const g = play(0);
  g.set(0, [M("+", 2), M("*", 3)]);
  let o = g.run(0);
  assert.deepEqual(
    [o.ok, o.misconception],
    [false, "order-of-operations-left-to-right"],
    "3(x + 2) is not 3x + 2",
  );
  assert.equal(o.vars.misses, "1, 2, 3, 4", "every crate is rejected");
  assert.equal(
    g.log.filter((e) => e.type === "stamp" && e.room === 0).length,
    8,
    "two stamps per crate",
  );
  g.set(0, [M("*", 3), M("+", 2)]);
  o = g.run(0);
  assert.equal(o.ok, true);
  assert.equal(g.w().solids[g.w().rooms[0].gate].open, 1);
  g.set(1, [M("*", 4), M("+", 1)]);
  assert.equal(g.run(1).ok, false);
  g.set(1, [M("*", 4), M("+", 4)]);
  assert.equal(g.run(1).ok, true, "4x + 4 fills the order for 4(x + 1): equivalent is enough");
  g.set(2, [M("*", 2), M("-", 1)]);
  assert.equal(g.run(2).ok, true);
}

// Level 2: twin lines must differ from the reference and still match every crate.
{
  const g = play(1);
  g.set(0, [M("+", 3), M("*", 2)]);
  let o = g.run(0);
  assert.deepEqual(
    [o.ok, o.key],
    [false, "twinSame"],
    "a copy of the reference line is not a new expression",
  );
  g.set(0, [M("*", 2), M("+", 3)]);
  o = g.run(0);
  assert.deepEqual(
    [o.ok, o.misconception],
    [false, "algebra-distributive-partial"],
    "2x + 3 for 2(x + 3)",
  );
  g.set(0, [M("*", 2), M("+", 6)]);
  assert.equal(g.run(0).ok, true);
  g.set(1, [M("+", 2), M("*", 4)]);
  assert.equal(g.run(1).ok, true);
  g.set(2, [M("*", 5), M("-", 5)]);
  assert.equal(g.run(2).ok, true);
}

// Level 3: streamline into two machines.
{
  const g = play(2);
  g.set(0, [M("*", 3), M("+", 5)]);
  assert.equal(g.run(0).ok, true);
  g.set(1, [M("*", 3), M("+", 2)]);
  const o = g.run(1);
  assert.equal(o.ok, false);
  g.set(1, [M("+", 2), M("*", 3)]);
  assert.equal(g.run(1).ok, true, "3(x + 2) streamlines 2x + 6 + x");
  g.set(2, [M("+", 4), M("*", 3)]);
  assert.equal(g.run(2).ok, true);
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}

console.log(
  "PASS expression factory: mathematics, every order solvable, three levels played, slips recognised",
);
