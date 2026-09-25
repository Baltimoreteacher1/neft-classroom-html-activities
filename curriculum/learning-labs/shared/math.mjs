// Pure mathematical contracts shared by the model, puzzle game, and tests.
export const fmt = (n) => Number.isInteger(n) ? String(n) : Number(n.toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 });
export const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
export const median = (values) => {
  const s = [...values].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
export function statistics(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
  return { sorted, mean, median: median(sorted), min: sorted[0], max: sorted.at(-1), q1, q3,
    range: sorted.at(-1) - sorted[0], iqr: q3 - q1,
    mad: sorted.reduce((s, x) => s + Math.abs(x - mean), 0) / sorted.length };
}
const control = (label, min, max, step = 1) => ({ label, min, max, step });
export function controls(model) {
  switch (model.kind) {
    case 'array': return [control('Rows', 1, 12), control('Seats or tiles in each row', 1, 12)];
    case 'data': return model.values.map((_, i) => control(`Observation ${i + 1}`, 0, 50));
    case 'decimal': return [control('Price per item ($)', 0.25, 10, 0.25), control('Number of items', 1, 12)];
    case 'division': return [control('Total supply', 1.2, 180, 1.2), control('Amount in each shipment', 0.6, 18, 0.6)];
    case 'ratio': return [control(model.mode === 'compare' ? 'Color paint (cups)' : 'Juice (cups)', 1, 12), control(model.mode === 'compare' ? 'White paint (cups)' : 'Water (cups)', 1, 12)];
    case 'rate': return [control('Pack price ($)', 1, 30), control('Items in pack', 1, 15)];
    case 'conversion': return [control(model.mode === 'scale' ? 'Length (feet)' : 'Length (inches)', 1, 12), control(model.mode === 'scale' ? 'Inches per foot (fixed)' : 'Centimeters per inch (fixed)', model.values[1], model.values[1])];
    case 'growth': return [control(model.mode === 'ratio-graph' ? 'Passengers per carriage' : 'Increase per step', 1, 8), control('Starting amount', 0, model.mode === 'ratio-graph' ? 0 : 12), control(model.mode === 'ratio-graph' ? 'Carriages' : 'Input / step', 1, 12)];
    case 'percent': return [control('Percent', 5, 100, 5), control(model.mode === 'whole' ? 'Known part' : 'Whole amount', 1, 120)];
    case 'area': return model.mode === 'polygon' ? [control('Number of equal sides', 3, 8), control('Length of each side', 1, 12), control('Unused', 3, 3)] : [control(model.mode === 'trapezoid' ? 'First parallel base' : 'Base', 1, 12), control(model.mode === 'trapezoid' ? 'Second parallel base' : 'Perpendicular height', 1, 12), control(model.mode === 'trapezoid' ? 'Perpendicular height' : 'Unused', model.mode === 'trapezoid' ? 1 : 4, model.mode === 'trapezoid' ? 12 : 4)];
    case 'solid': return [control('Length', 1, 10), control('Width', 1, 10), control('Height', 1, 10)];
    case 'fraction': return [control('Supply (whole units)', 0.5, 8, 0.5), control('Serving-size numerator', 1, 5), control('Serving-size denominator', 2, 8)];
    case 'power': return [control('Base', 2, 5), control('Exponent', 1, 5), control('Amount added after the power', 0, 12)];
    case 'expression': return [control('Factor a', 1, 8), control('Constant b', 1, 10), control('Value of x', 1, 10)];
    case 'factors': return [control('First number', 2, 36), control('Second number', 2, 36)];
    case 'line': return [control('First location', -10, 10, 0.5), control('Second location', -10, 10, 0.5)];
    case 'coordinates': return [control('Point A: x', -6, 6), control('Point A: y', -6, 6), control('Point B: x', -6, 6), control('Point B: y', -6, 6)];
    case 'balance': return [control(model.mode === 'add' ? 'Amount added to x' : 'Coefficient multiplying x', 1, 12), control('Right side', 1, 60), control('Candidate value of x', 0, 30, 0.5)];
    case 'inequality': return [control('Boundary', 1, 24), control('Test value', 0, 30)];
    default: throw new Error(`Unknown model: ${model.kind}`);
  }
}
export function evaluate(model, values = model.values, options = {}) {
  const [a, b, c, d] = values;
  let value, label, unit = '', equation, note, extra = {};
  switch (model.kind) {
    case 'array':
      value = a * b; label = 'Total spaces'; unit = 'spaces'; equation = `${a} × ${b} = ${value}`;
      note = `Perimeter: ${2 * (a + b)} units. Count equal rows to find the total.`; break;
    case 'data': {
      extra = statistics(values);
      const key = { histogram: 'range', box: 'median', spread: 'iqr', 'mean-mad': 'mad', outlier: 'median' }[model.mode];
      value = extra[key]; label = { range: 'Range', median: 'Median', iqr: 'Interquartile range', mad: 'Mean absolute deviation' }[key];
      equation = `Mean ${fmt(extra.mean)} · Median ${fmt(extra.median)} · Range ${fmt(extra.range)}`;
      note = `Q1 ${fmt(extra.q1)}, Q3 ${fmt(extra.q3)}, IQR ${fmt(extra.iqr)}, MAD ${fmt(extra.mad)}. Quartiles use the median of each half.`;
      break;
    }
    case 'decimal': value = a * b; label = 'Order total'; unit = 'dollars'; equation = `$${a.toFixed(2)} × ${b} = $${value.toFixed(2)}`; note = `Change from $50: $${(50 - value).toFixed(2)}. A negative result means more money is needed.`; break;
    case 'division': value = a / b; label = 'Equal shipments'; unit = 'shipments'; equation = `${fmt(a)} ÷ ${fmt(b)} = ${fmt(value)}`; note = `Check: ${fmt(value)} × ${fmt(b)} = ${fmt(a)}. The displayed quotient may be rounded.`; break;
    case 'ratio': value = a / b; label = model.mode === 'compare' ? 'Color per cup of white' : 'Juice per cup of water'; unit = 'cups per cup'; equation = `${a}:${b} = ${a / gcd(a, b)}:${b / gcd(a, b)}`; note = `First ingredient to whole: ${a}:${a + b}. ${model.mode === 'compare' ? 'Reference mixture: 3:5 = 0.6 cups per cup. Compare using the same second quantity.' : 'The whole includes both ingredients. Scaling both amounts by the same factor keeps the recipe equivalent.'}`; break;
    case 'rate': value = a / b; label = 'Unit price'; unit = 'dollars per item'; equation = `$${a} ÷ ${b} = $${fmt(value)} per item`; note = `Reference offer: 6 items for $10 → $${fmt(10 / 6)} per item. Compare unrounded values when prices are close.`; break;
    case 'conversion': value = a * b; label = 'Converted length'; unit = model.mode === 'scale' ? 'inches' : 'centimeters'; equation = `${fmt(a)} × ${b} = ${fmt(value)}`; note = model.mode === 'scale' ? '1 foot = exactly 12 inches. Divide inches by 12 to convert back.' : '1 inch = exactly 2.54 centimeters. Divide centimeters by 2.54 to convert back.'; break;
    case 'growth': value = a * c + b; label = 'Output'; equation = `y = ${a}x + ${b}; when x = ${c}, y = ${value}`; note = `At x = 0, y = ${b}. Every increase of 1 in x adds ${a} to y.`; extra = { points: Array.from({ length: 7 }, (_, x) => [x, a * x + b]) }; break;
    case 'percent':
      value = model.mode === 'whole' ? b / (a / 100) : a / 100 * b;
      label = model.mode === 'whole' ? 'Recovered whole' : model.mode === 'discount' ? 'Discount' : 'Shaded amount';
      equation = model.mode === 'whole' ? `${b} ÷ (${a} ÷ 100) = ${fmt(value)}` : `${a}% of ${b} = ${fmt(value)}`;
      note = model.mode === 'discount' ? `Final price: $${fmt(b - value)}. The discount is subtracted from the original price.` : `${a}% = ${a / 100} = ${a / gcd(a, 100)}/${100 / gcd(a, 100)}. ${model.mode === 'whole' ? 'Check the part by multiplying the whole by the decimal percent.' : 'The hundred grid always shows the percentage; the whole amount can change.'}`; break;
    case 'area':
      if (model.mode === 'trapezoid') { value = (a + b) * c / 2; equation = `(${a} + ${b}) × ${c} ÷ 2 = ${fmt(value)}`; }
      else if (model.mode === 'polygon') { extra.apothem = b / (2 * Math.tan(Math.PI / a)); value = a * b * extra.apothem / 2; equation = `${a} × ${b} × ${fmt(extra.apothem)} ÷ 2 ≈ ${fmt(value)}`; }
      else { value = a * b / 2; equation = `${a} × ${b} ÷ 2 = ${fmt(value)}`; }
      label = 'Area'; unit = 'square units'; note = model.mode === 'polygon' ? 'Apothem is the perpendicular distance from center to a side. Values are rounded where needed.' : model.mode === 'trapezoid' ? 'Average the two parallel bases, then multiply by perpendicular height.' : `A parallelogram with this base and height has area ${a * b}. The triangle has half as much area.`; break;
    case 'solid':
      extra = { volume: a * b * c, prismArea: 2 * (a * b + a * c + b * c), pyramidArea: a * a + 2 * a * c };
      value = model.mode === 'surface' ? extra.prismArea : extra.volume; label = model.mode === 'surface' ? 'Prism surface area' : 'Volume'; unit = model.mode === 'surface' ? 'square units' : 'cubic units';
      equation = model.mode === 'surface' ? `2(${a}×${b} + ${a}×${c} + ${b}×${c}) = ${value}` : `${a} × ${b} × ${c} = ${value}`;
      note = model.mode === 'surface' ? 'The net has three pairs of congruent rectangles. Add the areas of all six faces.' : `One layer has ${a * b} cubes; ${c} layers give ${value} cubes. Surface area is ${extra.prismArea} square units.`;
      if (options.shape === 'pyramid') {
        extra.shape = 'pyramid'; extra.validShape = c > a / 2;
        value = extra.pyramidArea; label = 'Pyramid surface area';
        equation = extra.validShape ? `${a}² + 4 × (${a} × ${c} ÷ 2) = ${value} square units` : 'These dimensions do not form a non-flat right square pyramid.';
        note = extra.validShape ? `One square base and four congruent triangular faces. Each triangle has base ${a} and perpendicular slant height ${c}; slant height is not the vertical height of the solid.` : `Choose a slant height greater than half the base side (${fmt(a / 2)}).`;
      }
      break;
    case 'fraction': value = a / (b / c); label = 'Number of portions'; unit = 'portions'; equation = `${fmt(a)} ÷ (${b}/${c}) = ${fmt(value)}`; extra = { full: Math.floor(value + 1e-10), remainder: a - Math.floor(value + 1e-10) * b / c }; note = `${extra.full} complete portions; ${fmt(extra.remainder)} units remain. Check: quotient × ${b}/${c} = ${fmt(a)}. A fractional quotient is meaningful even when only whole portions are usable.`; break;
    case 'power': value = a ** b + c; label = 'Expression value'; equation = `${c} + ${a}^${b} = ${fmt(value)}`; note = `${a}^${b} means ${Array(b).fill(a).join(' × ')} = ${a ** b}. Evaluate the power before adding ${c}.`; break;
    case 'expression': value = a * (c + b); label = 'Both expression values'; equation = `${a}(${c} + ${b}) = ${a}×${c} + ${a}×${b} = ${value}`; note = `a(x + b) = ax + ab. Here a = ${a}, b = ${b}, x = ${c}. Distribution changes the form, not the value.`; break;
    case 'factors':
      extra = { first: Array.from({ length: a }, (_, i) => i + 1).filter(n => a % n === 0), second: Array.from({ length: b }, (_, i) => i + 1).filter(n => b % n === 0), gcf: gcd(a, b), lcm: a * b / gcd(a, b) };
      value = model.mode === 'lcm' ? extra.lcm : extra.gcf; label = model.mode === 'lcm' ? 'Least common multiple' : 'Greatest common factor'; equation = `GCF(${a}, ${b}) = ${extra.gcf}; LCM(${a}, ${b}) = ${extra.lcm}`; note = `${a} + ${b} = ${extra.gcf}(${a / extra.gcf} + ${b / extra.gcf}). A factor divides a number; a multiple is a product of the number and a whole number.`; break;
    case 'line': value = model.mode === 'opposites' ? Math.abs(a) : Math.abs(a - b); label = model.mode === 'opposites' ? 'Distance of first point from zero' : 'Distance between locations'; unit = 'units'; equation = model.mode === 'opposites' ? `|${a}| = ${value}; opposite = ${-a}` : `|${a} − (${b})| = ${value}`; note = `${a} ${a < b ? '<' : a > b ? '>' : '='} ${b}. Absolute values: ${Math.abs(a)} and ${Math.abs(b)}. Farther right means greater.`; break;
    case 'coordinates':
      extra = { width: Math.abs(c - a), height: Math.abs(d - b), reflectedX: [a, -b], reflectedY: [-a, b] };
      value = model.mode === 'rectangle' ? extra.width * extra.height : model.mode === 'distance' ? extra.width + extra.height : Math.abs(a - c) + Math.abs(b - d);
      label = model.mode === 'rectangle' ? 'Rectangle area' : 'Street-route distance'; unit = model.mode === 'rectangle' ? 'square units' : 'units';
      equation = model.mode === 'rectangle' ? `${extra.width} × ${extra.height} = ${value}; perimeter = ${2 * (extra.width + extra.height)}` : `Horizontal ${extra.width} + vertical ${extra.height} = ${value}`;
      note = ['reflect', 'symmetry'].includes(model.mode) ? `A reflected in x-axis: (${a}, ${-b}); in y-axis: (${-a}, ${b}). B is your movable comparison point.` : `A (${a}, ${b}), B (${c}, ${d}). ${extra.width && extra.height ? 'The displayed distance follows horizontal and vertical streets, not the diagonal.' : 'The two points share an axis-aligned street.'}`; break;
    case 'balance': {
      const lhs = model.mode === 'add' ? c + a : a * c;
      value = lhs - b; label = 'Left minus right'; equation = `${model.mode === 'add' ? `${c} + ${a}` : `${a} × ${c}`} ${Math.abs(value) < 1e-9 ? '=' : '≠'} ${b}`;
      note = `Left side ${fmt(lhs)}, right side ${b}. A solution makes the difference zero. Use the same operation on both sides.`; extra = { lhs, rhs: b }; break;
    }
    case 'inequality': {
      const symbol = options.symbol || (model.mode === 'entry' ? '>=' : '<=');
      const pass = { '>=': b >= a, '>': b > a, '<=': b <= a, '<': b < a }[symbol];
      value = b; label = 'Test value'; equation = `x ${symbol.replace('>=', '≥').replace('<=', '≤')} ${a}; x = ${b} ${pass ? 'qualifies' : 'does not qualify'}`;
      note = `${symbol.includes('=') ? 'Closed' : 'Open'} circle at ${a}: the boundary ${symbol.includes('=') ? 'is included' : 'is excluded'}.`; extra = { pass, symbol }; break;
    }
    default: throw new Error(`Unknown model ${model.kind}`);
  }
  if (!Number.isFinite(value)) throw new Error('The model needs finite numerical inputs.');
  return { value, label, unit, equation, note, ...extra };
}

// Constructible puzzles: targets are derived from valid hidden control settings.
// A solution is checked against the mathematical relationship, never a click count.
export function puzzle(model, round, level) {
  const base = [...model.values], fields = controls(model);
  let free = model.kind === 'data' ? 3 : model.kind === 'balance' ? 2 : model.kind === 'growth' ? 2 : model.kind === 'coordinates' ? 2 : model.kind === 'inequality' ? 1 : 0;
  let goal = [...base];
  const f = fields[free], steps = Math.round((f.max - f.min) / f.step);
  goal[free] = Number((f.min + ((round * 3 + level * 2 + 3) % (steps + 1)) * f.step).toFixed(6));
  if (model.kind === 'balance') {
    goal[free] = 4 + round * 2 + level;
    base[1] = goal[1] = model.mode === 'add' ? goal[2] + goal[0] : goal[2] * goal[0];
  }
  if (model.kind === 'data') { free = model.mode === 'histogram' ? 7 : 3; goal[free] = 2 + 3 * round + level; }
  if (model.kind === 'coordinates' && model.mode === 'distance') base[3] = goal[3] = base[1];
  if (model.kind === 'coordinates' && ['reflect', 'symmetry'].includes(model.mode)) {
    free = round % 2 ? 1 : 0;
    base[2] = 1 + round; base[3] = 2 + level;
    goal = [...base]; goal[free] = -base[free + 2]; goal[1 - free] = base[3 - free];
    base[1 - free] = goal[1 - free];
  }
  const target = evaluate(model, goal).value;
  if (Math.abs(evaluate(model, base).value - target) < 1e-8) {
    base[free] = goal[free] === fields[free].min ? fields[free].max : fields[free].min;
  }
  return { start: base, free, goal, target, metric: evaluate(model, goal).label,
    tolerance: Math.max(1e-6, Math.abs(target) * 1e-9) };
}

export function numericAnswer(value) {
  const s = String(value).trim().replace(/−/g, '-').replace(/,/g, '');
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return Number(s);
  const mixed = s.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed && Number(mixed[3])) return Number(mixed[1]) + (mixed[1].startsWith('-') ? -1 : 1) * Number(mixed[2]) / Number(mixed[3]);
  const fraction = s.match(/^([+-]?\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2])) return Number(fraction[1]) / Number(fraction[2]);
  return NaN;
}
