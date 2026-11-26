// Pure-function proof for the ratio-scale living scene: validation refuses bad
// configs, and every number the play states is computed correctly.
import assert from "node:assert/strict"; import { test } from "node:test";
import { buildRatioScalePlay, validateRatioScale as reexported } from "./ratio-scale.js";
import {
  additiveRows,
  equivalentRows,
  isEquivalent,
  placeCorrect,
  ratioCopy,
  scaleChoices,
  unitRate,
  validateRatioScale,
} from "./ratio-scale-model.js";

const LESSON_3_3 = {
  a: 2,
  b: 3,
  k: 4,
  labelA: { en: "cups of mix", es: "tazas de mezcla" },
  labelB: { en: "cups of milk", es: "tazas de leche" },
  transfer: { a: 1, b: 4, k: 3, labelA: { en: "cups of juice", es: "tazas de jugo" }, labelB: { en: "cups of water", es: "tazas de agua" } },
};

test("validation rejects bad configs", () => {
  const bad = [
    null,
    "2:3",
    {},
    { a: 2 },
    { a: 2, b: 2 }, // equal parts: adding to both would look right
    { a: 0, b: 3 },
    { a: 7, b: 3 },
    { a: 2.5, b: 3 },
    { a: -2, b: 3 },
    { a: 2, b: 3, k: 1 },
    { a: 2, b: 3, k: 6 },
    { a: 2, b: 3, k: "x" },
    { a: 2, b: 3, labelA: 5 },
    { a: 2, b: 3, labelA: "a label far too long to fit" },
    { a: 2, b: 3, labelB: { en: "" } },
    { a: 2, b: 3, transfer: { a: 2, b: 2, k: 3 } },
    { a: 2, b: 3, transfer: { a: 1, b: 4, k: 11 } },
    { a: 2, b: 3, transfer: { a: 0, b: 4, k: 3 } },
    { a: 2, b: 3, k: 3, transfer: { a: 2, b: 3, k: 3 } }, // identical to the main question
  ];
  for (const cfg of bad) {
    assert.equal(validateRatioScale(cfg), null, JSON.stringify(cfg));
    assert.equal(buildRatioScalePlay(cfg), null, JSON.stringify(cfg));
  }
});

test("validation accepts the lesson config and fills defaults", () => {
  const v = validateRatioScale(LESSON_3_3);
  assert.deepEqual([v.a, v.b, v.k], [2, 3, 4]);
  assert.equal(v.labelA.en, "cups of mix");
  assert.equal(v.transfer.labelB.en, "cups of water");
  const d = validateRatioScale({ a: 3, b: 1 });
  assert.equal(d.k, 3);
  assert.equal(d.labelA.en, "red paint");
  assert.deepEqual([d.transfer.a, d.transfer.b, d.transfer.k], [1, 4, 4]);
  assert.equal(validateRatioScale({ a: 2, b: 5, labelA: "flour" }).labelA.es, "flour");
});

test("equivalent rows are n·a : n·b and all equivalent to a : b", () => {
  assert.deepEqual(equivalentRows(2, 3, 5), [
    { n: 1, A: 2, B: 3 },
    { n: 2, A: 4, B: 6 },
    { n: 3, A: 6, B: 9 },
    { n: 4, A: 8, B: 12 },
    { n: 5, A: 10, B: 15 },
  ]);
  for (const [a, b] of [
    [2, 3],
    [1, 4],
    [5, 2],
    [6, 1],
  ]) {
    for (const r of equivalentRows(a, b, 5)) {
      assert.ok(isEquivalent(r, { A: a, B: b }));
      assert.equal(r.A / a, r.n); // scale factor = number of batches
      assert.equal(r.B / b, r.n);
      assert.equal(r.B / r.A, b / a); // same unit rate on every row: one line through (0,0)
    }
  }
});

