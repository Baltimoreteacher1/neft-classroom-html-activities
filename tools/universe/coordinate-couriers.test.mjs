// Coordinate Couriers — mathematics, level design proven to REQUIRE the
// mathematics (no way across the river but a cable car, no way into a walled
// district but a reflection), every level played through the real rules, and a
// bot actually driving the streets.
import assert from "node:assert/strict";
import {
  createWorld,
  LEVELS,
  toPx,
} from "../../math/games/universe/games/coordinate-couriers/levels.js";
import {
  absDifference,
  gridDistance,
  pointText,
  quadrant,
  reflect,
  slipOf,
} from "../../math/games/universe/games/coordinate-couriers/math.js";
import {
  connected,
  here,
  rules,
  spot,
} from "../../math/games/universe/games/coordinate-couriers/rules.js";
import { IN, Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

const P = (x, y) => ({ x, y });

// ---------- mathematics ----------
assert.deepEqual([P(3, 2), P(-3, 2), P(-3, -2), P(3, -2), P(0, 4)].map(quadrant), [1, 2, 3, 4, 0]);
assert.equal(gridDistance(P(-3, 2), P(-3, -4)), 6);
assert.equal(absDifference(P(-3, 2), P(-3, -4)), 2);
assert.equal(gridDistance(P(-5, -2), P(-1, -2)), 4);
assert.equal(gridDistance(P(1, 2), P(3, 4)), null);
assert.deepEqual(reflect(P(4, -3), "y"), P(-4, -3));
assert.deepEqual(reflect(P(4, -3), "x"), P(4, 3));
assert.equal(pointText(P(-1.5, 3)), "(−1.5, 3)");
assert.equal(slipOf(P(-3, 4), P(4, -3)), "coord-xy-swapped");
assert.equal(slipOf(P(-3, 4), P(3, -4)), "sign-dropped");
assert.equal(slipOf(P(-3, 4), P(1, 1)), null);
for (let x = -6; x <= 6; x++)
  for (let y = -6; y <= 6; y++) {
    const p = P(x, y);
    assert.deepEqual(reflect(reflect(p, "x"), "x"), p);
    assert.deepEqual(reflect(reflect(p, "x"), "y"), P(-x, -y), "two reflections = half turn");
    assert.equal(gridDistance(p, reflect(p, "x")), 2 * Math.abs(y));
  }

// ---------- the design forces the mathematics ----------
{
  const w = createWorld(1, 1);
  const L = LEVELS[1];
  for (const c of L.cables) {
    assert.notEqual(gridDistance(c.a, c.b), null, `${c.id} runs along one street`);
    assert.ok(
      !connected(w, c.a, c.b),
      `${c.id}: no way from ${pointText(c.a)} to ${pointText(c.b)} but the cable`,
    );
  }
  // Deliveries go in order: each is out of reach (without a cable) from where the last one left you.
  let from = L.start;
  for (const d of L.deliveries) {
    assert.ok(
      !connected(w, from, d),
      `${pointText(d)} is not reachable from ${pointText(from)} without a cable`,
    );
    from = d;
  }
  // The cable crossings are the classic slip: |a| − |b| is wrong, |a| + |b| is right.
  assert.ok(L.cables.every((c) => absDifference(c.a, c.b) !== gridDistance(c.a, c.b)));
}
{
  const w = createWorld(2, 1);
  const L = LEVELS[2];
  for (const d of L.deliveries) {
    assert.ok(!connected(w, L.start, d), `${pointText(d)} is walled off`);
    assert.ok(
      L.pads.some((p) => p.x === d.x && p.y === d.y),
      `${pointText(d)} has a pad inside`,
    );
  }
  // Every pad's reflection across at least one axis is another pad (no dead pads).
  for (const p of L.pads)
    assert.ok(
      ["x", "y"].some((a) =>
        L.pads.some((q) => q.x === reflect(p, a).x && q.y === reflect(p, a).y),
      ),
      `${pointText(p)} leads somewhere`,
    );
}

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 3));
  const tl = new Timeline(sim);
  const log = [];
  const act = (a, ticks = 0) => {
    tl.mark("move", { en: a.type, es: a.type }, a);
    sim.drain(log);
    for (let i = 0; i < ticks; i++) {
      tl.step(0);
      sim.drain(log);
    }
  };
  const last = () => log.filter((e) => e.type === "outcome").at(-1);
  const w = () => sim.world;
  return { sim, tl, log, act, last, w };
}

