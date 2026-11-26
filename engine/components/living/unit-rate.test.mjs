// Pure-function proof for the unit-rate living scene (lessons 3-2 and 3-8).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildUnitRatePlay, validateUnitRate as reexported } from "./unit-rate.js";
import {
  amount,
  betterBuy,
  choiceLabel,
  numText,
  placeAway,
  rateChoices,
  unitRateCopy,
  validateUnitRate,
} from "./unit-rate-model.js";

const lesson = (id) =>
  JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8")).launch
    .conceptIntro.livingScene;
const L32 = lesson("3-2");
const L38 = lesson("3-8");
const clone = (c) => JSON.parse(JSON.stringify(c));
const mut = (base, f) => {
  const c = clone(base);
  f(c);
  return c;
};

test("validation rejects bad configs", () => {
  const bad = [
    null,
    "$3 for 5 games",
    {},
    mut(L32, (c) => {
      c.units = 1;
    }),
    mut(L32, (c) => {
      c.units = 5.5;
    }),
    mut(L32, (c) => {
      c.total = 0;
    }),
    mut(L32, (c) => {
      c.total = 3.001; // more than cents
    }),
    mut(L32, (c) => {
      c.total = 3.01; // 301 hundredths do not split into 5 whole cents
    }),
    mut(L32, (c) => {
      c.units = 1001;
    }),
    mut(L32, (c) => {
      c.unitOne = "";
    }),
    mut(L32, (c) => {
      c.unitMany = "a label far too long";
    }),
    mut(L32, (c) => {
      c.story = undefined;
    }),
    mut(L32, (c) => {
      c.transfer = undefined;
    }),
    mut(L32, (c) => {
      c.transfer = { ...c.transfer, total: 3, units: 5 }; // same deal as the main question
    }),
    mut(L32, (c) => {
      c.transfer.totalWord = undefined; // not money, so it needs a word
    }),
    mut(L32, (c) => {
      c.stops = [0, 2];
    }),
    mut(L32, (c) => {
      c.compare.units = 1;
    }),
    mut(L32, (c) => {
      c.compare = { ...c.compare, total: 3, units: 5 }; // identical to the first deal
    }),
    mut(L32, (c) => {
      c.compare = { ...c.compare, total: 6, units: 10 }; // same price for 1: nothing to compare
    }),
    mut(L32, (c) => {
      c.money = false; // a comparison is a price comparison
      c.totalWord = { en: "dollars", es: "dólares" };
    }),
    mut(L38, (c) => {
      c.stops = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // more ticks than the stage has room for
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateUnitRate(cfg), null, JSON.stringify(cfg));
    assert.equal(buildUnitRatePlay(cfg), null, JSON.stringify(cfg));
  }
  assert.equal(reexported, validateUnitRate);
});

test("the lesson configs are accepted with the lessons' own numbers", () => {
  const a = validateUnitRate(L32);
  assert.deepEqual([a.total, a.units, a.rateH, a.ticks], [3, 5, 60, [0, 1, 2, 3, 4, 5]]);
  assert.deepEqual([a.compare.total, a.compare.units, a.compare.rateH], [4, 8, 50]);
  assert.deepEqual([a.transfer.total, a.transfer.units, a.transfer.rateH], [120, 3, 4000]);
  const b = validateUnitRate(L38);
  assert.deepEqual([b.total, b.units, b.rateH, b.ticks], [60, 500, 12, [0, 1, 500, 1000]]);
  assert.deepEqual([b.compare.total, b.compare.units, b.compare.rateH], [38.5, 350, 11]);
  assert.deepEqual([b.transfer.total, b.transfer.units], [24, 3]);
  for (const cfg of [L32, L38]) {
    const play = buildUnitRatePlay(cfg);
    assert.deepEqual(
      play.scenes.map((s) => s.id),
      ["situate", "predict", "use", "connect", "compare", "transfer"],
    );
    assert.deepEqual(
      play.scenes.map((s) => Boolean(s.gate)),
      [false, true, true, false, true, false],
    );
  }
  // The comparison is optional: without it the scene is simply absent.
  const noCmp = buildUnitRatePlay(mut(L32, (c) => {
    c.compare = undefined;
  }));
  assert.equal(noCmp.scenes.some((s) => s.id === "compare"), false);
});

test("hundredths arithmetic: no floating-point residue", () => {
  assert.equal(numText(60, true), "0.60");
  assert.equal(numText(300, true), "3");
  assert.equal(numText(12, true), "0.12");
  assert.equal(numText(12000, true), "120");
  assert.equal(numText(3850, true), "38.50");
  assert.equal(numText(4000, false), "40");
  assert.equal(numText(250, false), "2.5");
  assert.equal(numText(3_000_000, true), "30,000");
  for (const [total, units] of [[3, 5], [60, 500], [38.5, 350], [120, 3], [4, 8]]) {
    const v = validateUnitRate({ ...L32, total, units, compare: undefined, transfer: total === 120 ? L38.transfer : L32.transfer });
    assert.ok(v, `${total}/${units}`);
    assert.equal(v.rateH * units, Math.round(total * 100));
  }
  assert.equal(amount(validateUnitRate(L32), 60, "en"), "$0.60");
  assert.equal(amount(validateUnitRate(L32).transfer, 4000, "es"), "40 millas");
});

test("rate choices: exactly one correct, every distractor a real misconception", () => {
  for (const cfg of [L32, L38]) {
    const v = validateUnitRate(cfg);
    for (const d of [v, v.transfer]) {
      const opts = rateChoices(d);
      assert.equal(opts.filter((o) => o.correct).length, 1);
      assert.equal(opts.length, 4);
      const right = opts.find((o) => o.correct);
      assert.ok(Math.abs(right.value - d.total / d.units) < 1e-9, "correct = total ÷ units");
      const wrong = Object.fromEntries(opts.filter((o) => !o.correct).map((o) => [o.kind, o.value]));
      assert.ok(Math.abs(wrong.inverted - d.units / d.total) < 1e-9);
      assert.equal(wrong.whole, d.total);
      assert.equal(wrong.product, d.total * d.units);
      for (const o of opts.filter((x) => !x.correct)) assert.notEqual(o.value, right.value);
      assert.equal(new Set(opts.map(choiceLabel)).size, opts.length);
    }
  }
  assert.deepEqual(rateChoices(validateUnitRate(L32)).map(choiceLabel), ["$0.60", "$1.67", "$3", "$15"]);
  assert.deepEqual(rateChoices(validateUnitRate(L38)).map(choiceLabel), ["$0.12", "$8.33", "$60", "$30,000"]);
  // total === units: the inverted division equals the right answer, so it must be dropped.
  const eq = validateUnitRate({ ...L32, total: 5, units: 5, compare: undefined, transfer: L32.transfer });
  assert.equal(rateChoices(eq).filter((o) => o.kind === "inverted").length, 0);
});

test("placeAway never puts the correct choice first, for any seed", () => {
  for (const cfg of [L32, L38]) {
    const v = validateUnitRate(cfg);
    for (const d of [v, v.transfer])
      assert.notEqual(placeAway(rateChoices(d), d.units + d.totalH).findIndex((o) => o.correct), 0);
  }
  const slots = new Set();
  for (let seed = 0; seed < 12; seed++) {
    const i = placeAway(rateChoices(validateUnitRate(L32)), seed).findIndex((o) => o.correct);
    assert.ok(i >= 1 && i <= 3);
    slots.add(i);
  }
  assert.equal(slots.size, 3);
});

test("better buy: the lower price for ONE wins, and the tempting mistake is named", () => {
  const a = { totalH: 300, units: 5, rateH: 60 };
  const b = { totalH: 400, units: 8, rateH: 50 };
  assert.deepEqual(betterBuy(a, b), { win: "B", lose: "A", tempt: "lowerTotal" });
  const f = { totalH: 6000, units: 500, rateH: 12 };
  const g = { totalH: 3850, units: 350, rateH: 11 };
  assert.deepEqual(betterBuy(f, g), { win: "B", lose: "A", tempt: "moreItems" });
  for (const cfg of [L32, L38]) {
    const c = unitRateCopy(validateUnitRate(cfg)).compareCopy;
    assert.equal(c.options.filter((o) => o.correct).length, 1);
    assert.equal(c.win, "B");
    assert.ok(c.options.find((o) => o.correct).label.en);
    for (const o of c.options.filter((x) => !x.correct)) assert.ok(o.cue.en && o.cue.es);
  }
});

test("the copy states the lessons' own numbers in both languages", () => {
  const c32 = unitRateCopy(validateUnitRate(L32));
  assert.match(c32.connect.say.en, /\$3 ÷ 5 = \$0\.60/);
  assert.match(c32.connect.say.en, /unit price/);
  assert.match(c32.connect.say.es, /\$3 ÷ 5 = \$0\.60/);
  assert.match(c32.connect.say.es, /precio unitario/);
  assert.match(c32.predict.ok.en, /\$0\.60 per game/);
  assert.match(c32.compareCopy.ok.en, /\$0\.50 per game is less than \$0\.60 per game/);
  assert.match(c32.transferCopy.ok.en, /120 ÷ 3 = 40\. The rate is 40 miles per hour/);
  assert.match(c32.transferCopy.ok.es, /40 millas por hora/);
  assert.equal(c32.compareCopy.expr, "$0.50 &lt; $0.60");
  assert.match(c32.use.line(3).en, /3 games: 3 × \$0\.60 = \$1\.80/);
  const c38 = unitRateCopy(validateUnitRate(L38));
  assert.match(c38.connect.say.en, /\$60 ÷ 500 = \$0\.12/);
  assert.match(c38.use.line(1000).en, /1,000 tokens: 1,000 × \$0\.12 = \$120/);
  assert.match(c38.compareCopy.ok.en, /\$0\.11 per token is less than \$0\.12 per token/);
  assert.match(c38.printSummary.en, /\$38\.50 per?|350 tokens for \$38\.50 is \$0\.11 per token/);
  assert.match(c38.transferCopy.ok.en, /24 ÷ 3 = 8\. The rate is 8 tokens per minute/);
  for (const c of [c32, c38]) for (const k of ["title", "situate", "printSummary", "dealText"]) assert.ok(c[k].en && c[k].es, k);
});
