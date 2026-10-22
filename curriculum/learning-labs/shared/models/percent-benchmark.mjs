// percent:benchmark - Double number line in benchmark jumps of 10%, 25% and 50%, with compatible numbers (4-3, estimating a percent of a number).
// Controls and readout match percent:discount (Percent 0-100, Whole amount 1-120, readout = percent/100 x whole). The picture estimates:
// it marks the benchmarks computed from the whole and points out the nearest one as the place to start; the exact amount is the check.
import { control, fmt } from './util.mjs';
import { line, text, rect } from './draw.mjs';

const L = 96, W = 464;                          // percent 0 sits at x = L, percent 100 at x = L + W
const x = (p) => L + p * W / 100;
const MARKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 25, 75];   // every benchmark percent reached by jumps of 10%, 25% or 50%
const JUMPS = [[10, 10], [25, 4], [50, 2]];     // [size of the jump in percent, how many jumps make the whole]
const AMOUNT_Y = 52, PERCENT_Y = 112;

/** The benchmark percents closest to p (two of them when p sits exactly halfway between two benchmarks). */
export function nearestBenchmarks(p) {
  const marks = p === 0 ? [0] : MARKS.filter((m) => m > 0);   // 0% is no jump to start from, except when the percent itself is 0
  const gap = Math.min(...marks.map((m) => Math.abs(m - p)));
  return marks.filter((m) => Math.abs(m - p) === gap).sort((a, b) => a - b);
}
const clampX = (cx, label) => { const half = label.length * 4.4; return Math.min(Math.max(cx, 8 + half), 592 - half); };
const tick = (cx, y, up) => line(cx, y - up, cx, y + up);

/** The compatible-number sentence: round an awkward whole to a friendly one, then take 10% of that. */
function friendly(w) {
  if (w % 10 === 0) return `${fmt(w)} is a friendly whole: 10% of ${fmt(w)} is ${fmt(w / 10)}`;
  if (w < 10) return `10% of ${fmt(w)} is ${fmt(w / 10)}: move the decimal point one place left`;
  const f = Math.round(w / 10) * 10;
  return `${fmt(w)} is awkward. Compatible number: ${fmt(f)}. 10% of ${fmt(f)} is ${fmt(f / 10)}`;
}

export default {
  kind: 'percent',
  mode: 'benchmark',
  values: [20, 60],
  controls: () => [
    { label: 'Percent', labelEs: 'Porcentaje', min: 0, max: 100, step: 1 },
    { label: 'Whole amount', labelEs: 'Cantidad total', min: 1, max: 120, step: 1 },
  ],
  evaluate: (model, values) => {
    const [p, w] = values;
    if (!(p >= 0 && p <= 100) || !(w >= 1 && w <= 120)) throw new Error('Percent must be 0 to 100 and the whole amount 1 to 120.');
    const value = p * w / 100;
    const near = nearestBenchmarks(p), estimates = near.map((b) => b * w / 100);
    const note = near.length === 2
      ? `Estimate: ${p}% is halfway between ${near[0]}% and ${near[1]}%, so start from either (${fmt(estimates[0])} or ${fmt(estimates[1])}). The exact amount checks it.`
      : `Estimate: start from the benchmark ${near[0]}%, which is ${fmt(estimates[0])}. The exact amount checks the estimate.`;
    return { value, label: 'Exact amount', unit: '', equation: `${p}% of ${fmt(w)} = ${fmt(value)}`, note, near, estimates };
  },
  visual: (values, result) => {
    const [p, w] = values;
    const near = result.near, est = result.estimates;
    let b = text(6, AMOUNT_Y + 5, 'Amount', 'start') + text(6, PERCENT_Y + 5, 'Percent', 'start');
    // the double number line: benchmarks of 25% are labelled, jumps of 10% are the short marks between them
    b += line(x(0), AMOUNT_Y, x(100), AMOUNT_Y) + line(x(0), PERCENT_Y, x(100), PERCENT_Y);
    for (let t = 0; t <= 100; t += 10) b += tick(x(t), AMOUNT_Y, 5) + tick(x(t), PERCENT_Y, 5);
    for (const q of [0, 25, 50, 75, 100]) {
      b += tick(x(q), AMOUNT_Y, 9) + tick(x(q), PERCENT_Y, 9);
      b += text(x(q), AMOUNT_Y - 16, fmt(q * w / 100)) + text(x(q), PERCENT_Y + 28, `${q}%`);
    }
    // the nearest benchmark (two when the percent is exactly halfway) is ringed on both lines
    for (const m of near) b += `<circle cx="${x(m)}" cy="${AMOUNT_Y}" r="10" class="open-point"/><circle cx="${x(m)}" cy="${PERCENT_Y}" r="10" class="open-point"/>`;
    // the student's percent and the amount that sits above it
    const exact = fmt(result.value), tag = `${p}% of ${fmt(w)} is ${exact}`;
    b += line(x(p), AMOUNT_Y, x(p), PERCENT_Y, 'solution');
    b += `<circle cx="${x(p)}" cy="${AMOUNT_Y}" r="7" class="point"/><circle cx="${x(p)}" cy="${PERCENT_Y}" r="7" class="point"/>`;
    b += x(p) <= 330 ? text(x(p) + 14, 86, tag, 'start') : text(x(p) - 14, 86, tag, 'end');
    // the pointer to the starting benchmark
    const start = near.length === 2
      ? `${p}% is halfway between ${near[0]}% (${fmt(est[0])}) and ${near[1]}% (${fmt(est[1])})`
      : near[0] === p ? `${p}% is a benchmark: ${p}% of ${fmt(w)} is ${fmt(est[0])}`
        : `Start from ${near[0]}%: ${near[0]}% of ${fmt(w)} is ${fmt(est[0])}`;
    b += text(clampX(x(near.reduce((s, m) => s + m, 0) / near.length), start), 168, start);
    // the benchmark jumps, computed from the whole; filled pieces are the whole jumps that fit inside the student's percent
    b += text(L, 196, `Benchmark jumps of the whole (${fmt(w)})`, 'start');
    JUMPS.forEach(([size, count], i) => {
      const y = 222 + i * 38, full = Math.floor(p / size);
      b += text(L, y, `${size}% = whole ÷ ${count} = ${fmt(w / count)}`, 'start') + text(L + W, y, `${full} jump${full === 1 ? '' : 's'} = ${full * size}%`, 'end');
      for (let k = 0; k < count; k++) b += rect(x(k * size) + 1, y + 6, W * size / 100 - 2, 14, k < full ? 'shape' : 'shape-light');
    });
    b += text(L, 336, friendly(w), 'start');
    return b;
  },
  viewBox: '0 0 600 350',
  guidance: [
    'The double number line puts amounts above and percents below. Benchmark jumps of 10%, 25% and 50% are computed from the whole, and the ringed benchmark is the nearest one to your percent.',
    'Pick a percent that is not a benchmark, such as 18% or 62%. Say which benchmark you would start from, estimate, then compare with the exact amount.',
  ],
};
