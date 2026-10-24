// area:parallelogram (lesson 5-1): every number the model prints is re-derived INDEPENDENTLY of models/area-parallelogram.mjs.
//   node tools/studio-model-area-parallelogram.test.mjs
// The reference builds the four corners and takes the area with the shoelace formula (not base x height), the slanted side with
// hypot, and reads the picture back: the polygon's own proportions must be the base and the height the labels claim.
import assert from "node:assert/strict";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";
import { registered } from "../curriculum/learning-labs/shared/models/index.mjs";

const model = { kind: "area", mode: "parallelogram", values: [8, 3, 4] };
assert.ok(registered(model), "area:parallelogram is registered");

const shoelace = (p) =>
  Math.abs(
    p.reduce((s, [x, y], i) => s + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0),
  ) / 2;
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const slantWord = (h, s) => {
  const d = Math.hypot(s, h);
  return Math.abs(d - Math.round(d)) < 1e-9
    ? String(Math.round(d))
    : `about ${Number(d.toFixed(1))}`;
};

/** Every problem between what the model printed and the reference. */
function problems(b, h, s, result, svg) {
  const out = [];
  const area = shoelace([
    [0, 0],
    [b, 0],
    [b + s, h],
    [s, h],
  ]);
  if (result.value !== area) out.push(`value ${result.value} is not ${area}`);
  if (result.equation !== `${b} × ${h} = ${area}`) out.push(`equation "${result.equation}"`);
  const t = texts(svg);
  for (const want of [`base ${b}`, `height ${h}`, `area = ${b} × ${h} = ${area}`])
    if (!t.includes(want)) out.push(`the picture does not print "${want}"`);
  if (s > 0) {
    if (!t.includes("slanted side")) out.push("no slanted side label");
    if (!t.includes(slantWord(h, s)))
      out.push(`slanted side should read ${slantWord(h, s)}, picture has ${t.join(" | ")}`);
  } else if (t.includes("slanted side")) out.push("a slide of 0 has no slanted side to label");
  // the picture itself: the polygon's bottom edge is the base and its vertical extent is the height
  const poly = svg.match(/<polygon points="([^"]*)" class="shape"/);
  if (!poly) return [...out, "no shaded parallelogram"];
  const pts = poly[1].split(" ").map((p) => p.split(",").map(Number));
  const px = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / b;
  const heightPx = pts[0][1] - pts[3][1];
  if (Math.abs(heightPx / px - h) > 0.15) out.push(`drawn height ${heightPx / px} is not ${h}`);
  if (Math.abs((pts[3][0] - pts[0][0]) / px - s) > 0.15)
    out.push(`drawn slide ${(pts[3][0] - pts[0][0]) / px} is not ${s}`);
  if (Math.abs(shoelace(pts) / (px * px) - area) > 0.4)
    out.push("the drawn polygon does not have the printed area");
  const dashed = [
    ...svg.matchAll(
      /<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" class="dashed"/g,
    ),
  ].map((m) => m.slice(1).map(Number));
  const drop = dashed.find((d) => d[0] === d[2]);
  if (!drop) out.push("no dashed perpendicular height");
  else if (Math.abs(drop[0] - pts[3][0]) > 0.3)
    out.push("the dashed height does not start under the top-left corner");
  return out;
}

let n = 0;
for (let b = 4; b <= 12; b++)
  for (let h = 2; h <= 9; h++)
    for (let s = 0; s <= 15; s++) {
      const values = [b, h, s];
      const result = evaluate(model, values, {});
      const found = problems(b, h, s, result, visual(model, values, result));
      assert.deepEqual(found, [], `base ${b}, height ${h}, slide ${s}: ${found.join("; ")}`);
      // sliding the top never changes the area
      assert.equal(result.value, evaluate(model, [b, h, 0], {}).value);
      n++;
    }
assert.equal(n, 9 * 8 * 16);

// controls and the guards on them
assert.deepEqual(
  controls(model).map((c) => [c.min, c.max, c.step]),
  [
    [4, 12, 1],
    [2, 9, 1],
    [0, 15, 1],
  ],
);
for (const bad of [
  [3, 3, 4],
  [13, 3, 4],
  [8, 1, 4],
  [8, 10, 4],
  [8, 3, 16],
  [8, 3.5, 4],
  [8, 3, -1],
])
  assert.throws(() => evaluate(model, bad, {}), /Choose a/);

// a mission puzzle never needs the slide: the area ignores it
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(model, round, level);
    assert.equal(q.free, 1, "the height is the unlocked control");
    assert.equal(q.start[2], q.goal[2], "the slide is the same in start and goal");
    assert.ok(Math.abs(evaluate(model, q.goal).value - q.target) < 1e-9);
  }

// the check refuses a corrupted readout or picture
{
  const result = evaluate(model, [8, 3, 4], {});
  const svg = visual(model, [8, 3, 4], result);
  assert.deepEqual(problems(8, 3, 4, result, svg), []);
  assert.ok(problems(8, 3, 4, { ...result, value: 25 }, svg).length);
  assert.ok(
    problems(8, 3, 4, result, svg.replace("area = 8 × 3 = 24", "area = 8 × 3 = 26")).length,
  );
  assert.ok(problems(8, 3, 4, result, svg.replace(/height 3</, "height 4<")).length);
}
console.log(
  `area:parallelogram: ${n} settings re-derived by shoelace and hypot, picture proportions read back, corruption rejected.`,
);
