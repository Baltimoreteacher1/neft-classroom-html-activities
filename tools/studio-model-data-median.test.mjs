// data:median (lesson 2-3): the median is found by counting in from both ends. This re-derives every number the model prints with a
// separately written method (a hand-rolled sort and a two-pointer walk in from both ends, never util.median or the module's own
// evaluate) over 40+ settings, parses the picture to confirm it prints what the readout claims, and proves a corrupted picture or
// readout is rejected by the same check.
//
//   node tools/studio-model-data-median.test.mjs
import assert from "node:assert/strict";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const mkModel = (values) => ({ kind: "data", mode: "median", values });

/** Independent: insertion sort, then walk in from both ends crossing off one value at each end until one or two are left. */
function countInFromBothEnds(values) {
  const s = [];
  for (const v of values) {
    let i = s.length;
    while (i > 0 && s[i - 1] > v) i--;
    s.splice(i, 0, v);
  }
  let lo = 0,
    hi = s.length - 1,
    pairs = 0;
  while (hi - lo > 1) {
    lo++;
    hi--;
    pairs++;
  }
  return { sorted: s, lo, hi, pairs, median: (s[lo] + s[hi]) / 2 };
}

const texts = (svg) =>
  [...svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map((m) => ({ attrs: m[1], body: m[2] }));
const num = (s) => Number(s);

/** Everything the model prints, checked against the independent derivation. Returns a list of problems (empty when it all holds). */
function problemsFor(values, readout, svg) {
  const bad = [];
  const want = countInFromBothEnds(values);
  const n = values.length;
  if (readout.value !== want.median) bad.push(`readout ${readout.value} != ${want.median}`);
  if (!readout.equation.startsWith(want.sorted.join(", ") + ":"))
    bad.push("equation does not list the ordered values");
  if (!readout.equation.endsWith(`= ${want.median}`))
    bad.push("equation does not end at the median");
  if (
    n % 2 === 0 &&
    !readout.equation.includes(`(${want.sorted[want.lo]} + ${want.sorted[want.hi]}) ÷ 2`)
  )
    bad.push("even count: the equation does not average the two middle values");
  // the ordered cells (20px numbers), in order
  const cells = texts(svg)
    .filter((t) => /font-size="20"/.test(t.attrs))
    .map((t) => num(t.body));
  if (JSON.stringify(cells) !== JSON.stringify(want.sorted))
    bad.push(`ordered row ${cells} != ${want.sorted}`);
  // pairs crossed off: one bracket label per pair, one strike per crossed cell
  const pairLabels = texts(svg)
    .filter((t) => /^pair \d+$/.test(t.body))
    .map((t) => t.body);
  if (pairLabels.length !== want.pairs)
    bad.push(`${pairLabels.length} pair labels, expected ${want.pairs}`);
  const strikes = [...svg.matchAll(/<line [^>]*stroke-width:1\.5/g)].length;
  const middles = want.lo === want.hi ? 1 : 2;
  if (strikes !== n - middles) bad.push(`${strikes} crossed-off cells, expected ${n - middles}`);
  if (!texts(svg).some((t) => t.body === (middles === 1 ? "middle" : "middle two")))
    bad.push("the middle is not labelled");
  if (!texts(svg).some((t) => t.body === `median = ${want.median}`))
    bad.push("the median label is missing or wrong");
  // dots: one per observation at the right place on the axis; ringed dots are the middle value(s)
  const axisMax = Math.max(10, Math.ceil(Math.max(...values) / 10) * 10);
  const dots = [
    ...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="6" class="(point|point-alt)"/g),
  ].filter((m) => num(m[2]) > 30);
  const xs = dots.map((m) => num(m[1])).sort((a, b) => a - b);
  const expectedXs = want.sorted.map((v) => 40 + (v / axisMax) * 640).sort((a, b) => a - b);
  if (xs.length !== n || xs.some((x, i) => Math.abs(x - expectedXs[i]) > 1e-6))
    bad.push("dot positions do not match the values");
  if (dots.filter((m) => m[3] === "point-alt").length !== middles)
    bad.push("wrong number of middle dots");
  // the median line sits at the median
  const line = svg.match(/<line x1="([\d.]+)" y1="44" x2="([\d.]+)"/);
  if (!line || Math.abs(num(line[1]) - (40 + (want.median / axisMax) * 640)) > 1e-6)
    bad.push("median line is not at the median");
  // caption names the middle
  const last = texts(svg).at(-1).body;
  if (!last.includes(String(want.median))) bad.push("caption does not state the median");
  if (middles === 1 && !last.includes(`${(n - 1) / 2} value`))
    bad.push("caption does not count the values on each side");
  if (
    middles === 2 &&
    want.sorted[want.lo] !== want.sorted[want.hi] &&
    !(last.includes(String(want.sorted[want.lo])) && last.includes(String(want.sorted[want.hi])))
  )
    bad.push("caption does not name the two middle values");
  return bad;
}

