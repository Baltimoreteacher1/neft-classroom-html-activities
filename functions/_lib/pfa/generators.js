// Seeded "similar problem" generators for the PFA homework pages.
//
// One generator per skill. A lesson names its generator (and optional mode) in
// data/practice/<id>.json `similar`. The same source runs on the server (to print the worked
// parallel example on the page and the answer key) and in the browser (inlined by
// scripts/pfa/build-pfa-bundle.mjs) for "Try a similar problem" and the third hint.
//
// Contract for every generator: gen(seed, mode) -> problem
//   { gen, mode, seed, params, kind: "entry"|"mc", stem:{en,es}, answer, accept?:[],
//     choices?:[{value, tag, why:{en,es}}], steps:{en:[],es:[]}, visual?, unit?:{en,es},
//     answerType: "number"|"expr"|"pair"|"text" }
// Answers are recomputed INDEPENDENTLY from `params` by tools/pfa/generators.test.mjs (300 seeds
// per generator and mode); a generator change that drifts from the math fails there.
// Misconception tags must exist in data/misconception-taxonomy.json.

export function rng(seed) {
  let a = (seed >>> 0) + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
export function lcmOf(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}
export function fmtFrac(n, d) {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (d === 1) return String(n);
  const neg = n < 0;
  const an = Math.abs(n);
  if (an > d) return `${neg ? "-" : ""}${Math.floor(an / d)} ${an % d}/${d}`;
  return `${neg ? "-" : ""}${an}/${d}`;
}
// Round to avoid binary noise in printed decimals (0.1 + 0.2).
export function fmtNum(x) {
  const r = Math.round(x * 1e6) / 1e6;
  return Number.isInteger(r) ? String(r) : String(r);
}
const money = (x) => `$${(Math.round(x * 100) / 100).toFixed(2)}`;
const NAMES = [
  "Amara",
  "Diego",
  "Keisha",
  "Mateo",
  "Jalen",
  "Sofía",
  "Tariq",
  "Yesenia",
  "Malik",
  "Camila",
  "Nia",
  "Luis",
];
const wrong = (value, tag, en, es) => ({ value: String(value), tag, why: { en, es } });

// Remove distractors that equal the answer or each other (a "wrong" choice equal to the key
// would be an accidental correct distractor).
function cleanChoices(answer, list) {
  const seen = new Set([String(answer)]);
  return list.filter((c) => {
    const k = String(c.value);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const G = {};

// 1-1, 1-6, 10-1, 10-6: estimate a product by rounding to friendly numbers.
G.estimateProduct = (r) => {
  const a = ri(r, 2, 9) * 10 + ri(r, 1, 4);
  const b = ri(r, 3, 9);
  const ra = Math.round(a / 10) * 10;
  const name = pick(r, NAMES);
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `${name} sells ${a} bags of kettle corn at the Lexington Market stand each day for ${b} days. Round ${a} to the nearest ten, then estimate the total.`,
      es: `${name} vende ${a} bolsas de palomitas en el puesto del Lexington Market cada día durante ${b} días. Redondea ${a} a la decena más cercana y luego estima el total.`,
    },
    answer: String(ra * b),
    steps: {
      en: [
        `Round ${a} to the nearest ten: ${ra}.`,
        `Multiply: ${ra} × ${b} = ${ra * b}.`,
        `The estimate is about ${ra * b} bags.`,
      ],
      es: [
        `Redondea ${a} a la decena más cercana: ${ra}.`,
        `Multiplica: ${ra} × ${b} = ${ra * b}.`,
        `La estimación es de unas ${ra * b} bolsas.`,
      ],
    },
    distractors: [
      wrong(
        ra + b,
        "op-added-instead-of-multiplied",
        `That adds ${ra} + ${b}. Each day repeats the bags, so multiply.`,
        `Eso suma ${ra} + ${b}. Cada día se repiten las bolsas, así que multiplica.`,
      ),
    ],
  };
};

// 1-2: fraction times a whole number.
G.fracTimesWhole = (r) => {
  const d = pick(r, [3, 4, 5, 6, 8]);
  const n = ri(r, 1, d - 1);
  const w = d * ri(r, 2, 6);
  const ans = (n * w) / d;
  return {
    params: { n, d, w },
    answerType: "number",
    stem: {
      en: `A rec center has ${w} basketballs. ${n}/${d} of them need air. How many basketballs need air?`,
      es: `Un centro recreativo tiene ${w} balones de baloncesto. ${n}/${d} de ellos necesitan aire. ¿Cuántos balones necesitan aire?`,
    },
    answer: String(ans),
    visual: {
      type: "tape",
      rows: [
        {
          label: `${w}`,
          parts: Array.from({ length: d }, (_, i) => ({ v: w / d, l: "", shade: i < n })),
          total: w,
        },
      ],
    },
    steps: {
      en: [
        `Split ${w} into ${d} equal groups: ${w} ÷ ${d} = ${w / d}.`,
        `Take ${n} of those groups: ${n} × ${w / d} = ${ans}.`,
      ],
      es: [
        `Divide ${w} en ${d} grupos iguales: ${w} ÷ ${d} = ${w / d}.`,
        `Toma ${n} de esos grupos: ${n} × ${w / d} = ${ans}.`,
      ],
    },
    distractors: [
      wrong(
        w / d,
        "pattern-unit-position-miscounted",
        `That is one group of ${d}. You need ${n} groups.`,
        `Eso es un grupo de ${d}. Necesitas ${n} grupos.`,
      ),
      wrong(
        n * w,
        "op-multiplied-instead-of-divided",
        `That multiplies by ${n} but forgets to split into ${d} groups.`,
        `Eso multiplica por ${n} pero olvida dividir en ${d} grupos.`,
      ),
    ],
  };
};

// 1-3, 2-12: multiply decimals.
G.decimalMultiply = (r) => {
  const a = ri(r, 11, 49) / 10;
  const b = ri(r, 2, 9);
  const ans = Math.round(a * b * 10) / 10;
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `A water taxi ticket costs $${a.toFixed(2)}. How much do ${b} tickets cost?`,
      es: `Un boleto del taxi acuático cuesta $${a.toFixed(2)}. ¿Cuánto cuestan ${b} boletos?`,
    },
    unit: { en: "dollars", es: "dólares" },
    answer: fmtNum(ans),
    steps: {
      en: [
        `Multiply as whole numbers: ${Math.round(a * 10)} × ${b} = ${Math.round(a * 10) * b}.`,
        `${a} has 1 decimal place, so the product has 1: ${fmtNum(ans)}.`,
        `${b} tickets cost ${money(ans)}.`,
      ],
      es: [
        `Multiplica como números enteros: ${Math.round(a * 10)} × ${b} = ${Math.round(a * 10) * b}.`,
        `${a} tiene 1 lugar decimal, así que el producto tiene 1: ${fmtNum(ans)}.`,
        `${b} boletos cuestan ${money(ans)}.`,
      ],
    },
    distractors: [
      wrong(
        Math.round(a * 10) * b,
        "decimal-place-value",
        "The decimal point is missing. Count the decimal places in the factors.",
        "Falta el punto decimal. Cuenta los lugares decimales de los factores.",
      ),
      wrong(
        fmtNum(a + b),
        "op-added-instead-of-multiplied",
        "That adds the price and the number of tickets. Multiply instead.",
        "Eso suma el precio y el número de boletos. Multiplica.",
      ),
    ],
  };
};

// 2-7: divide decimals.
G.decimalDivide = (r) => {
  const b = pick(r, [2, 4, 5, 8]);
  const q = ri(r, 12, 95) / 10;
  const a = Math.round(q * b * 10) / 10;
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `${b} friends split a $${a.toFixed(2)} pizza bill equally. How much does each friend pay?`,
      es: `${b} amigos dividen en partes iguales una cuenta de pizza de $${a.toFixed(2)}. ¿Cuánto paga cada uno?`,
    },
    unit: { en: "dollars", es: "dólares" },
    answer: fmtNum(q),
    steps: {
      en: [
        `Divide ${a} ÷ ${b}.`,
        `${a} ÷ ${b} = ${fmtNum(q)}. Line the decimal point up in the quotient.`,
        `Check: ${fmtNum(q)} × ${b} = ${fmtNum(a)}.`,
      ],
      es: [
        `Divide ${a} ÷ ${b}.`,
        `${a} ÷ ${b} = ${fmtNum(q)}. Alinea el punto decimal en el cociente.`,
        `Comprueba: ${fmtNum(q)} × ${b} = ${fmtNum(a)}.`,
      ],
    },
    distractors: [
      wrong(
        fmtNum(Math.round(q * 10)),
        "decimal-place-value",
        "The decimal point moved. Place it in the quotient right above the one in the dividend.",
        "El punto decimal se movió. Colócalo en el cociente justo encima del dividendo.",
      ),
      wrong(
        fmtNum(a * b),
        "op-multiplied-instead-of-divided",
        "Splitting means dividing, not multiplying.",
        "Repartir significa dividir, no multiplicar.",
      ),
    ],
  };
};

// 2-11: add or subtract decimals.
G.decimalAddSub = (r) => {
  const a = ri(r, 120, 900) / 100;
  const b = ri(r, 15, 95) / 10;
  const sum = Math.round((a + b) * 100) / 100;
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `A runner in Patterson Park ran ${a.toFixed(2)} km on Saturday and ${b.toFixed(1)} km on Sunday. How many kilometers in all?`,
      es: `Una corredora en Patterson Park corrió ${a.toFixed(2)} km el sábado y ${b.toFixed(1)} km el domingo. ¿Cuántos kilómetros en total?`,
    },
    unit: { en: "km", es: "km" },
    answer: fmtNum(sum),
    steps: {
      en: [
        `Line up the decimal points: ${a.toFixed(2)} + ${b.toFixed(2)}.`,
        `Add place by place: ${sum.toFixed(2)}.`,
      ],
      es: [
        `Alinea los puntos decimales: ${a.toFixed(2)} + ${b.toFixed(2)}.`,
        `Suma lugar por lugar: ${sum.toFixed(2)}.`,
      ],
    },
    distractors: [
      wrong(
        fmtNum((Math.round(a * 100) + Math.round(b * 10)) / 100),
        "decimal-place-value",
        "The digits were lined up on the right, not at the decimal point.",
        "Los dígitos se alinearon a la derecha, no en el punto decimal.",
      ),
    ],
  };
};

