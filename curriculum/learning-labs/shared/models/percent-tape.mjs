// percent:tape - Tape diagram over a double number line for the percent of a whole, Part = Percent x Whole with the percent as a decimal (4-4).
// Controls and readout match percent:discount (Percent 0-100, Whole amount 1-120, readout = percent/100 x whole).
import { fmt } from './util.mjs';
import { line, text, rect } from './draw.mjs';

const L = 96, W = 464;                          // the tape and both number lines share one scale: percent 0 at x = L, percent 100 at x = L + W
const x = (p) => L + p * W / 100;
const TAPE_Y = 50, TAPE_H = 40, AMOUNT_Y = 176, PERCENT_Y = 228;

export default {
  kind: 'percent',
  mode: 'tape',
  values: [45, 90],
  controls: () => [
    { label: 'Percent', labelEs: 'Porcentaje', min: 0, max: 100, step: 1 },
    { label: 'Whole amount', labelEs: 'Cantidad total', min: 1, max: 120, step: 1 },
  ],
  evaluate: (model, values) => {
    const [p, w] = values;
    if (!(p >= 0 && p <= 100) || !(w >= 1 && w <= 120)) throw new Error('Percent must be 0 to 100 and the whole amount 1 to 120.');
    const value = p * w / 100, dec = fmt(p / 100);
    return { value, label: 'Part', unit: '', equation: `${dec} × ${fmt(w)} = ${fmt(value)}`,
      note: `${p}% as a decimal is ${dec}. Multiply the decimal by the whole to find the part: ${fmt(value)} of ${fmt(w)}.`, decimal: p / 100 };
  },
  visual: (values, result) => {
    const [p, w] = values;
    const part = fmt(result.value), dec = fmt(result.decimal);
    let b = text(6, TAPE_Y + TAPE_H / 2 + 5, 'Tape', 'start') + text(6, AMOUNT_Y + 5, 'Amount', 'start') + text(6, PERCENT_Y + 5, 'Percent', 'start');
    // the whole: one bar cut into ten equal tenths, the shaded stretch is the percent
    b += text(L + W / 2, 22, `Whole (base): ${fmt(w)} = 100%`);
    b += line(L, 32, L + W, 32) + line(L, 28, L, 36) + line(L + W, 28, L + W, 36);
    b += rect(L, TAPE_Y, W, TAPE_H, 'shape-light');
    if (p > 0) b += rect(L, TAPE_Y, W * p / 100, TAPE_H, 'shape');
    for (let t = 10; t < 100; t += 10) b += line(x(t), TAPE_Y, x(t), TAPE_Y + TAPE_H);
    // the part, bracketed under the shaded stretch; its label sits clear of the dashed link down toward the number lines
    if (p > 0) b += line(L, TAPE_Y + TAPE_H + 10, x(p), TAPE_Y + TAPE_H + 10, 'heavy');
    const partLabel = `Part: ${part} (${p}%)`;
    b += p < 50 ? text(x(p) + 10, TAPE_Y + TAPE_H + 32, partLabel, 'start') : text(x(p) - 10, TAPE_Y + TAPE_H + 32, partLabel, 'end');
    b += line(x(p), TAPE_Y + TAPE_H, x(p), AMOUNT_Y - 36, 'dashed');
    // the double number line under the tape: amount above, percent below, ticks at every tenth
    b += line(L, AMOUNT_Y, L + W, AMOUNT_Y) + line(L, PERCENT_Y, L + W, PERCENT_Y);
    for (let t = 0; t <= 100; t += 10) {
      b += line(x(t), AMOUNT_Y - 7, x(t), AMOUNT_Y + 7) + line(x(t), PERCENT_Y - 7, x(t), PERCENT_Y + 7);
      b += text(x(t), AMOUNT_Y - 14, fmt(t * w / 100)) + text(x(t), PERCENT_Y + 28, `${t}%`);
    }
    b += `<circle cx="${x(p)}" cy="${AMOUNT_Y}" r="7" class="point"/><circle cx="${x(p)}" cy="${PERCENT_Y}" r="7" class="point"/>`;
    b += line(x(p), AMOUNT_Y, x(p), PERCENT_Y, 'solution');
    // the equation, with the percent written as a decimal
    b += text(L + W / 2, 288, 'Part = Percent × Whole');
    b += text(L + W / 2, 314, `${p}% = ${dec}, so ${dec} × ${fmt(w)} = ${part}`);
    return b;
  },
  viewBox: '0 0 600 330',
  guidance: [
    'The tape is the whole, cut into ten equal tenths, and the shaded part is the percent. The double number line under it lines the amount up with the percent.',
    'Write the percent as a decimal, multiply it by the whole, and check that the shaded part matches the number the readout shows.',
  ],
};
