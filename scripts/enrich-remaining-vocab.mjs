#!/usr/bin/env node
// enrich-remaining-vocab.mjs — the last of the vocabulary scaffolding sweep.
//
//   node scripts/enrich-remaining-vocab.mjs [--dry-run]
//
// Units 1, 9, 10 (empty) and 4, 7 (partial) were filled first. These five had
// visuals on every term but almost no example pairs: 10 of 75 in Unit 2, 8 of
// 65 in Unit 3, 9 of 72 in Unit 5, 18 of 96 in Unit 6, 5 of 51 in Unit 8.
//
// The example pair is the field that separates recognising a word from using
// it — a definition tells a student what "outlier" means, an is/is-not pair
// tells them whether the 2 in their own data set is one. Missing clozes in the
// same terms are filled at the same time, because leaving a unit half-scaffolded
// is the state this sweep exists to end.
//
// Same contract as the earlier passes: fill only what is missing, in the unit's
// own context, across base lessons and their small-group / catch-up variants.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const LESSONS = "lessons";
const UNITS = /^(2|3|5|6|8)-\d{1,2}(?:-(?:group1|group2|catchup))?$/;

const ex = (yes, yesWhy, no, noWhy) => [
  { text: yes, isExample: true, why: yesWhy },
  { text: no, isExample: false, why: noWhy },
];

