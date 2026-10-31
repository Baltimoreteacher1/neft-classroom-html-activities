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
