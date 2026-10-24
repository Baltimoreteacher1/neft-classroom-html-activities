// area:parallelogram - A parallelogram with its perpendicular height dashed and its slanted side labelled (lesson 5-1).
// Three controls: base, perpendicular height, and how far the top slides sideways. Sliding changes the slanted side and the
// picture, but never the area: area = base × height, and the slanted side is not the height.
import { control, fmt } from './util.mjs';
import { line, text } from './draw.mjs';

const BASE = [4, 12], HEIGHT = [2, 9], SLIDE = [0, 15];
const n1 = (v) => Number(v.toFixed(1));
const INK = '#17344b';

function check(values) {
  const [b, h, s] = values;
  if (!Number.isInteger(b) || b < BASE[0] || b > BASE[1]) throw new Error(`Choose a base from ${BASE[0]} to ${BASE[1]}.`);
  if (!Number.isInteger(h) || h < HEIGHT[0] || h > HEIGHT[1]) throw new Error(`Choose a perpendicular height from ${HEIGHT[0]} to ${HEIGHT[1]}.`);
  if (!Number.isInteger(s) || s < SLIDE[0] || s > SLIDE[1]) throw new Error(`Choose a slide from ${SLIDE[0]} to ${SLIDE[1]}.`);
}
/** The slanted side: from the bottom-right corner up to the top-right corner. */
const slant = (h, s) => Math.hypot(s, h);
const slantText = (h, s) => { const v = slant(h, s); return Number.isInteger(Number(v.toFixed(6))) ? String(Math.round(v)) : `about ${fmt(Number(v.toFixed(1)))}`; };

export default {
  kind: 'area',
  mode: 'parallelogram',
  values: [8, 3, 4],
  free: 1,
  controls: () => [
    { ...control('Base', BASE[0], BASE[1]), labelEs: 'Base' },
    { ...control('Perpendicular height', HEIGHT[0], HEIGHT[1]), labelEs: 'Altura perpendicular' },
    { ...control('Horizontal shift', SLIDE[0], SLIDE[1]), labelEs: 'Desplazamiento horizontal' },
  ],
  evaluate: (model, values) => {
    check(values);
    const [b, h, s] = values;
    return {
      value: b * h, label: 'Area', unit: 'square units',
      equation: `${b} × ${h} = ${b * h}`,
      note: 'The area uses the base and the perpendicular height. Sliding the top changes the slanted side, not the area.',
      slant: slant(h, s),
      slantedSide: slant(h, s),
    };
  },
  visual: (values) => {
    const [b, h, s] = values;
    // one scale for the whole picture: the widest figure is base 12 slid 15, and the label column sits to the right
    const sc = Math.min(400 / (BASE[1] + SLIDE[1]), 200 / HEIGHT[1]);
    const x0 = 40 + ((BASE[1] + SLIDE[1]) * sc - (b + s) * sc) / 2, yb = 250, yt = yb - h * sc;
    const P = (x, y) => `${n1(x0 + x * sc)},${n1(y)}`;
    let body = `<polygon points="${P(0, yb)} ${P(b, yb)} ${P(b + s, yt)} ${P(s, yt)}" class="shape"/>`;
    const foot = x0 + s * sc;
    if (s > b) body += line(n1(x0 + b * sc), yb, n1(foot), yb, 'dashed');     // the height lands past the end of the base
    body += line(n1(foot), n1(yt), n1(foot), yb, 'dashed');
    const m = Math.min(9, h * sc / 3);
    body += `<polyline points="${n1(foot)},${n1(yb - m)} ${n1(foot + m)},${n1(yb - m)} ${n1(foot + m)},${yb}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    body += text(n1(x0 + (b * sc) / 2), yb + 26, `base ${b}`);
    body += text(n1(foot + 8), n1(yt + (h * sc) / 2 + 5), `height ${h}`, 'start');
    if (s > 0) {
      body += text(470, 130, 'slanted side', 'start');
      body += text(470, 154, `${slantText(h, s)}`, 'start');
    }
    body += text(300, 296, `area = ${b} × ${h} = ${b * h}`);
    return body;
  },
  viewBox: '0 0 600 312',
  guidance: [
    'The shaded shape is a parallelogram. The dashed segment is its perpendicular height, and the slanted side leans to the right.',
    'Slide the top and watch the slanted side change. Then change the height and compare the area each time.',
  ],
  // Mission rounds: the perpendicular height is unlocked on one base, and the slide differs from round to round (it never changes the target).
  round: (model, round, level) => {
    const b = [6, 8, 5, 9, 7, 10, 4, 12, 11][(round + 2 * level) % 9];
    const goalH = 2 + ((round * 2 + level * 3) % 8);
    const startH = goalH > 5 ? goalH - 3 : goalH + 3;
    const slide = (round + level) % 6 + 1;
    return { base: [b, startH, slide], goal: [b, goalH, slide], free: 1 };
  },
};
