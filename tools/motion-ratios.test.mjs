// Exact-value tests for the ratio motion figures (shared/motion/figures/ratios*.mjs). Expected numbers are written by hand,
// and every headline is compared with the lab's own evaluate(). The generic contract is tools/motion-figures.test.mjs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { registered } from "../curriculum/learning-labs/shared/models/index.mjs";
import { equivalent, parse } from "../shared/motion/exact.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";
import ratios from "../shared/motion/figures/ratios.mjs";
import {
  compareModel,
  convModel,
  doubleLine,
  graphModel,
  plain,
  R,
  rateModel,
  show,
  tapeModel,
  txt,
} from "../shared/motion/figures/ratios-calc.mjs";
import { blueprints } from "./learning-labs/blueprints.mjs";

const fig = (id) => /** @type {any} */ (ratios.find((f) => f.id === id));
const svgOf = (id, key, values, lang = "en") =>
  figureSvg(fig(id), key, values, { lang, width: 400 }).svg;
const startOf = (key) => {
  const b = blueprints.find((x) => `${x.model.kind}:${x.model.mode}` === key)?.model;
  if (b) return b.values;
  const [kind, mode] = key.split(":");
  return registered({ kind, mode }).values;
};
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)</g)].map((m) => m[1]);

test("show(): whole numbers and short decimals are text, everything else is a stacked fraction with a rounded decimal", () => {
  assert.deepEqual(show(R(12)), { pre: "", t: "12" });
  assert.deepEqual(show(R(5, 4)), { pre: "", t: "1.25" });
  assert.deepEqual(show(R(3, 5)), { pre: "", t: "0.6" });
  assert.deepEqual(show(R(7, 8)), { pre: "", t: "0.875" });
  assert.deepEqual(show(R(5, 3)), { pre: "", n: "5", d: "3", approx: "1.67" });
  assert.deepEqual(show(R(7, 12)), { pre: "", n: "7", d: "12", approx: "0.58" });
  assert.deepEqual(show(R(3, 2), { money: true }), { pre: "$", t: "1.50" });
  assert.deepEqual(show(R(12), { money: true }), { pre: "$", t: "12" });
  assert.deepEqual(show(R(5, 3), { money: true }), { pre: "$", n: "5", d: "3", approx: "$1.67" });
  assert.equal(txt(R(-13), true), "−$13");
  assert.equal(plain(show(R(2, 3))), "2/3");
  assert.equal(txt(R(1, 15), true), "$1/15");
});

test("ratio:mixer / unit-rate: scale, simplest form, unit rate and the additive wrong move", () => {
  let m = doubleLine("ratio:mixer", [5, 4]);
  assert.deepEqual(
    m.rows.map((r) => [r.id, String(r.a), String(r.b), r.op]),
    [
      ["given", "5", "4", ""],
      ["scale", "10", "8", "×2"],
      ["unit", "5/4", "1", "÷4"],
    ],
  );
  assert.deepEqual([String(m.wrong.a), String(m.wrong.b), m.wrong.d], ["9", "8", 4]); // 5+4 : 4+4, not 10 : 8
  m = doubleLine("ratio:mixer", [6, 4]);
  assert.deepEqual(
    m.rows.map((r) => [r.id, String(r.a), String(r.b), r.op]),
    [
      ["given", "6", "4", ""],
      ["scale", "12", "8", "×2"],
      ["simplest", "3", "2", "÷2"],
      ["unit", "3/2", "1", "÷4"],
    ],
  );
  assert.deepEqual([String(m.wrong.a), String(m.wrong.b)], ["10", "8"]);
  m = doubleLine("ratio:mixer", [2, 9]); // the smaller quantity (juice, 2) is the one added to both
  assert.deepEqual([String(m.wrong.a), String(m.wrong.b), m.wrong.d], ["4", "11", 2]);
  m = doubleLine("ratio:unit-rate", [6, 3]); // the simplest form IS the unit rate, so there is one row for it
  assert.deepEqual(
    m.rows.map((r) => r.id),
    ["given", "scale", "unit"],
  );
  assert.equal(String(m.value), "2");
  m = doubleLine("ratio:mixer", [5, 5]); // adding the same amount to equal quantities keeps them equal: no wrong move to show
  assert.equal(m.wrong, null);
  assert.deepEqual(
    m.rows.map((r) => r.id),
    ["given", "scale", "unit"],
  );
  assert.equal(
    doubleLine("ratio:mixer", [7, 1]).rows.some((r) => r.id === "unit"),
    false,
  ); // already per 1
});