// 2-6: multi-digit division.
G.longDivision = (r) => {
  const b = ri(r, 12, 28);
  const q = ri(r, 21, 89);
  const a = b * q;
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `${a} fans ride the light rail to Camden Yards in cars that each hold ${b} people. How many full cars is that?`,
      es: `${a} aficionados viajan en el tren ligero a Camden Yards en vagones de ${b} personas cada uno. ¿Cuántos vagones llenos son?`,
    },
    answer: String(q),
    steps: {
      en: [
        `Divide ${a} ÷ ${b}.`,
        `Estimate: ${b} × ${Math.floor(q / 10) * 10} = ${b * Math.floor(q / 10) * 10}.`,
        `${a} ÷ ${b} = ${q}. Check: ${q} × ${b} = ${a}.`,
      ],
      es: [
        `Divide ${a} ÷ ${b}.`,
        `Estima: ${b} × ${Math.floor(q / 10) * 10} = ${b * Math.floor(q / 10) * 10}.`,
        `${a} ÷ ${b} = ${q}. Comprueba: ${q} × ${b} = ${a}.`,
      ],
    },
    distractors: [
      wrong(
        a - b,
        "op-reversed-division",
        "That subtracts once. Division asks how many groups of the divisor fit.",
        "Eso resta una vez. La división pregunta cuántos grupos del divisor caben.",
      ),
    ],
  };
};

// 1-5, 10-2, 10-3, 10-5: add-a-constant pattern, find a later term.
G.patternRule = (r) => {
  const start = ri(r, 2, 9);
  const step = ri(r, 3, 8);
  const n = ri(r, 6, 10);
  const terms = [0, 1, 2, 3].map((i) => start + step * i);
  const ans = start + step * (n - 1);
  return {
    params: { start, step, n },
    answerType: "number",
    stem: {
      en: `A pattern starts ${terms.join(", ")}, … and adds the same amount each time. What is term number ${n}?`,
      es: `Un patrón empieza ${terms.join(", ")}, … y suma la misma cantidad cada vez. ¿Cuál es el término número ${n}?`,
    },
    answer: String(ans),
    visual: {
      type: "table",
      headers: [
        { en: "Term", es: "Término" },
        { en: "Value", es: "Valor" },
      ],
      rows: [
        [1, terms[0]],
        [2, terms[1]],
        [3, terms[2]],
        [4, terms[3]],
        [n, "?"],
      ],
    },
    steps: {
      en: [
        `The rule is "add ${step}".`,
        `From term 1 to term ${n} is ${n - 1} jumps: ${start} + ${n - 1} × ${step}.`,
        `${start} + ${(n - 1) * step} = ${ans}.`,
      ],
      es: [
        `La regla es "sumar ${step}".`,
        `Del término 1 al término ${n} hay ${n - 1} saltos: ${start} + ${n - 1} × ${step}.`,
        `${start} + ${(n - 1) * step} = ${ans}.`,
      ],
    },
    distractors: [
      wrong(
        start + step * n,
        "pattern-unit-position-miscounted",
        `That counts ${n} jumps. From term 1 to term ${n} there are ${n - 1}.`,
        `Eso cuenta ${n} saltos. Del término 1 al término ${n} hay ${n - 1}.`,
      ),
    ],
  };
};

function dataSet(r, len, lo, hi) {
  return Array.from({ length: len }, () => ri(r, lo, hi)).sort((a, b) => a - b);
}

// 2-1, 2-2: count from a dot plot / histogram.
G.dataCount = (r, mode = "dots") => {
  const vals = dataSet(r, ri(r, 9, 13), 1, 8);
  const t = ri(r, 3, 6);
  const ans = vals.filter((v) => v > t).length;
  const visual =
    mode === "hist"
      ? {
          type: "hist",
          bins: [1, 3, 5, 7].map((lo) => ({
            lo,
            hi: lo + 1,
            count: vals.filter((v) => v >= lo && v <= lo + 1).length,
          })),
          xLabel: { en: "Books read", es: "Libros leídos" },
        }
      : {
          type: "dots",
          values: vals,
          min: 0,
          max: 9,
          xLabel: { en: "Books read", es: "Libros leídos" },
        };
  if (mode === "hist") {
    const lo = pick(r, [1, 3, 5, 7]);
    const c = vals.filter((v) => v >= lo && v <= lo + 1).length;
    return {
      params: { vals, lo },
      answerType: "number",
      stem: {
        en: `The histogram shows how many books each student in a book club read. How many students read ${lo} to ${lo + 1} books?`,
        es: `El histograma muestra cuántos libros leyó cada estudiante de un club de lectura. ¿Cuántos estudiantes leyeron de ${lo} a ${lo + 1} libros?`,
      },
      answer: String(c),
      visual,
      steps: {
        en: [`Find the bar for ${lo}–${lo + 1}.`, `Read its height on the frequency scale: ${c}.`],
        es: [
          `Busca la barra de ${lo}–${lo + 1}.`,
          `Lee su altura en la escala de frecuencia: ${c}.`,
        ],
      },
      distractors: [
        wrong(
          lo,
          "stat-frequency-vs-value",
          "That is the number of books, not how many students. Read the bar height.",
          "Ese es el número de libros, no cuántos estudiantes. Lee la altura de la barra.",
        ),
      ],
    };
  }
  return {
    params: { vals, t },
    answerType: "number",
    stem: {
      en: `The dot plot shows how many books each student in a book club read. How many students read MORE than ${t} books?`,
      es: `El diagrama de puntos muestra cuántos libros leyó cada estudiante de un club de lectura. ¿Cuántos estudiantes leyeron MÁS de ${t} libros?`,
    },
    answer: String(ans),
    visual,
    steps: {
      en: [`Look only at the dots to the right of ${t}.`, `Count them: ${ans}.`],
      es: [`Mira solo los puntos a la derecha de ${t}.`, `Cuéntalos: ${ans}.`],
    },
    distractors: [
      wrong(
        vals.filter((v) => v >= t).length,
        "inequality-boundary-inclusion",
        `"More than ${t}" does not include ${t}.`,
        `"Más de ${t}" no incluye el ${t}.`,
      ),
    ].filter((d) => d.value !== String(ans)),
  };
};

