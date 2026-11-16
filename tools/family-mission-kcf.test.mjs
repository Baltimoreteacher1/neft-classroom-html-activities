// Family Mission "kcf" model: Keep, Change, Flip for dividing fractions. Expected values are worked
// out by hand here, independently of the code under test.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { createModel, mountModel } from "../assets/family-mission/models/index.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
globalThis.matchMedia = () => ({ matches: true });
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));

const click = (node) =>
  node.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
const next = (root) => root.querySelector(".fm-kcf-move.is-next");
const label = (root) => root.querySelector(".fm-kcf-expr").getAttribute("aria-label");

test("3/4 ÷ 6: a whole number divisor needs the write-as-fractions move first", () => {
  const m = createModel("kcf", { dividend: "3/4", divisor: "6" });
  assert.deepEqual(m.getState().moves, ["fractions", "keep", "change", "flip", "multiply"]);
  for (const done of [1, 2, 3, 4, 5]) assert.equal(m.setState({ done }), true);
  const d = m.getState();
  assert.deepEqual(d.tokens, { a: "3/4", op: "×", b: "1/6" });
  assert.deepEqual(d.product, { n: 3, d: 24 });
  assert.deepEqual(d.answer, { n: 1, d: 8 });
  assert.equal(d.simplified, true);
  assert.equal(d.smaller, true);
  assert.match(m.getMathematicalExplanation("en"), /3\/4 × 1\/6 = 3\/24 = 1\/8\./);
  assert.match(
    m.getMathematicalExplanation("en"),
    /Check: 1\/8 × 6\/1 = 3\/4\. It matches the start, 3\/4\./,
  );
  assert.match(m.getMathematicalExplanation("es"), /Comprueba/);
});

test("proper fractions skip the conversion move, mixed numbers convert exactly", () => {
  assert.deepEqual(createModel("kcf", { dividend: "3/4", divisor: "1/8" }).getState().moves, [
    "keep",
    "change",
    "flip",
    "multiply",
  ]);
  const m = createModel("kcf", { dividend: "4 1/2", divisor: "1 1/2" });
  m.setState({ done: 1 });
  assert.deepEqual(m.getState().tokens, { a: "9/2", op: "÷", b: "3/2" });
  for (const done of [2, 3, 4, 5]) m.setState({ done });
  assert.deepEqual(m.getState().answer, { n: 3, d: 1 });
  assert.equal(m.getState().smaller, true, "3 is less than 4 1/2");
});

test("a whole number divided by a fraction: 6 ÷ 2/3 = 9", () => {
  const m = createModel("kcf", { dividend: "6", divisor: "2/3" });
  for (const done of [1, 2, 3, 4, 5]) m.setState({ done });
  assert.deepEqual(m.getState().answer, { n: 9, d: 1 });
});

test("the moves are bounded, undo steps back, a new problem starts over", () => {
  const presets = [
    { dividend: "3/4", divisor: "1/8" },
    { dividend: "2/3", divisor: "1/6" },
  ];
  const m = createModel("kcf", { ...presets[0], presets });
  assert.equal(m.setState({ done: 2 }), false, "cannot skip a move");
  assert.equal(m.setState({ done: 9 }), false, "cannot skip past the last move");
  for (const done of [1, 2]) m.setState({ done });
  assert.equal(m.getState().applied.change, true);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().done, 1);
  for (const done of [2, 3, 4]) m.setState({ done });
  m.setState(presets[1]);
  assert.equal(m.getState().done, 0);
  m.reset();
  assert.deepEqual(m.getState().problem, presets[0]);
});

test("bad problems are refused", () => {
  for (const cfg of [
    {},
    { dividend: "3/4", divisor: "0" },
    { dividend: "3/4", divisor: "0/5" },
    { dividend: "x", divisor: "2" },
    { dividend: "3/4", divisor: "1/0" },
  ])
    assert.throws(() => createModel("kcf", cfg), TypeError);
  assert.throws(
    () =>
      createModel("kcf", {
        dividend: "3/4",
        divisor: "2",
        presets: [{ dividend: "1", divisor: "0" }],
      }),
    TypeError,
  );
});

test("serialize and restore round-trip", () => {
  const m = createModel("kcf", { dividend: "3/4", divisor: "1/8" });
  for (const done of [1, 2, 3]) m.setState({ done });
  const json = m.serialize();
  const m2 = createModel("kcf", { dividend: "3/4", divisor: "1/8" });
  assert.equal(m2.restore(json), true);
  assert.equal(m2.getState().done, 3);
  assert.equal(m2.restore(json.replace('"done":3', '"done":99')), false);
});

test("mounted: tap the moves in order, then read the answer and the check", () => {
  const root = document.createElement("div");
  document.body.append(root);
  const presets = [
    { dividend: "3/4", divisor: "6" },
    { dividend: "2/3", divisor: "1/6" },
  ];
  const m = mountModel(root, "kcf", { ...presets[0], presets });
  assert.match(label(root), /3\/4 ÷ 6/);
  assert.equal(
    root.querySelectorAll(".fm-kcf-move:not(:disabled)").length,
    1,
    "only the next move is live",
  );
  click(next(root)); // write as fractions
  assert.match(label(root), /3\/4 ÷ 6\/1/);
  click(next(root)); // keep
  assert.ok(root.querySelector(".is-keep"));
  click(next(root)); // change
  assert.ok(root.querySelector(".is-change"));
  assert.match(label(root), /3\/4 × 6\/1/);
  click(next(root)); // flip
  assert.ok(root.querySelector(".is-flip"));
  assert.match(label(root), /3\/4 × 1\/6/);
  assert.equal(root.querySelector(".fm-kcf-result").hidden, true);
  click(next(root)); // multiply
  assert.equal(root.querySelector(".fm-kcf-result").hidden, false);
  assert.match(root.querySelector(".fm-kcf-eq").textContent, /3\/4 × 1\/6 = 3\/24 = 1\/8/);
  assert.equal(next(root), null);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(m.getState().done, 0);
  assert.deepEqual(m.getState().problem, presets[1]);
  m.setLang("es");
  assert.match(root.textContent, /Mantener/);
  assert.equal(m.getState().done, 0);
  m.destroy();
});

test("readonly: the same picture, no live controls", () => {
  const root = document.createElement("div");
  document.body.append(root);
  mountModel(root, "kcf", { dividend: "3/4", divisor: "1/8" }, { readonly: true });
  assert.equal(root.querySelectorAll(".fm-kcf-move:not(:disabled)").length, 0);
  assert.equal(root.querySelector(".fm-actions"), null);
});
