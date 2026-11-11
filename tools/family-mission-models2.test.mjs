// Family Mission models, second batch: balance, number line, coordinate plane, data and geometry.
// Every expected number below is worked out by hand in the test, independently of the code under
// test. The DOM half drives each family's main control by keyboard and by pointer in jsdom.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { parsePair } from "../assets/family-mission/models/coordinate.mjs";
import { frac } from "../assets/family-mission/models/core.mjs";
import { stats } from "../assets/family-mission/models/data.mjs";
import {
  createModel,
  FAMILIES,
  listFamilies,
  mountModel,
} from "../assets/family-mission/models/index.mjs";
import { parseRule } from "../assets/family-mission/models/numberline.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));
let reduceMotion = false;
globalThis.matchMedia = (q) => ({ matches: reduceMotion && /reduced-motion/.test(q) });

const mount = (family, config, opts) => {
  const root = document.createElement("div");
  document.body.append(root);
  const m = mountModel(root, family, config, opts);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
  return { root, m };
};
const fire = (node, type, init = {}) =>
  node.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
const key = (node, k, init = {}) =>
  node.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
  );
const button = (root, re) =>
  [...root.querySelectorAll("button")].find((b) => re.test(b.textContent));
const sliders = (root) => [...root.querySelectorAll("[role=slider]:not([hidden])")];
const misc = (r) => r.misconception?.id ?? null;
const M = "−"; // the minus sign the models print

// ── Registry ─────────────────────────────────────────────────────────────────

test("index: all eight families are registered and unknown names are refused", () => {
  const ids = [
    "percent",
    "ratio",
    "balance",
    "numberline",
    "coordinate",
    "data",
    "geometry",
    "exponents",
  ];
  assert.deepEqual(Object.keys(FAMILIES), ids);
  assert.deepEqual(
    listFamilies().map((f) => f.id),
    ids,
  );
  for (const f of listFamilies()) assert.ok(f.label.en && f.label.es);
  assert.throws(() => createModel("algebra", {}), /unknown model family/);
});

// ── Balance ──────────────────────────────────────────────────────────────────

const value = (r) => r.n / r.d;
const sides = (s, x) => [value(s.eq.a) * x + value(s.eq.b), value(s.eq.c) * x + value(s.eq.d)];

test("balance: 3x + 2 = 2x + 7 has x = 5 and every step keeps both sides equal at 5", () => {
  const m = createModel("balance", { a: 3, b: 2, c: 2, d: 7 });
  assert.deepEqual(m.getState().solution, { kind: "one", x: frac(5) });
  assert.deepEqual(sides(m.getState(), 5), [17, 17]); // 3 * 5 + 2 and 2 * 5 + 7
  assert.equal(m.setState({ apply: { op: "subtract", term: "x", value: 2 } }), true);
  assert.equal(m.getState().text, `x + 2 = 7`);
  assert.deepEqual(sides(m.getState(), 5), [7, 7]);
  assert.equal(m.setState({ apply: { op: "subtract", term: "const", value: 2 } }), true);
  assert.equal(m.getState().text, "x = 5");
  assert.deepEqual(sides(m.getState(), 5), [5, 5]);
  assert.equal(m.getState().solved, true);
  assert.equal(m.getState().log.length, 2);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().text, "x + 2 = 7");
  assert.equal(m.undo(), true);
  assert.equal(m.getState().text, "3x + 2 = 2x + 7");
});

test("balance: add and divide act on both sides; 2x = 5 gives x = 5/2; bad operations are refused", () => {
  const m = createModel("balance", { a: 2, b: 0, c: 0, d: 5 });
  assert.deepEqual(m.getState().solution.x, frac(5, 2));
  assert.equal(m.setState({ apply: { op: "divide", value: 2 } }), true);
  const s = m.getState();
  assert.deepEqual([s.eq.a, s.eq.d], [frac(1), frac(5, 2)]);
  assert.equal(s.text, "x = 5/2");
  const n = createModel("balance", { a: 3, b: -4, c: 1, d: 6 }); // 3x - 4 = x + 6, x = 5
  assert.equal(n.setState({ apply: { op: "add", term: "const", value: 4 } }), true);
  assert.deepEqual(sides(n.getState(), 5), [15, 15]); // 3x = x + 10
  assert.equal(n.setState({ apply: { op: "add", term: "const", value: -3 } }), true); // add -3 reads as subtract 3
  assert.equal(n.getState().log.at(-1).op, "subtract");
  const before = n.getState();
  // One-sided or malformed operations are never applied.
  for (const bad of [
    { op: "subtract", term: "const", value: 2, side: "left" },
    { op: "add", term: "x", value: 1, sides: "right" },
    { op: "divide", term: "x", value: 2 },
    { op: "divide", value: 0 },
    { op: "divide", value: 1 },
    { op: "add", term: "const", value: 0 },
    { op: "add", term: "const", value: "abc" },
    { op: "multiply", term: "const", value: 2 },
  ]) {
    assert.equal(n.setState({ apply: bad }), false, JSON.stringify(bad));
  }
  assert.deepEqual(n.getState(), before);
  assert.equal(n.setState({ nonsense: 1 }), false);
  assert.equal(n.setState({ combined: true }), false); // expression-only
});

test("balance: trying a value tips the balance left, right or level", () => {
  const m = createModel("balance", { a: 3, b: 2, c: 2, d: 7 });
  assert.equal(m.getState().tilt, null);
  m.setState({ x: 4 }); // 14 against 15
  assert.equal(m.getState().tilt, "right");
  assert.deepEqual([m.getState().left, m.getState().right], [frac(14), frac(15)]);
  m.setState({ x: 5 });
  assert.equal(m.getState().tilt, "level");
  m.setState({ x: 6 }); // 20 against 19
  assert.equal(m.getState().tilt, "left");
  m.setState({ x: "1/2" }); // 3.5 against 8
  assert.equal(m.getState().tilt, "right");
  assert.equal(m.setState({ x: "abc" }), false);
  assert.equal(m.setState({ x: null }), true);
  assert.equal(m.getState().tilt, null);
  const none = createModel("balance", { a: 2, b: 1, c: 2, d: 5 }); // never equal
  assert.deepEqual(none.getState().solution, { kind: "none" });
  assert.deepEqual(createModel("balance", { a: 2, b: 1, c: 2, d: 1 }).getState().solution, {
    kind: "all",
  });
});

test("balance: misconceptions one-side-only, sign-error and divide-one-term", () => {
  const m = createModel("balance", { a: 3, b: 2, c: 2, d: 7 }); // x = 5
  const solve = (answer) => m.validate({ kind: "solve", answer });
  assert.equal(solve(5).ok, true);
  assert.equal(misc(solve(5)), null);
  assert.equal(misc(solve(7)), "one-side-only"); // 2 taken from the left only: x = 7
  assert.equal(misc(solve(9)), "sign-error"); // 7 + 2 instead of 7 - 2
  assert.equal(misc(solve(-5)), "sign-error");
  assert.equal(misc(solve(11)), null);
  assert.equal(solve("abc").reason, "invalid-answer");
  const d = createModel("balance", { a: 3, b: 6, c: 0, d: 15 }); // 3x + 6 = 15, x = 3
  assert.equal(d.validate({ kind: "solve", answer: 3 }).ok, true);
  assert.equal(misc(d.validate({ kind: "solve", answer: 9 })), "divide-one-term"); // x + 6 = 15
  assert.equal(misc(d.validate({ kind: "solve", answer: "-1/3" })), "divide-one-term"); // 15 / 3 only
  assert.equal(misc(d.validate({ kind: "solve", answer: 7 })), "sign-error");
  // With no typed answer, the value the student tried is the answer.
  m.setState({ x: 5 });
  assert.equal(m.validate({ kind: "solve" }).ok, true);
  const step = (answer, expect = { op: "subtract", term: "const", value: 2 }) =>
    m.validate({ kind: "step", expect, answer });
  assert.equal(step({ op: "subtract", term: "const", value: 2 }).ok, true);
  assert.equal(step({ op: "add", term: "const", value: -2 }).ok, true);
  assert.equal(
    misc(step({ op: "subtract", term: "const", value: 2, sides: "left" })),
    "one-side-only",
  );
  assert.equal(misc(step({ op: "add", term: "const", value: 2 })), "sign-error");
  assert.equal(misc(step({ op: "subtract", term: "x", value: 5 })), null);
  assert.equal(
    misc(step({ op: "divide", term: "x", value: 3 }, { op: "divide", value: 3 })),
    "divide-one-term",
  );
  assert.equal(step({ op: "divide", value: 3 }, { op: "divide", value: 3 }).ok, true);
  assert.equal(m.validate({ kind: "tilt", x: 4, answer: "right" }).ok, true);
  assert.equal(m.validate({ kind: "tilt", x: 4, answer: "left" }).ok, false);
  assert.equal(m.validate().reason, "no-task");
});

