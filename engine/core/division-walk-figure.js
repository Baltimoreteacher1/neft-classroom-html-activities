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
  // DECIMALS FIRST. A decimal walk restates itself in integers mid-way ("The
  // problem is now 189 ÷ 63"), so matching the integer pair first hid the
  // decimal origin and with it the opening frame that shows 18.9 ÷ 6.3.
  const decFirst = text.match(/([\d.,]*\.\d+)\s*÷\s*([\d.,]*\.\d+)/);
  if (decFirst) {
    const shifts = new Map();
    for (const m of text.matchAll(/([\d.,]+)\s+becomes\s+(\d[\d,]*)\b/g)) {
      shifts.set(m[1].replace(/,/g, ""), Number(m[2].replace(/,/g, "")));
    }
    const dividend = shifts.get(decFirst[1].replace(/,/g, ""));
    const divisor = shifts.get(decFirst[2].replace(/,/g, ""));
    if (dividend && divisor && divisor > 1) {
      return {
        dividend,
        divisor,
        originalDividendText: decFirst[1].replace(/,/g, ""),
        originalDivisorText: decFirst[2].replace(/,/g, ""),
      };
    }
  }
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
    if (dividend && divisor && divisor > 1) {
      // Carry the AUTHORED decimal texts too: the walk should open on the
      // problem as the student meets it (18.9 ÷ 6.3), not on the shifted
      // integers the algorithm works with — the shift IS one of the steps.
      return {
        dividend,
        divisor,
        originalDividendText: decPair[1].replace(/,/g, ""),
        originalDivisorText: decPair[2].replace(/,/g, ""),
      };
    }
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
    `style="max-width:${Math.min(width, 460)}px">` +
    head.join("") +
    marks.join("") +
    `</svg>`
  );
}

/**
 * The problem AS WRITTEN — decimal points and all — in the empty bracket. The
 * opening frames of a decimal-division walk showed the already-shifted
 * integers ("63)189" for 18.9 ÷ 6.3) with the move faded in as though it had
 * been made before the student arrived (Joel, 2026-08-26: "watch me solve it
 * starts with the division problem without decimals. It should start with the
 * problem that has decimals and change with each part"). This is the frame the
 * walk opens on; the shifted tableau takes over when the point-moving lines
 * have been read.
 */
