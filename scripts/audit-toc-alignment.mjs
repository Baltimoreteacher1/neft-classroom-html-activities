#!/usr/bin/env node
/**
 * Measure the gap between what this repo teaches and the publisher's Grade 6
 * Reveal Math table of contents (data/reveal-toc-2025.json).
 *
 * Reports only. It moves nothing, because the answer it produces is not a
 * renumbering — see below.
 *
 * WHY THIS IS NOT A "FIX THE NUMBERS" JOB
 * ---------------------------------------
 * The repo's `lessons/<unit>-<n>` sequence and the book's sequence are two
 * DIFFERENT scope-and-sequences that happen to share a lot of topics. The unit
 * boundaries themselves disagree: the book opens with a 6-lesson "Math Is..."
 * mindset unit and closes with another, folds statistics into Unit 2 with the
 * two division-algorithm lessons living inside it, teaches area AND volume AND
 * surface area together in Unit 5, and ends the mathematics with a
 * 4-lesson two-variable-relationships unit. The repo does none of those things.
 *
 * So a lesson-to-lesson mapping has four outcomes, not one, and only the first
 * is a move:
 *   SAME       the topic already sits at the book's number
 *   MOVE       the topic exists but at a different number
 *   NO-HOME    a repo lesson the book has no slot for (its content is real and
 *              currently taught — deleting or force-fitting it loses material)
 *   MISSING    a book lesson this repo has never written
 *
 * The mapping table below is authored by mathematical content, not by string
 * similarity, and anything genuinely ambiguous is marked so a human decides
 * rather than a script guessing.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const REPORTS = join(ROOT, "reports");

/**
 * repo lesson id -> book lesson number, or null when the book has no slot.
 * `note` explains every non-obvious call.
 */
