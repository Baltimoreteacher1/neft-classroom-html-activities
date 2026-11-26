// choose-measure.test.mjs — every number the choose-measure play shows for
// lesson 2-10, recomputed independently of the play.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildChooseMeasurePlay, validateChooseMeasure as reexported } from "./choose-measure.js";
import {
  axisFor,
  chooseMeasureCopy,
  eq,
  farthest,
  fmt,
  mstats,
  mw,
  okSet,
  outvoted,
  placeCorrect,
  pull,
  ranks,
  validateChooseMeasure,
} from "./choose-measure-model.js";

const lesson = JSON.parse(readFileSync(new URL("../../../lessons/2-10/config.json", import.meta.url)));
const CFG = lesson.launch.conceptIntro.livingScene;
const clone = () => structuredClone(CFG);

// Independent reference statistics (odd counts).
const refMean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const refMedian = (a) => [...a].sort((x, y) => x - y)[(a.length - 1) / 2];

test("mstats matches the worked example in the lesson: 193 / 7 and the 4th value, 23", () => {
  const s = mstats([22, 24, 20, 25, 23, 21, 58]);
  assert.equal(s.total, 193);
  assert.equal(s.median, 23);
  assert.ok(Math.abs(s.mean - 193 / 7) < 1e-12);
  assert.equal(fmt(s.mean), "≈ 27.6");
  const lines = lesson.launch.conceptIntro.iDo.lines.join(" ");
  assert.match(lines, /193 ÷ 7 ≈ 27\.6/);
  assert.match(lines, /median \(23\)|\(4th\) value is 23/);
  assert.match(lines, /higher than 6 of the 7 games/);
  assert.equal(outvoted([22, 24, 20, 25, 23, 21, 58]), 6);
});

test("the authored 2-10 scene builds and uses the lesson's own sets", () => {
  const v = validateChooseMeasure(CFG);
  assert.ok(v);
  assert.deepEqual(v.values, [22, 24, 20, 25, 23, 21, 58]);
  assert.deepEqual(v.sets.a.values, [4, 5, 6, 7, 8]); // Let's try together, set A
  assert.deepEqual(v.sets.b.values, [4, 5, 6, 7, 40]); // set B
  assert.deepEqual(v.transfer.values, [45, 52, 48, 50, 210]);
  assert.ok(buildChooseMeasurePlay(CFG));
  assert.equal(reexported, validateChooseMeasure);
});

test("the authored claims are true of the numbers", () => {
  const v = validateChooseMeasure(CFG);
  for (const d of [v.values, v.sets.b.values, v.transfer.values]) {
    assert.ok(refMean(d) > refMedian(d), "an outlier set has mean above median");
    assert.ok(pull(d) >= 0.1);
  }
  assert.equal(refMean(v.sets.a.values), 6);
  assert.equal(refMedian(v.sets.a.values), 6);
  assert.equal(refMean(v.sets.b.values), 12.4);
  assert.equal(refMedian(v.sets.b.values), 6);
  assert.equal(refMean(v.transfer.values), 81);
  assert.equal(refMedian(v.transfer.values), 50);
  assert.equal(v.idx, 6);
  assert.equal(farthest(v.values).value, 58);
  assert.equal(farthest(v.transfer.values).value, 210);
});

test("moving the far value never moves the median, and moves the mean by the change / n", () => {
  const v = validateChooseMeasure(CFG);
  for (let val = v.edit.min; val <= v.edit.max; val++) {
    const vals = v.values.map((x, i) => (i === v.idx ? val : x));
    assert.equal(refMedian(vals), 23, `median at ${val}`);
    const delta = refMean(vals) - refMean(v.values);
    assert.ok(Math.abs(delta - (val - 58) / 7) < 1e-9, `mean shift at ${val}`);
  }
  const T = chooseMeasureCopy(v);
  assert.match(T.moveDone(25, 60).en, /Game 7 went from 25 to 60: the mean moved from about 22\.9 to about 27\.9, but the median stayed 23/);
  assert.equal(Math.round((160 / 7) * 10) / 10, 22.9);
  assert.equal(Math.round((195 / 7) * 10) / 10, 27.9);
  assert.match(T.moveRow(58, String).en, /Mean <b>≈ 27\.6<\/b>, median <b>23<\/b>/);
});

