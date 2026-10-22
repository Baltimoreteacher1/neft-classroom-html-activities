// decimal:columns (lesson 2-11): decimals added and subtracted in place-value columns. This re-derives every number the model prints
// with a separately written method (BigInt hundredths, digit strings, a borrow-flag column pass, never the module's own cents/column
// code), parses the picture to confirm it prints what the readout claims (the aligned rows, the annexed zeros, the regroup marks and
// the answer), sweeps the whole difference range to prove it is never negative, and proves a corrupted picture or readout is rejected.
//
//   node tools/studio-model-decimal-columns.test.mjs
import assert from "node:assert/strict";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const mkModel = (values) => ({ kind: "decimal", mode: "columns", values });

// ---- the independent derivation -------------------------------------------------------------------------------------------------
const hundredths = (v) => BigInt(v.toFixed(2).replace(".", ""));
const ownPlaces = (v) => v.toFixed(2).split(".")[1].replace(/0+$/, "").length;
/** BigInt hundredths -> text with `dp` decimal places (the places beyond dp must be zeros). */
function written(h, dp) {
  const s = h.toString().padStart(3, "0");
  const whole = String(BigInt(s.slice(0, -2))),
    frac = s.slice(-2);
  assert.ok(/^0*$/.test(frac.slice(dp)), "places beyond dp are zeros");
  return dp ? `${whole}.${frac.slice(0, dp)}` : whole;
}
/** Five columns (hundreds ... hundredths) of an amount in hundredths, as numbers. */
const columns = (h) => h.toString().padStart(5, "0").slice(-5).split("").map(Number);

/** The classic borrow-flag pass: counts the columns that carry (add) or regroup (subtract). */
function passes(top, bot, op) {
  let flag = 0,
    events = 0;
  const carryOut = [];
  for (let j = 4; j >= 0; j--) {
    if (op === 1) {
      const s = top[j] + bot[j] + flag;
      flag = s >= 10 ? 1 : 0;
      if (flag) {
        events++;
        carryOut.push(j);
      }
    } else {
      const short = top[j] - flag < bot[j];
      flag = short ? 1 : 0;
      if (short) events++;
    }
  }
  return { events, carryOut };
}

function expectedFor(values) {
  const [a, b, op] = values;
  const A = hundredths(a),
    B = hundredths(b),
    R = op === 1 ? A + B : A - B;
  const dp = Math.max(ownPlaces(a), ownPlaces(b));
  const top = columns(A),
    bot = columns(B),
    res = columns(R);
  return {
    A,
    B,
    R,
    dp,
    top,
    bot,
    res,
    op,
    ...passes(top, bot, op),
    sym: op === 1 ? "+" : "−",
    own: [ownPlaces(a), ownPlaces(b)],
  };
}

// ---- reading the picture ---------------------------------------------------------------------------------------------------------
function read(svg) {
  const rows = { top: [], bottom: [], result: [], carry: [], adjust: [], strike: [] };
  for (const m of svg.matchAll(
    /<text [^>]*data-row="(\w+)" data-col="(\d)"(?: data-kind="(\w+)")?[^>]*>([^<]*)<\/text>/g,
  ))
    rows[m[1]].push({ col: Number(m[2]), kind: m[3] || "mark", text: m[4] });
  for (const m of svg.matchAll(/<line [^>]*data-row="strike" data-col="(\d)"/g))
    rows.strike.push({ col: Number(m[1]) });
  rows.operator = (svg.match(/data-row="operator"[^>]*>([^<]*)</) || [])[1];
  rows.texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  return rows;
}
const rowText = (cells) => {
  const ints = cells
    .filter((c) => c.col < 3)
    .sort((x, y) => x.col - y.col)
    .map((c) => c.text)
    .join("");
  const dec = cells
    .filter((c) => c.col >= 3)
    .sort((x, y) => x.col - y.col)
    .map((c) => c.text)
    .join("");
  return dec ? `${ints}.${dec}` : ints;
};

