// Representation Bridge: the mathematics, with no DOM. One declaration per model family (keyed `kind:mode`) names the
// quantities, the domain, the invariant, the valid and invalid transformations, and the misconceptions each invalid one
// shows. `describe(values)` builds every representation from the SAME values; `test(values, id, param)` applies one
// transformation and says, with exact arithmetic, whether the relationship survived and why.
// Whole numbers only: fractions are exact {n, d} pairs, never floats.

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

export function frac(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new RangeError('A fraction needs whole numbers and a denominator that is not zero.');
  const g = gcd(n, d) || 1;
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: Math.abs(d) / g };
}
export const fadd = (x, y) => frac(x.n * y.d + y.n * x.d, x.d * y.d);
export const fsub = (x, y) => frac(x.n * y.d - y.n * x.d, x.d * y.d);
export const fmul = (x, y) => frac(x.n * y.n, x.d * y.d);
export const fdiv = (x, y) => frac(x.n * y.d, x.d * y.n);
export const feq = (x, y) => x.n === y.n && x.d === y.d;
/** "7/2" or "3"; a minus sign is the real minus (U+2212). */
export const fstr = (x) => String(x.d === 1 ? x.n : `${x.n}/${x.d}`).replace('-', '−');
/** Exact decimal text when the fraction terminates within 4 places, otherwise rounded with a leading "about". */
export function fdec(x) {
  const scaled = x.n * 10000;
  if (scaled % x.d === 0) return String(scaled / x.d / 10000).replace('-', '−');
  return `about ${(x.n / x.d).toFixed(2)}`.replace('-', '−');
}

const int = (v, lo, hi, name) => {
  if (!Number.isInteger(v) || v < lo || v > hi) throw new RangeError(`${name} must be a whole number from ${lo} to ${hi}.`);
  return v;
};
const row = (label, ...cells) => ({ label, cells });
const SUP = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵' };
const times = (b, e) => Array(e).fill(b).join(' × ');

