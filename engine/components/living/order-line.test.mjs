// order-line.test.mjs — every number the order-line play states (7-4).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { slotFor } from "./numline-model.js";
import { buildOrderLinePlay, validateOrderLine as reexported } from "./order-line.js";
import {
  closestOf,
  compareChoices,
  distanceOrder,
  holds,
  leastOf,
  orderCopy,
  placeCorrect,
  statementChoices,
  validateOrderLine,
  valueOrder,
} from "./order-line-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/7-4/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const clone = (o) => JSON.parse(JSON.stringify(o));
const M = "−";

test("validation accepts the 7-4 config (the five treasures)", () => {
  const v = validateOrderLine(CFG);
  assert.deepEqual(
    v.items.map((i) => i.v),
    [-2, -7, -5, 3, -9],
  );
  assert.deepEqual(v.compare, { a: -7, b: -5 });
  assert.deepEqual(v.transfer, { a: -9, b: -2 });
  assert.deepEqual([v.min, v.max, v.labelEvery], [-10, 5, 2]);
  assert.equal(reexported, validateOrderLine);
});

test("validation refuses what the line cannot show or what teaches nothing", () => {
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
      c.items = items([-9, -7, -5]); // too few
    }),
    mut((c) => {
      c.items = items([-9, -7, -5, -2, 3, 4, 5]); // too many
    }),
    mut((c) => {
      c.items = items([-9, -8, -5, -2, 3]); // −9 and −8 are one apart: labels collide
    }),
    mut((c) => {
      c.items = items([-9, -7, -5, -2, 12]); // off the line
    }),
    mut((c) => {
      c.items = items([-9, -7, -5, -2, 3.5]); // not an integer
    }),
    mut((c) => {
      c.items = items([-2, 1, 3, 5]); // the closest to 0 IS the least: no trap
    }),
    mut((c) => {
      c.compare = { a: -5, b: -7 }; // a must be the lesser
    }),
    mut((c) => {
      c.compare = { a: -2, b: 3 }; // not both negative: no digit trap
    }),
    mut((c) => {
      c.compare = { a: -7, b: -4 }; // −4 is not one of the treasures
    }),
    mut((c) => {
      c.transfer = { a: -7, b: -5 }; // the same pair as the predict scene
    }),
    mut((c) => {
      c.items[0].name = null;
    }),
    mut((c) => {
      c.min = -30; // too wide for a phone
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateOrderLine(cfg), null, JSON.stringify(cfg)?.slice(0, 140));
    assert.equal(buildOrderLinePlay(cfg), null);
  }
});

test("orders: by value is left to right; by distance is a different order", () => {
  const { items } = validateOrderLine(CFG);
  const vs = (order) => order.map((i) => items[i].v);
  assert.deepEqual(vs(valueOrder(items)), [-9, -7, -5, -2, 3]);
  assert.deepEqual(vs(distanceOrder(items)), [-2, 3, -5, -7, -9]);
  // Independent: sort by the number itself and by its absolute value.
  const raw = items.map((i) => i.v);
  assert.deepEqual([...raw].sort((a, b) => a - b), vs(valueOrder(items)));
  assert.deepEqual(
    [...raw].sort((a, b) => Math.abs(a) - Math.abs(b)),
    vs(distanceOrder(items)),
  );
  assert.notDeepEqual(valueOrder(items), distanceOrder(items));
  const all = items.map((_, i) => i);
  assert.equal(items[leastOf(items, all)].v, -9);
  assert.equal(items[closestOf(items, all)].v, -2);
});

test("leastOf: tapping the least that is left yields exactly the value order", () => {
  const { items } = validateOrderLine(CFG);
  let left = items.map((_, i) => i);
  const picked = [];
  while (left.length) {
    const i = leastOf(items, left);
    picked.push(i);
    left = left.filter((x) => x !== i);
  }
  assert.deepEqual(picked, valueOrder(items));
});

test("compareChoices: −5 is the greater of −7 and −5; the digit trap and the distance trap are wrong", () => {
  const c = compareChoices();
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.deepEqual(
    c.map((o) => o.kind),
    ["right", "digits", "farther"],
  );
  const T = orderCopy(validateOrderLine(CFG));
  assert.equal(T.predictLabel("right").en, `${M}5 is greater`);
  assert.equal(T.predictLabel("digits").en, `${M}7 is greater, because 7 is more than 5`);
  assert.equal(T.predictLabel("farther").en, `${M}7 is greater, because it is farther from 0`);
  assert.ok(-5 > -7, "the true statement");
  assert.ok(7 > 5, "the digit trap's premise is true; its conclusion is not");
});

