// Family Mission "pattern" model: rule mode (5.OA.B.3, find a rule and check it with a table) and
// solve mode (6.AT.11, undo the multiplying and check by substituting). Expected values are worked
// out by hand here, independently of the code under test.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import * as fam from "../assets/family-mission/models/pattern.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
globalThis.matchMedia = () => ({ matches: true });
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));

const create = fam.create;
const mount = (root, cfg, opts) => {
  const model = fam.create(cfg);
  const view = fam.mount(root, model, opts);
  return Object.assign(model, { setLang: view.setLang, destroy: view.destroy });
};
const click = (node) =>
  node.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
const type = (input, text) => {
  input.value = text;
  input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
};
const box = () => {
  const root = document.createElement("div");
  document.body.append(root);
  return root;
};
const words = (en, es) => ({ en, es });
const dimes = {
  mode: "rule",
  m: "0.1",
  b: "0",
  maxX: 100,
  rows: [1, 2, 3],
  quantities: { x: words("dimes", "dimes"), y: words("value", "valor") },
  units: { y: words("dollars", "dólares"), yPrefix: "$", yDecimals: 2 },
};
const whale = {
  mode: "rule",
  m: "0.025",
  b: "4.5",
  maxX: 1000,
  rows: [1, 2, 3],
  quantities: { x: words("days", "días"), y: words("length", "longitud") },
  units: { y: words("meters", "metros") },
};
const cars = {
  mode: "solve",
  m: "2.5",
  letters: { x: "h", y: "c" },
  quantities: { x: words("hours", "horas"), y: words("cars", "autos") },
  units: { x: words("hours", "horas"), y: words("cars", "autos") },
  target: "1000",
  given: "8",
};
const posters = {
  mode: "solve",
  m: "26",
  letters: { x: "n", y: "e" },
  quantities: { x: words("posters", "carteles"), y: words("earned", "ganado") },
  units: { x: words("posters", "carteles"), yPrefix: "$" },
  target: "1300",
  given: "5",
};
const gym = {
  mode: "solve",
  m: "3",
  b: "15",
  letters: { x: "v", y: "c" },
  quantities: { x: words("visits", "visitas"), y: words("total cost", "costo total") },
  units: { x: words("visits", "visitas"), yPrefix: "$" },
  target: "60",
  given: "8",
};
const named = (root, text) =>
  [...root.querySelectorAll("button")].find((b) => b.textContent === text);
const guess = (m, g) => m.setState({ guess: g });

// ── Rule mode: exact table values ───────────────────────────────────────────

test("rule: 100 dimes are $10.00 and 40 dimes are $4.00 (0.1 × x, exact)", () => {
  const m = create(dimes);
  assert.equal(m.setState({ addX: 100 }), true);
  assert.equal(m.setState({ addX: "40" }), true);
  const rows = m.getState().rows;
  assert.deepEqual(
    rows.map((r) => r.x),
    [1, 2, 3, 40, 100],
    "rows stay in order",
  );
  assert.deepEqual(rows[0].y, { n: 1, d: 10 });
  assert.deepEqual(rows[3].y, { n: 4, d: 1 });
  assert.deepEqual(rows[4].y, { n: 10, d: 1 });
});

test("rule: the whale is 4.525 m after one day and 15 m after 420 days (4.5 + 0.025 × x)", () => {
  const m = create(whale);
  m.setState({ addX: 420 });
  const [one, , , big] = m.getState().rows;
  assert.deepEqual(one.y, { n: 181, d: 40 }, "4.525 = 181/40");
  assert.deepEqual(big.y, { n: 15, d: 1 }, "420 / 40 = 10.5, plus 4.5 = 15");
});

test("rule: 'start at b, add m each step' and 'multiply by m' both match the dimes", () => {
  const m = create(dimes);
  guess(m, { start: "0", step: "0.1" });
  m.setState({ check: true });
  assert.equal(m.getState().result, "all");
  assert.deepEqual(
    m.getState().rows.map((r) => r.status),
    ["match", "match", "match"],
  );
  guess(m, { kind: "times", step: "0.10" });
  assert.equal(m.getState().checked, false, "changing the rule clears the check");
  m.setState({ check: true });
  assert.equal(m.getState().result, "all");
});

test("rule: a wrong rule differs row by row, with no score", () => {
  const m = create(dimes);
  guess(m, { start: "1", step: "0.1" }); // 1.1, 1.2, 1.3 against 0.1, 0.2, 0.3
  m.setState({ check: true });
  const d = m.getState();
  assert.equal(d.result, "some");
  assert.deepEqual(d.rows[0].guess, { n: 11, d: 10 });
  assert.deepEqual(
    d.rows.map((r) => r.status),
    ["differs", "differs", "differs"],
  );
  assert.equal(JSON.stringify(d).includes("score"), false);
  guess(m, { start: "0", step: "1" });
  m.setState({ check: true });
  assert.equal(m.getState().result, "some", "step 1 instead of 0.1");
});

test("rule: the whale needs the start AND the step in meters (2.5 cm is 0.025 m)", () => {
  const m = create(whale);
  m.setState({ addX: 420 });
  const check = (g) => {
    guess(m, g);
    m.setState({ check: true });
    return m.getState().result;
  };
  assert.equal(check({ start: "4.5", step: "2.5" }), "some", "centimetres typed as metres");
  assert.equal(check({ start: "0", step: "0.025" }), "some", "forgot the starting length");
  assert.equal(
    check({ kind: "times", step: "0.025" }),
    "some",
    "multiplying alone cannot start at 4.5",
  );
  assert.equal(check({ kind: "add", start: "4.5", step: "0.025" }), "all");
});

