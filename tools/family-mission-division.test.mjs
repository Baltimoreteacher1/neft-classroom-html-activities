// Family Mission "division" model: long division, decimal division and a fraction of a whole
// number. Expected values are worked out by hand here, independently of the code under test.
// The family is tested without the registry (the lead wires index.mjs afterwards).
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import * as fam from "../assets/family-mission/models/division.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
let reduceMotion = true;
globalThis.matchMedia = (q) => ({ matches: reduceMotion && /reduced-motion/.test(q) });
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));

const click = (node) =>
  node.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
const make = (cfg) => fam.create(cfg);
const whole = (dividend, divisor, extra = {}) =>
  make({ mode: "whole", dividend, divisor, ...extra });
const decimal = (dividend, divisor, extra = {}) =>
  make({ mode: "decimal", dividend, divisor, ...extra });

/** Plays a model to the end with the digits a student would choose (taps for every other step). */
function play(m, digits) {
  const queue = [...digits];
  for (let guard = 0; guard < 200 && m.getState().next; guard++) {
    const d = m.getState();
    const ok =
      d.next.kind === "pick"
        ? m.setState({ digit: queue.shift() })
        : m.setState({ step: d.step + 1 });
    assert.equal(ok, true, `step ${d.step} (${d.next.kind}) should go through`);
  }
  assert.deepEqual(queue, [], "every chosen digit was used");
  return m.getState();
}

// ── whole: long division ─────────────────────────────────────────────────────

test("whole 1,344 ÷ 12 = 112: working numbers 13, 14, 24; products 12, 12, 24; nothing left", () => {
  const m = whole(1344, 12);
  const d0 = m.getState();
  // Hand: 12 does not fit into 1; 13 → 1 (12) left 1; bring 4 → 14 → 1 (12) left 2; bring 4 → 24 → 2 (24) left 0.
  assert.deepEqual(
    d0.plan.cycles.map((c) => [c.working, c.q, c.product, c.left]),
    [
      [13, 1, 12, 1],
      [14, 1, 12, 2],
      [24, 2, 24, 0],
    ],
  );
  assert.equal(
    d0.total,
    12,
    "3 cycles of divide/multiply/subtract plus 2 bring-downs plus the check",
  );
  const d = play(m, [1, 1, 2]);
  assert.deepEqual(d.quotient, { n: 112, d: 1 });
  assert.equal(d.remainder, 0);
  assert.equal(d.finished, true);
  const text = m.getMathematicalExplanation("en");
  assert.match(text, /1,344 ÷ 12 = 112\./);
  assert.match(text, /The remainder is 0: 12 fits into 1,344 exactly\./);
  assert.match(text, /Check: 112 × 12 \+ 0 = 1,344\./);
  assert.match(m.getMathematicalExplanation("es"), /Comprueba: 112 × 12 \+ 0 = 1,344\./);
  assert.deepEqual(m.validate({ answer: "112" }), {
    ok: true,
    reason: "correct",
    misconception: null,
  });
  assert.equal(m.validate({ answer: "113" }).ok, false);
});

test("the model checks each digit exactly and never moves on a wrong one", () => {
  const m = whole(1344, 12);
  // working 13 with divisor 12: 9 × 12 = 108 is too big; 0 × 12 leaves 13, and 12 still fits: too small.
  for (const g of [2, 9, 0]) assert.equal(m.setState({ digit: g }), false, `digit ${g}`);
  assert.equal(m.setState({ digit: 10 }), false);
  assert.equal(m.setState({ digit: 1.5 }), false);
  assert.equal(m.getState().step, 0);
  assert.equal(m.setState({ step: 1 }), false, "the pick cannot be skipped by tapping");
  assert.equal(m.setState({ digit: 1 }), true);
  assert.equal(m.setState({ digit: 1 }), false, "the next step is multiply, not another digit");
  assert.equal(m.setState({ step: 3 }), false, "no skipping ahead");
  assert.equal(m.setState({ step: 2 }), true);
});

