#!/usr/bin/env node
/**
 * assets/ewl-math-svg.js must emit well-formed, print-safe, self-contained SVG:
 * explicit size, white background, no external URLs, Unicode minus, no
 * NaN/undefined, and loud failure on bad input.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { JSDOM } from "jsdom";

const sandbox = { module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(
  readFileSync(new URL("../assets/ewl-math-svg.js", import.meta.url), "utf8"),
  sandbox,
);
const svg = sandbox.module.exports;

const samples = {
  numberLine: svg.makeNumberLineSVG({
    min: -5,
    max: 5,
    points: [
      { value: -2, closed: true },
      { value: 3, closed: false },
    ],
    ray: { from: 3, dir: 1 },
  }),
  tape: svg.makeTapeDiagramSVG({ parts: 5, shaded: 3, partLabel: "n", totalLabel: "31" }),
  placeValue: svg.makePlaceValueTableSVG({ digitsLeft: ["1", "2"], digitsRight: ["5", "0"] }),
  plane: svg.makeCoordinatePlaneSVG({
    range: 6,
    points: [
      { x: -3, y: 2, label: "A" },
      { x: 2, y: 2 },
      { x: 2, y: -4 },
    ],
    polygon: true,
  }),
  balanceLevel: svg.makeBalanceScaleSVG({
    left: ["x", "1", "1"],
    right: ["1", "1", "1"],
    leftWeight: 3,
    rightWeight: 3,
  }),
  balanceTilt: svg.makeBalanceScaleSVG({
    left: ["x"],
    right: ["1", "1", "1"],
    leftWeight: 1,
    rightWeight: 3,
  }),
  triangle: svg.makeGeometryShapeSVG({ shape: "triangle", base: 6, height: 4 }),
  parallelogram: svg.makeGeometryShapeSVG({ shape: "parallelogram", base: 8, height: 3 }),
  rectangle: svg.makeGeometryShapeSVG({ shape: "rectangle", base: 5, height: 5 }),
  net: svg.makeGeometryShapeSVG({ shape: "net", base: 4, height: 3 }),
};

for (const [name, markup] of Object.entries(samples)) {
  const doc = new JSDOM(markup, { contentType: "image/svg+xml" }).window.document;
  const el = doc.documentElement;
  assert.equal(el.localName, "svg", `${name}: root`);
  assert.ok(
    Number(el.getAttribute("width")) > 0 && Number(el.getAttribute("height")) > 0,
    `${name}: explicit size`,
  );
  assert.ok(el.getAttribute("viewBox"), `${name}: viewBox`);
  assert.match(el.getAttribute("style") || "", /background:white/, `${name}: white background`);
  assert.match(el.getAttribute("style") || "", /max-width:100%/, `${name}: responsive`);
  assert.ok(el.querySelector("title")?.textContent, `${name}: <title>`);
  assert.doesNotMatch(markup, /https?:\/\/(?!www\.w3\.org)/, `${name}: no external URLs`);
  assert.doesNotMatch(markup, /NaN|undefined|Infinity/, `${name}: no NaN/undefined`);
  assert.doesNotMatch(
    markup,
    /<(?:text)[^>]*>[^<]*(?<![\d\s])-\d/,
    `${name}: ASCII hyphen as minus`,
  );
}

// Typography: negative tick labels use U+2212.
assert.ok(samples.numberLine.includes("−5"), "number line prints −5");
assert.ok(samples.plane.includes("−3"), "plane prints −3");
// Open vs closed dots differ.
assert.ok(
  samples.numberLine.includes('fill="white"') && samples.numberLine.includes('fill="#1d4ed8"'),
);
// A tilted balance moves the beam; a level one is symmetric.
assert.notEqual(samples.balanceLevel, samples.balanceTilt);

// Text is escaped, not injected.
const evil = svg.makeTapeDiagramSVG({ parts: 2, totalLabel: '<script>alert(1)</script>"' });
assert.doesNotMatch(evil, /<script/);

// Bad input fails loudly.
// The module runs in a vm realm, so `instanceof RangeError` would be false.
for (const bad of [
  () => svg.makeNumberLineSVG({ min: 5, max: 5 }),
  () => svg.makeNumberLineSVG({ min: 0, max: NaN }),
  () => svg.makeTapeDiagramSVG({ parts: 0 }),
  () => svg.makeTapeDiagramSVG({ parts: 3, shaded: 4 }),
  () => svg.makeCoordinatePlaneSVG({ range: 99 }),
  () => svg.makeCoordinatePlaneSVG({ range: 3, points: [{ x: "a", y: 1 }] }),
  () => svg.makeGeometryShapeSVG({ shape: "hexagon" }),
  () => svg.makeGeometryShapeSVG({ shape: "triangle", base: -1 }),
  () => svg.makePlaceValueTableSVG({ digitsLeft: ["1"], digitsRight: ["2"], heads: ["only-one"] }),
])
  assert.throws(bad, (e) => e.name === "RangeError");

console.log(
  `ewl-math-svg: ${Object.keys(samples).length} figures well-formed, 9 bad inputs rejected`,
);
