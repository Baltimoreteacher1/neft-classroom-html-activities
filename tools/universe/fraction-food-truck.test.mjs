// Fraction Food Truck — fraction division made physical. Mathematics against
// an independent float check, every order exact as authored, every kitchen
// served through the rules, and the reciprocal slip recognised.
import assert from "node:assert/strict";
import { createWorld, LEVELS } from "../../math/games/universe/games/fraction-food-truck/levels.js";
import {
  div,
  eq,
  F,
  mul,
  portions,
  serveCount,
  slipOf,
  sub,
  text,
} from "../../math/games/universe/games/fraction-food-truck/math.js";
import { rules } from "../../math/games/universe/games/fraction-food-truck/rules.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

const v = (f) => f.n / f.d;

// ---------- mathematics ----------
for (let a = 1; a <= 9; a++)
  for (let b = 1; b <= 9; b++)
    for (let c = 1; c <= 9; c++)
      for (let d = 1; d <= 9; d++) {
        const x = F(a, b);
        const y = F(c, d);
        assert.ok(Math.abs(v(div(x, y)) - a / b / (c / d)) < 1e-12);
        assert.ok(eq(mul(div(x, y), y), x), "(x ÷ y) · y = x");
        const p = portions(x, y);
        assert.equal(p.whole, Math.floor(a / b / (c / d) + 1e-12));
        assert.ok(v(p.left) >= 0 && v(p.left) < c / d);
      }
assert.equal(text(F(9, 4)), "2 1/4");
assert.equal(text(F(3, 4)), "3/4");
{
  const s = serveCount(F(3), F(3, 4), 5);
  assert.deepEqual(s.got.map(text), ["3/4", "3/4", "3/4", "3/4", "0"], "a fifth bowl gets nothing");
  const u = serveCount(F(3), F(3, 4), 3);
  assert.equal(text(u.rest), "3/4", "three bowls leave a bowl's worth in the pot");
}
assert.equal(
  slipOf({ kind: "count", total: F(3), portion: F(3, 4) }, F(9, 4)),
  "fraction-no-reciprocal",
);
assert.equal(
  slipOf({ kind: "count", total: F(3), portion: F(3, 4) }, F(1, 4)),
  "op-reversed-division",
);

// ---------- authored orders ----------
for (const L of LEVELS)
  for (const o of L.orders) {
    if (o.kind === "count")
      assert.equal(
        div(o.total, o.portion).d,
        1,
        `${text(o.total)} ÷ ${text(o.portion)} is a whole number of servings`,
      );
    if (o.kind === "full")
      assert.notEqual(
        portions(o.total, o.portion).left.n,
        0,
        "a 'full servings' order has a remainder",
      );
    if (o.kind === "share")
      assert.ok(div(o.total, F(o.plates)).d <= 12, "a share fits the station's denominators");
  }

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 2));
  const tl = new Timeline(sim);
  const log = [];
  const serve = (a) => {
    tl.mark("serve", { en: "serve", es: "serve" }, { type: "serve", ...a });
    sim.drain(log);
    for (let i = 0; i < 1200 && sim.world.serving; i++) {
      tl.step(0);
      sim.drain(log);
    }
    return log.filter((e) => e.type === "outcome").at(-1);
  };
  return { sim, tl, log, serve, w: () => sim.world };
}
const answer = (o) => {
  if (o.kind === "share") {
    const e = div(o.total, F(o.plates));
    return { each: { n: e.n, d: e.d } };
  }
  if (o.kind === "full") return { count: portions(o.total, o.portion).whole };
  return { count: div(o.total, o.portion).n };
};

{
  const g = play(0);
  let o = g.serve({ count: 5 });
  assert.deepEqual(
    [o.ok, o.key, o.vars.short],
    [false, "short", 1],
    "five bowls: one comes up short",
  );
  o = g.serve({ count: 3 });
  assert.deepEqual([o.ok, o.key, o.vars.rest], [false, "leftover", "3/4"]);
  o = g.serve({ count: 4 });
  assert.equal(o.ok, true);
  assert.equal(g.w().current, 1);
}
for (let li = 0; li < LEVELS.length; li++) {
  const g = play(li);
  for (const ord of LEVELS[li].orders)
    assert.equal(g.serve(answer(ord)).ok, true, `${LEVELS[li].id}: ${JSON.stringify(ord)}`);
  assert.ok(
    g.log.some((e) => e.type === "complete"),
    `${LEVELS[li].id} completes`,
  );
  if (li === 2) {
    const full = g.w().served[0];
    assert.equal(text(full.rest), "1/3", "7 cakes of 2/3 from 5 cups leave 1/3 cup");
  }
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}
{
  const g = play(0);
  const o = g.serve({ count: 2 }); // 3 × ... no: 2 is neither slip; check the reciprocal on a share order
  assert.equal(o.ok, false);
  g.serve({ count: 4 });
  g.serve({ count: 6 });
  const share = g.serve({ each: { n: 9, d: 4 } });
  assert.deepEqual(
    [share.ok, share.misconception],
    [false, "fraction-no-reciprocal"],
    "3/4 × 3 for 3/4 ÷ 3",
  );
}

console.log(
  "PASS fraction food truck: mathematics, every order exact, three kitchens served, slips recognised",
);
