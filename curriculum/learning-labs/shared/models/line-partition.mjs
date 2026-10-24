// line:partition - Cut each unit of a number line into equal parts, then count ticks from 0 (7-2, "Rational Numbers on the Number Line").
// The bench mode this replaces (line:opposites) moved two points by halves and never asked how a unit is divided. Here the two
// controls are the two ideas: how many equal parts each unit has (the denominator) and how many ticks the marker is from 0 (the
// numerator, left of 0 when negative). The marker's number is ticks / parts.
import { esc, line } from './draw.mjs';
import { control } from './util.mjs';

const LO = -4, HI = 4, LEFT = 30, SPAN = 540, AXIS = 140;
const sx = (n) => LEFT + ((n - LO) / (HI - LO)) * SPAN;
const t = (x, y, s, anchor = 'middle', size = 14) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${esc(s)}</text>`;
const sg = (n) => (n < 0 ? `−${-n}` : String(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** The marker's number as a fraction in lowest terms, with a true minus. */
const frac = (k, p) => {
  const g = gcd(k, p) || 1, n = k / g, d = p / g;
  return d === 1 ? sg(n) : `${sg(n)}/${d}`;
};
const dec = (v) => sg(Number(v.toFixed(4)));

function check([parts, ticks]) {
  if (!Number.isInteger(parts) || parts < 1 || parts > 10 || !Number.isInteger(ticks) || ticks < -40 || ticks > 40) throw new Error('Cut each unit into 1 to 10 parts and count 0 to 40 ticks either side of 0.');
}

export default {
  kind: 'line',
  mode: 'partition',
  values: [3, 2],
  free: 1,
  controls: () => [
    { ...control('Equal parts in each unit', 1, 10), labelEs: 'Partes iguales en cada unidad' },
    { ...control('Ticks from 0 (negative is left)', -40, 40), labelEs: 'Marcas desde 0 (negativo es a la izquierda)' },
  ],
  viewBox: '0 0 600 250',
  evaluate: (model, values) => {
    check(values);
    const [parts, ticks] = values, value = ticks / parts;
    const equation = `${sg(ticks)} ticks of 1/${parts} = ${frac(ticks, parts)} = ${dec(value)}`;
    const note = `Each unit is cut into ${parts} equal part${parts === 1 ? '' : 's'}, so each tick is 1/${parts}. The marker is ${Math.abs(ticks)} tick${Math.abs(ticks) === 1 ? '' : 's'} ${ticks < 0 ? 'left' : ticks > 0 ? 'right' : 'at'} ${ticks === 0 ? 'zero' : 'of 0'}.`;
    return { value, label: 'Number at the marker', unit: '', equation, note };
  },
  visual: (values, result) => {
    const [parts, ticks] = values, v = result.value;
    let body = t(300, 26, `Each unit is cut into ${parts} equal part${parts === 1 ? '' : 's'}`);
    body += line(LEFT - 14, AXIS, LEFT + SPAN + 14, AXIS, 'heavy');
    for (let n = LO; n < HI; n++) for (let i = 0; i < parts; i++) body += line(sx(n + i / parts), AXIS - (i ? 6 : 12), sx(n + i / parts), AXIS + (i ? 6 : 12));
    body += line(sx(HI), AXIS - 12, sx(HI), AXIS + 12);
    for (let n = LO; n <= HI; n++) body += t(sx(n), AXIS + 34, sg(n));
    if (v >= LO && v <= HI) {
      body += `<circle cx="${sx(v)}" cy="${AXIS}" r="8" class="point"/>` + t(Math.min(570, Math.max(30, sx(v))), AXIS - 34, frac(ticks, parts));
    } else {
      body += t(300, AXIS - 34, `${frac(ticks, parts)} is off this picture, ${v < 0 ? 'to the left' : 'to the right'}`);
    }
    body += t(300, 220, `Marker: ${sg(ticks)} ticks of 1/${parts}`);
    return body;
  },
  guidance: [
    'Each unit of the number line is cut into equal parts. The marker sits at a tick, and its number is the tick count divided by the parts in a unit.',
    'Change the parts in each unit, then move the marker. Notice which numbers land exactly on a tick and which fall between two ticks.',
  ],
  // A mission puzzle unlocks the tick count: the parts stay fixed (halves, fourths, fifths or tenths) and the target is a number the student places.
  round: (model, round, level) => {
    const parts = [2, 4, 5, 10][(round + level) % 4];
    const k = ((round * 3 + level * 2) % (3 * parts)) + 1;
    const ticks = (round + level) % 2 ? -k : k;
    return { base: [parts, 0], goal: [parts, ticks], free: 1 };
  },
};
