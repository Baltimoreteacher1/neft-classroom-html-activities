// Long-division step figures for the Learn It "Watch Me Solve It" walkthrough.
//
// When a worked example narrates the standard algorithm (DIVIDE → MULTIPLY →
// SUBTRACT → BRING DOWN), each authored line gets a snapshot of the vertical
// tableau as it stands AFTER that line — quotient digits above the bar,
// divisor into dividend, products and differences in their columns, the newest
// marks highlighted. Reading "13 − 12 = 1" without seeing where the 1 lands
// under the bracket is the whole difficulty of long division.
//
// DRAW NOTHING WHEN UNSURE. The figure is derived by simulating the actual
// algorithm and then walking the authored lines, consuming each computed
// event only when the line itself states that event's numbers (the window,
// the quotient digit, the product, the difference, the brought-down digit).
// If any line claims numbers the simulation did not produce, or the walk ends
// with events unconsumed, the whole lesson gets NO figures — a tableau that
// disagrees with the sentence beside it is worse than no tableau. By
// construction every number this figure draws is stated by the lesson.
//
// Dependency-free on purpose so `npm test` can import it directly.

/** @typedef {{ kind: string, value: number, endIdx: number, qDigit?: number, minuend?: number }} DivEvent */

const WORD_DIGITS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

/** All integers stated by a line, as numbers (commas stripped). */
function numbersIn(line) {
  const out = new Set();
  for (const m of String(line).match(/\d[\d,]*(?:\.\d+)?/g) || []) {
    if (m.includes(".")) continue;
    out.add(Number(m.replace(/,/g, "")));
  }
  for (const [word, value] of Object.entries(WORD_DIGITS)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(line)) out.add(value);
  }
  return out;
}

/**
 * Find the whole-number division this walk performs. Two accepted shapes:
 *  - a literal integer pair: "1,344 ÷ 12";
 *  - a decimal pair rewritten whole: "18.9 ÷ 6.3" plus "6.3 becomes 63" and
 *    "18.9 becomes 189" (the move-the-point step the lesson itself teaches).
 * @param {string[]} lines
 * @returns {{ dividend: number, divisor: number } | null}
 */
function findProblem(lines) {
  const text = lines.join(" ");
  // The lookahead rejects a decimal continuation ("12.5") but must accept a
  // sentence-ending period ("÷ 12. The dividend…").
  const intPair = text.match(/(\d[\d,]*)\s*÷\s*(\d[\d,]*)(?!\d|\.\d)/);
  if (intPair && !/\d\.\d/.test(intPair[0])) {
    const dividend = Number(intPair[1].replace(/,/g, ""));
    const divisor = Number(intPair[2].replace(/,/g, ""));
    if (Number.isInteger(dividend) && Number.isInteger(divisor) && divisor > 1) {
      return { dividend, divisor };
    }
  }
  const decPair = text.match(/([\d.,]*\.\d+)\s*÷\s*([\d.,]*\.\d+)/);
  if (decPair) {
    const shifts = new Map();
    for (const m of text.matchAll(/([\d.,]+)\s+becomes\s+(\d[\d,]*)\b/g)) {
      shifts.set(m[1].replace(/,/g, ""), Number(m[2].replace(/,/g, "")));
    }
    const dividend = shifts.get(decPair[1].replace(/,/g, ""));
    const divisor = shifts.get(decPair[2].replace(/,/g, ""));
    if (dividend && divisor && divisor > 1) return { dividend, divisor };
  }
  return null;
}

/**
 * Simulate the standard algorithm and emit its events in teaching order.
 * @param {number} dividend
 * @param {number} divisor
 * @returns {DivEvent[]}
 */
function simulate(dividend, divisor) {
  const digits = String(dividend).split("").map(Number);
  /** @type {DivEvent[]} */
  const events = [];
  let window = 0;
  let started = false;
  for (let i = 0; i < digits.length; i++) {
    window = window * 10 + digits[i];
    if (started) events.push({ kind: "bring", value: digits[i], endIdx: i, qDigit: window });
    if (!started && window < divisor && i < digits.length - 1) continue;
    started = true;
    const qDigit = Math.floor(window / divisor);
    const product = qDigit * divisor;
    const minuend = window;
    events.push({ kind: "divide", value: window, endIdx: i, qDigit });
    events.push({ kind: "multiply", value: product, endIdx: i, qDigit, minuend });
    window -= product;
    events.push({ kind: "subtract", value: window, endIdx: i, qDigit: product, minuend });
  }
  return events;
}

const escapeReg = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Does this line STATE this event? Stated numbers alone over-consume — the
 * DIVIDE line "12 does not fit into 1, so I look at 13" also contains the
 * multiply's 12 and the subtract's 1 — so each kind demands its own shape:
 * multiply the literal "qd × divisor", subtract the literal "minuend −
 * product", bring-down the word "bring" plus both its numbers, divide the
 * window and quotient digit alongside dividing language.
 * @param {string} line
 * @param {DivEvent} ev
 * @param {{dividend:number, divisor:number}} problem
 */
