// growth:table (lesson 9-1): the input/output table prints the rows it claims and marks the current input.
// Expectations are built here by repeated addition (the output after each extra hour), never by the module's formula, and the
// picture is read back by parsing its SVG text. Run: node tools/studio-model-growth-table.test.mjs
import assert from "node:assert/strict";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

/** The output for each input 0..n by repeated addition: start, then add `rate` once per hour. */
function outputsByAdding(rate, start, n) {
  const out = [start];
  for (let i = 0; i < n; i++) out.push(out[i] + rate);
  return out;
}

/** The inputs a table of this setting should list, in order, with null for the gap row. */
function expectedInputs(hours) {
  if (hours <= 6) return [0, 1, 2, 3, 4, 5, 6];
  return [0, 1, 2, 3, null, hours - 1, hours];
}

const texts = (svg) =>
  [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    s: m[3],
  }));
const count = (svg, cls) => (svg.match(new RegExp(`<rect [^>]*class="${cls}"`, "g")) || []).length;

/** Every claim the picture makes about (rate, start, hours); the list of mismatches (empty = true). */
function pictureProblems(svg, [rate, start, hours]) {
  const bad = [];
  const outs = outputsByAdding(rate, start, 12);
  const all = texts(svg);
  const words = all.map((t) => t.s);
  for (const w of [
    "Input (you choose)",
    "Output (it responds)",
    "independent variable",
    "dependent variable",
    "Hours",
    "Reading (mm)",
    "The output depends on the input.",
  ])
    if (!words.includes(w)) bad.push(`missing the words "${w}"`);
  // table rows start at y = 76 and are 24 tall; their text baselines are 17 below the row top
  const rows = expectedInputs(hours);
  rows.forEach((x, r) => {
    const y = 76 + r * 24 + 17;
    const cellIn = all.find((t) => t.y === y && t.x === 62),
      cellOut = all.find((t) => t.y === y && t.x === 286);
    if (x === null) {
      if (!all.some((t) => t.y === y && t.s === "...")) bad.push("the gap row is missing");
      return;
    }
    if (cellIn?.s !== String(x)) bad.push(`row ${r}: input "${cellIn?.s}", expected ${x}`);
    if (cellOut?.s !== String(outs[x]))
      bad.push(`row ${r}: output "${cellOut?.s}", expected ${outs[x]} for input ${x}`);
    const marked = all.some((t) => t.y === y && t.s === "your input");
    if (marked !== (x === hours))
      bad.push(`row ${r}: marked=${marked} but the current input is ${hours}`);
  });
  if (all.filter((t) => t.s === "your input").length !== 1)
    bad.push("exactly one row must be marked");
  if (
    all.filter((t) => t.x === 62 && t.y > 76).length !==
    rows.length - (rows.includes(null) ? 1 : 0)
  )
    bad.push("wrong number of input cells");
  if (count(svg, "shape") !== 3)
    bad.push(
      `expected 3 highlighted rects (two cells of the current row and the output box), found ${count(svg, "shape")}`,
    );
  // the flow on the right
  const need = [
    `Input: Hours = ${hours}`,
    `multiply hours by ${rate}`,
    start ? `then add ${start}` : "no starting amount",
    `Output: Reading = ${outs[hours]}`,
  ];
  for (const n of need) if (!words.includes(n)) bad.push(`the rule flow does not say "${n}"`);
  return bad;
}

let settings = 0;
for (let rate = 1; rate <= 8; rate++)
  for (const start of [0, 1, 6, 12])
    for (let hours = 1; hours <= 12; hours++) {
      const values = [rate, start, hours];
      const model = { kind: "growth", mode: "table", values };
      const r = evaluate(model, values, {});
      const expected = outputsByAdding(rate, start, hours)[hours];
      settings++;
      assert.equal(r.value, expected, `${values}: readout ${r.value}, expected ${expected}`);
      assert.equal(r.label, "Output");
      assert.ok(r.equation.endsWith(`= ${expected}`), `${values}: equation "${r.equation}"`);
      assert.ok(
        r.equation.includes(String(rate)) && r.equation.includes(String(hours)),
        `${values}: equation names the rate and the hours`,
      );
      const svg = visual(model, values, r);
      assert.deepEqual(
        pictureProblems(svg, values),
        [],
        `${values}: the table disagrees with the numbers`,
      );
      assert.ok(!/<(polyline|path)\b/.test(svg), "lesson 9-1 draws no graph");
    }
assert.equal(settings, 8 * 4 * 12);

// a corrupted value is rejected: the table for (3, 0, 2) checked against another rate, another start, another hour count, and a tampered cell
{
  const values = [3, 0, 2],
    model = { kind: "growth", mode: "table", values };
  const svg = visual(model, values, evaluate(model, values, {}));
  assert.deepEqual(pictureProblems(svg, values), []);
  assert.notDeepEqual(pictureProblems(svg, [4, 0, 2]), [], "a wrong rate must be caught");
  assert.notDeepEqual(
    pictureProblems(svg, [3, 1, 2]),
    [],
    "a wrong starting reading must be caught",
  );
  assert.notDeepEqual(pictureProblems(svg, [3, 0, 3]), [], "a wrong current input must be caught");
  assert.notDeepEqual(
    pictureProblems(svg.replace(">9<", ">10<"), values),
    [],
    "a tampered output cell must be caught",
  );
}
assert.throws(
  () => evaluate({ kind: "growth", mode: "table", values: [3, 0, 2] }, [3, 0, 13], {}),
  /1 to 12/,
);
console.log(
  `studio-model-growth-table: ${settings} settings, table and readout agree with the independent derivation.`,
);
