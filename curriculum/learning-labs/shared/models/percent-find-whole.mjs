// percent:find-whole - Whole from a part and its percent (4-5): the known part sits under its percent on a double number line, a step down
// to 10% (or to 1%) is shown, and counting up to 100% reveals the whole. Whole = Part ÷ Percent with the percent as a decimal.
// Controls and readout match percent:whole (Percent 1-100, Known part 1-120, readout = part ÷ (percent/100)).
import { fmt } from './util.mjs';
import { line, esc } from './draw.mjs';

const L = 96, W = 464;                          // percent 0 sits at x = L, percent 100 at x = L + W
const x = (p) => L + p * W / 100;
const PERCENT_Y = 84, AMOUNT_Y = 162, ROW = 22;
const exact = (n) => Math.abs(n * 10000 - Math.round(n * 10000)) < 1e-6;   // fmt() prints four decimals
const eq = (n) => (exact(n) ? '=' : '≈');
const label = (cx, y, t, anchor = 'middle') => `<text x="${cx}" y="${y}" text-anchor="${anchor}" style="paint-order:stroke;stroke:#fff;stroke-width:6px;stroke-linejoin:round">${esc(t)}</text>`;

/** The size of one step on the way up: 10% when the percent is a multiple of 10, otherwise 1%. */
const stepOf = (p) => (p % 10 === 0 ? 10 : 1);

/** Put labels on rows so none overlap: higher priority first on the row nearest the line; the 0 label is left out when it collides. */
function stack(items, rowY, leaderFrom) {
  const rows = [[], [], []];
  let leaders = '', out = '';
  for (const it of [...items].sort((a, b) => a.prio - b.prio)) {
    const w = it.t.length * 9 + 8;
    const left = Math.min(Math.max(it.cx - w / 2, 4), 596 - w);
    const r = rows.findIndex((row) => row.every(([a, b]) => left + w < a || left > b));
    if (it.drop && r !== 0) continue;
    const at = r < 0 ? rows.length - 1 : r;
    rows[at].push([left, left + w]);
    if (at > 0) leaders += line(it.cx, leaderFrom, it.cx, rowY(at) - (rowY(1) > rowY(0) ? 15 : -4), 'gridline');
    out += label(left + w / 2, rowY(at), it.t);
  }
  return leaders + out;
}