function lineStatesEvent(line, ev, problem) {
  const text = String(line).replace(/(\d),(?=\d)/g, "$1");
  const stated = numbersIn(line);
  if (ev.kind === "divide") {
    return (
      stated.has(ev.value) &&
      stated.has(ev.qDigit ?? -1) &&
      (new RegExp(`\\b${escapeReg(ev.value)}\\s*÷\\s*${escapeReg(problem.divisor)}`).test(text) ||
        /\bfits?\b|\bgoes into\b|\bdivid/i.test(text))
    );
  }
  if (ev.kind === "multiply") {
    return new RegExp(
      `\\b${escapeReg(ev.qDigit)}\\s*[×x*]\\s*${escapeReg(problem.divisor)}\\b|\\b${escapeReg(problem.divisor)}\\s*[×x*]\\s*${escapeReg(ev.qDigit)}\\b`,
    ).test(text);
  }
  if (ev.kind === "subtract") {
    return new RegExp(`\\b${escapeReg(ev.minuend)}\\s*[−–-]\\s*${escapeReg(ev.qDigit)}\\b`).test(
      text,
    );
  }
  // bring
  return /\bbring/i.test(text) && stated.has(ev.value) && stated.has(ev.qDigit ?? -1);
}

/**
 * Walk the authored lines, consuming simulated events as each line states
 * them. Returns per-line consumed counts, or null when the narration and the
 * algorithm disagree anywhere.
 * @param {string[]} lines
 * @param {DivEvent[]} events
 * @param {{dividend:number, divisor:number}} problem
 * @returns {number[] | null}
 */
function consume(lines, events, problem) {
  const counts = [];
  let next = 0;
  for (const line of lines) {
    let consumed = 0;
    while (next < events.length && lineStatesEvent(line, events[next], problem)) {
      next++;
      consumed++;
    }
    counts.push(consumed);
  }
  if (next !== events.length) return null;
  return counts;
}

const U = 26; // column width (monospace digits)
const R = 34; // row height

function svgText(x, y, text, cls) {
  return `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${text}</text>`;
}

/**
 * Draw the tableau holding the first `upTo` events; events consumed by the
 * CURRENT line render highlighted.
 * @param {{dividend:number, divisor:number}} problem
 * @param {DivEvent[]} events
 * @param {number} upTo
 * @param {number} fresh  how many of the last events are new this step
 */
function drawTableau(problem, events, upTo, fresh) {
  const digits = String(problem.dividend).split("");
  const divisorStr = String(problem.divisor);
  const left = (divisorStr.length + 1) * U; // divisor + bracket gutter
  const col = (idx) => left + U / 2 + idx * U;
  let row = 2; // row 0 = quotient, row 1 = dividend
  const width = left + digits.length * U + U;
  const marks = [];

  for (let e = 0; e < upTo; e++) {
    const ev = events[e];
    const isFresh = e >= upTo - fresh;
    const cls = isFresh ? "dwf-new" : "dwf-old";
    if (ev.kind === "divide") {
      marks.push(svgText(col(ev.endIdx), R - 10, String(ev.qDigit), `dwf-q ${cls}`));
    } else if (ev.kind === "multiply" || ev.kind === "subtract") {
      const str = String(ev.value);
      for (let i = 0; i < str.length; i++) {
        marks.push(svgText(col(ev.endIdx - (str.length - 1) + i), row * R + R - 10, str[i], cls));
      }
      if (ev.kind === "multiply") {
        // rule under the product, sized to the wider of product/window
        const span = Math.max(String(ev.value).length, 2);
        const x1 = col(ev.endIdx - span + 1) - U / 2;
        const x2 = col(ev.endIdx) + U / 2;
        marks.push(
          `<line x1="${x1}" y1="${row * R + R - 2}" x2="${x2}" y2="${row * R + R - 2}" class="dwf-rule ${cls}"/>`,
        );
      }
      row++;
    } else if (ev.kind === "bring") {
      // brought digit lands beside the previous difference, on its row
      marks.push(
        svgText(col(ev.endIdx), (row - 1) * R + R - 10, String(ev.value), `dwf-bring ${cls}`),
      );
    }
  }

  const height = (row + 1) * R;
  const head = [
    // divisor
    ...divisorStr.split("").map((d, i) => svgText(U / 2 + i * U, R + R - 10, d, "dwf-old")),
    // bracket
    `<path d="M ${left - 6} ${R + 4} q 8 ${R / 2} 0 ${R} " class="dwf-bracket" fill="none"/>`,
    `<line x1="${left - 6}" y1="${R + 4}" x2="${width - U / 2}" y2="${R + 4}" class="dwf-bracket"/>`,
    // dividend
    ...digits.map((d, i) => svgText(col(i), R + R - 10, d, "dwf-old")),
  ];
  const qSoFar = events
    .slice(0, upTo)
    .filter((ev) => ev.kind === "divide")
    .map((ev) => ev.qDigit)
    .join("");
  const alt = `Long division of ${problem.dividend} by ${problem.divisor}: tableau after this step${qSoFar ? `, quotient so far ${qSoFar}` : ""}.`;
  return (
    `<svg class="dwf" viewBox="0 0 ${width} ${height}" role="img" aria-label="${alt}" ` +
    `style="max-width:${Math.min(width, 380)}px">` +
    head.join("") +
    marks.join("") +
    `</svg>`
  );
}

