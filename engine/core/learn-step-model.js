// Learn It step model — pure text-parsing helpers for the sequential Learn It
// panel (engine/components/vocab-learn-panel.js). Dependency-free on purpose so
// `npm test` can import it directly (lesson-renderer.js cannot be imported from
// node because of the @engine/styles Vite alias; nothing here touches the DOM).
//
// Everything in this file DERIVES presentation structure from content the
// lesson already authors (launch.conceptIntro.*). It never invents mathematics:
// when a parse is uncertain it returns nothing, and the caller renders the
// authored prose unchanged. A wrong extracted equation printed large on a
// teaching page is worse than no equation — see the "120 divided by 8 = 15"
// incident guarded in extractEquation().

/**
 * Parse the authored keyIdea string into its structured parts.
 *
 * The 84 core lessons author keyIdea in a consistent shape:
 *   "Topic. Formula: <formula>. 1. <point> 2. <point> 3. <point> Example: <ex>"
 * Every segment is optional; whatever does not match stays in `topic` so the
 * caller can always fall back to showing the full authored sentence.
 *
 * @param {string} keyIdea
 * @returns {{ topic: string, formula: string, points: string[], example: string }}
 */
export function parseKeyIdea(keyIdea) {
  const out = { topic: "", formula: "", points: [], example: "" };
  let text = String(keyIdea || "").trim();
  if (!text) return out;

  // "Example: …" trails the numbered points; lift it off first so it does not
  // get swallowed into the final point.
  const exampleMatch = text.match(/(?:^|\s)Example:\s*(.+)$/);
  if (exampleMatch) {
    out.example = exampleMatch[1].trim().replace(/\.\s*$/, "");
    text = text.slice(0, exampleMatch.index).trim();
  }

  // Numbered rule points: "1. Identify the base … 2. …". The `\s` after the
  // period keeps decimals ("1.5 ft") from being read as list markers.
  const firstPoint = text.search(/(?:^|\s)\d{1,2}\.\s/);
  if (firstPoint !== -1) {
    const pointsText = text.slice(firstPoint).trim();
    text = text.slice(0, firstPoint).trim();
    const parts = pointsText.split(/(?:^|\s)\d{1,2}\.\s/).filter((p) => p.trim());
    out.points = parts.map((p) => p.trim().replace(/[.;]\s*$/, ""));
  }

  // "Formula: …" — everything from the marker to the end of what remains.
  const formulaMatch = text.match(/(?:^|\s)Formula:\s*(.+)$/);
  if (formulaMatch) {
    out.formula = formulaMatch[1].trim().replace(/\.\s*$/, "");
    text = text.slice(0, formulaMatch.index).trim();
  }

  out.topic = text.replace(/\.\s*$/, "").trim();
  return out;
}

// A value token: 1,344  78.50  3/4  50%  (12)  ½  2²
// Vulgar fractions and superscript exponents must be part of the operand:
// dropping a leading ½ turned "½ × 6 × 4 = 12" into the false "6 × 4 = 12",
// and dropping a ² turned "60 = 2² × 3 × 5" into the false "60 = 2".
// Mixed numbers ("2 1/2") are one value — matching only their fraction half
// turned "2 1/2 = 5/2" into the false "1/2 = 5/2".
const VALUE = String.raw`\(?-?\$?(?:[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+\s+\d+\/\d+|\d[\d,]*(?:\.\d+)?(?:\/\d+)?)[⁰¹²³⁴⁵⁶⁷⁸⁹]*%?\)?`;
// A variable token: a single letter with an optional coefficient (A, b, (h),
// x, 3x, 2n, 0.7v, 2.5h). The lookahead keeps it off the front of English
// words; the coefficient keeps "3x ÷ 3 = 21 ÷ 3" from shedding its 3x and
// printing the false "3 = 21 ÷ 3"; the DECIMAL coefficient keeps
// "0.7v = 26,600" from being torn into the wrong equation "7v = 26,600".
const VARIABLE = String.raw`\(?(?:\d[\d,]*(?:\.\d+)?)?[A-Za-z](?![A-Za-z])\)?`;
// A coefficient-attached numeric group: 3(15 + 5), 2(8 + 3), 5(4). Dropping
// the coefficient turned "3(15 + 5) = 3 × 15 + 3 × 5" into the false
// "(15 + 5) = 3 × 15 + 3 × 5", so the whole group is one operand.
const PAREN_GROUP = String.raw`\d*\(\s*-?\d[\d,]*(?:\.\d+)?(?:\s*[×÷·+*/−–-]\s*-?\d[\d,]*(?:\.\d+)?)*\s*\)`;
const OPERAND = `(?:${PAREN_GROUP}|${VALUE}|${VARIABLE})`;
const OPERATOR = String.raw`[×÷·+*/=−–-]`;
// Dozens of lessons author multiplication as a space-padded lowercase x
// ("$5 x 3 = $15"); joined here as an operator so those equations still
// extract. A bare x with no spaces stays a variable (3x).
const JOINER = `(?:\\s*${OPERATOR}\\s*|\\sx\\s)`;
const EQUATION_RUN = new RegExp(`${OPERAND}(?:${JOINER}${OPERAND})+`, "g");

