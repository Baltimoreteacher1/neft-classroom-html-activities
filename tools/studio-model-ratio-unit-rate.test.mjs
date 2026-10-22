// ratio:unit-rate (lesson 3-2): the equal-groups + double-number-line model prints the numbers it claims.
// The expectations below are derived here, separately from the module: long division digit by digit, never the module's own
// formatter, and the picture is read back by parsing its SVG text. Run: node tools/studio-model-ratio-unit-rate.test.mjs
import assert from "node:assert/strict";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

/** n / d as digits by long division: { whole, frac (first `places` digits), exactWithin: remainder is 0 after `places` digits }. */
function longDivision(n, d, places) {
  const whole = Math.floor(n / d);
  let rem = n % d;
  let frac = "";
  for (let i = 0; i < places; i++) {
    rem *= 10;
    frac += Math.floor(rem / d);
    rem %= d;
  }
  return { whole, frac, rest: rem, next: Math.floor((rem * 10) / d) };
}
/** The label a student should read for n/d: exact when 2 places finish it, otherwise "≈" and the value rounded to 2 places. */
function expectedLabel(n, d) {
  const { whole, frac, rest, next } = longDivision(n, d, 2);
  if (rest === 0) {
    const f = frac.replace(/0+$/, "");
    return f ? `${whole}.${f}` : String(whole);
  }
  let cents = whole * 100 + Number(frac) + (next >= 5 ? 1 : 0);
  const w = Math.floor(cents / 100);
  const f = String(cents % 100)
    .padStart(2, "0")
    .replace(/0+$/, "");
  return `≈${f ? `${w}.${f}` : w}`;
}

const texts = (svg) =>
  [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    s: m[3],
  }));
const count = (svg, cls) => (svg.match(new RegExp(`<rect [^>]*class="${cls}"`, "g")) || []).length;

/** Every claim the picture for (a, b) makes, checked against a, b; returns the list of mismatches (empty = true). */
function pictureProblems(svg, claimedA, claimedB) {
  const bad = [];
  const a = claimedA,
    b = claimedB;
  if (count(svg, "shape") !== b)
    bad.push(`expected ${b} juice groups, found ${count(svg, "shape")}`);
  if (count(svg, "shape-alt") !== b)
    bad.push(`expected ${b} water groups, found ${count(svg, "shape-alt")}`);
  const all = texts(svg);
  const per = expectedLabel(a, b);
  if (
    !all.some(
      (t) => t.s === `Each group: 1 cup of water, ${per} ${per === "1" ? "cup" : "cups"} of juice`,
    )
  )
    bad.push(`group caption does not say ${per}`);
  if (
    !all.some(
      (t) =>
        t.s ===
        `Thick part: 1 cup of water goes with ${per} ${per === "1" ? "cup" : "cups"} of juice`,
    )
  )
    bad.push(`unit caption does not say ${per}`);
  if (
    !all.some(
      (t) => t.s === `${b} equal ${b === 1 ? "group" : "groups"}, one for each cup of water`,
    )
  )
    bad.push("heading does not name the group count");
  // juice labels (above the juice line) sit at y = 204, water labels (below the water line) at y = 298; x = 70 + k * 510 / b
  const at = (y) =>
    new Map(all.filter((t) => t.y === y).map((t) => [Math.round(t.x * 100) / 100, t.s]));
  const juice = at(204),
    water = at(298);
  const xOf = (k) => Math.round((70 + (k * 510) / b) * 100) / 100;
  if (juice.get(xOf(0)) !== "0") bad.push("juice line does not start at 0");
  if (juice.get(xOf(b)) !== String(a)) bad.push(`juice line does not end at ${a}`);
  if (water.get(xOf(0)) !== "0" || water.get(xOf(b)) !== String(b))
    bad.push(`water line is not 0 to ${b}`);
  for (const [x, s] of juice) {
    const k = Math.round(((x - 70) * b) / 510);
    if (Math.abs(xOf(k) - x) > 0.011) bad.push(`a juice label sits off a tick (x ${x})`);
    else if (s !== expectedLabel(k * a, b))
      bad.push(`juice tick ${k}: printed "${s}", expected "${expectedLabel(k * a, b)}"`);
  }
  for (const [x, s] of water)
    if (s !== String(Math.round(((x - 70) * b) / 510)))
      bad.push(`water tick label "${s}" is not its tick number`);
  // matching ticks: one connector per whole cup of water, 0..b
  const connectors = (svg.match(/<line x1="([\d.]+)" y1="222" x2="\1" y2="268"/g) || []).length;
  if (connectors !== b + 1) bad.push(`expected ${b + 1} matching connectors, found ${connectors}`);
  // the juice amount per group appears inside every group when the groups are wide enough to hold it
  if (510 / b >= 53) {
    const inside = all.filter((t) => t.y === 66 && t.s === per).length;
    if (inside !== b) bad.push(`expected ${b} group labels of ${per}, found ${inside}`);
  }
  return bad;
}