// ---------------------------------------------------------------------------------------------------------------------
const ratioMixer = {
  key: 'ratio:mixer',
  quantities: [{ id: 'juice', name: 'Juice', nameEs: 'Jugo', unit: 'cups', unitEs: 'tazas', color: 'a' }, { id: 'water', name: 'Water', nameEs: 'Agua', unit: 'cups', unitEs: 'tazas', color: 'b' }],
  domain: 'Juice and water are whole numbers of cups from 1 to 12.',
  domainEs: 'El jugo y el agua se expresan en tazas enteras del 1 al 12.',
  invariants: ['Juice ÷ water stays the same when both amounts are multiplied by the same number.'],
  invariantsEs: ['Jugo ÷ agua se mantiene igual cuando ambas cantidades se multiplican por el mismo número.'],
  representations: ['model', 'table', 'equation', 'words'],
  representationsEs: ['modelo', 'tabla', 'ecuación', 'palabras'],
  transformations: [
    { id: 'scale', label: 'Multiply both amounts by', labelEs: 'Multiplica ambas cantidades por', question: 'Will the recipe stay equivalent (the same juice-to-water ratio)?', questionEs: '¿La receta seguirá siendo equivalente (la misma razón de jugo a agua)?', param: { label: 'Factor', labelEs: 'Factor', min: 2, max: 6, value: 2 } },
    { id: 'add', label: 'Add the same number of cups to both by', labelEs: 'Suma la misma cantidad de tazas a ambos', question: 'Will the recipe stay equivalent (the same juice-to-water ratio)?', questionEs: '¿La receta seguirá siendo equivalente (la misma razón de jugo a agua)?', param: { label: 'Cups', labelEs: 'Tazas', min: 1, max: 6, value: 2 } },
    { id: 'one', label: 'Add this many cups to juice only:', labelEs: 'Suma estas tazas solo al jugo:', question: 'Will the recipe stay equivalent (the same juice-to-water ratio)?', questionEs: '¿La receta seguirá siendo equivalente (la misma razón de jugo a agua)?', param: { label: 'Cups', labelEs: 'Tazas', min: 1, max: 6, value: 1 } },
  ],
  misconceptions: [
    { id: 'additive-ratio', name: 'Adding the same amount to both keeps the ratio', nameEs: 'Sumar lo mismo a ambos mantiene la razón', response: 'Equivalent ratios come from multiplying both amounts by the same factor, not from adding.', responseEs: 'Las razones equivalentes se forman al multiplicar ambas cantidades por el mismo factor, no al sumarlas.' },
    { id: 'one-quantity', name: 'Changing one amount leaves the recipe the same', nameEs: 'Cambiar una cantidad deja igual la receta', response: 'If only one amount changes, the amount of water for each cup of juice changes.', responseEs: 'Si solo cambia una cantidad, cambia cuánta agua corresponde a cada taza de jugo.' },
    { id: 'part-whole', name: 'Juice to water and juice to the whole drink are the same comparison', nameEs: 'Jugo a agua y jugo al total son la misma comparación', response: 'Juice to water compares two parts. Juice to the whole drink compares a part with the total, so the second number is bigger.', responseEs: 'Jugo a agua compara dos partes. Jugo al total compara una parte con el total, por eso el segundo número es mayor.' },
  ],
  describe(values) {
    const [a, b] = values;
    int(a, 1, 12, 'Juice'); int(b, 1, 12, 'Water');
    const rate = frac(a, b);
    return {
      table: { head: ['Batches', 'Juice (cups)', 'Water (cups)'], tones: [null, 'a', 'b'], rows: [1, 2, 3, 4].map((k) => row(`×${k}`, a * k, b * k)) },
      equation: { text: `${a} : ${b} = ${a * 2} : ${b * 2} = ${a * 3} : ${b * 3}`, fraction: [a, b], note: `juice ÷ water = ${fstr(rate)}` },
      words: `For every ${a} cups of juice there are ${b} cups of water. Making more batches keeps ${fstr(rate)} cups of juice for each cup of water.`,
      invariant: { holds: [1, 2, 3, 4].every((k) => feq(frac(a * k, b * k), rate)), text: `Juice ÷ water is ${fstr(rate)} in every row.` },
      a11y: `${a} cups of juice and ${b} cups of water. The ratio is ${a} to ${b}, which is ${fstr(rate)} cups of juice for each cup of water.`,
    };
  },
  test(values, id, p) {
    const [a, b] = values;
    this.describe(values);
    const rate = frac(a, b);
    let after, why, misconception = null;
    if (id === 'scale') {
      const k = int(p, 2, 6, 'Factor');
      after = [a * k, b * k];
      why = `Both amounts were multiplied by ${k}, so each cup of juice still goes with ${fstr(frac(b, a))} cups of water.`;
    } else if (id === 'add') {
      const d = int(p, 1, 6, 'Cups');
      after = [a + d, b + d];
      why = `Adding ${d} to both changed the ratio from ${a}:${b} to ${after[0]}:${after[1]}. ${fstr(rate)} is not ${fstr(frac(after[0], after[1]))}. Equivalent ratios come from multiplying, not adding.`;
      misconception = 'additive-ratio';
    } else if (id === 'one') {
      const d = int(p, 1, 6, 'Cups');
      after = [a + d, b];
      why = `Only juice changed, so there is more juice for each cup of water: ${fstr(rate)} became ${fstr(frac(after[0], after[1]))}.`;
      misconception = 'one-quantity';
    } else throw new RangeError(`Unknown idea ${id}.`);
    const preserved = feq(frac(after[0], after[1]), rate);
    return { id, before: [a, b], after, preserved, why, misconception: preserved ? null : misconception, fits: after.every((v) => v >= 1 && v <= 12), unit: 'cups', names: ['Juice', 'Water'] };
  },
};