test("500 ÷ 60 = 8 R 20 with the meaning of the remainder", () => {
  const ctx = { en: "{q} hours and {r} minutes", es: "{q} horas y {r} minutos" };
  const m = whole(500, 60, { context: ctx });
  // Hand: 60 does not fit into 5 or 50, so the working number is 500; 8 × 60 = 480; 500 − 480 = 20 < 60.
  assert.deepEqual(
    m.getState().plan.cycles.map((c) => [c.working, c.q, c.product, c.left]),
    [[500, 8, 480, 20]],
  );
  assert.equal(m.setState({ digit: 9 }), false, "9 × 60 = 540 is more than 500");
  assert.equal(m.setState({ digit: 7 }), false, "7 × 60 = 420 leaves 80, and 60 still fits");
  play(m, [8]);
  const d = m.getState();
  assert.deepEqual(d.quotient, { n: 8, d: 1 });
  assert.equal(d.remainder, 20);
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /500 ÷ 60 = 8 R 20\./);
  assert.match(en, /8 hours and 20 minutes/);
  assert.match(en, /The remainder, 20, is less than 60, so no more groups of 60 fit\./);
  assert.match(en, /Check: 8 × 60 \+ 20 = 500\./);
  assert.match(
    m.getMathematicalExplanation("es"),
    /500 ÷ 60 = 8 residuo 20\..*8 horas y 20 minutos/,
  );
});

test("621,000 ÷ 20 = 31,050 (a zero in the middle of the answer) and 621,000 ÷ 15 = 41,400", () => {
  const m = whole(621000, 20);
  // Hand: 62 → 3 (60) left 2; 21 → 1 (20) left 1; 10 → 0 (0) left 10; 100 → 5 (100) left 0; 0 → 0 (0) left 0.
  assert.deepEqual(
    m.getState().plan.cycles.map((c) => [c.working, c.q, c.left]),
    [
      [62, 3, 2],
      [21, 1, 1],
      [10, 0, 10],
      [100, 5, 0],
      [0, 0, 0],
    ],
  );
  const d = play(m, [3, 1, 0, 5, 0]);
  assert.deepEqual(d.quotient, { n: 31050, d: 1 });
  assert.match(m.getMathematicalExplanation("en"), /621,000 ÷ 20 = 31,050\./);
  assert.equal(m.setState({ dividend: 621000, divisor: 15 }), true);
  // Hand: 15 × 41,400 = 600,000 + 21,000 = 621,000.
  assert.deepEqual(play(m, [4, 1, 4, 0, 0]).quotient, { n: 41400, d: 1 });
});

test("a divisor larger than the dividend gives 0 with the whole dividend left", () => {
  const m = whole(5, 12);
  assert.equal(m.setState({ digit: 1 }), false);
  play(m, [0]);
  assert.deepEqual(m.getState().quotient, { n: 0, d: 1 });
  assert.equal(m.getState().remainder, 5);
});

test("sizes are bounded and bad problems are refused", () => {
  for (const cfg of [
    {},
    { mode: "nope", dividend: 4, divisor: 2 },
    { mode: "whole" },
    { mode: "whole", dividend: 12, divisor: 0 },
    { mode: "whole", dividend: 0, divisor: 3 },
    { mode: "whole", dividend: -12, divisor: 3 },
    { mode: "whole", dividend: "x", divisor: 3 },
    { mode: "whole", dividend: 12.5, divisor: 5 },
    { mode: "whole", dividend: 12, divisor: 2.5 },
    { mode: "whole", dividend: 1_000_000_001, divisor: 3 },
    { mode: "whole", dividend: 12, divisor: 100000 },
    { mode: "whole", dividend: 12, divisor: 3, context: { en: "only English" } },
    { mode: "whole", dividend: 12, divisor: 3, presets: "nope" },
    { mode: "whole", dividend: 12, divisor: 3, presets: [{ dividend: 1, divisor: 0 }] },
    { mode: "decimal", dividend: 1, divisor: "1/3" },
    { mode: "decimal", dividend: 1, divisor: 3 },
    { mode: "decimal", dividend: 1.5, divisor: 0.00001 },
    { mode: "decimal", dividend: "1234567.891", divisor: 0.5 },
  ])
    assert.throws(() => make(cfg), TypeError, JSON.stringify(cfg));
  assert.doesNotThrow(() => whole(1_000_000_000, 8));
  assert.deepEqual(whole(1_000_000_000, 8).getState().quotient, { n: 125000000, d: 1 });
});

