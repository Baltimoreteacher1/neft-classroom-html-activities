// living/spread-iqr-model.js — the mathematics (and every sentence) of the
// spread-iqr play: range = greatest − least, IQR = Q3 − Q1.
//
// Pure functions only (no DOM): spread-iqr.test.mjs recomputes every number.

import { niceStep } from "./mean-balance-model.js";
import { distinctChoices, fiveNumber, fmtNum, okInt, sortAsc } from "./median-fold-model.js";

export { fmtNum, niceStep };

/** n a multiple of 4 gives four equal groups of dots: two outside, two in the middle half. */
export const SPREAD_SIZES = [12, 16, 20, 24];

/** Axis for a span: a tidy step and ends that include both extremes. */
export function axisOf(min, max) {
  const step = niceStep(max - min);
  return { step, lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step };
}

/** The data with its lowest value replaced; null if it stops being the lowest. */
export function withLowest(values, x) {
  if (!Number.isFinite(x) || x > values[1]) return null;
  return [x, ...values.slice(1)];
}

/** Indexes of the dots in the middle half (between Q1 and Q3). */
export const middleHalf = (n) => ({ from: n / 4, to: (3 * n) / 4 });

export function rangeChoices(values) {
  const s = fiveNumber(values);
  return distinctChoices([
    { kind: "range", value: s.range, correct: true },
    { kind: "max", value: s.max },
    { kind: "midrange", value: (s.min + s.max) / 2 },
    { kind: "count", value: s.n },
  ]);
}

export function iqrChoices(values) {
  const s = fiveNumber(values);
  return distinctChoices([
    { kind: "iqr", value: s.iqr, correct: true },
    { kind: "range", value: s.range },
    { kind: "sum", value: s.q1 + s.q3 },
    { kind: "mid", value: (s.q1 + s.q3) / 2 },
  ]);
}

function fiveOf(o) {
  const a = [o?.min, o?.q1, o?.med, o?.q3, o?.max].map(Number);
  const ok = a.every((x) => okInt(x, 0, 100)) && a.every((x, i) => i === 0 || a[i - 1] < x);
  return ok
    ? { min: a[0], q1: a[1], med: a[2], q3: a[3], max: a[4], range: a[4] - a[0], iqr: a[3] - a[1] }
    : null;
}

const pairOf = (s, max = 200) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, max), es: String(s.es || s.en).slice(0, max) }
    : null;

