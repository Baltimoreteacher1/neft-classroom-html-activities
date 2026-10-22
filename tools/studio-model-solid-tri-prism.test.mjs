// solid:tri-prism (lesson 5-7): the net of a triangular prism (two right triangles, three rectangles) with every face labelled.
// Re-derives every printed number from 3D COORDINATES of the folded prism (cross products, hypot; no surface-area formula), parses the SVG
// (labels, and the net's geometry: triangle sides, rectangle sizes, triangles standing on the base rectangle's edges), and proves the check
// rejects a corrupted picture.   node tools/studio-model-solid-tri-prism.test.mjs
import assert from "node:assert/strict";
import { controls, evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const sub = (p, q) => p.map((x, i) => x - q[i]);
/** Area of a planar polygon given in order: half the norm of the summed cross products from the first vertex. */
function polygonArea(pts) {
  let sum = [0, 0, 0];
  for (let i = 1; i < pts.length - 1; i++)
    sum = sum.map((x, k) => x + cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0]))[k]);
  return Math.hypot(...sum) / 2;
}
// The family the control walks: right triangles with legs in the ratio 3:4 (3-4-5 scaled); the height (a leg) is 3, 6, 9 or 12.
function derive(h, len) {
  const base = (h * 4) / 3;
  assert.ok(
    Number.isInteger(base) && Number.isInteger(Math.hypot(h, base)),
    "a whole-number right triangle",
  );
  const A = [0, 0, 0],
    B = [base, 0, 0],
    C = [0, h, 0],
    A2 = [0, 0, len],
    B2 = [base, 0, len],
    C2 = [0, h, len];
  const tri = polygonArea([A, B, C]);
  assert.equal(tri, polygonArea([A2, B2, C2]));
  const sides = {
    height: polygonArea([A, C, C2, A2]),
    base: polygonArea([A, B, B2, A2]),
    third: polygonArea([B, C, C2, B2]),
  };
  return {
    base,
    third: Math.hypot(h, base),
    tri,
    sides,
    total: 2 * tri + sides.height + sides.base + sides.third,
  };
}
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const attr = (tag, name) => Number((tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1]);

