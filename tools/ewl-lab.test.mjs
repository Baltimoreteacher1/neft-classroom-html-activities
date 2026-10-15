// Math Reality Lab: investigations data, exact simulation, Executable Discourse, transfer problems, notebook text.
//   node tools/ewl-lab.test.mjs
// The expected numbers below are worked by hand here, not read back from the code under test.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadEwl } from "./lib/ewl-vm.mjs";

const ctx = loadEwl({
  only: [
    "rational.js",
    "state-store.js",
    "reasoning.js",
    "ui.js",
    "lab-registry.js",
    "lab-expr.js",
    "lab-sim.js",
    "lab-tasks.js",
    "lab-validate.js",
    "discourse.js",
    "discourse-text.js",
    "notebook.js",
  ],
});
const { EWL } = ctx;
const { Reason, LabExpr, LabSim, LabTasks, LabValidate, Discourse, DiscourseText, Notebook } = EWL;
const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const doc = read("data/ewl/investigations.json");
const manifest = read("data/curriculum-launch-manifest.json").lessons;
const standards = read("data/ccss-standards.json").standards;
const labs = read("data/learning-labs.json").labs.map((l) => l.id);
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
const clone = (x) => JSON.parse(JSON.stringify(x));
const validateCtx = { lessons: manifest, standards, labs };
const inv = (id) => doc.investigations.find((i) => i.id === id);
const tpl = (id) => doc.discourseTemplates.find((t) => t.id === id);

// ---- the data validates, and the validator rejects corrupted data (negative controls) --------------------------------
assert.equal(LabValidate.validate(doc, validateCtx).length, 0);
assert.ok(doc.investigations.length >= 8);
for (const required of [
  "discount-stack",
  "equivalent-ratios",
  "unit-price",
  "percent-trap",
  "fraction-bottom",
  "division-smaller",
  "volume-doubling",
  "balance",
  "mean-vs-median",
]) {
  assert.ok(inv(required), `required investigation ${required}`);
}
for (const i of doc.investigations) {
  assert.ok(EWL.ID_RE.test(EWL.id("lab", i.id)));
  assert.notEqual(i.unit, 10);
}
const bad = (mutate, expect) => {
  const d = clone(doc);
  mutate(d);
  const p = LabValidate.validate(d, validateCtx);
  assert.ok(
    p.some((m) => m.includes(expect)),
    `validator should report "${expect}", got ${JSON.stringify(p.slice(0, 3))}`,
  );
};
bad((d) => (d.investigations[0].lessons = ["5-8"]), "is not in unit");
bad((d) => (d.investigations[0].lessons = ["4-99"]), "not in the launch manifest");
bad((d) => (d.investigations[0].standard = "6.XX.9"), "does not exist");
bad((d) => (d.investigations[0].unit = 10), "Unit 10");
bad((d) => delete d.investigations[0].titleEs, "titleEs");
bad((d) => (d.investigations[0].id = "Bad Id"), "not a valid activity id");
bad((d) => (d.investigations[1].id = d.investigations[0].id), "repeated id");
bad((d) => (d.investigations[0].claim.test = ["eq", 1, 1]), "no counterexample");
bad((d) => (d.investigations[0].steps[0].expr = ["exec", "price"]), "unknown operator");
bad((d) => (d.investigations[0].steps[0].expr = ["mul", "nope", 2]), "unknown variable");
bad(
  (d) =>
    d.investigations[0].prediction.options.push(clone(d.investigations[0].prediction.options[2])),
  "exactly one option",
);
bad((d) => (d.investigations[0].discourse = "missing"), "discourse template");
bad((d) => (d.investigations[0].transfer.task = "nope"), "unknown task");
bad((d) => (d.investigations[0].sweep.axes.p1 = [500]), "bad value");
bad((d) => (d.discourseTemplates[0].vars.p1.values = ["x"]), "values must be numbers");
bad((d) => (d.investigations[0].relates.labs = ["nope-lab"]), "relates.labs");