// ---------------------------------------------------------------------------------------------------------------------
const percentWhole = {
  key: 'percent:whole',
  quantities: [{ id: 'percent', name: 'Percent', nameEs: 'Porcentaje', unit: '%', unitEs: '%', color: 'a' }, { id: 'part', name: 'Known part', nameEs: 'Parte conocida', unit: '', color: 'b' }],
  domain: 'The percent is a whole number from 1 to 100 and the known part is a whole number from 1 to 120.',
  domainEs: 'El porcentaje es un número entero del 1 al 100 y la parte conocida es un número entero del 1 al 120.',
  invariants: ['The whole times the percent equals the part.'],
  invariantsEs: ['El total multiplicado por el porcentaje es igual a la parte.'],
  representations: ['model', 'table', 'equation', 'words'],
  representationsEs: ['modelo', 'tabla', 'ecuación', 'palabras'],
  transformations: [{ id: 'verify', label: 'Check a whole you think is right:', labelEs: 'Comprueba el total que crees correcto:', question: 'Is that number the whole?', questionEs: '¿Ese número es el total?', param: { label: 'Whole', labelEs: 'Total', min: 0.1, max: 1000, step: 0.1, value: 100 } }],
  misconceptions: [
    { id: 'percent-of-part', name: 'Finding the percent of the part when you need the whole', nameEs: 'Calcular el porcentaje de la parte cuando necesitas el total', response: 'The part is already the percent. Work back to 100% instead of taking the percent of the part.', responseEs: 'La parte ya representa el porcentaje. Regresa al 100% en vez de calcular el porcentaje de la parte.' },
    { id: 'whole-too-small', name: 'Choosing a whole smaller than the part', nameEs: 'Elegir un total menor que la parte', response: 'A part that is less than 100% must be smaller than the whole.', responseEs: 'Una parte menor que el 100% debe ser menor que el total.' },
    { id: 'percent-is-amount', name: 'Reading the percent as an amount', nameEs: 'Interpretar el porcentaje como una cantidad', response: 'The percent names a share of the whole, not a number of items.', responseEs: 'El porcentaje indica una parte del total, no una cantidad de artículos.' },
  ],
  describe(values) {
    const [p, part] = values;
    int(p, 1, 100, 'Percent'); int(part, 1, 120, 'Known part');
    const whole = frac(part * 100, p);
    const one = frac(part, p);
    return {
      table: { head: ['Percent', 'Amount'], tones: ['a', 'b'], rows: [row('1%', fstr(one)), row(`${p}%`, part), row('100%', fstr(whole))] },
      equation: { text: `${part} ÷ ${fdec(frac(p, 100))} = ${fstr(whole)}`, fraction: [part * 100, p], note: `${fstr(whole)} × ${p}% = ${part}` },
      words: `${part} is ${p}% of the whole. Each 1% is ${fstr(one)}, so 100% is ${fstr(whole)}.`,
      invariant: { holds: feq(fmul(whole, frac(p, 100)), frac(part)), text: `${fstr(whole)} × ${p}% = ${part}` },
      a11y: `${part} is ${p} percent of the whole. One percent is ${fstr(one)}. The whole is ${fstr(whole)}.`,
    };
  },
  test(values, id, p) {
    const [pct, part] = values;
    this.describe(values);
    if (id !== 'verify') throw new RangeError(`Unknown idea ${id}.`);
    // A whole may be entered to the nearest tenth; the tenths are kept as an exact integer, never a float.
    const tenths = Math.round(Number(p) * 10);
    if (!Number.isFinite(tenths) || tenths < 1 || tenths > 10000) throw new RangeError('Whole must be a number from 0.1 to 1000.');
    const guess = frac(tenths, 10);
    const share = fmul(frac(pct, 100), frac(part));
    const preserved = feq(fmul(guess, frac(pct, 100)), frac(part));
    let why, misconception = null;
    if (preserved) why = `${pct}% of ${fdec(guess)} is ${part}, so ${fdec(guess)} is the whole.`;
    else if (feq(guess, share)) { why = `${fdec(guess)} is ${pct}% of ${part}. But ${part} is already ${pct}% of the whole, so work back to 100% instead of taking the percent of ${part}.`; misconception = 'percent-of-part'; }
    else if (guess.n < part * guess.d) { why = `${fdec(guess)} is smaller than the part, ${part}. A part that is less than 100% has to be smaller than the whole.`; misconception = 'whole-too-small'; }
    else why = `${pct}% of ${fdec(guess)} is ${fdec(fmul(guess, frac(pct, 100)))}, not ${part}.`;
    return { id, before: [pct, part], after: [pct, part], preserved, why, misconception, fits: true, guess: fdec(guess), unit: '', names: ['Percent', 'Known part'] };
  },
};

