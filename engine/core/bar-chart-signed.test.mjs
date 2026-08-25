// A bar chart that plots below zero has to actually draw the bar.
//
// The bar figure pinned its baseline to the bottom of the plot and sized every
// bar as `(value / maxValue) * plotHeight`. That is fine for frequencies, but
// Unit 7 charts depths below sea level: 7-3 plots -4, 6, -7 and 7-4 plots
// -2, -7, -5, 3. A negative value produced `<rect height="-214.7">`, which is
// an invalid SVG attribute — the browser logged an error and drew NOTHING, so
// the bars whose captions ask "which marker sits deepest below the water?" and
// "what do you notice about the one bar that points up?" were the exact bars
// missing from the picture.
//
// These tests pin the geometry, not the pixels: every rect must have a
// non-negative height, positive and negative bars must sit on opposite sides
// of a shared zero line, and an all-positive chart must be scaled exactly the
// way it was before the fix (including the `, 1` floor, without which a chart
// of values below 1 would silently rescale).

import assert from "node:assert/strict";
import test from "node:test";

/* visual-figures.js escapes label text through a detached <div>. The geometry
   under test needs no real DOM, so a two-property stub is enough. */
globalThis.document = globalThis.document || {
  createElement: () => ({
    set textContent(v) {
      this.innerHTML = String(v ?? "").replace(
        /[&<>]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
      );
    },
    innerHTML: "",
  }),
};

const { barChartSVG } = await import("./visual-figures.js");

const rects = (svg) =>
  [...svg.matchAll(/<rect class="bar-rect"[^>]*y="([-\d.]+)"[^>]*height="([-\d.]+)"/g)].map(
    (m) => ({ y: Number(m[1]), h: Number(m[2]) }),
  );

const zeroLineY = (svg) => {
  const m = svg.match(/<line x1="\d+" y1="([\d.]+)"/);
  return m ? Number(m[1]) : null;
};

test("negative values never produce a negative rect height", () => {
  const svg = barChartSVG({
    bars: [
      { label: "Buried Chest", value: -4 },
      { label: "Lookout Tower", value: 6 },
      { label: "Deep Cave", value: -7 },
    ],
  });
  const rs = rects(svg);
  assert.equal(rs.length, 3, "every bar is drawn");
  for (const r of rs) assert.ok(r.h >= 0, `height must be non-negative, got ${r.h}`);
  for (const r of rs) assert.ok(r.h > 0, "a non-zero value must draw a visible bar");
});

test("every bar stays inside the plot area", () => {
  // This is what the old baseline-at-the-bottom scale actually broke: give it
  // -4, 6, -7 and the -7 bar runs 217px from a baseline 186px down a 186px
  // plot, straight off the bottom of the 260px figure. Clamping the rect to a
  // non-negative height alone does not fix that — the DOMAIN has to include 0.
  const svg = barChartSVG({
    bars: [
      { label: "a", value: -4 },
      { label: "b", value: 6 },
      { label: "c", value: -7 },
    ],
  });
  const padT = 24;
  const plotH = 260 - padT - 50;
  for (const r of rects(svg)) {
    assert.ok(r.y >= padT - 0.2, `bar starts below the top of the plot (y=${r.y})`);
    assert.ok(
      r.y + r.h <= padT + plotH + 0.2,
      `bar ends inside the plot (bottom=${r.y + r.h}, plot ends at ${padT + plotH})`,
    );
  }
});

test("positive and negative bars sit on opposite sides of the zero line", () => {
  const svg = barChartSVG({
    bars: [
      { label: "down", value: -4 },
      { label: "up", value: 6 },
    ],
  });
  const z = zeroLineY(svg);
  assert.ok(z != null, "the axis line is drawn");
  const [down, up] = rects(svg);
  // SVG y grows downward: the negative bar starts AT zero and extends below.
  assert.ok(Math.abs(down.y - z) < 0.2, "the negative bar starts at the zero line");
  assert.ok(Math.abs(up.y + up.h - z) < 0.2, "the positive bar ends at the zero line");
});

test("bar heights stay proportional to their values across the signed domain", () => {
  const svg = barChartSVG({
    bars: [
      { label: "a", value: -4 },
      { label: "b", value: 6 },
      { label: "c", value: -7 },
    ],
  });
  const [a, b, c] = rects(svg);
  // Domain spans -7..6, so heights are in the ratio 4 : 6 : 7.
  assert.ok(Math.abs(b.h / a.h - 6 / 4) < 0.02, "6 is 1.5x the height of 4");
  assert.ok(Math.abs(c.h / a.h - 7 / 4) < 0.02, "7 is 1.75x the height of 4");
});

test("a signed chart labels its zero line", () => {
  const svg = barChartSVG({ bars: [{ label: "x", value: -3 }] });
  assert.match(svg, />0</, "the zero line is labelled when the domain goes negative");
});

test("an all-positive chart is scaled exactly as it was before signed support", () => {
  // Regression guard for the `, 1` floor. Values below 1 must NOT stretch to
  // fill the plot; the tallest bar of a 0.4/0.8 chart is 80% of the height.
  const svg = barChartSVG({
    bars: [
      { label: "a", value: 0.4 },
      { label: "b", value: 0.8 },
    ],
  });
  const [a, b] = rects(svg);
  const plotH = 260 - 24 - 50;
  assert.ok(Math.abs(a.h - 0.4 * plotH) < 0.2, "0.4 scales against a max of 1, not 0.8");
  assert.ok(Math.abs(b.h - 0.8 * plotH) < 0.2, "0.8 scales against a max of 1, not 0.8");
  assert.ok(!/>0</.test(svg), "no zero label on an all-positive chart");
});
