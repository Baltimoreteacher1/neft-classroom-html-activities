// coordinates:reflect-predict - Reflect points across the axes (7-9, "Reflect Points in the Coordinate Plane").
// The old readout listed A's reflections across both axes, so a student could read the answer instead of predicting it.
// This model keeps the same four controls and the same readout (the street-route distance between A and B) but changes what
// the picture says and when:
//   1. Always: how far each point is from each axis, as bars with the distances written beside them.
//   2. Only when B is the mirror image of A across an axis (the student has made the prediction and placed B): a small table
//      of which coordinate changed sign and which stayed the same.
// So the table confirms a prediction and cannot be used as a rule to look up.
import { esc, line } from './draw.mjs';
import { control } from './util.mjs';

const R = 6, K = 19, CX = 300, CY = 146;
const sx = (n) => CX + n * K, sy = (n) => CY - n * K;
const t = (x, y, s, anchor = 'middle', size = 14) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${esc(s)}</text>`;
const dot = (x, y, label, cls = 'point') => `<circle cx="${x}" cy="${y}" r="7" class="${cls}"/>${label ? t(x, y - 12, label) : ''}`;
const signed = (n) => (n < 0 ? `−${-n}` : String(n));

/** Which axis B mirrors A across, or null. A point on an axis is not told apart from its own reflection. */
export function mirrorAxis([a, b, c, d]) {
  if (a === c && b === -d && b !== 0) return 'x';
  if (b === d && a === -c && a !== 0) return 'y';
  return null;
}

function check(values) {
  if (!values.every((n) => Number.isInteger(n) && n >= -R && n <= R)) throw new Error('Each coordinate is a whole number from −6 to 6.');
}

export default {
  kind: 'coordinates',
  mode: 'reflect-predict',
  values: [-4, 3, 3, -2],
  free: 2,
  controls: () => [
    { ...control('Point A: x', -R, R), labelEs: 'Punto A: x' },
    { ...control('Point A: y', -R, R), labelEs: 'Punto A: y' },
    { ...control('Point B: x', -R, R), labelEs: 'Punto B: x' },
    { ...control('Point B: y', -R, R), labelEs: 'Punto B: y' },
  ],
  viewBox: '135 -8 490 305',
  evaluate: (model, values) => {
    check(values);
    const [a, b, c, d] = values, w = Math.abs(c - a), h = Math.abs(d - b), value = w + h;
    const equation = `Horizontal ${w} + vertical ${h} = ${value}`;
    const note = `A is ${Math.abs(a)} from the y-axis and ${Math.abs(b)} from the x-axis. B is ${Math.abs(c)} from the y-axis and ${Math.abs(d)} from the x-axis.`;
    return { value, label: 'Street-route distance', unit: 'units', equation, note };
  },
  visual: (values) => {
    const [a, b, c, d] = values, axis = mirrorAxis(values);
    let body = '';
    for (let i = -R; i <= R; i++) {
      body += line(sx(i), sy(-R), sx(i), sy(R), i === 0 ? 'heavy' : 'gridline') + line(sx(-R), sy(i), sx(R), sy(i), i === 0 ? 'heavy' : 'gridline');
      if (i !== 0 && i % 2 === 0) body += t(sx(i), 166, signed(i)) + t(283, sy(i) + 5, signed(i));
    }
    // distance-to-axis bars for both points: across to the y-axis, down or up to the x-axis
    for (const [x, y, cls] of [[a, b, 'solution'], [c, d, 'dashed']]) {
      if (x !== 0) body += line(sx(x), sy(y), CX, sy(y), cls);
      if (y !== 0) body += line(sx(x), sy(y), sx(x), CY, cls);
    }
    body += dot(sx(a), sy(b), `A(${signed(a)},${signed(b)})`) + dot(sx(c), sy(d), `B(${signed(c)},${signed(d)})`, 'point-alt') + t(445, 150, 'x') + t(CX, 14, 'y');
    // right-hand panel: the distances first, the sign table only for a mirror image
    let y0 = 40;
    body += t(432, y0, 'Distance from each axis', 'start');
    body += t(432, y0 + 22, `A: ${Math.abs(a)} from y-axis, ${Math.abs(b)} from x-axis`, 'start', 13);
    body += t(432, y0 + 42, `B: ${Math.abs(c)} from y-axis, ${Math.abs(d)} from x-axis`, 'start', 13);
    if (axis) {
      y0 = 120;
      const keep = axis === 'x' ? 'x' : 'y', flip = axis === 'x' ? 'y' : 'x';
      const row = (name, from, to) => `${name}: ${signed(from)} to ${signed(to)}, ${from === to ? 'same' : 'sign changed'}`;
      body += t(432, y0, `B mirrors A across the ${axis}-axis`, 'start');
      body += t(432, y0 + 22, row('x', a, c), 'start', 13) + t(432, y0 + 42, row('y', b, d), 'start', 13);
      body += t(432, y0 + 66, `${flip}-coordinate: sign changed`, 'start', 13) + t(432, y0 + 86, `${keep}-coordinate: stays the same`, 'start', 13);
    } else {
      body += t(432, 120, 'Move B to where you predict', 'start', 13) + t(432, 140, 'the mirror image of A lands.', 'start', 13);
    }
    return body;
  },
  // A mission puzzle unlocks one coordinate of A. B stays put and A starts on top of B; the target is the street-route distance once A
  // is B's mirror image (across the y-axis when A's x is unlocked, across the x-axis when A's y is unlocked).
  round: (model, round, level) => {
    const c = ((round + level) % 5) + 1, d = (((round * 2 + level) % 5) + 1) * (round % 3 === 1 ? -1 : 1);
    return round % 2
      ? { base: [c, d, c, d], goal: [c, -d, c, d], free: 1 }
      : { base: [c, d, c, d], goal: [-c, d, c, d], free: 0 };
  },
  guidance: [
    'The bars show how far each point is from each axis. When B is the mirror image of A, a small table also shows which coordinate changed sign.',
    'Predict where the mirror image of A lands, then move B there and see whether the table appears.',
  ],
};
