// Exact-value tests for the data motion figures (shared/motion/figures/data*.mjs). Expected numbers are worked by hand, and every
// figure's headline is compared with the lab's own evaluate() for the same observations.
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { int, parse, Rat } from "../shared/motion/exact.mjs";
import figures from "../shared/motion/figures/data.mjs";
import { histogramOf } from "../shared/motion/figures/data-histogram.mjs";
import { dataModel, decimal, fmt } from "../shared/motion/figures/data-model.mjs";
import { pullIn } from "../shared/motion/figures/data-outlier.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";

const r = (n, d = 1) => new Rat(BigInt(n), BigInt(d));
const eq = (a, b, msg) => assert.ok(a.eq(b), `${msg}: ${a} vs ${b}`);
const byKey = (key) => figures.find((f) => f.keys.includes(key));

test("hand-worked statistics (the lab's median-of-halves quartiles)", () => {
  let m = dataModel("data:box", [2, 4, 5, 7, 9, 10, 12, 15]);
  eq(m.median.value, r(8), "median");
  eq(m.q1.value, r(9, 2), "Q1 = (4 + 5) / 2");
  eq(m.q3.value, r(11), "Q3 = (10 + 12) / 2");
  eq(m.iqr, r(13, 2), "IQR");
  eq(m.range, r(13), "range");

  m = dataModel("data:median", [17, 7, 5, 19, 13, 6, 4, 21]);
  assert.deepEqual(m.sorted, [4, 5, 6, 7, 13, 17, 19, 21]);
  eq(m.median.value, r(10), "median of the 2-3 bench");
  eq(m.q1.value, r(11, 2), "Q1");
  eq(m.q3.value, r(18), "Q3");
  eq(m.mean, r(23, 2), "mean 92 / 8");

  m = dataModel("data:spread", [0, 1, 14, 6, 20, 22, 24, 26]);
  eq(m.median.value, r(17), "median");
  eq(m.q1.value, r(7, 2), "Q1");
  eq(m.q3.value, r(23), "Q3");
  eq(m.iqr, r(39, 2), "IQR");
  eq(m.range, r(26), "range");

  // odd count: the middle value is in neither half
  m = dataModel("data:box", [1, 3, 5, 7, 9]);
  eq(m.median.value, r(5), "median");
  eq(m.q1.value, r(2), "Q1 = median of 1, 3");
  eq(m.q3.value, r(8), "Q3 = median of 7, 9");
  eq(m.iqr, r(6), "IQR");
});

test("mean and MAD are exact fractions", () => {
  let m = dataModel("data:mean-mad", [2, 4, 6, 8, 10, 12, 14, 16]);
  eq(m.mean, r(9), "mean");
  eq(m.absSum, r(32), "7+5+3+1+1+3+5+7");
  eq(m.mad, r(4), "MAD");
  m = dataModel("data:mean-mad", [4, 6, 8, 10, 12, 14, 16, 20]);
  eq(m.mean, r(45, 4), "mean 90 / 8 = 45/4");
  assert.equal(fmt(m.mean), "11.25");
  eq(m.absSum, r(34), "7.25+5.25+3.25+1.25+0.75+2.75+4.75+8.75");
  eq(m.mad, r(17, 4), "MAD 34 / 8 = 17/4");
  assert.equal(fmt(m.mad), "4.25");
  // the signed differences always cancel
  eq(
    m.devs.reduce((s, d) => s.add(d.dev), int(0)),
    r(0),
    "signed deviations sum to 0",
  );
});

test("histogram bins follow the lab: width 5 from 0, at least four bins", () => {
  const h = histogramOf(dataModel("data:histogram", [12, 14, 15, 17, 18, 20, 22, 16]));
  assert.deepEqual(h.bins, [0, 0, 2, 4, 2]);
  assert.deepEqual(
    histogramOf(dataModel("data:histogram", [0, 1, 2, 3, 3, 4, 4, 1])).bins,
    [8, 0, 0, 0],
  );
  assert.equal(
    histogramOf(dataModel("data:histogram", [50, 49, 0, 5, 5, 5, 10, 25])).bins.length,
    11,
  );
  assert.deepEqual(
    histogramOf(dataModel("data:histogram", [5, 5, 10, 10, 15, 15, 20, 20])).bins,
    [0, 2, 2, 2, 2],
  );
});

