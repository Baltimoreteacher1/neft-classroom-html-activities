// box-build.test.mjs — every number the box-build play shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildBoxBuildPlay } from "./box-build.js";
import {
  axisFor,
  boxBuildCopy,
  medianChoices,
  sidesOf,
  q3Choices,
  quartileSlots,
  stackIndex,
  validateBoxBuild,
  valuesPerSide,
} from "./box-build-model.js";
import { fiveNumber } from "./median-fold-model.js";

const lesson = JSON.parse(
  readFileSync(new URL("../../../lessons/2-4/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;

// Independent quartiles: median of the values below / above the median position.
const q = (s) => {
  const med = (a) => (a.length & 1 ? a[a.length >> 1] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
  const h = s.length >> 1;
  return [s[0], med(s.slice(0, h)), med(s), med(s.slice(s.length - h)), s[s.length - 1]];
};

test("the authored 2-4 config validates and builds", () => {
  assert.ok(validateBoxBuild(lesson));
  const play = buildBoxBuildPlay(lesson);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "median", "quartiles", "build", "sides", "transfer"],
  );
});

test("five-number summaries match the lesson's worked example and the Comets", () => {
  assert.deepEqual(q(lesson.values), [4, 8, 14, 22, 28]);
  const s = fiveNumber(lesson.values);
  assert.deepEqual([s.min, s.q1, s.med, s.q3, s.max], [4, 8, 14, 22, 28]);
  assert.deepEqual(q(lesson.transfer.values), [2, 10, 18, 26, 34]);
  assert.equal(fiveNumber(lesson.transfer.values).q3, 26);
});

test("quartile slots point at real data values; the two sides of the median hold equal counts", () => {
  for (const [vals, n] of [
    [lesson.values, 11],
    [lesson.transfer.values, 11],
    [[1, 3, 4, 8, 9, 12, 20], 7],
  ]) {
    const { h, q1, q3 } = quartileSlots(n);
    const s = fiveNumber(vals);
    assert.equal(vals[q1], s.q1);
    assert.equal(vals[h], s.med);
    assert.equal(vals[q3], s.q3);
    assert.equal(vals.filter((x) => x < s.med).length, valuesPerSide(n));
    assert.equal(vals.filter((x) => x > s.med).length, valuesPerSide(n));
  }
  assert.deepEqual(sidesOf(fiveNumber(lesson.values)), [10, 14]); // 14−4, 28−14
});

test("choices: one correct each; distractors are the real misconceptions", () => {
  const m = medianChoices(lesson.values);
  assert.deepEqual(
    m.map((o) => o.kind),
    ["median", "mean", "midrange", "position"],
  );
  assert.deepEqual([m[0].value, m[2].value, m[3].value], [14, 16, 6]);
  assert.ok(Math.abs(m[1].value - 161 / 11) < 1e-9);
  const t = q3Choices(lesson.transfer.values);
  assert.deepEqual(
    t.map((o) => [o.kind, o.value]),
    [
      ["q3", 26],
      ["max", 34],
      ["median", 18],
      ["withMedian", 25], // median of 18,22,24,26,30,34
    ],
  );
  for (const set of [m, t]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length);
  }
});

test("axis and dot stacks", () => {
  assert.deepEqual(axisFor(fiveNumber(lesson.values)), { step: 2, lo: 4, hi: 28 });
  assert.deepEqual(axisFor(fiveNumber(lesson.transfer.values)), { step: 5, lo: 0, hi: 35 });
  assert.deepEqual(stackIndex([1, 1, 2, 2, 2, 5]), [0, 1, 0, 1, 2, 0]);
});

test("validation refuses what the stage cannot draw", () => {
  const bad = (patch) => validateBoxBuild({ ...lesson, ...patch });
  assert.equal(bad({ values: [4, 6, 8, 10, 12, 14, 15, 18, 22, 24] }), null); // 10 values
  assert.equal(bad({ values: [28, 24, 22, 18, 15, 14, 12, 10, 8, 6, 4] }), null); // not in order
  // The Comets' median sits dead centre (8 below, 8 above): no longer side, so not the main data.
  assert.equal(bad({ values: lesson.transfer.values }), null);
  assert.equal(bad({ transfer: { values: [1, 2, 3, 4, 5, 6, 7, 8, 9] } }), null);
  assert.equal(bad({ transfer: { values: [5, 5, 5, 5, 5, 5, 5] } }), null);
  assert.equal(buildBoxBuildPlay({}), null);
  assert.equal(buildBoxBuildPlay(null), null);
});

test("the longer side is the upper one in the lesson's plot", () => {
  assert.equal(validateBoxBuild(lesson).longer, 1);
});

test("copy: bilingual, numbers correct, a miss never states the answer", () => {
  const v = validateBoxBuild(lesson);
  const T = boxBuildCopy(v);
  const walk = (o, path = "") => {
    if (o && typeof o === "object" && "en" in o) {
      assert.ok(o.es?.trim(), `${path} has no Spanish`);
    } else if (o && typeof o === "object")
      for (const [k, x] of Object.entries(o)) if (typeof x !== "function") walk(x, `${path}.${k}`);
  };
  walk(T);
  assert.match(T.medianOk.en, /14 is number 6 of 11, with 5 values on each side/);
  assert.match(T.quartileDone.en, /Q3 = 22/);
  assert.match(T.sidesOk.en, /Each side holds 5 values/);
  assert.match(T.transferOk.en, /upper half is 22, 24, 26, 30, 34, and its middle is 26/);
  assert.deepEqual(
    T.lineLabels(fiveNumber(lesson.values)).map((p) => p.en),
    ["min 4", "Q1 8", "median 14", "Q3 22", "max 28"],
  );
  for (const o of medianChoices(lesson.values).filter((x) => !x.correct))
    assert.doesNotMatch(JSON.stringify(T.cueMedian(o)), /median is 14|mediana es 14/);
  for (const o of q3Choices(lesson.transfer.values).filter((x) => !x.correct))
    assert.doesNotMatch(JSON.stringify(T.cueQ3(o)), /Q3 = 26|Q3 es 26/);
  // Q1 cues: median card, wrong half, right half but not middle.
  const cues = [5, 8, 1].map((id) => T.cueQuartile("q1", id).en);
  assert.match(cues[0], /is the median/);
  assert.match(cues[1], /is in the upper half/);
  assert.match(cues[2], /but is it the middle/);
  for (const c of cues) assert.doesNotMatch(c, /Q1 = 8/);
});
