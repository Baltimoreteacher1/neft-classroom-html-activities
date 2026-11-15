// Family Mission "polygon" model: the area of a regular polygon from n equal triangles. Expected
// values are worked out by hand here, independently of the code under test.
//   hexagon, side 6 ft, apothem 5.2 ft:  rectangle 6 × 5.2 = 31.2, triangle 15.6, polygon 6 × 15.6 = 93.6
//   decagon, side 3 ft, apothem 4 ft:    rectangle 12, triangle 6, polygon 60
//   pentagon, side 4 cm, apothem 3 cm:   rectangle 12, triangle 6, polygon 30
//   octagon, side 2 ft, apothem 2.4 ft:  rectangle 4.8, triangle 2.4, polygon 19.2
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import * as fam from "../assets/family-mission/models/polygon.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
globalThis.matchMedia = () => ({ matches: true });
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));

const FEET = { en: "feet", es: "pies" };
const HEX = { n: 6, side: 6, apothem: 5.2, unit: FEET };
const DECAGON = { n: 10, side: 3, apothem: 4, unit: FEET };
const click = (node) =>
  node.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
const move = (root) => root.querySelector(".fm-polygon-move:not(:disabled)");
const act = (root, name) => root.querySelector(`[data-act="${name}"]`);
const run = (m, steps) => {
  for (const patch of steps) assert.equal(m.setState(patch), true);
};
const ratEq = (x, n, d = 1) => assert.deepEqual(x, { n, d });

test("hexagon, side 6 ft, apothem 5.2 ft: one triangle 15.6, whole 93.6", () => {
  const m = fam.create(HEX);
  const d0 = m.getState();
  assert.equal(d0.next, "split");
  assert.equal(d0.split, 0);
  ratEq(d0.rect, 156, 5); // 6 × 5.2 = 31.2
  ratEq(d0.tri, 78, 5); // 31.2 ÷ 2 = 15.6
  ratEq(d0.total, 468, 5); // 6 × 15.6 = 93.6
  ratEq(d0.nRect, 936, 5); // 6 rectangles = 187.2
  run(m, [{ split: 1 }, { split: 2 }, { split: 3 }, { split: 4 }, { split: 5 }]);
  assert.equal(m.getState().allSplit, false);
  run(m, [{ split: 6 }]);
  assert.equal(m.getState().next, "focus");
  run(m, [{ stage: 1 }]);
  assert.equal(m.getState().next, "triangle");
  run(m, [{ stage: 2 }, { stage: 3 }]);
  assert.equal(m.getState().finished, true);
  assert.equal(m.getState().next, null);
  const text = m.getMathematicalExplanation("en");
  assert.match(text, /regular hexagon has 6 sides, so it splits into 6 equal triangles/);
  assert.match(text, /One triangle: ½ × 6 × 5\.2 = 15\.6 square feet\./);
  assert.match(text, /A rectangle 6 by 5\.2 is 31\.2 square feet\. The triangle is half of it\./);
  assert.match(text, /Whole polygon: 6 × 15\.6 = 93\.6 square feet\./);
  assert.match(
    text,
    /6 rectangles 6 by 5\.2 would be 187\.2 square feet\. The polygon is half of that\./,
  );
});

test("decagon, side 3 ft, apothem 4 ft: ten triangles of 6 make 60", () => {
  const m = fam.create(DECAGON);
  run(m, [{ splitAll: true }, { stage: 1 }, { stage: 2 }, { stage: 3 }]);
  const d = m.getState();
  assert.equal(d.split, 10);
  ratEq(d.rect, 12);
  ratEq(d.tri, 6);
  ratEq(d.total, 60);
  ratEq(d.nRect, 120);
  assert.match(m.getMathematicalExplanation("en"), /Whole polygon: 10 × 6 = 60 square feet\./);
});