test("balance: expression mode substitutes x and combines like terms", () => {
  const m = createModel("balance", {
    combine: [
      { a: 2, b: 3 },
      { a: 1, b: -1 },
    ],
    x: 4,
  });
  const s = m.getState();
  assert.deepEqual(s.total, { a: frac(3), b: frac(2) }); // 2x + x = 3x, 3 - 1 = 2
  assert.deepEqual(s.value, frac(14)); // 3 * 4 + 2
  assert.equal(m.setState({ x: -2 }), true);
  assert.deepEqual(m.getState().value, frac(-4));
  assert.equal(m.setState({ combined: true }), true);
  assert.equal(m.getState().combined, true);
  assert.equal(m.setState({ apply: { op: "add", term: "const", value: 1 } }), false);
  assert.equal(m.setState({ x: null }), false);
  m.setState({ x: 4 });
  assert.equal(m.validate({ kind: "evaluate", answer: 14 }).ok, true);
  assert.equal(misc(m.validate({ kind: "evaluate", answer: 10 })), "sign-error"); // 3 * 4 - 2
  assert.equal(m.validate({ kind: "combine", answer: { a: 3, b: 2 } }).ok, true);
  assert.equal(misc(m.validate({ kind: "combine", answer: { a: 3, b: -2 } })), "sign-error");
  assert.equal(misc(m.validate({ kind: "combine", answer: { a: 2, b: 2 } })), null);
  assert.match(m.getMathematicalExplanation("en"), /\(2x \+ 3\) \+ \(x − 1\)/);
  assert.match(m.getMathematicalExplanation("en"), /result is 3x \+ 2/);
  assert.match(m.getMathematicalExplanation("en"), /3 × 4 \+ 2 = 14/);
  assert.match(m.getMathematicalExplanation("es"), /términos semejantes/);
  assert.throws(() => createModel("balance", { mode: "tiles" }), TypeError);
  assert.throws(() => createModel("balance", { a: 1.5 }), TypeError);
});

test("balance: descriptions carry the live numbers in English and Spanish", () => {
  const m = createModel("balance", { a: 3, b: 2, c: 2, d: 7 });
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /3x \+ 2 = 2x \+ 7/);
  assert.match(en, /solution is x = 5/);
  assert.match(en, /3 × 5 \+ 2 = 17 and 2 × 5 \+ 7 = 17/);
  assert.match(m.getMathematicalExplanation("es"), /La solución es x = 5/);
  assert.match(
    m.getAccessibleDescription("en"),
    /3 x-tiles and 2 unit tiles.*2 x-tiles and 7 unit tiles/,
  );
  assert.match(m.getAccessibleDescription("es"), /3 fichas x y 2 fichas de unidad/);
  m.setState({ x: 4 });
  assert.match(
    m.getAccessibleDescription("en"),
    /left side is 14 and the right side is 15, so the balance tips right/,
  );
  assert.match(m.getAccessibleDescription("es"), /izquierdo es 14.*derecho es 15.*derecha/);
  m.setState({ apply: { op: "subtract", term: "const", value: 2 } });
  assert.equal(m.getState().text, "3x = 2x + 5");
  assert.match(m.getMathematicalExplanation("en"), /Steps so far: Subtract 2 from both sides/);
  assert.match(m.getMathematicalExplanation("es"), /Resta 2 de los dos lados/);
  assert.equal(createModel("balance", { a: -1, b: 0, c: 0, d: 4 }).getState().text, `${M}x = 4`);
});

// ── Number line ──────────────────────────────────────────────────────────────

test("numberline: x > 3 is open and x ≥ 3 is closed, and testing 3 tells them apart", () => {
  const open = createModel("numberline", { rule: "x > 3" });
  const closed = createModel("numberline", { rule: "x ≥ 3" });
  assert.equal(open.getState().rule, "x > 3");
  assert.equal(closed.getState().rule, "x ≥ 3");
  assert.equal(open.getState().ends[0].closed, false);
  assert.equal(closed.getState().ends[0].closed, true);
  for (const [model, x, want] of [
    [open, 3, false],
    [open, 4, true],
    [open, "7/2", true],
    [closed, 3, true],
    [closed, 2, false],
  ]) {
    model.setState({ test: x });
    assert.equal(model.getState().included, want, `${model.getState().rule} at ${x}`);
  }
  const lte = createModel("numberline", { rule: "x <= -2" });
  assert.equal(lte.getState().rule, `x ≤ ${M}2`);
  assert.equal(lte.getState().dir, "left");
  lte.setState({ test: -2 });
  assert.equal(lte.getState().included, true);
  lte.setState({ test: -1 });
  assert.equal(lte.getState().included, false);
  const between = createModel("numberline", { rule: "-2 < x ≤ 3" });
  assert.equal(between.getState().dir, "between");
  assert.equal(between.getState().rule, `${M}2 < x ≤ 3`);
  for (const [x, want] of [
    [-2, false],
    [-1, true],
    [3, true],
    [4, false],
  ]) {
    between.setState({ test: x });
    assert.equal(between.getState().included, want);
  }
});

test("numberline: the rule parses both ways round and bad rules never throw", () => {
  assert.deepEqual(parseRule("3 < x").dir, "right");
  assert.deepEqual(parseRule("3 > x").dir, "left");
  assert.equal(parseRule("x >= 1/2").ends[0].closed, true);
  assert.deepEqual(parseRule("x < -1.5").ends[0].v, frac(-3, 2));
  assert.equal(parseRule("5 > x ≥ 1").dir, "between");
  for (const bad of [
    "x",
    "x >",
    "y > 3",
    "3 < x > 4",
    "4 < x < 2",
    "",
    null,
    undefined,
    "x > abc",
  ]) {
    assert.equal(parseRule(bad), null, String(bad));
  }
  const m = createModel("numberline", { rule: "x > 3" });
  assert.equal(m.setState({ rule: "x ≤ -2" }), true);
  assert.equal(m.getState().rule, `x ≤ ${M}2`);
  assert.equal(m.setState({ rule: "x > 99" }), false); // outside the line
  assert.equal(m.setState({ boundary: 5 }), true);
  assert.equal(m.setState({ closed: true }), true);
  assert.equal(m.getState().rule, "x ≤ 5");
  assert.equal(m.setState({ dir: "between" }), true);
  assert.equal(m.getState().ends.length, 2);
  assert.equal(m.setState({ boundary2: 5 }), false); // may not meet the other end
  assert.equal(m.setState({ dir: "right" }), true);
  assert.equal(m.getState().ends.length, 1);
  assert.equal(m.setState({ boundary2: 4 }), false);
  assert.equal(m.setState({ value: 1 }), false);
  assert.throws(() => createModel("numberline", { rule: "nonsense" }), TypeError);
});

test("numberline: boundary-inclusion, direction-reversed and sign-order are detected", () => {
  const m = createModel("numberline", { rule: "x > 3" });
  const test = (x, answer) => m.validate({ kind: "test", x, answer });
  assert.equal(test(4, true).ok, true);
  assert.equal(misc(test(4, true)), null);
  assert.equal(misc(test(3, true)), "boundary-inclusion");
  assert.equal(misc(test(5, false)), "direction-reversed");
  assert.equal(test(2, false).ok, true);
  const neg = createModel("numberline", { rule: "x > -2" });
  assert.equal(misc(neg.validate({ kind: "test", x: -5, answer: true })), "sign-order"); // -5 "bigger"
  assert.equal(neg.validate({ kind: "test", x: -5, answer: false }).ok, true);
  const graph = (rule, answer) => m.validate({ kind: "graph", rule, answer });
  assert.equal(graph("x > 3", "x > 3").ok, true);
  assert.equal(misc(graph("x > 3", "x ≥ 3")), "boundary-inclusion");
  assert.equal(misc(graph("x ≥ 3", "x > 3")), "boundary-inclusion");
  assert.equal(misc(graph("x > 3", "x < 3")), "direction-reversed");
  assert.equal(misc(graph("x > 3", "x > 4")), null);
  assert.equal(m.validate({ kind: "graph", rule: "x > 3" }).ok, true); // reads the model's own graph
  assert.equal(
    misc(
      m.validate({ kind: "read", graph: { dir: "left", v: -2, closed: true }, answer: "x < -2" }),
    ),
    "boundary-inclusion",
  );
  assert.equal(
    m.validate({ kind: "read", graph: { dir: "left", v: -2, closed: true }, answer: "x ≤ -2" }).ok,
    true,
  );
  assert.equal(m.validate({ kind: "test", x: 4, answer: "maybe" }).reason, "invalid-answer");
});