test("statementChoices: exactly one true statement, recomputed by parsing", () => {
  for (const [a, b] of [
    [-9, -2],
    [-7, -5],
    [-6, -1],
  ]) {
    const c = statementChoices(a, b);
    assert.equal(c.length, 3);
    for (const o of c) assert.equal(holds(o.text), !!o.correct, o.text);
    assert.equal(c.filter((o) => holds(o.text)).length, 1);
  }
  assert.deepEqual(
    statementChoices(-9, -2).map((o) => o.text),
    [`${M}9 < ${M}2`, `${M}9 > ${M}2`, `${M}2 < ${M}9`],
  );
});

test("the right answer is never first", () => {
  for (const a of [2, 3, 5, 7, 9]) {
    assert.ok(!placeCorrect(compareChoices(), slotFor(a, 3))[0].correct);
    assert.ok(!placeCorrect(statementChoices(-a - 1, -1), slotFor(a, 3))[0].correct);
  }
});

test("copy states the lesson's numbers, computed from the config", () => {
  const v = validateOrderLine(CFG);
  const T = orderCopy(v);
  assert.equal(T.chain, `${M}9 < ${M}7 < ${M}5 < ${M}2 < 3`);
  assert.equal(T.dChain, `${M}2, 3, ${M}5, ${M}7, ${M}9`);
  assert.match(T.printSummary.en, new RegExp(`${M}7 < ${M}5 because ${M}7 is farther left`));
  assert.match(T.printSummary.en, new RegExp(`closest to 0 \\(${M}2\\) is not the least; the least is ${M}9`));
  assert.match(T.printSummary.en, new RegExp(`${M}9 < ${M}2\\.$`));
  assert.match(T.situateSay.en, new RegExp(`Gold Coin ${M}2, Silver Crown ${M}7, Ruby Ring ${M}5, Lighthouse 3, Sunken Anchor ${M}9`));
  assert.match(T.situateSay.es, /Moneda de oro −2, Corona de plata −7/);
  assert.equal(T.orderQ(0).en, "Tap the least number that is left (1 of 5).");
  assert.equal(T.orderQ(4).es, "Toca el número menor que queda (5 de 5).");
  assert.match(T.trapOpts.no.en, new RegExp(`${M}2 is closest to 0, but ${M}9 is the least`));
  assert.match(T.trapOk.en, new RegExp(`By distance: ${M}2, 3, ${M}5, ${M}7, ${M}9`));
  assert.match(T.transferOk.en, new RegExp(`${M}9 is farther left than ${M}2, so ${M}9 < ${M}2`));
  assert.match(T.predictCue("digits").en, new RegExp(`7 is more than 5, but ${M}7 is 7 steps to the LEFT`));
  assert.doesNotMatch(T.title.en, /\d/);
});

test("orderCue names the nearest-to-0 mistake and gives every other miss a pointer", () => {
  const v = validateOrderLine(CFG);
  const T = orderCopy(v);
  const all = v.items.map((_, i) => i);
  const nearest = closestOf(v.items, all); // −2
  assert.match(T.orderCue(nearest, all).en, /closest to 0, but closest to 0 is not the same as least/);
  const three = v.items.findIndex((i) => i.v === 3);
  assert.match(T.orderCue(three, all).en, /Is there a dot farther to the left/);
  assert.notEqual(T.orderCue(nearest, all).en, T.orderCue(three, all).en);
});

test("every sentence exists in both languages; Spanish has no English left", () => {
  const v = validateOrderLine(CFG);
  const T = orderCopy(v);
  const all = [];
  const samples = {
    predictLabel: [["right"], ["digits"], ["farther"]],
    predictCue: [["digits"], ["farther"]],
    transferCue: [["digits"], ["flipped"]],
    orderCue: [[0, [0, 1, 2, 3, 4]], [3, [0, 1, 2, 3, 4]]],
    orderQ: [[0], [3]],
    orderBtn: [[0], [3]],
    orderStep: [[1], [4]],
  };
  const visit = (x, key = "") => {
    if (typeof x === "function") {
      for (const a of samples[key] || [[0]]) {
        try {
          visit(x(...a));
        } catch {
          /* wrong arity for this sample */
        }
      }
    } else if (x && typeof x === "object" && "en" in x && "es" in x) all.push(x);
    else if (x && typeof x === "object" && key !== "items")
      for (const [k, y] of Object.entries(x)) visit(y, k);
  };
  visit(T);
  assert.ok(all.length > 30);
  for (const p of all) {
    assert.ok(p.en.trim() && p.es.trim(), JSON.stringify(p));
    assert.doesNotMatch(p.es, /\b(the|and|is|of|you|your|from|number|left|least)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted\b|\bvosotros\b/i);
  }
});

test("buildOrderLinePlay: six scenes, gates where the student acts", () => {
  const play = buildOrderLinePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["order", true],
      ["chain", false],
      ["trap", true],
      ["transfer", false],
    ],
  );
  assert.ok(Number(play.viewBox.split(" ")[2]) <= 480);
});