test("additive rows leave the line after the first row", () => {
  const rows = additiveRows(2, 3, 2, 5);
  assert.deepEqual(rows[1], { A: 4, B: 5 });
  assert.ok(isEquivalent(rows[0], { A: 2, B: 3 }));
  for (const r of rows.slice(1)) assert.ok(!isEquivalent(r, { A: 2, B: 3 }));
  assert.ok(!isEquivalent({ A: 4, B: 5 }, { A: 4, B: 6 }));
});

test("unit rates", () => {
  assert.deepEqual(unitRate(2, 3), { num: 3, den: 2, value: 1.5, text: "1.5" });
  assert.equal(unitRate(1, 4).text, "4");
  assert.equal(unitRate(4, 2).text, "0.5");
  assert.equal(unitRate(3, 2).text, "2/3");
  assert.equal(unitRate(6, 4).text, "2/3");
  assert.equal(unitRate(5, 2).text, "0.4");
  assert.equal(unitRate(4, 6).text, "1.5");
  assert.equal(unitRate(8, 1).text, "0.125");
});

test("prediction choices: exactly one correct, every distractor not equivalent", () => {
  assert.deepEqual(
    scaleChoices(2, 3, 4).map((o) => [o.A, o.B, o.correct, o.kind]),
    [
      [8, 12, true, "scale"],
      [8, 9, false, "additive"],
      [8, 7, false, "addFactor"],
      [8, 3, false, "oneScaled"],
    ],
  );
  // Matches the 3-3 lesson's own predict item: 8 cups of mix -> 12 cups of milk; 9, 7 and 6 are its wrong picks.
  assert.deepEqual(
    scaleChoices(1, 4, 3).map((o) => o.B),
    [12, 6, 7, 4],
  );
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let k = 2; k <= 5; k++) {
        if (a === b) continue;
        const opts = scaleChoices(a, b, k);
        assert.equal(opts.filter((o) => o.correct).length, 1);
        assert.equal(new Set(opts.map((o) => o.B)).size, opts.length);
        assert.ok(opts.length >= 3, `${a}:${b} k=${k}`);
        for (const o of opts) assert.equal(isEquivalent(o, { A: a, B: b }), o.correct, `${a}:${b} k=${k} ${o.kind}`);
      }
});

test("placeCorrect moves the correct choice off a fixed slot", () => {
  const opts = scaleChoices(2, 3, 4);
  const slots = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((s) => placeCorrect(opts, s).findIndex((o) => o.correct)));
  assert.equal(slots.size, 4);
  assert.equal(placeCorrect(opts, 9).length, opts.length);
});

test("the play states the right numbers", () => {
  const play = buildRatioScalePlay(LESSON_3_3);
  assert.equal(play.scenes.length, 6);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "build", "graph", "nonequal", "transfer"],
  );
  assert.match(play.printSummary.en, /2 : 3, 4 : 6, 6 : 9, 8 : 12, 10 : 15/);
  assert.match(play.printSummary.en, /unit rate is 1 : 1\.5 \(cups of mix : cups of milk\)/);
  assert.match(play.printSummary.en, /\(4 : 5\) changes the mix/);
  assert.match(play.title.en, /2 : 3/);
});

test("the play re-exports the model's validator, and the copy states the model's numbers", () => {
  assert.equal(reexported, validateRatioScale);
  const c = ratioCopy(validateRatioScale(LESSON_3_3));
  assert.deepEqual(c.wrong, { A: 4, B: 5 });
  assert.match(c.predict.ok.en, /4 × 2 = 8 and 4 × 3 = 12/);
  assert.match(c.nonequal.ok.en, /cups of milk = 6 \(2 batches\), not 5/);
  assert.match(c.transfer.ok.en, /3 ÷ 1 = 3, and 4 × 3 = 12/);
  assert.match(c.graph.say.en, /1 : 1\.5/);
  assert.equal(c.nonequal.options.filter((o) => o.correct).length, 1);
  assert.notEqual(c.nonequal.options.findIndex((o) => o.correct), 0);
});