/** Everything the model prints, checked against the independent derivation. Returns a list of problems (empty when it all holds). */
function problemsFor(values, readout, svg) {
  const bad = [],
    e = expectedFor(values),
    p = read(svg);
  const num = (h) => Number(h) / 100;
  if (readout.value !== num(e.R)) bad.push(`readout ${readout.value} != ${num(e.R)}`);
  if (readout.value <= 0) bad.push("the readout is not positive");
  if (
    readout.equation !==
    `${written(e.A, e.dp)} ${e.sym} ${written(e.B, e.dp)} = ${written(e.R, e.dp)}`
  )
    bad.push(`equation "${readout.equation}"`);
  // the rows: decimal points lined up (same columns), zeros annexed so both rows have dp places, then the answer
  if (rowText(p.top) !== written(e.A, e.dp)) bad.push(`top row ${rowText(p.top)}`);
  if (rowText(p.bottom) !== written(e.B, e.dp)) bad.push(`bottom row ${rowText(p.bottom)}`);
  if (rowText(p.result) !== written(e.R, e.dp)) bad.push(`answer row ${rowText(p.result)}`);
  if (p.operator !== e.sym) bad.push(`operator ${p.operator}`);
  // every digit sits in its own place-value column: the columns a row occupies are those its digits need, ones always included
  for (const [name, h] of [
    ["top", e.A],
    ["bottom", e.B],
    ["result", e.R],
  ]) {
    const whole = Number(h) / 100,
      want = [
        2,
        ...(whole >= 10 ? [1] : []),
        ...(whole >= 100 ? [0] : []),
        ...[3, 4].filter((j) => j - 2 <= e.dp),
      ]
        .sort()
        .join();
    if (
      p[name]
        .map((c) => c.col)
        .sort()
        .join() !== want
    )
      bad.push(
        `${name} row occupies columns ${p[name]
          .map((c) => c.col)
          .sort()
          .join()}, expected ${want}`,
      );
  }
  [
    ["top", 0],
    ["bottom", 1],
  ].forEach(([name, i]) => {
    const annex = p[name].filter((c) => c.kind === "annex");
    if (annex.length !== e.dp - e.own[i])
      bad.push(`${name}: ${annex.length} annexed zeros, expected ${e.dp - e.own[i]}`);
    if (annex.some((c) => c.text !== "0")) bad.push(`${name}: an annexed digit is not a zero`);
    if (p[name].filter((c) => c.kind === "digit" && c.col >= 3).length !== e.own[i])
      bad.push(`${name}: wrong number of real decimal digits`);
  });
  const wantLabels = (e.own[0] < e.dp ? 1 : 0) + (e.own[1] < e.dp ? 1 : 0);
  if (p.texts.filter((t) => /^annexed zeros?$/.test(t)).length !== wantLabels)
    bad.push("annexed-zero label count");
  if (
    [...svg.matchAll(/<rect [^>]*stroke-dasharray/g)].length !==
    e.dp - e.own[0] + (e.dp - e.own[1])
  )
    bad.push("an annexed zero is not outlined");
  // regroup marks
  if (e.op === 1) {
    const want = e.carryOut
      .filter((j) => j > 0)
      .map((j) => j - 1)
      .sort()
      .join();
    if (
      p.carry
        .map((c) => c.col)
        .sort()
        .join() !== want ||
      p.carry.some((c) => c.text !== "1")
    )
      bad.push("carry marks");
    if (p.adjust.length || p.strike.length) bad.push("an addition shows subtraction marks");
  } else {
    const eff = e.top.map((d, j) => {
      const m = p.adjust.find((c) => c.col === j);
      return m ? Number(m.text) : d;
    });
    const sum = eff.reduce((s, d, j) => s + d * 10 ** (4 - j), 0);
    if (sum !== Number(e.A)) bad.push(`adjusted top digits sum to ${sum}, not ${e.A}`);
    eff.forEach((d, j) => {
      if (d - e.bot[j] !== e.res[j] || d - e.bot[j] < 0 || d - e.bot[j] > 9)
        bad.push(`column ${j}: ${d} - ${e.bot[j]} is not the answer digit ${e.res[j]}`);
    });
    if (
      p.strike
        .map((c) => c.col)
        .sort()
        .join() !==
      p.adjust
        .map((c) => c.col)
        .sort()
        .join()
    )
      bad.push("struck digits and adjusted digits disagree");
    if (p.carry.length) bad.push("a subtraction shows carries");
  }
  const caption = e.events
    ? `Regrouped ${e.events} ${e.events === 1 ? "time" : "times"}: see the small digits in the regroup row.`
    : "No regrouping was needed.";
  if (!p.texts.includes(caption)) bad.push(`caption "${caption}" missing`);
  if (
    !readout.note.includes(
      e.events
        ? `regrouping ${e.events} ${e.events === 1 ? "time" : "times"}`
        : "no regrouping is needed",
    )
  )
    bad.push("note disagrees about regrouping");
  if (
    e.dp === 0
      ? !readout.note.includes("whole numbers")
      : e.own[0] === e.own[1]
        ? !readout.note.includes("no zero is annexed")
        : !readout.note.includes("annexed")
  )
    bad.push("note disagrees about annexing");
  return bad;
}

