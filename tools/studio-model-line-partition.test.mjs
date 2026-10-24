// line:partition (lesson 7-2): each unit cut into equal parts, the marker counted in ticks from 0.
// The marker's number is built by adding 1/parts once per tick; the picture is read back by counting its tick lines and
// finding its marker. Run: node tools/studio-model-line-partition.test.mjs
import assert from "node:assert/strict";
import { evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const model = { kind: "line", mode: "partition", values: [3, 2] };
const round6 = (n) => Math.round(n * 1e6) / 1e6;
function byAdding(parts, ticks) {
  let v = 0;
  for (let i = 0; i < Math.abs(ticks); i++) v += (ticks < 0 ? -1 : 1) / parts;
  return round6(v);
}
const lines = (svg) =>
  [
    ...svg.matchAll(
      /<line x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)" class="([^"]*)"/g,
    ),
  ].map((m) => m.slice(1, 6).map((x, i) => (i === 4 ? x : Number(x))));
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
let checked = 0;
for (let parts = 1; parts <= 10; parts++)
  for (let ticks = -40; ticks <= 40; ticks += 3) {
    const r = evaluate(model, [parts, ticks]);
    assert.equal(round6(r.value), byAdding(parts, ticks), `${ticks}/${parts}`);
    const svg = visual(model, [parts, ticks], r);
    // 8 units, `parts` ticks each, plus the closing tick at 4 and the heavy axis
    const small = lines(svg).filter((l) =>
      l[4] === "" && l[1] === l[3] - 0 + 0 ? false : l[4] === "",
    );
    const tickLines = lines(svg).filter((l) => l[4] === "");
    assert.equal(tickLines.length, 8 * parts + 1, `${parts} parts: tick lines`);
    const inView = Math.abs(r.value) <= 4;
    const marker = /<circle cx="([\d.]+)" cy="140" r="8" class="point"\/>/.exec(svg);
    assert.equal(!!marker, inView, `${ticks}/${parts}: marker shown only when on the picture`);
    if (marker) {
      // the marker sits on a tick: one of the tick lines has its x
      const x = Number(marker[1]);
      assert.ok(
        tickLines.some((l) => Math.abs(l[0] - x) < 0.01),
        `${ticks}/${parts}: the marker is not on a tick`,
      );
    } else assert.ok(texts(svg).some((t) => /off this picture/.test(t)));
    void small;
    checked++;
  }
// the fraction is printed in lowest terms: 6 ticks of 1/4 is 3/2, and a negative reads with a true minus
assert.ok(texts(visual(model, [4, -6], evaluate(model, [4, -6]))).includes("−3/2"));
assert.throws(() => evaluate(model, [11, 0]), /Cut each unit/);
// mission: 27 puzzles, halves, fourths, fifths or tenths only, a terminating target, unsolved at the start, one tick count solves it
const targets = new Set();
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(model, round, level);
    assert.ok([2, 4, 5, 10].includes(q.goal[0]), `r${round} L${level}: parts ${q.goal[0]}`);
    assert.notEqual(evaluate(model, q.start).value, q.target);
    let hits = 0;
    for (let k = -40; k <= 40; k++)
      if (round6(evaluate(model, [q.goal[0], k]).value) === round6(q.target)) hits++;
    assert.equal(hits, 1);
    assert.ok(Math.abs(q.target * 100 - Math.round(q.target * 100)) < 1e-6);
    targets.add(q.target);
  }
assert.ok(targets.size >= 6);
console.log(`line:partition: ${checked} settings and 27 mission puzzles checked.`);
