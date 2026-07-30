#!/usr/bin/env node
// Gate for the Learn It worked-example figures.
//
// A diagram that disagrees with the worked example is worse than no diagram —
// a student trusts the picture over the paragraph. So every figure this repo
// draws has to be provably read off the lesson's own text, and this gate is
// what proves it.
//
// It self-tests the readers on known fixtures BEFORE sweeping the curriculum,
// because a reader that quietly stops matching would otherwise report a
// perfectly clean site while every figure silently disappeared.
//
// Checks per lesson:
//   1. every measurement the picture claims appears as a number in the
//      worked-example text;
//   2. every number printed on a measurement label is one of those values
//      (axis ticks on number lines and grids are exempt — they are scale, not
//      claims about the problem);
//   3. the SVG is well-formed and carries a non-empty accessible label;
//   4. the generated learn.html actually contains the figure.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { _internals, workedFigure } from "./lib/learn-figures.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDir = join(root, "lessons");

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error("  FAIL " + msg);
};

/* ---------- self-test: the readers must still read ---------- */

const FIXTURES = [
  {
    name: "parallelogram",
    text: "I have a parallelogram with a base of 14 feet and a height of 9 feet.",
    kind: "parallelogram",
    values: [14, 9],
  },
  {
    name: "triangle",
    text: "My triangular garden has a base of 12 feet and a height of 8 feet.",
    kind: "triangle",
    values: [12, 8],
  },
  {
    name: "trapezoid",
    text: "My trapezoid window has a top base of 4 feet, a bottom base of 8 feet, and a height of 5 feet.",
    kind: "trapezoid",
    values: [4, 8, 5],
  },
  {
    name: "prism",
    text: "My capsule is 2 ft long, 1.5 ft wide, and 1 ft tall.",
    kind: "prism",
    values: [2, 1.5, 1],
  },
  {
    name: "absolute value",
    text: "I want the absolute value of -6, written |-6|.",
    kind: "number-line",
    values: [-6],
  },
  {
    name: "inequality",
    text: "Graph t ≥ 2. The boundary number is 2.",
    kind: "number-line",
    values: [2],
  },
  {
    name: "plot a point",
    text: "I will plot the point (5, 4). I start at the origin (0, 0).",
    kind: "coordinate-plane",
    values: [5, 4],
  },
  {
    name: "reflection",
    text: "I will reflect (3, 2) over the y-axis.",
    kind: "coordinate-plane",
    values: [3, 2],
  },
  {
    name: "one-step sum",
    text: "Solve n + 23 = 58.",
    kind: "tape-sum",
    values: [23, 58],
  },
  {
    name: "one-step groups",
    text: "Solve 3x = 21.",
    kind: "tape-groups",
    values: [3, 21],
  },
  {
    name: "ratio",
    text: "Chef Reyes uses 3 cups of apple juice for every 2 cups of sparkling water.",
    kind: "ratio-tape",
    values: [3, 2],
  },
];

const NON_FIXTURES = [
  "I want the prime factorization of 60. I start by splitting it: 60 = 6 x 10.",
  "My data set: 6, 8, 10, 12. First I find the mean.",
  "I want 1,344 divided by 12. The dividend is 1,344.",
];

console.log("learn-figure gate self-test");
for (const f of FIXTURES) {
  const got = workedFigure({ launch: { conceptIntro: { iDo: { lines: [f.text] } } } });
  if (!got) {
    fail(`self-test "${f.name}" — reader matched nothing`);
    continue;
  }
  if (got.kind !== f.kind) fail(`self-test "${f.name}" — kind ${got.kind}, expected ${f.kind}`);
  const want = f.values.join(",");
  const have = got.values.join(",");
  if (want !== have) fail(`self-test "${f.name}" — values [${have}], expected [${want}]`);
}
for (const text of NON_FIXTURES) {
  const got = workedFigure({ launch: { conceptIntro: { iDo: { lines: [text] } } } });
  if (got)
    fail(
      `self-test — drew a ${got.kind} for text that describes no figure: "${text.slice(0, 50)}…"`,
    );
}
if (Object.keys(_internals).length < 6) fail("self-test — reader set shrank unexpectedly");
console.log(`  ${FIXTURES.length} positive + ${NON_FIXTURES.length} negative fixtures checked`);

