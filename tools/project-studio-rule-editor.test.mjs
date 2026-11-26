/**
 * Pure-logic tests for the Project Studio rule editor (expressions missions unit-6-a, unit-6-b).
 * Every value is recomputed INDEPENDENTLY here (a separate BigInt fraction evaluator over the raw
 * tiles), and negative controls prove a corrupted form or answer is rejected.
 */
import assert from "node:assert/strict";
import {
  cleanRules,
  compare,
  evaluate,
  formText,
  missionTiles,
  numberTile,
  parseRule,
  ruleText,
  rulesReport,
  tileModel,
} from "../curriculum/projects/studio/rule-engine.mjs";
import { hiddenAnswers, isHidden } from "../curriculum/projects/studio/answer-guard.mjs";
import { DESIGNERS } from "../curriculum/projects/studio/designers.mjs";
import { addCheckpoint, cleanCheckpoints } from "../curriculum/projects/studio/checkpoints.mjs";
import { model } from "../curriculum/projects/studio/math.mjs";
import { PROJECTS } from "../curriculum/projects/studio/projects.mjs";

let n = 0;
const test = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`FAIL ${name}`);
    throw e;
  }
};

/* Independent rational evaluator: precedence climbing over tiles, plain [num, den] BigInt pairs. */
const g = (a, b) => (b ? g(b, a % b) : a < 0n ? -a : a);
const R = (p, q = 1n) => {
  if (q < 0n) [p, q] = [-p, -q];
  const k = g(p, q) || 1n;
  return [p / k, q / k];
};
const radd = (x, y) => R(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
const rmul = (x, y) => R(x[0] * y[0], x[1] * y[1]);
const rnum = (s) =>
  s.includes("/")
    ? R(BigInt(s.split("/")[0]), BigInt(s.split("/")[1]))
    : s.includes(".")
      ? R(BigInt(s.replace(".", "")), 10n ** BigInt(s.split(".")[1].length))
      : R(BigInt(s));
function evalTiles(tiles, x) {
  let i = 0;
  const sum = () => {
    let sign = 1n;
    if (tiles[i] === "-") {
      sign = -1n;
      i++;
    }
    let acc = rmul(R(sign), prod());
    while (tiles[i] === "+" || tiles[i] === "-") {
      const s = tiles[i++] === "+" ? 1n : -1n;
      acc = radd(acc, rmul(R(s), prod()));
    }
    return acc;
  };
  const prod = () => {
    let acc = atom();
    while (
      i < tiles.length &&
      (tiles[i] === "*" || tiles[i] === "x" || tiles[i] === "(" || /^\d/.test(tiles[i]))
    ) {
      if (tiles[i] === "*") i++;
      acc = rmul(acc, atom());
    }
    return acc;
  };
  const atom = () => {
    const t = tiles[i++];
    let v = t === "x" ? x : t === "(" ? sum() : rnum(t);
    if (t === "(") i++; // ")"
    if (tiles[i] === "^2") {
      i++;
      v = rmul(v, v);
    }
    return v;
  };
  return sum();
}
const same = (frac, pair) => frac.n === pair[0] && frac.d === pair[1];
const X = (k) => ({ n: BigInt(k), d: 1n });

test("number tiles accept whole, decimal, fraction; reject junk", () => {
  for (const ok of ["3", "2.5", "1/2", "120"]) assert.equal(numberTile(ok), ok);
  for (const bad of ["", "-3", "x", "1/0x", "3+4", "eval(1)", "1e5", "1234567"])
    assert.equal(numberTile(bad), null);
});

test("mission rule a(x + b) + d² parses to ax + (ab + d²) for every mission design and context", () => {
  for (const p of PROJECTS.filter((p) => p.family === "expressions")) {
    for (const design of [p.defaults, ...(p.contextDesigns || [])]) {
      const m = model(p, design);
      if (m.errors.length) continue;
      const v = m.values;
      const parsed = parseRule(missionTiles(v));
      assert.ok(parsed.ok);
      const ans = Object.fromEntries(m.checks.map((q) => [q.id, q.answer]));
      assert.equal(Number(parsed.form.a.n), ans.coefficient, `${p.id} coefficient`);
      assert.equal(Number(parsed.form.b.n), ans.constant, `${p.id} constant`);
      assert.ok(same(evaluate(parsed.form, X(v.c)), [BigInt(ans.value), 1n]));
      assert.ok(same(evaluate(parsed.form, X(v.c + 1)), [BigInt(ans["new-input"]), 1n]));
      // negative control: a corrupted constant does not reproduce the Test answer
      assert.notEqual(Number(parsed.form.b.n) + 1, ans.constant);
    }
  }
});

test("random tile rules: exact form agrees with the independent evaluator at many inputs", () => {
  let seed = 7;
  const rnd = (k) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % k;
  };
  const nums = ["1", "2", "3", "4", "5", "7", "1/2", "2.5", "3/4"];
  let checked = 0;
  for (let trial = 0; trial < 400; trial++) {
    const tiles = [];
    const terms = 1 + rnd(3);
    for (let k = 0; k < terms; k++) {
      if (k) tiles.push(rnd(2) ? "+" : "-");
      const shape = rnd(5);
      const c = nums[rnd(nums.length)];
      if (shape === 0) tiles.push(c, "x");
      else if (shape === 1)
        tiles.push(c, "(", "x", rnd(2) ? "+" : "-", nums[rnd(nums.length)], ")");
      else if (shape === 2) tiles.push(c, "^2");
      else if (shape === 3) tiles.push("x");
      else tiles.push(c, "*", "(", nums[rnd(nums.length)], "+", "x", ")");
    }
    const parsed = parseRule(tiles);
    assert.ok(parsed.ok, `should parse ${tiles.join(" ")}`);
    for (const x of [X(0), X(1), X(-3), { n: 5n, d: 2n }]) {
      assert.ok(
        same(evaluate(parsed.form, x), evalTiles(tiles, [x.n, x.d])),
        `${ruleText(tiles)} at ${x.n}/${x.d}`,
      );
      checked++;
    }
  }
  assert.ok(checked >= 1600);
});