/**
 * One SVG per authored line (null for lines that do not move the tableau),
 * or null when this worked example is not a verifiable long-division walk.
 * The setup line — the one stating the whole-number problem — gets the empty
 * bracket so students see where the numbers live before the first cycle.
 * @param {string[]} rawLines
 * @returns {(string|null)[] | null}
 */
export function divisionStepFigures(rawLines) {
  const lines = (Array.isArray(rawLines) ? rawLines : []).filter(
    (l) => typeof l === "string" && l.trim(),
  );
  if (lines.length < 3) return null;
  if (!/\bbring(?:s|ing)? down\b/i.test(lines.join(" "))) return null;
  const problem = findProblem(lines);
  if (!problem) return null;
  const events = simulate(problem.dividend, problem.divisor);
  if (!events.length) return null;
  const counts = consume(lines, events, problem);
  if (!counts) return null;

  // The setup snapshot belongs to the first line that states both numbers.
  const setupIdx = lines.findIndex((l) => {
    const stated = numbersIn(l);
    return stated.has(problem.dividend) && stated.has(problem.divisor);
  });

  let upTo = 0;
  return lines.map((_line, i) => {
    if (counts[i] === 0) {
      return i === setupIdx && upTo === 0 ? drawTableau(problem, events, 0, 0) : null;
    }
    upTo += counts[i];
    return drawTableau(problem, events, upTo, counts[i]);
  });
}

/**
 * A line still belongs to the long-division cycle when it names one of the
 * cycle's own moves. Word-bounded on purpose: the "I check by multiplying"
 * coda must NOT match, because it is a different computation and must not sit
 * under a picture of this one.
 */
const CYCLE_STEP = /\b(?:divide|multiply|subtract|bring down|cycle|remainder)\b/i;

/**
 * The tableau AS A STUDENT SEES IT, one entry per authored line.
 *
 * `divisionStepFigures` emits a snapshot only for a line that MAKES a move, and
 * a worked example does not read that way. Lesson 2-7 states nine lines and
 * makes moves on four of them, so rendering the raw array blinks the model out
 * on the setup line ("Now I write it the tall way — 63 into 189") and again on the
 * line that states the answer ("BRING DOWN: there are no digits left to bring
 * down, so the cycle is finished and the remainder is 0"). Joel reported this
 * as "the tableau stops after the SUBTRACT step" — the picture vanished exactly
 * where a student reads the result.
 *
 * So each line without a snapshot of its own re-shows the most recent one, and
 * the carry runs one step PAST the last move, across the lines that still name
 * part of the cycle, stopping at the first that does not.
 *
 * This lives here, once, because BOTH renderers that own the worked example
 * need it — `engine/components/vocab-learn-panel.js` (the whole-group Learn It)
 * and `engine/core/small-group-renderer.js` (the studio Build card). It was
 * written twice, verbatim, and two copies of a rule is how this repo's defects
 * start: a fix to one is not a fix to the other.
 *
 * @param {string[]} lines the worked example's authored lines
 * @returns {(string|null)[]} SVG per line; null where no tableau should show
 */
export function carriedDivisionFigures(lines) {
  const list = Array.isArray(lines) ? lines : [];
  let figures = [];
  try {
    figures = divisionStepFigures(list) || [];
  } catch {
    return [];
  }
  const lastMove = figures.reduce((last, svg, i) => (svg ? i : last), -1);
  if (lastMove < 0) return [];

  let lastLine = lastMove;
  while (lastLine + 1 < list.length && CYCLE_STEP.test(String(list[lastLine + 1]))) {
    lastLine += 1;
  }

  const out = [];
  let carried = null;
  for (let i = 0; i < list.length; i++) {
    if (figures[i]) carried = figures[i];
    out[i] = i <= lastLine ? carried : null;
  }
  return out;
}

/**
 * The stroke and fill this figure's own classes need, owned by the module that
 * writes them.
 *
 * The bracket and the subtraction rules are an SVG `<path>` and `<line>`, whose
 * default stroke is `none` — so a surface that renders the figure without these
 * rules shows the digits and NO long-division house at all. That shipped: the
 * whole-group Learn It panel carried these five rules privately, and when the
 * small groups started rendering the same tableau (2026-08-23) they inherited
 * the markup and not the stroke, leaving students who need the model most
 * looking at "12 1344" floating in a box. Both surfaces now interpolate this
 * string, so neither can render the figure without dressing it.
 */
export const DIVISION_FIGURE_CSS = `
  .dwf { display: block; }
  .dwf text {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 22px;
    fill: #0f172a;
  }
  .dwf .dwf-bracket { stroke: #0f172a; stroke-width: 2.5; fill: none; }
  .dwf .dwf-rule { stroke: #0f172a; stroke-width: 2; }
  .dwf .dwf-q { font-weight: 700; }
  .dwf .dwf-bring { fill: #b45309; }
  .dwf .dwf-new { fill: #0d7a76; font-weight: 700; }
`;
