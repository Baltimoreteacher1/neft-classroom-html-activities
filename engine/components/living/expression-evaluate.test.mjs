// expression-evaluate.test.mjs — every number the expression-evaluate play shows.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildExpressionEvaluatePlay,
  validateExpressionEvaluate as reexported,
} from "./expression-evaluate.js";
import {
  doubleChoices,
  evalAt,
  evaluateCopy,
  expressionChoices,
  exprText,
  fmtNum,
  substitution,
  validateExpressionEvaluate,
  valueChoices,
} from "./expression-evaluate-model.js";

// 6-5: tickets cost $12 each plus a flat $50 fee (12t + 50); field day 4.25s + 23.50.
const CFG = {
  prefix: "$",
  coef: 12,
  constant: 50,
  variable: "t",
  start: 3,
  unit: { en: "ticket", es: "boleto" },
  fee: { en: "venue fee", es: "cuota del lugar" },
  what: { en: "total cost", es: "costo total" },
  transfer: {
    coef: 4.25,
    constant: 23.5,
    variable: "s",
    value: 30,
    unit: { en: "student", es: "estudiante" },
    fee: { en: "shipping fee", es: "cuota de envío" },
  },
};

const walk = (o, out = []) => {
  if (o && typeof o === "object" && typeof o.en === "string" && "es" in o) out.push(o);
  else if (o && typeof o === "object" && typeof o !== "function")
    for (const x of Object.values(o)) walk(x, out);
  return out;
};

test("fmtNum: whole dollars stay whole, cents keep two places", () => {
  assert.equal(fmtNum(5000), "50");
  assert.equal(fmtNum(2350), "23.50");
  assert.equal(fmtNum(425), "4.25");
  assert.equal(fmtNum(12750), "127.50");
  assert.equal(fmtNum(0), "0");
});

test("the lesson's numbers, worked by hand", () => {
  const v = validateExpressionEvaluate(CFG);
  assert.equal(exprText(v.main), "12t + 50");
  assert.equal(exprText(v.transfer), "4.25s + 23.50");
  // t = 3: 12 × 3 = 36; 36 + 50 = 86.  t = 6: 72 + 50 = 122.  t = 0: 50.  t = 8: 96 + 50 = 146.
  assert.equal(evalAt(v.main, 3).total, 8600);
  assert.equal(evalAt(v.main, 6).total, 12200);
  assert.equal(evalAt(v.main, 0).total, 5000);
  assert.equal(evalAt(v.main, 8).total, 14600);
  // s = 30: 4.25 × 30 = 127.50; 127.50 + 23.50 = 151.
  assert.equal(evalAt(v.transfer, 30).part, 12750);
  assert.equal(evalAt(v.transfer, 30).total, 15100);
  assert.deepEqual(substitution(v.main, 3), ["12 × 3 + 50", "36 + 50", "86"]);
  assert.deepEqual(substitution(v.transfer, 30), ["4.25 × 30 + 23.50", "127.50 + 23.50", "151"]);
});

test("expressionChoices: one right translation, three real slips", () => {
  const { main } = validateExpressionEvaluate(CFG);
  assert.deepEqual(
    expressionChoices(main).map((o) => [o.kind, o.text, o.correct]),
    [
      ["right", "12t + 50", true],
      ["swap", "50t + 12", false],
      ["merged", "62t", false],
      ["listed", "12 + t + 50", false],
    ],
  );
});

test("doubleChoices: doubling the tickets does not double the cost", () => {
  const { main } = validateExpressionEvaluate(CFG);
  // 3 tickets cost 86; 6 tickets cost 12 × 6 + 50 = 122. 2 × 86 = 172 is the slip.
  assert.deepEqual(
    doubleChoices(main, 3).map((o) => [o.kind, o.value, o.correct]),
    [
      ["right", 12200, true],
      ["double", 17200, false],
      ["nofee", 7200, false],
      ["feeTwice", 13600, false],
    ],
  );
  assert.notEqual(evalAt(main, 6).total, 2 * evalAt(main, 3).total);
});

test("valueChoices: the evaluation and three slips (4.25s + 23.50 at s = 30)", () => {
  const { transfer } = validateExpressionEvaluate(CFG);
  assert.deepEqual(
    valueChoices(transfer, 30).map((o) => [o.kind, o.value, o.correct]),
    [
      ["right", 15100, true], // 127.50 + 23.50
      ["novar", 2775, false], // 4.25 + 23.50
      ["feeEach", 83250, false], // (4.25 + 23.50) × 30
      ["nofee", 12750, false], // 4.25 × 30
    ],
  );
  assert.equal(Math.round(((4.25 + 23.5) * 30) * 100), 83250);
});