// ---------------------------------------------------------------------------------------------------------------------
const powerOrder = {
  key: 'power:order',
  quantities: [{ id: 'base', name: 'Base', nameEs: 'Base', unit: '', color: 'a' }, { id: 'exponent', name: 'Number of factors', nameEs: 'Número de factores', unit: '', color: 'b' }],
  domain: 'The base is a whole number from 2 to 5 and the exponent is a whole number from 1 to 5.',
  domainEs: 'La base es un número entero del 2 al 5 y el exponente es un número entero del 1 al 5.',
  invariants: ['An exponent counts how many times the base is used as a factor.'],
  invariantsEs: ['El exponente cuenta cuántas veces se usa la base como factor.'],
  representations: ['model', 'table', 'equation', 'words'],
  representationsEs: ['modelo', 'tabla', 'ecuación', 'palabras'],
  transformations: [
    { id: 'add-factor', label: 'Add one more factor of the base', labelEs: 'Agrega un factor más de la base', question: 'Will the value be multiplied by the base?', questionEs: '¿El valor se multiplicará por la base?', param: null },
    { id: 'times', label: 'Treat the exponent as multiplication:', labelEs: 'Interpreta el exponente como una multiplicación:', question: 'Will the exponent and the multiplication give the same value?', questionEs: '¿El exponente y la multiplicación dan el mismo valor?', param: null },
  ],
  misconceptions: [
    { id: 'exponent-as-multiplier', name: '2³ means 2 × 3', nameEs: '2³ significa 2 × 3', response: 'An exponent tells how many times the base is used as a factor.', responseEs: 'El exponente indica cuántas veces se usa la base como factor.' },
    { id: 'base-times-base', name: 'The exponent multiplies the base by itself once', nameEs: 'El exponente multiplica la base por sí misma una vez', response: 'Count the factors: the exponent says how many copies of the base are multiplied.', responseEs: 'Cuenta los factores: el exponente indica cuántas copias de la base se multiplican.' },
    { id: 'power-after-add', name: 'Adding before the power', nameEs: 'Sumar antes de calcular la potencia', response: 'Evaluate the power first, then add.', responseEs: 'Primero calcula la potencia y después suma.' },
  ],
  describe(values) {
    const [b, e, add = 0] = values;
    int(b, 2, 5, 'Base'); int(e, 1, 5, 'Exponent');
    const v = b ** e;
    return {
      table: { head: ['Factors', 'As repeated multiplication', 'Value'], tones: ['a', 'a', 'b'], rows: [1, 2, 3, 4, 5].map((k) => row(`${b}${SUP[k]}`, times(b, k), b ** k)) },
      equation: { text: `${times(b, e)} = ${b}${SUP[e]} = ${v}`, power: [b, e], note: `${b}${SUP[e]} is not ${b} × ${e} = ${b * e}` },
      words: `The base ${b} is used as a factor ${e} ${e === 1 ? 'time' : 'times'}. The power ${b}${SUP[e]} equals ${v}.`,
      invariant: { holds: v === Array(e).fill(b).reduce((x, y) => x * y, 1), text: `${times(b, e)} = ${v}${add ? `; then add ${add}: ${v + add}` : ''}` },
      a11y: `${b} to the power ${e} means ${b} used as a factor ${e} times: ${times(b, e)} equals ${v}.`,
    };
  },
  test(values, id) {
    const [b, e] = values;
    this.describe(values);
    if (id === 'add-factor') {
      const after = [b, e + 1];
      const ok = e + 1 <= 5;
      return { id, before: [b, e], after: ok ? after : [b, e], preserved: true, why: ok ? `One more factor of ${b} multiplies the value by ${b}: ${b ** e} × ${b} = ${b ** (e + 1)}.` : `That is already the most factors this machine can hold (5).`, misconception: null, fits: ok, unit: '', names: ['Base', 'Factors'] };
    }
    if (id === 'times') {
      const preserved = b ** e === b * e;
      return { id, before: [b, e], after: [b, e], preserved, why: `${b}${SUP[e]} is ${times(b, e)} = ${b ** e}. ${b} × ${e} adds ${b} ${e} times and gives ${b * e}. ${preserved ? 'They match only because of these particular numbers.' : 'The two are different calculations.'}`, misconception: preserved ? null : 'exponent-as-multiplier', fits: true, unit: '', names: ['Base', 'Factors'] };
    }
    throw new RangeError(`Unknown idea ${id}.`);
  },
};

