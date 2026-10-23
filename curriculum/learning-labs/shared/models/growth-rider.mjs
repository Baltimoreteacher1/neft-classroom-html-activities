// growth:rider - A train graph with a rider already aboard (3-4, "Represent Ratios on a Coordinate Plane").
// Same first and third controls as growth:ratio-graph (passengers per carriage, carriages) and the same readout (passengers), but the
// starting passengers control is UNLOCKED (0 to 6). With no starting rider every point sits on a line through (0, 0) and y : x never
// changes; with a starting rider the points are still straight but y : x changes row by row. A small table beside the graph writes y : x
// for carriages 1, 2 and 3 and says whether the ratios are equal, so a student can test "straight line" against "through the origin".
import { esc, line } from './draw.mjs';
import { control } from './util.mjs';

const X0 = 60, X1 = 330, Y0 = 268, Y1 = 40;
const t = (x, y, s, anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="14"${extra}>${esc(s)}</text>`;

function check([rate, start, carriages]) {
  const ok = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
  if (!ok(rate, 1, 8) || !ok(start, 0, 6) || !ok(carriages, 1, 12)) throw new Error('Passengers per carriage is 1 to 8, starting passengers 0 to 6 and carriages 1 to 12.');
}

export default {
  kind: 'growth',
  mode: 'rider',
  values: [3, 0, 4],
  free: 0,
  controls: () => [
    { ...control('Passengers per carriage', 1, 8), labelEs: 'Pasajeros por vagón' },
    { ...control('Starting passengers', 0, 6), labelEs: 'Pasajeros al inicio' },
    { ...control('Carriages', 1, 12), labelEs: 'Vagones' },
  ],
  viewBox: '0 0 600 310',
  evaluate: (model, values) => {
    check(values);
    const [rate, start, carriages] = values, value = rate * carriages + start;
    const equation = start ? `${rate} × ${carriages} + ${start} = ${value}` : `${rate} × ${carriages} = ${value}`;
    const note = start
      ? `Each carriage adds ${rate}. ${start} riders were already aboard, so the line starts at (0, ${start}), not at (0, 0).`
      : `Each carriage adds ${rate} and nobody was aboard first, so the line passes through (0, 0).`;
    return { value, label: 'Number of passengers', unit: '', equation, note };
  },
  visual: (values) => {
    const [rate, start, carriages] = values;
    const y = (x) => rate * x + start;
    const maxX = Math.max(6, carriages), maxY = y(maxX);
    const sx = (x) => X0 + ((X1 - X0) * x) / maxX, sy = (v) => Y0 - ((Y0 - Y1) * v) / maxY;
    let body = line(X0, Y0, X1 + 10, Y0) + line(X0, Y0, X0, Y1 - 10);
    body += line(sx(0), sy(start), sx(maxX), sy(maxY), 'plot');
    for (let x = 0; x <= maxX; x++) {
      body += t(sx(x), Y0 + 20, String(x));
      if (x === 0 && start === 0) body += `<circle cx="${sx(0)}" cy="${sy(0)}" r="7" class="point-alt"/>`;
      else if (x === 0) body += `<circle cx="${sx(0)}" cy="${sy(start)}" r="7" class="open-point"/>`;
      else body += `<circle cx="${sx(x)}" cy="${sy(y(x))}" r="${x === carriages ? 9 : 6}" class="${x === carriages ? 'point-alt' : 'point'}"/>`;
    }
    body += t((X0 + X1) / 2, Y0 + 42, 'Carriages (x)') + t(X0 - 8, Y1 - 16, 'Passengers (y)', 'start');
    body += t(X0 + 8, sy(start) - 12, start ? `starts at (0, ${start})` : '(0, 0)', 'start');
    // the ratio check: y : x for carriages 1, 2 and 3
    const rows = [1, 2, 3].map((x) => [x, y(x)]);
    const equal = rows.every(([x, v]) => v * rows[0][0] === rows[0][1] * x);
    body += t(470, 52, 'Ratio check', 'middle', ' font-weight="bold"') + t(400, 80, 'x', 'middle') + t(470, 80, 'y') + t(545, 80, 'y : x');
    rows.forEach(([x, v], i) => {
      const yy = 106 + i * 28;
      body += `<rect x="372" y="${yy - 19}" width="196" height="26" fill="#ffffff" stroke="#47728c" rx="3"/>`;
      body += t(400, yy, String(x)) + t(470, yy, String(v)) + t(545, yy, `${v} : ${x}`);
    });
    body += t(470, 214, equal ? 'Every row has the same ratio.' : 'The rows do NOT have the same ratio.');
    body += t(470, 238, start ? 'The points are straight,' : 'The line passes through', 'middle') + t(470, 258, start ? 'but the line misses (0, 0).' : '(0, 0): all ratios match.', 'middle');
    return body;
  },
  guidance: [
    'Each point is (carriages, passengers). The table beside the graph writes passengers : carriages for the first three carriages.',
    'Set the starting passengers to 2 and watch the table: the points stay in a straight line, but the ratios stop matching.',
  ],
};