function medianOf(sorted) {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

// 2-3, 2-10: median.
G.median = (r) => {
  const len = pick(r, [5, 7, 6, 8]);
  const raw = Array.from({ length: len }, () => ri(r, 10, 40));
  const sorted = [...raw].sort((a, b) => a - b);
  const m = medianOf(sorted);
  return {
    params: { raw },
    answerType: "number",
    stem: {
      en: `Minutes of reading for ${len} days: ${raw.join(", ")}. What is the median?`,
      es: `Minutos de lectura durante ${len} días: ${raw.join(", ")}. ¿Cuál es la mediana?`,
    },
    unit: { en: "minutes", es: "minutos" },
    answer: fmtNum(m),
    visual: {
      type: "dots",
      values: sorted,
      min: Math.min(...sorted) - 2,
      max: Math.max(...sorted) + 2,
      xLabel: { en: "Minutes", es: "Minutos" },
    },
    steps: {
      en: [
        `Order the data: ${sorted.join(", ")}.`,
        len % 2
          ? `The middle value is ${m}.`
          : `Two middle values: ${sorted[len / 2 - 1]} and ${sorted[len / 2]}. Their average is ${fmtNum(m)}.`,
      ],
      es: [
        `Ordena los datos: ${sorted.join(", ")}.`,
        len % 2
          ? `El valor del medio es ${m}.`
          : `Dos valores del medio: ${sorted[len / 2 - 1]} y ${sorted[len / 2]}. Su promedio es ${fmtNum(m)}.`,
      ],
    },
    distractors: [
      wrong(
        raw[Math.floor(len / 2)],
        "stat-mean-vs-median",
        "That is the middle of the list as written. Put the numbers in order first.",
        "Ese es el del medio de la lista sin ordenar. Primero ordena los números.",
      ),
      wrong(
        fmtNum(Math.round((raw.reduce((a, b) => a + b, 0) / len) * 100) / 100),
        "stat-mean-vs-median",
        "That is the mean. The median is the middle of the ordered data.",
        "Esa es la media. La mediana es el valor del medio de los datos ordenados.",
      ),
    ],
  };
};

// 2-8: mean.
G.mean = (r) => {
  const len = pick(r, [4, 5]);
  const target = ri(r, 6, 18);
  const raw = Array.from({ length: len - 1 }, () => target + ri(r, -4, 4));
  raw.push(target * len - raw.reduce((a, b) => a + b, 0));
  const sum = target * len;
  return {
    params: { raw },
    answerType: "number",
    stem: {
      en: `Points scored in ${len} rec-league games: ${raw.join(", ")}. What is the mean?`,
      es: `Puntos anotados en ${len} partidos de la liga recreativa: ${raw.join(", ")}. ¿Cuál es la media?`,
    },
    answer: String(target),
    visual: {
      type: "tape",
      rows: [
        {
          label: { en: "Total", es: "Total" },
          parts: raw.map((v) => ({ v, l: String(v) })),
          total: sum,
        },
        {
          label: { en: "Fair share", es: "Parte justa" },
          parts: raw.map(() => ({ v: target, l: "?" })),
          total: sum,
        },
      ],
    },
    steps: {
      en: [
        `Add the data: ${raw.join(" + ")} = ${sum}.`,
        `Share it equally among ${len} games: ${sum} ÷ ${len} = ${target}.`,
      ],
      es: [
        `Suma los datos: ${raw.join(" + ")} = ${sum}.`,
        `Repártelo en partes iguales entre ${len} partidos: ${sum} ÷ ${len} = ${target}.`,
      ],
    },
    distractors: [
      wrong(
        sum,
        "stat-summed-instead-of-averaged",
        `${sum} is the total. Divide it by ${len} to find the mean.`,
        `${sum} es el total. Divídelo entre ${len} para hallar la media.`,
      ),
    ],
  };
};

function quartiles(sorted) {
  const n = sorted.length;
  const lower = sorted.slice(0, Math.floor(n / 2));
  const upper = sorted.slice(Math.ceil(n / 2));
  return { q1: medianOf(lower), med: medianOf(sorted), q3: medianOf(upper) };
}

// 2-4, 2-5: interquartile range read from a box plot built from data.
G.iqr = (r, mode = "iqr") => {
  const sorted = dataSet(r, 8, 2, 30);
  const { q1, med, q3 } = quartiles(sorted);
  const lo = sorted[0];
  const hi = sorted[7];
  const box = {
    type: "box",
    min: lo,
    q1,
    med,
    q3,
    max: hi,
    lo: 0,
    hi: 32,
    xLabel: { en: "Minutes on the bus", es: "Minutos en el autobús" },
  };
  if (mode === "range") {
    return {
      params: { sorted },
      answerType: "number",
      stem: {
        en: `Minutes on the bus for 8 students: ${sorted.join(", ")}. What is the range?`,
        es: `Minutos en el autobús de 8 estudiantes: ${sorted.join(", ")}. ¿Cuál es el rango?`,
      },
      answer: String(hi - lo),
      visual: box,
      steps: {
        en: [`Greatest value ${hi}, least value ${lo}.`, `Range = ${hi} − ${lo} = ${hi - lo}.`],
        es: [`Valor mayor ${hi}, valor menor ${lo}.`, `Rango = ${hi} − ${lo} = ${hi - lo}.`],
      },
      distractors: [
        wrong(
          fmtNum(q3 - q1),
          "stat-range-for-iqr",
          "That is the IQR (Q3 − Q1). The range uses the greatest and least values.",
          "Ese es el RIC (Q3 − Q1). El rango usa el valor mayor y el menor.",
        ),
      ].filter((d) => d.value !== String(hi - lo)),
    };
  }
  return {
    params: { sorted },
    answerType: "number",
    stem: {
      en: `Minutes on the bus for 8 students: ${sorted.join(", ")}. What is the interquartile range (IQR)?`,
      es: `Minutos en el autobús de 8 estudiantes: ${sorted.join(", ")}. ¿Cuál es el rango intercuartil (RIC)?`,
    },
    answer: fmtNum(q3 - q1),
    visual: box,
    steps: {
      en: [
        `Median of the lower half (Q1) = ${fmtNum(q1)}. Median of the upper half (Q3) = ${fmtNum(q3)}.`,
        `IQR = Q3 − Q1 = ${fmtNum(q3)} − ${fmtNum(q1)} = ${fmtNum(q3 - q1)}.`,
      ],
      es: [
        `Mediana de la mitad inferior (Q1) = ${fmtNum(q1)}. Mediana de la mitad superior (Q3) = ${fmtNum(q3)}.`,
        `RIC = Q3 − Q1 = ${fmtNum(q3)} − ${fmtNum(q1)} = ${fmtNum(q3 - q1)}.`,
      ],
    },
    distractors: [
      wrong(
        hi - lo,
        "stat-range-for-iqr",
        "That is the range. The IQR uses Q3 and Q1.",
        "Ese es el rango. El RIC usa Q3 y Q1.",
      ),
    ].filter((d) => d.value !== fmtNum(q3 - q1)),
  };
};

// 2-9: mean absolute deviation (data chosen so the mean and MAD are whole numbers).
G.mad = (r) => {
  const m = ri(r, 8, 15);
  const d = [ri(r, 1, 4), ri(r, 1, 4)];
  const raw = [m - d[0], m + d[0], m - d[1], m + d[1], m].sort((a, b) => a - b);
  const mad = (2 * d[0] + 2 * d[1]) / 5;
  return {
    params: { raw },
    answerType: "number",
    stem: {
      en: `Hours of sleep: ${raw.join(", ")}. The mean is ${m}. What is the mean absolute deviation?`,
      es: `Horas de sueño: ${raw.join(", ")}. La media es ${m}. ¿Cuál es la desviación media absoluta?`,
    },
    answer: fmtNum(mad),
    visual: {
      type: "numberLine",
      min: m - 6,
      max: m + 6,
      step: 1,
      marks: raw.map((v) => ({ v, l: String(v) })),
      center: m,
    },
    steps: {
      en: [
        `Distances from ${m}: ${raw.map((v) => Math.abs(v - m)).join(", ")}.`,
        `Add them: ${raw.reduce((s, v) => s + Math.abs(v - m), 0)}.`,
        `Divide by 5: ${fmtNum(mad)}.`,
      ],
      es: [
        `Distancias a ${m}: ${raw.map((v) => Math.abs(v - m)).join(", ")}.`,
        `Súmalas: ${raw.reduce((s, v) => s + Math.abs(v - m), 0)}.`,
        `Divide entre 5: ${fmtNum(mad)}.`,
      ],
    },
    distractors: [
      wrong(
        raw.reduce((s, v) => s + Math.abs(v - m), 0),
        "stat-summed-instead-of-averaged",
        "That is the total distance. Divide by how many values there are.",
        "Esa es la distancia total. Divide entre la cantidad de valores.",
      ),
    ],
  };
};

// 3-1, 3-3, 3-4, 3-9: missing value in a ratio table.
G.ratioTable = (r, mode = "table") => {
  const a = ri(r, 2, 5);
  const b = ri(r, 3, 9);
  const k = ri(r, 3, 8);
  const ans = b * k;
  const ctx = pick(r, [
    { en: ["cups of rice", "cups of water"], es: ["tazas de arroz", "tazas de agua"] },
    {
      en: ["scoops of mix", "cups of lemonade"],
      es: ["cucharadas de mezcla", "tazas de limonada"],
    },
  ]);
  const visual =
    mode === "graph"
      ? {
          type: "coord",
          xmin: 0,
          xmax: a * (k + 1),
          ymin: 0,
          ymax: b * (k + 1),
          points: [1, 2, 3].map((i) => ({ x: a * i, y: b * i })),
          xLabel: { en: ctx.en[0], es: ctx.es[0] },
          yLabel: { en: ctx.en[1], es: ctx.es[1] },
        }
      : {
          type: "table",
          headers: [
            { en: ctx.en[0], es: ctx.es[0] },
            { en: ctx.en[1], es: ctx.es[1] },
          ],
          rows: [
            [a, b],
            [a * 2, b * 2],
            [a * k, "?"],
          ],
        };
  return {
    params: { a, b, k },
    answerType: "number",
    stem: {
      en: `A recipe uses ${a} ${ctx.en[0]} for every ${b} ${ctx.en[1]}. How many ${ctx.en[1]} go with ${a * k} ${ctx.en[0]}?`,
      es: `Una receta usa ${a} ${ctx.es[0]} por cada ${b} ${ctx.es[1]}. ¿Cuántas ${ctx.es[1]} van con ${a * k} ${ctx.es[0]}?`,
    },
    answer: String(ans),
    visual,
    steps: {
      en: [
        `${a * k} ÷ ${a} = ${k}, so the recipe is made ${k} times as big.`,
        `Multiply the other quantity by ${k} too: ${b} × ${k} = ${ans}.`,
      ],
      es: [
        `${a * k} ÷ ${a} = ${k}, así que la receta se hace ${k} veces más grande.`,
        `Multiplica también la otra cantidad por ${k}: ${b} × ${k} = ${ans}.`,
      ],
    },
    distractors: [
      wrong(
        b + (a * k - a),
        "ratio-scaled-additively",
        `That adds ${a * k - a} to both. Equivalent ratios multiply both quantities by the same number.`,
        `Eso suma ${a * k - a} a las dos. Las razones equivalentes multiplican ambas cantidades por el mismo número.`,
      ),
    ],
  };
};

// 3-2, 3-5, 3-8: unit rate.
G.unitRate = (r) => {
  const rate = ri(r, 2, 9) + pick(r, [0, 0.5, 0.25]);
  const n = pick(r, [4, 6, 8, 12]);
  const total = rate * n;
  return {
    params: { total, n },
    answerType: "number",
    stem: {
      en: `${n} bottles of water cost $${total.toFixed(2)} at the corner store. What is the price for 1 bottle?`,
      es: `${n} botellas de agua cuestan $${total.toFixed(2)} en la tienda de la esquina. ¿Cuál es el precio de 1 botella?`,
    },
    unit: { en: "dollars per bottle", es: "dólares por botella" },
    answer: fmtNum(rate),
    visual: {
      type: "dnl",
      top: { label: { en: "Cost ($)", es: "Costo ($)" }, values: ["0", "?", total.toFixed(2)] },
      bottom: { label: { en: "Bottles", es: "Botellas" }, values: ["0", "1", String(n)] },
    },
    steps: {
      en: [
        `A unit rate is the cost for 1.`,
        `Divide: $${total.toFixed(2)} ÷ ${n} = $${rate.toFixed(2)}.`,
      ],
      es: [
        `Una tasa unitaria es el costo de 1.`,
        `Divide: $${total.toFixed(2)} ÷ ${n} = $${rate.toFixed(2)}.`,
      ],
    },
    distractors: [
      wrong(
        fmtNum(n / total),
        "ratio-inverted",
        "That is bottles per dollar. The question asks for dollars per bottle.",
        "Eso es botellas por dólar. La pregunta pide dólares por botella.",
      ),
    ],
  };
};

// 3-6, 3-7, 3-10: convert units with a conversion rate.
G.convertUnits = (r) => {
  const c = pick(r, [
    { f: 12, en: ["feet", "inches", "foot"], es: ["pies", "pulgadas", "pie", "Cuántas"] },
    { f: 3, en: ["yards", "feet", "yard"], es: ["yardas", "pies", "yarda", "Cuántos"] },
    {
      f: 4,
      en: ["gallons", "quarts", "gallon"],
      es: ["galones", "cuartos de galón", "galón", "Cuántos"],
    },
    { f: 60, en: ["hours", "minutes", "hour"], es: ["horas", "minutos", "hora", "Cuántos"] },
    {
      f: 1000,
      en: ["kilometers", "meters", "kilometer"],
      es: ["kilómetros", "metros", "kilómetro", "Cuántos"],
    },
  ]);
  const q = ri(r, 2, 9) + (c.f % 2 === 0 ? pick(r, [0, 0.5]) : 0);
  const ans = q * c.f;
  return {
    params: { q, f: c.f },
    answerType: "number",
    stem: {
      en: `There are ${c.f} ${c.en[1]} in 1 ${c.en[2]}. How many ${c.en[1]} are in ${fmtNum(q)} ${c.en[0]}?`,
      es: `Hay ${c.f} ${c.es[1]} en 1 ${c.es[2]}. ¿${c.es[3]} ${c.es[1]} hay en ${fmtNum(q)} ${c.es[0]}?`,
    },
    unit: { en: c.en[1], es: c.es[1] },
    answer: fmtNum(ans),
    visual: {
      type: "dnl",
      top: { label: { en: c.en[0], es: c.es[0] }, values: ["0", "1", fmtNum(q)] },
      bottom: { label: { en: c.en[1], es: c.es[1] }, values: ["0", String(c.f), "?"] },
    },
    steps: {
      en: [
        `Each ${c.en[2]} is ${c.f} ${c.en[1]}.`,
        `Multiply: ${fmtNum(q)} × ${c.f} = ${fmtNum(ans)}.`,
      ],
      es: [
        `Cada ${c.es[2]} equivale a ${c.f} ${c.es[1]}.`,
        `Multiplica: ${fmtNum(q)} × ${c.f} = ${fmtNum(ans)}.`,
      ],
    },
    distractors: [
      wrong(
        fmtNum(Math.round((q / c.f) * 1000) / 1000),
        "op-divided-instead-of-multiplied",
        "Going to a smaller unit means you need MORE of them, so multiply.",
        "Pasar a una unidad más pequeña significa que necesitas MÁS, así que multiplica.",
      ),
    ],
  };
};

// 4-1, 4-3, 4-4: percent of a number.
G.percentOf = (r, mode = "exact") => {
  const p = pick(
    r,
    mode === "grid" ? [10, 20, 25, 30, 40, 50, 60, 75] : [10, 20, 25, 30, 40, 50, 60, 75, 15, 35],
  );
  const base = pick(r, [20, 40, 60, 80, 120, 200, 240]);
  const ans = (p * base) / 100;
  return {
    params: { p, base },
    answerType: "number",
    stem: {
      en: `A jacket costs $${base}. It is ${p}% off. How many dollars do you save?`,
      es: `Una chaqueta cuesta $${base}. Tiene ${p}% de descuento. ¿Cuántos dólares ahorras?`,
    },
    unit: { en: "dollars", es: "dólares" },
    answer: fmtNum(ans),
    visual: {
      type: "dnl",
      top: { label: { en: "Dollars", es: "Dólares" }, values: ["0", "?", String(base)] },
      bottom: { label: { en: "Percent", es: "Porcentaje" }, values: ["0%", `${p}%`, "100%"] },
    },
    steps: {
      en: [
        `10% of $${base} is $${fmtNum(base / 10)}.`,
        `${p}% is ${p / 10} groups of 10%: ${p / 10} × ${fmtNum(base / 10)} = ${fmtNum(ans)}.`,
      ],
      es: [
        `El 10% de $${base} es $${fmtNum(base / 10)}.`,
        `El ${p}% son ${p / 10} grupos del 10%: ${p / 10} × ${fmtNum(base / 10)} = ${fmtNum(ans)}.`,
      ],
    },
    distractors: [
      wrong(
        p * base,
        "percent-scale-off-by-100",
        `Percent means "out of 100". Divide by 100.`,
        `Porcentaje significa "de cada 100". Divide entre 100.`,
      ),
      wrong(
        fmtNum(base - ans),
        "percent-used-as-whole-number",
        "That is the sale price. The question asks how much you save.",
        "Ese es el precio con descuento. La pregunta es cuánto ahorras.",
      ),
    ],
  };
};

// 4-2: fraction to percent.
G.fracToPercent = (r) => {
  const d = pick(r, [2, 4, 5, 10, 20, 25, 50]);
  const n = ri(r, 1, d - 1);
  const pct = (n * 100) / d;
  return {
    params: { n, d },
    answerType: "number",
    stem: {
      en: `${n} out of ${d} students walk to school. What percent is that? (Type the number only.)`,
      es: `${n} de cada ${d} estudiantes caminan a la escuela. ¿Qué porcentaje es? (Escribe solo el número.)`,
    },
    unit: { en: "%", es: "%" },
    answer: fmtNum(pct),
    visual: { type: "grid100", shaded: pct },
    steps: {
      en: [
        `Make the denominator 100: ${d} × ${100 / d} = 100.`,
        `${n} × ${100 / d} = ${fmtNum(pct)}, so ${n}/${d} = ${fmtNum(pct)}/100 = ${fmtNum(pct)}%.`,
      ],
      es: [
        `Haz que el denominador sea 100: ${d} × ${100 / d} = 100.`,
        `${n} × ${100 / d} = ${fmtNum(pct)}, así que ${n}/${d} = ${fmtNum(pct)}/100 = ${fmtNum(pct)}%.`,
      ],
    },
    distractors: [
      wrong(
        fmtNum(n / d),
        "percent-scale-off-by-100",
        "That is the decimal. Multiply by 100 for the percent.",
        "Ese es el decimal. Multiplica por 100 para el porcentaje.",
      ),
    ],
  };
};

// 4-5: find the whole from a part and a percent.
G.percentWhole = (r) => {
  const p = pick(r, [10, 20, 25, 40, 50]);
  const whole = pick(r, [40, 60, 80, 120, 200]);
  const part = (p * whole) / 100;
  return {
    params: { p, part },
    answerType: "number",
    stem: {
      en: `${part} students joined the chess club. That is ${p}% of the sixth grade. How many sixth graders are there?`,
      es: `${part} estudiantes se unieron al club de ajedrez. Eso es el ${p}% del sexto grado. ¿Cuántos estudiantes de sexto grado hay?`,
    },
    answer: String(whole),
    visual: {
      type: "tape",
      rows: [
        {
          label: "100%",
          parts: Array.from({ length: 100 / p }, (_, i) => ({
            v: p,
            l: i === 0 ? String(part) : "",
            shade: i === 0,
          })),
          total: "?",
        },
      ],
    },
    steps: {
      en: [
        `${p}% is ${part}, and 100% is ${100 / p} times as much.`,
        `${part} × ${100 / p} = ${whole}.`,
      ],
      es: [
        `El ${p}% es ${part}, y el 100% es ${100 / p} veces esa cantidad.`,
        `${part} × ${100 / p} = ${whole}.`,
      ],
    },
    distractors: [
      wrong(
        fmtNum((p * part) / 100),
        "percent-used-as-whole-number",
        `That finds ${p}% of ${part}. Here ${part} is the part, not the whole.`,
        `Eso calcula el ${p}% de ${part}. Aquí ${part} es la parte, no el total.`,
      ),
    ],
  };
};

// 5-1, 5-2, 5-3: area of a parallelogram, triangle or trapezoid.
G.areaShape = (r, mode = "parallelogram") => {
  const b = ri(r, 4, 14);
  const h = ri(r, 3, 10);
  const b2 = mode === "trapezoid" ? ri(r, 2, b - 1) : null;
  let area;
  let formula;
  let wrongVal;
  if (mode === "triangle") {
    area = (b * h) / 2;
    formula = { en: `A = ½ × b × h = ½ × ${b} × ${h}`, es: `A = ½ × b × h = ½ × ${b} × ${h}` };
    wrongVal = wrong(
      b * h,
      "geom-triangle-area-no-half",
      "A triangle is half of a parallelogram. Multiply by ½.",
      "Un triángulo es la mitad de un paralelogramo. Multiplica por ½.",
    );
  } else if (mode === "trapezoid") {
    area = ((b + b2) * h) / 2;
    formula = {
      en: `A = ½ × (b₁ + b₂) × h = ½ × (${b} + ${b2}) × ${h}`,
      es: `A = ½ × (b₁ + b₂) × h = ½ × (${b} + ${b2}) × ${h}`,
    };
    wrongVal = wrong(
      (b + b2) * h,
      "geom-triangle-area-no-half",
      "Two copies of the trapezoid make a parallelogram, so take half.",
      "Dos copias del trapecio forman un paralelogramo, así que toma la mitad.",
    );
  } else {
    area = b * h;
    formula = { en: `A = b × h = ${b} × ${h}`, es: `A = b × h = ${b} × ${h}` };
    wrongVal = wrong(
      2 * (b + h),
      "measure-area-perimeter-swap",
      "That adds the sides (perimeter). Area multiplies base by height.",
      "Eso suma los lados (perímetro). El área multiplica la base por la altura.",
    );
  }
  const shapeEn = { parallelogram: "parallelogram", triangle: "triangle", trapezoid: "trapezoid" }[
    mode
  ];
  const shapeEs = { parallelogram: "paralelogramo", triangle: "triángulo", trapezoid: "trapecio" }[
    mode
  ];
  return {
    params: { b, h, b2, mode },
    answerType: "number",
    stem: {
      en: `A garden bed is shaped like a ${shapeEn}${mode === "trapezoid" ? ` with bases ${b} ft and ${b2} ft` : ` with base ${b} ft`} and height ${h} ft. What is its area in square feet?`,
      es: `Un cantero tiene forma de ${shapeEs}${mode === "trapezoid" ? ` con bases de ${b} pies y ${b2} pies` : ` con base de ${b} pies`} y altura de ${h} pies. ¿Cuál es su área en pies cuadrados?`,
    },
    unit: { en: "sq ft", es: "pies²" },
    answer: fmtNum(area),
    visual: { type: "area", shape: mode, base: b, height: h, top: b2 },
    steps: {
      en: [formula.en, `A = ${fmtNum(area)} square feet.`],
      es: [formula.es, `A = ${fmtNum(area)} pies cuadrados.`],
    },
    distractors: [wrongVal],
  };
};

// 5-4, 10-4: composite area = rectangle + triangle.
G.areaComposite = (r) => {
  const w = ri(r, 4, 10);
  const h = ri(r, 3, 8);
  const th = ri(r, 2, 6);
  const area = w * h + (w * th) / 2;
  return {
    params: { w, h, th },
    answerType: "number",
    stem: {
      en: `A banner is a ${w} by ${h} inch rectangle with a triangle on top. The triangle's base is ${w} in and its height is ${th} in. What is the total area?`,
      es: `Un banderín es un rectángulo de ${w} por ${h} pulgadas con un triángulo encima. La base del triángulo mide ${w} pulg y su altura ${th} pulg. ¿Cuál es el área total?`,
    },
    unit: { en: "sq in", es: "pulg²" },
    answer: fmtNum(area),
    visual: { type: "area", shape: "house", base: w, height: h, roof: th },
    steps: {
      en: [
        `Rectangle: ${w} × ${h} = ${w * h}.`,
        `Triangle: ½ × ${w} × ${th} = ${fmtNum((w * th) / 2)}.`,
        `Total: ${w * h} + ${fmtNum((w * th) / 2)} = ${fmtNum(area)} square inches.`,
      ],
      es: [
        `Rectángulo: ${w} × ${h} = ${w * h}.`,
        `Triángulo: ½ × ${w} × ${th} = ${fmtNum((w * th) / 2)}.`,
        `Total: ${w * h} + ${fmtNum((w * th) / 2)} = ${fmtNum(area)} pulgadas cuadradas.`,
      ],
    },
    distractors: [
      wrong(
        w * h + w * th,
        "geom-triangle-area-no-half",
        "The triangle's area is half of base × height.",
        "El área del triángulo es la mitad de base × altura.",
      ),
    ],
  };
};

// 1-4, 5-5, 5-10: volume of a rectangular prism (mode "half" uses a half-unit edge).
G.volumePrism = (r, mode = "whole") => {
  const l = ri(r, 2, 8) + (mode === "half" ? 0.5 : 0);
  const w = ri(r, 2, 6);
  const h = ri(r, 2, 6);
  const v = l * w * h;
  return {
    params: { l, w, h },
    answerType: "number",
    stem: {
      en: `A storage bin is ${fmtNum(l)} ft long, ${w} ft wide, and ${h} ft tall. What is its volume in cubic feet?`,
      es: `Una caja de almacenaje mide ${fmtNum(l)} pies de largo, ${w} pies de ancho y ${h} pies de alto. ¿Cuál es su volumen en pies cúbicos?`,
    },
    unit: { en: "cu ft", es: "pies³" },
    answer: fmtNum(v),
    visual: { type: "prism", l, w, h },
    steps: {
      en: [
        `Base area: ${fmtNum(l)} × ${w} = ${fmtNum(l * w)}.`,
        `Volume = base area × height = ${fmtNum(l * w)} × ${h} = ${fmtNum(v)} cubic feet.`,
      ],
      es: [
        `Área de la base: ${fmtNum(l)} × ${w} = ${fmtNum(l * w)}.`,
        `Volumen = área de la base × altura = ${fmtNum(l * w)} × ${h} = ${fmtNum(v)} pies cúbicos.`,
      ],
    },
    distractors: [
      wrong(
        fmtNum(l + w + h),
        "geom-volume-added-dimensions",
        "Volume multiplies the three edges; it does not add them.",
        "El volumen multiplica las tres aristas; no las suma.",
      ),
    ],
  };
};

// 5-6, 5-7: surface area of a rectangular prism. 5-8 (mode "pyramid"): square pyramid.
G.surfaceArea = (r, mode = "prism") => {
  if (mode === "pyramid") {
    const s = ri(r, 3, 10);
    const sl = ri(r, 4, 12);
    const sa = s * s + 4 * ((s * sl) / 2);
    return {
      params: { s, sl, mode },
      answerType: "number",
      stem: {
        en: `A square pyramid has a base side of ${s} cm. Each triangle face has a height (slant height) of ${sl} cm. What is the surface area?`,
        es: `Una pirámide cuadrada tiene una base de ${s} cm de lado. Cada cara triangular tiene una altura (apotema) de ${sl} cm. ¿Cuál es el área total?`,
      },
      unit: { en: "sq cm", es: "cm²" },
      answer: fmtNum(sa),
      visual: { type: "net", shape: "pyramid", s, sl },
      steps: {
        en: [
          `Base: ${s} × ${s} = ${s * s}.`,
          `Each triangle: ½ × ${s} × ${sl} = ${fmtNum((s * sl) / 2)}; four of them: ${fmtNum(2 * s * sl)}.`,
          `Total: ${s * s} + ${2 * s * sl} = ${fmtNum(sa)} square centimeters.`,
        ],
        es: [
          `Base: ${s} × ${s} = ${s * s}.`,
          `Cada triángulo: ½ × ${s} × ${sl} = ${fmtNum((s * sl) / 2)}; los cuatro: ${fmtNum(2 * s * sl)}.`,
          `Total: ${s * s} + ${2 * s * sl} = ${fmtNum(sa)} centímetros cuadrados.`,
        ],
      },
      distractors: [
        wrong(
          s * s + 4 * s * sl,
          "geom-triangle-area-no-half",
          "Each face is a triangle, so its area is half of base × height.",
          "Cada cara es un triángulo, así que su área es la mitad de base × altura.",
        ),
      ],
    };
  }
  const l = ri(r, 3, 9);
  const w = ri(r, 2, 6);
  const h = ri(r, 2, 6);
  const sa = 2 * (l * w + l * h + w * h);
  return {
    params: { l, w, h, mode },
    answerType: "number",
    stem: {
      en: `A gift box is ${l} in long, ${w} in wide, and ${h} in tall. How much wrapping paper covers it exactly (surface area)?`,
      es: `Una caja de regalo mide ${l} pulg de largo, ${w} pulg de ancho y ${h} pulg de alto. ¿Cuánto papel de regalo la cubre exactamente (área total)?`,
    },
    unit: { en: "sq in", es: "pulg²" },
    answer: String(sa),
    visual: { type: "net", shape: "prism", l, w, h },
    steps: {
      en: [
        `Faces come in pairs: ${l}×${w} = ${l * w}, ${l}×${h} = ${l * h}, ${w}×${h} = ${w * h}.`,
        `Add one of each: ${l * w + l * h + w * h}. Double it: ${sa} square inches.`,
      ],
      es: [
        `Las caras vienen en pares: ${l}×${w} = ${l * w}, ${l}×${h} = ${l * h}, ${w}×${h} = ${w * h}.`,
        `Suma una de cada una: ${l * w + l * h + w * h}. Duplícalo: ${sa} pulgadas cuadradas.`,
      ],
    },
    distractors: [
      wrong(
        l * w * h,
        "geom-surface-area-as-volume",
        "That is the volume. Surface area adds the areas of the six faces.",
        "Ese es el volumen. El área total suma las áreas de las seis caras.",
      ),
    ],
  };
};

// 5-9: area of a regular polygon split into triangles from the center.
G.areaRegularPolygon = (r) => {
  const n = pick(r, [5, 6, 8]);
  const s = ri(r, 4, 10);
  const a = ri(r, 3, 9);
  const area = (n * s * a) / 2;
  const nameEn = { 5: "pentagon", 6: "hexagon", 8: "octagon" }[n];
  const nameEs = { 5: "pentágono", 6: "hexágono", 8: "octágono" }[n];
  return {
    params: { n, s, a },
    answerType: "number",
    stem: {
      en: `A regular ${nameEn} has sides of ${s} cm. The distance from its center to each side (apothem) is ${a} cm. What is its area?`,
      es: `Un ${nameEs} regular tiene lados de ${s} cm. La distancia del centro a cada lado (apotema) es ${a} cm. ¿Cuál es su área?`,
    },
    unit: { en: "sq cm", es: "cm²" },
    answer: fmtNum(area),
    visual: { type: "polygon", n, s, a },
    steps: {
      en: [
        `Split it into ${n} equal triangles from the center.`,
        `One triangle: ½ × ${s} × ${a} = ${fmtNum((s * a) / 2)}.`,
        `${n} triangles: ${n} × ${fmtNum((s * a) / 2)} = ${fmtNum(area)} square centimeters.`,
      ],
      es: [
        `Divídelo en ${n} triángulos iguales desde el centro.`,
        `Un triángulo: ½ × ${s} × ${a} = ${fmtNum((s * a) / 2)}.`,
        `${n} triángulos: ${n} × ${fmtNum((s * a) / 2)} = ${fmtNum(area)} centímetros cuadrados.`,
      ],
    },
    distractors: [
      wrong(
        n * s * a,
        "geom-triangle-area-no-half",
        "Each piece is a triangle, so take half of base × height.",
        "Cada pieza es un triángulo, así que toma la mitad de base × altura.",
      ),
    ],
  };
};

// 6-1, 6-9: whole number ÷ unit fraction (or n/d).
G.wholeDivUnitFrac = (r) => {
  const d = pick(r, [2, 3, 4, 6, 8]);
  const n = pick(
    r,
    [1, 1, 2, 3].filter((x) => x < d && gcd(x, d) === 1),
  );
  const w = n * ri(r, 2, 6);
  const ans = (w * d) / n;
  return {
    params: { w, n, d },
    answerType: "number",
    stem: {
      en: `You have ${w} cups of trail mix. Each snack bag holds ${n}/${d} cup. How many bags can you fill?`,
      es: `Tienes ${w} tazas de mezcla de frutos secos. Cada bolsita lleva ${n}/${d} de taza. ¿Cuántas bolsitas puedes llenar?`,
    },
    answer: fmtNum(ans),
    visual: { type: "bars", whole: w, d, n },
    steps: {
      en: [
        `Each cup holds ${d} pieces of size 1/${d}, so ${w} cups hold ${w * d}.`,
        n === 1
          ? `Each bag uses 1 piece: ${w * d} bags.`
          : `Each bag uses ${n} pieces: ${w * d} ÷ ${n} = ${fmtNum(ans)} bags.`,
        `${w} ÷ ${n}/${d} = ${w} × ${d}/${n} = ${fmtNum(ans)}.`,
      ],
      es: [
        `Cada taza tiene ${d} partes de 1/${d}, así que ${w} tazas tienen ${w * d}.`,
        n === 1
          ? `Cada bolsita usa 1 parte: ${w * d} bolsitas.`
          : `Cada bolsita usa ${n} partes: ${w * d} ÷ ${n} = ${fmtNum(ans)} bolsitas.`,
        `${w} ÷ ${n}/${d} = ${w} × ${d}/${n} = ${fmtNum(ans)}.`,
      ],
    },
    distractors: [
      wrong(
        fmtFrac(w * n, d),
        "fraction-no-reciprocal",
        `That multiplies by ${n}/${d}. Dividing by a fraction means multiplying by its reciprocal, ${d}/${n}.`,
        `Eso multiplica por ${n}/${d}. Dividir entre una fracción es multiplicar por su recíproco, ${d}/${n}.`,
      ),
    ],
  };
};

// 6-2, 6-10, 6-11: fraction ÷ fraction (mode "mixed" uses a mixed-number dividend).
G.fracDivide = (r, mode = "frac") => {
  const d1 = pick(r, [2, 3, 4, 5, 6]);
  const n1 = mode === "mixed" ? d1 * ri(r, 1, 3) + ri(r, 1, d1 - 1) : ri(r, 1, d1 - 1);
  const d2 = pick(r, [2, 3, 4, 6, 8]);
  const n2 = pick(
    r,
    [1, 3].filter((x) => x < d2),
  );
  const qn = n1 * d2;
  const qd = d1 * n2;
  const a = fmtFrac(n1, d1);
  const b = fmtFrac(n2, d2);
  return {
    params: { n1, d1, n2, d2 },
    answerType: "number",
    stem: {
      en: `A ribbon is ${a} yards long. How many pieces of ${b} yard can you cut from it?`,
      es: `Una cinta mide ${a} yardas. ¿Cuántos trozos de ${b} de yarda puedes cortar?`,
    },
    answer: fmtFrac(qn, qd),
    steps: {
      en: [
        mode === "mixed"
          ? `Write ${a} as an improper fraction: ${n1}/${d1}.`
          : `Divide ${a} ÷ ${b}.`,
        `Multiply by the reciprocal: ${n1}/${d1} × ${d2}/${n2} = ${qn}/${qd}.`,
        `Simplify: ${fmtFrac(qn, qd)}.`,
      ],
      es: [
        mode === "mixed"
          ? `Escribe ${a} como fracción impropia: ${n1}/${d1}.`
          : `Divide ${a} ÷ ${b}.`,
        `Multiplica por el recíproco: ${n1}/${d1} × ${d2}/${n2} = ${qn}/${qd}.`,
        `Simplifica: ${fmtFrac(qn, qd)}.`,
      ],
    },
    distractors: [
      wrong(
        fmtFrac(n1 * n2, d1 * d2),
        "fraction-no-reciprocal",
        "That multiplies the fractions as written. Flip the divisor first.",
        "Eso multiplica las fracciones tal como están. Primero invierte el divisor.",
      ),
      wrong(
        fmtFrac(n2 * d1, d2 * n1),
        "op-reversed-division",
        "That divides the other way around.",
        "Eso divide al revés.",
      ),
    ],
  };
};

// 6-3 (mode "power"), 6-4 (mode "order"): evaluate numerical expressions.
G.evalNumeric = (r, mode = "power") => {
  if (mode === "power") {
    const b = ri(r, 2, 6);
    const e = b <= 3 ? ri(r, 2, 4) : ri(r, 2, 3);
    const v = b ** e;
    return {
      params: { b, e, mode },
      answerType: "number",
      stem: { en: `What is the value of ${b}^${e}?`, es: `¿Cuál es el valor de ${b}^${e}?` },
      display: `${b}<sup>${e}</sup>`,
      answer: String(v),
      steps: {
        en: [`${b}^${e} means ${Array(e).fill(b).join(" × ")}.`, `= ${v}.`],
        es: [`${b}^${e} significa ${Array(e).fill(b).join(" × ")}.`, `= ${v}.`],
      },
      distractors: [
        wrong(
          b * e,
          "exponent-as-multiplication",
          `That is ${b} × ${e}. The exponent says how many times to use ${b} as a factor.`,
          `Eso es ${b} × ${e}. El exponente dice cuántas veces se usa ${b} como factor.`,
        ),
      ].filter((d) => d.value !== String(v)),
    };
  }
  const a = ri(r, 2, 9);
  const b = ri(r, 2, 4);
  const c = ri(r, 2, 5);
  const v = a + b ** 2 * c;
  return {
    params: { a, b, c, mode },
    answerType: "number",
    stem: { en: `Evaluate ${a} + ${b}^2 × ${c}.`, es: `Evalúa ${a} + ${b}^2 × ${c}.` },
    display: `${a} + ${b}<sup>2</sup> × ${c}`,
    answer: String(v),
    steps: {
      en: [
        `Exponent first: ${b}^2 = ${b * b}.`,
        `Then multiply: ${b * b} × ${c} = ${b * b * c}.`,
        `Then add: ${a} + ${b * b * c} = ${v}.`,
      ],
      es: [
        `Primero el exponente: ${b}^2 = ${b * b}.`,
        `Luego multiplica: ${b * b} × ${c} = ${b * b * c}.`,
        `Luego suma: ${a} + ${b * b * c} = ${v}.`,
      ],
    },
    distractors: [
      wrong(
        (a + b * b) * c,
        "order-of-operations-left-to-right",
        "That adds before multiplying. Multiply before you add.",
        "Eso suma antes de multiplicar. Multiplica antes de sumar.",
      ),
    ],
  };
};

// 6-5: evaluate an algebraic expression.
G.evalExpression = (r) => {
  const a = ri(r, 2, 9);
  const b = ri(r, 1, 15);
  const x = ri(r, 2, 9);
  const v = a * x + b;
  return {
    params: { a, b, x },
    answerType: "number",
    stem: {
      en: `A bike share costs $${b} to unlock plus $${a} per hour: ${a}h + ${b}. What is the cost for h = ${x} hours?`,
      es: `Una bicicleta compartida cuesta $${b} por desbloquearla más $${a} por hora: ${a}h + ${b}. ¿Cuál es el costo para h = ${x} horas?`,
    },
    unit: { en: "dollars", es: "dólares" },
    answer: String(v),
    steps: {
      en: [`Substitute ${x} for h: ${a}(${x}) + ${b}.`, `${a * x} + ${b} = ${v}.`],
      es: [`Sustituye h por ${x}: ${a}(${x}) + ${b}.`, `${a * x} + ${b} = ${v}.`],
    },
    distractors: [
      wrong(
        a + x + b,
        "op-added-instead-of-multiplied",
        `${a}h means ${a} × h, so multiply ${a} × ${x} before adding ${b}.`,
        `${a}h significa ${a} × h, así que multiplica ${a} × ${x} antes de sumar ${b}.`,
      ),
    ],
  };
};

// 6-6, 6-8, 6-14, 6-15: equivalent expressions (answer is an expression in x).
G.expr = (r, mode = "combine") => {
  if (mode === "distribute") {
    const a = ri(r, 2, 6);
    const c = ri(r, 1, 9);
    return {
      params: { a, c, mode, coef: a, cons: a * c },
      answerType: "expr",
      stem: {
        en: `Use the distributive property to write ${a}(x + ${c}) without parentheses.`,
        es: `Usa la propiedad distributiva para escribir ${a}(x + ${c}) sin paréntesis.`,
      },
      answer: `${a}x + ${a * c}`,
      visual: { type: "areaModel", factor: a, terms: ["x", String(c)], products: ["?", "?"] },
      steps: {
        en: [`Multiply ${a} by each term inside: ${a} · x and ${a} · ${c}.`, `${a}x + ${a * c}.`],
        es: [
          `Multiplica ${a} por cada término de adentro: ${a} · x y ${a} · ${c}.`,
          `${a}x + ${a * c}.`,
        ],
      },
      distractors: [
        wrong(
          `${a}x + ${c}`,
          "algebra-distributive-partial",
          `The ${a} must multiply BOTH terms, including the ${c}.`,
          `El ${a} debe multiplicar LOS DOS términos, también el ${c}.`,
        ),
      ],
    };
  }
  const p = ri(r, 2, 7);
  const q = ri(r, 2, 7);
  const k = ri(r, 1, 12);
  const j = ri(r, 1, 6);
  const coef = p + q;
  const cons = k + j;
  return {
    params: { p, q, k, j, mode, coef, cons },
    answerType: "expr",
    stem: {
      en: `Write an expression equivalent to ${p}x + ${k} + ${q}x + ${j} with as few terms as possible.`,
      es: `Escribe una expresión equivalente a ${p}x + ${k} + ${q}x + ${j} con la menor cantidad de términos posible.`,
    },
    answer: `${coef}x + ${cons}`,
    visual: {
      type: "tape",
      rows: [
        {
          label: { en: "Like terms", es: "Términos semejantes" },
          parts: [
            { v: p, l: `${p}x` },
            { v: q, l: `${q}x` },
            { v: Math.max(2, k / 2), l: String(k) },
            { v: Math.max(2, j / 2), l: String(j) },
          ],
          total: "?",
        },
      ],
    },
    steps: {
      en: [
        `Group the x terms: ${p}x + ${q}x = ${coef}x.`,
        `Group the numbers: ${k} + ${j} = ${cons}.`,
        `${coef}x + ${cons}. Check with x = 2: both give ${coef * 2 + cons}.`,
      ],
      es: [
        `Agrupa los términos con x: ${p}x + ${q}x = ${coef}x.`,
        `Agrupa los números: ${k} + ${j} = ${cons}.`,
        `${coef}x + ${cons}. Comprueba con x = 2: las dos dan ${coef * 2 + cons}.`,
      ],
    },
    distractors: [
      wrong(
        `${coef + cons}x`,
        "op-added-instead-of-multiplied",
        "Only like terms combine. A number term cannot join an x term.",
        "Solo se combinan términos semejantes. Un número no se une con un término con x.",
      ),
      wrong(
        `${p * q}x + ${cons}`,
        "op-multiplied-instead-of-added",
        "Combining like terms adds the coefficients; it does not multiply them.",
        "Combinar términos semejantes suma los coeficientes; no los multiplica.",
      ),
    ],
  };
};

const PRIMES = [2, 3, 5, 7];
// 6-7: greatest common factor.
G.gcf = (r) => {
  const g = pick(r, [2, 3, 4, 5, 6, 8]);
  let m1 = ri(r, 2, 7);
  let m2 = ri(r, 2, 7);
  while (gcd(m1, m2) !== 1 || m1 === m2) m2 = ri(r, 2, 9);
  if (m1 > m2) [m1, m2] = [m2, m1];
  const a = g * m1;
  const b = g * m2;
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `You have ${a} granola bars and ${b} juice boxes. You want identical snack packs with nothing left over. What is the greatest number of packs you can make?`,
      es: `Tienes ${a} barras de granola y ${b} jugos. Quieres armar paquetes iguales sin que sobre nada. ¿Cuál es la mayor cantidad de paquetes que puedes armar?`,
    },
    answer: String(g),
    steps: {
      en: [
        `Factors of ${a} and ${b} in common include ${g}.`,
        `The greatest common factor is ${g}: ${a} = ${g} × ${m1}, ${b} = ${g} × ${m2}.`,
      ],
      es: [
        `Entre los factores comunes de ${a} y ${b} está el ${g}.`,
        `El máximo común divisor es ${g}: ${a} = ${g} × ${m1}, ${b} = ${g} × ${m2}.`,
      ],
    },
    distractors: [
      wrong(
        lcmOf(a, b),
        "factors-multiples-confused",
        "That is a common multiple. Packs need a common factor.",
        "Ese es un múltiplo común. Los paquetes necesitan un factor común.",
      ),
    ],
  };
};

