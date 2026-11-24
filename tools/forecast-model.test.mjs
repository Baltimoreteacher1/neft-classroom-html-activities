// Forecast Engine model: forecasts, intervals, backtest, groups, scenarios and
// analysis, driven on small classes whose answers are known by construction.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const sandbox = { self: {} };
for (const f of ["stats.js", "model.js"]) {
  vm.runInNewContext(
    readFileSync(new URL(`../teacher-tools/forecast-engine/${f}`, import.meta.url), "utf8"),
    sandbox,
  );
}
const S = sandbox.self.NFEStats;
const M = sandbox.self.NFEModel;

let seq = 0;
const ev = (student, standard, pct, date) => ({
  id: `e${++seq}`,
  student,
  standard,
  pct,
  date,
  assessment: "Check",
});
const mk = (rows, students = ["A", "B", "C", "D"], codes = ["X"]) => ({
  students: students.map((id) => ({ id, name: id, tags: "" })),
  standards: codes.map((code) => ({ code, desc: code })),
  evidence: rows,
});
const day = (i) => new Date(Date.UTC(2026, 0, 1 + i * 7)).toISOString().slice(0, 10);
const series = (ys) => M.indexEvidence(ys.map((y, i) => ev("A", "X", y, day(i)))).get("A", "X");
const near = (a, b, tol, label) =>
  assert.ok(Math.abs(a - b) <= tol, `${label}: expected ${b} ± ${tol}, got ${a}`);

test("a steady 80% student is on track for 70 and the range brackets the forecast", () => {
  const f = M.forecastSeries(series([80, 81, 79, 80, 80]), {
    method: "average",
    borrow: 0,
    target: 70,
  });
  near(f.proj, 80, 0.5, "projection");
  assert.ok(f.lo < f.proj && f.proj < f.hi);
  assert.ok(f.prob > 0.8, `prob ${f.prob}`);
  assert.equal(f.status, "on");
});

test("the average method equals the hand-computed mean and t interval", () => {
  const ys = [60, 70, 80];
  const f = M.forecastSeries(series(ys), { method: "average", borrow: 0, level: 0.9, target: 70 });
  assert.equal(f.proj, 70);
  // sample sd 10; pooled prior sd 12 is blended in with 3 virtual scores:
  // s2 = (2*100 + 3*144) / 5 = 126.4 ; se = sqrt(126.4 * (1 + 1/3)) ; df 5.
  // (With a single student the class prior falls back to 12.)
  const se = Math.sqrt(126.4 * (1 + 1 / 3));
  near(f.se, se, 1e-9, "standard error");
  near(f.hi - f.proj, S.tCrit(0.9, 5) * se, 0.06, "half width");
  near(f.prob, 0.5, 1e-9, "target at the middle is a coin flip");
});

test("more scores and calmer scores make the range narrower", () => {
  const few = M.forecastSeries(series([70, 90]), { method: "average", borrow: 0 });
  const many = M.forecastSeries(series([78, 80, 82, 80, 79, 81, 80, 80]), {
    method: "average",
    borrow: 0,
  });
  assert.ok(many.hi - many.lo < few.hi - few.lo);
});

test("trend method continues an upward line and recent method follows the newest scores", () => {
  const ys = [40, 50, 60, 70, 80];
  const trend = M.forecastSeries(series(ys), { method: "trend", borrow: 0, horizon: 7 });
  near(trend.proj, 90, 1.5, "trend carries one week on");
  assert.equal(trend.trend, "up");
  near(trend.slope, 10, 0.05, "slope per week");
  const recent = M.forecastSeries(series(ys), { method: "recent", halfLife: 7, borrow: 0 });
  const avg = M.forecastSeries(series(ys), { method: "average", borrow: 0 });
  assert.ok(recent.proj > avg.proj, "recent weights the newest higher scores more");
  assert.ok(trend.proj > recent.proj);
});

test("trend never moves a forecast more than the cap, and falls back with 2 scores", () => {
  const steep = M.forecastSeries(series([10, 40, 70, 100]), {
    method: "trend",
    borrow: 0,
    horizon: 365,
  });
  assert.ok(steep.proj <= 100 && steep.hi <= 100);
  const two = M.forecastSeries(series([50, 60]), { method: "trend" });
  assert.equal(two.method, "recent");
  assert.ok(two.steps.some((s) => /at least 3 scores/.test(s)));
});

