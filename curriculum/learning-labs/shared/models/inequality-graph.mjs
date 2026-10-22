// inequality:graph - Number-line graph of an inequality (8-5, "Understand Inequalities and Their Solutions").
// Same controls and extras as inequality:entry (boundary 1-24, test value 0-30; evaluate(model, values, { symbol }) -> pass, symbol), so the
// 8-5 bench and the mission game's pass/fail goals stay valid. With no Rule chosen it reads "x <= boundary", as every inequality mode but
// "entry" does in mountModel and in the bench drivers (tools/verify-studio-lab-browser.mjs). The picture is the graph a student draws on paper: a circle on the boundary
// (open when it is not included, closed when it is), a shaded ray with an arrowhead toward the solutions, and the test value as a marker
// that says in words whether it is in the shaded part.
import { esc, line } from './draw.mjs';
import { control } from './util.mjs';

const SYMBOLS = ['>=', '>', '<=', '<'];
const SHOWN = { '>=': '≥', '>': '>', '<=': '≤', '<': '<' };
const MIN = -3, MAX = 33, LEFT = 14, SPAN = 572, AXIS = 150;
const sx = (n) => LEFT + ((n - MIN) / (MAX - MIN)) * SPAN;
const CHAR = 8.4; // average width of one bold 14px character, used to keep labels inside the picture
const t = (x, y, s, anchor = 'middle', size = 14) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${esc(s)}</text>`;
/** A label centred on x, nudged so that it stays inside the picture. */
const centred = (x, y, s) => t(Math.min(596 - (s.length * CHAR) / 2, Math.max(4 + (s.length * CHAR) / 2, x)), y, s);

export default {
  kind: 'inequality',
  mode: 'graph',
  values: [9, 14],
  free: 1,
  controls: () => [
    { ...control('Boundary', 1, 24), labelEs: 'Límite' },
    { ...control('Test value', 0, 30), labelEs: 'Valor de prueba' },
  ],
  viewBox: '0 0 600 262',
  evaluate: (model, values, options = {}) => {
    const [a, b] = values, symbol = options.symbol || '<=';  // the studio's own default Rule for every inequality mode but "entry"
    if (!SYMBOLS.includes(symbol)) throw new Error(`The rule must be one of ${SYMBOLS.join(', ')}.`);
    if (!Number.isInteger(a) || a < 1 || a > 24 || !Number.isInteger(b) || b < 0 || b > 30) throw new Error('The boundary is 1 to 24 and the test value 0 to 30.');
    const pass = { '>=': b >= a, '>': b > a, '<=': b <= a, '<': b < a }[symbol];
    const closed = symbol.includes('=');
    const equation = `x ${SHOWN[symbol]} ${a}; x = ${b} ${pass ? 'qualifies' : 'does not qualify'}`;
    const note = `${closed ? 'Closed' : 'Open'} circle at ${a}: the boundary ${closed ? 'is included' : 'is not included'}. The test value ${b} is ${pass ? 'in' : 'outside'} the shaded part.`;
    return { value: b, label: 'Test value', unit: '', equation, note, pass, symbol };
  },
  visual: (values, result) => {
    const [a, b] = values, { symbol, pass } = result;
    const closed = symbol.includes('='), right = symbol.startsWith('>'), xa = sx(a), xb = sx(b);
    let body = t(300, 26, `Graph of x ${SHOWN[symbol]} ${a}`, 'middle', 18);

    // the number line: whole-number ticks, labels every 5, and the boundary named in place of the tick label beside it
    body += line(LEFT, AXIS, LEFT + SPAN, AXIS);
    for (let n = MIN; n <= MAX; n++) {
      const major = n % 5 === 0;
      body += line(sx(n), AXIS - (major ? 8 : 4), sx(n), AXIS + (major ? 8 : 4));
      if (major && n >= 0 && n <= 30 && Math.abs(n - a) > 1) body += t(sx(n), 178, String(n));
    }
    body += t(xa, 178, String(a));

    // the shaded ray: thick line from the boundary to an arrowhead that points toward the solutions
    const tip = right ? 594 : 6, base = right ? 578 : 22;
    body += line(xa, AXIS, base, AXIS, 'solution');
    body += `<polygon points="${base},${AXIS - 10} ${base},${AXIS + 10} ${tip},${AXIS}" fill="#075f80"/>`;
    body += `<circle cx="${xa}" cy="${AXIS}" r="10" class="${closed ? 'point' : 'open-point'}"/>`;

    // the test value: a marker above the line, drawn solid when it qualifies and hollow when it does not, always named in words
    const mark = pass ? 'class="point-alt"' : 'fill="#ffffff" stroke="#a84820" stroke-width="3"';
    body += `<polygon points="${xb - 9},118 ${xb + 9},118 ${xb},138" ${mark}/>`;
    body += centred(xb, 76, `test value: ${b}`) + centred(xb, 98, pass ? 'qualifies' : 'does not qualify');

    // the labels that say what the picture means
    body += centred(xa, 202, closed ? 'closed circle: included' : 'open circle: not included');
    const from = right ? xa + 14 : 8, to = right ? 592 : xa - 14;
    if (to - from >= 20) body += line(from, 218, to, 218) + line(from, 212, from, 224) + line(to, 212, to, 224);
    body += centred((from + to) / 2, 246, 'solutions');
    return body;
  },
  guidance: [
    'The shaded ray with the arrowhead shows every value that makes the rule true. An open circle leaves the boundary out; a closed circle keeps it in.',
    'Move the test value onto the ray and off it, and test the boundary number itself. Change the Rule to see the circle and the ray change.',
  ],
};
