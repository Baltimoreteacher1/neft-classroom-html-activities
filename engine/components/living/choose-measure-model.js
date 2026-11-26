// living/choose-measure-model.js — the mathematics and every sentence of the
// choose-measure play (lesson 2-10, choosing the mean or the median).
//
// Pure functions only (no DOM). The idea the play draws: one far-away value
// drags the MEAN toward it and leaves the MEDIAN where the middle of the data
// is, so with an outlier the median describes a typical value better. Every
// number the stage states comes from `mstats` here.

export const MIN_N = 5;
export const MAX_N = 7;
export const MAX_VALUE = 999;

export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const sum = (a) => a.reduce((s, v) => s + v, 0);
const near = (x, y) => Math.abs(x - y) < 1e-9;
const both = (en, es) => ({ en, es });

/** n, total, mean, median (odd n), min, max and the sorted values. */
export function mstats(values) {
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const total = sum(values);
  return {
    n,
    total,
    mean: total / n,
    median: sorted[(n - 1) / 2],
    min: sorted[0],
    max: sorted[n - 1],
    sorted,
  };
}

/** How far the mean sits from the median, as a share of the data's range. */
export const pull = (values) => {
  const s = mstats(values);
  return Math.abs(s.mean - s.median) / (s.max - s.min);
};

/** The value farthest from the median, and its index. */
export function farthest(values) {
  const { median } = mstats(values);
  let idx = 0;
  values.forEach((v, i) => {
    if (Math.abs(v - median) > Math.abs(values[idx] - median)) idx = i;
  });
  return { idx, value: values[idx] };
}

/** How many values lie on the far side of the mean from the median (the "6 of 7"). */
export function outvoted(values) {
  const { mean, median } = mstats(values);
  return values.filter((v) => (mean > median ? v < mean : v > mean)).length;
}

/** "27.6" (rounded to tenths) with a leading "≈" when rounding changed it. */
export function fmt(x) {
  const r = Math.round(x * 10) / 10;
  return `${near(r, x) ? "" : "≈ "}${r}`;
}

/** A number inside a sentence: "27", or "about 27.6" (EN) / "alrededor de 27.6" (ES) when rounded. */
export function mw(x, lang) {
  const r = Math.round(x * 10) / 10;
  if (near(r, x)) return String(r);
  return `${lang === "es" ? "alrededor de" : "about"} ${r}`;
}

/** "= 12.4" or "\u2248 27.6": the sign and value that follow `a \u00F7 b`. */
export function eq(x) {
  const r = Math.round(x * 10) / 10;
  return `${near(r, x) ? "=" : "\u2248"} ${r}`;
}

/** Dots sit on three levels by rank so close neighbours never overlap. */
export function ranks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  order.forEach(([, i], r) => {
    out[i] = r;
  });
  return out;
}

/** A tick step and a line that holds every given number, ending on step multiples. */
export function axisFor(nums) {
  const lo0 = Math.min(...nums);
  const hi0 = Math.max(...nums);
  for (const step of [1, 2, 5, 10, 20, 50]) {
    const lo = Math.max(0, Math.floor((lo0 - 1) / step) * step);
    const hi = Math.ceil((hi0 + 1) / step) * step;
    if ((hi - lo) / step <= 11) return { lo, hi, step };
  }
  return null;
}

/** A data set the stage can draw: odd count, whole values, no value three times. */
export function okSet(values) {
  if (!Array.isArray(values) || values.length < MIN_N || values.length > MAX_N) return null;
  if (values.length % 2 === 0) return null;
  const vals = values.map(Number);
  if (!vals.every((v) => okInt(v, 0, MAX_VALUE)) || Math.min(...vals) === Math.max(...vals))
    return null;
  if (vals.some((v) => vals.filter((x) => x === v).length > 2)) return null;
  return vals;
}