test("rule: an unfinished rule is 'incomplete', checking needs a row, rows are bounded", () => {
  const m = create({ ...dimes, rows: [] });
  assert.equal(m.setState({ check: true }), false, "no rows to compare with yet");
  m.setState({ addX: 5 });
  m.setState({ check: true });
  assert.equal(m.getState().result, "incomplete");
  assert.equal(m.setState({ addX: 5 }), false, "no duplicate row");
  assert.equal(m.setState({ addX: 0 }), false);
  assert.equal(m.setState({ addX: 101 }), false, "past maxX");
  assert.equal(m.setState({ addX: 2.5 }), false);
  assert.equal(m.setState({ addX: "abc" }), false);
  for (const x of [1, 2, 3, 4, 6, 7, 8]) assert.equal(m.setState({ addX: x }), true);
  assert.equal(m.getState().rows.length, 8);
  assert.equal(m.getState().canAdd, false);
  assert.equal(m.setState({ addX: 9 }), false, "at most 8 rows");
  assert.equal(guess(m, { step: "-1" }), false, "negative numbers are refused");
  assert.equal(guess(m, { step: "1,2,3" }), false);
  assert.equal(guess(m, { step: "50%" }), false);
});

test("rule: undo, reset and presets", () => {
  const chips = {
    quantities: { x: words("bags", "bolsas"), y: words("cost", "costo") },
    m: "2.5",
    rows: [1, 2],
  };
  const m = create({
    ...dimes,
    presets: [{ title: words("Dimes", "Dimes") }, { title: words("Chips", "Papitas"), ...chips }],
  });
  m.setState({ addX: 4 });
  assert.equal(m.getState().rows.length, 4);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().rows.length, 3);
  m.setState({ addX: 4 });
  m.setState({ preset: 1 });
  assert.deepEqual(
    m.getState().rows.map((r) => r.x),
    [1, 2],
  );
  assert.deepEqual(m.getState().rows[1].y, { n: 5, d: 1 }, "2 bags at 2.5 each");
  m.setState({ addX: 4 });
  assert.deepEqual(m.getState().rows[2].y, { n: 10, d: 1 });
  m.reset();
  assert.deepEqual(
    m.getState().rows.map((r) => r.x),
    [1, 2, 3],
  );
  assert.equal(m.setState({ preset: 7 }), false);
});

test("rule: the real rule is never printed before the student's rule matches", () => {
  const m = create(dimes);
  assert.doesNotMatch(m.getAccessibleDescription("en"), /0\.1 × x/);
  assert.doesNotMatch(m.getMathematicalExplanation("en"), /0\.1 × x/);
  guess(m, { start: "0", step: "0.1" });
  m.setState({ check: true });
  assert.match(
    m.getMathematicalExplanation("en"),
    /y = 0\.1 × x\. Row x = 1: 0\.1 × 1 = \$0\.10\./,
  );
  assert.match(m.getAccessibleDescription("en"), /x = 3, y = \$0\.30/);
  assert.match(
    m.getAccessibleDescription("es"),
    /Modelo de tabla de patrón.*Tu regla coincide con todas las filas/,
  );
});

test("rule: tasks check the finished rule", () => {
  const m = create({ ...dimes, task: { kind: "rule" } });
  assert.equal(m.validate().reason, "not-finished");
  guess(m, { start: "0", step: "0.2" });
  m.setState({ check: true });
  assert.equal(m.validate().reason, "incorrect");
  guess(m, { step: "0.1" });
  m.setState({ check: true });
  assert.deepEqual(m.validate(), { ok: true, reason: "correct", misconception: null });
  assert.equal(create(dimes).validate().reason, "no-task");
});

// ── Solve mode: exact inverse operations ─────────────────────────────────────

test("solve: 2.5 cars an hour, 1,000 cars -> 400 hours, checked by 2.5 × 400", () => {
  const m = create(cars);
  assert.equal(m.getState().known, "y");
  assert.equal(m.setState({ advance: true }), true); // substitute
  assert.equal(m.setState({ advance: true }), false, "now a move must be chosen");
  assert.equal(m.setState({ op: "mul" }), true);
  assert.equal(m.getState().tried, "mul");
  assert.equal(m.getState().stage, 1, "a wrong move does not advance");
  assert.equal(m.setState({ op: "div" }), true);
  assert.equal(m.getState().stage, 2);
  assert.equal(m.getState().tried, null);
  assert.deepEqual(m.getState().answer, { n: 400, d: 1 });
  m.setState({ advance: true });
  const d = m.getState();
  assert.equal(d.finished, true);
  assert.deepEqual(d.back, { n: 1000, d: 1 }, "2.5 × 400 = 1,000");
  assert.equal(d.checkOk, true);
  assert.equal(m.setState({ advance: true }), false);
  assert.match(m.getMathematicalExplanation("en"), /The equation is c = 2\.5 × h\./);
  assert.match(
    m.getMathematicalExplanation("en"),
    /2\.5 × h = 1,000\. Left side: 2\.5 × h ÷ 2\.5 = h\. Right side: 1,000 ÷ 2\.5 = 400\./,
  );
  assert.match(
    m.getMathematicalExplanation("en"),
    /h = 400 hours\. Check: 2\.5 × 400 = 1,000\. It matches\./,
  );
  assert.match(m.getMathematicalExplanation("es"), /Lado derecho: 1,000 ÷ 2\.5 = 400/);
});

