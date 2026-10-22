// data:median - The ordered dot plot: the median is found by counting in from both ends, crossing off one value from each end (2-3).
// One control per observation (0-50, as the data:box model it replaces), 3 to 9 observations. The readout is the median:
// the middle value when the count is odd, the value halfway between the two middle values when it is even.
import { fmt, median, control } from './util.mjs';
import { line, text } from './draw.mjs';

const MIN_COUNT = 3, MAX_COUNT = 9, LOW = 0, HIGH = 50;
const INK = '#17344b', MUTED = '#4a5a68', RULE = '#47728c';

const sortedOf = (values) => [...values].sort((a, b) => a - b);
/** 0-based positions of the middle value(s) of an ordered list of n values. */
const middleOf = (n) => (n % 2 ? [(n - 1) / 2] : [n / 2 - 1, n / 2]);

function check(values) {
  if (!Array.isArray(values) || values.length < MIN_COUNT || values.length > MAX_COUNT)
    throw new Error(`The median model needs ${MIN_COUNT} to ${MAX_COUNT} observations.`);
  for (const v of values)
    if (!Number.isFinite(v) || v < LOW || v > HIGH) throw new Error(`Every observation must be a number from ${LOW} to ${HIGH}.`);
}

function evaluate(model, values) {
  check(values);
  const sorted = sortedOf(values), n = sorted.length, mid = middleOf(n), m = median(sorted);
  const list = sorted.map(fmt).join(', ');
  const [lo, hi] = [sorted[mid[0]], sorted[mid.at(-1)]];
  const per = (n - 1) / 2;
  const equation = n % 2 ? `${list}: median = ${fmt(m)}` : `${list}: median = (${fmt(lo)} + ${fmt(hi)}) ÷ 2 = ${fmt(m)}`;
  const note = n % 2
    ? `Cross off one value from each end until one is left. The middle value, ${fmt(m)}, is the median: ${per} ${per === 1 ? 'value is' : 'values are'} on each side.`
    : lo === hi
      ? `Cross off one value from each end until two are left. Both middle values are ${fmt(lo)}, so the median is ${fmt(m)}.`
      : `Cross off one value from each end until two are left. The median is halfway between the middle values, ${fmt(lo)} and ${fmt(hi)}.`;
  return { value: m, label: 'Median', unit: '', equation, note, sorted, middle: mid, median: m };
}

/** The dot plot: one dot per observation, stacked when equal; the middle value(s) are ringed. */
function dotPlot(sorted, mid, m, axisMax) {
  const sx = (v) => 40 + (v / axisMax) * 640, base = 170;
  const step = axisMax / 10;
  let out = line(40, base, 680, base, '');
  for (let t = 0; t <= axisMax; t += step) out += line(sx(t), base, sx(t), base + 8, '') + text(sx(t), base + 28, fmt(t));
  const x = sx(m), anchor = x < 110 ? 'start' : x > 610 ? 'end' : 'middle';
  out += `<line x1="${x}" y1="44" x2="${x}" y2="${base}" class="dashed"/>`;
  out += `<text x="${x}" y="36" text-anchor="${anchor}" font-size="15">${`median = ${fmt(m)}`}</text>`;
  const seen = new Map();
  sorted.forEach((v, i) => {
    const level = seen.get(v) || 0;
    seen.set(v, level + 1);
    const cy = base - 10 - level * 13, ring = mid.includes(i);
    out += `<circle cx="${sx(v)}" cy="${cy}" r="6" class="${ring ? 'point-alt' : 'point'}"${ring ? ' style="stroke:#17344b;stroke-width:3"' : ''}/>`;
  });
  out += text(40, 16, 'Each dot is one observation', 'start').replace('<text', '<text font-size="14"');
  out += `<circle cx="470" cy="12" r="6" class="point-alt" style="stroke:${INK};stroke-width:3"/>`;
  out += text(484, 17, 'middle of the ordered list', 'start').replace('<text', '<text font-size="14"');
  return out;
}

