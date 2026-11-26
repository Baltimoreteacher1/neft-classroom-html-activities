// Studio X diagrams, part 2: data charts, timeline, food web, tape diagram, and embedding in an activity.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import {
  barChartSvg,
  DiagramError,
  diagramAsBlock,
  dotPlotSvg,
  foodWebSvg,
  fractionModelSvg,
  histogramSvg,
  tapeDiagramSvg,
  timelineSvg,
} from "../access-practice-lab/src/studio/x/diagrams.js";
import { all, near, num, throwsCode } from "./studio-x-diagrams-helpers.mjs";

describe("dotPlotSvg and histogramSvg", () => {
  const data = [5, 6, 6, 7, 7, 7, 8, 8, 9, 10, 10];
  test("dot plot: one dot per value, stacked by equal value, on an integer axis", () => {
    const r = dotPlotSvg({ values: data });
    assert.equal(all(r.svg, "circle[data-value]").length, data.length);
    assert.deepEqual(
      r.data.counts,
      [
        [5, 1],
        [6, 2],
        [7, 3],
        [8, 2],
        [9, 1],
        [10, 2],
      ].map(([value, count]) => ({ value, count })),
    );
    assert.deepEqual(r.data.axis.ticks, [5, 6, 7, 8, 9, 10]);
    assert.equal(r.data.median, 7);
    assert.equal(r.data.min, 5);
    const xs = (v) =>
      new Set(all(r.svg, `circle[data-value="${v}"]`).map((c) => c.getAttribute("cx"))).size;
    assert.equal(xs(7), 1);
    const x5 = num(all(r.svg, 'circle[data-value="5"]')[0], "cx");
    const x10 = num(all(r.svg, 'circle[data-value="10"]')[0], "cx");
    const x7 = num(all(r.svg, 'circle[data-value="7"]')[0], "cx");
    near((x7 - x5) / (x10 - x5), 2 / 5, 0.01); // positions are to scale
  });
  test("dot plot refuses what it cannot draw", () => {
    throwsCode(() => dotPlotSvg({ values: Array.from({ length: 61 }, (_, i) => i) }), "too-many");
    throwsCode(() => dotPlotSvg({ values: Array.from({ length: 31 }, () => 3) }), "too-many-equal");
    throwsCode(() => dotPlotSvg({ values: [1, 1.001, 50] }), "too-dense");
    throwsCode(() => dotPlotSvg({ values: [] }), "too-few");
    throwsCode(() => dotPlotSvg({ values: [1, "x"] }), "not-a-number");
    assert.equal(dotPlotSvg({ values: [4, 4] }).data.axis.ticks.length, 3); // all equal: scale is value +/- 1
  });
  test("histogram: bin counts add up, bins are [from, to) and the last includes its edge", () => {
    const v = [0, 4, 5, 9, 10, 10, 14, 15, 20];
    const r = histogramSvg({ values: v, binWidth: 5 });
    assert.deepEqual(
      r.data.bins.map((b) => [b.from, b.to, b.count]),
      [
        [0, 5, 2],
        [5, 10, 2],
        [10, 15, 3],
        [15, 20, 2],
      ],
    );
    // 20 is the maximum: it belongs to the last bin because the last bin is closed
    assert.equal(
      r.data.counts.reduce((a, b) => a + b, 0),
      v.length,
    );
    assert.equal(all(r.svg, "rect[data-count]").length, 4);
    const heights = all(r.svg, "rect[data-count]").map((b) => num(b, "height"));
    near(heights[2] / heights[0], 3 / 2, 0.02);
    assert.equal(r.data.axis.yMax >= 3, true);
  });
  test("histogram: automatic bins come from the data and never lose a value", () => {
    const v = Array.from({ length: 60 }, (_, i) => 100 + ((i * 37) % 83));
    const r = histogramSvg({ values: v });
    assert.equal(
      r.data.counts.reduce((a, b) => a + b, 0),
      60,
    );
    assert.ok(r.data.bins[0].from <= Math.min(...v) && r.data.bins.at(-1).to >= Math.max(...v));
    assert.ok(r.data.bins.length >= 3 && r.data.bins.length <= 12);
    const dec = histogramSvg({ values: [0.1, 0.15, 0.3, 0.45, 0.5, 0.92] });
    assert.equal(
      dec.data.counts.reduce((a, b) => a + b, 0),
      6,
    );
  });
  test("histogram caps", () => {
    throwsCode(() => histogramSvg({ values: [0, 1000], binWidth: 1 }), "too-many-bins");
    throwsCode(
      () => histogramSvg({ values: Array.from({ length: 501 }, (_, i) => i) }),
      "too-many",
    );
    throwsCode(() => histogramSvg({ values: [1, 2], binWidth: 0 }), "out-of-range");
    assert.equal(
      histogramSvg({ values: Array.from({ length: 500 }, (_, i) => i % 97) }).data.n,
      500,
    );
  });
});

