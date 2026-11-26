// living/plane-distance-model.js — validation, choice sets and every sentence of
// the plane-distance play (lesson 7-6). No DOM.
//
// A "pair" is two whole-number points that share exactly one coordinate, so the
// distance between them is a counted segment along a row or a column: the
// absolute value of the difference of the coordinates that differ. Points on
// opposite sides of 0 add their absolute values; points on the same side
// subtract them.

import {
  distinct,
  fmt,
  inRange,
  labelOf,
  lineKind,
  MINUS,
  pt,
  same,
  storyOf,
  validPoint,
  validRange,
} from "./plane-model.js";

const KICKER = { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" };
export const MAX_STEPS = 12;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Spanish "de el" -> "del", "a el" -> "al". */
const de = (s) => (s.startsWith("el ") ? `d${s}` : `de ${s}`);
const al = (s) => (s.startsWith("el ") ? `al ${s.slice(3)}` : `a ${s}`);

function namedPoint(p, r, fallback) {
  const q = validPoint(p, r);
  if (!q || !Number.isInteger(q.x) || !Number.isInteger(q.y)) return null;
  const name = labelOf(p.name, fallback, 20);
  return { ...q, name, the: labelOf(p.the, name, 28) };
}

/** Geometry of a pair: which line, the shared coordinate, the distance, the zero crossing. */
export function analyzePair(a, b) {
  const kind = lineKind(a, b);
  if (!kind) return null;
  const horizontal = kind === "horizontal";
  const fixed = horizontal ? a.y : a.x;
  const ua = horizontal ? a.x : a.y;
  const ub = horizontal ? b.x : b.y;
  return {
    a,
    b,
    kind,
    horizontal,
    fixed,
    ua,
    ub,
    d: Math.abs(ua - ub),
    dir: ub > ua ? 1 : -1,
    opposite: ua * ub < 0,
    fixedName: horizontal ? "y" : "x",
    varyName: horizontal ? "x" : "y",
  };
}

/** The point on the pair's line where the varying coordinate is u. */
export const onLine = (P, u) => (P.horizontal ? { x: u, y: P.fixed } : { x: P.fixed, y: u });

function validPair(p, r, want, names) {
  const a = namedPoint(p?.a, r, names[0]);
  const b = namedPoint(p?.b, r, names[1]);
  if (!a || !b || same(a, b)) return null;
  const P = analyzePair(a, b);
  if (!P || P.d < 2 || P.d > MAX_STEPS) return null;
  if (P.ua === 0 || P.ub === 0) return null;
  if (want === "opposite" ? !P.opposite : P.opposite) return null;
  return P;
}

export function validatePlaneDistance(cfg) {
  const range = validRange(cfg?.range);
  if (!range) return null;
  const letters = (x, y) => [
    { en: x, es: x },
    { en: y, es: y },
  ];
  const first = validPair(cfg.first, range, "opposite", letters("A", "B"));
  const sameSide = validPair(cfg.same, range, "same", letters("P", "Q"));
  const transfer = validPair(cfg.transfer, range, "opposite", letters("C", "D"));
  if (!first || !sameSide || !transfer) return null;
  if (first.kind === transfer.kind && first.fixed === transfer.fixed) return null;
  for (const P of [first, sameSide, transfer]) {
    // The counted segment and its zero crossing must lie on the drawn plane.
    const ends = [onLine(P, P.ua), onLine(P, P.ub), onLine(P, 0)];
    if (!ends.every((e) => inRange(e, range))) return null;
    if (!choicesFor(P)) return null;
  }
  return { range, first, sameSide, transfer, story: storyOf(cfg.story) };
}

/** Choices for "how far apart": the distance and the mistakes students really make. */
export function choicesFor(P) {
  const { ua, ub, d, fixed } = P;
  const add = Math.abs(ua) + Math.abs(ub);
  const sub = Math.abs(Math.abs(ua) - Math.abs(ub));
  const far = Math.max(Math.abs(ua), Math.abs(ub));
  const opts = [
    { kind: "right", n: d, correct: true },
    { kind: P.opposite ? "sub" : "add", n: P.opposite ? sub : add },
    { kind: "shared", n: Math.abs(fixed) },
    { kind: "far", n: far },
  ].filter((o) => o.correct || (o.n > 0 && o.n !== d));
  const out = distinct(opts, (o) => o.n);
  return out.length >= 3 ? out : null;
}

const side = (n) => (n < 0 ? "negative" : "positive");

export function distanceCopy(v) {
  const { first, sameSide, transfer } = v;
  const lead = v.story ? { en: `${v.story.en} `, es: `${v.story.es} ` } : { en: "", es: "" };
  const abs = (n) => `|${fmt(n)}|`;
  const units = (n) => ({
    en: `${n} ${n === 1 ? "unit" : "units"}`,
    es: `${n} ${n === 1 ? "unidad" : "unidades"}`,
  });
  const lineWord = (P) =>
    P.horizontal ? { en: "row", es: "fila" } : { en: "column", es: "columna" };
  const sharing = (P) => ({
    en: `Both have ${P.fixedName} = ${fmt(P.fixed)}, so they sit in the same ${lineWord(P).en}.`,
    es: `Las dos tienen ${P.fixedName} = ${fmt(P.fixed)}, así que están en la misma ${lineWord(P).es}.`,
  });
  const pairSay = (P, intro) => ({
    en: `${intro.en}${cap(P.a.the.en)} is at ${pt(P.a)} and ${P.b.the.en} is at ${pt(P.b)}. ${sharing(P).en} How far apart are they?`,
    es: `${intro.es}${cap(P.a.the.es)} está en ${pt(P.a)} y ${P.b.the.es} está en ${pt(P.b)}. ${sharing(P).es} ¿A qué distancia están?`,
  });
  const sum = (P) => `${abs(P.ua)} + ${abs(P.ub)} = ${Math.abs(P.ua)} + ${Math.abs(P.ub)} = ${P.d}`;
  const diff = (P) => {
    const big = Math.max(Math.abs(P.ua), Math.abs(P.ub));
    const small = Math.min(Math.abs(P.ua), Math.abs(P.ub));
    return { big, small, text: `${big} ${MINUS} ${small} = ${P.d}` };
  };
  return {
    kicker: KICKER,
    title: {
      en: "Distance on the coordinate plane",
      es: "Distancia en el plano de coordenadas",
    },
    ariaLabel: {
      en: `A coordinate grid. ${cap(first.a.the.en)} ${pt(first.a)} and ${first.b.the.en} ${pt(first.b)} are ${first.d} units apart. Their distances from 0 are ${Math.abs(first.ua)} and ${Math.abs(first.ub)}, added because 0 is between them.`,
      es: `Una cuadrícula de coordenadas. ${cap(first.a.the.es)} ${pt(first.a)} y ${first.b.the.es} ${pt(first.b)} están a ${first.d} unidades. Sus distancias a 0 son ${Math.abs(first.ua)} y ${Math.abs(first.ub)}, que se suman porque el 0 queda entre ellos.`,
    },
    printSummary: {
      en: `Two points in the same row or column are ${abs(first.ua)} + ${abs(first.ub)} = ${first.d} units apart when 0 is between them (opposite signs: add the absolute values). On the same side of 0, subtract: ${diff(sameSide).text}. Distance is never negative.`,
      es: `Dos puntos en la misma fila o columna están a ${abs(first.ua)} + ${abs(first.ub)} = ${first.d} unidades cuando el 0 queda entre ellos (signos opuestos: suma los valores absolutos). Del mismo lado del 0, resta: ${diff(sameSide).text}. La distancia nunca es negativa.`,
    },
    scene: {
      situate: { en: "The map", es: "El mapa" },
      predict: { en: "Predict", es: "Predice" },
      count: { en: "Count it", es: "Cuéntalo" },
      abs: { en: "Absolute value", es: "Valor absoluto" },
      same: { en: "Same side of 0", es: "Del mismo lado del 0" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    units,
    abs,
    label: (p) => ({ en: `${p.name.en} ${pt(p)}`, es: `${p.name.es} ${pt(p)}` }),
    situateSay: pairSay(first, lead),
    predictQ: (P) => ({
      en: `How far is it from ${P.a.the.en} to ${P.b.the.en}?`,
      es: `¿Qué distancia hay ${de(P.a.the.es)} ${al(P.b.the.es)}?`,
    }),
    /** A cue for a wrong distance: names what that number is, asks where to look. */
    cue(P, opt) {
      const n = opt.n;
      const [aa, bb] = [P.a.the, P.b.the];
      const cues = {
        sub: {
          en: `${n} is what you get by subtracting ${abs(P.ua)} and ${abs(P.ub)}. That works only when both points are on the same side of 0. Look at the dashed circle at 0: is it between ${aa.en} and ${bb.en}?`,
          es: `${n} es lo que sale al restar ${abs(P.ua)} y ${abs(P.ub)}. Eso sirve solo cuando los dos puntos están del mismo lado del 0. Mira el círculo punteado en 0: ¿queda entre ${aa.es} y ${bb.es}?`,
        },
        add: {
          en: `${n} adds the two distances from 0. But 0 is not between ${aa.en} and ${bb.en}, so those stretches overlap (look at the two dashed stretches from 0). Where does the trip really start and stop?`,
          es: `${n} suma las dos distancias a 0. Pero el 0 no está entre ${aa.es} y ${bb.es}, así que esos tramos se traslapan (mira los dos tramos punteados desde 0). ¿Dónde empieza y dónde termina el recorrido de verdad?`,
        },
        shared: {
          en: `${n} is the shared ${P.fixedName}-coordinate: it tells which ${lineWord(P).en} the points are in, not how far apart they are. Count the steps from one point to the other.`,
          es: `${n} es la coordenada ${P.fixedName} que comparten: dice en qué ${lineWord(P).es} están los puntos, no a qué distancia están. Cuenta los pasos de un punto al otro.`,
        },
        far: {
          en: `${n} is only how far the farther point is from 0. The trip starts at ${aa.en}, not at 0. Where does it start?`,
          es: `${n} es solo la distancia del punto más lejano al 0. El recorrido empieza en ${aa.es}, no en 0. ¿Dónde empieza?`,
        },
      };
      return cues[opt.kind];
    },
    predictOk: (P) => ({
      en: `Yes: ${units(P.d).en}. Next, count the steps to see where that number comes from.`,
      es: `Sí: ${units(P.d).es}. Ahora cuenta los pasos para ver de dónde sale ese número.`,
    }),
    countSay: (P) => ({
      en: `Step from ${P.a.the.en} to ${P.b.the.en} one unit at a time and count each step.`,
      es: `Ve ${de(P.a.the.es)} ${al(P.b.the.es)} una unidad a la vez y cuenta cada paso.`,
    }),
    countPrompt: (P, k) => ({
      en: `Steps counted: ${k}. Step one unit toward ${P.b.the.en}.`,
      es: `Pasos contados: ${k}. Da un paso de una unidad hacia ${P.b.the.es}.`,
    }),
    stepFwd: (P) => ({
      en: `Step toward ${P.b.the.en} ${P.horizontal ? (P.dir > 0 ? "→" : "←") : P.dir > 0 ? "↑" : "↓"}`,
      es: `Paso hacia ${P.b.the.es} ${P.horizontal ? (P.dir > 0 ? "→" : "←") : P.dir > 0 ? "↑" : "↓"}`,
    }),
    countTotal: (k) => ({ en: `Steps counted: ${k}.`, es: `Pasos contados: ${k}.` }),
    stepBack: { en: "Back one step", es: "Un paso atrás" },
    countDone: (P) => ({
      en: `${units(P.d).en} in all: ${Math.abs(P.ua)} steps to reach 0, then ${Math.abs(P.ub)} more. ${Math.abs(P.ua)} + ${Math.abs(P.ub)} = ${P.d}.`,
      es: `${units(P.d).es} en total: ${Math.abs(P.ua)} pasos hasta el 0 y ${Math.abs(P.ub)} más. ${Math.abs(P.ua)} + ${Math.abs(P.ub)} = ${P.d}.`,
    }),
    absSay: (P) => ({
      en: `0 sits between the two points. The distance is two stretches put together: ${abs(P.ua)} from ${P.a.the.en} to 0, and ${abs(P.ub)} from 0 to ${P.b.the.en}.`,
      es: `El 0 queda entre los dos puntos. La distancia son dos tramos juntos: ${abs(P.ua)} ${de(P.a.the.es)} a 0 y ${abs(P.ub)} de 0 ${al(P.b.the.es)}.`,
    }),
    sumText: sum,
    absDone: {
      en: "Points on opposite sides of 0: add their absolute values. A distance is never negative.",
      es: "Puntos en lados opuestos del 0: suma sus valores absolutos. Una distancia nunca es negativa.",
    },
    sameSay: pairSay(sameSide, {
      en: "Now two points on one side of 0. ",
      es: "Ahora dos puntos de un mismo lado del 0. ",
    }),
    sameQ: {
      en: `How far apart are ${sameSide.a.name.en} and ${sameSide.b.name.en}?`,
      es: `¿A qué distancia están ${sameSide.a.name.es} y ${sameSide.b.name.es}?`,
    },
    sameOk: {
      en: `Yes: ${diff(sameSide).text}. Both points are on the same side of 0, so the shorter stretch from 0 is part of the longer one: subtract the absolute values.`,
      es: `Sí: ${diff(sameSide).text}. Los dos puntos están del mismo lado del 0, así que el tramo corto desde el 0 es parte del largo: resta los valores absolutos.`,
    },
    diffText(P) {
      const [far, near] = Math.abs(P.ua) > Math.abs(P.ub) ? [P.ua, P.ub] : [P.ub, P.ua];
      return `${abs(far)} ${MINUS} ${abs(near)} = ${Math.abs(far)} ${MINUS} ${Math.abs(near)} = ${P.d}`;
    },
    sideNote: (P) => ({
      en: `${abs(P.ua)} = ${Math.abs(P.ua)} and ${abs(P.ub)} = ${Math.abs(P.ub)}`,
      es: `${abs(P.ua)} = ${Math.abs(P.ua)} y ${abs(P.ub)} = ${Math.abs(P.ub)}`,
    }),
    transferSay: pairSay(transfer, { en: "A new pair. ", es: "Un par nuevo. " }),
    transferOk: {
      en: `Yes: ${sum(transfer)} units. They are on opposite sides of 0 (${side(transfer.ua)} and ${side(transfer.ub)}), so you add.`,
      es: `Sí: ${sum(transfer)} unidades. Están en lados opuestos del 0 (${transfer.ua < 0 ? "negativo" : "positivo"} y ${transfer.ub < 0 ? "negativo" : "positivo"}), así que sumas.`,
    },
    explainLabel: {
      en: "Explain: how did you find the distance between the two points?",
      es: "Explica: ¿cómo hallaste la distancia entre los dos puntos?",
    },
    explainFrame: {
      en: "The points ___ and ___ share the same ___-coordinate. To find the distance, I found |___| + |___| = ___, which equals ___ units.",
      es: "Los puntos ___ y ___ comparten la misma coordenada ___. Para hallar la distancia, hallé |___| + |___| = ___, que es igual a ___ unidades.",
    },
  };
}
