// factors:regroup - Reorder and regroup factors without changing the product (lesson 6-8: commutative, associative, identity properties).
// Three factors and a pair to group. Line 1 is the product as written, line 2 reorders so the pair sits together (commutative property),
// line 3 puts the pair in parentheses (associative property). Every line shows its value, and the value never changes.
import { control } from './util.mjs';
import { esc, svg } from './draw.mjs';

const INK = '#17344b';
const MAX = 25;
const WORDS = ['first', 'second', 'third'];
// pair 1 = first two, pair 2 = first and third, pair 3 = last two; `order` is the line-2 order (positions of the factors)
const PAIRS = {
  1: { pair: [0, 1], rest: 2, order: [0, 1, 2], at: 0 },
  2: { pair: [0, 2], rest: 1, order: [0, 2, 1], at: 0 },
  3: { pair: [1, 2], rest: 0, order: [0, 1, 2], at: 1 },
};
const num = (n) => n.toLocaleString('en-US');

function check(values) {
  const [a, b, c, p] = values;
  for (const v of [a, b, c]) if (!Number.isInteger(v) || v < 1 || v > MAX) throw new Error(`Choose whole-number factors from 1 to ${MAX}.`);
  if (![1, 2, 3].includes(p)) throw new Error('Choose pair 1, 2 or 3 to group.');
  const f = [a, b, c], g = PAIRS[p];
  const [x, y] = g.pair.map((i) => f[i]), rest = f[g.rest];
  return { f, g, p, x, y, rest, pairProduct: x * y, total: a * b * c };
}

/** Line 3 as text, e.g. "(4 × 25) × 17", and what follows its "=": "100 × 17". */
function grouped(m) {
  const tokens = m.g.order.map((i) => m.f[i]);
  const open = m.g.at;
  const parts = tokens.map((t, i) => (i === open ? `(${t}` : i === open + 1 ? `${t})` : String(t)));
  const after = m.g.at === 0 ? [m.pairProduct, m.rest] : [m.rest, m.pairProduct];
  return { text: parts.join(' × '), after: after.join(' × ') };
}