// 6-12: least common multiple.
G.lcm = (r) => {
  const a = ri(r, 3, 9);
  let b = ri(r, 4, 12);
  while (b === a || b % a === 0 || a % b === 0) b = ri(r, 4, 12);
  const l = lcmOf(a, b);
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `The #13 bus comes every ${a} minutes and the #22 bus every ${b} minutes. Both just left the stop. In how many minutes do they next leave together?`,
      es: `El autobús 13 pasa cada ${a} minutos y el 22 cada ${b} minutos. Los dos acaban de salir de la parada. ¿En cuántos minutos vuelven a salir juntos?`,
    },
    unit: { en: "minutes", es: "minutos" },
    answer: String(l),
    visual: {
      type: "dnl",
      top: { label: { en: `#13 every ${a} min`, es: `13: cada ${a} min` }, values: [0, a, "…"] },
      bottom: { label: { en: `#22 every ${b} min`, es: `22: cada ${b} min` }, values: [0, b, "…"] },
    },
    steps: {
      en: [
        `Multiples of ${a}: ${[1, 2, 3, 4].map((i) => a * i).join(", ")}, …`,
        `Multiples of ${b}: ${[1, 2, 3].map((i) => b * i).join(", ")}, …`,
        `The first one in both lists is ${l}.`,
      ],
      es: [
        `Múltiplos de ${a}: ${[1, 2, 3, 4].map((i) => a * i).join(", ")}, …`,
        `Múltiplos de ${b}: ${[1, 2, 3].map((i) => b * i).join(", ")}, …`,
        `El primero que está en las dos listas es ${l}.`,
      ],
    },
    distractors: [
      wrong(
        gcd(a, b),
        "factors-multiples-confused",
        "That is a common factor. The buses meet at a common multiple.",
        "Ese es un factor común. Los autobuses coinciden en un múltiplo común.",
      ),
    ].filter((d) => d.value !== String(l)),
  };
};

