// A bar chart must be able to draw a bar below zero.
//
// The renderer pinned its baseline to the bottom of the plot and sized bars as
// (value / max) * plotHeight, so a negative value produced a negative `height`.
// SVG rejects that outright — "attribute height: A negative value is not
// valid" — and the browser drops the rect, so the bar was simply absent. The
// lessons that hit it are the two that are ABOUT negative numbers: 9-2
// "Integers and Absolute Value" and 9-3 "Compare and Order Integers" both open
// on a sea-level chart, and their Notice & Wonder prompts ("I notice the bar
// for ___ goes below zero") pointed at bars that had never rendered.
//
// The other half of the contract is that all-positive charts — nearly every
// other chart on the site — keep their exact previous geometry.

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
globalThis.window = dom.window;

const { barChartSVG } = await import("./visual-figures.js");

const rectsOf = (svg) =>
  [...svg.matchAll(/<rect[^>]*\sy="([-\d.]+)"[^>]*\sheight="([-\d.]+)"/g)].map((m) => ({
    y: Number(m[1]),
    h: Number(m[2]),
  }));
const zeroLineY = (svg) => Number(svg.match(/<line [^>]*y1="([-\d.]+)"/)[1]);
const viewBoxH = (svg) => Number(svg.match(/viewBox="0 0 \d+ (\d+)"/)[1]);

test("a below-zero bar renders instead of being dropped by SVG", () => {
  // The shape of lesson 9-2's opening chart: metres from sea level.
  const svg = barChartSVG({
    bars: [
      { label: "Buried Chest", value: -4 },
      { label: "Lookout Tower", value: 6 },
      { label: "Deep Wreck", value: -14 },
      { label: "Peak", value: 9 },
    ],
  });
  const rects = rectsOf(svg);
  assert.equal(rects.length, 4, "every bar is drawn");
  for (const r of rects) {
    assert.ok(r.h >= 0, `height must never be negative, got ${r.h}`);
  }
  // Every bar has real extent — a zero-height rect is just as invisible.
  for (const r of rects) assert.ok(r.h > 0, "each bar has visible height");
});

test("negative bars hang below the zero line, positive ones rise above it", () => {
  const svg = barChartSVG({
    bars: [
      { label: "down", value: -10 },
      { label: "up", value: 10 },
    ],
  });
  const [down, up] = rectsOf(svg);
  const zero = zeroLineY(svg);
  // SVG y grows downward.
  assert.ok(down.y >= zero - 0.05, "a negative bar starts at the zero line");
  assert.ok(up.y + up.h <= zero + 0.05, "a positive bar ends at the zero line");
});

test("the zero line moves inside the plot only when data goes negative", () => {
  const positive = barChartSVG({ bars: [{ label: "a", value: 5 }] });
  const mixed = barChartSVG({ bars: [{ label: "a", value: 5 }, { label: "b", value: -5 }] });
  assert.equal(zeroLineY(positive), 210, "all-positive keeps the baseline on the bottom");
  assert.ok(zeroLineY(mixed) < 210, "mixed data lifts the zero line into the plot");
});

test("all-positive charts keep their previous geometry exactly", () => {
  // These numbers come from the pre-fix renderer: H=260, baseline y=210,
  // plotH=186, so a bar of 3 against a max of 7 is 79.7 tall at y=130.3.
  const svg = barChartSVG({
    bars: [
      { label: "A", value: 3 },
      { label: "B", value: 7 },
      { label: "C", value: 5 },
    ],
  });
  assert.equal(viewBoxH(svg), 260, "canvas height unchanged");
  assert.deepEqual(rectsOf(svg), [
    { y: 130.3, h: 79.7 },
    { y: 24, h: 186 },
    { y: 77.1, h: 132.9 },
  ]);
});

test("an all-zero chart does not divide by zero", () => {
  const svg = barChartSVG({ bars: [{ label: "a", value: 0 }, { label: "b", value: 0 }] });
  for (const r of rectsOf(svg)) {
    assert.ok(Number.isFinite(r.y) && Number.isFinite(r.h), "no NaN geometry");
    assert.ok(r.h >= 0, "no negative height");
  }
});