// ── decimal ──────────────────────────────────────────────────────────────────

test("decimal 18.9 ÷ 6.3: move both points one place, then 189 ÷ 63 = 3", () => {
  const m = decimal("18.9", "6.3");
  assert.deepEqual(m.getState().next, { kind: "move" });
  assert.equal(m.setState({ step: 2 }), false, "the points move first");
  assert.equal(m.setState({ step: 1 }), true);
  const d = m.getState();
  assert.equal(d.moved, 1);
  assert.deepEqual([d.plan.A, d.plan.B], [189, 63]);
  assert.deepEqual(d.next, { kind: "point" });
  // Hand: 189 ÷ 63: 63 does not fit into 1 or 18; 3 × 63 = 189; nothing left.
  assert.equal(m.setState({ step: 2 }), true);
  assert.equal(m.setState({ digit: 2 }), false, "2 × 63 = 126 leaves 63, and 63 still fits");
  assert.equal(m.setState({ digit: 4 }), false, "4 × 63 = 252 is more than 189");
  const done = play(m, [3]);
  assert.deepEqual(done.quotient, { n: 3, d: 1 });
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /18\.9 ÷ 6\.3 = 3\./);
  assert.match(en, /189 ÷ 63 has the same answer, because both numbers were multiplied by 10\./);
  assert.match(en, /Check: 3 × 6\.3 = 18\.9\./);
});

test("decimal 9.6 ÷ 0.4 = 24 and 4.5 ÷ 0.15 = 30 (two places)", () => {
  // Hand: 96 ÷ 4: 9 → 2 (8) left 1; bring 6 → 16 → 4 (16) left 0. So 24, and 0.4 × 24 = 9.6.
  const a = decimal("9.6", "0.4");
  assert.deepEqual(
    a.getState().plan.cycles.map((c) => [c.working, c.q, c.left]),
    [
      [9, 2, 1],
      [16, 4, 0],
    ],
  );
  assert.deepEqual(play(a, [2, 4]).quotient, { n: 24, d: 1 });
  assert.match(a.getMathematicalExplanation("en"), /Check: 24 × 0\.4 = 9\.6\./);
  // Hand: 0.15 needs two moves (0.15 → 1.5 → 15), 4.5 becomes 450; 45 → 3 (45) left 0; bring 0 → 0.
  const b = decimal("4.5", "0.15");
  assert.equal(b.getState().plan.need, 2);
  assert.equal(b.setState({ step: 1 }), true);
  assert.match(
    b.getAccessibleDescription("en"),
    /Both points moved 1 place right \(× 10\)\. The divisor is 1\.5/,
  );
  assert.equal(b.setState({ step: 2 }), true);
  assert.deepEqual(b.getState().plan.A, 450);
  assert.deepEqual(play(b, [3, 0]).quotient, { n: 30, d: 1 });
  assert.match(b.getMathematicalExplanation("en"), /Check: 30 × 0\.15 = 4\.5\./);
});

test("decimal answers that are not whole: 2.4 ÷ 0.5 = 4.8, 12.6 ÷ 3 = 4.2, 0.045 ÷ 0.9 = 0.05", () => {
  // Hand: 24 ÷ 5: 4 (20) left 4; add a 0 → 40 → 8 (40) left 0; 48 with one place → 4.8; 0.5 × 4.8 = 2.4.
  const a = decimal("2.4", "0.5");
  assert.equal(a.getState().plan.extra, 1);
  const da = play(a, [4, 8]);
  assert.deepEqual(da.quotient, { n: 24, d: 5 });
  assert.match(
    a.getMathematicalExplanation("en"),
    /2\.4 ÷ 0\.5 = 4\.8\..*Check: 4\.8 × 0\.5 = 2\.4\./,
  );
  // Hand: the divisor is already whole (no moves): 126 with one place; 12 → 4 (12) left 0; bring 6 → 2; 42 → 4.2.
  const b = decimal("12.6", "3");
  assert.equal(b.getState().plan.need, 0);
  assert.deepEqual(b.getState().next, { kind: "point" });
  assert.deepEqual(play(b, [4, 2]).quotient, { n: 21, d: 5 });
  // Hand: ×10 → 0.45 ÷ 9 = 0.05; the digits 045 give 0, 0 and 5 (45 ÷ 9 = 5); 0.9 × 0.05 = 0.045.
  const c = decimal("0.045", "0.9");
  assert.deepEqual(play(c, [5]).quotient, { n: 1, d: 20 });
  assert.match(
    c.getMathematicalExplanation("en"),
    /0\.045 ÷ 0\.9 = 0\.05\..*Check: 0\.05 × 0\.9 = 0\.045\./,
  );
});

