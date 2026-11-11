// Family Mission interactive models: exact arithmetic, misconception detection and the DOM
// behaviour (keyboard, pointer, language switch, readonly, destroy). Every expected number is
// computed here, independently of the code under test.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import {
  add,
  createStore,
  div,
  fmtNumber,
  frac,
  makeDraggable,
  mul,
  parseRational,
  toDecimalString,
  toPercentString,
} from "../assets/family-mission/models/core.mjs";
import {
  createModel,
  FAMILIES,
  listFamilies,
  mountModel,
} from "../assets/family-mission/models/index.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
// jsdom reports an exception thrown inside an event listener here instead of failing the test.
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));
let reduceMotion = false;
globalThis.matchMedia = (q) => ({ matches: reduceMotion && /reduced-motion/.test(q) });

const pc = (extra) => ({
  whole: 20,
  unit: { en: "books", es: "libros", oneEn: "book", oneEs: "libro" },
  ...extra,
});
const rc = (extra) => ({
  a: 3,
  b: 5,
  labels: {
    a: { en: "cups of juice", es: "tazas de jugo", oneEn: "cup of juice", oneEs: "taza de jugo" },
    b: { en: "cups of water", es: "tazas de agua", oneEn: "cup of water", oneEs: "taza de agua" },
  },
  ...extra,
});
const mount = (family, config, opts) => {
  const root = document.createElement("div");
  document.body.append(root);
  const m = mountModel(root, family, config, opts);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/); // a null child must never print
  return { root, m };
};
const fire = (node, type, init = {}) =>
  node.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
const key = (node, k, init = {}) =>
  node.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
  );

// ── Exact arithmetic ─────────────────────────────────────────────────────────

test("rationals reduce, add, multiply and print exactly", () => {
  assert.deepEqual(frac(6, 4), { n: 3, d: 2 });
  assert.deepEqual(add(frac(1, 3), frac(1, 6)), { n: 1, d: 2 });
  assert.deepEqual(mul(frac(3, 2), frac(4)), { n: 6, d: 1 });
  assert.deepEqual(div(frac(12), frac(8)), { n: 3, d: 2 });
  assert.equal(toDecimalString(frac(3, 2)), "1.5");
  assert.equal(toDecimalString(frac(1, 8)), "0.125");
  assert.equal(toDecimalString(frac(1, 3)), null);
  assert.equal(toDecimalString(frac(1200), { commas: true }), "1,200");
  assert.equal(toPercentString(frac(3, 2)), "150%");
  assert.equal(fmtNumber(frac(5, 3)), "5/3");
  assert.deepEqual(parseRational("1.5"), { n: 3, d: 2 });
  assert.deepEqual(parseRational("1 1/2"), { n: 3, d: 2 });
  assert.deepEqual(parseRational("60%"), { n: 60, d: 1 });
  assert.equal(parseRational("abc"), null);
  assert.equal(parseRational("1/0"), null);
  assert.equal(parseRational(""), null);
});

test("store: undo, reset, round trip, and corrupt input never throws", () => {
  const store = createStore(
    { x: 1 },
    { family: "demo", validateState: (s) => Number.isInteger(s.x) },
  );
  assert.equal(store.setState({ x: 2 }), true);
  assert.equal(store.setState({ x: 1.5 }), false);
  assert.equal(store.getState().x, 2);
  assert.equal(store.undo(), true);
  assert.equal(store.getState().x, 1);
  store.setState({ x: 5 });
  const saved = store.serialize();
  store.reset();
  assert.equal(store.getState().x, 1);
  assert.equal(store.restore(saved), true);
  assert.equal(store.getState().x, 5);
  for (const bad of [
    "not json",
    "{}",
    '{"v":2}',
    '{"v":1,"family":"other","state":{"x":1}}',
    '{"v":1,"family":"demo","state":{"x":"no"}}',
    null,
    7,
    "[]",
  ]) {
    assert.equal(store.restore(bad), false, String(bad));
  }
  assert.equal(store.getState().x, 5);
});

// ── Percent ──────────────────────────────────────────────────────────────────

test("percent: 150% of 20 books is 30 books, 1 whole and 50% of another", () => {
  const m = createModel("percent", pc({ percent: 150 }));
  const s = m.getState();
  assert.deepEqual(s.amount, frac(30));
  assert.equal(s.wholes, 1);
  assert.deepEqual(s.remainder, frac(50));
  assert.deepEqual(s.fraction, frac(3, 2));
  assert.equal(s.decimal, "1.5");
  assert.equal(s.grids, 2);
});

