// Balance Breakout — the balance is the equation. Mathematics recomputed
// independently, every room solved through the real rules, one-sided moves
// shown to tip the beam, and rewind restoring the exact pans.
import assert from "node:assert/strict";
import { createWorld, LEVELS } from "../../math/games/universe/games/balance-breakout/levels.js";
import {
  balanced,
  cancelPairs,
  doubled,
  equationText,
  isolated,
  oneGroup,
  side,
  solve,
  splittable,
  weight,
} from "../../math/games/universe/games/balance-breakout/math.js";
import { isLevel, rules } from "../../math/games/universe/games/balance-breakout/rules.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

const X = { k: "x" };
const w = (v) => ({ k: "w", v });
const b = (v) => ({ k: "b", v });

// ---------- mathematics ----------
assert.deepEqual(side([X, X, w(1)]), { a2: 4, c: 1 });
assert.deepEqual(side([{ k: "half" }, b(2)]), { a2: 1, c: -2 });
assert.equal(equationText([X, w(3)], [w(8)]), "x + 3 = 8");
assert.equal(equationText([X, b(2)], [w(6)]), "x − 2 = 6");
assert.equal(equationText([X, X, X], [w(12)]), "3x = 12");
assert.equal(equationText([{ k: "half" }], [w(5)]), "x/2 = 5");
assert.equal(solve([X, X, w(1)], [w(9)]), 4);
assert.equal(solve([{ k: "half" }], [w(5)]), 10);
assert.ok(
  isolated([X], [w(5)]) &&
    isolated([w(5)], [X]) &&
    !isolated([X, w(1)], [w(6)]) &&
    !isolated([X, X], [w(8)]),
);
assert.ok(splittable([X, X, X], 3) && !splittable([X, X, X], 2) && !splittable([w(12)], 3));
assert.deepEqual(oneGroup([X, X, X], 3), [X]);
assert.deepEqual(cancelPairs([X, b(2), w(2)]), [X]);
assert.deepEqual(cancelPairs([X, b(2), w(3)]), [X, b(2), w(3)]);
// Every equality-preserving transformation keeps the beam level for the true x, for many x.
for (let x = 1; x <= 20; x++) {
  const L = [X, X, w(3)];
  const R = [w(2 * x + 3)];
  assert.ok(balanced(L, R, x));
  assert.ok(balanced(doubled(L), doubled(R), x));
  assert.ok(balanced([...L, w(4)], [...R, w(4)], x));
  assert.ok(!balanced(L.slice(0, 2), R, x), "removing from one side unbalances");
  assert.equal(weight([X, b(2)], x), x - 2);
}

// ---------- level data: every room's equation is TRUE at its x and has that solution ----------
for (const L of LEVELS)
  for (const r of L.rooms) {
    if (r.mode === "isolate") {
      assert.ok(balanced(r.left, r.right, r.x), `${L.id}: room starts level`);
      assert.equal(
        solve(r.left, r.right),
        r.x,
        `${L.id}: x = ${r.x} solves ${equationText(r.left, r.right)}`,
      );
      assert.ok(!isolated(r.left, r.right), `${L.id}: room does not start solved`);
    } else {
      // keypad rooms start EMPTY on the right: the racks must hold a subset that balances.
      const blocks = r.racks.flatMap((k) => k.items.map((it) => it.v));
      const need = weight(r.left, r.x);
      let ok = false;
      for (let m = 1; m < 1 << blocks.length; m++) {
        let s = 0;
        for (let i = 0; i < blocks.length; i++) if (m & (1 << i)) s += blocks[i];
        if (s === need) ok = true;
      }
      assert.ok(ok, `${L.id}: the racks can balance ${need}`);
    }
  }

// ---------- every rack can be reached by jumping ----------
// Peak jump height from the runtime's own feel: v^2 / 2g, with a 6 px margin.
import { FEEL } from "../../math/games/universe/runtime/physics.js";

const JUMP = (FEEL.jump * FEEL.jump) / (2 * FEEL.gravity) - 6;
for (const [li, L] of LEVELS.entries()) {
  const world = createWorld(li, 1);
  const surfaces = [520, ...world.solids.filter((x) => x.kind === "ledge").map((x) => x.y)];
  const reach = new Set([520]);
  for (let pass = 0; pass < 4; pass++)
    for (const l of world.solids.filter((x) => x.kind === "ledge"))
      for (const from of [...reach]) if (from - l.y > 0 && from - l.y <= JUMP) reach.add(l.y);
  for (const r of world.rooms)
    for (const rack of r.racks)
      assert.ok(
        reach.has(rack.y) || rack.y === 520,
        `${L.id}: rack at y ${rack.y} is out of jump reach (${JUMP.toFixed(0)} px)`,
      );
  assert.ok(surfaces.length >= 1);
}

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 7));
  const tl = new Timeline(sim);
  const log = [];
  const act = (action) => {
    tl.mark("eq", { en: action.type, es: action.type }, action);
    sim.drain(log);
    for (let i = 0; i < 4; i++) {
      tl.step(0);
      sim.drain(log);
    }
  };
  const last = () => log.filter((e) => e.type === "outcome").at(-1);
  return { sim, tl, log, act, last, w: () => sim.world };
}

