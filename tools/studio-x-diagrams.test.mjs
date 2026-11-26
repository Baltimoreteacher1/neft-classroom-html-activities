// Studio X procedural diagrams: valid standalone SVG, accessibility, escaping, caps, and the geometry/data of each
// diagram (the picture must say what the data says).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { JSDOM } from "jsdom";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { COLOR, LIGHT } from "../access-practice-lab/src/studio/x/diagram-kit.js";
import {
  barChartSvg,
  contrastRatio,
  coordinatePlaneSvg,
  DiagramError,
  diagramAsBlock,
  dotPlotSvg,
  foodWebSvg,
  fractionModelSvg,
  histogramSvg,
  prismSvg,
  tapeDiagramSvg,
  timelineSvg,
} from "../access-practice-lab/src/studio/x/diagrams.js";

import { all, BAD, doc, near, num, throwsCode } from "./studio-x-diagrams-helpers.mjs";

const samples = () => ({
  fraction: fractionModelSvg({ numerator: 3, denominator: 4 }),
  circle: fractionModelSvg({ numerator: 5, denominator: 3, style: "circle", lang: "es" }),
  prism: prismSvg({ l: 8, w: 5, h: 3, unit: "cm" }),
  tape: tapeDiagramSvg({
    parts: [
      { label: "A", value: 12 },
      { label: "B", value: 8 },
      { label: "C", value: null },
    ],
    total: 30,
  }),
  plane: coordinatePlaneSvg({
    xRange: [-6, 6],
    yRange: [-4, 8],
    points: [
      { x: 2, y: 3, label: "A" },
      { x: -3, y: 5, label: "B" },
    ],
  }),
  bar: barChartSvg({
    title: "Pets",
    unit: "students",
    categories: [
      { label: "Dogs", value: 12 },
      { label: "Cats", value: 9 },
    ],
  }),
  dot: dotPlotSvg({ title: "Sizes", values: [5, 6, 6, 7, 7, 7, 9] }),
  hist: histogramSvg({ title: "Heights", values: [140, 142, 150, 153, 160, 171] }),
  timeline: timelineSvg({
    events: [
      { year: 1492, label: "Columbus" },
      { year: 1607, label: "Jamestown" },
      { year: 1776, label: "Independence" },
    ],
  }),
  web: foodWebSvg({
    relationships: [
      { eats: "rabbit", eaten: "grass" },
      { eats: "fox", eaten: "rabbit" },
    ],
  }),
});

