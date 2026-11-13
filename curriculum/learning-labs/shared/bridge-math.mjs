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

// ---------------------------------------------------------------------------------------------------------------------
// Bridges for the remaining whole-number and exact-fraction model families. The model domains below match
// `controls()` in math.mjs. A Bridge may reason about three or four quantities where the lab model does.
const commonRepresentations = ['model', 'table', 'equation', 'words'];
const commonRepresentationsEs = ['modelo', 'tabla', 'ecuación', 'palabras'];
const makeBridge = (spec) => ({
  ...spec,
  representations: spec.representations || commonRepresentations,
  representationsEs: spec.representationsEs || commonRepresentationsEs,
  describe(values) {
    spec.validate(values);
    return spec.describeValues(values);
  },
  test(values, id, param) {
    spec.validate(values);
    return spec.testValues(values, id, param);
  },
});
const q = (id, name, nameEs, unit = '', unitEs = unit, color = 'a') => ({ id, name, nameEs, unit, unitEs, color });
const idea = (id, label, labelEs, question, questionEs, param = null) => ({ id, label, labelEs, question, questionEs, param });
const misconception = (id, name, nameEs, response, responseEs) => ({ id, name, nameEs, response, responseEs });
const halves = (v) => Number.isInteger(v * 2);
const checked = (values, bounds, names) => {
  if (!Array.isArray(values) || values.length < bounds.length) throw new RangeError('The model values are incomplete.');
  bounds.forEach(([lo, hi, half = false], i) => {
    const v = values[i];
    if ((half ? !halves(v) : !Number.isInteger(v)) || v < lo || v > hi) throw new RangeError(`${names[i]} is outside this model's control range.`);
  });
};
const result = (bridge, id, before, after, preserved, why, misconceptionId = null, fits = true) => ({
  id, before, after, preserved, why, misconception: preserved ? null : misconceptionId, fits,
  unit: '', names: bridge.quantities.map((x) => x.name),
});

const ratioCompare = makeBridge({
  key: 'ratio:compare',
  quantities: [q('color', 'Color paint', 'Pintura de color', 'cups', 'tazas'), q('white', 'White paint', 'Pintura blanca', 'cups', 'tazas', 'b')],
  domain: 'Color paint and white paint are whole cups from 1 to 12. The reference mixture is 3:5.',
  domainEs: 'La pintura de color y la pintura blanca se miden en tazas enteras del 1 al 12. La mezcla de referencia es 3:5.',
  invariants: ['A fair comparison uses color cups per one white cup; equivalent mixtures have equal cross-products.'],
  invariantsEs: ['Una comparación justa usa tazas de color por cada taza blanca; las mezclas equivalentes tienen productos cruzados iguales.'],
  transformations: [
    idea('scale', 'Multiply both amounts by', 'Multiplica ambas cantidades por', 'Will the color per cup of white stay the same?', '¿Se mantendrá igual el color por cada taza de pintura blanca?', { label: 'Factor', labelEs: 'Factor', min: 2, max: 6, value: 2 }),
    idea('add-both', 'Add this many cups to both amounts', 'Suma estas tazas a ambas cantidades', 'Will adding the same amount keep the mixtures equivalent?', '¿Sumar la misma cantidad mantendrá equivalentes las mezclas?', { label: 'Cups', labelEs: 'Tazas', min: 1, max: 6, value: 1 }),
    idea('change-one', 'Add cups to color paint only', 'Suma tazas solo a la pintura de color', 'Will changing only the color paint keep the same mixture?', '¿Cambiar solo la pintura de color conservará la misma mezcla?', { label: 'Cups', labelEs: 'Tazas', min: 1, max: 6, value: 1 }),
  ],
  misconceptions: [
    misconception('additive-ratio', 'Adding the same amount keeps a ratio', 'Sumar la misma cantidad conserva una razón', 'Equivalent ratios are made by multiplying both quantities by the same factor.', 'Las razones equivalentes se forman al multiplicar ambas cantidades por el mismo factor.'),
    misconception('compare-totals', 'The larger total always has more color per cup', 'El total mayor siempre tiene más color por taza', 'Compare color for the same number of white cups, not the mixtures’ totals.', 'Compara el color para la misma cantidad de tazas blancas, no los totales de las mezclas.'),
    misconception('one-part', 'Changing one part keeps the mixture', 'Cambiar una parte conserva la mezcla', 'Changing only one amount changes how much color goes with each cup of white.', 'Cambiar solo una cantidad modifica cuánto color corresponde a cada taza blanca.'),
  ],
  validate: (v) => checked(v, [[1, 12], [1, 12]], ['Color paint', 'White paint']),
  describeValues([a, b]) {
    const rate = frac(a, b), ref = frac(3, 5);
    return {
      table: { head: ['Mixture', 'Color (cups)', 'White (cups)', 'Color per white cup'], tones: [null, 'a', 'b', null], rows: [row('Your mixture', a, b, fstr(rate)), row('Reference', 3, 5, fstr(ref))] },
      equation: { text: `${a}:${b} = ${fstr(rate)} color cup per white cup; 3:5 = ${fstr(ref)}`, fraction: [a, b], note: `Compare ${fstr(rate)} with ${fstr(ref)} using exact cross-products.` },
      words: `${a} cups of color for ${b} cups of white gives ${fstr(rate)} color cup per white cup. The reference gives ${fstr(ref)}.`,
      invariant: { holds: true, text: `${a} × 5 ${a * 5 === b * 3 ? '=' : '≠'} ${b} × 3; equal cross-products mean equal mixtures.` },
      a11y: `Your mixture has ${a} cups of color and ${b} cups of white; its exact unit rate is ${fstr(rate)} color cup per white cup.`,
    };
  },
  testValues(v, id, p) {
    const [a, b] = v; let after, preserved, why, wrong = null;
    if (id === 'scale') { const k = int(p, 2, 6, 'Factor'); after = [a * k, b * k]; preserved = a * b * k === b * a * k; why = `Both amounts become ${a * k}:${b * k}; cross-products ${a * k * 5} and ${b * k * 3} show whether its unit rate matches the reference.`; }
    else if (id === 'add-both') { const n = int(p, 1, 6, 'Cups'); after = [a + n, b + n]; preserved = a * (b + n) === b * (a + n); wrong = 'additive-ratio'; why = `Adding ${n} gives ${after[0]}:${after[1]}; ${after[0]} × ${b} ${preserved ? '=' : '≠'} ${after[1]} × ${a}.`; }
    else if (id === 'change-one') { const n = int(p, 1, 6, 'Cups'); after = [a + n, b]; preserved = a * b === (a + n) * b; wrong = 'one-part'; why = `Changing color alone gives ${a + n}:${b}. Its unit rate is ${fstr(frac(a + n, b))}, compared with ${fstr(frac(a, b))} before.`; }
    else throw new RangeError(`Unknown idea ${id}.`);
    return result(this, id, v.slice(0, 2), after, preserved, why, wrong, after.every((x) => x <= 12));
  },
});

