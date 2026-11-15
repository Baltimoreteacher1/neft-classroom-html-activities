// shared/motion/figures/percent*.mjs: exact values (hand-written, or by a different route), the headline of every key against the
// lab's own evaluate(), and the "only when it differs" rule for each dashed "not this" cue.
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate, fmt } from "../curriculum/learning-labs/shared/math.mjs";
import { parse } from "../shared/motion/exact.mjs";
import { figureFor } from "../shared/motion/figures/index.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";
import { dec, pieces, rat } from "../shared/motion/figures/percent-kit.mjs";

const KEYS = [
  "percent:grid",
  "percent:discount",
  "percent:benchmark",
  "percent:tape",
  "percent:whole",
  "percent:find-whole",
];
const model = (key, values) => figureFor(key).build(key, values);
const bare = (s) => s.replace(/,/g, "");
const count = (s, needle) => s.split(needle).length - 1;
const svgOf = (key, values, lang = "en") =>
  figureSvg(figureFor(key), key, values, { lang, width: 400 }).svg;

test("every percent key has a figure", () => {
  for (const k of KEYS) assert.ok(figureFor(k), k);
});

test("dec: exact when it terminates, rounded half up to four places otherwise", () => {
  assert.deepEqual(dec(rat(7, 20)), { text: "0.35", exact: true });
  assert.deepEqual(dec(rat(5, 2)), { text: "2.5", exact: true });
  assert.deepEqual(dec(rat(12000)), { text: "12,000", exact: true });
  assert.deepEqual(dec(rat(1, 3)), { text: "0.3333", exact: false });
  assert.deepEqual(dec(rat(2, 3)), { text: "0.6667", exact: false });
  assert.deepEqual(dec(rat(1800, 7)), { text: "257.1429", exact: false });
  assert.deepEqual(dec(rat(0)), { text: "0", exact: true });
  assert.deepEqual(dec(rat(-5, 4)), { text: "−1.25", exact: true });
});

test("the headline of every key equals the lab's evaluate() at every legal setting", () => {
  for (const key of KEYS) {
    const [kind, mode] = key.split(":");
    const whole = mode === "whole" || mode === "find-whole";
    const maxP = mode === "grid" ? 200 : 100;
    for (let p = whole ? 1 : 0; p <= maxP; p++) {
      for (let b = 1; b <= 120; b++) {
        const lab = evaluate({ kind, mode, values: [p, b] }, [p, b]);
        const m = model(key, [p, b]);
        const mine = whole ? m.whole : mode === "grid" ? m.part : m.discount;
        assert.equal(bare(mine.text), bare(fmt(lab.value)), `${key} ${p}, ${b}`);
        if (key === "percent:discount")
          assert.equal(bare(m.final.text), bare(fmt(b - lab.value)), `${key} final ${p}, ${b}`);
        // the lab's find-whole treats a value as exact when four decimals hold it
        if (whole)
          assert.equal(
            mine.exact,
            Math.abs(lab.value * 1e4 - Math.round(lab.value * 1e4)) < 1e-6,
            `${key} exactness ${p}, ${b}`,
          );
      }
    }
  }
});

test("the displayed whole times the percent gives the part back (BigInt cross-multiplication)", () => {
  for (let p = 1; p <= 100; p++) {
    for (let part = 1; part <= 120; part++) {
      const m = model("percent:whole", [p, part]);
      if (!m.whole.exact) continue;
      const w = parse(bare(m.whole.text));
      assert.equal(w.n * BigInt(p), BigInt(part) * 100n * w.d, `${p}%, ${part}`);
    }
  }
});

test("grid: 35% of 100 is 25% + 10%, 7/20, 0.35", () => {
  const m = model("percent:grid", [35, 100]);
  assert.deepEqual(
    m.groups.map((g) => [g.size, g.count, g.from, g.to]),
    [
      [25, 1, 0, 25],
      [10, 1, 25, 35],
    ],
  );
  assert.equal(m.part.text, "35");
  assert.equal(m.decimal, "0.35");
  assert.deepEqual(m.simple, [7, 20]);
  assert.equal(m.wrong, "3.5");
  assert.equal(m.wrongPct, 350);
});

test("grid: 135% of 40 needs a second grid, 100% + 25% + 10%, and is 54", () => {
  const m = model("percent:grid", [135, 40]);
  assert.deepEqual(
    m.groups.map((g) => [g.size, g.count]),
    [
      [100, 1],
      [25, 1],
      [10, 1],
    ],
  );
  assert.equal(m.part.text, "54");
  assert.equal(m.unit, "0.4");
  assert.equal(m.decimal, "1.35");
  assert.deepEqual(m.simple, [27, 20]);
  assert.equal(model("percent:grid", [200, 7]).simple, null);
  assert.equal(model("percent:grid", [37, 7]).simple, null);
});

test("benchmark pieces always add up to the percent", () => {
  for (let p = 0; p <= 200; p++) {
    const g = pieces(p, [100, 50, 25, 10, 5, 1]);
    assert.equal(
      g.reduce((s, x) => s + x.size * x.count, 0),
      p,
    );
    assert.ok(g.length <= 6, `p=${p}`);
  }
});

