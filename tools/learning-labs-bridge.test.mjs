// Representation Bridge and Experiment Recorder: exact arithmetic, invariants over each model's whole domain, and the
// recorder's saved-state contract. Every oracle below is re-derived here with integer arithmetic, not read from the module.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BRIDGE_STATIC_ES,
  bridgeWhyEs,
  describeBridgeEs,
} from "../curriculum/learning-labs/shared/bridge-language-es.mjs";
import {
  BRIDGES,
  bridgeFor,
  fadd,
  fdec,
  fdiv,
  feq,
  fmul,
  frac,
  fstr,
  fsub,
  gcd,
} from "../curriculum/learning-labs/shared/bridge-math.mjs";
import { controls } from "../curriculum/learning-labs/shared/math.mjs";
import {
  addExperiment,
  compareExperiments,
  emptyLog,
  ensureLog,
  findExperiment,
  MAX_EXPERIMENTS,
  reportLines,
  summary,
} from "../curriculum/learning-labs/shared/recorder.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const labs = JSON.parse(readFileSync(join(REPO_ROOT, "data/learning-labs.json"))).labs;
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  assert.ok(cond, msg);
};

// --- exact fractions ------------------------------------------------------------------------------------------
let seed = 20261113;
const rnd = (lo, hi) => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return lo + (seed % (hi - lo + 1));
};
for (let i = 0; i < 500; i++) {
  const x = frac(rnd(-40, 40), rnd(1, 30));
  const y = frac(rnd(-40, 40), rnd(1, 30));
  ok(x.n === 0 || gcd(Math.abs(x.n), x.d) === 1, "reduced");
  ok(x.d > 0, "denominator positive");
  ok(feq(fadd(x, y), fadd(y, x)) && feq(fmul(x, y), fmul(y, x)), "commutative");
  ok(feq(fsub(fadd(x, y), y), x), "add then subtract returns x");
  if (y.n !== 0) ok(feq(fdiv(fmul(x, y), y), x), "multiply then divide returns x");
}
assert.deepEqual(frac(6, -4), { n: -3, d: 2 });
assert.equal(fstr(frac(7, 2)), "7/2");
assert.equal(fstr(frac(-3)), "−3");
assert.equal(fdec(frac(1, 8)), "0.125");
assert.equal(fdec(frac(1, 3)), "about 0.33");
assert.throws(() => frac(1, 0), RangeError);
assert.throws(() => frac(1.5, 2), RangeError);
checks += 8;

// --- registry: every declared bridge is mounted on a real lab and fed by that lab's own controls -----------------
const withBridge = labs.filter((l) => bridgeFor({ kind: l.model, mode: l.mode }));
assert.deepEqual(withBridge.map((l) => l.id).sort(), [
  "algebra-workshop",
  "balance-bureau",
  "budget-boundaries",
  "deep-sea-order",
  "elevation-expedition",
  "entry-rules",
  "fraction-field-team",
  "fraction-food-truck",
  "function-food-fair",
  "hundred-square-studio",
  "mirror-mission",
  "missing-whole",
  "mixture-matchup",
  "my-math-next",
  "power-plant",
  "ratio-railway",
  "recipe-remix",
  "ribbon-rescue",
  "sale-signals",
  "shape-shift-garden",
  "variable-weather",
]);
for (const lab of labs) {
  const model = JSON.parse(
    readFileSync(join(REPO_ROOT, "curriculum/learning-labs", lab.id, "content.json")),
  ).model;
  const b = bridgeFor(model);
  if (!b) continue;
  const d = b.describe(model.values);
  ok(
    typeof d.invariant.holds === "boolean",
    `${lab.id}: reports whether the displayed relationship holds at its starting values`,
  );
  ok(
    d.a11y.length > 20 && d.words.length > 20 && d.table.rows.length >= 2,
    `${lab.id}: every representation is present`,
  );
  const fields = controls(model);
  // the bridge's domain must contain every setting the model's own controls allow
  for (let i = 0; i < b.quantities.length; i++) {
    const f = fields[i];
    for (const v of [f.min, f.max]) {
      const vals = [...model.values];
      vals[i] = v;
      assert.doesNotThrow(
        () => b.describe(vals),
        `${lab.id}: control ${i} at its limit ${v} is inside the bridge domain`,
      );
      checks++;
    }
  }
}
for (const b of BRIDGES) {
  ok(b.misconceptions.length >= 3, `${b.key}: at least three misconceptions are declared`);
  ok(
    b.invariants.length >= 1 && b.domain.length > 10 && b.quantities.length >= 2,
    `${b.key}: declares quantities, domain and an invariant`,
  );
  ok(
    b.transformations.every((t) => t.question && t.label),
    `${b.key}: every idea has a label and a prediction question`,
  );
  const ids = new Set(b.misconceptions.map((m) => m.id));
  ok(
    ids.size === b.misconceptions.length && b.misconceptions.every((m) => m.name && m.response),
    `${b.key}: misconceptions are unique and explained`,
  );
}

