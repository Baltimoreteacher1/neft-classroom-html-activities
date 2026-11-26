// percent-per-hundred.test.mjs — the living-scene "a out of b becomes p out of
// 100" play: config validation and every number it puts on the stage, computed
// independently.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildPercentPerHundredPlay, validatePercentPerHundred } from "./percent-per-hundred.js";
import {
  fdChoices,
  GROUP_SIZES,
  overChoices,
  percentCopy,
  scaleChoices,
  shadedInGroups,
  sortedSlot,
} from "./percent-per-hundred-model.js";

const lesson = () =>
  JSON.parse(readFileSync(new URL("../../../lessons/4-1/config.json", import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;

test("the 4-1 config says the lesson's own numbers", () => {
  const v = validatePercentPerHundred(lesson());
  assert.ok(v);
  assert.deepEqual([v.a, v.b, v.k, v.p], [4, 10, 10, 40]);
  assert.deepEqual([v.over.whole, v.over.amount, v.over.pct], [4, 6, 150]);
  assert.deepEqual([v.transfer.a, v.transfer.b, v.transfer.p], [23, 100, 23]);
});

test("scaleChoices: ×k is the only exact one; the others are real slips", () => {
  const o = scaleChoices(4, 10);
  assert.deepEqual(
    o.map((x) => [x.kind, x.n]),
    [
      ["correct", 40],
      ["add", 94],
      ["same", 4],
      ["factor", 10],
    ],
  );
  for (const b of GROUP_SIZES)
    for (let a = 1; a < b; a++) {
      const c = scaleChoices(a, b);
      assert.ok(c, `${a}/${b}`);
      assert.equal(c.filter((x) => x.correct).length, 1);
      assert.equal(c.find((x) => x.correct).n, (a * 100) / b);
      assert.equal(new Set(c.map((x) => x.n)).size, c.length);
    }
});

test("overChoices: more than the whole is the correct percent", () => {
  assert.deepEqual(
    overChoices(4, 6).map((x) => [x.kind, x.n]),
    [
      ["correct", 150],
      ["extra", 50],
      ["whole", 100],
      ["amount", 6],
    ],
  );
  assert.equal(overChoices(4, 6).find((x) => x.correct).n, (6 / 4) * 100);
});

test("fdChoices: the shaded count is the percent; slips are the unshaded part and misplaced decimals", () => {
  assert.deepEqual(
    fdChoices(23).map((x) => [x.kind, x.h / 100]),
    [
      ["correct", 23],
      ["complement", 77],
      ["decimal", 0.23],
      ["tenth", 2.3],
    ],
  );
});

test("sorted slots are a permutation of the 100 squares with the shaded ones first", () => {
  for (const [a, b] of [
    [4, 10],
    [1, 2],
    [3, 5],
    [7, 20],
    [9, 50],
  ]) {
    const p = (a * 100) / b;
    const slots = Array.from({ length: 100 }, (_, i) => sortedSlot(i, a, b, p));
    assert.equal(new Set(slots).size, 100);
    for (let i = 0; i < 100; i++) {
      assert.ok(slots[i] >= 0 && slots[i] < 100);
      assert.equal(shadedInGroups(i, a, b), slots[i] < p, `${a}/${b} square ${i}`);
    }
    assert.equal(Array.from({ length: 100 }, (_, i) => i).filter((i) => shadedInGroups(i, a, b)).length, p);
  }
});

test("validatePercentPerHundred refuses numbers it cannot draw", () => {
  const base = lesson();
  const no = (patch) => assert.equal(validatePercentPerHundred({ ...base, ...patch }), null, JSON.stringify(patch).slice(0, 80));
  no({ b: 4 }); // 4 groups do not tile the grid in rectangles
  no({ b: 100 });
  no({ a: 0 });
  no({ a: 10 });
  no({ a: 4.5 });
  no({ did: undefined });
  no({ over: { ...base.over, amount: 3 } }); // not more than the whole
  no({ over: { ...base.over, amount: 9 } }); // past 200%
  no({ over: { ...base.over, whole: 3, amount: 4 } }); // 133.33…%
  no({ over: { ...base.over, story: { en: "Heavier.", es: "Más pesado." } } }); // story must state its numbers
  no({ transfer: { a: 4, b: 10, noun: base.noun, did: base.did } }); // same percent as the main problem
  no({ transfer: { a: 1, b: 3 } });
  assert.equal(buildPercentPerHundredPlay(null), null);
  assert.ok(validatePercentPerHundred(base));
});

test("the 4-1 play has six scenes, gated where the student predicts or acts", () => {
  const play = buildPercentPerHundredPlay(lesson());
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["build", true],
      ["percent", false],
      ["over", true],
      ["transfer", false],
    ],
  );
  assert.equal(play.viewBox, "0 0 480 300");
});

test("copy states the lesson's numbers in both languages", () => {
  const c = percentCopy(validatePercentPerHundred(lesson()));
  assert.match(c.printSummary.en, /4 × 10 = 40 and 10 × 10 = 100/);
  assert.match(c.printSummary.en, /6 is 150% of 4/);
  assert.match(c.printSummary.es, /4 × 10 = 40 y 10 × 10 = 100/);
  assert.match(c.printSummary.es, /6 es 150% de 4/);
  assert.match(c.predict.cue("add", 94).en, /adding 90 to both numbers/);
  assert.match(c.over.ok.en, /one whole \(100%\) plus 50% more/);
  for (const text of [c.title.es, c.ariaLabel.es, c.printSummary.es, c.over.ok.es, c.transfer.ok.es])
    assert.doesNotMatch(text, /\busted\b|\bel entero\b|\d %/);
  assert.match(c.transfer.ok.en, /^Right: 23 out of 100 = 23% = 0\.23\.$/);
});
