// living/data-bins-model.js — the mathematics (and every sentence) of the
// data-bins play: dots in equal intervals become the bars of a histogram.
//
// Pure functions only (no DOM): data-bins.test.mjs recomputes every number.

import { placeCorrect, sum } from "./mean-balance-model.js";
import { distinctChoices, fmtNum, okInt, sortAsc } from "./median-fold-model.js";

export { fmtNum, placeCorrect, sum };

export const MAX_BINS = 8;
export const MAX_VALUES = 20;

/** Where the intervals end: the first multiple of `step` past the largest value. */
export const endOf = (values, start, step) =>
  start + Math.ceil((Math.max(...values) - start + 1) / step) * step;

/** Equal intervals of width w from `start` to `end`, whole numbers, both ends included. */
export function binsFor(values, start, end, w) {
  const k = Math.ceil((end - start) / w);
  return Array.from({ length: k }, (_, i) => {
    const from = start + i * w;
    const to = from + w - 1;
    return {
      from,
      to,
      label: `${from}–${to}`,
      count: values.filter((x) => x >= from && x <= to).length,
    };
  });
}

/** Which bin (index) each value falls in, for the same intervals. */
export const binOf = (x, start, w) => Math.floor((x - start) / w);

/** Choices for "how tall is this bar?": the count plus real misconceptions. */
export function heightChoices(values, start, end, w, ask) {
  const bins = binsFor(values, start, end, w);
  const up = bins.slice(ask).reduce((s, b) => s + b.count, 0);
  return distinctChoices([
    { kind: "bar", value: bins[ask].count, correct: true },
    { kind: "total", value: values.length },
    { kind: "width", value: w },
    { kind: "up", value: up },
  ]);
}

const pairOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 200), es: String(s.es || s.en).slice(0, 200) }
    : null;

function setOf(cfg, widths) {
  const values = Array.isArray(cfg?.values) ? cfg.values.map(Number) : [];
  const start = Number(cfg?.start ?? 0);
  const w = Number(cfg?.binWidth);
  if (values.length < 8 || values.length > MAX_VALUES || !okInt(start, 0, 900)) return null;
  if (!values.every((x) => okInt(x, start, 999)) || !okInt(w, 2, 50)) return null;
  const ws = widths || [w];
  if (!ws.includes(w) || !ws.every((x) => okInt(x, 2, 50))) return null;
  const end = endOf(values, start, Math.max(...ws));
  if (!ws.every((x) => binsFor(values, start, end, x).length <= MAX_BINS)) return null;
  if (!ws.every((x) => binsFor(values, start, end, x).length >= 2)) return null;
  const ask = Number(cfg.askBin);
  const bins = binsFor(values, start, end, w);
  if (!okInt(ask, 0, bins.length - 1) || bins[ask].count < 2) return null;
  if (!heightChoices(values, start, end, w, ask)) return null;
  const maxFreq = Math.max(
    ...ws.flatMap((x) => binsFor(values, start, end, x).map((b) => b.count)),
  );
  return {
    values: sortAsc(values),
    start,
    end,
    w,
    widths: ws,
    ask,
    maxFreq,
    story: pairOf(cfg.story),
  };
}

export function validateDataBins(cfg) {
  const widths = Array.isArray(cfg?.widths) ? cfg.widths.map(Number) : [];
  if (widths.length < 2 || widths.length > 3 || new Set(widths).size !== widths.length) return null;
  const main = setOf(cfg, widths);
  const xfer = setOf(cfg?.transfer, null);
  if (!main || !xfer) return null;
  const unit = pairOf(cfg.unit) || { en: "values", es: "valores" };
  return { main, xfer, unit };
}

