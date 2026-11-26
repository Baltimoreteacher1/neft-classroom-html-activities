// absolute-distance.test.mjs — every number the absolute-distance play states (7-3).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildAbsoluteDistancePlay,
  validateAbsoluteDistance as reexported,
} from "./absolute-distance.js";
import {
  ab,
  absoluteCopy,
  decimalChoices,
  foundPair,
  placeCorrect,
  predictChoices,
  validateAbsoluteDistance,
} from "./absolute-distance-model.js";
import { slotFor } from "./numline-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/7-3/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const clone = (o) => JSON.parse(JSON.stringify(o));
const M = "−";
const WJ = "⁠";

test("validation accepts the 7-3 config and finds the trap in the treasures", () => {
  const v = validateAbsoluteDistance(CFG);
  assert.equal(v.value, -6);
  assert.equal(v.decimal, -2.5);
  assert.deepEqual(v.fraction, { value: 0.75, den: 4 });
  assert.equal(v.prefix, "$");
  assert.equal(v.labelEvery, 2);
  // Independent recount of the treasures: sizes, farthest, greatest.
  const vals = v.transfer.items.map((i) => i.v);
  assert.deepEqual(vals, [-4, 6, -7, 3, -1]);
  assert.equal(v.transfer.far.v, -7);
  assert.equal(v.transfer.greatest.v, 6);
  assert.notEqual(v.transfer.far, v.transfer.greatest);
  assert.equal(reexported, validateAbsoluteDistance);
});

test("validation refuses what the line cannot show or what has no trap", () => {
  const mut = (f) => {
    const c = clone(CFG);
    f(c);
    return c;
  };
  const items = (list) => list.map((v, i) => ({ v, name: `T${i}` }));
  const bad = [
    null,
    {},
    mut((c) => {
      c.value = 1; // too close to 0 to show a distance
    }),
    mut((c) => {
      c.value = 9; // off the line
    }),
    mut((c) => {
      c.min = -7; // not symmetric
    }),
    mut((c) => {
      c.decimal.value = -2; // not a decimal
    }),
    mut((c) => {
      c.decimal.value = -2.25; // not a half
    }),
    mut((c) => {
      c.fraction.value = 1.5; // a fraction must be below 1
    }),
    mut((c) => {
      c.fraction.den = 1;
    }),
    mut((c) => {
      c.transfer.items = items([-4, 6, -7]); // too few
    }),
    mut((c) => {
      c.transfer.items = items([-4, 4, -7, 3]); // two tie at distance 4
    }),
    mut((c) => {
      c.transfer.items = items([-4, 8, -7, 3]); // the greatest number IS the farthest: no trap... 8 > 7
    }),
    mut((c) => {
      c.transfer.items = items([-4, -3, -7, 3]); // labels 1 apart would collide
    }),
    mut((c) => {
      c.transfer.items = items([-4, 0, -7, 3]); // 0 is not a treasure
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateAbsoluteDistance(cfg), null, JSON.stringify(cfg)?.slice(0, 140));
    assert.equal(buildAbsoluteDistancePlay(cfg), null);
  }
});

test("predictChoices(−6): the distance is 6; a distance is never negative; 12 is the span", () => {
  const c = predictChoices(-6);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value, !!o.correct]),
    [
      ["distance", 6, true],
      ["negative", -6, false],
      ["span", 12, false],
    ],
  );
  // Independent: the distance from −6 to 0 is 0 − (−6); from −6 to 6 it is 12.
  assert.equal(0 - -6, 6);
  assert.equal(6 - -6, 12);
});

test("decimalChoices(−2.5): |−2.5| = 2.5; the mistakes are the sign and the part after the point", () => {
  const c = decimalChoices(-2.5);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value, !!o.correct]),
    [
      ["distance", 2.5, true],
      ["signed", -2.5, false],
      ["fraction", 0.5, false],
    ],
  );
  assert.equal(new Set(c.map((o) => o.value)).size, 3);
});

test("foundPair: needs a number AND its opposite, both visited, neither 0", () => {
  assert.equal(foundPair([-6]), false);
  assert.equal(foundPair([-6, -5, 3]), false);
  assert.equal(foundPair([-6, 0, 6]), true);
  assert.equal(foundPair([0]), false);
  assert.equal(foundPair([2, -2]), true);
});