test("ratio:compare / patterns: the common white, the multipliers and the verdict", () => {
  let m = compareModel("ratio:compare", [4, 12]);
  assert.deepEqual(
    [m.L, m.kMine, m.kRef, String(m.mine), String(m.ref), m.verdict],
    [60, 5, 12, "20", "36", -1],
  );
  assert.deepEqual([String(m.wrong.color), String(m.wrong.white), m.wrong.t], ["-3", "5", -7]); // 4-7 : 12-7, to reach the reference's 5 cups of white
  m = compareModel("ratio:patterns", [9, 5]);
  assert.deepEqual(
    [m.L, m.kMine, m.kRef, String(m.mine), String(m.ref), m.verdict, m.wrong],
    [5, 1, 1, "9", "3", 1, null],
  );
  m = compareModel("ratio:compare", [3, 5]);
  assert.equal(m.verdict, 0);
  m = compareModel("ratio:compare", [6, 10]); // 6:10 is 3:5
  assert.deepEqual(
    [m.L, m.kMine, m.kRef, String(m.mine), String(m.ref), m.verdict],
    [10, 1, 2, "6", "6", 0],
  );
  assert.deepEqual([String(m.wrong.color), m.wrong.t], ["1", -5]);
  m = compareModel("ratio:compare", [2, 1]);
  assert.deepEqual([m.L, String(m.wrong.color), m.wrong.t], [5, "6", 4]);
  assert.equal(compareModel("ratio:compare", [7, 7]).wrong, null); // equal numbers stay equal when the same amount is added
});

test("rate:shopping: unit price, the offer and the subtract-from-both wrong move", () => {
  let m = rateModel("rate:shopping", [12, 8]);
  assert.equal(txt(m.unit, true), "$1.50");
  assert.equal(txt(m.offerUnit, true), "$5/3");
  assert.deepEqual([m.verdict, m.wrong.off, String(m.wrong.dollars)], [-1, 7, "5"]);
  m = rateModel("rate:shopping", [10, 6]);
  assert.equal(m.verdict, 0);
  m = rateModel("rate:shopping", [30, 5]);
  assert.equal(m.verdict, 1); // $6 per item against $1.67
  assert.equal(rateModel("rate:shopping", [9, 9]).wrong, null);
  assert.equal(rateModel("rate:shopping", [9, 1]).wrong, null);
});

test("growth:ratio-graph / rider: table rows, the line through (0, 0) or not, and the wrong move", () => {
  let m = graphModel("growth:ratio-graph", [3, 0, 4]);
  assert.deepEqual(
    m.rows.map((r) => [r.x, r.y, String(r.rate), r.op]),
    [
      [1, 3, "3", ""],
      [2, 6, "3", "×2"],
      [3, 9, "3", "×3"],
      [4, 12, "3", "×4"],
    ],
  );
  assert.deepEqual(m.wrong, { x: 4, y: 6, add: 3 }); // 1+3, 3+3: not 4, 12
  assert.equal(String(m.value), "12");
  assert.equal(graphModel("growth:ratio-graph", [1, 0, 5]).wrong, null); // adding the same amount to 1:1 stays on the line
  assert.equal(graphModel("growth:ratio-graph", [5, 0, 1]).wrong, null);
  m = graphModel("growth:rider", [3, 2, 4]);
  assert.deepEqual(
    m.rows.map((r) => [r.x, r.y, String(r.rate)]),
    [
      [1, 5, "5"],
      [2, 8, "4"],
      [3, 11, "11/3"],
      [4, 14, "7/2"],
    ],
  );
  assert.equal(m.proportional, false);
  assert.equal(String(m.value), "14");
  m = graphModel("growth:rider", [2, 0, 10]); // no rider aboard: the same figure as the ratio graph
  assert.equal(m.proportional, true);
  assert.deepEqual(
    m.rows.map((r) => r.x),
    [1, 2, 3, 10],
  );
});

test("conversion:expedition / scale: exact factors, results and the two wrong moves", () => {
  let m = convModel("conversion:expedition", [12, 2.54]);
  assert.equal(txt(m.result), "30.48");
  assert.equal(txt(convModel("conversion:expedition", [5, 2.54]).result), "12.7");
  assert.equal(txt(m.wrong.bottom), "13.54"); // 2.54 + 11
  assert.equal(m.wrong.add, 11);
  m = convModel("conversion:scale", [4, 12]);
  assert.deepEqual(
    [String(m.result), String(m.wrong.bottom), String(m.flipped)],
    ["48", "15", "1/3"],
  );
  assert.equal(convModel("conversion:scale", [1, 12]).wrong, null);
});

