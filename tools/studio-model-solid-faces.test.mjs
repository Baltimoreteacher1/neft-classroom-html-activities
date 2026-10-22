// solid:faces (lesson 5-6): the net of a rectangular prism, every face labelled, three matching pairs marked, six areas added.
// Re-derives every printed number by COUNTING the unit squares on the outside of a block of unit cubes (no formula), parses the SVG
// (labels and the proportions of the six faces), and proves the check rejects a corrupted picture.   node tools/studio-model-solid-faces.test.mjs
import assert from "node:assert/strict";
import { controls, evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

/** Unit faces showing outward in each of the six directions, for a length x width x height block of unit cubes. */
function exposed(l, w, h) {
  const cubes = new Set();
  for (let x = 0; x < l; x++)
    for (let y = 0; y < w; y++) for (let z = 0; z < h; z++) cubes.add(`${x},${y},${z}`);
  const out = { "+x": 0, "-x": 0, "+y": 0, "-y": 0, "+z": 0, "-z": 0 };
  for (const key of cubes) {
    const [x, y, z] = key.split(",").map(Number);
    for (const [name, [dx, dy, dz]] of Object.entries({
      "+x": [1, 0, 0],
      "-x": [-1, 0, 0],
      "+y": [0, 1, 0],
      "-y": [0, -1, 0],
      "+z": [0, 0, 1],
      "-z": [0, 0, -1],
    }))
      if (!cubes.has(`${x + dx},${y + dy},${z + dz}`)) out[name]++;
  }
  return out;
}
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const attr = (tag, name) => Number((tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1]);

function check(values, result, svg) {
  const [l, w, h] = values,
    where = `${l}x${w}x${h}`,
    e = exposed(l, w, h);
  const total = Object.values(e).reduce((a, b) => a + b, 0);
  assert.equal(result.value, total, `${where}: readout value`);
  // length runs along x, width along y, height along z: top/bottom face +-z, front/back +-y, left/right +-x
  assert.equal(
    result.equation,
    `${e["+z"]} + ${e["-z"]} + ${e["+y"]} + ${e["-y"]} + ${e["+x"]} + ${e["-x"]} = ${total}`,
    `${where}: equation`,
  );
  const t = texts(svg),
    has = (s) =>
      assert.ok(t.includes(s), `${where}: picture is missing "${s}" (has ${t.join(" | ")})`);
  has(
    `A ${e["+z"]} + A ${e["-z"]} + B ${e["+y"]} + B ${e["-y"]} + C ${e["+x"]} + C ${e["-x"]} = ${total}`,
  );
  has(`A: Top and bottom (2 faces): ${l} × ${w} = ${e["+z"]} each`);
  has(`B: Front and back (2 faces): ${l} × ${h} = ${e["+y"]} each`);
  has(`C: Left and right (2 faces): ${w} × ${h} = ${e["+x"]} each`);
  // the three pairs are really pairs
  assert.equal(e["+z"], e["-z"]);
  assert.equal(e["+y"], e["-y"]);
  assert.equal(e["+x"], e["-x"]);
  // the net: six rectangles drawn to one scale, in the cross layout that folds without overlap
  const rects = [...svg.matchAll(/<rect\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(rects.length, 6, `${where}: six faces`);
  const [top, front, right, back, left, bottom] = rects.map((r) => ({
    x: attr(r, "x"),
    y: attr(r, "y"),
    w: attr(r, "width"),
    h: attr(r, "height"),
  }));
  const s = (left.x + left.w - front.x) / (2 * l + 2 * w),
    tol = 0.2 / s + 0.01; // scale from the whole net, so a 1-unit face does not magnify rounding
  const dims = [
    [top, l, w],
    [front, l, h],
    [right, w, h],
    [back, l, h],
    [left, w, h],
    [bottom, l, w],
  ];
  for (const [f, fw, fh] of dims) {
    assert.ok(Math.abs(f.w / s - fw) < tol, `${where}: face width ${f.w} for ${fw}`);
    assert.ok(Math.abs(f.h / s - fh) < tol, `${where}: face height ${f.h} for ${fh}`);
  }
  const near = (a, b) => Math.abs(a - b) < 0.25;
  assert.ok(
    near(top.x, front.x) && near(top.y + top.h, front.y),
    `${where}: top sits on the front`,
  );
  assert.ok(
    near(bottom.x, front.x) && near(front.y + front.h, bottom.y),
    `${where}: bottom hangs from the front`,
  );
  assert.ok(
    near(front.x + front.w, right.x) &&
      near(right.x + right.w, back.x) &&
      near(back.x + back.w, left.x),
    `${where}: the four side faces touch in a row`,
  );
}

const grid = [1, 2, 5, 9, 10];
let n = 0;
for (const l of grid)
  for (const w of grid)
    for (const h of grid) {
      const model = { kind: "solid", mode: "faces", values: [l, w, h] };
      const result = evaluate(model, [l, w, h], {});
      check([l, w, h], result, visual(model, [l, w, h], result));
      n++;
    }
assert.ok(n >= 30);

// controls match the old solid:surface model, so a 5-6 bench built on it stays valid
{
  const c = controls({ kind: "solid", mode: "faces", values: [6, 3, 2] });
  assert.deepEqual(
    c.map((x) => [x.min, x.max, x.step]),
    [
      [1, 10, 1],
      [1, 10, 1],
      [1, 10, 1],
    ],
  );
  assert.equal(
    evaluate({ kind: "solid", mode: "faces", values: [6, 3, 2] }, [6, 3, 2], {}).value,
    evaluate({ kind: "solid", mode: "surface", values: [6, 3, 2] }, [6, 3, 2], {}).value,
  );
  assert.throws(
    () => evaluate({ kind: "solid", mode: "faces", values: [6, 3, 2] }, [11, 3, 2], {}),
    /whole numbers/,
  );
}

// the check refuses a corrupted picture or readout
{
  const model = { kind: "solid", mode: "faces", values: [6, 3, 2] };
  const result = evaluate(model, [6, 3, 2], {}),
    svg = visual(model, [6, 3, 2], result);
  assert.equal(result.value, 72);
  assert.throws(() => check([6, 3, 2], { ...result, value: 73 }, svg), /readout value/);
  assert.throws(
    () => check([6, 3, 2], result, svg.replace(/(<text[^>]*>A [^<]*= )72</, "$173<")),
    /picture is missing/,
  );
  assert.throws(
    () => check([6, 3, 2], result, svg.replace('width="180"', 'width="170"')),
    /face (width|height)/,
  );
}
console.log(
  `solid:faces: ${n} settings re-derived by counting unit squares, picture parsed, corruption rejected.`,
);