describe("every diagram: standalone, accessible, safe", () => {
  for (const [name, r] of Object.entries(samples())) {
    test(`${name}: valid SVG with viewBox, role=img, title and desc`, () => {
      const d = doc(r.svg);
      const svg = d.documentElement;
      assert.equal(svg.localName, "svg");
      assert.match(svg.getAttribute("viewBox"), /^0 0 [\d.]+ [\d.]+$/);
      assert.equal(svg.getAttribute("role"), "img");
      const lang = svg.getAttribute("lang");
      assert.ok(d.querySelector("title").textContent.includes(r.alt[lang].slice(0, 20)));
      assert.ok(d.querySelector("desc").textContent.startsWith(r.alt[lang]));
      for (const id of svg.getAttribute("aria-labelledby").split(" "))
        assert.ok(d.getElementById(id), id);
    });
    test(`${name}: nothing active or external`, () => {
      assert.doesNotMatch(
        r.svg,
        /<script|foreignObject|<image|<a[ >]|<use|<style|<link|javascript:|\son\w+=|href=|xlink|@import|url\(\s*["']?(?!#)/i,
      );
      assert.deepEqual(
        [...r.svg.matchAll(/https?:\/\/[^"'\s<>)]+/g)].map((m) => m[0]),
        ["http://www.w3.org/2000/svg"],
      );
    });
    test(`${name}: bilingual alt and caption, short enough for the schema`, () => {
      for (const k of ["alt", "caption"]) {
        assert.ok(r[k].en.length > 2 && r[k].es.length > 2, k);
        assert.ok(r[k].en.length <= 300 && r[k].es.length <= 300, k);
      }
      assert.notEqual(r.alt.en, r.alt.es);
      assert.ok(r.table.headers.length && r.table.rows.length);
    });
    test(`${name}: colors pass 4.5:1 on white (or are tints under ink text)`, () => {
      const colors = new Set(
        [...r.svg.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/gi)].map((m) => m[1].toLowerCase()),
      );
      assert.ok(colors.size > 0);
      for (const c of colors) {
        if (c === "#ffffff") continue; // the page itself
        if (Object.values(LIGHT).includes(c))
          assert.ok(contrastRatio(COLOR.ink, c) >= 4.5, `ink on ${c}`);
        else assert.ok(contrastRatio(c, "#ffffff") >= 4.5, `${c} on white`);
      }
    });
    test(`${name}: deterministic`, () => {
      assert.equal(samples()[name].svg, r.svg);
    });
  }

  test("palette: every named color passes and the tints sit under ink", () => {
    for (const [k, c] of Object.entries(COLOR))
      if (k !== "white") assert.ok(contrastRatio(c, "#ffffff") >= 4.5, k);
    for (const c of Object.values(LIGHT)) assert.ok(contrastRatio(COLOR.ink, c) >= 4.5);
    assert.ok(contrastRatio("#999999", "#ffffff") < 4.5); // the checker can fail
  });

  test("text is escaped everywhere user text appears", () => {
    const hostile = [
      barChartSvg({ title: BAD, unit: BAD, categories: [{ label: BAD, value: 1 }] }),
      timelineSvg({
        events: [
          { year: 1, label: BAD },
          { year: 9, label: "x" },
        ],
      }),
      foodWebSvg({ relationships: [{ eats: BAD, eaten: "g" }] }),
      coordinatePlaneSvg({ xRange: [0, 5], yRange: [0, 5], points: [{ x: 1, y: 1, label: BAD }] }),
      tapeDiagramSvg({
        parts: [
          { label: BAD, value: 1 },
          { label: "b", value: 1 },
        ],
      }),
    ];
    for (const r of hostile) {
      assert.doesNotMatch(r.svg, /<img/);
      assert.match(r.svg, /&lt;img onerror=x&gt;&amp;/);
      doc(r.svg); // still well-formed XML
    }
  });

  test("in grayscale the figure is not carried by color: shaded vs empty and parts differ by pattern", () => {
    const f = fractionModelSvg({ numerator: 1, denominator: 2 });
    const [on, off] = [all(f.svg, '[data-cell="shaded"]')[0], all(f.svg, '[data-cell="empty"]')[0]];
    assert.notEqual(on.getAttribute("fill"), off.getAttribute("fill"));
    assert.equal(off.getAttribute("fill"), "#ffffff");
    assert.match(on.getAttribute("fill"), /^url\(#fm-solid\)$/);
    const pattern = doc(f.svg).getElementById("fm-solid");
    assert.ok(pattern.querySelector("line"), "shaded pattern has a texture");
    const t = tapeDiagramSvg({ parts: [3, 4, 5, 6, 7, 8] });
    const fills = all(t.svg, "rect[data-part]").map((r) => r.getAttribute("fill"));
    assert.equal(new Set(fills).size, 6);
    const p = prismSvg({ l: 2, w: 2, h: 2 });
    const faces = Object.fromEntries(
      all(p.svg, "polygon[data-face]").map((x) => [
        x.getAttribute("data-face"),
        x.getAttribute("fill"),
      ]),
    );
    assert.equal(new Set(Object.values(faces)).size, 3); // faces differ in lightness
    assert.ok(all(p.svg, "line[stroke-dasharray]").length === 3, "hidden edges are dashed");
  });
});

describe("fractionModelSvg", () => {
  for (const style of ["bar", "circle"])
    for (const [n, d] of [
      [0, 4],
      [1, 1],
      [3, 4],
      [4, 4],
      [7, 5],
      [12, 3],
      [5, 16],
      [1, 12],
    ]) {
      test(`${style} ${n}/${d}: shaded cells equal the numerator, cells equal wholes x denominator`, () => {
        const r = fractionModelSvg({ numerator: n, denominator: d, style });
        assert.equal(all(r.svg, '[data-cell="shaded"]').length, n);
        const wholes = Math.max(1, Math.ceil(n / d));
        assert.equal(all(r.svg, "[data-cell]").length, wholes * d);
        assert.equal(r.data.shadedParts, n);
        assert.equal(r.data.totalParts, wholes * d);
        assert.equal(r.data.wholes, wholes);
        for (let k = 1; k <= wholes; k++) {
          const inWhole = all(r.svg, `[data-whole="${k}"]`);
          assert.equal(inWhole.length, d);
          assert.equal(
            inWhole.filter((e) => e.getAttribute("data-cell") === "shaded").length,
            Math.max(0, Math.min(d, n - (k - 1) * d)),
          );
        }
      });
    }
  test("bar cells have equal widths that fill the bar; improper fractions report a mixed number", () => {
    const r = fractionModelSvg({ numerator: 7, denominator: 5 });
    const widths = all(r.svg, "rect[data-cell]").map((e) => num(e, "width"));
    near(Math.max(...widths), Math.min(...widths), 0.01);
    near(
      widths.slice(0, 5).reduce((a, b) => a + b, 0),
      480,
    );
    assert.deepEqual(r.data.mixed, { whole: 1, numerator: 2, denominator: 5 });
    assert.equal(fractionModelSvg({ numerator: 1, denominator: 2 }).data.mixed, null);
  });
  test("refuses bad input", () => {
    throwsCode(() => fractionModelSvg({ numerator: 1, denominator: 0 }), "out-of-range");
    throwsCode(() => fractionModelSvg({ numerator: 1, denominator: 17 }), "out-of-range");
    throwsCode(() => fractionModelSvg({ numerator: 1.5, denominator: 4 }), "not-an-integer");
    throwsCode(() => fractionModelSvg({ numerator: -1, denominator: 4 }), "out-of-range");
    throwsCode(() => fractionModelSvg({ numerator: 17, denominator: 4 }), "out-of-range");
    throwsCode(() => fractionModelSvg({ numerator: 1, denominator: 4, style: "pie" }), "bad-style");
    throwsCode(() => fractionModelSvg({ numerator: "abc", denominator: 4 }), "not-a-number");
  });
});

describe("prismSvg", () => {
  const corners = (svg, face) =>
    all(svg, `polygon[data-face="${face}"]`)[0]
      .getAttribute("points")
      .split(" ")
      .map((p) => p.split(",").map(Number));
  for (const [l, w, h] of [
    [8, 5, 3],
    [3, 3, 3],
    [10, 2, 6],
    [1.5, 4, 2.5],
  ])
    test(`${l} x ${w} x ${h}: edges are proportional`, () => {
      const r = prismSvg({ l, w, h, unit: "cm" });
      const front = corners(r.svg, "front"); // fbl, fbr, ftr, ftl
      const sl = front[1][0] - front[0][0];
      const sh = front[0][1] - front[3][1];
      near(sl / sh, l / h, 0.01);
      const right = corners(r.svg, "right"); // fbr, bbr, btr, ftr
      const depth = Math.hypot(right[1][0] - right[0][0], right[1][1] - right[0][1]);
      near(depth / 0.5 / sl, w / l, 0.01); // cabinet projection: depth drawn at half scale
      near(
        Math.atan2(right[0][1] - right[1][1], right[1][0] - right[0][0]) * (180 / Math.PI),
        45,
        0.2,
      );
      assert.equal(r.data.projection.depthScale, 0.5);
      near(r.data.projection.screen.l / r.data.projection.screen.h, l / h, 1e-9);
      near(r.data.projection.screen.w / 0.5 / r.data.projection.screen.l, w / l, 1e-9);
    });
  test("dimensions are labeled and volume and surface area are exact", () => {
    const r = prismSvg({ l: 8, w: 5, h: 3, unit: "cm" });
    assert.deepEqual(
      all(r.svg, "text[data-edge]").map((t) => [t.getAttribute("data-edge"), t.textContent]),
      [
        ["l", "8 cm"],
        ["h", "3 cm"],
        ["w", "5 cm"],
      ],
    );
    assert.equal(r.data.volume.exact, "120");
    assert.equal(r.data.volume.unit, "cm³");
    assert.equal(r.data.surfaceArea.exact, String(2 * (40 + 24 + 15)));
    assert.equal(r.data.surfaceArea.unit, "cm²");
    const f = prismSvg({ l: "1/2", w: "3/2", h: 4 });
    assert.equal(f.data.volume.exact, "3");
    assert.equal(f.data.surfaceArea.exact, "17.5"); // 2(3/4 + 2 + 6)
    assert.equal(prismSvg({ l: 0.1, w: 0.2, h: 0.3 }).data.volume.exact, "0.006"); // no floating-point error
    assert.equal(prismSvg({ l: 2, w: 2, h: 2 }).data.volume.unit, "cubic units");
    assert.equal(prismSvg({ l: 2, w: 2, h: 2, lang: "es" }).data.volume.unit, "unidades cúbicas");
  });
  test("refuses bad input", () => {
    throwsCode(() => prismSvg({ l: 0, w: 1, h: 1 }), "bad-dimension");
    throwsCode(() => prismSvg({ l: -2, w: 1, h: 1 }), "bad-dimension");
    throwsCode(() => prismSvg({ l: "x", w: 1, h: 1 }), "bad-dimension");
    throwsCode(() => prismSvg({ l: 100, w: 1, h: 1 }), "too-uneven");
    throwsCode(() => prismSvg({ l: 1, w: 1, h: 1, unit: "<b>" }), "bad-unit");
    throwsCode(() => prismSvg({ l: 1, w: 1, h: 1, unit: "x".repeat(13) }), "text-too-long");
  });
});

describe("coordinatePlaneSvg", () => {
  const pts = [
    { x: 0, y: 0, label: "O" },
    { x: 4, y: 2, label: "A" },
    { x: -3, y: 5, label: "B" },
    { x: -2, y: -4 },
  ];
  test("points sit at x and y on equal-length units, with the axes through zero", () => {
    const r = coordinatePlaneSvg({ xRange: [-5, 5], yRange: [-5, 8], points: pts });
    const at = (i) => {
      const e = all(r.svg, `[data-point="${i}"]`)[0];
      return e.localName === "circle"
        ? [num(e, "cx"), num(e, "cy")]
        : [num(e, "x") + 5.5, num(e, "y") + 5.5];
    };
    const [o, a, b] = [at(1), at(2), at(3)];
    const u = r.data.unit;
    near(a[0] - o[0], 4 * u, 0.1);
    near(o[1] - a[1], 2 * u, 0.1);
    near(o[0] - b[0], 3 * u, 0.1);
    near(o[1] - b[1], 5 * u, 0.1);
    assert.deepEqual(
      r.data.points.map((p) => p.quadrant),
      ["axis", "I", "II", "III"],
    );
    const xAxis = all(r.svg, 'line[stroke-width="2.5"]')[0];
    near(num(xAxis, "y1"), o[1], 0.1); // the x axis passes through y = 0
  });
  test("unequal ranges still keep units square", () => {
    const r = coordinatePlaneSvg({
      xRange: [0, 20],
      yRange: [0, 4],
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 4 },
      ],
    });
    const [p0, p1] = all(r.svg, "[data-point]");
    const c = (e) =>
      e.localName === "circle"
        ? [num(e, "cx"), num(e, "cy")]
        : [num(e, "x") + 5.5, num(e, "y") + 5.5];
    near((c(p1)[0] - c(p0)[0]) / 20, (c(p0)[1] - c(p1)[1]) / 4, 0.1);
  });
  test("refuses points off the plane, too many points, bad ranges", () => {
    throwsCode(
      () => coordinatePlaneSvg({ xRange: [0, 5], yRange: [0, 5], points: [{ x: 6, y: 1 }] }),
      "point-off-plane",
    );
    throwsCode(
      () =>
        coordinatePlaneSvg({
          xRange: [0, 5],
          yRange: [0, 5],
          points: Array.from({ length: 61 }, () => ({ x: 1, y: 1 })),
        }),
      "too-many",
    );
    throwsCode(() => coordinatePlaneSvg({ xRange: [5, 5], yRange: [0, 5] }), "bad-range");
    throwsCode(() => coordinatePlaneSvg({ xRange: [0, 500], yRange: [0, 5] }), "range-too-wide");
    throwsCode(() => coordinatePlaneSvg({ xRange: [0], yRange: [0, 5] }), "bad-range");
    assert.equal(
      coordinatePlaneSvg({
        xRange: [0, 5],
        yRange: [0, 5],
        points: Array.from({ length: 60 }, (_, i) => ({ x: i % 5, y: 1 })),
      }).data.points.length,
      60,
    );
  });
});

describe("barChartSvg", () => {
  const cats = [
    { label: "Dogs", value: 12 },
    { label: "Cats", value: 9 },
    { label: "Fish", value: 3 },
    { label: "Birds", value: 0 },
  ];
  test("bar lengths are proportional to values on a scale derived from the data", () => {
    const r = barChartSvg({ title: "Pets", unit: "students", categories: cats });
    const bars = all(r.svg, "rect[data-value]");
    assert.equal(bars.length, 4);
    const k = num(bars[0], "width") / 12;
    for (const b of bars) near(num(b, "width"), Number(b.getAttribute("data-value")) * k, 0.06);
    assert.ok(r.data.axis.max >= 12 && r.data.axis.max < 24 && r.data.axis.min === 0);
    assert.deepEqual(r.data.axis.ticks, [0, 5, 10, 15]);
    near(r.data.categories[0].length, (12 / r.data.axis.max) * r.data.plot.width, 0.1);
    for (const c of cats) assert.ok(r.svg.includes(`>${c.value}</text>`), `value label ${c.value}`);
  });
  test("ticks come from the data: small, decimal and large values", () => {
    assert.deepEqual(
      barChartSvg({ title: "t", categories: [{ label: "a", value: 3 }] }).data.axis.ticks,
      [0, 1, 2, 3],
    );
    assert.deepEqual(
      barChartSvg({ title: "t", categories: [{ label: "a", value: 0.4 }] }).data.axis.ticks,
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].slice(0, 5),
    );
    assert.deepEqual(
      barChartSvg({ title: "t", categories: [{ label: "a", value: 1234 }] }).data.axis.ticks.at(
        -1,
      ) >= 1234,
      true,
    );
    const zero = barChartSvg({ title: "t", categories: [{ label: "a", value: 0 }] }).data.axis;
    assert.deepEqual([zero.min, zero.max], [0, 1]); // all zeros: the scale is 0 to 1, no bar is drawn
  });
  test("caps and validation", () => {
    const many = (n) => Array.from({ length: n }, (_, i) => ({ label: `c${i}`, value: i }));
    assert.equal(barChartSvg({ title: "t", categories: many(40) }).data.categories.length, 40);
    throwsCode(() => barChartSvg({ title: "t", categories: many(41) }), "too-many");
    throwsCode(() => barChartSvg({ title: "t", categories: [] }), "too-few");
    throwsCode(
      () => barChartSvg({ title: "t", categories: [{ label: "a", value: -1 }] }),
      "out-of-range",
    );
    throwsCode(
      () => barChartSvg({ title: "t", categories: [{ label: "a", value: "many" }] }),
      "not-a-number",
    );
    throwsCode(() => barChartSvg({ title: "", categories: many(2) }), "empty-text");
    throwsCode(() => barChartSvg({ title: "x".repeat(61), categories: many(2) }), "text-too-long");
    throwsCode(
      () => barChartSvg({ title: "t", categories: [{ label: "", value: 1 }] }),
      "empty-text",
    );
  });
});
