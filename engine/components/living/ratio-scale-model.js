// living/ratio-scale-model.js — the numbers and words of the ratio-scale play,
// with no DOM. Validation, the ratio-table rows, the additive misconception's
// rows, unit rates, the prediction choice sets, the stage geometry and every
// bilingual line the play speaks are computed here from a validated config, so
// `ratio-scale.test.mjs` can prove them without a browser.

export const W = 720;
export const H = 400;
export const MAXB = 5; // batches on stage

export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{ a: number, b: number, k: number, labelA: Pair, labelB: Pair }} RatioCore
 * @typedef {RatioCore & { transfer: RatioCore }} RatioConfig
 * @typedef {{ n: number, A: number, B: number }} Row
 * @typedef {{ A: number, B: number, correct: boolean, kind: string }} Choice
 */

/**
 * A label is a short string or {en, es}; missing → fallback, malformed → null.
 * @param {unknown} v
 * @param {Pair | null} fallback
 * @returns {Pair | null}
 */
function cleanLabel(v, fallback) {
  if (v == null) return fallback;
  const pair = typeof v === "string" ? { en: v, es: v } : v;
  if (typeof pair !== "object") return null;
  const p = /** @type {{ en?: unknown, es?: unknown }} */ (pair);
  const en = typeof p.en === "string" ? p.en.trim() : "";
  const es = typeof p.es === "string" && p.es.trim() ? p.es.trim() : en;
  return en && en.length <= 16 && es.length <= 16 ? { en, es } : null;
}

/**
 * @param {any} cfg
 * @returns {RatioConfig | null}
 */
export function validateRatioScale(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const a = Number(cfg.a);
  const b = Number(cfg.b);
  const k = Number(cfg.k ?? 3);
  // a === b would make "add the same to both" accidentally right.
  if (!okInt(a, 1, 6) || !okInt(b, 1, 6) || a === b || !okInt(k, 2, MAXB)) return null;
  const labelA = cleanLabel(cfg.labelA, { en: "red paint", es: "pintura roja" });
  const labelB = cleanLabel(cfg.labelB, { en: "blue paint", es: "pintura azul" });
  if (!labelA || !labelB) return null;
  const t = cfg.transfer ?? { a: 1, b: a + b, k: k === 3 ? 4 : 3 };
  const transfer = {
    a: Number(t.a),
    b: Number(t.b),
    k: Number(t.k),
    labelA: cleanLabel(t.labelA, labelA),
    labelB: cleanLabel(t.labelB, labelB),
  };
  if (!okInt(transfer.a, 1, 12) || !okInt(transfer.b, 1, 12) || transfer.a === transfer.b)
    return null;
  if (!okInt(transfer.k, 2, 10) || !transfer.labelA || !transfer.labelB) return null;
  if (transfer.a === a && transfer.b === b && transfer.k === k) return null;
  return { a, b, k, labelA, labelB, transfer };
}

/**
 * Rows of the ratio table: n batches is n·a : n·b.
 * @returns {Row[]}
 */
export const equivalentRows = (a, b, n) =>
  Array.from({ length: n }, (_, i) => ({ n: i + 1, A: a * (i + 1), B: b * (i + 1) }));

/** The additive misconception's "table": add `step` to BOTH each time. */
export const additiveRows = (a, b, step, n) =>
  Array.from({ length: n }, (_, j) => ({ A: a + step * j, B: b + step * j }));

export const isEquivalent = (p, q) => p.A * q.B === p.B * q.A;

const gcd = (x, y) => (y ? gcd(y, x % y) : x);

/** How much of the second quantity goes with ONE of the first: b / a. */
export function unitRate(a, b) {
  const g = gcd(a, b);
  const num = b / g;
  const den = a / g;
  let d = den;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  const text =
    den === 1 ? String(num) : d === 1 ? String(Number((num / den).toFixed(3))) : `${num}/${den}`;
  return { num, den, value: b / a, text };
}

/**
 * The k-batch prediction: the correct pair plus three misconception pairs, de-duplicated.
 * @returns {Choice[]}
 */
export function scaleChoices(a, b, k) {
  const A = k * a;
  const raw = [
    { A, B: k * b, correct: true, kind: "scale" },
    { A, B: b + (A - a), correct: false, kind: "additive" },
    { A, B: b + k, correct: false, kind: "addFactor" },
    { A, B: b, correct: false, kind: "oneScaled" },
  ];
  const seen = new Set();
  return raw.filter((o) => o.B > 0 && !seen.has(o.B) && seen.add(o.B));
}