test("one score does not decide a forecast: it leans on the class and keeps a wide range", () => {
  const rows = [];
  const spread = { B: 60, C: 70, D: 80, E: 65 };
  Object.entries(spread).forEach(([id, m]) => {
    [m + 9, m - 8, m + 1].forEach((y, i) => rows.push(ev(id, "X", y, day(i))));
  });
  rows.push(ev("A", "X", 20, day(2)));
  const state = mk(rows, ["A", "B", "C", "D", "E"]);
  const ix = M.indexEvidence(state.evidence);
  const priors = M.priorsFor(state, ix);
  const f = M.forecastSeries(ix.get("A", "X"), { method: "average", borrow: 1 }, priors.X);
  assert.ok(f.proj > 20 && f.proj < 70, `leans toward class: ${f.proj}`);
  assert.ok(f.shrink > 0.1);
  assert.ok(f.hi - f.lo > 20, "wide range with a single score");
  const off = M.forecastSeries(ix.get("A", "X"), { method: "average", borrow: 0 }, priors.X);
  assert.equal(off.proj, 20);
});

test("no evidence gives an empty, safe forecast", () => {
  const f = M.forecastSeries([], {});
  assert.equal(f.n, 0);
  assert.equal(f.status, "none");
});

test("steps explain the forecast in plain words with the real numbers", () => {
  const f = M.forecastSeries(series([60, 70, 80]), { method: "average", target: 75, level: 0.9 });
  const text = f.steps.join(" ");
  assert.match(text, /Found 3 scores: 60, 70, 80/);
  assert.match(text, /90% confidence/);
  assert.match(text, /Chance of reaching 75%/);
});

test("dates out of order are sorted, and bad dates fall back to entry order", () => {
  const rows = [
    ev("A", "X", 90, "2026-03-01"),
    ev("A", "X", 50, "2026-01-01"),
    ev("A", "X", 70, "2026-02-01"),
  ];
  const s = M.indexEvidence(rows).get("A", "X");
  assert.deepEqual([...s.map((r) => r.pct)], [50, 70, 90]);
  const bad = M.indexEvidence([ev("A", "X", 1, "soon"), ev("A", "X", 2, "later")]).get("A", "X");
  assert.deepEqual([...bad.map((r) => r.pct)], [1, 2]);
  assert.deepEqual([...bad.map((r) => r.t)], [0, 7]);
});

function trendingClass() {
  const rows = [];
  const base = { A: 40, B: 55, C: 65, D: 75, E: 85, F: 60 };
  Object.entries(base).forEach(([id, b]) => {
    for (let i = 0; i < 5; i += 1)
      rows.push(ev(id, "X", b + i * 4 + ((i * 7 + id.charCodeAt(0)) % 5), day(i)));
  });
  return mk(rows, Object.keys(base));
}

test("backtest scores every method on hidden scores and reports interval calibration", () => {
  const bt = M.backtest(trendingClass(), { level: 0.9 });
  assert.equal(bt.cases, 6);
  assert.ok(bt.enough);
  for (const m of ["average", "recent", "trend"]) {
    assert.ok(bt.methods[m].mae >= 0 && bt.methods[m].coverage >= 0 && bt.methods[m].coverage <= 1);
  }
  assert.equal(bt.best, "trend", "a class that steadily improves is best predicted by the trend");
  assert.ok(bt.skill > 0);
});

test("backtest never uses the hidden score to build its own forecast", () => {
  const state = trendingClass();
  const before = JSON.stringify(state);
  M.backtest(state, {});
  assert.equal(JSON.stringify(state), before, "state is untouched");
});

test("class grid, groups and the resource plan agree with each other", () => {
  const state = trendingClass();
  const grid = M.classGrid(state, { target: 80, method: "average" });
  assert.equal(grid.rows.length, 6);
  const groups = M.supportGroups(grid, 80);
  const kids = groups[0].kids.map((k) => k.student.id);
  assert.ok(kids.includes("A") && !kids.includes("E"));
  assert.deepEqual(
    groups[0].kids.map((k) => k.f.proj),
    groups[0].kids.map((k) => k.f.proj).sort((a, b) => a - b),
    "weakest first",
  );
  const plan = M.resourcePlan(groups, 80, { cap: 1, minutes: 15, slots: 2 });
  assert.equal(plan.planned.length, 2);
  assert.ok(plan.planned.every((s) => s.kids.length <= 1));
  assert.equal(plan.minutesUsed, 30);
  assert.ok(plan.studentsCovered <= plan.studentsNeeding);
  assert.ok(plan.minutesWanted >= plan.minutesUsed);
  assert.ok(plan.planned[0].need >= plan.planned[1].need, "biggest need first");
});

const params = (over = {}) => ({
  standard: "X",
  target: 70,
  weeks: 4,
  gain: 0,
  scope: "below",
  participation: 1,
  goal: 80,
  seed: 11,
  sims: 1500,
  cap: 3,
  minutesPerSession: 15,
  sessionsPerWeek: 3,
  ...over,
});

