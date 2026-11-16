// The Data Chase — statistics against first principles, every case's data
// designed so the right measure matters, and every level investigated through
// the real rules.
import assert from "node:assert/strict";
import { createWorld, dataFor, LEVELS } from "../../math/games/universe/games/data-chase/levels.js";
import {
  fiveNumbers,
  histogram,
  iqr,
  mean,
  median,
  outliers,
  range,
  tallest,
} from "../../math/games/universe/games/data-chase/math.js";
import { deskOpen, rules } from "../../math/games/universe/games/data-chase/rules.js";
import { Simulation } from "../../math/games/universe/runtime/sim.js";
import { Timeline } from "../../math/games/universe/runtime/timeline.js";

// ---------- statistics, recomputed by hand ----------
assert.equal(median([3, 1, 2]), 2);
assert.equal(median([4, 1, 3, 2]), 2.5);
assert.deepEqual(fiveNumbers([10, 12, 13, 15, 16, 18, 19, 21, 24]), {
  min: 10,
  q1: 12.5,
  median: 16,
  q3: 20,
  max: 24,
});
assert.deepEqual(fiveNumbers([8, 14, 15, 15, 16, 16, 17, 18, 30]), {
  min: 8,
  q1: 14.5,
  median: 16,
  q3: 17.5,
  max: 30,
});
assert.deepEqual(
  histogram([12, 15, 18, 20, 21, 22, 25, 28, 30, 34], 5).map((b) => b.n),
  [1, 2, 3, 2, 2],
);
assert.equal(tallest(histogram([12, 15, 18, 20, 21, 22, 25, 28, 30, 34], 10))[0].from, 20);

// ---------- the data is designed so the mathematics matters ----------
{
  const L = LEVELS[1];
  const work = L.sources.map((s) => s.v);
  assert.deepEqual(outliers(work), [95], "level 2 has exactly one outlier");
  const m = mean(work);
  assert.ok(m - median(work) > 5, "the outlier drags the mean well above the median");
  assert.ok(
    work.filter((v) => v < m).length >= work.length - 1,
    "almost everyone is below the mean",
  );
  assert.ok(Number.isInteger(median(work)));
  assert.ok(Number.isInteger(mean(L.tips)), "the tip-jar mean is a whole number");
}
{
  const L = LEVELS[2];
  const north = L.sources.filter((s) => s.who === "north").map((s) => s.v);
  const south = L.sources.filter((s) => s.who === "south").map((s) => s.v);
  assert.ok(iqr(south) < iqr(north), "south is more consistent by IQR");
  assert.ok(range(south) > range(north), "...but has the larger range: the trap is real");
  assert.equal(median(north), median(south), "same center, so only spread decides");
}

// ---------- play through the rules ----------
function play(index) {
  const sim = new Simulation(rules, createWorld(index, 4));
  const tl = new Timeline(sim);
  const log = [];
  const act = (a) => {
    tl.mark("x", { en: a.type, es: a.type }, a);
    sim.drain(log);
    return log.filter((e) => e.type === "outcome").at(-1);
  };
  const collect = () => {
    for (const s of sim.world.sources) if (!s.got) act({ type: "ask", source: s.id });
  };
  return { sim, tl, log, act, collect, w: () => sim.world };
}

{
  const g = play(0);
  let o = g.act({ type: "question", desk: 0, q: "okafor" });
  assert.deepEqual([o.ok, o.misconception], [false, "stat-question-no-variability"]);
  assert.equal(g.w().sources.length, 1, "one person, one value");
  o = g.act({ type: "question", desk: 0, q: "class" });
  assert.equal(o.ok, true);
  assert.equal(g.w().sources.length, 10);
  assert.equal(deskOpen(g.w(), g.w().desks[1]), false, "the histogram desk waits for the data");
  g.collect();
  assert.ok(deskOpen(g.w(), g.w().desks[1]));
  o = g.act({ type: "histogram", desk: 1, width: 5, from: 30 });
  assert.equal(o.ok, false);
  o = g.act({ type: "histogram", desk: 1, width: 5, from: 20 });
  assert.equal(o.ok, true);
  assert.ok(g.w().done || g.w().desks.every((d) => d.done));
}
{
  const g = play(1);
  g.collect();
  const data = dataFor(g.w(), g.w().desks[1]);
  let o = g.act({
    type: "headline",
    desk: 1,
    measure: "mean",
    value: Math.round(mean(data) * 2) / 2,
  });
  assert.deepEqual(
    [o.ok, o.misconception, o.vars.below],
    [false, "stat-mean-skewed-by-outlier", 8],
    "8 of 9 are below the mean",
  );
  o = g.act({ type: "headline", desk: 1, measure: "median", value: 18 });
  assert.equal(o.ok, true);
  o = g.act({ type: "mean", desk: 2, value: 42 });
  assert.deepEqual([o.ok, o.misconception], [false, "stat-summed-instead-of-averaged"]);
  o = g.act({ type: "mean", desk: 2, value: 7 });
  assert.equal(o.ok, true);
}
{
  const g = play(2);
  assert.equal(
    g.act({ type: "compare", desk: 3, pick: "south" }),
    undefined,
    "compare needs the box plots first",
  );
  g.collect();
  let o = g.act({
    type: "boxplot",
    desk: 1,
    five: { min: 10, q1: 13, median: 16, q3: 19, max: 24 },
  });
  assert.equal(o.ok, false, "inclusive-style quartiles are not the lesson's");
  o = g.act({ type: "boxplot", desk: 1, five: { min: 10, q1: 12.5, median: 16, q3: 20, max: 24 } });
  assert.equal(o.ok, true);
  o = g.act({
    type: "boxplot",
    desk: 2,
    five: { min: 8, q1: 14.5, median: 16, q3: 17.5, max: 30 },
  });
  assert.equal(o.ok, true);
  o = g.act({ type: "compare", desk: 3, pick: "north" });
  assert.deepEqual([o.ok, o.misconception], [false, "stat-range-for-iqr"]);
  o = g.act({ type: "compare", desk: 3, pick: "south" });
  assert.equal(o.ok, true);
  for (let i = 0; i < 3; i++) g.tl.step(0);
  g.sim.drain(g.log);
  assert.ok(g.log.some((e) => e.type === "complete"));
  const r = g.tl.replay(g.tl.head);
  while (r.pump());
  assert.ok(r.verify());
  r.end();
}

console.log("PASS data chase: statistics, designed data, three investigations played");
