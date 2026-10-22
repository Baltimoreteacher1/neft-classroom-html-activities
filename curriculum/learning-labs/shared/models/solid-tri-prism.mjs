// solid:tri-prism - Net of a triangular prism: two congruent right triangles and three rectangles, each face labelled, areas added (5-7).
// The triangle end is a 3-4-5 right triangle scaled by the height control (3-4-5, 6-8-10, 9-12-15, 12-16-20), so every side is a whole
// number and the prism is real at every setting. A rectangle is as wide as one triangle side and as long as the prism.
import { control } from './util.mjs';
import { text, line } from './draw.mjs';

const CHAR = 9.2;
const n = (v) => Number(v.toFixed(1));
const HEIGHTS = [3, 6, 9, 12];

const check = (values) => {
  if (!Array.isArray(values) || values.length !== 2 || !HEIGHTS.includes(values[0]) || !Number.isInteger(values[1]) || values[1] < 1 || values[1] > 10)
    throw new Error('Triangle height must be 3, 6, 9 or 12 and the prism length a whole number from 1 to 10.');
};
/** The right triangle on the end: height a (vertical leg), base b (the other leg), third side c. */
const triangle = (a) => ({ a, b: (a * 4) / 3, c: (a * 5) / 3, area: (a * ((a * 4) / 3)) / 2 });

/** One text line centred in a face: the full label when it fits, otherwise the short one, otherwise nothing (the key below always has it). */
function put(x, y, w, h, ...options) {
  const t = options.find((s) => w >= s.length * CHAR + 8 && h >= 22);
  return t ? text(n(x + w / 2), n(y + h / 2 + 5), t) : '';
}

export default {
  kind: 'solid',
  mode: 'tri-prism',
  values: [6, 3],
  free: 1,
  controls: () => [
    { ...control('Triangle height', 3, 12, 3), labelEs: 'Altura del triángulo' },
    { ...control('Prism length', 1, 10), labelEs: 'Largo del prisma' },
  ],
  evaluate: (model, values) => {
    check(values);
    const [a, len] = values, t = triangle(a);
    const rects = [a, t.b, t.c].map((side) => side * len);
    const value = 2 * t.area + rects.reduce((x, y) => x + y, 0);
    return {
      value, label: 'Surface area', unit: 'square units',
      equation: `${t.area} + ${t.area} + ${rects.join(' + ')} = ${value}`,
      note: 'The net has two triangles and three rectangles. Each rectangle is as long as the prism and as wide as one side of the triangle.',
      tri: t, len, rects,
    };
  },
  visual: (values, result) => {
    const [a, len] = values, { tri: t, rects } = result, b = t.b, c = t.c;
    const sc = Math.min(540 / (a + b + c), 290 / (len + 2 * a), 40);
    const x0 = (560 - (a + b + c) * sc) / 2, y0 = 10 + (290 - (len + 2 * a) * sc) / 2;
    const yT = y0 + a * sc, yB = yT + len * sc, xa = x0 + a * sc, xb = xa + b * sc, xe = xb + c * sc;
    const widths = [a, b, c];
    // The triangles stand on the base rectangle B with the right angle above the A/B fold, so the height side meets A and the third side meets C.
    const up = [[xa, yT], [xb, yT], [xa, yT - a * sc]], down = [[xa, yB], [xb, yB], [xa, yB + a * sc]];
    const pts = (p) => p.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
    let body = `<polygon points="${pts(up)}" class="shape" style="stroke:none"/><polygon points="${pts(down)}" class="shape" style="stroke:none"/>`;
    [x0, xa, xb].forEach((x, i) => { body += `<rect x="${n(x)}" y="${n(yT)}" width="${n(widths[i] * sc)}" height="${n(len * sc)}" class="${['shape-light', 'shape-alt', 'shape-light'][i]}" style="stroke:none"/>`; });
    const outline = [[x0, yT], [xa, yT], [xa, yT - a * sc], [xb, yT], [xe, yT], [xe, yB], [xb, yB], [xa, yB + a * sc], [xa, yB], [x0, yB]];
    body += `<polygon points="${pts(outline)}" fill="none" stroke="#17344b" stroke-width="2.5"/>`;
    body += line(n(xa), n(yT), n(xa), n(yB), 'dashed') + line(n(xb), n(yT), n(xb), n(yB), 'dashed');
    body += line(n(xa), n(yT), n(xb), n(yT), 'dashed') + line(n(xa), n(yB), n(xb), n(yB), 'dashed');
    // right-angle mark at the corner above the A/B fold
    const m = Math.min(10, (a * sc) / 3, (b * sc) / 3);
    body += `<polyline points="${n(xa)},${n(yT - m)} ${n(xa + m)},${n(yT - m)} ${n(xa + m)},${n(yT)}" fill="none" stroke="#17344b" stroke-width="2"/>`;
    // side lengths on the top triangle
    body += text(n(xa - 8), n(yT - (a * sc) / 2 + 5), `height ${a}`, 'end');
    body += text(n(xa + (b * sc) / 2 + 10), n(yT - (a * sc) / 2 + 5), `side ${c}`, 'start');
    const baseText = `base ${b}`, atRight = xa + m + 6 + baseText.length * CHAR;
    if (atRight <= xa + b * sc * (1 - 17 / (a * sc)) - 2) body += text(n(xa + m + 6), n(yT - 6), baseText, 'start');
    // face labels
    ['A', 'B', 'C'].forEach((id, i) => {
      const x = [x0, xa, xb][i], w = widths[i] * sc;
      body += put(x, yT, w, len * sc, `${id} ${widths[i]} × ${len} = ${rects[i]}`, `${widths[i]} × ${len} = ${rects[i]}`, id);
    });
    const tw = (2 * b * sc) / 3 - 4;
    for (const [cy, hh] of [[yT - (a * sc) / 3, a * sc], [yB + (a * sc) / 3, a * sc]])
      if (hh >= 40 && tw >= `T ${t.area}`.length * CHAR) body += text(n(xa + (b * sc) / 3), n(cy + 5), `T ${t.area}`);
    // the areas added, then the key that names every face and its two sides
    body += text(280, 326, `T ${t.area} + T ${t.area} + A ${rects[0]} + B ${rects[1]} + C ${rects[2]} = ${result.value}`);
    const rows = [
      `T: two triangles, ½ × ${b} × ${a} = ${t.area} each`,
      `A: rectangle for the height side: ${a} × ${len} = ${rects[0]}`,
      `B: rectangle for the base: ${b} × ${len} = ${rects[1]}`,
      `C: rectangle for the third side: ${c} × ${len} = ${rects[2]}`,
    ];
    rows.forEach((r, i) => { body += text(16, 352 + i * 22, r, 'start'); });
    body += text(280, 440, 'Dashed lines are folds.');
    return body;
  },
  viewBox: '0 0 560 452',
  guidance: [
    'The net is a triangular prism unfolded: two matching triangle ends and three rectangles. Each rectangle is as wide as one side of the triangle and as long as the prism.',
    'Change the triangle or the length, find each face on the net, and add all five areas.',
  ],
  // The mission fixes one triangle per round and unlocks the length, so each puzzle is a different prism, never a repeat of one triangle.
  round: (model, round, level) => {
    const a = HEIGHTS[(round + level) % 4];
    const goalLen = 2 + ((round * 3 + level * 2) % 9);
    const startLen = goalLen > 5 ? goalLen - 3 : goalLen + 4;
    return { base: [a, startLen], goal: [a, goalLen], free: 1 };
  },
};