test("outlier: pulling the farthest value in leaves the median and moves the mean", () => {
  const m = dataModel("data:outlier", [1, 2, 3, 7, 11, 12, 14, 40]);
  eq(m.mean, r(45, 4), "mean 90 / 8");
  eq(m.median.value, r(9), "median");
  const p = pullIn(m);
  assert.equal(p.from, 40);
  assert.equal(p.to, 14);
  eq(p.after.mean, r(8), "mean 64 / 8");
  eq(p.after.median.value, r(9), "median unchanged");
  // a low outlier is pulled up
  const low = pullIn(dataModel("data:outlier", [0, 30, 31, 32, 33, 34, 35, 36]));
  assert.equal(low.from, 0);
  assert.equal(low.to, 30);
  // nothing to pull when the farthest value already touches its neighbor
  const flat = pullIn(dataModel("data:outlier", [5, 5, 5, 5, 5, 5, 5, 5]));
  assert.equal(flat.from, flat.to);
});

test("decimal text is exact, or flagged when rounded", () => {
  assert.deepEqual(decimal(r(1, 32)), { text: "0.03125", exact: true });
  assert.deepEqual(decimal(r(-5, 4)), { text: "−1.25", exact: true });
  assert.deepEqual(decimal(r(7)), { text: "7", exact: true });
  assert.deepEqual(decimal(r(7, 3)), { text: "2.33", exact: false });
  const m = dataModel("data:mean-mad", [1, 2, 4]);
  eq(m.mad, r(10, 9), "MAD of 1, 2, 4: distances 4/3, 1/3, 5/3");
});

test("every key's headline equals the lab's evaluate()", () => {
  const sets = [
    [2, 4, 5, 7, 9, 10, 12, 15],
    [17, 7, 5, 19, 13, 6, 4, 21],
    [0, 1, 14, 6, 20, 22, 24, 26],
    [4, 6, 8, 10, 12, 14, 16, 20],
    [11, 5, 4, 12, 14, 3, 13, 48],
    [12, 14, 15, 17, 18, 20, 22, 16],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 49],
    [3, 9, 27, 1, 44, 13, 31, 8],
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [5, 1, 9],
  ];
  for (const key of [
    "data:histogram",
    "data:median",
    "data:box",
    "data:spread",
    "data:mean-mad",
    "data:outlier",
  ]) {
    const [kind, mode] = key.split(":");
    for (const values of sets) {
      if (key === "data:median" && values.length > 9) continue;
      const lab = evaluate({ kind, mode, values }, values).value;
      const mine = byKey(key).build(key, values).headline;
      assert.ok(
        Math.abs(Number(mine.n) / Number(mine.d) - lab) < 1e-9,
        `${key} ${values}: ${mine} vs lab ${lab}`,
      );
    }
  }
});

test("a setting the lab would refuse throws RangeError", () => {
  for (const bad of [
    [1, 2],
    [1, 2, 3, 51],
    [1, 2, 3, -1],
    [1, 2, 3, 2.5],
    [1, 2, 3, Number.NaN],
  ])
    assert.throws(() => dataModel("data:box", bad), RangeError, JSON.stringify(bad));
  assert.throws(() => dataModel("data:median", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), RangeError);
  assert.throws(() => dataModel("ratio:tape", [1, 2, 3]), RangeError);
});

test("the headline number is printed in the picture, and the odd and non-terminating cases render", () => {
  const cases = [
    ["data:median", [17, 7, 5, 19, 13, 6, 4, 21], "10"],
    ["data:box", [2, 4, 5, 7, 9, 10, 12, 15], "4.5"],
    ["data:spread", [0, 1, 14, 6, 20, 22, 24, 26], "19.5"],
    ["data:mean-mad", [4, 6, 8, 10, 12, 14, 16, 20], "4.25"],
    ["data:outlier", [1, 2, 3, 7, 11, 12, 14, 40], "11.25"],
    ["data:histogram", [12, 14, 15, 17, 18, 20, 22, 16], "10"],
    ["data:mean-mad", [1, 2, 4], "1.11"],
    ["data:box", [1, 3, 5, 7, 9], "2"],
  ];
  for (const [key, values, needle] of cases) {
    for (const lang of ["en", "es"]) {
      const { svg } = figureSvg(byKey(key), key, values, { lang, width: 340 });
      assert.ok(svg.includes(needle), `${key} ${lang}: ${needle}`);
    }
  }
});

// ---- headline() and wrong(): used by the Standard flow and Challenge layers -------------------------------------------------
const KEYS = [
  "data:histogram",
  "data:median",
  "data:box",
  "data:spread",
  "data:mean-mad",
  "data:outlier",
];
const labValue = (key, values) => {
  const [kind, mode] = key.split(":");
  return evaluate({ kind, mode, values }, values).value;
};
const SETS = [
  [2, 4, 5, 7, 9, 10, 12, 15],
  [17, 7, 5, 19, 13, 6, 4, 21],
  [0, 1, 14, 6, 20, 22, 24, 26],
  [4, 6, 8, 10, 12, 14, 16, 20],
  [11, 5, 4, 12, 14, 3, 13, 48],
  [12, 14, 15, 17, 18, 20, 22, 16],
  [12, 15, 18, 22, 20, 17, 13, 19],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [15, 15, 15, 15, 15, 15, 15, 15],
  [50, 50, 50, 50, 50, 50, 50, 49],
  [3, 9, 27, 1, 44, 13, 31, 8],
  [5, 10, 15, 20, 25, 30, 35, 40],
  [1, 2, 3, 4, 5, 6, 7, 8],
  [20, 1, 2, 3, 4, 5, 6, 7],
  [2, 2, 3, 3, 4, 4, 5, 5],
];