/* ---------- sweep the curriculum ---------- */

// Number-line ticks and grid axis numbers are drawn scale, not claims about
// the problem, so their labels are not held to the "must be in values" rule.
const SCALE_KINDS = new Set(["number-line", "coordinate-plane"]);

const numbersIn = (s) =>
  (String(s).match(/-?\d+(?:,\d{3})*(?:\.\d+)?/g) || []).map((t) => Number(t.replace(/,/g, "")));

const ids = readdirSync(lessonsDir).filter(
  (d) =>
    !d.startsWith("_") &&
    existsSync(join(lessonsDir, d, "config.json")) &&
    existsSync(join(lessonsDir, d, "learn.html")),
);

let drawn = 0;
const byKind = {};

for (const id of ids) {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
  } catch {
    fail(`${id} — config.json does not parse`);
    continue;
  }
  const fig = workedFigure(cfg);
  if (!fig) continue;
  drawn++;
  byKind[fig.kind] = (byKind[fig.kind] || 0) + 1;

  const intro = (cfg.launch && cfg.launch.conceptIntro) || {};
  const text = ((intro.iDo && intro.iDo.lines) || []).join(" ");
  const textNums = new Set(numbersIn(text));

  // 1. every claimed measurement is in the worked example.
  for (const v of fig.values) {
    if (!textNums.has(v)) fail(`${id} — figure claims ${v}, which is not in the worked example`);
  }

  // 2. printed measurement labels are claimed measurements.
  if (!SCALE_KINDS.has(fig.kind)) {
    const labels = fig.svg.match(/<text[^>]*>([^<]*)<\/text>/g) || [];
    const allowed = new Set(fig.values);
    for (const l of labels) {
      for (const v of numbersIn(l.replace(/<[^>]+>/g, ""))) {
        if (!allowed.has(v))
          fail(`${id} — figure prints "${v}" on a label but never read it from the text`);
      }
    }
  }

  // 3. well-formed and described.
  if (!/^<svg [^>]*>[\s\S]*<\/svg>$/.test(fig.svg))
    fail(`${id} — figure is not a single well-formed svg element`);
  const opens = (fig.svg.match(/<(?!\/)(?!!)[a-zA-Z]+/g) || []).length;
  const selfClose = (fig.svg.match(/\/>/g) || []).length;
  const closes = (fig.svg.match(/<\/[a-zA-Z]+>/g) || []).length;
  if (opens !== selfClose + closes)
    fail(
      `${id} — figure has unbalanced svg tags (${opens} open, ${selfClose} self-closing, ${closes} closing)`,
    );
  if (!fig.alt || fig.alt.length < 20) fail(`${id} — figure has no usable accessible description`);
  if (!fig.svg.includes(`aria-label="`)) fail(`${id} — figure is missing aria-label`);

  // 4. it reached the page.
  const html = readFileSync(join(lessonsDir, id, "learn.html"), "utf8");
  if (!html.includes('class="li-fig"'))
    fail(`${id} — a figure was generated but learn.html does not contain it`);
}

// A gate that draws nothing is not a passing gate.
if (drawn === 0) fail("swept the curriculum and found ZERO figures — the readers are dead");

console.log(`\nLearn It worked-example figures — ${drawn} of ${ids.length} lessons`);
console.log(
  "  " +
    Object.entries(byKind)
      .map(([k, v]) => `${k}:${v}`)
      .join("  "),
);

if (failures) {
  console.error(`\n✗ ${failures} problem(s) found.`);
  process.exit(1);
}
console.log("✓ Every figure is read from its lesson's own worked example.");