// ---- 40+ settings: extremes, whole numbers, tenths only, hundredths, hundreds, both operations ----------------------------------
const settings = [
  [46.8, 3.75, 1],
  [46.8, 3.75, 2],
  [10, 0.05, 1],
  [10, 0.05, 2],
  [10, 9.95, 1],
  [10, 9.95, 2],
  [200, 0.05, 1],
  [200, 0.05, 2],
  [200, 9.95, 1],
  [200, 9.95, 2],
  [100, 0.05, 2],
  [100, 9.95, 2],
  [128.75, 9.95, 2],
  [199.95, 9.95, 1],
  [199.95, 9.95, 2],
  [46, 9, 1],
  [46, 9, 2],
  [12.5, 3.5, 1],
  [12.5, 3.5, 2],
  [10.05, 9.95, 2],
  [10.05, 9.95, 1],
  [99.95, 0.05, 1],
  [90, 9.9, 2],
  [80.4, 0.4, 2],
  [15.7, 8.35, 2],
  [12.4, 3.75, 1],
  [31.4, 6.75, 2],
  [71.4, 3.75, 2],
  [52.35, 5.55, 1],
  [67.65, 3.75, 1],
  [60.1, 9.95, 2],
  [50, 0.05, 2],
];
let seed = 20261022;
const rnd = (k) => Math.floor(((seed = (seed * 48271) % 2147483647) / 2147483647) * k);
for (let i = 0; i < 24; i++) {
  const a = Number((10 + 0.05 * rnd(3801)).toFixed(2)),
    b = Number((0.05 + 0.05 * rnd(199)).toFixed(2));
  settings.push([a, b, 1 + (i % 2)]);
}

let checked = 0;
for (const values of settings) {
  const model = mkModel(values);
  assert.equal(controls(model).length, 3, "three controls");
  const readout = evaluate(model, values);
  const svg = visual(model, values, readout);
  const bad = problemsFor(values, readout, svg);
  assert.deepEqual(bad, [], `${values.join(" / ")}: ${bad.join("; ")}`);
  checked++;
}
assert.ok(checked >= 30, `only ${checked} settings checked`);

// a difference is never negative or zero anywhere the controls allow: every second number against a strided sweep of first numbers
{
  let worst = Infinity,
    n = 0;
  for (let ia = 0; ia <= 3800; ia += 37)
    for (let ib = 0; ib <= 198; ib++) {
      const a = Number((10 + 0.05 * ia).toFixed(2)),
        b = Number((0.05 + 0.05 * ib).toFixed(2));
      const r = evaluate(mkModel([a, b, 2]), [a, b, 2]);
      worst = Math.min(worst, r.value);
      n++;
      assert.equal(r.value, Number(hundredths(a) - hundredths(b)) / 100, `${a} - ${b}`);
    }
  assert.ok(worst > 0, `the smallest difference is ${worst}`);
  assert.equal(Number(worst.toFixed(2)), 0.05, "the smallest difference is 10 - 9.95");
  assert.ok(n > 20000);
}