/**
 * Stable position for the correct choice — never always first.
 * @template {{ correct?: boolean }} T
 * @param {T[]} options
 * @param {number} seed
 * @returns {T[]}
 */
export function placeCorrect(options, seed) {
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(seed % options.length, 0, correct);
  return rest;
}

/** Stage geometry for each view, sized from the ratio's own parts. */
export function ratioGeometry(a, b) {
  const big = Math.max(a, b);
  const cardW = (W - 40 - (MAXB - 1) * 12) / MAXB;
  const T = Math.min(26, Math.floor((cardW - 16) / big));
  const X0 = 150; // left edge of tapes and number lines (labels sit left of it)
  const G = { x0: 362, y0: 340, w: 320, h: 300 };
  const xMax = a * MAXB;
  const yMax = Math.max(b * MAXB, additiveRows(a, b, a, MAXB)[MAXB - 1].B);
  return {
    cardW,
    T,
    cardH: 2 * T + 30,
    X0,
    TT: Math.min(26, Math.floor((W - X0 - 20 - (MAXB - 1) * 6) / (MAXB * big))),
    S: (W - X0 - 40) / MAXB, // one batch = one jump on the number lines
    DY: { A: 110, B: 210 },
    COL: { n: 55, A: 142, B: 247 },
    rowY: (i) => 82 + i * 34, // ratio-table row i (batch i + 1)
    G,
    xMax,
    yMax,
    gx: (val) => G.x0 + (val / xMax) * G.w,
    gy: (val) => G.y0 - (val / yMax) * G.h,
    tickStep: (max) => [1, 2, 5, 10].find((s) => max / s <= 8),
  };
}

const list = (rows) => rows.map((r) => `${r.A} : ${r.B}`).join(", ");

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {RatioConfig} v
 */
