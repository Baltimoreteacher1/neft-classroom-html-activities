// decimal:columns - Add and subtract decimals in place-value columns with the decimal points lined up and zeros annexed (2-11).
// Controls: First number (10-200), Second number (0.05-9.95, always smaller, so a difference is never negative), Operation (1 add, 2 subtract).
// Everything is computed in whole hundredths (cents), so no decimal is ever added in floating point.
import { line, text } from './draw.mjs';

const FIRST = { min: 10, max: 200, step: 0.05 }, SECOND = { min: 0.05, max: 9.95, step: 0.05 };
const PLACES = ['hundreds', 'tens', 'ones', 'tenths', 'hundredths'], WORTH = ['100', '10', '1', '0.1', '0.01'];
const INK = '#17344b', MUTED = '#4a5a68', RUST = '#8f3b17', BAND = '#f2f8fb';
const POINT_X = 416, COL_X = [192, 276, 360, 472, 556], TOP = 74, BOTTOM = 290;
const ROW = { top: 152, bottom: 202, result: 266, regroup: 106 };

const cents = (v) => Math.round(v * 100);
const plural = (n, one, many) => (n === 1 ? one : many);

function check(values) {
  if (!Array.isArray(values) || values.length !== 3) throw new Error('The decimal columns model needs a first number, a second number and an operation.');
  for (const [v, c, name] of [[values[0], FIRST, 'First number'], [values[1], SECOND, 'Second number']])
    if (!Number.isFinite(v) || v < c.min - 1e-9 || v > c.max + 1e-9 || Math.abs(v * 100 - cents(v)) > 1e-6)
      throw new Error(`${name} must be from ${c.min} to ${c.max}, with at most two decimal places.`);
  if (values[2] !== 1 && values[2] !== 2) throw new Error('Operation must be 1 (add) or 2 (subtract).');
}

/** The five columns (hundreds, tens, ones, tenths, hundredths) of an amount in hundredths. */
const digitsOf = (c) => [Math.floor(c / 10000) % 10, Math.floor(c / 1000) % 10, Math.floor(c / 100) % 10, Math.floor(c / 10) % 10, c % 10];
/** How many decimal places an amount needs: 46 -> 0, 46.8 -> 1, 46.85 -> 2. */
const placesOf = (c) => (c % 100 === 0 ? 0 : c % 10 === 0 ? 1 : 2);
const show = (c, dp) => (c / 100).toFixed(dp);

/** What each column of a written number holds: a real digit, an annexed zero, or nothing (a leading blank or an unused decimal place). */
function cellsOf(c, dp, ownPlaces = placesOf(c)) {
  const d = digitsOf(c);
  return d.map((digit, j) => {
    if (j < 3) return { digit, kind: j === 2 || c >= [10000, 1000, 100][j] ? 'digit' : 'blank' };
    const k = j - 2;
    return { digit, kind: k <= ownPlaces ? 'digit' : k <= dp ? 'annex' : 'blank' };
  });
}

/** The column method, right to left: carries for addition, the adjusted top digits for subtraction. */
function work(ca, cb, op) {
  const top = digitsOf(ca), bot = digitsOf(cb), out = [0, 0, 0, 0, 0];
  const marks = Array(5).fill(null);
  let regroups = 0;
  if (op === 1) {
    let carry = 0;
    for (let j = 4; j >= 0; j--) {
      const s = top[j] + bot[j] + carry;
      out[j] = s % 10;
      carry = s >= 10 ? 1 : 0;
      if (carry && j > 0) { marks[j - 1] = 1; regroups++; }
    }
  } else {
    // a column regroups when its top digit, less the ten its right-hand neighbour borrowed, is still too small for the digit below
    const cur = [...top];
    let borrowed = 0;
    for (let j = 4; j >= 0; j--) {
      const short = cur[j] - borrowed < bot[j];
      if (short) regroups++;
      borrowed = short ? 1 : 0;
    }
    for (let j = 4; j >= 0; j--) {
      if (cur[j] < bot[j]) {
        let d = j - 1;
        while (d >= 0 && cur[d] === 0) d--;
        cur[d] -= 1;
        for (let k = d + 1; k < j; k++) cur[k] = 9;
        cur[j] += 10;
      }
      out[j] = cur[j] - bot[j];
    }
    cur.forEach((v, j) => { if (v !== top[j]) marks[j] = v; });
  }
  return { out, marks, regroups };
}

