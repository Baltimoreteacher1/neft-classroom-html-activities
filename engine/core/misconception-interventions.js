// misconception-interventions.js — the second-level move, one per named error.
//
// The taxonomy in misconceptions.js already carries two voices per error:
// `student` (what the learner reads instead of "Not quite") and `watchFor` (the
// teacher's next move). Those are level ONE — a sentence that names the thinking
// and points at one thing to check. They are enough for a student who mis-stepped
// and enough for a teacher standing next to one.
//
// They are not enough for a student who reads the sentence, tries again, and
// misses again. At that point another sentence is the wrong instrument: the
// student has already demonstrated that reading about the error did not shift it.
// What shifts it is doing one tiny case where the error is impossible to hide.
//
// So each entry here is a MICRO-TASK, not more prose:
//
//   - It uses numbers small enough to do in your head, because the point is the
//     structure of the operation, never the arithmetic.
//   - It is about the ERROR, not about the problem the student is stuck on. It
//     therefore gives away nothing — a student can answer it correctly and still
//     have to do the real problem themselves, which is the entire reason it is
//     safe to show at the moment of a second miss.
//   - It is checkable, so "did the intervention work?" has an answer that is not
//     a self-report.
//
// Every `verify` field below is machine-checked by misconception-interventions.
// test.mjs, which recomputes the arithmetic independently rather than comparing
// the answer string to itself. A scaffold that teaches wrong mathematics is worse
// than no scaffold, and hand-authored constants are exactly where that happens.

/**
 * @typedef {object} Intervention
 * @property {string} probe    the micro-task, in student voice
 * @property {string[]} accept accepted answers, normalised loosely at check time
 * @property {string} then     one line connecting the micro-task back to the error
 * @property {{expr: string, equals?: number, assert?: boolean}} verify
 */