test("sentences state numbers recomputed from the data", () => {
  const T = chooseMeasureCopy(validateChooseMeasure(CFG));
  assert.match(T.connectSay.en, /The mean, about 27\.6, is higher than 6 of the 7 games because 58 pulled it up\. The median, 23,/);
  assert.match(T.connectSay.es, /La media, alrededor de 27\.6, es mayor que 6 de los 7 partidos/);
  assert.match(T.setsOk.en, /Set A: mean 6, median 6\. Set B: mean 12\.4, median 6\. The 40 pulls/);
  assert.match(T.setsCue("outlier").en, /62 ÷ 5 = 12\.4/); // 4 + 5 + 6 + 7 + 40 = 62
  assert.equal(4 + 5 + 6 + 7 + 40, 62);
  assert.match(T.transferOk.en, /median, 50, sits among the 4 similar values\. The 210 pulls the mean up to 81/);
  assert.match(T.transferCue("mean").en, /4 of the 5 values are below the mean, 81\./);
  assert.equal([45, 52, 48, 50].filter((x) => x < 81).length, 4);
  assert.match(T.printSummary.en, /193 ÷ 7 ≈ 27\.6/);
  assert.match(T.printSummary.es, /193 ÷ 7 ≈ 27\.6/);
  assert.equal(T.predictOptions.filter((o) => o.correct).length, 1);
  assert.equal(T.predictOptions.find((o) => o.correct).kind, "higher");
  assert.equal(T.setsOptions.find((o) => o.correct).label.en, "Set A");
  assert.equal(T.transferOptions.find((o) => o.correct).kind, "median");
  assert.equal(T.transferOptions.find((o) => o.correct).label.en, "The median, 50 yards");
});

test("every wrong choice has a cue, and a cue is a question that does not state the answer", () => {
  const T = chooseMeasureCopy(validateChooseMeasure(CFG));
  const groups = [
    [T.predictOptions, T.predictCue],
    [T.setsOptions, T.setsCue],
    [T.transferOptions, T.transferCue],
  ];
  for (const [opts, cue] of groups) {
    assert.ok(opts.length >= 3);
    const wrong = opts.filter((o) => !o.correct);
    assert.ok(wrong.length >= 2);
    assert.equal(new Set(wrong.map((o) => cue(o.kind).en)).size, wrong.length, "each wrong choice has its own cue");
    for (const o of wrong) {
      const c = cue(o.kind);
      assert.ok(c.en.endsWith("?") && c.es.endsWith("?"), o.kind);
      assert.doesNotMatch(c.en, /use the median|is the better|higher than 23|The answer/i);
    }
    const placed = placeCorrect(opts, 11);
    assert.equal(placed.length, opts.length);
    assert.equal(placed.filter((o) => o.correct).length, 1);
    assert.notEqual(placed.findIndex((o) => o.correct), 0, "the correct choice is not first");
  }
});

test("copy exists in both languages, Spanish uses no English words", () => {
  const T = chooseMeasureCopy(validateChooseMeasure(CFG));
  const check = (x, path) => {
    if (!(x && typeof x === "object" && "en" in x)) return;
    assert.ok(typeof x.es === "string" && x.es.trim(), `${path} needs Spanish`);
    assert.notEqual(x.en, x.es, `${path} is not a copy`);
    assert.doesNotMatch(x.es, /\b(the|and|mean|median|about|games?|outlier)\b/i, `${path}: English in Spanish`);
    assert.doesNotMatch(x.es, /\b(usted|ustedes|vosotros)\b/i);
  };
  for (const [k, val] of Object.entries(T)) {
    if (typeof val === "function" || typeof val === "string") continue;
    if (Array.isArray(val)) val.forEach((o, i) => check(o.label, `${k}[${i}]`));
    else if ("en" in val) check(val, k);
    else for (const [k2, v2] of Object.entries(val)) check(v2, `${k}.${k2}`);
  }
  for (const fn of [T.meanTag(27.6), T.medianTag(23), T.moveDone(25, 60), T.moveTry(2), T.predictCue("lower"), T.setsCue("both")])
    check(fn, "fn");
});