// Spanish-twin gate: every declared Bridge string and every rendered text role has a Spanish companion.
const twin = (en, es, where) =>
  ok(
    typeof en === "string" && en.length > 0 && typeof es === "string" && es.length > 0,
    `${where}: Spanish twin exists`,
  );
ok(
  Object.keys(BRIDGE_STATIC_ES).length > 0 &&
    Object.values(BRIDGE_STATIC_ES).every((s) => typeof s === "string" && s.length > 0),
  "Bridge static interface labels all have Spanish text",
);
const bridgeSamples = {
  "ratio:mixer": [2, 3],
  "percent:whole": [30, 18],
  "power:order": [2, 3, 0],
  "balance:add": [5, 12, 0],
  "area:triangle": [4, 6, 0],
  "ratio:compare": [2, 3],
  "percent:grid": [35, 100],
  "percent:discount": [25, 80],
  "fraction:servings": [3, 1, 2],
  "fraction:ribbon": [5.5, 3, 4],
  "fraction:field": [4.5, 2, 3],
  "line:opposites": [-4, 6],
  "line:absolute": [-7, -3],
  "coordinates:reflect": [-3, 4, 3, -4],
  "inequality:entry": [12, 10],
  "inequality:budget": [15, 6],
  "expression:distribute": [3, 4, 2],
  "growth:ratio-graph": [3, 0, 4],
  "growth:weather": [2, 4, 3],
  "growth:fees": [3, 5, 4],
  "growth:future": [4, 1, 5],
};
for (const b of BRIDGES) {
  twin(b.domain, b.domainEs, `${b.key} domain`);
  ok(
    b.invariants.length === b.invariantsEs.length,
    `${b.key}: invariant strings have one-to-one Spanish twins`,
  );
  b.invariants.forEach((s, i) => twin(s, b.invariantsEs[i], `${b.key} invariant ${i}`));
  ok(
    b.representations.length === b.representationsEs.length,
    `${b.key}: representation labels have Spanish twins`,
  );
  b.representations.forEach((s, i) =>
    twin(s, b.representationsEs[i], `${b.key} representation ${i}`),
  );
  b.quantities.forEach((q) => {
    twin(q.name, q.nameEs, `${b.key} quantity ${q.id}`);
    if (q.unit) twin(q.unit, q.unitEs, `${b.key} unit ${q.id}`);
  });
  b.transformations.forEach((t) => {
    twin(t.label, t.labelEs, `${b.key} idea ${t.id} label`);
    twin(t.question, t.questionEs, `${b.key} idea ${t.id} prediction`);
    if (t.param) twin(t.param.label, t.param.labelEs, `${b.key} idea ${t.id} parameter`);
  });
  b.misconceptions.forEach((m) => {
    twin(m.name, m.nameEs, `${b.key} misconception ${m.id} name`);
    twin(m.response, m.responseEs, `${b.key} misconception ${m.id} response`);
  });
  const d = b.describe(bridgeSamples[b.key]);
  const es = describeBridgeEs(b, bridgeSamples[b.key]);
  twin(d.words, es.words, `${b.key} words output`);
  twin(d.invariant.text, es.invariant, `${b.key} invariant output`);
  twin(d.a11y, es.a11y, `${b.key} accessibility output`);
  ok(
    d.table.head.length === es.table.head.length && d.table.rows.length === es.table.rows.length,
    `${b.key}: table has a Spanish twin`,
  );
  d.table.head.forEach((h, i) => twin(h, es.table.head[i], `${b.key} table heading ${i}`));
  d.table.rows.forEach((r, i) => twin(r.label, es.table.rows[i].label, `${b.key} table row ${i}`));
  for (const t of b.transformations) {
    const r = b.test(bridgeSamples[b.key], t.id, t.param?.value);
    ok(
      bridgeWhyEs(b, bridgeSamples[b.key], t.id, t.param?.value, r).length > 0,
      `${b.key}:${t.id} test explanation has Spanish twin`,
    );
  }
}

