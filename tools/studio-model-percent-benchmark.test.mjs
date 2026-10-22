// percent:benchmark (lesson 4-3): double number line in benchmark jumps of 10%, 25% and 50%.
// Re-derives every printed number independently of the model (integer arithmetic and brute force), parses the SVG text, and proves the
// check rejects a corrupted picture.   node tools/studio-model-percent-benchmark.test.mjs
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

// every percent a student reaches by jumping in 10%, 25% or 50% (brute force), without the 0% start unless the percent itself is 0
function benchmarkSet(p) {
  const set = new Set();
  for (const jump of [10, 25, 50]) for (let k = 1; k * jump <= 100; k++) set.add(k * jump);
  return p === 0 ? [0] : [...set];
}
function nearest(p) {
  const all = benchmarkSet(p);
  let best = Infinity,
    out = [];
  for (const m of all) {
    const d = Math.abs(m - p);
    if (d < best) {
      best = d;
      out = [m];
    } else if (d === best) out.push(m);
  }
  return out.sort((a, b) => a - b);
}
const wholeJumps = (p, size) => {
  let k = 0;
  while ((k + 1) * size <= p) k++;
  return k;
};

/** Everything the picture and the readout must say about (p, w); throws on the first disagreement. */
function check(p, w, result, svg) {
  const where = `${p}% of ${w}`;
  const cents = p * w; // value = cents / 100, kept in integers
  const value = cents / 100;
  assert.ok(Math.abs(result.value - value) < 1e-9, `${where}: readout value ${result.value}`);
  assert.equal(result.equation, `${p}% of ${w} = ${show(value)}`, `${where}: equation`);
  const t = texts(svg),
    has = (s) =>
      assert.ok(t.includes(s), `${where}: picture is missing "${s}" (has ${t.join(" | ")})`);
  for (const q of [0, 25, 50, 75, 100]) {
    has(show((q * w) / 100));
    has(`${q}%`);
  }
  has(`${p}% of ${w} is ${show(value)}`);
  has(`Benchmark jumps of the whole (${w})`);
  for (const [size, count] of [
    [10, 10],
    [25, 4],
    [50, 2],
  ]) {
    const k = wholeJumps(p, size);
    has(`${size}% = whole ÷ ${count} = ${show(w / count)}`);
    has(`${k} jump${k === 1 ? "" : "s"} = ${k * size}%`);
  }
  // the pointer to the nearest benchmark
  const near = nearest(p),
    amt = (b) => show((b * w) / 100);
  if (near.length === 2)
    has(`${p}% is halfway between ${near[0]}% (${amt(near[0])}) and ${near[1]}% (${amt(near[1])})`);
  else if (near[0] === p) has(`${p}% is a benchmark: ${p}% of ${w} is ${amt(p)}`);
  else has(`Start from ${near[0]}%: ${near[0]}% of ${w} is ${amt(near[0])}`);
  assert.equal(
    [...svg.matchAll(/class="open-point"/g)].length,
    2 * near.length,
    `${where}: rings on the nearest benchmark`,
  );
  // compatible numbers
  if (w % 10 === 0) has(`${w} is a friendly whole: 10% of ${w} is ${show(w / 10)}`);
  else if (w > 10) {
    let friendlyWhole = 10; // the multiple of 10 nearest the whole; a tie goes up
    for (let c = 10; c <= 130; c += 10)
      if (
        Math.abs(c - w) < Math.abs(friendlyWhole - w) ||
        (Math.abs(c - w) === Math.abs(friendlyWhole - w) && c > friendlyWhole)
      )
        friendlyWhole = c;
    has(
      `${w} is awkward. Compatible number: ${friendlyWhole}. 10% of ${friendlyWhole} is ${show(friendlyWhole / 10)}`,
    );
  } else has(`10% of ${w} is ${show(w / 10)}: move the decimal point one place left`);
  // jump bars: filled pieces are the whole jumps inside the percent, the rest are light
  const filled = wholeJumps(p, 10) + wholeJumps(p, 25) + wholeJumps(p, 50);
  assert.equal([...svg.matchAll(/class="shape"/g)].length, filled, `${where}: filled pieces`);
  assert.equal(
    [...svg.matchAll(/class="shape-light"/g)].length,
    16 - filled,
    `${where}: light pieces`,
  );
  // the student's mark: two points at x = 96 + 4.64 p, joined by one solid line
  const pts = [...svg.matchAll(/<circle\b[^>]*class="point"[^>]*>/g)].map((m) => attr(m[0], "cx"));
  assert.equal(pts.length, 2, `${where}: two points`);
  for (const cx of pts)
    assert.ok(Math.abs(cx - (96 + 4.64 * p)) < 1e-6, `${where}: point at ${cx}`);
}

const PERCENTS = [
  0, 1, 4, 5, 9, 10, 15, 18, 20, 24, 25, 26, 30, 35, 45, 49, 50, 51, 62, 65, 74, 75, 76, 85, 95, 97,
  99, 100,
];
const WHOLES = [1, 7, 10, 13, 58, 60, 80, 113, 119, 120];
let n = 0;
for (const p of PERCENTS)
  for (const w of WHOLES) {
    const model = { kind: "percent", mode: "benchmark", values: [p, w] };
    const result = evaluate(model, [p, w], {});
    check(p, w, result, visual(model, [p, w], result));
    n++;
  }
assert.ok(n >= 30);

// the lesson's own starting setting reads as the lesson says: 20% of $60
{
  const model = { kind: "percent", mode: "benchmark", values: [20, 60] };
  const r = evaluate(model, [20, 60], {});
  assert.equal(r.value, 12);
  assert.ok(texts(visual(model, [20, 60], r)).includes("20% is a benchmark: 20% of 60 is 12"));
}

// a corrupted picture or readout is rejected by the same check
{
  const model = { kind: "percent", mode: "benchmark", values: [35, 80] };
  const r = evaluate(model, [35, 80], {});
  const good = visual(model, [35, 80], r);
  check(35, 80, r, good);
  assert.throws(
    () => check(35, 80, r, good.replace("35% of 80 is 28", "35% of 80 is 27")),
    "a wrong exact amount",
  );
  assert.throws(
    () => check(35, 80, r, good.replace("whole ÷ 4 = 20", "whole ÷ 4 = 25")),
    "a wrong benchmark",
  );
  assert.throws(() => check(35, 80, { ...r, value: 27 }, good), "a wrong readout");
  assert.throws(
    () => check(35, 80, r, good.replace(/class="shape"/, 'class="shape-light"')),
    "a wrong filled piece",
  );
}
console.log(`percent:benchmark: ${n} settings checked, corrupted values rejected`);
