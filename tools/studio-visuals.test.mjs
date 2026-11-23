// Studio visual kit: every spec kind renders, alt is required, text is escaped, colours are ds.css tokens.
// Run: node --test tools/studio-visuals.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { hasIcon, renderIcon } from "../bcpss-teachers/studio/core/icons.js";
import {
  listIcons,
  renderVisual,
  VISUAL_KINDS,
  VisualError,
  visualToPng,
} from "../bcpss-teachers/studio/core/visuals.js";

const flower = { kind: "icon", name: "flower", alt: "A pink flower" };
const SAMPLES = {
  shapes: {
    kind: "shapes",
    alt: "A blue square, a red circle and a label",
    items: [
      { t: "rect", x: 10, y: 10, w: 80, h: 60, fill: "sky", stroke: "navy", sw: 3, rx: 6 },
      { t: "circle", cx: 160, cy: 40, r: 30, fill: "coral" },
      { t: "ellipse", cx: 260, cy: 40, rx: 40, ry: 20, fill: "#336699" },
      { t: "line", x1: 10, y1: 100, x2: 200, y2: 100, stroke: "ink", dash: "6 4" },
      {
        t: "poly",
        points: [
          [10, 120],
          [60, 120],
          [35, 170],
        ],
        fill: "teal",
      },
      { t: "path", d: "M100 120 q30 -30 60 0", fill: "none", stroke: "navy" },
      { t: "text", x: 240, y: 150, text: "Label", size: 20 },
      { t: "icon", name: "cat", x: 300, y: 100, s: 60 },
    ],
  },
  icon: { kind: "icon", name: "sailboat", alt: "A sailboat on the water" },
  scene: {
    kind: "scene",
    bg: "field",
    alt: "A tree and a cow in a field",
    items: [
      { icon: "tree", x: 20, y: 40, s: 120, label: "tree" },
      { icon: "cow", x: 200, y: 150, s: 90, label: "cow" },
    ],
  },
  tape: {
    kind: "tape",
    alt: "A tape with parts 3 and 2",
    parts: [
      { label: "3", units: 3 },
      { label: "2", units: 2 },
      { label: "?", units: 1, unknown: true },
    ],
    total: "6",
  },
  numberline: {
    kind: "numberline",
    alt: "A number line from 0 to 3",
    min: 0,
    max: 3,
    step: 1,
    marks: [
      { at: 0, label: "0" },
      { at: 2.5, label: "2 1/2", style: "point" },
      { at: 3, style: "open" },
    ],
    arcs: [{ from: 0, to: 2, label: "+2" }],
  },
  coord: {
    kind: "coord",
    alt: "A line through the origin",
    xmax: 6,
    ymax: 24,
    xLabel: "Minutes",
    yLabel: "Gallons",
    points: [
      { x: 1, y: 4, label: "A" },
      { x: 2, y: 8 },
    ],
    lines: [{ m: 4, b: 0, label: "y = 4x" }],
  },
  table: {
    kind: "table",
    alt: "A ratio table",
    head: ["Cups", "Water"],
    rows: [
      [2, 1],
      [4, 2],
    ],
    highlight: [[1, 1]],
  },
  cycle: {
    kind: "cycle",
    alt: "A water cycle",
    stages: [
      { label: "Evaporation", icon: "drop" },
      { label: "Condensation", icon: "cloud" },
      { label: "Rain", icon: "rain" },
    ],
  },
  flow: {
    kind: "flow",
    alt: "Three steps",
    steps: [{ label: "Plan" }, { label: "Build", icon: "hammer" }, { label: "Test" }],
  },
  labeled: {
    kind: "labeled",
    alt: "A labeled flower",
    base: flower,
    labels: [
      { text: "Petal", x: 200, y: 110, tx: 90, ty: 60 },
      { text: "Stem", x: 240, y: 250, tx: 380, ty: 240 },
    ],
  },
  timeline: {
    kind: "timeline",
    alt: "A timeline",
    span: [1800, 1900],
    events: [
      { at: 1812, label: "A", detail: "first" },
      { at: 1850, label: "B" },
    ],
  },
  map: {
    kind: "map",
    alt: "A map",
    compass: true,
    regions: [
      { id: "a", label: "Park", rect: [20, 20, 200, 120] },
      { id: "b", label: "School", rect: [240, 20, 200, 120] },
    ],
    routes: [{ from: "a", to: "b", label: "path" }],
  },
  venn: {
    kind: "venn",
    alt: "A Venn diagram",
    sets: [
      { label: "A", items: ["x"] },
      { label: "B", items: ["y"] },
    ],
    overlap: ["z"],
  },
  bars: {
    kind: "bars",
    alt: "A bar chart",
    data: [
      { label: "Dogs", value: 8 },
      { label: "Cats", value: 5 },
    ],
    xLabel: "Pet",
    yLabel: "Students",
  },
};