test("numberline: opposites and absolute value, and ordering with negatives", () => {
  const m = createModel("numberline", { mode: "opposites", value: -5 });
  const s = m.getState();
  assert.deepEqual([s.opposite, s.abs], [frac(5), frac(5)]);
  assert.equal(m.validate({ kind: "opposite", answer: 5 }).ok, true);
  assert.equal(m.validate({ kind: "absolute", answer: -5 }).ok, false);
  assert.equal(m.validate({ kind: "absolute", value: "-3/2", answer: "3/2" }).ok, true);
  assert.match(
    m.getMathematicalExplanation("en"),
    new RegExp(`opposite of ${M}5 is 5.*\\|${M}5\\| = 5`),
  );
  assert.match(m.getMathematicalExplanation("es"), /El opuesto de −5 es 5/);
  m.setState({ value: "7/2" });
  assert.deepEqual(m.getState().opposite, frac(-7, 2));

  const o = createModel("numberline", { mode: "order", values: [3, -5, -2] });
  assert.equal(o.getState().inOrder, false);
  assert.equal(o.validate({ kind: "order", answer: [-5, -2, 3] }).ok, true);
  assert.equal(misc(o.validate({ kind: "order", answer: [-2, -5, 3] })), "sign-order"); // -5 > -2
  assert.equal(misc(o.validate({ kind: "order", answer: [-2, 3, -5] })), "sign-order"); // by size only
  assert.equal(misc(o.validate({ kind: "order", answer: [3, -2, -5] })), null);
  assert.equal(o.validate({ kind: "order", answer: [1, 2] }).reason, "invalid-answer");
  assert.equal(o.setState({ swap: 0 }), true); // [3, -5, -2] -> [-5, 3, -2]
  assert.deepEqual(o.getState().arranged, [frac(-5), frac(3), frac(-2)]);
  assert.equal(o.setState({ swap: 1 }), true);
  assert.equal(o.setState({ swap: 0 }), true);
  assert.equal(o.setState({ swap: 1 }), true);
  assert.equal(o.getState().inOrder, false);
  assert.equal(o.setState({ swap: 5 }), false);
  assert.equal(o.getState().order.length, 3);
  const c = (a, b, answer) => m.validate({ kind: "compare", a, b, answer });
  assert.equal(c(-5, -2, "<").ok, true);
  assert.equal(misc(c(-5, -2, ">")), "sign-order");
  assert.equal(misc(c(-5, 2, ">")), null);
  assert.throws(() => createModel("numberline", { mode: "order", values: [1, 1] }), TypeError);
});

test("numberline: descriptions carry the live numbers in English and Spanish", () => {
  const m = createModel("numberline", { rule: "x ≤ -2" });
  assert.match(
    m.getMathematicalExplanation("en"),
    /x ≤ −2 means every number less than or equal to −2/,
  );
  assert.match(m.getMathematicalExplanation("en"), /closed circle at −2 means −2 is included/);
  assert.match(m.getMathematicalExplanation("es"), /menores que o iguales a −2/);
  assert.match(m.getMathematicalExplanation("es"), /círculo lleno en −2/);
  assert.match(
    m.getAccessibleDescription("en"),
    /from −10 to 10.*x ≤ −2.*closed circle at −2.*shaded to the left/,
  );
  assert.match(m.getAccessibleDescription("es"), /de −10 a 10.*sombreado a la izquierda/);
  m.setState({ test: -3 });
  assert.match(m.getMathematicalExplanation("en"), /−3 is a solution/);
  assert.match(m.getMathematicalExplanation("es"), /−3 sí es solución/);
});

// ── Coordinate plane ─────────────────────────────────────────────────────────

test("coordinate: reflecting (-2, 3) across the y-axis gives (2, 3), across the x-axis (-2, -3)", () => {
  const m = createModel("coordinate", { points: [[-2, 3]], reflect: "y" });
  assert.deepEqual(m.getState().images, [{ x: frac(2), y: frac(3) }]);
  m.setState({ reflect: "x" });
  assert.deepEqual(m.getState().images, [{ x: frac(-2), y: frac(-3) }]);
  m.setState({ reflect: null });
  assert.equal(m.getState().images, null);
  assert.deepEqual(m.getState().quadrants, ["II"]);
  assert.equal(m.setState({ reflect: "z" }), false);
  const r = (axis, answer) => m.validate({ kind: "reflect", axis, point: [-2, 3], answer });
  assert.equal(r("y", "(2, 3)").ok, true);
  assert.equal(r("x", { x: -2, y: -3 }).ok, true);
  assert.equal(misc(r("y", "(-2, -3)")), "sign-error-quadrant"); // flipped the wrong coordinate
  assert.equal(misc(r("y", "(3, 2)")), "swapped-coordinates");
  assert.equal(misc(r("y", "(-2, 3)")), null);
});

test("coordinate: plotting, reading, quadrants and the table stay linked", () => {
  const m = createModel("coordinate", { points: [[1, 1]] });
  assert.equal(m.setState({ point: { i: 0, x: -4, y: "1/2" } }), true);
  assert.deepEqual(m.getState().points[0], { x: frac(-4), y: frac(1, 2) });
  assert.deepEqual(m.getState().quadrants, ["II"]);
  m.setState({ point: { i: 0, x: 0, y: -3 } });
  assert.deepEqual(m.getState().quadrants, ["axis"]);
  assert.equal(m.setState({ point: { i: 0, x: 7, y: 0 } }), false); // outside range 6
  assert.equal(m.setState({ point: { i: 4, x: 0, y: 0 } }), false);
  assert.equal(m.setState({ add: true }), true);
  assert.equal(m.getState().points.length, 2);
  assert.deepEqual(m.getState().pair, [0, 1]);
  assert.equal(m.setState({ remove: 0 }), true);
  assert.equal(m.setState({ remove: 0 }), false); // never the last point
  assert.deepEqual(parsePair("(−2, 3)"), { x: frac(-2), y: frac(3) });
  assert.deepEqual(parsePair("1/2,-1.5"), { x: frac(1, 2), y: frac(-3, 2) });
  for (const bad of ["(1)", "(a, b)", "1,2,3", "", null])
    assert.equal(parsePair(bad), null, String(bad));
  const t = createModel("coordinate", { points: [[0, 0]] });
  const plot = (answer) => t.validate({ kind: "plot-point", target: [2, -3], answer });
  assert.equal(plot("(2, -3)").ok, true);
  assert.equal(misc(plot("(-3, 2)")), "swapped-coordinates");
  assert.equal(misc(plot("(-2, 3)")), "sign-error-quadrant");
  assert.equal(misc(plot("(2, 3)")), "sign-error-quadrant");
  assert.equal(misc(plot("(5, 5)")), null);
  t.setState({ point: { i: 0, x: 2, y: -3 } });
  assert.equal(t.validate({ kind: "plot-point", target: [2, -3] }).ok, true); // reads the plotted point
  assert.equal(
    misc(t.validate({ kind: "read-point", point: [4, -1], answer: "(-1, 4)" })),
    "swapped-coordinates",
  );
  assert.equal(t.validate({ kind: "read-point", point: [4, -1], answer: "(4, -1)" }).ok, true);
  assert.equal(t.validate({ kind: "plot-point" }).reason, "invalid-task");
});

test("coordinate: distance on a shared line, and distance-ignores-sign-change", () => {
  const m = createModel("coordinate", {
    points: [
      [-3, 2],
      [4, 2],
      [4, -5],
    ],
  });
  assert.deepEqual(m.getState().distance.d, frac(7)); // 3 + 4
  assert.equal(m.getState().distance.opposite, true);
  m.setState({ pair: [1, 2] });
  assert.deepEqual(m.getState().distance.d, frac(7)); // 2 + 5, vertical
  assert.equal(m.getState().distance.axis, "vertical");
  m.setState({ pair: [0, 2] });
  assert.equal(m.getState().distance, null); // different row and column
  assert.equal(m.validate({ kind: "distance", answer: 7 }).reason, "invalid-task");
  m.setState({ pair: [0, 1] });
  assert.equal(m.validate({ kind: "distance", answer: 7 }).ok, true);
  assert.equal(misc(m.validate({ kind: "distance", answer: 1 })), "distance-ignores-sign-change"); // |4| - |3|
  assert.equal(misc(m.validate({ kind: "distance", answer: 8 })), null);
  assert.equal(m.validate({ kind: "distance", answer: -7 }).reason, "invalid-answer");
  const same = m.validate({ kind: "distance", from: [1, 3], to: [6, 3], answer: 5 });
  assert.equal(same.ok, true);
  assert.equal(misc(m.validate({ kind: "distance", from: [1, 3], to: [6, 3], answer: 7 })), null);
  m.setState({ pair: [0, 1] });
  assert.match(
    m.getMathematicalExplanation("en"),
    /A and B are on a horizontal line, 7 units apart/,
  );
  assert.match(m.getMathematicalExplanation("en"), /opposite sides of 0: 3 \+ 4 = 7/);
  assert.match(
    m.getMathematicalExplanation("es"),
    /a 7 unidades.*lados opuestos del 0: 3 \+ 4 = 7/,
  );
  assert.match(
    m.getAccessibleDescription("en"),
    /A at \(−3, 2\) in quadrant II; B at \(4, 2\) in quadrant I/,
  );
  assert.match(m.getAccessibleDescription("es"), /A en \(−3, 2\) en el cuadrante II/);
});

// ── Data ─────────────────────────────────────────────────────────────────────

