// Exact-value tests for the expressions-group motion figures (expression:equivalence, expression:distribute, factors:gcf, factors:lcm,
// factors:regroup). Expected numbers are written by hand or reached by a different route than the figures use.
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate, controls as labControls } from "../curriculum/learning-labs/shared/math.mjs";
import { parse } from "../shared/motion/exact.mjs";
import figures from "../shared/motion/figures/expressions.mjs";
import { factorsModel, primesOf } from "../shared/motion/figures/expressions-factors-math.mjs";
import { tw } from "../shared/motion/figures/expressions-kit.mjs";
import { expressionModel } from "../shared/motion/figures/expressions-math.mjs";
import { regroupModel } from "../shared/motion/figures/expressions-regroup.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";

const fig = (id) => figures.find((f) => f.id === id);
const lab = (key, values) => {
  const [kind, mode] = key.split(":");
  return evaluate({ kind, mode, values }, values);
};

test("every key of the group has exactly one figure, with the lab's own controls", () => {
  const keys = figures.flatMap((f) => f.keys).sort();
  assert.deepEqual(keys, [
    "expression:distribute",
    "expression:equivalence",
    "factors:gcf",
    "factors:lcm",
    "factors:regroup",
  ]);
  for (const f of figures)
    for (const key of f.keys) {
      const [kind, mode] = key.split(":");
      const mine = f.controls(key);
      const theirs = labControls({ kind, mode, values: [] });
      assert.equal(mine.length, theirs.length, key);
      mine.forEach((c, i) =>
        assert.deepEqual(
          [c.min, c.max, c.step],
          [theirs[i].min, theirs[i].max, theirs[i].step],
          `${key} control ${i}`,
        ),
      );
    }
});

test("expression: hand-checked numbers", () => {
  const m = expressionModel([3, 4, 2]);
  assert.deepEqual(
    [m.s, m.totalText, m.ax, m.ab, m.expandedText, m.fee, m.short, m.differs],
    ["6", "18", "6", "12", "18", "10", "8", true],
  );
  assert.equal(m.expandedForm, "3x + 12");
  assert.equal(m.groupedForm, "3(x + 4)");
  assert.equal(m.feeForm, "3x + 4");
  // the same numbers by another route: the parser on the written-out expressions
  assert.equal(String(parse("3 × (2 + 4)")), "18");
  assert.equal(String(parse("3 × 2 + 3 × 4")), "18");
  assert.equal(String(parse("3 × 2 + 4")), "10");
  const big = expressionModel([8, 10, 10]);
  assert.deepEqual([big.totalText, big.fee, big.short], ["160", "90", "70"]);
  const one = expressionModel([1, 5, 7]);
  assert.equal(one.differs, false);
  assert.equal(one.expandedForm, "x + 5");
  assert.equal(one.feeForm, "x + 5");
});

test("expression: the headline equals the lab's evaluate() at every setting", () => {
  for (let a = 1; a <= 8; a++)
    for (let b = 1; b <= 10; b++)
      for (let x = 1; x <= 10; x++) {
        const m = expressionModel([a, b, x]);
        const v = lab("expression:equivalence", [a, b, x]).value;
        assert.equal(m.total, BigInt(v), `${a},${b},${x}`);
        assert.equal(m.expandedText, String(v));
        assert.equal(m.differs, a !== 1);
        if (a !== 1) assert.notEqual(m.fee, m.totalText);
        assert.equal(lab("expression:distribute", [a, b, x]).value, v);
      }
});

test("expression: refuses what the lab refuses", () => {
  for (const bad of [
    [0, 1, 1],
    [9, 1, 1],
    [1, 11, 1],
    [1, 1, 11],
    [1.5, 1, 1],
    [1, 1, "2"],
  ])
    assert.throws(() => expressionModel(bad), RangeError);
});

