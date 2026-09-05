// Draws the goal-card artwork: assets/objective-art/*.svg (and the same files
// under public/assets/, which is the tree Vite publishes).
//
//   npm run generate:objective-art
//
// There were three photographs for 222 lessons, so 138 of them sat under a
// picture of somebody else's math. Everything here is authored SVG instead:
// exact numbers, real labels, no remote fetches, a few kilobytes each.
//
// Each topic is drawn ONCE. The content card shows that drawing large; the
// "talk about it" card shows the SAME drawing with two partners naming its parts
// underneath — the language objective's job is academic talk about the model the
// content objective just built, so it must be the same model.
//
// The <title> of every file is the catalogue's `alt`, so a file cannot describe
// itself differently from the module that captions it.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OBJECTIVE_IMAGES } from "@eduwonderlab/engine/core/objective-art-catalog.js";
import { bubble, C, CARD, cardSvg, partner, place } from "./lib/objective-art/kit.mjs";
import { ALGEBRA_MODELS } from "./lib/objective-art/models-algebra.mjs";
import { DATA_MODELS } from "./lib/objective-art/models-data.mjs";
import { GEOMETRY_MODELS } from "./lib/objective-art/models-geometry.mjs";
import { NUMBER_MODELS } from "./lib/objective-art/models-number.mjs";
import { RATIO_MODELS } from "./lib/objective-art/models-ratio.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIRS = [
  resolve(ROOT, "assets", "objective-art"),
  resolve(ROOT, "public", "assets", "objective-art"),
];

const M = {
  ...NUMBER_MODELS,
  ...RATIO_MODELS,
  ...ALGEBRA_MODELS,
  ...DATA_MODELS,
  ...GEOMETRY_MODELS,
};

/**
 * One entry per topic. `key` is the catalogue prefix: `<key>Content` and
 * `<key>Talk` must both exist in OBJECTIVE_IMAGES, and `contentOnly` marks the
 * topics whose content picture is one of the kept photographs.
 */
