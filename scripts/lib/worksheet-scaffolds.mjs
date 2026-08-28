/**
 * worksheet-scaffolds.mjs — the vertical work space a printed problem needs.
 *
 * WHY THIS EXISTS. A practice item used to print as a stem and four bubbles.
 * The bubbles are the LAST step of the work, so the sheet was printing only
 * the last step — and a student in a support group, handed four numbers and
 * no room, guesses. Division got a place-column house first (2026-08-24); this
 * generalises that to the mathematics the other 2,400 items actually ask for.
 *
 * TWO RULES, both load-bearing:
 *
 *   1. A scaffold is BLANK STRUCTURE. It prints labels, rules and boxes — it
 *      never prints a quantity the item did not state, and it never derives
 *      one. That is what keeps a print generator from quietly asserting
 *      mathematics nobody authored (the failure `validate:shared-claims` and
 *      `validate:learn-figures` exist to catch). The only numbers that appear
 *      are ones lifted verbatim from the stem.
 *
 *   2. DRAW NOTHING WHEN UNSURE. classify() returns null unless the stem is
 *      unambiguous, and the caller falls back to a labelled work box. A wrong
 *      scaffold is worse than a plain one: it tells the student the problem is
 *      a kind of problem it is not.
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Stem text with thousands separators and currency stripped, for matching. */
const plain = (s) => String(s || "").replace(/[,$]/g, "");
const hasDecimal = (s) => /\d\.\d/.test(plain(s));

/* ── the classifier ───────────────────────────────────────────────────────
 *
 * Deliberately hard to satisfy. The first version keyed off single words and
 * was wrong in the way this file's own header warns about: `\bmean\b` caught
 * "What does it MEAN that a butterfly is symmetric?" and filed it as
 * statistics; `\bsolve\b` caught "the fewest moves to SOLVE a Tower of Hanoi
 * puzzle" and filed it as an equation. Both would have printed a computational
 * frame on a reasoning question — telling the student the problem is a kind of
 * problem it is not.
 *
 * Two gates now stand in front of every computational scaffold:
 *
 *   COMPUTATIONAL: the item's own CHOICES must be quantities. A reasoning item
 *   ("Which statement best explains…") has sentences for choices, and no
 *   arrangement of words in its stem can talk its way past that. This is the
 *   single strongest signal available and it is the item's own data, not a
 *   guess about its prose.
 *
 *   NOT CONCEPTUAL: stems that ask what something MEANS, WHY it is so, or
 *   which statement is best are asking for reasoning even when their choices
 *   happen to be short.
 */

/** A choice that is a quantity: 42, 3.5, 1/2, 78 riders, $12, 40%, 8 in. */
const QUANTITY =
  /^[\s$]*-?\d[\d,]*(?:\.\d+)?(?:\s*\/\s*\d+)?\s*[%°]?(?:\s+[A-Za-z².³/ ]{1,18})?\.?$/;
function isComputational(item) {
  const choices = Array.isArray(item?.choices) ? item.choices : [];
  if (choices.length < 2) return false;
  const numeric = choices.filter((c) => QUANTITY.test(String(c).trim())).length;
  // Every choice, not most: one sentence among four means the question is
  // asking the student to pick between ideas, not to compute.
  return numeric === choices.length;
}

const CONCEPTUAL =
  /\bwhat does it mean\b|\bwhich statement\b|\bbest explains?\b|\bbest describes?\b|\bwhy (?:does|is|would|did)\b|\baccording to this lesson\b|\bwhich is the best\b|\bmeans?\b\s+(?:that|to)\b/i;

/* Ordered most-specific first. Each entry answers one question: what does a
 * student have to WRITE to do this problem? */
