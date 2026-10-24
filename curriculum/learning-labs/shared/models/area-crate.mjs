// area:crate - A crate with edges in quarters of a unit; base area then volume (lesson 5-10: volume with fractional edges). Products are printed as exact fractions (3/4 × 3/4 = 9/16).
// Three controls: length, width, height, each from ½ to 4 (or 3) in steps of ¼. The picture shows the base with quarter marks,
// the height as stacked layers, and the multiplication with mixed numbers, so a fractional edge is never rounded away.
import { control } from './util.mjs';
import { line, text } from './draw.mjs';

const LEN = [0.5, 4], WID = [0.5, 3], HGT = [0.5, 3], STEP = 0.25;
const INK = '#17344b';
const n1 = (v) => Number(v.toFixed(1));
/** Exact mixed number for any multiple of 1/64: 1.5 -> "1 1/2", 0.75 -> "3/4", 0.5625 -> "9/16", 2 -> "2". */
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const frac = (v) => {
  const n = Math.round(v * 64), g = gcd(n, 64) || 64, top = n / g, bottom = 64 / g;
  const whole = Math.floor(top / bottom), r = top - whole * bottom;
  if (!r) return String(whole);
  return whole ? `${whole} ${r}/${bottom}` : `${r}/${bottom}`;
};
const onQuarter = (v) => Math.abs(v * 4 - Math.round(v * 4)) < 1e-9;

function check(values) {
  const [l, w, h] = values;
  const ranges = [['length', LEN], ['width', WID], ['height', HGT]];
  values.forEach((v, i) => {
    const [name, [lo, hi]] = ranges[i];
    if (!(v >= lo && v <= hi && onQuarter(v))) throw new Error(`Choose a ${name} from ${frac(lo)} to ${frac(hi)} in steps of 1/4.`);
  });
  return { l, w, h };
}

export default {
  kind: 'area',
  mode: 'crate',
  values: [1.5, 1, 2],
  free: 2,
  controls: () => [
    { ...control('Length', LEN[0], LEN[1], STEP), labelEs: 'Largo' },
    { ...control('Width', WID[0], WID[1], STEP), labelEs: 'Ancho' },
    { ...control('Height', HGT[0], HGT[1], STEP), labelEs: 'Alto' },
  ],
  evaluate: (model, values) => {
    const { l, w, h } = check(values);
    const base = l * w, value = base * h;
    return {
      value, label: 'Volume', unit: 'cubic units',
      equation: `${frac(l)} × ${frac(w)} × ${frac(h)} = ${frac(value)}`,
      note: 'The base area is length × width. The height tells how many layers of that base the crate holds.',
      base,
    };
  },
  visual: (values, result) => {
    const [l, w, h] = values;
    // base: a top view with a mark every quarter; height: a column of layers, one line per quarter
    const sb = 64, sh = 60, x0 = 36, y0 = 76, hx = 440, hy = 300;
    let body = text(x0, 38, `Base: ${frac(l)} × ${frac(w)} = ${frac(result.base)}`, 'start');
    body += `<rect x="${x0}" y="${y0}" width="${n1(l * sb)}" height="${n1(w * sb)}" class="shape"/>`;
    for (let q = 1; q < l * 4; q++) body += line(n1(x0 + (q * sb) / 4), y0, n1(x0 + (q * sb) / 4), n1(y0 + w * sb), 'gridline');
    for (let q = 1; q < w * 4; q++) body += line(x0, n1(y0 + (q * sb) / 4), n1(x0 + l * sb), n1(y0 + (q * sb) / 4), 'gridline');
    body += text(n1(x0 + (l * sb) / 2), n1(y0 + w * sb + 22), `length ${frac(l)}`);
    body += text(n1(x0 + l * sb + 8), n1(y0 + (w * sb) / 2 + 5), `width ${frac(w)}`, 'start');
    body += text(hx, 38, 'Height: layers of the base', 'start');
    body += `<rect x="${hx}" y="${n1(hy - h * sh)}" width="64" height="${n1(h * sh)}" class="shape-alt"/>`;
    for (let q = 1; q < h * 4; q++) body += line(hx, n1(hy - (q * sh) / 4), hx + 64, n1(hy - (q * sh) / 4), 'gridline');
    body += text(hx + 74, n1(hy - (h * sh) / 2 + 5), `height ${frac(h)}`, 'start');
    body += text(300, 340, `volume = ${frac(result.base)} × ${frac(h)} = ${frac(result.value)}`);
    return body;
  },
  viewBox: '0 0 600 356',
  guidance: [
    'The crate has a base and a height. The small marks show quarters of a unit along each edge.',
    'Change one edge at a time. Multiply the base area by the height to see how much the crate holds.',
  ],
  // Mission rounds: the height is unlocked on a base of 1 1/2, 2 1/4 or 3 square units; every goal height is a half or whole, so the volume is a decimal a student can plan.
  round: (model, round, level) => {
    const bases = [[1.5, 1], [2, 1.5], [1, 3], [3, 1], [2.5, 1], [1.5, 2], [4, 0.5], [0.5, 3], [2, 2]];
    const [l, w] = bases[(round + 2 * level) % 9];
    const goalH = 0.5 * (1 + ((round * 2 + level * 3) % 6));
    const startH = goalH > 1.5 ? goalH - 1 : goalH + 1.5;
    return { base: [l, w, startH], goal: [l, w, goalH], free: 2 };
  },
};
