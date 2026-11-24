// Forecast Engine statistics library: every formula is checked against a value
// worked out independently (textbook tables / hand arithmetic), never against
// the library's own output.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// The library is a browser/worker script (the package is ESM, so `module` does
// not exist): run it exactly as a worker would, with a bare `self`.
const sandbox = { self: {} };
vm.runInNewContext(
  readFileSync(new URL("../teacher-tools/forecast-engine/stats.js", import.meta.url), "utf8"),
  sandbox,
);
const S = sandbox.self.NFEStats;

const near = (actual, expected, tol, label) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ${expected} ± ${tol}, got ${actual}`,
  );

test("normal distribution matches table values", () => {
  near(S.normPpf(0.975), 1.959964, 1e-5, "z(.975)");
  near(S.normPpf(0.5), 0, 1e-9, "z(.5)");
  near(S.normPpf(0.001), -3.090232, 1e-4, "z(.001)");
  near(S.normCdf(1.96), 0.975, 1e-5, "Phi(1.96)");
  near(S.normCdf(-1), 0.158655, 1e-5, "Phi(-1)");
});

test("t distribution matches table critical values", () => {
  near(S.tPpf(0.975, 1), 12.7062, 1e-3, "t(.975,1)");
  near(S.tPpf(0.975, 5), 2.5706, 1e-3, "t(.975,5)");
  near(S.tPpf(0.975, 30), 2.0423, 1e-3, "t(.975,30)");
  near(S.tPpf(0.95, 10), 1.8125, 1e-3, "t(.95,10)");
  near(S.tCrit(0.9, 10), 1.8125, 1e-3, "tCrit(.9,10)");
  near(S.tCdf(2.5706, 5), 0.975, 1e-4, "tCdf round trip");
  near(S.tCdf(0, 7), 0.5, 1e-12, "tCdf(0)");
});

test("descriptive statistics", () => {
  const xs = [2, 4, 4, 4, 5, 5, 7, 9];
  near(S.mean(xs), 5, 1e-12, "mean");
  near(S.sd(xs), 2.13809, 1e-5, "sample sd");
  near(S.quantile([1, 2, 3, 4], 0.5), 2.5, 1e-12, "median");
  near(S.quantile([1, 2, 3, 4, 5], 0.25), 2, 1e-12, "q1");
  assert.ok(Number.isNaN(S.mean([])));
  assert.ok(Number.isNaN(S.sd([3])));
});

test("simple regression equals the hand calculation", () => {
  // x 1..5, y 2 4 5 4 5: slope .6, intercept 2.2, SSE 2.4, sigma sqrt(.8)
  const reg = S.linReg([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
  near(reg.slope, 0.6, 1e-12, "slope");
  near(reg.intercept, 2.2, 1e-12, "intercept");
  near(reg.r2, 0.6, 1e-12, "r2");
  near(reg.sigma, Math.sqrt(0.8), 1e-12, "sigma");
  near(reg.sePredict(3), Math.sqrt(0.8) * Math.sqrt(1 + 1 / 5), 1e-12, "se at the mean");
  near(reg.predict(6), 5.8, 1e-12, "predict");
  assert.equal(S.linReg([1, 1, 1], [1, 2, 3]), null, "no spread in x has no line");
});

test("correlation", () => {
  const perfect = S.pearson([1, 2, 3, 4], [2, 4, 6, 8]);
  near(perfect.r, 1, 1e-9, "perfect r");
  const neg = S.pearson([1, 2, 3, 4, 5], [10, 8, 7, 3, 1]);
  assert.ok(neg.r < -0.95 && neg.hi95 <= 1 && neg.lo95 < neg.r);
  assert.equal(S.pearson([1, 2], [1, 2]), null, "needs 3 pairs");
});

test("group comparison", () => {
  // g = d * (1 - 3/(4(n1+n2)-9)) = -2 * 0.8
  near(S.hedgesG([1, 2, 3], [3, 4, 5]).g, -1.6, 1e-12, "Hedges g");
  const w = S.welch([10, 12, 14, 16, 18], [10, 12, 14, 16, 18]);
  near(w.diff, 0, 1e-12, "identical groups differ by 0");
  near(w.p, 1, 1e-6, "identical groups p = 1");
  const apart = S.welch([50, 52, 54, 51, 53], [80, 82, 84, 81, 83]);
  assert.ok(apart.p < 0.001 && apart.hi < 0, "clearly different groups");
  const pt = S.pairedT([5, 6, 7, 8], [4, 5, 6, 6]);
  near(pt.diff, 1.25, 1e-12, "paired mean difference");
  // d = 1,1,1,2 -> sd .5; se .25; t = 5; df 3; two-sided p ~ .0154
  near(pt.t, 5, 1e-9, "paired t");
  near(pt.p, 0.0154, 5e-4, "paired p");
});

test("intervals", () => {
  const w = S.wilson(5, 10, 0.95);
  near(w.lo, 0.2366, 1e-3, "wilson lo");
  near(w.hi, 0.7634, 1e-3, "wilson hi");
  const ci = S.meanCI([2, 4, 4, 4, 5, 5, 7, 9], 0.95);
  // mean 5, sd 2.13809, n 8, t(.975,7)=2.3646 -> half 1.7875
  near(ci.hi - ci.mean, 1.7875, 2e-3, "mean CI half-width");
});

test("histogram keeps every value, including the maximum", () => {
  const bins = S.histogram([0, 9, 10, 55, 100], 10, 0, 100);
  assert.equal(bins.length, 10);
  assert.equal(S.sum(bins.map((b) => b.count)), 5);
  assert.equal(bins[9].count, 1);
});

test("box statistics flag outliers with the 1.5 IQR rule", () => {
  const b = S.boxStats([60, 62, 64, 66, 68, 70, 12]);
  assert.deepEqual(b.outliers, [12]);
  assert.equal(b.whiskerLo, 60);
});

test("seeded random numbers repeat exactly and look normal", () => {
  const a = S.mulberry32(42);
  const b = S.mulberry32(42);
  for (let i = 0; i < 5; i += 1) assert.equal(a(), b());
  const rng = S.mulberry32(7);
  const draws = Array.from({ length: 20000 }, () => S.randNormal(rng));
  near(S.mean(draws), 0, 0.03, "normal draws mean");
  near(S.sd(draws), 1, 0.03, "normal draws sd");
  const t = Array.from({ length: 20000 }, () => S.randT(rng, 5));
  // var of t(5) = 5/3
  near(S.variance(t), 5 / 3, 0.12, "t(5) variance");
});