test("other lesson polygons: pentagon 30 cm², octagon 19.2 ft²", () => {
  const pent = fam.create({
    n: 5,
    side: 4,
    apothem: 3,
    unit: { en: "centimeters", es: "centímetros" },
    stage: 3,
  });
  ratEq(pent.getState().total, 30);
  assert.match(pent.getMathematicalExplanation("en"), /5 × 6 = 30 square centimeters\./);
  assert.match(pent.getMathematicalExplanation("es"), /5 × 6 = 30 centímetros cuadrados\./);
  const oct = fam.create({ n: 8, side: "2", apothem: "2.4", unit: FEET, stage: 3 });
  ratEq(oct.getState().tri, 12, 5);
  ratEq(oct.getState().total, 96, 5);
});

test("the steps go in order and one triangle at a time", () => {
  const m = fam.create(HEX);
  assert.equal(m.setState({ split: 2 }), false, "cannot skip a triangle");
  assert.equal(
    m.setState({ stage: 1 }),
    false,
    "cannot look at one triangle before the split is done",
  );
  assert.equal(m.setState({ split: 0 }), false);
  run(m, [{ split: 1 }]);
  assert.equal(m.setState({ split: 1 }), false, "cannot split the same triangle twice");
  run(m, [{ splitAll: true }]);
  assert.equal(m.setState({ split: 7 }), false, "cannot split past n");
  assert.equal(m.setState({ stage: 2 }), false, "cannot skip a step");
  assert.equal(m.setState({ stage: 4 }), false);
  assert.equal(m.setState({ splitAll: 1 }), false);
  assert.equal(m.setState({ split: 1, stage: 1 }), false, "one change at a time");
  assert.equal(m.setState({ colour: "red" }), false);
  assert.equal(m.setState({}), false);
});

test("undo steps back, reset starts over", () => {
  const m = fam.create(HEX);
  run(m, [{ split: 1 }, { split: 2 }]);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().split, 1);
  run(m, [{ splitAll: true }, { stage: 1 }]);
  assert.equal(m.getState().stage, 1);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().stage, 0);
  assert.equal(m.getState().split, 6);
  m.reset();
  assert.equal(m.getState().split, 0);
  assert.equal(m.getState().stage, 0);
  assert.equal(m.undo(), true, "reset itself can be undone");
  assert.equal(m.getState().split, 6);
});

test("the stepper changes n (3 to 12); side and apothem stay the same", () => {
  const m = fam.create(HEX);
  run(m, [{ splitAll: true }, { stage: 1 }, { stage: 2 }, { stage: 3 }]);
  run(m, [{ n: 7 }]); // 7 × 15.6 = 109.2, a finished split stays finished
  let d = m.getState();
  assert.equal(d.n, 7);
  assert.equal(d.split, 7);
  assert.equal(d.stage, 3);
  ratEq(d.side, 6);
  ratEq(d.apothem, 26, 5);
  ratEq(d.total, 546, 5);
  run(m, [{ n: 3 }]); // 3 × 15.6 = 46.8
  ratEq(m.getState().total, 234, 5);
  run(m, [{ n: 12 }]); // 12 × 15.6 = 187.2
  ratEq(m.getState().total, 936, 5);
  assert.equal(m.setState({ n: 13 }), false);
  assert.equal(m.setState({ n: 2 }), false);
  assert.equal(m.setState({ n: 6.5 }), false);
  assert.equal(m.setState({ n: "8" }), false);
  const p = fam.create(HEX);
  run(p, [{ split: 1 }, { split: 2 }, { split: 3 }, { split: 4 }]);
  run(p, [{ n: 8 }]);
  assert.equal(p.getState().split, 4, "a partial split keeps its count");
  run(p, [{ n: 3 }]);
  assert.equal(p.getState().split, 3, "never more triangles than sides");
  assert.equal(p.getState().allSplit, true);
  assert.equal(p.getState().stage, 0);
  d = p.getState();
  assert.equal(d.n, d.split);
});

test("presets start a new problem from the beginning", () => {
  const presets = [
    { n: 6, side: 6, apothem: 5.2 },
    { n: 5, side: 4, apothem: 3, unit: { en: "centimeters", es: "centímetros" } },
  ];
  const m = fam.create({ ...HEX, presets });
  run(m, [{ splitAll: true }, { stage: 1 }]);
  run(m, [{ preset: 1 }]);
  const d = m.getState();
  assert.equal(d.n, 5);
  assert.equal(d.split, 0);
  assert.equal(d.stage, 0);
  assert.equal(d.unit.en, "centimeters");
  assert.equal(d.unit.area.en, "square centimeters");
  ratEq(d.tri, 6);
  assert.equal(m.setState({ preset: 2 }), false);
  assert.equal(m.setState({ preset: -1 }), false);
  m.reset();
  assert.equal(m.getState().n, 6);
});