const percentGrid = makeBridge({
  key: 'percent:grid',
  quantities: [q('percent', 'Percent', 'Porcentaje', '%', '%'), q('whole', 'Whole amount', 'Cantidad total', 'units', 'unidades', 'b')],
  domain: 'The percent is a whole number from 0% to 200%; the whole amount is a whole number from 1 to 120.',
  domainEs: 'El porcentaje es un número entero del 0% al 200%; la cantidad total es un número entero del 1 al 120.',
  invariants: ['The percent names the fraction of the whole: shaded amount ÷ whole = percent ÷ 100.'],
  invariantsEs: ['El porcentaje nombra la fracción del total: cantidad sombreada ÷ total = porcentaje ÷ 100.'],
  transformations: [
    idea('scale-whole', 'Scale the whole amount by', 'Multiplica la cantidad total por', 'Will the percent of the whole stay the same?', '¿Se mantendrá igual el porcentaje del total?', { label: 'Factor', labelEs: 'Factor', min: 2, max: 4, value: 2 }),
    idea('change-whole', 'Add this many whole units', 'Suma estas unidades al total', 'Will changing the whole alone change the percent?', '¿Cambiar solo el total cambiará el porcentaje?', { label: 'Units', labelEs: 'Unidades', min: 1, max: 6, value: 2 }),
    idea('change-percent', 'Increase the percent by', 'Aumenta el porcentaje en', 'Will a different percent name the same share of the whole?', '¿Un porcentaje distinto nombrará la misma parte del total?', { label: 'Percent points', labelEs: 'Puntos porcentuales', min: 1, max: 20, value: 10 }),
  ],
  misconceptions: [
    misconception('percent-as-count', 'A percent is a number of objects', 'Un porcentaje es una cantidad de objetos', 'A percent is a share of the whole; the shaded amount also depends on the whole.', 'Un porcentaje es una parte del total; la cantidad sombreada también depende del total.'),
    misconception('percent-over-100', 'A percent cannot be greater than 100%', 'Un porcentaje no puede superar el 100%', 'More than one whole can be shaded, so the model allows percents above 100%.', 'Se puede sombrear más de un entero, por eso el modelo permite porcentajes mayores que 100%.'),
    misconception('percent-change', 'Changing the whole changes the percent', 'Cambiar el total cambia el porcentaje', 'The shaded amount changes with the whole, while the named percent can stay fixed.', 'La cantidad sombreada cambia con el total, pero el porcentaje indicado puede mantenerse.'),
  ],
  validate: (v) => checked(v, [[0, 200], [1, 120]], ['Percent', 'Whole amount']),
  describeValues([p, w]) {
    const share = frac(p, 100), amount = fmul(share, frac(w));
    return {
      table: { head: ['Name', 'Percent', 'Fraction of whole', 'Amount'], tones: [null, 'a', 'a', 'b'], rows: [row('This design', `${p}%`, fstr(share), fstr(amount)), row('One whole', '100%', '1', w)] },
      equation: { text: `${p}% of ${w} = ${fstr(amount)}`, fraction: [p, 100], note: `${fstr(amount)} ÷ ${w} = ${fstr(share)}` },
      words: `${p}% names ${fstr(share)} of the whole. For a whole of ${w}, that share is ${fstr(amount)}.`,
      invariant: { holds: feq(fdiv(amount, frac(w)), share), text: `${fstr(amount)} ÷ ${w} = ${p}/100 = ${fstr(share)}` },
      a11y: `${p} percent is ${fstr(share)} of a whole of ${w}; the matching amount is ${fstr(amount)}.`,
    };
  },
  testValues(v, id, p) {
    const [pct, whole] = v; let after, preserves, why, wrong = null;
    if (id === 'scale-whole') { const k = int(p, 2, 4, 'Factor'); after = [pct, whole * k]; preserves = after[0] === pct; why = `The whole changes from ${whole} to ${after[1]}, but the share is still ${pct}/100.`; }
    else if (id === 'change-whole') { const n = int(p, 1, 6, 'Units'); after = [pct, whole + n]; preserves = after[0] === pct; why = `The whole changes from ${whole} to ${after[1]}; the percent remains ${pct}%, while the amount changes from ${fstr(fmul(frac(pct, 100), frac(whole)))} to ${fstr(fmul(frac(pct, 100), frac(after[1])))}.`; }
    else if (id === 'change-percent') { const n = int(p, 1, 20, 'Percent points'); after = [pct + n, whole]; preserves = after[0] === pct; wrong = 'percent-change'; why = `The share changes from ${pct}/100 to ${after[0]}/100; at whole ${whole}, the amounts are ${fstr(fmul(frac(pct, 100), frac(whole)))} and ${fstr(fmul(frac(after[0], 100), frac(whole)))}.`; }
    else throw new RangeError(`Unknown idea ${id}.`);
    return result(this, id, v.slice(0, 2), after, preserves, why, wrong, after[0] <= 200 && after[1] <= 120);
  },
});

