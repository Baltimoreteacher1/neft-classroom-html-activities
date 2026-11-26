// spread-iqr.test.mjs — every number the spread-iqr play shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildSpreadIqrPlay } from "./spread-iqr.js";
import {
  axisOf,
  iqrChoices,
  middleHalf,
  rangeChoices,
  spreadIqrCopy,
  validateSpreadIqr,
  withLowest,
} from "./spread-iqr-model.js";
import { fiveNumber } from "./median-fold-model.js";

const lesson = JSON.parse(
  readFileSync(new URL("../../../lessons/2-5/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;

test("the authored 2-5 config validates and builds", () => {
  assert.ok(validateSpreadIqr(lesson));
  const play = buildSpreadIqrPlay(lesson);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "range", "iqr", "outlier", "transfer"],
  );
});

test("the lesson's worked example: range 26, quartiles 75.5 / 83.5 / 88, IQR 12.5", () => {
  const v = lesson.values;
  assert.equal(v.length, 20);
  const s = fiveNumber(v);
  assert.equal(s.max - s.min, 94 - 68);
  assert.deepEqual([s.min, s.q1, s.med, s.q3, s.max], [68, 75.5, 83.5, 88, 94]);
  assert.equal(s.range, 26);
  assert.equal(s.iqr, 12.5);
  // Independent: Q1 is halfway between the 5th and 6th, Q3 between the 15th and 16th.
  assert.equal((v[4] + v[5]) / 2, 75.5);
  assert.equal((v[14] + v[15]) / 2, 88);
  assert.equal((v[9] + v[10]) / 2, 83.5);
});

test("middle half: the dots between Q1 and Q3 are the ones the scene colours", () => {
  const { from, to } = middleHalf(20);
  assert.deepEqual([from, to], [5, 15]);
  const middle = lesson.values.slice(from, to);
  assert.equal(middle.length, 10);
  assert.ok(Math.min(...middle) > 75.5 && Math.max(...middle) <= 88);
  assert.ok(lesson.values.slice(0, from).every((x) => x < 75.5));
  assert.ok(lesson.values.slice(to).every((x) => x >= 88));
});

test("the outlier scene: moving the lowest score changes the range, never the IQR", () => {
  const base = fiveNumber(lesson.values);
  for (let x = lesson.outlierMin; x <= base.min; x++) {
    const moved = fiveNumber(withLowest(lesson.values, x));
    assert.equal(moved.iqr, 12.5);
    assert.equal(moved.med, 83.5);
    assert.equal(moved.range, 94 - x);
  }
  assert.equal(withLowest(lesson.values, 75), null); // would stop being the lowest
  assert.equal(fiveNumber(withLowest(lesson.values, 52)).range, 42);
});

test("choices: one correct each; distractors are real misconceptions", () => {
  const r = rangeChoices(lesson.values);
  assert.deepEqual(
    r.map((o) => [o.kind, o.value]),
    [
      ["range", 26],
      ["max", 94],
      ["midrange", 81],
      ["count", 20],
    ],
  );
  const i = iqrChoices(lesson.values);
  assert.deepEqual(
    i.map((o) => [o.kind, o.value]),
    [
      ["iqr", 12.5],
      ["range", 26],
      ["sum", 163.5],
      ["mid", 81.75],
    ],
  );
  for (const set of [r, i]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length);
  }
});

test("transfer classes: the lesson's own summaries, same median, B less spread", () => {
  const v = validateSpreadIqr(lesson);
  const { a, b } = v.transfer;
  assert.deepEqual([a.range, a.iqr], [28, 13]); // 90−62, 87−74
  assert.deepEqual([b.range, b.iqr], [20, 8]); // 90−70, 84−76
  assert.equal(a.med, b.med);
  const T = spreadIqrCopy(v);
  assert.equal(T.lessSpread, b);
  assert.match(T.transferOk.en, /Class B: IQR 84 − 76 = 8, against 87 − 74 = 13 for Class A/);
  assert.deepEqual(axisOf(62, 90), { step: 5, lo: 60, hi: 90 });
});

test("validation refuses what the stage cannot draw", () => {
  const bad = (patch) => validateSpreadIqr({ ...lesson, ...patch });
  assert.equal(bad({ values: lesson.values.slice(1) }), null); // 19 values
  assert.equal(bad({ values: [...lesson.values].reverse() }), null); // not in order
  assert.equal(bad({ outlierMin: 70 }), null); // not lower than the data
  assert.equal(bad({ outlierMin: 52.5 }), null);
  assert.equal(
    bad({ transfer: { a: lesson.transfer.a, b: { ...lesson.transfer.b, med: 80 } } }),
    null,
  ); // medians differ
  assert.equal(
    bad({ transfer: { a: lesson.transfer.a, b: { ...lesson.transfer.a, label: { en: "B" } } } }),
    null,
  ); // same IQR
  assert.equal(buildSpreadIqrPlay({}), null);
  assert.equal(buildSpreadIqrPlay(null), null);
});

test("copy: bilingual, numbers correct, a miss never states the answer", () => {
  const v = validateSpreadIqr(lesson);
  const T = spreadIqrCopy(v);
  const walk = (o, path = "") => {
    if (o && typeof o === "object" && "en" in o) assert.ok(o.es?.trim(), `${path} has no Spanish`);
    else if (o && typeof o === "object")
      for (const [k, x] of Object.entries(o)) if (typeof x !== "function") walk(x, `${path}.${k}`);
  };
  walk(T);
  assert.equal(T.rangeSum(68, 94).en, "range = 94 − 68 = 26");
  assert.equal(T.iqrSum.en, "IQR = 88 − 75.5 = 12.5");
  assert.equal(T.iqrSum.es, "RIC = 88 − 75.5 = 12.5");
  assert.match(T.outlierRow(52, String).en, /Range = 94 − 52 = <b>42<\/b>.*IQR = 88 − 75.5 = <b>12.5<\/b>/);
  for (const o of rangeChoices(lesson.values).filter((x) => !x.correct))
    assert.doesNotMatch(JSON.stringify(T.cueRange(o)), /= 26|range is 26/);
  for (const o of iqrChoices(lesson.values).filter((x) => !x.correct))
    assert.doesNotMatch(JSON.stringify(T.cueIqr(o)), /12\.5/);
  assert.doesNotMatch(JSON.stringify([T.cueClass("more"), T.cueClass("same")]), /Class B|= 8/);
});
