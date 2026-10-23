// ratio:patterns (lesson 3-5): the picture is told apart by pattern, never by colour, and its bar counts agree with the controls.
// Counting is done on the SVG itself. Run: node tools/studio-model-ratio-patterns.test.mjs
import assert from "node:assert/strict";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const count = (svg, re) => (svg.match(re) || []).length;
let settings = 0;
for (let a = 1; a <= 12; a++) {
  for (let b = 1; b <= 12; b++) {
    const model = { kind: "ratio", mode: "patterns", values: [a, b] };
    const result = evaluate(model, [a, b]);
    const svg = visual(model, [a, b], result);
    // solid bars: your color row plus the reference color row (3); striped bars: your white row plus the reference white row (5)
    assert.equal(count(svg, /<rect [^>]*fill="#17344b"/g), a + 3, `${a},${b}: solid bars`);
    assert.equal(
      count(svg, /<rect [^>]*fill="url\(#rp-hatch\)"/g),
      b + 5,
      `${a},${b}: striped bars`,
    );
    assert.ok(Math.abs(result.value - a / b) < 1e-12, "readout is color per cup of white");
    // the two kinds are named in words, so colour is never the only cue
    assert.ok(
      /Color \(solid bars\)/.test(svg) && /White \(striped bars\)/.test(svg),
      "bars are named",
    );
    // no blended colour: no opacity, gradient or blend mode anywhere in the picture
    assert.ok(!/opacity|gradient|blend/i.test(svg), `${a},${b}: blended colour in the picture`);
    assert.ok(!/NaN|undefined/.test(svg));
    settings++;
  }
}
console.log(
  `studio-model-ratio-patterns: ${settings} settings, solid and striped bars agree with the controls and nothing is blended.`,
);