const CROSSWALK = {
  // --- Unit 1: repo teaches factors/decimals; the book puts factors in 6-7 and
  //     the division algorithms in 2-6/2-7. The book's Unit 1 is a mindset unit.
  "1-1": {
    to: null,
    note: "Prime Factorization — book has no standalone lesson; nearest is 6-7 Find Factors and Multiples",
  },
  "1-2": {
    to: "6-7",
    note: "GCF — book folds GCF/LCM into 6-7 Find Factors and Multiples",
    ambiguous: true,
  },
  "1-3": {
    to: "6-7",
    note: "LCM — same book lesson as GCF; two repo lessons collapse into one",
    ambiguous: true,
  },
  "1-4": {
    to: "2-6",
    note: "Divide Multi-Digit Numbers -> 2-6 Divide Multi-Digit Numbers Using an Algorithm",
  },
  "1-5": {
    to: null,
    note: "Add and Subtract Decimals — book assumes this from Grade 5; no Grade 6 lesson",
  },
  "1-6": { to: null, note: "Multiply Decimals — book has no standalone lesson" },
  "1-7": { to: "2-7", note: "Divide Decimals -> 2-7 Divide Decimals Using an Algorithm" },

  // --- Unit 2: repo's fraction division is the book's Unit 6 opening.
  "2-1": {
    to: "6-1",
    note: "Interpret Division of Fractions -> 6-1 Division Expressions with Fractions and Whole Numbers",
  },
  "2-2": {
    to: "6-1",
    note: "Divide Whole Numbers by Fractions -> same book lesson as 2-1",
    ambiguous: true,
  },
  "2-3": {
    to: "6-2",
    note: "Divide Fractions -> 6-2 Division Expressions with Fractions and Mixed Numbers",
  },
  "2-4": { to: "6-2", note: "Divide Mixed Numbers -> same book lesson as 2-3", ambiguous: true },
  "2-5": {
    to: "6-2",
    note: "Fraction Division Problem Solving — book has no separate application lesson",
    ambiguous: true,
  },

  // --- Unit 3: ratios. Closest alignment in the whole curriculum.
  "3-1": { to: "3-1", note: "Understand Ratios" },
  "3-2": { to: "3-3", note: "Ratio Tables -> 3-3 Determine Equivalent Ratios Using Tables" },
  "3-3": { to: "3-4", note: "Graph Ratio Tables -> 3-4 Determine Equivalent Ratios Using Graphs" },
  "3-4": {
    to: "3-3",
    note: "Equivalent Ratios — overlaps 3-3; book has no separate lesson",
    ambiguous: true,
  },
  "3-5": { to: "3-5", note: "Compare Ratios -> 3-5 Compare Ratio Relationships" },
  "3-6": {
    to: "3-6",
    note: "Use Ratio Reasoning -> 3-6 Convert within the Same System",
    ambiguous: true,
  },
  "3-7": {
    to: "3-7",
    note: "Ratio and Rate Problem Solving -> 3-7 Convert Between Systems",
    ambiguous: true,
  },

  // --- Unit 4: repo mixes rates (book 3-2) with percent (book Unit 4).
  "4-1": {
    to: "3-2",
    note: "Rates and Unit Rates -> 3-2 Understand Rates and Unit Rates (book puts rates in Unit 3)",
  },
  "4-2": { to: "4-2", note: "Relate Fractions, Decimals, and Percents" },
  "4-3": {
    to: "4-1",
    note: "Percents >100% and <1% -> nearest is 4-1 Understand Percent",
    ambiguous: true,
  },
  "4-4": {
    to: "4-4",
    note: "Find the Percent of a Number -> 4-4 Find and Compare with Percentages",
  },
  "4-5": {
    to: "4-5",
    note: "Use Percent to Solve Problems -> 4-5 Determine the Whole Given the Part and Percent",
    ambiguous: true,
  },
  "4-6": {
    to: "3-6",
    note: "Convert Measurement Units -> book treats this as ratio reasoning in 3-6/3-7",
  },
  "4-7": { to: "3-2", note: "Solve Problems with Unit Rates -> folds into 3-2", ambiguous: true },

  // --- Unit 5: area. Book adds trapezoids at 5-3 and pulls volume/SA in.
  "5-1": { to: "5-1", note: "Area of Parallelograms -> 5-1 Parallelograms and Rhombuses" },
  "5-2": { to: "5-3", note: "Area of Trapezoids -> 5-3 (book orders triangles before trapezoids)" },
  "5-3": { to: "5-2", note: "Area of Triangles -> 5-2" },
  "5-4": { to: null, note: "Area of Regular Polygons — book has no such lesson" },
  "5-5": {
    to: "5-4",
    note: "Area of Composite Figures -> 5-4 Apply Area Concepts to Solve Problems",
    ambiguous: true,
  },

  // --- Unit 6: expressions. Book splits exponents across 6-3/6-4.
  "6-1": {
    to: "6-3",
    note: "Powers and Exponents -> 6-3 Explore Numerical Expressions with Exponents",
  },
  "6-2": {
    to: "6-4",
    note: "Evaluate Expressions -> 6-4 Write and Evaluate Numerical Expressions with Exponents",
  },
  "6-3": {
    to: "6-5",
    note: "Write Algebraic Expressions -> 6-5 Write and Evaluate Algebraic Expressions",
  },
  "6-4": {
    to: "6-8",
    note: "Properties of Operations -> 6-8 Generate Equivalent Expressions",
    ambiguous: true,
  },
  "6-5": { to: "6-8", note: "The Distributive Property -> 6-8", ambiguous: true },
  "6-6": {
    to: "6-6",
    note: "Equivalent Expressions -> 6-6 Identify Equivalent Algebraic Expressions",
  },
  "6-7": { to: "6-8", note: "Simplify Algebraic Expressions -> 6-8", ambiguous: true },

  // --- Unit 7 (repo) = Unit 8 (book): equations and inequalities.
  "7-1": {
    to: "8-1",
    note: "Write Equations -> 8-1 Understand Equations and Their Solutions",
    ambiguous: true,
  },
  "7-2": { to: "8-2", note: "Solve One-Step Addition/Subtraction Equations -> 8-2" },
  "7-3": { to: "8-3", note: "Solve Multiplication/Division Equations -> 8-3" },
  "7-4": { to: "8-4", note: "Write Inequalities -> 8-4 Write and Represent Inequalities" },
  "7-5": {
    to: "8-5",
    note: "Graph Inequalities -> 8-5 Understand Inequalities and Their Solutions",
    ambiguous: true,
  },
  "7-6": { to: "8-5", note: "Solve and Graph Inequalities -> 8-5", ambiguous: true },
  "7-7": {
    to: null,
    note: "Equations and Inequalities Problem Solving — book has no separate application lesson",
  },

  // --- Unit 8 (repo) = Unit 2 (book): statistics.
  "8-1": {
    to: "2-1",
    note: "Statistical Questions and Data -> 2-1 Understand Statistical Questions",
  },
  "8-2": {
    to: "2-3",
    note: "Mean, Median, and Mode -> book splits: 2-3 median, 2-8 mean",
    ambiguous: true,
  },
  "8-3": {
    to: "2-9",
    note: "Mean Absolute Deviation -> 2-9 Describe Data by Mean Absolute Deviation",
  },
  "8-4": { to: "2-10", note: "Appropriate Measures -> 2-10 Choose Appropriate Measures" },
  "8-5": {
    to: "2-4",
    note: "Display Data: Box Plots -> 2-4 Represent and Describe Data in a Box Plot",
  },
  "8-6": {
    to: "2-2",
    note: "Display Data: Histograms -> 2-2 Represent and Describe Data in a Histogram",
  },
  "8-7": {
    to: "2-5",
    note: "Shape of Data Distributions -> nearest is 2-5 Range and IQR",
    ambiguous: true,
  },

  // --- Unit 9 (repo) = Unit 7 (book): integers and the coordinate plane.
  "9-1": {
    to: "7-5",
    note: "Graph on the Coordinate Plane -> 7-5 Represent Rational Numbers on the Coordinate Plane",
    ambiguous: true,
  },
  "9-2": {
    to: "7-3",
    note: "Integers and Absolute Value -> 7-3 Understand Absolute Value",
    ambiguous: true,
  },
  "9-3": {
    to: "7-4",
    note: "Compare and Order Integers -> 7-4 Compare and Order Integers and Rational Numbers",
  },
  "9-4": { to: "7-2", note: "Rational Numbers on the Number Line -> 7-2" },
  "9-5": { to: "7-5", note: "Ordered Pairs in All Four Quadrants -> 7-5", ambiguous: true },
  "9-6": {
    to: "7-6",
    note: "Distance on the Coordinate Plane -> 7-6 Determine Distance on the Coordinate Plane",
  },
  "9-7": {
    to: null,
    note: "Reflect Points Across Axes — book folds reflection into 7-5/7-7, no standalone lesson",
  },

  // --- Unit 10 (repo) = Unit 5 (book): volume and surface area.
  "10-1": {
    to: "5-5",
    note: "Volume with Whole Number Edges -> 5-5 Determine the Volume of Rectangular Prisms",
    ambiguous: true,
  },
  "10-2": { to: "5-5", note: "Volume of Rectangular Prisms -> 5-5", ambiguous: true },
  "10-3": {
    to: "5-6",
    note: "Surface Area Using Nets -> 5-6 Represent Three-Dimensional Figures in Two Dimensions",
  },
  "10-4": { to: "5-7", note: "Surface Area of Prisms -> 5-7 Determine Surface Area of Prisms" },
  "10-5": { to: "5-8", note: "Surface Area of Pyramids -> 5-8 Determine Surface Area of Pyramids" },
};