function drawDecimalSetup(dividendText, divisorText) {
  const dChars = String(dividendText).split("");
  const vChars = String(divisorText).split("");
  const cw = (ch) => (ch === "." ? U * 0.45 : U);
  let x = U / 2;
  const head = [];
  for (const ch of vChars) {
    head.push(svgText(x, R + R - 10, ch, ch === "." ? "dwf-point dwf-old" : "dwf-old"));
    x += cw(ch);
  }
  const left = x + U / 2;
  head.push(
    `<path d="M ${left - 6} ${R + 4} q 8 ${R / 2} 0 ${R} " class="dwf-bracket" fill="none"/>`,
  );
  let dx = left + U / 2;
  for (const ch of dChars) {
    head.push(svgText(dx, R + R - 10, ch, ch === "." ? "dwf-point dwf-old" : "dwf-old"));
    dx += cw(ch);
  }
  const width = dx + U / 2;
  head.splice(
    vChars.length + 1,
    0,
    `<line x1="${left - 6}" y1="${R + 4}" x2="${width - U / 2}" y2="${R + 4}" class="dwf-bracket"/>`,
  );
  const alt = `Long division set up: ${dividendText} divided by ${divisorText}, before any steps.`;
  return (
    `<svg class="dwf" viewBox="0 0 ${width} ${3 * R}" role="img" aria-label="${alt}" ` +
    `style="max-width:${Math.min(width, 380)}px">` +
    head.join("") +
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

  // A decimal walk OPENS on the decimal problem. The lines before the first
  // tableau are the ones moving the point, and they used to carry no figure at
  // all — so the seeded frame was the shifted integers, a move ahead of the
  // narration. findProblem carries the authored decimal texts for exactly this.
  const problem = findProblem(list.filter((l) => typeof l === "string"));
  if (problem && problem.originalDividendText) {
    const setup = drawDecimalSetup(problem.originalDividendText, problem.originalDivisorText);
    for (let i = 0; i < figures.length && !figures[i]; i++) figures[i] = i === 0 ? setup : null;
    if (!figures[0]) figures[0] = setup;
  }

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
 * The move-the-point model, on the lesson's own numbers: the decimal problem
 * as the student meets it, an arrow under each decimal point hopping it right,
 * and the equivalent whole-number problem it becomes. This is the ONE picture
 * a decimal-division lesson asks students to copy into their notebook — the
 * finished 189÷63 tableau it used to show carried no decimal anywhere, so the
 * model omitted the exact move the lesson exists to teach (Joel, 2026-08-26:
 * "just have a division problem with decimals and then an arrow showing the
 * decimals moved").
 *
 * Every number drawn is stated by the lesson: the decimal pair and its shifted
 * integers come from findProblem (which demands the lesson's own "6.3 becomes
 * 63" lines), and the answer renders only when a line literally states
 * "18.9 ÷ 6.3 = 3". Returns null for a walk with no decimal shift — those
 * lessons keep whatever model they had.
 *
 * @param {string[]} rawLines the worked example's authored lines
 * @param {{isEs?: boolean}} [opts]
 * @returns {string | null}
 */
export function decimalShiftFigure(rawLines, opts = {}) {
  const lines = (Array.isArray(rawLines) ? rawLines : []).filter(
    (l) => typeof l === "string" && l.trim(),
  );
  if (!lines.length) return null;
  let problem = null;
  try {
    problem = findProblem(lines);
  } catch {
    return null;
  }
  if (!problem || !problem.originalDividendText || !problem.originalDivisorText) return null;
  const origDvd = problem.originalDividendText;
  const origDvs = problem.originalDivisorText;
  const places = (origDvs.split(".")[1] || "").length;
  if (!places) return null;

  const text = lines.join(" ");
  const ansMatch = text.match(
    new RegExp(`${escapeReg(origDvd)}\\s*÷\\s*${escapeReg(origDvs)}\\s*=\\s*([\\d,]+(?:\\.\\d+)?)`),
  );
  const answer = ansMatch ? ansMatch[1] : null;

  const isEs = !!opts.isEs;
  const label = isEs
    ? `Mueve ambos puntos decimales ${places} ${places === 1 ? "lugar" : "lugares"} a la derecha.`
    : `Move both decimal points ${places} ${places === 1 ? "place" : "places"} to the right.`;

  // Character layout: digits get a full column, decimal points a narrow one.
  const cw = (ch) => (ch === "." ? U * 0.45 : U);
  /* LONG-DIVISION NOTATION, not "a \u00f7 b".
   *
   * The model a student copies has to look like the thing they will write. This
   * figure used to draw "18.9 \u00f7 6.3" over "189 \u00f7 63" \u2014 correct arithmetic in
   * the wrong handwriting, so the notebook page did not match the tableau in
   * the lesson, the lab, or the worksheet (Joel, 2026-08-27: "look like a long
   * division problem with the long division symbol"). Each row is now
   * divisor, bracket, vinculum, dividend \u2014 6.3)18.9 above 63)189 \u2014 and the
   * hop arrows still show the point moving between them. */
  const topY = 44;
  const bottomY = 140;
  const BAR_RISE = 17;

  /** One row of long-division notation: divisor ) dividend, with the overbar. */
  const layoutDivision = (divisorStr, dividendStr, y, cls) => {
    let x = U / 2;
    const parts = [];
    const pointXs = [];
    for (const ch of String(divisorStr)) {
      const w = cw(ch);
      parts.push(svgText(x + w / 2, y, ch, ch === "." ? `dwf-point ${cls}` : cls));
      if (ch === ".") pointXs.push(x + w / 2);
      x += w;
    }
    // The bracket, drawn rather than typed: no glyph reliably joins the vinculum.
    const bx = x + U * 0.1;
    parts.push(
      `<path d="M ${bx} ${y + 9} C ${bx + U * 0.5} ${y + 4}, ${bx + U * 0.62} ${y - BAR_RISE + 8}, ` +
        `${bx + U * 0.62} ${y - BAR_RISE}" class="dwf-bracket ${cls}" fill="none"/>`,
    );
    x = bx + U * 0.62;
    const barStart = x;
    for (const ch of String(dividendStr)) {
      const w = cw(ch);
      parts.push(svgText(x + w / 2, y, ch, ch === "." ? `dwf-point ${cls}` : cls));
      if (ch === ".") pointXs.push(x + w / 2);
      x += w;
    }
    parts.push(
      `<line x1="${barStart}" y1="${y - BAR_RISE}" x2="${x}" y2="${y - BAR_RISE}" class="dwf-vinculum ${cls}"/>`,
    );
    return { svg: parts.join(""), width: x + U / 2, pointXs };
  };

  const top = layoutDivision(origDvs, origDvd, topY, "dwf-old"); // eslint-disable-line
  const bottomStr = `${problem.dividend} \u00f7 ${problem.divisor}${answer ? ` = ${answer}` : ""}`;
  const bottom = layoutDivision(
    String(problem.divisor),
    String(problem.dividend),
    bottomY,
    "dwf-new",
  );
  // The label sits between the rows and was being CLIPPED: the viewBox was
  // sized to the digits alone, so "move both decimal points 1 place right"
  // ran off both ends. Size the box to the widest element, caption included.
  const labelWidth = label.length * 6.1 + U;
  const width = Math.max(top.width, bottom.width, labelWidth);
  const height = bottomY + 16;

  // One hop arrow per decimal point, arcing right the number of places moved.
  const arrows = top.pointXs
    .map((px) => {
      const span = places * U;
      const y = topY + 8;
      return (
        `<path d="M ${px} ${y} q ${span / 2} 18 ${span} 0" class="dwf-shift-arrow" fill="none"/>` +
        `<path d="M ${px + span} ${y} l -7 8 l 9 2 z" class="dwf-shift-head"/>`
      );
    })
    .join("");

  const labelSvg = `<text x="${width / 2}" y="94" class="dwf-shift-label" text-anchor="middle">${label}</text>`;
  const alt = isEs
    ? `${origDvd} ÷ ${origDvs}: mueve ambos puntos decimales ${places} ${places === 1 ? "lugar" : "lugares"} a la derecha y el problema se convierte en ${bottomStr}.`
    : `${origDvd} ÷ ${origDvs}: move both decimal points ${places} ${places === 1 ? "place" : "places"} right and the problem becomes ${bottomStr}.`;
  return (
    `<svg class="dwf dwf-shift" viewBox="0 0 ${width} ${height}" role="img" aria-label="${alt}" ` +
    `style="max-width:${Math.min(width, 380)}px">` +
    `<g transform="translate(${(width - top.width) / 2} 0)">${top.svg}${arrows}</g>` +
    labelSvg +
    `<g transform="translate(${(width - bottom.width) / 2} 0)">${bottom.svg}</g>` +
    `</svg>`
  );
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

/**
 * The decimalShiftFigure's own classes, SEPARATE from DIVISION_FIGURE_CSS on
 * purpose: generate-worksheets.mjs bakes DIVISION_FIGURE_CSS into all 576
 * committed worksheet pages, so adding these rules there made every worksheet
 * stale against its generator and turned `generated-pages-fresh` red at the
 * ship gate — a 576-file regeneration for CSS no worksheet uses. Only the
 * surfaces that render the shift figure interpolate this string.
 */
export const DECIMAL_SHIFT_FIGURE_CSS = `
  .dwf-vinculum{stroke:currentColor;stroke-width:1.6;stroke-linecap:round;}
  .dwf-shift .dwf-bracket{stroke:currentColor;stroke-width:1.6;stroke-linecap:round;}
  .dwf .dwf-point { fill: #b91c1c; font-weight: 700; }
  .dwf .dwf-shift-arrow { stroke: #b91c1c; stroke-width: 2.5; fill: none; }
  .dwf .dwf-shift-head { fill: #b91c1c; }
  .dwf .dwf-shift-label {
    font-family: Outfit, system-ui, sans-serif;
    font-size: 15px;
    font-weight: 600;
    fill: #475569;
  }
`;