// Independent integer oracle over the complete domains of every newly bridged model, including every declared idea
// and every whole-number parameter setting. Half-unit fraction and number-line inputs are enumerated in doubled integers.
const bridgedModel = new Map();
for (const lab of withBridge) {
  const model = JSON.parse(
    readFileSync(join(REPO_ROOT, "curriculum/learning-labs", lab.id, "content.json")),
  ).model;
  bridgedModel.set(`${model.kind}:${model.mode}`, model);
}
const newKeys = BRIDGES.map((b) => b.key).filter(
  (key) =>
    !["ratio:mixer", "percent:whole", "power:order", "balance:add", "area:triangle"].includes(key),
);
const combos = (fields, visit, at = 0, values = []) => {
  if (at === fields.length) return visit(values);
  const field = fields[at],
    steps = Math.round((field.max - field.min) / field.step);
  for (let k = 0; k <= steps; k++)
    combos(fields, visit, at + 1, [...values, Number((field.min + k * field.step).toFixed(6))]);
};
function independentPreserved(key, values, id, param, r) {
  const [a, b, c] = values;
  if (key === "ratio:compare") {
    if (id === "scale") return r.after[0] * b === r.after[1] * a;
    if (id === "add-both") return a * r.after[1] === b * r.after[0];
    return a * b === r.after[0] * r.after[1];
  }
  if (key === "percent:grid" || key === "percent:discount") return r.after[0] === a;
  if (key.startsWith("fraction:")) {
    const supply2 = Math.round(a * 2),
      nextSupply2 = Math.round(r.after[0] * 2);
    return supply2 * c * r.after[1] === nextSupply2 * r.after[2] * b;
  }
  if (key === "line:opposites") return r.after[0] + r.after[1] === 0;
  if (key === "line:absolute") return Math.abs(r.after[0] - r.after[1]) === Math.abs(a - b);
  if (key === "coordinates:reflect") {
    const [ax, ay, bx, by] = r.after;
    return (bx === ax && by === -ay) || (by === ay && bx === -ax);
  }
  if (key.startsWith("inequality:")) {
    const entry = key.endsWith(":entry"),
      passes = ([bound, value]) => (entry ? value >= bound : value <= bound);
    if (id === "test-boundary") return passes(r.after);
    if (id === "move-test") return passes(values) === passes(r.after);
    const reversed = entry ? b <= a : b >= a;
    return passes(values) === reversed;
  }
  if (key === "expression:distribute") {
    const [factor, constant, x] = id === "substitute" ? [a, b, param] : [a, b, c];
    return id === "omit-factor"
      ? factor * (x + constant) === factor * x + constant
      : factor * (x + constant) === factor * x + factor * constant;
  }
  if (key.startsWith("growth:")) {
    if (id === "next-input") return a * r.after[2] + b - (a * c + b) === a * param;
    if (id === "change-start") return r.after[0] === a;
    return r.after[0] === a;
  }
  throw new Error(`No independent oracle for ${key}`);
}
for (const key of newKeys) {
  const bridge = bridgeFor({ kind: key.split(":")[0], mode: key.split(":")[1] });
  const model = bridgedModel.get(key);
  assert.ok(bridge && model, `${key}: has a real lab model`);
  const fields = controls(model);
  let domainSettings = 0;
  combos(fields, (values) => {
    domainSettings++;
    const d = bridge.describe(values);
    const spanish = describeBridgeEs(bridge, values);
    ok(
      typeof d.invariant.holds === "boolean" && d.table.rows.length > 0,
      `${key}: represented setting ${values.join(",")}`,
    );
    ok(
      spanish.words.length > 10 &&
        spanish.invariant.length > 10 &&
        spanish.table.rows.length === d.table.rows.length,
      `${key}: Spanish twin at ${values.join(",")}`,
    );
    for (const t of bridge.transformations) {
      const valuesToTry = t.param
        ? Array.from(
            { length: Math.floor((t.param.max - t.param.min) / (t.param.step || 1)) + 1 },
            (_, i) => t.param.min + i * (t.param.step || 1),
          )
        : [undefined];
      for (const p of valuesToTry) {
        const r = bridge.test(values, t.id, p);
        const oracle = independentPreserved(key, values, t.id, p, r);
        ok(r.preserved === oracle, `${key}:${t.id} ${values.join(",")} param=${p}: integer oracle`);
        ok(
          Array.isArray(r.before) && Array.isArray(r.after) && typeof r.fits === "boolean",
          `${key}:${t.id}: before/after/fit result`,
        );
        ok(
          r.misconception === null || bridge.misconceptions.some((m) => m.id === r.misconception),
          `${key}:${t.id}: misconception is declared`,
        );
        ok(
          bridgeWhyEs(bridge, values, t.id, p, r).length > 5,
          `${key}:${t.id}: Spanish explanation over the domain`,
        );
      }
    }
  });
  ok(domainSettings > 0, `${key}: whole control domain was enumerated`);
  for (let i = 0; i < fields.length; i++) {
    const invalid = [...model.values];
    invalid[i] = fields[i].min - fields[i].step;
    assert.throws(() => bridge.describe(invalid), RangeError, `${key}: rejects below control ${i}`);
    checks++;
  }
}