// ── fraction of a whole number ───────────────────────────────────────────────

test("fractionof 2/3 of 60: split into 3 groups of 20, take 2 groups, 40", () => {
  const m = make({ mode: "fractionof", n: 2, d: 3, whole: 60 });
  const d0 = m.getState();
  assert.deepEqual([d0.groups, d0.each, d0.answer], [3, 20, 40]);
  assert.equal(m.setState({ toggle: 0 }), false, "split first");
  assert.equal(m.setState({ split: true }), true);
  assert.equal(m.setState({ split: true }), false, "split once");
  assert.equal(m.setState({ toggle: 3 }), false, "there are only 3 groups");
  assert.equal(m.setState({ toggle: 0 }), true);
  assert.equal(m.getState().finished, false);
  assert.equal(m.setState({ toggle: 2 }), true);
  assert.equal(m.setState({ toggle: 1 }), false, "the top number is 2: no third group");
  const d = m.getState();
  assert.deepEqual(d.taken, [0, 2]);
  assert.equal(d.finished, true);
  const en = m.getMathematicalExplanation("en");
  assert.match(en, /2\/3 of 60 = 2 × \(60 ÷ 3\) = 2 × 20 = 40\./);
  assert.match(en, /Check: 3 groups of 20 make 60\./);
  assert.match(m.getMathematicalExplanation("es"), /2\/3 de 60 = 2 × \(60 ÷ 3\) = 2 × 20 = 40\./);
  assert.equal(m.setState({ toggle: 0 }), true, "a taken group goes back");
  assert.deepEqual(m.getState().taken, [2]);
  assert.equal(m.validate({ answer: "40" }).ok, false, "not finished again");
  m.setState({ toggle: 1 });
  assert.equal(m.validate({ answer: "40" }).ok, true);
  assert.equal(m.validate({ answer: "20" }).ok, false);
});

test("fractionof 3/4 of 24 = 18 and 2/3 of 12 = 8; unequal splits are refused", () => {
  // Hand: 24 ÷ 4 = 6, 3 × 6 = 18. 12 ÷ 3 = 4, 2 × 4 = 8.
  assert.equal(make({ mode: "fractionof", n: 3, d: 4, whole: 24 }).getState().answer, 18);
  assert.equal(make({ mode: "fractionof", n: 2, d: 3, whole: 12 }).getState().answer, 8);
  for (const [n, d, w] of [
    [2, 3, 10],
    [3, 3, 12],
    [0, 3, 12],
    [1, 1, 12],
    [1, 13, 26],
    [2, 3, 150],
    [2.5, 3, 12],
  ])
    assert.throws(
      () => make({ mode: "fractionof", n, d, whole: w }),
      TypeError,
      `${n}/${d} of ${w}`,
    );
});

// ── undo, reset, presets, serialize ──────────────────────────────────────────

test("undo steps back, reset starts over, a new problem starts at the beginning", () => {
  const presets = [
    { dividend: 1344, divisor: 12 },
    { dividend: 384, divisor: 8 },
  ];
  const m = whole(1344, 12, { presets });
  m.setState({ digit: 1 });
  m.setState({ step: 2 });
  assert.equal(m.getState().step, 2);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().step, 1);
  assert.equal(m.setState({ digit: 3 }), false, "refused tries leave no undo entry");
  assert.equal(m.undo(), true);
  assert.equal(m.undo(), false);
  m.setState({ digit: 1 });
  m.setState({ dividend: "384", divisor: "8" });
  const d = m.getState();
  assert.deepEqual([d.step, d.problem.dividend, d.problem.divisor], [0, "384", "8"]);
  // Hand: 38 → 4 (32) left 6; bring 4 → 64 → 8 (64) left 0: 48.
  assert.deepEqual(play(m, [4, 8]).quotient, { n: 48, d: 1 });
  m.reset();
  assert.deepEqual([m.getState().step, m.getState().problem.dividend], [0, "1344"]);
  assert.equal(m.setState({ dividend: 1344, divisor: 0 }), false);
});