test("data: [2, 3, 3, 5, 9] has mean 22/5, median 3, mode 3, range 7, Q1 2.5, Q3 7, IQR 4.5", () => {
  const S = stats([9, 2, 5, 3, 3]);
  assert.deepEqual(S.mean, frac(22, 5));
  assert.deepEqual(S.median, frac(3));
  assert.deepEqual(S.modes, [3]);
  assert.equal(S.range, 7);
  assert.deepEqual([S.q1, S.q3, S.iqr], [frac(5, 2), frac(7), frac(9, 2)]);
  // Fences: Q1 - 1.5 * 4.5 = -4.25 and Q3 + 1.5 * 4.5 = 13.75.
  assert.deepEqual([S.fences.lo, S.fences.hi], [frac(-17, 4), frac(55, 4)]);
  assert.deepEqual(S.outliers, []);
  // MAD about 22/5: |2 - 4.4| + 2 * |3 - 4.4| + |5 - 4.4| + |9 - 4.4| = 2.4 + 2.8 + 0.6 + 4.6 = 10.4, over 5 = 2.08.
  assert.deepEqual(S.mad, frac(52, 25));
  const m = createModel("data", {});
  assert.deepEqual(m.getState().stats.mean, frac(22, 5));
  assert.match(m.getMathematicalExplanation("en"), /22 ÷ 5 = 22\/5 = 4\.4/);
  assert.match(
    m.getMathematicalExplanation("en"),
    /Q1 = 5\/2 = 2\.5, Q3 = 7, so IQR = 7 − 5\/2 = 9\/2 = 4\.5/,
  );
  assert.match(
    m.getMathematicalExplanation("en"),
    /leave the median out when the number of values is odd/,
  );
  assert.match(m.getMathematicalExplanation("en"), /−4\.25.*13\.75.*Outliers: none/);
  assert.match(m.getMathematicalExplanation("es"), /Media: 2 \+ 3 \+ 3 \+ 5 \+ 9 = 22/);
  assert.match(m.getMathematicalExplanation("es"), /RIC = 7 − 5\/2 = 9\/2 = 4\.5/);
  assert.match(
    m.getAccessibleDescription("en"),
    /5 dots: 2, 3, 3, 5, 9\. Mean 22\/5 = 4\.4, median 3, range 7/,
  );
  assert.match(
    m.getAccessibleDescription("es"),
    /5 puntos.*Media 22\/5 = 4\.4, mediana 3, rango 7/,
  );
});

test("data: even counts, odd halves and quartiles are exact; every value pair is a mode only when repeated", () => {
  const even = stats([1, 2, 3, 4]); // halves [1,2] and [3,4]
  assert.deepEqual([even.median, even.q1, even.q3], [frac(5, 2), frac(3, 2), frac(7, 2)]);
  const odd = stats([1, 2, 3, 4, 5, 6, 7]); // median 4 left out: [1,2,3] and [5,6,7]
  assert.deepEqual([odd.q1, odd.q3, odd.iqr], [frac(2), frac(6), frac(4)]);
  assert.deepEqual(stats([4, 5, 6]).modes, []); // nothing repeats
  assert.deepEqual(stats([1, 1, 2, 2, 3]).modes, [1, 2]);
  assert.equal(stats([5]).q1, null);
  assert.equal(stats([5]).iqr, null);
  assert.deepEqual(stats([1, 2, 3]).mean, frac(2));
  assert.deepEqual(stats([1, 2]).mean, frac(3, 2));
  assert.deepEqual(stats([1, 1, 2]).mean, frac(4, 3)); // does not terminate
  const m = createModel("data", { values: [1, 1, 2] });
  assert.match(m.getMathematicalExplanation("en"), /4 ÷ 3 = 4\/3\./);
});

test("data: outliers use the 1.5 x IQR rule and the plot edits stay sorted", () => {
  // [1,2,2,3,3,4] then add 30: Q1 2, Q3 4 (n = 7: halves exclude the median 3), IQR 2, fence 4 + 3 = 7.
  const m = createModel("data", { values: [1, 2, 2, 3, 3, 4], max: 40 });
  assert.deepEqual(m.getState().stats.outliers, []);
  assert.equal(m.setState({ add: 30 }), true);
  const S = m.getState().stats;
  assert.deepEqual([S.q1, S.q3, S.iqr], [frac(2), frac(4), frac(2)]);
  assert.deepEqual(S.fences.hi, frac(7));
  assert.deepEqual(S.outliers, [30]);
  assert.deepEqual(m.getState().values, [1, 2, 2, 3, 3, 4, 30]);
  assert.equal(m.setState({ move: { from: 30, to: 6 } }), true); // 6 is below the fence of 7
  assert.deepEqual(m.getState().values.at(-1), 6);
  assert.deepEqual(m.getState().stats.outliers, []);
  assert.equal(m.setState({ remove: 6 }), true);
  assert.equal(m.getState().values.length, 6);
  assert.equal(m.setState({ remove: 99 }), false);
  assert.equal(m.setState({ add: 41 }), false); // off the axis
  assert.equal(m.setState({ add: 1.5 }), false); // integers only
  assert.equal(m.setState({ move: { from: 5, to: 6 } }), false); // no dot there
  const one = createModel("data", { values: [3] });
  assert.equal(one.setState({ remove: 3 }), false); // keeps at least one dot
  assert.throws(() => createModel("data", { values: [1.5] }), TypeError);
  assert.throws(() => createModel("data", { values: [50], max: 20 }), TypeError);
  assert.match(
    createModel("data", { values: [1, 2, 2, 3, 3, 4, 30], max: 40 }).getAccessibleDescription("en"),
    /Outlier: 30/,
  );
});

test("data: tasks and the misconceptions mean-is-middle-value, median-unsorted, range-vs-iqr", () => {
  const m = createModel("data", { values: [1, 4, 4, 4, 7] });
  assert.equal(m.validate({ kind: "set-mean", target: 4 }).ok, true);
  const bad = createModel("data", { values: [1, 2, 6, 6, 7] }); // mean 22/5 = 4.4, median 6
  assert.equal(misc(bad.validate({ kind: "set-mean", target: 6 })), "mean-is-middle-value");
  assert.equal(misc(bad.validate({ kind: "set-mean", target: 5 })), null);
  assert.equal(bad.validate({ kind: "set-median", target: 6 }).ok, true);
  const find = (stat, answer, values) => m.validate({ kind: "find", stat, answer, values });
  assert.equal(find("median", 3, [7, 1, 9, 4, 3]).reason, "incorrect"); // sorted 1,3,4,7,9 -> 4
  assert.equal(find("median", 4, [7, 1, 9, 4, 3]).ok, true);
  assert.equal(misc(find("median", 9, [7, 1, 9, 4, 3])), "median-unsorted"); // middle of the list as written
  assert.equal(find("mean", 4).ok, true);
  assert.equal(misc(find("mean", 5, [1, 3, 5, 5, 8])), "mean-is-middle-value");
  assert.equal(find("range", 6).ok, true);
  assert.equal(find("iqr", 3).ok, true); // [1,4] -> 2.5, [4,7] -> 5.5
  assert.equal(misc(find("iqr", 6)), "range-vs-iqr");
  assert.equal(misc(find("range", 3)), "range-vs-iqr");
  assert.equal(find("mode", 4).ok, true);
  assert.equal(find("mean", "x").reason, "invalid-answer");
  assert.equal(find("variance", 1).reason, "invalid-task");
  // Adding 100: mean up, median the same (4), range up, IQR the same (3).
  const out = (answer) => m.validate({ kind: "add-outlier", add: 100, answer });
  assert.equal(out({ mean: "increase", median: "same", range: "increase", iqr: "same" }).ok, true);
  assert.equal(out({ mean: "up", median: "same" }).ok, true);
  assert.equal(misc(out({ median: "increase" })), "mean-is-middle-value");
  assert.equal(misc(out({ iqr: "increase" })), "range-vs-iqr");
  assert.equal(misc(out({ mean: "decrease" })), null);
  assert.equal(out({}).reason, "invalid-answer");
  assert.equal(out({ mode: "same" }).reason, "invalid-answer");
});

// ── Geometry ─────────────────────────────────────────────────────────────────

test("geometry: rectangle, parallelogram, triangle and trapezoid areas are exact", () => {
  const area = (config) => createModel("geometry", { mode: "area", ...config }).getState().area;
  assert.deepEqual(area({ shape: "rect", b: 6, h: 4 }), frac(24));
  assert.deepEqual(area({ shape: "parallelogram", b: 6, h: 4, slant: 5 }), frac(24));
  assert.deepEqual(area({ shape: "triangle", b: 6, h: 4, slant: 5 }), frac(12)); // 1/2 * 6 * 4
  assert.deepEqual(area({ shape: "trapezoid", b: 7, b2: 4, h: 4, slant: 5 }), frac(22)); // 1/2 * (7 + 4) * 4
  assert.deepEqual(area({ shape: "triangle", b: "5/2", h: 3, slant: 4 }), frac(15, 4)); // 1/2 * 5/2 * 3
  assert.deepEqual(area({ shape: "trapezoid", b: "3/2", b2: "5/2", h: 3, slant: 4 }), frac(6)); // 1/2 * 4 * 3
  const m = createModel("geometry", { mode: "area", shape: "triangle", b: 6, h: 4, slant: 5 });
  assert.equal(m.setState({ shape: "trapezoid" }), true);
  assert.deepEqual(m.getState().area, frac(20)); // b2 defaults to 4: 1/2 * (6 + 4) * 4
});

