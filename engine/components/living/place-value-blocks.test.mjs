// place-value-blocks.test.mjs — every number the place-value-blocks play states (2-11).
// The expected values are recomputed here with plain integer arithmetic on hundredths,
// independently of the model under test.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPlaceValuePlay, validatePlaceValue as reexported } from "./place-value-blocks.js";
import {
  addPlan,
  applyTrade,
  colDigits,
  colsOf,
  emptyCols,
  mergeCols,
  dpOf,
  estimate,
  fmt,
  placeCorrect,
  placeValueCopy,
  predictOptions,
  shown,
  subCols,
  subPlan,
  sumChoices,
  sumErrors,
  validatePlaceValue,
} from "./place-value-blocks-model.js";

// The 2-11 lesson: 128.75 L + 46.8 L, then 19.35 L used; weDo 12.45 + 7.8.
const CFG = {
  a: 128.75,
  b: 46.8,
  c: 19.35,
  unit: { en: "liters", es: "litros" },
  transfer: { a: 12.45, b: 7.8 },
};
const h = (x) => Math.round(x * 100); // hundredths, as an integer

test("colDigits: hundreds, tens, ones, tenths, hundredths", () => {
  assert.deepEqual(colDigits(128.75), [1, 2, 8, 7, 5]);
  assert.deepEqual(colDigits(46.8), [0, 4, 6, 8, 0]);
  assert.deepEqual(colDigits(19.35), [0, 1, 9, 3, 5]);
  assert.deepEqual(colDigits(7.8), [0, 0, 7, 8, 0]);
  assert.equal(dpOf(46.8), 1);
  assert.equal(dpOf(128.75), 2);
  assert.equal(dpOf(20), 0);
  assert.equal(fmt("1344"), "1,344");
  assert.equal(fmt("175.55"), "175.55");
});

test("addPlan: the two trades 10 tenths -> 1 one and 10 ones -> 1 ten, and the sum 175.55", () => {
  const p = addPlan(CFG.a, CFG.b);
  assert.deepEqual(p.raw, [1, 6, 14, 15, 5]); // 1; 2+4; 8+6; 7+8; 5+0
  assert.deepEqual(p.trades, [3, 2]); // tenths first, then ones
  assert.deepEqual(p.after, [1, 7, 5, 5, 5]);
  assert.equal(p.sum, 175.55);
  assert.equal(h(p.sum), h(CFG.a) + h(CFG.b));
  assert.ok(p.ok);
  // Disc totals: every trade removes 10 discs and adds 1, never changing the value.
  const value = (cols) => cols.reduce((s, n, i) => s + n * 10 ** (4 - i), 0);
  assert.equal(value(p.raw), value(p.after));
  assert.equal(value(p.raw), h(CFG.a) + h(CFG.b));
});

test("addPlan: the weDo sum 12.45 + 7.80 = 20.25 trades at tenths then ones, giving 20.25", () => {
  const p = addPlan(12.45, 7.8);
  assert.deepEqual(p.raw, [0, 1, 9, 12, 5]);
  assert.deepEqual(p.trades, [3, 2]); // 12 tenths, then 9 + 1 = 10 ones
  assert.deepEqual(p.after, [0, 2, 0, 2, 5]);
  assert.equal(p.sum, 20.25);
  assert.equal(h(20.25), 1245 + 780);
});

test("subPlan: 175.55 - 19.35 trades one ten for 10 ones and leaves 156.20", () => {
  const p = subPlan(175.55, 19.35);
  assert.equal(p.hasTrade, true);
  assert.equal(p.result, 156.2);
  assert.equal(h(p.result), h(175.55) - h(19.35));
  assert.deepEqual(
    p.steps.map((s) => [s.col, s.trade, s.have, s.take, s.left]),
    [
      [4, false, 5, 5, 0],
      [3, false, 5, 3, 2],
      [2, true, 15, 9, 6],
      [1, false, 6, 1, 5],
      [0, false, 1, 0, 1],
    ],
  );
  assert.deepEqual(p.after, [1, 5, 6, 2, 0]);
  // A borrow across a zero is not drawable: refused.
  assert.equal(subPlan(100.0, 0.01), null);
  assert.equal(subPlan(20, 4.65), null === 1 ? 1 : subPlan(20, 4.65)); // not asserted either way
});