// 6-13: prime factorization (answer written with × between primes, smallest first).
G.primeFactor = (r) => {
  const fs = Array.from({ length: ri(r, 3, 4) }, () => pick(r, PRIMES)).sort((a, b) => a - b);
  const n = fs.reduce((a, b) => a * b, 1);
  return {
    params: { n },
    answerType: "text",
    stem: {
      en: `Write the prime factorization of ${n}. Use × between factors, smallest first (example: 2 × 2 × 3).`,
      es: `Escribe la factorización prima de ${n}. Usa × entre los factores, del menor al mayor (ejemplo: 2 × 2 × 3).`,
    },
    answer: fs.join(" × "),
    steps: {
      en: [
        `Divide by the smallest prime that works, again and again.`,
        `${n} = ${fs.join(" × ")}.`,
      ],
      es: [
        `Divide entre el primo más pequeño que sirva, una y otra vez.`,
        `${n} = ${fs.join(" × ")}.`,
      ],
    },
    distractors: [
      wrong(
        `${fs[0]} × ${n / fs[0]}`,
        "factorization-stopped-early",
        `${n / fs[0]} is not prime. Keep factoring.`,
        `${n / fs[0]} no es primo. Sigue factorizando.`,
      ),
    ],
  };
};

// 7-1, 7-2 (mode "opposite"), 7-3 (mode "abs").
G.signedValue = (r, mode = "opposite") => {
  const v = ri(r, 2, 40) * pick(r, [1, -1]);
  if (mode === "abs") {
    return {
      params: { v, mode },
      answerType: "number",
      stem: {
        en: `The temperature is ${v} °F. How far is that from 0 °F? (absolute value |${v}|)`,
        es: `La temperatura es ${v} °F. ¿A qué distancia está de 0 °F? (valor absoluto |${v}|)`,
      },
      answer: String(Math.abs(v)),
      visual: {
        type: "numberLine",
        min: -Math.abs(v) - 5,
        max: Math.abs(v) + 5,
        step: 5,
        marks: [{ v, l: String(v) }],
        center: 0,
      },
      steps: {
        en: [
          `Absolute value is distance from 0, and distance is never negative.`,
          `|${v}| = ${Math.abs(v)}.`,
        ],
        es: [
          `El valor absoluto es la distancia al 0, y una distancia nunca es negativa.`,
          `|${v}| = ${Math.abs(v)}.`,
        ],
      },
      distractors: [
        wrong(
          -Math.abs(v),
          "sign-dropped",
          "A distance cannot be negative.",
          "Una distancia no puede ser negativa.",
        ),
      ],
    };
  }
  return {
    params: { v, mode },
    answerType: "number",
    stem: {
      en: `An elevator is at floor ${v} relative to street level. What number is the opposite of ${v}?`,
      es: `Un ascensor está en el piso ${v} con respecto al nivel de la calle. ¿Qué número es el opuesto de ${v}?`,
    },
    answer: String(-v),
    visual: {
      type: "numberLine",
      min: -Math.abs(v) - 5,
      max: Math.abs(v) + 5,
      step: 5,
      marks: [{ v, l: String(v) }],
      center: 0,
    },
    steps: {
      en: [
        `Opposites are the same distance from 0 on opposite sides.`,
        `The opposite of ${v} is ${-v}.`,
      ],
      es: [
        `Los opuestos están a la misma distancia del 0, en lados contrarios.`,
        `El opuesto de ${v} es ${-v}.`,
      ],
    },
    distractors: [
      wrong(
        v,
        "sign-dropped",
        "That is the same number. Its opposite is on the other side of 0.",
        "Ese es el mismo número. Su opuesto está del otro lado del 0.",
      ),
    ],
  };
};