test("every kind in the spec table has a renderer and a sample", () => {
  assert.deepEqual([...VISUAL_KINDS].sort(), Object.keys(SAMPLES).sort());
});

for (const [kind, spec] of Object.entries(SAMPLES)) {
  test(`${kind}: renders an accessible, deterministic, token-coloured svg`, () => {
    const svg = renderVisual(spec);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 480 320"/);
    assert.match(svg, /role="img"/);
    assert.ok(svg.includes(`<title>${spec.alt}</title>`));
    assert.equal(
      svg.includes("<desc>"),
      Boolean(spec.longDesc),
      "desc only when longDesc exists (no duplicate alt)",
    );
    assert.ok(!/NaN|undefined|Infinity/.test(svg), "no NaN/undefined in output");
    assert.equal(renderVisual(spec), svg, "same spec, same bytes");
    const resolved = renderVisual(spec, { resolved: true });
    assert.ok(!resolved.includes("var("), "resolved output has no CSS variables");
  });
}

test("tokens map to ds.css custom properties", () => {
  const svg = renderVisual(SAMPLES.table);
  assert.match(svg, /var\(--brand,#1e3a5f\)/);
  assert.match(svg, /var\(--ink,#182230\)/);
});

test("alt is required and the error says so", () => {
  for (const alt of [undefined, "", "   ", 5])
    assert.throws(
      () => renderVisual({ ...SAMPLES.icon, alt }),
      (e) => e instanceof VisualError && /alt/.test(e.message),
    );
  assert.throws(() => renderVisual(null), VisualError);
});

test("unknown kinds, icons, colours and shape types fail clearly", () => {
  assert.throws(() => renderVisual({ kind: "hologram", alt: "x" }), /unknown visual kind/);
  assert.throws(
    () => renderVisual({ kind: "icon", name: "no-such-icon", alt: "x" }),
    /unknown icon/,
  );
  assert.throws(
    () =>
      renderVisual({
        kind: "shapes",
        alt: "x",
        items: [{ t: "rect", x: 0, y: 0, w: 5, h: 5, fill: "javascript:alert(1)" }],
      }),
    /unknown colour/,
  );
  assert.throws(
    () => renderVisual({ kind: "shapes", alt: "x", items: [{ t: "blob" }] }),
    /unknown item type/,
  );
  assert.throws(
    () => renderVisual({ kind: "shapes", alt: "x", items: [{ t: "path", d: 'M0 0"><script>' }] }),
    /path/,
  );
  assert.throws(
    () =>
      renderVisual({ kind: "shapes", alt: "x", items: [{ t: "rect", x: "a", y: 0, w: 5, h: 5 }] }),
    /finite number/,
  );
  assert.throws(() => renderVisual({ ...SAMPLES.shapes, w: 5 }), /between 40 and 4000/);
});

test("all spec text is escaped (alt, longDesc, labels, cells)", () => {
  const evil = `"><img src=x onerror=alert(1)>&`;
  const specs = [
    { ...SAMPLES.icon, alt: evil, longDesc: evil },
    { ...SAMPLES.shapes, items: [{ t: "text", x: 5, y: 20, text: evil }] },
    { ...SAMPLES.tape, parts: [{ label: evil, units: 1 }], total: evil },
    { ...SAMPLES.table, head: [evil, "b"], rows: [[evil, evil]] },
    { ...SAMPLES.cycle, stages: [{ label: evil }, { label: evil }] },
    { ...SAMPLES.flow, steps: [{ label: evil }, { label: evil }] },
    { ...SAMPLES.labeled, labels: [{ text: evil, x: 10, y: 10, tx: 100, ty: 50 }] },
    { ...SAMPLES.timeline, events: [{ at: 1810, label: evil, detail: evil }] },
    { ...SAMPLES.bars, data: [{ label: evil, value: 3 }], xLabel: evil },
    {
      ...SAMPLES.venn,
      sets: [
        { label: evil, items: [evil] },
        { label: evil, items: [evil] },
      ],
      overlap: [evil],
    },
    { ...SAMPLES.map, regions: [{ id: "a", label: evil, rect: [10, 10, 100, 100] }], routes: [] },
    { ...SAMPLES.scene, items: [{ icon: "tree", x: 10, y: 10, s: 50, label: evil }] },
    {
      ...SAMPLES.numberline,
      marks: [{ at: 1, label: evil }],
      arcs: [{ from: 0, to: 1, label: evil }],
    },
    {
      ...SAMPLES.coord,
      xLabel: evil,
      points: [{ x: 1, y: 1, label: evil }],
      lines: [{ m: 1, b: 0, label: evil }],
    },
  ];
  for (const spec of specs) {
    const svg = renderVisual(spec);
    assert.ok(!svg.includes("<img"), `${spec.kind}: raw tag escaped`);
    assert.ok(
      !/onerror=alert\(1\)>/.test(
        svg.replace(/&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;&amp;/g, ""),
      ),
      `${spec.kind}: no live handler`,
    );
    assert.ok(svg.includes("&lt;img"), `${spec.kind}: text still present, escaped`);
  }
});

test("longDesc goes in <desc>; alt in aria-label", () => {
  const svg = renderVisual({ ...SAMPLES.table, longDesc: "Two rows: 2 and 1, then 4 and 2." });
  assert.match(svg, /<desc>Two rows: 2 and 1, then 4 and 2\.<\/desc>/);
  assert.match(svg, /aria-label="A ratio table"/);
});

test("w and h set the viewBox", () => {
  assert.match(renderVisual({ ...SAMPLES.icon, w: 200, h: 100 }), /viewBox="0 0 200 100"/);
});

test("palette override takes token names only", () => {
  assert.match(
    renderVisual({ ...SAMPLES.tape, parts: [{ label: "1", units: 1 }], palette: ["rose"] }),
    /var\(--rose-600/,
  );
  assert.throws(() => renderVisual({ ...SAMPLES.tape, palette: ["magenta"] }), /palette/);
});

test("tape: ratio rows share one unit width so equal units line up", () => {
  const svg = renderVisual({
    kind: "tape",
    alt: "Two rows",
    rows: [
      {
        label: "Blue",
        parts: [
          { label: "1", units: 1 },
          { label: "1", units: 1 },
        ],
      },
      {
        label: "White",
        parts: [
          { label: "1", units: 1 },
          { label: "1", units: 1 },
          { label: "1", units: 1 },
        ],
      },
    ],
  });
  const widths = [...svg.matchAll(/<rect [^>]*width="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.equal(widths.length, 5);
  assert.ok(
    widths.every((w) => Math.abs(w - widths[0]) < 0.11),
    `equal unit widths: ${widths}`,
  );
  assert.throws(() => renderVisual({ kind: "tape", alt: "x", parts: [] }), /parts/);
});

test("labeled: hidden labels never leak their text, and are numbered", () => {
  const svg = renderVisual({
    ...SAMPLES.labeled,
    labels: [
      { text: "Petal", x: 200, y: 110, tx: 90, ty: 60 },
      { text: "SECRETWORD", x: 240, y: 250, tx: 380, ty: 240, hidden: true },
    ],
  });
  assert.ok(!svg.includes("SECRETWORD"));
  assert.ok(svg.includes("Petal"));
  assert.match(svg, />2<\/tspan>/);
  assert.throws(
    () => renderVisual({ ...SAMPLES.labeled, labels: [{ x: 1, y: 1, tx: 5, ty: 5 }] }),
    /text/,
  );
});

const nodeBoxes = (svg) =>
  [
    ...svg.matchAll(
      /<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="10"/g,
    ),
  ].map((m) => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }));
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const kind of ["cycle", "flow"]) {
  test(`${kind}: 2 to 8 entries are drawn without overlapping or leaving the canvas`, () => {
    for (let n = 2; n <= 8; n++) {
      const list = Array.from({ length: n }, (_, i) => ({ label: `Stage ${i + 1}` }));
      const svg = renderVisual({ kind, alt: "x", [kind === "cycle" ? "stages" : "steps"]: list });
      const boxes = nodeBoxes(svg);
      assert.equal(boxes.length, n, `${kind} ${n}`);
      boxes.forEach((b, i) => {
        assert.ok(
          b.x >= 0 && b.y >= 0 && b.x + b.w <= 480 && b.y + b.h <= 320,
          `${kind} ${n} node ${i} inside canvas`,
        );
        boxes.slice(i + 1).forEach((o) => assert.ok(!overlap(b, o), `${kind} ${n} nodes overlap`));
      });
    }
  });
  test(`${kind}: out-of-range counts fail`, () => {
    assert.throws(
      () =>
        renderVisual({
          kind,
          alt: "x",
          [kind === "cycle" ? "stages" : "steps"]: [{ label: "only" }],
        }),
      VisualError,
    );
  });
}

test("numberline and coord reject values outside their range", () => {
  assert.throws(() => renderVisual({ ...SAMPLES.numberline, marks: [{ at: 9 }] }), /outside/);
  assert.throws(() => renderVisual({ ...SAMPLES.numberline, max: 0 }), /greater/);
  assert.throws(() => renderVisual({ ...SAMPLES.coord, points: [{ x: 99, y: 1 }] }), /outside/);
  assert.throws(() => renderVisual({ ...SAMPLES.coord, xmax: 0 }), /exceed/);
});

test("table: ragged rows fail; highlighted cells get a heavy border", () => {
  assert.throws(() => renderVisual({ ...SAMPLES.table, rows: [[1]] }), /every row/);
  assert.ok(renderVisual(SAMPLES.table).includes('stroke-width="3.5"'));
});

test("visualToPng needs a browser", async () => {
  await assert.rejects(() => visualToPng(SAMPLES.icon, 200), VisualError);
});

test("icons: >=100 distinct, categorised, searchable and all render", () => {
  const icons = listIcons();
  assert.ok(icons.length >= 100, `${icons.length} icons`);
  assert.equal(new Set(icons.map((i) => i.name)).size, icons.length);
  const cats = new Set(icons.map((i) => i.category));
  for (const need of [
    "animals",
    "plants",
    "weather",
    "school",
    "food",
    "body",
    "community",
    "science",
    "shapes",
    "tools",
    "arrows",
    "transport",
    "sports",
    "arts",
    "math",
  ])
    assert.ok(cats.has(need), `category ${need}`);
  for (const i of icons) {
    assert.ok(Array.isArray(i.keywords) && i.keywords.length, `${i.name} keywords`);
    assert.ok(hasIcon(i.name));
    const svg = renderIcon(i.name, { size: 48 });
    assert.ok(svg.startsWith("<svg") && !/NaN|undefined/.test(svg), `${i.name} renders cleanly`);
    assert.ok(
      !/<(?:defs|script|image|foreignObject)\b|\sid="/.test(svg),
      `${i.name} is self-contained and id-free`,
    );
  }
});

test("icons: people take skin and hair; bad colours fail", () => {
  assert.notEqual(renderIcon("student", { skin: 0 }), renderIcon("student", { skin: 4 }));
  assert.throws(() => renderIcon("student", { skin: "red" }), /colour/);
});

test("shapes with no fill default to fill none instead of throwing", () => {
  const svg = renderVisual({
    kind: "shapes",
    alt: "A line and a circle drawn with outlines only.",
    items: [
      { t: "path", d: "M0 0L10 10", stroke: "ink" },
      { t: "circle", cx: 5, cy: 5, r: 3, stroke: "coral" },
      { t: "rect", x: 1, y: 1, w: 5, h: 5, stroke: "ink" },
      { t: "ellipse", cx: 9, cy: 9, rx: 4, ry: 2, stroke: "ink" },
    ],
  });
  assert.equal((svg.match(/fill="none"/g) || []).length, 4);
});
