// living/box-build-model.js — the mathematics (and every sentence) of the
// box-build play: ordered data -> median -> Q1 and Q3 -> a box plot.
//
// Pure functions only (no DOM): box-build.test.mjs recomputes every number.

import { niceStep } from "./mean-balance-model.js";
import {
  distinctChoices,
  fiveNumber,
  fmtNum,
  meanOf,
  near,
  okInt,
  sum,
} from "./median-fold-model.js";

export { fmtNum, near, niceStep, sum };

/** n = 7 or 11 leaves an odd-sized half, so Q1 and Q3 are real data values. */
export const BOX_SIZES = [7, 11];

/** The two sides of the median: how far the plot stretches below and above it. */
export const sidesOf = (five) => [five.med - five.min, five.max - five.med];

/** Which slots in the sorted list are Q1 and Q3. */
export function quartileSlots(n) {
  const h = Math.floor(n / 2);
  return { h, q1: (h - 1) / 2, q3: n - h + (h - 1) / 2 };
}

/** Values on each side of the median (the median itself is not counted): always equal. */
export const valuesPerSide = (n) => (n - 1) / 2;

export function medianChoices(values) {
  const s = fiveNumber(values);
  return distinctChoices([
    { kind: "median", value: s.med, correct: true },
    { kind: "mean", value: meanOf(values) },
    { kind: "midrange", value: (s.min + s.max) / 2 },
    { kind: "position", value: (s.n + 1) / 2 },
  ]);
}

export function q3Choices(values) {
  const s = fiveNumber(values);
  const withMedian = fiveNumber([s.med, ...s.upper]).med;
  return distinctChoices([
    { kind: "q3", value: s.q3, correct: true },
    { kind: "max", value: s.max },
    { kind: "median", value: s.med },
    { kind: "withMedian", value: withMedian },
  ]);
}

/** Row in a dot-plot stack for each sorted value (0 = on the line). */
export const stackIndex = (sorted) =>
  sorted.map((x, i) => sorted.slice(0, i).filter((y) => y === x).length);

/** Axis for a data set: a tidy step and ends that include min and max. */
export function axisFor(five) {
  const step = niceStep(five.max - five.min);
  return {
    step,
    lo: Math.floor(five.min / step) * step,
    hi: Math.ceil(five.max / step) * step,
  };
}

function boxList(a) {
  const v = Array.isArray(a) ? a.map(Number) : [];
  if (!BOX_SIZES.includes(v.length) || !v.every((x) => okInt(x, 0, 999))) return null;
  if (!v.every((x, i) => i === 0 || v[i - 1] <= x)) return null;
  const s = fiveNumber(v);
  const inc = s.min < s.q1 && s.q1 < s.med && s.med < s.q3 && s.q3 < s.max;
  return inc && medianChoices(v) && q3Choices(v) ? v : null;
}

const pairOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 200), es: String(s.es || s.en).slice(0, 200) }
    : null;