// 7-4: compare two negative rational numbers; answer is the greater one.
G.compareRational = (r) => {
  const a = -ri(r, 2, 15);
  let b = -ri(r, 2, 15);
  while (b === a) b = -ri(r, 2, 15);
  const g = Math.max(a, b);
  return {
    params: { a, b },
    answerType: "number",
    stem: {
      en: `Which temperature is warmer: ${a} °C or ${b} °C? Type the warmer one.`,
      es: `¿Qué temperatura es más cálida: ${a} °C o ${b} °C? Escribe la más cálida.`,
    },
    answer: String(g),
    visual: {
      type: "numberLine",
      min: -16,
      max: 2,
      step: 2,
      marks: [
        { v: a, l: String(a) },
        { v: b, l: String(b) },
      ],
      center: 0,
    },
    steps: {
      en: [
        `On a number line, warmer (greater) is farther right.`,
        `${g} is to the right of ${Math.min(a, b)}, so ${g} °C is warmer.`,
      ],
      es: [
        `En una recta numérica, lo más cálido (mayor) está más a la derecha.`,
        `${g} está a la derecha de ${Math.min(a, b)}, así que ${g} °C es más cálida.`,
      ],
    },
    distractors: [
      wrong(
        Math.min(a, b),
        "compare-negative-magnitude",
        `${Math.min(a, b)} has the bigger digits but is farther below 0, so it is colder.`,
        `${Math.min(a, b)} tiene dígitos más grandes pero está más abajo del 0, así que es más fría.`,
      ),
    ],
  };
};