test("geometry: area edits, the height cannot pass the slanted side, and bad input is refused", () => {
  const m = createModel("geometry", { mode: "area", shape: "parallelogram", b: 6, h: 4, slant: 5 });
  assert.equal(m.setState({ h: 5 }), true);
  assert.deepEqual(m.getState().area, frac(30));
  assert.equal(m.setState({ h: 6 }), true); // the slanted side grows to stay at least as long
  assert.deepEqual(m.getState().slant, frac(6));
  assert.equal(m.setState({ slant: 3 }), false); // shorter than the height
  assert.equal(m.setState({ b: 0 }), false);
  assert.equal(m.setState({ b: 11 }), false); // max 10
  assert.equal(m.setState({ b: "abc" }), false);
  assert.equal(m.setState({ l: 2 }), false); // not an area field
  assert.equal(m.setState({ shape: "circle" }), false);
  assert.throws(() => createModel("geometry", { mode: "area", shape: "kite" }), TypeError);
  assert.throws(() => createModel("geometry", { mode: "area", b: 6, h: 4, slant: 3 }), TypeError);
  assert.throws(() => createModel("geometry", { mode: "cone" }), TypeError);
  assert.equal(m.getState().decompose, false);
  m.setState({ decompose: true });
  assert.equal(m.canUndo(), true);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().decompose, false); // toggling the view is not an undo step
});

test("geometry: a 3/2 x 2 x 4/3 prism has volume 4, packed with 1/6-unit cubes", () => {
  const m = createModel("geometry", { mode: "volume", l: "3/2", w: 2, h: "4/3" });
  const s = m.getState();
  assert.deepEqual(s.volume, frac(4)); // 3/2 * 2 = 3, and 3 * 4/3 = 4
  assert.equal(s.n, 6); // least common denominator of 2, 1, 3
  // Cubes of side 1/6: 9 across, 12 deep, 8 layers = 864, and 864 / 6^3 = 4 cubic units.
  assert.deepEqual(s.cubes, { across: 9, deep: 12, layers: 8, perLayer: 108, total: 864 });
  assert.equal(s.cubes.total / 6 ** 3, 4);
  // lw = 3, lh = 3/2 * 4/3 = 2, wh = 2 * 4/3 = 8/3, so 2 * (3 + 2 + 8/3) = 46/3.
  assert.deepEqual(s.surface, frac(46, 3));
});

test("geometry: net of a 3 x 2 x 4 prism has surface area 2(lw + lh + wh) = 52", () => {
  const m = createModel("geometry", { mode: "net", l: 3, w: 2, h: 4 });
  const s = m.getState();
  assert.deepEqual(s.surface, frac(2 * (3 * 2 + 3 * 4 + 2 * 4)));
  assert.deepEqual(
    s.faces.map((f) => f.area),
    [frac(12), frac(12), frac(6), frac(6), frac(8), frac(8)],
  );
  assert.deepEqual(s.volume, frac(24));
  m.setState({ l: "5/2" }); // lw 5, lh 10, wh 8
  assert.deepEqual(m.getState().surface, frac(2 * (5 + 10 + 8)));
  assert.equal(m.setState({ folded: true }), true);
  assert.equal(m.getState().folded, true);
  assert.match(
    m.getMathematicalExplanation("en"),
    /Surface area = 2\(lw \+ lh \+ wh\) = 2\(5 \+ 10 \+ 8\) = 46 square units/,
  );
  assert.match(
    m.getMathematicalExplanation("es"),
    /Área total = 2\(lw \+ lh \+ wh\) = 2\(5 \+ 10 \+ 8\) = 46 unidades cuadradas/,
  );
  assert.match(m.getAccessibleDescription("en"), /folded into a box.*Surface area 46 square units/);
  assert.match(m.getAccessibleDescription("es"), /doblada en una caja.*Área total 46/);
});

test("geometry: triangle-forgot-half, slant-height-as-height and volume-vs-surface-area", () => {
  const m = createModel("geometry", { mode: "area", shape: "triangle", b: 6, h: 4, slant: 5 });
  const area = (task) => m.validate({ kind: "area", ...task });
  assert.equal(area({ answer: 12 }).ok, true);
  assert.equal(misc(area({ answer: 12 })), null);
  assert.equal(misc(area({ answer: 24 })), "triangle-forgot-half");
  assert.equal(misc(area({ answer: 15 })), "slant-height-as-height"); // 1/2 * 6 * 5
  assert.equal(misc(area({ answer: 10 })), null);
  assert.equal(misc(area({ shape: "parallelogram", answer: 30 })), "slant-height-as-height"); // 6 * 5
  assert.equal(area({ shape: "parallelogram", answer: 24 }).ok, true);
  assert.equal(misc(area({ shape: "rect", answer: 30 })), null); // a rectangle has no slant to confuse
  assert.equal(misc(area({ shape: "trapezoid", b2: 4, answer: 40 })), "triangle-forgot-half"); // (6+4)*4, no half
  assert.equal(area({ shape: "trapezoid", b2: 4, answer: 20 }).ok, true);
  assert.equal(area({ answer: "abc" }).reason, "invalid-answer");
  const v = createModel("geometry", { mode: "volume", l: 3, w: 2, h: 4 });
  assert.equal(v.validate({ kind: "volume", answer: 24 }).ok, true);
  assert.equal(misc(v.validate({ kind: "volume", answer: 52 })), "volume-vs-surface-area");
  assert.equal(misc(v.validate({ kind: "volume", answer: 26 })), null);
  assert.equal(v.validate({ kind: "surface-area", answer: 52 }).ok, true);
  assert.equal(misc(v.validate({ kind: "surface-area", answer: 24 })), "volume-vs-surface-area");
  assert.equal(v.validate({ kind: "surface-area", answer: 26 }).misconception, null);
  assert.equal(m.validate({ kind: "volume", answer: 24 }).reason, "invalid-task"); // no l, w, h in an area model
  assert.equal(v.validate({ kind: "volume", l: "3/2", w: 2, h: "4/3", answer: 4 }).ok, true);
});

test("geometry: descriptions carry the live numbers in English and Spanish", () => {
  const m = createModel("geometry", {
    mode: "area",
    shape: "trapezoid",
    b: 7,
    b2: 4,
    h: 4,
    slant: 5,
  });
  assert.match(m.getMathematicalExplanation("en"), /base 7 \+ 4 = 11/);
  assert.match(m.getMathematicalExplanation("en"), /Area = ½ × \(7 \+ 4\) × 4 = 22 square units/);
  assert.match(m.getMathematicalExplanation("en"), /not the slanted side 5/);
  assert.match(
    m.getMathematicalExplanation("es"),
    /Área = ½ × \(7 \+ 4\) × 4 = 22 unidades cuadradas/,
  );
  assert.match(
    m.getAccessibleDescription("en"),
    /trapezoid with bases 7 and 4 and height 4, slanted side 5\. Area .* = 22/,
  );
  assert.match(m.getAccessibleDescription("es"), /trapecio con bases 7 y 4 y altura 4/);
  const v = createModel("geometry", { mode: "volume", l: "3/2", w: 2, h: "4/3" });
  assert.match(v.getMathematicalExplanation("en"), /\(3\/2\) × 2 × \(4\/3\) = 4 cubic units/);
  assert.match(
    v.getMathematicalExplanation("en"),
    /9 × 12 × 8 = 864 cubes, and each cube is 1\/216 of a cubic unit/,
  );
  assert.match(v.getMathematicalExplanation("es"), /864 cubos.*1\/216/);
  assert.match(
    v.getAccessibleDescription("en"),
    /3\/2 × 2 × 4\/3.*Volume 4 cubic units.*8 layers of 108 cubes of side 1\/6/,
  );
  assert.match(
    v.getAccessibleDescription("es"),
    /Volumen 4 unidades cúbicas.*8 capas de 108 cubos/,
  );
});

// ── Contract shared by every family ──────────────────────────────────────────

const CONFIGS = {
  balance: [
    { a: 3, b: 2, c: 2, d: 7, x: 4 },
    {
      combine: [
        [2, 3],
        [1, -1],
      ],
      x: 4,
    },
  ],
  numberline: [{ rule: "x ≤ -2", test: -3 }, { mode: "opposites", value: -5 }, { mode: "order" }],
  coordinate: [
    {
      points: [
        [-2, 3],
        [4, 3],
      ],
      reflect: "y",
    },
  ],
  data: [{ values: [2, 3, 3, 5, 9], mad: true }],
  geometry: [
    { mode: "area", shape: "trapezoid", b: 7, b2: 4, h: 4, slant: 5 },
    { mode: "volume", l: "3/2", w: 2, h: "4/3" },
    { mode: "net", l: 3, w: 2, h: 4 },
  ],
};
const NEW = Object.keys(CONFIGS);