test("percent: 250% of 8 = 20, 0.5% of 200 = 1, 300% fills three grids", () => {
  const a = createModel("percent", { whole: 8, percent: 250 }).getState();
  assert.deepEqual(a.amount, frac(20));
  assert.equal(a.wholes, 2);
  assert.deepEqual(a.remainder, frac(50));
  const b = createModel("percent", { whole: 200, percent: "0.5" }).getState();
  assert.deepEqual(b.amount, frac(1));
  assert.equal(b.wholes, 0);
  assert.equal(b.grids, 1);
  const c = createModel("percent", pc({ percent: 300 })).getState();
  assert.equal(c.grids, 3);
  assert.equal(c.wholes, 3);
  assert.deepEqual(c.remainder, frac(0));
});

test("percent: typed 1.5 means 150%; amount and whole edits stay exact", () => {
  const m = createModel("percent", pc({ percent: 20 }));
  assert.equal(m.setState({ decimal: "1.5" }), true);
  assert.deepEqual(m.getState().percent, frac(150));
  assert.equal(m.setState({ amount: 5 }), true);
  assert.deepEqual(m.getState().percent, frac(25));
  assert.equal(m.setState({ whole: 8 }), true);
  assert.deepEqual(m.getState().amount, frac(2));
  assert.equal(m.setState({ fraction: "3/4" }), true);
  assert.deepEqual(m.getState().percent, frac(75));
  assert.equal(m.setState({ percent: -5 }), false);
  assert.equal(m.setState({ percent: "abc" }), false);
  assert.equal(m.setState({ whole: 0 }), false);
  assert.equal(m.setState({ nonsense: 1 }), false);
  assert.deepEqual(m.getState().percent, frac(75));
});

test("percent: never caps at 100; maxPercent clamps; grids = ceil(percent / 100)", () => {
  const m = createModel("percent", pc({ percent: 100 }));
  assert.equal(m.getState().grids, 1);
  m.setState({ percent: 101 });
  assert.equal(m.getState().grids, 2);
  assert.deepEqual(m.getState().percent, frac(101));
  m.setState({ percent: 9999 });
  assert.deepEqual(m.getState().percent, frac(400));
  const wide = createModel("percent", pc({ maxPercent: 1000, percent: 950 }));
  assert.equal(wide.getState().grids, 10);
  wide.setState({ percent: 5000 });
  assert.deepEqual(wide.getState().percent, frac(1000));
  assert.throws(() => createModel("percent", pc({ maxPercent: 1001 })), TypeError);
  assert.throws(() => createModel("percent", { whole: -3 }), TypeError);
});

test("percent: undo, reset, serialize round trip, restore(garbage) === false", () => {
  const m = createModel("percent", pc({ percent: 40 }));
  m.setState({ percent: 175 });
  m.setState({ whole: 12 });
  assert.equal(m.undo(), true);
  assert.deepEqual(m.getState().whole, frac(20));
  assert.deepEqual(m.getState().percent, frac(175));
  m.setState({ views: { line: true } }); // view changes are not undo steps
  assert.equal(m.undo(), true);
  assert.deepEqual(m.getState().percent, frac(40));
  m.setState({ percent: 250 });
  m.reset();
  assert.deepEqual(m.getState().percent, frac(40));
  m.setState({ percent: 333, whole: "7" });
  const before = m.getState();
  const json = m.serialize();
  const other = createModel("percent", pc({ percent: 1 }));
  assert.equal(other.restore(json), true);
  assert.deepEqual(other.getState(), before);
  for (const bad of [
    "garbage",
    "",
    "{}",
    '{"v":1,"family":"ratio","state":{}}',
    JSON.stringify({ v: 1, family: "percent", state: { whole: { n: -1, d: 1 } } }),
  ]) {
    assert.equal(other.restore(bad), false);
  }
  assert.deepEqual(other.getState(), before);
});