// ---------------------------------------------------------------------------------------------------------------------
const balanceAdd = {
  key: 'balance:add',
  quantities: [{ id: 'added', name: 'Amount added to x', nameEs: 'Cantidad sumada a x', unit: '', color: 'a' }, { id: 'total', name: 'Right side', nameEs: 'Lado derecho', unit: '', color: 'b' }],
  domain: 'The amount added is a whole number from 1 to 12 and the right side is a whole number from 1 to 60.',
  domainEs: 'La cantidad sumada es un número entero del 1 al 12 y el lado derecho es un número entero del 1 al 60.',
  invariants: ['Doing the same thing to both sides keeps the same solution.'],
  invariantsEs: ['Hacer lo mismo a ambos lados conserva la misma solución.'],
  representations: ['model', 'table', 'equation', 'words'],
  representationsEs: ['modelo', 'tabla', 'ecuación', 'palabras'],
  transformations: [
    { id: 'both', label: 'Subtract the added amount from both sides', labelEs: 'Resta la cantidad sumada a ambos lados', question: 'Will the solution stay the same?', questionEs: '¿La solución seguirá siendo la misma?', param: null },
    { id: 'left', label: 'Subtract it from the left side only', labelEs: 'Réstala solo del lado izquierdo', question: 'Will the solution stay the same?', questionEs: '¿La solución seguirá siendo la misma?', param: null },
    { id: 'add-both', label: 'Add the same amount to both sides', labelEs: 'Suma la misma cantidad a ambos lados', question: 'Will the solution stay the same?', questionEs: '¿La solución seguirá siendo la misma?', param: null },
  ],
  misconceptions: [
    { id: 'one-sided', name: 'Changing only one side', nameEs: 'Cambiar solo un lado', response: 'A balance stays level only when both sides change by the same amount.', responseEs: 'El equilibrio se conserva solo cuando ambos lados cambian en la misma cantidad.' },
    { id: 'wrong-inverse', name: 'Adding when you should undo an addition', nameEs: 'Sumar cuando debes deshacer una suma', response: 'To undo adding a number, subtract it.', responseEs: 'Para deshacer una suma, resta ese número.' },
    { id: 'skip-check', name: 'Not checking by substituting', nameEs: 'No comprobar sustituyendo', response: 'Put your value of x back into the original equation to see if it balances.', responseEs: 'Sustituye tu valor de x en la ecuación original para comprobar si queda equilibrada.' },
  ],
  describe(values) {
    const [a, rhs] = values;
    int(a, 1, 12, 'Amount added'); int(rhs, 1, 60, 'Right side');
    const x = rhs - a;
    const m = (n) => String(n).replace('-', '−');
    return {
      table: { head: ['Step', 'Left side', 'Right side'], tones: [null, 'a', 'b'], rows: [row('Start', `x + ${a}`, rhs), row(`Subtract ${a} from both`, 'x', m(x)), row('Check', `${m(x)} + ${a}`, `${x + a} = ${rhs}`)] },
      equation: { text: `x + ${a} = ${rhs}  →  x = ${m(x)}`, note: `${m(x)} + ${a} = ${rhs}` },
      words: `x plus ${a} equals ${rhs}. Taking ${a} away from both sides keeps the balance and leaves x = ${m(x)}.`,
      invariant: { holds: x + a === rhs, text: `${m(x)} + ${a} = ${rhs}` },
      a11y: `The balance holds x plus ${a} on the left and ${rhs} on the right. Subtracting ${a} from both sides gives x equals ${m(x)}.`,
    };
  },
  test(values, id) {
    const [a, rhs] = values;
    this.describe(values);
    const x = rhs - a;
    const m = (n) => String(n).replace('-', '−');
    if (id === 'both') return { id, before: [a, rhs], after: [a, rhs], preserved: true, why: `Subtracting ${a} from both sides gives x = ${m(x)}. Check: ${m(x)} + ${a} = ${rhs}.`, misconception: null, fits: true, solution: x, unit: '', names: ['Added', 'Right side'] };
    if (id === 'add-both') return { id, before: [a, rhs], after: [a, rhs], preserved: true, why: `x + ${2 * a} = ${rhs + a} is still balanced, and x is still ${m(x)}. It keeps the balance, but it does not get x alone.`, misconception: null, fits: true, solution: x, unit: '', names: ['Added', 'Right side'] };
    if (id === 'left') return { id, before: [a, rhs], after: [a, rhs], preserved: false, why: `Taking ${a} from the left only gives x = ${rhs}. But ${rhs} + ${a} = ${rhs + a}, not ${rhs}. The solution changed because the sides were not treated the same.`, misconception: 'one-sided', fits: true, solution: rhs, unit: '', names: ['Added', 'Right side'] };
    throw new RangeError(`Unknown idea ${id}.`);
  },
};

