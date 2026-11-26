// property-shift.test.mjs — every number the property-shift play shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildPropertyShiftPlay, validatePropertyShift as reexported } from "./property-shift.js";
import {
  arrangementKey,
  exprFor,
  identityChoices,
  isSwapped,
  placeCorrect,
  propertyCopy,
  subtotal,
  swapSide,
  validatePropertyShift,
} from "./property-shift-model.js";

// 6-8: 3 guitarists, 5 drummers, 2 keyboard players; 9 − 6; 8 ÷ 2; 47 + 0; 5 + 13; (6 × 3) × 2.
const CFG = {
  groups: [
    { n: 3, label: { en: "guitarists", es: "guitarristas" }, short: { en: "guitar", es: "guitarra" } },
    { n: 5, label: { en: "drummers", es: "bateristas" }, short: { en: "drums", es: "batería" } },
    { n: 2, label: { en: "keyboard players", es: "tecladistas" }, short: { en: "keys", es: "teclado" } },
  ],
  noun: { en: "musicians", es: "músicos" },
  nounOne: { en: "musician", es: "músico" },
  weDo: { a: 6, b: 9 },
  sub: { a: 9, b: 6 },
  divide: { a: 8, b: 2 },
  identity: 47,
  commute: { a: 5, b: 13 },
  regroup: { a: 6, b: 3, c: 2 },
};

const walk = (o, out = []) => {
  if (o && typeof o === "object" && typeof o.en === "string" && "es" in o) out.push(o);
  else if (o && typeof o === "object" && typeof o !== "function")
    for (const x of Object.values(o)) walk(x, out);
  return out;
};

test("the total never moves: every order and grouping of 3, 5, 2 is 10", () => {
  const v = validatePropertyShift(CFG);
  assert.equal(v.total, 10);
  const perms = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  for (const order of perms)
    for (const grouping of ["none", "first", "last"]) {
      // Read the very sum the student sees and add it up independently.
      const value = new Function(`return ${exprFor(v.counts, order, grouping)}`)();
      assert.equal(value, 10, `${order}/${grouping}`);
    }
});

test("swapSide and exprFor: the sums the student reads", () => {
  assert.deepEqual(swapSide([0, 1, 2], "left"), [1, 0, 2]);
  assert.deepEqual(swapSide([0, 1, 2], "right"), [0, 2, 1]);
  assert.deepEqual(swapSide(swapSide([0, 1, 2], "left"), "left"), [0, 1, 2]);
  const counts = [3, 5, 2];
  assert.equal(exprFor(counts, [0, 1, 2], "none"), "3 + 5 + 2");
  assert.equal(exprFor(counts, [1, 0, 2], "none"), "5 + 3 + 2");
  assert.equal(exprFor(counts, [0, 1, 2], "first"), "(3 + 5) + 2");
  assert.equal(exprFor(counts, [0, 1, 2], "last"), "3 + (5 + 2)");
  assert.equal(subtotal(counts, [0, 1, 2], "first"), 8);
  assert.equal(subtotal(counts, [0, 1, 2], "last"), 7);
  assert.equal(subtotal(counts, [0, 1, 2], "none"), null);
  assert.equal(subtotal(counts, [1, 0, 2], "last"), 3 + 2);
  assert.ok(isSwapped([1, 0, 2]));
  assert.ok(!isSwapped([0, 1, 2]));
  assert.notEqual(arrangementKey([0, 1, 2], "first"), arrangementKey([0, 1, 2], "last"));
});

test("identityChoices: one identity; the others are true but are other properties", () => {
  const v = validatePropertyShift(CFG);
  const c = identityChoices(v);
  assert.deepEqual(
    c.map((o) => [o.kind, o.text, o.correct]),
    [
      ["identity", "47 + 0 = 47", true],
      ["commute", "5 + 13 = 13 + 5", false],
      ["regroup", "(6 × 3) × 2 = 6 × (3 × 2)", false],
      ["zero", "47 × 0 = 0", false],
    ],
  );
  assert.equal(47 + 0, 47);
  assert.equal(5 + 13, 13 + 5);
  assert.equal((6 * 3) * 2, 6 * (3 * 2)); // 36
  assert.equal(47 * 0, 0);
  assert.equal(c.filter((o) => o.correct).length, 1);
});

test("subtraction and division do not commute — the facts the limits scene states", () => {
  const v = validatePropertyShift(CFG);
  assert.equal(9 - 6, 3);
  assert.ok(6 - 9 < 0, "you cannot take 9 tiles from 6");
  assert.equal(8 / 2, 4);
  assert.equal(2 / 8, 1 / 4);
  const T = propertyCopy(v);
  assert.match(T.limitsOk.en, /9 − 6 = 3/);
  assert.match(T.limitsOk.en, /8 ÷ 2 = 4, but 2 ÷ 8 = 1\/4/);
  assert.match(T.limitsOk.es, /8 ÷ 2 = 4, pero 2 ÷ 8 = 1\/4/);
  const noDivide = propertyCopy(validatePropertyShift({ ...CFG, divide: undefined }));
  assert.doesNotMatch(noDivide.limitsOk.en, /÷/);
});