/** @type {Record<string, Intervention>} */
export const INTERVENTIONS = {
  "op-added-instead-of-multiplied": {
    probe: "Quick one: 3 baskets, 4 apples in each. How many apples altogether?",
    accept: ["12"],
    then: "You multiplied, not added — 3 + 4 = 7 would be far too few. Groups of something means multiply. Now find the groups in your problem.",
    verify: { expr: "3*4", equals: 12 },
  },
  "op-multiplied-instead-of-added": {
    probe: "Quick one: you had 6 stickers and were given 5 more. How many now?",
    accept: ["11"],
    then: "Putting two amounts together adds. Multiplying would have given 30, which is not what happened. Which is your problem doing — combining, or making groups?",
    verify: { expr: "6+5", equals: 11 },
  },
  "op-reversed-subtraction": {
    probe: "Quick one: a 12 cm ribbon, you cut off 5 cm. How much is left?",
    accept: ["7"],
    then: "The amount you started with goes first. Find the starting amount in your problem and put that one first.",
    verify: { expr: "12-5", equals: 7 },
  },
  "op-reversed-division": {
    probe: "Quick one: 12 cookies shared equally by 3 children. How many each?",
    accept: ["4"],
    then: "What is being shared goes first, then how many shares. Name those two things in your problem before you write the division.",
    verify: { expr: "12/3", equals: 4 },
  },
  "op-divided-instead-of-multiplied": {
    probe: "Quick one: 5 bags, 10 marbles per bag. More than 10 marbles, or fewer?",
    accept: ["more", "more than 10", "50"],
    then: "Making groups makes the total bigger. Estimate first in your problem: should the answer be bigger or smaller than what you started with?",
    verify: { expr: "5*10", equals: 50 },
  },
  "op-multiplied-instead-of-divided": {
    probe: "Quick one: 20 pencils shared between 4 people. More than 20 each, or fewer?",
    accept: ["fewer", "less", "fewer than 20", "5"],
    then: "Sharing out makes each part smaller. Estimate your problem the same way before you compute.",
    verify: { expr: "20/4", equals: 5 },
  },
  "decimal-place-value": {
    probe: "Quick one: about how much is 4.9 + 5.1? Round each to the nearest whole number first.",
    accept: ["10"],
    then: "Rounding first tells you roughly where the answer sits, so a misplaced point is obvious. Estimate your problem before you trust the digits.",
    verify: { expr: "5+5", equals: 10 },
  },
  "fraction-added-denominators": {
    probe: "Quick one: which is bigger, 1/3 or 1/8?",
    accept: ["1/3", "one third", "a third"],
    then: "Thirds are bigger pieces than eighths — so the bottom number is a SIZE, not a count. Adding the sizes together would make no sense. Find a common size instead.",
    verify: { expr: "1/3 > 1/8", assert: true },
  },
  "fraction-straight-across-division": {
    probe: "Quick one: how many halves fit into 3 wholes?",
    accept: ["6"],
    then: "Dividing asks how many of these fit into that — and the answer got BIGGER. Ask that same question about your problem.",
    verify: { expr: "3/(1/2)", equals: 6 },
  },
  "fraction-no-reciprocal": {
    probe: "Quick one: how many quarters fit into 2 wholes?",
    accept: ["8"],
    then: "Dividing by 1/4 gave 8, not 1/2 — dividing by a fraction makes the answer bigger, which is what flipping the second fraction does. Flip yours, then multiply.",
    verify: { expr: "2/(1/4)", equals: 8 },
  },
  "percent-used-as-whole-number": {
    probe: "Quick one: what is 50% of 20?",
    accept: ["10"],
    then: "50% meant half, not the number 50. Say your percent out loud as 'per hundred' before you use it.",
    verify: { expr: "0.50*20", equals: 10 },
  },
  "percent-scale-off-by-100": {
    probe: "Quick one: what is 10% of 200?",
    accept: ["20"],
    then: "10% is one tenth — 20, not 2 and not 2000. Check your answer against a benchmark like this before you trust it.",
    verify: { expr: "0.10*200", equals: 20 },
  },
  // Order, not arithmetic: there is no sum to check here, and inventing one
  // ("2 + 5 = 7") would be a verification that proves nothing about the thing
  // that can actually be wrong. What must hold is that the REVERSED answer is
  // refused — so this declares that instead, and the test enforces it.
  "ratio-inverted": {
    probe: "Quick one: a box has 2 red and 5 blue counters. Write the ratio of RED to BLUE.",
    accept: ["2:5", "2 to 5", "2/5"],
    rejects: ["5:2", "5 to 2", "5/2"],
    then: "The one named first goes first. Read your question again and underline which quantity it names first.",
  },
  "ratio-scaled-additively": {
    probe:
      "Quick one: a recipe is 2 cups flour to 3 cups sugar. You use 4 cups of flour. How many cups of sugar?",
    accept: ["6"],
    then: "4 cups of flour is 2 batches, not 2 extra cups — so the sugar doubles too, 3 → 6. Ask your own problem how many TIMES bigger it got, then multiply both parts by that.",
    verify: { expr: "3*2", equals: 6 },
  },
  "ratio-as-difference": {
    probe:
      "Quick one: 6 red counters and 10 blue. Write the ratio of RED to BLUE in simplest form.",
    accept: ["3:5", "3 to 5", "3/5", "6:10", "6 to 10"],
    rejects: ["4", "16"],
    then: "A ratio keeps BOTH numbers — 4 is the difference and 16 is the total, and neither one can rebuild the picture. Say yours as 'for every ___ there are ___' before you write it.",
  },
  "stat-mean-vs-median": {
    probe: "Quick one: find the MEDIAN of 12, 13, 15, 16, 24.",
    accept: ["15"],
    rejects: ["16"],
    then: "Ordered, the middle value is 15. Adding and dividing gives 16 — that is the mean, a different measure. Check which word your question used before you start.",
  },
  "stat-histogram-bin-misread": {
    probe:
      "Quick one: a histogram shows 10–19 with height 8 and 20–29 with height 5. How many values are in the 20–29 interval?",
    accept: ["5"],
    rejects: ["13", "8"],
    then: "Only the 20–29 bar counts here, so 5. Adding both bars answers a different question — how many are under 30. Every value belongs to exactly one interval.",
  },
  "rate-not-per-one": {
    probe: "Quick one: 12 km in 3 hours. How many km in ONE hour?",
    accept: ["4"],
    then: "A unit rate is always the amount for ONE. Finish the sentence for your problem: 'for one ___, there is ___.'",
    verify: { expr: "12/3", equals: 4 },
  },
  "exponent-as-multiplication": {
    probe: "Quick one: write 2³ out in full, then work it out.",
    accept: ["8"],
    then: "2 × 2 × 2 = 8, not 2 × 3 = 6. Write every factor out before you evaluate yours.",
    verify: { expr: "2*2*2", equals: 8 },
  },
  "order-of-operations-left-to-right": {
    probe: "Quick one: what is 2 + 3 × 4?",
    accept: ["14"],
    then: "Multiplying happens before adding, so 14 — going left to right would give 20. Circle the operation that must go first in your problem.",
    verify: { expr: "2+3*4", equals: 14 },
  },
  "sign-dropped": {
    probe: "Quick one: on a number line, what is 3 − 8?",
    accept: ["-5", "−5", "negative 5"],
    then: "Taking away more than you had lands you below zero. Check which side of zero your answer belongs on.",
    verify: { expr: "3-8", equals: -5 },
  },
  "stat-summed-instead-of-averaged": {
    probe: "Quick one: the mean of 4, 6 and 8?",
    accept: ["6"],
    then: "The mean landed INSIDE the data — 18 would be the total, not the average. Check your answer sits inside your data set.",
    verify: { expr: "(4+6+8)/3", equals: 6 },
  },
  "geom-triangle-area-no-half": {
    probe:
      "Quick one: a rectangle 4 by 2 has area 8. Cut it corner to corner. What is the area of ONE triangle?",
    accept: ["4"],
    then: "The triangle is half the rectangle around it. Take half of the base × height you already found.",
    verify: { expr: "(4*2)/2", equals: 4 },
  },
  "geom-surface-area-as-volume": {
    probe: "Quick one: a cube has 6 faces, each 2 by 2. What is the total area of all six faces?",
    accept: ["24"],
    then: "Surface area is the wrapping — add all six faces, in square units. Volume would have been 8, in cubic units. Check which one your question asked for.",
    verify: { expr: "6*(2*2)", equals: 24 },
  },
  "geom-volume-added-dimensions": {
    probe:
      "Quick one: a box 2 by 3 by 4. One layer holds 2 × 3 = 6 cubes, and 4 layers stack up. How many cubes fill the box?",
    accept: ["24"],
    then: "24 cubes fill it — adding 2 + 3 + 4 gives 9, which would not fill anything. Build yours one layer at a time.",
    verify: { expr: "2*3*4", equals: 24 },
  },
  "algebra-distributive-partial": {
    probe: "Quick one: expand 2(3 + 4) — and check it against 2 × 7.",
    accept: ["14"],
    then: "Both ways give 14, because the 2 multiplies BOTH terms. Multiplying only the first would give 10. Check both pieces in yours.",
    verify: { expr: "2*(3+4)", equals: 14 },
  },
  // ── equations ────────────────────────────────────────────────────────────
  "equation-not-inverse-operation": {
    probe: "Quick one: n × 5 = 20. To get n alone, do you multiply by 5 again or divide by 5?",
    accept: ["divide", "divide by 5", "division", "÷5", "÷ 5"],
    rejects: ["multiply", "multiply by 5", "×5"],
    then: "Division undoes multiplication. Find what is being done to your variable, then do the opposite.",
  },
  "equation-answered-with-given-number": {
    probe: "Quick one: x + 6 = 10. What is x?",
    accept: ["4"],
    then: "6 and 10 were both printed in the equation; 4 is the one nobody gave you. Substitute yours back in and check both sides match.",
    verify: { expr: "10-6", equals: 4 },
  },

  // ── inequalities ─────────────────────────────────────────────────────────
  "inequality-direction-flipped": {
    probe: "Quick one: start from x > 3 and add 2 to both sides. Write the result.",
    accept: ["x>5", "x > 5", "5<x", "5 < x"],
    rejects: ["x<5", "x < 5"],
    then: "Adding the same amount to both sides moved the boundary but left the symbol pointing the same way. Keep your original symbol.",
  },
  "inequality-boundary-inclusion": {
    probe: "Quick one: does x = 7 make x ≥ 7 true? Answer yes or no.",
    accept: ["yes", "y", "true", "sí", "si"],
    rejects: ["no", "n", "false"],
    then: "≥ includes the boundary, so 7 counts and the circle is filled. Test your own boundary number the same way.",
  },
  "inequality-graph-direction": {
    probe: "Quick one: for x < 4, is 6 part of the solution? Answer yes or no.",
    accept: ["no", "n", "false"],
    rejects: ["yes", "y", "true"],
    then: "6 is not less than 4, so the shading cannot cover it — it belongs on the smaller side. Test a number from your shaded part the same way.",
  },

  // ── statistics ───────────────────────────────────────────────────────────
  "stat-range-for-iqr": {
    probe: "Quick one: Q1 = 10 and Q3 = 18. What is the IQR?",
    accept: ["8"],
    then: "IQR is Q3 − Q1, and the smallest and largest values never enter it. Find those two quartiles in your data and subtract.",
    verify: { expr: "18-10", equals: 8 },
  },
  "stat-center-vs-spread": {
    probe: "Quick one: which of these describes how SPREAD OUT data is — the median, or the range?",
    accept: ["range", "the range"],
    rejects: ["median", "the median"],
    then: "The range measures spread; the median marks the center. Decide which one your question is asking for before you compute.",
  },
  "stat-mean-skewed-by-outlier": {
    probe:
      "Quick one: 4, 5, 6 and 85. Is the mean of these four numbers typical of the data? Answer yes or no.",
    accept: ["no", "n", "false"],
    rejects: ["yes", "y", "true"],
    then: "The mean is 25, which is larger than three of the four values — the 85 dragged it. The median, 5.5, stays with the group. Look for a value far from the rest in your own data.",
    // The task's own answer is yes/no, but the follow-up cites two numbers. Both
    // are checked independently — a scaffold that states a wrong mean while
    // teaching about means would be worse than saying nothing.
    claims: [
      { expr: "(4+5+6+85)/4", equals: 25 },
      { expr: "(5+6)/2", equals: 5.5 },
    ],
  },
  "stat-frequency-vs-value": {
    probe:
      "Quick one: a histogram bar covers scores 70–79 and stands 12 tall. How many students scored in that range?",
    accept: ["12"],
    rejects: ["79", "70"],
    then: "The height counts the students; the label underneath names the scores. Read the height when a question asks how many.",
  },

  // Order, not arithmetic — same shape as ratio-inverted. The reversed pair is
  // the misconception itself, so it must be refused rather than "close enough".
  "coord-xy-swapped": {
    probe: "Quick one: start at 0, move 3 across and 1 up. Write that point as an ordered pair.",
    accept: ["(3,1)", "(3, 1)", "3,1", "3, 1"],
    rejects: ["(1,3)", "(1, 3)", "1,3", "1, 3"],
    then: "Across first, then up. Read your own point the same way — the first number never moves you vertically.",
  },
  "measure-area-perimeter-swap": {
    probe: "Quick one: a 3 by 4 rectangle. What is the distance all the way around?",
    accept: ["14"],
    then: "Around the edge is 14 units; the space inside is 12 square units. Check which one your question asked for, and what unit it should end in.",
    verify: { expr: "2*(3+4)", equals: 14 },
  },

  // Conceptual tags: the probe asks for the DISTINCTION, not a recomputation,
  // because there is no arithmetic slip here to redo.
  "factors-multiples-confused": {
    probe: "Quick one: is 24 a factor of 6, or a multiple of 6? Answer with one word.",
    accept: ["multiple", "múltiplo", "multiplo"],
    rejects: ["factor"],
    then: "24 is a multiple of 6 — you land on it counting by 6. A factor of 6 would have to divide INTO 6, and only 1, 2, 3 and 6 do that.",
  },
  "property-order-vs-grouping": {
    probe:
      "Quick one: in (2 + 5) + 9 = 2 + (5 + 9), did the ORDER of the numbers change or the GROUPING? Answer with one word.",
    accept: ["grouping", "agrupación", "agrupacion"],
    rejects: ["order", "orden"],
    then: "The grouping moved — 2, 5, 9 appear in that same order on both sides. Only the parentheses shifted, and that is the associative property.",
  },
  "division-quotient-missing-zero": {
    probe:
      "Quick one: dividing 4,896 by 12, the first step gives 4. The next step will not divide. What goes in the quotient before you bring the next digit down?",
    accept: ["0", "zero", "a 0", "a zero", "cero", "un 0", "un cero"],
    rejects: ["nothing", "skip", "skip it", "nada", "nada, sigo", "next digit"],
    then: "You write a 0 and keep going. That 0 holds the tens place, so 4,896 ÷ 12 is 408 — not 48. An estimate says the same thing: 4,800 ÷ 12 is about 400.",
  },
  "factorization-stopped-early": {
    probe: "Quick one: in 2 × 6, which factor still breaks down into smaller factors?",
    accept: ["6", "six", "seis"],
    rejects: ["2", "neither", "ninguno"],
    then: "6 is not prime — it splits into 2 × 3. A prime factorization is finished only when every branch ends on a prime, so 12 = 2 × 2 × 3.",
  },
  "stat-question-no-variability": {
    probe:
      "Quick one: 'How many minutes are in an hour?' — would different people give different answers? Yes or no.",
    accept: ["no"],
    rejects: ["yes", "sí", "si"],
    then: "Everyone answers 60, so there is nothing to collect. A statistical question is one where the answers VARY from person to person.",
  },
  "pattern-unit-position-miscounted": {
    // The unit is three long, so 9 lands exactly on the last shape of a round.
    // A student who is off by one will say the second shape or the first.
    probe:
      "Quick one: the border repeats circle, square, triangle. Counting from the start, which shape is number 9?",
    accept: ["triangle", "triángulo", "triangulo", "the triangle", "el triángulo"],
    rejects: ["circle", "square", "círculo", "circulo", "cuadrado"],
    then: "9 ÷ 3 = 3 with nothing left over, so three complete rounds end exactly on the LAST shape of the unit — the triangle. When there IS something left over, that leftover counts forward from the start of the next round.",
  },
  "ratio-compared-without-common-basis": {
    probe: "Quick one: 6 apples for $3. What does ONE apple cost, in dollars?",
    accept: ["0.5", ".5", "0.50", "$0.50", "1/2"],
    then: "One apple is $0.50. That per-ONE amount is the common basis — once both offers are written per one, they can be compared directly.",
    verify: { expr: "3/6", equals: 0.5 },
  },
};

/** Loose normalisation for a typed micro-task answer. */
function normalise(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[−–—]/g, "-") // unicode minus / dashes → hyphen
    .replace(/[$,\s]/g, "")
    .replace(/\.0+$/, "")
    .trim();
}

/**
 * The second-level move for a named error, or null when the tag has none.
 *
 * Returning null is a real outcome, not a failure: the caller falls back to the
 * existing reveal, which is what happened before this module existed.
 */
export function interventionFor(tag) {
  if (!tag) return null;
  const entry = INTERVENTIONS[tag];
  return entry ? { tag, ...entry } : null;
}

/** Does this typed response answer the micro-task? */
export function checkIntervention(tag, typed) {
  const entry = INTERVENTIONS[tag];
  if (!entry) return false;
  const got = normalise(typed);
  if (!got) return false;
  return entry.accept.some((a) => normalise(a) === got);
}

/** Tags that carry a second-level move — used by coverage reporting and tests. */
export function coveredTags() {
  return Object.keys(INTERVENTIONS);
}