test("parser refuses non-linear and malformed rules with a located error", () => {
  const cases = [
    [["x", "^2"], "square-x"],
    [["x", "x"], "x-times-x"],
    [["(", "x", "+", "1", ")", "(", "x", ")"], "x-times-x"],
    [["3", "+"], "dangling"],
    [["3", "+", "*", "x"], "double-op"],
    [["(", "x", "+", "1"], "unclosed"],
    [["x", ")"], "extra-close"],
    [["^2"], "square-first"],
    [["+", "x"], "lead-plus"],
    [["3", "4"], "two-numbers"],
    [["(", ")"], "empty-group"],
    [[], "empty"],
  ];
  for (const [tiles, err] of cases) assert.equal(parseRule(tiles).error, err, tiles.join(" "));
});

test("equivalence: symbolic AND on inputs; misleading single agreement is explained", () => {
  const A = parseRule(["4", "(", "x", "+", "3", ")", "+", "2", "^2"]).form; // 4x + 16
  const B = parseRule(["4", "x", "+", "16"]).form;
  const C = parseRule(["2", "x", "+", "26"]).form; // agrees with A only at x = 5
  const D = parseRule(["4", "x", "+", "12"]).form; // parallel
  const eqv = compare(A, B, ["0", "1", "5"]);
  assert.ok(eqv.equivalent && eqv.rows.every((r) => r.same));
  const cross = compare(A, C, ["5", "6"]);
  assert.ok(!cross.equivalent && cross.misleading);
  assert.ok(same(cross.agreeAt, [5n, 1n]));
  // independent: both rules really agree at the reported input and differ at another
  assert.deepEqual(
    evalTiles(["4", "(", "x", "+", "3", ")", "+", "2", "^2"], [5n, 1n]),
    evalTiles(["2", "x", "+", "26"], [5n, 1n]),
  );
  assert.ok(!cross.rows[1].same);
  const par = compare(A, D, ["0"]);
  assert.equal(par.agreeAt, "never");
  assert.ok(!par.misleading);
  // negative control: corrupting B's constant breaks equivalence
  assert.ok(!compare(A, { a: B.a, b: { n: 17n, d: 1n } }, []).equivalent);
});