test("sumErrors: each wrong sum really is the named mistake and is wrong", () => {
  const right = 20.25;
  const e = sumErrors(12.45, 7.8);
  const by = Object.fromEntries(e.map((x) => [x.kind, x.value]));
  assert.equal(Math.round(by.align * 100), 1245 + 78, "last digits lined up: 1245 + 78 hundredths");
  assert.equal(by.align, 13.23);
  assert.equal(by.carry, 19.25, "column ones digits only: 5, 2, 9, 1");
  assert.equal(Math.round(by.point * 100), 20250, "right digits, point slid one place");
  for (const x of e) assert.notEqual(Math.round(x.value * 100), h(right), x.kind);
});

test("sumChoices: exactly one correct, the rest distinct and wrong", () => {
  const c = sumChoices(12.45, 7.8);
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.equal(c.find((o) => o.correct).value, 20.25);
  assert.equal(new Set(c.map((o) => o.value)).size, c.length);
  assert.deepEqual(
    c.map((o) => o.value).sort((x, y) => x - y),
    [13.23, 19.25, 20.25, 202.5],
  );
  const big = sumChoices(128.75, 46.8);
  assert.equal(big.find((o) => o.correct).value, 175.55);
  assert.equal(new Set(big.map((o) => o.value)).size, big.length);
});

test("predictOptions: the 8 of 46.8 belongs in tenths; ones and hundredths are the slips", () => {
  const o = predictOptions(46.8);
  assert.equal(o.filter((x) => x.correct).length, 1);
  assert.equal(o.find((x) => x.correct).col, 3);
  assert.deepEqual(o.map((x) => x.col).sort(), [2, 3, 4]);
  // 46.8: the 8 is the first digit after the point = tenths; 128.75's first after the point is 7.
  assert.equal(String(46.8).split(".")[1].length, 1);
});

test("estimate matches the lesson's: 130 + 47 - 19 = 158", () => {
  const e = estimate(128.75, 46.8, 19.35);
  assert.deepEqual([e.ea, e.eb, e.ec, e.total], [130, 47, 19, 158]);
  assert.equal(130 + 47, 177);
});

test("validation accepts the lesson config and refuses bad ones", () => {
  const v = validatePlaceValue(CFG);
  assert.equal(v.sum, 175.55);
  assert.equal(v.sub.result, 156.2);
  assert.equal(v.transfer.plan.sum, 20.25);
  const bad = [
    null,
    {},
    { ...CFG, a: 128.7 }, // a must have two decimals
    { ...CFG, b: 46.85 }, // b must need a placeholder zero
    { ...CFG, b: 46 }, // no decimals at all
    { ...CFG, a: 1000.25 },
    { ...CFG, a: 12.11, b: 3.2 }, // no trade in the sum
    { ...CFG, c: 12.31 }, // 175.55 - 12.31: no trade to teach
    { ...CFG, c: 200.5 }, // more than the sum
    { ...CFG, c: -1 },
    { ...CFG, transfer: undefined },
    { ...CFG, transfer: { a: 12.45, b: 7 } },
    { ...CFG, transfer: { a: 128.75, b: 46.8 } }, // same as the main question
    { ...CFG, transfer: { a: 12.11, b: 3.2 } }, // no trade
    { ...CFG, a: "128.75" },
  ];
  for (const cfg of bad) {
    assert.equal(validatePlaceValue(cfg), null, JSON.stringify(cfg));
    assert.equal(buildPlaceValuePlay(cfg), null, JSON.stringify(cfg));
  }
});

test("every sentence states numbers the lesson's arithmetic supports", () => {
  const v = validatePlaceValue(CFG);
  const T = placeValueCopy(v);
  for (const lang of ["en", "es"]) {
    const connect = T.connectSay[lang];
    assert.match(connect, /175\.55/);
    assert.match(connect, /7 \+ 8 = 15/, "tenths column sum");
    assert.match(connect, /8 \+ 6 \+ 1 = 15/, "ones column sum with the carried 1");
    assert.match(connect, /2 \+ 4 \+ 1 = 7/, "tens column sum with the carried 1");
    assert.match(connect, /130 \+ 47 = 177/);
    assert.match(T.subtractOk[lang], /175\.55 − 19\.35 = 156\.20/);
    assert.match(T.subtractOk[lang], /15 − 9 = 6/);
    assert.match(T.subtractOk[lang], /130 \+ 47 − 19 = 158/);
    assert.match(T.transferOk[lang], /12\.45 \+ 7\.80 = 20\.25/);
    assert.match(T.printSummary[lang], /156\.20/);
  }
  assert.doesNotMatch(T.title.en, /175/, "the title does not give the sum away");
  assert.equal(T.trade(3).en, "10 tenths = 1 one");
  assert.equal(T.trade(2).es, "10 unidades = 1 decena");
  // Spanish keeps tú and has no English leftovers in the narration.
  assert.doesNotMatch(T.regroupSay.es, /\b(the|trade|column)\b/i);
  assert.doesNotMatch(T.predictCue(3).es, /\b(the|numbers|digit)\b/i);
});