// 7-5, 7-8 (mode "plot"), 7-9 (mode "reflect"): ordered pairs.
G.point = (r, mode = "plot") => {
  const x = ri(r, 1, 7) * pick(r, [1, -1]);
  const y = ri(r, 1, 7) * pick(r, [1, -1]);
  if (mode === "reflect") {
    const axis = pick(r, ["x", "y"]);
    const rx = axis === "y" ? -x : x;
    const ry = axis === "x" ? -y : y;
    return {
      params: { x, y, axis, mode },
      answerType: "pair",
      stem: {
        en: `Point A is at (${x}, ${y}). Reflect it across the ${axis}-axis. What are the new coordinates?`,
        es: `El punto A está en (${x}, ${y}). Refléjalo sobre el eje ${axis}. ¿Cuáles son las nuevas coordenadas?`,
      },
      answer: `(${rx}, ${ry})`,
      visual: { type: "coord", xmin: -8, xmax: 8, ymin: -8, ymax: 8, points: [{ x, y, l: "A" }] },
      steps: {
        en: [
          axis === "x"
            ? "Across the x-axis, x stays the same and y changes sign."
            : "Across the y-axis, y stays the same and x changes sign.",
          `(${x}, ${y}) → (${rx}, ${ry}).`,
        ],
        es: [
          axis === "x"
            ? "Sobre el eje x, la x se queda igual y la y cambia de signo."
            : "Sobre el eje y, la y se queda igual y la x cambia de signo.",
          `(${x}, ${y}) → (${rx}, ${ry}).`,
        ],
      },
      distractors: [
        wrong(
          `(${axis === "x" ? -x : x}, ${axis === "x" ? y : -y})`,
          "coord-xy-swapped",
          "That reflects across the other axis.",
          "Eso refleja sobre el otro eje.",
        ),
      ],
    };
  }
  return {
    params: { x, y, mode },
    answerType: "pair",
    stem: {
      en: `Start at the origin. Move ${Math.abs(x)} ${x > 0 ? "right" : "left"} and ${Math.abs(y)} ${y > 0 ? "up" : "down"}. Write the ordered pair.`,
      es: `Empieza en el origen. Muévete ${Math.abs(x)} hacia la ${x > 0 ? "derecha" : "izquierda"} y ${Math.abs(y)} hacia ${y > 0 ? "arriba" : "abajo"}. Escribe el par ordenado.`,
    },
    answer: `(${x}, ${y})`,
    visual: { type: "coord", xmin: -8, xmax: 8, ymin: -8, ymax: 8, points: [] },
    steps: {
      en: [`Left/right is x; up/down is y. x comes first.`, `(${x}, ${y}).`],
      es: [`Izquierda/derecha es x; arriba/abajo es y. La x va primero.`, `(${x}, ${y}).`],
    },
    distractors: [
      wrong(
        `(${y}, ${x})`,
        "coord-xy-swapped",
        "The order is (x, y): across first, then up or down.",
        "El orden es (x, y): primero horizontal, luego arriba o abajo.",
      ),
    ].filter((d) => d.value !== `(${x}, ${y})`),
  };
};

// 7-6, 7-7: distance between points that share a coordinate.
G.coordDistance = (r) => {
  const x = ri(r, 1, 6) * pick(r, [1, -1]);
  const y1 = ri(r, 1, 7);
  const y2 = -ri(r, 1, 7);
  const d = y1 - y2;
  return {
    params: { x, y1, y2 },
    answerType: "number",
    stem: {
      en: `On a map grid, the library is at (${x}, ${y1}) and the rec center is at (${x}, ${y2}). How many units apart are they?`,
      es: `En la cuadrícula de un mapa, la biblioteca está en (${x}, ${y1}) y el centro recreativo en (${x}, ${y2}). ¿A cuántas unidades de distancia están?`,
    },
    unit: { en: "units", es: "unidades" },
    answer: String(d),
    visual: {
      type: "coord",
      xmin: -8,
      xmax: 8,
      ymin: -8,
      ymax: 8,
      points: [
        { x, y: y1, l: "L" },
        { x, y: y2, l: "R" },
      ],
      segment: true,
    },
    steps: {
      en: [
        `The points are on opposite sides of the x-axis.`,
        `Add the distances to the axis: |${y1}| + |${y2}| = ${y1} + ${-y2} = ${d}.`,
      ],
      es: [
        `Los puntos están en lados opuestos del eje x.`,
        `Suma las distancias al eje: |${y1}| + |${y2}| = ${y1} + ${-y2} = ${d}.`,
      ],
    },
    distractors: [
      wrong(
        Math.abs(y1 + y2),
        "sign-dropped",
        "Points on opposite sides of an axis: add their distances to the axis.",
        "Puntos en lados opuestos de un eje: suma sus distancias al eje.",
      ),
    ].filter((dd) => dd.value !== String(d)),
  };
};

// 8-1 (mode "check"), 8-2 (mode "add"), 8-3, 8-7 (mode "mult"): one-step equations.
G.oneStep = (r, mode = "add") => {
  const x = ri(r, 3, 25);
  if (mode === "mult") {
    const a = ri(r, 2, 9);
    return {
      params: { a, x, mode },
      answerType: "number",
      stem: {
        en: `Solve ${a}x = ${a * x}. (${a} equal tickets cost $${a * x}.)`,
        es: `Resuelve ${a}x = ${a * x}. (${a} boletos iguales cuestan $${a * x}.)`,
      },
      answer: String(x),
      visual: { type: "balance", left: `${a}x`, right: String(a * x) },
      steps: {
        en: [
          `Divide both sides by ${a}.`,
          `x = ${a * x} ÷ ${a} = ${x}. Check: ${a} × ${x} = ${a * x}.`,
        ],
        es: [
          `Divide los dos lados entre ${a}.`,
          `x = ${a * x} ÷ ${a} = ${x}. Comprueba: ${a} × ${x} = ${a * x}.`,
        ],
      },
      distractors: [
        wrong(
          a * x - a,
          "equation-not-inverse-operation",
          `Undo multiplying by ${a} with division, not subtraction.`,
          `Deshaz la multiplicación por ${a} con una división, no con una resta.`,
        ),
        wrong(
          a * x * a,
          "equation-not-inverse-operation",
          "Multiplying again does not undo it. Divide.",
          "Multiplicar otra vez no lo deshace. Divide.",
        ),
      ],
    };
  }
  const a = ri(r, 4, 30);
  if (mode === "check") {
    const cand = [x, x + 2, x - 1, x + a].sort((p, q) => p - q);
    return {
      params: { a, x, mode },
      answerType: "number",
      stem: {
        en: `Which value of x makes x + ${a} = ${x + a} true? Choose from ${cand.join(", ")}.`,
        es: `¿Qué valor de x hace verdadera x + ${a} = ${x + a}? Elige entre ${cand.join(", ")}.`,
      },
      answer: String(x),
      visual: { type: "balance", left: `x + ${a}`, right: String(x + a) },
      steps: {
        en: [`Substitute each value and check.`, `${x} + ${a} = ${x + a}, so x = ${x}.`],
        es: [`Sustituye cada valor y comprueba.`, `${x} + ${a} = ${x + a}, así que x = ${x}.`],
      },
      distractors: [
        wrong(
          x + a,
          "equation-answered-with-given-number",
          `${x + a} is the right side, not the value of x.`,
          `${x + a} es el lado derecho, no el valor de x.`,
        ),
      ],
    };
  }
  return {
    params: { a, x, mode },
    answerType: "number",
    stem: {
      en: `Solve x + ${a} = ${x + a}. (You had some dollars, earned $${a}, and now have $${x + a}.)`,
      es: `Resuelve x + ${a} = ${x + a}. (Tenías algunos dólares, ganaste $${a} y ahora tienes $${x + a}.)`,
    },
    answer: String(x),
    visual: { type: "balance", left: `x + ${a}`, right: String(x + a) },
    steps: {
      en: [`Subtract ${a} from both sides.`, `x = ${x + a} − ${a} = ${x}.`],
      es: [`Resta ${a} en los dos lados.`, `x = ${x + a} − ${a} = ${x}.`],
    },
    distractors: [
      wrong(
        x + 2 * a,
        "equation-not-inverse-operation",
        `Undo adding ${a} by subtracting ${a}.`,
        `Deshaz la suma de ${a} restando ${a}.`,
      ),
    ],
  };
};