test("factors: GCF and LCM agree with the lab for every pair", () => {
  for (let a = 2; a <= 36; a++)
    for (let b = 2; b <= 36; b++) {
      const m = factorsModel([a, b]);
      assert.equal(m.gcf, lab("factors:gcf", [a, b]).value, `gcf ${a},${b}`);
      assert.equal(m.lcm, lab("factors:lcm", [a, b]).value, `lcm ${a},${b}`);
      assert.equal(m.gcf * m.lcm, a * b);
      assert.equal(m.productCols, m.lcm, `primes of ${a},${b}`);
      assert.equal(m.gcf * m.qa * m.qb, m.lcm);
      assert.equal(m.gcf * (m.qa + m.qb), a + b);
      assert.equal(m.hopsA * a, m.lcm);
      assert.equal(m.hopsB * b, m.lcm);
      assert.equal(
        m.cols.filter((c) => c.inA).reduce((t, c) => t * c.p, 1),
        a,
      );
      assert.equal(
        m.cols.filter((c) => c.inB).reduce((t, c) => t * c.p, 1),
        b,
      );
    }
});

test("factors: hand-checked numbers", () => {
  const m = factorsModel([18, 24]);
  assert.deepEqual(m.fa, [1, 2, 3, 6, 9, 18]);
  assert.deepEqual(m.fb, [1, 2, 3, 4, 6, 8, 12, 24]);
  assert.deepEqual(m.shared, [1, 2, 3, 6]);
  assert.deepEqual([m.gcf, m.lcm, m.sum, m.qa, m.qb], [6, 72, 42, 3, 4]);
  const n = factorsModel([12, 18]);
  assert.deepEqual([n.gcf, n.lcm, n.hopsA, n.hopsB], [6, 36, 3, 2]);
  assert.deepEqual(n.cols, [
    { p: 2, inA: true, inB: true },
    { p: 2, inA: true, inB: false },
    { p: 3, inA: true, inB: true },
    { p: 3, inA: false, inB: true },
  ]);
  const c = factorsModel([7, 9]);
  assert.deepEqual([c.gcf, c.lcm, c.shared], [1, 63, [1]]);
  const same = factorsModel([36, 36]);
  assert.deepEqual([same.gcf, same.lcm], [36, 36]);
  assert.deepEqual(primesOf(36), [2, 2, 3, 3]);
  assert.deepEqual(primesOf(13), [13]);
  assert.deepEqual(primesOf(32), [2, 2, 2, 2, 2]);
  assert.equal(factorsModel([35, 36]).lcm, 1260);
  assert.throws(() => factorsModel([1, 5]), RangeError);
  assert.throws(() => factorsModel([5, 37]), RangeError);
});

test("regroup: the grouped pair and totals agree with the lab, and the value never changes", () => {
  for (const a of [1, 2, 5, 12, 25])
    for (const b of [1, 3, 8, 25])
      for (const c of [1, 4, 17, 25])
        for (const p of [1, 2, 3]) {
          const m = regroupModel([a, b, c, p]);
          assert.equal(
            m.pairProduct,
            BigInt(lab("factors:regroup", [a, b, c, p]).value),
            `${a},${b},${c},${p}`,
          );
          assert.equal(m.total, BigInt(a * b * c));
          assert.equal(m.order.length, 3);
          assert.deepEqual([...m.order].sort(), [0, 1, 2]);
          // the two pair positions are next to each other after the reorder
          const pos = m.pairIdx.map((i) => m.order.indexOf(i)).sort();
          assert.equal(pos[1] - pos[0], 1);
          assert.equal(m.differs, m.x + m.y !== m.x * m.y);
        }
  const m = regroupModel([4, 17, 25, 2]);
  assert.deepEqual(
    [m.pairText, m.totalText, m.sumText, m.wrongText, m.differs, m.moved],
    ["100", "1,700", "29", "493", true, true],
  );
  assert.deepEqual(m.order, [0, 2, 1]);
  const k = regroupModel([5, 12, 8, 1]);
  assert.deepEqual([k.pairText, k.totalText, k.wrongText, k.moved], ["60", "480", "136", false]);
  assert.equal(regroupModel([2, 2, 7, 1]).differs, false);
  assert.throws(() => regroupModel([5, 12, 8, 4]), RangeError);
  assert.throws(() => regroupModel([0, 12, 8, 1]), RangeError);
});