test("settings the lab refuses throw RangeError", () => {
  assert.throws(() => doubleLine("ratio:mixer", [0, 3]), RangeError);
  assert.throws(() => doubleLine("ratio:mixer", [3, 13]), RangeError);
  assert.throws(() => doubleLine("ratio:mixer", [2.5, 3]), RangeError);
  assert.throws(() => rateModel("rate:shopping", [31, 2]), RangeError);
  assert.throws(() => rateModel("rate:shopping", [3, 16]), RangeError);
  assert.throws(() => graphModel("growth:ratio-graph", [3, 1, 4]), RangeError); // the starting amount is locked at 0
  assert.throws(() => graphModel("growth:rider", [3, 7, 4]), RangeError);
  assert.throws(() => convModel("conversion:scale", [3, 2.54]), RangeError); // the factor is fixed
  assert.throws(() => tapeModel("ratio:tape", [13, 1]), RangeError);
});

test("every headline equals the lab's evaluate() (every setting of the first and last control)", () => {
  const build = {
    "ratio:mixer": (v) => doubleLine("ratio:mixer", v).value,
    "ratio:unit-rate": (v) => doubleLine("ratio:unit-rate", v).value,
    "ratio:compare": (v) => compareModel("ratio:compare", v).value,
    "ratio:patterns": (v) => compareModel("ratio:patterns", v).value,
    "ratio:tape": (v) => tapeModel("ratio:tape", v).value,
    "rate:shopping": (v) => rateModel("rate:shopping", v).value,
    "growth:ratio-graph": (v) => graphModel("growth:ratio-graph", v).value,
    "growth:rider": (v) => graphModel("growth:rider", v).value,
    "conversion:expedition": (v) => convModel("conversion:expedition", v).value,
    "conversion:scale": (v) => convModel("conversion:scale", v).value,
  };
  const wantedKeys = ratios.flatMap((f) => f.keys).sort();
  assert.deepEqual(Object.keys(build).sort(), wantedKeys, "every claimed key is tested");
  for (const [key, headline] of Object.entries(build)) {
    const [kind, mode] = key.split(":");
    const base = startOf(key);
    const f = ratios.find((x) => x.keys.includes(key));
    const cs = f.controls(key);
    for (const i of [0, cs.length - 1]) {
      for (let v = cs[i].min; v <= cs[i].max; v += cs[i].step) {
        const values = base.map((x, j) => (j === i ? v : x));
        const want = evaluate({ kind, mode, values }).value;
        const got = headline(values);
        assert.ok(
          Math.abs(Number(got.n) / Number(got.d) - want) < 1e-9,
          `${key} ${JSON.stringify(values)}: ${got} vs ${want}`,
        );
      }
    }
  }
});

test("the pictures show the computed numbers, in both languages", () => {
  const t = (s) => texts(s).join(" | ");
  const mixer = t(svgOf("ratio-double-line", "ratio:mixer", [5, 4]));
  for (const s of ["×2", "÷4", "1.25", "5 ÷ 4 =", "start", "+4, +4", "9", "8", "10"])
    assert.ok(mixer.includes(s), `mixer: ${s}`);
  assert.ok(t(svgOf("ratio-double-line", "ratio:mixer", [5, 4], "es")).includes("inicio"));
  assert.ok(
    !t(svgOf("ratio-double-line", "ratio:mixer", [5, 5])).includes("Not this"),
    "no wrong move for equal quantities",
  );
  const cmp = t(svgOf("ratio-compare", "ratio:compare", [4, 12]));
  for (const s of ["20", "36", "60", "×5", "×12", "4 ÷ 12 =", "0.33", "0.6", "−7, −7"])
    assert.ok(cmp.includes(s), `compare: ${s}`);
  const rate = t(svgOf("rate-unit-price", "rate:shopping", [12, 8]));
  for (const s of ["$1.50", "$12", "÷8", "$1.67", "$10", "÷6", "−7, −7"])
    assert.ok(rate.includes(s), `rate: ${s}`);
  const g = t(svgOf("ratio-graph", "growth:ratio-graph", [3, 0, 4]));
  for (const s of ["×2", "×3", "×4", "(4, 12)", "+3, +3"]) assert.ok(g.includes(s), `graph: ${s}`);
  const c = t(svgOf("conversion-chain", "conversion:expedition", [12, 2.54]));
  for (const s of ["30.48", "2.54", "×12", "13.54", "cm"])
    assert.ok(c.includes(s), `conversion: ${s}`);
  const tp = t(svgOf("ratio-part-whole", "ratio:tape", [6, 3]));
  for (const s of ["6 : 3", "6 : 9", "3 : 9", "6 + 3 = 9"])
    assert.ok(tp.includes(s.replaceAll(" : ", " : ")) || tp.includes(s), `tape: ${s}`);
});