// Level 1: Counterweight (8-1)
{
  const g = play(0);
  const { act, w, last } = g;
  // Room 0: x = 6 on the left. Load 5 + 1 on the right.
  act({ type: "rackTake", room: 0, rack: 1, index: 1 }); // 5
  act({ type: "put", room: 0, pan: "right" });
  assert.equal(isLevel(w().rooms[0]), false);
  act({ type: "rackTake", room: 0, rack: 0, index: 0 }); // 1
  act({ type: "put", room: 0, pan: "right" });
  assert.ok(isLevel(w().rooms[0]), "5 + 1 balances x = 6");
  assert.ok(g.log.some((e) => e.type === "level"));
  act({ type: "keypad", room: 0, value: 6 });
  assert.equal(last().ok, true);
  assert.equal(w().solids[w().rooms[0].gate].open, 1);
  // Room 1: x + 2 = 7 with 4 + 3. Keying the right side's 7 is the classic slip.
  act({ type: "rackTake", room: 1, rack: 0, index: 0 }); // 3
  act({ type: "put", room: 1, pan: "right" });
  act({ type: "keypad", room: 1, value: 3 });
  assert.deepEqual(
    [last().ok, last().key],
    [false, "keypadTilted"],
    "a keypad on a tipped beam proves nothing",
  );
  act({ type: "rackTake", room: 1, rack: 0, index: 0 }); // 4
  act({ type: "put", room: 1, pan: "right" });
  act({ type: "keypad", room: 1, value: 7 });
  assert.deepEqual(
    [last().ok, last().misconception],
    [false, "equation-answered-with-given-number"],
  );
  act({ type: "keypad", room: 1, value: 5 });
  assert.equal(last().ok, true);
}

// Level 2: Twin Crane (8-2)
{
  const g = play(1);
  const { act, w, last, tl, sim } = g;
  const before = sim.snapshot();
  // One-sided: lift the 3 off the left only. The beam tips; the move is the outcome.
  const slip = tl.mark(
    "eq",
    { en: "take", es: "take" },
    { type: "take", room: 0, pan: "left", index: 1 },
  );
  sim.drain(g.log);
  assert.deepEqual([last().ok, last().key], [false, "tilted"]);
  for (let i = 0; i < 200; i++) tl.step(0);
  assert.ok(w().rooms[0].angle < -0.05, "the beam tips toward the heavier right pan");
  tl.rewindTo(slip);
  assert.equal(sim.snapshot(), before, "rewind restores the exact pans and beam");
  // The crane needs a 3 on BOTH pans: split 8 into 5 + 3 first (equivalent, stays level).
  act({ type: "craneRemove", room: 0, v: 3 });
  assert.equal(
    g.log.at(-1).type === "refuse" || g.log.some((e) => e.key === "craneNeedsBoth"),
    true,
  );
  act({ type: "change", room: 0, pan: "right", index: 0, a: 5 });
  assert.ok(isLevel(w().rooms[0]), "8 -> 5 + 3 keeps the beam level");
  act({ type: "craneRemove", room: 0, v: 3 });
  assert.equal(w().rooms[0].solved, 1);
  assert.equal(g.log.find((e) => e.key === "isolated").vars.x, 5);
  // Room 1: x + 4 = 3 + 10 -> change 10 into 4 + 6, crane 4, then crane the 3? No: x = 9 means 3 + 6 stays.
  act({ type: "change", room: 1, pan: "right", index: 1, a: 4 });
  act({ type: "craneRemove", room: 1, v: 4 });
  assert.equal(
    w().rooms[1].solved,
    1,
    "x = 3 + 6 counts as x alone: the reader adds the right pan",
  );
  // Room 2: x − 2 = 6. Adding 3 to both is valid but leads away; adding 2 cancels the balloon.
  act({ type: "craneAdd", room: 2, v: 3 });
  assert.deepEqual([last().ok, last().misconception], [false, "equation-not-inverse-operation"]);
  assert.ok(isLevel(w().rooms[2]));
  act({ type: "craneRemove", room: 2, v: 3 });
  act({ type: "craneAdd", room: 2, v: 2 });
  assert.ok(
    g.log.some((e) => e.type === "pop"),
    "the 2-block and the 2-balloon cancel",
  );
  assert.equal(w().rooms[2].solved, 1);
  assert.equal(g.log.filter((e) => e.key === "isolated").at(-1).vars.x, 8);
}

// Level 3: Splitter (8-3)
{
  const g = play(2);
  const { act, w, last } = g;
  act({ type: "divide", room: 0, k: 3 });
  assert.deepEqual(
    [last().ok, last().key],
    [false, "cannotSplit"],
    "12 is one block: it cannot go into 3 equal groups yet",
  );
  act({ type: "change", room: 0, pan: "right", index: 0, a: 4 });
  act({ type: "change", room: 0, pan: "right", index: 1, a: 4 });
  assert.deepEqual(
    w().rooms[0].right.map((it) => it.v),
    [4, 4, 4],
  );
  act({ type: "divide", room: 0, k: 2 });
  assert.equal(last().ok, false, "three crates do not split into 2 groups");
  act({ type: "divide", room: 0, k: 3 });
  assert.equal(w().rooms[0].solved, 1);
  // x/2 = 5: double both pans.
  act({ type: "double", room: 1 });
  assert.equal(w().rooms[1].solved, 1);
  assert.equal(g.log.filter((e) => e.key === "isolated").at(-1).vars.x, 10);
  // 2x + 1 = 9: crane the 1 (after 9 -> 1 + 8), split 8 -> 4 + 4, divide by 2.
  act({ type: "change", room: 2, pan: "right", index: 0, a: 1 });
  act({ type: "craneRemove", room: 2, v: 1 });
  act({ type: "change", room: 2, pan: "right", index: 0, a: 4 });
  act({ type: "divide", room: 2, k: 2 });
  assert.equal(w().rooms[2].solved, 1);
  assert.equal(g.log.filter((e) => e.key === "isolated").at(-1).vars.x, 4);
  // Replay the whole level from its decisions.
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}

console.log(
  "PASS balance breakout: mathematics, every room solved, one-sided moves tip, rewind exact",
);