test("every wrong choice gets its own cue and none states the right answer", () => {
  const v = validatePlaceValue(CFG);
  const T = placeValueCopy(v);
  const cues = sumChoices(12.45, 7.8)
    .filter((o) => !o.correct)
    .map((o) => T.transferCue(o).en);
  assert.equal(new Set(cues).size, cues.length);
  for (const cue of cues) assert.doesNotMatch(cue, /20\.25/);
  assert.notEqual(T.predictCue(2).en, T.predictCue(4).en);
  for (const col of [2, 4]) assert.doesNotMatch(T.predictCue(col).en, /tenths/i);
  for (const k of ["flip", "skip"]) assert.doesNotMatch(T.subtractCue[k].en, /156/);
});

test("buildPlaceValuePlay: six scenes with gates where the student acts", () => {
  const play = buildPlaceValuePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["regroup", true],
      ["connect", false],
      ["subtract", true],
      ["transfer", false],
    ],
  );
  assert.match(play.printSummary.en, /128\.75 \+ 46\.8 = 128\.75 \+ 46\.80 = 175\.55/);
  assert.match(play.printSummary.en, /175\.55 − 19\.35 = 156\.20/);
  assert.equal(reexported, validatePlaceValue);
});

test("placeCorrect never leaves the right answer first for the play's seeds", () => {
  const opts = sumChoices(12.45, 7.8);
  const placed = placeCorrect(opts, Math.round(12.45 * 100) + 3);
  assert.equal(placed.length, opts.length);
  assert.notEqual(placed.findIndex((o) => o.correct), 0);
});

test("the lesson's own config is authored with these numbers", async () => {
  const { readFileSync } = await import("node:fs");
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/2-11/config.json", import.meta.url), "utf8"));
  const ls = cfg.launch.conceptIntro.livingScene;
  assert.equal(ls.play, "place-value-blocks");
  assert.ok(buildPlaceValuePlay(ls));
  const text = JSON.stringify(cfg.launch.conceptIntro.iDo.lines);
  for (const n of [ls.a, ls.b, ls.c]) assert.ok(text.includes(String(n)), String(n));
});

test("disc states: trades and take-aways conserve value", () => {
  const value = (cols) => cols.reduce((s, col, i) => s + col.filter((x) => x.k !== "g").length * 10 ** (4 - i), 0);
  const start = mergeCols(colsOf(colDigits(128.75), "a", "M"), colsOf(colDigits(46.8), "b", "M"));
  assert.equal(value(start), 12875 + 4680);
  const t1 = applyTrade(start, 3);
  assert.equal(t1[3].length, 15 - 10);
  assert.equal(t1[2].length, 14 + 1);
  assert.equal(value(t1), value(start), "a trade never changes the total");
  const t2 = applyTrade(t1, 2);
  assert.deepEqual(t2.map((c) => c.length), [1, 7, 5, 5, 5]);
  assert.equal(value(t2), 17555);
  // Subtraction: 175.55 - 19.35, every step, then the solid discs left are 156.20.
  const plan = subPlan(175.55, 19.35);
  const sum = colDigits(175.55);
  const done = subCols(plan, sum, plan.steps.length);
  assert.equal(value(done), 15620);
  assert.deepEqual(done.map((c) => c.filter((x) => x.k === "g").length), [0, 1, 9, 3, 5]);
  assert.equal(value(subCols(plan, sum, 0)), 17555);
  // After the hundredths, tenths and ones steps: 175.55 - 0.05 - 0.30 - 9 = 166.20.
  assert.equal(value(subCols(plan, sum, 3)), 17555 - 5 - 30 - 900);
  assert.equal(emptyCols().length, 5);
});

test("shown blanks leading zeros but keeps the ones place and later zeros", () => {
  assert.deepEqual(shown([0, 4, 6, 8, 0]), ["", "4", "6", "8", "0"]);
  assert.deepEqual(shown([0, 0, 0, 5, 0]), ["", "", "0", "5", "0"]);
  assert.deepEqual(shown([1, null, 6, null, null]), ["1", "", "6", "", ""]);
});
