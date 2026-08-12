/* =============================================================================
 * Class Boss — question bank.
 * -----------------------------------------------------------------------------
 * One entry per misconception tag in data/misconception-labels.json (19 tags),
 * each with at least four question templates. A template is a pure function of a
 * seeded PRNG, so the same seed always rebuilds the same question — that is what
 * lets thirty Chromebooks and the projector agree on what the boss just threw.
 *
 * CONTRACT every template must honour (tools/validate-class-boss.mjs enforces
 * it by recomputing both numbers independently):
 *   values      every number the answer depends on, named. The validator only
 *               ever sees `values`, never the template's own arithmetic.
 *   correct     the mathematically correct answer.
 *   distractor  the value a student produces by making EXACTLY the error the tag
 *               names — not "a wrong number", THE wrong number.
 *   prompt      { en, es }. Full Spanish parity; no English left in the ES text.
 *
 * NO TIMERS. Nothing in this file may measure or display elapsed time. Timed
 * pressure is banned platform-wide; the validator greps this file for it.
 *
 * Imported by ./boss.js (browser) and tools/validate-class-boss.mjs (node), so
 * it must stay dependency-free, side-effect-free plain ESM.
 * ========================================================================== */

/** The closed tag vocabulary, sorted. Mirrors data/misconception-labels.json. */
export const BOSS_TAGS = [
  "algebra-distributive-partial",
  "coord-xy-swapped",
  "decimal-place-value",
  "exponent-as-multiplication",
  "fraction-added-denominators",
  "fraction-no-reciprocal",
  "fraction-straight-across-division",
  "geom-triangle-area-no-half",
  "geom-surface-area-as-volume",
  "geom-volume-added-dimensions",
  "measure-area-perimeter-swap",
  "op-added-instead-of-multiplied",
  "op-divided-instead-of-multiplied",
  "op-multiplied-instead-of-added",
  "op-multiplied-instead-of-divided",
  "op-reversed-division",
  "op-reversed-subtraction",
  "order-of-operations-left-to-right",
  "percent-scale-off-by-100",
  "percent-used-as-whole-number",
  "rate-not-per-one",
  "ratio-inverted",
  "sign-dropped",
  "stat-summed-instead-of-averaged",
];

/* ---------------------------------------------------------------------------
 * Deterministic randomness. Math.random() is never used anywhere in Class Boss:
 * every device must land on the same boss and the same question for a seed.
 * ------------------------------------------------------------------------- */