/**
 * Extract one display-worthy equation from an authored instructional line, or
 * null when no run can be extracted with confidence.
 *
 * Guards (each one shipped a real defect before it existed in the generator's
 * equivalent, scripts/generate-notes.mjs liMathSpan):
 *  - the run must contain "=" — bare products ("5 × 4") duplicate the prose
 *    without adding a mathematical statement worth displaying large;
 *  - a run that OPENS with "<operand> =" is only trusted when the text before
 *    it ended a clause (.,;:!?—) or the run starts the line. "120 divided by
 *    8 = 15" otherwise extracts the false equation "8 = 15";
 *  - a prose operator word immediately before the run ("by", "of", "to",
 *    "from", "than", "minus", "plus", "times", "into") rejects it for the same
 *    reason — the visible run is the tail of a sentence-shaped computation;
 *  - single-letter operands are English words too ("I", "a"), so a run whose
 *    operands are ALL letters needs at least two operators (A = b · h) before
 *    it is believed.
 *
 * @param {string} line
 * @returns {string|null}
 */
export function extractEquation(line) {
  const text = String(line || "");
  EQUATION_RUN.lastIndex = 0;
  let match;
  while ((match = EQUATION_RUN.exec(text)) !== null) {
    // A run may not begin mid-word: "IQR = Q3 − Q1 = 88 − 75.5" otherwise
    // yields "1 = 88 − 75.5" (the tail of "Q1"), and "0.7v = 26,600" yields
    // "7v = 26,600" (the tail of the decimal coefficient). Step one character
    // forward so valid inner runs ("88 − 75.5 = 12.5") are still found.
    const prev = match.index > 0 ? text[match.index - 1] : "";
    const prev2 = match.index > 1 ? text[match.index - 2] : "";
    if (/[A-Za-z0-9]/.test(prev) || (prev === "." && /\d/.test(prev2))) {
      EQUATION_RUN.lastIndex = match.index + 1;
      continue;
    }
    let run = match[0].trim();
    // Trim trailing sentence punctuation the operand pattern may have caught.
    run = run.replace(/[.,;:!?]+$/, "").trim();
    if (!run.includes("=")) continue;

    const before = text.slice(0, match.index).trimEnd();
    // The bare "A = B" shape is the false-equation trap ("120 divided by
    // 8 = 15" → "8 = 15"): a two-operand equality is only trusted when the
    // text before it ended a clause or the run starts the line. Longer runs
    // carry their own arithmetic and are audited fleet-wide by the test.
    const bareEquality = /^[^×÷·+*/−–-]+=[^×÷·+*/−–=-]+$/.test(run);
    if (bareEquality && before && !/[.,;:!?—–)]$/.test(before)) continue;
    const lastWord = (before.match(/([A-Za-z]+)$/) || [])[1];
    if (
      lastWord &&
      /^(by|of|to|from|than|minus|plus|times|into|and|is|equals|makes?|get|gets|gives?|shows?|becomes?|test|whether|if)$/i.test(
        lastWord,
      )
    ) {
      continue;
    }

    // A quotient stated "with a remainder" is only true WITH the remainder:
    // "20 ÷ 3 = 6 complete units with a remainder of 2" must not print the
    // bare false equation "20 ÷ 3 = 6".
    const after = text.slice(match.index + match[0].length);
    if (
      /^\s*(?:complete|whole|remainder|leftover|left\b|with\s+a\s+remainder|R\s*\d)/i.test(after)
    ) {
      continue;
    }

    const operands = run.split(new RegExp(JOINER)).filter(Boolean);
    const hasDigits = /\d/.test(run);
    const operatorCount = (run.match(new RegExp(OPERATOR, "g")) || []).length;
    if (!hasDigits && operatorCount < 2) continue;
    if (operands.length < 2) continue;

    // Typography only: the space-padded ASCII x prints as a real times sign.
    return run.replace(/(?<=[\d$)])\sx\s(?=[\d$(])/g, " × ");
  }
  return null;
}