test("serialize and restore round-trip; tampered saves are refused", () => {
  const m = whole(1344, 12);
  m.setState({ digit: 1 });
  m.setState({ step: 2 });
  const json = m.serialize();
  const m2 = whole(1344, 12);
  assert.equal(m2.restore(json), true);
  assert.equal(m2.getState().step, 2);
  assert.equal(m2.restore(json.replace('"step":2', '"step":99')), false);
  assert.equal(m2.restore(json.replace('"dividend":"1344"', '"dividend":"0"')), false);
  assert.equal(m2.restore(json.replace('"mode":"whole"', '"mode":"nope"')), false);
  const g = make({ mode: "fractionof", n: 2, d: 3, whole: 60 });
  g.setState({ split: true });
  g.setState({ toggle: 1 });
  const gj = g.serialize();
  const g2 = make({ mode: "fractionof", n: 2, d: 3, whole: 60 });
  assert.equal(g2.restore(gj), true);
  assert.deepEqual(g2.getState().taken, [1]);
  assert.equal(g2.restore(gj.replace('"taken":[1]', '"taken":[1,1]')), false);
  assert.equal(g2.restore(gj.replace('"taken":[1]', '"taken":[0,1,2]')), false);
  assert.equal(
    g2.restore(gj.replace('"split":true', '"split":false')),
    false,
    "taken groups need a split",
  );
});

// ── DOM ──────────────────────────────────────────────────────────────────────

const mount = (cfg, opts) => {
  const root = document.createElement("div");
  document.body.append(root);
  const model = fam.create(cfg);
  const view = fam.mount(root, model, opts);
  return { root, model, view };
};
const pad = (root) => root.querySelector(".fm-div-pad");
const nextBtn = (root) => root.querySelector(".fm-div-next");
const press = (root, digit) => click(pad(root).querySelector(`[data-digit="${digit}"]`));
const tap = (root) => {
  assert.equal(nextBtn(root).hidden, false, "a next button is showing");
  click(nextBtn(root));
};
const rowText = (root, name) =>
  [
    ...root.querySelectorAll(
      `.fm-div-row.is-${name} .fm-div-cell, .fm-div-row.is-${name} .fm-div-pt`,
    ),
  ]
    .map((c) => c.textContent)
    .join("");
const clean = (root) => assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);