const TOPICS = [
  {
    key: "mathPractice",
    model: M.mathPractice,
    heading: "Notice a rule, test it, explain why",
    note: "1  ·  3  ·  7  →  double it, then add 1",
    talkHeading: "Saying the rule out loud",
    lines: [
      ["Each box doubles the dots in the box before it", "and then adds one more."],
      ["So the next box would hold 7 x 2 + 1 = 15 dots.", "That is why the rule works."],
    ],
  },
  {
    key: "factors",
    model: M.factors,
    heading: "Factor trees, GCF and LCM",
    note: "24 = 2 × 2 × 2 × 3   ·   36 = 2 × 2 × 3 × 3",
    talkHeading: "Naming the parts of a factor tree",
    lines: [
      ["24 breaks down into the prime factors 2, 2, 2 and 3,", "so I write 24 = 2 × 2 × 2 × 3."],
      ["Both trees share 2, 2 and 3, so the greatest common", "factor of 24 and 36 is 12."],
    ],
  },
  {
    key: "division",
    model: M.longDivision,
    heading: "Dividing a multi-digit number",
    note: "4,896 ÷ 12 = 408",
    talkHeading: "Naming the parts of a division",
    lines: [
      [
        "The divisor is 12 and the dividend is 4,896, so I ask",
        "how many twelves fit into 48 first.",
      ],
      ["The quotient is 408 and the remainder is 0, because", "12 × 408 = 4,896 exactly."],
    ],
  },
  {
    key: "decimalSum",
    model: M.decimalSum,
    heading: "Adding decimals by place value",
    note: "tens · ones · tenths · hundredths",
    talkHeading: "Naming the decimal places",
    lines: [
      [
        "The 8 is in the tenths place and the 0 is in the",
        "hundredths place, so the columns match up.",
      ],
      ["I write a placeholder 0 after 12.8 so every digit", "still sits in a column of its own."],
    ],
  },
  {
    key: "decimalProduct",
    model: M.decimalProduct,
    heading: "Multiplying decimals",
    note: "0.4 × 0.7 = 0.28",
    talkHeading: "Naming the parts of a decimal product",
    lines: [
      ["Four tenths of seven tenths is twenty-eight", "hundredths, so the answer is 0.28."],
      ["Each factor has one decimal place, so the product", "has two decimal places."],
    ],
  },
  {
    key: "decimalQuotient",
    model: M.decimalQuotient,
    heading: "Dividing by a decimal",
    note: "7.2 ÷ 0.9 = 8",
    talkHeading: "Naming the move that clears a decimal",
    lines: [
      [
        "I multiply the divisor and the dividend by 10 so",
        "the divisor becomes the whole number 9.",
      ],
      ["The quotient does not change, so 7.2 ÷ 0.9 is the", "same as 72 ÷ 9, which is 8."],
    ],
  },
  {
    key: "fractionDivision",
    model: M.fractionDivision,
    heading: "Dividing by a fraction",
    note: "3 ÷ ½ = 6",
    talkHeading: "Saying what dividing by a fraction asks",
    lines: [
      ["The question is how many halves fit inside 3, and", "counting the pieces gives 6."],
      ["Dividing by ½ gives the same answer as multiplying", "by its reciprocal, 2."],
    ],
  },
  {
    key: "ratios",
    model: M.ratios,
    heading: "Ratios and equivalent ratios",
    note: "3 : 2 = 6 : 4",
    talkHeading: "Reading a ratio out loud",
    lines: [
      ["I read this as three to two, and I can write it", "3 to 2, 3 : 2 or 3/2."],
      ["Multiplying both parts by 2 gives 6 : 4, so it is", "an equivalent ratio, not a new one."],
    ],
  },
  {
    key: "ratioTables",
    model: M.ratioTables,
    heading: "Ratio tables and their graph",
    note: "1 : 3 · 2 : 6 · 3 : 9 · 4 : 12",
    talkHeading: "Reading a ratio table out loud",
    lines: [
      [
        "Every row multiplies the juice by 3 to get the",
        "water, so every row is the same comparison.",
      ],
      [
        "The plotted pairs make one straight line through",
        "the origin, because the ratio never changes.",
      ],
    ],
  },
  {
    key: "rates",
    model: M.rates,
    heading: "Rates and unit rates",
    note: "$12 for 4 lb → $3 per lb",
    talkHeading: "Saying a rate out loud",
    lines: [
      ["$12 for 4 pounds is a rate, because it compares", "two quantities with different units."],
      ["Dividing by 4 gives the unit rate: $3 for 1 pound,", "which is the cost per pound."],
    ],
  },
  {
    key: "measurement",
    model: M.measurement,
    heading: "Converting measurement units",
    note: "5 ft = 60 in",
    talkHeading: "Saying a conversion out loud",
    lines: [
      ["12 inches and 1 foot are the same length, so that", "comparison is my conversion factor."],
      ["Multiplying by 12 inches over 1 foot changes the", "unit without changing the amount."],
    ],
  },
  {
    key: "percents",
    model: M.percents,
    heading: "Percents as parts of one hundred",
    note: "25% of 40 = 10",
    talkHeading: "Saying a percent three ways",
    lines: [
      ["Percent means out of one hundred, so 25 shaded", "squares out of 100 is 25%."],
      [
        "25%, 0.25 and one quarter are three names for the",
        "same amount, and 25% of 40 pages is 10 pages.",
      ],
    ],
  },
  {
    key: "exponents",
    model: M.exponents,
    heading: "Powers and exponents",
    note: "2⁴ = 16",
    talkHeading: "Naming a base and an exponent",
    lines: [
      [
        "The base is 2 — the factor being repeated — and the",
        "exponent 4 counts how many times it is used.",
      ],
      ["So 2 to the fourth is 2 × 2 × 2 × 2, which is 16,", "not 2 × 4."],
    ],
  },
  {
    key: "expressions",
    model: M.expressions,
    heading: "Expressions and the distributive property",
    note: "3(x + 5) = 3x + 15",
    talkHeading: "Naming the parts of an expression",
    lines: [
      [
        "3 is the coefficient, x is the variable and 15 is",
        "the constant; 3x and 15 are the two terms.",
      ],
      [
        "Both forms cover the same rectangle, so they are",
        "equivalent — at x = 4 each one gives 27.",
      ],
    ],
  },
  {
    key: "equations",
    model: M.balanceScale,
    contentOnly: true,
    talkHeading: "Talking about an equation as a balance",
    lines: [
      ["The tile marked x is the unknown, and the equal sign", "says both pans weigh the same."],
      ["If I take 3 cubes off one pan I have to take 3 off", "the other, which leaves x = 4."],
    ],
  },
  {
    key: "inequalities",
    model: M.inequalities,
    heading: "Graphing inequalities",
    note: "x > 3   ·   x ≤ 5",
    talkHeading: "Saying an inequality out loud",
    lines: [
      [
        "x > 3 gets an open circle, because 3 itself is not",
        "a solution — only the numbers past it.",
      ],
      [
        "x ≤ 5 gets a closed circle, because 5 is included,",
        "and the ray shows every other solution.",
      ],
    ],
  },
  {
    key: "statQuestions",
    model: M.statQuestions,
    heading: "Statistical questions",
    note: "one answer vs. many answers",
    talkHeading: "Deciding if a question is statistical",
    lines: [
      ["How tall am I has one answer, so it is not a", "statistical question."],
      [
        "How tall are students in our class gives many",
        "different answers — that spread is the point.",
      ],
    ],
  },
  {
    key: "centre",
    model: M.centre,
    heading: "Mean, median and mode",
    note: "3, 5, 5, 6, 11",
    talkHeading: "Naming the measures of centre",
    lines: [
      ["The mean shares the total equally: 30 ÷ 5 = 6. The", "median is the middle value, 5."],
      [
        "The mode is 5 because it appears most often, and the",
        "outlier 11 is why the mean sits higher.",
      ],
    ],
  },
  {
    key: "mad",
    model: M.meanAbsoluteDeviation,
    heading: "Mean absolute deviation",
    note: "MAD = 2",
    talkHeading: "Saying what the MAD measures",
    lines: [
      [
        "I measure how far each value sits from the mean of",
        "6: the distances are 3, 1, 1, 0 and 5.",
      ],
      [
        "Every distance counts as a positive number, and their",
        "average — 10 ÷ 5 = 2 — is the MAD.",
      ],
    ],
  },
  {
    key: "boxPlot",
    model: M.boxPlot,
    heading: "Box plots and the five-number summary",
    note: "10 · 14 · 20 · 26 · 30",
    talkHeading: "Naming the parts of a box plot",
    lines: [
      ["The five-number summary is minimum 10, Q1 14,", "median 20, Q3 26 and maximum 30."],
      ["The box holds the middle half of the data, so the", "interquartile range is 26 − 14 = 12."],
    ],
  },
  {
    key: "histogram",
    model: M.histogram,
    heading: "Histograms",
    note: "3 · 7 · 9 · 5 · 2 students",
    talkHeading: "Naming the parts of a histogram",
    lines: [
      [
        "Each bar counts how many students fall inside one",
        "interval — the frequency for that interval.",
      ],
      [
        "The intervals are all 10 minutes wide and run",
        "straight on, so the bars touch with no gaps.",
      ],
    ],
  },
  {
    key: "distributions",
    model: M.distributions,
    heading: "The shape of a distribution",
    note: "symmetric · skewed right · skewed left",
    talkHeading: "Describing the shape of data",
    lines: [
      ["This set is symmetric: it clusters around one", "middle peak with matching sides."],
      [
        "This one is skewed right — most values pile up low",
        "and a tail stretches out to the right.",
      ],
    ],
  },
  {
    key: "rationalNumberLine",
    model: M.rationalNumberLine,
    heading: "Rational numbers on a number line",
    note: "−2½ < −0.75 < ½ < 2¼",
    talkHeading: "Ordering numbers on a line",
    lines: [
      [
        "Each small mark is one quarter, so −0.75 lands three",
        "quarters of the way from 0 towards −1.",
      ],
      [
        "Whichever number sits further left is the smaller",
        "one, so −2½ is the least of the four.",
      ],
    ],
  },
  {
    key: "integers",
    model: M.integers,
    heading: "Integers, opposites and absolute value",
    note: "|−4| = 4",
    talkHeading: "Saying what absolute value means",
    lines: [
      ["−4 and 4 are opposites: both sit 4 units from zero,", "just on different sides."],
      ["Absolute value is a distance, so it is never", "negative — |−4| and |4| are both 4."],
    ],
  },
  {
    key: "coordinatePlane",
    model: M.coordinatePlaneModel,
    heading: "Plotting an ordered pair",
    note: "(3, 2)",
    talkHeading: "Naming the parts of the plane",
    lines: [
      ["I start at the origin, move 3 along the x-axis and", "then 2 up along the y-axis."],
      ["The x-coordinate always comes first, so (3, 2) and", "(2, 3) are different points."],
    ],
  },
  {
    key: "quadrants",
    model: M.quadrants,
    heading: "Four quadrants and reflections",
    note: "A(3, 2) · B(−3, 2) · D(3, −2)",
    talkHeading: "Saying where a reflection lands",
    lines: [
      ["A is in Quadrant I. Reflecting it across the y-axis", "gives B(−3, 2), in Quadrant II."],
      [
        "Reflecting A across the x-axis gives D(3, −2) in",
        "Quadrant IV — one sign changes each time.",
      ],
    ],
  },
  {
    key: "distance",
    model: M.distance,
    heading: "Distance on the coordinate plane",
    note: "7 units · 5 units",
    talkHeading: "Explaining how far apart two points are",
    lines: [
      ["P and Q sit on opposite sides of the y-axis, so I", "add: |−3| + |4| = 7 units apart."],
      ["Q and R are on opposite sides of the x-axis too, so", "|2| + |−3| = 5 units apart."],
    ],
  },
  {
    key: "planeArea",
    model: M.planeArea,
    heading: "Area on a grid",
    note: "40 · 20 · 40 square units",
    talkHeading: "Naming a base and its height",
    lines: [
      ["The base is the side I measure along, and the height", "meets it at a right angle."],
      ["The triangle is half the parallelogram on the same", "base and height, so its area is 20."],
    ],
  },
  {
    key: "prismVolume",
    model: M.prismVolume,
    heading: "Volume as base area × height",
    note: "B = l × w   ·   V = B × h",
    talkHeading: "Saying how the base and the height make the volume",
    lines: [
      ["The base is the face the prism sits on, and its area", "is 2 × 1.5 = 3 square feet."],
      ["Stacking that base 1 foot high gives 3 cubic feet —", "the same as 2 × 1.5 × 1."],
    ],
  },
  {
    key: "solids",
    model: M.solids,
    heading: "3D shapes, nets, surface area and volume",
    note: "V = l × w × h   ·   SA = 2(lw + lh + wh)",
    talkHeading: "Naming the parts of a 3D shape and its net",
    lines: [
      [
        "The 6 flat faces of the 2D net fold up to make the 6",
        "rectangular faces of the 3D prism.",
      ],
      [
        "Surface area adds the area of all 6 faces, and volume",
        "multiplies length × width × height.",
      ],
    ],
  },
];