test("bad configuration is refused", () => {
  for (const bad of [
    {},
    { ...HEX, n: 2 },
    { ...HEX, n: 13 },
    { ...HEX, n: 6.5 },
    { ...HEX, n: "6" },
    { ...HEX, side: 0 },
    { ...HEX, side: -6 },
    { ...HEX, side: "x" },
    { ...HEX, side: "1/0" },
    { ...HEX, side: 10001 },
    { ...HEX, apothem: 0 },
    { ...HEX, apothem: null },
    { ...HEX, apothem: 5.123 },
    { ...HEX, apothem: Number.NaN },
    { ...HEX, unit: undefined },
    { ...HEX, unit: { en: "feet" } },
    { ...HEX, unit: { en: "", es: "pies" } },
    { ...HEX, stage: 4 },
    { ...HEX, stage: 1.5 },
    { ...HEX, presets: [{ n: 99, side: 1, apothem: 1 }] },
    { ...HEX, presets: [null] },
  ])
    assert.throws(() => fam.create(bad), TypeError, JSON.stringify(bad));
  assert.throws(() => fam.create(null), TypeError);
});

test("serialize and restore round-trip; a tampered state is refused", () => {
  const m = fam.create(HEX);
  run(m, [{ splitAll: true }, { stage: 1 }, { stage: 2 }]);
  const json = m.serialize();
  const m2 = fam.create(HEX);
  assert.equal(m2.restore(json), true);
  assert.equal(m2.getState().stage, 2);
  ratEq(m2.getState().tri, 78, 5);
  assert.equal(m2.restore(json.replace('"stage":2', '"stage":9')), false);
  assert.equal(
    m2.restore(json.replace('"split":6', '"split":2')),
    false,
    "stage needs a finished split",
  );
  assert.equal(m2.restore(json.replace('"n":6,"d":1', '"n":-6,"d":1')), false);
  assert.equal(m2.restore(json.replace('"family":"polygon"', '"family":"kcf"')), false);
  assert.equal(m2.getState().stage, 2, "a refused restore changes nothing");
});

test("validate: the task answer is the whole area", () => {
  const m = fam.create({ ...HEX, task: { area: "93.6" } });
  assert.equal(m.validate().reason, "not-finished");
  run(m, [{ splitAll: true }, { stage: 1 }, { stage: 2 }, { stage: 3 }]);
  assert.deepEqual(m.validate(), { ok: true, reason: "correct", misconception: null });
  assert.equal(m.validate({ area: "15.6" }).ok, false);
  assert.equal(m.validate({ area: 93.6 }).ok, true);
  assert.equal(fam.create(HEX).validate().reason, "no-task");
});