const percentDiscount = makeBridge({
  key: 'percent:discount',
  quantities: [q('percent', 'Discount percent', 'Porcentaje de descuento', '%', '%'), q('price', 'Original price', 'Precio original', 'dollars', 'dólares', 'b')],
  domain: 'The discount is a whole percent from 0% to 100%; the original price is a whole-dollar amount from 1 to 120.',
  domainEs: 'El descuento es un porcentaje entero del 0% al 100%; el precio original es una cantidad entera de 1 a 120 dólares.',
  invariants: ['Discount ÷ original price = percent ÷ 100, and final price + discount = original price.'],
  invariantsEs: ['Descuento ÷ precio original = porcentaje ÷ 100, y precio final + descuento = precio original.'],
  transformations: [
    idea('scale-price', 'Scale the price by', 'Multiplica el precio por', 'Will the discount percent stay the same?', '¿Se mantendrá igual el porcentaje de descuento?', { label: 'Factor', labelEs: 'Factor', min: 2, max: 4, value: 2 }),
    idea('change-price', 'Add this many dollars to the price', 'Suma estos dólares al precio', 'Will changing the original price change the discount percent?', '¿Cambiar el precio original cambiará el porcentaje de descuento?', { label: 'Dollars', labelEs: 'Dólares', min: 1, max: 6, value: 5 }),
    idea('change-percent', 'Increase the discount by', 'Aumenta el descuento en', 'Will the same percent of the price be discounted?', '¿Se descontará el mismo porcentaje del precio?', { label: 'Percent points', labelEs: 'Puntos porcentuales', min: 1, max: 20, value: 10 }),
  ],
  misconceptions: [
    misconception('discount-dollars', 'A discount percent is a fixed dollar amount', 'Un porcentaje de descuento es una cantidad fija de dólares', 'The dollars saved depend on both the percent and the original price.', 'Los dólares ahorrados dependen del porcentaje y del precio original.'),
    misconception('add-discounts', 'Successive discounts add directly', 'Los descuentos sucesivos se suman directamente', 'The second discount is applied to the reduced price, not the original price.', 'El segundo descuento se aplica al precio reducido, no al precio original.'),
    misconception('discount-direction', 'A larger discount percent saves fewer dollars on the same price', 'Un porcentaje de descuento mayor ahorra menos dólares en el mismo precio', 'On the same price, a larger percent discount means more dollars are subtracted.', 'En el mismo precio, un porcentaje mayor resta más dólares.'),
  ],
  validate: (v) => checked(v, [[0, 100], [1, 120]], ['Discount percent', 'Original price']),
  describeValues([p, price]) {
    const discount = fmul(frac(p, 100), frac(price)), final = fsub(frac(price), discount);
    return {
      table: { head: ['Stage', 'Price or savings'], tones: [null, 'b'], rows: [row('Original price', price), row('Discount', fstr(discount)), row('Final price', fstr(final))] },
      equation: { text: `${p}% of ${price} = ${fstr(discount)}; ${price} − ${fstr(discount)} = ${fstr(final)}`, fraction: [p, 100], note: `${fstr(discount)} ÷ ${price} = ${p}/100` },
      words: `A ${p}% discount on $${price} saves $${fstr(discount).replace('−', '-')}. The final price is $${fstr(final).replace('−', '-')}.`,
      invariant: { holds: feq(fadd(final, discount), frac(price)), text: `${fstr(final)} + ${fstr(discount)} = ${price}; discount rate = ${p}/100` },
      a11y: `Original price ${price} dollars, discount ${p} percent or ${fstr(discount)} dollars, final price ${fstr(final)} dollars.`,
    };
  },
  testValues(v, id, p) {
    const [pct, price] = v; let after, preserves, why, wrong = null;
    if (id === 'scale-price') { const k = int(p, 2, 4, 'Factor'); after = [pct, price * k]; preserves = after[0] === pct; why = `The price scales to $${after[1]}, and the savings scale to $${fstr(fmul(frac(pct, 100), frac(after[1])))}; the rate stays ${pct}%.`; }
    else if (id === 'change-price') { const n = int(p, 1, 6, 'Dollars'); after = [pct, price + n]; preserves = after[0] === pct; why = `The price changes from $${price} to $${after[1]}, but the discount rate stays ${pct}%.`; }
    else if (id === 'change-percent') { const n = int(p, 1, 20, 'Percent points'); after = [pct + n, price]; preserves = after[0] === pct; wrong = 'discount-dollars'; why = `The discount rate changes from ${pct}% to ${after[0]}%; the savings change from $${fstr(fmul(frac(pct, 100), frac(price)))} to $${fstr(fmul(frac(after[0], 100), frac(price)))}.`; }
    else throw new RangeError(`Unknown idea ${id}.`);
    return result(this, id, v.slice(0, 2), after, preserves, why, wrong, after[0] <= 100 && after[1] <= 120);
  },
});

const fractionBridge = (key, mode, nouns, defaultSupply) => makeBridge({
  key: `fraction:${mode}`,
  quantities: [q('supply', `Supply (${nouns.unit})`, `Cantidad (${nouns.unitEs})`, nouns.unit, nouns.unitEs), q('numerator', 'Serving numerator', 'Numerador de la porción', '', '', 'b'), q('denominator', 'Serving denominator', 'Denominador de la porción', '', '')],
  domain: `The supply is a multiple of one-half from 0.5 to 8 ${nouns.unit}; serving-size numerator is 1 to 5 and denominator is 2 to 8.`,
  domainEs: `La cantidad es múltiplo de un medio, de 0.5 a 8 ${nouns.unitEs}; el numerador de la porción va de 1 a 5 y el denominador de 2 a 8.`,
  invariants: ['Number of portions × serving size = supply, using exact fraction arithmetic.'],
  invariantsEs: ['Número de porciones × tamaño de cada porción = cantidad, con fracciones exactas.'],
  transformations: [
    idea('scale-both', 'Scale the supply and serving size by', 'Multiplica la cantidad y el tamaño de porción por', 'Will the number of portions stay the same?', '¿Se mantendrá igual la cantidad de porciones?', { label: 'Factor', labelEs: 'Factor', min: 2, max: 4, value: 2 }),
    idea('equivalent-serving', 'Write the serving with numerator and denominator times', 'Escribe la porción con numerador y denominador multiplicados por', 'Will an equivalent fraction change the number of portions?', '¿Una fracción equivalente cambiará la cantidad de porciones?', { label: 'Factor', labelEs: 'Factor', min: 2, max: 4, value: 2 }),
    idea('change-serving', 'Increase the serving numerator by', 'Aumenta el numerador de la porción en', 'Will a larger serving size give the same quotient?', '¿Una porción mayor dará el mismo cociente?', { label: 'Parts', labelEs: 'Partes', min: 1, max: 2, value: 1 }),
  ],
  misconceptions: [
    misconception('invert-division', 'Divide serving size by the supply', 'Divide el tamaño de la porción entre la cantidad', 'The question asks how many serving-size groups fit in the supply: supply ÷ serving size.', 'La pregunta es cuántos grupos del tamaño de una porción caben: cantidad ÷ tamaño de porción.'),
    misconception('denominator-direction', 'A larger denominator makes the fraction larger', 'Un denominador mayor hace que la fracción sea mayor', 'For the same numerator, more equal parts means each part is smaller.', 'Con el mismo numerador, más partes iguales hacen que cada parte sea menor.'),
    misconception('fractional-quotient', 'A fractional quotient must be rounded to a whole portion', 'Un cociente fraccionario debe redondearse a una porción entera', 'Keep the exact quotient; the context can separately ask for complete servings or pieces.', 'Conserva el cociente exacto; el contexto puede preguntar aparte por porciones o piezas completas.'),
  ],
  validate: (v) => checked(v, [[0.5, 8, true], [1, 5], [2, 8]], ['Supply', 'Serving numerator', 'Serving denominator']),
  describeValues([supply, n, d]) {
    const supplyFrac = frac(Math.round(supply * 2), 2), serving = frac(n, d), count = fdiv(supplyFrac, serving);
    const full = Math.floor(count.n / count.d), remainder = fsub(supplyFrac, fmul(frac(full), serving));
    return {
      table: { head: ['Measure', 'Exact amount'], tones: [null, 'a'], rows: [row('Supply', fstr(supplyFrac)), row('One serving', fstr(serving)), row('Portions', fstr(count)), row('Complete portions', full), row('Remainder', fstr(remainder))] },
      equation: { text: `${fstr(supplyFrac)} ÷ ${fstr(serving)} = ${fstr(count)}`, fraction: [supplyFrac.n, supplyFrac.d], note: `${fstr(count)} × ${fstr(serving)} = ${fstr(supplyFrac)}` },
      words: `${fstr(supplyFrac)} ${nouns.unit} split into portions of ${fstr(serving)} ${nouns.unit} gives ${fstr(count)} portions; ${full} are complete.`,
      invariant: { holds: feq(fmul(count, serving), supplyFrac), text: `${fstr(count)} × ${fstr(serving)} = ${fstr(supplyFrac)} ${nouns.unit}` },
      a11y: `Supply ${fstr(supplyFrac)} ${nouns.unit}; each portion is ${fstr(serving)}; exact quotient ${fstr(count)} portions.`,
    };
  },
  testValues(v, id, p) {
    const [supply, n, d] = v, sf = frac(Math.round(supply * 2), 2), serving = frac(n, d), beforeCount = fdiv(sf, serving);
    let after, preserved, why, wrong = null;
    if (id === 'scale-both') { const k = int(p, 2, 4, 'Factor'); after = [supply * k, n * k, d]; const nextCount = fdiv(frac(Math.round(after[0] * 2), 2), frac(after[1], d)); preserved = feq(nextCount, beforeCount); why = `Supply ${fstr(sf)} and serving ${fstr(serving)} are both scaled by ${k}; the quotient remains ${fstr(nextCount)}.`; }
    else if (id === 'equivalent-serving') { const k = int(p, 2, 4, 'Factor'); after = [supply, n * k, d * k]; const nextServing = frac(after[1], after[2]); preserved = feq(nextServing, serving); why = `${n}/${d} and ${n * k}/${d * k} are equivalent, so ${fstr(sf)} ÷ ${fstr(nextServing)} remains ${fstr(beforeCount)}.`; }
    else if (id === 'change-serving') { const k = int(p, 1, 2, 'Parts'); after = [supply, n + k, d]; const nextCount = fdiv(sf, frac(after[1], d)); preserved = feq(nextCount, beforeCount); wrong = 'denominator-direction'; why = `The serving changes from ${fstr(serving)} to ${fstr(frac(after[1], d))}; the exact quotient changes from ${fstr(beforeCount)} to ${fstr(nextCount)}.`; }
    else throw new RangeError(`Unknown idea ${id}.`);
    return result(this, id, v.slice(0, 3), after, preserved, why, wrong, after[0] <= 8 && after[1] <= 5 && after[2] <= 8);
  },
});