test("mounted whole: choose each digit, tap multiply, subtract and bring down, read the check", () => {
  const presets = [
    { dividend: 1344, divisor: 12 },
    {
      dividend: 500,
      divisor: 60,
      context: { en: "{q} hours and {r} minutes", es: "{q} horas y {r} minutos" },
    },
  ];
  const { root, model, view } = mount({ mode: "whole", ...presets[0], presets });
  assert.equal(root.querySelector(".fm-div-expr").textContent, "1,344 ÷ 12");
  assert.equal(rowText(root, "dividend"), "1344");
  assert.equal(
    root.querySelector(".fm-div-hint").textContent,
    "12 does not fit into 1, so the working number is 13. Divide: how many 12s fit into 13? Choose a digit.",
  );
  assert.equal(pad(root).hidden, false);
  assert.equal(nextBtn(root).hidden, true);
  assert.equal(pad(root).querySelectorAll("button").length, 10);
  // Wrong looks: a verdict and the arithmetic, never the digit.
  press(root, 9);
  assert.equal(
    root.querySelector(".fm-div-msg").textContent,
    "9 × 12 = 108. That is more than 13: too big. Try another look.",
  );
  press(root, 0);
  assert.equal(
    root.querySelector(".fm-div-msg").textContent,
    "0 × 12 = 0. 13 − 0 = 13, and 12 still fits in 13: too small. Try another look.",
  );
  assert.equal(model.getState().step, 0);
  assert.equal(rowText(root, "quotient"), "");
  press(root, 1);
  assert.equal(root.querySelector(".fm-div-msg").textContent, "Just right.");
  assert.equal(rowText(root, "quotient"), "1");
  assert.equal(nextBtn(root).textContent, "Multiply");
  assert.equal(pad(root).hidden, true);
  tap(root);
  assert.equal(rowText(root, "product"), "12");
  assert.equal(nextBtn(root).textContent, "Subtract");
  tap(root);
  assert.equal(rowText(root, "left"), "1");
  assert.equal(nextBtn(root).textContent, "Bring down");
  tap(root);
  assert.equal(rowText(root, "left"), "14");
  assert.equal(root.querySelector(".is-brought").textContent, "4");
  assert.equal(root.querySelector(".fm-div-result").hidden, true);
  press(root, 1);
  for (let i = 0; i < 3; i++) tap(root);
  press(root, 2);
  tap(root);
  tap(root);
  assert.equal(rowText(root, "quotient"), "112");
  assert.equal(
    root.querySelector(".fm-div-result").hidden,
    false,
    "the answer shows before the check",
  );
  assert.equal(root.querySelectorAll(".fm-div-result p").length, 2);
  assert.equal(nextBtn(root).textContent, "Check the answer");
  tap(root);
  assert.match(
    root.querySelector(".fm-div-result").textContent,
    /1,344 ÷ 12 = 112\..*Check: 112 × 12 \+ 0 = 1,344\./,
  );
  assert.equal(nextBtn(root).hidden, true);
  assert.equal(pad(root).hidden, true);
  clean(root);
  // A second problem starts over; its answer says what the remainder means.
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(model.getState().step, 0);
  assert.equal(root.querySelector(".fm-div-expr").textContent, "500 ÷ 60");
  press(root, 8);
  tap(root);
  tap(root);
  assert.match(
    root.querySelector(".fm-div-result").textContent,
    /500 ÷ 60 = 8 R 20\..*8 hours and 20 minutes/,
  );
  // Spanish keeps the progress.
  view.setLang("es");
  assert.equal(model.getState().step, 3);
  assert.equal(nextBtn(root).textContent, "Comprobar la respuesta");
  assert.match(
    root.querySelector(".fm-div-result").textContent,
    /500 ÷ 60 = 8 residuo 20\..*8 horas y 20 minutos/,
  );
  assert.equal(root.getAttribute("lang"), "es");
  click(root.querySelector(".fm-actions button:last-child"));
  assert.equal(model.getState().step, 0);
  assert.equal(
    root.querySelector(".fm-div-expr").textContent,
    "1,344 ÷ 12",
    "start over returns to the first problem",
  );
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(
    root.querySelector(".fm-div-hint").textContent,
    "60 no cabe en 50, así que el número de trabajo es 500. Divide: ¿cuántos 60 caben en 500? Elige un dígito.",
  );
  press(root, 9);
  assert.equal(
    root.querySelector(".fm-div-msg").textContent,
    "9 × 60 = 540. Es más que 500: demasiado grande. Mira otra vez.",
  );
  assert.equal(pad(root).getAttribute("aria-label"), "Elige un dígito");
  clean(root);
  view.destroy();
  assert.equal(root.children.length, 0);
});