const ratio = bridgeFor({ kind: "ratio", mode: "mixer" });
const percent = bridgeFor({ kind: "percent", mode: "whole" });
const power = bridgeFor({ kind: "power", mode: "order" });
const balance = bridgeFor({ kind: "balance", mode: "add" });
const area = bridgeFor({ kind: "area", mode: "triangle" });
const declared = (b, r) =>
  ok(
    r.misconception === null || b.misconceptions.some((m) => m.id === r.misconception),
    `${b.key}: ${r.misconception} is declared`,
  );

// --- ratio:mixer ------------------------------------------------------------------------------------------------
for (let a = 1; a <= 12; a++)
  for (let b = 1; b <= 12; b++) {
    const d = ratio.describe([a, b]);
    const de = describeBridgeEs(ratio, [a, b]);
    ok(
      de.words.length > 20 && de.invariant.length > 5,
      `ratio ${a}:${b} has a Spanish description`,
    );
    ok(
      d.invariant.holds &&
        d.table.rows.every((r, k) => r.cells[0] === a * (k + 1) && r.cells[1] === b * (k + 1)),
      `ratio ${a}:${b} table rows scale both`,
    );
    for (let k = 2; k <= 6; k++) {
      const r = ratio.test([a, b], "scale", k);
      ok(
        bridgeWhyEs(ratio, [a, b], "scale", k, r).length > 20,
        "ratio scaling has a Spanish explanation",
      );
      ok(
        r.preserved && r.after[0] === a * k && r.after[1] === b * k && r.misconception === null,
        `ratio ${a}:${b} x${k}`,
      );
      ok(
        r.fits === (a * k <= 12 && b * k <= 12),
        "scale fits the 12-cup model only when both stay within it",
      );
    }
    for (let n = 1; n <= 6; n++) {
      const add = ratio.test([a, b], "add", n);
      ok(
        bridgeWhyEs(ratio, [a, b], "add", n, add).length > 20,
        "ratio addition has a Spanish explanation",
      );
      // equivalent iff a/b === (a+n)/(b+n), i.e. a(b+n) === b(a+n), i.e. a === b
      ok(
        add.preserved === (a * (b + n) === b * (a + n)) && add.preserved === (a === b),
        `ratio ${a}:${b} +${n} both`,
      );
      ok(
        add.preserved || add.misconception === "additive-ratio",
        "adding to both names the additive misconception",
      );
      declared(ratio, add);
      const one = ratio.test([a, b], "one", n);
      ok(
        bridgeWhyEs(ratio, [a, b], "one", n, one).length > 20,
        "one-quantity change has a Spanish explanation",
      );
      ok(
        !one.preserved && one.misconception === "one-quantity" && one.after[1] === b,
        `ratio ${a}:${b} juice only +${n}`,
      );
    }
  }
