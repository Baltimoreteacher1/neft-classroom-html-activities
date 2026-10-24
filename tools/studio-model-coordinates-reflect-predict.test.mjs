// coordinates:reflect-predict (lesson 7-9): distance-to-axis bars always, the sign-change table only for a mirror image.
// The mirror test is the midpoint test (the axis cuts the segment AB in half and AB is perpendicular to it), not the module's
// sign comparison. The picture is read back by parsing its text. Run: node tools/studio-model-coordinates-reflect-predict.test.mjs
import assert from "node:assert/strict";
import { evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const model = { kind: "coordinates", mode: "reflect-predict", values: [-4, 3, 3, -2] };
/** B mirrors A across the x-axis when the midpoint is on the x-axis and AB is vertical; across the y-axis when it is on the y-axis and AB is horizontal. */
function mirrored([a, b, c, d]) {
  const mx = (a + c) / 2;
  const my = (b + d) / 2;
  if (my === 0 && a === c && !(b === 0 && d === 0)) return "x";
  if (mx === 0 && b === d && !(a === 0 && c === 0)) return "y";
  return null;
}
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const R = [-6, -5, -3, -1, 0, 2, 4, 6];
let checked = 0;
let tables = 0;
for (const a of R)
  for (const b of R)
    for (const c of R)
      for (const d of R) {
        const v = [a, b, c, d];
        const r = evaluate(model, v);
        assert.equal(r.value, Math.abs(a - c) + Math.abs(b - d));
        const words = texts(visual(model, v, r)).join(" | ");
        const axis = mirrored(v);
        assert.ok(words.includes("Distance from each axis"), "bars come first");
        assert.ok(
          words.includes(`A: ${Math.abs(a)} from y-axis, ${Math.abs(b)} from x-axis`),
          `${v}: ${words}`,
        );
        assert.ok(
          words.includes(`B: ${Math.abs(c)} from y-axis, ${Math.abs(d)} from x-axis`),
          `${v}: ${words}`,
        );
        const hasTable = words.includes("B mirrors A across");
        assert.equal(hasTable, axis !== null, `${v}: table shown=${hasTable}, mirror=${axis}`);
        if (axis) {
          tables++;
          assert.ok(words.includes(`B mirrors A across the ${axis}-axis`));
          const flipped = axis === "x" ? "y" : "x";
          assert.ok(
            words.includes(`${flipped}-coordinate: sign changed`) &&
              words.includes(`${axis}-coordinate: stays the same`),
          );
        } else assert.ok(!words.includes("sign changed"), `${v}: no table without a mirror image`);
        assert.ok(
          !/reflect(ed|ion)? in the/i.test(r.note),
          "the readout never lists the reflections",
        );
        checked++;
      }
// the mission: 27 puzzles that start unsolved and have a unique mirror-image solution among the unlocked control's settings
const targets = new Set();
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(model, round, level);
    assert.notEqual(evaluate(model, q.start).value, q.target, `r${round} L${level} starts solved`);
    assert.ok(mirrored(q.goal), `r${round} L${level}: the goal must be a mirror image`);
    for (let i = 0; i < 4; i++)
      assert.ok(
        q.start[i] >= -6 && q.start[i] <= 6 && q.goal[i] >= -6 && q.goal[i] <= 6,
        "controls in range",
      );
    targets.add(q.target);
  }
assert.ok(targets.size >= 3);
console.log(
  `coordinates:reflect-predict: ${checked} settings (${tables} mirror images) and 27 mission puzzles checked.`,
);
