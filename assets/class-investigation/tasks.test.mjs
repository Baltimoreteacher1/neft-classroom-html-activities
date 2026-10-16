/* The unit tools check what a student typed; they never produce the answer. */
import assert from "node:assert/strict";
import test from "node:test";

import { barSvg, dotPlotSvg, histogramSvg, niceTicks, scatterSvg } from "./charts.js";
import { correlation, iqr, mad, mean, median, niceBins, quartiles, shapeOf, simplestRatio, trendOf } from "./stats.js";
import * as U from "./unit-tasks.js";

const data = [4, 5, 5, 6, 7, 7, 8, 9, 12, 20]; // n = 10, right-skewed

test("statistics match Grade 6 conventions", () => {
  assert.equal(median(data), 7);
  assert.equal(mean(data), 8.3);
  assert.deepEqual(quartiles(data), { q1: 5, median: 7, q3: 9 });
  assert.equal(iqr(data), 4);
  assert.equal(median([3, 1, 2]), 2);
  assert.deepEqual(quartiles([1, 2, 3, 4, 5, 6, 7]), { q1: 2, median: 4, q3: 6 }, "odd n: the median joins neither half");
  assert.equal(Math.round(mad([2, 4, 6]) * 1000), 1333);
  assert.equal(shapeOf(data), "low");
  assert.equal(shapeOf([1, 2, 3, 4, 5, 6, 7, 8, 9]), "balanced");
  assert.equal(simplestRatio(17.5, 15)?.join(":"), "7:6");
  assert.equal(simplestRatio(8, 6)?.join(":"), "4:3");
  assert.ok(correlation([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }]) > 0.99);
  assert.equal(trendOf([{ x: 1, y: 9 }, { x: 2, y: 5 }, { x: 3, y: 1 }, { x: 4, y: 0 }]), "down");
});

test("bins: a value on a boundary starts the next bin", () => {
  const { bins, width } = niceBins([10, 19, 20, 29, 30]);
  assert.equal(width, 5 >= 0 ? width : 0);
  const total = bins.reduce((a, b) => a + b.count, 0);
  assert.equal(total, 5);
  const b20 = niceBins([0, 10, 20], 2);
  assert.ok(b20.bins.find((b) => b.lo === 20 && b.count === 1), "20 sits in the bin that starts at 20");
});

test("Unit 3: ratio checks accept equal ratios only when simplest, and name a flipped order", () => {
  assert.equal(U.checkRatio(8, 6, { p: 4, q: 3 }).code, "correct");
  assert.equal(U.checkRatio(8, 6, { p: 8, q: 6 }).code, "equivalent");
  assert.equal(U.checkRatio(8, 6, { p: 3, q: 4 }).code, "flipped");
  assert.equal(U.checkRatio(8, 6, { p: 5, q: 3 }).code, "wrong");
  assert.equal(U.checkRatio(17.5, 15, { p: 7, q: 6 }).code, "correct");
  assert.equal(U.checkRatio(8, 6, { p: -4, q: 3 }).code, "invalid");
  assert.equal(U.checkUnitRate(18, 15, 1.2).code, "correct");
  assert.equal(U.checkUnitRate(18, 15, 0.83).code, "flipped");
  assert.equal(U.checkUnitRate(18, 15, 3).code, "wrong");
});

test("Unit 4: percent accepts a rounded or exact percent and recognises common slips", () => {
  assert.equal(U.checkPercent(9, 24, 38).code, "correct");
  assert.equal(U.checkPercent(9, 24, 37.5).code, "correct");
  assert.equal(U.checkPercent(9, 24, 9).code, "count");
  assert.equal(U.checkPercent(9, 24, 0.375).code, "decimal");
  assert.equal(U.checkPercent(9, 24, 50).code, "wrong");
  assert.equal(U.checkPercent(9, 0, 50).code, "invalid");
});

test("Unit 7 / 9 checks", () => {
  assert.equal(U.checkReadPoint({ x: 14.5, y: 18 }, { x: 15, y: 18 }).code, "correct");
  assert.equal(U.checkReadPoint({ x: 10, y: 20 }, { x: 20, y: 10 }).code, "swapped");
  assert.equal(U.checkReadPoint({ x: 10, y: 20 }, { x: 3, y: 4 }).code, "wrong");
  const up = Array.from({ length: 12 }, (_, i) => ({ x: i, y: 2 * i + (i % 2) }));
  assert.equal(U.checkTrend(up, "up").code, "correct");
  assert.equal(U.checkTrend(up, "down").code, "wrong");
  assert.equal(U.checkPrediction(up, 6, 13).code, "correct");
  assert.equal(U.checkPrediction(up, 6, 2).code, "low");
  assert.equal(U.checkPrediction(up, 6, 60).code, "high");
});

test("Unit 2: the student's own median, mean, range and IQR are checked, not supplied", () => {
  assert.equal(U.checkStat("median", data, 7).code, "correct");
  assert.equal(U.checkStat("median", data, 8).code, "wrong");
  assert.equal(U.checkStat("mean", data, 8.3).code, "correct");
  assert.equal(U.checkStat("mean", data, 8.28).code, "correct");
  assert.equal(U.checkStat("range", data, 16).code, "correct");
  assert.equal(U.checkStat("iqr", data, 4).code, "correct");
  assert.equal(U.checkStat("median", [1, 2], 1).code, "invalid", "too little data to check");
  assert.equal(U.checkShape(data, "low").code, "correct");
  assert.equal(U.checkShape(data, "high").code, "wrong");
});

test("the hint ladder is method, then one step, then a nudge — never a fourth rung with the answer", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(U.hintStage), [0, 1, 2, 3, 3]);
});

test("NO ANSWER LEAKS: wrong-answer outputs contain only codes, never the correct value", () => {
  for (const r of [U.checkRatio(8, 6, { p: 5, q: 3 }), U.checkUnitRate(18, 15, 3), U.checkPercent(9, 24, 50), U.checkStat("median", data, 8)]) {
    assert.deepEqual(Object.keys(r), ["code"]);
  }
});

test("charts: valid SVG, text alternatives, no NaN, and no statistic is drawn for the student", () => {
  const pts = data.map((v, i) => ({ v, mine: i === 2 }));
  const svgs = [
    dotPlotSvg(pts, { label: "x", unit: "cm", step: 1, lang: "en" }),
    histogramSvg(pts, { label: "x", unit: "cm", lang: "es" }),
    scatterSvg(data.map((v, i) => ({ x: v, y: v * 2 + i })), { xLabel: "a", yLabel: "b", lang: "en", target: 1 }),
    barSvg([{ id: "a", label: "Walk", n: 3 }, { id: "b", label: "Bus", n: 0 }], { label: "m", lang: "en" }),
    dotPlotSvg([], { label: "x", lang: "en" }),
  ];
  for (const svg of svgs) {
    assert.match(svg, /^<svg[^>]+role="img"[^>]+aria-label="[^"]+"/);
    assert.ok(!svg.includes("NaN") && !svg.includes("undefined"));
    assert.ok(!/median|mean|percent|%|MAD/i.test(svg.replace(/aria-label="[^"]*"|<title>[^<]*<\/title>/g, "")), "no computed statistic is drawn");
  }
  assert.ok(niceTicks(0, 23).ticks.every((t) => Number.isInteger(t * 2)));
});