test("percent: correct answers give no misconception; wrong ones give a possible one", () => {
  const m = createModel("percent", pc({ percent: 10 }));
  const ok = m.validate({ kind: "find-percent", whole: 20, amount: 30, answer: "150" });
  assert.equal(ok.ok, true);
  assert.equal(ok.misconception, null);
  const cases = [
    [{ kind: "find-percent", whole: 20, amount: 30, answer: 100 }, "percent-capped-at-100"],
    [{ kind: "find-percent", whole: 20, amount: 30, answer: 30 }, "percent-vs-quantity"],
    [{ kind: "find-percent", whole: 20, amount: 30, answer: "66.67" }, "wrong-whole"],
    [{ kind: "find-percent", whole: 20, amount: 30, answer: "1.5" }, "decimal-place"],
    [{ kind: "find-percent", whole: 20, amount: 30, answer: 15 }, "decimal-place"],
    [{ kind: "find-amount", whole: 20, percent: 150, answer: 20 }, "percent-capped-at-100"],
    [{ kind: "find-amount", whole: 20, percent: 150, answer: 150 }, "percent-vs-quantity"],
    [{ kind: "find-amount", whole: 20, percent: 150, answer: 3 }, "decimal-place"],
    [{ kind: "find-whole", amount: 30, percent: 150, answer: 45 }, "wrong-whole"],
    [{ kind: "predict", percent: 150, answer: "equal" }, "percent-capped-at-100"],
  ];
  for (const [task, id] of cases) {
    const r = m.validate(task);
    assert.equal(r.ok, false, JSON.stringify(task));
    assert.deepEqual(r.misconception, { id, confidence: "possible" }, JSON.stringify(task));
  }
  assert.equal(m.validate({ kind: "find-amount", whole: 20, percent: 150, answer: 30 }).ok, true);
  assert.equal(m.validate({ kind: "find-whole", amount: 30, percent: 150, answer: 20 }).ok, true);
  assert.equal(m.validate({ kind: "predict", percent: 150, answer: "more" }).ok, true);
  assert.equal(m.validate({ kind: "predict", percent: 40, answer: "more" }).misconception, null);
  assert.equal(
    m.validate({ kind: "find-amount", whole: 20, percent: 150, answer: 31 }).misconception,
    null,
  );
  assert.equal(
    m.validate({ kind: "find-percent", whole: 20, amount: 30, answer: "abc" }).reason,
    "invalid-answer",
  );
  assert.equal(m.validate().reason, "no-task");
});

test("percent: with no typed answer, validate reads the model the student built", () => {
  const m = createModel("percent", pc({ percent: 0 }));
  const task = { kind: "find-percent", whole: 20, amount: 30 };
  assert.equal(m.validate(task).ok, false);
  m.setState({ percent: 150 });
  assert.equal(m.validate(task).ok, true);
  m.setState({ whole: 10 });
  assert.equal(m.validate(task).reason, "whole-mismatch");
});

