// living/mad-spread-model.js — the mathematics and every sentence of the
// mad-spread play (lesson 2-9, mean absolute deviation).
//
// Pure functions only (no DOM). The idea the play draws: each value's distance
// from the mean is a bar; laid end to end the bars have one total; shared
// equally among the values, each share is the MAD — the same fair-share idea as
// the mean itself. Every number the stage states comes from `madStats` here.

export const MIN_N = 3;
export const MAX_N = 5; // rows of distance bars the stage reserves
export const MAX_VALUE = 99;
export const MAX_RANGE = 24;

export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const sum = (a) => a.reduce((s, v) => s + v, 0);
const near = (x, y) => Math.abs(x - y) < 1e-9;
const MINUS = "−";

/** Mean, distances, their total and the MAD of a list of numbers. */
export function madStats(values) {
  const n = values.length;
  const total = sum(values);
  const mean = total / n;
  const dist = values.map((v) => Math.abs(v - mean));
  const sumd = sum(dist);
  return {
    n,
    total,
    mean,
    dist,
    sumd,
    mad: sumd / n,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/** "2.4", "0.4", "≈ 0.67": two decimals at most, approximate marked. */
export function fmt(x) {
  const r = Math.round(x * 100) / 100;
  return `${near(r, x) ? "" : "≈ "}${r}`;
}

/** "= 2.4" or "\u2248 0.67": the sign and value that follow `a \u00F7 b`. */
export function eq(x) {
  const r = Math.round(x * 100) / 100;
  return `${near(r, x) ? "=" : "\u2248"} ${r}`;
}

/**
 * A set of values the stage can draw: whole mean, not all equal. `exact` also
 * requires the MAD to be exact to hundredths (the sets the student reads off the
 * stage); the transfer set may have a repeating MAD, which is shown with \u2248.
 */
export function okSet(values, exact = true) {
  if (!Array.isArray(values) || values.length < MIN_N || values.length > MAX_N) return null;
  const vals = values.map(Number);
  if (!vals.every((v) => okInt(v, 0, MAX_VALUE))) return null;
  const s = madStats(vals);
  if (!Number.isInteger(s.mean) || s.sumd === 0) return null;
  if (exact && (s.sumd * 100) % s.n !== 0) return null;
  return vals;
}

/** A tick step that keeps a number line to about nine labels. */
export function stepFor(range) {
  for (const s of [1, 2, 5, 10]) if (range / s <= 9) return s;
  return 20;
}

/**
 * One number line wide enough for every set: padded past the data until the
 * line is at least as long as the longest total distance, so the distance bars
 * laid end to end never run off it.
 */
export function axisFor(sets) {
  const stats = sets.map(madStats);
  let lo0 = Math.min(...stats.map((s) => s.min));
  let hi0 = Math.max(...stats.map((s) => s.max));
  const need = Math.max(...stats.map((s) => s.sumd));
  let pad = 1;
  while (hi0 - lo0 + 2 * pad < need) pad += 1;
  lo0 -= pad;
  hi0 += pad;
  if (lo0 < 0) {
    hi0 -= lo0;
    lo0 = 0;
  }
  const range = hi0 - lo0;
  if (range > MAX_RANGE) return null;
  return { lo: lo0, hi: hi0, step: stepFor(range) };
}

const pairOf = (p, maxLen) =>
  p && typeof p.en === "string" && p.en.trim() && typeof p.es === "string" && p.es.trim()
    ? { en: p.en.slice(0, maxLen), es: p.es.slice(0, maxLen) }
    : null;

export function validateMadSpread(cfg) {
  const values = okSet(cfg?.values);
  const a = okSet(cfg?.compare?.a?.values);
  const b = okSet(cfg?.compare?.b?.values);
  const tv = okSet(cfg?.transfer?.values, false);
  const unit = pairOf(cfg?.unit, 20);
  const story = pairOf(cfg?.story, 300);
  const nameA = pairOf(cfg?.compare?.a?.name, 24);
  const nameB = pairOf(cfg?.compare?.b?.name, 24);
  if (!values || !a || !b || !tv || !unit || !story || !nameA || !nameB) return null;
  const [sa, sb] = [madStats(a), madStats(b)];
  // The comparison is only honest when the means match and the spreads do not.
  if (a.length !== b.length || !near(sa.mean, sb.mean) || near(sa.mad, sb.mad)) return null;
  const axes = { main: axisFor([values]), cmp: axisFor([a, b]), transfer: axisFor([tv]) };
  if (!axes.main || !axes.cmp || !axes.transfer) return null;
  if (!distanceChoices(values) || !madChoices(tv)) return null;
  const tstory = pairOf(cfg.transfer.story, 300) || {
    en: "A new set of scores:",
    es: "Un nuevo conjunto de puntajes:",
  };
  return {
    values,
    unit,
    story,
    axes,
    compare: { a: { name: nameA, values: a }, b: { name: nameB, values: b } },
    transfer: { values: tv, story: tstory },
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

const list = (xs) => xs.join(", ");
const lbl = (s) => ({ en: s, es: s });

/** Predict choices for scene 2: the distances from the mean, and the lists students mix them with. */
export function distanceChoices(values) {
  const s = madStats(values);
  const correct = list(s.dist);
  const out = [{ kind: "distance", correct: true, text: correct }];
  const tries = [
    {
      kind: "signed",
      text: list(values.map((v) => (v < s.mean ? `${MINUS}${s.mean - v}` : String(v - s.mean)))),
    },
    { kind: "fromMin", text: list(values.map((v) => v - s.min)) },
    { kind: "values", text: list(values) },
  ];
  for (const t of tries)
    if (!out.some((o) => o.text === t.text)) out.push({ ...t, correct: false });
  return out.length >= 3 ? out.map((o) => ({ ...o, label: lbl(o.text) })) : null;
}

/** Transfer choices: the MAD, and what students get by skipping or swapping a step. */
export function madChoices(values) {
  const s = madStats(values);
  const out = [{ kind: "mad", correct: true, value: s.mad }];
  for (const t of [
    { kind: "total", value: s.sumd },
    { kind: "signed", value: 0 },
    { kind: "mean", value: s.mean },
  ])
    if (!out.some((o) => near(o.value, t.value))) out.push({ ...t, correct: false });
  return out.length >= 3 ? out.map((o) => ({ ...o, label: lbl(fmt(o.value)) })) : null;
}

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function madSpreadCopy(v) {
  const { values, unit, compare, transfer } = v;
  const S = madStats(values);
  const n = S.n;
  const f = fmt;
  const [A, B] = [compare.a, compare.b];
  const [SA, SB] = [madStats(A.values), madStats(B.values)];
  const T = madStats(transfer.values);
  const plus = (xs) => xs.join(" + ");
  const both = (en, es) => ({ en, es });
  const away = (val, d, mean) =>
    both(`${val} is ${d} away from the mean, ${mean}.`, `${val} está a ${d} de la media, ${mean}.`);
  const firstBelow = values.find((x) => x < S.mean);
  const ariaFor = (lang) =>
    lang === "en"
      ? `Number line with the scores ${list(values)} and the mean ${S.mean}. Their distances from the mean are ${list(S.dist)}. Laid end to end the distances total ${S.sumd}; shared equally among ${n} that is ${f(S.mad)}, the mean absolute deviation.`
      : `Recta numérica con los puntajes ${list(values)} y la media ${S.mean}. Sus distancias a la media son ${list(S.dist)}. Puestas una tras otra suman ${S.sumd}; repartidas por igual entre ${n} son ${f(S.mad)}, la desviación media absoluta.`;
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: { en: "How spread out is the data?", es: "¿Qué tan dispersos están los datos?" },
    ariaLabel: { en: ariaFor("en"), es: ariaFor("es") },
    printSummary: {
      en: `Data: ${list(values)}, mean ${S.mean}. Distances from the mean: ${list(S.dist)}. They total ${plus(S.dist)} = ${S.sumd}. Shared equally among ${n}: ${S.sumd} ÷ ${n} = ${f(S.mad)}. That is the mean absolute deviation (MAD): the average distance from the mean.`,
      es: `Datos: ${list(values)}, media ${S.mean}. Distancias a la media: ${list(S.dist)}. Suman ${plus(S.dist)} = ${S.sumd}. Repartidas por igual entre ${n}: ${S.sumd} ÷ ${n} = ${f(S.mad)}. Esa es la desviación media absoluta (MAD): la distancia promedio a la media.`,
    },
    scene: {
      situate: both("The data", "Los datos"),
      predict: both("Predict", "Predice"),
      draw: both("Draw the distances", "Dibuja las distancias"),
      share: both("Share the distance", "Reparte la distancia"),
      compare: both("Same mean?", "¿Misma media?"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    mean: both("mean", "media"),
    away: (val, d) => both(`${val}: ${d} away`, `${val}: a ${d}`),
    situateSay: both(
      `${v.story.en} Each score is a dot on the number line. The mean is ${S.mean}: ${plus(values)} = ${S.total}, and ${S.total} ÷ ${n} = ${S.mean}.`,
      `${v.story.es} Cada puntaje es un punto en la recta numérica. La media es ${S.mean}: ${plus(values)} = ${S.total}, y ${S.total} ÷ ${n} = ${S.mean}.`,
    ),
    list: list(values),
    predictSay: both(
      `How far is each score from the mean, ${S.mean}? Look at the number line and count the steps from each dot to the mean.`,
      `¿Qué tan lejos está cada puntaje de la media, ${S.mean}? Mira la recta numérica y cuenta los pasos de cada punto hasta la media.`,
    ),
    predictQ: both(
      `The scores are ${list(values)}. Which list shows how far each one is from the mean?`,
      `Los puntajes son ${list(values)}. ¿Qué lista muestra qué tan lejos está cada uno de la media?`,
    ),
    /** Cue for a wrong list: names what that list IS and asks a checking question. */
    distanceCue(kind) {
      if (kind === "signed")
        return both(
          `A distance is a number of steps, so it is never negative. Walk along the number line from ${firstBelow} to the mean, ${S.mean}: how many steps is that?`,
          `Una distancia es un número de pasos, así que nunca es negativa. Camina por la recta numérica desde ${firstBelow} hasta la media, ${S.mean}: ¿cuántos pasos son?`,
        );
      if (kind === "fromMin")
        return both(
          `Those are distances from ${S.min}, the smallest score. Which point on the line should you measure from?`,
          `Esas son distancias desde ${S.min}, el puntaje menor. ¿Desde qué punto de la recta debes medir?`,
        );
      return both(
        `Those are the scores themselves. How many steps is ${values[0]} from the mean, ${S.mean}?`,
        `Esos son los puntajes mismos. ¿Cuántos pasos hay de ${values[0]} a la media, ${S.mean}?`,
      );
    },
    predictOk: both(
      `Yes: ${values.map((x, i) => `${x} is ${S.dist[i]} from ${S.mean}`).join(", ")}. Now draw each distance.`,
      `Sí: ${values.map((x, i) => `${x} está a ${S.dist[i]} de ${S.mean}`).join(", ")}. Ahora dibuja cada distancia.`,
    ),
    drawSay: both(
      "Tap each score to draw its distance from the mean as a bar.",
      "Toca cada puntaje para dibujar su distancia a la media como una barra.",
    ),
    drawGroup: both("Scores", "Puntajes"),
    drawn: (i) => away(values[i], S.dist[i], S.mean),
    drawDone: both(
      `All ${n} distances: ${list(S.dist)}. A distance is never negative; it can be zero.`,
      `Las ${n} distancias: ${list(S.dist)}. Una distancia nunca es negativa; puede ser cero.`,
    ),
    drawLeft: (k) => both(`Draw ${k} more.`, `Dibuja ${k} más.`),
    shareSay: both(
      "The distances are different lengths. Line them up end to end, then share the total equally.",
      "Las distancias tienen largos distintos. Alinéalas una tras otra y luego reparte el total por igual.",
    ),
    lineBtn: both("Line them up end to end", "Alinéalas una tras otra"),
    shareBtn: both("Share the total equally", "Reparte el total por igual"),
    lineCap: (vals) => {
      const s = madStats(vals);
      return `${plus(s.dist)} = ${s.sumd}`;
    },
    shareCap: (vals) => {
      const s = madStats(vals);
      return `${s.sumd} ÷ ${s.n} ${eq(s.mad)}`;
    },
    lineFb: both(
      `Laid end to end, the ${n} distances total ${S.sumd}.`,
      `Puestas una tras otra, las ${n} distancias suman ${S.sumd}.`,
    ),
    shareFb: both(
      `Shared equally among the ${n} scores, each distance is ${f(S.mad)}. That fair-share distance is the mean absolute deviation: MAD = ${f(S.mad)} ${unit.en}.`,
      `Repartidas por igual entre los ${n} puntajes, cada distancia mide ${f(S.mad)}. Esa distancia justa es la desviación media absoluta: MAD = ${f(S.mad)} ${unit.es}.`,
    ),
    exprLine: `${plus(S.dist)} = ${S.sumd}`,
    exprShare: `${S.sumd} ÷ ${n} ${eq(S.mad)}`,
    compareSay: both(
      `Two more sets of ${SA.n} scores, both with the mean ${SA.mean}. Look at the dots.`,
      `Dos conjuntos más de ${SA.n} puntajes, los dos con media ${SA.mean}. Mira los puntos.`,
    ),
    compareQ: both("Which set has the smaller MAD?", "¿Cuál conjunto tiene la MAD menor?"),
    compareOptions: [
      { kind: "small", correct: true, label: B.name },
      { kind: "large", label: A.name },
      {
        kind: "same",
        label: both(
          `They are the same, because both means are ${SA.mean}`,
          `Son iguales, porque las dos medias son ${SA.mean}`,
        ),
      },
      {
        kind: "unknown",
        label: both("You cannot tell without calculating", "No se puede saber sin calcular"),
      },
    ],
    compareCue(kind) {
      if (kind === "large")
        return both(
          `Look at how far each dot sits from the mean, ${SA.mean}. Do the dots of ${A.name.en} sit closer to it or farther from it than the dots of ${B.name.en}?`,
          `Mira qué tan lejos está cada punto de la media, ${SA.mean}. ¿Los puntos del conjunto «${A.name.es}» están más cerca o más lejos de ella que los del conjunto «${B.name.es}»?`,
        );
      if (kind === "same")
        return both(
          `Both means are ${SA.mean}. Do the dots of both sets sit the same distance from it?`,
          `Las dos medias son ${SA.mean}. ¿Están los puntos de los dos conjuntos a la misma distancia de ella?`,
        );
      return both(
        "You can see every dot and the mean. Which set's dots are bunched closer to the mean?",
        "Ves todos los puntos y la media. ¿Los puntos de cuál conjunto están más juntos alrededor de la media?",
      );
    },
    nameA: A.name,
    nameB: B.name,
    compareOk: both(
      `${B.name.en} has the smaller MAD: ${SB.sumd} ÷ ${SB.n} = ${f(SB.mad)}, compared with ${SA.sumd} ÷ ${SA.n} = ${f(SA.mad)} for ${A.name.en}. Same mean, different spread: a smaller MAD means the scores stay closer to the mean.`,
      `«${B.name.es}» tiene la MAD menor: ${SB.sumd} ÷ ${SB.n} = ${f(SB.mad)}, frente a ${SA.sumd} ÷ ${SA.n} = ${f(SA.mad)} de «${A.name.es}». Misma media, distinta dispersión: una MAD menor significa que los puntajes se quedan más cerca de la media.`,
    ),
    transferSay: both(
      `${transfer.story.en} The mean is ${T.mean}. Find the MAD on your own.`,
      `${transfer.story.es} La media es ${T.mean}. Halla la MAD por tu cuenta.`,
    ),
    transferList: list(transfer.values),
    transferQ: both(
      "What is the MAD of this data set?",
      "¿Cuál es la MAD de este conjunto de datos?",
    ),
    /** Cue for a wrong MAD: names what the number IS and asks a checking question. */
    madCue(kind) {
      if (kind === "total")
        return both(
          `${f(T.sumd)} is the total of the distances. The MAD is their average: how many values share that total?`,
          `${f(T.sumd)} es el total de las distancias. La MAD es su promedio: ¿entre cuántos valores se reparte ese total?`,
        );
      if (kind === "signed")
        return both(
          `With signs, ${list(transfer.values.map((x) => (x < T.mean ? `${MINUS}${T.mean - x}` : String(x - T.mean))))} cancel out to 0. A distance is never negative. What are the distances?`,
          `Con signos, ${list(transfer.values.map((x) => (x < T.mean ? `${MINUS}${T.mean - x}` : String(x - T.mean))))} se cancelan y dan 0. Una distancia nunca es negativa. ¿Cuáles son las distancias?`,
        );
      return both(
        `${T.mean} is the mean, the center. The MAD is the average distance FROM it. How far is each value from ${T.mean}?`,
        `${T.mean} es la media, el centro. La MAD es la distancia promedio DESDE ella. ¿Qué tan lejos está cada valor de ${T.mean}?`,
      );
    },
    transferOk: both(
      `Right: ${plus(T.dist)} = ${T.sumd}, and ${T.sumd} ÷ ${T.n} ${eq(T.mad)}. The MAD is small, so the numbers are close together.`,
      `Correcto: ${plus(T.dist)} = ${T.sumd}, y ${T.sumd} ÷ ${T.n} ${eq(T.mad)}. La MAD es pequeña, así que los números están cerca unos de otros.`,
    ),
    explainLabel: both(
      "Explain: what does a small MAD tell you about the data?",
      "Explica: ¿qué te dice una MAD pequeña sobre los datos?",
    ),
    explainFrame: both(
      "A small MAD means ___, because the average distance from the mean is ___.",
      "Una MAD pequeña significa ___, porque la distancia promedio a la media es ___.",
    ),
  };
}