const toc = JSON.parse(readFileSync(join(ROOT, "data/reveal-toc-2025.json"), "utf8"));
const bookLessons = new Map();
for (const unit of toc.units)
  for (const lesson of unit.lessons)
    bookLessons.set(lesson.n, { ...lesson, unitTitle: unit.title, unit: unit.unit });

const repo = [];
for (const id of readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d+-\d+$/.test(d.name))
  .map((d) => d.name)) {
  const file = join(LESSONS, id, "config.json");
  if (!existsSync(file)) continue;
  const config = JSON.parse(readFileSync(file, "utf8"));
  repo.push({ id, title: config.title || "", standard: config.standard || "" });
}
repo.sort((a, b) => {
  const [au, al] = a.id.split("-").map(Number);
  const [bu, bl] = b.id.split("-").map(Number);
  return au - bu || al - bl;
});

const same = [];
const move = [];
const noHome = [];
const collisions = new Map();
const unmapped = [];

for (const lesson of repo) {
  const entry = CROSSWALK[lesson.id];
  if (!entry) {
    unmapped.push(lesson);
    continue;
  }
  if (entry.to === null) {
    noHome.push({ ...lesson, note: entry.note });
    continue;
  }
  const row = { ...lesson, to: entry.to, note: entry.note, ambiguous: Boolean(entry.ambiguous) };
  (entry.to === lesson.id ? same : move).push(row);
  if (!collisions.has(entry.to)) collisions.set(entry.to, []);
  collisions.get(entry.to).push(lesson.id);
}