test("solve: wrong inverse moves (add, subtract, multiply) are all 'try another look'", () => {
  const m = create(cars);
  m.setState({ advance: true });
  for (const op of ["add", "sub", "mul"]) {
    assert.equal(m.setState({ op }), true);
    assert.equal(m.getState().stage, 1);
    assert.equal(m.getState().tried, op);
  }
  assert.equal(m.setState({ op: "pow" }), false);
});

test("solve: with the hours known, c = 2.5 × 8 = 20, then 20 ÷ 2.5 = 8 checks it", () => {
  const m = create(cars);
  assert.equal(m.setState({ known: "x" }), true);
  assert.equal(m.getState().value.n, 8);
  assert.equal(
    m.setState({ op: "div" }),
    false,
    "no inverse move when the multiplying is the step",
  );
  for (let i = 0; i < 3; i++) assert.equal(m.setState({ advance: true }), true);
  const d = m.getState();
  assert.deepEqual(d.answer, { n: 20, d: 1 });
  assert.deepEqual(d.back, { n: 8, d: 1 });
  assert.equal(d.finished, true);
  assert.match(
    m.getMathematicalExplanation("en"),
    /c = 20 cars\. Check: 20 ÷ 2\.5 = 8\. It matches\./,
  );
});

test("solve: $26 a poster, goal $1,300 -> 50 posters; 5 posters -> $130", () => {
  const m = create(posters);
  m.setState({ advance: true });
  m.setState({ op: "div" });
  assert.deepEqual(m.getState().answer, { n: 50, d: 1 });
  m.setState({ advance: true });
  assert.match(m.getMathematicalExplanation("en"), /26 × 50 = \$1,300\. It matches\./);
  m.setState({ known: "x" });
  for (let i = 0; i < 3; i++) m.setState({ advance: true });
  assert.deepEqual(m.getState().answer, { n: 130, d: 1 });
  assert.match(m.getMathematicalExplanation("en"), /e = \$130\. Check: \$130 ÷ 26 = 5\./);
});

test("solve: a typed number restarts the steps; non-terminating answers stay exact fractions", () => {
  const m = create(cars);
  m.setState({ advance: true });
  assert.equal(m.setState({ value: "1,200" }), true);
  assert.equal(m.getState().stage, 0);
  assert.deepEqual(m.getState().answer, { n: 480, d: 1 }, "1,200 ÷ 2.5");
  for (const bad of ["0", "-5", "abc", "1.23456", "99999999", ""])
    assert.equal(m.setState({ value: bad }), false, bad);
  const third = create({ ...cars, m: "3", target: "10" });
  third.setState({ advance: true });
  third.setState({ op: "div" });
  third.setState({ advance: true });
  assert.deepEqual(third.getState().answer, { n: 10, d: 3 });
  assert.match(third.getMathematicalExplanation("en"), /Right side: 10 ÷ 3 = 10\/3/);
  assert.equal(third.getState().checkOk, true);
});

test("solve: tasks compare the exact answer; undo and reset step back", () => {
  const m = create({ ...cars, task: { answer: "400" } });
  assert.equal(m.validate().reason, "not-finished");
  m.setState({ advance: true });
  m.setState({ op: "div" });
  m.setState({ advance: true });
  assert.deepEqual(m.validate(), { ok: true, reason: "correct", misconception: null });
  assert.equal(create({ ...cars, task: { answer: "401" } }).validate().reason, "not-finished");
  assert.equal(m.undo(), true);
  assert.equal(m.getState().stage, 2);
  m.reset();
  assert.equal(m.getState().stage, 0);
  const wrong = create({ ...cars, task: { answer: "401" } });
  wrong.setState({ advance: true });
  wrong.setState({ op: "div" });
  wrong.setState({ advance: true });
  assert.equal(wrong.validate().reason, "incorrect");
});

// ── Config and state are validated ───────────────────────────────────────────