const label = (x, y, t, { anchor = 'middle', size = 15 } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" style="font-size:${size}px;fill:${INK}" stroke="#FFFFFF" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(t)}</text>`;

const TOKEN = { w: 56, h: 44, gap: 52, x0: 190 };
const tokenX = (i) => TOKEN.x0 + i * (TOKEN.w + TOKEN.gap);

function row(y, order, inPair, factors, brackets) {
  let s = '';
  order.forEach((idx, i) => {
    const x = tokenX(i);
    s += `<rect x="${x}" y="${y - 22}" width="${TOKEN.w}" height="${TOKEN.h}" rx="6" class="${inPair.includes(idx) ? 'shape' : 'shape-light'}"/>`;
    s += label(x + TOKEN.w / 2, y + 8, factors[idx], { size: 22 });
    s += label(x + TOKEN.w / 2, y + 38, WORDS[idx], { size: 13 });
    if (i < 2) s += label(x + TOKEN.w + 27, y + 7, '×', { size: 20 });
  });
  if (brackets !== null) {
    s += label(tokenX(brackets) - 9, y + 9, '(', { size: 28 });
    s += label(tokenX(brackets + 1) + TOKEN.w + 9, y + 9, ')', { size: 28 });
  }
  return s;
}

function visual(values, result) {
  const m = result.m, g = m.g;
  const pairIdx = g.pair, order = [0, 1, 2], reordered = g.order, same = reordered.every((v, i) => v === order[i]);
  const f = m.f, V = num(m.total), G = grouped(m);
  let body = label(492, 30, 'Value of each line', { anchor: 'start', size: 16 });
  const rows = [[72, 'As written', 'starting order'], [158, 'Reordered', same ? 'order unchanged' : 'commutative property'], [244, 'Regrouped', 'associative property']];
  rows.forEach(([y, title, sub]) => {
    body += label(14, y - 2, title, { anchor: 'start', size: 16 }) + label(14, y + 18, `(${sub})`, { anchor: 'start', size: 13 });
  });
  body += row(72, order, pairIdx, f, null) + label(492, 78, `= ${V}`, { anchor: 'start', size: 18 });
  body += row(158, reordered, pairIdx, f, null) + label(492, 164, `= ${V}`, { anchor: 'start', size: 18 });
  body += row(244, reordered, pairIdx, f, g.at) + label(492, 250, `= ${G.after} = ${V}`, { anchor: 'start', size: 18 });
  body += `<rect x="14" y="306" width="16" height="16" rx="3" class="shape"/>` + label(38, 319, 'the pair you group', { anchor: 'start', size: 14 });
  body += `<rect x="190" y="306" width="16" height="16" rx="3" class="shape-light"/>` + label(214, 319, 'the factor left out', { anchor: 'start', size: 14 });
  return svg(body, `${result.equation}. ${result.note}`, '0 0 680 330');
}

export default {
  kind: 'factors',
  mode: 'regroup',
  values: [5, 12, 8, 1],
  controls: () => [
    { ...control('First factor', 1, MAX), labelEs: 'Primer factor' },
    { ...control('Second factor', 1, MAX), labelEs: 'Segundo factor' },
    { ...control('Third factor', 1, MAX), labelEs: 'Tercer factor' },
    { ...control('Pair to group (1 = first two, 2 = first and third, 3 = last two)', 1, 3), labelEs: 'Par que se agrupa (1 = los dos primeros, 2 = el primero y el tercero, 3 = los dos últimos)' },
  ],
  evaluate: (model, values) => {
    const m = check(values), G = grouped(m);
    const friendly = m.pairProduct % 10 === 0, hasOne = m.f.includes(1);
    const first = friendly
      ? `${m.x} × ${m.y} = ${num(m.pairProduct)} is a friendly number, a multiple of 10, so the next step is easy.`
      : `${m.x} × ${m.y} = ${num(m.pairProduct)} is not a multiple of 10.`;
    return {
      value: m.pairProduct, label: 'Grouped pair', unit: '', m, friendly,
      equation: `${G.text} = ${G.after} = ${num(m.total)}`,
      note: `${first} ${hasOne ? 'A factor of 1 keeps every value the same (identity property).' : 'Reordering and regrouping keep the value the same.'}`,
    };
  },
  visual,
  viewBox: '0 0 680 330',
  guidance: [
    'The top line is your product as written. The next lines move the pair you choose together, put it in parentheses, and show that every line has the same value.',
    'Try each pair and look for two factors whose product is a friendly number like 10 or 100.',
  ],
  free: 0,
  // Mission rounds: one factor of the pair is unlocked; the other factor of the pair is fixed, so the target is found by division.
  round: (model, round, level) => {
    const FIXED_AND_GOAL = [
      [[2, 5], [5, 4], [3, 10], [5, 8], [10, 5], [5, 12], [10, 7], [5, 16], [10, 9]],
      [[5, 20], [25, 8], [20, 15], [25, 16], [10, 20], [25, 12], [20, 10], [25, 20], [25, 24]],
      [[4, 5], [6, 5], [15, 4], [8, 5], [20, 3], [12, 5], [25, 2], [16, 5], [15, 6]],
    ];
    const [fixed, goalValue] = FIXED_AND_GOAL[level % 3][round % 9];
    const p = (round + level) % 3 + 1, g = PAIRS[p];
    const freeIdx = g.pair[(round + level) % 2], fixedIdx = g.pair.find((i) => i !== freeIdx);
    const other = 3 + ((round + 2 * level) % 6);
    const base = [0, 0, 0, p], goal = [0, 0, 0, p];
    base[fixedIdx] = goal[fixedIdx] = fixed;
    base[g.rest] = goal[g.rest] = other;
    goal[freeIdx] = goalValue;
    base[freeIdx] = goalValue <= 12 ? goalValue + 4 : goalValue - 4;
    return { base, goal, free: freeIdx };
  },
};
