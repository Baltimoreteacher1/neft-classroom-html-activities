/* Generated geometry figures are drawn to their labels: a shape labelled 24 by 7 is not drawn 3 by 1.
 * Parses the drawn polygons out of the SVG and compares the ratios with the numbers the item prints. */
import assert from "node:assert/strict";
import { loadStudio } from "./lib/studio-vm.mjs";

const ctx = loadStudio({ gen: true, viz: true });
const { StudioGen: G, StudioViz: V } = ctx;
const poly = (svg, klass) => {
  const m = new RegExp(`<polygon points="([^"]+)" class="${klass}"`).exec(svg);
  if (!m) return null;
  return m[1]
    .trim()
    .split(/\s+/)
    .map((p) => p.split(",").map(Number));
};
const near = (a, b, tol = 0.03) => Math.abs(a - b) / b <= tol;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
let checked = 0;
const bad = [];
const check = (id, level, seed, viz) => {
  if (viz?.t !== "shape") return;
  const html = V.render(JSON.parse(JSON.stringify(viz)));
  const pts = poly(html, "v-ft v-sb");
  if (!pts) return;
  const d = viz.dims || {};
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs),
    h = Math.max(...ys) - Math.min(...ys);
  let want = null,
    got = null;
  if (viz.s === "tri" && Number(d.b) > 0 && Number(d.h) > 0) [want, got] = [d.b / d.h, w / h];
  if (viz.s === "rhombus" && Number(d.side) > 0 && Number(d.h) > 0 && pts.length === 4) {
    const side = dist(pts[1], pts[2]);
    [want, got] = [d.h / d.side, h / side];
  }
  if (viz.s === "trap" && Number(d.b1) > 0 && Number(d.b2) > 0 && Number(d.h) > 0)
    [want, got] = [Math.max(d.b1, d.b2) / d.h, w / h];
  if (want === null) return;
  checked++;
  if (!near(got, want))
    bad.push(
      `${id} L${level} seed ${seed}: ${viz.s} ${JSON.stringify(d)} drawn ${got.toFixed(2)}, should be ${want.toFixed(2)}`,
    );
};
for (const id of [
  "areaParallelogram",
  "areaTriangle",
  "areaTrapezoid",
  "areaRegularPolygon",
  "surfaceAreaPrism",
  "surfaceAreaPyramid",
])
  for (let level = 1; level <= 4; level++)
    for (let seed = 1; seed <= 120; seed++) {
      let item;
      try {
        item = G.make(id, level, seed);
      } catch {
        continue;
      }
      check(id, level, seed, item.viz);
    }
assert.ok(checked > 300, `checked ${checked} figures`);
assert.deepEqual(bad.slice(0, 8), [], `${bad.length} figures disagree with their labels`);

// the new solids exist, carry their labels and say "slant height"
const tp = V.render({ t: "prism", tri: { b: 24, h: 5, s: 13 }, len: 8, unit: "in", labels: true });
assert.match(tp, /Triangular prism/);
const py = V.render({ t: "pyramid", n: 4, base: 12, slant: 9, unit: "ft", labels: true });
assert.match(py, /slant height 9 ft/);
assert.doesNotMatch(py, /with height/, "never calls the slant 'height'");
console.log(
  `studio-viz-proportion: ${checked} generated figures drawn to their labels; triangular prism and pyramid render.`,
);