const lineOpposites = makeBridge({
  key: 'line:opposites',
  quantities: [q('first', 'First location', 'Primera ubicación', 'units', 'unidades'), q('second', 'Second location', 'Segunda ubicación', 'units', 'unidades', 'b')],
  domain: 'Both locations are integers or halves from −10 to 10.', domainEs: 'Ambas ubicaciones son enteros o medios de −10 a 10.',
  invariants: ['A number and its opposite add to zero and have equal distance from zero.'], invariantsEs: ['Un número y su opuesto suman cero y tienen la misma distancia al cero.'],
  transformations: [idea('make-opposite', 'Place the second location at the opposite of the first', 'Coloca la segunda ubicación en el opuesto de la primera', 'Will the two locations be opposites?', '¿Serán opuestas las dos ubicaciones?'), idea('same-sign', 'Place the second location at the same number', 'Coloca la segunda ubicación en el mismo número', 'Will equal locations be opposites?', '¿Serán opuestas las ubicaciones iguales?'), idea('negate-both', 'Change the sign of both locations', 'Cambia el signo de ambas ubicaciones', 'If they are opposites now, will they remain opposites?', 'Si ahora son opuestas, ¿seguirán siendo opuestas?')],
  misconceptions: [misconception('same-is-opposite', 'The same number and its opposite are the same idea', 'El mismo número y su opuesto son la misma idea', 'Opposites are equal distances from zero on different sides, except zero is its own opposite.', 'Los opuestos están a la misma distancia del cero en lados distintos, excepto que cero es su propio opuesto.'), misconception('opposite-positive', 'An opposite is always positive', 'El opuesto siempre es positivo', 'The opposite changes the sign; a negative number has a positive opposite and vice versa.', 'El opuesto cambia el signo; un número negativo tiene un opuesto positivo y viceversa.'), misconception('negate-both', 'Negating both numbers makes them opposites', 'Cambiar el signo de ambos los convierte en opuestos', 'Negating both preserves whether the pair sums to zero; it does not turn every pair into opposites.', 'Cambiar el signo de ambos conserva si la pareja suma cero; no convierte cualquier pareja en opuestos.')],
  validate: (v) => checked(v, [[-10, 10, true], [-10, 10, true]], ['First location', 'Second location']),
  describeValues([a, b]) { const opposite = -a, holds = a + b === 0; return { table: { head: ['Location', 'Value', 'Distance from zero'], tones: [null, 'a', 'b'], rows: [row('First', fstr(frac(Math.round(a * 2), 2)), fstr(frac(Math.abs(Math.round(a * 2)), 2))), row('Its opposite', fstr(frac(Math.round(opposite * 2), 2)), fstr(frac(Math.abs(Math.round(opposite * 2)), 2))), row('Second', fstr(frac(Math.round(b * 2), 2)), fstr(frac(Math.abs(Math.round(b * 2)), 2)))] }, equation: { text: `${fstr(frac(Math.round(a * 2), 2))} + ${fstr(frac(Math.round(opposite * 2), 2))} = 0`, note: `Opposite of a is −a; |a| = |−a|.` }, words: `The opposite of ${fstr(frac(Math.round(a * 2), 2))} is ${fstr(frac(Math.round(opposite * 2), 2))}. The pair shown is ${holds ? '' : 'not '}opposite because its sum is ${fstr(frac(Math.round((a + b) * 2), 2))}.`, invariant: { holds, text: `Opposites have sum zero; their distances from zero are equal.` }, a11y: `The opposite of ${a} is ${opposite}; both have distance ${Math.abs(a)} from zero.` }; },
  testValues(v, id) { const [a, b] = v; let after, ok, why, wrong = null; if (id === 'make-opposite') { after = [a, -a]; ok = a + after[1] === 0; why = `${a} + (${after[1]}) = 0; the two locations have equal distance ${Math.abs(a)} from zero.`; } else if (id === 'same-sign') { after = [a, a]; ok = a + after[1] === 0; wrong = 'same-is-opposite'; why = `Both locations are ${a}; their sum is ${2 * a}, so they are ${ok ? '' : 'not '}opposites.`; } else if (id === 'negate-both') { after = [-a, -b]; ok = after[0] + after[1] === 0; wrong = 'negate-both'; why = `Changing both signs gives ${after[0]} and ${after[1]}; their sum is ${after[0] + after[1]}.`; } else throw new RangeError(`Unknown idea ${id}.`); return result(this, id, v.slice(0, 2), after, ok, why, wrong); },
});

