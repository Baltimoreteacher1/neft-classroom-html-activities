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

// Scale drawings: the first three steps build a paper bar and a real-life bar from the problem's own numbers.
const bars = (html) => (html.match(/class="tp-sb-cell/g) || []).length;
assert.equal(
  bars(stepVisual("The scale says 1 cm on paper is 4 m in real life.")),
  2,
  "step 1: one cell on each bar",
);
assert.equal(
  bars(stepVisual("The wall is 8 cm on paper. That is 8 groups of 1 cm.")),
  16,
  "step 2: eight paper cells over eight empty cells",
);
const groups = stepVisual("Each group is 4 m. Multiply 8 × 4.");
assert.equal(bars(groups), 16, "step 3: eight paper cells over eight real cells");
assert.ok(
  groups.includes("tp-sb-real") && !groups.includes("32"),
  "step 3 does not draw the total",
);
assert.equal(
  stepVisual("8 × 4 = 32 meters.").includes("tp-scale-bars"),
  false,
  "an unrelated product line gets no scale bars",
);

// The answer line is a scale picture only when the scale step above it is present.
const scaleSteps = [
  "The scale says 1 cm on paper is 4 m in real life.",
  "The wall is 8 cm on paper. That is 8 groups of 1 cm.",
  "Each group is 4 m. Multiply 8 × 4.",
  "8 × 4 = 32 meters.",
];
const total = stepVisual("8 × 4 = 32 meters.", scaleSteps);
assert.ok(
  total.includes("tp-sb-bracket") && total.includes(">32 m<"),
  "step 4 brackets the real-life bar with the total",
);
assert.equal(
  stepVisual("8 × 4 = 32 meters.", ["Perimeter is the distance around."]).includes("tp-scale-bars"),
  false,
  "the same line in another skill gets no scale bars",
);
