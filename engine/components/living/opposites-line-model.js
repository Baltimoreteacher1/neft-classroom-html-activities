// living/opposites-line-model.js — the mathematics and the words of the
// opposites-line play (Lesson 7-1: integers and their opposites).
//
// Pure functions only (no DOM): every number the play shows a student is
// computed here so opposites-line.test.mjs can check each one in node.

import { count, num, okInt, pairOf, placeCorrect as place, withUnit } from "./numline-model.js";

export const placeCorrect = place;

const WORDS = {
  uw: { en: "units", es: "unidades" },
  up: { en: "above zero", es: "sobre cero" },
  down: { en: "below zero", es: "bajo cero" },
};

/** One line setup: a symmetric integer axis and the value on it. */
function validLine(c, { allowStory }) {
  if (!c || typeof c !== "object") return null;
  const min = Number(c.min);
  const max = Number(c.max);
  const value = Number(c.value);
  const labelEvery = c.labelEvery == null ? 1 : Number(c.labelEvery);
  const tickEvery = c.tickEvery == null ? 1 : Number(c.tickEvery);
  if (!okInt(max, 4, 200) || min !== -max) return null;
  if (!okInt(labelEvery, 1, 100) || !okInt(tickEvery, 1, 100) || labelEvery % tickEvery)
    return null;
  if ((2 * max) / tickEvery > 60) return null;
  if (!okInt(value, 2, max)) return null;
  const unit = c.unit == null ? "" : String(c.unit);
  if (unit.length > 4) return null;
  const word = (k) => pairOf(c[k], 24) || WORDS[k];
  const out = {
    min,
    max,
    value,
    labelEvery,
    tickEvery,
    unit,
    uw: word("uw"),
    up: word("up"),
    down: word("down"),
    zero: pairOf(c.zero, 28),
    name: pairOf(c.name, 24),
  };
  if (allowStory) out.story = pairOf(c.story, 240);
  return out;
}

export function validateOppositesLine(cfg) {
  const main = validLine(cfg, { allowStory: true });
  if (!main) return null;
  main.pos = pairOf(cfg.pos, 24) || { en: "Place A", es: "Lugar A" };
  main.neg = pairOf(cfg.neg, 24) || { en: "Place B", es: "Lugar B" };
  main.name = null;
  const t = validLine(cfg.transfer, { allowStory: true });
  if (!t || !t.name) return null;
  // The three transfer choices (b, −b, max − b) must be three different numbers.
  const b = t.value;
  if (b === t.max - b || t.max - b < 1) return null;
  main.transfer = t;
  return main;
}

/** The predict choices for a value a: the opposite and three real mistakes. */
export function predictChoices(a) {
  return [
    { kind: "opposite", value: -a, correct: true },
    { kind: "same", value: a },
    { kind: "near", value: -1 },
    { kind: "zero", value: 0 },
  ];
}

/** The transfer choices for a value b on a line to `max`. */
export function transferChoices(b, max) {
  return [
    { kind: "opposite", value: b, correct: true },
    { kind: "sameSide", value: -b },
    { kind: "end", value: max - b },
  ];
}

