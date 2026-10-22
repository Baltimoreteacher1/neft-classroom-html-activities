// factors:regroup (lesson 6-8): the numbers the model prints are re-derived INDEPENDENTLY of models/factors-regroup.mjs.
//
//   node tools/studio-model-factors-regroup.test.mjs
//
// The reference counts a product by brute force (one tally per item in a 3-D block of a x b x c), picks the line-2 order and the
// parentheses from where the left-out factor sits, and the check reads the printed numbers back out of the SVG text.
import assert from "node:assert/strict";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";
import { registered } from "../curriculum/learning-labs/shared/models/index.mjs";

const model = { kind: "factors", mode: "regroup", values: [5, 12, 8, 1] };
assert.ok(registered(model), "factors:regroup is registered");

const PAIR = { 1: [0, 1], 2: [0, 2], 3: [1, 2] };
const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** A block of a x b x c unit cubes, counted one by one. */
function count(a, b, c) {
  let t = 0;
  for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) for (let k = 0; k < c; k++) t++;
  return t;
}
/** Everything the picture must show, from the three factors and the pair. */
function reference(f, p) {
  const pair = PAIR[p],
    left = [0, 1, 2].find((i) => !pair.includes(i));
  const order = left === 1 ? [0, 2, 1] : [0, 1, 2]; // the left-out factor jumps to the end only when it sits between the pair
  const bracketAt = left === 0 ? 1 : 0; // the pair is the first two places of the new order unless the left-out factor leads
  const pairProduct = count(f[pair[0]], f[pair[1]], 1);
  return { order, bracketAt, pairProduct, total: count(f[0], f[1], f[2]), left };
}

/** Every problem between the model's printout and the reference. Empty when the model is right. */
function problems(f, p, result, svg) {
  const out = [],
    ref = reference(f, p);
  const texts = [...svg.matchAll(/<text\b[^>]*font-size="(\d+)"[^>]*>([^<]*)<\/text>/g)].map(
    (m) => [Number(m[1]), m[2]],
  );
  const sized = (px) => texts.filter(([s]) => s === px).map(([, t]) => t);
  if (result.value !== ref.pairProduct) out.push(`value ${result.value} is not ${ref.pairProduct}`);
  const numbers = sized(22).map(Number);
  const want = [...f, ...ref.order.map((i) => f[i]), ...ref.order.map((i) => f[i])];
  if (JSON.stringify(numbers) !== JSON.stringify(want))
    out.push(`token numbers ${numbers} should be ${want}`);
  const rest = f[ref.left],
    V = comma(ref.total),
    P = comma(ref.pairProduct);
  const lines = sized(18);
  const wantLines = [
    `= ${V}`,
    `= ${V}`,
    ref.bracketAt === 0 ? `= ${P} × ${rest} = ${V}` : `= ${rest} × ${P} = ${V}`,
  ];
  if (JSON.stringify(lines) !== JSON.stringify(wantLines))
    out.push(`value lines ${lines.join(" | ")} should be ${wantLines.join(" | ")}`);
  const parens = sized(28);
  if (JSON.stringify(parens) !== JSON.stringify(["(", ")"]))
    out.push("line 3 needs one pair of parentheses");
  const [x, y] = PAIR[p].map((i) => f[i]);
  const eq =
    ref.bracketAt === 0
      ? `(${f[ref.order[0]]} × ${f[ref.order[1]]}) × ${f[ref.order[2]]}`
      : `${f[ref.order[0]]} × (${f[ref.order[1]]} × ${f[ref.order[2]]})`;
  if (
    result.equation !==
    `${eq} = ${ref.bracketAt === 0 ? `${P} × ${rest}` : `${rest} × ${P}`} = ${V}`
  )
    out.push(`equation "${result.equation}" is wrong`);
  if (!result.note.startsWith(`${x} × ${y} = ${P}`))
    out.push("the note must start with the pair's product");
  if (/friendly/.test(result.note) !== (ref.pairProduct % 10 === 0))
    out.push("friendly only when the pair's product is a multiple of 10");
  if (/identity/.test(result.note) !== f.includes(1))
    out.push("identity is named exactly when a factor is 1");
  // yellow = the pair in lines 1-3 (6 tokens) + the legend; light = the left-out factor in each line + the legend
  if (
    (svg.match(/class="shape"/g) || []).length !== 7 ||
    (svg.match(/class="shape-light"/g) || []).length !== 4
  )
    out.push("pair highlighting is wrong");
  const same = ref.order.every((v, i) => v === i);
  if (!svg.includes(same ? "(order unchanged)" : "(commutative property)"))
    out.push("the middle line must say whether the order changed");
  return out;
}