test("every new family: serialize / restore round trip, undo, reset and restore(garbage) === false", () => {
  for (const name of NEW) {
    for (const cfg of CONFIGS[name]) {
      const m = createModel(name, cfg);
      const start = m.getState();
      const json = m.serialize();
      assert.equal(JSON.parse(json).family, name);
      const other = createModel(name, cfg);
      assert.equal(other.restore(json), true, name);
      assert.deepEqual(other.getState(), start, name);
      for (const bad of [
        "garbage",
        "",
        "{}",
        "[]",
        "null",
        '{"v":2}',
        '{"v":1,"family":"percent","state":{}}',
        JSON.stringify({ v: 1, family: name, state: { mode: "zzz" } }),
        JSON.stringify({ v: 1, family: name, state: {} }),
      ]) {
        assert.equal(other.restore(bad), false, `${name} ${bad}`);
      }
      assert.equal(other.restore(7), false);
      assert.equal(other.restore(null), false);
      assert.deepEqual(other.getState(), start);
      assert.equal(m.describeConfig().family, name);
      assert.equal(m.family, name);
      assert.doesNotThrow(() => JSON.stringify(m.describeConfig()));
      assert.equal(m.canUndo(), false);
      assert.equal(m.undo(), false);
      assert.deepEqual(m.initialize(cfg), m.getState());
    }
  }
  // A real change can be undone and reset.
  const b = createModel("balance", { a: 3, b: 2, c: 2, d: 7 });
  b.setState({ apply: { op: "subtract", term: "const", value: 2 } });
  assert.equal(b.undo(), true);
  b.setState({ apply: { op: "subtract", term: "const", value: 2 } });
  b.reset();
  assert.equal(b.getState().text, "3x + 2 = 2x + 7");
});