/** FNV-1a — a stable 32-bit hash of a string. */
export function hashSeed(input) {
  const str = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 PRNG with integer/pick helpers. */
export function makeRng(seed) {
  let a = (typeof seed === "number" ? seed : hashSeed(seed)) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

/* ---------------------------------------------------------------------------
 * Small exact-math helpers. Fractions and ratios are carried as strings so a
 * choice button shows "7/12", not 0.5833333333333334.
 * ------------------------------------------------------------------------- */

export function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Reduced fraction as a string; whole numbers collapse ("6/3" -> "2"). */
export function frac(n, d) {
  let num = n;
  let den = d;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  const N = num / g;
  const D = den / g;
  return D === 1 ? String(N) : `${N}/${D}`;
}

/** Reduced ratio as a string, e.g. "3 : 5". */
export function ratio(a, b) {
  const g = gcd(a, b);
  return `${a / g} : ${b / g}`;
}

/** An ordered pair, rendered the one way every coordinate question shows it. */
export function point(x, y) {
  return `(${x}, ${y})`;
}

/** Kill binary-float dust without turning 0.12 into "0.12000000000000001". */
export function round(x, places = 4) {
  const f = 10 ** places;
  return Math.round(x * f) / f;
}

/** How many decimal places a value shows — used to size near-miss decoys. */
function decimals(x) {
  const s = String(x);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

/** A number list rendered for a prompt: "12, 15, 9, 20". */
function list(vals) {
  return vals.join(", ");
}

const COPRIME = [
  [2, 3],
  [3, 4],
  [3, 5],
  [4, 5],
  [5, 6],
  [2, 5],
  [5, 7],
  [3, 7],
  [4, 7],
  [5, 8],
  [2, 7],
  [7, 9],
];
const PERCENTS = [5, 10, 15, 20, 25, 40, 50, 60, 75, 80];

/** A data set of `n` whole numbers whose mean is a whole number. */
function meanSet(r, n, lo, hi) {
  for (let tries = 0; tries < 24; tries += 1) {
    const m = r.int(lo + 3, hi - 3);
    const vals = [];
    let sum = 0;
    for (let i = 0; i < n - 1; i += 1) {
      const v = m + r.int(-3, 3);
      vals.push(v);
      sum += v;
    }
    const last = m * n - sum;
    if (last >= lo && last <= hi) {
      vals.push(last);
      return { vals, mean: m };
    }
  }
  const flat = new Array(n).fill(lo + 4);
  return { vals: flat, mean: lo + 4 };
}

const T = (id, build) => ({ id, build });

/* ===========================================================================
 * THE BANK — 19 tags x 4 templates.
 * ======================================================================== */

export const QUESTION_BANK = {
  /* --- Gave the total instead of the unit rate --------------------------- */
  "rate-not-per-one": [
    T("rate-apples", (r) => {
      const n = r.int(2, 9);
      const total = n * r.int(2, 9);
      return {
        values: { n, total },
        correct: total / n,
        distractor: total,
        prompt: {
          en: `A market sells ${n} pounds of apples for $${total} altogether. How many dollars does ONE pound cost?`,
          es: `Un mercado vende ${n} libras de manzanas por $${total} en total. ¿Cuántos dólares cuesta UNA libra?`,
        },
      };
    }),
    T("rate-drive", (r) => {
      const h = r.int(2, 8);
      const d = h * (r.int(3, 13) * 5);
      return {
        values: { h, d },
        correct: d / h,
        distractor: d,
        prompt: {
          en: `A bus travels ${d} miles in ${h} hours at a steady speed. How many miles does it travel in ONE hour?`,
          es: `Un autobús recorre ${d} millas en ${h} horas a velocidad constante. ¿Cuántas millas recorre en UNA hora?`,
        },
      };
    }),
    T("rate-notebooks", (r) => {
      const n = r.int(3, 12);
      const total = n * r.int(2, 7);
      return {
        values: { n, total },
        correct: total / n,
        distractor: total,
        prompt: {
          en: `${n} notebooks cost $${total} in all. How many dollars does ONE notebook cost?`,
          es: `${n} cuadernos cuestan $${total} en total. ¿Cuántos dólares cuesta UN cuaderno?`,
        },
      };
    }),
    T("rate-printer", (r) => {
      const m = r.int(2, 9);
      const p = m * r.int(4, 15);
      return {
        values: { m, p },
        correct: p / m,
        distractor: p,
        prompt: {
          en: `A printer prints ${p} pages in ${m} minutes at a steady rate. How many pages does it print in ONE minute?`,
          es: `Una impresora imprime ${p} páginas en ${m} minutos a ritmo constante. ¿Cuántas páginas imprime en UN minuto?`,
        },
      };
    }),
  ],

  /* --- Flipped the ratio ------------------------------------------------- */
  "ratio-inverted": [
    T("ratio-marbles", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 6);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: ratio(second, first),
        prompt: {
          en: `A jar holds ${first} red marbles and ${second} blue marbles. Write the ratio of RED to BLUE in simplest form.`,
          es: `Un frasco tiene ${first} canicas rojas y ${second} canicas azules. Escribe la razón de ROJAS a AZULES en su forma más simple.`,
        },
      };
    }),
    T("ratio-pets", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 5);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: ratio(second, first),
        prompt: {
          en: `A shelter has ${first} cats and ${second} dogs. Write the ratio of CATS to DOGS in simplest form.`,
          es: `Un refugio tiene ${first} gatos y ${second} perros. Escribe la razón de GATOS a PERROS en su forma más simple.`,
        },
      };
    }),
    T("ratio-recipe", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 4);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: ratio(second, first),
        prompt: {
          en: `A recipe uses ${first} cups of flour and ${second} cups of sugar. Write the ratio of FLOUR to SUGAR in simplest form.`,
          es: `Una receta usa ${first} tazas de harina y ${second} tazas de azúcar. Escribe la razón de HARINA a AZÚCAR en su forma más simple.`,
        },
      };
    }),
    T("ratio-class", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 4);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: ratio(second, first),
        prompt: {
          en: `A class has ${first} girls and ${second} boys. Write the ratio of GIRLS to BOYS in simplest form.`,
          es: `Una clase tiene ${first} niñas y ${second} niños. Escribe la razón de NIÑAS a NIÑOS en su forma más simple.`,
        },
      };
    }),
  ],

  /* --- Percent answer off by a factor of 100 ----------------------------- */
  "percent-scale-off-by-100": [
    T("pct-plain", (r) => {
      const p = r.pick(PERCENTS);
      const n = r.int(2, 12) * 20;
      return {
        values: { p, n },
        correct: (n * p) / 100,
        distractor: n * p,
        prompt: {
          en: `What is ${p}% of ${n}?`,
          es: `¿Cuánto es el ${p}% de ${n}?`,
        },
      };
    }),
    T("pct-tax", (r) => {
      const p = r.pick(PERCENTS);
      const n = r.int(2, 10) * 20;
      return {
        values: { p, n },
        correct: (n * p) / 100,
        distractor: n * p,
        prompt: {
          en: `A jacket costs $${n}. The tax is ${p}% of the price. How many dollars is the tax?`,
          es: `Una chaqueta cuesta $${n}. El impuesto es el ${p}% del precio. ¿De cuántos dólares es el impuesto?`,
        },
      };
    }),
    T("pct-bus", (r) => {
      const p = r.pick(PERCENTS);
      const n = r.int(3, 12) * 20;
      return {
        values: { p, n },
        correct: (n * p) / 100,
        distractor: n * p,
        prompt: {
          en: `${n} students are in the grade and ${p}% of them ride the bus. How many students ride the bus?`,
          es: `Hay ${n} estudiantes en el grado y el ${p}% viaja en autobús. ¿Cuántos estudiantes viajan en autobús?`,
        },
      };
    }),
    T("pct-miles", (r) => {
      const p = r.pick(PERCENTS);
      const n = r.int(2, 9) * 20;
      return {
        values: { p, n },
        correct: (n * p) / 100,
        distractor: n * p,
        prompt: {
          en: `A trail is ${n} miles long. A hiker has finished ${p}% of it. How many miles has the hiker finished?`,
          es: `Un sendero mide ${n} millas. Un excursionista ha completado el ${p}% del sendero. ¿Cuántas millas ha completado?`,
        },
      };
    }),
  ],

  /* --- Used the percent as a plain number -------------------------------- */
  "percent-used-as-whole-number": [
    T("pctwn-points", (r) => {
      const p = r.pick(PERCENTS);
      let n = r.int(2, 12) * 20;
      if (n === 100) n = 120;
      return {
        values: { p, n },
        correct: n + (n * p) / 100,
        distractor: n + p,
        prompt: {
          en: `A team scored ${n} points last season. This season it scored ${p}% MORE than that. How many points did it score this season?`,
          es: `Un equipo anotó ${n} puntos la temporada pasada. Esta temporada anotó un ${p}% MÁS. ¿Cuántos puntos anotó esta temporada?`,
        },
      };
    }),
    T("pctwn-price", (r) => {
      const p = r.pick(PERCENTS);
      let n = r.int(2, 10) * 20;
      if (n === 100) n = 140;
      return {
        values: { p, n },
        correct: n + (n * p) / 100,
        distractor: n + p,
        prompt: {
          en: `A bike costs $${n}. The price goes UP by ${p}%. How many dollars does the bike cost now?`,
          es: `Una bicicleta cuesta $${n}. El precio SUBE un ${p}%. ¿Cuántos dólares cuesta ahora la bicicleta?`,
        },
      };
    }),
    T("pctwn-cars", (r) => {
      const p = r.pick([10, 20, 25, 40, 50, 60, 75, 80]);
      let n = r.int(3, 12) * 20;
      if (n === 100) n = 160;
      return {
        values: { p, n },
        correct: n - (n * p) / 100,
        distractor: n - p,
        prompt: {
          en: `There are ${n} cars in a lot. ${p}% of them drive away. How many cars are LEFT in the lot?`,
          es: `Hay ${n} carros en un estacionamiento. El ${p}% se va. ¿Cuántos carros QUEDAN en el estacionamiento?`,
        },
      };
    }),
    T("pctwn-books", (r) => {
      const p = r.pick(PERCENTS);
      let n = r.int(2, 11) * 20;
      if (n === 100) n = 180;
      return {
        values: { p, n },
        correct: n + (n * p) / 100,
        distractor: n + p,
        prompt: {
          en: `A library shelf holds ${n} books. The librarian adds ${p}% MORE books. How many books are on the shelf now?`,
          es: `Un estante de la biblioteca tiene ${n} libros. La bibliotecaria agrega un ${p}% MÁS de libros. ¿Cuántos libros hay ahora en el estante?`,
        },
      };
    }),
  ],

  /* --- Right digits, wrong magnitude ------------------------------------- */
  "decimal-place-value": [
    T("dec-tenths-product", (r) => {
      const a = r.int(2, 9);
      const b = r.int(2, 9);
      return {
        values: { a, b },
        correct: round((a * b) / 100),
        distractor: round((a * b) / 10),
        prompt: {
          en: `What is 0.${a} × 0.${b}?`,
          es: `¿Cuánto es 0.${a} × 0.${b}?`,
        },
      };
    }),
    T("dec-tenth-whole", (r) => {
      const a = r.int(2, 9);
      const b = r.int(3, 19);
      return {
        values: { a, b },
        correct: round((a * b) / 10),
        distractor: a * b,
        prompt: {
          en: `What is 0.${a} × ${b}?`,
          es: `¿Cuánto es 0.${a} × ${b}?`,
        },
      };
    }),
    T("dec-div-100", (r) => {
      const n = r.int(12, 98);
      return {
        values: { n },
        correct: round(n / 100),
        distractor: round(n / 10),
        prompt: {
          en: `What is ${n} ÷ 100?`,
          es: `¿Cuánto es ${n} ÷ 100?`,
        },
      };
    }),
    T("dec-times-10", (r) => {
      const w = r.int(1, 9);
      const f = r.int(1, 9);
      return {
        values: { w, f },
        correct: w * 10 + f,
        distractor: (w * 10 + f) * 10,
        prompt: {
          en: `What is ${w}.${f} × 10?`,
          es: `¿Cuánto es ${w}.${f} × 10?`,
        },
      };
    }),
  ],

  /* --- Multiplied the base by the exponent ------------------------------- */
  "exponent-as-multiplication": [
    T("exp-power", (r) => {
      const b = r.int(2, 6);
      let e = r.int(2, 4);
      if (b === 2 && e === 2) e = 3; // 2^2 and 2x2 collide
      return {
        values: { b, e },
        correct: b ** e,
        distractor: b * e,
        prompt: {
          en: `What is ${b}^${e} (that is ${b} to the power of ${e})?`,
          es: `¿Cuánto es ${b}^${e} (es decir, ${b} elevado a la ${e})?`,
        },
      };
    }),
    T("exp-cube", (r) => {
      const s = r.int(2, 9);
      return {
        values: { s },
        correct: s ** 3,
        distractor: s * 3,
        prompt: {
          en: `A cube has edges ${s} cm long. Its volume is ${s}^3 cubic cm. How many cubic cm is that?`,
          es: `Un cubo tiene aristas de ${s} cm. Su volumen es ${s}^3 cm cúbicos. ¿Cuántos cm cúbicos son?`,
        },
      };
    }),
    T("exp-square", (r) => {
      const b = r.int(3, 12);
      return {
        values: { b },
        correct: b * b,
        distractor: 2 * b,
        prompt: {
          en: `What is ${b} squared (${b}^2)?`,
          es: `¿Cuánto es ${b} al cuadrado (${b}^2)?`,
        },
      };
    }),
    T("exp-ten", (r) => {
      const e = r.int(2, 5);
      return {
        values: { e },
        correct: 10 ** e,
        distractor: 10 * e,
        prompt: {
          en: `What is 10^${e}?`,
          es: `¿Cuánto es 10^${e}?`,
        },
      };
    }),
  ],

  /* --- Added the denominators -------------------------------------------- */
  "fraction-added-denominators": [
    T("fadd-unit", (r) => {
      const b = r.int(2, 6);
      let d = r.int(2, 7);
      if (d === b) d = b + 1;
      return {
        values: { b, d },
        correct: frac(b + d, b * d),
        distractor: frac(2, b + d),
        prompt: {
          en: `What is 1/${b} + 1/${d}? Give the answer as a fraction.`,
          es: `¿Cuánto es 1/${b} + 1/${d}? Da la respuesta como fracción.`,
        },
      };
    }),
    T("fadd-general", (r) => {
      const b = r.int(3, 8);
      let d = r.int(3, 8);
      if (d === b) d = b === 8 ? 3 : b + 1;
      const a = r.int(1, b - 1);
      const c = r.int(1, d - 1);
      return {
        values: { a, b, c, d },
        correct: frac(a * d + c * b, b * d),
        distractor: frac(a + c, b + d),
        prompt: {
          en: `What is ${a}/${b} + ${c}/${d}? Give the answer as a fraction.`,
          es: `¿Cuánto es ${a}/${b} + ${c}/${d}? Da la respuesta como fracción.`,
        },
      };
    }),
    T("fadd-pizza", (r) => {
      const b = r.int(3, 8);
      let d = r.int(3, 8);
      if (d === b) d = b === 8 ? 4 : b + 1;
      const a = r.int(1, b - 1);
      const c = r.int(1, d - 1);
      return {
        values: { a, b, c, d },
        correct: frac(a * d + c * b, b * d),
        distractor: frac(a + c, b + d),
        prompt: {
          en: `Maya ate ${a}/${b} of a pizza and Luis ate ${c}/${d} of the same pizza. How much of the pizza did they eat in all?`,
          es: `Maya comió ${a}/${b} de una pizza y Luis comió ${c}/${d} de la misma pizza. ¿Cuánta pizza comieron en total?`,
        },
      };
    }),
    T("fadd-walk", (r) => {
      const b = r.int(3, 7);
      let d = r.int(3, 7);
      if (d === b) d = b === 7 ? 3 : b + 1;
      const a = r.int(1, b - 1);
      const c = r.int(1, d - 1);
      return {
        values: { a, b, c, d },
        correct: frac(a * d + c * b, b * d),
        distractor: frac(a + c, b + d),
        prompt: {
          en: `A dog walker went ${a}/${b} mile, rested, then went ${c}/${d} mile more. How far did the walker go in all?`,
          es: `Un paseador de perros caminó ${a}/${b} de milla, descansó y luego caminó ${c}/${d} de milla más. ¿Cuánto caminó en total?`,
        },
      };
    }),
  ],

  /* --- Divided fractions without inverting -------------------------------
   * Distractor = multiply straight across without flipping the divisor. */
  "fraction-no-reciprocal": [
    T("fdiv-plain", (r) => {
      const b = r.int(3, 8);
      const a = r.int(1, b - 1);
      const d = r.int(3, 8);
      let c = r.int(1, d - 1);
      if (c === d) c = 1;
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(a * c, b * d),
        prompt: {
          en: `What is ${a}/${b} ÷ ${c}/${d}? Give the answer as a fraction.`,
          es: `¿Cuánto es ${a}/${b} ÷ ${c}/${d}? Da la respuesta como fracción.`,
        },
      };
    }),
    T("fdiv-cups", (r) => {
      const b = r.int(2, 6);
      const a = r.int(1, b - 1);
      const d = r.int(3, 8);
      const c = r.int(1, d - 1);
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(a * c, b * d),
        prompt: {
          en: `A jug holds ${a}/${b} of a litre. A scoop holds ${c}/${d} of a litre. How many scoops fit in the jug? (${a}/${b} ÷ ${c}/${d})`,
          es: `Una jarra contiene ${a}/${b} de litro. Un cucharón contiene ${c}/${d} de litro. ¿Cuántos cucharones caben en la jarra? (${a}/${b} ÷ ${c}/${d})`,
        },
      };
    }),
    T("fdiv-ribbon", (r) => {
      const b = r.int(3, 7);
      const a = r.int(1, b - 1);
      const d = r.int(4, 9);
      const c = r.int(1, d - 1);
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(a * c, b * d),
        prompt: {
          en: `A ribbon is ${a}/${b} metre long. It is cut into pieces ${c}/${d} metre long. How many pieces is that? (${a}/${b} ÷ ${c}/${d})`,
          es: `Una cinta mide ${a}/${b} de metro. Se corta en pedazos de ${c}/${d} de metro. ¿Cuántos pedazos son? (${a}/${b} ÷ ${c}/${d})`,
        },
      };
    }),
    T("fdiv-paint", (r) => {
      const b = r.int(2, 5);
      const a = r.int(1, b - 1);
      const d = r.int(3, 9);
      const c = r.int(1, d - 1);
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(a * c, b * d),
        prompt: {
          en: `There is ${a}/${b} of a can of paint left. Each shelf uses ${c}/${d} of a can. How many shelves can be painted? (${a}/${b} ÷ ${c}/${d})`,
          es: `Queda ${a}/${b} de un bote de pintura. Cada repisa usa ${c}/${d} de bote. ¿Cuántas repisas se pueden pintar? (${a}/${b} ÷ ${c}/${d})`,
        },
      };
    }),
  ],

  /* --- Divided numerators and denominators straight across ---------------
   * The numbers are built so BOTH pairs divide evenly the "easy" way
   * (c ÷ a and d ÷ b are whole), which is exactly when students reach for
   * straight-across division. That move returns c/a over d/b — the flip of
   * the real quotient a/b x d/c. */
  "fraction-straight-across-division": [
    T("fsa-plain", (r) => {
      const a = r.int(1, 4);
      const b = r.int(a + 1, 6);
      const k = r.int(2, 5);
      let m = r.int(2, 5);
      if (m === k) m = k === 5 ? 2 : k + 1;
      const c = k * a;
      const d = m * b;
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(c / a, d / b),
        prompt: {
          en: `What is ${a}/${b} ÷ ${c}/${d}? Give the answer as a fraction.`,
          es: `¿Cuánto es ${a}/${b} ÷ ${c}/${d}? Da la respuesta como fracción.`,
        },
      };
    }),
    T("fsa-juice", (r) => {
      const a = r.int(1, 3);
      const b = r.int(a + 1, 5);
      const k = r.int(2, 5);
      let m = r.int(2, 5);
      if (m === k) m = k === 2 ? 4 : 2;
      const c = k * a;
      const d = m * b;
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(c / a, d / b),
        prompt: {
          en: `A bottle holds ${a}/${b} of a litre of juice. A cup holds ${c}/${d} of a litre. How many cups does the bottle fill? (${a}/${b} ÷ ${c}/${d})`,
          es: `Una botella contiene ${a}/${b} de litro de jugo. Un vaso contiene ${c}/${d} de litro. ¿Cuántos vasos llena la botella? (${a}/${b} ÷ ${c}/${d})`,
        },
      };
    }),
    T("fsa-wood", (r) => {
      const a = r.int(1, 4);
      const b = r.int(a + 1, 7);
      const k = r.int(2, 4);
      let m = r.int(2, 4);
      if (m === k) m = k === 4 ? 2 : k + 1;
      const c = k * a;
      const d = m * b;
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(c / a, d / b),
        prompt: {
          en: `A board is ${a}/${b} metre long. Each piece needs to be ${c}/${d} metre. How many pieces is that? (${a}/${b} ÷ ${c}/${d})`,
          es: `Una tabla mide ${a}/${b} de metro. Cada pieza debe medir ${c}/${d} de metro. ¿Cuántas piezas son? (${a}/${b} ÷ ${c}/${d})`,
        },
      };
    }),
    T("fsa-trail", (r) => {
      const a = r.int(1, 3);
      const b = r.int(a + 1, 6);
      const k = r.int(3, 6);
      let m = r.int(2, 5);
      if (m === k) m = 2;
      const c = k * a;
      const d = m * b;
      return {
        values: { a, b, c, d },
        correct: frac(a * d, b * c),
        distractor: frac(c / a, d / b),
        prompt: {
          en: `A trail is ${a}/${b} of a mile. Each marker is ${c}/${d} of a mile apart. How many marker gaps fit on the trail? (${a}/${b} ÷ ${c}/${d})`,
          es: `Un sendero mide ${a}/${b} de milla. Cada marcador está a ${c}/${d} de milla del siguiente. ¿Cuántos tramos entre marcadores caben en el sendero? (${a}/${b} ÷ ${c}/${d})`,
        },
      };
    }),
  ],

  /* --- Swapped area and perimeter ---------------------------------------- */
  /* --- Swapped the x and y coordinates ---------------------------------- */
  // Every template keeps x !== y: on (4, 4) the swap IS the answer, so the
  // question could not tell a confident student from a confused one.
  "coord-xy-swapped": [
    T("xy-plot", (r) => {
      const x = r.int(1, 9);
      let y = r.int(1, 9);
      if (y === x) y = x === 9 ? x - 1 : x + 1;
      return {
        values: { x, y },
        correct: point(x, y),
        distractor: point(y, x),
        prompt: {
          en: `Start at the origin, move ${x} units RIGHT, then ${y} units UP. Which ordered pair is that point?`,
          es: `Empieza en el origen, muévete ${x} unidades a la DERECHA y luego ${y} unidades hacia ARRIBA. ¿Cuál par ordenado es ese punto?`,
        },
      };
    }),
    T("xy-read", (r) => {
      const x = r.int(2, 10);
      let y = r.int(1, 9);
      if (y === x) y = x - 1;
      return {
        values: { x, y },
        correct: point(x, y),
        distractor: point(y, x),
        prompt: {
          en: `A point sits ${x} units along the x-axis and ${y} units up the y-axis. Write it as an ordered pair.`,
          es: `Un punto está a ${x} unidades sobre el eje x y a ${y} unidades hacia arriba en el eje y. Escríbelo como par ordenado.`,
        },
      };
    }),
    T("xy-map", (r) => {
      const x = r.int(1, 8);
      let y = r.int(2, 9);
      if (y === x) y = x + 1;
      return {
        values: { x, y },
        correct: point(x, y),
        distractor: point(y, x),
        prompt: {
          en: `On a park map, the fountain is ${x} blocks east and ${y} blocks north of the entrance. What are its coordinates?`,
          es: `En el mapa de un parque, la fuente está a ${x} cuadras al este y ${y} cuadras al norte de la entrada. ¿Cuáles son sus coordenadas?`,
        },
      };
    }),
    T("xy-negative", (r) => {
      const x = -r.int(1, 8);
      let y = r.int(1, 9);
      if (Math.abs(y) === Math.abs(x)) y = Math.abs(x) + 1;
      return {
        values: { x, y },
        correct: point(x, y),
        distractor: point(y, x),
        prompt: {
          en: `Move ${Math.abs(x)} units LEFT of the origin, then ${y} units UP. Which ordered pair is that point?`,
          es: `Muévete ${Math.abs(x)} unidades a la IZQUIERDA del origen y luego ${y} unidades hacia ARRIBA. ¿Cuál par ordenado es ese punto?`,
        },
      };
    }),
  ],

  "measure-area-perimeter-swap": [
    T("ap-area", (r) => {
      const l = r.int(4, 15);
      let w = r.int(3, 12);
      if (l * w === 2 * (l + w)) w += 1;
      return {
        values: { l, w },
        correct: l * w,
        distractor: 2 * (l + w),
        prompt: {
          en: `A rectangle is ${l} cm long and ${w} cm wide. What is its AREA, in square cm?`,
          es: `Un rectángulo mide ${l} cm de largo y ${w} cm de ancho. ¿Cuál es su ÁREA, en cm cuadrados?`,
        },
      };
    }),
    T("ap-perimeter", (r) => {
      const l = r.int(4, 15);
      let w = r.int(3, 12);
      if (l * w === 2 * (l + w)) w += 1;
      return {
        values: { l, w },
        correct: 2 * (l + w),
        distractor: l * w,
        prompt: {
          en: `A rectangle is ${l} m long and ${w} m wide. What is its PERIMETER, in metres?`,
          es: `Un rectángulo mide ${l} m de largo y ${w} m de ancho. ¿Cuál es su PERÍMETRO, en metros?`,
        },
      };
    }),
    T("ap-square", (r) => {
      let s = r.int(2, 12);
      if (s === 4) s = 5; // 4^2 and 4x4 collide
      return {
        values: { s },
        correct: s * s,
        distractor: 4 * s,
        prompt: {
          en: `A square tile has sides ${s} inches long. What is its AREA, in square inches?`,
          es: `Una baldosa cuadrada tiene lados de ${s} pulgadas. ¿Cuál es su ÁREA, en pulgadas cuadradas?`,
        },
      };
    }),
    T("ap-carpet", (r) => {
      const l = r.int(5, 16);
      let w = r.int(3, 11);
      if (l * w === 2 * (l + w)) w += 1;
      return {
        values: { l, w },
        correct: l * w,
        distractor: 2 * (l + w),
        prompt: {
          en: `A room floor is ${l} ft by ${w} ft. How many square feet of carpet cover the whole floor?`,
          es: `El piso de un cuarto mide ${l} pies por ${w} pies. ¿Cuántos pies cuadrados de alfombra cubren todo el piso?`,
        },
      };
    }),
  ],

  /* --- Found base × height but forgot the half --------------------------- */
  "geom-triangle-area-no-half": [
    T("tri-sail", (r) => {
      const b = r.int(4, 14);
      const h = 2 * r.int(2, 7); // even so the correct answer is whole
      return {
        values: { b, h },
        correct: (b * h) / 2,
        distractor: b * h,
        prompt: {
          en: `A triangular sail has a base of ${b} m and a height of ${h} m. What is its area, in square metres?`,
          es: `Una vela triangular tiene una base de ${b} m y una altura de ${h} m. ¿Cuál es su área, en metros cuadrados?`,
        },
      };
    }),
    T("tri-garden", (r) => {
      const b = 2 * r.int(3, 9);
      const h = r.int(3, 11);
      return {
        values: { b, h },
        correct: (b * h) / 2,
        distractor: b * h,
        prompt: {
          en: `A triangle-shaped garden bed has a base of ${b} ft and a height of ${h} ft. How many square feet is it?`,
          es: `Un jardín en forma de triángulo tiene una base de ${b} pies y una altura de ${h} pies. ¿Cuántos pies cuadrados mide?`,
        },
      };
    }),
    T("tri-ramp", (r) => {
      const b = 2 * r.int(3, 10);
      const h = r.int(2, 9);
      return {
        values: { b, h },
        correct: (b * h) / 2,
        distractor: b * h,
        prompt: {
          en: `A skate ramp's side is a triangle with base ${b} ft and height ${h} ft. What is its area, in square feet?`,
          es: `El lado de una rampa es un triángulo con base de ${b} pies y altura de ${h} pies. ¿Cuál es su área, en pies cuadrados?`,
        },
      };
    }),
    T("tri-flag", (r) => {
      const b = 2 * r.int(2, 8);
      const h = r.int(4, 12);
      return {
        values: { b, h },
        correct: (b * h) / 2,
        distractor: b * h,
        prompt: {
          en: `A pennant flag is a triangle with base ${b} cm and height ${h} cm. What is its area, in square cm?`,
          es: `Un banderín es un triángulo con base de ${b} cm y altura de ${h} cm. ¿Cuál es su área, en cm cuadrados?`,
        },
      };
    }),
  ],

  /* --- Added the dimensions instead of multiplying ----------------------- */
  /* --- Found the volume instead of the surface area ---------------------- */
  "geom-surface-area-as-volume": [
    T("sa-gift", (r) => {
      const l = r.int(3, 8);
      const w = r.int(2, 6);
      let h = r.int(2, 6);
      // The distractor must be WRONG. On a 2×2×2-style box the surface area and
      // the volume can coincide, and a distractor equal to the answer makes the
      // question unanswerable.
      if (2 * (l * w + l * h + w * h) === l * w * h) h += 1;
      return {
        values: { l, w, h },
        correct: 2 * (l * w + l * h + w * h),
        distractor: l * w * h,
        prompt: {
          en: `A gift box is ${l} in by ${w} in by ${h} in. How many square inches of wrapping paper cover it exactly?`,
          es: `Una caja de regalo mide ${l} por ${w} por ${h} pulgadas. ¿Cuántas pulgadas cuadradas de papel la cubren exactamente?`,
        },
      };
    }),
    T("sa-crate", (r) => {
      const l = r.int(4, 9);
      const w = r.int(3, 7);
      let h = r.int(2, 5);
      if (2 * (l * w + l * h + w * h) === l * w * h) h += 1;
      return {
        values: { l, w, h },
        correct: 2 * (l * w + l * h + w * h),
        distractor: l * w * h,
        prompt: {
          en: `A crate measures ${l} ft by ${w} ft by ${h} ft. How many square feet of paint would cover all six faces?`,
          es: `Un cajón mide ${l} por ${w} por ${h} pies. ¿Cuántos pies cuadrados de pintura cubrirían las seis caras?`,
        },
      };
    }),
    T("sa-cube", (r) => {
      let s = r.int(2, 7);
      if (6 * s * s === s * s * s) s += 1; // s = 6 makes them equal
      return {
        values: { s },
        correct: 6 * s * s,
        distractor: s * s * s,
        prompt: {
          en: `A number cube has edges ${s} cm long. What is its surface area, in square cm?`,
          es: `Un cubo tiene aristas de ${s} cm. ¿Cuál es su área total, en cm cuadrados?`,
        },
      };
    }),
    T("sa-net", (r) => {
      const l = r.int(3, 7);
      const w = r.int(2, 6);
      let h = r.int(2, 6);
      if (2 * (l * w + l * h + w * h) === l * w * h) h += 1;
      return {
        values: { l, w, h },
        correct: 2 * (l * w + l * h + w * h),
        distractor: l * w * h,
        prompt: {
          en: `A net folds into a ${l} by ${w} by ${h} unit prism. What is the total area of the net, in square units?`,
          es: `Una plantilla se dobla en un prisma de ${l} por ${w} por ${h} unidades. ¿Cuál es el área total de la plantilla, en unidades cuadradas?`,
        },
      };
    }),
  ],

  "geom-volume-added-dimensions": [
    T("vol-box", (r) => {
      const l = r.int(3, 8);
      const w = r.int(2, 6);
      let h = r.int(2, 6);
      if (l * w * h === l + w + h) h += 1;
      return {
        values: { l, w, h },
        correct: l * w * h,
        distractor: l + w + h,
        prompt: {
          en: `A storage box is ${l} ft by ${w} ft by ${h} ft. How many cubic feet fit inside?`,
          es: `Una caja mide ${l} pies por ${w} pies por ${h} pies. ¿Cuántos pies cúbicos caben adentro?`,
        },
      };
    }),
    T("vol-tank", (r) => {
      const l = r.int(4, 9);
      const w = r.int(3, 7);
      let h = r.int(2, 5);
      if (l * w * h === l + w + h) h += 1;
      return {
        values: { l, w, h },
        correct: l * w * h,
        distractor: l + w + h,
        prompt: {
          en: `An aquarium is ${l} in long, ${w} in wide, and ${h} in tall. What is its volume, in cubic inches?`,
          es: `Un acuario mide ${l} pulgadas de largo, ${w} de ancho y ${h} de alto. ¿Cuál es su volumen, en pulgadas cúbicas?`,
        },
      };
    }),
    T("vol-locker", (r) => {
      const l = r.int(2, 6);
      const w = r.int(2, 5);
      let h = r.int(3, 8);
      if (l * w * h === l + w + h) h += 1;
      return {
        values: { l, w, h },
        correct: l * w * h,
        distractor: l + w + h,
        prompt: {
          en: `A locker cube bin is ${l} ft by ${w} ft by ${h} ft. What is its volume, in cubic feet?`,
          es: `Un casillero mide ${l} pies por ${w} pies por ${h} pies. ¿Cuál es su volumen, en pies cúbicos?`,
        },
      };
    }),
    T("vol-cube", (r) => {
      let s = r.int(2, 7);
      if (s * s * s === 3 * s) s += 1;
      return {
        values: { s },
        correct: s * s * s,
        distractor: 3 * s,
        prompt: {
          en: `A number cube has edges ${s} cm long. What is its volume, in cubic cm?`,
          es: `Un cubo tiene aristas de ${s} cm. ¿Cuál es su volumen, en cm cúbicos?`,
        },
      };
    }),
  ],

  /* --- Distributed to the first term only -------------------------------- */
  "algebra-distributive-partial": [
    T("dist-sum", (r) => {
      const a = r.int(2, 9);
      const b = r.int(2, 9);
      let c = r.int(2, 9);
      if (a * (b + c) === a * b + c) c += 1;
      return {
        values: { a, b, c },
        correct: a * (b + c),
        distractor: a * b + c,
        prompt: {
          en: `Evaluate ${a}(${b} + ${c}).`,
          es: `Evalúa ${a}(${b} + ${c}).`,
        },
      };
    }),
    T("dist-tickets", (r) => {
      const a = r.int(3, 8);
      const b = r.int(4, 12);
      let c = r.int(2, 6);
      if (a * (b + c) === a * b + c) c += 1;
      return {
        values: { a, b, c },
        correct: a * (b + c),
        distractor: a * b + c,
        prompt: {
          en: `${a} friends each pay $${b} for a ticket and $${c} for snacks. How much do they spend in all?`,
          es: `${a} amigos pagan cada uno $${b} por una entrada y $${c} por meriendas. ¿Cuánto gastan en total?`,
        },
      };
    }),
    T("dist-garden", (r) => {
      const a = r.int(2, 6);
      const b = r.int(5, 12);
      let c = r.int(2, 7);
      if (a * (b + c) === a * b + c) c += 1;
      return {
        values: { a, b, c },
        correct: a * (b + c),
        distractor: a * b + c,
        prompt: {
          en: `A garden has ${a} rows. Each row has ${b} tomato plants and ${c} pepper plants. How many plants in all?`,
          es: `Un jardín tiene ${a} filas. Cada fila tiene ${b} plantas de tomate y ${c} de pimiento. ¿Cuántas plantas hay en total?`,
        },
      };
    }),
    T("dist-diff", (r) => {
      const a = r.int(2, 7);
      const b = r.int(6, 14);
      let c = r.int(2, 5);
      if (a * (b - c) === a * b - c) c += 1;
      return {
        values: { a, b, c },
        correct: a * (b - c),
        distractor: a * b - c,
        prompt: {
          en: `Evaluate ${a}(${b} − ${c}).`,
          es: `Evalúa ${a}(${b} − ${c}).`,
        },
      };
    }),
  ],

  /* --- Added when the problem multiplies --------------------------------- */
  "op-added-instead-of-multiplied": [
    T("mul-boxes", (r) => {
      const a = r.int(3, 12);
      const b = r.int(3, 12);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a + b,
        prompt: {
          en: `There are ${a} boxes. Each box holds ${b} crayons. How many crayons are there in all?`,
          es: `Hay ${a} cajas. Cada caja tiene ${b} crayones. ¿Cuántos crayones hay en total?`,
        },
      };
    }),
    T("mul-rows", (r) => {
      const a = r.int(4, 14);
      const b = r.int(3, 11);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a + b,
        prompt: {
          en: `A hall has ${a} rows of chairs with ${b} chairs in each row. How many chairs are there?`,
          es: `Un salón tiene ${a} filas de sillas con ${b} sillas en cada fila. ¿Cuántas sillas hay?`,
        },
      };
    }),
    T("mul-tickets", (r) => {
      const a = r.int(3, 15);
      const b = r.int(3, 12);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a + b,
        prompt: {
          en: `One ticket costs $${b}. A family buys ${a} tickets. How many dollars do they spend?`,
          es: `Un boleto cuesta $${b}. Una familia compra ${a} boletos. ¿Cuántos dólares gastan?`,
        },
      };
    }),
    T("mul-batches", (r) => {
      const a = r.int(3, 10);
      const b = r.int(3, 9);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a + b,
        prompt: {
          en: `One batch of muffins uses ${b} cups of flour. How many cups are needed for ${a} batches?`,
          es: `Una tanda de panquecitos usa ${b} tazas de harina. ¿Cuántas tazas se necesitan para ${a} tandas?`,
        },
      };
    }),
  ],

  /* --- Divided when the problem multiplies -------------------------------- */
  "op-divided-instead-of-multiplied": [
    T("muldiv-bags", (r) => {
      const b = r.int(2, 6);
      const a = b * r.int(2, 9);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a / b,
        prompt: {
          en: `There are ${a} bags with ${b} marbles in each bag. How many marbles are there altogether?`,
          es: `Hay ${a} bolsas con ${b} canicas en cada bolsa. ¿Cuántas canicas hay en total?`,
        },
      };
    }),
    T("muldiv-pages", (r) => {
      const b = r.int(2, 7);
      const a = b * r.int(3, 10);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a / b,
        prompt: {
          en: `A reader finishes ${b} pages every night for ${a} nights. How many pages is that in all?`,
          es: `Un lector termina ${b} páginas cada noche durante ${a} noches. ¿Cuántas páginas son en total?`,
        },
      };
    }),
    T("muldiv-stickers", (r) => {
      const b = r.int(3, 8);
      const a = b * r.int(2, 8);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a / b,
        prompt: {
          en: `${a} students each get ${b} stickers. How many stickers are handed out in all?`,
          es: `${a} estudiantes reciben ${b} calcomanías cada uno. ¿Cuántas calcomanías se reparten en total?`,
        },
      };
    }),
    T("muldiv-laps", (r) => {
      const b = r.int(2, 6);
      const a = b * r.int(2, 9);
      return {
        values: { a, b },
        correct: a * b,
        distractor: a / b,
        prompt: {
          en: `A runner runs ${b} laps every practice and practises ${a} times. How many laps in all?`,
          es: `Un corredor da ${b} vueltas en cada práctica y practica ${a} veces. ¿Cuántas vueltas da en total?`,
        },
      };
    }),
  ],

  /* --- Multiplied when the problem adds ----------------------------------- */
  "op-multiplied-instead-of-added": [
    T("add-collect", (r) => {
      const a = r.int(12, 60);
      const b = r.int(3, 40);
      return {
        values: { a, b },
        correct: a + b,
        distractor: a * b,
        prompt: {
          en: `Sam has ${a} baseball cards and gets ${b} more. How many cards does Sam have now?`,
          es: `Sam tiene ${a} tarjetas de béisbol y recibe ${b} más. ¿Cuántas tarjetas tiene ahora?`,
        },
      };
    }),
    T("add-scores", (r) => {
      const a = r.int(10, 55);
      const b = r.int(4, 45);
      return {
        values: { a, b },
        correct: a + b,
        distractor: a * b,
        prompt: {
          en: `A team scored ${a} points in the first half and ${b} points in the second half. What was the total score?`,
          es: `Un equipo anotó ${a} puntos en la primera mitad y ${b} puntos en la segunda. ¿Cuál fue el total?`,
        },
      };
    }),
    T("add-lengths", (r) => {
      const a = r.int(8, 40);
      const b = r.int(5, 35);
      return {
        values: { a, b },
        correct: a + b,
        distractor: a * b,
        prompt: {
          en: `One rope is ${a} cm long and another is ${b} cm long. Tied end to end, how long are they together?`,
          es: `Una cuerda mide ${a} cm y otra mide ${b} cm. Atadas de punta a punta, ¿cuánto miden juntas?`,
        },
      };
    }),
    T("add-money", (r) => {
      const a = r.int(9, 48);
      const b = r.int(6, 40);
      return {
        values: { a, b },
        correct: a + b,
        distractor: a * b,
        prompt: {
          en: `Jae saved $${a} in June and $${b} in July. How many dollars did Jae save in all?`,
          es: `Jae ahorró $${a} en junio y $${b} en julio. ¿Cuántos dólares ahorró en total?`,
        },
      };
    }),
  ],

  /* --- Multiplied when the problem divides -------------------------------- */
  "op-multiplied-instead-of-divided": [
    T("div-share", (r) => {
      const b = r.int(3, 9);
      const a = b * r.int(3, 12);
      return {
        values: { a, b },
        correct: a / b,
        distractor: a * b,
        prompt: {
          en: `${a} pencils are shared equally among ${b} students. How many pencils does each student get?`,
          es: `Se reparten ${a} lápices en partes iguales entre ${b} estudiantes. ¿Cuántos lápices recibe cada estudiante?`,
        },
      };
    }),
    T("div-rows", (r) => {
      const b = r.int(4, 10);
      const a = b * r.int(3, 11);
      return {
        values: { a, b },
        correct: a / b,
        distractor: a * b,
        prompt: {
          en: `${a} chairs are set out in ${b} equal rows. How many chairs are in each row?`,
          es: `Se colocan ${a} sillas en ${b} filas iguales. ¿Cuántas sillas hay en cada fila?`,
        },
      };
    }),
    T("div-packs", (r) => {
      const b = r.int(2, 8);
      const a = b * r.int(4, 12);
      return {
        values: { a, b },
        correct: a / b,
        distractor: a * b,
        prompt: {
          en: `${a} granola bars are packed ${b} to a box. How many boxes are filled?`,
          es: `Se empacan ${a} barras de granola con ${b} en cada caja. ¿Cuántas cajas se llenan?`,
        },
      };
    }),
    T("div-time", (r) => {
      const b = r.int(3, 9);
      const a = b * r.int(4, 15);
      return {
        values: { a, b },
        correct: a / b,
        distractor: a * b,
        prompt: {
          en: `A ${a}-minute video is split into ${b} equal parts. How many minutes is each part?`,
          es: `Un video de ${a} minutos se divide en ${b} partes iguales. ¿Cuántos minutos dura cada parte?`,
        },
      };
    }),
  ],

  /* --- Divided in the wrong order ----------------------------------------- */
  "op-reversed-division": [
    T("revdiv-share", (r) => {
      const b = r.int(2, 9);
      const a = b * r.pick([2, 4, 5, 8, 10]);
      return {
        values: { a, b },
        correct: round(a / b),
        distractor: round(b / a),
        prompt: {
          en: `${a} apples are shared equally among ${b} baskets. How many apples go in ONE basket?`,
          es: `Se reparten ${a} manzanas en partes iguales en ${b} canastas. ¿Cuántas manzanas van en UNA canasta?`,
        },
      };
    }),
    T("revdiv-cost", (r) => {
      const b = r.int(2, 8);
      const a = b * r.pick([2, 4, 5, 8, 10]);
      return {
        values: { a, b },
        correct: round(a / b),
        distractor: round(b / a),
        prompt: {
          en: `${b} identical books cost $${a} in total. How many dollars does ONE book cost?`,
          es: `${b} libros iguales cuestan $${a} en total. ¿Cuántos dólares cuesta UN libro?`,
        },
      };
    }),
    T("revdiv-teams", (r) => {
      const b = r.int(2, 9);
      const a = b * r.pick([2, 4, 5, 8, 10]);
      return {
        values: { a, b },
        correct: round(a / b),
        distractor: round(b / a),
        prompt: {
          en: `${a} players are split into ${b} equal teams. How many players are on ONE team?`,
          es: `${a} jugadores se dividen en ${b} equipos iguales. ¿Cuántos jugadores hay en UN equipo?`,
        },
      };
    }),
    T("revdiv-minutes", (r) => {
      const b = r.int(2, 8);
      const a = b * r.pick([2, 4, 5, 8, 10]);
      return {
        values: { a, b },
        correct: round(a / b),
        distractor: round(b / a),
        prompt: {
          en: `A ${a}-minute playlist has ${b} songs of equal length. How many minutes long is ONE song?`,
          es: `Una lista de ${a} minutos tiene ${b} canciones de igual duración. ¿Cuántos minutos dura UNA canción?`,
        },
      };
    }),
  ],

  /* --- Subtracted in the wrong order -------------------------------------- */
  "op-reversed-subtraction": [
    T("revsub-height", (r) => {
      const b = r.int(20, 70);
      const a = b + r.int(5, 40);
      return {
        values: { a, b },
        correct: a - b,
        distractor: b - a,
        prompt: {
          en: `A sunflower is ${a} cm tall and a tulip is ${b} cm tall. How many cm TALLER is the sunflower than the tulip?`,
          es: `Un girasol mide ${a} cm y un tulipán mide ${b} cm. ¿Cuántos cm MÁS ALTO es el girasol que el tulipán?`,
        },
      };
    }),
    T("revsub-money", (r) => {
      const b = r.int(8, 45);
      const a = b + r.int(4, 35);
      return {
        values: { a, b },
        correct: a - b,
        distractor: b - a,
        prompt: {
          en: `A game costs $${a}. You have $${b}. How many MORE dollars do you need?`,
          es: `Un juego cuesta $${a}. Tienes $${b}. ¿Cuántos dólares MÁS necesitas?`,
        },
      };
    }),
    T("revsub-points", (r) => {
      const b = r.int(15, 60);
      const a = b + r.int(6, 40);
      return {
        values: { a, b },
        correct: a - b,
        distractor: b - a,
        prompt: {
          en: `The Hawks scored ${a} points and the Owls scored ${b} points. By how many points did the Hawks WIN?`,
          es: `Los Halcones anotaron ${a} puntos y los Búhos anotaron ${b} puntos. ¿Por cuántos puntos GANARON los Halcones?`,
        },
      };
    }),
    T("revsub-distance", (r) => {
      const b = r.int(12, 55);
      const a = b + r.int(5, 45);
      return {
        values: { a, b },
        correct: a - b,
        distractor: b - a,
        prompt: {
          en: `A trip is ${a} miles. A driver has already gone ${b} miles. How many miles are LEFT?`,
          es: `Un viaje es de ${a} millas. Un conductor ya recorrió ${b} millas. ¿Cuántas millas FALTAN?`,
        },
      };
    }),
  ],

  /* --- Worked left to right instead of by operation order ------------------ */
  "order-of-operations-left-to-right": [
    T("ooo-add-mult", (r) => {
      const a = r.int(2, 15);
      const b = r.int(2, 9);
      const c = r.int(2, 9);
      return {
        values: { a, b, c },
        correct: a + b * c,
        distractor: (a + b) * c,
        prompt: {
          en: `Evaluate: ${a} + ${b} × ${c}`,
          es: `Evalúa: ${a} + ${b} × ${c}`,
        },
      };
    }),
    T("ooo-sub-mult", (r) => {
      const b = r.int(2, 8);
      const c = r.int(2, 8);
      const a = b * c + r.int(2, 20);
      return {
        values: { a, b, c },
        correct: a - b * c,
        distractor: (a - b) * c,
        prompt: {
          en: `Evaluate: ${a} − ${b} × ${c}`,
          es: `Evalúa: ${a} − ${b} × ${c}`,
        },
      };
    }),
    T("ooo-add-div", (r) => {
      const c = r.int(2, 6);
      const a = c * r.int(2, 9);
      const b = c * r.int(2, 9);
      return {
        values: { a, b, c },
        correct: a + b / c,
        distractor: (a + b) / c,
        prompt: {
          en: `Evaluate: ${a} + ${b} ÷ ${c}`,
          es: `Evalúa: ${a} + ${b} ÷ ${c}`,
        },
      };
    }),
    T("ooo-two-products", (r) => {
      const a = r.int(2, 8);
      const b = r.int(2, 8);
      const c = r.int(2, 9);
      const d = r.int(2, 7);
      return {
        values: { a, b, c, d },
        correct: a * b + c * d,
        distractor: (a * b + c) * d,
        prompt: {
          en: `Evaluate: ${a} × ${b} + ${c} × ${d}`,
          es: `Evalúa: ${a} × ${b} + ${c} × ${d}`,
        },
      };
    }),
  ],

  /* --- Right magnitude, lost the negative sign ---------------------------- */
  "sign-dropped": [
    T("sign-temp", (r) => {
      const a = r.int(1, 12);
      const b = a + r.int(3, 25);
      return {
        values: { a, b },
        correct: a - b,
        distractor: Math.abs(a - b),
        prompt: {
          en: `The temperature was ${a}°C and then fell ${b}°C. What is the temperature now, in °C?`,
          es: `La temperatura era ${a} °C y luego bajó ${b} °C. ¿Cuál es la temperatura ahora, en °C?`,
        },
      };
    }),
    T("sign-sub", (r) => {
      const a = r.int(5, 30);
      const b = r.int(1, a - 1);
      return {
        values: { a, b },
        correct: b - a,
        distractor: Math.abs(b - a),
        prompt: {
          en: `A submarine is ${a} m BELOW sea level (−${a} m). It rises ${b} m. What is its new position, in metres?`,
          es: `Un submarino está a ${a} m BAJO el nivel del mar (−${a} m). Sube ${b} m. ¿Cuál es su nueva posición, en metros?`,
        },
      };
    }),
    T("sign-account", (r) => {
      const a = r.int(4, 30);
      const b = r.int(3, 30);
      return {
        values: { a, b },
        correct: -(a + b),
        distractor: a + b,
        prompt: {
          en: `An account is $${a} overdrawn (−$${a}). Then $${b} more is spent. What is the balance now, in dollars?`,
          es: `Una cuenta tiene un sobregiro de $${a} (−$${a}). Luego se gastan $${b} más. ¿Cuál es el saldo ahora, en dólares?`,
        },
      };
    }),
    T("sign-product", (r) => {
      const a = r.int(2, 12);
      const b = r.int(2, 12);
      return {
        values: { a, b },
        correct: -(a * b),
        distractor: a * b,
        prompt: {
          en: `Evaluate: −${a} × ${b}`,
          es: `Evalúa: −${a} × ${b}`,
        },
      };
    }),
  ],

  /* --- Added the data set instead of averaging it ------------------------- */
  "stat-summed-instead-of-averaged": [
    T("mean-scores", (r) => {
      const { vals } = meanSet(r, r.int(4, 6), 60, 100);
      const sum = vals.reduce((s, v) => s + v, 0);
      return {
        values: { vals },
        correct: sum / vals.length,
        distractor: sum,
        prompt: {
          en: `A student's quiz scores are ${list(vals)}. What is the MEAN (average) score?`,
          es: `Las calificaciones de un estudiante son ${list(vals)}. ¿Cuál es la MEDIA (el promedio)?`,
        },
      };
    }),
    T("mean-minutes", (r) => {
      const { vals } = meanSet(r, r.int(4, 6), 10, 60);
      const sum = vals.reduce((s, v) => s + v, 0);
      return {
        values: { vals },
        correct: sum / vals.length,
        distractor: sum,
        prompt: {
          en: `Minutes read each night: ${list(vals)}. What is the MEAN number of minutes per night?`,
          es: `Minutos de lectura cada noche: ${list(vals)}. ¿Cuál es la MEDIA de minutos por noche?`,
        },
      };
    }),
    T("mean-points", (r) => {
      const { vals } = meanSet(r, r.int(4, 6), 8, 40);
      const sum = vals.reduce((s, v) => s + v, 0);
      return {
        values: { vals },
        correct: sum / vals.length,
        distractor: sum,
        prompt: {
          en: `Points scored in each game: ${list(vals)}. What is the MEAN points per game?`,
          es: `Puntos anotados en cada partido: ${list(vals)}. ¿Cuál es la MEDIA de puntos por partido?`,
        },
      };
    }),
    T("mean-temps", (r) => {
      const { vals } = meanSet(r, r.int(4, 6), 40, 90);
      const sum = vals.reduce((s, v) => s + v, 0);
      return {
        values: { vals },
        correct: sum / vals.length,
        distractor: sum,
        prompt: {
          en: `Daily high temperatures (°F): ${list(vals)}. What is the MEAN daily high?`,
          es: `Temperaturas máximas diarias (°F): ${list(vals)}. ¿Cuál es la MEDIA de la máxima diaria?`,
        },
      };
    }),
  ],
};