const claimed = new Set(
  Object.values(CROSSWALK)
    .map((e) => e.to)
    .filter(Boolean),
);
const missing = [...bookLessons.keys()].filter((n) => !claimed.has(n));
const merged = [...collisions.entries()].filter(([, ids]) => ids.length > 1);

const pct = (n) => `${Math.round((n / repo.length) * 100)}%`;
const lines = [
  "# Repo vs. publisher table of contents",
  "",
  `Generated by \`scripts/audit-toc-alignment.mjs\` · ${repo.length} repo lessons vs ${bookLessons.size} book lessons`,
  `Book source: ${toc.source} (captured ${toc.capturedAt})`,
  "",
  "## The headline",
  "",
  "**This is not a numbering drift — the two are different scope-and-sequences.**",
  "The book opens and closes with 6-lesson *Math Is...* mindset units, folds",
  "statistics into Unit 2 (with the two division-algorithm lessons inside it),",
  "teaches area, volume and surface area together in Unit 5, and ends with a",
  "4-lesson two-variable-relationships unit. This repo does none of those.",
  "",
  `- Already at the book's number: **${same.length}** (${pct(same.length)})`,
  `- Topic exists but at a different number: **${move.length}** (${pct(move.length)})`,
  `- Repo lessons the book has no slot for: **${noHome.length}**`,
  `- Book lessons this repo has never written: **${missing.length}**`,
  `- Book slots two or more repo lessons would collapse into: **${merged.length}**`,
  `- Mappings flagged ambiguous (a human must choose): **${[...move, ...same].filter((r) => r.ambiguous).length}**`,
  "",
  "## Book lessons with no content in this repo",
  "",
  ...(missing.length
    ? [
        "| Book | Title |",
        "| --- | --- |",
        ...missing.sort().map((n) => `| ${n} | ${bookLessons.get(n).title} |`),
        "",
      ]
    : ["None.", ""]),
  "## Repo lessons the book has no slot for",
  "",
  "These teach real content that is live in classrooms. Renumbering cannot",
  "place them; they would have to be kept as extras, merged, or retired.",
  "",
  "| Repo | Title | Note |",
  "| --- | --- | --- |",
  ...noHome.map((l) => `| ${l.id} | ${l.title} | ${l.note} |`),
  "",
  "## Book slots that two or more repo lessons map onto",
  "",
  "| Book | Repo lessons | Book title |",
  "| --- | --- | --- |",
  ...merged.map(
    ([to, ids]) => `| ${to} | ${ids.join(", ")} | ${bookLessons.get(to)?.title || "?"} |`,
  ),
  "",
  "## Full crosswalk",
  "",
  "| Repo | Repo title | → Book | Book title | Note |",
  "| --- | --- | --- | --- | --- |",
  ...[...same, ...move]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(
      (r) =>
        `| ${r.id} | ${r.title} | ${r.to === r.id ? "*(same)*" : `**${r.to}**`} | ${bookLessons.get(r.to)?.title || "?"} | ${r.ambiguous ? "⚠️ " : ""}${r.note} |`,
    ),
  "",
];

if (unmapped.length)
  lines.push(
    "## Not in the crosswalk at all",
    "",
    ...unmapped.map((l) => `- ${l.id} ${l.title}`),
    "",
  );

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "toc-alignment.md"), lines.join("\n"));

console.log(
  `TOC alignment: ${same.length} same · ${move.length} would move · ${noHome.length} no book home · ${missing.length} book lessons missing · ${merged.length} merge collisions`,
);
console.log("→ reports/toc-alignment.md");
