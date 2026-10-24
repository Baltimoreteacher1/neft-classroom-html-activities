// area:crate (lesson 5-10): a crate with edges in quarters of a unit. Every printed number is re-derived by COUNTING cubes of
// 1/4 unit on an edge (not by multiplying the edges as fractions), and the picture's quarter marks are counted.
//   node tools/studio-model-area-crate.test.mjs
import assert from "node:assert/strict";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";
import { registered } from "../curriculum/learning-labs/shared/models/index.mjs";

const model = { kind: "area", mode: "crate", values: [1.5, 1, 2] };
assert.ok(registered(model), "area:crate is registered");

/** A count of 1/64ths as a reduced mixed number, written by hand: 36 is 9/16, 96 is 1 1/2. */
const say64 = (n) => {
  let top = n;
  let bottom = 64;
  while (top % 2 === 0 && bottom % 2 === 0 && top !== 0) {
    top /= 2;
    bottom /= 2;
  }
  const whole = Math.floor(top / bottom);
  const r = top - whole * bottom;
  if (!r) return String(whole);
  return whole ? `${whole} ${r}/${bottom}` : `${r}/${bottom}`;
};
const say = (q) => say64(q * 16);
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

function problems(lq, wq, hq, result, svg) {
  const out = [];
  // cubes 1/4 unit on an edge: lq x wq x hq of them, each 1/64 of a cubic unit
  const cubes = lq * wq * hq;
  const volume = cubes / 64;
  if (Math.abs(result.value - volume) > 1e-12) out.push(`value ${result.value} is not ${volume}`);
  const layerCubes = lq * wq; // cubes in one quarter-unit layer
  const t = texts(svg);
  const baseText = `${say(lq)} × ${say(wq)} = ${say64(layerCubes * 4)}`;
  if (!t.includes(`Base: ${baseText}`)) out.push(`the picture does not print "Base: ${baseText}"`);
  const volText = `volume = ${say64(layerCubes * 4)} × ${say(hq)} = ${say64(cubes)}`;
  if (!t.includes(volText)) out.push(`the picture does not print "${volText}"`);
  if (result.equation !== `${say(lq)} × ${say(wq)} × ${say(hq)} = ${say64(cubes)}`)
    out.push(`equation "${result.equation}"`);
  for (const want of [`length ${say(lq)}`, `width ${say(wq)}`, `height ${say(hq)}`])
    if (!t.includes(want)) out.push(`the picture does not print "${want}"`);
  // quarter marks: (4l - 1) + (4w - 1) lines on the base and (4h - 1) layer lines
  const marks = (svg.match(/class="gridline"/g) || []).length;
  if (marks !== lq - 1 + (wq - 1) + (hq - 1))
    out.push(`${marks} quarter marks, expected ${lq - 1 + (wq - 1) + (hq - 1)}`);
  const rects = [
    ...svg.matchAll(
      /<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="([\d.]+)" class="(shape|shape-alt)"/g,
    ),
  ].map((m) => m.slice(1).map((v, i) => (i < 2 ? Number(v) : v)));
  if (rects.length !== 2)
    out.push(`${rects.length} rectangles, expected the base and the height column`);
  else {
    const [bw, bh] = rects[0];
    if (Math.abs(bw / (lq / 4) - bh / (wq / 4)) > 0.2) out.push("the base is not drawn to scale");
    if (Math.abs(rects[1][1] / (hq / 4) - (bw / (lq / 4)) * (60 / 64)) > 0.4)
      out.push("the height column is not drawn to its own scale");
  }
  return out;
}

let n = 0;
for (let lq = 2; lq <= 16; lq++)
  for (let wq = 2; wq <= 12; wq++)
    for (let hq = 2; hq <= 12; hq++) {
      const values = [lq / 4, wq / 4, hq / 4];
      const result = evaluate(model, values, {});
      const found = problems(lq, wq, hq, result, visual(model, values, result));
      assert.deepEqual(found, [], `${values.join(" × ")}: ${found.join("; ")}`);
      n++;
    }
assert.equal(n, 15 * 11 * 11);

// the exact cases the lesson names
assert.equal(evaluate(model, [1.5, 1, 2], {}).value, 3); // 24 half-unit cubes at 1/8 each
assert.equal(evaluate(model, [0.75, 2, 1], {}).value, 1.5); // 96 quarter-unit cubes at 1/64 each
assert.equal(evaluate(model, [1.5, 1, 2], {}).equation, "1 1/2 × 1 × 2 = 3");

// controls and guards
assert.deepEqual(
  controls(model).map((c) => [c.min, c.max, c.step]),
  [
    [0.5, 4, 0.25],
    [0.5, 3, 0.25],
    [0.5, 3, 0.25],
  ],
);
for (const bad of [
  [0.25, 1, 1],
  [4.25, 1, 1],
  [1, 3.25, 1],
  [1, 1, 0.3],
  [1.1, 1, 1],
])
  assert.throws(() => evaluate(model, bad, {}), /Choose a/);

// mission puzzles unlock the height and have a target a student can plan
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(model, round, level);
    assert.equal(q.free, 2);
    assert.ok(Math.abs(evaluate(model, q.goal).value - q.target) < 1e-9);
    assert.ok(
      Math.abs(q.target * 100 - Math.round(q.target * 100)) < 1e-6,
      `target ${q.target} is a terminating decimal`,
    );
  }

// corruption is rejected
{
  const result = evaluate(model, [1.5, 1, 2], {});
  const svg = visual(model, [1.5, 1, 2], result);
  assert.deepEqual(problems(6, 4, 8, result, svg), []);
  assert.ok(problems(6, 4, 8, { ...result, value: 3.5 }, svg).length);
  assert.ok(
    problems(
      6,
      4,
      8,
      result,
      svg
        .replace("volume = 1 1/2 × 2 = 3", "x")
        .replace("Base: 1 1/2 × 1 = 1 1/2", "Base: 1 × 1 = 1"),
    ).length,
  );
}
console.log(
  `area:crate: ${n} settings re-derived by counting quarter-unit cubes, quarter marks counted, corruption rejected.`,
);