/* ---------------------------------------------------------------------------
 * Choice assembly. Every question shows four options: the correct answer, the
 * tag's own error, and two near misses so the tag error is not simply "the
 * other one". Near misses are derived, never random, so they reproduce.
 * ------------------------------------------------------------------------- */

function numericDecoys(correct, distractor) {
  const step = 10 ** -decimals(correct) || 1;
  return [
    round(correct + step, 6),
    round(correct - step, 6),
    round(correct + 2 * step, 6),
    round(correct * 2, 6),
    round(correct + 10 * step, 6),
    round(correct - 2 * step, 6),
    round(distractor + step, 6),
  ];
}

function ratioDecoys(correct) {
  const [a, b] = correct.split(" : ").map(Number);
  // Reduced, so a near miss never shows as an unsimplified "6 : 6".
  return [ratio(a + 1, b), ratio(a, b + 1), ratio(a + b, b), ratio(a, a + b), ratio(a + 2, b)];
}

function fractionDecoys(correct) {
  const [n, d] = correct.includes("/") ? correct.split("/").map(Number) : [Number(correct), 1];
  return [frac(n + 1, d), frac(n, d + 1), frac(n + 2, d), frac(n * 2, d + 1), frac(n + d, d)];
}

// Ordered pairs need their own near misses. Without this they fall through to
// fractionDecoys, which reads "(3, 1)" as a number and offers nonsense.
// Deliberately NOT the swapped pair — that is the tag's distractor, and a decoy
// identical to the error would give a student two ways to be diagnosed wrong.
function pointDecoys(correct) {
  const [x, y] = correct.replace(/[()]/g, "").split(",").map(Number);
  return [point(x + 1, y), point(x, y + 1), point(-x, y), point(x, -y), point(x + 2, y)];
}