function evaluate(model, values) {
  check(values);
  const [a, b, op] = values, ca = cents(a), cb = cents(b);
  const dp = Math.max(placesOf(ca), placesOf(cb)), result = op === 1 ? ca + cb : ca - cb;
  const w = work(ca, cb, op);
  if (w.out.join('') !== digitsOf(result).join('')) throw new Error('The column method disagrees with the answer.');
  const sym = op === 1 ? '+' : '−';
  const annexed = [[ca, 'first'], [cb, 'second']].filter(([c]) => placesOf(c) < dp);
  const annexNote = annexed.length
    ? annexed.map(([c]) => `${show(c, placesOf(c))} gets ${dp - placesOf(c)} annexed ${plural(dp - placesOf(c), 'zero', 'zeros')}: ${show(c, dp)}`).join('; ') + `, so both numbers have ${dp} decimal ${plural(dp, 'place', 'places')}.`
    : dp === 0 ? 'Both numbers are whole numbers, so there are no decimal places to match.' : `Both numbers already have ${dp} decimal ${plural(dp, 'place', 'places')}, so no zero is annexed.`;
  const moveNote = `${op === 1 ? 'Add' : 'Subtract'} one column at a time from the right${w.regroups ? `, regrouping ${w.regroups} ${plural(w.regroups, 'time', 'times')}` : '; no regrouping is needed'}.`;
  return {
    value: result / 100, label: 'Answer', unit: '',
    equation: `${show(ca, dp)} ${sym} ${show(cb, dp)} = ${show(result, dp)}`,
    note: `${annexNote} ${moveNote}`,
    dp, ca, cb, cr: result, op, work: w, annexed: annexed.map(([c]) => c),
  };
}