describe("timelineSvg", () => {
  const events = [
    { year: 1492, label: "Columbus reaches the Caribbean" },
    { year: 1607, label: "Jamestown founded" },
    { year: 1620, label: "Mayflower lands at Plymouth" },
    { year: 1776, label: "Declaration of Independence signed" },
    { year: 1787, label: "Constitution written" },
    { year: 1789, label: "Constitution takes effect" },
    { year: 1803, label: "Louisiana Purchase" },
    { year: 1861, label: "Civil War begins" },
  ];
  const overlap = (a, b) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  test("horizontal spacing is proportional to the years", () => {
    const r = timelineSvg({ events });
    const ev = r.data.events;
    const k = (ev[1].x - ev[0].x) / (ev[1].year - ev[0].year);
    for (const e of ev)
      near(
        (e.x - ev[0].x) / (e.year - ev[0].year || 1),
        e.year === ev[0].year ? e.x - ev[0].x : k,
        1e-6,
      );
    for (const e of ev.slice(1))
      near(e.x - ev[0].x, (e.year - ev[0].year) * r.data.axis.pxPerYear, 1e-6);
    // the drawn markers are where the data says
    const dots = all(r.svg, "circle")
      .map((c) => num(c, "cx"))
      .sort((a, b) => a - b);
    dots.forEach((x, i) => near(x, ev[i].x, 0.06));
  });
  test("no two labels overlap, no label leaves the figure, no leader line crosses a label", () => {
    const r = timelineSvg({ events });
    const W = 960;
    const boxes = r.data.events.map((e) => e.box);
    boxes.forEach((a, i) => {
      assert.ok(a.x >= 0 && a.x + a.w <= W && a.y >= 0, `box ${i} inside`);
      boxes.forEach((b, j) => j > i && assert.ok(!overlap(a, b), `labels ${i} and ${j} overlap`));
    });
    const axisY = r.data.axis.y;
    for (const e of r.data.events) {
      const lead = {
        x: e.x - 1,
        w: 2,
        y: Math.min(axisY, e.box.y < axisY ? e.box.y + e.box.h : axisY),
        h: Math.abs((e.box.y < axisY ? e.box.y + e.box.h : e.box.y) - axisY),
      };
      boxes.forEach(
        (b) => b !== e.box && assert.ok(!overlap(lead, b), "leader crosses another label"),
      );
      assert.ok(e.x >= e.box.x && e.x <= e.box.x + e.box.w, "leader meets its own label");
    }
    assert.ok(
      new Set(r.data.events.map((e) => Math.sign(e.level))).size === 2,
      "labels use both sides",
    );
  });
  test("many events with close years either stagger without overlap or fail clearly", () => {
    const dense = Array.from({ length: 12 }, (_, i) => ({
      year: 1900 + i * 2,
      label: `Event number ${i + 1}`,
    }));
    const r = timelineSvg({ events: dense });
    const boxes = r.data.events.map((e) => e.box);
    boxes.forEach((a, i) => boxes.forEach((b, j) => j > i && assert.ok(!overlap(a, b))));
    const crowded = Array.from({ length: 24 }, (_, i) => ({
      year: 2000 + (i % 2),
      label: `A fairly long event label number ${i + 1}`,
    }));
    assert.throws(
      () => timelineSvg({ events: crowded }),
      (e) => e instanceof DiagramError && e.code === "timeline-crowded",
    );
  });
  test("BCE years, ties and caps", () => {
    const r = timelineSvg({
      events: [
        { year: -500, label: "Classical Greece" },
        { year: 476, label: "Rome falls" },
      ],
    });
    assert.ok(r.svg.includes("500 BCE"));
    assert.ok(
      timelineSvg({
        events: [
          { year: -500, label: "a" },
          { year: 476, label: "b" },
        ],
        lang: "es",
      }).svg.includes("500 a. C."),
    );
    const tie = timelineSvg({
      events: [
        { year: 1900, label: "one" },
        { year: 1900, label: "two" },
        { year: 1950, label: "three" },
      ],
    });
    assert.equal(tie.data.events[0].x, tie.data.events[1].x);
    assert.notDeepEqual(tie.data.events[0].box, tie.data.events[1].box);
    const many = (n) =>
      Array.from({ length: n }, (_, i) => ({ year: 1000 + i * 100, label: `e${i}` }));
    assert.equal(timelineSvg({ events: many(24) }).data.events.length, 24);
    throwsCode(() => timelineSvg({ events: many(25) }), "too-many");
    throwsCode(
      () =>
        timelineSvg({
          events: [
            { year: 5, label: "a" },
            { year: 5, label: "b" },
          ],
        }),
      "one-year",
    );
    throwsCode(() => timelineSvg({ events: [{ year: 5, label: "a" }] }), "too-few");
    throwsCode(
      () =>
        timelineSvg({
          events: [
            { year: 1.5, label: "a" },
            { year: 7, label: "b" },
          ],
        }),
      "not-an-integer",
    );
    throwsCode(
      () =>
        timelineSvg({
          events: [
            { year: 1, label: "" },
            { year: 7, label: "b" },
          ],
        }),
      "empty-text",
    );
  });
});