test("bad configs are refused with a TypeError", () => {
  const cases = [
    {},
    { ...dimes, mode: "balance" },
    { ...dimes, m: "0" },
    { ...dimes, m: "-1" },
    { ...dimes, m: "1/3" },
    { ...dimes, m: "0.12345" },
    { ...dimes, m: "1000000" },
    { ...dimes, b: "x" },
    { ...dimes, maxX: 5000 },
    { ...dimes, maxX: 1.5 },
    { ...dimes, rows: [0] },
    { ...dimes, rows: [101] },
    { ...dimes, rows: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { ...dimes, quantities: undefined },
    { ...dimes, quantities: { x: words("dimes", ""), y: words("v", "v") } },
    { ...dimes, quantities: { x: words("undefined", "x"), y: words("v", "v") } },
    { ...dimes, letters: { x: "a", y: "a" } },
    { ...dimes, letters: { x: "ab" } },
    { ...dimes, units: { yDecimals: 9 } },
    { ...dimes, units: { yPrefix: "$$$$" } },
    { ...dimes, presets: [{ mode: "solve" }] },
    { ...dimes, presets: [{ m: "0" }] },
    { ...dimes, presets: [{}, {}, {}, {}, {}] },
    { ...cars, b: "1000" },
    { ...gym, target: "15" },
    { ...gym, target: "10" },
    { ...gym, b: "x" },
    { ...gym, b: "1000000" },
    { ...gym, presets: [{ b: "60" }] },
    { ...cars, target: undefined },
    { ...cars, target: "0" },
    { ...cars, given: "x" },
  ];
  for (const cfg of cases)
    assert.throws(() => create(cfg), TypeError, JSON.stringify(cfg).slice(0, 80));
  assert.throws(() => create(null), TypeError);
});

test("serialize and restore round-trip; tampered state is refused", () => {
  const m = create(dimes);
  m.setState({ addX: 40 });
  guess(m, { start: "0", step: "0.1" });
  m.setState({ check: true });
  const json = m.serialize();
  const m2 = create(dimes);
  assert.equal(m2.restore(json), true);
  assert.equal(m2.getState().result, "all");
  assert.equal(m2.getState().rows.length, 4);
  assert.equal(m2.restore(json.replace('"checked":true', '"checked":"yes"')), false);
  assert.equal(m2.restore(json.replace('"xs":[1,2,3,40]', '"xs":[3,2,1,40]')), false);
  assert.equal(m2.restore(json.replace('"xs":[1,2,3,40]', '"xs":[1,2,3,400]')), false, "past maxX");
  assert.equal(m2.restore(json.replace('"step":"0.1"', '"step":"-2"')), false);
  assert.equal(
    m2.restore(json.replace('"m":"0.1"', '"m":"0.10"')),
    false,
    "not the canonical problem",
  );
  const s = create(cars);
  s.setState({ advance: true });
  s.setState({ op: "div" });
  const sj = s.serialize();
  const s2 = create(cars);
  assert.equal(s2.restore(sj), true);
  assert.equal(s2.getState().stage, 2);
  assert.equal(s2.restore(sj.replace('"stage":2', '"stage":99')), false);
  assert.equal(s2.restore(sj.replace('"known":"y"', '"known":"z"')), false);
  assert.equal(s2.restore(sj.replace('"tried":null', '"tried":"pow"')), false);
});

test("describeConfig can start a new model and initialize replaces the problem", () => {
  const m = create({ ...cars, presets: [{ target: "300", m: "15" }] });
  const again = create(m.describeConfig());
  assert.deepEqual(again.getState().problem, m.getState().problem);
  assert.equal(again.getState().presets.length, 1);
  m.initialize(posters);
  assert.equal(m.getState().problem.m, "26");
});

// ── Mounted rule mode ────────────────────────────────────────────────────────

test("mounted rule: add rows, try a rule, read matches and differs, switch to Spanish", () => {
  const root = box();
  const m = mount(root, dimes);
  const rows = () => [...root.querySelectorAll(".fm-pattern-table tbody tr")];
  assert.equal(rows().length, 3);
  const add = root.querySelector(".fm-pattern-add input");
  assert.equal(add.value, "4", "the next input is suggested");
  click(root.querySelector(".fm-pattern-add button"));
  assert.equal(rows().length, 4);
  assert.equal(add.value, "5");
  type(add, "100");
  click(root.querySelector(".fm-pattern-add button"));
  assert.equal(rows().length, 5);
  assert.equal(rows()[4].textContent, "100$10.00");
  type(add, "3");
  click(root.querySelector(".fm-pattern-add button"));
  assert.equal(rows().length, 5, "a repeated input is refused");
  assert.match(root.querySelector(".fm-msg").textContent, /not in the table yet/);

  assert.equal(root.querySelector('[data-kind="add"]').getAttribute("aria-pressed"), "true");
  const [start, step] = root.querySelectorAll(".fm-fields input");
  type(start, "0");
  type(step, "0.1");
  assert.equal(root.querySelector(".fm-pattern-eq").textContent, "y = 0 + 0.1 × x");
  assert.equal(
    root.querySelector(".fm-pattern-result").hidden,
    true,
    "nothing is judged before Check",
  );
  click(named(root, "Check my rule"));
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Your rule matches every row.",
  );
  assert.equal(
    [...root.querySelectorAll(".fm-pattern-table td")].filter((c) => c.textContent === "✓ matches")
      .length,
    5,
  );
  assert.equal(root.querySelectorAll("circle.fm-pattern-pt").length, 5);
  assert.equal(root.querySelectorAll("path.fm-pattern-guess").length, 5);

  type(step, "0.2");
  assert.equal(
    root.querySelector(".fm-pattern-result").hidden,
    true,
    "changing the rule clears the verdict",
  );
  click(named(root, "Check my rule"));
  assert.match(
    root.querySelector(".fm-pattern-result").textContent,
    /At least one row differs\. Try another look/,
  );
  assert.equal(
    [...root.querySelectorAll(".fm-pattern-table td")].filter((c) => c.textContent === "≠ differs")
      .length,
    5,
  );
  assert.equal(
    root.querySelector(".fm-pattern-table tbody tr").textContent,
    "1$0.10$0.20≠ differs",
  );

  type(step, "bad");
  assert.equal(step.getAttribute("aria-invalid"), "true");
  assert.match(root.querySelector(".fm-msg:not(:empty)").textContent, /Type a number/);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);

  m.setLang("es");
  assert.match(root.textContent, /Tabla de valores/);
  assert.match(root.textContent, /Revisar mi regla/);
  assert.equal(root.getAttribute("lang"), "es");
  assert.equal(m.getState().rows.length, 5, "language switch keeps the state");
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
  click(root.querySelector(".fm-actions button:last-child"));
  assert.equal(m.getState().rows.length, 3);
  m.destroy();
  assert.equal(root.children.length, 0);
});

