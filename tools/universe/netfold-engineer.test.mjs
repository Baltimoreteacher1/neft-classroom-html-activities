// NetFold Engineer — the folding engine proved on the whole space of cube nets
// (all 35 hexominoes fold, and exactly the 11 known cube nets close), every
// bench's answer recomputed, and every level built through the rules.
import assert from "node:assert/strict";
import {
  closes,
  fold,
  prismSA,
  prismV,
  pyramidSA,
  squareNet,
} from "../../math/games/universe/games/netfold-engineer/geo3d.js";
import { createWorld, LEVELS } from "../../math/games/universe/games/netfold-engineer/levels.js";
import {
  answerOf,
  JOB_TICKS,
  rules,
} from "../../math/games/universe/games/netfold-engineer/rules.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

// ---------- all hexominoes: exactly 11 of the 35 fold into a cube ----------
const norm = (cells) => {
  const mx = Math.min(...cells.map((c) => c[0]));
  const my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};
const canon = (cells) => {
  const forms = [];
  let cur = cells;
  for (let r = 0; r < 4; r++) {
    cur = cur.map(([x, y]) => [y, -x]);
    forms.push(JSON.stringify(norm(cur)), JSON.stringify(norm(cur.map(([x, y]) => [-x, y]))));
  }
  return forms.sort()[0];
};
let shapes = new Set([JSON.stringify([[0, 0]])]);
for (let n = 1; n < 6; n++) {
  const next = new Set();
  for (const s of shapes) {
    const cells = JSON.parse(s);
    const has = new Set(cells.map((c) => c.join()));
    for (const [x, y] of cells)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const c = [x + dx, y + dy];
        if (!has.has(c.join())) next.add(canon([...cells, c]));
      }
  }
  shapes = next;
}
assert.equal(shapes.size, 35, "there are 35 free hexominoes");
const valid = [...shapes].filter((s) => closes(fold(squareNet(JSON.parse(s)), 1)).ok);
assert.equal(valid.length, 11, "exactly 11 hexominoes fold into a cube");
// Folding is a rigid motion: every face keeps its side length.
for (const s of shapes)
  for (const f of fold(squareNet(JSON.parse(s)), 0.6)) {
    const [a, b] = f.p3;
    assert.ok(Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 1) < 1e-9);
  }

// ---------- formulas ----------
assert.equal(prismSA(4, 3, 2), 52);
assert.equal(prismV(1.5, 2, 3), 9);
assert.equal(pyramidSA(6, 5), 96, "slant height 5, not vertical height 4");

// ---------- every bench: one right answer ----------
for (const L of LEVELS)
  for (const r of L.rooms) {
    if (r.kind === "net") {
      const ok = r.choices.filter((c) => closes(fold(squareNet(c), 1)).ok);
      assert.equal(ok.length, 1, `${L.id}: exactly one of the nets closes`);
    }
    if (r.kind === "design") {
      for (const o of r.options)
        assert.equal(o[0] * o[1] * o[2], r.cubes, "every design holds the cubes");
      const sa = r.options.map(([a, b, c]) => prismSA(a, b, c));
      assert.equal(
        sa.filter((x) => x === Math.min(...sa)).length,
        1,
        "one design uses the least cardboard",
      );
    }
  }

// The right net is not always in the same position.
{
  const pos = LEVELS[0].rooms.map((r) => answerOf(r));
  assert.ok(new Set(pos).size === pos.length, `right nets sit at different positions (${pos})`);
}

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 6));
  const tl = new Timeline(sim);
  const log = [];
  const build = (room, a) => {
    tl.mark("build", { en: "b", es: "b" }, { type: "build", room, ...a });
    sim.drain(log);
    for (let i = 0; i < JOB_TICKS + 5; i++) {
      tl.step(0);
      sim.drain(log);
    }
    return log.filter((e) => e.type === "outcome").at(-1);
  };
  return { sim, tl, log, build, w: () => sim.world };
}
{
  const g = play(0);
  let o = g.build(0, { choice: 0 });
  assert.deepEqual([o.ok, o.key], [false, "netOverlap"], "the strip of six overlaps itself");
  o = g.build(0, { choice: 2 });
  assert.equal(o.ok, false);
  for (const [i, r] of LEVELS[0].rooms.entries())
    assert.equal(g.build(i, { choice: answerOf(g.w().rooms[i]) }).ok, true);
}
{
  const g = play(1);
  let o = g.build(0, { value: 24 });
  assert.deepEqual(
    [o.ok, o.misconception],
    [false, "geom-surface-area-as-volume"],
    "the volume is not the paper",
  );
  o = g.build(0, { value: 26 });
  assert.deepEqual(
    [o.ok, o.key, o.misconception],
    [false, "wrapShort", "geom-surface-area-as-volume"],
    "half the faces",
  );
  assert.equal(g.build(0, { value: 52 }).ok, true);
  assert.equal(g.build(1, { value: 90 }).ok, true);
  o = g.build(2, { value: 156 });
  assert.deepEqual([o.ok, o.misconception], [false, "geom-triangle-area-no-half"]);
  o = g.build(2, { value: 84 });
  assert.equal(o.ok, false, "vertical height 4 in place of slant height 5");
  assert.equal(g.build(2, { value: 96 }).ok, true);
}
{
  const g = play(2);
  let o = g.build(0, { value: 9 });
  assert.deepEqual([o.ok, o.misconception], [false, "geom-volume-added-dimensions"]);
  assert.equal(g.build(0, { value: 24 }).ok, true);
  assert.equal(g.build(1, { value: 9 }).ok, true);
  o = g.build(2, { choice: 3 });
  assert.equal(o.ok, false);
  assert.equal(g.build(2, { choice: 2 }).ok, true);
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}

console.log(
  "PASS netfold engineer: 11 of 35 hexominoes close, every bench answered, three levels built",
);