// ---------------------------------------------------------------------------------------------------------------------
const areaTriangle = {
  key: 'area:triangle',
  quantities: [{ id: 'base', name: 'Base', nameEs: 'Base', unit: 'units', unitEs: 'unidades', color: 'a' }, { id: 'height', name: 'Perpendicular height', nameEs: 'Altura perpendicular', unit: 'units', unitEs: 'unidades', color: 'b' }],
  domain: 'The base and the perpendicular height are whole numbers from 1 to 12.',
  domainEs: 'La base y la altura perpendicular son números enteros del 1 al 12.',
  invariants: ['Two copies of a triangle make a parallelogram with the same base and height, so the triangle is half of base × height.'],
  invariantsEs: ['Dos copias de un triángulo forman un paralelogramo con la misma base y altura, así que el triángulo equivale a la mitad de base × altura.'],
  representations: ['model', 'table', 'equation', 'words'],
  representationsEs: ['modelo', 'tabla', 'ecuación', 'palabras'],
  transformations: [
    { id: 'slide', label: 'Slide the top point sideways by', labelEs: 'Desliza el punto superior hacia un lado', question: 'Will the area stay the same?', questionEs: '¿El área seguirá siendo la misma?', param: { label: 'Units', labelEs: 'Unidades', min: 1, max: 12, value: 3 } },
    { id: 'slant', label: 'Use a slanted side of this length as the height:', labelEs: 'Usa como altura un lado inclinado de esta longitud:', question: 'Will the slanted side give the same area as the height?', questionEs: '¿El lado inclinado dará la misma área que la altura?', param: { label: 'Length', labelEs: 'Longitud', min: 1, max: 20, value: 5 } },
  ],
  misconceptions: [
    { id: 'slant-as-height', name: 'Using the slanted side as the height', nameEs: 'Usar el lado inclinado como altura', response: 'The height is the perpendicular distance from the base to the top, not the slanted side.', responseEs: 'La altura es la distancia perpendicular desde la base hasta la parte superior, no el lado inclinado.' },
    { id: 'forget-half', name: 'Forgetting the one half for a triangle', nameEs: 'Olvidar la mitad en el área del triángulo', response: 'A triangle is half of a parallelogram with the same base and height.', responseEs: 'Un triángulo equivale a la mitad de un paralelogramo con la misma base y altura.' },
    { id: 'shear-changes-area', name: 'Thinking sliding the top changes the area', nameEs: 'Pensar que deslizar la parte superior cambia el área', response: 'Sliding the top point parallel to the base keeps the base and the height, so the area stays the same.', responseEs: 'Deslizar el punto superior en paralelo a la base conserva la base y la altura, así que el área no cambia.' },
  ],
  describe(values) {
    const [b, h] = values;
    int(b, 1, 12, 'Base'); int(h, 1, 12, 'Height');
    const whole = b * h, tri = frac(b * h, 2);
    return {
      table: { head: ['Shape', 'Base', 'Height', 'Area (square units)'], tones: [null, 'a', 'b', null], rows: [row('Parallelogram', b, h, whole), row('Triangle', b, h, fstr(tri))] },
      equation: { text: `A = ½ × ${b} × ${h} = ${fstr(tri)}`, half: [b, h], note: `parallelogram: ${b} × ${h} = ${whole}` },
      words: `Two copies of this triangle make a parallelogram with area ${whole}, so one triangle has area ${fstr(tri)} square units.`,
      invariant: { holds: feq(fmul(tri, frac(2)), frac(whole)), text: `2 × ${fstr(tri)} = ${whole}` },
      a11y: `A triangle with base ${b} and perpendicular height ${h} has area ${fstr(tri)} square units, half of the parallelogram's ${whole}.`,
    };
  },
  test(values, id, p) {
    const [b, h] = values;
    this.describe(values);
    const tri = frac(b * h, 2);
    if (id === 'slide') {
      const s = int(p, 1, 12, 'Units');
      return { id, before: [b, h], after: [b, h], preserved: true, why: `Sliding the top point ${s} units keeps the base ${b} and the height ${h}, so the area is still ${fstr(tri)}. The slanted sides change; the height does not.`, misconception: null, fits: true, unit: 'square units', names: ['Base', 'Height'] };
    }
    if (id === 'slant') {
      const s = int(p, 1, 20, 'Length');
      if (s < h) return { id, before: [b, h], after: [b, h], preserved: false, why: `A slanted side of ${s} cannot be shorter than the height ${h}: the perpendicular is the shortest way from the top to the base.`, misconception: 'slant-as-height', fits: true, unit: 'square units', names: ['Base', 'Height'] };
      const wrong = frac(b * s, 2);
      const preserved = feq(wrong, tri);
      return { id, before: [b, h], after: [b, h], preserved, why: preserved ? `A slanted side equal to the height means the top point is straight above the base, so both ways give ${fstr(tri)}.` : `Using ${s} as the height gives ${fstr(wrong)}, but the perpendicular height is ${h}, which gives ${fstr(tri)}. The height must be perpendicular to the base.`, misconception: preserved ? null : 'slant-as-height', fits: true, unit: 'square units', names: ['Base', 'Height'] };
    }
    throw new RangeError(`Unknown idea ${id}.`);
  },
};

export const BRIDGES = [ratioMixer, percentWhole, powerOrder, balanceAdd, areaTriangle];
const byKey = new Map(BRIDGES.map((x) => [x.key, x]));
/** The bridge for a lab's model, or null when that model has none yet. */
export const bridgeFor = (model) => byKey.get(`${model.kind}:${model.mode}`) || null;
