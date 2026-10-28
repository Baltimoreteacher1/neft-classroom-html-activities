// Beautiful math typography for lesson stems, narratives, and callouts.
// Converts plain-text patterns to accessible HTML spans.
//
// Two layers, both DISPLAY-ONLY (docs/style-guide.md section 3):
//
//   typesetPlain(text)   characters only: the minus sign, multiplication and
//                        division signs, no-break number-unit spaces, thousands
//                        commas. Pure string -> string, so a gate can run every
//                        lesson string through it in Node and prove no violation
//                        survives rendering.
//   renderMathText(text) escapes, typesets, then adds structure (stacked
//                        fractions, exponents, non-breaking tabular equations).
//
// Lesson data stays plain text. NOTHING here may be applied to an answer key, a
// typed-answer comparison, or the value of an input: engine/core/answer-match.js
// folds hyphen-minus, U+2212, x, * and U+00D7 together on its own side, and
// engine/core/math-typography.test.mjs pins that a student who types the plain
// characters is still marked right.

function esc(s) {
  // Same escaping as `div.textContent = s; div.innerHTML` (& < > only), but pure
  // so it also runs outside a browser.
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const NBSP = " ";
const MINUS = "−";

// A number or a one-letter variable: the only things a sign may sit between.
const OPERAND_LEFT = String.raw`(?:[\d)]|(?<![A-Za-z])[a-z])`;
const OPERAND_RIGHT = String.raw`(?:\d|\(|[a-z](?![A-Za-zÀ-ÿ]))`;

const WORD_UNITS =
  "ft|feet|foot|yd|yards?|mi|miles?|cm|mm|km|meters?|metres?|kg|grams?|mg|lbs?|pounds?|oz|ounces?|mL|liters?|litres?|gal|gallons?|mph|min|minutes?|hours?|hrs?|seconds?|secs?|days?|weeks?|inches|degrees|cents|dollars|units|cups?|quarts?";
const SYMBOL_UNITS = "ft|yd|mi|cm|mm|km|kg|mg|lbs?|oz|mL|gal|mph|min|hrs?|secs?|m|g|L|s|h";

// "12 ft", "3 cups", "540 meters". "in" is left out on purpose: it is a
// preposition ("put 5 in a row"). A fraction's denominator ("1/3 mile") is not
// a quantity of the unit, so a slash before the digits excludes the match.
const NUM_UNIT = new RegExp(
  String.raw`(?<![\w.,$/])(\d(?:[\d,]*\d)?(?:\.\d+)?) (?=(?:${WORD_UNITS}|${SYMBOL_UNITS})(?:[²³]|\^[23])?(?![A-Za-zÀ-ÿ]))`,
  "g",
);

const YEAR_CONTEXT =
  /(?:\b(?:in|since|year|until|by|from|during|en|desde|hasta|año|de|del)|(?:january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\.?(?: \d{1,2},?)?)\s$/i;
const LABEL_CONTEXT = /\b(?:room|grade|page|pág|id|code|código|zip|pin|isbn)\s$/i;

/** Add thousands commas to a plain run of 4+ digits. */
function commaGroup(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Character-level typesetting for text that is ALREADY HTML-escaped (or plain
 * text with no markup). Idempotent. Never changes a number's value.
 */
export function typesetPlain(text) {
  let s = String(text ?? "");
  if (!s) return s;

  // Minus: a spaced hyphen between two operands...
  s = s.replace(
    new RegExp(String.raw`(?<=${OPERAND_LEFT}) - (?=${OPERAND_RIGHT})`, "g"),
    ` ${MINUS} `,
  );
  // ...and a hyphen that is the sign of a negative number or variable.
  s = s.replace(/(?<=^|[\s(=<>×÷+,:;[|])-(?=\d|\.\d|[a-z](?![A-Za-z\d]))/g, MINUS);
  // Multiplication: " x " between numbers, and an asterisk between operands.
  s = s.replace(/(?<=[\d)]) [xX] (?=\d|\()/g, " × ");
  s = s.replace(/(?<=[\d)])( ?)(?<!\*)\*(?!\*)( ?)(?=[\d(a-z])/g, "$1×$2");
  // Division: a spaced slash is division only when it sits in an equation
  // (so "$7 / 10%" point labels and "and/or" are left alone).
  // A unit may sit between the number and the sign ("48 in / 12 = 4 ft").
  s = s.replace(
    new RegExp(String.raw`(?<=${OPERAND_LEFT}|(?<=\d )[a-z]{1,4}) / (?=[$\d.,]+ ?=)`, "g"),
    " ÷ ",
  );
  s = s.replace(/(?<==\s?[$\d.,]+) \/ (?=\d)/g, " ÷ ");
  // Thousands commas.
  s = s.replace(/(?<![\d.,#/:-])(\d{4,})(?![\d,]|[-/:]\d)/g, (m, digits, offset, str) => {
    const before = str.slice(Math.max(0, offset - 16), offset);
    if (LABEL_CONTEXT.test(before)) return m;
    if (/^(?:19|20)\d\d$/.test(digits) && YEAR_CONTEXT.test(before)) return m;
    return commaGroup(digits);
  });
  // Quantity + unit never splits across a line; a percent sign stays on its number.
  s = s.replace(NUM_UNIT, `$1${NBSP}`);
  s = s.replace(/(?<=\d) %/g, `${NBSP}%`);
  return s;
}

// One equation or comparison, as a run of tokens joined by operators. Kept
// short so it can never force a 375px column wider than the screen.
const TOK = String.raw`(?:[$(|]*\d[\d.,/%()|²³]*|[a-z])`;
const OP = String.raw`[+×÷−=<>≤≥]`;
const EQUATION_RUN = new RegExp(
  String.raw`(?<![\w.])${TOK}(?:[  ]?${OP}[  ]?${TOK})+(?![\w])`,
  "gi",
);
const RUN_STYLE = "white-space:nowrap;font-variant-numeric:tabular-nums";

function keepEquationsTogether(escaped) {
  return escaped.replace(EQUATION_RUN, (run) => {
    if (run.length > 36 || !/[=<>≤≥]/.test(run.replace(/&[lg]t;/g, ""))) return run;
    return `<span class="math-run" style="${RUN_STYLE}">${run}</span>`;
  });
}

/** Render fractions (3/4), exponents (x^2), and multiplication (×) in text. */
export function renderMathText(text) {
  if (!text) return "";
  let s = esc(String(text));
  s = typesetPlain(s);
  s = keepEquationsTogether(s);

  // Mixed numbers: 1 3/4
  s = s.replace(
    /(\d+)\s+(\d+)\/(\d+)/g,
    '$1 <span class="math-frac" role="math"><span class="math-frac-num">$2</span><span class="math-frac-den">$3</span></span>',
  );

  // Simple fractions: 3/4 (not URLs or dates)
  s = s.replace(
    /(?<![\d/])(\d+)\/(\d+)(?![\d/])/g,
    '<span class="math-frac" role="math"><span class="math-frac-num">$1</span><span class="math-frac-den">$2</span></span>',
  );

  // Exponents: x^2, 10^3, (-2)^4
  s = s.replace(
    /([a-zA-Z0-9)]+)\^(\d+)/g,
    '$1<span class="math-exp" aria-label="to the power of $2">$2</span>',
  );

  // Subscripts for chemical-style or index notation: x_1
  s = s.replace(/([a-zA-Z])_(\d+)/g, '$1<span class="math-sub">$2</span>');

  // Equations with equals highlighted
  s = s.replace(/(\s=\s)/g, '<span class="math-eq"> = </span>');

  return s;
}

/** Set innerHTML on an element with math-rendered text. */
export function setMathHtml(el, text) {
  if (!el) return;
  el.innerHTML = renderMathText(text);
}
