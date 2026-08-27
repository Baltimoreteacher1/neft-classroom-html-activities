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
  "equation-answered-with-given-number",
  "equation-not-inverse-operation",
  "inequality-boundary-inclusion",
  "inequality-direction-flipped",
  "inequality-graph-direction",
  "stat-center-vs-spread",
  "stat-frequency-vs-value",
  "stat-mean-skewed-by-outlier",
  "stat-range-for-iqr",
  "decimal-place-value",
  "division-quotient-missing-zero",
  "exponent-as-multiplication",
  "fraction-added-denominators",
  "fraction-no-reciprocal",
  "fraction-straight-across-division",
  "factors-multiples-confused",
  "factorization-stopped-early",
  "property-order-vs-grouping",
  "ratio-compared-without-common-basis",
  "stat-question-no-variability",
  "pattern-unit-position-miscounted",
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
  "ratio-scaled-additively",
  "ratio-as-difference",
  "stat-mean-vs-median",
  "stat-histogram-bin-misread",
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

  /* --- Scaled a ratio by adding instead of multiplying -------------------
   * The distractor adds the SAME amount to the second quantity that the first
   * one grew by, which is the additive-for-multiplicative move the tag names.
   * Every COPRIME pair has a ≠ b, so the distractor can never collide with the
   * correct answer (they agree only when k = 1 or a = b). ------------------ */
  "ratio-scaled-additively": [
    T("rsa-recipe", (r) => {
      const [a, b] = r.pick(COPRIME);
      const k = r.int(2, 6);
      return {
        values: { a, b, k },
        correct: b * k,
        distractor: b + a * (k - 1),
        prompt: {
          en: `A recipe uses ${a} cups of flour for every ${b} cups of sugar. If you use ${a * k} cups of flour, how many cups of sugar do you need?`,
          es: `Una receta usa ${a} tazas de harina por cada ${b} tazas de azúcar. Si usas ${a * k} tazas de harina, ¿cuántas tazas de azúcar necesitas?`,
        },
      };
    }),
    T("rsa-paint", (r) => {
      const [a, b] = r.pick(COPRIME);
      const k = r.int(2, 5);
      return {
        values: { a, b, k },
        correct: b * k,
        distractor: b + a * (k - 1),
        prompt: {
          en: `A paint mix takes ${a} parts blue to ${b} parts white. With ${a * k} parts blue, how many parts white are needed?`,
          es: `Una mezcla de pintura lleva ${a} partes de azul por ${b} partes de blanco. Con ${a * k} partes de azul, ¿cuántas partes de blanco se necesitan?`,
        },
      };
    }),
    T("rsa-gears", (r) => {
      const [a, b] = r.pick(COPRIME);
      const k = r.int(2, 5);
      return {
        values: { a, b, k },
        correct: b * k,
        distractor: b + a * (k - 1),
        prompt: {
          en: `A gear turns ${a} times for every ${b} turns of a second gear. If the first gear turns ${a * k} times, how many times does the second gear turn?`,
          es: `Un engranaje gira ${a} veces por cada ${b} vueltas de un segundo engranaje. Si el primero gira ${a * k} veces, ¿cuántas vueltas da el segundo?`,
        },
      };
    }),
    T("rsa-map", (r) => {
      const [a, b] = r.pick(COPRIME);
      const k = r.int(2, 6);
      return {
        values: { a, b, k },
        correct: b * k,
        distractor: b + a * (k - 1),
        prompt: {
          en: `On a map, ${a} inches stands for ${b} miles. How many miles does ${a * k} inches stand for?`,
          es: `En un mapa, ${a} pulgadas representan ${b} millas. ¿Cuántas millas representan ${a * k} pulgadas?`,
        },
      };
    }),
  ],

  /* --- Combined the two amounts instead of comparing them -----------------
   * The distractor is a single number — the sum or the difference — where the
   * answer has to be a comparison. That contrast (a ratio versus one number) is
   * the whole point: the student collapsed two quantities into one. --------- */
  "ratio-as-difference": [
    T("rad-marbles", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 6);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: String(second - first),
        prompt: {
          en: `A jar holds ${first} red marbles and ${second} blue marbles. Write the ratio of RED to BLUE in simplest form.`,
          es: `Un frasco tiene ${first} canicas rojas y ${second} canicas azules. Escribe la razón de ROJAS a AZULES en su forma más simple.`,
        },
      };
    }),
    T("rad-team", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 5);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: String(second - first),
        prompt: {
          en: `A team won ${first} games and lost ${second} games. Write the ratio of WINS to LOSSES in simplest form.`,
          es: `Un equipo ganó ${first} partidos y perdió ${second}. Escribe la razón de VICTORIAS a DERROTAS en su forma más simple.`,
        },
      };
    }),
    T("rad-fruit", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 4);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: String(first + second),
        prompt: {
          en: `A bowl holds ${first} apples and ${second} oranges. Write the ratio of APPLES to ORANGES in simplest form.`,
          es: `Un tazón tiene ${first} manzanas y ${second} naranjas. Escribe la razón de MANZANAS a NARANJAS en su forma más simple.`,
        },
      };
    }),
    T("rad-books", (r) => {
      const [a, b] = r.pick(COPRIME);
      const g = r.int(2, 5);
      const first = a * g;
      const second = b * g;
      return {
        values: { first, second },
        correct: ratio(first, second),
        distractor: String(first + second),
        prompt: {
          en: `A shelf holds ${first} novels and ${second} comics. Write the ratio of NOVELS to COMICS in simplest form.`,
          es: `Un estante tiene ${first} novelas y ${second} cómics. Escribe la razón de NOVELAS a CÓMICS en su forma más simple.`,
        },
      };
    }),
  ],

  /* --- Used the mean where the median was asked ---------------------------
   * Each offset set is written so both measures are whole numbers and the two
   * genuinely differ, so the distractor is always the OTHER measure of centre
   * rather than an arithmetic slip. Values arrive pre-sorted. -------------- */
  "stat-mean-vs-median": [
    T("mvm-scores", (r) => {
      const base = r.int(10, 40);
      const vals = [base, base + 1, base + 3, base + 4, base + 12];
      return {
        values: { base },
        correct: base + 3,
        distractor: base + 4,
        prompt: {
          en: `Quiz scores: ${list(vals)}. What is the MEDIAN?`,
          es: `Puntajes de una prueba: ${list(vals)}. ¿Cuál es la MEDIANA?`,
        },
      };
    }),
    T("mvm-times", (r) => {
      const base = r.int(10, 40);
      const vals = [base, base + 2, base + 4, base + 6, base + 18];
      return {
        values: { base },
        correct: base + 4,
        distractor: base + 6,
        prompt: {
          en: `Race times in seconds: ${list(vals)}. What is the MEDIAN?`,
          es: `Tiempos de carrera en segundos: ${list(vals)}. ¿Cuál es la MEDIANA?`,
        },
      };
    }),
    T("mvm-points", (r) => {
      const base = r.int(5, 30);
      const vals = [base, base + 1, base + 2, base + 3, base + 19];
      return {
        values: { base },
        correct: base + 2,
        distractor: base + 5,
        prompt: {
          en: `Points scored: ${list(vals)}. What is the MEDIAN?`,
          es: `Puntos anotados: ${list(vals)}. ¿Cuál es la MEDIANA?`,
        },
      };
    }),
    T("mvm-temps", (r) => {
      const base = r.int(20, 50);
      const vals = [base, base + 3, base + 5, base + 7, base + 20];
      return {
        values: { base },
        correct: base + 5,
        distractor: base + 7,
        prompt: {
          en: `Daily temperatures: ${list(vals)}. What is the MEDIAN?`,
          es: `Temperaturas diarias: ${list(vals)}. ¿Cuál es la MEDIANA?`,
        },
      };
    }),
  ],

  /* --- Misread the bins or the scale on a data display --------------------
   * Distractors are the specific reading errors: sweeping in the next bin,
   * dropping the shortest bar from a total, and answering with the interval
   * label instead of the bar height. ------------------------------------- */
  "stat-histogram-bin-misread": [
    T("hbm-bin-count", (r) => {
      const f1 = r.int(2, 9);
      const f2 = r.int(2, 9);
      const f3 = r.int(2, 9);
      return {
        values: { f1, f2, f3 },
        correct: f2,
        distractor: f2 + f3,
        prompt: {
          en: `A histogram shows 10–19: ${f1} values, 20–29: ${f2} values, 30–39: ${f3} values. How many values fall in the 20–29 interval?`,
          es: `Un histograma muestra 10–19: ${f1} valores, 20–29: ${f2} valores, 30–39: ${f3} valores. ¿Cuántos valores caen en el intervalo 20–29?`,
        },
      };
    }),
    T("hbm-total", (r) => {
      const f1 = r.int(5, 12);
      const f2 = r.int(5, 12);
      const f3 = r.int(2, 4);
      return {
        values: { f1, f2, f3 },
        correct: f1 + f2 + f3,
        distractor: f1 + f2,
        prompt: {
          en: `A histogram has three bars with heights ${f1}, ${f2} and ${f3}. How many values are in the whole data set?`,
          es: `Un histograma tiene tres barras de alturas ${f1}, ${f2} y ${f3}. ¿Cuántos valores hay en todo el conjunto de datos?`,
        },
      };
    }),
    T("hbm-tallest", (r) => {
      const f1 = r.int(2, 6);
      const f2 = r.int(8, 14);
      const f3 = r.int(2, 6);
      return {
        values: { f1, f2, f3 },
        correct: f2,
        distractor: 29,
        prompt: {
          en: `A histogram shows 10–19: ${f1} values, 20–29: ${f2} values, 30–39: ${f3} values. What is the GREATEST number of values in any one interval?`,
          es: `Un histograma muestra 10–19: ${f1} valores, 20–29: ${f2} valores, 30–39: ${f3} valores. ¿Cuál es la MAYOR cantidad de valores en un solo intervalo?`,
        },
      };
    }),
    T("hbm-two-bins", (r) => {
      const f1 = r.int(3, 9);
      const f2 = r.int(3, 9);
      const f3 = r.int(3, 9);
      return {
        values: { f1, f2, f3 },
        correct: f1 + f2,
        distractor: f1,
        prompt: {
          en: `A histogram shows 0–9: ${f1} values, 10–19: ${f2} values, 20–29: ${f3} values. How many values are LESS THAN 20?`,
          es: `Un histograma muestra 0–9: ${f1} valores, 10–19: ${f2} valores, 20–29: ${f3} valores. ¿Cuántos valores son MENORES QUE 20?`,
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

  /* --- Dropped a placeholder zero in the quotient ------------------------- */
  /* Every quotient here is built to CONTAIN a zero, and every distractor is
     that same quotient with the zero deleted — the wrong answer a student
     actually writes when a step "will not divide" and they move on without
     recording it. Building the dividend as divisor x quotient keeps the
     division exact, so the item never turns into a remainder question. */
  "division-quotient-missing-zero": [
    T("divzero-tens", (r) => {
      const d = r.int(3, 9);
      const a = r.int(1, 9);
      const b = r.int(1, 9);
      const q = a * 100 + b;
      return {
        values: { d, n: d * q },
        correct: q,
        distractor: a * 10 + b,
        prompt: {
          en: `What is ${d * q} \u00f7 ${d}?`,
          es: `\u00bfCu\u00e1nto es ${d * q} \u00f7 ${d}?`,
        },
      };
    }),
    T("divzero-trailing", (r) => {
      const d = r.int(3, 9);
      const a = r.int(1, 9) * 10 + r.int(1, 9);
      const q = a * 10;
      return {
        values: { d, n: d * q },
        correct: q,
        distractor: a,
        prompt: {
          en: `What is ${d * q} \u00f7 ${d}?`,
          es: `\u00bfCu\u00e1nto es ${d * q} \u00f7 ${d}?`,
        },
      };
    }),
    T("divzero-two-digit-divisor", (r) => {
      const d = r.int(11, 25);
      const a = r.int(1, 9);
      const b = r.int(1, 9);
      const q = a * 100 + b;
      return {
        values: { d, n: d * q },
        correct: q,
        distractor: a * 10 + b,
        prompt: {
          en: `What is ${d * q} \u00f7 ${d}?`,
          es: `\u00bfCu\u00e1nto es ${d * q} \u00f7 ${d}?`,
        },
      };
    }),
    T("divzero-thousands", (r) => {
      const d = r.int(3, 9);
      const a = r.int(1, 9);
      const b = r.int(1, 9);
      const c = r.int(1, 9);
      const q = a * 1000 + b * 10 + c;
      return {
        values: { d, n: d * q },
        correct: q,
        distractor: a * 100 + b * 10 + c,
        prompt: {
          en: `What is ${d * q} \u00f7 ${d}?`,
          es: `\u00bfCu\u00e1nto es ${d * q} \u00f7 ${d}?`,
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
  /* --- Did not undo the operation ---------------------------------------- */
  "equation-not-inverse-operation": [
    T("inv-mul", (r) => {
      const a = r.int(3, 12),
        x = r.int(3, 15);
      return {
        values: { a, x },
        correct: x,
        distractor: a * x * a,
        prompt: { en: `Solve for x: ${a}x = ${a * x}.`, es: `Resuelve para x: ${a}x = ${a * x}.` },
      };
    }),
    T("inv-div", (r) => {
      const a = r.int(2, 9),
        x = r.int(4, 15);
      return {
        values: { a, x },
        correct: x,
        distractor: x / a / a,
        prompt: {
          en: `Solve for x: x ÷ ${a} = ${x / a}.`,
          es: `Resuelve para x: x ÷ ${a} = ${x / a}.`,
        },
      };
    }),
    T("inv-add", (r) => {
      const a = r.int(3, 19),
        x = r.int(5, 25);
      return {
        values: { a, x },
        correct: x,
        distractor: x + a + a,
        prompt: {
          en: `Solve for x: x + ${a} = ${x + a}.`,
          es: `Resuelve para x: x + ${a} = ${x + a}.`,
        },
      };
    }),
    T("inv-sub", (r) => {
      const a = r.int(2, 15),
        x = r.int(18, 40);
      return {
        values: { a, x },
        correct: x,
        distractor: x - a - a,
        prompt: {
          en: `Solve for x: x − ${a} = ${x - a}.`,
          es: `Resuelve para x: x − ${a} = ${x - a}.`,
        },
      };
    }),
  ],

  /* --- Answered with a number already in the equation --------------------- */
  "equation-answered-with-given-number": [
    T("given-add", (r) => {
      const a = r.int(4, 18);
      let x = r.int(6, 30);
      if (x === a) x = a + 7; // the given number must never BE the unknown
      return {
        values: { a, x },
        correct: x,
        distractor: a,
        prompt: {
          en: `Solve for n: n + ${a} = ${x + a}.`,
          es: `Resuelve para n: n + ${a} = ${x + a}.`,
        },
      };
    }),
    T("given-div", (r) => {
      const a = r.int(3, 11);
      let x = r.int(4, 14);
      if (x === a) x = a + 5;
      return {
        values: { a, x },
        correct: x,
        distractor: a,
        prompt: { en: `Solve for y: y ÷ ${a} = ${x}.`, es: `Resuelve para y: y ÷ ${a} = ${x}.` },
      };
    }),
    T("given-mul", (r) => {
      const a = r.int(3, 12);
      let x = r.int(3, 14);
      if (x === a) x = a + 4;
      return {
        values: { a, x },
        correct: x,
        distractor: a,
        prompt: { en: `Solve for m: ${a}m = ${a * x}.`, es: `Resuelve para m: ${a}m = ${a * x}.` },
      };
    }),
    T("given-sub", (r) => {
      const a = r.int(3, 16);
      let x = r.int(20, 45);
      if (x === a) x = a + 9;
      return {
        values: { a, x },
        correct: x,
        distractor: a,
        prompt: {
          en: `Solve for d: d − ${a} = ${x - a}.`,
          es: `Resuelve para d: d − ${a} = ${x - a}.`,
        },
      };
    }),
  ],

  /* --- Right boundary, symbol reversed ------------------------------------ */
  "inequality-direction-flipped": [
    T("dir-add", (r) => {
      const a = r.int(2, 9),
        b = r.int(5, 20);
      return {
        values: { a, b },
        correct: `x > ${b + a}`,
        distractor: `x < ${b + a}`,
        decoys: [`x > ${b - a}`, `x < ${b - a}`],
        prompt: { en: `Solve: x − ${a} > ${b}.`, es: `Resuelve: x − ${a} > ${b}.` },
      };
    }),
    T("dir-sub", (r) => {
      const a = r.int(2, 9),
        b = r.int(10, 30);
      return {
        values: { a, b },
        correct: `x < ${b - a}`,
        distractor: `x > ${b - a}`,
        decoys: [`x < ${b + a}`, `x > ${b + a}`],
        prompt: { en: `Solve: x + ${a} < ${b}.`, es: `Resuelve: x + ${a} < ${b}.` },
      };
    }),
    T("dir-ge", (r) => {
      const a = r.int(3, 12),
        b = r.int(8, 25);
      return {
        values: { a, b },
        correct: `x ≥ ${b + a}`,
        distractor: `x ≤ ${b + a}`,
        decoys: [`x ≥ ${b - a}`, `x > ${b + a}`],
        prompt: { en: `Solve: x − ${a} ≥ ${b}.`, es: `Resuelve: x − ${a} ≥ ${b}.` },
      };
    }),
    T("dir-le", (r) => {
      const a = r.int(3, 12),
        b = r.int(15, 35);
      return {
        values: { a, b },
        correct: `x ≤ ${b - a}`,
        distractor: `x ≥ ${b - a}`,
        decoys: [`x ≤ ${b + a}`, `x < ${b - a}`],
        prompt: { en: `Solve: x + ${a} ≤ ${b}.`, es: `Resuelve: x + ${a} ≤ ${b}.` },
      };
    }),
  ],

  /* --- Boundary value wrongly included or excluded ------------------------ */
  "inequality-boundary-inclusion": [
    T("inc-atleast", (r) => {
      const b = r.int(10, 60);
      return {
        values: { b },
        correct: `x ≥ ${b}`,
        distractor: `x > ${b}`,
        decoys: [`x ≤ ${b}`, `x < ${b}`],
        prompt: {
          en: `Write it: a ride needs a height of AT LEAST ${b} cm.`,
          es: `Escríbelo: una atracción exige una estatura de AL MENOS ${b} cm.`,
        },
      };
    }),
    T("inc-atmost", (r) => {
      const b = r.int(10, 80);
      return {
        values: { b },
        correct: `x ≤ ${b}`,
        distractor: `x < ${b}`,
        decoys: [`x ≥ ${b}`, `x > ${b}`],
        prompt: {
          en: `Write it: a lift carries AT MOST ${b} kilograms.`,
          es: `Escríbelo: un ascensor carga COMO MÁXIMO ${b} kilogramos.`,
        },
      };
    }),
    T("inc-morethan", (r) => {
      const b = r.int(2, 30);
      return {
        values: { b },
        correct: `x > ${b}`,
        distractor: `x ≥ ${b}`,
        decoys: [`x < ${b}`, `x ≤ ${b}`],
        prompt: {
          en: `Write it: a stay costs extra after MORE THAN ${b} hours.`,
          es: `Escríbelo: una estancia cuesta más después de MÁS DE ${b} horas.`,
        },
      };
    }),
    T("inc-fewerthan", (r) => {
      const b = r.int(3, 40);
      return {
        values: { b },
        correct: `x < ${b}`,
        distractor: `x ≤ ${b}`,
        decoys: [`x > ${b}`, `x ≥ ${b}`],
        prompt: {
          en: `Write it: a class runs only with FEWER THAN ${b} students.`,
          es: `Escríbelo: una clase funciona solo con MENOS DE ${b} estudiantes.`,
        },
      };
    }),
  ],

  /* --- Graph shaded toward the wrong side ---------------------------------- */
  "inequality-graph-direction": [
    T("shade-gt", (r) => {
      const b = r.int(2, 20);
      return {
        values: { b },
        correct: `open circle at ${b}, shade right`,
        distractor: `open circle at ${b}, shade left`,
        decoys: [`filled circle at ${b}, shade right`, `filled circle at ${b}, shade left`],
        prompt: { en: `Which graph shows x > ${b}?`, es: `¿Cuál gráfica muestra x > ${b}?` },
      };
    }),
    T("shade-lt", (r) => {
      const b = r.int(2, 20);
      return {
        values: { b },
        correct: `open circle at ${b}, shade left`,
        distractor: `open circle at ${b}, shade right`,
        decoys: [`filled circle at ${b}, shade left`, `filled circle at ${b}, shade right`],
        prompt: { en: `Which graph shows x < ${b}?`, es: `¿Cuál gráfica muestra x < ${b}?` },
      };
    }),
    T("shade-ge", (r) => {
      const b = r.int(2, 20);
      return {
        values: { b },
        correct: `filled circle at ${b}, shade right`,
        distractor: `filled circle at ${b}, shade left`,
        decoys: [`open circle at ${b}, shade right`, `open circle at ${b}, shade left`],
        prompt: { en: `Which graph shows x ≥ ${b}?`, es: `¿Cuál gráfica muestra x ≥ ${b}?` },
      };
    }),
    T("shade-le", (r) => {
      const b = r.int(2, 20);
      return {
        values: { b },
        correct: `filled circle at ${b}, shade left`,
        distractor: `filled circle at ${b}, shade right`,
        decoys: [`open circle at ${b}, shade left`, `open circle at ${b}, shade right`],
        prompt: { en: `Which graph shows x ≤ ${b}?`, es: `¿Cuál gráfica muestra x ≤ ${b}?` },
      };
    }),
  ],

  /* --- Used the full range instead of the IQR ------------------------------ */
  "stat-range-for-iqr": [
    T("iqr-plot", (r) => {
      const min = r.int(2, 12),
        q1 = min + r.int(3, 8),
        q3 = q1 + r.int(4, 12),
        max = q3 + r.int(3, 9);
      return {
        values: { min, q1, q3, max },
        correct: q3 - q1,
        distractor: max - min,
        prompt: {
          en: `A box plot shows min ${min}, Q1 ${q1}, Q3 ${q3}, max ${max}. What is the IQR?`,
          es: `Un diagrama de caja muestra mín ${min}, Q1 ${q1}, Q3 ${q3}, máx ${max}. ¿Cuál es el rango intercuartílico?`,
        },
      };
    }),
    T("iqr-quartiles", (r) => {
      const q1 = r.int(10, 30),
        q3 = q1 + r.int(5, 20),
        min = q1 - r.int(3, 8),
        max = q3 + r.int(3, 8);
      return {
        values: { min, q1, q3, max },
        correct: q3 - q1,
        distractor: max - min,
        prompt: {
          en: `Q1 is ${q1} and Q3 is ${q3}; the least value is ${min} and the greatest is ${max}. Find the IQR.`,
          es: `Q1 es ${q1} y Q3 es ${q3}; el valor menor es ${min} y el mayor es ${max}. Halla el rango intercuartílico.`,
        },
      };
    }),
    T("iqr-scores", (r) => {
      const q1 = r.int(60, 75),
        q3 = q1 + r.int(6, 18),
        min = q1 - r.int(5, 12),
        max = q3 + r.int(4, 10);
      return {
        values: { min, q1, q3, max },
        correct: q3 - q1,
        distractor: max - min,
        prompt: {
          en: `Test scores: least ${min}, Q1 ${q1}, Q3 ${q3}, greatest ${max}. What is the interquartile range?`,
          es: `Puntajes: menor ${min}, Q1 ${q1}, Q3 ${q3}, mayor ${max}. ¿Cuál es el rango intercuartílico?`,
        },
      };
    }),
    T("iqr-times", (r) => {
      const q1 = r.int(15, 28),
        q3 = q1 + r.int(4, 14),
        min = q1 - r.int(4, 9),
        max = q3 + r.int(5, 11);
      return {
        values: { min, q1, q3, max },
        correct: q3 - q1,
        distractor: max - min,
        prompt: {
          en: `Ride times in minutes: min ${min}, Q1 ${q1}, Q3 ${q3}, max ${max}. Find the IQR.`,
          es: `Tiempos en minutos: mín ${min}, Q1 ${q1}, Q3 ${q3}, máx ${max}. Halla el rango intercuartílico.`,
        },
      };
    }),
  ],

  /* --- Confused a measure of center with a measure of spread --------------- */
  "stat-center-vs-spread": [
    T("cs-spread", (r) => {
      const pick = r.int(0, 1);
      return {
        values: { pick },
        correct: pick ? "range" : "interquartile range",
        distractor: "median",
        decoys: ["mean", "mode"],
        prompt: {
          en: `Which one measures how SPREAD OUT the data is?`,
          es: `¿Cuál mide qué tan DISPERSOS están los datos?`,
        },
      };
    }),
    T("cs-center", (r) => {
      const pick = r.int(0, 1);
      return {
        values: { pick },
        correct: pick ? "median" : "mean",
        distractor: "range",
        decoys: ["interquartile range", "the greatest value"],
        prompt: {
          en: `Which one describes a TYPICAL value in the data?`,
          es: `¿Cuál describe un valor TÍPICO de los datos?`,
        },
      };
    }),
    T("cs-mode", (r) => {
      const pick = r.int(0, 1);
      return {
        values: { pick },
        correct: "mode",
        distractor: "range",
        decoys: ["interquartile range", "the least value"],
        prompt: {
          en: `Which one names the value that appears MOST OFTEN?`,
          es: `¿Cuál nombra el valor que aparece CON MÁS FRECUENCIA?`,
        },
      };
    }),
    T("cs-iqr", (r) => {
      const pick = r.int(0, 1);
      return {
        values: { pick },
        correct: "interquartile range",
        distractor: "median",
        decoys: ["mean", "mode"],
        prompt: {
          en: `Which one describes the spread of just the MIDDLE HALF of the data?`,
          es: `¿Cuál describe la dispersión solo de la MITAD CENTRAL de los datos?`,
        },
      };
    }),
  ],

  /* --- Chose the mean when an outlier distorts it -------------------------- */
  "stat-mean-skewed-by-outlier": [
    T("out-times", (r) => {
      const b = r.int(6, 9),
        out = b + r.int(20, 40);
      return {
        values: { b, out },
        correct: "median",
        distractor: "mean",
        decoys: ["mode", "range"],
        prompt: {
          en: `Mile times are ${b}, ${b + 1}, ${b + 1}, ${b + 2} and ${out} minutes. Which measure best describes a typical run?`,
          es: `Los tiempos son ${b}, ${b + 1}, ${b + 1}, ${b + 2} y ${out} minutos. ¿Cuál medida describe mejor una carrera típica?`,
        },
      };
    }),
    T("out-prices", (r) => {
      const b = r.int(4, 9),
        out = b + r.int(30, 60);
      return {
        values: { b, out },
        correct: "median",
        distractor: "mean",
        decoys: ["range", "the greatest value"],
        prompt: {
          en: `Lunch prices are $${b}, $${b + 1}, $${b + 1}, $${b + 2} and $${out}. Which measure best describes a typical price?`,
          es: `Los precios son $${b}, $${b + 1}, $${b + 1}, $${b + 2} y $${out}. ¿Cuál medida describe mejor un precio típico?`,
        },
      };
    }),
    T("out-scores", (r) => {
      const b = r.int(80, 90),
        out = b - r.int(50, 70);
      return {
        values: { b, out },
        correct: "median",
        distractor: "mean",
        decoys: ["mode", "interquartile range"],
        prompt: {
          en: `Scores are ${b}, ${b + 2}, ${b + 3}, ${b + 4} and ${out}. Which measure best describes a typical score?`,
          es: `Los puntajes son ${b}, ${b + 2}, ${b + 3}, ${b + 4} y ${out}. ¿Cuál medida describe mejor un puntaje típico?`,
        },
      };
    }),
    T("out-attendance", (r) => {
      const b = r.int(20, 30),
        out = b + r.int(80, 150);
      return {
        values: { b, out },
        correct: "median",
        distractor: "mean",
        decoys: ["range", "mode"],
        prompt: {
          en: `Club attendance is ${b}, ${b + 1}, ${b + 2}, ${b + 3} and ${out}. Which measure best describes a typical night?`,
          es: `La asistencia es ${b}, ${b + 1}, ${b + 2}, ${b + 3} y ${out}. ¿Cuál medida describe mejor una noche típica?`,
        },
      };
    }),
  ],

  /* --- Reported a data value where a frequency was asked ------------------- */
  "stat-frequency-vs-value": [
    T("freq-bar", (r) => {
      const lo = r.int(10, 60),
        h = r.int(3, 18);
      return {
        values: { lo, h },
        correct: h,
        distractor: lo + 9,
        prompt: {
          en: `A histogram bar covers ${lo}–${lo + 9} and stands ${h} tall. How many values fall in that interval?`,
          es: `Una barra del histograma cubre ${lo}–${lo + 9} y mide ${h} de alto. ¿Cuántos valores caen en ese intervalo?`,
        },
      };
    }),
    T("freq-tallest", (r) => {
      const lo = r.int(20, 70),
        h = r.int(8, 20);
      return {
        values: { lo, h },
        correct: h,
        distractor: lo,
        prompt: {
          en: `The tallest bar covers ${lo}–${lo + 9} with a height of ${h}. How many students are in it?`,
          es: `La barra más alta cubre ${lo}–${lo + 9} con altura ${h}. ¿Cuántos estudiantes hay en ella?`,
        },
      };
    }),
    T("freq-players", (r) => {
      const lo = r.int(0, 15);
      let h = r.int(4, 16);
      if (h === lo + 4) h = h + 1; // height must never equal the value read off the axis
      return {
        values: { lo, h },
        correct: h,
        distractor: lo + 4,
        prompt: {
          en: `A bar for ${lo}–${lo + 4} goals reaches ${h}. How many players scored in that range?`,
          es: `Una barra de ${lo}–${lo + 4} goles llega a ${h}. ¿Cuántos jugadores anotaron en ese rango?`,
        },
      };
    }),
    T("freq-minutes", (r) => {
      const lo = r.int(5, 40);
      let h = r.int(2, 14);
      if (h === lo + 9) h = h - 1;
      return {
        values: { lo, h },
        correct: h,
        distractor: lo + 9,
        prompt: {
          en: `A bar for ${lo}–${lo + 9} minutes has height ${h}. How many days fall in that interval?`,
          es: `Una barra de ${lo}–${lo + 9} minutos tiene altura ${h}. ¿Cuántos días caen en ese intervalo?`,
        },
      };
    }),
  ],

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

  /* --- Confused factors with multiples ----------------------------------- */
  "factors-multiples-confused": [
    T("fm-factor-of", (r) => {
      const d = r.int(2, 9);
      const n = d * r.int(2, 5);
      return {
        values: { n, d },
        correct: d,
        distractor: n * 2,
        decoys: [n + 1, d + 1],
        prompt: {
          en: `Which number is a FACTOR of ${n} — a number that divides into it exactly?`,
          es: `¿Qué número es un FACTOR de ${n}, es decir, un número que lo divide exactamente?`,
        },
      };
    }),
    T("fm-multiple-of", (r) => {
      const n = r.int(3, 9);
      const k = r.int(3, 6);
      return {
        values: { n, k },
        correct: n * k,
        distractor: 1,
        decoys: [n * k + 1, n + k],
        prompt: {
          en: `Which number is a MULTIPLE of ${n} — a number you land on counting by ${n}?`,
          es: `¿Qué número es un MÚLTIPLO de ${n}, es decir, un número donde caes al contar de ${n} en ${n}?`,
        },
      };
    }),
    T("fm-largest-factor", (r) => {
      const half = r.int(3, 12);
      const n = half * 2;
      return {
        values: { n, half },
        correct: half,
        distractor: n * 2,
        decoys: [n - 1, half + 1],
        prompt: {
          en: `What is the LARGEST factor of ${n} that is smaller than ${n} itself?`,
          es: `¿Cuál es el FACTOR más grande de ${n} que es menor que ${n} mismo?`,
        },
      };
    }),
    T("fm-smallest-multiple", (r) => {
      const n = r.int(4, 12);
      return {
        values: { n },
        correct: n * 2,
        distractor: Math.max(2, Math.floor(n / 2)),
        decoys: [n + 1, n * 3],
        prompt: {
          en: `What is the SMALLEST multiple of ${n} that is greater than ${n} itself?`,
          es: `¿Cuál es el MÚLTIPLO más pequeño de ${n} que es mayor que ${n} mismo?`,
        },
      };
    }),
  ],

  /* --- Confused the commutative and associative properties ---------------- */
  "property-order-vs-grouping": [
    T("prop-add-order", (r) => {
      const a = r.int(2, 9);
      const b = r.int(2, 9);
      return {
        values: { a, b },
        correct: "Commutative Property",
        distractor: "Associative Property",
        decoys: ["Identity Property", "Distributive Property"],
        prompt: {
          en: `Which property is shown? ${a} + ${b} = ${b} + ${a}`,
          es: `¿Qué propiedad se muestra? ${a} + ${b} = ${b} + ${a}`,
        },
      };
    }),
    T("prop-mult-grouping", (r) => {
      const a = r.int(2, 6);
      const b = r.int(2, 6);
      const c = r.int(2, 6);
      return {
        values: { a, b, c },
        correct: "Associative Property",
        distractor: "Commutative Property",
        decoys: ["Identity Property", "Distributive Property"],
        prompt: {
          en: `Which property is shown? (${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`,
          es: `¿Qué propiedad se muestra? (${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`,
        },
      };
    }),
    T("prop-add-grouping", (r) => {
      const a = r.int(2, 9);
      const b = r.int(2, 9);
      const c = r.int(2, 9);
      return {
        values: { a, b, c },
        correct: "Associative Property",
        distractor: "Commutative Property",
        decoys: ["Identity Property", "Distributive Property"],
        prompt: {
          en: `Which property is shown? (${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`,
          es: `¿Qué propiedad se muestra? (${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`,
        },
      };
    }),
    T("prop-mult-order", (r) => {
      const a = r.int(2, 9);
      const b = r.int(2, 9);
      return {
        values: { a, b },
        correct: "Commutative Property",
        distractor: "Associative Property",
        decoys: ["Identity Property", "Distributive Property"],
        prompt: {
          en: `Which property is shown? ${a} × ${b} = ${b} × ${a}`,
          es: `¿Qué propiedad se muestra? ${a} × ${b} = ${b} × ${a}`,
        },
      };
    }),
  ],

  /* --- Stopped factoring before every factor was prime -------------------- */
  "factorization-stopped-early": [
    T("pf-count-12", () => ({
      values: { n: 12 },
      // 12 = 2 × 2 × 3 — three prime factors counting repeats.
      correct: 3,
      distractor: 2,
      decoys: [4, 6],
      prompt: {
        en: "12 can be written as 2 × 6. Counting repeats, how many PRIME factors does 12 have in total?",
        es: "12 se puede escribir como 2 × 6. Contando repeticiones, ¿cuántos factores PRIMOS tiene 12 en total?",
      },
    })),
    T("pf-count-18", () => ({
      values: { n: 18 },
      // 18 = 2 × 3 × 3
      correct: 3,
      distractor: 2,
      decoys: [4, 5],
      prompt: {
        en: "18 can be written as 2 × 9. Counting repeats, how many PRIME factors does 18 have in total?",
        es: "18 se puede escribir como 2 × 9. Contando repeticiones, ¿cuántos factores PRIMOS tiene 18 en total?",
      },
    })),
    T("pf-count-20", () => ({
      values: { n: 20 },
      // 20 = 2 × 2 × 5
      correct: 3,
      distractor: 2,
      decoys: [4, 6],
      prompt: {
        en: "20 can be written as 4 × 5. Counting repeats, how many PRIME factors does 20 have in total?",
        es: "20 se puede escribir como 4 × 5. Contando repeticiones, ¿cuántos factores PRIMOS tiene 20 en total?",
      },
    })),
    T("pf-count-36", () => ({
      values: { n: 36 },
      // 36 = 2 × 2 × 3 × 3
      correct: 4,
      distractor: 2,
      decoys: [3, 6],
      prompt: {
        en: "36 can be written as 6 × 6. Counting repeats, how many PRIME factors does 36 have in total?",
        es: "36 se puede escribir como 6 × 6. Contando repeticiones, ¿cuántos factores PRIMOS tiene 36 en total?",
      },
    })),
  ],

  /* --- Chose a question with only one fixed answer ------------------------ */
  // Divide the position by the unit length; the remainder names the place, and a
  // remainder of 0 is the LAST shape of the unit. Each distractor below is the
  // shape at the WRONG remainder — the error itself, not a random wrong answer.
  "pattern-unit-position-miscounted": [
    T("pu-cst-12", () => ({
      // circle·square·triangle, 12 ÷ 3 = 4 r0 → the 3rd shape.
      values: { position: 12, unit: "circle, square, triangle" },
      correct: "triangle",
      distractor: "square",
      decoys: ["circle", "it cannot be determined"],
      prompt: {
        en: "The pattern repeats in a unit. Which shape is at that position?",
        es: "El patrón se repite en una unidad. ¿Qué figura está en esa posición?",
      },
    })),
    T("pu-cst-20", () => ({
      // 20 ÷ 3 = 6 r2 → the 2nd shape.
      values: { position: 20, unit: "circle, square, triangle" },
      correct: "square",
      distractor: "circle",
      decoys: ["triangle", "the pattern starts over"],
      prompt: {
        en: "The pattern repeats in a unit. Which shape is at that position?",
        es: "El patrón se repite en una unidad. ¿Qué figura está en esa posición?",
      },
    })),
    T("pu-cst-25", () => ({
      // 25 ÷ 3 = 8 r1 → the 1st shape.
      values: { position: 25, unit: "circle, square, triangle" },
      correct: "circle",
      distractor: "triangle",
      decoys: ["square", "there is no shape 25"],
      prompt: {
        en: "The pattern repeats in a unit. Which shape is at that position?",
        es: "El patrón se repite en una unidad. ¿Qué figura está en esa posición?",
      },
    })),
    T("pu-rbgy-14", () => ({
      // red·blue·green·yellow, 14 ÷ 4 = 3 r2 → the 2nd shape.
      values: { position: 14, unit: "red, blue, green, yellow" },
      correct: "blue",
      distractor: "red",
      decoys: ["green", "yellow"],
      prompt: {
        en: "The pattern repeats in a unit. Which shape is at that position?",
        es: "El patrón se repite en una unidad. ¿Qué figura está en esa posición?",
      },
    })),
  ],
  "stat-question-no-variability": [
    T("sq-heights", () => ({
      // `options` lets the validator pick the statistical question BY RULE
      // (the one asking about EACH person) instead of trusting this template.
      values: { options: ["How tall is each student in our class?", "How many students are in our class?"] },
      correct: "How tall is each student in our class?",
      distractor: "How many students are in our class?",
      decoys: ["How many minutes are in an hour?", "What day of the week is it?"],
      prompt: {
        en: "Which of these is a STATISTICAL question — one whose answers vary?",
        es: "¿Cuál de estas es una pregunta ESTADÍSTICA, es decir, una cuyas respuestas varían?",
      },
    })),
    T("sq-minutes", () => ({
      // `options` lets the validator pick the statistical question BY RULE
      // (the one asking about EACH person) instead of trusting this template.
      values: { options: ["How many minutes did each student read last night?", "How many minutes are in one hour?"] },
      correct: "How many minutes did each student read last night?",
      distractor: "How many minutes are in one hour?",
      decoys: ["How many days are in a week?", "What time does the bell ring?"],
      prompt: {
        en: "Which of these is a STATISTICAL question — one whose answers vary?",
        es: "¿Cuál de estas es una pregunta ESTADÍSTICA, es decir, una cuyas respuestas varían?",
      },
    })),
    T("sq-shoes", () => ({
      // `options` lets the validator pick the statistical question BY RULE
      // (the one asking about EACH person) instead of trusting this template.
      values: { options: ["What shoe size does each player on the team wear?", "How many players are on the team?"] },
      correct: "What shoe size does each player on the team wear?",
      distractor: "How many players are on the team?",
      decoys: ["What colour is the team jersey?", "How many quarters are in the game?"],
      prompt: {
        en: "Which of these is a STATISTICAL question — one whose answers vary?",
        es: "¿Cuál de estas es una pregunta ESTADÍSTICA, es decir, una cuyas respuestas varían?",
      },
    })),
    T("sq-pets", () => ({
      // `options` lets the validator pick the statistical question BY RULE
      // (the one asking about EACH person) instead of trusting this template.
      values: { options: ["How many pets does each family in our class have?", "How many families are in our class?"] },
      correct: "How many pets does each family in our class have?",
      distractor: "How many families are in our class?",
      decoys: ["How many legs does one dog have?", "What month is it?"],
      prompt: {
        en: "Which of these is a STATISTICAL question — one whose answers vary?",
        es: "¿Cuál de estas es una pregunta ESTADÍSTICA, es decir, una cuyas respuestas varían?",
      },
    })),
  ],

  /* --- Compared two ratios without a common basis ------------------------- */
  "ratio-compared-without-common-basis": [
    T("cb-apples", (r) => {
      const perA = r.int(2, 6) / 10 + 0.1; // A cheaper per one
      const nA = r.int(4, 8);
      const nB = nA + r.int(2, 5);
      const costA = Number((perA * nA).toFixed(2));
      const costB = Number(((perA + 0.1) * nB).toFixed(2));
      return {
        values: { nA, costA, nB, costB },
        correct: Number(perA.toFixed(2)),
        distractor: costA,
        decoys: [Number((perA + 0.1).toFixed(2)), Number((costA + costB).toFixed(2))],
        prompt: {
          en: `Stand A sells ${nA} apples for $${costA.toFixed(2)}. What does ONE apple cost at Stand A, in dollars?`,
          es: `El puesto A vende ${nA} manzanas por $${costA.toFixed(2)}. ¿Cuánto cuesta UNA manzana en el puesto A, en dólares?`,
        },
      };
    }),
    T("cb-pencils", (r) => {
      const per = r.int(2, 5) / 10;
      const n = r.int(5, 10);
      const cost = Number((per * n).toFixed(2));
      return {
        values: { n, cost },
        correct: Number(per.toFixed(2)),
        distractor: cost,
        decoys: [Number((per + 0.1).toFixed(2)), n],
        prompt: {
          en: `A pack of ${n} pencils costs $${cost.toFixed(2)}. What is the price of ONE pencil, in dollars?`,
          es: `Un paquete de ${n} lápices cuesta $${cost.toFixed(2)}. ¿Cuál es el precio de UN lápiz, en dólares?`,
        },
      };
    }),
    T("cb-miles", (r) => {
      const per = r.int(20, 35);
      const gal = r.int(3, 8);
      const miles = per * gal;
      return {
        values: { miles, gal },
        correct: per,
        distractor: miles,
        decoys: [per + 1, gal],
        prompt: {
          en: `A car goes ${miles} miles on ${gal} gallons. How many miles does it go on ONE gallon?`,
          es: `Un carro recorre ${miles} millas con ${gal} galones. ¿Cuántas millas recorre con UN galón?`,
        },
      };
    }),
    T("cb-pages", (r) => {
      const per = r.int(8, 20);
      const mins = r.int(3, 7);
      const pages = per * mins;
      return {
        values: { pages, mins },
        correct: per,
        distractor: pages,
        decoys: [per + 2, mins],
        prompt: {
          en: `A reader finishes ${pages} pages in ${mins} minutes. How many pages is that in ONE minute?`,
          es: `Un lector termina ${pages} páginas en ${mins} minutos. ¿Cuántas páginas son en UN minuto?`,
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
  // A template may supply its own decoys. Numbers, ratios and ordered pairs can
  // all be perturbed mechanically, but an inequality statement or a word answer
  // ("range", "median") cannot — fractionDecoys would read "x > 5" as a number
  // and offer nonsense. Those tags name their own near misses instead.
  const decoys = Array.isArray(built.decoys)
    ? built.decoys
        .filter(
          (d) => String(d) !== String(built.correct) && String(d) !== String(built.distractor),
        )
        .slice(0, 2)
    : pickDecoys(built.correct, built.distractor);
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
