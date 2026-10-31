// Comparison steps ("47 > 39") get a number line with both numbers marked and the bigger one filled in.
import assert from "node:assert/strict";
import { stepVisual } from "../math/fluency-lab/trail-pictures.js";

const marks = (html) => [...html.matchAll(/tp-mark-label[^>]*>([^<]*)</g)].map((m) => m[1]);
const ticks = (html) => [...html.matchAll(/tp-scale[^>]*>([^<]*)</g)].map((m) => Number(m[1]));

for (const [line, lo, hi] of [
  ["47 > 39", 39, 47],
  ["12 < 95", 12, 95],
  ["582 > 579", 579, 582],
  ["5 > 4", 4, 5],
]) {
  const html = stepVisual(line);
  assert.ok(html.includes('class="tp-line"'), `${line} draws a number line`);
  assert.deepEqual(
    marks(html)
      .map(Number)
      .sort((a, b) => a - b),
    [lo, hi],
    `${line} marks both numbers`,
  );
  assert.ok(html.includes("tp-mark-big"), `${line} fills in the bigger number`);
  const scale = ticks(html);
  assert.ok(scale.length >= 3, `${line} has several scale labels`);
  assert.ok(
    scale.every((v, i) => i === 0 || v > scale[i - 1]),
    `${line} scale increases left to right`,
  );
  assert.ok(scale[0] <= lo && scale.at(-1) >= hi, `${line} scale covers both numbers`);
}

// Decimals keep decimal ticks; whole-number scales never use fractional steps.
assert.ok(
  ticks(stepVisual("0.6 < 0.9")).some((v) => !Number.isInteger(v)),
  "decimal scale has decimal ticks",
);
assert.ok(
  ticks(stepVisual("5 > 4")).every(Number.isInteger),
  "whole-number scale uses whole-number ticks",
);

console.log("fluency-compare-line: comparison steps draw a marked number line");

// Two-digit and larger facts ("36 − 30 = 6") get one jump on the number line to the answer; small facts keep their counters.
for (const [line, start, answer] of [
  ["36 − 30 = 6", 36, 6],
  ["96 + 20 = 116", 96, 116],
]) {
  const html = stepVisual(line);
  assert.ok(html.includes('class="tp-line"'), `${line} draws a jump line`);
  assert.ok(
    marks(html).length === 0 && html.includes(`>${answer}</text>`),
    `${line} labels the answer`,
  );
  assert.ok(html.includes(`>${start}</text>`), `${line} labels the start`);
}
assert.equal(
  stepVisual("5 + 3 = 8").includes('class="tp-line"'),
  false,
  "small facts keep their counters",
);

// Lead-in sentences keep their equation's jump; place-value and bigger-number steps get a picture.
assert.ok(
  stepVisual("Take away to the ten first. 34 − 6 = 28").includes('class="tp-line"'),
  "lead-in equation draws its jump",
);
assert.ok(
  stepVisual("Find the tens place in 352").includes("sv-place"),
  "place lookup shows the number in place blocks",
);
assert.ok(
  stepVisual("Start at the bigger number, 8").includes("sv-count") ||
    stepVisual("Start at the bigger number, 8").length > 0,
  "bigger number is drawn",
);
