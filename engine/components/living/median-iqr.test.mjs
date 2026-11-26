import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMedianIqrPlay, validateMedianIqr } from "./median-iqr.js";
import { fiveNum, iqrChoices, medianIqrCopy } from "./median-iqr-model.js";

test("rejects bad median-iqr configs", () => {
  for (const bad of [
    null,
    {},
    { values: [1, 2, 3] }, // too short
    { values: [5, 5, 5, 5, 5, 5] }, // iqr === 0
  ]) {
    assert.equal(validateMedianIqr(bad), null, JSON.stringify(bad));
    assert.equal(buildMedianIqrPlay(bad), null, JSON.stringify(bad));
  }
});

test("recomputes 2-5 (Class A math scores: Q1=73, Med=80, Q3=86, IQR=13, Range=28)", () => {
  const cfg = {
    values: [62, 68, 72, 74, 76, 79, 81, 83, 85, 87, 88, 90],
    unit: { en: "points", es: "puntos" },
  };
  const v = validateMedianIqr(cfg);
  assert.ok(v);
  const s = fiveNum(v.values);
  assert.equal(s.min, 62);
  assert.equal(s.q1, 73);
  assert.equal(s.med, 80);
  assert.equal(s.q3, 86);
  assert.equal(s.max, 90);
  assert.equal(s.iqr, 13);
  assert.equal(s.range, 28);
  const copy = medianIqrCopy(v);
  assert.match(copy.printSummary.en, /13/);
  assert.match(copy.outlier.say.es, /el total/);
  const opts = iqrChoices(v.values);
  assert.equal(opts.find((o) => o.correct).value, 13);
  assert.ok(opts.some((o) => o.kind === "range" && o.value === 28));
  const play = buildMedianIqrPlay(cfg);
  assert.equal(play.scenes.length, 5);
  assert.ok(play.scenes.every((sc) => sc.askChild?.en && sc.askChild?.es));
});