assert.throws(() => ratio.describe([0, 3]), RangeError);
assert.throws(() => ratio.describe([2, 13]), RangeError);
assert.throws(() => ratio.describe([1.5, 3]), RangeError);
assert.throws(() => ratio.test([2, 3], "scale", 1), RangeError);
assert.throws(() => ratio.test([2, 3], "nope", 2), RangeError);
checks += 5;

// --- percent:whole ----------------------------------------------------------------------------------------------
for (let p = 1; p <= 100; p++)
  for (let part = 1; part <= 120; part++) {
    const d = percent.describe([p, part]);
    const de = describeBridgeEs(percent, [p, part]);
    ok(
      de.words.length > 20 && de.invariant.length > 5,
      `percent ${p}% / ${part} has a Spanish description`,
    );
    ok(d.invariant.holds, `percent ${p}% of whole = ${part}`);
    const wholeNum = part * 100;
    ok(
      d.table.rows[2].cells[0] === fstr(frac(wholeNum, p)) && d.table.rows[1].cells[0] === part,
      "table: p% is the part, 100% is the whole",
    );
  }
// the oracle is integer arithmetic on tenths: a guess g (tenths) is the whole iff g * percent === part * 1000
for (const [p, part, guess] of [
  [30, 18, 60],
  [30, 18, 6],
  [30, 18, 5.4],
  [25, 7, 28],
  [50, 9, 18],
  [40, 30, 75],
  [40, 7, 17.5],
  [60, 9, 15],
  [60, 9, 5.4],
  [10, 100, 1000],
  [100, 30, 30],
]) {
  const r = percent.test([p, part], "verify", guess);
  ok(
    bridgeWhyEs(percent, [p, part], "verify", guess, r).length > 15,
    "whole-check has a Spanish explanation",
  );
  ok(
    r.preserved === (Math.round(guess * 10) * p === part * 1000),
    `percent ${p}% / ${part} guess ${guess}`,
  );
  declared(percent, r);
}
assert.equal(
  percent.test([30, 18], "verify", 5.4).misconception,
  "percent-of-part",
  "30% of 18 is the classic wrong move",
);
assert.equal(percent.test([30, 18], "verify", 6).misconception, "whole-too-small");
assert.equal(percent.test([30, 18], "verify", 60).misconception, null);
assert.equal(
  percent.test([30, 18], "verify", 100).misconception,
  null,
  "a wrong whole above the part with no named mistake gets no label",
);
assert.match(percent.test([30, 18], "verify", 5.4).why, /work back to 100%/);
assert.throws(() => percent.test([30, 18], "verify", 0), RangeError);
assert.throws(() => percent.test([30, 18], "verify", 5000), RangeError);
checks += 10;