test("formText and ruleText print typographic forms", () => {
  assert.equal(formText(parseRule(["4", "x", "-", "3"]).form), "4x − 3");
  assert.equal(formText(parseRule(["-", "x"]).form), "−x");
  assert.equal(formText(parseRule(["0", "x"]).form), "0");
  assert.equal(ruleText(["4", "(", "x", "+", "3", ")", "+", "2", "^2"]), "4(x + 3) + 2²");
  assert.equal(
    formText(parseRule(["4", "x", "+", "16"]).form, () => "?"),
    "?x + ?",
  );
});

test("algebra tiles: regrouped counts equal the exact form; big rules are not drawn", () => {
  const p = parseRule(["4", "(", "x", "+", "3", ")", "+", "2", "^2"]);
  const m = tileModel(p);
  assert.ok(m.drawable);
  assert.deepEqual(
    m.rows.map((r) => r.kind),
    ["group", "square"],
  );
  assert.equal(m.xTotal, Number(p.form.a.n));
  assert.equal(m.unitTotal, Number(p.form.b.n));
  const neg = parseRule(["3", "x", "-", "2", "(", "x", "+", "1", ")"]);
  const mn = tileModel(neg);
  assert.equal(mn.xTotal, Number(neg.form.a.n));
  assert.equal(mn.unitTotal, Number(neg.form.b.n));
  assert.equal(tileModel(parseRule(["1/2", "x"])).drawable, false);
  assert.equal(tileModel(parseRule(["12", "(", "x", "+", "12", ")"])).drawable, false);
});

test("hidden-answer guard: all six answers hidden until checked; teacher sees all", () => {
  const p = PROJECTS.find((x) => x.id === "unit-6-a");
  const state = { design: { ...p.defaults }, checked: {}, role: "student" };
  const m = model(p, state.design);
  const hidden = hiddenAnswers(p, state);
  for (const q of m.checks) assert.ok(isHidden(hidden, X(q.answer)), q.id);
  state.checked = Object.fromEntries(m.checks.map((q) => [q.id, true]));
  assert.equal(hiddenAnswers(p, state).length, 0);
  assert.equal(hiddenAnswers(p, { ...state, checked: {}, role: "teacher" }).length, 0);
  // checking one answer reveals only values no other unchecked answer shares
  const one = hiddenAnswers(p, { ...state, checked: { value: true } });
  assert.ok(!isHidden(one, X(m.checks.find((q) => q.id === "value").answer)));
});

test("clean, checkpoint round trip and report never print a Test answer", () => {
  assert.deepEqual(
    cleanRules({
      a: ["x", "eval", "<script>", "3"],
      b: "junk",
      inputs: ["1", "1", "bad", "-2"],
      view: "b",
    }),
    { a: ["x", "3"], b: [], inputs: ["1", "-2"], view: "b" },
  );
  assert.deepEqual(cleanRules(null).a, []);
  const p = PROJECTS.find((x) => x.id === "unit-6-b");
  assert.equal(DESIGNERS.expressions.key, "rules");
  const data = cleanRules({
    a: missionTiles(p.defaults),
    b: ["3", "x", "+", "21"],
    inputs: ["6", "7"],
  });
  const { list } = addCheckpoint(p, [], {
    name: "Rules",
    reason: "test",
    design: p.defaults,
    matched: 0,
    extra: data,
  });
  assert.deepEqual(cleanCheckpoints(p, list)[0].extra, data);
  const lines = DESIGNERS.expressions.report(data, model(p, p.defaults).values, String);
  const text = lines.join("\n");
  assert.match(text, /Rule A: 3\(x \+ 4\) \+ 3²/);
  assert.match(text, /Equivalent for every input \(exact ax \+ b check\): yes/);
  const answers = model(p, p.defaults).checks.map((q) => q.answer);
  const typed = new Set(["3", "4", "6", "7", "21", "2"]);
  for (const a of answers)
    if (!typed.has(String(a))) assert.ok(!new RegExp(`\\b${a}\\b`).test(text), `report leaks ${a}`);
  assert.deepEqual(rulesReport(cleanRules(null), null), []);
});

console.log(`project-studio-rule-editor: ${n} tests passed`);