// ---- expression language: exact, closed, no eval --------------------------------------------------------------------
assert.equal(
  LabExpr.eval(["sub", 1, ["mul", ["sub", 1, "20%"], ["sub", 1, "10%"]]], {}).percent(),
  "28%",
);
assert.equal(LabExpr.eval(["median", 8, 9, 10, 11, 12, 60], {}).frac(), "21/2");
assert.equal(LabExpr.eval(["mean", 8, 9, 10, 11, 12, 60], {}).frac(), "55/3");
assert.equal(LabExpr.eval(["sqrt", ["add", ["pow", 5, 2], ["pow", 12, 2]]], {}).frac(), "13");
assert.throws(
  () => LabExpr.eval(["sqrt", 2], {}),
  (e) => e.exprKind === "inexact",
);
assert.throws(
  () => LabExpr.eval(["div", 1, 0], {}),
  (e) => e.name === "RangeError",
);
assert.throws(() => LabExpr.eval(["constructor", 1], {}), /unknown operator/);
assert.throws(() => LabExpr.eval("__proto__", {}), /unknown variable/);
assert.throws(() => LabExpr.eval(["add", "x", 1], {}), /unknown variable/);
assert.throws(() => LabExpr.eval(["lt", true, 1], {}));
assert.ok(LabExpr.validate(["add", ["add", ["add", 1, 2], 3]], []).length === 0);
assert.ok(LabExpr.validate(deep(40), []).some((m) => m.includes("deeply")));
function deep(n) {
  return n === 0 ? 1 : ["neg", deep(n - 1)];
}

// ---- independent recomputation of each experiment ---------------------------------------------------------------------
// A tiny fraction type that shares no code with EWL.Rat.
const gcd = (a, b) => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const Q = (n, d = 1n) => {
  n = BigInt(n);
  d = BigInt(d);
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
};
const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => Q(a.n * b.n, a.d * b.d);
const div = (a, b) => Q(a.n * b.d, a.d * b.n);
const eq = (a, b) => a.n === b.n && a.d === b.d;
const cmp = (a, b) => (a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0);
const num = (x) => Q(x);
const pct = (x) => Q(x, 100n);
const _frac = (q) => (q.d === 1n ? String(q.n) : `${q.n}/${q.d}`);

const runCase = (id, c) => LabSim.run(inv(id), c);
const val = (id, c, key) => runCase(id, c).values[key].frac();