export default {
  kind: 'percent',
  mode: 'find-whole',
  values: [25, 18],
  controls: () => [
    { label: 'Percent', labelEs: 'Porcentaje', min: 1, max: 100, step: 1 },
    { label: 'Known part', labelEs: 'Parte conocida', min: 1, max: 120, step: 1 },
  ],
  evaluate: (model, values) => {
    const [p, part] = values;
    if (!(p >= 1 && p <= 100) || !(part >= 1 && part <= 120)) throw new Error('Percent must be 1 to 100 and the known part 1 to 120.');
    const whole = part * 100 / p, dec = fmt(p / 100);
    const check = exact(whole) ? ` Check: ${fmt(whole)} × ${dec} = ${part}.` : ' The whole does not come out even, so it is rounded.';
    return { value: whole, label: 'Recovered whole', unit: '', equation: `${part} ÷ ${dec} ${eq(whole)} ${fmt(whole)}`,
      note: `${p}% of the whole is ${part}.${check}`, decimal: p / 100 };
  },
  visual: (values, result) => {
    const [p, part] = values;
    const whole = result.value, dec = fmt(result.decimal);
    const u = stepOf(p), k = u === 10 ? p / 10 : p, unit = part / k;
    let b = label(6, PERCENT_Y + 5, 'Percent', 'start') + label(6, AMOUNT_Y + 5, 'Amount', 'start');
    // the double number line: percent above, amount below; the marks are the steps of 10% (or 1%)
    b += line(L, PERCENT_Y, L + W, PERCENT_Y) + line(L, AMOUNT_Y, L + W, AMOUNT_Y);
    for (let t = 0; t <= 100; t += u) b += line(x(t), PERCENT_Y - 4, x(t), PERCENT_Y + 4, 'gridline') + line(x(t), AMOUNT_Y - 4, x(t), AMOUNT_Y + 4, 'gridline');
    // from 0 to the known part (dark), and the first step of 10% or 1% (accent) on both lines
    b += line(x(0), PERCENT_Y, x(p), PERCENT_Y, 'heavy') + line(x(0), AMOUNT_Y, x(p), AMOUNT_Y, 'heavy');
    b += line(x(0), PERCENT_Y, x(u), PERCENT_Y, 'solution') + line(x(0), AMOUNT_Y, x(u), AMOUNT_Y, 'solution');
    for (const t of new Set([0, p, 100])) b += line(x(t), PERCENT_Y - 9, x(t), PERCENT_Y + 9) + line(x(t), AMOUNT_Y - 9, x(t), AMOUNT_Y + 9);
    // dashed links: the known part under its percent, and the whole under 100%
    for (const t of new Set([p, 100, ...(u === 10 ? [10] : [])])) b += line(x(t), PERCENT_Y, x(t), AMOUNT_Y, 'dashed');
    for (const y of [PERCENT_Y, AMOUNT_Y]) {
      b += `<circle cx="${x(p)}" cy="${y}" r="7" class="point"/>`;
      if (p !== u) b += `<circle cx="${x(u)}" cy="${y}" r="6" class="point-alt"/>`;
      if (p !== 100) b += `<circle cx="${x(100)}" cy="${y}" r="9" class="open-point"/>`;
    }
    const pct = [{ cx: x(p), t: p === 100 ? '100%' : `${p}%`, prio: 1 }, { cx: x(0), t: '0%', prio: 9, drop: true }];
    if (p !== 100) pct.push({ cx: x(100), t: '100%', prio: 2 });
    if (p !== u) pct.push({ cx: x(u), t: `${u}%`, prio: 3 });
    const amt = [{ cx: x(p), t: p === 100 ? `part = whole ${fmt(part)}` : `part ${fmt(part)}`, prio: 1 }, { cx: x(0), t: '0', prio: 9, drop: true }];
    if (p !== 100) amt.push({ cx: x(100), t: `whole ${fmt(whole)}`, prio: 2 });
    if (p !== u) amt.push({ cx: x(u), t: `${u}% = ${fmt(unit)}`, prio: 3 });
    b += stack(pct, (r) => PERCENT_Y - 20 - r * ROW, PERCENT_Y - 10) + stack(amt, (r) => AMOUNT_Y + 30 + r * ROW, AMOUNT_Y + 10);
    // the two moves, then the equation with the percent as a decimal
    b += label(L, 268, p === u ? `Step down: the known part is already ${u}%, so ${u}% is ${fmt(part)}`
      : `Step down: ${p}% is ${fmt(part)}, so ${u}% is ${fmt(part)} ÷ ${k} ${eq(unit)} ${fmt(unit)}`, 'start');
    // an unrounded step is not printed as a rounded number times 100: the sum shows the part and the divisor instead
    const sum = exact(unit) ? `${100 / u} × ${fmt(unit)}` : `${100 / u} × ${fmt(part)} ÷ ${k}`;
    b += label(L, 292, `Count up: 100% is ${100 / u} jumps of ${u}%, so ${sum} ${eq(whole)} ${fmt(whole)}`, 'start');
    b += label(300, 326, 'Whole = Part ÷ Percent') + label(300, 352, `${fmt(part)} ÷ ${dec} ${eq(whole)} ${fmt(whole)}   (${p}% = ${dec})`);
    return b;
  },
  viewBox: '0 0 600 370',
  guidance: [
    'The known part sits under its percent on a double number line. Step down to 10% (or 1%), then count up to 100%: the amount under 100% is the whole.',
    'Keep the part and raise the percent: the whole shrinks, because the same part is a bigger share of it.',
  ],
};