/* ── Manipulable moves ──────────────────────────────────────────────────────
   A worked-example line describes a MOVE: shift a point, multiply two numbers,
   subtract. `extractStepMove` turns that sentence into a descriptor a workspace
   can be built from, so a teacher can make the move live on the board and a
   student can make the same move in their own copy.

   The same rule as everything else in this file: the numbers come from the
   lesson's own sentence, and a move is emitted only when it can be CHECKED
   against that sentence arithmetically. An uncertain parse returns null and the
   step renders as it does today — a workspace whose "correct" answer was
   guessed is worse than no workspace, because a student would trust it. */

/** Digits-only value of a numeric token: "1,344" → 1344, "$0.60" → 0.6. */
function numeric(token) {
  const cleaned = String(token || "")
    .replace(/[$,\s]/g, "")
    .replace(/[)(]/g, "");
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** The significant digits of a numeric token, ignoring the point, the
 *  thousands separators, and the leading/trailing zeros a shift creates:
 *  "0.12" and "12" are the same digits one move apart. */
function digitsOf(token) {
  const bare = String(token).replace(/[^\d]/g, "");
  return bare.replace(/^0+/, "").replace(/0+$/, "") || "0";
}

// A number token that cannot END on a separator: `\d[\d,]*` happily swallows
// the comma in "18.9 becomes 189, and the point…", which then reaches the
// workspace as the label "189,".
const NUM = String.raw`\d(?:[\d,]*\d)?(?:\.\d+)?`;

/**
 * A DECIMAL SHIFT: the line says a point moves, and names the number before and
 * after. The pair is trusted only when the two numbers share their digits and
 * differ by exactly the stated power of ten — which is what makes the
 * workspace's target position a fact of the lesson rather than a guess.
 *
 * @returns {{kind:"decimal-shift", from:string, to:string, places:number,
 *            direction:"right"|"left"}|null}
 */
function decimalShiftMove(text) {
  if (!/decimal|point/i.test(text)) return null;
  const placesMatch = text.match(/\b(\d+|one|two|three|four)\s+place/i);
  const WORD = { one: 1, two: 2, three: 3, four: 4 };
  const places = placesMatch ? WORD[placesMatch[1].toLowerCase()] || Number(placesMatch[1]) : null;
  if (!places || places < 1) return null;
  const direction = /\bleft\b/i.test(text) ? "left" : "right";

  // "6.3 becomes 63", "18.9 → 189", "0.12)1.44 rewritten as 12)144"
  const pairRe = new RegExp(
    `(${NUM})\\s*(?:becomes?|→|->|turns into|rewritten as|is now|=>)\\s*(${NUM})`,
    "gi",
  );
  for (const m of text.matchAll(pairRe)) {
    const from = m[1];
    const to = m[2];
    const a = numeric(from);
    const b = numeric(to);
    if (a === null || b === null) continue;
    // Same digits, moved: this is what proves it is a SHIFT and not a
    // different computation that happens to be written with an arrow.
    if (digitsOf(from).replace(/0+$/, "") !== digitsOf(to).replace(/0+$/, "")) continue;
    const factor = direction === "right" ? 10 ** places : 10 ** -places;
    if (Math.abs(a * factor - b) > Math.abs(b) * 1e-9 + 1e-9) continue;
    return { kind: "decimal-shift", from, to, places, direction };
  }
  return null;
}

/**
 * An ARITHMETIC move: the line states `A op B = C` with numeric operands, and
 * the arithmetic is TRUE. A false equation would put a wrong answer under a
 * student's hand, so it is checked here rather than trusted.
 *
 * @returns {{kind:"arithmetic", a:string, op:string, b:string, result:string,
 *            equation:string}|null}
 */
const OP_CANON = { "*": "×", x: "×", X: "×", "/": "÷", "-": "−", "–": "−" };

/** Left-to-right evaluation with × ÷ binding tighter than + −. Operands are
 *  already-parsed numbers, so there is nothing to eval() and no expression a
 *  lesson could author that reaches a parser this small. */
function evaluate(values, ops) {
  const v = values.slice();
  const o = ops.slice();
  for (let i = 0; i < o.length; ) {
    if (o[i] === "×" || o[i] === "÷") {
      if (o[i] === "÷" && v[i + 1] === 0) return null;
      v.splice(i, 2, o[i] === "×" ? v[i] * v[i + 1] : v[i] / v[i + 1]);
      o.splice(i, 1);
    } else i++;
  }
  let acc = v[0];
  for (let i = 0; i < o.length; i++) acc = o[i] === "+" ? acc + v[i + 1] : acc - v[i + 1];
  return acc;
}

/**
 * Scan a line for `A op B [op C …] = R` where every operand is a plain number.
 *
 * This does NOT go through extractEquation. That function is tuned for what is
 * safe to PRINT LARGE beside a lesson, and its guards reject the tail of a
 * sentence-shaped computation — "12 clusters of about 10 is 12 × 10 = 120"
 * loses its equation to the word "is". Here the standard is different and
 * stronger: the arithmetic must be TRUE. A run mis-read out of a sentence
 * essentially never evaluates correctly, and a run that does evaluate
 * correctly is a real computation the lesson performed, so truth does the work
 * the prose-context guards were doing — while admitting the two-thirds of
 * lines those guards had to turn away.
 *
 * At least one operator is required on the left, so the bare `A = B` shape
 * (the "120 divided by 8 = 15" trap) can never produce a move.
 */
function arithmeticMove(text) {
  const OPS = "[×÷+*/x−–-]";
  const re = new RegExp(
    `(${NUM})((?:\\s*${OPS}\\s*${NUM})+)\\s*=\\s*(${NUM})(?!\\s*${OPS}\\s*${NUM}\\s*=)`,
    "g",
  );
  for (const m of String(text).matchAll(re)) {
    // A run may not start mid-number: "Q1 = 88" must not yield "1 = 88".
    const prev = m.index > 0 ? text[m.index - 1] : "";
    if (/[A-Za-z0-9.]/.test(prev)) continue;

    const values = [numeric(m[1])];
    const ops = [];
    const tailRe = new RegExp(`\\s*(${OPS})\\s*(${NUM})`, "g");
    for (const t of m[2].matchAll(tailRe)) {
      ops.push(OP_CANON[t[1]] || t[1]);
      values.push(numeric(t[2]));
    }
    const result = numeric(m[3]);
    if (result === null || values.some((v) => v === null)) continue;
    // A lone "x" between numbers is multiplication here, but "3 x 4" could also
    // be a variable; the arithmetic check settles it.
    const got = evaluate(values, ops);
    if (got === null) continue;
    if (Math.abs(got - result) > Math.abs(result) * 1e-9 + 1e-9) continue;

    const operands = [m[1], ...Array.from(m[2].matchAll(tailRe), (t) => t[2])];
    return {
      kind: "arithmetic",
      operands,
      ops,
      result: m[3],
      values,
      resultValue: result,
      equation: `${operands[0]} ${ops.map((o, i) => `${o} ${operands[i + 1]}`).join(" ")} = ${m[3]}`,
    };
  }
  return null;
}

/**
 * The manipulable move a worked-example line describes, or null.
 *
 * Decimal shifts are tried first: a line may state both ("6.3 becomes 63, so
 * 3 × 63 = 189"), and the move the sentence is ABOUT is the one it names.
 *
 * @param {string} line
 * @returns {{kind:string}&Record<string,unknown>|null}
 */
export function extractStepMove(line) {
  const text = String(line || "").trim();
  if (!text) return null;
  return decimalShiftMove(text) || arithmeticMove(text);
}

/**
 * Split a guided ("we do") line into the question it asks and the telling
 * that answers it, so the answer can sit behind a reveal instead of directly
 * above the student's own attempt. A line with no question mark is a plain
 * statement: ask = whole line, tell = "".
 *
 * @param {string} line
 * @returns {{ ask: string, tell: string }}
 */
export function splitGuidedLine(line) {
  const text = String(line || "").trim();
  const idx = text.indexOf("?");
  if (idx === -1 || idx === text.length - 1) return { ask: text, tell: "" };
  const ask = text.slice(0, idx + 1).trim();
  let tell = text.slice(idx + 1).trim();
  // Authored answers often arrive parenthesised: "…to get 100? (20)".
  const paren = tell.match(/^\(([^)]+)\)\s*$/);
  if (paren) tell = paren[1].trim();
  return { ask, tell };
}