export function validateBoxBuild(cfg) {
  const values = boxList(cfg?.values);
  const tv = boxList(cfg?.transfer?.values);
  if (!values || !tv) return null;
  // The "sides" question needs the plot to stretch further on one side of the median.
  const [below, above] = sidesOf(fiveNumber(values));
  if (below === above) return null;
  return {
    values,
    story: pairOf(cfg.story),
    transfer: { values: tv, story: pairOf(cfg.transfer.story) },
    longer: above > below ? 1 : 0,
  };
}

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function boxBuildCopy(v) {
  const f = fmtNum;
  const S = fiveNumber(v.values);
  const n = S.n;
  const { h } = quartileSlots(n);
  const list = v.values.join(", ");
  const tv = v.transfer.values;
  const TS = fiveNumber(tv);
  const sideEn = v.longer ? "right" : "left";
  const shortEn = v.longer ? "left" : "right";
  const sideEs = v.longer ? "derecho" : "izquierdo";
  const shortEs = v.longer ? "izquierdo" : "derecho";
  const story = v.story || { en: "The data:", es: "Los datos:" };
  const tstory = v.transfer.story || { en: "A new data set:", es: "Un conjunto de datos nuevo:" };
  const vals = (c) => ({
    en: `${c} value${c === 1 ? "" : "s"}`,
    es: `${c} valor${c === 1 ? "" : "es"}`,
  });
  const pos = (S.n + 1) / 2;
  const cueMedian = (opt) => {
    const x = f(opt.value);
    if (opt.kind === "mean")
      return {
        en: `${x} is the mean: the total ÷ ${n}. The median is the value in the middle position. Count in from both ends: which card is left alone?`,
        es: `${x} es la media: el total ÷ ${n}. La mediana es el valor en la posición del medio. Cuenta desde los dos extremos: ¿cuál tarjeta queda sola?`,
      };
    if (opt.kind === "midrange")
      return {
        en: `${x} is halfway between the least, ${S.min}, and the greatest, ${S.max}. The median is the value in the middle of the LIST, not halfway across the number line. Which card is left alone when you count in from both ends?`,
        es: `${x} está a mitad de camino entre el menor, ${S.min}, y el mayor, ${S.max}. La mediana es el valor en el medio de la LISTA, no a mitad de la recta numérica. ¿Cuál tarjeta queda sola cuando cuentas desde los dos extremos?`,
      };
    return {
      en: `${x} is the position of the middle card: number ${x} of ${n}. But the median is the value written on that card. What does it say?`,
      es: `${x} es la posición de la tarjeta del medio: la número ${x} de ${n}. Pero la mediana es el valor escrito en esa tarjeta. ¿Qué dice?`,
    };
  };
  /** Wrong tap while looking for Q1 (which = "q1") or Q3. */
  const cueQuartile = (which, id) => {
    const x = v.values[id];
    const q = which === "q1" ? "Q1" : "Q3";
    const mine = which === "q1" ? "lower" : "upper";
    const mineEs = which === "q1" ? "inferior" : "superior";
    const other = which === "q1" ? "upper" : "lower";
    const otherEs = which === "q1" ? "superior" : "inferior";
    if (id === h)
      return {
        en: `${x} is the median, the middle of ALL ${n} values. ${q} is the middle of only the ${mine} half.`,
        es: `${x} es la mediana, el medio de TODOS los ${n} valores. ${q} es el medio de solo la mitad ${mineEs}.`,
      };
    const inLower = id < h;
    if (inLower !== (which === "q1"))
      return {
        en: `${x} is in the ${other} half. ${q} belongs to the ${mine} half. Which side is lower?`,
        es: `${x} está en la mitad ${otherEs}. ${q} pertenece a la mitad ${mineEs}. ¿Cuál lado es el inferior?`,
      };
    return {
      en: `${x} is in the ${mine} half, but is it the middle of that half? Fold the ${h} ${mine} values in from both ends: which one is left alone?`,
      es: `${x} está en la mitad ${mineEs}, pero ¿es el medio de esa mitad? Dobla hacia adentro los ${h} valores de la mitad ${mineEs}: ¿cuál queda solo?`,
    };
  };
  const cueQ3 = (opt) => {
    const x = f(opt.value);
    if (opt.kind === "max")
      return {
        en: `${x} is the greatest value, where the upper whisker ends. Q3 is the middle of the upper half, not its end. Which value is left alone when you fold the upper half in?`,
        es: `${x} es el valor mayor, donde termina el bigote superior. Q3 es el medio de la mitad superior, no su final. ¿Cuál valor queda solo cuando doblas hacia adentro la mitad superior?`,
      };
    if (opt.kind === "median")
      return {
        en: `${x} is the median of all ${TS.n} values. Q3 is the middle of only the upper half. Which values are in the upper half?`,
        es: `${x} es la mediana de los ${TS.n} valores. Q3 es el medio de solo la mitad superior. ¿Cuáles valores están en la mitad superior?`,
      };
    return {
      en: `${x} comes from counting the median as part of the upper half. The median belongs to neither half. Which values are in the upper half now?`,
      es: `${x} sale de contar la mediana como parte de la mitad superior. La mediana no pertenece a ninguna mitad. ¿Cuáles valores están en la mitad superior ahora?`,
    };
  };
  const sideOption = (kind) =>
    kind === "longer"
      ? { en: `The ${sideEn} side, the longer one`, es: `El lado ${sideEs}, el más largo` }
      : { en: `The ${shortEn} side, the shorter one`, es: `El lado ${shortEs}, el más corto` };
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: {
      en: "Build a box plot from five numbers",
      es: "Construye un diagrama de caja con cinco números",
    },
    ariaLabel: {
      en: `Ordered data ${list}. Five numbers: minimum ${S.min}, Q1 ${f(S.q1)}, median ${f(S.med)}, Q3 ${f(S.q3)}, maximum ${S.max}. They become a box plot: a box from Q1 to Q3 with a line at the median and whiskers out to the minimum and the maximum.`,
      es: `Datos en orden ${list}. Cinco números: mínimo ${S.min}, Q1 ${f(S.q1)}, mediana ${f(S.med)}, Q3 ${f(S.q3)}, máximo ${S.max}. Se vuelven un diagrama de caja: una caja de Q1 a Q3 con una línea en la mediana y bigotes hasta el mínimo y el máximo.`,
    },
    printSummary: {
      en: `Data in order: ${list}. Median ${f(S.med)}. Lower half ${S.lower.join(", ")}: Q1 = ${f(S.q1)}. Upper half ${S.upper.join(", ")}: Q3 = ${f(S.q3)}. Minimum ${S.min}, maximum ${S.max}. The box runs from Q1 to Q3 and holds the middle half of the data; the whiskers reach the minimum and the maximum.`,
      es: `Datos en orden: ${list}. Mediana ${f(S.med)}. Mitad inferior ${S.lower.join(", ")}: Q1 = ${f(S.q1)}. Mitad superior ${S.upper.join(", ")}: Q3 = ${f(S.q3)}. Mínimo ${S.min}, máximo ${S.max}. La caja va de Q1 a Q3 y contiene la mitad central de los datos; los bigotes llegan al mínimo y al máximo.`,
    },
    scene: {
      situate: { en: "The data", es: "Los datos" },
      median: { en: "Median", es: "Mediana" },
      quartiles: { en: "Quartiles", es: "Cuartiles" },
      build: { en: "Box plot", es: "Diagrama de caja" },
      sides: { en: "Both sides", es: "Los dos lados" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    labelQ1: { en: "Q1", es: "Q1" },
    labelMed: { en: "median", es: "mediana" },
    labelQ3: { en: "Q3", es: "Q3" },
    /** Five labels on the number line, name + value. */
    lineLabels: (s) => [
      { en: `min ${f(s.min)}`, es: `mín ${f(s.min)}` },
      { en: `Q1 ${f(s.q1)}`, es: `Q1 ${f(s.q1)}` },
      { en: `median ${f(s.med)}`, es: `mediana ${f(s.med)}` },
      { en: `Q3 ${f(s.q3)}`, es: `Q3 ${f(s.q3)}` },
      { en: `max ${f(s.max)}`, es: `máx ${f(s.max)}` },
    ],
    lowerHalf: { en: `lower half · ${vals(h).en}`, es: `mitad inferior · ${vals(h).es}` },
    upperHalf: { en: `upper half · ${vals(h).en}`, es: `mitad superior · ${vals(h).es}` },
    list,
    cueMedian,
    cueQuartile,
    cueQ3,
    situateSay: {
      en: `${story.en} ${list}. These ${n} values are already in order. A box plot is drawn from five numbers: the minimum, Q1, the median, Q3 and the maximum. Let's find them.`,
      es: `${story.es} ${list}. Estos ${n} valores ya están en orden. Un diagrama de caja se dibuja con cinco números: el mínimo, Q1, la mediana, Q3 y el máximo. Vamos a hallarlos.`,
    },
    medianSay: {
      en: "Start with the median, the value in the middle of the ordered data. Which value is it?",
      es: "Empieza con la mediana, el valor del medio de los datos ordenados. ¿Cuál valor es?",
    },
    medianQ: { en: "The median is…", es: "La mediana es…" },
    medianOk: {
      en: `Yes: ${f(S.med)} is number ${pos} of ${n}, with ${h} values on each side. It splits the data into a lower half and an upper half.`,
      es: `Sí: ${f(S.med)} es el número ${pos} de ${n}, con ${h} valores a cada lado. Divide los datos en una mitad inferior y una mitad superior.`,
    },
    quartileSay: {
      en: "Q1 is the median of the lower half. Q3 is the median of the upper half. Tap Q1 first, then Q3.",
      es: "Q1 es la mediana de la mitad inferior. Q3 es la mediana de la mitad superior. Toca primero Q1 y luego Q3.",
    },
    howQ1: { en: "Tap the value that is Q1.", es: "Toca el valor que es Q1." },
    howQ3: { en: "Tap the value that is Q3.", es: "Toca el valor que es Q3." },
    q1Ok: {
      en: `Q1 = ${f(S.q1)}: the middle of the lower ${h}. Now tap Q3.`,
      es: `Q1 = ${f(S.q1)}: el medio de los ${h} valores inferiores. Ahora toca Q3.`,
    },
    quartileDone: {
      en: `Q3 = ${f(S.q3)}: the middle of the upper ${h}. The five numbers are the minimum ${S.min}, Q1 ${f(S.q1)}, the median ${f(S.med)}, Q3 ${f(S.q3)} and the maximum ${S.max}.`,
      es: `Q3 = ${f(S.q3)}: el medio de los ${h} valores superiores. Los cinco números son el mínimo ${S.min}, Q1 ${f(S.q1)}, la mediana ${f(S.med)}, Q3 ${f(S.q3)} y el máximo ${S.max}.`,
    },
    cards: { en: "Values", es: "Valores" },
    buildSay: {
      en: "Now the same values drop onto a number line. The box runs from Q1 to Q3 and holds the middle half of the data; the line inside is the median. Whiskers reach out to the minimum and the maximum.",
      es: "Ahora los mismos valores caen sobre una recta numérica. La caja va de Q1 a Q3 y contiene la mitad central de los datos; la línea de adentro es la mediana. Los bigotes llegan hasta el mínimo y el máximo.",
    },
    buildExpr: {
      en: `${S.min} · ${f(S.q1)} · ${f(S.med)} · ${f(S.q3)} · ${S.max}`,
      es: `${S.min} · ${f(S.q1)} · ${f(S.med)} · ${f(S.q3)} · ${S.max}`,
    },
    buildDone: {
      en: "The five-number summary is the whole box plot: minimum, Q1, median, Q3, maximum.",
      es: "El resumen de cinco números es todo el diagrama de caja: mínimo, Q1, mediana, Q3, máximo.",
    },
    sidesSay: {
      en: `The median line splits the data in half. On this plot the ${sideEn} side stretches further than the ${shortEn} side.`,
      es: `La línea de la mediana divide los datos por la mitad. En este diagrama el lado ${sideEs} se extiende más que el lado ${shortEs}.`,
    },
    sidesQ: {
      en: "Which side of the median holds more values?",
      es: "¿Cuál lado de la mediana tiene más valores?",
    },
    sideOption,
    sameOption: {
      en: "Both sides hold the same number of values",
      es: "Los dos lados tienen la misma cantidad de valores",
    },
    cueLonger: {
      en: "That side is longer, but long is not the same as many. Count the dots on each side of the median line, inside the two outlined sides. Do the counts differ?",
      es: "Ese lado es más largo, pero largo no es lo mismo que muchos. Cuenta los puntos de cada lado de la línea de la mediana, dentro de los dos lados marcados. ¿Los conteos son distintos?",
    },
    cueShorter: {
      en: "That side is shorter, so its dots look crowded. But does a shorter side hold more dots? Count the dots on each side of the median line, inside the two outlined sides.",
      es: "Ese lado es más corto, así que sus puntos se ven apretados. Pero ¿un lado más corto tiene más puntos? Cuenta los puntos de cada lado de la línea de la mediana, dentro de los dos lados marcados.",
    },
    sidesOk: {
      en: `Each side holds ${vals(h).en} (the median is not counted). The median splits the VALUES in half, not the distance. The longer side is just more spread out.`,
      es: `Cada lado tiene ${vals(h).es} (la mediana no se cuenta). La mediana divide los VALORES por la mitad, no la distancia. El lado más largo solo está más disperso.`,
    },
    transferSay: {
      en: `${tstory.en} ${tv.join(", ")}. These ${TS.n} values are in order. Find Q3: the middle of the upper half.`,
      es: `${tstory.es} ${tv.join(", ")}. Estos ${TS.n} valores están en orden. Halla Q3: el medio de la mitad superior.`,
    },
    transferQ: { en: "Q3 is…", es: "Q3 es…" },
    transferOk: {
      en: `Yes: the upper half is ${TS.upper.join(", ")}, and its middle is ${f(TS.q3)}. So Q3 = ${f(TS.q3)}. This box runs from Q1 = ${f(TS.q1)} to Q3 = ${f(TS.q3)}.`,
      es: `Sí: la mitad superior es ${TS.upper.join(", ")} y su medio es ${f(TS.q3)}. Entonces Q3 = ${f(TS.q3)}. Esta caja va de Q1 = ${f(TS.q1)} a Q3 = ${f(TS.q3)}.`,
    },
    explainLabel: {
      en: "Explain: what does the box in a box plot show?",
      es: "Explica: ¿qué muestra la caja en un diagrama de caja?",
    },
    explainFrame: {
      en: "The box runs from ___ to ___ and holds ___, because ___.",
      es: "La caja va de ___ a ___ y contiene ___, porque ___.",
    },
  };
}