// discount: $100, 20% then 10%: pays 72, total 28/100 = 7/25, naive 30% = 3/10
assert.equal(val("discount-stack", { price: 100, p1: 20, p2: 10 }, "after2"), "72");
assert.equal(val("discount-stack", { price: 100, p1: 20, p2: 10 }, "savedPct"), "7/25");
assert.equal(val("discount-stack", { price: 100, p1: 20, p2: 10 }, "naive"), "3/10");
// $250, 30% then 20%: 250 x 0.7 = 175, x 0.8 = 140; saved 110/250 = 11/25 (44%)
assert.equal(val("discount-stack", { price: 250, p1: 30, p2: 20 }, "after2"), "140");
assert.equal(val("discount-stack", { price: 250, p1: 30, p2: 20 }, "savedPct"), "11/25");
// equivalent ratios: 2:3 add 1 -> 3:4 (3/4 vs 2/3: not equal); multiply by 3 -> 6:9 (same)
assert.equal(runCase("equivalent-ratios", { a: 2, b: 3, k: 1, how: "add" }).holds, false);
assert.equal(val("equivalent-ratios", { a: 2, b: 3, k: 1, how: "add" }, "ratio1"), "3/4");
assert.equal(runCase("equivalent-ratios", { a: 2, b: 3, k: 3, how: "mult" }).holds, true);
assert.equal(runCase("equivalent-ratios", { a: 4, b: 4, k: 3, how: "add" }).holds, true);
// unit price: A 3 for $3 = $1 each; B 8 for $4 = $0.50 each. Tag winner A (3 < 4); better buy B.
assert.equal(val("unit-price", { qa: 3, pa: 3, qb: 8, pb: 4 }, "ua"), "1");
assert.equal(val("unit-price", { qa: 3, pa: 3, qb: 8, pb: 4 }, "ub"), "1/2");
assert.equal(val("unit-price", { qa: 3, pa: 3, qb: 8, pb: 4 }, "tagWinner"), "1");
assert.equal(val("unit-price", { qa: 3, pa: 3, qb: 8, pb: 4 }, "bestBuy"), "2");
// percent trap: $80 up 50% = 120, down 50% = 60, 60/80 = 3/4. $80 at 10%: 88 then 79.20 = 396/5
assert.equal(val("percent-trap", { start: 80, p: 50 }, "down"), "60");
assert.equal(val("percent-trap", { start: 80, p: 50 }, "finalPct"), "3/4");
assert.equal(val("percent-trap", { start: 80, p: 10 }, "down"), "396/5");
// fractions: 1/8 vs 1/2: 1/2 bigger, so "bigger bottom = bigger" fails; 3/4 vs 1/2 holds
assert.equal(runCase("fraction-bottom", { n1: 1, d1: 8, n2: 1, d2: 2 }).holds, false);
assert.equal(runCase("fraction-bottom", { n1: 3, d1: 4, n2: 1, d2: 2 }).holds, true);
// division: 3 / (1/2) = 6; 6 / 2 = 3 (smaller); 6 / (2/2) = 6 (not smaller)
assert.equal(val("division-smaller", { a: 3, bn: 1, bd: 2 }, "q"), "6");
assert.equal(runCase("division-smaller", { a: 6, bn: 2, bd: 1 }).holds, true);
assert.equal(runCase("division-smaller", { a: 6, bn: 2, bd: 2 }).holds, false);
// volume: 2x3x4 = 24; doubled edges 4x6x8 = 192 = 8 x 24; tripled: 6x9x12 = 648 = 27 x 24
assert.equal(val("volume-doubling", { l: 2, w: 3, h: 4, k: 2 }, "v1"), "192");
assert.equal(val("volume-doubling", { l: 2, w: 3, h: 4, k: 2 }, "times"), "8");
assert.equal(val("volume-doubling", { l: 2, w: 3, h: 4, k: 3 }, "times"), "27");
assert.equal(val("volume-doubling", { l: 2, w: 3, h: 4, k: "0.5" }, "times"), "1/8");
// balance: x=7, a=5 -> both sides 12. subtract 3 from left only: 9 vs 12. both: 9 vs 9. multiply left by 3: 36 vs 12.
assert.equal(val("balance", { x: 7, a: 5, k: 3, move: "sub-left" }, "L1"), "9");
assert.equal(val("balance", { x: 7, a: 5, k: 3, move: "sub-left" }, "R1"), "12");
assert.equal(runCase("balance", { x: 7, a: 5, k: 3, move: "sub-both" }).holds, true);
assert.equal(val("balance", { x: 7, a: 5, k: 3, move: "mult-left" }, "L1"), "36");
// mean vs median: 8,9,10,11,12 + 60: mean 110/6 = 55/3, median 21/2; moved 25/3 and 1/2
assert.equal(val("mean-vs-median", { o: 60 }, "mean1"), "55/3");
assert.equal(val("mean-vs-median", { o: 60 }, "median1"), "21/2");
assert.equal(val("mean-vs-median", { o: 60 }, "dMean"), "25/3");
assert.equal(val("mean-vs-median", { o: 60 }, "dMedian"), "1/2");
assert.equal(runCase("mean-vs-median", { o: 10 }).holds, true); // no change in either
// slant height: 3-4-5, 5-12-13, 8-15-17, 7-24-25
for (const [id, b, h, s] of [
  ["pt345", 3, 4, 5],
  ["pt51213", 5, 12, 13],
  ["pt81517", 8, 15, 17],
  ["pt724", 7, 24, 25],
]) {
  assert.equal(val("slant-height", { pyr: id }, "s"), String(s));
  assert.equal(val("slant-height", { pyr: id }, "b"), String(b));
  assert.equal(val("slant-height", { pyr: id }, "h"), String(h));
  assert.equal(runCase("slant-height", { pyr: id }).holds, false);
}
// distributive: 3(2 + 4) = 18, 3*2 + 4 = 10, 3*2 + 3*4 = 18; k = 1 makes the tempting claim true
assert.equal(val("distributive", { k: 3, x: 2, c: 4 }, "whole"), "18");
assert.equal(val("distributive", { k: 3, x: 2, c: 4 }, "tempt"), "10");
assert.equal(val("distributive", { k: 3, x: 2, c: 4 }, "dist"), "18");
assert.equal(runCase("distributive", { k: 1, x: 2, c: 4 }).holds, true);