test("mounted: split, look at one triangle, find its area, then the whole area", () => {
  const root = document.createElement("div");
  document.body.append(root);
  const presets = [
    { n: 6, side: 6, apothem: 5.2 },
    { n: 10, side: 3, apothem: 4 },
  ];
  const m = fam.create({ ...HEX, presets });
  const view = fam.mount(root, m, { lang: "en" });
  assert.match(
    root.querySelector(".fm-polygon-given").textContent,
    /Side: 6 feet\. Apothem: 5\.2 feet\./,
  );
  assert.match(root.querySelector(".fm-polygon-tally").textContent, /^0 of 6 triangles\./);
  assert.match(root.querySelector(".fm-polygon-sides").textContent, /6 sides/);
  assert.match(root.querySelector(".fm-polygon-note").textContent, /Same side and apothem\./);
  assert.equal(root.querySelectorAll(".fm-polygon-wedge.is-split").length, 0);
  click(act(root, "split"));
  click(act(root, "split"));
  assert.match(root.querySelector(".fm-polygon-tally").textContent, /^2 of 6 triangles\./);
  assert.equal(root.querySelectorAll(".fm-polygon-wedge.is-split").length, 2);
  assert.equal(
    root.querySelectorAll(".fm-polygon-wedge.is-next").length,
    1,
    "the next triangle is outlined",
  );
  assert.equal(root.querySelector(".fm-polygon-result").hidden, true);
  click(act(root, "all"));
  assert.match(
    root.querySelector(".fm-polygon-tally").textContent,
    /^6 of 6 triangles\. 6 sides, 6 triangles\./,
  );
  assert.equal(root.querySelectorAll(".fm-polygon-wedge.is-split").length, 6);
  assert.equal(act(root, "split"), null);
  assert.match(move(root).textContent, /Look at one triangle/);
  click(move(root));
  assert.equal(root.querySelectorAll(".fm-polygon-wedge.is-focus").length, 1);
  assert.match(root.querySelector("svg").textContent, /base = 6 feet/);
  assert.match(root.querySelector("svg").textContent, /height = 5\.2 feet/);
  assert.match(root.querySelector(".fm-polygon-hint").textContent, /half of a rectangle/);
  assert.equal(root.querySelector(".fm-polygon-result").hidden, true);
  click(move(root));
  assert.equal(root.querySelector(".fm-polygon-result").hidden, false);
  assert.match(
    root.querySelector(".fm-polygon-eq").textContent,
    /½ × 6 × 5\.2 = 15\.6 square feet/,
  );
  assert.doesNotMatch(root.querySelector(".fm-polygon-result").textContent, /93\.6/);
  click(move(root));
  assert.match(
    root.querySelector(".fm-polygon-result").textContent,
    /6 × 15\.6 = 93\.6 square feet/,
  );
  assert.match(root.querySelector(".fm-polygon-result").textContent, /187\.2/);
  assert.equal(move(root), null);
  // The stepper changes n; the finished split stays finished and the total follows.
  click(root.querySelector('[aria-label="More sides"]'));
  assert.match(root.querySelector(".fm-polygon-sides").textContent, /7 sides/);
  assert.match(
    root.querySelector(".fm-polygon-result").textContent,
    /7 × 15\.6 = 109\.2 square feet/,
  );
  assert.match(
    root.querySelector(".fm-polygon-tally").textContent,
    /7 of 7 triangles\. 7 sides, 7 triangles\./,
  );
  assert.equal(
    root.querySelectorAll(".fm-polygon-shape, .fm-polygon-wedge").length,
    8,
    "outline plus 7 triangles",
  );
  for (let i = 0; i < 6; i++) click(root.querySelector('[aria-label="More sides"]'));
  assert.equal(root.querySelector('[aria-label="More sides"]').disabled, true, "stops at 12");
  assert.match(root.querySelector(".fm-polygon-sides").textContent, /12 sides/);
  assert.match(
    root.querySelector(".fm-polygon-result").textContent,
    /12 × 15\.6 = 187\.2 square feet/,
  );
  // Pick another polygon: starts over.
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(m.getState().n, 10);
  assert.equal(m.getState().split, 0);
  assert.match(
    root.querySelector(".fm-polygon-given").textContent,
    /Side: 3 feet\. Apothem: 4 feet\./,
  );
  assert.equal(
    root.querySelector('[data-pick="1"]').textContent,
    "regular decagon: side 3, apothem 4 feet",
  );
  assert.equal(root.querySelector('[data-pick="1"]').getAttribute("aria-pressed"), "true");
  assert.equal(root.querySelector('[data-pick="0"]').getAttribute("aria-pressed"), "false");
  click(root.querySelector(".fm-actions button:last-child"));
  assert.equal(m.getState().n, 6, "start over returns to the first problem");
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN|\[object/);
  // Text alternative and drawing.
  assert.match(
    root.querySelector(".fm-sr").textContent,
    /Area of a regular polygon model\. Shape: regular hexagon, 6 sides\./,
  );
  assert.ok(root.querySelector("svg[role='img']").getAttribute("aria-label"));
  assert.ok(root.querySelectorAll("button").length > 4);
  for (const b of root.querySelectorAll("button")) assert.equal(b.getAttribute("type"), "button");
  view.destroy();
  assert.equal(root.children.length, 0);
});