test("mounted rule: the whale reaches 15 at 420 days and the rule can be checked at that row", () => {
  const root = box();
  const m = mount(root, {
    ...whale,
    presets: [
      { title: words("Whale", "Ballena") },
      {
        title: words("Puppy", "Cachorro"),
        m: "0.5",
        b: "3",
        quantities: { x: words("weeks", "semanas"), y: words("weight", "peso") },
        units: { y: words("kilograms", "kilogramos") },
      },
    ],
  });
  const add = root.querySelector(".fm-pattern-add input");
  type(add, "420");
  click(root.querySelector(".fm-pattern-add button"));
  const last = [...root.querySelectorAll(".fm-pattern-table tbody tr")].at(-1);
  assert.equal(last.textContent, "42015");
  const [start, step] = root.querySelectorAll(".fm-fields input");
  type(start, "4.5");
  type(step, "0.025");
  click(named(root, "Check my rule"));
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Your rule matches every row.",
  );
  assert.match(root.querySelector("figure").textContent, /● table value.*◇ your rule/);
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(root.querySelector('[data-pick="1"]').getAttribute("aria-pressed"), "true");
  assert.match(root.querySelector(".fm-pattern-table thead").textContent, /weeks/);
  assert.equal(m.getState().rows.length, 3, "a new problem starts over");
  m.destroy();
});

test("mounted rule: every control is a real button or input and the graph has text labels", () => {
  const root = box();
  mount(root, dimes);
  for (const b of root.querySelectorAll("button")) assert.equal(b.getAttribute("type"), "button");
  assert.ok(root.querySelector('[data-kind="times"][aria-pressed="false"]'));
  const svg = root.querySelector("svg");
  assert.equal(svg.getAttribute("role"), "img");
  assert.ok(svg.querySelector("title"));
  assert.match(svg.textContent, /y: value \(dollars\)/);
  assert.match(svg.textContent, /x: dimes/);
  assert.match(svg.textContent, /\$0\.30/, "the top of the y axis is labelled");
  assert.ok(root.querySelector(".fm-sr").textContent.length > 0, "text alternative");
  assert.doesNotMatch(root.outerHTML, /\son[a-z]+=/i, "no inline handlers");
});

test("mounted rule: readonly shows the table and graph with no live controls", () => {
  const root = box();
  mount(root, dimes, { readonly: true });
  assert.equal(root.querySelectorAll("button, input, select, textarea").length, 0);
  assert.equal(root.querySelector(".fm-actions"), null);
  assert.equal(root.querySelectorAll(".fm-pattern-table tbody tr").length, 3);
  assert.ok(root.querySelector("svg"));
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
});

// ── Mounted solve mode ───────────────────────────────────────────────────────

const eq = (root) => root.querySelector(".fm-pattern-eq").textContent;

test("mounted solve: substitute, choose the undo move, read the two-line log, check", () => {
  const root = box();
  const m = mount(root, cars);
  assert.equal(eq(root), "c = 2.5 × h");
  assert.equal(root.querySelectorAll(".fm-pattern-row button[data-op]").length, 0);
  click(named(root, "Substitute 1,000 for c"));
  assert.equal(eq(root), "2.5 × h = 1,000");
  assert.equal(root.querySelectorAll("[data-op]").length, 4);
  click(named(root, "Multiply both sides by 2.5"));
  assert.match(root.querySelector(".fm-msg").textContent, /Try another look/);
  assert.equal(eq(root), "2.5 × h = 1,000");
  assert.equal(root.querySelector(".fm-pattern-log").hidden, true);
  click(named(root, "Divide both sides by 2.5"));
  assert.equal(root.querySelector(".fm-msg").textContent, "");
  assert.equal(eq(root), "h = 400 hours");
  const lines = [...root.querySelectorAll(".fm-pattern-line")].map((p) => p.textContent);
  assert.deepEqual(lines, ["Left side: 2.5 × h ÷ 2.5 = h", "Right side: 1,000 ÷ 2.5 = 400"]);
  click(named(root, "Check by putting it back"));
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Check: 2.5 × 400 = 1,000. It matches.",
  );
  assert.equal(root.querySelectorAll(".fm-pattern-row button[data-adv], [data-op]").length, 0);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);

  m.setLang("es");
  assert.match(root.textContent, /Lo que hicimos a ambos lados/);
  assert.match(root.textContent, /Lado izquierdo: 2\.5 × h ÷ 2\.5 = h/);
  assert.match(root.textContent, /Comprobación: 2\.5 × 400 = 1,000\. Coincide\./);
  assert.equal(m.getState().finished, true, "language switch keeps the state");
  m.destroy();
});

test("mounted solve: choose which number is known, type your own, switch problems", () => {
  const root = box();
  const printer = {
    m: "15",
    target: "300",
    given: "4",
    letters: { x: "m", y: "p" },
    quantities: { x: words("minutes", "minutos"), y: words("pages", "páginas") },
    units: { x: words("minutes", "minutos"), y: words("pages", "páginas") },
  };
  const m = mount(root, { ...cars, presets: [{}, printer] });
  assert.equal(root.querySelector('[data-known="y"]').getAttribute("aria-pressed"), "true");
  assert.equal(root.querySelector('[data-known="y"]').textContent, "cars (c)");
  click(root.querySelector('[data-known="x"]'));
  assert.equal(root.querySelector(".fm-fields input").value, "8");
  assert.equal(root.querySelector('[data-known="x"]').getAttribute("aria-pressed"), "true");
  click(named(root, "Substitute 8 for h"));
  assert.equal(eq(root), "c = 2.5 × 8");
  click(named(root, "Work out 2.5 × 8"));
  assert.equal(eq(root), "c = 20 cars");
  click(named(root, "Check by putting it back"));
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Check: 20 ÷ 2.5 = 8. It matches.",
  );
  assert.equal(
    root.querySelector(".fm-pattern-log").hidden,
    true,
    "no inverse step when the hours are known",
  );

  const input = root.querySelector(".fm-fields input");
  type(input, "x");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.match(root.querySelector(".fm-msg:not(:empty)").textContent, /Type a number above 0/);
  type(input, "10");
  assert.equal(m.getState().stage, 0);
  click(named(root, "Substitute 10 for h"));
  click(named(root, "Work out 2.5 × 10"));
  assert.equal(eq(root), "c = 25 cars");

  click(root.querySelector('[data-pick="1"]'));
  assert.equal(eq(root), "p = 15 × m");
  click(root.querySelector('[data-known="y"]'));
  click(named(root, "Substitute 300 for p"));
  click(named(root, "Divide both sides by 15"));
  assert.equal(eq(root), "m = 20 minutes");
  click(root.querySelector(".fm-actions button"));
  assert.equal(m.getState().stage, 1, "undo steps back one move");
  m.destroy();
});