test("descriptions carry every headline number", () => {
  const d = (id, key, values, lang = "en") => fig(id).describe(fig(id).build(key, values), lang);
  assert.match(d("ratio-double-line", "ratio:mixer", [5, 4]), /5 ÷ 4 = 1\.25/);
  assert.match(d("ratio-double-line", "ratio:mixer", [5, 4], "es"), /5 ÷ 4 = 1\.25/);
  assert.match(
    d("ratio-compare", "ratio:compare", [4, 12]),
    /20 cups of color against 36 for 60 cups of white/,
  );
  assert.match(d("rate-unit-price", "rate:shopping", [12, 8]), /\$12 ÷ 8 = \$1\.50/);
  assert.match(d("ratio-graph", "growth:rider", [3, 2, 4]), /3 × 4 \+ 2 = 14/);
  assert.match(
    d("conversion-chain", "conversion:expedition", [12, 2.54]),
    /12 × 2\.54 = 30\.48 cm/,
  );
  assert.match(d("ratio-part-whole", "ratio:tape", [6, 3]), /6 \+ 3 = 9 cups/);
});

test("headline() is the lab's number and wrong() is the dashed card's wrong result (every setting of the first and last control)", () => {
  const settings = (c) =>
    Array.from({ length: Math.round((c.max - c.min) / c.step) + 1 }, (_, i) =>
      Number((c.min + i * c.step).toFixed(6)),
    );
  for (const f of ratios) {
    for (const key of f.keys) {
      const [kind, mode] = key.split(":");
      const base = startOf(key);
      const cs = f.controls(key);
      for (const i of new Set([0, cs.length - 1])) {
        for (const v of settings(cs[i])) {
          const values = base.map((x, j) => (j === i ? v : x));
          const where = `${key} ${JSON.stringify(values)}`;
          const model = f.build(key, values);
          const h = f.headline(model, "en");
          const want = evaluate({ kind, mode, values }).value;
          const got = parse(h.value);
          assert.ok(
            got && Math.abs(Number(got.n) / Number(got.d) - want) < 1e-9,
            `${where}: headline ${h.value} vs ${want}`,
          );
          assert.ok(
            h.label && h.label !== f.headline(model, "es").label,
            `${where}: headline label not translated`,
          );
          const w = f.wrong(model, "en");
          const drawn = texts(svgOf(f.id, key, values)).some((s) => s.startsWith("Not this"));
          assert.equal(
            w !== null,
            drawn,
            `${where}: wrong() is non-null exactly when the dashed card is drawn`,
          );
          if (w) {
            const wv = parse(w.value);
            assert.ok(wv, `${where}: wrong value ${w.value} does not parse`);
            assert.ok(!equivalent(w.value, h.value), `${where}: wrong equals right (${w.value})`);
            assert.ok(
              w.say && w.say !== f.wrong(model, "es").say,
              `${where}: wrong say not translated`,
            );
          }
        }
      }
    }
  }
});

test("headline() and wrong() values, written by hand", () => {
  const f = (id, key, values) => {
    const x = fig(id);
    const m = x.build(key, values);
    return [x.headline(m, "en").value, x.wrong(m, "en")?.value ?? null];
  };
  assert.deepEqual(f("ratio-part-whole", "ratio:tape", [6, 3]), ["9", "3"]);
  assert.deepEqual(f("ratio-double-line", "ratio:mixer", [5, 4]), ["1.25", "1.125"]);
  assert.deepEqual(f("ratio-double-line", "ratio:unit-rate", [5, 5]), ["1", null]);
  assert.deepEqual(f("ratio-compare", "ratio:compare", [4, 12]), ["1/3", "−0.6"]);
  assert.deepEqual(f("ratio-compare", "ratio:patterns", [2, 5]), ["0.4", null]);
  assert.deepEqual(f("rate-unit-price", "rate:shopping", [12, 8]), ["1.5", "5"]);
  assert.deepEqual(f("rate-unit-price", "rate:shopping", [9, 9]), ["1", null]);
  assert.deepEqual(f("ratio-graph", "growth:ratio-graph", [3, 0, 4]), ["12", "6"]);
  assert.deepEqual(f("ratio-graph", "growth:ratio-graph", [1, 0, 4]), ["4", null]);
  assert.deepEqual(f("ratio-graph", "growth:rider", [3, 2, 4]), ["14", "12"]);
  assert.deepEqual(f("conversion-chain", "conversion:expedition", [12, 2.54]), [
    "30.48",
    "600/127",
  ]);
  assert.deepEqual(f("conversion-chain", "conversion:scale", [4, 12]), ["48", "1/3"]);
  assert.match(
    fig("ratio-double-line").wrong(fig("ratio-double-line").build("ratio:mixer", [5, 4]), "en").say,
    /^Added 4 to both/,
  );
  assert.match(
    fig("ratio-double-line").wrong(fig("ratio-double-line").build("ratio:mixer", [5, 4]), "es").say,
    /^Sumó 4 a las dos/,
  );
});