const RULES = [
  ["division", (s) => /(\d+(?:\.\d+)?)\s*(?:÷|\bdivided by\b)\s*(\d+(?:\.\d+)?)/i.test(plain(s))],

  ["percent", (s) => /\d\s*%|\b\d+\s*percent\b|\bpercent of\b/i.test(s)],
  [
    "measure",
    (s) =>
      /\b(?:what is|find|calculate)\b[^?]*\b(area|volume|perimeter|surface area)\b|\b(area|volume|perimeter|surface area)\b[^?]*\?/i.test(
        s,
      ),
  ],
  [
    "ratio",
    (s) => /\bunit rate\b|\bratio of\b|\d+\s*:\s*\d+|\bper\b\s+\w+|\bat\b[^?]*\bper\b/i.test(s),
  ],
  /* Dividing BY a fraction is not "find a common denominator".
     "A rope is 4 feet long. How many 1/2-foot pieces can be cut from it?" has a
     fraction and no ÷ sign, so it fell through to the `fraction` scaffold and
     was handed the add/subtract rail — common denominator first, then add or
     subtract — on a division problem. Unit 6 teaches one method for this and it
     is Keep-Change-Flip, so the scaffold names those moves. */
  [
    "fractionDivision",
    (s) =>
      /\d\s*\/\s*\d|\bunit fraction\b/i.test(s) &&
      /÷|\bdivid(?:e|ed|ing)\b|\bhow many\b[^?]*\b(fit|go into|are in|can be cut|pieces)\b|\bshared? (?:equally )?(?:among|between)\b|\bsplit (?:equally )?(?:among|between|into)\b/i.test(
        s,
      ),
  ],
  ["fraction", (s) => /\d\s*\/\s*\d|\bnumerator\b|\bdenominator\b|\bfraction of\b/i.test(s)],
  // Statistics only when a MEASURE is named as a noun, never the verb "mean".
  // Ordered AHEAD of `equation` on purpose: a box plot states "Q1 = 15,
  // Median = 20", and an equation rule that keys off an equals sign reads
  // every one of those as an equation to solve.
  [
    "statistics",
    (s) =>
      /\b(?:the |a |find the |what is the )(?:mean|median|mode|range|IQR|interquartile range)\b|\bmedian\b|\bIQR\b|\binterquartile\b|\bmean of\b|\bbox plot\b|\bQ1\b|\bQ3\b/i.test(
        s,
      ),
  ],
  /* A real equation needs a VARIABLE, not merely an equals sign. `= <number>`
     matched "Median = 20" and "Q1 = 15" and filed box-plot questions as
     equations. `\b[a-z]\s*=` cannot: in "Median = 20" the n before the space
     has a letter to its left, so there is no word boundary there — while "x =
     5" has one. */
  [
    "equation",
    (s) =>
      /\b[a-z]\s*=|=\s*[a-z]\b|\b\d+[a-z]\b\s*[=+\-−]|\b[a-z]\s*[+\-−×÷*/]\s*-?\d+\s*=|\bequation\b|\bsolve for\b/i.test(
        plain(s),
      ),
  ],
  ["column", (s) => hasDecimal(s) && /[+−]|\bsum\b|\bdifference\b|\btotal of\b/.test(plain(s))],
  ["multiply", (s) => /(\d[\d.]*)\s*(?:×|\*|\btimes\b)\s*(\d[\d.]*)/i.test(plain(s))],
  ["expression", (s) => /\bevaluate\b|\bexponent\b|order of operations/i.test(s)],
];

export function classify(item) {
  const stem = typeof item === "string" ? item : item?.stem;
  const text = String(stem || "");
  if (!text.trim()) return null;
  if (CONCEPTUAL.test(text)) return null;
  if (typeof item !== "string" && !isComputational(item)) return null;
  for (const [name, test] of RULES) {
    try {
      if (test(text)) return name;
    } catch (_error) {
      /* a rule that throws is a rule that does not match */
    }
  }
  return null;
}

/* ── shared pieces ───────────────────────────────────────────────────────── */

/** A numbered rail of named moves, written DOWN the page. */
function rail(steps) {
  const items = steps
    .map(
      ([name, hint], i) =>
        `<li class="wsd-step"><span class="wsd-step-n">${i + 1}</span><span class="wsd-step-t">${esc(name)}</span><span class="wsd-step-h">${esc(hint)}</span></li>`,
    )
    .join("");
  return `<ol class="wsd-rail">${items}</ol>`;
}

