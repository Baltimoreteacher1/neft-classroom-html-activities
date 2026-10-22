// growth:table - Input/output table: the quantity you choose vs the quantity that responds (9-1, "Explore Relationships Between Two Variables").
// Same controls and readout as growth:weather (rain each hour, starting reading, hours; output = rate x hours + start), so the 9-1 bench stays
// valid. The picture is a table of values with the lesson's words (independent / dependent variable, input / output, depends on), the
// current input row marked, and the rule as an arrow from input to output. There is no graph: that is lesson 9-2.
import { esc, line } from './draw.mjs';
import { control } from './util.mjs';

const COL = 184, X0 = 10, TOP = 10, HEAD = 66, ROW = 24;
const t = (x, y, s, anchor = 'middle', extra = '', size = 14) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}"${extra}>${esc(s)}</text>`;
const box = (x, y, w, h, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" rx="3"/>`;
/** A downward arrow from y1 to y2 (head included) at x. */
const arrow = (x, y1, y2) => `${line(x, y1, x, y2 - 8, 'heavy')}<polygon points="${x - 7},${y2 - 10} ${x + 7},${y2 - 10} ${x},${y2}" fill="#17344b"/>`;

/** The rows a table shows: inputs 0 to 6, or 0 to 3, a gap, and the two inputs ending at the current one when it is past 6. */
const tableInputs = (hours) => (hours <= 6 ? Array.from({ length: 7 }, (_, i) => i) : [0, 1, 2, 3, null, hours - 1, hours]);

function check([rate, start, hours]) {
  const ok = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
  if (!ok(rate, 1, 8) || !ok(start, 0, 12) || !ok(hours, 1, 12)) throw new Error('Rain each hour is 1 to 8, the starting reading 0 to 12 and the hours 1 to 12.');
}

export default {
  kind: 'growth',
  mode: 'table',
  values: [3, 0, 2],
  free: 2,
  controls: () => [
    { ...control('Rain each hour (mm)', 1, 8), labelEs: 'Lluvia cada hora (mm)' },
    { ...control('Starting reading (mm)', 0, 12), labelEs: 'Lectura inicial (mm)' },
    { ...control('Hours', 1, 12), labelEs: 'Horas' },
  ],
  viewBox: '0 0 600 310',
  evaluate: (model, values) => {
    check(values);
    const [rate, start, hours] = values, value = rate * hours + start;
    const equation = `Output = ${rate} × ${hours}${start ? ` + ${start}` : ''} = ${value}`;
    const note = `You choose the hours and the reading responds. Each hour adds ${rate}; at 0 hours the reading is ${start}.`;
    return { value, label: 'Output', unit: '', equation, note };
  },
  visual: (values) => {
    const [rate, start, hours] = values, out = (x) => rate * x + start;
    let body = '';
    // header: the lesson's words for the two columns
    const heads = [['Input (you choose)', 'Hours', 'independent variable'], ['Output (it responds)', 'Reading (mm)', 'dependent variable']];
    heads.forEach((h, i) => {
      const x = X0 + i * COL;
      body += box(x, TOP, COL, HEAD, 'shape-light') + t(x + COL / 2, TOP + 19, h[0]) + t(x + COL / 2, TOP + 41, h[1]) + t(x + COL / 2, TOP + 59, h[2]);
    });
    // rows: the current input is marked by fill, by a heavy outline and by the words "your input"
    tableInputs(hours).forEach((x, r) => {
      const y = TOP + HEAD + r * ROW, now = x === hours;
      for (let i = 0; i < 2; i++) {
        const left = X0 + i * COL;
        body += now ? box(left, y, COL, ROW, 'shape').replace('/>', ' stroke-width="3"/>') : `<rect x="${left}" y="${y}" width="${COL}" height="${ROW}" fill="#ffffff" stroke="#47728c" stroke-width="1" rx="3"/>`;
      }
      if (x === null) return void (body += t(X0 + COL / 2, y + 17, '...') + t(X0 + COL * 1.5, y + 17, '...'));
      body += t(X0 + 52, y + 17, String(x)) + t(X0 + COL * 1.5, y + 17, String(out(x)), 'middle', ' data-cell="output"');
      if (now) body += t(X0 + COL - 8, y + 17, 'your input', 'end');
    });
    // the rule as a flow: input, then the rule in words, then output
    const cx = 494, bx = 399, bw = 190;
    body += box(bx, 14, bw, 50, 'shape-alt') + t(cx, 34, `Input: Hours = ${hours}`) + t(cx, 54, '(you choose it)');
    body += arrow(cx, 64, 94);
    body += box(bx, 96, bw, 62, 'shape-light') + t(cx, 114, 'Rule in words:') + t(cx, 132, `multiply hours by ${rate}`) + t(cx, 150, start ? `then add ${start}` : 'no starting amount');
    body += arrow(cx, 158, 188);
    body += box(bx, 190, bw, 52, 'shape') + t(cx, 210, `Output: Reading = ${out(hours)}`) + t(cx, 230, '(it responds)');
    body += t(300, 274, 'The output depends on the input.', 'middle', '', 16);
    body += t(300, 296, 'Reading (dependent) depends on hours (independent).');
    return body;
  },
  guidance: [
    'The table pairs each input, the hours you choose, with the output, the reading that responds. The marked row is your current input.',
    'Change the hours and watch which row is marked, then change the rain each hour or the starting reading and see how every output changes.',
  ],
};