const pairOf = (p, maxLen) =>
  p && typeof p.en === "string" && p.en.trim() && typeof p.es === "string" && p.es.trim()
    ? { en: p.en.slice(0, maxLen), es: p.es.slice(0, maxLen) }
    : null;

const nounOf = (x) => {
  const ok = (y) => y && typeof y.one === "string" && y.one && typeof y.many === "string" && y.many;
  return ok(x?.en) && ok(x?.es) ? { en: x.en, es: x.es } : null;
};

export const OUTLIER_PULL = 0.1; // an outlier moves mean and median apart by at least this share of the range
export const QUIET_PULL = 0.05; // data with no outlier keeps them within this share

export function validateChooseMeasure(cfg) {
  const values = okSet(cfg?.values);
  const a = okSet(cfg?.sets?.a?.values);
  const b = okSet(cfg?.sets?.b?.values);
  const tv = okSet(cfg?.transfer?.values);
  const unit = pairOf(cfg?.unit, 20);
  const tunit = pairOf(cfg?.transfer?.unit, 20);
  const story = pairOf(cfg?.story, 300);
  const tstory = pairOf(cfg?.transfer?.story, 300);
  const item = nounOf(cfg?.item);
  const nameA = pairOf(cfg?.sets?.a?.name, 24);
  const nameB = pairOf(cfg?.sets?.b?.name, 24);
  if (
    !values ||
    !a ||
    !b ||
    !tv ||
    !unit ||
    !tunit ||
    !story ||
    !tstory ||
    !item ||
    !nameA ||
    !nameB
  )
    return null;
  // The authored claims must be true of the authored numbers.
  if (pull(values) < OUTLIER_PULL || pull(tv) < OUTLIER_PULL || pull(b) < OUTLIER_PULL) return null;
  if (pull(a) > QUIET_PULL) return null;
  // Every authored outlier is a HIGH one, so the mean sits above the median.
  const high = [values, tv, b].every((d) => mstats(d).mean > mstats(d).median);
  if (!high) return null;
  const idx = Number(cfg.editIndex);
  if (!okInt(idx, 0, values.length - 1) || farthest(values).idx !== idx) return null;
  const others = values.filter((_, i) => i !== idx);
  const lo = Number(cfg.edit?.min);
  const hi = Number(cfg.edit?.max);
  // Keeping the edited value above every other one keeps the median fixed.
  if (!okInt(lo, 0, MAX_VALUE) || !okInt(hi, 0, MAX_VALUE) || lo < Math.max(...others) || hi <= lo)
    return null;
  if (values[idx] < lo || values[idx] > hi) return null;
  const axes = {
    main: axisFor([...values, lo, hi]),
    sets: axisFor([...a, ...b]),
    transfer: axisFor(tv),
  };
  if (!axes.main || !axes.sets || !axes.transfer) return null;
  return {
    values,
    unit,
    story,
    item,
    idx,
    edit: { min: lo, max: hi },
    axes,
    sets: { a: { name: nameA, values: a }, b: { name: nameB, values: b } },
    transfer: { values: tv, unit: tunit, story: tstory },
  };
}

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function chooseMeasureCopy(v) {
  const { values, unit, item, idx, sets, transfer } = v;
  const S = mstats(values);
  const out = values[idx];
  const m = (x) => fmt(x);
  const [A, B] = [sets.a, sets.b];
  const [SA, SB] = [mstats(A.values), mstats(B.values)];
  const TS = mstats(transfer.values);
  const tOut = farthest(transfer.values).value;
  const nth = `${idx + 1}`;
  const itemName = { en: `${cap(item.en.one)} ${nth}`, es: `${cap(item.es.one)} ${nth}` };
  const sorted = S.sorted.join(", ");
  const ariaFor = (lang) =>
    lang === "en"
      ? `Dot plot of ${S.n} ${item.en.many} in ${unit.en}: ${sorted}. The median is ${S.median}. The mean is ${mw(S.mean, "en")}, pulled toward ${out}, which sits far from the other values.`
      : `Diagrama de puntos de ${S.n} ${item.es.many} en ${unit.es}: ${sorted}. La mediana es ${S.median}. La media es ${mw(S.mean, "es")}, jalada hacia ${out}, que está lejos de los demás valores.`;
  const dirWord = { en: { up: "up", cmp: "higher" }, es: { up: "arriba", cmp: "mayor" } };
  const k = outvoted(values);
  const kT = outvoted(transfer.values);
  return {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: both("Which measure tells the story?", "¿Qué medida cuenta la historia?"),
    ariaLabel: both(ariaFor("en"), ariaFor("es")),
    printSummary: both(
      `Data: ${values.join(", ")} ${unit.en}. Mean: ${S.total} ÷ ${S.n} ${eq(S.mean)}. Median: in order ${sorted}, the middle value is ${S.median}. The ${out} pulls the mean above ${k} of the ${S.n} ${item.en.many}, so the median shows a typical ${item.en.one} better.`,
      `Datos: ${values.join(", ")} ${unit.es}. Media: ${S.total} ÷ ${S.n} ${eq(S.mean)}. Mediana: en orden ${sorted}, el valor del medio es ${S.median}. El ${out} jala la media por encima de ${k} de los ${S.n} ${item.es.many}, así que la mediana muestra mejor un ${item.es.one} típico.`,
    ),
    scene: {
      situate: both("The data", "Los datos"),
      predict: both("Predict", "Predice"),
      move: both("Move one value", "Mueve un valor"),
      connect: both("Mean and median", "Media y mediana"),
      sets: both("Does it always matter?", "¿Siempre importa?"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    meanTag: (x) => both(`mean ${m(x)}`, `media ${m(x)}`),
    medianTag: (x) => both(`median ${x}`, `mediana ${x}`),
    unit: (u) => u,
    list: values.join(", "),
    situateSay: both(
      `${v.story.en} Each dot is one ${item.en.one}. Look for a value that sits far from the rest.`,
      `${v.story.es} Cada punto es un ${item.es.one}. Busca un valor que esté lejos de los demás.`,
    ),
    predictSay: both(
      `In order the ${item.en.many} are ${sorted}. The middle value, ${S.median}, is the median. Now think about the mean: the total shared equally.`,
      `En orden, los ${item.es.many} son ${sorted}. El valor del medio, ${S.median}, es la mediana. Ahora piensa en la media: el total repartido por igual.`,
    ),
    predictQ: both(
      `Will the mean be higher than ${S.median}, lower than ${S.median}, or exactly ${S.median}?`,
      `¿La media será mayor que ${S.median}, menor que ${S.median} o exactamente ${S.median}?`,
    ),
    predictOptions: [
      {
        kind: "higher",
        correct: true,
        label: both(`Higher than ${S.median}`, `Mayor que ${S.median}`),
      },
      { kind: "lower", label: both(`Lower than ${S.median}`, `Menor que ${S.median}`) },
      { kind: "same", label: both(`Exactly ${S.median}`, `Exactamente ${S.median}`) },
    ],
    /** Cue for a wrong prediction: a question about the outlier and the total. */
    predictCue: (kind) =>
      kind === "lower"
        ? both(
            `Look at ${out}, far from the rest. Does that value make the total bigger or smaller than a value near ${S.median} would?`,
            `Mira ${out}, lejos de los demás. ¿Ese valor hace que el total sea mayor o menor que uno cercano a ${S.median}?`,
          )
        : both(
            `The mean and the median are found in different ways, so they can differ. How much more does ${out} add to the total than a value near ${S.median}?`,
            `La media y la mediana se hallan de maneras distintas, así que pueden ser diferentes. ¿Cuánto más suma ${out} al total que un valor cercano a ${S.median}?`,
          ),
    predictOk: both(
      `Yes: the mean, ${mw(S.mean, "en")}, is higher. The ${out} counts fully in the total, so it pulls the mean up. Next, move it yourself.`,
      `Sí: la media, ${mw(S.mean, "es")}, es mayor. El ${out} cuenta completo en el total, así que jala la media hacia arriba. Ahora muévelo tú.`,
    ),
    moveSay: both(
      `Move ${itemName.en} up and down. Watch the mean (the triangle) and the median (the dashed line).`,
      `Mueve el ${item.es.one} ${nth} hacia arriba y hacia abajo. Observa la media (el triángulo) y la mediana (la línea punteada).`,
    ),
    moveLabel: itemName,
    /** Readout (HTML); every interpolated value passes through `esc`. */
    moveRow(val, esc) {
      const vals = values.map((x, i) => (i === idx ? val : x));
      const s = mstats(vals);
      return both(
        `${esc(itemName.en)} = <b>${esc(val)}</b>. Mean <b>${esc(m(s.mean))}</b>, median <b>${esc(s.median)}</b>.`,
        `${esc(itemName.es)} = <b>${esc(val)}</b>. Media <b>${esc(m(s.mean))}</b>, mediana <b>${esc(s.median)}</b>.`,
      );
    },
    moveTry: (left) =>
      both(
        left === 1 ? "Try one more value." : "Try two more values.",
        left === 1 ? "Prueba un valor más." : "Prueba dos valores más.",
      ),
    moveTryAll: both(
      "Try at least three different values.",
      "Prueba al menos tres valores diferentes.",
    ),
    moveDone(lo, hi) {
      const at = (x, lang) => mw(mstats(values.map((y, i) => (i === idx ? x : y))).mean, lang);
      return both(
        `${itemName.en} went from ${lo} to ${hi}: the mean moved from ${at(lo, "en")} to ${at(hi, "en")}, but the median stayed ${S.median}. The mean follows a far-away value; the median does not.`,
        `El ${item.es.one} ${nth} pasó de ${lo} a ${hi}: la media pasó de ${at(lo, "es")} a ${at(hi, "es")}, pero la mediana se quedó en ${S.median}. La media sigue a un valor lejano; la mediana no.`,
      );
    },
    connectSay: both(
      `The mean, ${mw(S.mean, "en")}, is ${dirWord.en.cmp} than ${k} of the ${S.n} ${item.en.many} because ${out} pulled it ${dirWord.en.up}. The median, ${S.median}, sits in the middle of the ${item.en.many}, so it shows a typical ${item.en.one} better.`,
      `La media, ${mw(S.mean, "es")}, es ${dirWord.es.cmp} que ${k} de los ${S.n} ${item.es.many} porque ${out} la jaló hacia ${dirWord.es.up}. La mediana, ${S.median}, está en el medio de los ${item.es.many}, así que muestra mejor un ${item.es.one} típico.`,
    ),
    connectExpr: both(
      `mean ${m(S.mean)} · median ${S.median}`,
      `media ${m(S.mean)} · mediana ${S.median}`,
    ),
    connectCap: both(
      `${k} of ${S.n} ${item.en.many} are below the mean`,
      `${k} de ${S.n} ${item.es.many} están por debajo de la media`,
    ),
    connectRule: both(
      "Rule: if the data has an outlier, use the median (and the IQR for spread). If it has no outlier, use the mean (and the MAD).",
      "Regla: si los datos tienen un valor atípico, usa la mediana (y el rango intercuartil para la dispersión). Si no lo tienen, usa la media (y la desviación media absoluta).",
    ),
    setsSay: both(
      `Two sets of ${SA.n} values. Look at the dots before you choose.`,
      `Dos conjuntos de ${SA.n} valores. Mira los puntos antes de elegir.`,
    ),
    setsQ: both(
      "Which set can use its mean to describe a typical value?",
      "¿Cuál conjunto puede usar su media para describir un valor típico?",
    ),
    setsOptions: [
      { kind: "quiet", correct: true, label: A.name },
      { kind: "outlier", label: B.name },
      { kind: "both", label: both("Both sets, the same", "Los dos conjuntos por igual") },
    ],
    setsCue: (kind) =>
      kind === "outlier"
        ? both(
            `In ${B.name.en} the total is ${SB.total} and ${SB.total} ÷ ${SB.n} ${eq(SB.mean)}. How many of the ${SB.n} values are below that mean?`,
            `En «${B.name.es}» el total es ${SB.total} y ${SB.total} ÷ ${SB.n} ${eq(SB.mean)}. ¿Cuántos de los ${SB.n} valores están por debajo de esa media?`,
          )
        : both(
            `Look for a value that sits far from the rest. Does ${A.name.en} have one like ${B.name.en} does?`,
            `Busca un valor que esté lejos de los demás. ¿«${A.name.es}» tiene uno como «${B.name.es}»?`,
          ),
    setsOk: both(
      `${A.name.en}: mean ${mw(SA.mean, "en")}, median ${SA.median}. ${B.name.en}: mean ${mw(SB.mean, "en")}, median ${SB.median}. The ${farthest(B.values).value} pulls the mean of ${B.name.en} away from the typical values, so use the mean only when there is no outlier.`,
      `«${A.name.es}»: media ${mw(SA.mean, "es")}, mediana ${SA.median}. «${B.name.es}»: media ${mw(SB.mean, "es")}, mediana ${SB.median}. El ${farthest(B.values).value} aleja la media de «${B.name.es}» de los valores típicos, así que usa la media solo cuando no hay valores atípicos.`,
    ),
    setName: (s) => s.name,
    transferSay: both(
      `${transfer.story.en} The mean and the median are marked.`,
      `${transfer.story.es} Se marcan la media y la mediana.`,
    ),
    transferQ: both(
      `Which measure best describes a typical ${item.en.one}?`,
      `¿Qué medida describe mejor un ${item.es.one} típico?`,
    ),
    transferOptions: [
      {
        kind: "median",
        correct: true,
        label: both(
          `The median, ${TS.median} ${transfer.unit.en}`,
          `La mediana, ${TS.median} ${transfer.unit.es}`,
        ),
      },
      {
        kind: "mean",
        label: both(
          `The mean, ${m(TS.mean)} ${transfer.unit.en}`,
          `La media, ${m(TS.mean)} ${transfer.unit.es}`,
        ),
      },
      {
        kind: "either",
        label: both(
          "Either one: they describe the data equally well",
          "Cualquiera: describen igual de bien los datos",
        ),
      },
    ],
    transferCue: (kind) =>
      kind === "mean"
        ? both(
            `${kT} of the ${TS.n} values are below the mean, ${mw(TS.mean, "en")}. Does it sit near most of the data?`,
            `${kT} de los ${TS.n} valores están por debajo de la media, ${mw(TS.mean, "es")}. ¿Está cerca de la mayoría de los datos?`,
          )
        : both(
            `The mean is ${mw(TS.mean, "en")} and the median is ${TS.median}. Which one sits near most of the ${TS.n} values?`,
            `La media es ${mw(TS.mean, "es")} y la mediana es ${TS.median}. ¿Cuál está cerca de la mayoría de los ${TS.n} valores?`,
          ),
    transferOk: both(
      `Yes: the median, ${TS.median}, sits among the ${TS.n - 1} similar values. The ${tOut} pulls the mean up to ${mw(TS.mean, "en")}.`,
      `Sí: la mediana, ${TS.median}, está entre los ${TS.n - 1} valores parecidos. El ${tOut} jala la media hasta ${mw(TS.mean, "es")}.`,
    ),
    explainLabel: both(
      "Explain: how do you decide between the mean and the median?",
      "Explica: ¿cómo decides entre la media y la mediana?",
    ),
    explainFrame: both(
      "I use the median when the data has ___, because the mean ___.",
      "Uso la mediana cuando los datos tienen ___, porque la media ___.",
    ),
  };
}