test("mounted solve: readonly shows the equation with no live controls", () => {
  const root = box();
  mount(root, cars, { readonly: true });
  assert.equal(root.querySelectorAll("button").length, 0);
  assert.equal(root.querySelectorAll("input").length, 0);
  assert.equal(root.querySelector(".fm-actions"), null);
  assert.equal(eq(root), "c = 2.5 × h");
  assert.match(root.querySelector("output").textContent, /1,000/);
});

test("keyboard: Enter in the input adds the row, and the controls are announced politely", async () => {
  const root = box();
  mount(root, dimes);
  const add = root.querySelector(".fm-pattern-add input");
  add.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
  assert.equal(root.querySelectorAll(".fm-pattern-table tbody tr").length, 4);
  await new Promise((r) => setTimeout(r, 400));
  assert.match(root.querySelector('.fm-live[aria-live="polite"]').textContent, /4 rows/);
});

// ── Solve mode with a starting amount: y = b + m × x (two undo steps) ─────────

const lines = (root) => [...root.querySelectorAll(".fm-pattern-line")].map((p) => p.textContent);
const nothingBroken = (root) => assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);

test("two-step: 15 + 3x = 60 -> subtract 15 (45), then divide by 3 (x = 15)", () => {
  const m = create(gym);
  assert.equal(m.getState().start, true);
  assert.equal(m.setState({ advance: true }), true); // 15 + 3 × v = 60
  assert.equal(m.setState({ advance: true }), false, "a move must be chosen");
  assert.equal(m.getState().needsOp, true);
  assert.equal(m.setState({ op: "sub" }), true);
  assert.equal(m.getState().stage, 2);
  assert.deepEqual(m.getState().rest, { n: 45, d: 1 }, "60 - 15");
  assert.equal(m.getState().needsOp, true, "the multiplying is still to undo");
  assert.equal(m.setState({ advance: true }), false);
  assert.equal(m.setState({ op: "div" }), true);
  assert.equal(m.getState().stage, 3);
  assert.deepEqual(m.getState().answer, { n: 15, d: 1 });
  assert.equal(m.getState().finished, false, "the check is still ahead");
  assert.equal(m.setState({ advance: true }), true);
  const d = m.getState();
  assert.equal(d.finished, true);
  assert.deepEqual(d.back, { n: 60, d: 1 }, "15 + 3 × 15 = 60");
  assert.equal(d.checkOk, true);
  assert.equal(m.setState({ advance: true }), false);
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /The equation is c = 15 \+ 3 × v\./);
  assert.match(en, /15 \+ 3 × v = \$60\. Subtract 15 from both sides\./);
  assert.match(en, /Left side: 15 \+ 3 × v − 15 = 3 × v\. 1\. Right side: \$60 − \$15 = \$45\./);
  assert.match(en, /3 × v = \$45\. Divide both sides by 3\./);
  assert.match(en, /Right side: \$45 ÷ 3 = 15\. v = 15 visits\./);
  assert.match(en, /Check: 15 \+ 3 × 15 = \$60\. It matches\./);
  assert.match(m.getMathematicalExplanation("es"), /Restar 15 de ambos lados\./);
  assert.match(
    m.getMathematicalExplanation("es"),
    /Comprobación: 15 \+ 3 × 15 = \$60\. Coincide\./,
  );
  assert.match(
    m.getAccessibleDescription("es"),
    /Modelo de ecuación de dos pasos\. v = 15 visitas/,
  );
});

test("two-step: 20 + 4x = 100 -> subtract 20 (80), divide by 4 (x = 20)", () => {
  const m = create({ ...gym, m: "4", b: "20", target: "100" });
  m.setState({ advance: true });
  m.setState({ op: "sub" });
  assert.deepEqual(m.getState().rest, { n: 80, d: 1 });
  m.setState({ op: "div" });
  assert.deepEqual(m.getState().answer, { n: 20, d: 1 });
  m.setState({ advance: true });
  assert.deepEqual(m.getState().back, { n: 100, d: 1 });
  assert.equal(m.getState().checkOk, true);
});

test("two-step: wrong order or wrong move is 'tried', never advances, never gives the answer", () => {
  const m = create(gym);
  m.setState({ advance: true });
  for (const op of ["div", "mul", "add"]) {
    assert.equal(m.setState({ op }), true);
    assert.equal(m.getState().stage, 1, `${op} first does not advance`);
    assert.equal(m.getState().tried, op);
  }
  const hint = m.getAccessibleDescription("en");
  assert.match(hint, /Undo the adding first, then the multiplying: reverse order/);
  assert.doesNotMatch(
    hint,
    /\b45\b|= 15 visits|subtract/i,
    "the hint states the principle, not the answer",
  );
  assert.match(
    m.getAccessibleDescription("es"),
    /Deshaz primero la suma y luego la multiplicación/,
  );
  m.setState({ op: "sub" });
  assert.equal(m.getState().tried, null);
  for (const op of ["sub", "add", "mul"]) {
    assert.equal(m.setState({ op }), true);
    assert.equal(m.getState().stage, 2, `${op} second does not advance`);
    assert.equal(m.getState().tried, op);
  }
  assert.equal(m.setState({ op: "pow" }), false);
  m.setState({ op: "div" });
  assert.equal(m.getState().stage, 3);
  assert.equal(m.setState({ op: "div" }), false, "no move to choose after both undo steps");
});

