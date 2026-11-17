// The Final Reality — every ring of the boss proven solvable and solved
// through the real rules, rings falling only in order, a one-sided move undone,
// and the pulses harmless and telegraphed.
import assert from "node:assert/strict";
import { equivalent } from "../../math/games/universe/games/expression-factory/math.js";
import {
  createWorld,
  FLOOR,
  LEVELS,
} from "../../math/games/universe/games/final-reality/levels.js";
import { rules } from "../../math/games/universe/games/final-reality/rules.js";
import { passesAll } from "../../math/games/universe/games/inequality-invasion/math.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

// ---------- every stage has a whole-number answer, and its traps are wrong ----------
for (const L of LEVELS)
  for (const s of L.stages) {
    if (s.kind === "structure")
      assert.ok(Number.isInteger(s.volume / (s.l * s.w)), `${L.id}: the height is a whole number`);
    if (s.kind === "power") {
      assert.ok(
        equivalent(
          [
            { op: "+", k: s.c },
            { op: "*", k: s.k },
          ],
          [
            { op: "*", k: s.k },
            { op: "+", k: s.k * s.c },
          ],
        ),
      );
      assert.ok(
        !equivalent(
          [
            { op: "+", k: s.c },
            { op: "*", k: s.k },
          ],
          [
            { op: "*", k: s.k },
            { op: "+", k: s.c },
          ],
        ),
      );
    }
    if (s.kind === "transport") assert.ok(Number.isInteger(s.d / s.t));
    if (s.kind === "barrier") {
      const pass = s.codes.filter((c) => passesAll(s.want, c));
      assert.ok(
        pass.length >= 2 && pass.length < s.codes.length,
        `${L.id}: the barrier sorts its codes`,
      );
      for (const w of s.want)
        assert.ok(s.codes.includes(w.k), `${L.id}: a code sits on the boundary ${w.k}`);
    }
    if (s.kind === "shutdown")
      assert.ok(
        Number.isInteger((s.c - s.b) / s.a),
        `${L.id}: the shutdown solution is a whole number`,
      );
  }

function play(index) {
  const sim = new Simulation(rules, createWorld(index, 8));
  const tl = new Timeline(sim);
  const log = [];
  const act = (a) => {
    tl.mark("x", { en: a.type, es: a.type }, a);
    sim.drain(log);
    return log.filter((e) => e.type === "outcome" || e.type === "refuse").at(-1);
  };
  return { sim, tl, log, act, w: () => sim.world };
}

{
  const g = play(0);
  assert.equal(
    g.act({ type: "power", stage: 1, a: 3, b: 12 }).type,
    "refuse",
    "rings fall in order",
  );
  let o = g.act({ type: "structure", stage: 0, h: 29 });
  assert.deepEqual([o.ok, o.misconception], [false, "geom-volume-added-dimensions"]);
  assert.equal(g.act({ type: "structure", stage: 0, h: 3 }).ok, true);
  o = g.act({ type: "power", stage: 1, a: 3, b: 4 });
  assert.deepEqual([o.ok, o.misconception], [false, "algebra-distributive-partial"]);
  assert.equal(g.act({ type: "power", stage: 1, a: 3, b: 12 }).ok, true);
  o = g.act({ type: "transport", stage: 2, n: 1, d: 3 });
  assert.deepEqual([o.ok, o.misconception], [false, "ratio-inverted"]);
  assert.equal(g.act({ type: "transport", stage: 2, n: 3, d: 1 }).ok, true);
  o = g.act({
    type: "barrier",
    stage: 3,
    rules: [
      { sym: ">", k: 7 },
      { sym: "<", k: 12 },
    ],
  });
  assert.deepEqual([o.ok, o.misconception], [false, "inequality-boundary-inclusion"]);
  assert.equal(
    g.act({
      type: "barrier",
      stage: 3,
      rules: [
        { sym: "≥", k: 7 },
        { sym: "<", k: 12 },
      ],
    }).ok,
    true,
  );
  // Shutdown: 4x + 6 = 30. A one-sided move breaks the equation and is undone.
  o = g.act({ type: "move", stage: 4, op: "sub", k: 6, side: "left" });
  assert.deepEqual([o.ok, o.key], [false, "moveBroke"]);
  assert.deepEqual(g.w().stages[4].eq, { a: 4, b: 6, c: 30 }, "the broken move is undone");
  o = g.act({ type: "move", stage: 4, op: "add", k: 6, side: "both" });
  assert.deepEqual(
    [o.ok, o.misconception],
    [false, "equation-not-inverse-operation"],
    "still true, but further from x alone",
  );
  g.act({ type: "move", stage: 4, op: "sub", k: 12, side: "both" });
  assert.equal(g.act({ type: "move", stage: 4, op: "div", k: 4, side: "both" }).ok, true);
  assert.ok(
    g.log.some((e) => e.type === "complete"),
    "the Engine shuts down",
  );
  assert.equal(g.w().pulse.period, 0, "and its pulses stop");
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}
{
  const g = play(1);
  g.act({ type: "structure", stage: 0, h: 4 });
  g.act({ type: "power", stage: 1, a: 2, b: 14 });
  g.act({ type: "transport", stage: 2, n: 5, d: 1 });
  g.act({
    type: "barrier",
    stage: 3,
    rules: [
      { sym: "≥", k: 4 },
      { sym: "<", k: 10 },
    ],
  });
  g.act({ type: "move", stage: 4, op: "add", k: 3, side: "both" });
  g.act({ type: "move", stage: 4, op: "div", k: 5, side: "both" });
  assert.ok(
    g.log.some((e) => e.type === "complete"),
    "encore completes",
  );
}
// The pulse is telegraphed and harmless: standing in its path knocks Wren back, nothing more.
{
  const sim = new Simulation(rules, createWorld(0, 8));
  const log = [];
  sim.world.p.x = 400;
  for (let i = 0; i < 520; i++) {
    sim.step(0);
    sim.drain(log);
  }
  const warn = log.findIndex((e) => e.type === "pulseWarn");
  const hit = log.findIndex((e) => e.type === "bump");
  assert.ok(warn >= 0 && hit > warn, "a warning comes before every pulse");
  assert.ok(sim.world.p.y + sim.world.p.h <= FLOOR + 1);
}

console.log(
  "PASS final reality: every ring solvable and solved in order, one-sided moves undone, pulses telegraphed",
);
