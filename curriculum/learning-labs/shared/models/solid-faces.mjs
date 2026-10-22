// solid:faces - Net of a rectangular prism with every face labelled (dimensions and area), the three matching pairs marked, and the six areas added (5-6).
// Same controls and readout as solid:surface, so a bench that used the old model keeps its tasks; only the picture is the lesson's own.
import { control } from './util.mjs';
import { text, line } from './draw.mjs';

const CHAR = 9.2; // px per character of the picture's bold 16px text (a safe over-estimate, so a label never spills out of its face)
const LINE = 17;
const n = (v) => Number(v.toFixed(1));

const check = (values) => {
  if (!Array.isArray(values) || values.length !== 3 || !values.every((v) => Number.isInteger(v) && v >= 1 && v <= 10))
    throw new Error('Length, width and height must be whole numbers from 1 to 10.');
};

/** The three pairs of matching faces, in the order the sum line adds them. */
const pairsOf = ([l, w, h]) => [
  { id: 'A', name: 'Top and bottom', faces: ['Top', 'Bottom'], dims: [l, w] },
  { id: 'B', name: 'Front and back', faces: ['Front', 'Back'], dims: [l, h] },
  { id: 'C', name: 'Left and right', faces: ['Left', 'Right'], dims: [w, h] },
].map((p) => ({ ...p, area: p.dims[0] * p.dims[1] }));

/** Text inside a face when it fits: three lines, then one line, then just the pair letter, then nothing (the key below always has it all). */
function faceLabel(x, y, w, h, id, face, dims, area) {
  const three = [`${id} ${face}`, `${dims[0]} × ${dims[1]}`, `= ${area}`];
  const one = [`${id} ${dims[0]} × ${dims[1]} = ${area}`];
  let lines = [];
  if (w >= Math.max(...three.map((s) => s.length)) * CHAR + 8 && h >= 3 * LINE + 4) lines = three;
  else if (w >= one[0].length * CHAR + 8 && h >= LINE + 6) lines = one;
  else if (w >= 9 && h >= 12) lines = [id];
  const first = y + h / 2 - ((lines.length - 1) * LINE) / 2 + 5;
  const halo = lines.length === 1 && lines[0] === id ? ' stroke="#fff" stroke-width="4" paint-order="stroke"' : ''; // a bare letter on a sliver sits across the outline
  return lines.map((s, i) => text(n(x + w / 2), n(first + i * LINE), s).replace('<text ', `<text${halo} `)).join('');
}

export default {
  kind: 'solid',
  mode: 'faces',
  values: [6, 3, 2],
  controls: () => [
    { ...control('Length', 1, 10), labelEs: 'Largo' },
    { ...control('Width', 1, 10), labelEs: 'Ancho' },
    { ...control('Height', 1, 10), labelEs: 'Altura' },
  ],
  evaluate: (model, values) => {
    check(values);
    const pairs = pairsOf(values);
    const areas = pairs.flatMap((p) => [p.area, p.area]);
    const value = areas.reduce((a, b) => a + b, 0);
    return {
      value, label: 'Prism surface area', unit: 'square units',
      equation: `${areas.join(' + ')} = ${value}`,
      note: 'The net folds into a box with six faces in three matching pairs. Add the areas of all six faces.',
      pairs,
    };
  },
  visual: (values, result) => {
    const [l, w, h] = values;
    const [A, B, C] = result.pairs;
    const sc = Math.min(540 / (2 * l + 2 * w), 290 / (h + 2 * w), 44);
    const x0 = (560 - (2 * l + 2 * w) * sc) / 2, y0 = 10 + (290 - (h + 2 * w) * sc) / 2;
    const xs = [x0, x0 + l * sc, x0 + (l + w) * sc, x0 + (2 * l + w) * sc, x0 + (2 * l + 2 * w) * sc];
    const yM = y0 + w * sc, yB = y0 + (w + h) * sc, yE = y0 + (2 * w + h) * sc;
    // face = [x, y, width, height, pair, face name, fill class]
    const faces = [
      [xs[0], y0, l * sc, w * sc, A, 'Top', 'shape'],
      [xs[0], yM, l * sc, h * sc, B, 'Front', 'shape-alt'],
      [xs[1], yM, w * sc, h * sc, C, 'Right', 'shape-light'],
      [xs[2], yM, l * sc, h * sc, B, 'Back', 'shape-alt'],
      [xs[3], yM, w * sc, h * sc, C, 'Left', 'shape-light'],
      [xs[0], yB, l * sc, w * sc, A, 'Bottom', 'shape'],
    ];
    let body = '';
    for (const [x, y, fw, fh, , , cls] of faces) body += `<rect x="${n(x)}" y="${n(y)}" width="${n(fw)}" height="${n(fh)}" class="${cls}" style="stroke:none"/>`;
    const pts = [[xs[0], y0], [xs[1], y0], [xs[1], yM], [xs[4], yM], [xs[4], yB], [xs[1], yB], [xs[1], yE], [xs[0], yE]];
    body += `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="none" stroke="#17344b" stroke-width="2.5"/>`;
    for (const x of [xs[1], xs[2], xs[3]]) body += line(n(x), n(yM), n(x), n(yB), 'dashed');
    body += line(n(xs[0]), n(yM), n(xs[1]), n(yM), 'dashed') + line(n(xs[0]), n(yB), n(xs[1]), n(yB), 'dashed');
    for (const [x, y, fw, fh, p, name] of faces) body += faceLabel(x, y, fw, fh, p.id, name, p.dims, p.area);
    body += text(280, 326, `${[A, A, B, B, C, C].map((p) => `${p.id} ${p.area}`).join(' + ')} = ${result.value}`);
    [A, B, C].forEach((p, i) => { body += text(16, 352 + i * 22, `${p.id}: ${p.name} (2 faces): ${p.dims[0]} × ${p.dims[1]} = ${p.area} each`, 'start'); });
    body += text(280, 426, 'Dashed lines are folds.');
    return body;
  },
  viewBox: '0 0 560 440',
  guidance: [
    'The net is the box unfolded into six flat faces in three matching pairs. Each face shows its sides and its area, and the areas are added under the net.',
    'Change the length, width or height and watch which pairs of faces change and which stay the same.',
  ],
};