// Sweeps: the independent claim predicates decide each case, and the engine must agree on every case.
const claimOf = {
  "discount-stack": (c) => {
    const p1 = pct(c.p1);
    const p2 = pct(c.p2);
    const left = mul(sub(num(1), p1), sub(num(1), p2));
    return eq(sub(num(1), left), add(p1, p2));
  },
  "equivalent-ratios": (c) => {
    const a = num(c.a);
    const b = num(c.b);
    const k = num(c.k);
    const [na, nb] = c.how === "add" ? [add(a, k), add(b, k)] : [mul(a, k), mul(b, k)];
    return eq(div(na, nb), div(a, b));
  },
  "unit-price": (c) => {
    const [qa, pa, qb, pb] = [num(c.qa), num(c.pa), num(c.qb), num(c.pb)];
    return cmp(pa, pb) === cmp(div(pa, qa), div(pb, qb));
  },
  "percent-trap": (c) =>
    eq(mul(mul(num(80), add(num(1), pct(c.p))), sub(num(1), pct(c.p))), num(80)),
  "fraction-bottom": (c) => {
    const f1 = div(num(c.n1), num(c.d1));
    const f2 = div(num(c.n2), num(c.d2));
    const dd = cmp(num(c.d1), num(c.d2));
    return dd === 0 || cmp(f1, f2) === dd;
  },
  "division-smaller": (c) => cmp(div(num(c.a), div(num(c.bn), num(c.bd))), num(c.a)) < 0,
  "volume-doubling": (c) => eq(mul(mul(num(c.k), num(c.k)), num(c.k)), num(c.k)),
  balance: (c) => ["sub-both", "mult-both"].includes(c.move),
  "mean-vs-median": (c) => {
    const o = num(c.o);
    const base = [8, 9, 10, 11, 12].map(num);
    const all = [...base, o].sort(cmp);
    const mean = div(all.reduce(add), num(6));
    const med = div(add(all[2], all[3]), num(2));
    const abs = (q) => (q.n < 0n ? Q(-q.n, q.d) : q);
    return eq(abs(sub(mean, num(10))), abs(sub(med, num(10))));
  },
  "slant-height": () => false,
  distributive: (c) => c.k === 1,
};
const expectedFails = {};
for (const i of doc.investigations) {
  const cases = LabSim.sweepCases(i);
  let fails = 0;
  for (const c of cases) {
    const full = { ...LabSim.defaults(i), ...c };
    const mine = claimOf[i.id](full);
    assert.equal(LabSim.run(i, c).holds, mine, `${i.id} ${JSON.stringify(c)}`);
    if (!mine) fails++;
  }
  expectedFails[i.id] = fails;
  const sw = LabSim.sweep(i);
  assert.equal(sw.fails.length, fails, `${i.id} sweep failures`);
  assert.ok(fails > 0, `${i.id} has counterexamples`);
  // every prediction names the true outcome
  const pr = LabSim.prediction(i);
  assert.ok(pr.correct, `${i.id} prediction has exactly one correct option`);
}
assert.equal(expectedFails["discount-stack"], 12);
assert.equal(expectedFails["slant-height"], 6);
assert.equal(expectedFails["mean-vs-median"], 6);
assert.equal(LabSim.prediction(inv("discount-stack")).correct, "less");
assert.equal(LabSim.prediction(inv("volume-doubling")).correct, "x8");
assert.equal(LabSim.prediction(inv("balance")).correct, "right");
assert.equal(LabSim.prediction(inv("unit-price")).correct, "b");
// a corrupted claim predicate is caught by the same recomputation
const corrupt = clone(inv("discount-stack"));
corrupt.claim.test = ["lt", "savedPct", "naive"];
assert.notEqual(LabSim.sweep(corrupt).fails.length, expectedFails["discount-stack"]);
assert.equal(
  LabSim.numberValue(inv("discount-stack").params[1], 120),
  null,
  "out of range is rejected",
);
assert.equal(LabSim.numberValue(inv("discount-stack").params[1], "abc"), null);

