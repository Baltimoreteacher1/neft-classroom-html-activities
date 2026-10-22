// area:apothem (lesson 5-9): the numbers the model prints are re-derived INDEPENDENTLY of models/area-apothem.mjs.
//
//   node tools/studio-model-area-apothem.test.mjs
//
// The reference never calls the module's own formula. It builds the regular polygon from its circumradius, takes the apothem from the
// Pythagorean theorem (not from a tangent), and gets the area with the shoelace formula over the vertex coordinates (not n x side x apothem / 2).
import assert from "node:assert/strict";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";
import { registered } from "../curriculum/learning-labs/shared/models/index.mjs";

const model = { kind: "area", mode: "apothem", values: [4, 3] };
assert.ok(registered(model), "area:apothem is registered");

/** Independent reference: polygon vertices on a circle, shoelace area, apothem from R and half a side. */
function reference(n, side) {
  const circumradius = side / (2 * Math.sin(Math.PI / n));
  const apothem = Math.sqrt(circumradius ** 2 - (side / 2) ** 2);
  const pts = Array.from({ length: n }, (_, k) => [
    circumradius * Math.cos((2 * Math.PI * k) / n),
    circumradius * Math.sin((2 * Math.PI * k) / n),
  ]);
  let twice = 0;
  for (let k = 0; k < n; k++) {
    const [x1, y1] = pts[k],
      [x2, y2] = pts[(k + 1) % n];
    twice += x1 * y2 - x2 * y1;
  }
  const dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
  assert.ok(Math.abs(dist - side) < 1e-9, "the reference polygon has the asked side");
  return { apothem, area: Math.abs(twice) / 2 };
}
const two = (x) => Number(x.toFixed(2)).toString();

/** Every problem found between what the model printed and the reference. Empty when the model is right. */
function problems(n, side, result, svg) {
  const ref = reference(n, side),
    out = [];
  const texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  const has = (s) => texts.includes(s);
  const sym = (x) => (Math.abs(x - Number(two(x))) < 1e-9 ? "=" : "≈");
  const triangle = (side * ref.apothem) / 2;
  if (Math.abs(result.value - ref.area) > 1e-6)
    out.push(`value ${result.value} is not ${ref.area}`);
  const want = [
    `base = a side = ${side}`,
    `height = apothem ${sym(ref.apothem)} ${two(ref.apothem)}`,
    `area = ½ × ${side} × ${two(ref.apothem)} ${sym(triangle)} ${two(triangle)}`,
    `${n} triangles in all, one for each side`,
    `total = ${n} × ${two(triangle)} ${sym(ref.area)} ${two(ref.area)}`,
    `Area of the polygon ${sym(ref.area)} ${two(ref.area)}`,
    `side ${side}`,
    "apothem",
  ];
  for (const w of want) if (!has(w)) out.push(`the picture does not print "${w}"`);
  for (let k = 1; k <= n; k++)
    if (!has(String(k))) out.push(`the picture does not number triangle ${k}`);
  if (has(String(n + 1))) out.push(`the picture numbers more than ${n} triangles`);
  if (
    result.equation !== `${n} × ${side} × ${two(ref.apothem)} ÷ 2 ${sym(ref.area)} ${two(ref.area)}`
  )
    out.push(`equation "${result.equation}" is wrong`);
  if (!/rounded/.test(result.note) === (sym(ref.area) === "≈"))
    out.push("the note must say the apothem is rounded exactly when it is");
  // the drawn figure has n triangles from the centre: n+? polygons, one of them yellow, and a dashed apothem
  if ((svg.match(/class="shape-light"/g) || []).length !== n - 1)
    out.push("wrong number of unhighlighted triangles");
  if ((svg.match(/class="shape"/g) || []).length !== 1)
    out.push("exactly one triangle is highlighted");
  if ((svg.match(/class="dashed"/g) || []).length !== 1) out.push("one dashed apothem");
  return out;
}

const f = controls(model);
assert.equal(f.length, 2, "two controls");
assert.deepEqual([f[0].min, f[0].max, f[1].min, f[1].max], [3, 8, 1, 12]);

let checked = 0;
for (let n = 3; n <= 8; n++)
  for (const side of [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12]) {
    const values = [n, side],
      r = evaluate(model, values, {});
    const found = problems(n, side, r, visual({ ...model, values }, values, r));
    assert.deepEqual(found, [], `n=${n} side=${side}: ${found.join("; ")}`);
    checked++;
  }
assert.ok(checked >= 30, `${checked} settings checked`);

// known values worked by hand
assert.equal(evaluate(model, [4, 8]).value, 64);
assert.ok(Math.abs(evaluate(model, [6, 6]).value - 93.5307) < 1e-3);
assert.ok(Math.abs(reference(3, 2).area - Math.sqrt(3)) < 1e-9);

// the check rejects a corrupted model
{
  const values = [6, 6],
    r = evaluate(model, values),
    svg = visual({ ...model, values }, values, r);
  assert.ok(
    problems(6, 6, { ...r, value: r.value + 1 }, svg).length > 0,
    "a wrong value is caught",
  );
  assert.ok(
    problems(6, 6, r, svg.replaceAll("≈ 93.53", "≈ 93.35")).length > 0,
    "a wrong printed total is caught",
  );
  assert.ok(
    problems(6, 6, r, svg.replaceAll("apothem ≈ 5.2", "apothem ≈ 5.3")).length > 0,
    "a wrong printed apothem is caught",
  );
  assert.ok(
    problems(6, 6, { ...r, equation: r.equation.replace("5.2", "5.3") }, svg).length > 0,
    "a wrong equation is caught",
  );
}

// the mission rounds: each target is the independent area of the goal setting, and the unlocked control is the side length
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(model, round, level);
    assert.equal(q.free, 1);
    assert.equal(q.start[0], q.goal[0], "the number of sides is fixed in a round");
    assert.notEqual(q.start[1], q.goal[1], "the round does not start solved");
    assert.ok(
      Math.abs(q.target - reference(q.goal[0], q.goal[1]).area) < 1e-6,
      `r${round} L${level}: target is the polygon's area`,
    );
  }

console.log(
  `studio-model-area-apothem: ${checked} settings checked against the shoelace area, mission rounds and corruption checks pass.`,
);