test("percent: descriptions carry the live numbers in English and Spanish", () => {
  const m = createModel("percent", pc({ percent: 150 }));
  const en = m.getMathematicalExplanation("en");
  const es = m.getMathematicalExplanation("es");
  assert.match(en, /150% of 20 books is 30 books/);
  assert.match(en, /1 whole and half of another whole, because 100 \+ 50 = 150/);
  assert.match(en, /3\/2.*1\.5/);
  assert.match(es, /150% de 20 libros son 30 libros/);
  assert.match(es, /1 total y la mitad de otro total, porque 100 \+ 50 = 150/);
  assert.doesNotMatch(es, /entero|\d %/);
  assert.match(m.getAccessibleDescription("en"), /150%.*30 books/);
  assert.match(m.getAccessibleDescription("es"), /150%.*30 libros/);
  m.setState({ percent: "0.5", whole: 200 });
  assert.match(m.getMathematicalExplanation("en"), /0\.5% of 200 books is 1 book\b/);
  assert.match(m.getMathematicalExplanation("es"), /menos de una celda/);
  for (const p of [0, 0.5, 25, 100, 150, 300, 400]) {
    m.setState({ percent: p });
    for (const lang of ["en", "es"]) {
      for (const text of [m.getMathematicalExplanation(lang), m.getAccessibleDescription(lang)]) {
        assert.doesNotMatch(text, /undefined|NaN|\[object/);
      }
    }
  }
});

// ── Ratio ────────────────────────────────────────────────────────────────────

test("ratio: 3:5 x 4 batches is 12:20 and unit rates are exact", () => {
  const m = createModel("ratio", rc({ n: 4 }));
  const s = m.getState();
  assert.deepEqual([s.A, s.B], [frac(12), frac(20)]);
  assert.deepEqual([s.aPerB, s.bPerA], [frac(3, 5), frac(5, 3)]);
  const r = createModel("ratio", rc({ a: 12, b: 8 })).getState();
  assert.deepEqual(r.aPerB, frac(3, 2));
  assert.equal(toDecimalString(r.aPerB), "1.5");
  assert.equal(toDecimalString(r.bPerA), null);
});

test("ratio: table, add and remove rows, and the active row drive one state", () => {
  const m = createModel("ratio", rc({ n: 4 }));
  assert.equal(m.getState().rows.length, 2);
  assert.equal(m.setState({ addRow: true }), true);
  assert.deepEqual(m.getState().n, frac(2));
  assert.equal(m.setState({ n: "2.5" }), true);
  assert.deepEqual(m.getState().A, frac(15, 2));
  assert.equal(m.setState({ setRow: { index: 0, n: 7 } }), true);
  assert.equal(m.getState().active, 0);
  assert.deepEqual(m.getState().B, frac(35));
  assert.equal(m.setState({ removeRow: 0 }), true);
  assert.equal(m.getState().rows.length, 2);
  m.setState({ removeRow: 0 });
  assert.equal(m.setState({ removeRow: 0 }), false); // never the last row
  assert.equal(m.setState({ n: 0 }), false);
  assert.equal(m.setState({ n: "x" }), false);
  assert.equal(m.setState({ A: 9 }), true);
  assert.deepEqual(m.getState().n, frac(3));
  m.setState({ n: 500 });
  assert.deepEqual(m.getState().n, frac(12));
  const saved = m.serialize();
  const other = createModel("ratio", rc());
  assert.equal(other.restore(saved), true);
  assert.deepEqual(other.getState(), m.getState());
  assert.equal(other.restore("nope"), false);
  assert.equal(other.restore('{"v":1,"family":"ratio","state":{"a":0}}'), false);
});

test("ratio: validate flags the named misconceptions and nothing for correct work", () => {
  const m = createModel("ratio", rc());
  const eqv = (answer) => m.validate({ kind: "equivalent", base: { a: 3, b: 5 }, answer });
  assert.equal(eqv({ a: 12, b: 20 }).ok, true);
  assert.equal(eqv({ a: 12, b: 20 }).misconception, null);
  assert.deepEqual(eqv({ a: 7, b: 9 }).misconception, {
    id: "additive-scaling",
    confidence: "possible",
  });
  assert.deepEqual(eqv({ a: 5, b: 3 }).misconception, {
    id: "reversed-order",
    confidence: "possible",
  });
  assert.deepEqual(eqv({ a: 20, b: 12 }).misconception, {
    id: "reversed-order",
    confidence: "possible",
  });
  assert.deepEqual(eqv({ a: 12, b: 15 }).misconception, {
    id: "wrong-scale-factor",
    confidence: "possible",
  });
  assert.equal(eqv({ a: 7, b: 11 }).misconception, null);
  const mv = (answer) =>
    m.validate({
      kind: "missing-value",
      base: { a: 3, b: 5 },
      known: { side: "a", value: 12 },
      answer,
    });
  assert.equal(mv(20).ok, true);
  assert.equal(mv(14).misconception.id, "additive-scaling");
  assert.equal(mv("7.2").misconception.id, "reversed-order");
  assert.equal(mv(12).misconception.id, "wrong-scale-factor");
  const ur = (answer) => m.validate({ kind: "unit-rate", base: { a: 12, b: 8 }, answer });
  assert.equal(ur({ aPerB: "3/2", bPerA: "2/3" }).ok, true);
  assert.equal(ur({ aPerB: 1.5, bPerA: "2/3" }).ok, true);
  assert.equal(ur({ aPerB: "2/3", bPerA: "3/2" }).misconception.id, "unit-rate-inverted");
  assert.equal(ur({ aPerB: 4 }).misconception, null);
  const cmp = (answer) =>
    m.validate({ kind: "compare", r1: { a: 2, b: 5 }, r2: { a: 3, b: 6 }, answer });
  assert.equal(cmp("second").ok, true);
  assert.equal(cmp("first").misconception.id, "reversed-order");
  assert.equal(
    m.validate({ kind: "compare", r1: { a: 4, b: 6 }, r2: { a: 2, b: 3 }, answer: "equal" }).ok,
    true,
  );
  // No typed answer: the table row the student built is the answer.
  m.setState({ n: 4 });
  assert.equal(m.validate({ kind: "equivalent", base: { a: 3, b: 5 } }).ok, true);
  assert.equal(m.validate({ kind: "missing-value", known: { side: "a", value: 12 } }).ok, true);
  assert.equal(
    m.validate({ kind: "missing-value", known: { side: "a", value: 9 } }).reason,
    "state-mismatch",
  );
});

test("ratio: descriptions carry the live numbers in English and Spanish", () => {
  const m = createModel("ratio", rc({ n: 4 }));
  assert.match(
    m.getMathematicalExplanation("en"),
    /3:5 means 3 cups of juice for every 5 cups of water/,
  );
  assert.match(
    m.getMathematicalExplanation("en"),
    /4 batches the ratio is 12:20, because 3 × 4 = 12 and 5 × 4 = 20/,
  );
  assert.match(
    m.getMathematicalExplanation("en"),
    /3\/5 = 0\.6 cups of juice for every 1 cup of water, and 5\/3 cups of water/,
  );
  assert.match(
    m.getMathematicalExplanation("es"),
    /3:5 significa 3 tazas de jugo por cada 5 tazas de agua/,
  );
  assert.match(m.getMathematicalExplanation("es"), /Con 4 lotes la razón es 12:20/);
  assert.match(m.getAccessibleDescription("en"), /3:5.*12:20/);
  assert.match(m.getAccessibleDescription("es"), /3:5.*12:20/);
  for (const lang of ["en", "es"])
    assert.doesNotMatch(
      m.getMathematicalExplanation(lang) + m.getAccessibleDescription(lang),
      /undefined|NaN/,
    );
});

test("index: families, unknown family, and describeConfig", () => {
  const all = [
    "percent",
    "ratio",
    "balance",
    "numberline",
    "coordinate",
    "data",
    "geometry",
    "exponents",
  ];
  assert.deepEqual(Object.keys(FAMILIES).sort(), [...all].sort());
  assert.deepEqual(
    listFamilies()
      .map((f) => f.id)
      .sort(),
    [...all].sort(),
  );
  assert.throws(() => createModel("fractions", {}), /unknown model family/);
  assert.throws(() => createModel("constructor", {}), /unknown model family/);
  const c = createModel("percent", pc({ percent: 150 })).describeConfig();
  assert.equal(c.family, "percent");
  assert.equal(c.whole, "20");
  const m = createModel("percent", pc());
  assert.deepEqual(m.initialize(pc({ whole: 50, percent: 10 })).amount, frac(5));
});

// ── DOM: percent ─────────────────────────────────────────────────────────────

const slider = (root) => root.querySelector("[role=slider]");
const pctNow = (m) => m.getState().percent;

test("mount percent: renders linked views and no raw colours, undefined or NaN", () => {
  const { root, m } = mount("percent", pc({ percent: 150, views: { line: true } }));
  assert.equal(root.querySelectorAll(".fm-grid").length, 2);
  assert.ok(root.querySelector(".fm-tape-ref"));
  assert.ok(root.querySelector(".fm-view-line svg"));
  assert.ok(slider(root));
  const html = root.innerHTML;
  assert.doesNotMatch(html, /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/);
  assert.doesNotMatch(html, /undefined|NaN|\[object/);
  assert.doesNotMatch(root.textContent, /undefined|NaN/);
  assert.doesNotMatch(html, /\son[a-z]+=/i);
  assert.equal(root.querySelector("#" + root.querySelector("input").id).value, "150");
  m.destroy();
});

test("mount percent: 300% shows three solid grids; the tape grows a bar per whole", () => {
  const { root, m } = mount("percent", pc({ percent: 300 }));
  const grids = [...root.querySelectorAll(".fm-grid")];
  assert.equal(grids.length, 3);
  for (const g of grids) assert.equal(g.querySelector(".fm-fill").getAttribute("height"), "100");
  assert.equal(root.querySelectorAll(".fm-view-tape .fm-tape-bg").length, 3);
  m.setState({ percent: "0.5" });
  assert.equal(root.querySelectorAll(".fm-grid").length, 1);
  assert.equal(root.querySelector(".fm-grid .fm-fill").getAttribute("height"), "5");
  m.destroy();
});

test("mount percent: slider keyboard (arrows, shift, Home, End) and aria", () => {
  const { root, m } = mount("percent", pc({ percent: 50 }));
  const h = slider(root);
  assert.equal(h.getAttribute("aria-valuenow"), "50");
  assert.match(h.getAttribute("aria-valuetext"), /50%, 10 books/);
  key(h, "ArrowRight");
  assert.deepEqual(pctNow(m), frac(51));
  assert.equal(h.getAttribute("aria-valuenow"), "51");
  key(h, "ArrowLeft");
  key(h, "ArrowRight", { shiftKey: true });
  assert.deepEqual(pctNow(m), frac(60));
  key(h, "PageDown");
  assert.deepEqual(pctNow(m), frac(50));
  key(h, "End");
  assert.deepEqual(pctNow(m), frac(400));
  assert.equal(h.getAttribute("aria-valuemax"), "400");
  key(h, "ArrowRight");
  assert.deepEqual(pctNow(m), frac(400));
  key(h, "Home");
  assert.deepEqual(pctNow(m), frac(0));
  assert.equal(h.style.touchAction, "none");
  assert.equal(h.getAttribute("role"), "slider");
  m.setState({ fine: true });
  key(h, "ArrowRight");
  assert.deepEqual(pctNow(m), frac(1, 10));
  m.destroy();
});

test("mount percent: pointer drag on the handle changes the state, snapping to 5s", () => {
  const { root, m } = mount("percent", pc({ percent: 0 }));
  const h = slider(root);
  fire(h, "pointerdown", { clientX: 100, clientY: 5 });
  fire(h, "pointermove", { clientX: 100 + 27 }); // 27 viewBox units = 10% of the 270-unit tape
  assert.deepEqual(pctNow(m), frac(10));
  fire(h, "pointermove", { clientX: 100 + 270 * 2.5 });
  assert.deepEqual(pctNow(m), frac(250));
  fire(h, "pointermove", { clientX: 100 + 31 });
  assert.deepEqual(pctNow(m), frac(10)); // 31/270 = 11.5% -> nearest 5 is 10
  fire(h, "pointerup", {});
  fire(h, "pointermove", { clientX: 900 });
  assert.deepEqual(pctNow(m), frac(10)); // no drag in progress
  m.setState({ snap: false });
  fire(h, "pointerdown", { clientX: 0 });
  fire(h, "pointermove", { clientX: 31 });
  assert.deepEqual(pctNow(m), frac(21)); // starts from 10%, moves 11.48% unsnapped, rounds to the step
  fire(h, "pointerup", {});
  m.destroy();
});

test("mount percent: typed readouts and presets update every view", () => {
  const { root, m } = mount("percent", pc({ percent: 10 }));
  const input = (suffix) => root.querySelector(`input[id$="-${suffix}"]`);
  const dec = input("decimal");
  dec.value = "1.5";
  fire(dec, "change");
  assert.deepEqual(pctNow(m), frac(150));
  assert.equal(input("percent").value, "150");
  assert.equal(input("amount").value, "30");
  assert.equal(input("fraction").value, "3/2");
  assert.equal(root.querySelectorAll(".fm-grid").length, 2);
  const bad = input("percent");
  bad.value = "lots";
  fire(bad, "change");
  assert.equal(bad.getAttribute("aria-invalid"), "true");
  assert.deepEqual(pctNow(m), frac(150));
  const whole = input("whole");
  whole.value = "8";
  fire(whole, "change");
  assert.equal(input("amount").value, "12");
  const btn = (re) => [...root.querySelectorAll("button")].find((b) => re.test(b.textContent));
  fire(btn(/Double \(200/), "click");
  assert.deepEqual(pctNow(m), frac(200));
  fire(btn(/Half/), "click");
  assert.deepEqual(pctNow(m), frac(50));
  fire(btn(/Undo/), "click");
  assert.deepEqual(pctNow(m), frac(200));
  fire(btn(/Goal/), "click");
  assert.deepEqual(pctNow(m), frac(100));
  fire(btn(/Zoom/), "click");
  assert.ok(root.querySelector(".fm-zoom-svg"));
  assert.ok(root.querySelector(".fm-zoomcell"));
  m.destroy();
});

test("mount percent: language switch re-renders labels and keeps the state", () => {
  const { root, m } = mount(
    "percent",
    pc({
      percent: 150,
      task: { kind: "predict", percent: 150, prompt: { en: "Is it more?", es: "¿Es más?" } },
    }),
  );
  assert.match(root.textContent, /Whole \(100%\)/);
  assert.match(root.textContent, /Is it more\?/);
  m.setState({ percent: 175 });
  m.setLang("es");
  assert.match(root.textContent, /Total \(100%\)/);
  assert.match(root.textContent, /¿Es más\?/);
  assert.match(root.textContent, /175% de 20 libros son 35 libros/);
  assert.equal(root.getAttribute("lang"), "es");
  assert.deepEqual(pctNow(m), frac(175));
  assert.equal(slider(root).getAttribute("aria-valuenow"), "175");
  key(slider(root), "ArrowRight");
  assert.deepEqual(pctNow(m), frac(176));
  assert.doesNotMatch(root.textContent, /undefined|NaN/);
  m.destroy();
});

test("mount percent: readonly draws the views with no handles, inputs or buttons", () => {
  const { root, m } = mount("percent", pc({ percent: 150 }), { readonly: true });
  assert.equal(
    root.querySelectorAll("[role=slider], .fm-handle, input, button, [tabindex]").length,
    0,
  );
  assert.equal(root.querySelectorAll(".fm-grid").length, 2);
  assert.match(root.textContent, /30/);
  m.setState({ percent: 250 });
  assert.equal(root.querySelectorAll(".fm-grid").length, 3);
  m.destroy();
});

test("mount percent: destroy removes the DOM and every listener", () => {
  const { root, m } = mount("percent", pc({ percent: 50 }));
  const h = slider(root);
  const seen = [];
  const off = m.subscribe((s) => seen.push(s.percent));
  m.destroy();
  assert.equal(root.childElementCount, 0);
  const before = m.getState().percent;
  key(h, "ArrowRight");
  fire(h, "pointerdown", { clientX: 0 });
  fire(h, "pointermove", { clientX: 100 });
  assert.deepEqual(m.getState().percent, before);
  off();
});

test("mount percent: onChange fires for changes, not for the first draw", () => {
  const calls = [];
  const { m } = mount("percent", pc({ percent: 10 }), { onChange: (s) => calls.push(s.percent.n) });
  assert.deepEqual(calls, []);
  m.setState({ percent: 20 });
  assert.deepEqual(calls, [20]);
  m.destroy();
});

test("reduced motion: no animation class and no inline transitions", () => {
  reduceMotion = true;
  const a = mount("percent", pc({ percent: 50 }));
  const b = mount("ratio", rc());
  for (const { root, m } of [a, b]) {
    assert.equal(root.classList.contains("fm-anim"), false);
    assert.equal(root.querySelectorAll("[style*='transition']").length, 0);
    m.destroy();
  }
  reduceMotion = false;
  const c = mount("percent", pc({ percent: 50 }));
  assert.equal(c.root.classList.contains("fm-anim"), true);
  assert.equal(c.root.querySelectorAll("[style*='transition']").length, 0);
  c.m.destroy();
});

// ── DOM: ratio ───────────────────────────────────────────────────────────────

test("mount ratio: table, line and tape all follow one batch count", () => {
  const { root, m } = mount("ratio", rc({ n: 4 }));
  assert.equal(root.querySelectorAll("tbody tr").length, 2);
  assert.equal(root.querySelector("tr.fm-active .fm-num").textContent, "12");
  assert.match(root.querySelector(".fm-view-line").textContent, /12/);
  const h = slider(root);
  assert.equal(h.getAttribute("aria-valuenow"), "4");
  key(h, "ArrowRight");
  assert.deepEqual(m.getState().n, frac(5));
  assert.equal(root.querySelector("tr.fm-active .fm-num").textContent, "15");
  assert.match(h.getAttribute("aria-valuetext"), /5 batches: 15:25/);
  key(h, "End");
  assert.deepEqual(m.getState().n, frac(12));
  key(h, "Home");
  assert.deepEqual(m.getState().n, frac(1));
  assert.doesNotMatch(root.innerHTML, /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|undefined|NaN/);
  m.destroy();
});

test("mount ratio: pointer on the tape handle stretches the ratio; table edits move the tape", () => {
  const { root, m } = mount("ratio", rc({ n: 2 }));
  const h = slider(root);
  fire(h, "pointerdown", { clientX: 50 });
  fire(h, "pointermove", { clientX: 50 + 25 * 3 }); // 25 units per batch (300 / 12)
  assert.deepEqual(m.getState().n, frac(5));
  fire(h, "pointerup", {});
  const rows = root.querySelectorAll("tbody tr");
  const input = rows[0].querySelector("input");
  input.value = "6";
  fire(input, "change");
  assert.deepEqual(m.getState().n, frac(6));
  assert.equal(m.getState().active, 0);
  assert.equal(root.querySelectorAll("tbody tr")[0].classList.contains("fm-active"), true);
  const add = [...root.querySelectorAll("button")].find((b) => /Add a row/.test(b.textContent));
  fire(add, "click");
  assert.equal(root.querySelectorAll("tbody tr").length, 3);
  const bad = root.querySelector("tbody input");
  bad.value = "-2";
  fire(bad, "change");
  assert.equal(bad.getAttribute("aria-invalid"), "true");
  const line = root.querySelector(".fm-view-line .fm-handle");
  assert.equal(line.getAttribute("aria-hidden"), "true");
  assert.equal(line.hasAttribute("role"), false);
  fire(line, "pointerdown", { clientX: 0 });
  fire(line, "pointermove", { clientX: 20 + 320 * (8 / 12) }); // batch 8 on the number line
  assert.deepEqual(m.getState().n, frac(8));
  m.destroy();
});

test("mount ratio: language switch, readonly and destroy", () => {
  const { root, m } = mount("ratio", rc({ n: 4 }));
  m.setLang("es");
  assert.match(root.textContent, /Lotes/);
  assert.match(root.textContent, /tazas de jugo/);
  assert.match(root.textContent, /Con 4 lotes la razón es 12:20/);
  assert.deepEqual(m.getState().n, frac(4));
  key(slider(root), "ArrowRight");
  assert.deepEqual(m.getState().n, frac(5));
  m.destroy();
  const ro = mount("ratio", rc({ n: 4 }), { readonly: true });
  assert.equal(ro.root.querySelectorAll("[role=slider], .fm-handle, input, button").length, 0);
  assert.equal(ro.root.querySelectorAll("tbody tr").length, 2);
  ro.m.destroy();
});

test("makeDraggable: aria:false adds no role or tab stop; destroy detaches", () => {
  const node = document.createElement("div");
  let v = 0;
  const d = makeDraggable(node, {
    aria: false,
    get: () => v,
    set: (x) => {
      v = x;
    },
    min: 0,
    max: 10,
    toValue: ({ x }) => x,
  });
  assert.equal(node.hasAttribute("role"), false);
  assert.equal(node.hasAttribute("tabindex"), false);
  fire(node, "pointerdown", { clientX: 0 });
  fire(node, "pointermove", { clientX: 4 });
  assert.equal(v, 4);
  fire(node, "pointermove", { clientX: 99 });
  assert.equal(v, 10);
  d.destroy();
  fire(node, "pointermove", { clientX: 1 });
  assert.equal(v, 10);
});

// ── Exponents family ─────────────────────────────────────────────────────────

test("exponents: repeated multiplication, misconceptions, and DOM mount", () => {
  const m = createModel("exponents", { base: 2, exponent: 3, maxExponent: 5 });
  assert.equal(m.getState().power, 8);
  assert.equal(m.getState().additive, 6);
  assert.equal(m.getState().factorsChain, "2 × 2 × 2");
  assert.equal(m.validate({ kind: "evaluate-power", base: 2, exponent: 3, answer: 8 }).ok, true);
  assert.equal(
    m.validate({ kind: "evaluate-power", base: 2, exponent: 3, answer: 6 }).misconception?.id,
    "exponent-as-multiplier",
  );
  assert.equal(
    m.validate({ kind: "evaluate-power", base: 2, exponent: 3, answer: 9 }).misconception?.id,
    "swapped-base-exponent",
  );
  assert.equal(
    m.validate({ kind: "evaluate-power", base: 2, exponent: 0, answer: 0 }).misconception?.id,
    "zero-power-is-zero",
  );
  m.setState({ exponent: 4 });
  assert.equal(m.getState().power, 16);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().power, 8);

  const { root, m: domM } = mount("exponents", { base: 2, exponent: 3 });
  assert.doesNotMatch(root.innerHTML, /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|undefined|NaN|\son[a-z]+=/i);
  domM.setLang("es");
  assert.match(root.textContent, /Base|Exponente/);
  domM.destroy();
});
