#!/usr/bin/env node
// enrich-unit4-7-vocab.mjs — finish the vocabulary scaffolding sweep.
//
//   node scripts/enrich-unit4-7-vocab.mjs [--dry-run]
//
// Units 1, 9 and 10 were empty and were filled first. Units 4 and 7 were the
// remaining partial ones: Unit 4 had 0 example pairs and 9 of 29 clozes, Unit 7
// had 7 example pairs across 59 terms and five terms in 7-7 with nothing at all.
// An `examples` pair is the field that does the most work on an abstract term —
// it is the difference between recognising a word and being able to use it — so
// a unit with visuals but no examples is still only half-scaffolded.
//
// Same contract as the Unit 1 and Unit 9–10 passes: fills `visual`, `cloze` and
// `examples` only where they are missing, in the lesson's own context, across
// base lessons and their small-group / catch-up variants.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const LESSONS = "lessons";
const UNITS_4_7 = /^(4|7)-\d(?:-(?:group1|group2|catchup))?$/;

const ex = (yes, yesWhy, no, noWhy) => [
  { text: yes, isExample: true, why: yesWhy },
  { text: no, isExample: false, why: noWhy },
];

/** "unit|term" → fields to fill where missing. */
const ENRICHMENT = {
  // ── Unit 4 · percents ───────────────────────────────────────────────────
  "4|understand percent": {
    cloze: "A ratio comparing a number to 100 is a ___.",
    examples: ex(
      "65 shaded squares out of a 100-square grid is 65%",
      "It compares the part to a whole of exactly 100.",
      "65 shaded squares out of 200",
      "The whole is not 100, so the count is not the percent.",
    ),
  },
  "4|percent": {
    cloze: "The word that means “per hundred” is ___.",
    examples: ex(
      "9 out of 100 students walk to school → 9%",
      "The comparison is already out of 100.",
      "9 out of 10 students",
      "That is 90%, not 9% — both terms must be scaled to 100.",
    ),
  },
  "4|per hundred": {
    cloze: "The meaning hidden inside the word percent is ___ ___.",
    examples: ex(
      "3 out of every 10 rewritten as 30 out of 100",
      "It restates the ratio for a group of 100.",
      "3 out of every 10 left as it is",
      "Until the whole is 100 you cannot read the percent off it.",
    ),
  },
  "4|decimal grid": {
    cloze: "A 10-by-10 grid of 100 squares used to show a percent is a ___ ___.",
    examples: ex(
      "A 100-square grid with 65 squares shaded",
      "Each square is one percent, so the shading reads directly as 65%.",
      "A bar split into 8 unlabelled pieces",
      "Without 100 equal parts you cannot read a percent from it.",
    ),
  },
  "4|part-to-whole": {
    cloze: "A comparison of one part against the whole amount is a ___ comparison.",
    examples: ex(
      "18 students out of a class of 60",
      "The second number is the whole the part came from.",
      "18 students compared with 42 students",
      "That compares two parts, not a part with its whole.",
    ),
  },
  "4|greater than 100%": {
    cloze: "A percent above 100 means the amount is ___ than one whole.",
    examples: ex(
      "150% of the gray kitten's weight",
      "One whole plus another half — more than the whole.",
      "50% of the gray kitten's weight",
      "Half of one whole is less than the whole.",
    ),
  },
  "4|fractions, decimals, and percents": {
    cloze: "Three equivalent ways to name the same part of a whole are ___, ___ and ___.",
    examples: ex(
      "1/2, 0.5 and 50%",
      "All three name the same amount of the same whole.",
      "1/2, 0.2 and 50%",
      "0.2 is a different amount, so the set is not equivalent.",
    ),
  },
  "4|decimal": {
    examples: ex(
      "0.35 written for 35%",
      "The percent divided by 100 gives the decimal.",
      "35 written for 35%",
      "Multiplying by a plain 35 makes the answer 100 times too big.",
    ),
  },
  "4|equivalent": {
    cloze: "Having the same value but written a different way is being ___.",
    examples: ex(
      "0.6, 3/5 and 60%",
      "Different notation, identical value.",
      "0.6 and 6%",
      "6% is 0.06 — a different value entirely.",
    ),
  },
  "4|benchmark": {
    examples: ex(
      "Using 25% of 80 to check a 24% discount",
      "A friendly percent close enough to estimate with.",
      "Using 24% of 81 in your head",
      "Those are the exact numbers — that is computing, not benchmarking.",
    ),
  },
  "4|discount": {
    examples: ex(
      "$20 off a $80 jacket",
      "Money taken off the original price.",
      "The $60 you pay at the register",
      "That is the sale price — what is left after the discount.",
    ),
  },
  "4|estimate": {
    visual: "8.6% of 216 ≈ 10% of 200 = 20 pounds of metal.",
    cloze: "A reasoned answer close enough to be useful is an ___.",
    examples: ex(
      "“About 20 pounds” when the exact answer is 18.576",
      "Close enough to plan with, found without exact computation.",
      "18.576 pounds",
      "That is the exact answer, not an estimate.",
    ),
  },
  "4|benchmark percent": {
    visual: "1% · 10% · 25% · 50% · 75% · 100% — the landmarks you can find mentally.",
    cloze: "A friendly percent used as a landmark, like 10% or 25%, is a ___ ___.",
    examples: ex(
      "Using 50% because half of an amount is easy",
      "It is one of the percents you can find in your head.",
      "Using 37% because it is in the problem",
      "It is exact, but nothing about it is mentally friendly.",
    ),
  },
  "4|compatible numbers": {
    visual: "8.6% of 216 → 10% of 220: both nudged to numbers that divide nicely.",
    cloze: "Numbers close to the originals that are easy to compute with are ___ ___.",
    examples: ex(
      "Replacing 216 with 200 to take 10%",
      "200 is close by and 10% of it is instant.",
      "Replacing 216 with 500",
      "It is easy to compute, but far too far from the original.",
    ),
  },
  "4|double number line": {
    visual: "0 · 25% · 50% · 75% · 100% above; 0 · 1.5 · 3 · 4.5 · 6 GB below.",
    cloze: "Two parallel lines pairing amounts with their percents form a ___ ___ ___.",
    examples: ex(
      "Dollars marked on one line and percents on the other, lined up",
      "Matching positions pair an amount with its percent.",
      "One number line with only percents on it",
      "With nothing to pair against, there is no second quantity.",
    ),
  },
  "4|the whole": {
    visual: "“Of the USED storage” makes 4 GB the whole — not the 6 GB total.",
    cloze: "The quantity that counts as 100% in a problem is ___ ___.",
    examples: ex(
      "The 60 students in the class when 18 of them walk",
      "It is the amount the percent is measured against.",
      "The 18 students who walk",
      "That is the part; the percent describes it, it is not the whole.",
    ),
  },
  "4|percent of a number": {
    cloze:
      "A part found by multiplying a number by a percent in decimal form is the ___ ___ ___ ___.",
    examples: ex(
      "0.30 × 80 = 24",
      "The percent was written as a decimal before multiplying.",
      "30 × 80 = 2,400",
      "Using the percent as a whole number makes it 100 times too big.",
    ),
  },
  "4|base": {
    examples: ex(
      "The 80 in “30% of 80”",
      "It is the whole amount, right after the word “of”.",
      "The 24 you get as the answer",
      "That is the part the percent produced.",
    ),
  },
  "4|part": {
    cloze: "How much of the base you get — your answer — is the ___.",
    examples: ex(
      "The 24 in “30% of 80 is 24”",
      "It is the piece of the base the percent describes.",
      "The 80 in the same sentence",
      "That is the base, the whole you started from.",
    ),
  },
  "4|equation": {
    cloze: "The percent number sentence is part = ___ × ___.",
    examples: ex(
      "0.25 × n = 30",
      "Percent times whole equals part, with the unknown whole as n.",
      "0.25 + n = 30",
      "The percent relationship multiplies; it never adds.",
    ),
  },
  "4|determine the whole given the part and percent": {
    cloze: "Working backwards from a part and its percent finds the ___.",
    examples: ex(
      "$9 is 25%, so the whole is 9 ÷ 0.25 = 36",
      "Dividing by the decimal undoes the multiplication.",
      "$9 is 25%, so the whole is 9 × 0.25",
      "Multiplying again makes the whole smaller than the part.",
    ),
  },
  "4|whole": {
    cloze: "The full amount a percent is measured against is always ___%.",
    examples: ex(
      "The original price a discount is taken from",
      "It is the 100% amount the percent refers to.",
      "The amount taken off",
      "That is the part the percent describes.",
    ),
  },

  // ── Unit 7 · integers, rationals and the coordinate plane ───────────────
  "7|integer": {
    examples: ex(
      "-15, 0 and 7",
      "Whole numbers, their opposites, and zero.",
      "2.5",
      "A number between two whole numbers is not an integer.",
    ),
  },
  "7|opposite": {
    examples: ex(
      "-9 and 9",
      "Same distance from 0, on the other side.",
      "-9 and 3",
      "Different distances from 0, so neither one mirrors the other.",
    ),
  },
  "7|negative number": {
    examples: ex(
      "86 meters below sea level, written -86",
      "Below the 0 point, so it takes a − sign.",
      "86 meters above sea level",
      "Above 0 is positive, no sign needed.",
    ),
  },
  "7|positive number": {
    examples: ex(
      "A 12-yard gain past the line of scrimmage",
      "Above the 0 point on the line.",
      "A 12-yard loss",
      "A loss moves backward from 0, so it is negative.",
    ),
  },
  "7|number line": {
    examples: ex(
      "A line with -3, 0 and 3 marked in order",
      "Values placed in order, left to right, around 0.",
      "Three numbers listed in a column",
      "A list has no positions, so it shows no order or distance.",
    ),
  },
  "7|rational numbers on the number line": {
    cloze: "Fractions, decimals and integers placed by value sit on the ___ ___.",
    examples: ex(
      "-3/4 marked between -1 and 0",
      "Its value decides where it goes, not its form.",
      "-3/4 marked between -3 and -4",
      "The digits are not the value — -3/4 is less than one unit from 0.",
    ),
  },
  "7|rational number": {
    cloze: "Any number that can be written as a fraction is a ___ ___.",
    examples: ex(
      "-2.25, 3/4 and 6",
      "Each one can be written as a fraction.",
      "A number that never ends and never repeats",
      "It cannot be written as a fraction of two integers.",
    ),
  },
  "7|fraction": {
    examples: ex(
      "-3/4 as a point three-quarters of the way from 0 to -1",
      "It names a part of a whole and has a place on the line.",
      "The pair of digits 3 and 4",
      "Two separate digits are not a part of a whole.",
    ),
  },
  "7|decimal": {
    examples: ex(
      "-2.25 sitting between -2 and -3",
      "The decimal part places it between two integers.",
      "-225",
      "Dropping the point changes the value entirely.",
    ),
  },
  "7|equivalent": {
    examples: ex(
      "-0.75 and -3/4",
      "The same point on the number line, written two ways.",
      "-0.75 and -0.075",
      "One is ten times the other, so they land in different places.",
    ),
  },
  "7|integers and absolute value": {
    cloze: "The distance of an integer from zero is its ___ ___.",
    examples: ex(
      "|-8| = 8",
      "Distance from 0, so it comes out positive.",
      "|-8| = -8",
      "A distance is never negative.",
    ),
  },
  "7|positive": {
    examples: ex(
      "12 °C, to the right of 0",
      "Greater than zero.",
      "-12 °C",
      "It sits left of 0, so it is negative.",
    ),
  },
  "7|negative": {
    examples: ex(
      "-15 feet in the treasure chest's depth",
      "Less than zero, to the left on the line.",
      "0",
      "Zero is neither positive nor negative.",
    ),
  },
  "7|absolute value": {
    examples: ex(
      "|-2.5| = 2.5",
      "It measures how far the number is from 0.",
      "|-2.5| = -2.5",
      "Distance cannot be negative, whichever side you started on.",
    ),
  },
  "7|compare and order integers": {
    cloze: "On a number line, the number farther to the ___ is always less.",
    examples: ex(
      "-8 < -3 because -8 sits farther left",
      "Position on the line decides the comparison.",
      "-8 > -3 because 8 is bigger than 3",
      "For negatives, a bigger digit means a smaller value.",
    ),
  },
  "7|compare": {
    examples: ex(
      "Deciding -3 is greater than -8",
      "It judges one value against another.",
      "Listing -3 and -8",
      "Writing both down decides nothing.",
    ),
  },
  "7|order": {
    examples: ex(
      "-8, -3, 1, 6 arranged least to greatest",
      "The values are arranged by size.",
      "6, -8, 1, -3 written as they came",
      "No arrangement by size has happened.",
    ),
  },
  "7|greater than": {
    examples: ex(
      "-3 > -8",
      "-3 is farther right on the line, so it is greater.",
      "-8 > -3",
      "-8 is farther left, which makes it the smaller value.",
    ),
  },
  "7|less than": {
    examples: ex(
      "-15 < -8",
      "-15 sits farther left, so it is the lesser value.",
      "-15 < -20",
      "-20 is deeper still, so this reverses the order.",
    ),
  },
  "7|graph on the coordinate plane": {
    cloze: "Plot a point by moving to its ___-coordinate first, then its ___-coordinate.",
    examples: ex(
      "For (5, 2): right 5, then up 2",
      "The x move comes first, always.",
      "For (5, 2): up 5, then right 2",
      "That plots (2, 5), a different point.",
    ),
  },
  "7|coordinate plane": {
    examples: ex(
      "A grid with an x-axis and a y-axis crossing at 0",
      "Two number lines that let a pair name one point.",
      "A single number line",
      "One line can place a number, but not a pair.",
    ),
  },
  "7|ordered pair": {
    examples: ex(
      "(-4, 3): left 4, up 3",
      "The order tells you across first, then up.",
      "(3, -4) for the same point",
      "Swapping the numbers lands somewhere else entirely.",
    ),
  },
  "7|origin": {
    examples: ex(
      "(0, 0), where the axes cross",
      "Both coordinates are zero — the starting point.",
      "(0, 5)",
      "It sits on the y-axis, five units up from the origin.",
    ),
  },
  "7|quadrant": {
    examples: ex(
      "(-2, 5) lands in Quadrant II",
      "Negative x and positive y put it up and to the left.",
      "(0, 5)",
      "A point on an axis is in no quadrant at all.",
    ),
  },
  "7|reflection": {
    examples: ex(
      "(6, 4) across the x-axis becomes (6, -4)",
      "The axis you flip over keeps its coordinate; the other flips sign.",
      "(6, 4) across the x-axis becomes (-6, 4)",
      "That flipped x — a reflection across the y-axis instead.",
    ),
  },
  "7|distance on the coordinate plane": {
    cloze: "When two points share a coordinate, the distance is the ___ ___ of the difference.",
    examples: ex(
      "From (-6, 3) to (6, 3): |6 − (−6)| = 12",
      "Same y, so subtract the x-values and take the absolute value.",
      "From (-6, 3) to (6, 3): 6 − 6 = 0",
      "Dropping the negative sign loses the whole left-hand span.",
    ),
  },
  "7|distance": {
    examples: ex(
      "9.5 units between (-4.5, 3) and (5, 3)",
      "It counts the units between them, so it is positive.",
      "-9.5 units",
      "A distance is never negative, whichever way you travelled.",
    ),
  },
  "7|horizontal distance": {
    examples: ex(
      "|5 − (−4.5)| for two points that share a y-value",
      "Only the left-right coordinate changes.",
      "|3 − (−3.75)| for those same two points",
      "That measures up and down, not across.",
    ),
  },
  "7|vertical distance": {
    examples: ex(
      "|3 − (−3.75)| for two points that share an x-value",
      "Only the up-down coordinate changes.",
      "The distance along the x-axis",
      "That is horizontal — the wrong direction for this pair.",
    ),
  },
  "7|vertex": {
    visual: "The park's corner at (2, 4) — one corner, named by an ordered pair.",
    cloze: "A corner point of a polygon, named by an ordered pair, is a ___.",
    examples: ex(
      "(5, 4), where two sides of the park meet",
      "It is a corner, and a coordinate pair names it.",
      "The side running from (2, 4) to (5, 4)",
      "That is a side; a vertex is the point where sides meet.",
    ),
  },
  "7|polygon": {
    visual: "Plot (2, 4), (5, 4), (5, −4), (2, −4) and join them — a rectangle appears.",
    cloze: "A closed figure made of line segments is a ___.",
    examples: ex(
      "Four plotted vertices joined in order into a closed rectangle",
      "Straight sides, and the figure closes.",
      "Three points joined but left open",
      "An unclosed path is not a polygon.",
    ),
  },
  "7|perimeter": {
    visual: "2(9.5) + 2(6.75) = 32.5 units around the deck.",
    cloze: "The total distance around a polygon is its ___.",
    examples: ex(
      "Adding all four side lengths of the rectangle",
      "It measures the whole way around.",
      "Multiplying length by width",
      "That gives area — the space inside, not the distance around.",
    ),
  },
  "7|distance between vertices": {
    visual: "(2, 4) and (5, 4) share y, so the side is |5 − 2| = 3 units.",
    cloze: "When two vertices share a coordinate, subtract the other and take the ___ ___.",
    examples: ex(
      "|4 − (−4)| = 8 for two vertices that share an x-value",
      "Same x means a vertical side, found by subtracting the y-values.",
      "4 − (−4) read as 0",
      "Losing the negative sign collapses the side to nothing.",
    ),
  },
  "7|scale": {
    visual: "Each grid unit = 100 feet, so 8 units of map is 800 real feet.",
    cloze: "What one grid unit stands for in the real situation is the ___.",
    examples: ex(
      "1 unit = 100 feet on the park map",
      "It converts grid units into real distance.",
      "The number of units between two vertices",
      "That is a length on the grid; the scale is what a unit means.",
    ),
  },
  "7|ordered pairs in all four quadrants": {
    cloze: "The ___ of a point's two coordinates decide which quadrant it lands in.",
    examples: ex(
      "(-2, -3) landing in Quadrant III",
      "Both coordinates negative puts it down and to the left.",
      "(-2, -3) landing in Quadrant I",
      "Quadrant I needs both coordinates positive.",
    ),
  },
  "7|axis": {
    examples: ex(
      "The x-axis running across the grid",
      "One of the two number lines that frame the plane.",
      "The line joining two plotted points",
      "That is a segment inside the plane, not a frame for it.",
    ),
  },
  "7|reflect points across axes": {
    cloze: "Reflecting across an axis keeps that coordinate and flips the ___ one.",
    examples: ex(
      "(-3, -8) across the x-axis becomes (-3, 8)",
      "The x stayed; only the y changed sign.",
      "(-3, -8) across the x-axis becomes (3, -8)",
      "That changed the x, which is a reflection across the y-axis.",
    ),
  },
  "7|x-axis": {
    examples: ex(
      "Flipping (1, 4) over it to reach (1, -4)",
      "It runs across, so a flip over it changes the y sign.",
      "Flipping (1, 4) over it to reach (-1, 4)",
      "Changing x is a flip over the y-axis instead.",
    ),
  },
  "7|y-axis": {
    examples: ex(
      "Flipping (6, 4) over it to reach (-6, 4)",
      "It runs up and down, so a flip over it changes the x sign.",
      "Flipping (6, 4) over it to reach (6, -4)",
      "That changed y — a flip over the x-axis.",
    ),
  },
  "7|symmetry": {
    examples: ex(
      "A figure whose two halves mirror across the y-axis",
      "One side is the reflection of the other.",
      "A figure with four equal sides but no mirror line",
      "Equal sides do not guarantee matching halves.",
    ),
  },
  "7|perpendicular": {
    examples: ex(
      "The x-axis and the y-axis where they cross",
      "They meet at a square corner.",
      "Two grid lines running the same direction",
      "Parallel lines never meet, so they form no corner.",
    ),
  },
};

const lessons = readdirSync(LESSONS)
  .filter((name) => UNITS_4_7.test(name))
  .sort();

let fields = 0;
let files = 0;
const seen = new Set();

for (const lesson of lessons) {
  const file = join(LESSONS, lesson, "config.json");
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  const unit = String(config.unit);
  let changed = 0;
  for (const entry of config.vocabulary || []) {
    const key = `${unit}|${String(entry.term || "").toLowerCase()}`;
    const add = ENRICHMENT[key];
    if (!add) continue;
    seen.add(key);
    for (const [field, value] of Object.entries(add)) {
      if (entry[field]) continue;
      entry[field] = value;
      changed++;
    }
  }
  if (!changed) continue;
  fields += changed;
  files++;
  if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

const unused = Object.keys(ENRICHMENT).filter((key) => !seen.has(key));
if (unused.length) {
  console.error(`authored here but never matched a lesson term: ${unused.join(", ")}`);
  process.exit(1);
}
console.log(
  `${DRY ? "[dry-run] " : ""}units 4 & 7 vocabulary: ${fields} field(s) added across ${files} config(s)`,
);
