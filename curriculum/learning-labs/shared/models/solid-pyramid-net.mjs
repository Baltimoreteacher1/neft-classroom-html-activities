// solid:pyramid-net - Net of a square pyramid: one square base and four congruent triangles whose height is the SLANT height (5-8).
// Slant height runs 6-12 and the base side 1-10, so the slant height is always greater than half the base side (at most 5):
// every setting is a real pyramid with a vertical height above zero, and the net always folds without overlap.
import { control, fmt } from './util.mjs';
import { text, line } from './draw.mjs';

const CHAR = 9.2;
const n = (v) => Number(v.toFixed(1));

const check = (values) => {
  if (!Array.isArray(values) || values.length !== 2 || !values.every((v) => Number.isInteger(v)) || values[0] < 1 || values[0] > 10 || values[1] < 6 || values[1] > 12)
    throw new Error('Base side must be a whole number from 1 to 10 and slant height a whole number from 6 to 12.');
};

/** A halo in the face colour, so a label stays readable where the dashed slant line runs through it. */
const halo = (markup) => markup.replaceAll('<text ', '<text stroke="#d6e9f2" stroke-width="5" paint-order="stroke" ');

/** Lines of text centred at (cx, cy) when the widest line fits in `room` px, else nothing. */
function stack(cx, cy, room, lines) {
  if (room < Math.max(...lines.map((s) => s.length)) * CHAR + 6) return '';
  const first = cy - ((lines.length - 1) * 17) / 2 + 5;
  return lines.map((s, i) => text(n(cx), n(first + i * 17), s)).join('');
}

export default {
  kind: 'solid',
  mode: 'pyramid-net',
  values: [6, 9],
  free: 1,
  controls: () => [
    { ...control('Base side', 1, 10), labelEs: 'Lado de la base' },
    { ...control('Slant height', 6, 12), labelEs: 'Altura inclinada' },
  ],
  evaluate: (model, values) => {
    check(values);
    const [s, l] = values, base = s * s, face = (s * l) / 2, value = base + 4 * face;
    return {
      value, label: 'Pyramid surface area', unit: 'square units',
      equation: `${fmt(base)} + ${[0, 1, 2, 3].map(() => fmt(face)).join(' + ')} = ${fmt(value)}`,
      note: 'The net has one square base and four matching triangles. Each triangle is as tall as the slant height.',
      base, face,
    };
  },
  visual: (values, result) => {
    const [s, l] = values, { base, face } = result;
    const sc = Math.min(300 / (s + 2 * l), 40), side = s * sc, tall = l * sc;
    const cx = 280, cy = 160, x0 = cx - side / 2, x1 = cx + side / 2, y0 = cy - side / 2, y1 = cy + side / 2;
    const tris = [
      [[x0, y0], [x1, y0], [cx, y0 - tall]], [[x1, y0], [x1, y1], [x1 + tall, cy]],
      [[x0, y1], [x1, y1], [cx, y1 + tall]], [[x0, y0], [x0, y1], [x0 - tall, cy]],
    ];
    const pts = (p) => p.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
    let body = `<rect x="${n(x0)}" y="${n(y0)}" width="${n(side)}" height="${n(side)}" class="shape" style="stroke:none"/>`;
    for (const t of tris) body += `<polygon points="${pts(t)}" class="shape-light" style="stroke:none"/>`;
    for (const t of tris) body += `<polygon points="${pts(t)}" fill="none" stroke="#17344b" stroke-width="2.5"/>`;
    body += `<rect x="${n(x0)}" y="${n(y0)}" width="${n(side)}" height="${n(side)}" fill="none" stroke="#17344b" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    // slant height: from the middle of the base edge to the apex of the top triangle, with a right-angle mark and its name
    const m = Math.min(9, side / 3);
    body += line(n(cx), n(y0), n(cx), n(y0 - tall), 'dashed');
    body += `<polyline points="${n(cx)},${n(y0 - m)} ${n(cx + m)},${n(y0 - m)} ${n(cx + m)},${n(y0)}" fill="none" stroke="#17344b" stroke-width="2"/>`;
    body += text(n(cx + 14), n(y0 - tall + 16), `slant height ${l}`, 'start'); // beside the apex, where the triangle is too narrow to cross it
    // face labels where they fit (a triangle's text sits against its base edge, where it is widest); the key below always names every face
    body += stack(cx, cy, side, ['Base', `${s} × ${s}`, `= ${fmt(base)}`]);
    const options = [[`½ × ${s} × ${l}`, `= ${fmt(face)}`], [`T ${fmt(face)}`]];
    const wide = (o) => Math.max(...o.map((t) => t.length)) * CHAR + 8, half = (o) => ((o.length - 1) * 17) / 2 + 9;
    const along = (o) => { // top and bottom triangles: text is as wide as the triangle is at the far side of the text
      const d0 = half(o) + 3;
      return d0 + half(o) < tall && side * (1 - (d0 + half(o)) / tall) >= wide(o) ? d0 : null;
    };
    const across = (o) => (side / 2) * (1 - (6 + wide(o)) / tall) >= half(o) ? 6 + wide(o) / 2 : null; // left and right triangles
    for (const [i, sign] of [[0, -1], [2, 1]]) {
      const o = options.find((x) => along(x) !== null);
      if (o) body += halo(stack(cx, (i ? y1 : y0) + sign * along(o), side, o));
    }
    for (const [x, sign] of [[x1, 1], [x0, -1]]) {
      const o = options.find((v) => across(v) !== null);
      if (o) body += halo(stack(x + sign * across(o), cy, 1e4, o));
    }
    const sum = `${fmt(base)} + ${[0, 1, 2, 3].map(() => fmt(face)).join(' + ')} = ${fmt(result.value)}`;
    body += text(280, 336, sum);
    body += text(16, 362, `Base: ${s} × ${s} = ${fmt(base)}`, 'start');
    body += text(16, 384, `T: each triangle, ½ × ${s} × ${l} = ${fmt(face)} (base side × slant height)`, 'start');
    body += text(280, 412, 'Slant height is measured along a face,', 'middle');
    body += text(280, 432, 'not straight up inside the pyramid.', 'middle');
    return body;
  },
  viewBox: '0 0 560 448',
  guidance: [
    'The net is a square pyramid unfolded: one square base and four matching triangles. The dashed line is the slant height, the height of each triangle.',
    'Change the base side and the slant height, then add the area of the base to the area of the four triangles.',
  ],
  // The mission fixes one base per round and unlocks the slant height, so each puzzle is a different pyramid.
  round: (model, round, level) => {
    const s = 2 + ((round * 2 + level * 3) % 9);
    const goalSlant = 6 + ((round * 3 + level * 2 + 1) % 7);
    const startSlant = goalSlant > 9 ? goalSlant - 3 : goalSlant + 3;
    return { base: [s, startSlant], goal: [s, goalSlant], free: 1 };
  },
};