export function ratioCopy(v) {
  const { a, b, k, labelA: A, labelB: B, transfer: t } = v;
  const rate = unitRate(a, b);
  const rows = equivalentRows(a, b, MAXB);
  const addRows = additiveRows(a, b, a, MAXB);
  const wrong = addRows[1]; // a + a : b + a — same first number as two batches
  return {
    rate,
    rows,
    addRows,
    wrong,
    title: {
      en: `Same mix, more batches: ${a} : ${b}`,
      es: `Misma mezcla, más tandas: ${a} : ${b}`,
    },
    ariaLabel: {
      en: `Batches of ${a} ${A.en} tiles and ${b} ${B.en} tiles. The tiles become a tape diagram, a double number line and a ratio table, and the rows become points on one line through zero.`,
      es: `Tandas de ${a} fichas de ${A.es} y ${b} fichas de ${B.es}. Las fichas forman un diagrama de cinta, una recta numérica doble y una tabla de razones, y las filas se vuelven puntos en una recta que pasa por cero.`,
    },
    printSummary: {
      en: `${A.en} : ${B.en} = ${a} : ${b}. Multiplying both numbers by the same scale factor keeps the mix: ${list(rows)}. These points lie on one line through (0, 0); the unit rate is 1 : ${rate.text} (${A.en} : ${B.en}). Adding the same number to both (${wrong.A} : ${wrong.B}) changes the mix.`,
      es: `${A.es} : ${B.es} = ${a} : ${b}. Multiplicar los dos números por el mismo factor de escala conserva la mezcla: ${list(rows)}. Estos puntos están en una recta que pasa por (0, 0); la tasa unitaria es 1 : ${rate.text} (${A.es} : ${B.es}). Sumar el mismo número a los dos (${wrong.A} : ${wrong.B}) cambia la mezcla.`,
    },
    situate: {
      en: `One batch: ${A.en} = ${a} and ${B.en} = ${b}, the ratio ${a} : ${b}. The strip shows the mix — ${a} of every ${a + b} parts are ${A.en}.`,
      es: `Una tanda: ${A.es} = ${a} y ${B.es} = ${b}, la razón ${a} : ${b}. La barra muestra la mezcla: ${a} de cada ${a + b} partes son ${A.es}.`,
    },
    predict: {
      say: {
        en: `You need ${k} batches that come out exactly the same. Predict before you build.`,
        es: `Necesitas ${k} tandas que salgan exactamente iguales. Predice antes de construir.`,
      },
      question: {
        en: `${k} batches (${A.en} : ${B.en}) =`,
        es: `${k} tandas (${A.es} : ${B.es}) =`,
      },
      cues: {
        additive: {
          en: `You added the same amount to both. Compare the two strips: is the ${A.en} share the same?`,
          es: `Sumaste la misma cantidad a las dos. Compara las barras: ¿es igual la parte de ${A.es}?`,
        },
        addFactor: {
          en: `The ${A.en} was multiplied, but ${k} was added to the ${B.en}. Do the strips match?`,
          es: `El número de ${A.es} se multiplicó, pero al de ${B.es} se le sumó ${k}. ¿Coinciden las barras?`,
        },
        oneScaled: {
          en: `Only the ${A.en} grew. Look at the strips: what happened to the ${B.en} share?`,
          es: `Solo creció el número de ${A.es}. Mira las barras: ¿qué pasó con la parte de ${B.es}?`,
        },
      },
      ok: {
        en: `Yes: ${k} batches is ${k} × ${a} = ${k * a} and ${k} × ${b} = ${k * b}. The strips match, so it is the same mix.`,
        es: `Sí: ${k} tandas son ${k} × ${a} = ${k * a} y ${k} × ${b} = ${k * b}. Las barras coinciden: es la misma mezcla.`,
      },
    },
    build: {
      say: {
        stack: {
          en: "Each card is one batch. Change the number of batches with the slider.",
          es: "Cada tarjeta es una tanda. Cambia el número de tandas con el control.",
        },
        tape: {
          en: `The same tiles line up as a tape diagram. Every batch adds ${a} to the top tape and ${b} to the bottom tape.`,
          es: `Las mismas fichas forman un diagrama de cinta. Cada tanda suma ${a} a la cinta de arriba y ${b} a la de abajo.`,
        },
        dnl: {
          en: `The tiles squeeze onto a double number line. One batch is one jump: +${a} on top, +${b} below, so the marks always line up.`,
          es: `Las fichas se aprietan en una recta numérica doble. Una tanda es un salto: +${a} arriba, +${b} abajo, y las marcas siempre coinciden.`,
        },
        table: {
          en: "Each batch drops into a row of the ratio table. The number of batches is the scale factor: both numbers are multiplied by it.",
          es: "Cada tanda cae en una fila de la tabla de razones. El número de tandas es el factor de escala: los dos números se multiplican por él.",
        },
      },
      views: [
        ["stack", { en: "Batches", es: "Tandas" }],
        ["tape", { en: "Tape diagram", es: "Diagrama de cinta" }],
        ["dnl", { en: "Double number line", es: "Recta numérica doble" }],
        ["table", { en: "Ratio table", es: "Tabla de razones" }],
      ],
      /** @param {number} pics @param {number} nums */
      progress: (pics, nums) => ({
        en: `Try every picture and at least 3 different numbers of batches (${pics}/4 pictures, ${nums}/3 numbers).`,
        es: `Prueba cada dibujo y al menos 3 números de tandas distintos (${pics}/4 dibujos, ${nums}/3 números).`,
      }),
      done: {
        en: `Four pictures, one relationship: ${list(rows)} are all equivalent to ${a} : ${b}.`,
        es: `Cuatro dibujos, una relación: ${list(rows)} son equivalentes a ${a} : ${b}.`,
      },
    },
    graph: {
      points: `${rows
        .slice(0, 3)
        .map((r) => `(${r.A}, ${r.B})`)
        .join(", ")}, …`,
      say: {
        en: `Each row (${A.en}, ${B.en}) becomes a point. Every batch moves ${a} right and ${b} up, so the points fall on ONE straight line through (0, 0). Scaled down to 1 of the first quantity, the ratio is 1 : ${rate.text} — that is the unit rate: ${rate.text} for every 1.`,
        es: `Cada fila (${A.es}, ${B.es}) se vuelve un punto. Cada tanda avanza ${a} a la derecha y ${b} hacia arriba, así que los puntos quedan en UNA recta que pasa por (0, 0). Reducida a 1 de la primera cantidad, la razón es 1 : ${rate.text}: esa es la tasa unitaria, ${rate.text} por cada 1.`,
      },
    },
    nonequal: {
      say: {
        en: `A classmate "scales" by adding ${a} to both quantities each time: ${list(addRows.slice(0, 3))}, … The hollow points show that table.`,
        es: `Un compañero "escala" sumando ${a} a las dos cantidades cada vez: ${list(addRows.slice(0, 3))}, … Los puntos huecos muestran esa tabla.`,
      },
      stripLabel: { en: `+${a} to both:`, es: `+${a} a las dos:` },
      question: {
        en: `Is ${wrong.A} : ${wrong.B} the same mix as ${a} : ${b}?`,
        es: `¿${wrong.A} : ${wrong.B} es la misma mezcla que ${a} : ${b}?`,
      },
      options: placeCorrect(
        [
          {
            label: {
              en: `No — (${wrong.A}, ${wrong.B}) is off the line, so the mix changed`,
              es: `No: (${wrong.A}, ${wrong.B}) está fuera de la recta, la mezcla cambió`,
            },
            correct: true,
          },
          {
            label: {
              en: "Yes — the same amount was added to both",
              es: "Sí: se sumó lo mismo a las dos",
            },
            correct: false,
            cue: {
              en: `Find (${wrong.A}, ${wrong.B}) on the graph. Is it on the line with the batches? Then compare the two strips.`,
              es: `Busca (${wrong.A}, ${wrong.B}) en la gráfica. ¿Está en la recta de las tandas? Luego compara las dos barras.`,
            },
          },
          {
            label: { en: "Yes — both numbers got bigger", es: "Sí: los dos números crecieron" },
            correct: false,
            cue: {
              en: `Bigger is not the test. Find the row of the ratio table with ${A.en} = ${wrong.A}. What is the ${B.en} in that row?`,
              es: `Crecer no es la prueba. Busca en la tabla la fila con ${A.es} = ${wrong.A}. ¿Qué número tiene ${B.es} en esa fila?`,
            },
          },
        ],
        a * 2 + b,
      ),
      ok: {
        en: `Right. If ${A.en} = ${wrong.A}, then ${B.en} = ${2 * b} (2 batches), not ${wrong.B}. Adding the same amount changes the mix; multiplying both by the same number keeps it.`,
        es: `Correcto. Si ${A.es} = ${wrong.A}, entonces ${B.es} = ${2 * b} (2 tandas), no ${wrong.B}. Sumar lo mismo cambia la mezcla; multiplicar las dos por el mismo número la conserva.`,
      },
    },
    transfer: {
      say: {
        en: `A new recipe has the ratio ${t.a} : ${t.b} (${t.labelA.en} : ${t.labelB.en}). Keep the same mix when ${t.labelA.en} = ${t.k * t.a}.`,
        es: `Una receta nueva tiene la razón ${t.a} : ${t.b} (${t.labelA.es} : ${t.labelB.es}). Conserva la misma mezcla cuando ${t.labelA.es} = ${t.k * t.a}.`,
      },
      question: {
        en: `If ${t.labelA.en} = ${t.k * t.a}, then ${t.labelB.en} = ?`,
        es: `Si ${t.labelA.es} = ${t.k * t.a}, entonces ${t.labelB.es} = ?`,
      },
      cues: {
        additive: {
          en: `What number was ${t.a} multiplied by? Was ${t.b} changed the same way?`,
          es: `¿Por qué número se multiplicó ${t.a}? ¿Se cambió ${t.b} de la misma forma?`,
        },
        addFactor: {
          en: "Adding the scale factor is not scaling. What must happen to BOTH numbers?",
          es: "Sumar el factor de escala no es escalar. ¿Qué debe pasarles a LOS DOS números?",
        },
        oneScaled: {
          en: `If only the ${t.labelA.en} grows, does the mix stay the same?`,
          es: `Si solo crece el número de ${t.labelA.es}, ¿la mezcla sigue igual?`,
        },
      },
      ok: {
        en: `Yes: the scale factor is ${t.k * t.a} ÷ ${t.a} = ${t.k}, and ${t.b} × ${t.k} = ${t.k * t.b}.`,
        es: `Sí: el factor de escala es ${t.k * t.a} ÷ ${t.a} = ${t.k}, y ${t.b} × ${t.k} = ${t.k * t.b}.`,
      },
      explain: {
        en: `Explain: why is ${wrong.A} : ${wrong.B} NOT equivalent to ${a} : ${b}?`,
        es: `Explica: ¿por qué ${wrong.A} : ${wrong.B} NO es equivalente a ${a} : ${b}?`,
      },
      frame: {
        en: "They are not equivalent because ___. On the graph, ___.",
        es: "No son equivalentes porque ___. En la gráfica, ___.",
      },
    },
  };
}
