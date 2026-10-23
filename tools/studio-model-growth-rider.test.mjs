// growth:rider (lesson 3-4): the starting-passengers control is unlocked, the readout agrees with repeated addition, and the ratio check
// beside the graph says "same ratio" exactly when no rider was aboard at the start (a straight line that misses (0, 0) is NOT a ratio
// relationship). Expectations are built independently of the module. Run: node tools/studio-model-growth-rider.test.mjs
import assert from "node:assert/strict";
import { controls, evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const texts = (svg) => [...svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const fields = controls({ kind: "growth", mode: "rider", values: [3, 0, 4] });
assert.deepEqual(
  fields.map((f) => [f.min, f.max]),
  [
    [1, 8],
    [0, 6],
    [1, 12],
  ],
  "the starting passengers control is unlocked (0 to 6)",
);
let settings = 0;
for (let rate = 1; rate <= 8; rate++) {
  for (let start = 0; start <= 6; start++) {
    for (let carriages = 1; carriages <= 12; carriages++) {
      const model = { kind: "growth", mode: "rider", values: [rate, start, carriages] };
      const r = evaluate(model, model.values);
      let total = start; // repeated addition: board the carriages one at a time
      for (let i = 0; i < carriages; i++) total += rate;
      assert.equal(r.value, total, `${rate},${start},${carriages}: readout`);
      const svg = visual(model, model.values, r);
      const words = texts(svg);
      assert.ok(!/NaN|undefined/.test(svg));
      // one point per carriage 1..max plus the starting point
      const maxX = Math.max(6, carriages);
      assert.equal((svg.match(/<circle /g) || []).length, maxX + 1, "points drawn");
      // the ratio table prints y : x for carriages 1..3 by repeated addition
      for (const x of [1, 2, 3]) {
        let y = start;
        for (let i = 0; i < x; i++) y += rate;
        assert.ok(words.includes(`${y} : ${x}`), `${rate},${start}: missing row ${y} : ${x}`);
      }
      const verdict =
        start === 0 ? "Every row has the same ratio." : "The rows do NOT have the same ratio.";
      assert.ok(words.includes(verdict), `${rate},${start}: verdict should be "${verdict}"`);
      settings++;
    }
  }
}
console.log(
  `studio-model-growth-rider: ${settings} settings, readout, points and the equal-ratio verdict agree with the independent derivation.`,
);