// 40+ settings: the bench start, the extremes, ties, every count 3-9 odd and even, and seeded pseudo-random lists
const settings = [
  [17, 7, 5, 19, 13, 6, 4, 21],
  [0, 0, 0],
  [50, 50, 50],
  [0, 50, 25],
  [50, 0], // [50, 0] is refused below (count 2)
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50, 50],
  [0, 50, 0, 50, 0, 50, 0, 50, 0],
  [5, 5, 5, 5, 5, 5, 5, 5],
  [1, 2, 2, 4, 12, 12, 30, 40, 50],
  [9, 9, 3, 50],
  [7, 13, 7, 13],
  [10, 20, 30, 40, 50, 0, 1, 2, 3],
  [23, 23, 24],
  [49, 50, 0, 1],
];
let seed = 12345;
const rnd = (k) => Math.floor(((seed = (seed * 48271) % 2147483647) / 2147483647) * k);
for (let n = 3; n <= 9; n++)
  for (let r = 0; r < 4; r++) settings.push(Array.from({ length: n }, () => rnd(51)));

let checked = 0;
for (const values of settings) {
  const model = mkModel(values);
  if (values.length < 3) {
    assert.throws(() => evaluate(model, values), /3 to 9/, "a count of 2 is refused");
    continue;
  }
  assert.equal(controls(model).length, values.length, "one control per observation");
  const readout = evaluate(model, values);
  const svg = visual(model, values, readout);
  const bad = problemsFor(values, readout, svg);
  assert.deepEqual(bad, [], `${values.join(",")}: ${bad.join("; ")}`);
  checked++;
}
assert.ok(checked >= 30, `only ${checked} settings checked`);

// out-of-range input is refused, not drawn
assert.throws(() => evaluate(mkModel([1, 2, 3, 4]), [1, 2, 3, 51]), /0 to 50/);
assert.throws(() => evaluate(mkModel([1, 2, 3]), [1, 2, Number.NaN]), /0 to 50/);
assert.throws(() => evaluate(mkModel(Array(10).fill(1)), Array(10).fill(1)), /3 to 9/);

// the mission: every round's goal is reached by one or two settings of the unlocked observation, found by brute force
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const model = mkModel([17, 7, 5, 19, 13, 6, 4, 21]);
    const q = puzzle(model, round, level);
    let hits = 0;
    for (let x = 0; x <= 50; x++) {
      const trial = [...q.start];
      trial[q.free] = x;
      if (countInFromBothEnds(trial).median === q.target) hits++;
    }
    assert.ok(
      hits >= 1 && hits <= 2,
      `round ${round} level ${level}: ${hits} settings reach ${q.target}`,
    );
    assert.notEqual(countInFromBothEnds(q.start).median, q.target, "a round never starts solved");
  }

// the check itself rejects a corrupted median, a corrupted picture and a corrupted readout
{
  const values = [17, 7, 5, 19, 13, 6, 4, 21];
  const model = mkModel(values);
  const readout = evaluate(model, values);
  const svg = visual(model, values, readout);
  assert.deepEqual(problemsFor(values, readout, svg), [], "the honest picture passes");
  assert.ok(
    problemsFor(values, { ...readout, value: 11 }, svg).length,
    "a wrong median value is caught",
  );
  assert.ok(
    problemsFor(values, readout, svg.replace("median = 10", "median = 11")).length,
    "a wrong median label is caught",
  );
  assert.ok(
    problemsFor(values, readout, svg.replace(">13</text>", ">14</text>")).length,
    "a wrong ordered cell is caught",
  );
  assert.ok(
    problemsFor(
      values,
      { ...readout, equation: readout.equation.replace("(7 + 13)", "(7 + 17)") },
      svg,
    ).length,
    "a wrong middle pair is caught",
  );
}
console.log(
  `studio-model-data-median: ${checked} settings re-derived independently, mission rounds proven, corruption rejected.`,
);