let settings = 0;
for (let a = 1; a <= 12; a++)
  for (let b = 1; b <= 12; b++) {
    const model = { kind: "ratio", mode: "unit-rate", values: [a, b] };
    const r = evaluate(model, [a, b], {});
    settings++;
    // the readout is a / b (compared by cross-multiplication, so no division in the check)
    assert.ok(Math.abs(r.value * b - a) < 1e-9, `${a}:${b}: readout ${r.value} is not ${a}/${b}`);
    assert.equal(r.label, "Juice per cup of water");
    assert.ok(r.equation.startsWith(`${a} ÷ ${b} = `), `${a}:${b}: equation "${r.equation}"`);
    const repeating = (() => {
      let d = b / gcdOf(a, b);
      while (d % 2 === 0) d /= 2;
      while (d % 5 === 0) d /= 5;
      return d !== 1;
    })();
    assert.equal(
      /≈/.test(r.equation),
      repeating,
      `${a}:${b}: "≈" belongs in the equation exactly when the decimal repeats ("${r.equation}")`,
    );
    const svg = visual(model, [a, b], r);
    assert.deepEqual(
      pictureProblems(svg, a, b),
      [],
      `${a}:${b}: the picture disagrees with the numbers`,
    );
  }
function gcdOf(x, y) {
  return y ? gcdOf(y, x % y) : x;
}
assert.equal(settings, 144);

// spot values the long division must agree with
assert.equal(expectedLabel(5, 4), "1.25");
assert.equal(expectedLabel(5, 3), "≈1.67");
assert.equal(expectedLabel(11, 12), "≈0.92");
assert.equal(expectedLabel(12, 1), "12");

// a corrupted value is rejected: the picture for 5:4 checked against 6:4, 5:3 and a tampered caption must all fail
{
  const model = { kind: "ratio", mode: "unit-rate", values: [5, 4] };
  const svg = visual(model, [5, 4], evaluate(model, [5, 4], {}));
  assert.deepEqual(pictureProblems(svg, 5, 4), []);
  assert.notDeepEqual(pictureProblems(svg, 6, 4), [], "a wrong juice total must be caught");
  assert.notDeepEqual(pictureProblems(svg, 5, 3), [], "a wrong water count must be caught");
  assert.notDeepEqual(
    pictureProblems(svg.replaceAll("1.25 cups of juice", "1.5 cups of juice"), 5, 4),
    [],
    "a tampered caption must be caught",
  );
}
// settings outside the controls are refused, never drawn
assert.throws(
  () => evaluate({ kind: "ratio", mode: "unit-rate", values: [5, 4] }, [0, 4], {}),
  /whole cups/,
);
assert.throws(
  () => evaluate({ kind: "ratio", mode: "unit-rate", values: [5, 4] }, [5, 13], {}),
  /whole cups/,
);
console.log(
  `studio-model-ratio-unit-rate: ${settings} settings, picture and readout agree with the independent derivation.`,
);