/** "unit|term" → fields to fill where missing. */
const ENRICHMENT = {
  // ── Unit 2 · data, decimals and division ────────────────────────────────
  "2|statistical questions and data": {
    cloze: "A question that expects varied answers you can collect is a ___ ___.",
    examples: ex(
      "“How tall is each student in my class?”",
      "Different students give different answers, so the data varies.",
      "“How tall is the teacher?”",
      "One person, one measurement — nothing varies.",
    ),
  },
  "2|data": {
    examples: ex(
      "The 20 quiz scores collected from the class",
      "Facts gathered from a group, ready to describe.",
      "The quiz itself",
      "The instrument is not the information it produced.",
    ),
  },
  "2|variability": {
    cloze: "How spread out the numbers in a data set are is its ___.",

    examples: ex(
      "Scores running from 68 to 94",
      "The values differ, which is what variability measures.",
      "Twenty students all scoring exactly 80",
      "Nothing varies, so there is no spread to describe.",
    ),
  },
  "2|survey": {
    examples: ex(
      "Asking every student how many minutes they read last night",
      "Facts collected by asking a group the same question.",
      "Looking up one fact in a book",
      "Nothing was collected from people.",
    ),
  },
  "2|data distribution": {
    examples: ex(
      "“Most scores cluster near 85, with one down at 68”",
      "It says where the data sits and how it spreads.",
      "“The highest score was 94”",
      "One value describes a point, not the shape of the set.",
    ),
  },
  "2|appropriate measures of center": {
    cloze: "A center chosen because it describes the data fairly is an ___ ___ ___ ___.",
    examples: ex(
      "Using the median when one salary is $40 million",
      "The outlier drags the mean; the median stays with the group.",
      "Using the mean in that same data set",
      "One extreme value pulls it away from every actual salary.",
    ),
  },
  "2|mean": {
    examples: ex(
      "(8 + 6 + 10) ÷ 3 = 8",
      "Add the values, then divide by how many there are.",
      "8 + 6 + 10 = 24",
      "That is the total; the mean still needs the division.",
    ),
  },
  "2|median": {
    examples: ex(
      "17 in 5, 9, 13, 17, 21, 25, 29",
      "The middle value once the numbers are in order.",
      "13 in the unsorted list 5, 25, 13, 9, 29",
      "Middle of an unsorted list is not the median.",
    ),
  },
  "2|outlier": {
    examples: ex(
      "The 2 in 18, 20, 21, 22, 2",
      "It sits far from every other value.",
      "The 22 in that same set",
      "It is the largest, but it is right beside the others.",
    ),
  },
  "2|add and subtract decimals": {
    cloze: "Line up equal ___ ___ before you add or subtract decimals.",
    examples: ex(
      "12.40 + 3.75 with the points lined up",
      "Equal place values sit in the same column.",
      "12.4 + 3.75 with the last digits lined up",
      "Aligning the ends puts tenths under hundredths.",
    ),
  },
  "2|decimal": {
    examples: ex(
      "0.5 for one half",
      "A part less than one, written after the point.",
      "5 for one half",
      "Without the point it is five wholes.",
    ),
  },
  "2|place value": {
    examples: ex(
      "The 5 in 12.5 meaning five tenths",
      "Its worth comes from the column it sits in.",
      "The 5 in 12.5 meaning five",
      "That reads the digit and ignores its column.",
    ),
  },
  "2|annex zeros": {
    examples: ex(
      "Writing 12.4 as 12.40 to subtract 8.36",
      "The extra zero gives the hundredths column a digit.",
      "Writing 12.4 as 124",
      "That changes the value instead of padding it.",
    ),
  },
  "2|multiply decimals": {
    cloze: "Count the decimal places in BOTH factors to place the ___ ___.",
    examples: ex(
      "2.4 × 3.15 = 7.560, three decimal places in all",
      "One place plus two places is three places.",
      "2.4 × 3.15 = 75.60",
      "Only two places were counted, so the point landed too far right.",
    ),
  },
  "2|product": {
    examples: ex(
      "42 from 6 × 7",
      "It is the result of multiplying.",
      "13 from 6 + 7",
      "That is a sum.",
    ),
  },
  "2|decimal point": {
    examples: ex(
      "The dot in 78.5 separating 78 from 5 tenths",
      "It marks where the whole number ends.",
      "The comma in 1,250",
      "That groups thousands; it does not split off a part.",
    ),
  },
  "2|estimate": {
    examples: ex(
      "8.6% of 216 ≈ 10% of 200 = 20",
      "Rounded to friendly numbers, close enough to be useful.",
      "8.6% of 216 = 18.576",
      "That is the exact answer, not an estimate.",
    ),
  },
  "2|display data with histograms": {
    cloze: "A histogram groups numerical data into equal ___ and shows each one's ___.",
    examples: ex(
      "Bars for 0–9, 10–19, 20–29, each the same width",
      "Equal intervals with no gaps between them.",
      "Bars for 0–5, 6–10, 12–18",
      "Unequal widths and a gap at 11 hide where values fall.",
    ),
  },
  "2|frequency": {
    examples: ex(
      "10 students scoring in the 80–89 interval",
      "It counts how many values landed there.",
      "The 80–89 interval itself",
      "That is the range; the frequency is the count inside it.",
    ),
  },
  "2|interval": {
    examples: ex(
      "0–9, then 10–19",
      "Equal ranges used to group values.",
      "0–9, then 12–18",
      "The widths differ and 10–11 has nowhere to go.",
    ),
  },
  "2|distribution": {
    examples: ex(
      "A peak at 10–11 seconds with a tail out to 14.8",
      "It describes the overall shape of the data.",
      "The single value 14.8",
      "One value is not a shape.",
    ),
  },
  "2|describe the data using the median": {
    cloze: "When one value sits far from the rest, describe the typical value with the ___.",
    examples: ex(
      "Reporting a median of 2 when one salary is 40",
      "The median stays with the group the outlier left behind.",
      "Reporting the mean of 6.75 for that same set",
      "No player earns anything near it.",
    ),
  },
  "2|mode": {
    examples: ex(
      "15 in 12, 15, 15, 18",
      "It appears more often than any other value.",
      "18 in that set",
      "It is the largest, not the most frequent.",
    ),
  },
  "2|display data with box plots": {
    cloze: "A box plot shows the ___-number summary: least, Q1, median, Q3, greatest.",
    examples: ex(
      "A box from Q1 75.5 to Q3 88 with whiskers to 68 and 94",
      "All five summary numbers are placed.",
      "A bar chart of the same scores",
      "Bars show counts, not quartiles.",
    ),
  },
  "2|box plot": {
    examples: ex(
      "A box holding the middle half, with whiskers to the extremes",
      "It displays the five-number summary.",
      "A line graph of scores over time",
      "That tracks change, not spread.",
    ),
  },
  "2|quartile": {
    cloze: "Numbers that split ordered data into four equal parts are ___.",

    examples: ex(
      "Q1 = 9 for the lower half 4, 8, 10, 14",
      "It is the median OF that half.",
      "The smallest value, 4",
      "That is the minimum, not a quartile.",
    ),
  },
  "2|interquartile range": {
    cloze: "The spread of the middle half of the data, Q3 − Q1, is the ___ ___.",

    examples: ex(
      "88 − 75.5 = 12.5",
      "Q3 minus Q1 — the middle half's width.",
      "94 − 68 = 26",
      "That is the range, using the extremes.",
    ),
  },
  "2|range and interquartile range": {
    cloze: "The range uses the ___ values; the interquartile range uses the ___.",
    examples: ex(
      "Range 26 with IQR 12.5",
      "The IQR is always the smaller of the two — it sits inside the range.",
      "Range 12.5 with IQR 26",
      "The middle half cannot be wider than all of the data.",
    ),
  },
  "2|range": {
    cloze: "Subtract the least value from the ___ value to find the range.",
    examples: ex(
      "30 − 12 = 18",
      "Greatest minus least.",
      "30 + 12 = 42",
      "A range is a difference, never a sum.",
    ),
  },
  "2|measure of variation": {
    cloze: "A single number describing how spread out a data set is is a ___ ___ ___.",
    examples: ex(
      "An IQR of 12.5",
      "It reports spread in one number.",
      "A median of 83.5",
      "That reports the center, not the spread.",
    ),
  },
  "2|divide multi-digit numbers": {
    cloze: "Long division repeats four steps: divide, multiply, subtract, ___ ___.",
    examples: ex(
      "1,134 ÷ 9 = 126 with every digit brought down",
      "The cycle runs until the last digit is used.",
      "Stopping at 12 with the 4 still waiting",
      "A digit left unused means the quotient is unfinished.",
    ),
  },
  "2|dividend": {
    examples: ex(
      "The 252 in 252 ÷ 6",
      "It is the amount being split.",
      "The 6 in 252 ÷ 6",
      "That is the divisor.",
    ),
  },
  "2|divisor": {
    examples: ex(
      "The 6 in 252 ÷ 6",
      "It is what you split by.",
      "The 42 you get",
      "That is the quotient.",
    ),
  },
  "2|quotient": {
    examples: ex(
      "The 42 in 252 ÷ 6 = 42",
      "It is the result of dividing.",
      "The 252",
      "That is the dividend you started with.",
    ),
  },
  "2|long division": {
    examples: ex(
      "Divide, multiply, subtract, bring down — repeated to the last digit",
      "The full four-step cycle.",
      "Dividing once and writing a remainder immediately",
      "The cycle has to repeat until every digit is used.",
    ),
  },
  "2|bring down": {
    examples: ex(
      "Moving the 4 of 1,134 down beside the leftover 2",
      "The next digit joins what is left.",
      "Writing the 4 in the answer",
      "Digits come down into the work, not up into the quotient.",
    ),
  },
  "2|divide decimals": {
    cloze:
      "Make the ___ a whole number first, then move the dividend's point the same number of places.",
    examples: ex(
      "6.4 ÷ 0.8 rewritten as 64 ÷ 8",
      "Both moved one place, so the quotient is unchanged.",
      "6.4 ÷ 0.8 rewritten as 6.4 ÷ 8",
      "Only the divisor moved, so the answer is ten times too small.",
    ),
  },
  "2|decimal division": {
    examples: ex(
      "0.12)1.44 rewritten as 12)144",
      "Both numbers moved two places.",
      "0.12)1.44 rewritten as 12)14.4",
      "The dividend moved only one place.",
    ),
  },
  "2|equivalent division": {
    examples: ex(
      "64 ÷ 8 in place of 6.4 ÷ 0.8",
      "Both scaled by 10, so the quotient holds.",
      "64 ÷ 0.8 in place of 6.4 ÷ 0.8",
      "Only one number scaled.",
    ),
  },
  "2|average": {
    examples: ex(
      "11 from 8, 12, 10, 14",
      "Total 44 shared equally across 4 values.",
      "44 from those values",
      "That is the total before sharing.",
    ),
  },
  "2|measure of center": {
    examples: ex(
      "A median of 83.5",
      "One number standing for the typical value.",
      "A range of 26",
      "That describes spread, not center.",
    ),
  },
  "2|balance point": {
    examples: ex(
      "The mean of 10 in 7, 10, 13",
      "Distances above and below it cancel out.",
      "The largest value, 13",
      "Everything sits below it, so nothing balances.",
    ),
  },
  "2|data set": {
    examples: ex(
      "All 20 history scores together",
      "The whole collection that was gathered.",
      "The single score 94",
      "One value is a member, not the set.",
    ),
  },
  "2|mean absolute deviation": {
    examples: ex(
      "(3 + 0 + 3) ÷ 3 = 2",
      "Absolute distances from the mean, then averaged.",
      "(−3 + 0 + 3) ÷ 3 = 0",
      "Signed deviations always cancel — that is why they are made absolute.",
    ),
  },
  "2|deviation": {
    examples: ex(
      "7 being 3 away from a mean of 10",
      "It measures distance from the mean.",
      "7 being 3 away from 4",
      "Deviation is measured from the mean, not another value.",
    ),
  },
  "2|spread": {
    examples: ex(
      "Values running 5 to 25",
      "They are far apart.",
      "Values all equal to 15",
      "Nothing is spread out.",
    ),
  },

  // ── Unit 3 · ratios, rates and measurement ──────────────────────────────
  "3|understand ratios": {
    cloze: "A comparison of two quantities by division is a ___.",
    examples: ex(
      "3 cups of flour to 2 eggs",
      "It compares two quantities.",
      "3 cups of flour",
      "One amount alone compares nothing.",
    ),
  },
  "3|convert measurement units": {
    cloze: "Renaming a measurement in a different unit without changing the amount is to ___ it.",
    examples: ex(
      "4 feet written as 48 inches",
      "Same length, different unit.",
      "4 feet written as 4 inches",
      "The amount changed, not just the unit.",
    ),
  },
  "3|conversion factor": {
    cloze: "The ratio that trades one unit for another is a ___ ___.",

    examples: ex(
      "1 foot = 12 inches",
      "The ratio that trades one unit for another.",
      "The 4 in “4 feet”",
      "That is the amount being converted.",
    ),
  },
  "3|unit": {
    examples: ex(
      "The inch in “48 inches”",
      "A standard amount you measure with.",
      "The 48",
      "That counts units; it is not one.",
    ),
  },
  "3|equivalent": {
    examples: ex(
      "4 feet and 48 inches",
      "The same amount, named two ways.",
      "4 feet and 4 inches",
      "Different amounts entirely.",
    ),
  },
  "3|ratio": {
    examples: ex(
      "5 tokens to $3",
      "Two quantities compared.",
      "5 tokens",
      "Nothing to compare it against.",
    ),
  },
  "3|ratio table": {
    cloze: "A table whose every column holds the same comparison is a ___ ___.",

    examples: ex(
      "juice 2, 4, 6 beside water 3, 6, 9",
      "Every column holds the same ratio.",
      "juice 2, 4, 6 beside water 3, 6, 10",
      "The last column breaks the pattern.",
    ),
  },
  "3|rates and unit rates": {
    cloze: "A rate compares different units; a ___ ___ compares a quantity to exactly 1 unit.",
    examples: ex(
      "$0.75 per token",
      "It gives the amount for one unit.",
      "$9.00 for 12 tokens",
      "A rate, but not yet per one.",
    ),
  },
  "3|rate": {
    examples: ex(
      "60 miles per hour",
      "Two different units compared.",
      "60 miles",
      "A single measurement, not a comparison.",
    ),
  },
  "3|per": {
    examples: ex(
      "$5 per book meaning $5 for each book",
      "It means “for each one”.",
      "$5 for 3 books",
      "That is a total for three, not each.",
    ),
  },
  "3|better buy": {
    examples: ex(
      "$0.70 per token beating $0.75 per token",
      "The lower cost per item wins.",
      "The pack with more tokens",
      "More is not cheaper per token.",
    ),
  },
  "3|divide": {
    examples: ex(
      "$9.00 ÷ 12 tokens = $0.75 each",
      "Splitting a total into equal parts.",
      "$9.00 × 12",
      "That grows the total instead of sharing it.",
    ),
  },
  "3|ratio tables": {
    cloze: "A table whose every row holds the same comparison is a ___ ___.",
    examples: ex(
      "Rows 1:4, 2:8, 3:12",
      "Each row scales both parts equally.",
      "Rows 1:4, 2:8, 3:11",
      "The last row was not scaled.",
    ),
  },
  "3|equivalent ratio": {
    cloze: "Two ratios that make the same comparison are ___ ___.",
    examples: ex("1:2 and 2:4", "Both parts doubled.", "1:2 and 2:3", "Only one part changed."),
  },
  "3|scale factor": {
    examples: ex(
      "The 4 that turns 3:8 into 12:32",
      "Both parts multiplied by it.",
      "The 9 added to turn 3 into 12",
      "Scaling multiplies; it never adds.",
    ),
  },
  "3|pattern": {
    examples: ex(
      "2, 4, 6, 8 — add 2 each time",
      "The rule repeats predictably.",
      "2, 9, 4, 30",
      "No rule connects them.",
    ),
  },
  "3|additive pattern": {
    examples: ex(
      "Going down a ratio table by +2 and +3 together",
      "Each column grows by its own constant.",
      "Adding 2 to one column only",
      "That breaks the ratio.",
    ),
  },
  "3|graph ratio tables": {
    cloze: "Each row of a ratio table becomes one ___ ___ on the coordinate plane.",
    examples: ex(
      "(1, 45), (2, 90), (3, 135) in a straight line",
      "Equivalent ratios plot straight.",
      "Points scattered off the line",
      "Those rows are not equivalent.",
    ),
  },
  "3|coordinate plane": {
    examples: ex(
      "A grid with an x-axis and a y-axis",
      "Two lines that let a pair name a point.",
      "A single number line",
      "One line cannot place a pair.",
    ),
  },
  "3|ordered pair": {
    examples: ex(
      "(2, 90) for 2 tickets at $45",
      "First value across, second up.",
      "(90, 2) for the same purchase",
      "Reversed, it plots elsewhere.",
    ),
  },
  "3|linear pattern": {
    examples: ex(
      "Points climbing evenly in a straight line",
      "A constant rate draws a line.",
      "Points curving upward faster and faster",
      "The rate is changing.",
    ),
  },
  "3|proportional": {
    examples: ex(
      "Doubling the tickets doubling the cost",
      "Both grow at the same rate.",
      "Cost jumping $10 after the third ticket",
      "The rate changed partway.",
    ),
  },
  "3|origin": {
    examples: ex(
      "(0, 0) where the axes cross",
      "Zero of both quantities.",
      "(0, 5)",
      "That sits five up the y-axis.",
    ),
  },
  "3|compare ratios": {
    cloze: "Make the ___ match, or find each ___ ___, before deciding which ratio is greater.",
    examples: ex(
      "Comparing $0.75 and $0.70 per token",
      "Both reduced to the same unit.",
      "Comparing $9.00 with $14.00",
      "Different quantities, so the totals say nothing.",
    ),
  },
  "3|unit rate": {
    examples: ex(
      "$2 per pound",
      "The amount for exactly one unit.",
      "$6 for 3 pounds",
      "A rate for three, not one.",
    ),
  },
  "3|compare": {
    examples: ex(
      "Deciding 0.70 is less than 0.75",
      "It judges one against the other.",
      "Listing both prices",
      "Nothing was decided.",
    ),
  },
  "3|simplify": {
    examples: ex(
      "12:18 written as 2:3",
      "Both parts divided by 6.",
      "12:18 written as 2:18",
      "Only one part was divided.",
    ),
  },
  "3|common denominator": {
    examples: ex(
      "Rewriting 2/3 and 3/4 as 8/12 and 9/12",
      "One shared bottom number.",
      "Comparing 2/3 and 3/4 by their tops",
      "Different wholes make the tops meaningless.",
    ),
  },
  "3|convert measurements within the same system": {
    cloze: "Feet into inches stays inside the ___ measurement system.",
    examples: ex(
      "Cups into quarts",
      "Both are customary units of capacity.",
      "Cups into liters",
      "That crosses into the metric system.",
    ),
  },
  "3|unit ratio": {
    cloze: "A ratio comparing an amount to exactly ___ unit is a unit ratio.",
    examples: ex(
      "12 inches : 1 foot",
      "The second term is exactly one.",
      "24 inches : 2 feet",
      "True, but not stated per one.",
    ),
  },
  "3|convert": {
    cloze: "To change a measurement to another unit without changing the amount is to ___.",
    examples: ex(
      "3 liters written as 3,000 mL",
      "Same volume, smaller unit, bigger number.",
      "3 liters written as 3 mL",
      "The amount shrank a thousandfold.",
    ),
  },
  "3|measurement system": {
    cloze:
      "Inches and feet belong to the customary ___ ___; centimeters and meters to the metric one.",
    examples: ex(
      "Ounces, pounds and tons together",
      "One family of units.",
      "Ounces and grams together",
      "Two different systems.",
    ),
  },
  "3|double number line": {
    cloze: "Two lines whose matching ticks show the same amount in two units form a ___ ___ ___.",
    examples: ex(
      "Quarts on one line, cups on the other, aligned",
      "Matching positions pair the units.",
      "One line with only quarts",
      "Nothing to pair against.",
    ),
  },
  "3|convert measurements between systems": {
    cloze:
      "Rewriting a customary measurement as a metric one gives an ___ answer, not an exact one.",
    examples: ex(
      "80 km ≈ 48 miles",
      "Across systems, so approximate.",
      "80 km = 48 miles exactly",
      "The factor is rounded; = claims too much.",
    ),
  },
  "3|customary system": {
    cloze: "Inches, pounds and gallons belong to the ___ system.",
    examples: ex(
      "A gallon of milk",
      "A customary unit of capacity.",
      "A liter of soda",
      "That is metric.",
    ),
  },
  "3|metric system": {
    cloze: "Centimeters, grams and liters belong to the ___ system, built on tens.",
    examples: ex("500 milliliters", "A metric unit of capacity.", "1 quart", "That is customary."),
  },
  "3|approximately": {
    cloze: "Close to but not exactly equal is ___ — written with ≈.",
    examples: ex(
      "1 mile ≈ 1.6 km",
      "The factor is rounded, so ≈ is honest.",
      "1 mile = 1.6 km",
      "It is 1.609344…, so = is a false claim.",
    ),
  },
  "3|unit rate problem solving": {
    cloze: "Find the amount per ___ unit, then use it to compare the choices.",
    examples: ex(
      "$0.75 and $0.70 per token, so the second booth wins",
      "Both reduced to per one, then compared.",
      "Choosing the booth with more tokens",
      "Quantity is not price per token.",
    ),
  },
  "3|comparison": {
    examples: ex(
      "Saying 0.70 is less than 0.75",
      "Two amounts held against each other.",
      "Saying 0.70",
      "One amount on its own.",
    ),
  },
  "3|per unit": {
    examples: ex(
      "$1.75 per pound",
      "The cost of one single unit.",
      "$8.75 for 5 pounds",
      "That is the total.",
    ),
  },
  "3|proportion": {
    examples: ex(
      "3/12 = 5/20",
      "Two equal ratios stated as one sentence.",
      "3/12 + 5/20",
      "Adding ratios is not a proportion.",
    ),
  },
  "3|equivalent ratios": {
    cloze: "Ratios that compare quantities in the same relationship are ___ ___.",
    examples: ex(
      "2:8 and 1:4",
      "Both parts scaled by the same factor.",
      "2:8 and 2:5",
      "Only one part changed.",
    ),
  },

  // ── Unit 5 · area, surface area and volume ──────────────────────────────
  "5|area of parallelograms": {
    examples: ex(
      "A = 9 × 6 using the perpendicular height",
      "Base times the height that meets it at a right angle.",
      "A = 9 × 10 using the slanted side",
      "The slant is longer than the true height.",
    ),
  },
  "5|slanted side": {
    examples: ex(
      "The 10 cm edge leaning across a parallelogram",
      "It leans, so it is not the height.",
      "The 6 cm straight-up distance",
      "That IS the height.",
    ),
  },
  "5|parallel": {
    examples: ex(
      "The two bases of a trapezoid",
      "They stay the same distance apart.",
      "Two sides that meet at a corner",
      "Lines that meet are not parallel.",
    ),
  },
  "5|base": {
    examples: ex(
      "The 12 in side you measured the height from",
      "Once chosen, the height is measured to it.",
      "Any side, with a height measured to a different one",
      "Base and height must be a matched pair.",
    ),
  },
  "5|height": {
    examples: ex(
      "The 7 ft perpendicular distance to the base",
      "It meets the base at a square corner.",
      "The 10 ft slanted edge",
      "That is longer than the straight-up distance.",
    ),
  },
  "5|perpendicular": {
    examples: ex(
      "A height meeting its base at 90°",
      "They form a square corner.",
      "A height drawn at a slant",
      "No right angle, so it is not the height.",
    ),
  },
  "5|area": {
    examples: ex(
      "8 square feet of planter surface",
      "Flat space, measured in square units.",
      "8 cubic feet of soil",
      "That fills a space — volume.",
    ),
  },
  "5|composite figure": {
    examples: ex(
      "A rectangle with a triangle on top",
      "Two simple shapes joined.",
      "A single rectangle",
      "Nothing was combined.",
    ),
  },
  "5|formula": {
    examples: ex(
      "A = ½ × b × h",
      "A rule written in symbols.",
      "“Multiply the two numbers”",
      "Words, not a symbolic rule.",
    ),
  },
  "5|volume of rectangular prisms": {
    examples: ex(
      "V = 8 × 3 × 10 = 240 cubic inches",
      "All three dimensions multiplied.",
      "V = 8 + 3 + 10",
      "Adding dimensions gives no volume.",
    ),
  },
  "5|volume": {
    examples: ex(
      "The soil filling a 4 × 2 × 1 planter",
      "Space inside, in cubic units.",
      "The paper wrapping it",
      "That covers the outside — surface area.",
    ),
  },
  "5|rectangular prism": {
    examples: ex(
      "A cereal box",
      "Six flat rectangular faces.",
      "A soup can",
      "Curved, so not a prism of rectangles.",
    ),
  },
  "5|cubic units": {
    examples: ex(
      "240 cubic inches",
      "Units of space inside.",
      "240 square inches",
      "Square units cover flat space.",
    ),
  },
  "5|dimensions": {
    examples: ex(
      "8 in by 3 in by 10 in",
      "Length, width and height together.",
      "8 in",
      "One measurement is not the set.",
    ),
  },
  "5|net": {
    examples: ex(
      "Six rectangles that fold into a box",
      "Flat now, solid when folded.",
      "A drawing of the finished box",
      "A picture of the solid is not its net.",
    ),
  },
  "5|base area": {
    examples: ex(
      "6 × 4 = 24 in² as B in V = Bh",
      "The area of the bottom face.",
      "The 72 in³ volume",
      "That is B times the height.",
    ),
  },
  "5|area of a triangle": {
    examples: ex(
      "½ × 10 × 6 = 30",
      "Half the matching rectangle.",
      "10 × 6 = 60",
      "That is the whole rectangle.",
    ),
  },
  "5|area of trapezoids": {
    examples: ex(
      "½ (b₁ + b₂) h",
      "Both bases averaged, then times the height.",
      "(b₁ + b₂) h",
      "That is a whole parallelogram — twice too big.",
    ),
  },
  "5|base 1 (b1)": {
    examples: ex(
      "The shorter parallel side",
      "One of the two parallel sides.",
      "The slanted leg",
      "That is not parallel to the other base.",
    ),
  },
  "5|base 2 (b2)": {
    examples: ex(
      "The longer parallel side",
      "The second parallel side.",
      "The height",
      "That crosses the bases at a right angle.",
    ),
  },
  "5|area of composite figures": {
    examples: ex(
      "40 + 12 = 52 sq ft for two joined pieces",
      "Areas added when pieces are joined.",
      "40 × 12",
      "Multiplying areas gives no area.",
    ),
  },
  "5|decompose": {
    examples: ex(
      "Splitting an L-shape into two rectangles",
      "Broken into shapes you can compute.",
      "Drawing one line across it and stopping",
      "Neither piece is a simple shape yet.",
    ),
  },
  "5|add": {
    examples: ex(
      "Joining a 198 and a 54 piece for 252",
      "Pieces joined, so areas add.",
      "Adding a piece that was cut away",
      "A removed piece is subtracted.",
    ),
  },
  "5|subtract": {
    examples: ex(
      "144 − 20 for a closet cut from the floor",
      "The missing piece comes off.",
      "144 + 20 for that closet",
      "Adding puts back what was removed.",
    ),
  },
  "5|volume with whole-number edges": {
    examples: ex(
      "Counting 60 unit cubes in a 5 × 4 × 3 box",
      "Cubes fill it exactly.",
      "Counting 12 edge units",
      "Edges are lengths, not cubes.",
    ),
  },
  "5|length, width, height": {
    examples: ex(
      "5 cm, 4 cm and 3 cm together",
      "All three dimensions of the box.",
      "5 cm alone",
      "One dimension cannot give volume.",
    ),
  },
  "5|edge": {
    examples: ex(
      "The line where two faces meet",
      "A boundary between faces.",
      "A whole face",
      "That is a surface, not a line.",
    ),
  },
  "5|surface area using nets": {
    examples: ex(
      "Adding all six rectangles of the unfolded box",
      "Every face counted once.",
      "Adding five of them",
      "A box has six faces.",
    ),
  },
  "5|surface area": {
    examples: ex(
      "52 in² of wrapping paper",
      "The outside, in square units.",
      "40 in³ of space inside",
      "That is volume.",
    ),
  },
  "5|face": {
    examples: ex(
      "The front rectangle of a box",
      "One flat side.",
      "The corner where three sides meet",
      "That is a vertex.",
    ),
  },
  "5|two-dimensional": {
    examples: ex(
      "A rectangle drawn on paper",
      "Length and width, no thickness.",
      "A cereal box",
      "It has depth as well.",
    ),
  },
  "5|surface area of prisms": {
    examples: ex(
      "2(lw) + 2(lh) + 2(wh)",
      "Three pairs of matching faces.",
      "lw + lh + wh",
      "Each pair was counted only once.",
    ),
  },
  "5|lateral face": {
    examples: ex(
      "The side rectangles of a prism",
      "The faces that are not top or bottom.",
      "The base",
      "That is the bottom.",
    ),
  },
  "5|surface area of pyramids": {
    examples: ex(
      "64 + 4 × 40 = 224 in²",
      "Base plus every triangular face.",
      "4 × 40 alone",
      "The base was left out.",
    ),
  },
  "5|slant height": {
    examples: ex(
      "The 9 in measured along a side triangle",
      "It runs up the slanted face.",
      "The pyramid's straight-up height",
      "That is inside the solid, not on a face.",
    ),
  },
  "5|apex": {
    examples: ex(
      "The single point at a pyramid's top",
      "Where all the side faces meet.",
      "A corner of the base",
      "That is a base vertex.",
    ),
  },
  "5|lateral area": {
    examples: ex(
      "4 × 40 = 160 in² of side triangles",
      "Sides only, base excluded.",
      "224 in² including the base",
      "That is the total surface area.",
    ),
  },
  "5|area of regular polygons": {
    examples: ex(
      "6 × 14 = 84 sq in for a hexagon of six triangles",
      "Split from the centre into identical triangles.",
      "14 sq in",
      "That is one triangle of six.",
    ),
  },
  "5|triangle": {
    examples: ex(
      "A three-sided face of a pyramid",
      "Three sides.",
      "A trapezoid",
      "Four sides, two of them parallel.",
    ),
  },
  "5|composite": {
    examples: ex(
      "A rectangle plus a triangle",
      "Built from simple shapes.",
      "A plain circle",
      "Nothing was combined.",
    ),
  },

  // ── Unit 6 · fractions, factors and expressions ─────────────────────────
  "6|division of fractions": {
    cloze: "Dividing asks how many groups of one ___ fit inside another amount.",
    examples: ex(
      "9 ÷ 1/4 = 36 quarter-foot pieces",
      "It counts the groups that fit.",
      "9 × 1/4 = 2.25",
      "Multiplying takes a part instead of counting groups.",
    ),
  },
  "6|dividend": {
    examples: ex(
      "The 3/4 in 3/4 ÷ 1/8",
      "The total being split.",
      "The 1/8",
      "That is the size of each group.",
    ),
  },
  "6|divisor": {
    examples: ex(
      "The 1/8 in 3/4 ÷ 1/8",
      "The size of each group.",
      "The 6 you get",
      "That is the quotient.",
    ),
  },
  "6|quotient": {
    examples: ex(
      "The 6 in 3/4 ÷ 1/8 = 6",
      "The result of dividing.",
      "The 3/4",
      "That is the dividend.",
    ),
  },
  "6|divide mixed numbers": {
    cloze: "Rewrite each mixed number as an ___ ___ before you flip and multiply.",
    examples: ex(
      "2 1/2 ÷ 1/4 rewritten as 5/2 × 4/1",
      "Converted first, then flipped.",
      "2 1/2 ÷ 1/4 flipped as 1/2 2",
      "A mixed number cannot be flipped as it stands.",
    ),
  },
  "6|convert": {
    examples: ex(
      "2 1/3 written as 7/3",
      "Same value, new form.",
      "2 1/3 written as 6/3",
      "The numerator was dropped.",
    ),
  },
  "6|simplify": {
    examples: ex(
      "2/4 written as 1/2",
      "Same value, smaller parts.",
      "2/4 written as 1/4",
      "The value changed.",
    ),
  },
  "6|reciprocal": {
    examples: ex(
      "4/3 for 3/4",
      "The fraction turned upside down.",
      "−3/4 for 3/4",
      "That is the opposite, not the reciprocal.",
    ),
  },
  "6|fraction division problem solving": {
    cloze: "Name the total and the size of each group, then divide the ___ by the ___.",
    examples: ex(
      "4/5 ÷ 1/10 for bows from ribbon",
      "Total first, group size second.",
      "1/10 ÷ 4/5",
      "Reversed, it answers a different question.",
    ),
  },
  "6|model": {
    examples: ex(
      "A tape diagram of 4/5 split into tenths",
      "It shows the structure of the problem.",
      "The final answer, 8",
      "A result is not a model.",
    ),
  },
  "6|equation": {
    examples: ex("2.5h = 1,000", "Two sides set equal.", "2.5h", "No equals sign — an expression."),
  },
  "6|solution": {
    examples: ex(
      "h = 400 for 2.5h = 1,000",
      "It makes both sides equal.",
      "h = 40",
      "2.5 × 40 is 100, not 1,000.",
    ),
  },
  "6|reasonableness": {
    examples: ex(
      "Noticing 5/6 of 540 cannot be 650",
      "Checked against the situation.",
      "Accepting it because the steps looked neat",
      "Neat steps can still answer the wrong question.",
    ),
  },
  "6|inverse operations": {
    examples: ex(
      "Dividing to undo multiplying",
      "Each undoes the other.",
      "Multiplying to undo multiplying",
      "That compounds instead of undoing.",
    ),
  },
  "6|least common multiple": {
    cloze: "The smallest number that is a multiple of both is their ___ ___ ___.",
    examples: ex(
      "24 for 8 and 6",
      "The first number in both lists.",
      "48 for 8 and 6",
      "Also common, but not the least.",
    ),
  },
  "6|common multiple": {
    examples: ex(
      "24 appearing in both the 8s and the 6s",
      "Both numbers reach it.",
      "10 for 4 and 6",
      "Neither list contains 10.",
    ),
  },
  "6|skip counting": {
    examples: ex(
      "8, 16, 24, 32",
      "Counting by a number to list multiples.",
      "8, 4, 2, 1",
      "Those are factors, counted downward.",
    ),
  },
  "6|prime factorization": {
    cloze: "Writing a number as ___ numbers multiplied together is its prime factorization.",
    examples: ex(
      "30 = 2 × 3 × 5",
      "Every factor is prime.",
      "30 = 5 × 6",
      "6 is composite; the tree is unfinished.",
    ),
  },
  "6|factor tree": {
    examples: ex(
      "48 split until every branch is prime",
      "It ends in primes only.",
      "48 split into 6 × 8 and stopped",
      "Both branches can still split.",
    ),
  },
  "6|the distributive property": {
    cloze: "a(b + c) = ab + ___ — the factor reaches ___ term.",
    examples: ex(
      "3(x + 4) = 3x + 12",
      "Both terms multiplied.",
      "3(x + 4) = 3x + 4",
      "The 4 was left untouched.",
    ),
  },
  "6|factor": {
    cloze: "A number that divides another exactly, with no remainder, is a ___.",
    examples: ex(
      "4 dividing 12 exactly",
      "It divides with nothing left over.",
      "24 for the number 12",
      "A factor is never larger than its number.",
    ),
  },
  "6|expand": {
    examples: ex(
      "5(3x + 2) written as 15x + 10",
      "The parentheses are multiplied out.",
      "5(3x + 2) written as 15x + 2",
      "Only the first term was multiplied.",
    ),
  },
  "6|equivalent": {
    cloze: "Expressions that always have the same value are ___.",
    examples: ex(
      "3x + 2x and 5x",
      "Equal for every value of x.",
      "2x + 6 and 8x",
      "They differ once x is anything but 1.",
    ),
  },
  "6|coefficient": {
    examples: ex(
      "The 3 in 3x",
      "The number multiplying the variable.",
      "The x in 3x",
      "That is the variable.",
    ),
  },
  "6|like terms": {
    examples: ex(
      "2x and 5x",
      "Same variable, same power.",
      "5x and 2y",
      "Different variables cannot combine.",
    ),
  },
  "6|simplify algebraic expressions": {
    cloze: "Combine ___ ___ to write a shorter expression with the same value.",
    examples: ex(
      "6x + 2x + 4 written as 8x + 4",
      "Only the like terms combined.",
      "6x + 2x + 4 written as 12x",
      "The 4 has no x and cannot join.",
    ),
  },
  "6|combine": {
    examples: ex(
      "3x + 2x making 5x",
      "Same variable, added.",
      "3x + 5 making 8x",
      "A constant cannot join a variable term.",
    ),
  },
  "6|term": {
    examples: ex(
      "The 3x in 3x + 5",
      "A piece separated by + or −.",
      "The + sign",
      "That separates terms; it is not one.",
    ),
  },
  "6|distributive property": {
    examples: ex(
      "4(n + 3) = 4n + 12",
      "Every term inside is multiplied.",
      "4(n + 3) = 4n + 3",
      "The 3 was skipped.",
    ),
  },
  "6|divide fractions": {
    cloze: "Keep the first fraction, change ÷ to ×, and flip the ___.",
    examples: ex(
      "3/4 ÷ 1/8 = 3/4 × 8/1",
      "Only the divisor flipped.",
      "3/4 ÷ 1/8 = 4/3 × 1/8",
      "The wrong fraction was flipped.",
    ),
  },
  "6|mixed number": {
    cloze: "A whole number and a fraction written together is a ___ ___.",
    examples: ex(
      "2 1/2",
      "A whole part and a fraction part.",
      "5/2",
      "Same value, but written as an improper fraction.",
    ),
  },
  "6|improper fraction": {
    cloze: "A fraction whose numerator is at least its denominator is an ___ ___.",
    examples: ex("5/2", "The top is larger than the bottom.", "2/5", "That is a proper fraction."),
  },
  "6|powers and exponents": {
    cloze: "A power writes repeated multiplication with a base and an ___.",
    examples: ex(
      "2³ = 2 × 2 × 2 = 8",
      "The base is used as a factor three times.",
      "2³ = 2 × 3 = 6",
      "That multiplies base by exponent.",
    ),
  },
  "6|base": {
    cloze: "In 2³, the number used as a factor is the ___.",
    examples: ex(
      "The 2 in 2³",
      "The number used as a factor.",
      "The 3 in 2³",
      "That is the exponent.",
    ),
  },
  "6|power": {
    cloze: "A number written with a base and an exponent, like 2³, is a ___.",
    examples: ex("2³", "A base with an exponent.", "2 × 3", "Plain multiplication, no exponent."),
  },
  "6|evaluate": {
    cloze: "To put numbers in for the letters and work out the value is to ___.",
    examples: ex(
      "8n + 15 with n = 6 giving 63",
      "Numbers put in, value worked out.",
      "Writing 8n + 15",
      "That states the expression without valuing it.",
    ),
  },
  "6|write and evaluate numerical expressions with exponents": {
    cloze: "Write the situation as an expression, then follow the ___ ___ ___ to value it.",
    examples: ex(
      "(4 × 3² + 6) ÷ 7",
      "Grouping and a power, no equals sign.",
      "4 × 3² + 6 ÷ 7 = 7",
      "Without the grouping symbols only the 6 is divided.",
    ),
  },
  "6|numerical expression": {
    cloze: "Numbers and operations with no equal sign and no variable form a ___ ___.",
    examples: ex(
      "4 × 20 + 2 × 15",
      "Numbers and operations only.",
      "4x + 20",
      "It contains a variable.",
    ),
  },
  "6|order of operations": {
    cloze: "Grouping symbols, then ___, then × and ÷, then + and −.",
    examples: ex(
      "3 + 4 × 2 = 11",
      "Multiplication before addition.",
      "3 + 4 × 2 = 14",
      "That added first.",
    ),
  },
  "6|exponent": {
    cloze: "The small raised number saying how many times the base is a factor is the ___.",
    examples: ex(
      "The 4 in 2⁴ meaning four factors of 2",
      "It counts the factors.",
      "The 4 meaning multiply 2 by 4",
      "That is a multiplier, not an exponent.",
    ),
  },
  "6|write algebraic expressions": {
    cloze: "Turn the words into numbers, operations and a ___.",
    examples: ex(
      "“8 fewer than a number” as n − 8",
      "Starts from the number, then subtracts.",
      "“8 fewer than a number” as 8 − n",
      "Reversed — subtraction is not commutative.",
    ),
  },
  "6|variable": {
    examples: ex(
      "The n in 8n + 15",
      "A letter standing for a changing amount.",
      "The 15",
      "A fixed number.",
    ),
  },
  "6|algebraic expression": {
    examples: ex(
      "8n + 15",
      "It contains a letter.",
      "8 × 6 + 15",
      "All numbers — a numerical expression.",
    ),
  },
  "6|substitute": {
    cloze: "Replace the variable with a given number before you ___ the expression.",
    examples: ex(
      "4.25s + 23.50 with s = 10",
      "The letter is swapped for a value.",
      "Changing 4.25 to 5 to make it easier",
      "That changes the expression itself.",
    ),
  },
  "6|equivalent expressions": {
    cloze: "Expressions with the same value for ___ allowed number are equivalent.",
    examples: ex(
      "2(x + 3) and 2x + 6",
      "Equal for every x.",
      "2x + 6 and 8x",
      "Only equal when x is 1.",
    ),
  },
  "6|find factors and multiples": {
    cloze: "Factors ___ a number; multiples are what it ___.",
    examples: ex(
      "Factors of 12: 1, 2, 3, 4, 6, 12",
      "Each divides 12 exactly.",
      "12, 24, 36 as factors of 12",
      "Those are multiples.",
    ),
  },
  "6|multiple": {
    cloze: "What you land on counting by a number are its ___.",
    examples: ex(
      "24 as a multiple of 8",
      "8 × 3 reaches it.",
      "4 as a multiple of 8",
      "8 does not reach 4.",
    ),
  },
  "6|greatest common factor (gcf)": {
    cloze: "The largest number that divides both is their ___ ___ ___.",
    examples: ex(
      "6 for 12 and 18",
      "The largest they share.",
      "3 for 12 and 18",
      "Shared, but not the greatest.",
    ),
  },
  "6|least common multiple (lcm)": {
    cloze: "The smallest number both numbers reach is their ___ ___ ___.",
    examples: ex(
      "12 for 4 and 6",
      "The first shared multiple.",
      "24 for 4 and 6",
      "Shared, but not the least.",
    ),
  },
  "6|factor pair": {
    cloze: "Two factors that multiply to make the number are a ___ ___.",
    examples: ex("4 and 9 for 36", "Their product is 36.", "4 and 8 for 36", "That product is 32."),
  },
  "6|properties of operations": {
    cloze: "Rules that let you reorder or regroup without changing the ___.",
    examples: ex(
      "2 + 3 = 3 + 2",
      "Order changed, value kept.",
      "8 ÷ 2 = 2 ÷ 8",
      "Order matters in division.",
    ),
  },
  "6|associative property": {
    examples: ex(
      "(2 × 3) × 4 = 2 × (3 × 4)",
      "The grouping moved.",
      "2 × 3 × 4 = 3 × 2 × 4",
      "That changed the order — commutative.",
    ),
  },
  "6|identity property": {
    examples: ex("7 + 0 = 7", "Adding zero keeps the value.", "7 + 1 = 8", "The value changed."),
  },
  "6|property": {
    examples: ex(
      "a(b + c) = ab + ac",
      "True for every number.",
      "“3 × 4 = 12”",
      "One fact, not a general rule.",
    ),
  },
  "6|divide whole numbers by fractions": {
    cloze: "Multiply the whole number by the ___ of the fraction.",
    examples: ex(
      "4 ÷ 1/5 = 4 × 5 = 20",
      "Dividing by a part gives more, not less.",
      "4 ÷ 1/5 = 4 × 1/5",
      "That multiplies instead of dividing.",
    ),
  },
  "6|whole number": {
    examples: ex(
      "0, 1, 2, 3",
      "Counting numbers with no fraction part.",
      "2.5",
      "It has a decimal part.",
    ),
  },
  "6|fraction": {
    examples: ex("3/4", "A part of a whole.", "The digits 3 and 4", "Two separate digits."),
  },
  "6|keep, change, flip": {
    examples: ex(
      "3/4 ÷ 1/8 → 3/4 × 8/1",
      "Keep, change the sign, flip the divisor.",
      "3/4 ÷ 1/8 → 4/3 × 1/8",
      "The first fraction was flipped instead.",
    ),
  },

  // ── Unit 8 · equations and inequalities ─────────────────────────────────
  "8|write equations": {
    cloze: "Two expressions joined by an ___ ___ make an equation.",
    examples: ex(
      "31 + p = 48",
      "Two sides set equal, with an unknown.",
      "31 + p",
      "No equals sign — an expression.",
    ),
  },
  "8|variable": {
    examples: ex(
      "The p in 31 + p = 48",
      "A letter for the unknown amount.",
      "The 31",
      "A fixed number.",
    ),
  },
  "8|equal sign": {
    examples: ex(
      "The = in 2.5h = 1,000",
      "It claims both sides match.",
      "The ≤ in c ≤ 66",
      "That compares a range, not an equality.",
    ),
  },
  "8|expression": {
    examples: ex(
      "8n + 15",
      "Numbers and letters, no equals sign.",
      "8n + 15 = 63",
      "The equals sign makes it an equation.",
    ),
  },
  "8|constant": {
    examples: ex("The 15 in 8n + 15", "It never changes.", "The n", "Its value can vary."),
  },
  "8|unknown": {
    examples: ex(
      "The x in x + 8 = 15",
      "The value you are solving for.",
      "The 15",
      "That value is already given.",
    ),
  },
  "8|solution": {
    cloze: "A value that makes the equation true when ___ for the variable is its solution.",
    examples: ex(
      "x = 7 for x + 8 = 15",
      "7 + 8 really is 15.",
      "x = 3 for n + 5 = 9",
      "3 + 5 is 8, not 9.",
    ),
  },
  "8|substitute": {
    cloze: "Replace the variable with a number to ___ whether it is a solution.",
    examples: ex(
      "Putting 7 into x + 8 = 15",
      "The letter is swapped for a value.",
      "Changing 15 to 16 to make it work",
      "That edits the equation instead of testing it.",
    ),
  },
  "8|solve one-step addition and subtraction equations": {
    cloze: "Undo an addition by ___ the same amount from both sides.",
    examples: ex(
      "x + 8 = 15 → x = 15 − 8",
      "The inverse applied to both sides.",
      "x + 8 = 15 → x = 15 + 8",
      "Adding again does not undo adding.",
    ),
  },
  "8|equation": { examples: ex("15h = 120", "Both sides set equal.", "15h", "An expression.") },
  "8|isolate": {
    examples: ex(
      "Dividing 15h = 120 by 15 to leave h",
      "The variable ends up alone.",
      "Multiplying both sides by 15",
      "That buries the variable deeper.",
    ),
  },
  "8|one-step equation": {
    examples: ex(
      "n / 3 = 6",
      "One inverse operation solves it.",
      "2n + 5 = 15",
      "That needs two steps.",
    ),
  },
  "8|balance": {
    examples: ex(
      "Subtracting 6 from both sides",
      "Both sides treated the same.",
      "Subtracting 6 from the left only",
      "The sides no longer match.",
    ),
  },
  "8|solve multiplication and division equations": {
    cloze: "Undo a multiplication by ___ both sides by the same number.",
    examples: ex(
      "6x = 42 → x = 42 ÷ 6",
      "Division undoes multiplication.",
      "6x = 42 → x = 42 × 6",
      "That compounds it.",
    ),
  },
  "8|multiply": {
    examples: ex(
      "Multiplying both sides of n / 4 = 8 by 4",
      "It undoes the division.",
      "Dividing both sides again",
      "Division cannot undo division.",
    ),
  },
  "8|divide": {
    examples: ex(
      "Dividing 7f = 84 by 7",
      "It undoes the multiplication.",
      "Subtracting 7 from both sides",
      "Subtraction does not undo a product.",
    ),
  },
  "8|coefficient": {
    examples: ex(
      "The 7 in 7f",
      "The number multiplying the variable.",
      "The 84",
      "That is the total on the other side.",
    ),
  },
  "8|write inequalities": {
    cloze: "Use <, >, ≤ or ≥ when the answer is a ___ of values rather than one.",
    examples: ex(
      "s ≤ 25 for “no more than 25”",
      "It allows 25 and everything below.",
      "s = 25 for that phrase",
      "That allows only one value.",
    ),
  },
  "8|greater than": {
    examples: ex("x > 8", "Bigger than 8, 8 itself excluded.", "x ≥ 8", "That includes 8."),
  },
  "8|less than": {
    examples: ex("x < 10", "Smaller than 10, 10 excluded.", "x ≤ 10", "That includes 10."),
  },
  "8|at least / at most": {
    examples: ex(
      "“At least 16” as a ≥ 16",
      "The boundary counts.",
      "“At least 16” as a > 16",
      "That rules out 16 itself.",
    ),
  },
  "8|no more than": {
    examples: ex(
      "“No more than 25” as s ≤ 25",
      "25 is allowed.",
      "“No more than 25” as s < 25",
      "That excludes 25.",
    ),
  },
  "8|graph inequalities": {
    cloze: "Mark the ___ ___, then shade every value that makes it true.",
    examples: ex(
      "Open circle at 6, shaded right, for x > 6",
      "Circle style and direction both match.",
      "Closed circle at 6, shaded right",
      "> does not include 6.",
    ),
  },
  "8|number line": {
    examples: ex(
      "A line with 6 marked and values increasing right",
      "Ordered positions.",
      "A list of the same numbers",
      "No positions, so nothing to shade.",
    ),
  },
  "8|closed circle": {
    examples: ex(
      "A filled circle at 13 for x ≥ 13",
      "≥ includes the boundary.",
      "A filled circle at 13 for x > 13",
      "> excludes it.",
    ),
  },
  "8|solution set": {
    examples: ex(
      "Every number 8 and above for x ≥ 8",
      "All values that make it true.",
      "Just the number 8",
      "One value of many.",
    ),
  },
  "8|inequality": {
    examples: ex(
      "134 + c ≤ 200",
      "Two sides compared with ≤.",
      "134 + c = 200",
      "That is an equation.",
    ),
  },
  "8|boundary point": {
    examples: ex(
      "The 8 in x > 8",
      "Where the solution set begins.",
      "The 20 in that same inequality",
      "A solution, not the boundary.",
    ),
  },
  "8|solve and graph inequalities": {
    cloze: "Isolate the variable first, then show the whole ___ ___ on a number line.",
    examples: ex(
      "3x ≤ 18 → x ≤ 6, closed circle, shaded left",
      "Solved, then graphed to match.",
      "3x ≤ 18 → x ≤ 18",
      "Only one side was divided.",
    ),
  },
  "8|solve": {
    examples: ex(
      "Finding x = 7 for x + 8 = 15",
      "The value that makes it true.",
      "Rewriting x + 8 = 15",
      "Nothing was found.",
    ),
  },
  "8|graph": {
    examples: ex(
      "An open circle at 8 with shading to the right",
      "Circle and shading show the solutions.",
      "A dot at 8 with no shading",
      "It shows one value, not the set.",
    ),
  },
  "8|inverse operation": {
    examples: ex(
      "Subtraction undoing addition",
      "Each reverses the other.",
      "Addition undoing addition",
      "That doubles it.",
    ),
  },
  "8|equations and inequalities problem solving": {
    cloze: "Use an equation for one exact value and an ___ for a range.",
    examples: ex(
      "“At most 200 points” as 134 + c ≤ 200",
      "A limit, so an inequality.",
      "“At most 200 points” as 134 + c = 200",
      "That forces exactly 200.",
    ),
  },
  "8|model": {
    examples: ex(
      "Writing 12n = 500 for the car wash goal",
      "The situation as a number sentence.",
      "Writing the answer, 42",
      "A result, not a model.",
    ),
  },
  "8|reasonableness": {
    examples: ex(
      "Rounding 41.7 cars up to 42",
      "You cannot wash part of a car.",
      "Reporting 41.7 cars",
      "The story allows only whole cars.",
    ),
  },
  "8|constraint": {
    examples: ex(
      "“The budget is $45”",
      "A limit on the allowed values.",
      "“The jacket costs $58”",
      "A fact about the item, not a limit on the answer.",
    ),
  },
};

const lessons = readdirSync(LESSONS)
  .filter((name) => UNITS.test(name))
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
  `${DRY ? "[dry-run] " : ""}remaining vocabulary: ${fields} field(s) added across ${files} config(s)`,
);