test("mounted decimal: move both points together, write the point, then divide", () => {
  const presets = [
    { dividend: "18.9", divisor: "6.3" },
    { dividend: "4.5", divisor: "0.15" },
  ];
  const { root, model } = mount({ mode: "decimal", ...presets[0], presets });
  assert.equal(root.querySelector(".fm-div-expr").textContent, "18.9 ÷ 6.3");
  assert.equal(
    root.querySelector(".fm-div-pic").hidden,
    true,
    "the board waits until the divisor is whole",
  );
  assert.equal(nextBtn(root).textContent, "Move both points 1 place right");
  assert.equal(pad(root).hidden, true);
  tap(root);
  assert.equal(root.querySelector(".fm-div-expr").textContent, "189 ÷ 63");
  assert.equal(
    root.querySelector(".fm-div-sub").textContent,
    "Both points moved 1 place right (× 10).",
  );
  assert.equal(root.querySelector(".fm-div-pic").hidden, false);
  assert.equal(rowText(root, "dividend"), "189.");
  assert.equal(nextBtn(root).textContent, "Write the point in the answer");
  assert.equal(rowText(root, "quotient"), "");
  tap(root);
  assert.equal(rowText(root, "quotient"), ".");
  press(root, 2);
  assert.match(
    root.querySelector(".fm-div-msg").textContent,
    /^2 × 63 = 126\. 189 − 126 = 63, and 63 still fits in 63: too small/,
  );
  press(root, 3);
  assert.equal(rowText(root, "quotient"), "3.");
  tap(root);
  tap(root);
  tap(root);
  assert.equal(rowText(root, "product"), "189");
  assert.match(
    root.querySelector(".fm-div-result").textContent,
    /18\.9 ÷ 6\.3 = 3\..*189 ÷ 63 has the same answer.*Check: 3 × 6\.3 = 18\.9\./,
  );
  clean(root);
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(model.getState().step, 0);
  tap(root);
  assert.equal(
    root.querySelector(".fm-div-expr").textContent,
    "45 ÷ 1.5",
    "one place moved: 4.5 → 45 and 0.15 → 1.5",
  );
  assert.match(root.querySelector(".fm-div-hint").textContent, /still has a decimal point/);
  assert.equal(root.querySelector(".fm-div-pic").hidden, true);
  tap(root);
  assert.equal(root.querySelector(".fm-div-expr").textContent, "450 ÷ 15");
  assert.equal(
    root.querySelector(".fm-div-sub").textContent,
    "Both points moved 2 places right (× 100).",
  );
  assert.equal(rowText(root, "dividend"), "450.");
  clean(root);
});

test("mounted decimal with a zero before the point: 0.045 ÷ 0.9 writes 0.05", () => {
  const { root } = mount({ mode: "decimal", dividend: "0.045", divisor: "0.9" });
  tap(root);
  tap(root);
  assert.equal(
    rowText(root, "dividend"),
    "0.45",
    "0.045 × 10 = 0.45, the point after the first zero",
  );
  press(root, 5);
  assert.equal(rowText(root, "quotient"), "0.05");
});

test("mounted fractionof: split into groups, tap two groups, read the answer", () => {
  const unit = { en: "pea pods", es: "vainas de guisantes" };
  const { root, model, view } = mount({ mode: "fractionof", n: 2, d: 3, whole: 60, unit });
  assert.equal(root.querySelector(".fm-div-expr").textContent, "2/3 of 60");
  assert.equal(root.querySelectorAll(".fm-div-group.is-pile .fm-div-dot").length, 60);
  assert.equal(
    root.querySelector(".fm-div-group.is-pile .fm-div-cap").textContent,
    "60 pea pods in all",
  );
  assert.equal(nextBtn(root).textContent, "Split into 3 equal groups");
  assert.equal(root.querySelectorAll("[data-group]").length, 0);
  tap(root);
  const groups = [...root.querySelectorAll("button[data-group]")];
  assert.equal(groups.length, 3);
  assert.equal(
    root.querySelectorAll(".fm-div-group:not(.is-pile) .fm-div-dot").length,
    60,
    "3 groups of 20 dots",
  );
  assert.equal(groups[0].querySelectorAll(".fm-div-dot").length, 20);
  assert.equal(groups[0].getAttribute("aria-pressed"), "false");
  assert.match(groups[0].getAttribute("aria-label"), /^Group 1: 20 pea pods, not taken$/);
  assert.equal(nextBtn(root).hidden, true);
  assert.match(
    root.querySelector(".fm-div-hint").textContent,
    /Each group has 20 pea pods\. The top number is 2: take 2 more groups\./,
  );
  click(groups[0]);
  const g = () => [...root.querySelectorAll("button[data-group]")];
  assert.equal(g()[0].getAttribute("aria-pressed"), "true");
  assert.match(g()[0].getAttribute("aria-label"), /Group 1: 20 pea pods, taken$/);
  assert.match(g()[0].textContent, /taken/);
  assert.match(root.querySelector(".fm-div-hint").textContent, /take 1 more group\./);
  click(g()[2]);
  assert.equal(root.querySelector(".fm-div-result").hidden, false);
  assert.match(
    root.querySelector(".fm-div-result").textContent,
    /2\/3 of 60 = 2 × \(60 ÷ 3\) = 2 × 20 = 40\..*2 groups of 20: 40 pea pods\..*Check: 3 groups of 20 make 60\./,
  );
  click(g()[1]);
  assert.match(
    root.querySelector(".fm-div-msg").textContent,
    /take only 2 groups.*Try another look\./,
  );
  assert.equal(g()[1].getAttribute("aria-pressed"), "false");
  assert.deepEqual(model.getState().taken, [0, 2]);
  view.setLang("es");
  assert.match(g()[0].getAttribute("aria-label"), /^Grupo 1: 20 vainas de guisantes, tomado$/);
  assert.match(
    root.querySelector(".fm-div-result").textContent,
    /2\/3 de 60 = 2 × \(60 ÷ 3\) = 2 × 20 = 40\./,
  );
  assert.match(root.querySelector(".fm-sr").textContent, /Modelo de fracción de un número entero/);
  click(root.querySelector(".fm-actions button"));
  assert.equal(model.getState().taken.length, 1);
  clean(root);
});