const cell = (x, y, body, { size = 30, fill = INK, attrs = '', weight = 700 } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" style="fill:${fill};font-weight:${weight}" ${attrs}>${body}</text>`;
const small = (t, x, y, anchor, fill = INK) => text(x, y, t, anchor).replace('<text', `<text font-size="14" style="fill:${fill}"`);

function row(name, cells, y) {
  let out = '';
  cells.forEach((c, j) => {
    if (c.kind === 'blank') return;
    if (c.kind === 'annex')
      out += `<rect x="${COL_X[j] - 26}" y="${y - 34}" width="52" height="46" rx="4" style="fill:#fff;stroke:${RUST};stroke-width:2;stroke-dasharray:5 4"/>`
        + cell(COL_X[j], y, '0', { fill: MUTED, weight: 400, attrs: `data-row="${name}" data-col="${j}" data-kind="annex"` });
    else out += cell(COL_X[j], y, c.digit, { attrs: `data-row="${name}" data-col="${j}" data-kind="digit"` });
  });
  return out + `<circle cx="${POINT_X}" cy="${y - 3}" r="4" style="fill:${INK}"/>`;
}

function visual(values, r) {
  const { dp, ca, cb, cr, op, work: w } = r;
  const topCells = cellsOf(ca, dp), botCells = cellsOf(cb, dp), resCells = cellsOf(cr, dp, dp);
  let out = small('Line up the decimal points', POINT_X, 22, 'middle');
  COL_X.forEach((x, j) => {
    out += `<rect x="${x - 40}" y="${TOP}" width="80" height="${BOTTOM - TOP}" rx="4" style="fill:${BAND};stroke:#cedce5;stroke-width:1.5"/>`;
    out += small(PLACES[j], x, 46, 'middle') + small(WORTH[j], x, 66, 'middle', MUTED);
  });
  out += `<line x1="${POINT_X}" y1="${TOP}" x2="${POINT_X}" y2="${BOTTOM}" style="stroke:#47728c;stroke-width:1.5;stroke-dasharray:5 4"/>`;
  out += small('regroup', 122, ROW.regroup - 2, 'end') + small('first number', 122, ROW.top - 4, 'end')
    + small('second number', 122, ROW.bottom - 4, 'end') + small('answer', 122, ROW.result - 4, 'end');
  out += row('top', topCells, ROW.top) + row('bottom', botCells, ROW.bottom);
  out += cell(136, ROW.bottom, op === 1 ? '+' : '−', { size: 32, attrs: 'data-row="operator"' });
  out += `<line x1="150" y1="222" x2="598" y2="222" style="stroke:${INK};stroke-width:3"/>`;
  out += row('result', resCells, ROW.result);
  // regrouping: carries for addition, adjusted top digits (with the old digit struck) for subtraction
  w.marks.forEach((m, j) => {
    if (m === null) return;
    out += cell(COL_X[j], ROW.regroup, m, { size: 20, fill: RUST, attrs: `data-row="${op === 1 ? 'carry' : 'adjust'}" data-col="${j}"` });
    if (op === 2) out += `<line x1="${COL_X[j] - 13}" y1="${ROW.top - 2}" x2="${COL_X[j] + 13}" y2="${ROW.top - 24}" data-row="strike" data-col="${j}" style="stroke:${RUST};stroke-width:2"/>`;
  });
  r.annexed.forEach((c) => {
    const k = dp - placesOf(c);
    out += small(`annexed ${plural(k, 'zero', 'zeros')}`, 606, (c === ca ? ROW.top : ROW.bottom) - 2, 'start', RUST);
  });
  const annexLine = r.annexed.length
    ? `${show(r.annexed[0], placesOf(r.annexed[0]))} has ${placesOf(r.annexed[0])} decimal ${plural(placesOf(r.annexed[0]), 'place', 'places')}; annex ${dp - placesOf(r.annexed[0])} ${plural(dp - placesOf(r.annexed[0]), 'zero', 'zeros')}: ${show(r.annexed[0], dp)}.`
    : dp === 0 ? 'Both numbers are whole numbers: no zeros to annex.' : `Both numbers have ${dp} decimal ${plural(dp, 'place', 'places')}: no zeros to annex.`;
  out += text(360, 330, annexLine);
  out += text(360, 354, `${op === 1 ? 'Add' : 'Subtract'} one column at a time, starting at the right.`);
  out += text(360, 378, w.regroups ? `Regrouped ${w.regroups} ${plural(w.regroups, 'time', 'times')}: see the small digits in the regroup row.` : 'No regrouping was needed.');
  out += text(360, 402, 'Bring the decimal point straight down into the answer.');
  return out;
}

/**
 * Mission round: one number is unlocked and the student plans it by working backward with the opposite operation. The operation
 * alternates; every third round unlocks the first number instead of the second. Each unlocked setting solves its target exactly once.
 */
function round(model, round, level) {
  const op = (round + level) % 2 === 0 ? 1 : 2;
  const secondOf = (k) => 5 * (1 + (((k % 199) + 199) % 199)); // 0.05 .. 9.95 in hundredths
  const firstOf = (k) => 1000 + 5 * (((k % 3801) + 3801) % 3801); // 10 .. 200 in hundredths
  if (round % 3 === 2) {
    const second = secondOf(round * 41 + level * 19 + 3), goal = firstOf(round * 811 + level * 377 + 5);
    let start = firstOf(round * 613 + level * 211 + 1500);
    if (start === goal) start = firstOf(round * 613 + level * 211 + 1501);
    return { base: [start / 100, second / 100, op], goal: [goal / 100, second / 100, op], free: 0 };
  }
  // the fixed first number: tenths only on level 0 (so a second number with hundredths makes it annex a zero), hundredths later, 100+ on level 2
  const whole = level === 2 ? 100 + (round * 13 + level * 31) % 99 : 12 + (round * 17 + level * 29) % 80;
  const frac = level === 0 ? (1 + (round * 3) % 9) * 10 : 5 * (1 + (round * 7 + level * 3) % 18);
  const first = (whole * 100 + frac) / 100, goal = secondOf(round * 29 + level * 53 + 11);
  let start = secondOf(round * 61 + level * 17 + 97);
  if (start === goal) start = secondOf(round * 61 + level * 17 + 98);
  return { base: [first, start / 100, op], goal: [first, goal / 100, op], free: 1 };
}

export default {
  kind: 'decimal',
  mode: 'columns',
  values: [46.8, 3.75, 1],
  controls: () => [
    { label: 'First number', labelEs: 'Primer número', ...FIRST },
    { label: 'Second number', labelEs: 'Segundo número', ...SECOND },
    { label: 'Operation (1 = add, 2 = subtract)', labelEs: 'Operación (1 = sumar, 2 = restar)', min: 1, max: 2, step: 1 },
  ],
  evaluate,
  visual,
  viewBox: '0 0 720 420',
  guidance: [
    'The two numbers sit in place-value columns with their decimal points lined up. A zero is annexed (dashed outline) so both have the same number of decimal places, and the answer is written under the line.',
    'Change the second number and watch which columns regroup. The first number is always larger, so a difference is never negative.',
  ],
  free: 1,
  round,
};