test("headline(): equals the lab's evaluate(), reads back exactly, EN and ES labels differ", () => {
  for (const key of KEYS) {
    const fig = byKey(key);
    for (const values of SETS) {
      const m = fig.build(key, values);
      const en = fig.headline(m, "en");
      const es = fig.headline(m, "es");
      const v = parse(en.value);
      assert.ok(v, `${key} ${values}: ${en.value} parses`);
      assert.ok(v.eq(m.headline), `${key} ${values}: ${en.value} is the exact headline`);
      assert.ok(
        Math.abs(Number(v.n) / Number(v.d) - labValue(key, values)) < 1e-9,
        `${key} ${values}: ${en.value} vs lab`,
      );
      assert.equal(en.value, es.value);
      assert.notEqual(en.label, es.label, `${key} label translated`);
      assert.ok(!en.approx, `${key} ${values}: eight observations are always exact`);
    }
  }
});

test("headline(): a non-terminating value is flagged approx", () => {
  const m = byKey("data:mean-mad").build("data:mean-mad", [1, 2, 4]);
  assert.equal(byKey("data:mean-mad").headline(m, "en").approx, true);
});

test("wrong(): non-null exactly when the dashed card is drawn, never the right answer, translated", () => {
  /** The card is drawn when its "Not this" text is in the picture. */
  const drawn = (key, values) =>
    /Not this/.test(figureSvg(byKey(key), key, values, { lang: "en", width: 400 }).svg);
  let nonNull = 0;
  let nulls = 0;
  for (const key of KEYS) {
    const fig = byKey(key);
    for (const values of SETS) {
      const m = fig.build(key, values);
      const en = fig.wrong(m, "en");
      const es = fig.wrong(m, "es");
      assert.equal(
        en !== null,
        drawn(key, values),
        `${key} ${values}: wrong() iff the card is drawn`,
      );
      assert.equal(en === null, es === null);
      if (!en) {
        nulls++;
        continue;
      }
      nonNull++;
      assert.ok(parse(en.value), `${key} ${values}: ${en.value} parses`);
      assert.ok(
        !parse(en.value).eq(m.headline),
        `${key} ${values}: wrong ${en.value} equals the right answer`,
      );
      assert.equal(en.value, es.value);
      assert.ok(en.say && es.say && en.say !== es.say, `${key}: sentence translated`);
      assert.ok(
        !/\n/.test(en.say) && en.say.split(/(?<=[.!?])\s/).length === 1,
        `${key}: one sentence`,
      );
    }
  }
  assert.ok(
    nonNull > 20 && nulls > 5,
    `both cases are exercised (${nonNull} wrong, ${nulls} none)`,
  );
});

test("wrong(): hand-worked wrong results", () => {
  const w = (key, values) => byKey(key).wrong(byKey(key).build(key, values), "en");
  // median of 4,5,6,7,13,17,19,21 is 10; the list as given has 19 and 13 in the middle, mean 16
  assert.equal(w("data:median", [17, 7, 5, 19, 13, 6, 4, 21]).value, "16");
  assert.equal(w("data:box", [17, 7, 5, 19, 13, 6, 4, 21]).value, "16");
  assert.equal(w("data:box", [2, 4, 5, 7, 9, 10, 12, 15]), null);
  // range 26, IQR 19.5
  assert.equal(w("data:spread", [0, 1, 14, 6, 20, 22, 24, 26]).value, "26");
  // signed deviations average to 0
  assert.equal(w("data:mean-mad", [2, 4, 6, 8, 10, 12, 14, 16]).value, "0");
  assert.equal(w("data:mean-mad", [3, 3, 3, 3, 3, 3, 3, 3]), null);
  // the mean 11.25 used as the middle (median 9)
  assert.equal(w("data:outlier", [1, 2, 3, 7, 11, 12, 14, 40]).value, "11.25");
  // 15 counted in 10-14 instead of 15-19: [12,14,15,17,18,20,22,16] has 2 values in 10-14, so the wrong frequency is 3 (range is 10)
  assert.equal(w("data:histogram", [12, 14, 15, 17, 18, 20, 22, 16]).value, "3");
  assert.equal(w("data:histogram", [11, 12, 13, 14, 16, 17, 18, 19]), null);
});
