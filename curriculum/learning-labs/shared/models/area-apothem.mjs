// area:apothem - A regular polygon cut from its center into congruent triangles; one triangle shows base (a side), height (the apothem)
// and area, then "n triangles" and the total (lesson 5-9). Two controls: number of sides, side length.
import { control, fmt } from './util.mjs';
import { esc, line, svg } from './draw.mjs';

const INK = '#17344b';
const SIDES = [3, 8], LENGTH = [1, 12];
const R = 112, CX = 170, CY = 140;       // drawing size is fixed; the labels carry the measures

const round2 = (x) => Math.round(x * 100) / 100;
const exact2 = (x) => Math.abs(x - round2(x)) < 1e-9;
const show = (x) => fmt(round2(x));
const sym = (x) => (exact2(x) ? '=' : '≈');

/** Everything the readout and the picture say, from the two controls. */
function figures(n, side) {
  const apothem = side / (2 * Math.tan(Math.PI / n));
  const triangle = side * apothem / 2;
  const total = Number((n * triangle).toFixed(10));
  const exact = exact2(apothem) && exact2(triangle) && exact2(total);
  return { n, side, apothem, triangle, total, exact };
}

function check(values) {
  const [n, side] = values;
  if (!Number.isInteger(n) || n < SIDES[0] || n > SIDES[1]) throw new Error(`Choose a whole number of sides from ${SIDES[0]} to ${SIDES[1]}.`);
  if (!Number.isInteger(side) || side < LENGTH[0] || side > LENGTH[1]) throw new Error(`Choose a side length from ${LENGTH[0]} to ${LENGTH[1]}.`);
  return figures(n, side);
}

const label = (x, y, t, { anchor = 'middle', size = 15 } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" style="font-size:${size}px;fill:${INK}" stroke="#FFFFFF" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round">${esc(t)}</text>`;
const poly = (points, cls) => `<polygon points="${points.map((p) => p.map((v) => Number(v.toFixed(2))).join(',')).join(' ')}" class="${cls}"/>`;

function visual(values, result) {
  const f = result.figures;
  const { n, side } = f;
  // flat bottom: vertex k sits at angle 90deg + 180deg/n + k * 360deg/n (y grows downward), so the last and first vertices share the bottom side
  const vertex = (k) => { const t = Math.PI / 2 + Math.PI / n + 2 * Math.PI * k / n; return [CX + R * Math.cos(t), CY + R * Math.sin(t)]; };
  const reach = R * Math.cos(Math.PI / n);          // drawn apothem
  const baseY = CY + reach;
  let body = '';
  for (let k = 0; k < n; k++) body += poly([[CX, CY], vertex(k), vertex((k + 1) % n)], k === n - 1 ? 'shape' : 'shape-light');
  const [rx, ry] = vertex(n - 1), [lx] = vertex(0);
  body += line(Number(lx.toFixed(2)), Number(ry.toFixed(2)), Number(rx.toFixed(2)), Number(ry.toFixed(2)), 'heavy');   // the base, a side of the polygon
  body += line(CX, CY, CX, Number(baseY.toFixed(2)), 'dashed');                                                         // the apothem
  body += `<polyline points="${CX - 9},${(baseY).toFixed(2)} ${CX - 9},${(baseY - 9).toFixed(2)} ${CX},${(baseY - 9).toFixed(2)}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
  body += `<circle cx="${CX}" cy="${CY}" r="4" fill="${INK}"/>`;
  // count the triangles clockwise from the yellow one (1), each number near the center end of its triangle
  for (let k = 0; k < n - 1; k++) {
    const [ax, ay] = vertex(k), [bx, by] = vertex(k + 1);
    body += label(CX + 0.5 * ((ax + bx) / 2 - CX), CY + 0.5 * ((ay + by) / 2 - CY) + 5, k + 2, { size: 14 });
  }
  body += label(CX - 13, CY + 0.5 * reach + 5, 1, { size: 14 });
  body += label(CX + 8, CY + reach * 0.72 + 5, 'apothem', { anchor: 'start', size: 14 });
  body += label(CX, baseY + 22, `side ${side}`, { size: 15 });
  body += label(CX, 292, 'Not drawn to scale: read the numbers.', { size: 13 });
  const x = 340;
  body += label(x, 44, 'One triangle (yellow)', { anchor: 'start', size: 16 });
  body += label(x, 72, `base = a side = ${side}`, { anchor: 'start' });
  body += label(x, 98, `height = apothem ${sym(f.apothem)} ${show(f.apothem)}`, { anchor: 'start' });
  body += label(x, 124, `area = ½ × ${side} × ${show(f.apothem)} ${sym(f.triangle)} ${show(f.triangle)}`, { anchor: 'start' });
  body += label(x, 172, `${n} triangles in all, one for each side`, { anchor: 'start', size: 16 });
  body += label(x, 200, `total = ${n} × ${show(f.triangle)} ${sym(f.total)} ${show(f.total)}`, { anchor: 'start' });
  body += label(x, 228, `Area of the polygon ${sym(f.total)} ${show(f.total)}`, { anchor: 'start', size: 16 });
  return svg(body, `${result.equation}. ${result.note}`, '0 0 640 300');
}

export default {
  kind: 'area',
  mode: 'apothem',
  values: [4, 3],
  controls: () => [
    { ...control('Number of equal sides', SIDES[0], SIDES[1]), labelEs: 'Número de lados iguales' },
    { ...control('Length of each side', LENGTH[0], LENGTH[1]), labelEs: 'Longitud de cada lado' },
  ],
  evaluate: (model, values) => {
    const f = check(values);
    const ap = `${show(f.apothem)}`;
    return {
      value: f.total, label: 'Area', unit: 'square units', figures: f, apothem: f.apothem,
      equation: `${f.n} × ${f.side} × ${ap} ÷ 2 ${sym(f.total)} ${show(f.total)}`,
      note: f.exact
        ? 'The apothem is the height of each triangle: it runs from the center to the middle of a side.'
        : 'The apothem is the height of each triangle, from the center to the middle of a side. It is rounded to 2 places here, but the area uses the exact apothem.',
    };
  },
  visual,
  viewBox: '0 0 640 300',
  guidance: [
    'The regular polygon is cut from its center into equal triangles. Each triangle has one side as its base and the apothem as its height.',
    'Change the number of sides and the side length, then follow one triangle to the total.',
  ],
  free: 1,
  approx: true,
  // Mission rounds: the side length is unlocked. Level 1 uses squares (a whole-number area); later levels use other regular polygons.
  round: (model, round, level) => {
    const n = level === 0 ? 4 : [6, 3, 8, 5, 7][(round + level) % 5];
    const goalSide = 2 + (3 + 2 * level + 3 * round) % 10;
    const startSide = goalSide <= 6 ? goalSide + 3 : goalSide - 3;
    return { base: [n, startSide], goal: [n, goalSide], free: 1 };
  },
};