/** Every drawn headline number is on the picture; the "not this" card is present exactly when it differs; no text spills past the width. */
function svgChecks(id, key, values, expectNumbers, wrongStep) {
  for (const lang of ["en", "es"])
    for (const width of [300, 340, 400, 600]) {
      const f = fig(id);
      const r = figureSvg(f, key, values, { lang, width });
      for (const n of expectNumbers)
        assert.ok(r.svg.includes(n), `${id} ${lang}@${width}: ${n} missing`);
      assert.equal(
        r.svg.includes(`data-step="${wrongStep}"`),
        wrongStep <= r.model.steps,
        `${id}: look-alike card presence`,
      );
      for (const t of r.svg.matchAll(
        /<text x="([\d.-]+)" y="[\d.-]+" text-anchor="(\w+)" font-size="(\d+)" font-weight="(\d+)"[^>]*>([^<]*)</g,
      )) {
        const [, x, anchor, size, weight, body] = t;
        const w = tw(body.replace(/&amp;/g, "&"), Number(size), Number(weight));
        const left =
          anchor === "start" ? Number(x) : anchor === "end" ? Number(x) - w : Number(x) - w / 2;
        assert.ok(
          left >= -1 && left + w <= r.width + 1,
          `${id} ${lang}@${width}: "${body}" spills (${left.toFixed(0)}..${(left + w).toFixed(0)} of ${r.width})`,
        );
      }
      const d = f.describe(r.model, lang);
      for (const n of expectNumbers)
        assert.ok(d.includes(n), `${id} ${lang}: description lacks ${n}`);
    }
}

test("renders carry the headline numbers and show the look-alike only when it differs", () => {
  svgChecks(
    "expression-two-forms-one-value",
    "expression:equivalence",
    [3, 4, 2],
    ["18", "10", "12"],
    4,
  );
  svgChecks("expression-two-forms-one-value", "expression:equivalence", [1, 4, 2], ["6"], 4);
  svgChecks(
    "expression-area-distribute",
    "expression:distribute",
    [8, 10, 10],
    ["160", "90", "80"],
    4,
  );
  svgChecks("expression-area-distribute", "expression:distribute", [1, 1, 1], ["2"], 4);
  svgChecks("factors-shared-greatest", "factors:gcf", [18, 24], ["18, 24", "42", "6(3 + 4)"], 4);
  svgChecks("factors-shared-greatest", "factors:gcf", [36, 36], ["36"], 4);
  svgChecks("factors-hops-primes-lcm", "factors:lcm", [12, 18], ["36", "216"], 4);
  svgChecks("factors-hops-primes-lcm", "factors:lcm", [7, 9], ["63"], 4);
  svgChecks("factors-hops-primes-lcm", "factors:lcm", [35, 36], ["1,260"], 4);
  svgChecks(
    "factors-reorder-regroup",
    "factors:regroup",
    [4, 17, 25, 2],
    ["1,700", "100", "493"],
    4,
  );
  svgChecks("factors-reorder-regroup", "factors:regroup", [2, 2, 2, 1], ["8"], 4);
});

test("the Spanish figure uses the lessons' Spanish terms", () => {
  const gcf = figureSvg(fig("factors-shared-greatest"), "factors:gcf", [18, 24], {
    lang: "es",
    width: 400,
  }).svg;
  assert.ok(gcf.includes("MCD") && !gcf.includes("GCF"));
  const lcm = figureSvg(fig("factors-hops-primes-lcm"), "factors:lcm", [12, 18], {
    lang: "es",
    width: 400,
  }).svg;
  assert.ok(lcm.includes("mcm") && !lcm.includes("LCM"));
});