// --- power:order ------------------------------------------------------------------------------------------------
for (let b = 2; b <= 5; b++)
  for (let e = 1; e <= 5; e++) {
    const d = power.describe([b, e, 0]);
    const de = describeBridgeEs(power, [b, e, 0]);
    ok(
      de.words.length > 20 && de.invariant.length > 0,
      `power ${b}^${e} has a Spanish description`,
    );
    ok(
      d.invariant.holds &&
        d.table.rows[e - 1].cells[0] === Array(e).fill(b).join(" × ") &&
        d.table.rows[e - 1].cells[1] === b ** e,
      `power ${b}^${e}`,
    );
    const t = power.test([b, e], "times");
    ok(
      bridgeWhyEs(power, [b, e], "times", undefined, t).length > 15,
      "power comparison has a Spanish explanation",
    );
    ok(t.preserved === (b ** e === b * e), `power ${b}^${e} vs ${b}x${e}`);
    ok(
      t.preserved || t.misconception === "exponent-as-multiplier",
      "names the exponent misconception",
    );
    declared(power, t);
    const f = power.test([b, e], "add-factor");
    ok(
      bridgeWhyEs(power, [b, e], "add-factor", undefined, f).length > 15,
      "adding a factor has a Spanish explanation",
    );
    ok(f.preserved && f.fits === e < 5, `power add a factor at ${b}^${e}`);
    ok(!f.fits || f.after[1] === e + 1, "add-factor moves to one more factor");
  }
// the two calculations agree when the exponent is 1 (b^1 = b x 1 by definition) and at 2 and 2, nowhere else in the domain
const agree = [];
for (let b = 2; b <= 5; b++)
  for (let e = 1; e <= 5; e++) if (b ** e === b * e) agree.push(`${b},${e}`);
assert.deepEqual(agree, ["2,1", "2,2", "3,1", "4,1", "5,1"]);
checks++;

// --- balance:add ------------------------------------------------------------------------------------------------
for (let a = 1; a <= 12; a++)
  for (let rhs = 1; rhs <= 60; rhs++) {
    const d = balance.describe([a, rhs, 0]);
    const de = describeBridgeEs(balance, [a, rhs, 0]);
    ok(
      de.words.length > 20 && de.invariant.length > 5,
      `balance ${a} / ${rhs} has a Spanish description`,
    );
    ok(d.invariant.holds, `balance x + ${a} = ${rhs}`);
    const both = balance.test([a, rhs], "both");
    ok(
      bridgeWhyEs(balance, [a, rhs], "both", undefined, both).length > 15,
      "two-sided subtraction has a Spanish explanation",
    );
    ok(
      both.preserved && both.solution === rhs - a && both.solution + a === rhs,
      "both sides: the solution is unchanged",
    );
    const addBoth = balance.test([a, rhs], "add-both");
    ok(
      bridgeWhyEs(balance, [a, rhs], "add-both", undefined, addBoth).length > 15,
      "adding to both sides has a Spanish explanation",
    );
    ok(
      addBoth.preserved && addBoth.solution === rhs - a,
      "add the same to both sides keeps the solution",
    );
    const left = balance.test([a, rhs], "left");
    ok(
      bridgeWhyEs(balance, [a, rhs], "left", undefined, left).length > 15,
      "one-sided change has a Spanish explanation",
    );
    ok(
      !left.preserved &&
        left.solution === rhs &&
        left.solution + a !== rhs &&
        left.misconception === "one-sided",
      "one side only changes the solution",
    );
    declared(balance, left);
  }
checks += 0;

// --- area:triangle ------------------------------------------------------------------------------------------------
for (let b = 1; b <= 12; b++)
  for (let h = 1; h <= 12; h++) {
    const d = area.describe([b, h, 4]);
    const de = describeBridgeEs(area, [b, h, 4]);
    ok(
      de.words.length > 20 && de.invariant.length > 5,
      `triangle ${b}x${h} has a Spanish description`,
    );
    ok(d.invariant.holds && d.table.rows[0].cells[2] === b * h, `triangle ${b}x${h}`);
    ok(d.table.rows[1].cells[2] === fstr(frac(b * h, 2)), "triangle is half the parallelogram");
    for (const s of [1, 5, 12]) {
      const r = area.test([b, h], "slide", s);
      ok(area.test([b, h], "slide", s).preserved, "sliding the apex keeps the area");
      ok(
        bridgeWhyEs(area, [b, h], "slide", s, r).length > 15,
        "sliding the top has a Spanish explanation",
      );
    }
    for (let s = 1; s <= 20; s++) {
      const r = area.test([b, h], "slant", s);
      ok(
        bridgeWhyEs(area, [b, h], "slant", s, r).length > 15,
        "slant test has a Spanish explanation",
      );
      ok(r.preserved === (s === h), `slant ${s} vs height ${h}`);
      ok(
        s < h ? r.why.includes("cannot be shorter") : true,
        "a slant shorter than the height is impossible",
      );
      declared(area, r);
    }
  }