// ---- transfer problems: seeded, solved independently, misconceptions recognised ----------------------------------------
for (const i of doc.investigations) {
  for (let seed = 1; seed <= 40; seed++) {
    const g = LabTasks.generate(i.transfer, seed);
    assert.ok(g, `${i.id} seed ${seed}`);
    assert.ok(Reason.diagnose(g.task, { value: g.task.answer }).correct);
    const again = LabTasks.generate(i.transfer, seed);
    assert.equal(again.prompt, g.prompt, "same seed, same problem");
    // every misconception rule for this kind is recognised by value and differs from the right answer
    for (const r of Reason.rules().filter((x) => x.kinds.includes(g.task.kind))) {
      const w = r.wrong(g.task);
      assert.ok(!w.eq(g.task.answer), `${i.id}: ${r.id} equals the right answer`);
      assert.equal(Reason.diagnose(g.task, { value: w }).rule?.id, r.id);
    }
    const lad = [0, 1, 2].map((s) => Reason.ladder(g.task, { value: "999999" }, s).reveal);
    same(
      lad.map(String),
      ["undefined", "undefined", "undefined"],
      "no answer before the last rung",
    );
  }
}
{
  const t = LabTasks.generate(
    { ...inv("discount-stack").transfer, args: [{ fixed: "30%" }, { fixed: "25%" }] },
    1,
  );
  assert.equal(t.task.answer.frac(), "19/40"); // 1 - 0.7 x 0.75 = 0.475
  assert.equal(Reason.diagnose(t.task, { value: "55%" }).rule.id, "percent-stack");
  const r = LabTasks.generate(
    { ...inv("equivalent-ratios").transfer, args: [{ fixed: 2 }, { fixed: 3 }, { fixed: 8 }] },
    1,
  );
  assert.equal(r.task.answer.frac(), "12");
  assert.equal(Reason.diagnose(r.task, { value: "9" }).rule.id, "ratio-add-both");
  const u = LabTasks.generate({ ...inv("percent-trap").transfer, args: [{ fixed: "50%" }] }, 1);
  assert.equal(u.task.answer.frac(), "3/4");
  assert.equal(Reason.diagnose(u.task, { value: "100%" }).rule.id, "percent-back-to-start");
  const e = LabTasks.generate(
    { ...inv("balance").transfer, args: [{ fixed: 7 }, { fixed: 19 }], where: undefined },
    1,
  );
  assert.equal(e.task.answer.frac(), "12");
  assert.equal(Reason.diagnose(e.task, { value: "26" }).rule.id, "equation-undo-missing");
  assert.equal(Reason.diagnose(e.task, { value: "19" }).rule.id, "equation-given-number");
  const m = LabTasks.generate(
    { ...inv("mean-vs-median").transfer, args: [2, 3, 4, 100].map((fixed) => ({ fixed })) },
    1,
  );
  assert.equal(m.task.answer.frac(), "7/2");
  assert.equal(Reason.diagnose(m.task, { value: "109/4" }).rule.id, "mean-for-median");
  const s = LabTasks.generate(
    { ...inv("slant-height").transfer, args: [{ group: [[15, 20]] }] },
    1,
  );
  assert.equal(s.task.answer.frac(), "25");
  assert.equal(Reason.diagnose(s.task, { value: "20" }).rule.id, "height-for-slant");
  const d = LabTasks.generate(
    { ...inv("distributive").transfer, args: [4, 3, 3].map((fixed) => ({ fixed })) },
    1,
  );
  assert.equal(d.task.answer.frac(), "24");
  assert.equal(Reason.diagnose(d.task, { value: "15" }).rule.id, "distribute-first-only");
}
assert.throws(() => LabTasks.generate({ task: "eval", args: [] }, 1), /unknown task/);