export const dist = (x) => Math.abs(x);

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function oppositesCopy(v) {
  const { value: a, unit, pos, neg, zero } = v;
  const t = v.transfer;
  const u = (x) => withUnit(x, unit);
  const tu = (x) => withUnit(x, t.unit);
  const both = (en, es) => ({ en, es });
  const uw = v.uw;
  const tw = t.uw;
  const storyPair = v.story || {
    en: `${pos.en} is ${a} ${uw.en} ${v.up.en}. ${neg.en} is ${a} ${uw.en} ${v.down.en}.`,
    es: `${pos.es} está a ${a} ${uw.es} ${v.up.es}. ${neg.es} está a ${a} ${uw.es} ${v.down.es}.`,
  };
  return {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: both("Opposites on the number line", "Opuestos en la recta numérica"),
    ariaLabel: both(
      `A vertical number line from ${num(v.min)} to ${v.max}. ${pos.en} is ${u(a)}, ${a} ${uw.en} above 0. Its opposite, ${u(-a)}, is ${a} ${uw.en} below 0. Opposites are the same distance from 0, on opposite sides.`,
      `Una recta numérica vertical de ${num(v.min)} a ${v.max}. ${pos.es} está a ${u(a)}, ${a} ${uw.es} arriba del 0. Su opuesto, ${u(-a)}, está ${a} ${uw.es} abajo del 0. Los opuestos están a la misma distancia del 0, en lados opuestos.`,
    ),
    printSummary: both(
      `${pos.en}: ${u(a)}, ${a} ${uw.en} ${v.up.en}. ${neg.en}: ${u(-a)}, ${a} ${uw.en} ${v.down.en}. The opposite of ${a} is ${num(-a)}: the same distance from 0, on the other side. Taking the opposite twice returns to the start: −(${num(-a)}) = ${a}. Zero is its own opposite. On a line to ${t.max}, the opposite of ${tu(-t.value)} is ${tu(t.value)}.`,
      `${pos.es}: ${u(a)}, ${a} ${uw.es} ${v.up.es}. ${neg.es}: ${u(-a)}, ${a} ${uw.es} ${v.down.es}. El opuesto de ${a} es ${num(-a)}: la misma distancia del 0, del otro lado. Tomar el opuesto dos veces regresa al inicio: −(${num(-a)}) = ${a}. El cero es su propio opuesto. En una recta hasta ${t.max}, el opuesto de ${tu(-t.value)} es ${tu(t.value)}.`,
    ),
    scene: {
      situate: both("The situation", "La situación"),
      predict: both("Predict", "Predice"),
      mirror: both("Mirror across 0", "Espejo en el 0"),
      notation: both("Opposite of the opposite", "Opuesto del opuesto"),
      zero: both("Zero", "El cero"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    names: {
      pos,
      neg,
      dot: both("The dot", "El punto"),
      opp: both("Its opposite", "Su opuesto"),
      tOpp: both("Opposite", "Opuesto"),
    },
    zeroNote: zero,
    plain: (x, w) => count(x, w),
    situateSay: both(
      `${storyPair.en} We start counting at zero. ${pos.en} is above zero, so we write ${u(a)}.`,
      `${storyPair.es} Empezamos a contar en el cero. ${pos.es} está sobre cero, así que escribimos ${u(a)}.`,
    ),
    predictSay: both(
      `${neg.en}'s temperature is the opposite of ${pos.en}'s ${u(a)}. Where will ${neg.en}'s dot go?`,
      `La temperatura de ${neg.es} es el opuesto de los ${u(a)} de ${pos.es}. ¿Dónde irá el punto de ${neg.es}?`,
    ),
    predictQ: both(`The opposite of ${u(a)} is…`, `El opuesto de ${u(a)} es…`),
    predictCue(kind) {
      const k = {
        same: both(
          `${u(a)} is where ${pos.en} already is (the dashed ring). Opposites sit on opposite sides of 0. Which side is ${neg.en} on?`,
          `${u(a)} es donde ya está ${pos.es} (el aro de rayas). Los opuestos están en lados opuestos del 0. ¿De qué lado está ${neg.es}?`,
        ),
        near: both(
          `${u(-1)} is right next to 0. How far from 0 is ${pos.en}'s ${u(a)}? An opposite is that same distance away.`,
          `${u(-1)} está justo al lado del 0. ¿A qué distancia del 0 están los ${u(a)} de ${pos.es}? Un opuesto está a esa misma distancia.`,
        ),
        zero: both(
          `${u(0)} is ${a} ${uw.en} below ${pos.en}'s dot, but opposites are measured from 0, not from ${pos.en}. How far from 0 is ${u(a)}?`,
          `${u(0)} está ${a} ${uw.es} debajo del punto de ${pos.es}, pero los opuestos se miden desde el 0, no desde ${pos.es}. ¿A qué distancia del 0 están ${u(a)}?`,
        ),
      };
      return k[kind];
    },
    predictOk: both(
      `Yes: ${neg.en} is ${a} ${uw.en} ${v.down.en}, ${u(-a)}. ${a} and ${num(-a)} are opposites: the same distance from 0, on opposite sides.`,
      `Sí: ${neg.es} está a ${a} ${uw.es} ${v.down.es}, ${u(-a)}. ${a} y ${num(-a)} son opuestos: la misma distancia del 0, en lados opuestos.`,
    ),
    mirrorSay: both(
      "Slide the dot. Its opposite follows. Watch the two distance bars from 0.",
      "Desliza el punto. Su opuesto lo sigue. Mira las dos barras de distancia desde el 0.",
    ),
    mirrorLabel: both("Move the dot", "Mueve el punto"),
    mirrorRow: (x) => ({
      en: `${u(x)} and its opposite ${u(-x)}: each is ${count(x, uw).en} from 0.`,
      es: `${u(x)} y su opuesto ${u(-x)}: cada uno está a ${count(x, uw).es} del 0.`,
    }),
    mirrorTry: (left) => ({
      en:
        left === 3
          ? "Try three different spots."
          : `Try ${left} more spot${left === 1 ? "" : "s"}.`,
      es:
        left === 3
          ? "Prueba tres lugares distintos."
          : `Prueba ${left} lugar${left === 1 ? "" : "es"} más.`,
    }),
    mirrorLesson: both(
      "Wherever the dot goes, its opposite is the same distance from 0, on the other side.",
      "Donde sea que vaya el punto, su opuesto está a la misma distancia del 0, del otro lado.",
    ),
    notationSay: both(
      `Take the opposite of ${a}. Then take the opposite of that.`,
      `Toma el opuesto de ${a}. Luego toma el opuesto de ese.`,
    ),
    notationBtn: (n) => ({
      en: `Take the opposite of ${num(n === 0 ? a : -a)}`,
      es: `Toma el opuesto de ${num(n === 0 ? a : -a)}`,
    }),
    notationExpr: (n) =>
      n === 0 ? `${a}` : n === 1 ? `−(${a}) = ${num(-a)}` : `−(${num(-a)}) = ${a}`,
    notationFb: (n) =>
      n === 1
        ? both(
            `The opposite of ${a} is ${num(-a)}: the dot crossed 0 and landed ${a} ${uw.en} on the other side.`,
            `El opuesto de ${a} es ${num(-a)}: el punto cruzó el 0 y quedó a ${a} ${uw.es} del otro lado.`,
          )
        : both(
            `The opposite of ${num(-a)} is ${a}: the dot crossed back. Taking the opposite twice returns to where you started: −(${num(-a)}) = ${a}.`,
            `El opuesto de ${num(-a)} es ${a}: el punto cruzó de regreso. Tomar el opuesto dos veces regresa al inicio: −(${num(-a)}) = ${a}.`,
          ),
    zeroSay: both(
      `What about zero? Take the opposite of ${u(0)}.`,
      `¿Y el cero? Toma el opuesto de ${u(0)}.`,
    ),
    zeroQ: both("The opposite of 0 is…", "El opuesto de 0 es…"),
    zeroOpts: {
      self: both("0", "0"),
      minus1: both(num(-1), num(-1)),
      none: both("It has no opposite", "No tiene opuesto"),
    },
    zeroCue: {
      minus1: both(
        `${num(-1)} is next to 0, not on it. How far is 0 from 0?`,
        `${num(-1)} está junto al 0, no sobre él. ¿A qué distancia del 0 está el 0?`,
      ),
      none: both(
        "0 is a point on the line like any other. Where is the spot that is 0 units from 0, on the other side?",
        "El 0 es un punto de la recta como cualquier otro. ¿Dónde está el lugar a 0 unidades del 0, del otro lado?",
      ),
    },
    zeroOk: both(
      `Yes: 0 is 0 ${uw.en} from 0, so its opposite is also 0. Zero is its own opposite: −(0) = 0.`,
      `Sí: el 0 está a 0 ${uw.es} del 0, así que su opuesto también es 0. El cero es su propio opuesto: −(0) = 0.`,
    ),
    transferSay: both(
      `${t.story ? t.story.en : `${t.name.en} is ${t.value} ${tw.en} ${t.down.en}.`} So it is ${tu(-t.value)}. The scale has changed, but the idea has not.`,
      `${t.story ? t.story.es : `${t.name.es} está a ${t.value} ${tw.es} ${t.down.es}.`} Así que es ${tu(-t.value)}. La escala cambió, pero la idea no.`,
    ),
    transferQ: both(`The opposite of ${tu(-t.value)} is…`, `El opuesto de ${tu(-t.value)} es…`),
    transferCue(kind) {
      return kind === "sameSide"
        ? both(
            `${tu(-t.value)} is the dot already on the line. An opposite sits on the other side of 0. Which side is that?`,
            `${tu(-t.value)} es el punto que ya está en la recta. Un opuesto está del otro lado del 0. ¿Qué lado es ese?`,
          )
        : both(
            `${num(t.max - t.value)} is how far ${t.value} is from ${t.max}, the end of the scale. Opposites are measured from 0, not from the end. How far from 0 is ${tu(-t.value)}?`,
            `${num(t.max - t.value)} es la distancia de ${t.value} a ${t.max}, el final de la escala. Los opuestos se miden desde el 0, no desde el final. ¿A qué distancia del 0 está ${tu(-t.value)}?`,
          );
    },
    transferOk: both(
      `Yes: ${tu(t.value)} is ${t.value} ${tw.en} ${t.up.en}, the same distance from 0 as ${tu(-t.value)}, on the other side.`,
      `Sí: ${tu(t.value)} está a ${t.value} ${tw.es} ${t.up.es}, la misma distancia del 0 que ${tu(-t.value)}, del otro lado.`,
    ),
    explainLabel: both(
      `Explain: why are ${num(-t.value)} and ${t.value} opposites?`,
      `Explica: ¿por qué ${num(-t.value)} y ${t.value} son opuestos?`,
    ),
    explainFrame: both(
      "They are opposites because both are ___ from 0, but on ___ sides.",
      "Son opuestos porque los dos están a ___ del 0, pero en lados ___.",
    ),
  };
}