test("right answer is never first (predict, decimal) and the treasure answer is not first either", () => {
  for (const x of [2, 3, 4, 5, 6, 7, 8]) {
    assert.ok(!placeCorrect(predictChoices(x), slotFor(x, 3))[0].correct, `x = ${x}`);
  }
  for (const d of [-1.5, -2.5, 3.5]) {
    assert.ok(!placeCorrect(decimalChoices(d), slotFor(Math.abs(d) * 2, 3))[0].correct, `d = ${d}`);
  }
  const v = validateAbsoluteDistance(CFG);
  assert.notEqual(v.transfer.items[0], v.transfer.far, "the authored list does not lead with the answer");
});

test("copy states the lesson's numbers, computed from the config", () => {
  const v = validateAbsoluteDistance(CFG);
  const T = absoluteCopy(v);
  assert.equal(ab(M + "6"), `|${WJ}${M}6${WJ}|`);
  assert.equal(ab(6), `|${WJ}6${WJ}|`);
  assert.match(T.printSummary.en, new RegExp(`\\|${WJ}${M}6${WJ}\\| = 6 and \\|${WJ}6${WJ}\\| = 6`));
  assert.match(T.printSummary.en, new RegExp(`\\|${WJ}${M}2.5${WJ}\\| = 2.5`));
  assert.match(T.printSummary.en, new RegExp(`\\|${WJ}3/4${WJ}\\| = 3/4`));
  assert.match(T.printSummary.en, new RegExp(`the farthest from 0 is ${M}7`));
  assert.equal(T.symbolsExpr, `|${WJ}${M}6${WJ}| = 6   ·   |${WJ}6${WJ}| = 6`);
  assert.equal(T.owe.en, `${M}6: owe $6`);
  assert.equal(T.have.es, "6: tienes $6");
  assert.equal(T.decimalExpr(true), `|${WJ}${M}2.5${WJ}| = 2.5   ·   |${WJ}3/4${WJ}| = 3/4`);
  assert.ok(
    T.transferOk.en
      .replaceAll(WJ, "")
      .includes(`|${M}4| = 4 · |6| = 6 · |${M}7| = 7 · |3| = 3 · |${M}1| = 1`),
  );
  assert.match(T.transferCue(v.transfer.greatest).en, /^6 is the greatest number here/);
  assert.match(T.transferCue(v.transfer.items[0]).en, /Buried Chest: 4 units/);
  assert.equal(T.exploreRow(-3).en, `The dot is at ${M}3: 3 units from 0, so |${WJ}${M}3${WJ}| = 3.`);
  assert.match(T.exploreOk(5).en, new RegExp(`5 and ${M}5 are both 5 units from 0`));
  assert.equal(T.predictLabel({ value: -6 }).en, `${M}6 units`);
  assert.doesNotMatch(T.title.en, /\d/);
});

test("every sentence exists in both languages; Spanish has no English left", () => {
  const v = validateAbsoluteDistance(CFG);
  const T = absoluteCopy(v);
  const all = [];
  const samples = {
    predictCue: [["negative"], ["span"]],
    decimalCue: [["signed"], ["fraction"]],
    transferCue: v.transfer.items.map((i) => [i]),
    transferLabel: v.transfer.items.map((i) => [i]),
    predictLabel: [[{ value: 6 }]],
  };
  const visit = (x, key = "") => {
    if (typeof x === "function") {
      for (const a of samples[key] || [[1], [-3], [5], [2]]) {
        try {
          visit(x(...a));
        } catch {
          /* wrong arity for this sample */
        }
      }
    } else if (x && typeof x === "object" && "en" in x && "es" in x) all.push(x);
    else if (x && typeof x === "object") for (const [k, y] of Object.entries(x)) visit(y, k);
  };
  visit(T);
  assert.ok(all.length > 30);
  for (const p of all) {
    assert.ok(p.en.trim() && p.es.trim(), JSON.stringify(p));
    assert.doesNotMatch(p.es, /\b(the|and|is|of|you|your|from|distance|spot)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted\b|\bvosotros\b/i);
  }
});

test("buildAbsoluteDistancePlay: six scenes, gates where the student acts", () => {
  const play = buildAbsoluteDistancePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["explore", true],
      ["symbols", false],
      ["decimal", true],
      ["transfer", false],
    ],
  );
  assert.ok(Number(play.viewBox.split(" ")[2]) <= 480);
});
