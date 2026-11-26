// living/plane-points-model.js — validation, choice sets and every sentence of
// the plane-points play (modes "walk" and "quadrant"). No DOM.

import {
  distinct,
  inRange,
  labelOf,
  MINUS,
  pt,
  QSIGNS,
  quadrant,
  ROMAN,
  same,
  storyOf,
  validPoint,
  validRange,
} from "./plane-model.js";

const NONE = { en: "", es: "" };
const KICKER = { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" };
const PLACE = { en: "Place the point", es: "Colocar el punto" };

const whole = (p) => p && Number.isInteger(p.x) && Number.isInteger(p.y);

/** A named integer point inside the range, or null. */
function namedPoint(p, r, fallbackName) {
  const q = validPoint(p, r);
  if (!q || !whole(q)) return null;
  return { ...q, name: labelOf(p.name, fallbackName, 24) };
}

/** "right 5, up 4" / "left 3, down 4" for a point, as {en, es}. */
export function moveWords(p) {
  const dx = Math.abs(p.x);
  const dy = Math.abs(p.y);
  return {
    en: `${p.x < 0 ? "left" : "right"} ${dx}, ${p.y < 0 ? "down" : "up"} ${dy}`,
    es: `${dx} a la ${p.x < 0 ? "izquierda" : "derecha"}, ${dy} hacia ${p.y < 0 ? "abajo" : "arriba"}`,
  };
}

export function validatePlanePoints(cfg) {
  const range = validRange(cfg?.range);
  if (!range) return null;
  if (cfg.mode === "walk") return validateWalk(cfg, range);
  if (cfg.mode === "quadrant") return validateQuadrant(cfg, range);
  return null;
}

function validateWalk(cfg, range) {
  const A = namedPoint(cfg.first, range, { en: "Point A", es: "Punto A" });
  const B = namedPoint(cfg.second, range, { en: "Point B", es: "Punto B" });
  const C = namedPoint(cfg.third, range, { en: "Point C", es: "Punto C" });
  const S = validPoint(cfg.swap, range);
  const D = namedPoint(cfg.reverse, range, { en: "the treasure", es: "el tesoro" });
  if (!A || !B || !C || !S || !D) return null;
  const all = [A, B, C, S, D];
  // First quadrant only: the walk is "right, then up".
  if (!all.every((p) => p.x >= 1 && p.y >= 1 && Number.isInteger(p.x) && Number.isInteger(p.y)))
    return null;
  if (new Set([A, B, C].map(pt)).size < 3) return null;
  if (S.x === S.y || D.x === D.y || A.x === A.y) return null;
  if (!inRange({ x: S.y, y: S.x }, range) || !inRange({ x: D.y, y: D.x }, range)) return null;
  return { mode: "walk", range, A, B, C, S, D, story: storyOf(cfg.story) };
}

function validateQuadrant(cfg, range) {
  if (range.xmin >= 0 || range.xmax <= 0 || range.ymin >= 0 || range.ymax <= 0) return null;
  const A = namedPoint(cfg.first, range, { en: "A", es: "A" });
  const B = namedPoint(cfg.second, range, { en: "B", es: "B" });
  const others = (Array.isArray(cfg.others) ? cfg.others : []).map((o, i) =>
    namedPoint(o, range, { en: `P${i + 1}`, es: `P${i + 1}` }),
  );
  const E = namedPoint(cfg.reading, range, { en: "E", es: "E" });
  if (!A || !B || !E || others.length !== 2 || others.some((o) => !o)) return null;
  const all = [A, B, ...others, E];
  if (all.some((p) => quadrant(p) === 0)) return null; // every point is off the axes
  if (new Set(all.map(pt)).size !== all.length) return null;
  if (quadrant(A) === 1 || A.x === A.y) return null; // the predict scene needs a point whose signs matter
  if (new Set(others.map((o) => quadrant(o))).size !== 2) return null;
  if (!inRange({ x: E.y, y: E.x }, range)) return null;
  return { mode: "quadrant", range, A, B, others, E, story: storyOf(cfg.story) };
}

/** Which of the four distractor "ghost" trips a quadrant predict can offer for t. */
export function quadrantChoices(t, range) {
  const opts = [
    { kind: "right", p: t, correct: true },
    { kind: "unsigned", p: { x: Math.abs(t.x), y: Math.abs(t.y) } },
    { kind: "swap", p: { x: t.y, y: t.x } },
    { kind: "flip", p: { x: -t.x, y: t.y } },
  ].filter((o) => o.correct || (inRange(o.p, range) && !same(o.p, t)));
  return distinct(opts, (o) => pt(o.p));
}

/** Walk predict choices for t: the trip, the swap, and "both moves sideways". */
export function walkChoices(t, range) {
  const opts = [
    { kind: "right", p: t, correct: true, words: moveWords(t) },
    {
      kind: "swap",
      p: { x: t.y, y: t.x },
      words: moveWords({ x: t.y, y: t.x }),
    },
    {
      kind: "sideways",
      p: { x: t.x + t.y, y: 0 },
      words: {
        en: `right ${t.x}, then right ${t.y} more`,
        es: `${t.x} a la derecha y ${t.y} más a la derecha`,
      },
    },
  ].filter((o) => o.correct || inRange(o.p, range));
  return opts;
}

/** Reading choices for a dot at t in the quadrant mode: the pair, the swap, one sign flipped. */
export function quadReadChoices(t, range) {
  const opts = [
    { kind: "right", p: t, correct: true },
    { kind: "swap", p: { x: t.y, y: t.x } },
    { kind: "flipx", p: { x: -t.x, y: t.y } },
    { kind: "flipy", p: { x: t.x, y: -t.y } },
  ].filter((o) => o.correct || (inRange(o.p, range) && !same(o.p, t)));
  return distinct(opts, (o) => pt(o.p));
}

/** Reading choices for a dot at t: the pair, the swap, 0 for "up", the repeated x. */
export function readChoices(t, range) {
  const opts = [
    { kind: "right", p: t, correct: true },
    { kind: "swap", p: { x: t.y, y: t.x } },
    { kind: "noUp", p: { x: t.x, y: 0 } },
    { kind: "twice", p: { x: t.x === 2 ? 3 : 2, y: t.x === 2 ? 3 : 2 } },
  ].filter((o) => o.correct || (inRange(o.p, range) && !same(o.p, t)));
  return distinct(opts, (o) => pt(o.p));
}

export function pointsCopy(v) {
  return v.mode === "walk" ? walkCopy(v) : quadrantCopy(v);
}

const tagged = (name, p) => ({ en: `${name.en} ${pt(p)}`, es: `${name.es} ${pt(p)}` });

function walkCopy(v) {
  const { A, B, C, S, D } = v;
  const lead = v.story ? { en: `${v.story.en} `, es: `${v.story.es} ` } : NONE;
  const legs = (p) => ({
    x: { en: `${p.x} right`, es: `${p.x} a la derecha` },
    y: { en: `${p.y} up`, es: `${p.y} hacia arriba` },
  });
  return {
    kicker: KICKER,
    title: { en: "Plot a point from its ordered pair", es: "Marca un punto con su par ordenado" },
    ariaLabel: {
      en: `A coordinate grid. The ordered pair ${pt(A)} means ${A.x} units right of the origin and ${A.y} units up. ${pt(B)} is ${B.x} right and ${B.y} up. ${pt(C)} is ${C.x} right and ${C.y} up.`,
      es: `Una cuadrícula de coordenadas. El par ordenado ${pt(A)} significa ${A.x} unidades a la derecha del origen y ${A.y} hacia arriba. ${pt(B)} es ${B.x} a la derecha y ${B.y} hacia arriba. ${pt(C)} es ${C.x} a la derecha y ${C.y} hacia arriba.`,
    },
    printSummary: {
      en: `An ordered pair (x, y) names a place. Start at the origin (0, 0): the first number tells how far right, the second how far up. ${pt(A)} is ${A.x} right and ${A.y} up. ${pt(S)} and ${pt({ x: S.y, y: S.x })} use the same two numbers but are different places.`,
      es: `Un par ordenado (x, y) nombra un lugar. Empieza en el origen (0, 0): el primer número dice cuánto a la derecha y el segundo cuánto hacia arriba. ${pt(A)} es ${A.x} a la derecha y ${A.y} hacia arriba. ${pt(S)} y ${pt({ x: S.y, y: S.x })} usan los mismos dos números pero son lugares distintos.`,
    },
    scene: {
      start: { en: "The map", es: "El mapa" },
      predict: { en: "Predict", es: "Predice" },
      plot: { en: "Plot it", es: "Márcalo" },
      read: { en: "Read the pair", es: "Lee el par" },
      order: { en: "Order matters", es: "El orden importa" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    origin: { en: "origin (0, 0)", es: "origen (0, 0)" },
    legs,
    place: PLACE,
    startSay: {
      en: `${lead.en}This grid is a map. An ordered pair (x, y) names one place on it, and every trip starts at the origin, (0, 0). The ${A.name.en} is at ${pt(A)}.`,
      es: `${lead.es}Esta cuadrícula es un mapa. Un par ordenado (x, y) nombra un lugar, y todo viaje empieza en el origen, (0, 0). ${A.name.es} está en ${pt(A)}.`,
    },
    predictSay: {
      en: `How do you get from the origin to the ${A.name.en}, ${pt(A)}?`,
      es: `¿Cómo llegas del origen a ${A.name.es}, ${pt(A)}?`,
    },
    predictQ: { en: `To plot ${pt(A)}, you move…`, es: `Para marcar ${pt(A)}, te mueves…` },
    walkCue(opt) {
      if (opt.kind === "swap")
        return {
          en: `That trip ends at ${pt(opt.p)}, the dashed circle: a different place. In ${pt(A)}, which number comes first, and which axis does it belong to?`,
          es: `Ese viaje termina en ${pt(opt.p)}, el círculo punteado: es otro lugar. En ${pt(A)}, ¿qué número va primero y a qué eje pertenece?`,
        };
      return {
        en: `Both moves went right, so the dot stayed on the x-axis, at ${pt(opt.p)}. Does the second number in ${pt(A)} send you the same way as the first?`,
        es: `Los dos movimientos fueron a la derecha, así que el punto se quedó sobre el eje x, en ${pt(opt.p)}. ¿El segundo número de ${pt(A)} te manda en la misma dirección que el primero?`,
      };
    },
    predictOk: {
      en: `Yes: the first number, ${A.x}, moves you ${A.x} right along the x-axis. The second number, ${A.y}, moves you ${A.y} up. Now do it yourself.`,
      es: `Sí: el primer número, ${A.x}, te mueve ${A.x} a la derecha sobre el eje x. El segundo, ${A.y}, te mueve ${A.y} hacia arriba. Ahora hazlo tú.`,
    },
    plotSay: (p) => ({
      en: `Plot the ${p.name.en}, ${pt(p)}. Start at the origin: move the crosshair right, then up, and press Place.`,
      es: `Marca ${p.name.es}, ${pt(p)}. Empieza en el origen: mueve la cruz a la derecha y luego hacia arriba, y presiona Colocar.`,
    }),
    plotQ: (p) => ({
      en: `Plot ${pt(p)}: ${p.x} right, ${p.y} up.`,
      es: `Marca ${pt(p)}: ${p.x} a la derecha, ${p.y} hacia arriba.`,
    }),
    plotOk: (p, first) => ({
      en: `${first ? "Yes" : "Same method"}: ${p.x} right and ${p.y} up puts the ${p.name.en} at ${pt(p)}.`,
      es: `${first ? "Sí" : "Mismo método"}: ${p.x} a la derecha y ${p.y} hacia arriba ponen ${p.name.es} en ${pt(p)}.`,
    }),
    readSay: {
      en: `Watch the ${C.name.en}, ${pt(C)}: ${C.x} right along the x-axis, then ${C.y} up.`,
      es: `Mira ${C.name.es}, ${pt(C)}: ${C.x} a la derecha sobre el eje x y luego ${C.y} hacia arriba.`,
    },
    readDone: {
      en: "The first number is how far right (x). The second number is how far up (y). Joined in order, the three points trace the route.",
      es: "El primer número es cuánto a la derecha (x). El segundo es cuánto hacia arriba (y). Unidos en orden, los tres puntos trazan la ruta.",
    },
    orderSay: {
      en: `Plot ${pt(S)}, then ${pt({ x: S.y, y: S.x })}. They use the same two numbers. Are they the same place?`,
      es: `Marca ${pt(S)} y luego ${pt({ x: S.y, y: S.x })}. Usan los mismos dos números. ¿Son el mismo lugar?`,
    },
    orderFirst: (p, q) => ({
      en: `Yes: that is ${pt(p)}. Now plot ${pt(q)}.`,
      es: `Sí: ese es ${pt(p)}. Ahora marca ${pt(q)}.`,
    }),
    orderDone: {
      en: `${pt(S)} and ${pt({ x: S.y, y: S.x })} use the same two numbers, but they are different places. The order matters: x first, then y.`,
      es: `${pt(S)} y ${pt({ x: S.y, y: S.x })} usan los mismos dos números, pero son lugares distintos. El orden importa: primero x y luego y.`,
    },
    orderTag: (p) => ({ en: `x = ${p.x}, y = ${p.y}`, es: `x = ${p.x}, y = ${p.y}` }),
    transferSay: {
      en: `${D.name.en[0].toUpperCase()}${D.name.en.slice(1)} is ${D.x} right and ${D.y} up from the origin. Which ordered pair names it?`,
      es: `${D.name.es[0].toUpperCase()}${D.name.es.slice(1)} está ${D.x} a la derecha y ${D.y} hacia arriba del origen. ¿Qué par ordenado lo nombra?`,
    },
    transferQ: { en: "Which ordered pair names it?", es: "¿Qué par ordenado lo nombra?" },
    readCue(opt) {
      const P = pt(opt.p);
      const cues = {
        swap: {
          en: `${P} is ${opt.p.x} right and ${opt.p.y} up: look at the dashed circle. In a pair, which number comes first?`,
          es: `${P} es ${opt.p.x} a la derecha y ${opt.p.y} hacia arriba: mira el círculo punteado. En un par, ¿qué número va primero?`,
        },
        noUp: {
          en: `${P} sits on the x-axis: ${opt.p.x} right but 0 up. Does the dot stay on the axis, or does it go up too?`,
          es: `${P} está sobre el eje x: ${opt.p.x} a la derecha pero 0 hacia arriba. ¿El punto se queda en el eje o también sube?`,
        },
        twice: {
          en: `${P} is ${opt.p.x} right and ${opt.p.y} up: look at the dashed circle. How far right does the dot really sit?`,
          es: `${P} es ${opt.p.x} a la derecha y ${opt.p.y} hacia arriba: mira el círculo punteado. ¿A cuánta distancia a la derecha está el punto de verdad?`,
        },
      };
      return cues[opt.kind];
    },
    transferOk: {
      en: `Right: ${pt(D)}. ${D.x} right is the x-coordinate and ${D.y} up is the y-coordinate, written (x, y).`,
      es: `Correcto: ${pt(D)}. ${D.x} a la derecha es la coordenada x y ${D.y} hacia arriba es la coordenada y, escritas (x, y).`,
    },
    explainLabel: {
      en: "Explain: how does an ordered pair tell you where a point goes?",
      es: "Explica: ¿cómo te dice un par ordenado dónde va un punto?",
    },
    explainFrame: {
      en: `The first number tells me ___ and the second number tells me ___. The point ${pt(A)} means ___.`,
      es: `El primer número me dice ___ y el segundo número me dice ___. El punto ${pt(A)} significa ___.`,
    },
    label: (p) => tagged(p.name, p),
  };
}

function quadrantCopy(v) {
  const { A, B, E } = v;
  const lead = v.story ? { en: `${v.story.en} `, es: `${v.story.es} ` } : NONE;
  const q = (p) => ROMAN[quadrant(p)];
  const signs = (p) => `(${QSIGNS[quadrant(p)].join(", ")})`;
  const qEn = (n) => `Quadrant ${ROMAN[n]}`;
  const qEs = (n) => `Cuadrante ${ROMAN[n]}`;
  const steps = (p) => ({
    en: `${Math.abs(p.x)} ${p.x < 0 ? "left" : "right"}, ${Math.abs(p.y)} ${p.y < 0 ? "down" : "up"}`,
    es: `${Math.abs(p.x)} a la ${p.x < 0 ? "izquierda" : "derecha"}, ${Math.abs(p.y)} hacia ${p.y < 0 ? "abajo" : "arriba"}`,
  });
  return {
    kicker: KICKER,
    title: {
      en: "Ordered pairs in all four quadrants",
      es: "Pares ordenados en los cuatro cuadrantes",
    },
    ariaLabel: {
      en: `A coordinate grid with four quadrants. ${pt(A)} is ${steps(A).en}, in Quadrant ${q(A)}. ${pt(B)} is ${steps(B).en}, in Quadrant ${q(B)}.`,
      es: `Una cuadrícula con cuatro cuadrantes. ${pt(A)} es ${steps(A).es}, en el cuadrante ${q(A)}. ${pt(B)} es ${steps(B).es}, en el cuadrante ${q(B)}.`,
    },
    printSummary: {
      en: `The axes cut the plane into four quadrants. Quadrant I is (+, +), II is (${MINUS}, +), III is (${MINUS}, ${MINUS}) and IV is (+, ${MINUS}). ${pt(A)} is in Quadrant ${q(A)}; ${pt(B)} is in Quadrant ${q(B)}.`,
      es: `Los ejes dividen el plano en cuatro cuadrantes. El cuadrante I es (+, +), el II es (${MINUS}, +), el III es (${MINUS}, ${MINUS}) y el IV es (+, ${MINUS}). ${pt(A)} está en el cuadrante ${q(A)}; ${pt(B)} está en el cuadrante ${q(B)}.`,
    },
    scene: {
      start: { en: "The quadrants", es: "Los cuadrantes" },
      predict: { en: "Predict", es: "Predice" },
      plot: { en: "Plot it", es: "Márcalo" },
      signs: { en: "The signs", es: "Los signos" },
      name: { en: "Name the quadrant", es: "Nombra el cuadrante" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    quadLabels: [1, 2, 3, 4].map((n) => [
      { en: qEn(n), es: qEs(n) },
      { en: `(${QSIGNS[n].join(", ")})`, es: `(${QSIGNS[n].join(", ")})` },
    ]),
    place: PLACE,
    origin: { en: "base camp (0, 0)", es: "campamento (0, 0)" },
    startSay: {
      en: `${lead.en}Base camp is the origin, (0, 0). The two axes cut the map into four quadrants, numbered I to IV counterclockwise from the upper right.`,
      es: `${lead.es}El campamento base es el origen, (0, 0). Los dos ejes dividen el mapa en cuatro cuadrantes, numerados de I a IV en sentido contrario a las agujas del reloj desde arriba a la derecha.`,
    },
    predictSay: {
      en: `Clue ${A.name.en} is ${pt(A)}. How do you get there from base camp?`,
      es: `La pista ${A.name.es} es ${pt(A)}. ¿Cómo llegas desde el campamento base?`,
    },
    predictQ: { en: `To plot ${pt(A)}, you move…`, es: `Para marcar ${pt(A)}, te mueves…` },
    quadCue(opt) {
      const P = pt(opt.p);
      if (opt.kind === "swap")
        return {
          en: `That trip ends at ${P}, the dashed circle: the numbers are in the wrong order. Which number goes first in ${pt(A)}?`,
          es: `Ese viaje termina en ${P}, el círculo punteado: los números están en el orden equivocado. ¿Qué número va primero en ${pt(A)}?`,
        };
      if (opt.kind === "unsigned")
        return {
          en: `That trip ends at ${P}, the dashed circle, in Quadrant ${q(opt.p)}. Look at the signs in ${pt(A)}: are both numbers positive?`,
          es: `Ese viaje termina en ${P}, el círculo punteado, en el cuadrante ${q(opt.p)}. Mira los signos de ${pt(A)}: ¿los dos números son positivos?`,
        };
      const first = Math.sign(opt.p.x) !== Math.sign(A.x);
      return {
        en: `That trip ends at ${P}, the dashed circle. Check the sign of the ${first ? "first" : "second"} number in ${pt(A)}: does it send you ${first ? "right or left" : "up or down"}?`,
        es: `Ese viaje termina en ${P}, el círculo punteado. Revisa el signo del ${first ? "primer" : "segundo"} número de ${pt(A)}: ¿te manda ${first ? "a la derecha o a la izquierda" : "hacia arriba o hacia abajo"}?`,
      };
    },
    predictOk: {
      en: `Yes: ${steps(A).en}. A negative number moves you the other way: left for x, down for y. Now plot it yourself.`,
      es: `Sí: ${steps(A).es}. Un número negativo te mueve al otro lado: a la izquierda para x, hacia abajo para y. Ahora márcalo tú.`,
    },
    plotSay: (p) => ({
      en: `Plot ${pt(p)}. A negative number moves you the other way: left for x, down for y.`,
      es: `Marca ${pt(p)}. Un número negativo te mueve al otro lado: a la izquierda para x, hacia abajo para y.`,
    }),
    plotQ: (p) => ({ en: `Plot ${pt(p)}: ${steps(p).en}.`, es: `Marca ${pt(p)}: ${steps(p).es}.` }),
    plotOk: (p) => ({
      en: `${p.name.en} ${pt(p)}: ${steps(p).en}. It lands in Quadrant ${q(p)}.`,
      es: `${p.name.es} ${pt(p)}: ${steps(p).es}. Cae en el cuadrante ${q(p)}.`,
    }),
    signsSay: {
      en: `Look at the signs. Quadrant I is (+, +), II is (${MINUS}, +), III is (${MINUS}, ${MINUS}) and IV is (+, ${MINUS}). The signs of a pair name its quadrant.`,
      es: `Mira los signos. El cuadrante I es (+, +), el II es (${MINUS}, +), el III es (${MINUS}, ${MINUS}) y el IV es (+, ${MINUS}). Los signos de un par nombran su cuadrante.`,
    },
    signsRow: (p) => ({
      en: `${pt(p)} → ${signs(p)} → Quadrant ${q(p)}`,
      es: `${pt(p)} → ${signs(p)} → cuadrante ${q(p)}`,
    }),
    nameSay: {
      en: "Now read the signs only. Which quadrant does each clue land in?",
      es: "Ahora lee solo los signos. ¿En qué cuadrante cae cada pista?",
    },
    nameQ: (p) => ({
      en: `Which quadrant is clue ${p.name.en}, ${pt(p)}, in?`,
      es: `¿En qué cuadrante está la pista ${p.name.es}, ${pt(p)}?`,
    }),
    quadOpt: (n) => ({ en: qEn(n), es: qEs(n) }),
    nameCue(n, p) {
      const [sx, sy] = QSIGNS[n];
      const actual = QSIGNS[quadrant(p)];
      const xBad = sx !== actual[0];
      return {
        en: xBad
          ? `${qEn(n)} is (${sx}, ${sy}): its x is ${sx === "+" ? "positive" : "negative"}. The x in ${pt(p)} is ${actual[0] === "+" ? "positive" : "negative"}. Does that match?`
          : `${qEn(n)} is (${sx}, ${sy}): its y is ${sy === "+" ? "positive" : "negative"}. The y in ${pt(p)} is ${actual[1] === "+" ? "positive" : "negative"}. Does that match?`,
        es: xBad
          ? `El cuadrante ${ROMAN[n]} es (${sx}, ${sy}): su x es ${sx === "+" ? "positiva" : "negativa"}. La x de ${pt(p)} es ${actual[0] === "+" ? "positiva" : "negativa"}. ¿Coincide?`
          : `El cuadrante ${ROMAN[n]} es (${sx}, ${sy}): su y es ${sy === "+" ? "positiva" : "negativa"}. La y de ${pt(p)} es ${actual[1] === "+" ? "positiva" : "negativa"}. ¿Coincide?`,
      };
    },
    nameOk: (p) => ({
      en: `Yes: ${pt(p)} is ${signs(p)}, so it is in Quadrant ${q(p)}.`,
      es: `Sí: ${pt(p)} es ${signs(p)}, así que está en el cuadrante ${q(p)}.`,
    }),
    transferSay: {
      en: "A new clue is on the map, but its pair is hidden. Read where the dot sits.",
      es: "Hay una pista nueva en el mapa, pero su par está oculto. Lee dónde está el punto.",
    },
    transferQ: {
      en: "Which ordered pair names the dot?",
      es: "¿Qué par ordenado nombra el punto?",
    },
    readCue(opt) {
      const P = pt(opt.p);
      if (opt.kind === "swap")
        return {
          en: `${P} is ${steps(opt.p).en}: look at the dashed circle. Which number comes first in a pair?`,
          es: `${P} es ${steps(opt.p).es}: mira el círculo punteado. ¿Qué número va primero en un par?`,
        };
      return {
        en: `${P} puts a dot in Quadrant ${q(opt.p)}, the dashed circle. Is the real dot left or right of the y-axis? Above or below the x-axis?`,
        es: `${P} pone un punto en el cuadrante ${q(opt.p)}, el círculo punteado. ¿El punto de verdad está a la izquierda o a la derecha del eje y? ¿Arriba o abajo del eje x?`,
      };
    },
    transferOk: {
      en: `Right: ${pt(E)}. The dot is ${E.x < 0 ? "left" : "right"} of the y-axis and ${E.y < 0 ? "below" : "above"} the x-axis, so the signs are ${signs(E)}: Quadrant ${q(E)}.`,
      es: `Correcto: ${pt(E)}. El punto está a la ${E.x < 0 ? "izquierda" : "derecha"} del eje y y ${E.y < 0 ? "debajo" : "arriba"} del eje x, así que los signos son ${signs(E)}: cuadrante ${q(E)}.`,
    },
    explainLabel: {
      en: "Explain: how do the signs of x and y tell you the quadrant?",
      es: "Explica: ¿cómo te dicen los signos de x y y el cuadrante?",
    },
    explainFrame: {
      en: `In Quadrant ___, the x-coordinate is ___ and the y-coordinate is ___. I know ${pt(A)} is in Quadrant ___ because ___.`,
      es: `En el cuadrante ___, la coordenada x es ___ y la coordenada y es ___. Sé que ${pt(A)} está en el cuadrante ___ porque ___.`,
    },
    steps,
    label: (p) => tagged(p.name, p),
  };
}