const lineAbsolute = makeBridge({
  key: 'line:absolute',
  quantities: [q('first', 'First location', 'Primera ubicación', 'units', 'unidades'), q('second', 'Second location', 'Segunda ubicación', 'units', 'unidades', 'b')],
  domain: 'Both locations are integers or halves from −10 to 10.', domainEs: 'Ambas ubicaciones son enteros o medios de −10 a 10.',
  invariants: ['Distance is the nonnegative absolute difference between positions; order and distance are different questions.'], invariantsEs: ['La distancia es la diferencia absoluta no negativa entre posiciones; ordenar y medir distancia son preguntas distintas.'],
  transformations: [idea('swap', 'Swap the locations', 'Intercambia las ubicaciones', 'Will their distance stay the same?', '¿Se mantendrá igual la distancia?'), idea('translate', 'Move both locations right by', 'Mueve ambas ubicaciones a la derecha', 'Will translating both positions preserve their distance?', '¿Trasladar ambas posiciones conservará la distancia?', { label: 'Units', labelEs: 'Unidades', min: 1, max: 5, value: 2 }), idea('move-second', 'Move only the second location right by', 'Mueve solo la segunda ubicación a la derecha', 'Will the distance stay the same when one location moves?', '¿Se mantendrá la distancia si se mueve una ubicación?', { label: 'Units', labelEs: 'Unidades', min: 1, max: 5, value: 2 })],
  misconceptions: [misconception('distance-direction', 'Distance has a positive or negative direction', 'La distancia tiene dirección positiva o negativa', 'Distance is nonnegative; direction is a separate idea.', 'La distancia no es negativa; la dirección es una idea distinta.'), misconception('farther-greater', 'Farther from zero means greater', 'Más lejos del cero significa mayor', 'Compare position to decide which number is greater; use absolute difference to find distance.', 'Compara las posiciones para decidir cuál número es mayor; usa la diferencia absoluta para hallar la distancia.'), misconception('one-point-move', 'Moving one point keeps the distance', 'Mover un punto conserva la distancia', 'Moving just one location usually changes the gap between them.', 'Mover solo una ubicación normalmente cambia la separación.')],
  validate: (v) => checked(v, [[-10, 10, true], [-10, 10, true]], ['First location', 'Second location']),
  describeValues([a, b]) { const p = (x) => fstr(frac(Math.round(x * 2), 2)), dist = Math.abs(a - b), d = p(dist); return { table: { head: ['Position', 'Value'], tones: [null, 'a'], rows: [row('First location', p(a)), row('Second location', p(b)), row('Distance', d)] }, equation: { text: `|${p(a)} − (${p(b)})| = ${d}`, note: `${p(Math.min(a, b))} < ${p(Math.max(a, b))}; distance = ${d}.` }, words: `The locations are ${p(a)} and ${p(b)}. Their distance is ${d} units, regardless of which comes first.`, invariant: { holds: dist >= 0, text: `|${p(a)} − (${p(b)})| = ${d}; reversing the order gives the same distance.` }, a11y: `The distance between ${p(a)} and ${p(b)} on the number line is ${d} units.` }; },
  testValues(v, id, p) { const [a, b] = v, old = Math.abs(a - b); let after, ok, why, wrong = null; if (id === 'swap') { after = [b, a]; ok = Math.abs(after[0] - after[1]) === old; why = `|${b} − (${a})| = ${Math.abs(b - a)}; reversing the endpoints preserves distance.`; } else if (id === 'translate') { const n = int(p, 1, 5, 'Units'); after = [a + n, b + n]; ok = Math.abs(after[0] - after[1]) === old; why = `Both positions move ${n} units right; |${after[0]} − (${after[1]})| = ${Math.abs(after[0] - after[1])}.`; } else if (id === 'move-second') { const n = int(p, 1, 5, 'Units'); after = [a, b + n]; ok = Math.abs(after[0] - after[1]) === old; wrong = 'one-point-move'; why = `Only the second position changes: distance goes from ${old} to ${Math.abs(after[0] - after[1])}.`; } else throw new RangeError(`Unknown idea ${id}.`); return result(this, id, v.slice(0, 2), after, ok, why, wrong, after.every((x) => x >= -10 && x <= 10)); },
});

