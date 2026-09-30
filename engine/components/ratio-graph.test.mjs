#!/usr/bin/env node
/* =============================================================================
 * ratio-graph.test.mjs — verify ratio coordinate graphing functionality
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import { ratioGraphSVG } from "./ratio-table-builder.js";

test("ratio graph draws origin (0, 0)", () => {
  const svg = ratioGraphSVG(2, 5, 4, "x", "y");
  assert.ok(svg.includes("(0, 0)"), "SVG missing origin (0, 0)");
});

test("every column in the ratio table appears as a plotted point on the graph", () => {
  const svg = ratioGraphSVG(1, 4, 6, "bags", "balls");
  for (let k = 1; k <= 6; k++) {
    assert.ok(svg.includes(`(${k}, ${k * 4})`), `missing point (${k}, ${k * 4})`);
  }
});

test("all coordinates and tick marks on the graph are strictly positive", () => {
  const svg = ratioGraphSVG(3, 7, 5, "a", "b");
  assert.ok(!svg.includes(">-1<"), "contains negative tick -1");
  assert.ok(!svg.includes(">-2<"), "contains negative tick -2");
  assert.ok(!svg.includes(">-5<"), "contains negative tick -5");
  assert.ok(!svg.includes("(-"), "contains negative coordinate");
});

test("the graph includes the proportional line through the origin", () => {
  const svg = ratioGraphSVG(2, 3, 4, "hours", "miles");
  assert.ok(svg.includes('stroke="#0d7a76"'), "missing teal proportional line");
  assert.ok(svg.includes('class="rtlab-graph"'), "missing rtlab-graph class");
});

test("the accessible label lists the ordered pairs and states linear origin property", () => {
  const svg = ratioGraphSVG(1, 4, 3, "sundaes", "sauce");
  assert.ok(svg.includes("sundaes"), "missing labelA in SVG");
  assert.ok(svg.includes("sauce"), "missing labelB in SVG");
  assert.ok(svg.includes("(1, 4)"), "missing pair (1, 4)");
  assert.ok(svg.includes("(2, 8)"), "missing pair (2, 8)");
  assert.ok(svg.includes("origin (0, 0)"), "missing origin description");
});

test("unit rate badge appears when a = 1", () => {
  const svg = ratioGraphSVG(1, 6, 4, "x", "y");
  assert.ok(svg.includes("UNIT RATE"), "unit rate badge missing for unit ratio");
});
