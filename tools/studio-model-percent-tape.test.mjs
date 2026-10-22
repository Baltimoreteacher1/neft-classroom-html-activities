// percent:tape (lesson 4-4): tape diagram over a double number line, Part = Percent x Whole with the percent as a decimal.
// Re-derives every printed number independently of the model (integer arithmetic), parses the SVG, and proves the check rejects a
// corrupted picture.   node tools/studio-model-percent-tape.test.mjs
import assert from "node:assert/strict";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const show = (n) => {
  const r = Math.round(n * 1e4) / 1e4;
  if (Number.isInteger(r)) return String(r);
  const [i, f] = r.toFixed(4).replace(/0+$/, "").split(".");
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${f}`;
};
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const attr = (tag, name) => Number((tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1]);
// the percent as a decimal, built from digits rather than by dividing: 5 -> 0.05, 35 -> 0.35, 100 -> 1
const decimal = (p) =>
  p === 100 ? "1" : p === 0 ? "0" : p < 10 ? `0.0${p}` : p % 10 === 0 ? `0.${p / 10}` : `0.${p}`;

function check(p, w, result, svg) {
  const where = `${p}% of ${w}`;
  const part = (p * w) / 100,
    dec = decimal(p);
  assert.ok(Math.abs(result.value - part) < 1e-9, `${where}: readout value ${result.value}`);
  assert.equal(result.equation, `${dec} × ${w} = ${show(part)}`, `${where}: equation`);
  const t = texts(svg),
    has = (s) =>
      assert.ok(t.includes(s), `${where}: picture is missing "${s}" (has ${t.join(" | ")})`);
  has(`Whole (base): ${w} = 100%`);
  has(`Part: ${show(part)} (${p}%)`);
  has("Part = Percent × Whole");
  has(`${p}% = ${dec}, so ${dec} × ${w} = ${show(part)}`);
  for (let tenth = 0; tenth <= 10; tenth++) {
    has(show((tenth * w) / 10));
    has(`${tenth * 10}%`);
  }
  // the tape: one bar, nine dividers (ten equal tenths), and a shaded stretch exactly p% of the bar
  const rects = [...svg.matchAll(/<rect\b[^>]*>/g)].map((m) => m[0]);
  const shaded = rects.filter((r) => /class="shape"/.test(r)),
    whole = rects.filter((r) => /class="shape-light"/.test(r));
  assert.equal(whole.length, 1, `${where}: one tape`);
  assert.equal(shaded.length, p > 0 ? 1 : 0, `${where}: shaded stretch`);
  const barWidth = attr(whole[0], "width");
  if (p > 0)
    assert.ok(
      Math.abs(attr(shaded[0], "width") / barWidth - p / 100) < 1e-9,
      `${where}: shaded share`,
    );
  const x0 = attr(whole[0], "x"),
    y0 = attr(whole[0], "y"),
    h = attr(whole[0], "height");
  const dividers = [...svg.matchAll(/<line\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((l) => attr(l, "y1") === y0 && attr(l, "y2") === y0 + h);
  assert.equal(dividers.length, 9, `${where}: nine dividers`);
  dividers.forEach((l, i) =>
    assert.ok(
      Math.abs(attr(l, "x1") - (x0 + (barWidth * (i + 1)) / 10)) < 1e-6,
      `${where}: divider ${i + 1}`,
    ),
  );
  // the points sit at the same share of both number lines
  const pts = [...svg.matchAll(/<circle\b[^>]*class="point"[^>]*>/g)].map((m) => attr(m[0], "cx"));
  assert.equal(pts.length, 2, `${where}: two points`);
  for (const cx of pts)
    assert.ok(Math.abs((cx - x0) / barWidth - p / 100) < 1e-9, `${where}: point at ${cx}`);
}

const PERCENTS = [0, 1, 5, 9, 10, 15, 20, 25, 33, 35, 45, 49, 50, 51, 65, 75, 80, 95, 99, 100];
const WHOLES = [1, 7, 20, 60, 90, 113, 120];
let n = 0;
for (const p of PERCENTS)
  for (const w of WHOLES) {
    const model = { kind: "percent", mode: "tape", values: [p, w] };
    const result = evaluate(model, [p, w], {});
    check(p, w, result, visual(model, [p, w], result));
    n++;
  }
assert.ok(n >= 30);

// the lesson's worked example: 25% of 60 tickets is 15
{
  const model = { kind: "percent", mode: "tape", values: [25, 60] };
  const r = evaluate(model, [25, 60], {});
  assert.equal(r.value, 15);
  assert.equal(r.equation, "0.25 × 60 = 15");
}

// a corrupted picture or readout is rejected by the same check
{
  const model = { kind: "percent", mode: "tape", values: [35, 80] };
  const r = evaluate(model, [35, 80], {});
  const good = visual(model, [35, 80], r);
  check(35, 80, r, good);
  assert.throws(
    () => check(35, 80, r, good.replaceAll("0.35 × 80 = 28", "0.35 × 80 = 27")),
    "a wrong product",
  );
  assert.throws(
    () => check(35, 80, r, good.replaceAll("35% = 0.35", "35% = 3.5")),
    "a wrong decimal",
  );
  assert.throws(
    () => check(35, 80, r, good.replace(/(<rect\b[^>]*) width="162.4"/, '$1 width="180"')),
    "a wrong shaded width",
  );
  assert.throws(() => check(35, 80, { ...r, equation: "0.35 × 80 = 27" }, good), "a wrong readout");
}
console.log(`percent:tape: ${n} settings checked, corrupted values rejected`);