const list = (a) => a.join(", ");

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function dataBinsCopy(v) {
  const { main: M, xfer: X } = v;
  const n = M.values.length;
  const bins = binsFor(M.values, M.start, M.end, M.w);
  const ab = bins[M.ask];
  const tb = binsFor(X.values, X.start, X.end, X.w);
  const ta = tb[X.ask];
  const story = M.story || { en: "A data set:", es: "Un conjunto de datos:" };
  const tstory = X.story || { en: "A new data set:", es: "Un conjunto de datos nuevo:" };
  const freqs = bins.map((b) => b.count);
  const top = Math.max(...freqs);
  const tallest = bins.filter((b) => b.count === top).map((b) => b.label);
  const cueHeight = (opt, a, b) => {
    const x = fmtNum(opt.value);
    if (opt.kind === "total")
      return {
        en: `${x} is every value in the data set. One bar counts only the values inside its own interval, ${a}–${b}. Count the dots from ${a} to ${b}.`,
        es: `${x} es todos los valores del conjunto. Una barra cuenta solo los valores dentro de su propio intervalo, ${a}–${b}. Cuenta los puntos de ${a} a ${b}.`,
      };
    if (opt.kind === "width")
      return {
        en: `${x} is how wide the interval is. A bar's HEIGHT counts the values inside it. Count the dots from ${a} to ${b}.`,
        es: `${x} es qué tan ancho es el intervalo. La ALTURA de una barra cuenta los valores que hay dentro. Cuenta los puntos de ${a} a ${b}.`,
      };
    return {
      en: `${x} counts every value from ${a} upward, not only up to ${b}. The bar for ${a}–${b} stops at ${b}. Count the dots inside the outlined interval.`,
      es: `${x} cuenta todos los valores desde ${a} hacia arriba, no solo hasta ${b}. La barra de ${a}–${b} termina en ${b}. Cuenta los puntos dentro del intervalo marcado.`,
    };
  };
  const widthRow = (w) => {
    const bs = binsFor(M.values, M.start, M.end, w);
    const fq = bs.map((b) => b.count);
    return {
      en: `Intervals of ${w}: ${bs.length} bars with heights ${list(fq)}. They add up to ${n}.`,
      es: `Intervalos de ${w}: ${bs.length} barras con alturas ${list(fq)}. Suman ${n}.`,
    };
  };
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: { en: "From dots to a histogram", es: "De puntos a un histograma" },
    ariaLabel: {
      en: `${n} values (${list(M.values)}) as a dot plot, then grouped into equal intervals of ${M.w}: ${bins.map((b) => `${b.label} has ${b.count}`).join(", ")}. Each bar's height is the number of values in its interval.`,
      es: `${n} valores (${list(M.values)}) en un diagrama de puntos y luego agrupados en intervalos iguales de ${M.w}: ${bins.map((b) => `${b.label} tiene ${b.count}`).join(", ")}. La altura de cada barra es la cantidad de valores de su intervalo.`,
    },
    printSummary: {
      en: `Data: ${list(M.values)}. Intervals of ${M.w}: ${bins.map((b) => `${b.label} → ${b.count}`).join(", ")}. The bars touch and have equal widths. The height of each bar is the frequency: how many values fall in that interval. The frequencies add up to ${n}.`,
      es: `Datos: ${list(M.values)}. Intervalos de ${M.w}: ${bins.map((b) => `${b.label} → ${b.count}`).join(", ")}. Las barras se tocan y tienen el mismo ancho. La altura de cada barra es la frecuencia: cuántos valores caen en ese intervalo. Las frecuencias suman ${n}.`,
    },
    scene: {
      situate: { en: "The data", es: "Los datos" },
      predict: { en: "Predict", es: "Predice" },
      bins: { en: "Make the bars", es: "Haz las barras" },
      width: { en: "Change the interval", es: "Cambia el intervalo" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    list: list(M.values),
    xferList: list(X.values),
    sumExpr: (fq, total) => `${fq.join(" + ")} = ${total}`,
    cueHeight,
    situateSay: {
      en: `${story.en} each dot is one value, placed on the number line: ${n} values, from ${M.values[0]} to ${M.values[n - 1]}.`,
      es: `${story.es} cada punto es un valor, colocado en la recta numérica: ${n} valores, de ${M.values[0]} a ${M.values[n - 1]}.`,
    },
    predictSay: {
      en: `A histogram groups the values into equal intervals. The dashed lines mark intervals of ${M.w}. A bar is as tall as the number of values inside its interval.`,
      es: `Un histograma agrupa los valores en intervalos iguales. Las líneas punteadas marcan intervalos de ${M.w}. Una barra es tan alta como la cantidad de valores dentro de su intervalo.`,
    },
    predictQ: {
      en: `How tall will the bar for ${ab.label} be?`,
      es: `¿Qué altura tendrá la barra de ${ab.label}?`,
    },
    predictOk: {
      en: `Yes: ${ab.count} dots fall from ${ab.from} to ${ab.to}, so that bar is ${ab.count} tall. Now watch every bar form.`,
      es: `Sí: ${ab.count} puntos caen de ${ab.from} a ${ab.to}, así que esa barra mide ${ab.count} de alto. Ahora mira cómo se forman todas las barras.`,
    },
    binsSay: {
      en: "Each dot drops into its interval and the dots stack into a bar. The bars touch because the intervals leave no gaps.",
      es: "Cada punto cae en su intervalo y los puntos se apilan en una barra. Las barras se tocan porque los intervalos no dejan huecos.",
    },
    binsDone: {
      en: `The height of each bar is its frequency: ${freqs.join(" + ")} = ${n}. ${tallest.length === 1 ? `The tallest bar, ${tallest[0]}, is where most values are.` : `The tallest bars, ${tallest.join(" and ")}, are where most values are.`}`,
      es: `La altura de cada barra es su frecuencia: ${freqs.join(" + ")} = ${n}. ${tallest.length === 1 ? `La barra más alta, ${tallest[0]}, es donde están la mayoría de los valores.` : `Las barras más altas, ${tallest.join(" y ")}, son donde están la mayoría de los valores.`}`,
    },
    widthSay: {
      en: "The data do not change, only how we group them. Pick an interval width and watch the bars.",
      es: "Los datos no cambian, solo cómo los agrupamos. Elige un ancho de intervalo y mira las barras.",
    },
    widthLabel: { en: "Interval width", es: "Ancho del intervalo" },
    widthRow,
    tryWidths: { en: "Try every width.", es: "Prueba todos los anchos." },
    widthLesson: {
      en: `Narrow intervals show more detail; wide intervals hide it. At every width the intervals are equal, the bars touch, and the heights add up to ${n}.`,
      es: `Los intervalos angostos muestran más detalle; los anchos lo esconden. Con cualquier ancho los intervalos son iguales, las barras se tocan y las alturas suman ${n}.`,
    },
    transferSay: {
      en: `${tstory.en} each dot is one value. The intervals are ${X.w} wide.`,
      es: `${tstory.es} cada punto es un valor. Los intervalos miden ${X.w} de ancho.`,
    },
    transferQ: {
      en: `How many are in the interval ${ta.label}?`,
      es: `¿Cuántos hay en el intervalo ${ta.label}?`,
    },
    transferOk: {
      en: `Yes: the bar for ${ta.label} is ${ta.count} tall, so ${ta.count} fall in that interval. All the bars add up to ${X.values.length}: ${tb.map((b) => b.count).join(" + ")} = ${X.values.length}.`,
      es: `Sí: la barra de ${ta.label} mide ${ta.count} de alto, así que ${ta.count} caen en ese intervalo. Todas las barras suman ${X.values.length}: ${tb.map((b) => b.count).join(" + ")} = ${X.values.length}.`,
    },
    explainLabel: {
      en: "Explain: why do the bars of a histogram touch, and what does the height of a bar tell you?",
      es: "Explica: ¿por qué se tocan las barras de un histograma y qué te dice la altura de una barra?",
    },
    explainFrame: {
      en: "The bars touch because ___. The height of a bar tells me ___.",
      es: "Las barras se tocan porque ___. La altura de una barra me dice ___.",
    },
  };
}