function check(values, result, svg) {
  const [h, len] = values,
    where = `height ${h}, length ${len}`,
    d = derive(h, len);
  assert.equal(result.value, d.total, `${where}: readout value`);
  assert.equal(
    result.equation,
    `${d.tri} + ${d.tri} + ${d.sides.height} + ${d.sides.base} + ${d.sides.third} = ${d.total}`,
    `${where}: equation`,
  );
  const t = texts(svg),
    has = (s) =>
      assert.ok(t.includes(s), `${where}: picture is missing "${s}" (has ${t.join(" | ")})`);
  has(
    `T ${d.tri} + T ${d.tri} + A ${d.sides.height} + B ${d.sides.base} + C ${d.sides.third} = ${d.total}`,
  );
  has(`T: two triangles, ½ × ${d.base} × ${h} = ${d.tri} each`);
  has(`A: rectangle for the height side: ${h} × ${len} = ${d.sides.height}`);
  has(`B: rectangle for the base: ${d.base} × ${len} = ${d.sides.base}`);
  has(`C: rectangle for the third side: ${d.third} × ${len} = ${d.sides.third}`);
  has(`height ${h}`);
  has(`side ${d.third}`);
  // geometry of the net, in picture units: three rectangles of one height in a row, two triangles on the edges of the middle one
  const rects = [...svg.matchAll(/<rect\b[^>]*>/g)].map((m) => ({
    x: attr(m[0], "x"),
    y: attr(m[0], "y"),
    w: attr(m[0], "width"),
    h: attr(m[0], "height"),
  }));
  assert.equal(rects.length, 3, `${where}: three rectangles`);
  const [ra, rb, rc] = rects,
    s = (rc.x + rc.w - ra.x) / (h + d.base + d.third),
    tol = 0.2 / s + 0.01;
  assert.ok(
    Math.abs(ra.w / s - h) < tol &&
      Math.abs(rb.w / s - d.base) < tol &&
      Math.abs(rc.w / s - d.third) < tol,
    `${where}: rectangle widths are the triangle's sides`,
  );
  for (const r of rects)
    assert.ok(Math.abs(r.h / s - len) < tol, `${where}: rectangle height is the prism length`);
  assert.ok(
    Math.abs(ra.x + ra.w - rb.x) < 0.25 && Math.abs(rb.x + rb.w - rc.x) < 0.25,
    `${where}: rectangles touch`,
  );
  const polys = [...svg.matchAll(/<polygon\b[^>]*class="shape"[^>]*>/g)].map((m) =>
    m[0]
      .match(/points="([^"]*)"/)[1]
      .split(" ")
      .map((p) => p.split(",").map(Number)),
  );
  assert.equal(polys.length, 2, `${where}: two triangles`);
  for (const [tri, edgeY] of [
    [polys[0], rb.y],
    [polys[1], rb.y + rb.h],
  ]) {
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) / s;
    const sorted = [dist(tri[0], tri[1]), dist(tri[1], tri[2]), dist(tri[2], tri[0])].sort(
      (a, b) => a - b,
    );
    assert.ok(
      sorted.every((v, i) => Math.abs(v - [h, d.base, d.third][i]) < tol),
      `${where}: triangle sides ${sorted.join(", ")}`,
    );
    assert.ok(
      Math.abs(tri[0][1] - edgeY) < 0.25 && Math.abs(tri[1][1] - edgeY) < 0.25,
      `${where}: a triangle stands on an edge of the base rectangle`,
    );
    assert.ok(
      Math.abs(tri[0][0] - rb.x) < 0.25 && Math.abs(tri[1][0] - (rb.x + rb.w)) < 0.25,
      `${where}: its base edge is the rectangle's edge`,
    );
  }
}

let n = 0;
for (const h of [3, 6, 9, 12])
  for (let len = 1; len <= 10; len++) {
    const model = { kind: "solid", mode: "tri-prism", values: [h, len] };
    const result = evaluate(model, [h, len], {});
    check([h, len], result, visual(model, [h, len], result));
    n++;
  }
assert.ok(n >= 30);

// controls and the guards on them
{
  const model = { kind: "solid", mode: "tri-prism", values: [6, 3] };
  assert.deepEqual(
    controls(model).map((x) => [x.min, x.max, x.step]),
    [
      [3, 12, 3],
      [1, 10, 1],
    ],
  );
  for (const bad of [
    [4, 3],
    [6, 0],
    [6, 11],
    [6, 2.5],
  ])
    assert.throws(() => evaluate(model, bad, {}), /Triangle height/);
  assert.equal(evaluate({ ...model, values: [3, 8] }, [3, 8], {}).value, 108); // a 3-4-5 triangle, 8 long: 12 + 96
}

// the check refuses a corrupted picture or readout
{
  const model = { kind: "solid", mode: "tri-prism", values: [6, 3] };
  const result = evaluate(model, [6, 3], {}),
    svg = visual(model, [6, 3], result);
  assert.equal(result.value, 120);
  assert.throws(() => check([6, 3], { ...result, value: 121 }, svg), /readout value/);
  assert.throws(
    () => check([6, 3], result, svg.replace(/(<text[^>]*>T 24 \+ [^<]*= )120</, "$1121<")),
    /picture is missing/,
  );
  assert.throws(
    () =>
      check(
        [6, 3],
        result,
        svg.replace(
          /(<rect x="[^"]*" y="[^"]*" width=")[\d.]+(" height="[\d.]+" class="shape-alt")/,
          "$1999$2",
        ),
      ),
    /rectangle widths|touch/,
  );
}
console.log(
  `solid:tri-prism: ${n} settings re-derived from 3D coordinates, net geometry parsed, corruption rejected.`,
);