test("cues point at the picture and never give the total or the true equation away", () => {
  const T = propertyCopy(validatePropertyShift(CFG));
  for (const k of ["more", "less"])
    for (const lang of ["en", "es"]) {
      assert.match(T.predictCue[k][lang], /\?/);
      assert.doesNotMatch(T.predictCue[k][lang], /\b10\b/);
    }
  for (const k of ["yes", "same"])
    for (const lang of ["en", "es"]) {
      assert.match(T.limitsCue[k][lang], /\?/);
      assert.doesNotMatch(T.limitsCue[k][lang], /does not|no se puede|\bnot\b/i);
    }
  for (const k of ["commute", "regroup", "zero"])
    for (const lang of ["en", "es"]) {
      assert.match(T.transferCue[k][lang], /\?/);
      assert.doesNotMatch(T.transferCue[k][lang], /47 \+ 0/);
    }
});

test("validatePropertyShift refuses what the stage cannot draw", () => {
  const g = CFG.groups;
  const withN = (a, b, c) => g.map((x, i) => ({ ...x, n: [a, b, c][i] }));
  for (const cfg of [
    null,
    {},
    { ...CFG, groups: g.slice(0, 2) },
    { ...CFG, groups: withN(3, 5, 3) }, // two groups equal: subtotals would coincide
    { ...CFG, groups: withN(3, 6, 2) }, // too many tiles for a slot
    { ...CFG, groups: withN(0, 5, 2) },
    { ...CFG, groups: g.map((x) => ({ ...x, short: { en: "a very long label" } })) },
    { ...CFG, groups: g.map((x) => ({ n: x.n, label: x.label })) }, // no short label
    { ...CFG, noun: null },
    { ...CFG, nounOne: null },
    { ...CFG, sub: { a: 9, b: 9 } },
    { ...CFG, sub: { a: 13, b: 6 } },
    { ...CFG, commute: { a: 5, b: 5 } },
    { ...CFG, identity: 1 },
    { ...CFG, regroup: { a: 6, b: 3, c: 1 } },
    { ...CFG, divide: { a: 8, b: 3 } }, // not whole
    { ...CFG, divide: { a: 9, b: 3 } }, // 9 ÷ 3 = 3: swapping gives 3 ÷ 9, but a = b × b hides the point
  ]) {
    assert.equal(validatePropertyShift(cfg), null, JSON.stringify(cfg)?.slice(0, 80));
    assert.equal(buildPropertyShiftPlay(cfg), null);
  }
  assert.equal(validatePropertyShift({ ...CFG, divide: undefined }).divide, null);
});

test("buildPropertyShiftPlay: six scenes, gates where the student acts", () => {
  const play = buildPropertyShiftPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["shift", true],
      ["connect", false],
      ["limits", true],
      ["transfer", false],
    ],
  );
  assert.match(play.printSummary.en, /3 \+ 5 \+ 2 = 10/);
  assert.match(play.printSummary.en, /\(3 \+ 5\) \+ 2 = 3 \+ \(5 \+ 2\) = 10/);
  assert.match(play.printSummary.es, /\(3 \+ 5\) \+ 2 = 3 \+ \(5 \+ 2\) = 10/);
  assert.match(propertyCopy(validatePropertyShift(CFG)).connectDone.en, /6 \+ 9 = 9 \+ 6 = 15/);
});

test("all copy is bilingual and the Spanish has no English left", () => {
  const T = propertyCopy(validatePropertyShift(CFG));
  const pairs = walk(T);
  pairs.push(T.shiftRow("5 + 3 + 2", null), T.shiftRow("(3 + 5) + 2", 8));
  assert.ok(pairs.length > 40);
  for (const p of pairs) {
    assert.ok(p.es.trim(), p.en);
    if (/[a-z]{4}/i.test(p.en) && !/^[+\d ()÷×−=]+$/.test(p.en)) assert.notEqual(p.es, p.en, p.en);
    assert.doesNotMatch(p.es, /\b(the|and|each|order|groups|trade|tiles)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted|vosotros\b/i);
  }
});

test("placeCorrect keeps every option", () => {
  const opts = identityChoices(validatePropertyShift(CFG));
  const placed = placeCorrect(opts, 11);
  assert.equal(placed.length, 4);
  assert.notEqual(placed[0].correct, true);
});

test("the authored 6-8 config builds, and the registry exposes the play", async () => {
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/6-8/config.json", import.meta.url), "utf8"));
  const living = cfg.launch.conceptIntro.livingScene;
  assert.equal(living.play, "property-shift");
  assert.ok(buildPropertyShiftPlay(living));
  const { PLAYS } = await import("./cluster-expressions.js");
  assert.equal(await PLAYS["property-shift"](), buildPropertyShiftPlay);
  assert.equal(reexported, validatePropertyShift);
});