function contentCard(topic) {
  const image = OBJECTIVE_IMAGES[`${topic.key}Content`];
  return cardSvg({
    heading: topic.heading,
    title: image.alt,
    note: topic.note,
    titleId: `${topic.key}-content-title`,
    body: place(topic.model(), 88, 190, 1),
  });
}

function talkCard(topic) {
  const image = OBJECTIVE_IMAGES[`${topic.key}Talk`];
  const body =
    place(topic.model(), 238, 132, 0.75) +
    partner(102, 522, C.teal) +
    bubble(170, 486, 1120, 104, topic.lines[0], { side: "left", stroke: C.teal, size: 28 }) +
    partner(1274, 638, C.coral, { flip: true }) +
    bubble(86, 602, 1120, 104, topic.lines[1], { side: "right", stroke: C.coral, size: 28 });
  return cardSvg({
    heading: topic.talkHeading,
    title: image.alt,
    note: "partner talk",
    titleId: `${topic.key}-talk-title`,
    body,
    accent: C.tealInk,
  });
}

function main() {
  for (const dir of OUT_DIRS) mkdirSync(dir, { recursive: true });

  const written = [];
  for (const topic of TOPICS) {
    if (topic.photoOnly) continue;
    const jobs = topic.contentOnly
      ? [[`${topic.key}Talk`, talkCard(topic)]]
      : [
          [`${topic.key}Content`, contentCard(topic)],
          [`${topic.key}Talk`, talkCard(topic)],
        ];
    for (const [key, svg] of jobs) {
      const image = OBJECTIVE_IMAGES[key];
      if (!image) throw new Error(`gen-objective-art: no catalogue entry for ${key}`);
      const file = image.src.replace("/assets/objective-art/", "");
      if (!file.endsWith(".svg")) {
        throw new Error(`gen-objective-art: ${key} is registered as a photograph (${image.src})`);
      }
      for (const dir of OUT_DIRS) writeFileSync(resolve(dir, file), svg, "utf8");
      written.push(file);
    }
  }

  // Every SVG the catalogue promises must have been drawn — a registered image
  // with no file is a broken picture on a live lesson.
  const promised = Object.entries(OBJECTIVE_IMAGES)
    .filter(([, v]) => v.src.startsWith("/assets/objective-art/"))
    .map(([, v]) => v.src.replace("/assets/objective-art/", ""));
  const missing = promised.filter((f) => !written.includes(f));
  if (missing.length) {
    throw new Error(
      `gen-objective-art: catalogue promises files nobody drew: ${missing.join(", ")}`,
    );
  }

  console.log(
    `objective-art: ${written.length} SVGs → ${OUT_DIRS.map((d) => d.replace(`${ROOT}/`, "")).join(" + ")}` +
      ` (${CARD.w}×${CARD.h})`,
  );
}

main();