test("discount: 18% of 83 = 8.3 + 4.15 + 3 x 0.83 = 14.94, final price 68.06, estimate 20% of 80 = 16", () => {
  const m = model("percent:discount", [18, 83]);
  assert.deepEqual(
    m.groups.map((g) => [g.size, g.count, g.each, g.value, g.running]),
    [
      [10, 1, "8.3", "8.3", "8.3"],
      [5, 1, "4.15", "4.15", "12.45"],
      [1, 3, "0.83", "2.49", "14.94"],
    ],
  );
  assert.equal(m.discount.text, "14.94");
  assert.equal(m.final.text, "68.06");
  assert.deepEqual(m.near, [20]);
  assert.equal(m.friendly, 80);
  assert.deepEqual(m.estimates, ["16"]);
  assert.equal(m.wrong, "65");
});

test("discount: 15% of 60 is halfway between 10% and 20%", () => {
  const m = model("percent:benchmark", [15, 60]);
  assert.deepEqual(m.near, [10, 20]);
  assert.deepEqual(m.estimates, ["6", "12"]);
  assert.equal(m.discount.text, "9");
  assert.equal(m.estimate, true);
});

test("estimate: not shown when the percent is a benchmark and the whole is friendly, and never on the tape key", () => {
  assert.equal(model("percent:benchmark", [50, 80]).estimate, false);
  assert.equal(model("percent:benchmark", [18, 60]).estimate, true);
  assert.equal(model("percent:tape", [18, 60]).estimate, false);
  assert.equal(model("percent:benchmark", [0, 60]).estimate, false);
  assert.equal(model("percent:benchmark", [100, 60]).estimate, false);
});

test("discount: 45% of 90 (tape) = 40.5", () => {
  const m = model("percent:tape", [45, 90]);
  assert.equal(m.discount.text, "40.5");
  assert.equal(m.decimal, "0.45");
  assert.equal(m.final.text, "49.5");
});

test("whole: 18 is 30% -> 3 pieces of 10%, 6 each, 10 pieces, 60", () => {
  const m = model("percent:whole", [30, 18]);
  assert.deepEqual([m.g, m.k, m.n], [10, 3, 10]);
  assert.equal(m.piece.text, "6");
  assert.equal(m.whole.text, "60");
  assert.deepEqual(
    m.cols.map((c) => [c.pct, c.amt.text, c.op]),
    [
      [30, "18", null],
      [10, "6", "÷ 3"],
      [100, "60", "× 10"],
    ],
  );
  assert.equal(m.wrong, "5.4");
});

test("whole: 18 is 25% -> one piece, doubled twice to 72; 18 is 7% -> about 257.1429", () => {
  const a = model("percent:find-whole", [25, 18]);
  assert.deepEqual(
    a.cols.map((c) => [c.pct, c.amt.text, c.op]),
    [
      [25, "18", null],
      [100, "72", "× 4"],
    ],
  );
  const b = model("percent:whole", [7, 18]);
  assert.equal(b.whole.text, "257.1429");
  assert.equal(b.whole.exact, false);
  assert.equal(b.piece.text, "2.5714");
  assert.deepEqual(
    b.cols.map((c) => c.op),
    [null, "÷ 7", "× 100"],
  );
  const c = model("percent:whole", [40, 18]);
  assert.equal(c.whole.text, "45");
  assert.equal(model("percent:whole", [100, 18]).cols.length, 1);
});

test("a dashed 'not this' line appears only when the wrong move gives a different answer", () => {
  const no = (s) => count(s, ">Not this");
  // grid: decimal slip whenever p > 0; "percent as the amount" only when the whole is not 100
  assert.equal(no(svgOf("percent:grid", [0, 40])), 0);
  assert.equal(no(svgOf("percent:grid", [35, 100])), 1);
  assert.equal(no(svgOf("percent:grid", [35, 40])), 2);
  // discount: subtracting the percent differs unless the price is 100 (or nothing is taken off)
  assert.equal(no(svgOf("percent:discount", [25, 100])), 0);
  assert.equal(no(svgOf("percent:discount", [0, 80])), 0);
  assert.equal(no(svgOf("percent:discount", [25, 80])), 1);
  // whole: multiplying the part by the percent differs unless 100% (part is the whole)
  assert.equal(no(svgOf("percent:whole", [100, 18])), 0);
  assert.equal(no(svgOf("percent:whole", [30, 18])), 1);
  assert.equal(count(svgOf("percent:whole", [30, 18], "es"), ">Esto no"), 1);
  // the wrong answers really are different from the right ones
  for (let p = 1; p <= 100; p++)
    for (const b of [1, 7, 60, 99, 120]) {
      const m = model("percent:discount", [p, b]);
      assert.equal(m.wrong === null, b === 100, `${p}, ${b}`);
      if (m.wrong !== null) assert.notEqual(bare(m.wrong), bare(m.final.text));
      const w = model("percent:whole", [p, b]);
      assert.equal(w.wrong === null, p === 100);
      if (w.wrong !== null) assert.notEqual(w.wrong, w.whole.text);
    }
});

test("settings the lab refuses throw RangeError", () => {
  assert.throws(() => model("percent:whole", [0, 18]), RangeError);
  assert.throws(() => model("percent:grid", [201, 100]), RangeError);
  assert.throws(() => model("percent:discount", [101, 100]), RangeError);
  assert.throws(() => model("percent:discount", [10, 121]), RangeError);
  assert.throws(() => model("percent:tape", [10.5, 60]), RangeError);
});
