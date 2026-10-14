// Learning-lab lenses: the second picture under each lab's model.
//
// A lens teaches an extra idea, so a wrong number in one teaches the mistake in the lab's own voice.
// This re-derives every number a lens prints by a different route than lens-math.mjs, and renders
// every lens in English and Spanish to prove that no state prints NaN, undefined or an empty body.

import assert from "node:assert/strict";
import { LENSES, lensFor } from "../curriculum/learning-labs/shared/lens.mjs";
import * as M from "../curriculum/learning-labs/shared/lens-math.mjs";
import { statistics } from "../curriculum/learning-labs/shared/math.mjs";
import { blueprints } from "./learning-labs/blueprints.mjs";

/* ---- every lens belongs to a real lab, and every lens-bearing kind:mode is covered ---------------- */
const keys = new Set(blueprints.map((b) => `${b.model.kind}:${b.model.mode}`));
for (const key of Object.keys(LENSES)) assert.ok(keys.has(key), `lens ${key} matches no lab model`);
const labsWithLens = blueprints.filter((b) => lensFor(b.model));
assert.ok(labsWithLens.length >= 20, `expected 20+ labs with a lens, found ${labsWithLens.length}`);

/* ---- independent math ------------------------------------------------------------------------- */
// Histogram bins: every observation lands in exactly one interval, whatever the width.
for (const values of [
  [4, 5, 7, 8, 9, 12, 14, 15],
  [2, 4, 5, 7, 9, 10, 12, 15],
  [0, 49, 25],
]) {
  for (const width of [2, 5, 10, 20]) {
    const b = M.bins(values, width);
    assert.equal(
      b.reduce((s, x) => s + x.n, 0),
      values.length,
      `bins(${width}) keeps every observation`,
    );
    for (const v of values) {
      const hit = b.filter((x) => v >= x.from && v <= x.to);
      assert.equal(hit.length, 1, `${v} falls in exactly one ${width}-wide interval`);
    }
  }
}

// Outlier: dropping the largest value moves the mean by exactly the algebra says; the median barely.
{
  const v = [5, 6, 6, 7, 7, 8, 9, 40],
    e = M.outlierEffect(v);
  const meanAll = v.reduce((a, b) => a + b) / v.length,
    rest = v.slice(0, -1),
    meanRest = rest.reduce((a, b) => a + b) / rest.length;
  assert.ok(Math.abs(e.meanShift - (meanAll - meanRest)) < 1e-3);
  assert.equal(e.outlier, 40);
  assert.ok(
    Math.abs(e.meanShift) > 4 * Math.abs(e.medianShift),
    "an outlier moves the mean far more than the median",
  );
  assert.deepEqual(e.all.sorted, statistics(v).sorted);
}

// Estimation bounds always bracket the exact total.
for (const [p, q] of [
  [2.75, 6],
  [3.5, 4],
  [9.99, 12],
  [4, 3],
]) {
  const b = M.receiptBounds(p, q);
  assert.ok(
    b.low <= b.exact + 1e-9 && b.exact <= b.high + 1e-9,
    `${p} × ${q}: ${b.low} ≤ ${b.exact} ≤ ${b.high}`,
  );
}
assert.equal(M.boundsCheck(12, 18, 16.5), "good");
assert.equal(M.boundsCheck(10, 20, 16.5), "wide");
assert.equal(M.boundsCheck(18, 12, 16.5), "swapped");
assert.equal(M.boundsCheck(17, 20, 16.5), "too-high-low");
assert.equal(M.boundsCheck(10, 16, 16.5), "too-low-high");
assert.equal(M.boundsCheck(1, 100, 16.5), "wide");

// Equivalent ratios share a concentration; adding to both sides does not.
for (const [a, b, k] of [
  [3, 2, 3],
  [2, 3, 5],
  [1, 4, 2],
]) {
  assert.ok(M.scaledMix(a, b, k).same);
  assert.ok(Math.abs(M.concentration(a, b) - (k * a) / (k * a + k * b)) < 1e-12);
}
assert.ok(M.blueprint(2).distorted);
assert.equal(M.blueprint(2).multRatio, 1.5);
assert.notEqual(M.blueprint(2).addRatio, 1.5);

