// living/median-fold-model.js — the mathematics (and every sentence) of the
// median-fold play, plus the five-number summary the box-plot plays share.
//
// Pure functions only (no DOM): every number the play shows a student is
// computed here, so median-fold.test.mjs can check each one in node.

import { near, okInt, placeCorrect, sum } from "./mean-balance-model.js";

export { near, okInt, placeCorrect, sum };

export const sortAsc = (a) => [...a].sort((x, y) => x - y);
export const isSorted = (a) => a.every((x, i) => i === 0 || a[i - 1] <= x);
export const meanOf = (a) => sum(a) / a.length;

/** Median of an already sorted list. */
export function medianOf(sorted) {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/** "5", "12.86", "≈ 12.86" — repeating or long decimals are marked ≈. */
export function fmtNum(v) {
  const r = Math.round(v * 100) / 100;
  return `${near(r, v) ? "" : "≈ "}${r}`;
}

/**
 * The five-number summary. Quartiles are the medians of the lower and upper
 * halves; an odd count leaves the median out of both halves (the lesson's rule).
 */
export function fiveNumber(values) {
  const sorted = sortAsc(values);
  const n = sorted.length;
  const h = Math.floor(n / 2);
  const lower = sorted.slice(0, h);
  const upper = sorted.slice(n - h);
  const q1 = medianOf(lower);
  const q3 = medianOf(upper);
  const min = sorted[0];
  const max = sorted[n - 1];
  return {
    sorted,
    n,
    min,
    max,
    med: medianOf(sorted),
    q1,
    q3,
    lower,
    upper,
    range: max - min,
    iqr: q3 - q1,
  };
}

/** Keep the first value of each distinct number; null when fewer than three remain. */
export function distinctChoices(cands, max = 4) {
  const out = [];
  for (const c of cands) {
    if (out.length < max && Number.isFinite(c.value) && !out.some((o) => near(o.value, c.value)))
      out.push(c);
  }
  return out.length >= 3 ? out : null;
}

/** Choices for "the median of an ODD list": the median plus real misconceptions. */
export function oddChoices(values) {
  const s = sortAsc(values);
  const n = s.length;
  return distinctChoices([
    { kind: "median", value: medianOf(s), correct: true },
    { kind: "written", value: values[(n - 1) / 2] },
    { kind: "mean", value: meanOf(values) },
    { kind: "midrange", value: (s[0] + s[n - 1]) / 2 },
    { kind: "max", value: s[n - 1] },
  ]);
}

/** Choices for "the median of an EVEN list". */
export function evenChoices(values) {
  const s = sortAsc(values);
  const n = s.length;
  return distinctChoices([
    { kind: "median", value: medianOf(s), correct: true },
    { kind: "lower", value: s[n / 2 - 1] },
    { kind: "upper", value: s[n / 2] },
    { kind: "mean", value: meanOf(values) },
    { kind: "midrange", value: (s[0] + s[n - 1]) / 2 },
  ]);
}

/** Can the student take this card next? Only a smallest remaining card. */
export function isNextSmallest(values, placed, id) {
  if (placed.includes(id) || !(id >= 0 && id < values.length)) return false;
  const rest = values.filter((_, i) => !placed.includes(i));
  return values[id] === Math.min(...rest);
}

/** A saved `placed` list is trusted only if replaying it follows the rule. */
export function validPlaced(values, placed) {
  if (!Array.isArray(placed) || placed.length > values.length) return false;
  const so_far = [];
  for (const id of placed) {
    if (!Number.isInteger(id) || !isNextSmallest(values, so_far, id)) return false;
    so_far.push(id);
  }
  return true;
}

/** Card ids in least-to-greatest order (ties keep their written order). */
export const sortedIds = (values) =>
  values.map((_, i) => i).sort((a, b) => values[a] - values[b] || a - b);

function listOf(a, nMin, nMax, parity) {
  const v = Array.isArray(a) ? a.map(Number) : [];
  if (v.length < nMin || v.length > nMax || v.length % 2 !== parity) return null;
  return v.every((x) => okInt(x, 0, 999)) ? v : null;
}

const pairOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 200), es: String(s.es || s.en).slice(0, 200) }
    : null;

export const MAX_CARDS = 9;