// Level 1: deliveries, with the two classic slips.
{
  const g = play(0);
  const { act, last, w } = g;
  const go = (p) => act({ type: "travel", x: p.x, y: p.y });
  go(P(2, 3));
  act({ type: "deliver", at: P(2, 3) });
  assert.deepEqual(
    [last().ok, last().misconception],
    [false, "coord-xy-swapped"],
    "(2, 3) for (3, 2)",
  );
  go(P(3, 2));
  act({ type: "deliver", at: P(3, 2) });
  assert.equal(last().ok, true);
  go(P(4, -1));
  act({ type: "deliver", at: P(4, -1) });
  assert.deepEqual(
    [last().ok, last().misconception],
    [false, "sign-dropped"],
    "(4, −1) for (−4, 1)",
  );
  for (const d of LEVELS[0].deliveries.slice(1)) {
    go(d);
    act({ type: "deliver", at: d });
    assert.equal(last().ok, true, `delivered ${pointText(d)}`);
  }
  assert.ok(g.log.some((e) => e.type === "complete"));
}

// A real drive: the bot steers the car along the streets to (−2, −3), corner by corner.
{
  const sim = new Simulation(rules, createWorld(0, 3));
  const goal = P(-2, -3);
  const path = [P(0, 0), P(0, -1), P(-1, -1), P(-2, -1), P(-2, -2), P(-2, -3)];
  for (const target of path.slice(1)) {
    for (let i = 0; i < 600; i++) {
      const h = here(sim.world);
      const dx = target.x - h.x;
      const dy = target.y - h.y;
      if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) break;
      let m = 0;
      if (dx > 0.06) m |= IN.RIGHT;
      if (dx < -0.06) m |= IN.LEFT;
      if (dy > 0.06) m |= IN.UP;
      if (dy < -0.06) m |= IN.DOWN;
      sim.step(m);
    }
  }
  for (let i = 0; i < 60; i++) sim.step(0);
  assert.deepEqual(spot(sim.world), goal, "the car drove the streets to (−2, −3)");
}

// Level 2: cable cars. The |a| − |b| slip stops the car over the river.
{
  const g = play(1);
  const { act, last, w } = g;
  act({ type: "travel", x: -3, y: 2 });
  act({ type: "cable", cable: "c1", end: "a", L: 2 }, 220);
  assert.deepEqual([last().ok, last().misconception], [false, "sign-dropped"]);
  assert.ok(
    g.log.some((e) => e.type === "short" && e.over),
    "the car stopped over the water",
  );
  assert.deepEqual(spot(w()), P(-3, 2), "and came back to its station");
  act({ type: "cable", cable: "c1", end: "a", L: 6 }, 260);
  assert.deepEqual(spot(w()), P(-3, -4));
  act({ type: "travel", x: -2, y: -5 });
  assert.deepEqual(spot(w()), P(-2, -5));
  act({ type: "cable", cable: "c2", end: "a", L: 5 }, 260);
  act({ type: "travel", x: 1, y: -5 });
  act({ type: "deliver", at: P(1, -5) });
  assert.equal(last().ok, true);
  act({ type: "travel", x: 4, y: -3 });
  act({ type: "cable", cable: "c3", end: "a", L: 6 }, 400);
  assert.equal(last().ok, false, "6 overshoots 5");
  assert.deepEqual(spot(w()), P(4, -3));
  act({ type: "cable", cable: "c3", end: "a", L: 5 }, 260);
  act({ type: "travel", x: 5, y: 4 });
  act({ type: "deliver", at: P(5, 4) });
  assert.ok(g.log.some((e) => e.type === "complete"));
}

// Level 3: mirrors, including a two-reflection route.
{
  const g = play(2);
  const { act, last, w } = g;
  const pad = (p) => w().pads.findIndex((q) => q.x === p.x && q.y === p.y);
  act({ type: "travel", x: 4, y: -3 });
  act({ type: "mirror", pad: pad(P(4, -3)), axis: "x" }, 50);
  assert.deepEqual([last().ok, last().key], [false, "mirrorNoPad"], "(4, 3) has no pad");
  act({ type: "mirror", pad: pad(P(4, -3)), axis: "y" }, 50);
  assert.deepEqual(spot(w()), P(-4, -3));
  act({ type: "deliver", at: P(-4, -3) });
  assert.equal(last().ok, true);
  act({ type: "mirror", pad: pad(P(-4, -3)), axis: "y" }, 50);
  act({ type: "travel", x: 2, y: -5 });
  act({ type: "mirror", pad: pad(P(2, -5)), axis: "x" }, 50);
  act({ type: "deliver", at: P(2, 5) });
  assert.equal(last().ok, true);
  act({ type: "mirror", pad: pad(P(2, 5)), axis: "x" }, 50);
  act({ type: "travel", x: 5, y: -2 });
  act({ type: "mirror", pad: pad(P(5, -2)), axis: "x" }, 50);
  assert.deepEqual(spot(w()), P(5, 2));
  act({ type: "mirror", pad: pad(P(5, 2)), axis: "y" }, 50);
  assert.deepEqual(spot(w()), P(-5, 2), "two reflections reach the far district");
  act({ type: "deliver", at: P(-5, 2) });
  assert.ok(g.log.some((e) => e.type === "complete"));
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}

console.log(
  "PASS coordinate couriers: mathematics, design forces the math, three levels played, a real drive",
);