// Best buy: never exceeds the budget or the storage.
for (const [budget, storage] of [
  [40, 24],
  [5, 60],
  [100, 6],
  [10, 6],
]) {
  for (const r of M.bestBuy(
    [
      { price: 12, items: 8 },
      { price: 10, items: 6 },
    ],
    budget,
    storage,
  )) {
    assert.ok(
      r.cost <= budget && r.items <= storage,
      `pack plan stays inside ${budget}/${storage}`,
    );
  }
}

// Percent forms: fraction, decimal and ratio all name the same number.
for (const p of [5, 35, 50, 100, 45, 12.5 * 2]) {
  const f = M.percentForms(p),
    [n, d] = f.simple.split("/").map(Number);
  assert.ok(Math.abs(n / d - p / 100) < 1e-12, `${p}% simplified fraction`);
  assert.equal(f.decimal, p / 100);
}
assert.deepEqual(M.zoomPercent(12.5), {
  whole: 12,
  tenths: 5,
  thousandths: 125,
  per1000: "125/1000",
});
assert.equal(M.zoomPercent(100).whole, 100);

// Successive discounts never add: 20% then 10% is 28% off, not 30%.
{
  const s = M.successive(100, 20, 10);
  assert.equal(s.after2, 72);
  assert.equal(s.equivalentOff, 28);
  assert.equal(s.naive, 70);
  assert.ok(s.after2 > s.naive);
}

// Unit block: p% of whole = part, so 100 blocks recover the whole.
for (const [part, p] of [
  [18, 30],
  [9, 15],
  [40, 80],
]) {
  const u = M.unitBlock(part, p);
  assert.ok(Math.abs(u.at(p) - part) < 1e-9 && Math.abs(u.whole - (part / p) * 100) < 1e-9);
}

// A slanted cut is longer than the height, so it cannot reproduce the rectangle.
{
  const c = M.parallelogramCut(8, 6, 3);
  assert.ok(
    c.slant > 6 &&
      c.area === 48 &&
      c.triangleArea === 24 &&
      c.rectangleFromAltitude &&
      !c.rectangleFromSlant,
  );
}

// Overlap: inclusion–exclusion, and the bounding box splits into union + gap.
for (let dx = 0; dx <= 8; dx++)
  for (let dy = 0; dy <= 6; dy++) {
    const s = M.overlapScan(6, 4, 5, 4, dx, dy);
    assert.equal(s.union, s.sum - s.overlap);
    assert.equal(s.bounding, s.union + s.gap);
    assert.ok(s.overlap >= 0 && s.gap >= 0);
  }

// Leftover as a fraction of one serving: whole × serving + leftover = supply.
for (const [halves, n, d] of [
  [6, 1, 2],
  [11, 3, 4],
  [9, 2, 3],
  [8, 1, 4],
]) {
  const r = M.remainderOfScoop(halves, n, d),
    supply = halves / 2,
    serving = n / d;
  assert.ok(
    Math.abs(r.whole * serving + r.fractionOfScoop * serving - supply) < 1e-9,
    `${halves / 2} ÷ ${n}/${d}`,
  );
  assert.equal(r.remN / r.remD, r.fractionOfScoop === 0 ? 0 : r.remN / r.remD);
}
assert.deepEqual(M.remainderOfScoop(6, 1, 2), { whole: 6, remN: 0, remD: 1, fractionOfScoop: 0 });

// Expression forms: a(x + b) = ax + ab for every x; ax + b is off by (a − 1)b everywhere.
for (const [a, b] of [
  [4, 3],
  [3, 2],
  [5, 1],
])
  for (let x = 0; x <= 10; x++) {
    const r = M.expressionRow(a, b, x);
    assert.equal(r.factored, r.distributed);
    assert.equal(r.factored - r.wrong, (a - 1) * b);
  }

// Reference zero: signed position and absolute distance.
assert.deepEqual(M.fromReference(-4, 3), { signed: -7, distance: 7, fromZero: 4 });
assert.deepEqual(M.taxicab(-3, 4, 2, 4), { dx: 5, dy: 0, total: 5 });
assert.equal(M.taxicab(-4, -2, 3, 4).total, 13);

// Balance: the inverse operation really solves it, and a wrong candidate keeps the lock shut.
assert.equal(M.balanceTape("add", 7, 19).x, 12);
assert.equal(M.balanceTape("multiply", 4, 36).x, 9);
assert.ok(M.lockTest("multiply", 4, 36, 9).open && !M.lockTest("multiply", 4, 36, 8).open);
assert.ok(M.lockTest("add", 7, 19, 12).open);