const coordinatesReflect = makeBridge({
  key: 'coordinates:reflect',
  quantities: [q('ax', 'Point A: x', 'Punto A: x'), q('ay', 'Point A: y', 'Punto A: y', '', '', 'b'), q('bx', 'Point B: x', 'Punto B: x'), q('by', 'Point B: y', 'Punto B: y', '', '', 'b')],
  domain: 'Each coordinate of A and B is a whole number from −6 to 6.', domainEs: 'Cada coordenada de A y B es un número entero de −6 a 6.',
  invariants: ['Across the x-axis, x stays the same and y changes sign; across the y-axis, y stays the same and x changes sign.'], invariantsEs: ['Al reflejar sobre el eje x, x se mantiene y y cambia de signo; sobre el eje y, y se mantiene y x cambia de signo.'],
  transformations: [idea('reflect-x', 'Place B at A reflected across the x-axis', 'Coloca B en el reflejo de A sobre el eje x', 'Does this reflection keep x and change only the sign of y?', '¿Este reflejo conserva x y cambia solo el signo de y?'), idea('reflect-y', 'Place B at A reflected across the y-axis', 'Coloca B en el reflejo de A sobre el eje y', 'Does this reflection keep y and change only the sign of x?', '¿Este reflejo conserva y y cambia solo el signo de x?'), idea('negate-both', 'Change the signs of both coordinates', 'Cambia los signos de ambas coordenadas', 'Is changing both signs a single reflection across one axis?', '¿Cambiar ambos signos es un solo reflejo sobre un eje?')],
  misconceptions: [misconception('both-signs', 'A single reflection changes both coordinate signs', 'Un solo reflejo cambia el signo de ambas coordenadas', 'An x-axis reflection changes only y; a y-axis reflection changes only x.', 'El reflejo sobre x cambia solo y; el reflejo sobre y cambia solo x.'), misconception('wrong-axis', 'Reflecting across the x-axis changes x', 'Reflejar sobre el eje x cambia x', 'The coordinate parallel to the axis stays fixed; the perpendicular coordinate changes sign.', 'La coordenada paralela al eje se mantiene; la perpendicular cambia de signo.'), misconception('origin-reflection', 'A half-turn is one axis reflection', 'Un giro de media vuelta es un reflejo sobre un eje', 'Changing both signs is a half-turn around the origin, not one axis reflection.', 'Cambiar ambos signos es un giro de media vuelta alrededor del origen, no un reflejo sobre un solo eje.')],
  validate: (v) => checked(v, [[-6, 6], [-6, 6], [-6, 6], [-6, 6]], ['A x', 'A y', 'B x', 'B y']),
  describeValues([ax, ay, bx, by]) { const xMirror = bx === ax && by === -ay, yMirror = by === ay && bx === -ax; return { table: { head: ['Point', 'x-coordinate', 'y-coordinate'], tones: [null, 'a', 'b'], rows: [row('A', ax, ay), row('B', bx, by), row('A reflected across x-axis', ax, -ay), row('A reflected across y-axis', -ax, ay)] }, equation: { text: `x-axis: (${ax}, ${ay}) → (${ax}, ${-ay}); y-axis: (${ax}, ${ay}) → (${-ax}, ${ay})`, note: 'A single axis reflection changes only the coordinate perpendicular to that axis.' }, words: `Across x, x stays ${ax} and y changes from ${ay} to ${-ay}. Across y, y stays ${ay} and x changes from ${ax} to ${-ax}.`, invariant: { holds: xMirror || yMirror, text: `B is ${xMirror ? 'an x-axis reflection' : yMirror ? 'a y-axis reflection' : 'not a single-axis reflection'} of A.` }, a11y: `A is (${ax}, ${ay}); its x reflection is (${ax}, ${-ay}) and its y reflection is (${-ax}, ${ay}).` }; },
  testValues(v, id) { const [ax, ay, bx, by] = v; let after, ok, why, wrong = null; if (id === 'reflect-x') { after = [ax, ay, ax, -ay]; ok = after[2] === after[0] && after[3] === -after[1]; why = `Across x, x stays ${ax}; y changes sign from ${ay} to ${-ay}.`; } else if (id === 'reflect-y') { after = [ax, ay, -ax, ay]; ok = after[2] === -after[0] && after[3] === after[1]; why = `Across y, y stays ${ay}; x changes sign from ${ax} to ${-ax}.`; } else if (id === 'negate-both') { after = [ax, ay, -ax, -ay]; ok = (after[2] === after[0] && after[3] === -after[1]) || (after[3] === after[1] && after[2] === -after[0]); wrong = 'both-signs'; why = `B becomes (${-ax}, ${-ay}); both signs changed, which is a half-turn, not generally a single-axis reflection.`; } else throw new RangeError(`Unknown idea ${id}.`); return result(this, id, v.slice(0, 4), after, ok, why, wrong); },
});

const inequalityBridge = (mode) => {
  const entry = mode === 'entry', symbol = entry ? '>=' : '<=', word = entry ? 'minimum' : 'maximum';
  const bridge = makeBridge({
    key: `inequality:${mode}`,
    quantities: [q('boundary', entry ? 'Entry minimum' : 'Budget maximum', entry ? 'Mínimo de entrada' : 'Máximo del presupuesto', '', ''), q('test', entry ? 'Age or score tested' : 'Amount tested', entry ? 'Edad o puntaje de prueba' : 'Cantidad de prueba', '', '', 'b')],
    domain: `Boundary is a whole number from 1 to 24; the test value is a whole number from 0 to 30. The inclusive rule is x ${entry ? '≥' : '≤'} boundary.`,
    domainEs: `El límite es un entero de 1 a 24; el valor de prueba es un entero de 0 a 30. La regla inclusiva es x ${entry ? '≥' : '≤'} límite.`,
    invariants: [`The test qualifies exactly when it meets the inclusive ${word} rule x ${entry ? '≥' : '≤'} boundary.`],
    invariantsEs: [`El valor cumple exactamente cuando satisface la regla inclusiva de ${entry ? 'mínimo' : 'máximo'} x ${entry ? '≥' : '≤'} límite.`],
    transformations: [idea('test-boundary', 'Test the boundary itself', 'Prueba el límite mismo', `Does a value equal to the ${word} qualify?`, `¿Cumple un valor igual al ${entry ? 'mínimo' : 'máximo'}?`), idea('move-test', 'Change the test value by', 'Cambia el valor de prueba en', 'Will the same value still qualify after moving it?', '¿Seguirá cumpliendo el mismo valor después de moverlo?', { label: 'Units', labelEs: 'Unidades', min: 1, max: 5, value: 1 }), idea('reverse-rule', `Read the rule in the opposite direction (${entry ? '≤' : '≥'})`, `Lee la regla en dirección contraria (${entry ? '≤' : '≥'})`, 'Will reversing the direction give the same decision?', '¿Invertir la dirección dará la misma decisión?')],
    misconceptions: [misconception('boundary-excluded', 'The boundary never qualifies', 'El límite nunca cumple', 'The equality bar means the boundary is included in this rule.', 'La barra de igualdad indica que el límite está incluido en esta regla.'), misconception('wrong-direction', 'The inequality arrow points the wrong way', 'El signo de desigualdad apunta al lado equivocado', 'For a minimum, values at or above qualify; for a maximum, values at or below qualify.', 'Con un mínimo, cumplen los valores iguales o mayores; con un máximo, los iguales o menores.'), misconception('one-answer', 'An inequality has only one solution', 'Una desigualdad tiene una sola solución', 'Every value in the shaded direction that meets the rule is a solution.', 'Cada valor en la dirección sombreada que satisface la regla es una solución.')],
    validate: (v) => checked(v, [[1, 24], [0, 30]], ['Boundary', 'Test value']),
    describeValues([bound, value]) { const pass = entry ? value >= bound : value <= bound, shown = entry ? '≥' : '≤'; return { table: { head: ['Rule', 'Test value', 'Decision'], tones: [null, 'a', 'b'], rows: [row('Inclusive boundary', `x ${shown} ${bound}`, 'boundary included'), row('Test', value, pass ? 'qualifies' : 'does not qualify')] }, equation: { text: `x ${shown} ${bound}; test x = ${value}: ${pass ? 'qualifies' : 'does not qualify'}`, note: `At the boundary x = ${bound}, the rule includes equality.` }, words: `${entry ? 'At least' : 'At most'} ${bound} qualifies. The tested value ${value} ${pass ? 'meets' : 'does not meet'} the rule.`, invariant: { holds: pass === (entry ? value >= bound : value <= bound), text: `x ${shown} ${bound} is ${pass ? 'true' : 'false'} when x = ${value}.` }, a11y: `The inclusive rule is x ${shown} ${bound}; the test value ${value} ${pass ? 'qualifies' : 'does not qualify'}.` }; },
    testValues(v, id, p) { const [bound, value] = v, pass = (x) => entry ? x >= bound : x <= bound; let after, ok, why, wrong = null; if (id === 'test-boundary') { after = [bound, bound]; ok = pass(bound); why = `At the boundary, ${bound} ${symbol} ${bound} is true because equality is included.`; } else if (id === 'move-test') { const d = int(p, 1, 5, 'Units'), next = entry ? value + d : value - d; after = [bound, next]; ok = pass(value) === pass(next); wrong = 'wrong-direction'; why = `The test changes from ${value} (${pass(value) ? 'qualifies' : 'does not qualify'}) to ${next} (${pass(next) ? 'qualifies' : 'does not qualify'}) under x ${entry ? '≥' : '≤'} ${bound}.`; } else if (id === 'reverse-rule') { after = [bound, value]; const opposite = entry ? value <= bound : value >= bound; ok = pass(value) === opposite; wrong = 'wrong-direction'; why = `The correct rule says ${pass(value) ? 'qualifies' : 'does not qualify'}; the reversed rule says ${opposite ? 'qualifies' : 'does not qualify'}.`; } else throw new RangeError(`Unknown idea ${id}.`); return result(this, id, v.slice(0, 2), after, ok, why, wrong, after[0] >= 1 && after[0] <= 24 && after[1] >= 0 && after[1] <= 30); },
  });
  return bridge;
};

