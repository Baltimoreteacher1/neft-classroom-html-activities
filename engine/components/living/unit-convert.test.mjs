// unit-convert.test.mjs — the living-scene "same length, two units" play: config
// validation and every number it puts on the stage, computed independently.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildUnitConvertPlay, validateUnitConvert } from "./unit-convert.js";
import {
  convertCopy,
  convH,
  fmt,
  forwardChoices,
  placeNotFirst,
  reverseChoices,
  un,
} from "./unit-convert-model.js";

const lesson = (id) =>
  JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;
const U = (one, many) => ({ one: { en: one, es: one }, many: { en: many, es: many } });
const FT = U("foot", "feet");
const IN = U("inch", "inches");
const BASE = {
  from: FT,
  to: IN,
  factor: 12,
  amount: 4,
  step: 1,
  transfer: { from: U("quart", "quarts"), to: U("cup", "cups"), factor: 4, amount: 3 },
};

// Independent reference: the converted amount in exact hundredths via strings.
const refProduct = (amount, factor) => {
  const [i, f = ""] = String(factor).split(".");
  const cents = Number(i) * 100 + Number(f.padEnd(2, "0"));
  return amount * cents;
};

test("fmt writes exact hundredths with thousands commas", () => {
  assert.equal(fmt(400000), "4,000");
  assert.equal(fmt(60), "0.6");
  assert.equal(fmt(4800), "48");
  assert.equal(fmt(1100), "11");
  assert.equal(fmt(145), "1.45");
  assert.equal(fmt(-1), "");
});

test("un picks singular for exactly 1 or less, plural for more", () => {
  assert.equal(un(FT, 100).en, "foot");
  assert.equal(un(FT, 60).en, "foot");
  assert.equal(un(FT, 400).en, "feet");
});

test("the lesson configs convert to the lesson's own numbers", () => {
  const cases = [
    ["3-6", 4, 12, "48", "4 feet", "48 inches"],
    ["3-7", 100, 0.6, "60", "100 kilometers", "60 miles"],
    ["3-10", 5, 12, "60", "5 feet", "60 inches"],
  ];
  for (const [id, amount, factor, m, top, bot] of cases) {
    const cfg = lesson(id);
    const v = validateUnitConvert(cfg);
    assert.ok(v, id);
    assert.equal(v.amount, amount);
    assert.equal(v.f100, Math.round(factor * 100));
    assert.equal(v.mH, refProduct(amount, factor), id);
    const c = convertCopy(v);
    assert.equal(c.m.M, m);
    assert.equal(c.m.barTop.en, top);
    assert.ok(c.m.barBot.en.includes(bot), c.m.barBot.en);
  }
});

test("transfer numbers come from the lesson's own practice problems", () => {
  const t3 = validateUnitConvert(lesson("3-6")).transfer;
  assert.equal(t3.mH, refProduct(3, 4)); // 3 quarts = 12 cups
  const t7 = validateUnitConvert(lesson("3-7")).transfer;
  assert.equal(fmt(t7.mH), "11"); // 5 kg ≈ 11 lb
  const t10 = validateUnitConvert(lesson("3-10")).transfer;
  assert.equal(fmt(t10.mH), "300"); // 3 m = 300 cm
});

test("approximate factors are marked ≈, exact ones =", () => {
  const c7 = convertCopy(validateUnitConvert(lesson("3-7")));
  assert.equal(c7.m.eq, "≈");
  assert.match(c7.m.factorLine.en, /1 kilometer ≈ 0\.6 mile/);
  assert.match(c7.m.sentence.en, /≈/);
  assert.ok(c7.m.roundNote);
  const c6 = convertCopy(validateUnitConvert(lesson("3-6")));
  assert.equal(c6.m.eq, "=");
  assert.equal(c6.m.roundNote, null);
  assert.match(c6.m.factorLine.en, /1 foot = 12 inches/);
});

test("forwardChoices: one correct, the rest really wrong, all different", () => {
  for (const id of ["3-6", "3-7", "3-10"]) {
    const v = validateUnitConvert(lesson(id));
    for (const s of [v, v.transfer]) {
      const o = forwardChoices(s);
      assert.ok(o.length >= 3 && o.length <= 4);
      assert.equal(o.filter((x) => x.correct).length, 1);
      assert.equal(o.find((x) => x.correct).h, refProduct(s.amount, s.f100 / 100));
      assert.equal(new Set(o.map((x) => x.h)).size, o.length);
      for (const x of o.filter((y) => !y.correct)) assert.notEqual(x.h, s.mH);
    }
  }
  const o = forwardChoices(validateUnitConvert(lesson("3-6")));
  assert.deepEqual(
    o.map((x) => [x.kind, fmt(x.h)]),
    [
      ["correct", "48"],
      ["same", "4"],
      ["unit", "12"],
      ["add", "16"],
    ],
  );
  // dividing is offered only when it is exact: 3 / 4 = 0.75
  const t = forwardChoices(validateUnitConvert(lesson("3-6")).transfer);
  assert.equal(t[1].kind, "reverse");
  assert.equal(fmt(t[1].h), "0.75");
});