const f = controls(model);
assert.deepEqual(
  f.map((c) => [c.min, c.max]),
  [
    [1, 25],
    [1, 25],
    [1, 25],
    [1, 3],
  ],
);

// the settings: every extreme and a spread of products, with all three pairs
const picks = [1, 2, 4, 5, 8, 10, 13, 17, 20, 24, 25];
const settings = [];
for (let i = 0; i < picks.length; i++) {
  const triple = [picks[i], picks[(i * 3 + 1) % picks.length], picks[(i * 7 + 2) % picks.length]];
  for (const p of [1, 2, 3]) settings.push([...triple, p]);
}
for (const p of [1, 2, 3])
  settings.push([1, 1, 1, p], [25, 25, 25, p], [4, 17, 25, p], [7, 20, 5, p], [25, 1, 25, p]);
assert.ok(settings.length >= 30, `${settings.length} settings`);
for (const values of settings) {
  const r = evaluate(model, values, {});
  const found = problems(values.slice(0, 3), values[3], r, visual({ ...model, values }, values, r));
  assert.deepEqual(found, [], `${values.join(",")}: ${found.join("; ")}`);
}

// worked by hand: 4 x 17 x 25 = 4 x 25 x 17 = 100 x 17 = 1,700
{
  const r = evaluate(model, [4, 17, 25, 2]);
  assert.equal(r.value, 100);
  assert.equal(r.equation, "(4 × 25) × 17 = 100 × 17 = 1,700");
}

// the check rejects corrupted output
{
  const values = [4, 17, 25, 2],
    r = evaluate(model, values),
    svg = visual({ ...model, values }, values, r);
  assert.ok(
    problems([4, 17, 25], 2, { ...r, value: 68 }, svg).length > 0,
    "a wrong value is caught",
  );
  assert.ok(
    problems([4, 17, 25], 2, r, svg.replaceAll("1,700", "1,070")).length > 0,
    "a wrong printed value is caught",
  );
  assert.ok(
    problems([4, 17, 25], 2, r, svg.replace(">25<", ">26<")).length > 0,
    "a wrong factor in the picture is caught",
  );
  assert.ok(
    problems([4, 17, 25], 2, { ...r, equation: "(4 × 25) × 17 = 100 × 17 = 1,600" }, svg).length >
      0,
    "a wrong equation is caught",
  );
  assert.ok(problems([4, 17, 25], 1, r, svg).length > 0, "a picture of another pair is caught");
}

// invalid settings are refused in words, never drawn
assert.throws(() => evaluate(model, [0, 5, 5, 1]), /whole-number factors/);
assert.throws(() => evaluate(model, [5, 5, 5, 4]), /pair/);

// mission rounds: one factor of the grouped pair is unlocked, the target is the independent product of the pair at the goal
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(model, round, level),
      p = q.start[3];
    assert.ok(
      PAIR[p].includes(q.free),
      `r${round} L${level}: the unlocked factor is in the grouped pair`,
    );
    assert.equal(q.goal[3], p);
    const fixed = PAIR[p].find((i) => i !== q.free);
    assert.equal(
      q.target,
      count(q.goal[fixed], q.goal[q.free], 1),
      `r${round} L${level}: target is the pair's product`,
    );
    assert.equal(q.target % 10, 0, "the target is a friendly multiple of 10");
    assert.notEqual(q.start[q.free], q.goal[q.free], "the round does not start solved");
    assert.deepEqual(
      q.start.filter((_, i) => i !== q.free),
      q.goal.filter((_, i) => i !== q.free),
      "only the unlocked factor differs",
    );
  }

console.log(
  `studio-model-factors-regroup: ${settings.length} settings checked against a brute-force count, mission rounds and corruption checks pass.`,
);