// values the controls forbid are refused, not drawn
assert.throws(() => evaluate(mkModel([46.8, 3.75, 1]), [9.95, 3.75, 2]), /First number/);
assert.throws(() => evaluate(mkModel([46.8, 3.75, 1]), [46.8, 10, 2]), /Second number/);
assert.throws(() => evaluate(mkModel([46.8, 3.75, 1]), [46.8, 3.755, 1]), /Second number/);
assert.throws(() => evaluate(mkModel([46.8, 3.75, 1]), [46.8, 3.75, 3]), /Operation/);
assert.throws(() => evaluate(mkModel([46.8, 3.75, 1]), [46.8, 3.75]), /needs a first number/);

// the mission: each round is solved by exactly one setting of the unlocked number, found by brute force with BigInt arithmetic
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(mkModel([46.8, 3.75, 1]), round, level);
    const fields = controls(mkModel(q.start));
    q.start.forEach((v, i) =>
      assert.ok(v >= fields[i].min - 1e-9 && v <= fields[i].max + 1e-9, "start inside its control"),
    );
    q.goal.forEach((v, i) =>
      assert.ok(v >= fields[i].min - 1e-9 && v <= fields[i].max + 1e-9, "goal inside its control"),
    );
    const f = fields[q.free],
      steps = Math.round((f.max - f.min) / f.step);
    let hits = 0;
    for (let i = 0; i <= steps; i++) {
      const trial = [...q.start];
      trial[q.free] = Number((f.min + i * f.step).toFixed(2));
      const [a, b, op] = trial,
        r = op === 1 ? hundredths(a) + hundredths(b) : hundredths(a) - hundredths(b);
      if (Number(r) / 100 === q.target) hits++;
    }
    assert.equal(hits, 1, `round ${round} level ${level}: ${hits} settings reach ${q.target}`);
    assert.notEqual(evaluate(mkModel(q.start), q.start).value, q.target, "never starts solved");
  }

// the check itself rejects corruption
{
  const values = [46.8, 3.75, 2];
  const model = mkModel(values);
  const readout = evaluate(model, values);
  const svg = visual(model, values, readout);
  assert.deepEqual(problemsFor(values, readout, svg), [], "the honest picture passes");
  assert.ok(
    problemsFor(values, { ...readout, value: 43.5 }, svg).length,
    "a wrong readout is caught",
  );
  assert.ok(
    problemsFor(values, { ...readout, equation: readout.equation.replace("43.05", "43.50") }, svg)
      .length,
    "a wrong equation is caught",
  );
  assert.ok(
    problemsFor(
      values,
      readout,
      svg.replace(
        'data-row="result" data-col="4" data-kind="digit">5<',
        'data-row="result" data-col="4" data-kind="digit">6<',
      ),
    ).length,
    "a wrong answer digit is caught",
  );
  assert.ok(
    problemsFor(values, readout, svg.replace('data-kind="annex">0<', 'data-kind="digit">0<'))
      .length,
    "an annexed zero shown as a real digit is caught",
  );
  assert.ok(
    problemsFor(
      values,
      readout,
      svg.replace('data-row="adjust" data-col="3">7<', 'data-row="adjust" data-col="3">6<'),
    ).length,
    "a wrong regroup digit is caught",
  );
  assert.ok(
    problemsFor(values, readout, svg.replace('data-row="operator">−<', 'data-row="operator">+<'))
      .length,
    "a wrong operator is caught",
  );
  const shifted = svg.replace(/data-row="bottom" data-col="2"/, 'data-row="bottom" data-col="1"');
  assert.ok(problemsFor(values, readout, shifted).length, "a misaligned column is caught");
}
console.log(
  `studio-model-decimal-columns: ${checked} settings re-derived independently, no negative difference over the whole range, mission rounds proven, corruption rejected.`,
);
