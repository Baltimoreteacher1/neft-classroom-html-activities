// solid:pyramid-net (lesson 5-8): the net of a square pyramid, each triangle as tall as the SLANT height, every face labelled, areas added.
// Re-derives every printed number from 3D COORDINATES of the folded pyramid (apex above the centre of the base; face areas from cross
// products; no surface-area formula), proves every setting the controls allow is a real pyramid, parses the SVG (labels and the net's
// geometry: apex over the middle of the edge at the slant height), and proves the check rejects a corrupted picture.
//   node tools/studio-model-solid-pyramid-net.test.mjs
import assert from "node:assert/strict";
import { controls, evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const sub = (p, q) => p.map((x, i) => x - q[i]);
const triArea = (p, q, r) => Math.hypot(...cross(sub(q, p), sub(r, p))) / 2;
const show = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1)); // faces are whole or half numbers

/** The folded pyramid: the apex sits straight above the centre of the base so that the slant height (apex to the middle of a base edge) is l. */
function derive(s, l) {
  const rise = l * l - (s / 2) * (s / 2);
  assert.ok(rise > 0, `a real pyramid needs slant ${l} > half of base ${s}`);
  const apex = [0, 0, Math.sqrt(rise)],
    c = s / 2;
  const corners = [
    [-c, -c, 0],
    [c, -c, 0],
    [c, c, 0],
    [-c, c, 0],
  ];
  const faces = corners.map((p, i) => triArea(p, corners[(i + 1) % 4], apex));
  assert.ok(
    faces.every((f) => Math.abs(f - faces[0]) < 1e-9),
    "four congruent faces",
  );
  // the slant height really is the distance from the apex to the middle of a base edge
  assert.ok(Math.abs(Math.hypot(...sub(apex, [0, -c, 0])) - l) < 1e-9);
  const base =
    triArea(corners[0], corners[1], corners[2]) + triArea(corners[0], corners[2], corners[3]);
  const face = Math.round(faces[0] * 2) / 2;
  assert.ok(Math.abs(face - faces[0]) < 1e-9, "a face area is a whole or half number");
  return { base: Math.round(base), face, total: Math.round(base) + 4 * face };
}
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const attr = (tag, name) => Number((tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1]);

function check(values, result, svg) {
  const [s, l] = values,
    where = `base ${s}, slant ${l}`,
    d = derive(s, l);
  assert.equal(result.value, d.total, `${where}: readout value`);
  const sum = `${show(d.base)} + ${show(d.face)} + ${show(d.face)} + ${show(d.face)} + ${show(d.face)} = ${show(d.total)}`;
  assert.equal(result.equation, sum, `${where}: equation`);
  const t = texts(svg),
    has = (x) =>
      assert.ok(t.includes(x), `${where}: picture is missing "${x}" (has ${t.join(" | ")})`);
  has(sum);
  has(`Base: ${s} × ${s} = ${show(d.base)}`);
  has(`T: each triangle, ½ × ${s} × ${l} = ${show(d.face)} (base side × slant height)`);
  has(`slant height ${l}`);
  has("Slant height is measured along a face,");
  // the net: a square and four triangles. Each apex lies over the middle of its edge, at exactly the slant height (one scale for all)
  const base = svg.match(/<rect\b[^>]*class="shape"[^>]*>/)[0];
  const bx = attr(base, "x"),
    by = attr(base, "y"),
    side = attr(base, "width");
  assert.ok(Math.abs(attr(base, "height") - side) < 0.11, `${where}: the base is a square`);
  const polys = [...svg.matchAll(/<polygon\b[^>]*class="shape-light"[^>]*>/g)].map((m) =>
    m[0]
      .match(/points="([^"]*)"/)[1]
      .split(" ")
      .map((p) => p.split(",").map(Number)),
  );
  assert.equal(polys.length, 4, `${where}: four triangles`);
  const sc = side / s,
    tol = 0.25 / sc + 0.02;
  const edges = [
    [
      [bx, by],
      [bx + side, by],
    ],
    [
      [bx + side, by],
      [bx + side, by + side],
    ],
    [
      [bx, by + side],
      [bx + side, by + side],
    ],
    [
      [bx, by],
      [bx, by + side],
    ],
  ];
  polys.forEach((tri, i) => {
    const [p, q] = edges[i],
      apex = tri[2],
      mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    assert.ok(
      Math.hypot(tri[0][0] - p[0], tri[0][1] - p[1]) < 0.25 &&
        Math.hypot(tri[1][0] - q[0], tri[1][1] - q[1]) < 0.25,
      `${where}: triangle ${i} stands on its base edge`,
    );
    const e = [q[0] - p[0], q[1] - p[1]],
      a = [apex[0] - mid[0], apex[1] - mid[1]];
    assert.ok(
      Math.abs(e[0] * a[0] + e[1] * a[1]) / side < 0.25,
      `${where}: triangle ${i}'s apex is over the middle of the edge`,
    );
    assert.ok(
      Math.abs(Math.hypot(...a) / sc - l) < tol,
      `${where}: triangle ${i} is ${Math.hypot(...a) / sc} tall, expected the slant height ${l}`,
    );
  });
}

// every setting the controls allow is a real pyramid (slant height above half the base side), and is checked
const [cs, cl] = controls({ kind: "solid", mode: "pyramid-net", values: [6, 9] });
assert.deepEqual([cs.min, cs.max, cs.step, cl.min, cl.max, cl.step], [1, 10, 1, 6, 12, 1]);
assert.ok(
  cl.min > cs.max / 2,
  "the smallest slant height still exceeds half of the largest base side",
);
let n = 0;
for (let s = cs.min; s <= cs.max; s += cs.step)
  for (let l = cl.min; l <= cl.max; l += cl.step) {
    const model = { kind: "solid", mode: "pyramid-net", values: [s, l] };
    const result = evaluate(model, [s, l], {});
    check([s, l], result, visual(model, [s, l], result));
    n++;
  }
assert.equal(n, 70);

// the guards, and the lesson's own worked example: 6 x 6 base, slant height 8 -> 36 + 4 x 24 = 132
{
  const model = { kind: "solid", mode: "pyramid-net", values: [6, 9] };
  for (const bad of [[0, 8], [11, 8], [6, 5], [6, 13], [6, 7.5], [6]])
    assert.throws(() => evaluate(model, bad, {}), /Base side/);
  assert.equal(evaluate(model, [6, 8], {}).value, 132);
}

// the check refuses a corrupted picture or readout
{
  const model = { kind: "solid", mode: "pyramid-net", values: [6, 7] };
  const result = evaluate(model, [6, 7], {}),
    svg = visual(model, [6, 7], result);
  assert.equal(result.value, 120);
  assert.throws(() => check([6, 7], { ...result, value: 121 }, svg), /readout value/);
  assert.throws(
    () => check([6, 7], result, svg.replace(/(<text[^>]*>36 \+ [^<]*= )120</, "$1121<")),
    /picture is missing/,
  );
  assert.throws(
    () =>
      check(
        [6, 7],
        result,
        svg.replace(
          /(<polygon points="[\d.]+,[\d.]+ [\d.]+,[\d.]+ [\d.]+,)[\d.]+(" class="shape-light")/,
          "$10$2",
        ),
      ),
    /tall|over the middle/,
  );
}
console.log(
  `solid:pyramid-net: ${n} settings, every one a real pyramid re-derived from 3D coordinates; net geometry parsed; corruption rejected.`,
);