// Whole-number domain: only non-negative integers that satisfy the inequality.
assert.deepEqual(M.wholeDomain(15, "<=").slice(-2), [14, 15]);
assert.equal(M.wholeDomain(15, "<").at(-1), 14);
assert.equal(M.wholeDomain(3.5, "<=").at(-1), 3);
assert.ok(M.wholeDomain(15, "<=").every((n) => Number.isInteger(n) && n >= 0));

// Pattern rules: the true rule passes, a near miss fails with a real counterexample.
assert.ok(M.ruleCheck(4, 1, 4, 1).ok);
{
  const r = M.ruleCheck(4, 1, 4, 2);
  assert.ok(!r.ok && r.firstMiss.n === 1 && r.firstMiss.actual === 5 && r.firstMiss.guess === 6);
}
{
  const e = M.assumedEstimate(48, 80);
  assert.ok(e.low <= e.expected && e.expected <= e.high);
}

/* ---- every lens renders in both languages for the lab's own values and for edge values -------------- */
const bad = /NaN|undefined|Infinity|\[object|null/;
let renders = 0;
for (const b of labsWithLens) {
  const key = `${b.model.kind}:${b.model.mode}`,
    spec = LENSES[key];
  assert.ok(
    spec.title.length === 2 && spec.title.every(Boolean),
    `${key}: title in English and Spanish`,
  );
  assert.ok(
    spec.intro.length === 2 && spec.intro[1] !== spec.intro[0],
    `${key}: Spanish intro differs from English`,
  );
  for (const c of spec.controls) {
    if (c.type === "choice")
      for (const [, l] of c.options)
        assert.ok(l.length === 2 && l[1], `${key}: choice has Spanish`);
    else assert.ok(c.label.length === 2 && c.label[1], `${key}: ${c.key} label has Spanish`);
  }
  // View states: the default, each choice, and every action pressed with a number typed.
  const views = [
    Object.fromEntries(
      spec.controls.filter((c) => c.type !== "button").map((c) => [c.key, c.value]),
    ),
  ];
  for (const c of spec.controls.filter((x) => x.type === "choice"))
    for (const [v] of c.options) views.push({ ...views[0], [c.key]: v });
  for (const c of spec.controls.filter((x) => x.type === "range"))
    for (const v of [c.min, c.max]) views.push({ ...views[0], [c.key]: v });
  for (const k of ["check", "test", "step"])
    views.push(
      ...views.slice().map((v) => ({ ...v, [k]: true, low: "10", high: "20", m: "4", k: "1" })),
    );
  const valueSets = [b.model.values];
  if (b.model.kind === "percent") valueSets.push([5, 1], [100, 120], [45, 7]);
  if (b.model.kind === "balance") valueSets.push([1, 1, 0], [12, 60, 30]);
  if (b.model.kind === "inequality") valueSets.push([1, 0], [24, 30]);
  if (b.model.kind === "coordinates") valueSets.push([-6, -6, 6, 6], [0, 0, 0, 0]);
  if (b.model.kind === "line") valueSets.push([-10, 0], [10, 10]);
  if (b.model.kind === "fraction") valueSets.push([0.5, 5, 2], [8, 1, 8]);
  if (b.model.kind === "area") valueSets.push([1, 1, 1], [12, 12, 12]);
  if (b.model.kind === "data")
    valueSets.push(
      [...b.model.values].map(() => 7),
      [...b.model.values].map((_, i) => (i * 7) % 50),
    );
  for (const values of valueSets)
    for (const view of views)
      for (const es of [false, true]) {
        const t = (en, sp) => (es ? sp : en);
        const html = spec.render({ values, result: {}, view, t });
        assert.ok(
          html.trim().length > 0,
          `${key}: empty body for ${JSON.stringify(values)} ${JSON.stringify(view)}`,
        );
        assert.ok(
          !bad.test(html.replace(/<[^>]+>/g, " ")),
          `${key} (${es ? "es" : "en"}): prints a bad token for ${JSON.stringify(values)} ${JSON.stringify(view)} → ${html.replace(/<[^>]+>/g, " ").match(bad)}`,
        );
        assert.equal(
          (html.match(/<svg/g) || []).length,
          (html.match(/<\/svg>/g) || []).length,
          `${key}: unbalanced svg`,
        );
        renders++;
      }
}

console.log(
  `learning-labs-lens: ${labsWithLens.length} labs have a lens; ${renders} renders (English + Spanish) clean; lens math re-derived`,
);