const expressionDistribute = makeBridge({
  key: 'expression:distribute',
  quantities: [q('factor', 'Factor a', 'Factor a'), q('constant', 'Constant b', 'Constante b', '', '', 'b'), q('x', 'Value of x', 'Valor de x', '', '', 'a')],
  domain: 'a is 1 to 8; b and x are whole numbers from 1 to 10.', domainEs: 'a va de 1 a 8; b y x son números enteros del 1 al 10.',
  invariants: ['The distributive property gives a(x + b) = ax + ab for every allowed value of x.'], invariantsEs: ['La propiedad distributiva da a(x + b) = ax + ab para cada valor permitido de x.'],
  transformations: [idea('substitute', 'Substitute this value for x', 'Sustituye este valor por x', 'After substitution, do the grouped and expanded expressions still match?', 'Después de sustituir, ¿coinciden la expresión agrupada y la desarrollada?', { label: 'x', labelEs: 'x', min: 1, max: 10, value: 5 }), idea('distribute', 'Expand the factor across both terms', 'Distribuye el factor a ambos términos', 'Does a(x + b) equal ax + ab at this x?', '¿Es a(x + b) igual a ax + ab con este valor de x?'), idea('omit-factor', 'Use ax + b and omit a from the second term', 'Usa ax + b y omite a en el segundo término', 'Will omitting the factor from the second term keep the value?', '¿Omitir el factor del segundo término conservará el valor?')],
  misconceptions: [misconception('one-term', 'Multiply only the x term', 'Multiplicar solo el término con x', 'The factor multiplies every term inside the parentheses.', 'El factor multiplica cada término dentro de los paréntesis.'), misconception('combine-inside', 'Add the factor to the terms', 'Sumar el factor a los términos', 'Distribution is multiplication over addition: a multiplies x and b.', 'La distributiva multiplica sobre la suma: a multiplica x y b.'), misconception('omit-factor', 'The constant term does not get the factor', 'El término constante no recibe el factor', 'a(x + b) becomes ax + ab, not ax + b.', 'a(x + b) se convierte en ax + ab, no en ax + b.')],
  validate: (v) => checked(v, [[1, 8], [1, 10], [1, 10]], ['a', 'b', 'x']),
  describeValues([a, b, x]) { const grouped = a * (x + b), first = a * x, second = a * b; return { table: { head: ['Form', 'Substitution', 'Value'], tones: [null, 'a', 'b'], rows: [row('Grouped', `${a}(${x} + ${b})`, grouped), row('Expanded', `${a}×${x} + ${a}×${b}`, first + second), row('Terms', `${first} + ${second}`, first + second)] }, equation: { text: `${a}(${x} + ${b}) = ${a}×${x} + ${a}×${b} = ${grouped}`, note: `${grouped} = ${first} + ${second}` }, words: `With x = ${x}, the grouped form is ${grouped}; the expanded form is ${first} + ${second} = ${first + second}.`, invariant: { holds: grouped === first + second, text: `${a}(${x} + ${b}) = ${grouped} = ${first} + ${second}` }, a11y: `Substitute x equals ${x}: ${a} times (${x} plus ${b}) equals ${grouped}; ${a} times ${x} plus ${a} times ${b} also equals ${grouped}.` }; },
  testValues(v, id, p) { const [a, b, x] = v; let after = v.slice(0, 3), ok, why, wrong = null; if (id === 'substitute') { const next = int(p, 1, 10, 'x'); after = [a, b, next]; const lhs = a * (next + b), rhs = a * next + a * b; ok = lhs === rhs; why = `At x = ${next}, ${a}(${next} + ${b}) = ${lhs} and ${a}×${next} + ${a}×${b} = ${rhs}.`; } else if (id === 'distribute') { const lhs = a * (x + b), rhs = a * x + a * b; ok = lhs === rhs; why = `${a}(${x} + ${b}) = ${lhs}; ${a}×${x} + ${a}×${b} = ${a * x} + ${a * b} = ${rhs}.`; } else if (id === 'omit-factor') { const lhs = a * (x + b), rhs = a * x + b; ok = lhs === rhs; wrong = 'omit-factor'; why = `${a}(${x} + ${b}) = ${lhs}, while ${a}×${x} + ${b} = ${rhs}; the second term also needs factor ${a}.`; } else throw new RangeError(`Unknown idea ${id}.`); return result(this, id, v.slice(0, 3), after, ok, why, wrong); },
});