test("helpers: formatting, ranks, axis", () => {
  assert.equal(fmt(12.4), "12.4");
  assert.equal(fmt(6), "6");
  assert.equal(eq(12.4), "= 12.4");
  assert.equal(eq(193 / 7), "≈ 27.6");
  assert.equal(mw(6, "en"), "6");
  assert.equal(mw(193 / 7, "en"), "about 27.6");
  assert.equal(mw(193 / 7, "es"), "alrededor de 27.6");
  assert.deepEqual(ranks([22, 24, 20, 25, 23, 21, 58]), [2, 4, 0, 5, 3, 1, 6]);
  assert.deepEqual(ranks([5, 5, 3]), [1, 2, 0], "equal values keep their order");
  assert.deepEqual(axisFor([20, 58, 25, 60]), { lo: 15, hi: 65, step: 5 });
  assert.deepEqual(axisFor([4, 5, 6, 7, 8, 40]), { lo: 0, hi: 45, step: 5 });
  assert.deepEqual(axisFor([45, 210]), { lo: 40, hi: 220, step: 20 });
  for (const nums of [[20, 60], [4, 40], [45, 210], [3, 9]]) {
    const ax = axisFor(nums);
    assert.ok((ax.hi - ax.lo) / ax.step <= 11);
    assert.ok(Math.min(...nums) >= ax.lo && Math.max(...nums) <= ax.hi);
  }
});

test("okSet refuses what cannot be drawn", () => {
  for (const bad of [[1, 2, 3], [1, 2, 3, 4, 9, 20], [5, 5, 5, 5, 5], [1, 1, 1, 2, 9], [1, 2, 3, 4, 1000], [1.5, 2, 3, 4, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9]])
    assert.equal(okSet(bad), null, JSON.stringify(bad));
  assert.deepEqual(okSet([4, 5, 6, 7, 8]), [4, 5, 6, 7, 8]);
});

test("validation refuses configs whose claims are false or the stage cannot draw", () => {
  const mutate = (fn) => {
    const c = clone();
    fn(c);
    return c;
  };
  const bad = [
    null,
    {},
    mutate((c) => (c.values = [22, 24, 20, 25, 23, 21, 30])), // 30 does not pull the mean 0.1 of the range
    mutate((c) => (c.sets.a.values = [4, 5, 6, 7, 40])), // the "quiet" set has an outlier
    mutate((c) => (c.sets.b.values = [4, 5, 6, 7, 9])), // the "outlier" set does not
    mutate((c) => (c.transfer.values = [45, 52, 48, 50, 49])),
    mutate((c) => (c.editIndex = 0)), // not the far value
    mutate((c) => (c.edit = { min: 10, max: 60 })), // would let the value cross the others
    mutate((c) => (c.edit = { min: 25, max: 20 })),
    mutate((c) => (c.edit = { min: 25, max: 57 })), // start value outside the range
    mutate((c) => (c.values = [22, 24, 20, 25, 23, 21])), // even count
    mutate((c) => (c.values[6] = 5.5)),
    mutate((c) => delete c.item),
    mutate((c) => delete c.unit),
    mutate((c) => delete c.story),
    mutate((c) => delete c.transfer.unit),
    mutate((c) => (c.sets.a.name = { en: "A" })),
  ];
  for (const cfg of bad) {
    assert.equal(validateChooseMeasure(cfg), null, JSON.stringify(cfg)?.slice(0, 100));
    assert.equal(buildChooseMeasurePlay(cfg), null);
  }
});

test("buildChooseMeasurePlay: six scenes, gates where the student acts", () => {
  const play = buildChooseMeasurePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["move", true],
      ["connect", false],
      ["sets", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /mean|median|outlier/i, "the title must not give away the answer");
  assert.match(play.viewBox, /^0 0 480 \d+$/);
});