describe("foodWebSvg", () => {
  const rel = [
    ["rabbit", "grass"],
    ["mouse", "grass"],
    ["fox", "rabbit"],
    ["fox", "mouse"],
    ["hawk", "mouse"],
    ["owl", "fox"],
  ].map(([eats, eaten]) => ({ eats, eaten }));
  test("layers come from the graph: producers are layer 1, each eater sits above its highest food", () => {
    const r = foodWebSvg({ relationships: rel });
    const layer = Object.fromEntries(r.data.nodes.map((n) => [n.name, n.layer]));
    assert.deepEqual(layer, { rabbit: 2, grass: 1, mouse: 2, fox: 3, hawk: 3, owl: 4 });
    assert.deepEqual(
      r.data.layers.map((l) => [...l].sort()),
      [["grass"], ["mouse", "rabbit"], ["fox", "hawk"], ["owl"]],
    );
    assert.deepEqual(r.data.producers, ["grass"]);
    assert.deepEqual([...r.data.topConsumers].sort(), ["hawk", "owl"]);
    const y = (n) => r.data.nodes.find((x) => x.name === n).y;
    assert.ok(y("grass") > y("rabbit") && y("rabbit") > y("fox") && y("fox") > y("owl"));
    assert.equal(y("rabbit"), y("mouse"));
  });
  test("an omnivore sits above its highest food, not its lowest", () => {
    const r = foodWebSvg({
      relationships: [
        { eats: "bear", eaten: "berries" },
        { eats: "bear", eaten: "salmon" },
        { eats: "salmon", eaten: "algae" },
      ],
    });
    assert.equal(r.data.nodes.find((n) => n.name === "bear").layer, 3);
  });
  test("arrows point from the eaten organism to the eater, and every relationship is drawn once", () => {
    const r = foodWebSvg({ relationships: [...rel, { eats: "Fox", eaten: "Rabbit" }] }); // same pair, different case
    assert.equal(r.data.duplicatesIgnored, 1);
    const arrows = all(r.svg, "path[data-eaten]");
    assert.equal(arrows.length, rel.length);
    assert.deepEqual(
      r.data.edges.map((e) => `${e.eaten}>${e.eater}`).sort(),
      rel.map((x) => `${x.eaten}>${x.eats}`).sort(),
    );
    const node = (n) => all(r.svg, `rect[data-node="${n}"]`)[0];
    for (const a of arrows) {
      assert.match(a.getAttribute("marker-end"), /^url\(#fw-arrow\)$/);
      const [x1, y1] = a
        .getAttribute("d")
        .match(/-?[\d.]+/g)
        .map(Number); // path starts at the eaten node
      const eaten = node(a.getAttribute("data-eaten"));
      near(y1, num(eaten, "y"), 0.1);
      assert.ok(x1 >= num(eaten, "x") && x1 <= num(eaten, "x") + num(eaten, "width"));
      assert.ok(num(node(a.getAttribute("data-eater")), "y") < y1, "the eater is drawn above");
    }
  });
  test("nodes in a layer never overlap", () => {
    const r = foodWebSvg({ relationships: rel });
    for (const a of r.data.nodes)
      for (const b of r.data.nodes)
        if (a !== b && a.layer === b.layer) assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x);
  });
  test("a cycle is refused and reported by name", () => {
    assert.throws(
      () =>
        foodWebSvg({
          relationships: [
            { eats: "a", eaten: "b" },
            { eats: "b", eaten: "c" },
            { eats: "c", eaten: "a" },
          ],
        }),
      (e) =>
        e instanceof DiagramError &&
        e.code === "cycle" &&
        e.cycle.length === 4 &&
        e.cycle[0] === e.cycle.at(-1) &&
        /a eats|b eats|c eats/.test(e.message),
    );
    throwsCode(() => foodWebSvg({ relationships: [{ eats: "worm", eaten: "Worm" }] }), "cycle");
  });
  test("caps and validation", () => {
    const chain = (n) =>
      Array.from({ length: n }, (_, i) => ({ eats: `o${i + 1}`, eaten: `o${i}` }));
    assert.equal(foodWebSvg({ relationships: chain(23) }).data.nodes.length, 24);
    throwsCode(() => foodWebSvg({ relationships: chain(24) }), "too-many");
    throwsCode(
      () =>
        foodWebSvg({
          relationships: Array.from({ length: 61 }, () => ({ eats: "a", eaten: "b" })),
        }),
      "too-many",
    );
    throwsCode(() => foodWebSvg({ relationships: [] }), "too-few");
    throwsCode(() => foodWebSvg({ relationships: [{ eats: "a" }] }), "empty-text");
  });
});

describe("tapeDiagramSvg", () => {
  test("part widths are proportional to their values and fill the bar", () => {
    const r = tapeDiagramSvg({ parts: [3, 5, 12] });
    const w = all(r.svg, "rect[data-part]").map((e) => num(e, "width"));
    near(w[0] / w[1], 3 / 5, 0.01);
    near(w[2] / w[0], 4, 0.01);
    near(
      w.reduce((a, b) => a + b, 0),
      r.data.barWidth,
      0.1,
    );
    assert.equal(r.data.total, "20");
  });
  test("the unknown part is solved exactly from the total", () => {
    const r = tapeDiagramSvg({
      parts: [
        { label: "Known", value: "1/3" },
        { label: "Rest", value: null },
      ],
      total: 1,
    });
    assert.equal(r.data.parts[1].unknown, true);
    assert.equal(r.data.parts[1].value, "2/3");
    near(r.data.parts[1].width / r.data.parts[0].width, 2, 0.01);
    assert.ok(r.svg.includes(">?</text>"));
  });
  test("refuses inconsistent or undrawable input", () => {
    throwsCode(() => tapeDiagramSvg({ parts: [3, 4], total: 10 }), "total-mismatch");
    throwsCode(() => tapeDiagramSvg({ parts: [3, null] }), "total-required");
    throwsCode(() => tapeDiagramSvg({ parts: [3, null], total: 3 }), "total-too-small");
    throwsCode(() => tapeDiagramSvg({ parts: [null, null], total: 3 }), "too-many-unknowns");
    throwsCode(() => tapeDiagramSvg({ parts: [3, 0] }), "bad-part");
    throwsCode(() => tapeDiagramSvg({ parts: [1, 1000] }), "too-uneven");
    throwsCode(() => tapeDiagramSvg({ parts: Array.from({ length: 13 }, () => 1) }), "too-many");
    assert.equal(
      tapeDiagramSvg({ parts: Array.from({ length: 12 }, () => 1) }).data.parts.length,
      12,
    );
  });
});

describe("diagramAsBlock: what the activity schema can carry", () => {
  const PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const wrap = (blocks) =>
    normalizeActivity({
      id: "diag",
      title: "Diagram",
      kind: "worksheet",
      context: { grade: "6", subject: "Math" },
      blocks: [
        ...blocks,
        { type: "question", format: "number", prompt: "What fraction is shaded?", answer: "3/4" },
      ],
    });
  test("inline SVG is not carried: the data: SVG is refused by the schema, and the helper says so", () => {
    const r = fractionModelSvg({ numerator: 3, denominator: 4 });
    const svgUrl = `data:image/svg+xml;base64,${Buffer.from(r.svg).toString("base64")}`;
    const out = diagramAsBlock(r, { src: svgUrl });
    assert.ok(!out.blocks.some((b) => b.type === "image"));
    assert.ok(out.review.length === 1 && out.review[0].en && out.review[0].es);
    const a = wrap([{ type: "image", src: svgUrl, alt: "x" }]);
    assert.equal(a.blocks[0].src, ""); // normalizeActivity drops it
    assert.equal(validateActivity(a).ok, false);
  });
  test("with a raster src or a same-site .svg path the image block passes normalize and validate", () => {
    for (const src of [PNG, "/studio/diagrams/fraction.svg"]) {
      const r = fractionModelSvg({ numerator: 3, denominator: 4, lang: "es" });
      const out = diagramAsBlock(r, { src, lang: "es" });
      assert.deepEqual(out.review, []);
      assert.equal(out.blocks[0].alt, r.alt.es);
      const a = wrap(out.blocks);
      assert.equal(a.blocks[0].src, src);
      assert.equal(a.blocks[0].alt, r.alt.es);
      assert.equal(validateActivity(a).ok, true, JSON.stringify(validateActivity(a).errors));
    }
  });
  test("without a src the same facts still travel as a table block, and a review note explains", () => {
    const r = barChartSvg({ title: "Pets", categories: [{ label: "Dogs", value: 4 }] });
    const out = diagramAsBlock(r);
    assert.equal(out.blocks.length, 1);
    assert.equal(out.blocks[0].type, "table");
    assert.equal(out.review.length, 1);
    assert.equal(out.svg, r.svg);
    const a = wrap(out.blocks);
    assert.equal(a.blocks[0].rows[0][0], "Dogs");
    assert.equal(validateActivity(a).ok, true);
  });
  test("a table longer than the schema allows is not silently truncated", () => {
    const r = barChartSvg({
      title: "Many",
      categories: Array.from({ length: 30 }, (_, i) => ({ label: `c${i}`, value: i })),
    });
    const out = diagramAsBlock(r, { src: PNG });
    assert.deepEqual(
      out.blocks.map((b) => b.type),
      ["image"],
    );
    assert.ok(out.review.some((x) => /20 rows/.test(x.en)));
    assert.throws(() => diagramAsBlock({}), TypeError);
  });
});