export function validateMedianFold(cfg) {
  const values = listOf(cfg?.values, 5, MAX_CARDS, 1);
  if (!values || isSorted(values) || !oddChoices(values)) return null;
  const even = listOf(cfg?.even, 4, 8, 0);
  if (!even) return null;
  const es = sortAsc(even);
  if (es[es.length / 2 - 1] === es[es.length / 2] || !evenChoices(even)) return null;
  const wv = listOf(cfg?.whatIf?.values, 5, MAX_CARDS, 1);
  const wmax = Number(cfg?.whatIf?.max);
  if (!wv) return null;
  const ws = sortAsc(wv);
  if (ws[ws.length - 1] === ws[ws.length - 2] || !okInt(wmax, ws[ws.length - 1] + 20, 999)) {
    return null;
  }
  const tv = listOf(cfg?.transfer?.values, 5, MAX_CARDS, 1);
  if (!tv || isSorted(tv) || !oddChoices(tv)) return null;
  return {
    values,
    even,
    whatIf: { values: ws, max: wmax },
    transfer: { values: tv, story: pairOf(cfg.transfer.story) },
    story: pairOf(cfg.story),
  };
}

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function medianFoldCopy(v) {
  const f = fmtNum;
  const n = v.values.length;
  const S = fiveNumber(v.values);
  const E = fiveNumber(v.even);
  const ne = v.even.length;
  const list = v.values.join(", ");
  const sortedList = S.sorted.join(", ");
  const evenList = E.sorted.join(", ");
  const W = v.whatIf.values;
  const wmed = medianOf(W);
  const tv = v.transfer.values;
  const TS = fiveNumber(tv);
  const lo = E.sorted[ne / 2 - 1];
  const hi = E.sorted[ne / 2];
  const story = v.story || { en: `${n} values:`, es: `${n} valores:` };
  const tstory = v.transfer.story || { en: "A new data set:", es: "Un conjunto de datos nuevo:" };
  const tryMore = (left) => ({
    en: left === 1 ? "Try one more value." : "Try two more values.",
    es: left === 1 ? "Prueba un valor más." : "Prueba dos valores más.",
  });
  /** A cue for a wrong pick on an odd list: names what the pick IS, then asks. */
  const cueOdd = (opt, vals) => {
    const k = vals.length;
    const s = sortAsc(vals);
    const x = f(opt.value);
    const q = {
      en: "Which card is in the middle once the cards are in order?",
      es: "¿Cuál tarjeta queda en el medio cuando las tarjetas están en orden?",
    };
    if (opt.kind === "written")
      return {
        en: `${x} is the card in the middle of the list as it was written. But the median needs the data in order first. If you order the cards, is ${x} still in the middle?`,
        es: `${x} es la tarjeta del medio de la lista como se escribió. Pero la mediana necesita los datos ordenados primero. Si ordenas las tarjetas, ¿${x} sigue en el medio?`,
      };
    if (opt.kind === "mean")
      return {
        en: `${x} is the mean: the total ÷ ${k}, what each would be if all shared equally. The median is a different idea. ${q.en}`,
        es: `${x} es la media: el total ÷ ${k}, lo que le tocaría a cada uno si todos repartieran por igual. La mediana es otra idea. ${q.es}`,
      };
    if (opt.kind === "midrange")
      return {
        en: `${x} is halfway between the smallest, ${s[0]}, and the greatest, ${s[k - 1]}. The median is the middle card in order, not the number halfway between the ends. ${q.en}`,
        es: `${x} está a mitad de camino entre el menor, ${s[0]}, y el mayor, ${s[k - 1]}. La mediana es la tarjeta del medio en orden, no el número a mitad de camino entre los extremos. ${q.es}`,
      };
    return {
      en: `${x} is the greatest value, at the end of the ordered list, not the middle. ${q.en}`,
      es: `${x} es el valor mayor, al final de la lista ordenada, no en el medio. ${q.es}`,
    };
  };
  const cueEven = (opt) => {
    const x = f(opt.value);
    const other = near(opt.value, lo) ? hi : lo;
    if (opt.kind === "lower" || opt.kind === "upper")
      return {
        en: `${x} is one of the two middle values; ${other} is the other. Neither is more "the middle" than the other. What number is exactly halfway between them?`,
        es: `${x} es uno de los dos valores del medio; ${other} es el otro. Ninguno es "el medio" más que el otro. ¿Qué número está exactamente a la mitad entre ellos?`,
      };
    if (opt.kind === "mean")
      return {
        en: `${x} is the mean: the total ÷ ${ne}. The median uses only the two middle values. Which two are those, and what is halfway between them?`,
        es: `${x} es la media: el total ÷ ${ne}. La mediana usa solo los dos valores del medio. ¿Cuáles son, y qué número está a la mitad entre ellos?`,
      };
    return {
      en: `${x} is halfway between the smallest, ${E.min}, and the greatest, ${E.max}. The median is halfway between the two MIDDLE values. Which two are those?`,
      es: `${x} está a mitad de camino entre el menor, ${E.min}, y el mayor, ${E.max}. La mediana está a la mitad entre los dos valores DEL MEDIO. ¿Cuáles son?`,
    };
  };
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: {
      en: "The median: the middle of the ordered data",
      es: "La mediana: el medio de los datos ordenados",
    },
    ariaLabel: {
      en: `Cards for the values ${list}. In order they are ${sortedList}. Pairing the cards from both ends leaves ${f(S.med)} alone in the middle.`,
      es: `Tarjetas con los valores ${list}. En orden son ${sortedList}. Al emparejar las tarjetas desde los dos extremos, queda ${f(S.med)} solo en el medio.`,
    },
    printSummary: {
      en: `Data: ${list}. In order: ${sortedList}. There are ${n} values, so the median is the middle one: ${f(S.med)}. With an even count such as ${evenList}, the median is the mean of the two middle values: (${lo} + ${hi}) ÷ 2 = ${f(E.med)}.`,
      es: `Datos: ${list}. En orden: ${sortedList}. Hay ${n} valores, así que la mediana es el del medio: ${f(S.med)}. Con una cantidad par, como ${evenList}, la mediana es la media de los dos valores del medio: (${lo} + ${hi}) ÷ 2 = ${f(E.med)}.`,
    },
    scene: {
      predict: { en: "Predict", es: "Predice" },
      order: { en: "Put in order", es: "Ordena" },
      fold: { en: "Fold in", es: "Dobla hacia adentro" },
      even: { en: "Even count", es: "Cantidad par" },
      whatIf: { en: "What if…", es: "¿Y si…?" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    medianWord: { en: "median", es: "mediana" },
    list,
    sortedList,
    cueOdd,
    cueEven,
    predictSay: {
      en: `${story.en} ${list}. The cards are in the order they were written down. Which card is the median, the middle value?`,
      es: `${story.es} ${list}. Las tarjetas están en el orden en que se anotaron. ¿Cuál tarjeta es la mediana, el valor del medio?`,
    },
    predictQ: { en: "The median of this data is…", es: "La mediana de estos datos es…" },
    predictOk: {
      en: "Good thinking. Now check it: put the cards in order from least to greatest, then fold the list in half.",
      es: "Buen razonamiento. Ahora compruébalo: pon las tarjetas en orden de menor a mayor y luego dobla la lista por la mitad.",
    },
    orderSay: {
      en: "A middle only exists once the data are in order. Tap the cards from least to greatest. Each card you pick slides to the next spot on the left.",
      es: "Un medio solo existe cuando los datos están en orden. Toca las tarjetas de menor a mayor. Cada tarjeta que eliges se desliza al siguiente lugar de la izquierda.",
    },
    orderHow: {
      en: "Pick the smallest card that is still waiting.",
      es: "Elige la tarjeta menor que todavía espera.",
    },
    orderCue: (x) => ({
      en: `${x} is not the smallest card left. Is there a smaller one still waiting? Look at the cards that are not placed yet.`,
      es: `${x} no es la tarjeta menor que queda. ¿Hay una más pequeña esperando? Mira las tarjetas que todavía no colocaste.`,
    }),
    orderDone: {
      en: `In order: ${sortedList}. Now there is a middle to find.`,
      es: `En orden: ${sortedList}. Ahora hay un medio que encontrar.`,
    },
    foldSay: {
      en: `Fold the list in half: pair the two outer cards, then the next two, and keep going. Press "Pair the ends" each time.`,
      es: `Dobla la lista por la mitad: empareja las dos tarjetas de los extremos, luego las dos siguientes, y sigue. Presiona «Une los extremos» cada vez.`,
    },
    foldBtn: { en: "Pair the ends", es: "Une los extremos" },
    foldStep: (a, b) => ({
      en: `Paired ${a} with ${b}. Keep folding in.`,
      es: `Emparejaste ${a} con ${b}. Sigue doblando hacia adentro.`,
    }),
    foldDone: {
      en: `One card is left alone, with the same number of cards on each side: ${f(S.med)}. The median is ${f(S.med)}. Half the values are at or below it and half are at or above it.`,
      es: `Queda una tarjeta sola, con la misma cantidad de tarjetas a cada lado: ${f(S.med)}. La mediana es ${f(S.med)}. La mitad de los valores está en él o por debajo, y la otra mitad en él o por encima.`,
    },
    evenSay: {
      en: `Now an even count: ${evenList}. There are ${ne} cards, so no single card is in the middle.`,
      es: `Ahora una cantidad par: ${evenList}. Hay ${ne} tarjetas, así que ninguna tarjeta queda sola en el medio.`,
    },
    evenQ: { en: `The median of ${evenList} is…`, es: `La mediana de ${evenList} es…` },
    evenOk: {
      en: `Yes. Folding in leaves two middle values, ${lo} and ${hi}. The median is halfway between them: (${lo} + ${hi}) ÷ 2 = ${f(E.med)}.${E.sorted.includes(E.med) ? "" : ` ${f(E.med)} is not one of the data values, and that is fine.`}`,
      es: `Sí. Al doblar quedan dos valores del medio, ${lo} y ${hi}. La mediana está a la mitad entre ellos: (${lo} + ${hi}) ÷ 2 = ${f(E.med)}.${E.sorted.includes(E.med) ? "" : ` ${f(E.med)} no es uno de los valores de los datos, y no pasa nada.`}`,
    },
    evenExpr: `(${lo} + ${hi}) ÷ 2 = ${f(E.med)}`,
    markLabel: (x) => ({ en: `median = ${f(x)}`, es: `mediana = ${f(x)}` }),
    whatIfSay: {
      en: `New data: ${W.join(", ")}. The median is ${f(wmed)}. Make the greatest value bigger, up to ${v.whatIf.max}, and watch the median.`,
      es: `Datos nuevos: ${W.join(", ")}. La mediana es ${f(wmed)}. Haz más grande el valor mayor, hasta ${v.whatIf.max}, y observa la mediana.`,
    },
    greatest: { en: "Greatest value", es: "Valor mayor" },
    whatIfRow: (g, vals, esc) => {
      const mean = esc(f(meanOf(vals)));
      const m = esc(f(medianOf(sortAsc(vals))));
      return {
        en: `Greatest = <b>${esc(g)}</b>. Median = <b>${m}</b>: the middle card did not change. Mean = ${mean}.`,
        es: `Valor mayor = <b>${esc(g)}</b>. Mediana = <b>${m}</b>: la tarjeta del medio no cambió. Media = ${mean}.`,
      };
    },
    tryMore,
    tryThree: {
      en: "Try at least three different values.",
      es: "Prueba al menos tres valores diferentes.",
    },
    whatIfLesson: {
      en: `The greatest value changed a lot, but the median stayed ${f(wmed)}: it depends on the middle position, not on how far away the ends are. The mean was pulled along. That is why the median describes a typical value when one value is far from the rest.`,
      es: `El valor mayor cambió mucho, pero la mediana siguió siendo ${f(wmed)}: depende de la posición del medio, no de qué tan lejos estén los extremos. La media sí se movió. Por eso la mediana describe un valor típico cuando un valor está muy lejos de los demás.`,
    },
    transferSay: {
      en: `${tstory.en} ${tv.join(", ")}. They are in the order they happened. Find the median.`,
      es: `${tstory.es} ${tv.join(", ")}. Están en el orden en que ocurrieron. Halla la mediana.`,
    },
    transferQ: { en: "The median is…", es: "La mediana es…" },
    transferOk: {
      en: `Yes. In order: ${TS.sorted.join(", ")}. The middle value, number ${(TS.n + 1) / 2} of ${TS.n}, is ${f(TS.med)}. A typical value is about ${f(TS.med)}.`,
      es: `Sí. En orden: ${TS.sorted.join(", ")}. El valor del medio, el número ${(TS.n + 1) / 2} de ${TS.n}, es ${f(TS.med)}. Un valor típico es de alrededor de ${f(TS.med)}.`,
    },
    explainLabel: {
      en: "Explain: why do you put the data in order before you find the median?",
      es: "Explica: ¿por qué pones los datos en orden antes de hallar la mediana?",
    },
    explainFrame: {
      en: "The median is the ___ value, so first I must ___.",
      es: "La mediana es el valor ___, así que primero tengo que ___.",
    },
  };
}