test("two-step: given x, work out 3 × 8 = 24 first, then add 15 -> 39, and check", () => {
  const m = create(gym);
  assert.equal(m.setState({ known: "x" }), true);
  assert.equal(m.setState({ op: "sub" }), false, "no undo moves when x is known");
  m.setState({ advance: true });
  assert.equal(m.getState().stage, 1);
  assert.deepEqual(m.getState().rest, { n: 24, d: 1 }, "3 × 8");
  m.setState({ advance: true });
  assert.equal(m.getState().stage, 2);
  m.setState({ advance: true });
  assert.deepEqual(m.getState().answer, { n: 39, d: 1 }, "15 + 24");
  assert.equal(m.getState().finished, false);
  m.setState({ advance: true });
  const d = m.getState();
  assert.equal(d.finished, true);
  assert.deepEqual(d.back, { n: 8, d: 1 }, "(39 - 15) ÷ 3");
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /c = 15 \+ 3 × 8\. c = 15 \+ 24\. c = \$39\./);
  assert.match(en, /Check: \(\$39 − \$15\) ÷ 3 = 8\. It matches\./);
});

test("two-step: decimals and fractions stay exact; a typed goal must beat the starting amount", () => {
  const m = create({ ...gym, m: "0.5", b: "2.5", target: "10" });
  m.setState({ advance: true });
  m.setState({ op: "sub" });
  assert.deepEqual(m.getState().rest, { n: 15, d: 2 }, "10 - 2.5 = 7.5");
  m.setState({ op: "div" });
  assert.deepEqual(m.getState().answer, { n: 15, d: 1 }, "7.5 ÷ 0.5");
  const third = create(gym);
  assert.equal(third.setState({ value: "20" }), true);
  third.setState({ advance: true });
  third.setState({ op: "sub" });
  third.setState({ op: "div" });
  assert.deepEqual(third.getState().answer, { n: 5, d: 3 }, "(20 - 15) ÷ 3");
  third.setState({ advance: true });
  assert.equal(third.getState().checkOk, true);
  assert.match(third.getMathematicalExplanation("en"), /v = 5\/3 visits/);
  for (const bad of ["15", "10", "0"]) assert.equal(third.setState({ value: bad }), false, bad);
  assert.equal(third.setState({ value: "16" }), true);
  assert.equal(third.setState({ known: "x" }), true);
  assert.equal(third.setState({ value: "1" }), true, "any input above 0 works when x is known");
});

test("two-step: undo, reset, serialize and restore across the new stages", () => {
  const m = create({ ...gym, task: { answer: "15" } });
  assert.equal(m.validate().reason, "not-finished");
  m.setState({ advance: true });
  m.setState({ op: "sub" });
  const mid = m.serialize();
  m.setState({ op: "div" });
  m.setState({ advance: true });
  assert.deepEqual(m.validate(), { ok: true, reason: "correct", misconception: null });
  const done = m.serialize();
  for (const stage of [3, 2, 1, 0]) {
    assert.equal(m.undo(), true);
    assert.equal(m.getState().stage, stage);
  }
  assert.equal(m.undo(), false);
  m.setState({ advance: true });
  m.setState({ op: "sub" });
  m.reset();
  assert.equal(m.getState().stage, 0);
  const r = create(gym);
  assert.equal(r.restore(mid), true);
  assert.equal(r.getState().stage, 2);
  assert.deepEqual(r.getState().rest, { n: 45, d: 1 });
  assert.equal(r.restore(done), true);
  assert.equal(r.getState().finished, true);
  assert.equal(r.restore(done.replace('"stage":4', '"stage":5')), false);
  assert.equal(r.restore(mid.replace('"tried":null', '"tried":"sub"')), true, "subtracting twice");
  assert.equal(
    r.restore(mid.replace('"tried":null', '"tried":"div"')),
    false,
    "div is the right second move",
  );
  assert.equal(r.restore(mid.replace('"tried":null', '"tried":"pow"')), false);
  const first = create(gym);
  first.setState({ advance: true });
  const fj = first.serialize();
  assert.equal(r.restore(fj.replace('"tried":null', '"tried":"div"')), true, "dividing too early");
  assert.equal(
    r.restore(fj.replace('"tried":null', '"tried":"sub"')),
    false,
    "sub is the right first move",
  );
  assert.equal(r.restore(fj.replace('"y":"60"', '"y":"15"')), false, "goal must be above b");
  assert.equal(r.restore(fj.replace('"b":"15"', '"b":"15.0"')), false, "not the canonical problem");
  const plain = create(cars);
  plain.setState({ advance: true });
  plain.setState({ op: "div" });
  plain.setState({ advance: true });
  const pj = plain.serialize();
  assert.equal(plain.restore(pj), true);
  assert.equal(
    plain.restore(pj.replace('"stage":3', '"stage":4')),
    false,
    "a b = 0 problem has no stage 4",
  );
});

test("two-step: the b = 0 problem is unchanged by the starting-amount stages", () => {
  const d = create(cars).getState();
  assert.equal(d.start, false);
  assert.deepEqual(d.rest, { n: 1000, d: 1 });
  const m = create(cars);
  m.setState({ advance: true });
  assert.equal(m.setState({ op: "div" }), true);
  assert.equal(m.getState().stage, 2);
});