test("a scenario with no boost matches the baseline exactly", () => {
  const r = M.simulate(trendingClass(), params({ gain: 0 }));
  assert.equal(r.base.mean, r.scen.mean);
  assert.equal(r.delta.mean, 0);
});

test("a bigger boost never lowers results, and uses the same random draws as the baseline", () => {
  const state = trendingClass();
  const small = M.simulate(state, params({ gain: 5 }));
  const big = M.simulate(state, params({ gain: 15 }));
  assert.ok(small.delta.mean >= 0);
  assert.ok(big.delta.mean >= small.delta.mean);
  assert.equal(small.base.mean, big.base.mean, "baseline is identical across scenarios");
  assert.ok(big.delta.p10 >= 0, "paired draws: the boost can only help");
  assert.ok(big.goalProb >= big.baseGoalProb);
});

test("scenarios repeat exactly for the same seed and differ for another", () => {
  const state = trendingClass();
  const a = M.simulate(state, params({ gain: 8 }));
  const b = M.simulate(state, params({ gain: 8 }));
  assert.equal(a.scen.mean, b.scen.mean);
  const c = M.simulate(state, params({ gain: 8, seed: 12 }));
  assert.notEqual(a.scen.mean, c.scen.mean);
});

test("scenario baseline agrees with the forecast probabilities", () => {
  const state = trendingClass();
  const grid = M.classGrid(state, { target: 70, horizon: 28 });
  const expected = S.mean(grid.rows.map((r) => r.cells[0].f.prob)) * 100;
  const r = M.simulate(state, params({ gain: 0, sims: 4000 }));
  near(r.base.mean, expected, 3, "simulated class rate vs average forecast probability");
});

test("scope limits who is lifted, and resource cost follows group size", () => {
  const state = trendingClass();
  const below = M.simulate(state, params({ gain: 10, scope: "below" }));
  const all = M.simulate(state, params({ gain: 10, scope: "all" }));
  assert.ok(below.targeted < all.targeted);
  assert.equal(all.targeted, 6);
  const small = M.simulate(state, params({ gain: 10, scope: "all", cap: 2 }));
  assert.ok(small.minutes > all.minutes, "smaller groups need more sessions");
  assert.equal(all.minutes, Math.ceil(6 / 3) * 15 * 3 * 4);
});

test("analysis helpers", () => {
  const state = trendingClass();
  const sums = M.standardSummaries(state, { target: 70 });
  assert.equal(sums[0].n, 6);
  assert.ok(sums[0].lo < sums[0].mean && sums[0].mean < sums[0].hi);
  assert.equal(sums[0].atTarget.n, undefined);
  const g = M.growth(state, "X");
  assert.equal(g.length, 5);
  assert.ok(g[4].mean > g[0].mean);
  assert.equal(M.coverage(state).pct, 100);
});

test("correlation and standard comparison on built data", () => {
  const rows = [];
  ["A", "B", "C", "D", "E", "F"].forEach((id, i) => {
    rows.push(ev(id, "X", 40 + i * 10, day(0)), ev(id, "Y", 45 + i * 10, day(0)));
  });
  const state = mk(rows, ["A", "B", "C", "D", "E", "F"], ["X", "Y"]);
  const c = M.correlation(state, "X", "Y");
  near(c.r.r, 1, 1e-9, "r");
  const cmp = M.compareStandards(state, "X", "Y");
  near(cmp.test.diff, -5, 1e-9, "Y is 5 points higher everywhere");
});

test("outliers flag a typo but not an ordinary dip", () => {
  const rows = [75, 78, 72, 12, 76].map((y, i) => ev("A", "X", y, day(i)));
  rows.push(...[70, 73, 71, 66, 74].map((y, i) => ev("B", "X", y, day(i))));
  const found = M.outliers(mk(rows, ["A", "B"]));
  assert.equal(found.length, 1);
  assert.equal(found[0].student, "A");
  assert.equal(found[0].pct, 12);
});

test("support-group comparison needs enough students and reports effect size", () => {
  const rows = [];
  const names = ["A", "B", "C", "D", "E", "F", "G", "H"];
  names.forEach((id, i) => rows.push(ev(id, "X", 50 + (i % 2) * 2 + (i < 4 ? 0 : 25), day(0))));
  const state = mk(rows, names);
  state.students.forEach((s, i) => {
    s.tags = i < 4 ? "ML" : "";
  });
  assert.deepEqual([...M.tagList(state)], ["ML"]);
  const res = M.compareTag(state, "ML", "X");
  assert.ok(res.test && res.test.diff < -20 && res.g.g < -2);
  const tiny = mk(rows.slice(0, 3), ["A", "B", "C"]);
  tiny.students[0].tags = "ML";
  assert.equal(M.compareTag(tiny, "ML", "X").test, null);
});
