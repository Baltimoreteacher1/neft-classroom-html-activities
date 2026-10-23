// ratio:patterns - Two paint mixtures as patterned unit bars (3-5, "Compare Ratios").
// Same controls and readout as ratio:compare (color cups, white cups; readout = color per cup of white = a / b), so the 3-5 bench goals stay
// valid. The picture never mixes colours: color paint is a SOLID bar, white paint is a STRIPED bar, and each bar is labelled in words, so a
// student who cannot tell two colours apart reads the same picture. Below your mix sits the fixed reference mix 3 : 5, drawn the same way.
import { esc, line } from './draw.mjs';
import { control, fmt, gcd } from './util.mjs';

const X0 = 40, W = 520, REF = [3, 5];
const t = (x, y, s, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="14">${esc(s)}</text>`;
const cups = (n) => (n === 1 ? 'cup' : 'cups');
const solid = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#17344b" stroke="#17344b" stroke-width="1.5" rx="3"/>`;
const striped = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#rp-hatch)" stroke="#17344b" stroke-width="1.5" rx="3"/>`;

function check([a, b]) {
  for (const n of [a, b]) if (!Number.isInteger(n) || n < 1 || n > 12) throw new Error('Color and white must be whole cups from 1 to 12.');
}

export default {
  kind: 'ratio',
  mode: 'patterns',
  values: [4, 12],
  controls: () => [
    { ...control('Color paint (cups)', 1, 12), labelEs: 'Pintura de color (tazas)' },
    { ...control('White paint (cups)', 1, 12), labelEs: 'Pintura blanca (tazas)' },
  ],
  viewBox: '0 0 600 326',
  evaluate: (model, values) => {
    check(values);
    const [a, b] = values, g = gcd(a, b), value = a / b;
    const note = `Your mix has ${a} ${cups(a)} of color for ${b} ${cups(b)} of white. The reference mix has ${REF[0]} cups of color for ${REF[1]} cups of white, which is 0.6 cups of color for each cup of white.`;
    return { value, label: 'Color per cup of white', unit: 'cups per cup', equation: `${a}:${b} = ${a / g}:${b / g}`, note };
  },
  visual: (values) => {
    const [a, b] = values;
    let body = '<defs><pattern id="rp-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#17344b" stroke-width="3"/></pattern></defs>';
    const bar = (n, y, draw, scale) => {
      const w = Math.min(34, (W - 10) / Math.max(n, scale));
      let s = '';
      for (let i = 0; i < n; i++) s += draw(X0 + i * (w + 3), y, w, 30);
      return s;
    };
    const scale = Math.max(a, b, REF[0], REF[1]);
    body += t(40, 24, `Your mix: ${a} ${cups(a)} of color, ${b} ${cups(b)} of white`, 'start');
    body += t(40, 54, 'Color (solid bars)', 'start') + bar(a, 62, solid, scale);
    body += t(40, 116, 'White (striped bars)', 'start') + bar(b, 124, striped, scale);
    body += line(30, 172, 570, 172, 'gridline');
    body += t(40, 196, `Reference mix: ${REF[0]} cups of color, ${REF[1]} cups of white`, 'start');
    body += t(40, 224, 'Color', 'start') + bar(REF[0], 230, solid, scale);
    body += t(40, 276, 'White', 'start') + bar(REF[1], 282, striped, scale);
    return body;
  },
  guidance: [
    'Solid bars are color paint and striped bars are white paint. Each bar is one cup. The reference mix below uses the same bars.',
    'Change the color or the white, then compare how much color there is for the same amount of white in both mixes.',
  ],
};
