// Pure-function proof for the ratio-compare living scene (lesson 3-5).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildRatioComparePlay, validateRatioCompare as reexported } from "./ratio-compare.js";
import {
  commonTerm,
  lcm,
  matchedChoices,
  placeCorrect,
  qty,
  ratioCompareCopy,
  validateRatioCompare,
  whichChoices,
  winnerOf,
} from "./ratio-compare-model.js";

const LESSON = JSON.parse(
  readFileSync(new URL("../../../lessons/3-5/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const clone = () => JSON.parse(JSON.stringify(LESSON));
const mut = (f) => {
  const c = clone();
  f(c);
  return c;
};

test("validation rejects bad configs", () => {
  const bad = [
    null,
    "3:5",
    {},
    mut((c) => {
      c.first.b = c.second.b; // equal milk needs no scaling
    }),
    mut((c) => {
      c.second = { ...c.second, a: 6, b: 10 }; // equivalent to 3 : 5: nothing to compare
    }),
    mut((c) => {
      c.first.a = 0;
    }),
    mut((c) => {
      c.first.a = 13;
    }),
    mut((c) => {
      c.first.b = 11;
      c.second.b = 12; // lcm 132: far too big
    }),
    mut((c) => {
      c.first.b = 1;
      c.second.b = 12; // 12 batches of the second would not fit
    }),
    mut((c) => {
      c.goal = "bigger";
    }),
    mut((c) => {
      c.verdict = { en: "no placeholder", es: "{name}" };
    }),
    mut((c) => {
      c.second.name = c.first.name;
    }),
    mut((c) => {
      c.tagA = undefined; // not money, so the first amount needs a unit tag
    }),
    mut((c) => {
      c.theB = undefined;
    }),
    mut((c) => {
      c.story = "";
    }),
    mut((c) => {
      c.transfer = undefined;
    }),
    mut((c) => {
      c.transfer.first.b = c.transfer.second.b;
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateRatioCompare(cfg), null, JSON.stringify(cfg));
    assert.equal(buildRatioComparePlay(cfg), null, JSON.stringify(cfg));
  }
  assert.equal(reexported, validateRatioCompare);
});

test("the lesson config builds with the lesson's own numbers", () => {
  const v = validateRatioCompare(LESSON);
  assert.deepEqual([v.first.a, v.first.b, v.second.a, v.second.b], [3, 5, 4, 7]);
  assert.deepEqual([v.transfer.first.a, v.transfer.first.b, v.transfer.second.a, v.transfer.second.b], [6, 2, 12, 3]);
  const play = buildRatioComparePlay(LESSON);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "match", "compare", "transfer"],
  );
  assert.deepEqual(
    play.scenes.map((s) => Boolean(s.gate)),
    [false, true, true, false, false],
  );
});

test("common term arithmetic, recomputed independently", () => {
  assert.equal(lcm(5, 7), 35);
  assert.equal(lcm(2, 3), 6);
  assert.equal(lcm(4, 6), 12);
  const v = validateRatioCompare(LESSON);
  assert.deepEqual(commonTerm(v.first, v.second), { L: 35, fF: 7, fS: 5, mF: 21, mS: 20 });
  assert.deepEqual(commonTerm(v.transfer.first, v.transfer.second), { L: 6, fF: 3, fS: 2, mF: 18, mS: 24 });
  // Brute force: the smallest second amount both mixes reach in whole batches.
  for (const [b1, b2] of [[5, 7], [2, 3], [4, 6], [3, 4], [6, 9]]) {
    let L = 1;
    while (L % b1 || L % b2) L++;
    assert.equal(commonTerm({ a: 1, b: b1 }, { a: 1, b: b2 }).L, L);
  }
  // Scaling both numbers keeps each mix: the matched pair is an equivalent ratio.
  const c = commonTerm(v.first, v.second);
  assert.equal(c.mF * v.first.b, v.first.a * c.L);
  assert.equal(c.mS * v.second.b, v.second.a * c.L);
});

test("the winner follows the goal at the matched amount", () => {
  const v = validateRatioCompare(LESSON);
  assert.equal(winnerOf(v), "first"); // 21 tbsp > 20 tbsp: more cocoa for the same milk
  assert.equal(winnerOf(v.transfer), "first"); // $18 < $24: less to pay for the same pens
  assert.equal(winnerOf({ ...v, goal: "less" }), "second");
  assert.equal(winnerOf({ ...v.transfer, goal: "more" }), "second");
});

test("choice sets: exactly one correct, distractors really wrong, correct not first", () => {
  const v = validateRatioCompare(LESSON);
  for (const s of [v, v.transfer]) {
    const w = whichChoices(s);
    assert.equal(w.filter((o) => o.correct).length, 1);
    assert.equal(w.find((o) => o.correct).key, winnerOf(s));
    assert.deepEqual(w.map((o) => o.key).sort(), ["first", "same", "second"]);
    const m = matchedChoices(s);
    const c = commonTerm(s.first, s.second);
    assert.equal(m.filter((o) => o.correct).length, 1);
    assert.equal(m.find((o) => o.correct).n, c.mS);
    assert.equal(new Set(m.map((o) => o.n)).size, m.length);
    for (const o of m.filter((x) => !x.correct)) assert.notEqual(o.n, c.mS);
  }
  assert.deepEqual(matchedChoices(v.transfer).map((o) => [o.kind, o.n]), [
    ["right", 24],
    ["additive", 15],
    ["otherSide", 18],
    ["unscaled", 12],
  ]);
  assert.notEqual(placeCorrect(whichChoices(v), v.first.a + v.second.b).findIndex((o) => o.correct), 0);
  assert.notEqual(
    placeCorrect(matchedChoices(v.transfer), v.transfer.second.a + v.transfer.first.b).findIndex((o) => o.correct),
    0,
  );
  const slots = new Set([0, 1, 2, 3].map((x) => placeCorrect(matchedChoices(v.transfer), x).findIndex((o) => o.correct)));
  assert.equal(slots.size, 4);
});

test("quantities read in each language", () => {
  const v = validateRatioCompare(LESSON);
  assert.equal(qty(v, 21, "A", "en"), "21 tbsp cocoa");
  assert.equal(qty(v, 21, "A", "es"), "21 cdas. de cacao");
  assert.equal(qty(v, 35, "B", "es"), "35 oz de leche");
  assert.equal(qty(v.transfer, 18, "A", "en"), "$18");
  assert.equal(qty(v.transfer, 6, "B", "en"), "6 plumas".replace("plumas", "pens"));
});

test("the copy states the lesson's own numbers in both languages", () => {
  const c = ratioCompareCopy(validateRatioCompare(LESSON));
  const nb = (s) => s.replaceAll(" ", " ");
  assert.match(nb(c.printSummary.en), /3 : 5 = 21 : 35 and Chef Tran 4 : 7 = 20 : 35/);
  assert.match(nb(c.printSummary.en), /21 tbsp cocoa > 20 tbsp cocoa/);
  assert.match(nb(c.printSummary.es), /21 cdas\. de cacao > 20 cdas\. de cacao/);
  assert.match(nb(c.match.done.en), /Matched at 35 oz milk: Chef Reyes made 7 batches \(× 7 on both numbers\) and Chef Tran made 5/);
  assert.match(nb(c.compare.say.en), /Chef Reyes has the more chocolatey recipe/);
  assert.match(nb(c.compare.rows.en), /3 : 5 = 21 : 35 · 4 : 7 = 20 : 35/);
  assert.match(nb(c.transfer.ok.en), /× 2 on both numbers makes 12 : 3 = 24 : 6\. Now \$18 < \$24: Store A is the better deal/);
  assert.match(nb(c.transfer.ok.es), /Tienda A tiene la mejor oferta/);
  assert.match(nb(c.match.status(4, 3).en), /Chef Reyes: 20 oz milk\. Chef Tran: 21 oz milk/);
  for (const k of ["title", "printSummary", "situate", "ariaLabel"]) assert.ok(c[k].en && c[k].es && c[k].en !== c[k].es, k);
  // Spanish keeps its articles: no bare "iguala leche" or "leche aún no es igual".
  assert.match(c.title.es, /iguala la leche/);
  assert.match(c.match.status(4, 3).es, /La leche aún no es igual/);
});