// 8-4, 8-6 (mode "write"), 8-5 (mode "test"): inequalities. Multiple choice.
G.inequality = (r, mode = "write") => {
  const n = ri(r, 4, 18);
  if (mode === "test") {
    const cand = [n - 2, n, n + 3];
    const v = n + 3;
    return {
      params: { n, mode },
      kind: "mc",
      answerType: "number",
      stem: {
        en: `Which value is a solution of x > ${n}? Choose ${cand.join(", ")}.`,
        es: `¿Qué valor es una solución de x > ${n}? Elige ${cand.join(", ")}.`,
      },
      answer: String(v),
      choices: [String(n - 2), String(n), String(n + 3)],
      steps: {
        en: [`x > ${n} means greater than ${n}, not equal to it.`, `${n + 3} > ${n} is true.`],
        es: [`x > ${n} significa mayor que ${n}, no igual.`, `${n + 3} > ${n} es verdadero.`],
      },
      distractors: [
        wrong(
          n,
          "inequality-boundary-inclusion",
          `${n} > ${n} is false. The open circle means ${n} is not included.`,
          `${n} > ${n} es falso. El círculo abierto significa que ${n} no está incluido.`,
        ),
        wrong(
          n - 2,
          "inequality-direction-flipped",
          `${n - 2} is less than ${n}.`,
          `${n - 2} es menor que ${n}.`,
        ),
      ],
    };
  }
  const ctx = pick(r, [
    {
      en: `You must be at least ${n} years old to ride.`,
      es: `Debes tener por lo menos ${n} años para subir.`,
      op: "≥",
    },
    {
      en: `The elevator holds fewer than ${n} people.`,
      es: `El ascensor lleva menos de ${n} personas.`,
      op: "<",
    },
    {
      en: `A team needs more than ${n} points to win.`,
      es: `Un equipo necesita más de ${n} puntos para ganar.`,
      op: ">",
    },
    { en: `You can spend at most $${n}.`, es: `Puedes gastar como máximo $${n}.`, op: "≤" },
  ]);
  const ops = ["<", ">", "≤", "≥"];
  const ans = `x ${ctx.op} ${n}`;
  const flip = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[ctx.op];
  const strict = { "<": "≤", ">": "≥", "≤": "<", "≥": ">" }[ctx.op];
  return {
    params: { n, op: ctx.op, mode },
    kind: "mc",
    answerType: "text",
    stem: {
      en: `${ctx.en} Which inequality shows this?`,
      es: `${ctx.es} ¿Qué desigualdad lo muestra?`,
    },
    answer: ans,
    choices: ops.map((o) => `x ${o} ${n}`),
    visual: {
      type: "numberLine",
      min: n - 5,
      max: n + 5,
      step: 1,
      ray: {
        from: n,
        dir: ctx.op === "<" || ctx.op === "≤" ? -1 : 1,
        closed: ctx.op === "≤" || ctx.op === "≥",
      },
      hideRay: true,
    },
    steps: {
      en: [
        `Find the boundary: ${n}.`,
        `Decide the direction and whether ${n} is included: ${ans}.`,
      ],
      es: [`Encuentra el límite: ${n}.`, `Decide la dirección y si ${n} está incluido: ${ans}.`],
    },
    distractors: [
      wrong(
        `x ${flip} ${n}`,
        "inequality-direction-flipped",
        "The inequality points the wrong way.",
        "La desigualdad apunta al revés.",
      ),
      wrong(
        `x ${strict} ${n}`,
        "inequality-boundary-inclusion",
        `Check the words: is ${n} itself allowed?`,
        `Revisa las palabras: ¿se permite el ${n}?`,
      ),
    ],
  };
};

// 9-1, 9-2, 9-4 (mode "table"), 9-3 (mode "equation"): two-variable relationships y = kx.
G.twoVar = (r, mode = "table") => {
  const k = ri(r, 2, 9);
  const xs = [1, 2, 3, ri(r, 5, 12)];
  if (mode === "equation") {
    return {
      params: { k, mode },
      answerType: "number",
      stem: {
        en: `A phone plan charges $${k} for each gigabyte. Write the equation c = ?·g. What number goes in front of g?`,
        es: `Un plan de teléfono cobra $${k} por cada gigabyte. Escribe la ecuación c = ?·g. ¿Qué número va delante de g?`,
      },
      answer: String(k),
      visual: {
        type: "table",
        headers: [
          { en: "g (GB)", es: "g (GB)" },
          { en: "c ($)", es: "c ($)" },
        ],
        rows: [
          [1, k],
          [2, 2 * k],
          [3, 3 * k],
        ],
      },
      steps: {
        en: [`Each row: c ÷ g = ${k}.`, `So c = ${k}g.`],
        es: [`En cada fila: c ÷ g = ${k}.`, `Entonces c = ${k}g.`],
      },
      distractors: [
        wrong(
          k + 1,
          "rate-not-per-one",
          `Find the cost for exactly 1 GB: $${k}.`,
          `Halla el costo de exactamente 1 GB: $${k}.`,
        ),
      ],
    };
  }
  const x = xs[3];
  return {
    params: { k, x, mode },
    answerType: "number",
    stem: {
      en: `A car wash fundraiser earns $${k} per car. How much is earned for ${x} cars? (y = ${k}x)`,
      es: `Una recaudación con lavado de autos gana $${k} por auto. ¿Cuánto se gana con ${x} autos? (y = ${k}x)`,
    },
    unit: { en: "dollars", es: "dólares" },
    answer: String(k * x),
    visual: {
      type: "table",
      headers: [
        { en: "Cars (x)", es: "Autos (x)" },
        { en: "Dollars (y)", es: "Dólares (y)" },
      ],
      rows: [
        [1, k],
        [2, 2 * k],
        [3, 3 * k],
        [x, "?"],
      ],
    },
    steps: {
      en: [`The dependent variable y depends on x: y = ${k}x.`, `y = ${k} × ${x} = ${k * x}.`],
      es: [`La variable dependiente y depende de x: y = ${k}x.`, `y = ${k} × ${x} = ${k * x}.`],
    },
    distractors: [
      wrong(
        k + x,
        "op-added-instead-of-multiplied",
        `Each car adds $${k}, so multiply ${k} × ${x}.`,
        `Cada auto suma $${k}, así que multiplica ${k} × ${x}.`,
      ),
    ],
  };
};

export const GENERATORS = G;

export function generate(spec, seed) {
  const [name, mode] = String(spec).split(":");
  const fn = G[name];
  if (!fn) throw new Error(`pfa: unknown generator ${name}`);
  const p = fn(rng(seed), mode);
  p.gen = name;
  p.mode = mode || null;
  p.seed = seed;
  p.kind ||= "entry";
  p.distractors = cleanChoices(p.answer, p.distractors || []);
  return p;
}

// ---- answer checking (shared by server key and browser) ----------------------------------

export function parseNumber(s) {
  if (s == null) return null;
  let t = String(s)
    .trim()
    .replace(/[$,%\s]+$/g, "")
    .replace(/^\$/, "")
    .replace(/,/g, "")
    .replace(/−/g, "-");
  t = t.replace(/\s+/g, " ").trim();
  if (t === "") return null;
  let m = t.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
  m = t.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  if (/^-?\d*\.?\d+$/.test(t)) return Number(t);
  return null;
}

// Linear-expression evaluator: numbers, one letter variable, + − × · * ( ), implicit products.
export function evalExpr(src, xv) {
  const s = String(src).replace(/[×·]/g, "*").replace(/−/g, "-").replace(/\s+/g, "").toLowerCase();
  let i = 0;
  const peek = () => s[i];
  function factor() {
    let c = peek();
    if (c === "-") {
      i++;
      return -factor();
    }
    if (c === "+") {
      i++;
      return factor();
    }
    let v;
    if (c === "(") {
      i++;
      v = sum();
      if (peek() !== ")") throw new Error("paren");
      i++;
    } else if (/[0-9.]/.test(c || "")) {
      let j = i;
      while (/[0-9.]/.test(s[j] || "")) j++;
      v = Number(s.slice(i, j));
      i = j;
    } else if (/[a-z]/.test(c || "")) {
      i++;
      v = xv;
    } else throw new Error("token");
    c = peek();
    while (c && (c === "(" || /[a-z]/.test(c))) {
      v *= factor();
      c = peek();
    }
    return v;
  }
  function term() {
    let v = factor();
    while (peek() === "*" || peek() === "/") {
      const op = s[i++];
      const f = factor();
      v = op === "*" ? v * f : v / f;
    }
    return v;
  }
  function sum() {
    let v = term();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const t = term();
      v = op === "+" ? v + t : v - t;
    }
    return v;
  }
  const out = sum();
  if (i !== s.length) throw new Error("trailing");
  return out;
}

export function sameExpr(a, b) {
  try {
    return [2, 3, 7, -1.5].every((x) => Math.abs(evalExpr(a, x) - evalExpr(b, x)) < 1e-9);
  } catch {
    return false;
  }
}

function parsePair(s) {
  const m = String(s)
    .replace(/−/g, "-")
    .match(/^\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?\s*$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

const normText = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[×*·x]/g, "×")
    .replace(/\s+/g, "")
    .replace(/−/g, "-");

// Does `input` match `answer` for this answerType? Equivalent forms count (1/2 = 0.5, 2x+6 = 6+2x).
export function matches(answerType, answer, input) {
  if (input == null || String(input).trim() === "") return false;
  if (answerType === "number") {
    const a = parseNumber(answer);
    const b = parseNumber(input);
    return a != null && b != null && Math.abs(a - b) < 1e-9;
  }
  if (answerType === "expr") return sameExpr(answer, input);
  if (answerType === "pair") {
    const a = parsePair(answer);
    const b = parsePair(input);
    return !!a && !!b && a[0] === b[0] && a[1] === b[1];
  }
  return normText(answer) === normText(input);
}