function decoyPool(correct, distractor) {
  if (typeof correct === "number") return numericDecoys(correct, distractor);
  if (String(correct).includes(" : ")) return ratioDecoys(String(correct));
  if (String(correct).startsWith("(")) return pointDecoys(String(correct));
  return fractionDecoys(String(correct));
}

/** Two derived near misses that are neither the answer nor the tag error. */
function pickDecoys(correct, distractor) {
  const taken = new Set([String(correct), String(distractor)]);
  const out = [];
  for (const candidate of decoyPool(correct, distractor)) {
    const key = String(candidate);
    if (taken.has(key)) continue;
    if (typeof candidate === "number" && !Number.isFinite(candidate)) continue;
    taken.add(key);
    out.push(candidate);
    if (out.length === 2) break;
  }
  // Guaranteed backstop so a question always has four buttons.
  let bump = 1;
  while (out.length < 2) {
    const candidate =
      typeof correct === "number" ? round(correct + 100 * bump, 6) : `${correct} (${bump})`;
    if (!taken.has(String(candidate))) {
      taken.add(String(candidate));
      out.push(candidate);
    }
    bump += 1;
  }
  return out;
}

/** Fisher-Yates driven by the seeded PRNG — same seed, same button order. */
function shuffle(items, r) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * Build one reproducible question.
 * @param {string} tag   a BOSS_TAGS entry
 * @param {number} index which template (wraps)
 * @param {string|number} seed anything stable — "2026-W31|rate-not-per-one|3"
 */
export function buildQuestion(tag, index, seed) {
  const templates = QUESTION_BANK[tag];
  if (!templates) throw new Error(`Class Boss: unknown misconception tag "${tag}"`);
  const i = ((index % templates.length) + templates.length) % templates.length;
  const template = templates[i];
  const r = makeRng(`${seed}|${tag}|${template.id}`);
  const built = template.build(r);
  const decoys = pickDecoys(built.correct, built.distractor);
  return {
    tag,
    id: template.id,
    templateIndex: i,
    values: built.values,
    prompt: built.prompt,
    correct: built.correct,
    distractor: built.distractor,
    choices: shuffle([built.correct, built.distractor, ...decoys], r),
  };
}

/** Total templates in the bank — the validator prints this. */
export function bankSize() {
  return Object.values(QUESTION_BANK).reduce((n, list_) => n + list_.length, 0);
}
