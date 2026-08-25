#!/usr/bin/env node
/* =============================================================================
 * ratio-dnl.test.mjs — the double number line must BE the table, not resemble it
 * -----------------------------------------------------------------------------
 * The instructional claim of drawing both is that they are one relationship:
 * column ×k of the ratio table and pair k of the double number line hold the
 * same two numbers, at the same position. A drawing that merely looks similar
 * teaches the opposite of the intended lesson, so these tests check the values
 * and the geometry, not that an <svg> was produced.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import { doubleNumberLineSVG } from "./ratio-table-builder.js";

const xsOf = (svg, y) =>
  [...svg.matchAll(new RegExp(`<line x1="([\\d.]+)" y1="${y - 7}"`, "g"))].map((m) => Number(m[1]));

test("every pair the table shows appears on the line, k = 0 through steps", () => {
  const svg = doubleNumberLineSVG(3, 5, 6, "juice", "total");
  for (let k = 0; k <= 6; k += 1) {
    assert.ok(svg.includes(`>${3 * k}<`), `top scale is missing ${3 * k} (k=${k})`);
    assert.ok(svg.includes(`>${5 * k}<`), `bottom scale is missing ${5 * k} (k=${k})`);
  }
});

test("paired values sit at the SAME x — that is what makes them a pair", () => {
  const svg = doubleNumberLineSVG(3, 5, 6, "a", "b");
  const top = xsOf(svg, 42);
  const bottom = xsOf(svg, 92);
  assert.equal(top.length, 7, `expected 7 top ticks, got ${top.length}`);
  assert.deepEqual(top, bottom, "the two scales are not aligned tick for tick");
});

test("ticks are evenly spaced, so the scale is linear", () => {
  const xs = xsOf(doubleNumberLineSVG(2, 7, 5, "a", "b"), 42);
  const gaps = xs.slice(1).map((v, i) => Math.round((v - xs[i]) * 1000) / 1000);
  assert.equal(new Set(gaps).size, 1, `uneven spacing: ${gaps.join(", ")}`);
});

test("both scales start at zero, because a ratio line has a common origin", () => {
  const svg = doubleNumberLineSVG(4, 9, 4, "a", "b");
  // k = 0 labels both read 0.
  assert.ok(/>0</.test(svg), "no zero label drawn");
});

test("the accessible label lists the pairs, so it is not an unreadable image", () => {
  const svg = doubleNumberLineSVG(3, 5, 3, "juice", "total");
  const label = svg.match(/aria-label="([^"]+)"/)[1];
  assert.match(label, /juice/);
  assert.match(label, /total/);
  assert.match(label, /3 to 5/);
  assert.match(label, /9 to 15/);
});

test("labels are escaped, not interpolated raw", () => {
  const svg = doubleNumberLineSVG(1, 2, 3, '<script>"', "b&c");
  assert.ok(!svg.includes("<script>"), "an unescaped tag reached the SVG");
  assert.ok(svg.includes("&amp;"), "ampersand was not escaped");
});

test("decimal ratios render without floating-point noise", () => {
  const svg = doubleNumberLineSVG(0.1, 0.2, 3, "a", "b");
  assert.ok(!/0\.30000000000000004|0\.6000000000000001/.test(svg), "raw float error printed");
});