test("mounted: Spanish for every visible string, and switching language keeps the progress", () => {
  const root = document.createElement("div");
  document.body.append(root);
  const m = fam.create({
    ...DECAGON,
    presets: [
      { n: 10, side: 3, apothem: 4 },
      { n: 5, side: 4, apothem: 3 },
    ],
  });
  const view = fam.mount(root, m, { lang: "en" });
  click(act(root, "all"));
  click(move(root));
  click(move(root));
  view.setLang("es");
  assert.equal(root.getAttribute("lang"), "es");
  assert.equal(m.getState().stage, 2, "progress kept");
  const text = root.textContent;
  for (const word of [
    /Lado: 3 pies\. Apotema: 4 pies\./,
    /10 de 10 triángulos/,
    /10 lados/,
    /Un triángulo: ½ × 3 × 4 = 6 pies cuadrados\./,
    /Un rectángulo de 3 por 4 mide 12 pies cuadrados/,
    /altura = 4 pies/,
    /base = 3 pies/,
    /Deshacer/,
    /Empezar de nuevo/,
    /Mismo lado y misma apotema/,
    /decágono regular: lado 3, apotema 4 pies/,
  ]) {
    assert.match(text, word);
  }
  assert.doesNotMatch(text, /\b(Split|Look at|Find|Undo|Side:|Apothem|triangles|sides)\b/);
  assert.equal(root.querySelector('[aria-label="Más lados"]') !== null, true);
  assert.match(move(root).textContent, /Hallar el área completa/);
  click(move(root));
  assert.match(
    root.querySelector(".fm-polygon-result").textContent,
    /Polígono completo: 10 × 6 = 60 pies cuadrados\./,
  );
  assert.match(m.getMathematicalExplanation("es"), /Un decágono regular tiene 10 lados/);
  assert.match(m.getAccessibleDescription("es"), /^Modelo del área de un polígono regular/);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
  view.destroy();
});

test("the drawing: one triangle per side, with the base and the height drawn on one of them", () => {
  const root = document.createElement("div");
  document.body.append(root);
  for (const n of [3, 4, 12]) {
    root.replaceChildren();
    const m = fam.create({ n, side: 6, apothem: 5.2, unit: FEET, stage: 1 });
    const view = fam.mount(root, m, { lang: "en" });
    assert.equal(root.querySelectorAll(".fm-polygon-wedge").length, n);
    assert.equal(root.querySelectorAll(".fm-polygon-wedge.is-focus").length, 1);
    assert.equal(root.querySelectorAll(".fm-polygon-base, .fm-polygon-height").length, 2);
    for (const p of root.querySelectorAll("polygon"))
      assert.doesNotMatch(p.getAttribute("points"), /NaN|Infinity/);
    view.destroy();
  }
});

test("readonly: the same picture, no live controls", () => {
  const root = document.createElement("div");
  document.body.append(root);
  const m = fam.create({
    ...HEX,
    stage: 3,
    presets: [
      { n: 6, side: 6, apothem: 5.2 },
      { n: 5, side: 4, apothem: 3 },
    ],
  });
  fam.mount(root, m, { lang: "en", readonly: true });
  assert.equal(root.querySelectorAll("button:not(:disabled)").length, 0);
  assert.equal(root.querySelector(".fm-actions"), null);
  assert.equal(root.querySelector(".fm-polygon-picks"), null);
  assert.match(
    root.querySelector(".fm-polygon-result").textContent,
    /6 × 15\.6 = 93\.6 square feet/,
  );
  assert.equal(root.querySelectorAll(".fm-polygon-wedge.is-split").length, 6);
  assert.equal(root.querySelector("[data-act]"), null);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
});

test("the markup carries no inline handlers", () => {
  const root = document.createElement("div");
  document.body.append(root);
  const view = fam.mount(root, fam.create(HEX), { lang: "en" });
  for (const el of root.querySelectorAll("*"))
    for (const a of el.attributes) assert.doesNotMatch(a.name, /^on/i);
  view.destroy();
});