const growthBridge = (mode) => {
  const cfg = {
    'ratio-graph': { x: 'Carriages', xEs: 'Vagones', y: 'Passengers', yEs: 'Pasajeros', prefix: 'proportional', startLo: 0, startHi: 0, domainEs: 'La tasa va de 1 a 8; el inicio se fija en 0 y los vagones van de 1 a 12.' },
    weather: { x: 'Hours', xEs: 'Horas', y: 'Water (mm)', yEs: 'Agua (mm)', prefix: 'growth', startLo: 0, startHi: 12, domainEs: 'La tasa va de 1 a 8, la lectura inicial de 0 a 12 y las horas de 1 a 12.' },
    fees: { x: 'Items', xEs: 'Artículos', y: 'Cost ($)', yEs: 'Costo ($)', prefix: 'growth', startLo: 0, startHi: 12, domainEs: 'La tasa va de 1 a 8, la tarifa inicial de 0 a 12 y los artículos de 1 a 12.' },
    future: { x: 'Case', xEs: 'Caso', y: 'Amount', yEs: 'Cantidad', prefix: 'growth', startLo: 0, startHi: 12, domainEs: 'El cambio va de 1 a 8, la cantidad inicial de 0 a 12 y el caso de 1 a 12.' },
  }[mode];
  const isProp = mode === 'ratio-graph';
  return makeBridge({
    key: `growth:${mode}`,
    quantities: [q('rate', isProp ? 'Passengers per carriage' : 'Change per step', isProp ? 'Pasajeros por vagón' : 'Cambio por paso', 'per step', 'por paso'), q('start', 'Starting amount', 'Cantidad inicial', 'units', 'unidades', 'b'), q('input', cfg.x, cfg.xEs, 'steps', 'pasos', 'a')],
    domain: isProp ? 'The rate is a whole number from 1 to 8, the start is fixed at 0, and the input is a whole number from 1 to 12.' : `The rate is a whole number from 1 to 8, the starting amount from ${cfg.startLo} to ${cfg.startHi}, and the input from 1 to 12.`,
    domainEs: cfg.domainEs,
    invariants: [isProp ? 'The output is rate × input, so output ÷ input stays equal to the rate and the graph goes through (0, 0).' : 'The output follows y = rate × input + start; each one-step increase adds the same rate.'],
    invariantsEs: [isProp ? 'La salida es tasa × entrada, así que salida ÷ entrada es la tasa y la gráfica pasa por (0, 0).' : 'La salida sigue y = tasa × entrada + inicio; cada aumento de una unidad suma la misma tasa.'],
    transformations: [idea('next-input', 'Increase the input by', 'Aumenta la entrada en', 'Will each added input step add the same amount to the output?', '¿Cada paso añadido a la entrada sumará la misma cantidad a la salida?', { label: 'Steps', labelEs: 'Pasos', min: 1, max: 4, value: 1 }), idea('change-start', 'Increase the starting amount by', 'Aumenta la cantidad inicial en', 'Will the rate of change stay the same?', '¿Se mantendrá igual la tasa de cambio?', { label: 'Units', labelEs: 'Unidades', min: 1, max: 4, value: 1 }), idea('change-rate', 'Increase the rate and input by the same amount', 'Aumenta la tasa y la entrada en la misma cantidad', 'Will this keep the same rate and relationship?', '¿Esto conservará la misma tasa y relación?', { label: 'Amount', labelEs: 'Cantidad', min: 1, max: 3, value: 1 })],
    misconceptions: [misconception('start-is-rate', 'The starting amount is the rate', 'La cantidad inicial es la tasa', 'The start is the output at input zero; the rate is the equal change for each step.', 'El inicio es la salida cuando la entrada es cero; la tasa es el cambio igual en cada paso.'), misconception('multiply-start', 'Multiply the starting amount by the input', 'Multiplicar la cantidad inicial por la entrada', 'Use rate × input, then add the starting amount.', 'Multiplica tasa × entrada y después suma la cantidad inicial.'), misconception('change-rate', 'Adding the same amount to rate and input keeps the same rule', 'Sumar lo mismo a la tasa y la entrada conserva la regla', 'The rate is the coefficient of the input; changing it changes the relationship.', 'La tasa es el coeficiente de la entrada; cambiarla modifica la relación.')],
    validate: (v) => checked(v, [[1, 8], [cfg.startLo, cfg.startHi], [1, 12]], ['Rate', 'Starting amount', cfg.x]),
    describeValues([rate, start, input]) { const y = rate * input + start; const xs = [0, 1, 2, input].filter((x, i, all) => all.indexOf(x) === i); const rows = xs.map((x) => row(`x = ${x}`, x, rate * x + start)); return { table: { head: ['Input', cfg.x, cfg.y], tones: [null, 'a', 'b'], rows }, equation: { text: isProp ? `y = ${rate} × ${input} = ${y}` : `y = ${rate} × ${input} + ${start} = ${y}`, note: `At input 0, output is ${start}; each step adds ${rate}.` }, words: `${cfg.y} is ${rate} times ${cfg.x.toLowerCase()}${start ? ` plus the starting amount ${start}` : ''}. At ${cfg.x.toLowerCase()} ${input}, the output is ${y}.`, invariant: { holds: xs.every((x) => rate * x + start - (rate * (x - 1) + start) === rate || x === 0), text: isProp ? `Start is 0, so y/x = ${rate} for every positive input.` : `The starting amount is ${start}; each additional input step adds ${rate}.` }, a11y: `Rule y equals ${rate} times input plus ${start}; at input ${input}, output is ${y}.` }; },
    testValues(v, id, p) { const [rate, start, input] = v, oldY = rate * input + start; let after, ok, why, wrong = null; if (id === 'next-input') { const d = int(p, 1, 4, 'Steps'); after = [rate, start, input + d]; ok = after[0] === rate && (rate * after[2] + start) - oldY === rate * d; why = `Input grows by ${d}; output changes from ${oldY} to ${rate * after[2] + start}, a change of ${rate * d}.`; } else if (id === 'change-start') { const d = int(p, 1, 4, 'Units'); after = [rate, start + d, input]; ok = after[0] === rate; why = `The start and output each rise by ${d}; the amount added per input step remains ${rate}.`; } else if (id === 'change-rate') { const d = int(p, 1, 3, 'Amount'); after = [rate + d, start, input + d]; ok = after[0] === rate; wrong = 'change-rate'; why = `The rate changes from ${rate} to ${rate + d}; the input changes from ${input} to ${input + d}. The slope is different.`; } else throw new RangeError(`Unknown idea ${id}.`); return result(this, id, v.slice(0, 3), after, ok, why, wrong, after[0] <= 8 && after[1] <= cfg.startHi && after[2] <= 12); },
  });
};

const newBridges = [
  ratioCompare, percentGrid, percentDiscount,
  fractionBridge('fraction:servings', 'servings', { unit: 'servings', unitEs: 'porciones' }),
  fractionBridge('fraction:ribbon', 'ribbon', { unit: 'units of ribbon', unitEs: 'unidades de cinta' }),
  fractionBridge('fraction:field', 'field', { unit: 'liters', unitEs: 'litros' }),
  lineOpposites, lineAbsolute, coordinatesReflect,
  inequalityBridge('entry'), inequalityBridge('budget'), expressionDistribute,
  ...['ratio-graph', 'weather', 'fees', 'future'].map(growthBridge),
];

export const BRIDGES = [ratioMixer, percentWhole, powerOrder, balanceAdd, areaTriangle, ...newBridges];
const byKey = new Map(BRIDGES.map((x) => [x.key, x]));
/** The bridge for a lab's model, or null when that model has none yet. */
export const bridgeFor = (model) => byKey.get(`${model.kind}:${model.mode}`) || null;
