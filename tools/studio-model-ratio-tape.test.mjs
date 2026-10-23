// ratio:tape (lesson 3-1): the one-tape picture and its readout agree with an independent count.
// The readout is the whole drink and the picture prints part-to-part and part-to-whole ratios, never a division (that is lesson 3-2).
// The expectation is built by COUNTING boxes in the SVG, not by the module's formula. Run: node tools/studio-model-ratio-tape.test.mjs
import assert from "node:assert/strict";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const texts = (svg) => [...svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const count = (svg, re) => (svg.match(re) || []).length;
let settings = 0;
for (let a = 1; a <= 12; a++) {
  for (let b = 1; b <= 12; b++) {
    const model = { kind: "ratio", mode: "tape", values: [a, b] };
    const result = evaluate(model, [a, b]);
    const svg = visual(model, [a, b], result);
    const words = texts(svg);
    // count the boxes on the tape: solid juice boxes use the lab class, striped water boxes use the hatch pattern
    const juiceBoxes = count(svg, /<rect [^>]*y="36"[^>]*class="shape"/g);
    const waterBoxes = count(svg, /<rect [^>]*y="36"[^>]*fill="url\(#rt-hatch\)"/g);
    assert.equal(juiceBoxes, a, `${a},${b}: juice boxes`);
    assert.equal(waterBoxes, b, `${a},${b}: water boxes`);
    assert.equal(
      result.value,
      juiceBoxes + waterBoxes,
      `${a},${b}: the readout is the number of boxes on the tape`,
    );
    for (const need of [
      `Juice to water: ${a} : ${b}`,
      `Juice to whole drink: ${a} : ${juiceBoxes + waterBoxes}`,
      `Water to whole drink: ${b} : ${juiceBoxes + waterBoxes}`,
    ])
      assert.ok(words.includes(need), `${a},${b}: missing "${need}"`);
    // no unit rate: this lesson compares with colons, it does not divide
    assert.ok(
      !/÷|per cup|unit rate/i.test(`${result.equation} ${result.note} ${words.join(" ")}`),
      `${a},${b}: shows a division or a unit rate`,
    );
    assert.ok(!/NaN|undefined/.test(svg), `${a},${b}: NaN in picture`);
    settings++;
  }
}
assert.throws(() => evaluate({ kind: "ratio", mode: "tape", values: [0, 3] }, [0, 3]));
console.log(
  `studio-model-ratio-tape: ${settings} settings, boxes and ratios agree with the independent count.`,
);
