// The family "exponents" model after the copies picture: widened ranges stay a superset (old saves still load), the picture
// and the fields share one state, language switches redraw both, exponent 0 keeps working, and the text equivalent matches.
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createModel, mountModel } from "../assets/family-mission/models/index.mjs";
import { describe, exponentModel } from "../shared/motion/exponent-copies.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
for (const k of [
  "window",
  "document",
  "HTMLElement",
  "Node",
  "Element",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "PointerEvent",
  "SVGElement",
  "getComputedStyle",
]) {
  if (dom.window[k] !== undefined)
    Object.defineProperty(globalThis, k, {
      value: dom.window[k],
      configurable: true,
      writable: true,
    });
}
globalThis.matchMedia = () => ({ matches: false });
const mount = (config, opts) => {
  const root = document.createElement("div");
  document.body.append(root);
  return { root, m: mountModel(root, "exponents", config, opts) };
};

test("ranges widen to base 1-12 and exponent 0-8, and every old configuration and save still validates", () => {
  for (const cfg of [
    { base: 10, exponent: 6, maxExponent: 6 },
    { base: 2, exponent: 3 },
    { base: 1, exponent: 0 },
    { base: 12, exponent: 8, maxExponent: 8 },
  ])
    assert.doesNotThrow(() => createModel("exponents", cfg), JSON.stringify(cfg));
  assert.throws(() => createModel("exponents", { base: 13 }), RangeError);
  assert.throws(() => createModel("exponents", { base: 0 }), RangeError);
  assert.throws(() => createModel("exponents", { exponent: 9, maxExponent: 8 }), RangeError);
  const m = createModel("exponents", { base: 3, exponent: 4, maxExponent: 8 });
  assert.equal(m.setState({ base: 12 }), true);
  assert.equal(m.setState({ base: 13 }), false, "out of range is refused, state unchanged");
  assert.equal(m.getState().base, 12);
  assert.equal(m.setState({ exponent: 8 }), true);
  assert.equal(m.getState().power, 429981696);
  assert.equal(m.setState({ exponent: 9 }), false);
  assert.equal(m.getState().power, 429981696);
});

test("the exponent validator still names the multiplied-base misconception, now up to 12^8", () => {
  const m = createModel("exponents", { base: 12, exponent: 8, maxExponent: 8 });
  assert.equal(
    m.validate({ kind: "evaluate-power", base: 12, exponent: 8, answer: 429981696 }).ok,
    true,
  );
  assert.equal(
    m.validate({ kind: "evaluate-power", base: 12, exponent: 8, answer: 96 }).misconception?.id,
    "exponent-as-multiplier",
  );
});

test("the picture, fields and text equivalent come from one state and follow every change", () => {
  const { root, m } = mount({ base: 3, exponent: 4, maxExponent: 8 });
  const svg = () => root.querySelector(".fm-exp-pic svg.mc-exponent");
  assert.ok(svg(), "picture is mounted");
  assert.equal(root.querySelectorAll(".fm-exp-pic .mc-card").length, 4);
  assert.match(svg().textContent, /3 × 3 × 3 × 3 = 81/);
  assert.match(svg().textContent, /3⁴ is not 3 × 4 = 12/);
  m.setState({ base: 2, exponent: 2 });
  assert.equal(root.querySelectorAll(".fm-exp-pic .mc-card").length, 2);
  assert.doesNotMatch(svg().textContent, /is not/, "2² = 2 × 2: no false misconception line");
  m.setState({ base: 12, exponent: 8 });
  assert.equal(root.querySelectorAll(".fm-exp-pic .mc-card").length, 8);
  assert.match(svg().textContent, /429,981,696/);
  assert.equal(m.getAccessibleDescription("en"), describe(exponentModel(12, 8), "en"));
  assert.equal(
    root.querySelector(".fm-exp-pic .mc-sr").textContent,
    describe(exponentModel(12, 8), "en"),
  );
  m.destroy();
});

test("language switch redraws the picture in Spanish and back", () => {
  const { root, m } = mount({ base: 3, exponent: 3, maxExponent: 5 }, { lang: "en" });
  assert.match(root.textContent, /copies of 9/);
  m.setLang("es");
  assert.match(root.querySelector(".fm-exp-pic svg").textContent, /3 copias de 9/);
  assert.match(root.querySelector(".fm-exp-pic svg").textContent, /base: el factor/);
  assert.match(root.querySelector(".fm-exp-pic .mc-btn").textContent, /Míralo construirse/);
  m.setLang("en");
  assert.match(root.querySelector(".fm-exp-pic svg").textContent, /3 copies of 9/);
  m.destroy();
});

test("exponent 0 hides the picture and says why, instead of drawing nothing", () => {
  const { root, m } = mount({ base: 5, exponent: 0, maxExponent: 5 });
  assert.equal(root.querySelector(".fm-exp-pic").hidden, true);
  assert.match(root.querySelector(".fm-exp-copies .fm-explain").textContent, /5⁰ = 1/);
  m.setState({ exponent: 2 });
  assert.equal(root.querySelector(".fm-exp-pic").hidden, false);
  m.destroy();
});

test("the legacy growth chart is kept, inside a collapsed details", () => {
  const { root, m } = mount({ base: 2, exponent: 3 });
  const d = root.querySelector("details.fm-exp-growth");
  assert.ok(d && !d.open);
  assert.ok(d.querySelector("svg.fm-exp-svg"));
  m.destroy();
});