// ---- Executable Discourse: validate, run, negative controls --------------------------------------------------------------
const fd = tpl("fraction-division");
const claim = (op, left, right, when) => ({
  type: "claim",
  op,
  left,
  right,
  ...(when ? { when } : {}),
});
const argu = (c, so, extra = {}) => ({
  v: 1,
  template: "fraction-division",
  tier: 1,
  claim: c,
  because: [],
  but: [],
  so: { type: "so", claim: so },
  ...extra,
});
const wrongClaim = claim("lt", "q", "a"); // "dividing always makes it smaller"
const goodSo = claim("lt", "q", "a", ["gt", "b", "1"]);
// the claim fails exactly where the divisor is 1 or less: by hand, b in {1/2, 1/4, 2/3, 1} for 5 values of a
const run = Discourse.runClaim(wrongClaim, fd);
assert.equal(run.total, 35);
assert.equal(run.fails.length, 20);
assert.ok(run.fails.every((f) => f.env.b.cmp(1) <= 0));
assert.equal(Discourse.runClaim(goodSo, fd).fails.length, 0);
assert.equal(Discourse.runClaim(goodSo, fd).applicable, 15);
const supports = { type: "evidence", case: { a: "3", b: "2" } };
const counter = {
  type: "counter",
  case: { a: "3", b: "1/2" },
  text: "dividing by one half gives more pieces",
};
const full = argu(wrongClaim, goodSo, { because: [supports], but: [counter] });
assert.equal(Discourse.validate(full, fd).length, 0);
let v = Discourse.verify(full, fd);
assert.ok(v.complete, JSON.stringify(v.checks));
assert.equal(v.but[0].genuine, true);
// negative controls
const mutate = (fn) => {
  const a = clone(full);
  fn(a);
  return Discourse.verify(a, fd);
};
assert.ok(!mutate((a) => (a.but = [])).complete, "a failing claim needs a But");
assert.ok(
  !mutate((a) => (a.but[0].case = { a: "3", b: "2" })).complete,
  "a case where the claim holds is not a counterexample",
);
assert.ok(!mutate((a) => (a.but[0].text = "ok")).complete, "the counterexample has to be answered");
assert.ok(!mutate((a) => (a.so.claim = clone(a.claim))).complete, "So must change a failing claim");
assert.ok(
  !mutate((a) => (a.so.claim = claim("lt", "q", "a", ["gt", "b", "0"]))).complete,
  "So still fails where b < 1",
);
assert.ok(
  !mutate((a) => (a.so.claim = claim("lt", "q", "a", ["gt", "b", "100"]))).complete,
  "So that never applies is vacuous",
);
assert.ok(!mutate((a) => (a.because = [])).complete, "evidence is required");
assert.ok(
  !mutate((a) => (a.because = [{ type: "evidence", case: { a: "3", b: "1/2" } }])).complete,
  "a breaking case is not support",
);
for (const [label, fn] of [
  ["unknown node type", (a) => (a.because = [{ type: "script", text: "alert(1)" }])],
  ["unknown top field", (a) => (a.extra = 1)],
  ["unknown field on a node", (a) => (a.claim.run = "x")],
  ["unknown operator", (a) => (a.claim.left = ["exec", "q"])],
  ["unknown variable", (a) => (a.claim.right = "zzz")],
  ["bad comparison", (a) => (a.claim.op = "lessish")],
  ["bad tier", (a) => (a.tier = 7)],
  ["wrong template", (a) => (a.template = "other")],
  ["case missing a variable", (a) => (a.because = [{ type: "evidence", case: { a: "3" } }])],
  ["case with a non-number", (a) => (a.because = [{ type: "evidence", case: { a: "3", b: "x" } }])],
  [
    "case with a huge value",
    (a) => (a.because = [{ type: "evidence", case: { a: "3", b: "99999999" } }]),
  ],
  ["text too long", (a) => (a.so.text = "x".repeat(401))],
  ["so is not a so", (a) => (a.so.type = "claim")],
  ["because is not a list", (a) => (a.because = {})],
]) {
  const a = clone(full);
  fn(a);
  assert.ok(Discourse.validate(a, fd).length > 0, `validator should reject: ${label}`);
  assert.equal(Discourse.verify(a, fd).valid, false, label);
}
assert.equal(Discourse.validate(null, fd)[0], "argument is not an object");
// serialization round trip
const back = Discourse.parse(Discourse.serialize(full), fd);
same(back.ast, full);
assert.equal(Discourse.parse("{not json", fd).ast, null);
assert.ok(
  Discourse.parse(JSON.stringify({ ...full, because: [{ type: "evil" }] }), fd).problems.length > 0,
);
// text feeds the rubric
const text = DiscourseText.toText(full, fd);
assert.match(text, /I claim that the answer is less than the number you divide/);
assert.match(text, /But when/);
const rub = Reason.scoreArgument(text, {
  numbers: ["6"],
  vocab: ["quotient", "divide"],
  needLimit: true,
  minWords: 12,
});
assert.ok(rub.checks.find((c) => c.id === "claim").ok);
// Tier 3 formulas: parsed to the same AST shape, no eval
const parsed = DiscourseText.parseClaim("q < a when b > 1", fd);
same(parsed.claim, goodSo);
same(DiscourseText.parseClaim("q = (a / b) * 1", fd).claim.right, ["mul", ["div", "a", "b"], "1"]);
same(DiscourseText.parseClaim("q < 50%", fd).claim.right, ["div", "50", "100"]);
for (const junk of [
  "q <",
  "q << a",
  "alert(1)",
  "q < zzz",
  "q < a when",
  "q < a when b >",
  "q < a when b > 1 when b < 5",
  "( q < a",
  "q < a )",
  "q < a; drop",
  "",
]) {
  assert.ok(DiscourseText.parseClaim(junk, fd).error, `Tier 3 should reject "${junk}"`);
}
// every template: its true statement passes and an obviously false one fails
const trueClaims = {
  "discount-stack": claim("lt", "total", "sum"),
  "equivalent-ratios": claim("eq", "rmul", "r0"),
  "unit-price": claim("gt", "ua", "ub", ["gt", "pa", "pb"]),
  "percent-trap": claim("lt", "down", "s"),
  "fraction-bottom": claim("lt", "fa", "fb", ["gt", "d1", "d2"]),
  "fraction-division": goodSo,
  "volume-scaling": claim("eq", "times", "k3"),
  "solving-equations": claim("eq", "check", "b"),
  "mean-vs-median": claim("gt", "dMean", "dMedian", ["gt", "o", "12"]),
  "slant-height": claim("gt", "s", "h"),
  distributive: claim("eq", "whole", "dist"),
};
const falseClaims = {
  "discount-stack": claim("eq", "total", "sum"),
  "equivalent-ratios": claim("eq", "radd", "r0"),
  "unit-price": claim("lt", "ua", "ub", ["lt", "pa", "pb"]),
  "percent-trap": claim("eq", "down", "s"),
  "fraction-bottom": claim("gt", "fa", "fb", ["gt", "d1", "d2"]),
  "fraction-division": wrongClaim,
  "volume-scaling": claim("eq", "times", "k"),
  "solving-equations": claim("eq", "x", "xadd"),
  "mean-vs-median": claim("eq", "dMean", "dMedian"),
  "slant-height": claim("eq", "s", "h"),
  distributive: claim("eq", "whole", "tempt"),
};
assert.equal(Object.keys(trueClaims).length, doc.discourseTemplates.length);
for (const t of doc.discourseTemplates) {
  const ok = Discourse.runClaim(trueClaims[t.id], t);
  assert.ok(
    ok.applicable > 0 && ok.fails.length === 0,
    `${t.id}: true claim holds on ${ok.applicable} cases, fails ${ok.fails.length}`,
  );
  const no = Discourse.runClaim(falseClaims[t.id], t);
  assert.ok(no.fails.length > 0, `${t.id}: false claim has a counterexample`);
}
// slant height cases are all exact
assert.equal(Discourse.cases(tpl("slant-height")).length, 6);
assert.equal(Discourse.env(tpl("slant-height"), { b: "9", h: "12" }).s.frac(), "15");
assert.throws(() => Discourse.env(tpl("slant-height"), { b: "1", h: "1" }), /perfect square/);

// ---- Evidence Notebook text ---------------------------------------------------------------------------------------------
const state = {
  evidence: {
    "ewl.lab.discount-stack": [
      {
        at: 1000,
        step: "evidence",
        claim: "c",
        data: [[{ label: "Total discount", value: "28%" }]],
        note: "n",
      },
      { at: 2000, step: "transfer", ok: false, rule: "percent-stack" },
    ],
    "ewl.forge.bot-1": [{ at: 500, ok: true }],
  },
};
const gs = Notebook.groups(state);
assert.equal(gs[0].id, "ewl.lab.discount-stack");
const txt = Notebook.toText(gs);
assert.match(txt, /Total discount 28%/);
assert.match(txt, /Added the two percents/);
assert.match(txt, /ewl\.forge\.bot-1/);

// ---- self-tests registered by the modules all pass ----------------------------------------------------------------------
for (const t of EWL.selfTests) {
  const r = t.run();
  assert.ok(r === true || r === undefined, `${t.name}: ${r}`);
}

console.log(
  `ewl-lab: ${doc.investigations.length} investigations, ${doc.discourseTemplates.length} discourse templates, ${EWL.selfTests.length} self-tests ok.`,
);