/** The same values written in order, crossed off in pairs from both ends, with the middle highlighted. */
function orderedRow(sorted, mid) {
  const n = sorted.length, pairs = mid.length === 1 ? (n - 1) / 2 : n / 2 - 1, pitch = Math.min(72, Math.floor(660 / n));
  const x0 = (720 - n * pitch) / 2, top = 236, bottom = 280;
  const cx = (i) => x0 + i * pitch + pitch / 2;
  let out = '';
  out += text(x0 + 3, 226, 'smallest', 'start').replace('<text', '<text font-size="14"');
  out += text(x0 + n * pitch - 3, 226, 'largest', 'end').replace('<text', '<text font-size="14"');
  out += text((cx(mid[0]) + cx(mid.at(-1))) / 2, 226, mid.length === 1 ? 'middle' : 'middle two').replace('<text', '<text font-size="14"');
  sorted.forEach((v, i) => {
    const isMid = mid.includes(i), x = x0 + i * pitch + 3, w = pitch - 6;
    out += isMid
      ? `<rect x="${x}" y="${top}" width="${w}" height="${bottom - top}" rx="3" class="shape" style="stroke:${INK};stroke-width:3"/>`
      : `<rect x="${x}" y="${top}" width="${w}" height="${bottom - top}" rx="3" style="fill:#e6ecf0;stroke:#9aa9b5;stroke-width:1.5"/>`;
    // the strike goes in before the number, thin, so a crossed-off value stays readable
    if (!isMid) out += `<line x1="${x + 5}" y1="${bottom - 5}" x2="${x + w - 5}" y2="${top + 5}" style="stroke:${MUTED};stroke-width:1.5"/>`;
    out += `<text x="${cx(i)}" y="265" text-anchor="middle" font-size="20" style="fill:${isMid ? INK : MUTED}">${fmt(v)}</text>`;
  });
  for (let k = 1; k <= pairs; k++) {
    const l = cx(k - 1), r = cx(n - k), y = 280 + (pairs - k + 1) * 20, c = (l + r) / 2;
    const arm = (px) => `<line x1="${px}" y1="290" x2="${px}" y2="${y}" style="stroke:${RULE};stroke-width:2.5"/><polygon points="${px - 5},291 ${px + 5},291 ${px},283" style="fill:${RULE}"/>`;
    out += arm(l) + arm(r) + `<line x1="${l}" y1="${y}" x2="${r}" y2="${y}" style="stroke:${RULE};stroke-width:2.5"/>`;
    out += `<rect x="${c - 25}" y="${y - 10}" width="50" height="20" rx="4" style="fill:#fff;stroke:${RULE};stroke-width:1.5"/>`;
    out += `<text x="${c}" y="${y + 5}" text-anchor="middle" font-size="14">pair ${k}</text>`;
  }
  return out;
}

function visual(values, r) {
  const { sorted, middle, median: m } = r;
  const n = sorted.length, axisMax = Math.max(10, Math.ceil(sorted.at(-1) / 10) * 10);
  let out = dotPlot(sorted, middle, m, axisMax) + orderedRow(sorted, middle);
  const lo = sorted[middle[0]], hi = sorted[middle.at(-1)];
  out += text(360, 392, 'Cross off one from each end, pair by pair, to reach the middle.');
  out += text(360, 414, n % 2
    ? `The middle value is ${fmt(m)}: ${(n - 1) / 2} ${n === 3 ? 'value' : 'values'} on each side.`
    : lo === hi ? `Both middle values are ${fmt(lo)}, so the median is ${fmt(m)}.` : `Two middle values: ${fmt(lo)} and ${fmt(hi)}. Halfway between them is ${fmt(m)}.`);
  return out;
}

/**
 * A mission round: seven (or n - 1) other observations, one unlocked observation, and a target median that exactly one or two settings
 * of that observation reach, so the student plans it by ordering the others and counting in, never by sweeping the slider.
 */
function round(model, round, level) {
  const n = model.values.length, free = Math.min(3, n - 1);
  let seed = round * 7 + level * 13 + 5;
  const next = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  const medianWith = (vals, x) => median(vals.map((v, i) => (i === free ? x : v)));
  for (let attempt = 0; attempt < 60; attempt++) {
    const base = model.values.map(() => Math.floor(next() * 47) + 2);
    const hits = (t) => Array.from({ length: HIGH - LOW + 1 }, (_, y) => y).filter((y) => medianWith(base, y) === t).length;
    const goals = [];
    for (let x = LOW + 1; x < HIGH; x++) {
      const t = medianWith(base, x);
      if (hits(t) <= 2) goals.push(x);
    }
    if (!goals.length) continue;
    const x = goals[Math.floor(next() * goals.length)], t = medianWith(base, x);
    const starts = Array.from({ length: HIGH - LOW + 1 }, (_, y) => y).filter((y) => medianWith(base, y) !== t && Math.abs(y - x) >= 3);
    if (!starts.length) continue;
    const goal = [...base];
    goal[free] = x;
    base[free] = starts[Math.floor(next() * starts.length)];
    return { base, goal, free };
  }
  throw new Error('no plannable median round found');
}

export default {
  kind: 'data',
  mode: 'median',
  values: [17, 7, 5, 19, 13, 6, 4, 21],
  controls: (model) => {
    check(model.values);
    return model.values.map((_, i) => ({ ...control(`Observation ${i + 1}`, LOW, HIGH), labelEs: `Observación ${i + 1}` }));
  },
  evaluate,
  visual,
  viewBox: '0 0 720 430',
  guidance: [
    'Each dot is one observation. Below, the same values are written in order and crossed off in pairs from both ends until the middle is left.',
    'Change one observation and watch where it lands in the ordered list and whether the median moves.',
  ],
  free: 3,
  round,
};