test("accessibility: real buttons, a text alternative, no inline handlers or styles, reduced motion", () => {
  const { root, model } = mount({ mode: "whole", dividend: 1344, divisor: 12 });
  for (const b of root.querySelectorAll("button")) assert.equal(b.getAttribute("type"), "button");
  const board = root.querySelector(".fm-div-board");
  assert.equal(board.getAttribute("role"), "img");
  assert.equal(board.getAttribute("aria-label"), "Long division: 12 into 1,344.");
  press(root, 1);
  tap(root);
  assert.equal(
    root.querySelector(".fm-div-board").getAttribute("aria-label"),
    "Long division: 12 into 1,344. 13 ÷ 12: write 1. 1 × 12 = 12.",
  );
  assert.match(
    model.getAccessibleDescription("en"),
    /^Long division model\. 1,344 ÷ 12\. 13 ÷ 12: write 1\. 1 × 12 = 12\. Subtract: 13 − 12\./,
  );
  assert.match(model.getAccessibleDescription("es"), /^Modelo de división larga\./);
  assert.equal(root.querySelector(".fm-sr").textContent, model.getAccessibleDescription("en"));
  for (const el of root.querySelectorAll("*")) {
    assert.equal(el.hasAttribute("style"), false);
    for (const a of el.attributes) assert.doesNotMatch(a.name, /^on/i);
  }
  assert.equal(root.querySelector(".fm-live").getAttribute("aria-live"), "polite");
  assert.equal(root.classList.contains("fm-anim"), false, "reduced motion: no animation class");
  assert.ok(root.classList.contains("fm-model") && root.classList.contains("fm-div"));
  reduceMotion = false;
  const free = mount({ mode: "whole", dividend: 1344, divisor: 12 });
  assert.equal(free.root.classList.contains("fm-anim"), true);
  reduceMotion = true;
});

test("readonly: the same picture with no buttons and no live controls", () => {
  for (const cfg of [
    {
      mode: "whole",
      dividend: 1344,
      divisor: 12,
      presets: [
        { dividend: 1344, divisor: 12 },
        { dividend: 384, divisor: 8 },
      ],
    },
    { mode: "decimal", dividend: "18.9", divisor: "6.3" },
    { mode: "fractionof", n: 2, d: 3, whole: 60 },
  ]) {
    const { root, model } = mount(cfg, { readonly: true });
    assert.equal(root.querySelectorAll("button, input").length, 0, cfg.mode);
    assert.equal(root.querySelector(".fm-actions"), null);
    assert.ok(root.querySelector(".fm-div-board, .fm-div-groups"));
    model.setState(cfg.mode === "fractionof" ? { split: true } : { step: 1 });
    if (cfg.mode === "fractionof")
      assert.equal(root.querySelectorAll("div.fm-div-group:not(.is-pile)").length, 3);
    assert.equal(root.querySelectorAll("button").length, 0);
    clean(root);
  }
});