export function validateSpreadIqr(cfg) {
  const values = Array.isArray(cfg?.values) ? cfg.values.map(Number) : [];
  if (!SPREAD_SIZES.includes(values.length) || !values.every((x) => okInt(x, 0, 100))) return null;
  if (values.join() !== sortAsc(values).join()) return null;
  const s = fiveNumber(values);
  const top = Math.max(...values.map((x) => values.filter((y) => y === x).length));
  if (top > 3 || !(s.min < s.q1 && s.q1 < s.med && s.med < s.q3 && s.q3 < s.max)) return null;
  if (!rangeChoices(values) || !iqrChoices(values)) return null;
  const low = Number(cfg.outlierMin);
  const moved = okInt(low, 0, s.min - 10) ? withLowest(values, low) : null;
  if (!moved) return null;
  const m = fiveNumber(moved);
  // The lesson of the scene: the range moves, the quartiles do not.
  if (m.q1 !== s.q1 || m.med !== s.med || m.q3 !== s.q3 || m.range === s.range) return null;
  const a = fiveOf(cfg.transfer?.a);
  const b = fiveOf(cfg.transfer?.b);
  if (!a || !b || a.med !== b.med || a.iqr === b.iqr) return null;
  const la = pairOf(cfg.transfer.a.label, 20);
  const lb = pairOf(cfg.transfer.b.label, 20);
  if (!la || !lb) return null;
  return {
    values,
    story: pairOf(cfg.story),
    outlierMin: low,
    transfer: { a: { ...a, label: la }, b: { ...b, label: lb } },
  };
}

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function spreadIqrCopy(v) {
  const f = fmtNum;
  const S = fiveNumber(v.values);
  const n = S.n;
  const list = v.values.join(", ");
  const { a, b } = v.transfer;
  const lessSpread = b.iqr < a.iqr ? b : a;
  const moreSpread = lessSpread === a ? b : a;
  const story = v.story || { en: "Scores in order:", es: "Puntajes en orden:" };
  const low = v.outlierMin;
  const tryMore = (left) => ({
    en: left === 1 ? "Try one more value." : "Try two more values.",
    es: left === 1 ? "Prueba un valor más." : "Prueba dos valores más.",
  });
  const rangeSum = (lo, hi) => ({
    en: `range = ${hi} − ${lo} = ${hi - lo}`,
    es: `rango = ${hi} − ${lo} = ${hi - lo}`,
  });
  const iqrSum = {
    en: `IQR = ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}`,
    es: `RIC = ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}`,
  };
  const cueRange = (opt) => {
    const x = f(opt.value);
    if (opt.kind === "max")
      return {
        en: `${x} is the greatest score, one end of the data. A range is a distance: how far it is from the least to the greatest. The two outlined dots are the ends.`,
        es: `${x} es el puntaje mayor, un extremo de los datos. Un rango es una distancia: qué tan lejos está el menor del mayor. Los dos puntos marcados son los extremos.`,
      };
    if (opt.kind === "midrange")
      return {
        en: `${x} is halfway between the least and the greatest. That is a center. The range measures how far apart the two ends are. The two outlined dots are the ends.`,
        es: `${x} está a mitad de camino entre el menor y el mayor. Eso es un centro. El rango mide qué tan separados están los dos extremos. Los dos puntos marcados son los extremos.`,
      };
    return {
      en: `${x} is how many scores there are. The range is a distance on the number line, from the least score to the greatest. The two outlined dots are the ends.`,
      es: `${x} es cuántos puntajes hay. El rango es una distancia en la recta numérica, del puntaje menor al mayor. Los dos puntos marcados son los extremos.`,
    };
  };
  const cueIqr = (opt) => {
    const x = f(opt.value);
    if (opt.kind === "range")
      return {
        en: `${x} is the distance across ALL the scores, whisker to whisker. The IQR measures only the middle half. Which two marks are the ends of the box?`,
        es: `${x} es la distancia de TODOS los puntajes, de bigote a bigote. El RIC mide solo la mitad central. ¿Cuáles dos marcas son los extremos de la caja?`,
      };
    if (opt.kind === "sum")
      return {
        en: `${x} adds Q1 and Q3. A width is a distance, not a total. What do you do to find the distance between two numbers?`,
        es: `${x} suma Q1 y Q3. Un ancho es una distancia, no un total. ¿Qué haces para hallar la distancia entre dos números?`,
      };
    return {
      en: `${x} is halfway between Q1 and Q3: the center of the box. The IQR is how WIDE the box is. How far is it from one end of the box to the other?`,
      es: `${x} está a mitad de camino entre Q1 y Q3: el centro de la caja. El RIC es qué tan ANCHA es la caja. ¿Qué tan lejos está un extremo de la caja del otro?`,
    };
  };
  const cueClass = (kind) =>
    kind === "same"
      ? {
          en: "The medians match, so the centers match. Spread is a different idea: compare how wide each box is.",
          es: "Las medianas son iguales, así que los centros coinciden. La dispersión es otra idea: compara qué tan ancha es cada caja.",
        }
      : {
          en: "Compare the two outlined boxes. Which box is narrower? The narrower box has the smaller IQR.",
          es: "Compara las dos cajas marcadas. ¿Cuál caja es más angosta? La caja más angosta tiene el RIC menor.",
        };
  const sumLine = (k) => ({
    en: `min ${k.min} · Q1 ${k.q1} · median ${k.med} · Q3 ${k.q3} · max ${k.max}`,
    es: `mín ${k.min} · Q1 ${k.q1} · mediana ${k.med} · Q3 ${k.q3} · máx ${k.max}`,
  });
  const resultLine = (k) => ({
    en: `range ${k.range} · IQR ${k.iqr}`,
    es: `rango ${k.range} · RIC ${k.iqr}`,
  });
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: {
      en: "How spread out is the data?",
      es: "¿Qué tan dispersos están los datos?",
    },
    ariaLabel: {
      en: `Dot plot of ${n} scores from ${S.min} to ${S.max}. The range is ${S.max} − ${S.min} = ${S.range}. The box plot has Q1 ${f(S.q1)}, median ${f(S.med)}, Q3 ${f(S.q3)}; the interquartile range is ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}.`,
      es: `Diagrama de puntos de ${n} puntajes de ${S.min} a ${S.max}. El rango es ${S.max} − ${S.min} = ${S.range}. El diagrama de caja tiene Q1 ${f(S.q1)}, mediana ${f(S.med)}, Q3 ${f(S.q3)}; el rango intercuartílico es ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}.`,
    },
    printSummary: {
      en: `Scores in order: ${list}. Range = greatest − least = ${S.max} − ${S.min} = ${S.range}. Q1 = ${f(S.q1)}, median = ${f(S.med)}, Q3 = ${f(S.q3)}. Interquartile range = Q3 − Q1 = ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}. The range covers all the data; the IQR covers only the middle half.`,
      es: `Puntajes en orden: ${list}. Rango = mayor − menor = ${S.max} − ${S.min} = ${S.range}. Q1 = ${f(S.q1)}, mediana = ${f(S.med)}, Q3 = ${f(S.q3)}. Rango intercuartílico = Q3 − Q1 = ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}. El rango cubre todos los datos; el RIC cubre solo la mitad central.`,
    },
    scene: {
      situate: { en: "The data", es: "Los datos" },
      predict: { en: "Predict", es: "Predice" },
      range: { en: "Range", es: "Rango" },
      iqr: { en: "Middle half", es: "Mitad central" },
      outlier: { en: "What if…", es: "¿Y si…?" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    list,
    rangeSum,
    iqrSum,
    labelQ1: { en: `Q1 ${f(S.q1)}`, es: `Q1 ${f(S.q1)}` },
    labelMed: (k) => ({ en: `median ${f(k.med)}`, es: `mediana ${f(k.med)}` }),
    labelQ3: { en: `Q3 ${f(S.q3)}`, es: `Q3 ${f(S.q3)}` },
    cueRange,
    cueIqr,
    cueClass,
    sumLine,
    resultLine,
    situateSay: {
      en: `${story.en} each dot is one score. There are ${n} scores, from ${S.min} to ${S.max}.`,
      es: `${story.es} cada punto es un puntaje. Hay ${n} puntajes, de ${S.min} a ${S.max}.`,
    },
    predictSay: {
      en: "The median tells where the scores sit. It does not tell how spread out they are. First measure the whole spread: from the lowest score to the highest.",
      es: "La mediana dice dónde están los puntajes. No dice qué tan dispersos están. Primero mide toda la dispersión: del puntaje más bajo al más alto.",
    },
    predictQ: {
      en: "How far apart are the lowest and the highest scores?",
      es: "¿Qué tan separados están el puntaje más bajo y el más alto?",
    },
    predictOk: {
      en: "Yes. Now see it on the number line.",
      es: "Sí. Ahora míralo en la recta numérica.",
    },
    rangeSay: {
      en: "A bracket from the least score to the greatest shows the range.",
      es: "Un corchete del puntaje menor al mayor muestra el rango.",
    },
    rangeDone: {
      en: `The range is the distance from the least to the greatest: ${S.max} − ${S.min} = ${S.range}. It uses only the two end scores.`,
      es: `El rango es la distancia del menor al mayor: ${S.max} − ${S.min} = ${S.range}. Usa solo los dos puntajes de los extremos.`,
    },
    iqrSay: {
      en: `Now the middle half. The median is ${f(S.med)}. Q1 = ${f(S.q1)} is the median of the lower half and Q3 = ${f(S.q3)} is the median of the upper half. The amber dots are the middle half of the scores: they sit inside the box.`,
      es: `Ahora la mitad central. La mediana es ${f(S.med)}. Q1 = ${f(S.q1)} es la mediana de la mitad inferior y Q3 = ${f(S.q3)} es la mediana de la mitad superior. Los puntos ámbar son la mitad central de los puntajes: están dentro de la caja.`,
    },
    iqrQ: { en: "The IQR, the width of the box, is…", es: "El RIC, el ancho de la caja, es…" },
    iqrOk: {
      en: `Yes: ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}. The middle half of the scores spans only ${f(S.iqr)} points, even though the full range is ${S.range}.`,
      es: `Sí: ${f(S.q3)} − ${f(S.q1)} = ${f(S.iqr)}. La mitad central de los puntajes abarca solo ${f(S.iqr)} puntos, aunque el rango completo es ${S.range}.`,
    },
    lowestWord: { en: "Lowest score", es: "Puntaje más bajo" },
    outlierSay: {
      en: `What if one score is far from the rest? Move the lowest score down, as far as ${low}. Watch the range and the IQR.`,
      es: `¿Y si un puntaje está muy lejos de los demás? Baja el puntaje más bajo, hasta ${low}. Observa el rango y el RIC.`,
    },
    outlierRow: (x, esc) => {
      const m = fiveNumber([x, ...v.values.slice(1)]);
      const [lo, rg, iq] = [x, m.range, m.iqr].map((q) => esc(f(q)));
      return {
        en: `Lowest score = <b>${lo}</b>. Range = ${esc(S.max)} − ${lo} = <b>${rg}</b>. IQR = ${esc(f(m.q3))} − ${esc(f(m.q1))} = <b>${iq}</b>.`,
        es: `Puntaje más bajo = <b>${lo}</b>. Rango = ${esc(S.max)} − ${lo} = <b>${rg}</b>. RIC = ${esc(f(m.q3))} − ${esc(f(m.q1))} = <b>${iq}</b>.`,
      };
    },
    tryMore,
    tryThree: {
      en: "Try at least three different values.",
      es: "Prueba al menos tres valores diferentes.",
    },
    outlierLesson: {
      en: `The range follows the one far-away score. The IQR stayed ${f(S.iqr)}: it measures only the middle half, and no dot in the middle half moved.`,
      es: `El rango sigue al único puntaje lejano. El RIC se quedó en ${f(S.iqr)}: mide solo la mitad central, y ningún punto de la mitad central se movió.`,
    },
    transferSay: {
      en: `Two classes took the same test. Both medians are ${a.med}. Their box plots are on the same number line.`,
      es: `Dos clases hicieron el mismo examen. Las dos medianas son ${a.med}. Sus diagramas de caja están en la misma recta numérica.`,
    },
    transferQ: {
      en: "Same median. Which class has the smaller IQR, so its middle half is less spread out?",
      es: "La misma mediana. ¿Cuál clase tiene el RIC menor, o sea que su mitad central está menos dispersa?",
    },
    classOption: (k) => ({ en: k.label.en, es: k.label.es }),
    sameOption: {
      en: "Neither: they have the same median, so the same spread",
      es: "Ninguna: tienen la misma mediana, así que la misma dispersión",
    },
    lessSpread,
    moreSpread,
    transferOk: {
      en: `${lessSpread.label.en}: IQR ${lessSpread.q3} − ${lessSpread.q1} = ${lessSpread.iqr}, against ${moreSpread.q3} − ${moreSpread.q1} = ${moreSpread.iqr} for ${moreSpread.label.en}. A center like the median cannot show spread; the range and the IQR can.`,
      es: `${lessSpread.label.es}: RIC ${lessSpread.q3} − ${lessSpread.q1} = ${lessSpread.iqr}, frente a ${moreSpread.q3} − ${moreSpread.q1} = ${moreSpread.iqr} de ${moreSpread.label.es}. Un centro como la mediana no puede mostrar la dispersión; el rango y el RIC sí.`,
    },
    explainLabel: {
      en: "Explain: which class is less spread out, and how do your two numbers show it?",
      es: "Explica: ¿cuál clase está menos dispersa y cómo lo muestran tus dos números?",
    },
    explainFrame: {
      en: "___ is less spread out because its range is ___ and its IQR is ___.",
      es: "___ está menos dispersa porque su rango es ___ y su RIC es ___.",
    },
  };
}
