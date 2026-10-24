// line:order - Two locations on a number line, read as POSITION (7-4, "Compare and Order Integers").
// The old bench mode (line:absolute) read out the distance between the locations, which rewards "farther from 0 is greater".
// This one reads out the signed step from the first location to the second: right is positive, left is negative. It never
// uses distance from 0, so the only way to read the picture is by position: the number farther right is greater.
// Same two controls as line:absolute, whole numbers only (7-4 is an integer lesson).
import { esc, line } from './draw.mjs';
import { control } from './util.mjs';

const MIN = -10, MAX = 10, LEFT = 30, SPAN = 540, AXIS = 150;
const sx = (n) => LEFT + ((n - MIN) / (MAX - MIN)) * SPAN;
const t = (x, y, s, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="14">${esc(s)}</text>`;
/** Whole numbers with a true minus sign. */
const fmt = (n) => (n < 0 ? `−${-n}` : String(n));
const word = (gap) => (gap > 0 ? `${gap} step${gap === 1 ? '' : 's'} right` : gap < 0 ? `${-gap} step${gap === -1 ? '' : 's'} left` : 'no steps');

function check([a, b]) {
  const ok = (n) => Number.isInteger(n) && n >= MIN && n <= MAX;
  if (!ok(a) || !ok(b)) throw new Error('Each location is a whole number from −10 to 10.');
}

export default {
  kind: 'line',
  mode: 'order',
  values: [-3, -8],
  free: 0,
  controls: () => [
    { ...control('First location', MIN, MAX), labelEs: 'Primera ubicación' },
    { ...control('Second location', MIN, MAX), labelEs: 'Segunda ubicación' },
  ],
  viewBox: '0 0 600 260',
  evaluate: (model, values) => {
    check(values);
    const [a, b] = values, gap = b - a;
    const equation = `From ${fmt(a)} to ${fmt(b)}: ${word(gap)}`;
    const note = a === b
      ? `Both locations are at ${fmt(a)}, so the numbers are equal.`
      : `${fmt(Math.min(a, b))} < ${fmt(Math.max(a, b))}. The number farther to the right is greater, so the number farther left is less.`;
    return { value: gap, label: 'Steps from first to second (right is positive)', unit: 'steps', equation, note };
  },
  visual: (values, result) => {
    const [a, b] = values, gap = result.value;
    let body = t(300, 26, 'Numbers get greater as you go right', 'middle');
    body += line(LEFT - 14, AXIS, LEFT + SPAN + 14, AXIS, 'heavy');
    body += `<polygon points="${LEFT + SPAN + 22},${AXIS} ${LEFT + SPAN + 8},${AXIS - 7} ${LEFT + SPAN + 8},${AXIS + 7}" fill="#17344b"/>`;
    for (let n = MIN; n <= MAX; n++) {
      const major = n % 5 === 0;
      body += line(sx(n), AXIS - (major ? 9 : 5), sx(n), AXIS + (major ? 9 : 5));
      if (major && n !== a && n !== b) body += t(sx(n), AXIS + 30, fmt(n));
    }
    // the arrow from the first location to the second: the picture of "right is positive"
    if (gap !== 0) {
      const y = 100, x1 = sx(a), x2 = sx(b), dir = gap > 0 ? 1 : -1;
      body += line(x1, y, x2 - dir * 10, y, 'solution') + `<polygon points="${x2},${y} ${x2 - dir * 12},${y - 7} ${x2 - dir * 12},${y + 7}" fill="#075f80"/>`;
      body += t((x1 + x2) / 2, y - 12, word(gap));
    }
    body += `<circle cx="${sx(a)}" cy="${AXIS}" r="8" class="point"/>` + t(sx(a), AXIS + 56, `First: ${fmt(a)}`);
    body += `<circle cx="${sx(b)}" cy="${AXIS}" r="8" class="point-alt"/>` + t(sx(b), AXIS + 78, `Second: ${fmt(b)}`);
    if (a !== b) body += t(300, 240, `${fmt(Math.max(a, b))} is farther right, so it is greater.`);
    else body += t(300, 240, 'Same spot, so the numbers are equal.');
    return body;
  },
  guidance: [
    'The line shows the first and second locations. The arrow shows how many steps it takes to go from the first to the second.',
    'Put the two numbers in order. The number farther to the right is greater, even when its digits look small.',
  ],
  // A mission puzzle unlocks the first location: the second stays where it is and the target is the signed step between them.
  round: (model, round, level) => {
    const k = (round * 3 + level) % 15;
    const b = ((k * 4) % 15) - 7;
    const gaps = [3, 5, 7, 4, 6, 2, 8, 5, 3, 6, 4, 7, 2, 9, 5];
    const s = k % 2 ? 1 : -1;
    let a = b - s * gaps[k];
    if (a < MIN || a > MAX) a = b + s * gaps[k];
    if (a < MIN || a > MAX) a = b - s * 2;
    const start = a + 4 <= MAX ? a + 4 : a - 4;
    return { base: [start, b], goal: [a, b], free: 0 };
  },
};
