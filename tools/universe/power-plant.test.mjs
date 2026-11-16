// Power Plant — mathematics invariants, and every level PLAYED by a scripted
// bot through the real rules (no browser): correct settings dock, wrong ones
// stop short or trip and are recoverable, Ori's knowledge changes what Ori
// does, and a rewind restores the exact world.
import assert from "node:assert/strict";
import { createWorld, LEVELS } from "../../math/games/universe/games/power-plant/levels.js";
import {
  asMultiplication,
  clamps,
  equivalents,
  evaluate,
  leftToRight,
  power,
  running,
  show,
} from "../../math/games/universe/games/power-plant/math.js";
import {
  deviceOf,
  machineOf,
  reachable,
  rules,
  solveClamp,
  solveExp,
} from "../../math/games/universe/games/power-plant/rules.js";
import { IN, Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

// ---------- mathematics, recomputed independently ----------
for (let b = 1; b <= 10; b++)
  for (let e = 0; e <= 6; e++) {
    assert.equal(power(b, e), b ** e);
    assert.equal(running(b, e).length, e);
    if (e) assert.equal(running(b, e).at(-1), b ** e);
  }
assert.deepEqual(equivalents(64, [2, 4, 8], 6), [
  { base: 2, exp: 6 },
  { base: 4, exp: 3 },
  { base: 8, exp: 2 },
]);
assert.equal(asMultiplication(3, 3), 9, "the misconception Ori starts with");

// An independent recursive-descent evaluator (not the game's splice loop).
function reference(tokens) {
  let i = 0;
  const atom = () => tokens[i++];
  const pow = () => {
    let v = atom();
    while (tokens[i] === "^") {
      i++;
      v **= atom();
    }
    return v;
  };
  const term = () => {
    let v = pow();
    while (tokens[i] === "×" || tokens[i] === "÷") v = tokens[i++] === "×" ? v * pow() : v / pow();
    return v;
  };
  let v = term();
  while (tokens[i] === "+" || tokens[i] === "−") v = tokens[i++] === "+" ? v + term() : v - term();
  return v;
}
let seed = 9;
const next = () => {
  seed = (seed * 16807) % 2147483647;
  return seed;
};
let checked = 0;
for (let n = 0; n < 4000; n++) {
  const ops = ["+", "−", "×", "^"];
  const len = 2 + (next() % 3);
  const tokens = [1 + (next() % 6)];
  for (let k = 0; k < len; k++) {
    const op = ops[next() % 4];
    if (op === "^" && tokens.at(-2) === "^") {
      k--;
      continue;
    }
    tokens.push(op, op === "^" ? 1 + (next() % 3) : 1 + (next() % 6));
  }
  assert.equal(evaluate(tokens).value, reference(tokens), show(tokens));
  for (const g of clamps(tokens)) {
    const inner = reference(tokens.slice(g[0], g[1] + 1));
    const want = reference([...tokens.slice(0, g[0]), inner, ...tokens.slice(g[1] + 1)]);
    assert.equal(evaluate(tokens, g).value, want, show(tokens, g));
    checked++;
  }
}
assert.ok(checked > 3000, "clamped expressions were checked");
assert.equal(leftToRight([2, "+", 3, "×", 4]), 20);
assert.equal(evaluate([2, "+", 3, "×", 4]).value, 14);
assert.equal(evaluate([2, "+", 3, "×", 4], [0, 2]).value, 20);

// ---------- level data: every authored machine is solvable as authored ----------
for (const L of LEVELS) {
  for (const m of L.machines) {
    if (m.kind === "power" && m.target)
      assert.ok(
        m.bases.some((b) => solveExp(b, m.target, m.maxExp)),
        `${L.id}/${m.id} has a solution`,
      );
    if (m.kind === "ops") {
      assert.notEqual(solveClamp(m.tokens, m.target), undefined, `${L.id}/${m.id} has a clamp`);
      if (m.by === "ori")
        assert.equal(
          leftToRight(m.tokens),
          m.target,
          "Ori's sequencer tempts a left-to-right reader",
        );
    }
  }
}
// Coil Budget: the generous forms run out; the economical equivalent forms fit.
assert.ok(6 + 4 + 5 > 9 && 3 + 4 + 5 > 9 && 2 + 2 + 5 <= 9);
// Helix Core: every load is reachable within 8 coils, and never by reading left to right.
{
  const boss = LEVELS[3];
  const [A, B, C] = ["a", "b", "c"].map((id) => boss.machines.find((m) => m.id === id));
  for (const load of boss.machines.find((m) => m.kind === "combo").loads) {
    let found = 0;
    for (const a of A.bases)
      for (let ea = 0; ea <= 5; ea++)
        for (const b of B.bases)
          for (let eb = 0; eb <= 5; eb++)
            for (const c of C.bases)
              for (let ec = 0; ec <= 5; ec++)
                if (ea + eb + ec <= 8 && a ** ea + b ** eb * c ** ec === load) found++;
    assert.ok(found > 0, `core load ${load} is reachable within the coil budget`);
  }
}

// ---------- a bot that plays through the real rules ----------
function play(index, know = { exp: false, ops: false, twin: false }) {
  const sim = new Simulation(rules, createWorld(index, 100 + index, know));
  const tl = new Timeline(sim);
  const log = [];
  const tick = (mask = 0) => {
    tl.step(mask);
    sim.drain(log);
  };
  const w = () => sim.world;
  const idle = (n) => {
    for (let i = 0; i < n; i++) tick();
  };
  const supported = (x, feet) =>
    w().solids.some((s) => !s.open && x >= s.x && x <= s.x + s.w && Math.abs(s.y - feet) < 2);
  /** Walk to x, jumping gaps and obstacles and waiting out hazards. */
  const walkTo = (x, limit = 4000) => {
    for (let i = 0; i < limit; i++) {
      const p = w().p;
      const cx = p.x + p.w / 2;
      if (Math.abs(cx - x) < 6 && p.ground) return;
      const dir = cx < x ? 1 : -1;
      let mask = dir > 0 ? IN.RIGHT : IN.LEFT;
      const feet = p.y + p.h;
      const ahead = cx + dir * 22;
      const hazard =
        w().vents.some(
          (v) =>
            v.phase > v.period * 0.3 &&
            ahead > v.x - 30 &&
            ahead < v.x + v.w + 30 &&
            Math.abs(cx - (v.x + v.w / 2)) > 40,
        ) ||
        w().bots.some(
          (b) =>
            Math.abs(b.x + b.w / 2 - cx) < 80 &&
            Math.abs(b.y - feet) < 10 &&
            (b.x + b.w / 2 - cx) * dir > 0,
        );
      if (
        p.ground &&
        w().bots.some((b) => Math.abs(b.x + b.w / 2 - cx) < 70 && Math.abs(b.y - feet) < 10)
      )
        mask |= IN.JUMP;
      else if (hazard && p.ground) mask = 0;
      if (p.ground && (!supported(ahead, feet) || (p.vx === 0 && i % 30 > 6))) mask |= IN.JUMP;
      if (!p.ground) mask |= IN.JUMP;
      tick(mask);
    }
    assert.fail(
      `level ${index}: bot could not reach x=${x} (at ${w().p.x.toFixed(0)}, ${w().p.y.toFixed(0)})`,
    );
  };
  const settle = (id, limit = 900) => {
    for (let i = 0; i < limit; i++) {
      const d = deviceOf(w(), id);
      const m = w().machines.filter((x) => x.drives === id);
      if (
        d.phase !== "move" &&
        d.phase !== "reset" &&
        d.phase !== "trip" &&
        m.every((x) => x.state !== "charge")
      )
        return d;
      tick();
    }
    assert.fail(`device ${id} never settled`);
  };
  const outcomes = () => log.filter((e) => e.type === "outcome");
  return { sim, tl, log, tick, w, idle, walkTo, settle, outcomes };
}

// ---------- Level 1: Cold Start ----------
{
  const g = play(0);
  const { w, tl, sim } = g;
  g.walkTo(800);
  assert.equal(reachable(w(), 1100), false, "the upper deck is closed until the lift docks");

  // Ori's misconception answer first: 2 × 4 = 8, so 4 coils. The lift overshoots and trips.
  const before = sim.snapshot();
  const wrong = tl.mark(
    "expression",
    { en: "2^4", es: "2^4" },
    { type: "run", id: "r1", base: 2, exp: 4 },
  );
  let d = g.settle("lift1");
  assert.equal(d.phase, "idle", "an overshoot trips the breaker and the lift comes back down");
  let o = g.outcomes().at(-1);
  assert.deepEqual(
    [o.ok, o.key, o.vars.out, o.misconception],
    [false, "liftHigh", 16, "exponent-as-multiplication"],
  );
  assert.equal(w().solids[d.gateSolid].open, 0);

  // Too little: stops short and stays there.
  tl.mark("expression", { en: "2^2", es: "2^2" }, { type: "run", id: "r1", base: 2, exp: 2 });
  d = g.settle("lift1");
  assert.deepEqual([d.phase, d.value], ["short", 4]);

  // Time Machine: back to before the first decision. The world is exactly what it was.
  tl.rewindTo(wrong);
  assert.equal(sim.snapshot(), before, "rewind restores position, lift and reactor exactly");
  tl.mark("expression", { en: "2^3", es: "2^3" }, { type: "run", id: "r1", base: 2, exp: 3 });
  d = g.settle("lift1");
  assert.deepEqual([d.phase, d.value, w().solids[d.gateSolid].open], ["dock", 8, 1]);
  assert.equal(tl.leaves().length, 2, "the first path is kept as its own branch");

  // Ride up: the lift is at the top, so walk onto the deck from the docked platform.
  // (The bot was beside the lift; send the lift down and ride it.)
  const p = w().p;
  if (p.y + p.h > 400) {
    tl.rewindTo(tl.head);
    g.walkTo(960);
    tl.mark("expression", { en: "2^3", es: "2^3" }, { type: "run", id: "r1", base: 2, exp: 3 });
    d = g.settle("lift1");
    assert.equal(d.phase, "dock");
  }
  assert.ok(w().p.y + w().p.h <= 342, "Wren rode the lift up");
  g.walkTo(1090);
  assert.ok(g.log.some((e) => e.type === "checkpoint" && e.id === "cp1"));

  // Past the trigger, Ori flies to its reactor and uses its misconception: 3 × 3 = 9.
  g.walkTo(1430);
  for (let i = 0; i < 600 && machineOf(w(), "r2").tries === 0; i++) g.tick();
  assert.equal(machineOf(w(), "r2").exp, 3, "Ori picks 3 coils for 9 with base 3");
  d = g.settle("bridge1");
  o = g.outcomes().at(-1);
  assert.deepEqual([o.ok, o.byOri, o.vars.out, o.key], [false, true, 27, "bridgeHighOri"]);
  assert.equal(reachable(w(), 1900), false);

  // After teaching, the apprentice model answers a held-out task; a failed transfer still misses.
  tl.mark(
    "teach",
    { en: "Ori tries", es: "Ori prueba" },
    { type: "oriRun", id: "r2", base: 2, target: 8, exp: 4, learned: false, know: "exp" },
  );
  d = g.settle("bridge1");
  assert.equal(d.phase, "idle");
  assert.equal(w().know.exp, false);
  tl.mark(
    "teach",
    { en: "Ori tries", es: "Ori prueba" },
    { type: "oriRun", id: "r2", base: 2, target: 8, exp: 3, learned: true, know: "exp" },
  );
  d = g.settle("bridge1");
  assert.deepEqual([d.phase, d.need, w().know.twin], ["dock", 8, true]);
  assert.ok(
    Math.abs(w().solids[d.solid].w - d.span) < 0.01,
    "the bridge spans the whole gap exactly",
  );

  g.walkTo(2110);
  // Twin door: Wren makes 16; Ori mirrors it with the OTHER base.
  tl.mark("expression", { en: "2^4", es: "2^4" }, { type: "run", id: "r3", base: 2, exp: 4 });
  d = g.settle("door2");
  const r4 = machineOf(w(), "r4");
  assert.deepEqual(
    [d.phase, d.out, r4.base, r4.exp],
    ["dock", 32, 4, 2],
    "Ori's twin uses an equivalent form",
  );
  g.walkTo(2660);
  assert.ok(
    g.log.some((e) => e.type === "complete"),
    "level 1 completes",
  );

  // The whole winning path replays to the same hashes.
  tl.close();
  const r = tl.replay(tl.head);
  while (r.pump());
  assert.ok(r.verify(), "the winning path replays deterministically");
  r.end();
}

// Ori remembers across sessions: with the concept held, its first try is right.
{
  const g = play(0, { exp: true, ops: false, twin: true });
  g.tl.mark("travel", { en: "", es: "" }, { type: "travel", x: 800, y: 520 });
  g.tl.mark("expression", { en: "2^3", es: "2^3" }, { type: "run", id: "r1", base: 2, exp: 3 });
  g.settle("lift1");
  const refused = g.w().p.x;
  g.tl.mark("travel", { en: "", es: "" }, { type: "travel", x: 2110, y: 340 });
  assert.equal(g.w().p.x, refused, "guided travel cannot skip a barrier that is not docked");
  g.tl.mark("travel", { en: "", es: "" }, { type: "travel", x: 1430, y: 340 });
  for (let i = 0; i < 900 && deviceOf(g.w(), "bridge1").phase !== "dock"; i++) g.tick();
  assert.equal(machineOf(g.w(), "r2").exp, 2);
  assert.equal(deviceOf(g.w(), "bridge1").phase, "dock", "a taught Ori bridges the gap on its own");
}

// ---------- Level 2: Coil Budget ----------
{
  const g = play(1);
  const { w, tl } = g;
  const run = (id, base, exp) => {
    tl.mark(
      "expression",
      { en: `${base}^${exp}`, es: `${base}^${exp}` },
      { type: "run", id, base, exp },
    );
    g.sim.drain(g.log);
  };
  g.walkTo(820);
  run("r1", 4, 3);
  assert.equal(w().coils, 6);
  assert.equal(g.settle("lift1").phase, "dock");
  g.walkTo(1100);
  run("r2", 3, 4);
  assert.equal(w().coils, 2);
  assert.equal(g.settle("bridge1").phase, "dock");
  g.walkTo(2470);
  // Two coils left and 32 needs five: the rules refuse, nothing moves.
  run("r3", 2, 5);
  assert.ok(g.log.at(-1).type === "refuse" && machineOf(w(), "r3").state === "idle");
  // A docked reactor may only change to an EQUIVALENT power.
  run("r1", 8, 1);
  let o = g.outcomes().at(-1);
  assert.deepEqual([o.ok, o.key, deviceOf(w(), "lift1").phase], [false, "keepDock", "dock"]);
  run("r1", 8, 2);
  run("r2", 9, 2);
  o = g.outcomes().at(-1);
  assert.deepEqual([o.ok, o.key, w().coils], [true, "reformed", 5]);
  assert.equal(deviceOf(w(), "bridge1").phase, "dock", "re-forming moves nothing");
  run("r3", 2, 5);
  assert.equal(g.settle("lift3").phase, "dock");
  assert.equal(w().coils, 0);
  g.walkTo(3000);
  assert.ok(
    g.log.some((e) => e.type === "complete"),
    "level 2 completes",
  );
  assert.ok(!g.log.some((e) => e.type === "respawn"), "the bot crossed without falling");
}

// ---------- Level 3: Sequencer Hall ----------
{
  const g = play(2);
  const { w, tl } = g;
  const run = (id, group) =>
    tl.mark("expression", { en: "seq", es: "seq" }, { type: "runOps", id, group });
  g.walkTo(820);
  run("s1", null);
  let d = g.settle("lift1");
  let o = g.outcomes().at(-1);
  assert.deepEqual(
    [d.phase, o.vars.out, o.misconception],
    ["short", 14, "order-of-operations-left-to-right"],
  );
  run("s1", [0, 2]);
  assert.equal(g.settle("lift1").phase, "dock");
  g.walkTo(1250);
  for (let i = 0; i < 600 && machineOf(w(), "s2").tries === 0; i++) g.tick();
  d = g.settle("bridge1");
  o = g.outcomes().at(-1);
  assert.deepEqual(
    [o.byOri, o.vars.out, d.phase],
    [true, 12, "short"],
    "Ori reads left to right and comes up short",
  );
  tl.mark(
    "teach",
    { en: "Ori", es: "Ori" },
    {
      type: "oriRun",
      id: "s2",
      tokens: [5, "+", 2, "×", 3],
      target: 21,
      group: [0, 2],
      learned: true,
      know: "ops",
    },
  );
  assert.equal(g.settle("bridge1").phase, "dock");
  g.walkTo(2450);
  run("s3", [2, 4]);
  assert.equal(g.settle("lift3").phase, "idle", "(3 × 4)^2 + 2 = 146 overshoots 80");
  run("s3", [0, 2]);
  assert.equal(g.settle("lift3").phase, "dock");
  g.walkTo(2820);
  assert.ok(
    g.log.some((e) => e.type === "complete"),
    "level 3 completes",
  );
}

// ---------- Level 4: the Helix Core ----------
{
  const g = play(3);
  const { w, tl } = g;
  const set = (id, base, exp) =>
    tl.mark("expression", { en: id, es: id }, { type: "set", id, base, exp });
  const engage = () => {
    tl.mark("expression", { en: "core", es: "core" }, { type: "engage", id: "core" });
    for (let i = 0; i < 300 && machineOf(w(), "core").state !== "idle"; i++) g.tick();
    return g.outcomes().at(-1);
  };
  // 8 + 4 × 8 = 40; read left to right it would be (8 + 4) × 8.
  set("a", 2, 3);
  set("b", 2, 2);
  set("c", 2, 3);
  assert.equal(w().coils, 0);
  let o = engage();
  assert.deepEqual([o.ok, o.vars.out, deviceOf(w(), "core").phaseIndex], [true, 40, 1]);
  // (4 + 32) × ... a left-to-right setting for 100 is rejected and tagged.
  set("a", 2, 1);
  set("b", 2, 3);
  set("c", 2, 0);
  set("c", 4, 1);
  set("b", 2, 4);
  set("a", 3, 2);
  o = engage(); // 9 + 16 × 4 = 73; (9 + 16) × 4 = 100
  assert.deepEqual(
    [o.ok, o.vars.out, o.misconception],
    [false, 73, "order-of-operations-left-to-right"],
  );
  set("a", 2, 2);
  set("c", 3, 1);
  set("b", 2, 5);
  o = engage();
  assert.deepEqual([o.ok, o.vars.out], [true, 100]);
  set("b", 2, 2);
  set("c", 2, 0);
  set("a", 3, 3);
  o = engage();
  assert.deepEqual([o.ok, o.vars.out, deviceOf(w(), "core").phase], [true, 31, "dock"]);
  assert.equal(w().pulse.period, 0, "the floor pulse stops when the core is stable");
  g.walkTo(1450);
  assert.ok(
    g.log.some((e) => e.type === "complete"),
    "the boss level completes",
  );
}

console.log("PASS power plant: mathematics, four levels played, rewind and replay");
