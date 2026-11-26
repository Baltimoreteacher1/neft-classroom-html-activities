// living/ratio-graph-model.js — the numbers and words of the ratio-graph play
// (lesson 3-4, Equivalent Ratios Using Graphs), with no DOM. Validation, the
// rows of the ratio table, the ordered pairs, the plotting check, the choice
// sets and every bilingual line the play speaks are computed here from a
// validated config.
//
// The idea: each row of a ratio table is an ordered pair (x, y) — x first, the
// first quantity — and equal ratios plot as points on one straight line that
// passes through the origin (0, 0).

import { cleanText, okInt, placeAway, placeCorrect } from "./ratio-parts-model.js";

export { okInt, placeAway, placeCorrect };

export const W = 424;
export const H = 296;
export const ROWS = 4;
export const ASKED_ROW = 3; // the row the prediction asks about
export const PLOT_ROWS = [1, 2, 4]; // rows the student plots; the asked row is plotted by the prediction

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{ a: number, b: number, labelX: Pair, labelY: Pair, story: Pair }} GraphCore
 * @typedef {GraphCore & { transfer: GraphCore }} GraphConfig
 * @typedef {{ n: number, x: number, y: number }} Row
 */

/**
 * @param {any} t
 * @returns {GraphCore | null}
 */
function core(t) {
  if (!t || typeof t !== "object") return null;
  const a = Number(t.a);
  const b = Number(t.b);
  // a === b would make the swapped pair (y, x) identical to (x, y).
  if (!okInt(a, 1, 6) || !okInt(b, 1, 6) || a === b) return null;
  const labelX = cleanText(t.labelX, 22);
  const labelY = cleanText(t.labelY, 22);
  const story = cleanText(t.story, 160);
  return labelX && labelY && story ? { a, b, labelX, labelY, story } : null;
}

/**
 * @param {any} cfg
 * @returns {GraphConfig | null}
 */
export function validateRatioGraph(cfg) {
  const main = core(cfg);
  const transfer = core(cfg?.transfer);
  if (!main || !transfer) return null;
  if (transfer.a === main.a && transfer.b === main.b) return null;
  return { ...main, transfer };
}

/**
 * Row n of the ratio table is n batches: (n·a, n·b).
 * @param {number} a
 * @param {number} b
 * @returns {Row[]}
 */
export const tableRows = (a, b) =>
  Array.from({ length: ROWS }, (_, i) => ({ n: i + 1, x: a * (i + 1), y: b * (i + 1) }));

/** A tick step that keeps an axis to at most eight labels. */
export const tickStep = (/** @type {number} */ max) =>
  [1, 2, 5, 10].find((s) => max / s <= 8) ?? 10;

/** The point a careless classmate plots for row 3: the right x and a y that is one too small. */
export const offPoint = (/** @type {number} */ a, /** @type {number} */ b) => ({
  x: ASKED_ROW * a,
  y: ASKED_ROW * b - 1,
});

/**
 * Judge a plotted point against a row of the table.
 * @param {Row} row
 * @param {number} x
 * @param {number} y
 * @returns {"ok" | "swapped" | "xWrong" | "yWrong"}
 */
export function checkPlot(row, x, y) {
  if (x === row.x && y === row.y) return "ok";
  if (x === row.y && y === row.x) return "swapped";
  return x === row.x ? "yWrong" : "xWrong";
}

/**
 * "Row n as an ordered pair": the right pair, the pair with the numbers swapped,
 * the pair of the unit row (row 1) and the pair of the row before it.
 * @param {number} a
 * @param {number} b
 * @param {number} n
 */
export function pairChoices(a, b, n) {
  const raw = [
    { x: n * a, y: n * b, correct: true, kind: "right" },
    { x: n * b, y: n * a, correct: false, kind: "swapped" },
    { x: a, y: b, correct: false, kind: "unit" },
    { x: n * a, y: (n - 1) * b, correct: false, kind: "stale" },
  ];
  const seen = new Set();
  return raw.filter((o) => !seen.has(`${o.x},${o.y}`) && seen.add(`${o.x},${o.y}`));
}

const pt = (/** @type {number} */ x, /** @type {number} */ y) => `(${x},\u00a0${y})`;
const pairs = (/** @type {Row[]} */ rows, n = rows.length) =>
  rows
    .slice(0, n)
    .map((r) => pt(r.x, r.y))
    .join(", ");

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {GraphConfig} v
 */
