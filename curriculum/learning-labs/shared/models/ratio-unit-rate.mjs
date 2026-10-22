// ratio:unit-rate - Unit rate as equal groups and as a double number line (3-2, "Understand Rates and Unit Rates").
// Same controls and readout as ratio:mixer (juice cups, water cups; readout = juice per cup of water = a / b), so the 3-2 bench stays valid.
// The picture: b equal groups, one per cup of water, each with a / b cups of juice; below, a double number line whose matching ticks
// pair every whole cup of water with the juice that goes with it, and the first unit (0 to 1 cup of water) marked heavy.
import { esc, line, rect } from './draw.mjs';
import { control, fmt, gcd } from './util.mjs';

const X0 = 70, X1 = 580, W = X1 - X0;
const CHAR = 8.4; // average width of one bold 14px character, used only to thin tick labels

/** One label in 14px bold, anchored; `extra` carries any further attribute. */
const t = (x, y, s, anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="14"${extra}>${esc(s)}</text>`;

/** p/q as a short decimal: exact when it ends within 2 places, otherwise rounded to 2 places and marked with the approx sign. */
function amount(p, q) {
  const g = gcd(p, q), n = p / g, d = q / g;
  let rest = d;
  while (rest % 2 === 0) rest /= 2;
  while (rest % 5 === 0) rest /= 5;
  const twoPlaces = rest === 1 && (n * 100) % d === 0;
  const rounded = Number((n / d).toFixed(2));
  return { text: twoPlaces ? String(rounded) : `≈${rounded}`, exact: twoPlaces };
}
const cups = (text) => (text === '1' ? 'cup' : 'cups');

function check([a, b]) {
  for (const n of [a, b]) if (!Number.isInteger(n) || n < 1 || n > 12) throw new Error('Juice and water must be whole cups from 1 to 12.');
}

export default {
  kind: 'ratio',
  mode: 'unit-rate',
  values: [5, 4],
  controls: () => [
    { ...control('Juice (cups)', 1, 12), labelEs: 'Jugo (tazas)' },
    { ...control('Water (cups)', 1, 12), labelEs: 'Agua (tazas)' },
  ],
  viewBox: '0 0 600 330',
  evaluate: (model, values) => {
    check(values);
    const [a, b] = values, g = gcd(a, b), value = a / b;
    const per = amount(a, b);
    let equation;
    if (a % b === 0) equation = `${a} ÷ ${b} = ${value}`;
    else if (per.exact || Number.isInteger(value * 1000)) equation = `${a} ÷ ${b} = ${fmt(value)}`;
    else equation = `${a} ÷ ${b} = ${a / g}/${b / g} ≈ ${Number(value.toFixed(2))}`;
    const note = `${a} ${cups(String(a))} of juice for ${b} ${cups(String(b))} of water: 1 cup of water goes with ${per.text} ${cups(per.text)} of juice. That is the unit rate.`;
    return { value, label: 'Juice per cup of water', unit: 'cups per cup', equation, note, per: per.text };
  },
  visual: (values) => {
    const [a, b] = values, per = amount(a, b);
    const unit = `${per.text} ${cups(per.text)}`;
    let body = t(300, 22, `${b} equal ${b === 1 ? 'group' : 'groups'}, one for each cup of water`);
    body += t(8, 66, 'Juice', 'start') + t(8, 97, 'Water', 'start');
    const bw = W / b;
    for (let i = 0; i < b; i++) {
      const x = X0 + i * bw + 1.5;
      body += rect(x, 44, bw - 3, 34, 'shape') + rect(x, 80, bw - 3, 24, 'shape-alt');
      if (bw >= 53) body += t(x + (bw - 3) / 2, 66, per.text);
      body += t(x + (bw - 3) / 2, 97, '1');
    }
    body += t(300, 128, `Each group: 1 cup of water, ${unit} of juice`);

    // double number line: the juice line holds 0 to a, the water line 0 to b, tick k of one matches tick k of the other
    body += t(300, 168, 'Double number line: matching marks for each cup of water');
    const JY = 216, WY = 274;
    body += t(8, JY + 5, 'Juice', 'start') + t(8, WY + 5, 'Water', 'start');
    body += line(X0, JY, X1, JY) + line(X0, WY, X1, WY);
    const labels = Array.from({ length: b + 1 }, (_, k) => amount(k * a, b).text);
    const widest = Math.max(...labels.map((s) => s.length)) * CHAR + 10;
    const stride = Math.max(1, Math.ceil(widest / bw));
    const shown = (k) => k === 0 || k === b || (k % stride === 0 && b - k >= stride * 0.6);
    for (let k = 0; k <= b; k++) {
      const x = X0 + k * bw;
      body += line(x, JY - 6, x, JY + 6) + line(x, WY - 6, x, WY + 6);
      body += line(x, JY + 6, x, WY - 6, k === 1 ? 'heavy' : 'gridline');
      if (shown(k)) body += t(x, JY - 12, labels[k]) + t(x, WY + 24, String(k));
    }
    body += line(X0, JY, X0 + bw, JY, 'solution') + line(X0, WY, X0 + bw, WY, 'solution');
    body += `<circle cx="${X0 + bw}" cy="${JY}" r="6" class="point"/><circle cx="${X0 + bw}" cy="${WY}" r="6" class="point"/>`;
    body += t(300, 322, `Thick part: 1 cup of water goes with ${unit} of juice`);
    return body;
  },
  guidance: [
    'The groups show the water cups, one cup each, with the same juice in every group. The double number line matches each cup of water to its juice.',
    'Change the juice or the water, then look at the thick part of the line: that is the juice for exactly 1 cup of water.',
  ],
};
