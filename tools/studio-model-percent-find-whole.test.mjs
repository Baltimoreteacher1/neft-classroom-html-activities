// percent:find-whole (lesson 4-5): the known part under its percent on a double number line, a step down to 10% (or 1%), the count up to
// 100%, and Whole = Part ÷ Percent with the percent as a decimal. Re-derives every printed number independently of the model (integer
// arithmetic, repeated addition), parses the SVG, and proves the check rejects a corrupted picture.
//   node tools/studio-model-percent-find-whole.test.mjs
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
const decimal = (p) =>
  p === 100 ? "1" : p < 10 ? `0.0${p}` : p % 10 === 0 ? `0.${p / 10}` : `0.${p}`;
// a quotient of whole numbers prints exactly (to four decimals) when its numerator times 10^4 divides evenly
const prints = (num, den) => (num * 10000) % den === 0;

function check(p, part, result, svg) {
  const where = `${p}% -> part ${part}`;
  // the whole by counting up: step down to 10% (or 1%), then add that step until 100% is reached
  const tens = p % 10 === 0,
    step = tens ? 10 : 1,
    pieces = tens ? p / 10 : p;
  const unit = part / pieces;
  let whole = 0,
    at = 0;
  while (at < 100) {
    whole += unit;
    at += step;
  }
  assert.ok(
    Math.abs(whole - (part * 100) / p) < 1e-9 * whole,
    `${where}: counting up and dividing agree`,
  );
  assert.ok(
    Math.abs(result.value - whole) < 1e-9 * whole,
    `${where}: readout value ${result.value} vs ${whole}`,
  );
  const sign = prints(part * 100, p) ? "=" : "≈",
    dec = decimal(p);
  assert.equal(result.equation, `${part} ÷ ${dec} ${sign} ${show(whole)}`, `${where}: equation`);
  const t = texts(svg),
    has = (s) =>
      assert.ok(t.includes(s), `${where}: picture is missing "${s}" (has ${t.join(" | ")})`);
  has(p === 100 ? "100%" : `${p}%`);
  has(p === 100 ? `part = whole ${show(part)}` : `part ${show(part)}`);
  if (p !== 100) {
    has("100%");
    has(`whole ${show(whole)}`);
  }
  if (p !== step) has(`${step}% = ${show(unit)}`);
  const unitSign = prints(part, pieces) ? "=" : "≈";
  has(
    p === step
      ? `Step down: the known part is already ${step}%, so ${step}% is ${show(part)}`
      : `Step down: ${p}% is ${show(part)}, so ${step}% is ${show(part)} ÷ ${pieces} ${unitSign} ${show(unit)}`,
  );
  const sum = prints(part, pieces)
    ? `${100 / step} × ${show(unit)}`
    : `${100 / step} × ${show(part)} ÷ ${pieces}`;
  has(`Count up: 100% is ${100 / step} jumps of ${step}%, so ${sum} ${sign} ${show(whole)}`);
  has("Whole = Part ÷ Percent");
  has(`${show(part)} ÷ ${dec} ${sign} ${show(whole)}   (${p}% = ${dec})`);
  // geometry: the known part under its percent (x = 96 + 4.64 p), a dashed link there and under 100%, the whole ringed at 100%
  const circles = [...svg.matchAll(/<circle\b[^>]*>/g)].map((m) => m[0]);
  const pointsAt = circles.filter((c) => /class="point"/.test(c)).map((c) => attr(c, "cx"));
  assert.equal(pointsAt.length, 2, `${where}: known part marked on both lines`);
  for (const cx of pointsAt)
    assert.ok(Math.abs(cx - (96 + 4.64 * p)) < 1e-6, `${where}: known part at ${cx}`);
  const rings = circles.filter((c) => /class="open-point"/.test(c));
  assert.equal(rings.length, p === 100 ? 0 : 2, `${where}: whole ringed at 100%`);
  for (const r of rings) assert.ok(Math.abs(attr(r, "cx") - 560) < 1e-6, `${where}: whole at 100%`);
  const dashed = [...svg.matchAll(/<line\b[^>]*class="dashed"[^>]*>/g)].map((m) =>
    attr(m[0], "x1"),
  );
  const wantDashed = new Set([96 + 4.64 * p, 560, ...(tens && p !== 10 ? [96 + 46.4] : [])]);
  assert.equal(dashed.length, wantDashed.size, `${where}: dashed links`);
  for (const x of dashed)
    assert.ok(
      [...wantDashed].some((w) => Math.abs(w - x) < 1e-6),
      `${where}: dashed link at ${x}`,
    );
}

const PERCENTS = [
  1, 2, 3, 7, 10, 12, 20, 25, 30, 33, 40, 45, 50, 60, 70, 75, 80, 90, 95, 97, 99, 100,
];
const PARTS = [1, 5, 18, 21, 42, 84, 113, 120];
let n = 0;
for (const p of PERCENTS)
  for (const part of PARTS) {
    const model = { kind: "percent", mode: "find-whole", values: [p, part] };
    const result = evaluate(model, [p, part], {});
    check(p, part, result, visual(model, [p, part], result));
    n++;
  }
assert.ok(n >= 30);

// the lesson's worked example: $42 is 60% of the original price, so the original price is $70
{
  const model = { kind: "percent", mode: "find-whole", values: [60, 42] };
  const r = evaluate(model, [60, 42], {});
  assert.equal(r.value, 70);
  assert.equal(r.equation, "42 ÷ 0.6 = 70");
}

// a corrupted picture or readout is rejected by the same check
{
  const model = { kind: "percent", mode: "find-whole", values: [25, 18] };
  const r = evaluate(model, [25, 18], {});
  const good = visual(model, [25, 18], r);
  check(25, 18, r, good);
  assert.throws(() => check(25, 18, r, good.replaceAll("whole 72", "whole 70")), "a wrong whole");
  assert.throws(() => check(25, 18, r, good.replaceAll("1% = 0.72", "1% = 0.7")), "a wrong step");
  assert.throws(
    () => check(25, 18, r, good.replaceAll("18 ÷ 0.25", "18 ÷ 0.025")),
    "a wrong decimal",
  );
  assert.throws(() => check(25, 18, { ...r, value: 70 }, good), "a wrong readout");
}
console.log(`percent:find-whole: ${n} settings checked, corrupted values rejected`);