/** n ruled rows inside a titled panel — the generic "write it out" surface. */
function panel(title, rows = 3, extraClass = "") {
  const lines = '<span class="wss-rule"></span>'.repeat(rows);
  return `<div class="wss-panel ${extraClass}"><span class="wss-panel-t">${esc(title)}</span><div class="wss-rules">${lines}</div></div>`;
}

/** A labelled two-column ledger: what I wrote, and why. */
function ledger(leftTitle, rightTitle, rows = 4) {
  const body = Array.from(
    { length: rows },
    () => `<tr><td class="wss-cell"></td><td class="wss-cell wss-cell-why"></td></tr>`,
  ).join("");
  return `<table class="wss-ledger"><thead><tr><th>${esc(leftTitle)}</th><th>${esc(rightTitle)}</th></tr></thead><tbody>${body}</tbody></table>`;
}

/* ── the scaffolds ───────────────────────────────────────────────────────── */

const SCAFFOLDS = {
  /* Solve, one move per line, with the move named beside it. The right column
     is the whole point: an equation is solved by doing the SAME thing to both
     sides, and a student who cannot name what they did did not do it. */
  equation: (_stem, supported) => ({
    body: ledger("My work — one step per line", "What I did to both sides", supported ? 5 : 4),
    rail: supported
      ? rail([
          ["Look", "What is done to the variable?"],
          ["Undo", "Do the opposite — both sides."],
          ["Simplify", "One side at a time."],
          ["Check", "Put it back in."],
        ])
      : "",
  }),

  /* Formula first, then the numbers, then the unit. The unit line is separate
     on purpose: area/volume answers lose their square and cubic units more
     often than they lose their arithmetic. */
  measure: (_stem, supported) => ({
    body: `<div class="wss-steps">
      <div class="wss-slot"><span class="wss-slot-t">Formula</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Put the numbers in</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Work it out</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Answer <b>with its unit</b></span><span class="wss-slot-w"></span></div>
    </div>`,
    rail: supported
      ? rail([
          ["Name it", "Which measure is asked?"],
          ["Write the formula", "Before any numbers."],
          ["Substitute", "Match each letter."],
          ["Unit", "units, sq units, or cubic?"],
        ])
      : "",
  }),

  /* A ratio table grown DOWN the page, with the per-ONE row called out —
     that row is the unit rate, and it is the row students skip. */
  ratio: (_stem, supported) => ({
    body: `<table class="wss-ratio"><thead><tr><th></th><th></th></tr></thead><tbody>
      <tr><td class="wss-cell"></td><td class="wss-cell"></td></tr>
      <tr><td class="wss-cell"></td><td class="wss-cell"></td></tr>
      <tr class="wss-row-per"><td class="wss-cell"><span class="wss-per">per 1</span></td><td class="wss-cell"></td></tr>
      <tr><td class="wss-cell"></td><td class="wss-cell"></td></tr>
    </tbody></table>`,
    rail: supported
      ? rail([
          ["Label", "Write what each column is."],
          ["Find per 1", "Divide to get one."],
          ["Scale", "Multiply up to what is asked."],
          ["Check", "Does the size make sense?"],
        ])
      : "",
  }),

  /* 10% first, then build. Benchmarks beat the formula for 6th grade, and the
     bar keeps the answer's SIZE in view so an off-by-100 shows up. */
  percent: (_stem, supported) => ({
    body: `<div class="wss-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
      <div class="wss-barlab"><span>0%</span><span>50%</span><span>100%</span></div>
      ${panel("Work", supported ? 3 : 2, "wss-panel-tight")}`,
    rail: supported
      ? rail([
          ["Whole", "100% is what number?"],
          ["Find 10%", "Divide by 10."],
          ["Build", "Add or multiply to the percent."],
          ["Check", "Is it under or over the whole?"],
        ])
      : "",
  }),

  /* Keep, Change, Flip — written out, because the flip is the step students
     skip. The whole-number-over-1 line comes first for the same reason: 3 ÷ 1/4
     is unreachable until the 3 is a fraction. */
  fractionDivision: (_stem, supported) => ({
    body: `<div class="wss-steps">
      <div class="wss-slot"><span class="wss-slot-t">Write any whole number over 1</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Keep · Change · Flip</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Multiply across</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Simplify · label the units</span><span class="wss-slot-w"></span></div>
    </div>`,
    rail: supported
      ? rail([
          ["Whole over 1", "3 becomes 3/1."],
          ["Keep", "The first fraction does not move."],
          ["Change · Flip", "÷ becomes ×; flip the second fraction."],
          ["Check", "Dividing by a piece smaller than 1 gives a BIGGER answer."],
        ])
      : "",
  }),

  /* Common denominator gets its own line so it cannot be skipped silently. */
  fraction: (_stem, supported) => ({
    body: `<div class="wss-steps">
      <div class="wss-slot"><span class="wss-slot-t">Rewrite each fraction</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Work it out</span><span class="wss-slot-w"></span></div>
      <div class="wss-slot"><span class="wss-slot-t">Simplify</span><span class="wss-slot-w"></span></div>
    </div>`,
    rail: supported
      ? rail([
          ["Same size pieces", "Common denominator first."],
          ["Operate", "Only then add or subtract."],
          ["Simplify", "Divide out common factors."],
        ])
      : "",
  }),

  /* Order the data, THEN read it. Every median/IQR error starts before the
     arithmetic does. */
  statistics: (_stem, supported) => ({
    body: `<div class="wss-slot"><span class="wss-slot-t">Put the data in order</span><span class="wss-slot-w"></span></div>
      ${panel("Work", supported ? 3 : 2, "wss-panel-tight")}`,
    rail: supported
      ? rail([
          ["Order", "Smallest to largest."],
          ["Count", "How many values?"],
          ["Locate", "Middle, or add and divide."],
          ["Answer", "Say which measure it is."],
        ])
      : "",
  }),

  /* Place-value columns with the decimal point already ruled, because the
     point is what students misalign. */
  column: (_stem, supported) => ({
    body: `<div class="wss-cols">${'<span class="wss-col"></span>'.repeat(6)}</div>${panel("Line up the place values", supported ? 3 : 2, "wss-panel-tight")}`,
    rail: supported
      ? rail([
          ["Line up", "Points under points."],
          ["Fill gaps", "Write in the zeros."],
          ["Operate", "Right to left."],
          ["Bring the point down", "Straight down."],
        ])
      : "",
  }),

  multiply: (_stem, supported) => ({
    body: panel("Show each partial product, then add them", supported ? 5 : 4),
    rail: supported
      ? rail([
          ["Split", "Break one factor apart."],
          ["Multiply", "One part at a time."],
          ["Add", "Add the parts."],
        ])
      : "",
  }),

  expression: (_stem, supported) => ({
    body: ledger("Rewrite the whole expression each line", "What I simplified", supported ? 5 : 4),
    rail: supported
      ? rail([
          ["Grouping", "Inside ( ) first."],
          ["Exponents", "Then powers."],
          ["× ÷", "Left to right."],
          ["+ −", "Left to right."],
        ])
      : "",
  }),
};

/**
 * The work space for one stem, or null when nothing here fits.
 * `division` is handled by the caller, which owns the long-division house.
 */
export function scaffoldFor(item, { supported = false } = {}) {
  const kind = classify(item);
  if (!kind || kind === "division") return null;
  const build = SCAFFOLDS[kind];
  if (!build) return null;
  const { body, rail: railHtml } = build(item?.stem || item, supported);
  return {
    kind,
    html: `<div class="wsd-wrap${supported ? " wsd-supported" : ""}"><div class="wss-body">${body}</div>${railHtml}</div>`,
  };
}

export const SCAFFOLD_KINDS = Object.keys(SCAFFOLDS);