test("cues name the slip and never print the right total", () => {
  const v = validateExpressionEvaluate(CFG);
  const T = evaluateCopy(v);
  const right = (n) => new RegExp(`(?<![\\d.])${n}(?![\\d])`);
  for (const o of expressionChoices(v.main).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) {
      assert.match(T.cue(o)[lang], /\?/);
      assert.ok(T.cue(o)[lang].length > 50);
    }
  for (const o of doubleChoices(v.main, 3).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) {
      const cue = T.doubleCue(o)[lang];
      assert.match(cue, /\?/);
      assert.ok(!right(122).test(cue), cue);
    }
  for (const o of valueChoices(v.transfer, 30).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) {
      const cue = T.transferCue(o)[lang];
      assert.match(cue, /\?/);
      assert.ok(!right("151").test(cue), cue);
    }
});

test("validateExpressionEvaluate refuses what the stage cannot draw", () => {
  const bad = [
    null,
    {},
    { ...CFG, coef: 1 },
    { ...CFG, coef: 30 },
    { ...CFG, constant: 0 },
    { ...CFG, constant: 12 }, // coefficient and constant equal: no way to tell the slips apart
    { ...CFG, coef: 12.345 }, // not whole cents
    { ...CFG, variable: "tt" },
    { ...CFG, variable: "7" },
    { ...CFG, start: 0 },
    { ...CFG, start: 5 }, // doubling would pass the 8 blocks the stage draws
    { ...CFG, start: 2.5 },
    { ...CFG, unit: null },
    { ...CFG, fee: { en: " " } },
    { ...CFG, transfer: undefined },
    { ...CFG, transfer: { ...CFG.transfer, value: 1 } },
    { ...CFG, transfer: { ...CFG.transfer, value: 150 } },
    { ...CFG, transfer: { ...CFG.transfer, coef: 25, constant: 25 } },
  ];
  for (const cfg of bad) {
    assert.equal(validateExpressionEvaluate(cfg), null, JSON.stringify(cfg)?.slice(0, 90));
    assert.equal(buildExpressionEvaluatePlay(cfg), null);
  }
  assert.equal(validateExpressionEvaluate({ ...CFG, start: undefined }).start, 3);
});

test("buildExpressionEvaluatePlay: six scenes, gates where the student acts", () => {
  const play = buildExpressionEvaluatePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["evaluate", true],
      ["connect", false],
      ["double", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /86|12t/);
  assert.match(play.printSummary.en, /12t \+ 50/);
  assert.match(play.printSummary.en, /12 × 3 \+ 50 = 36 \+ 50 = \$86/);
  assert.match(play.printSummary.es, /12 × 3 \+ 50 = 36 \+ 50 = \$86/);
});

test("all copy is bilingual and the Spanish has no English left", () => {
  const v = validateExpressionEvaluate(CFG);
  const T = evaluateCopy(v);
  const pairs = walk({
    ...T,
    cue: undefined,
    doubleCue: undefined,
    transferCue: undefined,
    evalRow: undefined,
    connectSay: undefined,
    annVar: undefined,
    tryMore: undefined,
  });
  for (const o of expressionChoices(v.main).filter((x) => !x.correct)) pairs.push(T.cue(o));
  for (const o of doubleChoices(v.main, 3).filter((x) => !x.correct)) pairs.push(T.doubleCue(o));
  for (const o of valueChoices(v.transfer, 30).filter((x) => !x.correct))
    pairs.push(T.transferCue(o));
  pairs.push(T.evalRow(4), T.connectSay(3), T.annVar(3), T.tryMore(1), T.tryMore(2));
  assert.ok(pairs.length > 30);
  for (const p of pairs) {
    assert.ok(p.es.trim(), p.en);
    if (/[a-z]{4}/i.test(p.en)) assert.notEqual(p.es, p.en, p.en);
    assert.doesNotMatch(p.es, /\b(the|and|each|ticket|tickets|fee|cost|value|express)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted|vosotros\b/i);
  }
});

test("the authored 6-5 config builds, and the registry exposes the play", async () => {
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/6-5/config.json", import.meta.url), "utf8"));
  const living = cfg.launch.conceptIntro.livingScene;
  assert.equal(living.play, "expression-evaluate");
  assert.ok(buildExpressionEvaluatePlay(living));
  const { PLAYS } = await import("./cluster-expressions.js");
  assert.equal(await PLAYS["expression-evaluate"](), buildExpressionEvaluatePlay);
  assert.equal(reexported, validateExpressionEvaluate);
});