// --- the explanations say what the numbers say ---------------------------------------------------------------------
assert.match(ratio.test([2, 3], "add", 2).why, /2:3 to 4:5/);
assert.match(ratio.test([2, 3], "scale", 3).why, /multiplied by 3/);
assert.match(percent.test([30, 18], "verify", 60).why, /30% of 60 is 18/);
assert.match(power.test([2, 3], "times").why, /2 × 2 × 2 = 8/);
assert.match(balance.test([5, 12], "both").why, /x = 7/);
assert.match(balance.test([5, 12], "both").why, /7 \+ 5 = 12/);
checks += 6;

// --- Experiment Recorder: saved-state contract -----------------------------------------------------------------------
const bare = {};
assert.deepEqual(ensureLog(bare), emptyLog());
for (const bad of [null, "x", { v: 2, items: [] }, { v: 1, items: "no" }])
  assert.deepEqual(ensureLog({ experiments: bad }), emptyLog());
const kept = { experiments: { v: 1, items: [{ id: 9 }] } };
assert.equal(ensureLog(kept).items.length, 1, "a valid older log is kept, never discarded");
const st = {};
const e1 = addExperiment(
  st,
  {
    source: "bridge",
    prediction: { text: "yes", textEs: "sí", ok: true },
    change: { text: "x2", textEs: "por 2", before: [2, 3], after: [4, 6] },
    observed: { text: "same", textEs: "igual", ok: true },
    relation: "2:3",
    relationEs: "2:3",
  },
  1000,
);
const e2 = addExperiment(st, {
  source: "weird",
  prediction: { text: "", ok: "maybe" },
  change: { text: "", before: [NaN, 1, "a"], after: [5, 6] },
  observed: { text: "x" },
});
assert.equal(e1.id, 1);
assert.equal(e2.id, 2);
assert.equal(e2.source, "predict", "unknown sources are normalised");
assert.equal(e2.prediction.ok, null, "a prediction verdict is true, false or null");
assert.deepEqual(e2.change.before, [1], "non-numbers are dropped from saved settings");
assert.deepEqual(summary(st), { total: 2, predicted: 1, matched: 1 });
assert.equal(findExperiment(st, "2").id, 2);
assert.equal(findExperiment(st, 99), null);
const cmp = compareExperiments(st, 1, 2);
assert.deepEqual(cmp.differs, [0], "[4,6] and [5,6] differ only in the first setting");
assert.equal(compareExperiments(st, 1, 1), null);
assert.equal(compareExperiments(st, 1, 99), null);
assert.ok(reportLines(st).join("\n").includes("MY EXPERIMENTS"));
st.lang = "es";
assert.ok(reportLines(st).join("\n").includes("MIS EXPERIMENTOS"));
assert.ok(reportLines(st).join("\n").includes("por 2"));
assert.equal(st.experiments.v, 1, "Spanish companions are additive to saved version 1");
assert.deepEqual(reportLines({}), []);
const big = {};
for (let i = 0; i < MAX_EXPERIMENTS + 7; i++) addExperiment(big, { change: { after: [i] } });
assert.equal(big.experiments.items.length, MAX_EXPERIMENTS, "the log is capped");
assert.equal(
  big.experiments.items.at(-1).id,
  MAX_EXPERIMENTS + 7,
  "ids keep rising after old entries drop",
);
checks += 17;

console.log(
  `PASS learning-labs bridge: ${checks} checks; ${BRIDGES.length} bridges over their whole domains (ratio 12x12x(5+6+6), percent 100x120, power 4x5, balance 12x60, area 12x12x20), recorder contract.`,
);