test("mounted two-step: goal known, undo the adding then the multiplying, EN then ES", () => {
  const root = box();
  const m = mount(root, gym);
  assert.equal(eq(root), "c = 15 + 3 × v");
  click(named(root, "Substitute $60 for c"));
  assert.equal(eq(root), "15 + 3 × v = $60");
  assert.deepEqual([...root.querySelectorAll("[data-op]")].map((b) => b.textContent).sort(), [
    "Add 15 to both sides",
    "Divide both sides by 3",
    "Multiply both sides by 3",
    "Subtract 15 from both sides",
  ]);
  click(named(root, "Divide both sides by 3"));
  assert.match(root.querySelector(".fm-msg").textContent, /Try another look/);
  assert.match(root.querySelector(".fm-explain").textContent, /reverse order/);
  assert.equal(eq(root), "15 + 3 × v = $60");
  assert.equal(root.querySelector(".fm-pattern-log").hidden, true);
  click(named(root, "Add 15 to both sides"));
  assert.equal(eq(root), "15 + 3 × v = $60");
  click(named(root, "Subtract 15 from both sides"));
  assert.equal(root.querySelector(".fm-msg").textContent, "");
  assert.equal(eq(root), "3 × v = $45");
  assert.deepEqual(lines(root), [
    "1. Left side: 15 + 3 × v − 15 = 3 × v",
    "1. Right side: $60 − $15 = $45",
  ]);
  click(named(root, "Subtract 15 from both sides"));
  assert.match(root.querySelector(".fm-msg").textContent, /Try another look/);
  assert.equal(eq(root), "3 × v = $45");
  m.setLang("es");
  click(named(root, "Dividir ambos lados entre 3"));
  assert.equal(eq(root), "v = 15 visitas");
  assert.equal(lines(root).length, 4);
  assert.equal(lines(root)[3], "2. Lado derecho: $45 ÷ 3 = 15");
  click(named(root, "Comprobar poniéndolo de nuevo"));
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Comprobación: 15 + 3 × 15 = $60. Coincide.",
  );
  assert.equal(root.querySelectorAll("[data-op], button[data-adv]").length, 0);
  nothingBroken(root);
  m.setLang("en");
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Check: 15 + 3 × 15 = $60. It matches.",
  );
  assert.match(root.querySelector(".fm-sr").textContent, /Two-step equation model\. v = 15 visits/);
  click(root.querySelector(".fm-actions button"));
  assert.equal(m.getState().stage, 3, "undo steps back one stage");
  m.destroy();
});

test("mounted two-step: x known, multiply first then add the starting amount", () => {
  const root = box();
  const m = mount(root, gym);
  click(root.querySelector('[data-known="x"]'));
  click(named(root, "Substitute 8 for v"));
  assert.equal(eq(root), "c = 15 + 3 × 8");
  assert.match(root.querySelector(".fm-explain").textContent, /multiplication first/);
  click(named(root, "Work out 3 × 8"));
  assert.equal(eq(root), "c = 15 + 24");
  click(named(root, "Add 15 + 24"));
  assert.equal(eq(root), "c = $39");
  click(named(root, "Check by putting it back"));
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Check: ($39 − $15) ÷ 3 = 8. It matches.",
  );
  assert.equal(root.querySelector(".fm-pattern-log").hidden, true);
  m.setLang("es");
  assert.equal(
    root.querySelector(".fm-pattern-result").textContent,
    "Comprobación: ($39 − $15) ÷ 3 = 8. Coincide.",
  );
  assert.equal(root.querySelector('[data-known="x"]').textContent, "visitas (v)");
  nothingBroken(root);
  const input = root.querySelector(".fm-fields input");
  type(input, "10");
  assert.equal(m.getState().stage, 0);
  m.setState({ known: "y" });
  type(root.querySelector(".fm-fields input"), "12");
  assert.equal(
    root.querySelector(".fm-fields input").getAttribute("aria-invalid"),
    "true",
    "a goal at or under 15 is refused",
  );
  m.destroy();
});

test("mounted two-step: presets switch between b = 0 and b > 0, labels print the starting amount", () => {
  const root = box();
  const fee = { title: words("Fee", "Cuota"), m: "4", b: "20", target: "100", given: "5" };
  mount(root, {
    ...gym,
    b: "0",
    target: "300",
    presets: [{ title: words("Posters", "Carteles") }, {}, { ...gym, ...fee }],
  });
  assert.equal(eq(root), "c = 3 × v");
  assert.equal(root.querySelectorAll("[data-pick]").length, 3);
  assert.equal(root.querySelectorAll("[data-pick]")[1].textContent, "c = 3 × v");
  click(root.querySelector('[data-pick="2"]'));
  assert.equal(eq(root), "c = 20 + 4 × v");
  click(named(root, "Substitute $100 for c"));
  click(named(root, "Subtract 20 from both sides"));
  click(named(root, "Divide both sides by 4"));
  assert.equal(eq(root), "v = 20 visits");
  click(root.querySelector('[data-pick="0"]'));
  assert.equal(eq(root), "c = 3 × v");
  nothingBroken(root);
});

test("mounted two-step: readonly shows the equation with no live controls", () => {
  const root = box();
  mount(root, gym, { readonly: true });
  assert.equal(root.querySelectorAll("button").length, 0);
  assert.equal(root.querySelectorAll("input").length, 0);
  assert.equal(eq(root), "c = 15 + 3 × v");
  assert.match(root.querySelector(".fm-sr").textContent, /Two-step equation model/);
  nothingBroken(root);
});