test("every new family: descriptions are non-empty, bilingual, and never say undefined or NaN", () => {
  for (const name of NEW) {
    for (const cfg of CONFIGS[name]) {
      const m = createModel(name, cfg);
      for (const lang of ["en", "es"]) {
        for (const text of [m.getAccessibleDescription(lang), m.getMathematicalExplanation(lang)]) {
          assert.ok(text.length > 20, `${name} ${lang}`);
          assert.doesNotMatch(text, /undefined|NaN|\[object|null/, `${name} ${lang}`);
          assert.match(text, /\d/);
        }
      }
      assert.notEqual(m.getAccessibleDescription("en"), m.getAccessibleDescription("es"));
      assert.doesNotMatch(m.getMathematicalExplanation("es"), /entero|\d %/);
    }
  }
});

test("every new family: validate returns {ok, reason, misconception} and stays quiet for correct work", () => {
  for (const name of NEW) {
    const m = createModel(name, CONFIGS[name][0]);
    for (const task of [undefined, null, {}, { kind: "nonsense" }]) {
      const r = m.validate(task);
      assert.equal(typeof r.ok, "boolean", name);
      assert.equal(typeof r.reason, "string", name);
      assert.equal(r.misconception, null, name);
      assert.equal(r.ok, false, name);
    }
  }
});

// ── DOM ──────────────────────────────────────────────────────────────────────

const NO_RAW = /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|undefined|NaN|\[object|\son[a-z]+=/i;

test("mount: every family draws with no raw colours, inline handlers, undefined or NaN", () => {
  for (const name of NEW) {
    for (const cfg of CONFIGS[name]) {
      const { root, m } = mount(name, cfg);
      assert.doesNotMatch(root.innerHTML, NO_RAW, name);
      assert.ok(root.querySelector("svg"), name);
      assert.ok(root.classList.contains("fm-model"), name);
      assert.equal(root.getAttribute("lang"), "en");
      m.destroy();
      assert.equal(root.childElementCount, 0, name);
    }
  }
});

test("mount balance: arrow keys and a pointer drag move the guess, the beam tips and the equation applies", () => {
  const { root, m } = mount("balance", { a: 3, b: 2, c: 2, d: 7 });
  assert.equal(root.querySelectorAll(".fm-tile-x").length, 5); // 3 left + 2 right
  assert.equal(root.querySelectorAll(".fm-tile-u").length, 9); // 2 left + 7 right
  const h = sliders(root)[0];
  assert.equal(h.getAttribute("aria-valuenow"), "0");
  key(h, "ArrowRight");
  assert.deepEqual(m.getState().x, frac(1));
  key(h, "ArrowRight", { shiftKey: true });
  assert.deepEqual(m.getState().x, frac(6));
  assert.equal(m.getState().tilt, "left");
  assert.equal(root.querySelector(".fm-beam").getAttribute("transform"), "rotate(-6 180 154)");
  fire(h, "pointerdown", { clientX: 100, clientY: 20 });
  fire(h, "pointermove", { clientX: 24 + 312 * 0.75 }); // x = 5 on the -10..10 line
  assert.deepEqual(m.getState().x, frac(5));
  assert.equal(m.getState().tilt, "level");
  assert.equal(root.querySelector(".fm-beam").getAttribute("transform"), "rotate(0 180 154)");
  fire(h, "pointerup");
  const input = root.querySelector('input[id$="-x"]');
  input.value = "7/2";
  fire(input, "change");
  assert.deepEqual(m.getState().x, frac(7, 2));
  assert.equal(m.getState().tilt, "right");
  input.value = "lots";
  fire(input, "change");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.deepEqual(m.getState().x, frac(7, 2));
  // Operations: the solution stays hidden until x = n is reached.
  assert.doesNotMatch(root.querySelector(".fm-explain").textContent, /solution is/);
  fire(button(root, /^x-tiles$/), "click");
  const amount = root.querySelector('input[id$="-amt"]');
  amount.value = "2";
  fire(button(root, /Do it to both sides/), "click");
  assert.equal(m.getState().text, "x + 2 = 7");
  fire(button(root, /^A number$/), "click");
  fire(button(root, /Do it to both sides/), "click");
  assert.equal(m.getState().text, "x = 5");
  assert.match(root.querySelector(".fm-explain").textContent, /solution is x = 5/);
  assert.equal(root.querySelectorAll("ol.fm-log li").length, 2);
  amount.value = "0";
  fire(button(root, /Do it to both sides/), "click");
  assert.equal(amount.getAttribute("aria-invalid"), "true");
  assert.equal(m.getState().log.length, 2);
  fire(button(root, /Undo/), "click");
  assert.equal(m.getState().text, "x + 2 = 7");
  m.destroy();
});

test("mount balance: language switch keeps the state; expression mode combines; readonly has no handles", () => {
  const { root, m } = mount("balance", { a: 3, b: 2, c: 2, d: 7, x: 4 });
  m.setLang("es");
  assert.match(root.textContent, /Sumar/);
  assert.match(root.textContent, /Con x = 4 el lado izquierdo es 14/);
  assert.equal(root.getAttribute("lang"), "es");
  assert.deepEqual(m.getState().x, frac(4));
  key(sliders(root)[0], "ArrowRight");
  assert.deepEqual(m.getState().x, frac(5));
  assert.doesNotMatch(root.textContent, /undefined|NaN/);
  m.destroy();
  const e = mount("balance", {
    combine: [
      [2, 3],
      [1, -1],
    ],
    x: 4,
  });
  assert.equal(e.root.querySelectorAll(".fm-tray").length, 2);
  fire(button(e.root, /Combine like terms/), "click");
  assert.equal(e.root.querySelectorAll(".fm-tray").length, 1);
  assert.match(e.root.textContent, /3 × 4 \+ 2 = 14/);
  key(sliders(e.root)[0], "ArrowRight");
  assert.match(e.root.textContent, /3 × 5 \+ 2 = 17/);
  e.m.destroy();
  const ro = mount("balance", { a: 3, b: 2, c: 2, d: 7, x: 4 }, { readonly: true });
  assert.equal(
    ro.root.querySelectorAll("[role=slider], .fm-handle, input, button, [tabindex]").length,
    0,
  );
  assert.equal(ro.root.querySelectorAll(".fm-tile-x").length, 5);
  ro.m.setState({ x: 5 });
  assert.equal(ro.root.querySelector(".fm-beam").getAttribute("transform"), "rotate(0 180 154)");
  ro.m.destroy();
});

test("mount numberline: the endpoint moves by arrow key and by pointer; open and closed circles differ", () => {
  const { root, m } = mount("numberline", { rule: "x > 3" });
  assert.equal(root.querySelectorAll(".fm-end-open").length, 1);
  assert.equal(root.querySelectorAll(".fm-end-closed").length, 0);
  const h = sliders(root)[0];
  assert.equal(h.getAttribute("aria-valuenow"), "3");
  key(h, "ArrowRight");
  assert.equal(m.getState().rule, "x > 4");
  key(h, "ArrowLeft", { shiftKey: true });
  assert.equal(m.getState().rule, `x > ${M}1`);
  fire(h, "pointerdown", { clientX: 100 });
  fire(h, "pointermove", { clientX: 24 + 312 * 0.4 }); // -2 on the -10..10 line
  assert.equal(m.getState().rule, `x > ${M}2`);
  fire(h, "pointerup");
  fire(button(root, /Include the boundary/), "click");
  assert.equal(m.getState().rule, `x ≥ ${M}2`);
  assert.equal(root.querySelectorAll(".fm-end-closed").length >= 1, true);
  fire(button(root, /Shade left/), "click");
  assert.equal(m.getState().rule, `x ≤ ${M}2`);
  key(h, "End");
  assert.equal(m.getState().rule, "x ≤ 10");
  const rule = root.querySelector('input[id$="-rule"]');
  rule.value = "-2 < x <= 3";
  fire(rule, "change");
  assert.equal(m.getState().dir, "between");
  assert.equal(sliders(root).length, 2); // two endpoint handles
  key(sliders(root)[1], "ArrowLeft");
  assert.equal(m.getState().rule, `${M}2 < x ≤ 2`);
  rule.value = "x >";
  fire(rule, "change");
  assert.equal(rule.getAttribute("aria-invalid"), "true");
  const test = root.querySelector('input[id$="-test"]');
  test.value = "2";
  fire(test, "change");
  assert.match(root.querySelector('output[id$="-ans"]').textContent, /Yes/);
  test.value = "5";
  fire(test, "change");
  assert.match(root.querySelector('output[id$="-ans"]').textContent, /No/);
  m.setLang("es");
  assert.match(root.textContent, /Incluir el límite/);
  assert.equal(m.getState().dir, "between");
  m.destroy();
});

test("mount numberline: opposites move with the point, order arranges by buttons, readonly has no handles", () => {
  const o = mount("numberline", { mode: "opposites", value: -4 });
  assert.equal(o.root.querySelectorAll(".fm-arc").length, 2);
  key(sliders(o.root)[0], "ArrowRight");
  assert.deepEqual(o.m.getState().v, frac(-3));
  assert.deepEqual(o.m.getState().opposite, frac(3));
  assert.equal(o.root.querySelector('output[id$="-opp"]').textContent, "3");
  assert.equal(o.root.querySelector('output[id$="-abs"]').textContent, "3");
  o.m.destroy();
  const r = mount("numberline", { mode: "order", values: [3, -5, -2] });
  assert.equal(sliders(r.root).length, 0);
  const items = () =>
    [...r.root.querySelectorAll(".fm-order-item .fm-num")].map((n) => n.textContent);
  assert.deepEqual(items(), ["3", `${M}5`, `${M}2`]);
  assert.doesNotMatch(r.root.querySelector(".fm-explain").textContent, /From least to greatest/);
  fire(r.root.querySelectorAll(".fm-order-item")[0].querySelectorAll("button")[1], "click"); // 3 later
  assert.deepEqual(items(), [`${M}5`, "3", `${M}2`]);
  fire(r.root.querySelectorAll(".fm-order-item")[1].querySelectorAll("button")[1], "click");
  assert.deepEqual(items(), [`${M}5`, `${M}2`, "3"]);
  assert.equal(r.m.getState().inOrder, true);
  assert.match(
    r.root.querySelector(".fm-explain").textContent,
    new RegExp(`From least to greatest: ${M}5, ${M}2, 3`),
  );
  assert.equal(r.root.querySelector(".fm-order-item button").disabled, true); // first item cannot move earlier
  r.m.destroy();
  for (const cfg of [{ rule: "x > 3" }, { mode: "opposites" }, { mode: "order" }]) {
    const ro = mount("numberline", cfg, { readonly: true });
    assert.equal(
      ro.root.querySelectorAll("[role=slider], .fm-handle, input, button, [tabindex]").length,
      0,
    );
    ro.m.destroy();
  }
});

test("mount coordinate: arrow keys and a pointer drag move a point; the table follows; reflection draws images", () => {
  const { root, m } = mount("coordinate", {
    points: [
      [-2, 3],
      [4, 3],
    ],
  });
  const hs = sliders(root);
  assert.equal(hs.length, 2);
  assert.equal(hs[0].getAttribute("aria-valuetext"), "A (−2, 3)");
  key(hs[0], "ArrowRight");
  assert.deepEqual(m.getState().points[0], { x: frac(-1), y: frac(3) });
  key(hs[0], "ArrowDown", { shiftKey: true });
  assert.deepEqual(m.getState().points[0], { x: frac(-1), y: frac(-2) });
  key(hs[0], "ArrowUp");
  key(hs[0], "ArrowLeft");
  assert.deepEqual(m.getState().points[0], { x: frac(-2), y: frac(-1) });
  const u = 160 / 6; // pixels per unit at range 6
  fire(hs[1], "pointerdown", { clientX: 180 + 4 * u, clientY: 180 - 3 * u });
  fire(hs[1], "pointermove", { clientX: 180 + 2 * u, clientY: 180 + 3 * u });
  assert.deepEqual(m.getState().points[1], { x: frac(2), y: frac(-3) });
  fire(hs[1], "pointermove", { clientX: 180 + 40 * u, clientY: 180 });
  assert.deepEqual(m.getState().points[1], { x: frac(6), y: frac(0) }); // stays on the plane
  fire(hs[1], "pointerup");
  fire(hs[1], "pointermove", { clientX: 180, clientY: 180 });
  assert.deepEqual(m.getState().points[1], { x: frac(6), y: frac(0) }); // no drag in progress
  const rows = root.querySelectorAll("tbody tr");
  assert.equal(rows.length, 2);
  assert.equal(rows[1].querySelectorAll("input")[0].value, "6");
  const x0 = rows[0].querySelectorAll("input")[0];
  x0.value = "5";
  fire(x0, "change");
  assert.deepEqual(m.getState().points[0].x, frac(5));
  assert.equal(sliders(root)[0].getAttribute("aria-valuenow"), "5");
  x0.value = "99";
  fire(x0, "change");
  assert.equal(x0.getAttribute("aria-invalid"), "true");
  assert.deepEqual(m.getState().points[0].x, frac(5));
  assert.equal(root.querySelectorAll(".fm-ghost").length, 0);
  fire(button(root, /Reflect across y-axis/), "click");
  assert.equal(root.querySelectorAll(".fm-ghost").length, 2);
  assert.equal(root.querySelectorAll(".fm-mirror").length, 1);
  assert.deepEqual(m.getState().images[0], { x: frac(-5), y: m.getState().points[0].y });
  assert.match(root.querySelector("thead").textContent, /Image x/);
  fire(button(root, /Half steps/), "click");
  key(sliders(root)[0], "ArrowRight");
  assert.deepEqual(m.getState().points[0].x, frac(11, 2));
  fire(button(root, /Add a point/), "click");
  assert.equal(root.querySelectorAll("tbody tr").length, 3);
  assert.equal(sliders(root).length, 3);
  fire(root.querySelectorAll("tbody tr")[2].querySelector("button"), "click");
  assert.equal(sliders(root).length, 2);
  m.setLang("es");
  assert.match(root.textContent, /Reflejar en/);
  assert.match(root.querySelector(".fm-explain").textContent, /Reflejar en el eje y/);
  assert.equal(m.getState().points.length, 2);
  m.destroy();
  const ro = mount(
    "coordinate",
    {
      points: [
        [1, 2],
        [3, 2],
      ],
      reflect: "x",
    },
    { readonly: true },
  );
  assert.equal(
    ro.root.querySelectorAll("[role=slider], .fm-handle, input, button, [tabindex]").length,
    0,
  );
  assert.equal(ro.root.querySelectorAll("tbody tr").length, 2);
  assert.equal(ro.root.querySelectorAll(".fm-ghost").length, 2);
  ro.m.destroy();
});

test("mount data: tap to add a dot, drag a dot to move it, keys on the cursor, outliers change shape", () => {
  const { root, m } = mount("data", { values: [2, 3, 3, 5, 9] });
  const svg = root.querySelector(".fm-dotplot");
  const col = (k) => 24 + (312 * k) / 12; // viewBox x of axis value k on 0..12
  assert.equal(root.querySelectorAll(".fm-dot-data").length, 5);
  fire(svg, "click", { clientX: col(7) });
  assert.deepEqual(m.getState().values, [2, 3, 3, 5, 7, 9]);
  const dotAt = (v) => root.querySelector(`.fm-dot-data[data-v="${v}"]`);
  fire(dotAt(7), "pointerdown", { clientX: col(7), clientY: 90 });
  fire(svg, "pointermove", { clientX: col(10) });
  assert.deepEqual(m.getState().values, [2, 3, 3, 5, 9, 10]);
  fire(svg, "pointermove", { clientX: col(11) });
  assert.deepEqual(m.getState().values, [2, 3, 3, 5, 9, 11]); // one dot follows the pointer
  fire(svg, "pointerup");
  fire(svg, "pointermove", { clientX: col(1) });
  assert.deepEqual(m.getState().values, [2, 3, 3, 5, 9, 11]);
  const tableText = () => root.querySelector(".fm-stats").textContent;
  assert.match(tableText(), /Mean ▲.*?(\d+\/\d+ = [\d.]+|\d+)/);
  const cursor = sliders(root)[0];
  key(cursor, "Home");
  assert.equal(m.getState().cursor, 0);
  key(cursor, "ArrowRight", { shiftKey: true });
  assert.equal(m.getState().cursor, 5);
  key(cursor, "+");
  assert.deepEqual(m.getState().values, [2, 3, 3, 5, 5, 9, 11]);
  key(cursor, "Delete");
  assert.deepEqual(m.getState().values, [2, 3, 3, 5, 9, 11]);
  assert.match(button(root, /Add a dot at 5/).textContent, /5/);
  fire(button(root, /Add a dot at 5/), "click");
  fire(button(root, /Remove a dot at 5/), "click");
  fire(button(root, /Undo/), "click");
  m.setState({ values: [1, 2, 2, 3, 3, 4, 12] });
  assert.equal(root.querySelectorAll(".fm-outlier").length, 1); // 12 is beyond Q3 + 1.5 * IQR = 4 + 3
  assert.match(tableText(), /Outliers ◇12/);
  fire(button(root, /Show MAD/), "click");
  assert.match(tableText(), /MAD/);
  m.setLang("es");
  assert.match(root.textContent, /Mediana/);
  assert.match(root.querySelector(".fm-explain").textContent, /Valores atípicos: 12/);
  assert.deepEqual(m.getState().values, [1, 2, 2, 3, 3, 4, 12]);
  m.destroy();
  const ro = mount("data", { values: [2, 3, 3, 5, 9] }, { readonly: true });
  assert.equal(
    ro.root.querySelectorAll("[role=slider], .fm-handle, input, button, [tabindex]").length,
    0,
  );
  assert.equal(ro.root.querySelectorAll(".fm-dot-data").length, 5);
  fire(ro.root.querySelector(".fm-dotplot"), "click", { clientX: col(7) });
  assert.deepEqual(ro.m.getState().values, [2, 3, 3, 5, 9]); // a read-only plot cannot be edited
  ro.m.destroy();
});

test("mount geometry: base and height handles resize the shape by key and by pointer", () => {
  const { root, m } = mount("geometry", { mode: "area", shape: "triangle", b: 6, h: 4, slant: 5 });
  const [bh, hh] = sliders(root);
  assert.equal(bh.getAttribute("aria-valuenow"), "6");
  key(bh, "ArrowRight");
  assert.deepEqual(m.getState().b, frac(13, 2)); // steps of 1/2
  key(bh, "ArrowRight", { shiftKey: true });
  assert.deepEqual(m.getState().b, frac(15, 2));
  assert.match(root.querySelector(".fm-readout").textContent, /Area = ½ × \(15\/2\) × 4 = 15/);
  const u = 15; // pixels per unit for a triangle with max 10
  fire(bh, "pointerdown", { clientX: 100, clientY: 100 });
  fire(bh, "pointermove", { clientX: 100 - 3 * u }); // 3 units shorter
  assert.deepEqual(m.getState().b, frac(9, 2));
  fire(bh, "pointerup");
  fire(hh, "pointerdown", { clientX: 100, clientY: 100 });
  fire(hh, "pointermove", { clientX: 100, clientY: 100 - 3 * u }); // up 3: asks for 7 but the slant stops it at 5
  assert.deepEqual(m.getState().h, frac(5));
  fire(hh, "pointerup");
  assert.deepEqual(m.getState().area, frac(45, 4)); // 1/2 * 9/2 * 5
  key(hh, "Home");
  assert.deepEqual(m.getState().h, frac(1, 2));
  assert.equal(root.querySelectorAll(".fm-ghost-shape").length, 0);
  fire(button(root, /Show how it works/), "click");
  assert.equal(root.querySelectorAll(".fm-ghost-shape").length, 1);
  fire(button(root, /Trapezoid/), "click");
  assert.equal(sliders(root).length, 3); // the second base appears
  assert.match(root.textContent, /b₂ =/);
  fire(button(root, /^Rectangle$/), "click");
  assert.equal(sliders(root).length, 2);
  assert.equal(root.querySelectorAll(".fm-height").length, 0);
  m.setLang("es");
  assert.match(root.textContent, /Mostrar cómo funciona/);
  assert.match(
    root.querySelector(".fm-explain").textContent,
    /El área de un rectángulo es base × altura/,
  );
  assert.equal(m.getState().shape, "rect");
  m.destroy();
  const ro = mount(
    "geometry",
    { mode: "area", shape: "parallelogram", decompose: true },
    { readonly: true },
  );
  assert.equal(
    ro.root.querySelectorAll("[role=slider], .fm-handle, input, button, [tabindex]").length,
    0,
  );
  assert.equal(ro.root.querySelectorAll(".fm-shape").length, 1);
  ro.m.destroy();
});

test("mount geometry: prism edges drag, the cube grid appears, and the net folds and unfolds", () => {
  const v = mount("geometry", { mode: "volume", l: "3/2", w: 2, h: "4/3" });
  assert.equal(sliders(v.root).length, 3);
  assert.equal(v.root.querySelectorAll(".fm-layer").length, 1);
  assert.match(
    v.root.querySelector(".fm-readout").textContent,
    /Cubes: 9 × 12 × 8 = 864 · Volume: 4/,
  );
  const [lh] = sliders(v.root);
  key(lh, "ArrowRight");
  assert.deepEqual(v.m.getState().l, frac(2)); // 3/2 + 1/2
  assert.deepEqual(v.m.getState().volume, frac(16, 3));
  const u = Math.min(300 / (1.6 * 6), 190 / (1.5 * 6));
  fire(lh, "pointerdown", { clientX: 100, clientY: 100 });
  fire(lh, "pointermove", { clientX: 100 + 2 * u });
  assert.deepEqual(v.m.getState().l, frac(4));
  fire(lh, "pointerup");
  v.m.destroy();

  const n = mount("geometry", { mode: "net", l: 3, w: 2, h: 4 });
  assert.equal(n.root.querySelectorAll("rect.fm-face").length, 6);
  assert.equal(n.root.querySelectorAll("tbody tr").length, 7); // six faces and the total
  assert.match(
    n.root.querySelector("tbody tr:last-child").textContent,
    /12 \+ 12 \+ 6 \+ 6 \+ 8 \+ 8.*52/,
  );
  assert.match(n.root.querySelector(".fm-readout").textContent, /Surface area: 52/);
  const [lw, ww, hw] = sliders(n.root);
  key(lw, "ArrowRight");
  assert.deepEqual(n.m.getState().l, frac(7, 2));
  key(ww, "ArrowLeft");
  assert.deepEqual(n.m.getState().w, frac(3, 2));
  key(hw, "ArrowRight", { shiftKey: true });
  assert.deepEqual(n.m.getState().h, frac(5));
  // 2(lw + lh + wh) with l = 7/2, w = 3/2, h = 5: 5.25 + 17.5 + 7.5 = 30.25, doubled 60.5 = 121/2.
  assert.deepEqual(n.m.getState().surface, frac(121, 2));
  fire(button(n.root, /Fold into a box/), "click");
  assert.equal(n.m.getState().folded, true);
  assert.equal(n.root.querySelectorAll("rect.fm-face").length, 0);
  assert.equal(n.root.querySelectorAll("polygon.fm-face").length, 3);
  assert.ok(button(n.root, /Unfold the net/));
  fire(button(n.root, /Unfold the net/), "click");
  assert.equal(n.root.querySelectorAll("rect.fm-face").length, 6);
  n.m.setLang("es");
  assert.match(n.root.textContent, /Área total/);
  assert.match(n.root.textContent, /Frente/);
  assert.equal(n.m.getState().folded, false);
  n.m.destroy();
  for (const cfg of [{ mode: "volume" }, { mode: "net" }]) {
    const ro = mount("geometry", cfg, { readonly: true });
    assert.equal(
      ro.root.querySelectorAll("[role=slider], .fm-handle, input, button, [tabindex]").length,
      0,
    );
    ro.m.destroy();
  }
});

test("reduced motion: no animation class and no inline transitions on any new family", () => {
  reduceMotion = true;
  for (const name of NEW) {
    const { root, m } = mount(name, CONFIGS[name][0]);
    assert.equal(root.classList.contains("fm-anim"), false, name);
    assert.equal(root.querySelectorAll("[style*='transition']").length, 0, name);
    m.destroy();
  }
  reduceMotion = false;
  const { root, m } = mount("balance", CONFIGS.balance[0]);
  assert.equal(root.classList.contains("fm-anim"), true);
  assert.equal(root.querySelectorAll("[style*='transition']").length, 0);
  m.destroy();
});

test("mount: onChange fires for changes, not for the first draw, and destroy removes every listener", () => {
  for (const name of NEW) {
    const calls = [];
    const { root, m } = mount(name, CONFIGS[name][0], { onChange: (s) => calls.push(s) });
    assert.deepEqual(calls, [], name);
    const h = sliders(root)[0];
    assert.ok(h, name);
    key(h, "ArrowRight");
    assert.equal(calls.length, 1, name);
    m.destroy();
    const before = JSON.stringify(m.getState());
    key(h, "ArrowRight");
    fire(h, "pointerdown", { clientX: 0, clientY: 0 });
    fire(h, "pointermove", { clientX: 100, clientY: 100 });
    assert.equal(JSON.stringify(m.getState()), before, name);
    assert.equal(calls.length, 1, name);
  }
});