test("reverseChoices: dividing is the only correct way back", () => {
  for (const id of ["3-6", "3-7", "3-10"]) {
    const s = validateUnitConvert(lesson(id));
    const o = reverseChoices(s);
    assert.equal(o.filter((x) => x.correct).length, 1);
    assert.equal(o.find((x) => x.correct).h, s.amount * 100);
    assert.equal(s.mH * 100, s.amount * 100 * s.f100); // m ÷ f = amount
    assert.equal(new Set(o.map((x) => x.h)).size, o.length);
  }
  const o = reverseChoices(validateUnitConvert(lesson("3-7")));
  assert.deepEqual(
    o.map((x) => [x.kind, fmt(x.h)]),
    [
      ["correct", "100"],
      ["times", "36"],
      ["same", "60"],
      ["unit", "0.6"],
    ],
  );
});

test("convH steps match multiplication at every stop", () => {
  const s = validateUnitConvert(lesson("3-7"));
  for (let k = 1; k <= s.N; k++) assert.equal(convH(s, k), refProduct(k * s.step, 0.6));
  assert.equal(s.N, 10);
});

test("validateUnitConvert refuses numbers it cannot draw", () => {
  const bad = (patch) => ({ ...BASE, ...patch });
  for (const cfg of [
    null,
    {},
    bad({ factor: 1 }),
    bad({ factor: 0 }),
    bad({ factor: -3 }),
    bad({ factor: 0.123 }),
    bad({ amount: 1 }),
    bad({ amount: 4.5 }),
    bad({ amount: 55, step: 1 }), // 55 intervals
    bad({ amount: 7, step: 2 }),
    bad({ from: { one: { en: "x" } } }),
    bad({ transfer: undefined }),
    bad({ transfer: { ...BASE.transfer, factor: 1 } }),
    bad({ transfer: { ...BASE, amount: 4 } }), // same problem as the main one
  ])
    assert.equal(validateUnitConvert(cfg), null, JSON.stringify(cfg)?.slice(0, 60));
  assert.equal(buildUnitConvertPlay({ ...BASE, amount: 1 }), null);
  assert.ok(validateUnitConvert(BASE));
});

test("placeNotFirst never leads with the correct choice", () => {
  const o = forwardChoices(validateUnitConvert(lesson("3-6")));
  for (let seed = 0; seed < 12; seed++) {
    const placed = placeNotFirst(o, seed);
    assert.equal(placed.length, o.length);
    assert.notEqual(placed.findIndex((x) => x.correct), 0, `seed ${seed}`);
  }
});

test("each authored lesson builds a six-scene play with gates where the student acts", () => {
  for (const id of ["3-6", "3-7", "3-10"]) {
    const play = buildUnitConvertPlay(lesson(id));
    assert.ok(play, id);
    assert.deepEqual(
      play.scenes.map((s) => [s.id, !!s.gate]),
      [
        ["situate", false],
        ["predict", true],
        ["slide", true],
        ["connect", false],
        ["reverse", true],
        ["transfer", false],
      ],
    );
    assert.equal(play.viewBox, "0 0 480 310");
    for (const lang of ["en", "es"]) {
      const text = [play.title, play.ariaLabel, play.printSummary].map((p) => p[lang]).join(" ");
      assert.doesNotMatch(text, /\busted\b|\bel entero\b|\d %/);
    }
    assert.match(play.printSummary.es, /el mismo|la misma|otro número/i);
  }
});

test("Spanish copy has no English left and agrees with the units", () => {
  const es = (id) => {
    const c = convertCopy(validateUnitConvert(lesson(id)));
    return JSON.stringify([c.m, c.t]);
  };
  for (const id of ["3-6", "3-7", "3-10"]) {
    const s = es(id);
    assert.doesNotMatch(s, /"es":"[^"]*\b(the|of|your|bar is|Yes|Right)\b/);
    assert.doesNotMatch(s, /cuántos|cuántas/); // gendered: reworded as "cuánto"
  }
});
