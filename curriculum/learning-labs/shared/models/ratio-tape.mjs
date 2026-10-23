// ratio:tape - One tape for a two-part mixture: part to part and part to whole (3-1, "Understand Ratios").
// Same controls as ratio:mixer (juice cups, water cups) so the bench keeps its values. The readout is the WHOLE drink (juice + water),
// because lesson 3-1 only needs ratios: juice to water (part to part) and juice to the whole drink (part to whole). Dividing a by b
// into a unit rate is lesson 3-2 and is NOT shown here.
// The picture: one tape of single-cup boxes, solid for juice and hatched for water (shape, not colour, tells them apart), brackets
// under it for each part and for the whole, and the three ratios written with colons.
import { esc, line, rect } from './draw.mjs';
import { control } from './util.mjs';

const X0 = 40, W = 520;
const t = (x, y, s, anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="14"${extra}>${esc(s)}</text>`;
const cups = (n) => (n === 1 ? 'cup' : 'cups');

/** A bracket under a span of the tape: a line with two short ticks. */
const bracket = (x1, x2, y) => line(x1, y, x2, y, 'heavy') + line(x1, y - 6, x1, y, 'heavy') + line(x2, y - 6, x2, y, 'heavy');

function check([a, b]) {
  for (const n of [a, b]) if (!Number.isInteger(n) || n < 1 || n > 12) throw new Error('Juice and water must be whole cups from 1 to 12.');
}

export default {
  kind: 'ratio',
  mode: 'tape',
  values: [6, 3],
  controls: () => [
    { ...control('Juice (cups)', 1, 12), labelEs: 'Jugo (tazas)' },
    { ...control('Water (cups)', 1, 12), labelEs: 'Agua (tazas)' },
  ],
  viewBox: '0 0 600 300',
  evaluate: (model, values) => {
    check(values);
    const [a, b] = values, whole = a + b;
    const equation = `${a} + ${b} = ${whole}`;
    const note = `Juice to water is ${a} : ${b} (part to part). Juice to the whole drink is ${a} : ${whole} (part to whole).`;
    return { value: whole, label: 'Cups in the whole drink', unit: 'cups', equation, note };
  },
  visual: (values) => {
    const [a, b] = values, whole = a + b, bw = W / whole;
    let body = '<defs><pattern id="rt-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#17344b" stroke-width="3"/></pattern></defs>';
    body += t(300, 22, 'One tape: every box is 1 cup');
    for (let i = 0; i < whole; i++) {
      const x = X0 + i * bw + 1;
      body += i < a ? rect(x, 36, bw - 2, 36, 'shape') : `<rect x="${x}" y="36" width="${bw - 2}" height="36" fill="url(#rt-hatch)" stroke="#17344b" stroke-width="1.5" rx="3"/>`;
    }
    const mid = X0 + a * bw;
    body += bracket(X0 + 1, mid - 1, 86) + t((X0 + mid) / 2, 108, `Juice: ${a} ${cups(a)}`);
    body += bracket(mid + 1, X0 + W - 1, 86) + t((mid + X0 + W) / 2, 108, `Water: ${b} ${cups(b)}`);
    body += bracket(X0 + 1, X0 + W - 1, 124) + t(300, 146, `Whole drink: ${whole} ${cups(whole)}`);
    body += t(300, 186, `Juice to water: ${a} : ${b}`) + t(300, 208, `Juice to whole drink: ${a} : ${whole}`) + t(300, 230, `Water to whole drink: ${b} : ${whole}`);
    body += t(300, 254, 'Part to whole puts the whole drink second.');
    body += rect(150, 270, 22, 16, 'shape') + t(180, 283, 'juice', 'start') + `<rect x="300" y="270" width="22" height="16" fill="url(#rt-hatch)" stroke="#17344b" stroke-width="1.5" rx="3"/>` + t(330, 283, 'water', 'start');
    return body;
  },
  guidance: [
    'The tape shows one box for every cup. Juice boxes are solid and water boxes are striped. The three lines under it write the ratios with colons.',
    'Change the juice or the water, then compare the ratio that ends in the water with the ratio that ends in the whole drink.',
  ],
};