export function ratioGraphCopy(v) {
  const { a, b, labelX: X, labelY: Y, story } = v;
  const t = v.transfer;
  const rows = tableRows(a, b);
  const asked = rows[ASKED_ROW - 1];
  const off = offPoint(a, b);
  const trows = tableRows(t.a, t.b);
  const tAsked = trows[ASKED_ROW - 1];
  return {
    rows,
    asked,
    offPt: off,
    trows,
    tAsked,
    title: { en: "From a ratio table to a graph", es: "De una tabla de razones a una gráfica" },
    ariaLabel: {
      en: `A ratio table with ${ROWS} rows (${X.en} as x, ${Y.en} as y) and a coordinate graph. Each row becomes a point, and the points ${pairs(rows)} lie on one straight line through (0, 0).`,
      es: `Una tabla de razones con ${ROWS} filas (${X.es} como x, ${Y.es} como y) y una gráfica de coordenadas. Cada fila se vuelve un punto, y los puntos ${pairs(rows)} están en una recta que pasa por (0, 0).`,
    },
    printSummary: {
      en: `${story.en} Each row of the ratio table is an ordered pair (x, y), with ${X.en} as x: ${pairs(rows)}. Plot each pair by going right x, then up y. The points make a straight line through the origin (0, 0). A point such as ${pt(off.x, off.y)} is off the line, so it is not in the same ratio.`,
      es: `${story.es} Cada fila de la tabla de razones es un par ordenado (x, y), con ${X.es} como x: ${pairs(rows)}. Marca cada par: ve x a la derecha y luego y hacia arriba. Los puntos forman una recta que pasa por el origen (0, 0). Un punto como ${pt(off.x, off.y)} queda fuera de la recta, así que no está en la misma razón.`,
    },
    situate: {
      en: `${story.en} Each row of the table gives an amount of ${X.en} (x) and the ${Y.en} they need (y).`,
      es: `${story.es} Cada fila de la tabla da una cantidad de ${X.es} (x) y la cantidad de ${Y.es} que necesitan (y).`,
    },
    predict: {
      say: {
        en: `Row ${ASKED_ROW} is ${asked.x} ${X.en} and ${asked.y} ${Y.en}. Predict its ordered pair (x, y) before you plot.`,
        es: `La fila ${ASKED_ROW} es ${asked.x} ${X.es} y ${asked.y} ${Y.es}. Predice su par ordenado (x, y) antes de marcar.`,
      },
      question: {
        en: `Row ${ASKED_ROW} as an ordered pair (x, y) =`,
        es: `La fila ${ASKED_ROW} como par ordenado (x, y) =`,
      },
      cues: {
        swapped: {
          en: `The first number is x. Look at the table headings: which column is x, ${X.en} or ${Y.en}?`,
          es: `El primer número es x. Mira los encabezados de la tabla: ¿qué columna es x, ${X.es} o ${Y.es}?`,
        },
        unit: {
          en: `That is a different row. Look at the highlighted row: how many ${X.en} does it show?`,
          es: `Esa es otra fila. Mira la fila marcada: ¿qué número de ${X.es} muestra?`,
        },
        stale: {
          en: `That y is from the row above. Look at the highlighted row: how many ${Y.en} does it show?`,
          es: `Esa y es de la fila de arriba. Mira la fila marcada: ¿qué número de ${Y.es} muestra?`,
        },
      },
      ok: {
        en: `Yes: x is the ${X.en}, ${asked.x}, and y is the ${Y.en}, ${asked.y}. The pair is ${pt(asked.x, asked.y)}: go right ${asked.x}, then up ${asked.y}.`,
        es: `Sí: x es la cantidad de ${X.es}, ${asked.x}, e y es la cantidad de ${Y.es}, ${asked.y}. El par es ${pt(asked.x, asked.y)}: ve ${asked.x} a la derecha y luego ${asked.y} hacia arriba.`,
      },
    },
    plot: {
      say: (/** @type {Row} */ r) => ({
        en: `Row ${r.n}: ${X.en} = ${r.x}, ${Y.en} = ${r.y}. Set how far right (x) and how far up (y), then plot the point.`,
        es: `Fila ${r.n}: ${X.es} = ${r.x}, ${Y.es} = ${r.y}. Elige cuánto a la derecha (x) y cuánto hacia arriba (y), y marca el punto.`,
      }),
      right: { en: "Right (x)", es: "Derecha (x)" },
      up: { en: "Up (y)", es: "Arriba (y)" },
      button: { en: "Plot the point", es: "Marcar el punto" },
      cues: {
        swapped: {
          en: "Right comes first, and right is x. Look at the highlighted row: which number is x?",
          es: "Primero va la derecha, y la derecha es x. Mira la fila marcada: ¿qué número es x?",
        },
        xWrong: {
          en: `Check how far right. Read the ${X.en} in the highlighted row.`,
          es: `Revisa cuánto a la derecha. Lee la cantidad de ${X.es} en la fila marcada.`,
        },
        yWrong: {
          en: `x is right. Now check how far up: read the ${Y.en} in the highlighted row.`,
          es: `x es correcta. Ahora revisa cuánto hacia arriba: lee la cantidad de ${Y.es} en la fila marcada.`,
        },
      },
      progress: (/** @type {number} */ k) => ({
        en: `Plotted ${k} of ${PLOT_ROWS.length} rows.`,
        es: `Marcaste ${k} de ${PLOT_ROWS.length} filas.`,
      }),
      done: {
        en: `All ${ROWS} rows are on the graph: ${pairs(rows)}.`,
        es: `Las ${ROWS} filas están en la gráfica: ${pairs(rows)}.`,
      },
    },
    line: {
      say: {
        en: `The points ${pairs(rows)} fall on ONE straight line, and it passes through the origin ${pt(0, 0)}. Every step right ${a} goes up ${b}. Equal ratios always graph this way.`,
        es: `Los puntos ${pairs(rows)} están en UNA recta que pasa por el origen ${pt(0, 0)}. Cada ${a} a la derecha sube ${b}. Las razones equivalentes siempre se grafican así.`,
      },
    },
    off: {
      say: {
        en: `A classmate says ${ASKED_ROW * a} ${X.en} need ${off.y} ${Y.en} and plots ${pt(off.x, off.y)}, the hollow point.`,
        es: `Un compañero dice que ${ASKED_ROW * a} ${X.es} necesitan ${off.y} ${Y.es} y marca ${pt(off.x, off.y)}, el punto hueco.`,
      },
      question: {
        en: `Is ${pt(off.x, off.y)} on the line with the recipe's points?`,
        es: `¿${pt(off.x, off.y)} está en la recta de los puntos de la receta?`,
      },
      options: placeAway(
        [
          {
            label: {
              en: "No — it is off the line through (0, 0)",
              es: "No: está fuera de la recta que pasa por (0, 0)",
            },
            correct: true,
            cue: null,
          },
          {
            label: { en: "Yes — it is close to the line", es: "Sí: está cerca de la recta" },
            correct: false,
            cue: {
              en: `Close is not on it. Follow the dashed line up from ${off.x} on the x-axis: does it meet the hollow point, or the line?`,
              es: `Cerca no es estar en ella. Sigue la línea de puntos hacia arriba desde ${off.x} en el eje x: ¿llega al punto hueco o a la recta?`,
            },
          },
          {
            label: {
              en: "Yes — every point on the graph is a ratio",
              es: "Sí: todo punto de la gráfica es una razón",
            },
            correct: false,
            cue: {
              en: `Only points on the line keep the recipe's ratio. Look at the table: how many ${Y.en} do ${off.x} ${X.en} need?`,
              es: `Solo los puntos de la recta conservan la razón de la receta. Mira la tabla: ¿qué cantidad de ${Y.es} necesitan ${off.x} ${X.es}?`,
            },
          },
        ],
        a + b,
      ),
      ok: {
        en: `Right: ${off.x} ${X.en} need ${asked.y} ${Y.en}, so the point on the line is ${pt(asked.x, asked.y)}. ${pt(off.x, off.y)} is off the line, so it is not the same ratio.`,
        es: `Correcto: ${off.x} ${X.es} necesitan ${asked.y} ${Y.es}, así que el punto de la recta es ${pt(asked.x, asked.y)}. ${pt(off.x, off.y)} está fuera de la recta, así que no es la misma razón.`,
      },
    },
    transfer: {
      say: {
        en: `${t.story.en} Rows 1 and 2 are already plotted. Predict the ordered pair for row ${ASKED_ROW}.`,
        es: `${t.story.es} Las filas 1 y 2 ya están marcadas. Predice el par ordenado de la fila ${ASKED_ROW}.`,
      },
      question: {
        en: `${tAsked.x} ${t.labelX.en} as an ordered pair (x, y) =`,
        es: `${tAsked.x} ${t.labelX.es} como par ordenado (x, y) =`,
      },
      cues: {
        swapped: {
          en: `The first number is x, the ${t.labelX.en}. Which number is that?`,
          es: `El primer número es x, la cantidad de ${t.labelX.es}. ¿Cuál es ese número?`,
        },
        unit: {
          en: `That is row 1. What number of ${t.labelX.en} does the question ask about?`,
          es: `Esa es la fila 1. ¿Qué número de ${t.labelX.es} pide el problema?`,
        },
        stale: {
          en: `Look at the table: how much does y go up each time x goes up by ${t.a}?`,
          es: `Mira la tabla: ¿cuánto sube y cada vez que x sube ${t.a}?`,
        },
      },
      ok: {
        en: `Yes: ${tAsked.x} ${t.labelX.en} need ${tAsked.y} ${t.labelY.en}, the point ${pt(tAsked.x, tAsked.y)}: right ${tAsked.x}, up ${tAsked.y}. It lands on the line through (0, 0).`,
        es: `Sí: ${tAsked.x} ${t.labelX.es} necesitan ${tAsked.y} ${t.labelY.es}, el punto ${pt(tAsked.x, tAsked.y)}: ${tAsked.x} a la derecha, ${tAsked.y} hacia arriba. Cae en la recta que pasa por (0, 0).`,
      },
      explain: {
        en: "Explain: what does an ordered pair tell you, and what do equal ratios look like on a graph?",
        es: "Explica: ¿qué te dice un par ordenado y cómo se ven las razones equivalentes en una gráfica?",
      },
      frame: {
        en: "In an ordered pair the ___ number goes first. Equal ratios make points on ___.",
        es: "En un par ordenado el número de ___ va primero. Las razones equivalentes forman puntos en ___.",
      },
    },
  };
}
