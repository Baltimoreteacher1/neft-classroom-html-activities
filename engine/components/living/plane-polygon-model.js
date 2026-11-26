// living/plane-polygon-model.js — validation, side lengths, choice sets and
// every sentence of the plane-polygon play (lesson 7-7). No DOM.
//
// A polygon here is a rectangle whose four vertices are ordered pairs on the
// quarter grid (so lengths like 9.5 and 6.75 are exact). Every side joins two
// vertices that share a coordinate, so its length is the distance between the
// coordinates that differ — read from the coordinates, never from the picture.

import {
  distinct,
  fmt,
  inRange,
  MINUS,
  near,
  pt,
  storyOf,
  validPoint,
  validRange,
} from "./plane-model.js";

const KICKER = { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" };
const LETTERS = ["A", "B", "C", "D"];
const par = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));

/** One side from vertex a to vertex b (they share exactly one coordinate). */
export function sideOf(a, b) {
  const horizontal = near(a.y, b.y) && !near(a.x, b.x);
  const vertical = near(a.x, b.x) && !near(a.y, b.y);
  if (!horizontal && !vertical) return null;
  const ua = horizontal ? a.x : a.y;
  const ub = horizontal ? b.x : b.y;
  const [big, small] = ua > ub ? [ua, ub] : [ub, ua];
  return {
    a,
    b,
    horizontal,
    fixed: horizontal ? a.y : a.x,
    fixedName: horizontal ? "y" : "x",
    ua,
    ub,
    big,
    small,
    len: big - small,
    opposite: big > 0 && small < 0,
  };
}

/** "|5 − (−4.5)| = 9.5": the length from the coordinates that differ. */
export const sideCalc = (s) => `|${fmt(s.big)} ${MINUS} ${par(s.small)}| = ${fmt(s.len)}`;

/** Four vertices forming an axis-aligned rectangle, or null. */
export function rectangle(points, range) {
  if (!Array.isArray(points) || points.length !== 4) return null;
  const vs = points.map((p) => validPoint(p, range));
  if (vs.some((p) => !p)) return null;
  const sides = vs.map((p, i) => sideOf(p, vs[(i + 1) % 4]));
  if (sides.some((s) => !s)) return null;
  if (!sides.every((s, i) => s.horizontal !== sides[(i + 1) % 4].horizontal)) return null;
  return { vs, sides, perimeter: sides.reduce((t, s) => t + s.len, 0) };
}

/** Choices for the length of one side. */
export function sideChoices(s) {
  const add = Math.abs(s.big) + Math.abs(s.small);
  const sub = Math.abs(Math.abs(s.big) - Math.abs(s.small));
  const opts = [
    { kind: "right", n: s.len, correct: true },
    { kind: s.opposite ? "sub" : "add", n: s.opposite ? sub : add },
    { kind: "shared", n: Math.abs(s.fixed) },
    { kind: "whole", n: Math.floor(s.len) },
  ].filter((o) => o.correct || (o.n > 0 && !near(o.n, s.len)));
  const out = distinct(opts, (o) => o.n);
  return out.length >= 3 ? out : null;
}

/** Choices for the perimeter of a rectangle. */
export function perimeterChoices(R) {
  const [w, h] = [R.sides[0].len, R.sides[1].len];
  const opts = [
    { kind: "right", n: R.perimeter, correct: true },
    { kind: "half", n: w + h },
    { kind: "area", n: w * h },
    { kind: "double", n: 2 * Math.max(w, h) },
  ].filter((o) => o.correct || !near(o.n, R.perimeter));
  const out = distinct(opts, (o) => o.n);
  return out.length >= 3 ? out : null;
}

export function validatePlanePolygon(cfg) {
  const range = validRange(cfg?.range);
  if (!range) return null;
  const first = rectangle(cfg.rect, range);
  const transfer = rectangle(cfg.transfer, range);
  if (!first || !transfer) return null;
  for (const R of [first, transfer]) {
    if (!R.vs.every((p) => inRange(p, range))) return null;
    if (!sideChoices(R.sides[0]) || !perimeterChoices(R)) return null;
  }
  // The scene-4 and scene-5 lesson idea needs two different side lengths.
  if (near(first.sides[0].len, first.sides[1].len)) return null;
  const same = first.vs.every((p, i) => near(p.x, transfer.vs[i].x) && near(p.y, transfer.vs[i].y));
  if (same) return null;
  return { range, first, transfer, story: storyOf(cfg.story) };
}

export function polygonCopy(v) {
  const { first: R, transfer: S } = v;
  const lead = v.story ? { en: `${v.story.en} `, es: `${v.story.es} ` } : { en: "", es: "" };
  const units = (n) => ({
    en: `${fmt(n)} ${near(n, 1) ? "unit" : "units"}`,
    es: `${fmt(n)} ${near(n, 1) ? "unidad" : "unidades"}`,
  });
  const vlist = (P) => P.vs.map((p, i) => `${LETTERS[i]} ${pt(p)}`).join(", ");
  const s0 = R.sides[0];
  const s1 = R.sides[1];
  const perimTerms = (P) => P.sides.map((s) => fmt(s.len)).join(" + ");
  const perimCalc = (P) => `${perimTerms(P)} = ${fmt(P.perimeter)}`;
  const twice = (P) => {
    const [w, h] = [P.sides[0].len, P.sides[1].len];
    return `2(${fmt(w)}) + 2(${fmt(h)}) = ${fmt(2 * w)} + ${fmt(2 * h)} = ${fmt(P.perimeter)}`;
  };
  const nm = (i) => `${LETTERS[i]}${LETTERS[(i + 1) % 4]}`;
  return {
    kicker: KICKER,
    title: {
      en: "Draw a polygon from its vertices",
      es: "Dibuja un polígono con sus vértices",
    },
    ariaLabel: {
      en: `A coordinate grid with a rectangle whose vertices are ${vlist(R)}. Its sides are ${fmt(s0.len)} and ${fmt(s1.len)} units long, so its perimeter is ${fmt(R.perimeter)} units.`,
      es: `Una cuadrícula de coordenadas con un rectángulo de vértices ${vlist(R)}. Sus lados miden ${fmt(s0.len)} y ${fmt(s1.len)} unidades, así que su perímetro es de ${fmt(R.perimeter)} unidades.`,
    },
    printSummary: {
      en: `Plot the vertices ${vlist(R)} and connect them in order. Two vertices that share a coordinate bound a horizontal or vertical side, and its length is the distance between the coordinates that differ: ${sideCalc(s0)} units. Perimeter: ${twice(R)} units.`,
      es: `Marca los vértices ${vlist(R)} y únelos en orden. Dos vértices que comparten una coordenada forman un lado horizontal o vertical, y su longitud es la distancia entre las coordenadas que cambian: ${sideCalc(s0)} unidades. Perímetro: ${twice(R)} unidades.`,
    },
    scene: {
      situate: { en: "The vertices", es: "Los vértices" },
      plot: { en: "Plot them", es: "Márcalos" },
      predict: { en: "Predict a side", es: "Predice un lado" },
      measure: { en: "Measure the sides", es: "Mide los lados" },
      perimeter: { en: "Perimeter", es: "Perímetro" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    units,
    letters: LETTERS,
    label: (p, i) => `${LETTERS[i]} ${pt(p)}`,
    list: vlist,
    situateSay: {
      en: `${lead.en}A rectangle has four vertices. A vertex is a corner named by an ordered pair: ${vlist(R)}.`,
      es: `${lead.es}Un rectángulo tiene cuatro vértices. Un vértice es una esquina nombrada por un par ordenado: ${vlist(R)}.`,
    },
    plotQ: (i) => ({
      en: `Plot vertex ${LETTERS[i]}, ${pt(R.vs[i])}.`,
      es: `Marca el vértice ${LETTERS[i]}, ${pt(R.vs[i])}.`,
    }),
    plotSay: (i) => ({
      en: `Plot the vertices one at a time and connect them in order. Tap the grid, or use the buttons for steps of 1 or 0.25. Vertex ${LETTERS[i]} is ${pt(R.vs[i])}.`,
      es: `Marca los vértices uno por uno y únelos en orden. Toca la cuadrícula o usa los botones para pasos de 1 o de 0.25. El vértice ${LETTERS[i]} es ${pt(R.vs[i])}.`,
    }),
    plotOk: (i) =>
      i < 3
        ? {
            en: `Yes: ${LETTERS[i]} is at ${pt(R.vs[i])}.`,
            es: `Sí: ${LETTERS[i]} está en ${pt(R.vs[i])}.`,
          }
        : {
            en: `Four vertices, connected in order: the rectangle appears. The coordinates that placed the corners will also give the side lengths.`,
            es: `Cuatro vértices unidos en orden: aparece el rectángulo. Las coordenadas que ubicaron las esquinas también dan las longitudes de los lados.`,
          },
    place: { en: "Place the vertex", es: "Colocar el vértice" },
    predictSay: {
      en: `Look at ${nm(0)}. ${LETTERS[0]} ${pt(s0.a)} and ${LETTERS[1]} ${pt(s0.b)} share ${s0.fixedName} = ${fmt(s0.fixed)}, so this side is ${s0.horizontal ? "horizontal" : "vertical"}. How long is it?`,
      es: `Mira ${nm(0)}. ${LETTERS[0]} ${pt(s0.a)} y ${LETTERS[1]} ${pt(s0.b)} comparten ${s0.fixedName} = ${fmt(s0.fixed)}, así que este lado es ${s0.horizontal ? "horizontal" : "vertical"}. ¿Cuánto mide?`,
    },
    lengthQ: (i) => ({
      en: `How long is side ${nm(i)}?`,
      es: `¿Cuánto mide el lado ${nm(i)}?`,
    }),
    lengthCue(s, opt) {
      const n = fmt(opt.n);
      const cues = {
        sub: {
          en: `${n} is what you get by subtracting ${fmt(Math.abs(s.big))} and ${fmt(Math.abs(s.small))}, as if both ends were on the same side of 0. Look at the dashed circle at 0: is it between the two ends?`,
          es: `${n} sale de restar ${fmt(Math.abs(s.big))} y ${fmt(Math.abs(s.small))}, como si los dos extremos estuvieran del mismo lado del 0. Mira el círculo punteado en 0: ¿queda entre los dos extremos?`,
        },
        add: {
          en: `${n} adds the two distances from 0, but both ends are on the same side of 0. Where does the side start and stop?`,
          es: `${n} suma las dos distancias a 0, pero los dos extremos están del mismo lado del 0. ¿Dónde empieza y dónde termina el lado?`,
        },
        shared: {
          en: `${n} is the shared ${s.fixedName}-coordinate: it says where the side is, not how long it is. Which coordinates differ?`,
          es: `${n} es la coordenada ${s.fixedName} que comparten: dice dónde está el lado, no cuánto mide. ¿Cuáles coordenadas cambian?`,
        },
        whole: {
          en: `${n} leaves out the part after the decimal point. Count from one end to 0, then from 0 to the other end: how much is each part?`,
          es: `${n} deja fuera la parte después del punto decimal. Cuenta de un extremo al 0 y luego del 0 al otro extremo: ¿cuánto vale cada parte?`,
        },
      };
      return cues[opt.kind];
    },
    lengthOk: (s) => ({
      en: `Yes: ${sideCalc(s)} units. The side is ${s.horizontal ? "horizontal" : "vertical"} because the ${s.fixedName}-coordinates match, so only the ${s.horizontal ? "x" : "y"}-coordinates matter.`,
      es: `Sí: ${sideCalc(s)} unidades. El lado es ${s.horizontal ? "horizontal" : "vertical"} porque las coordenadas ${s.fixedName} coinciden, así que solo importan las coordenadas ${s.horizontal ? "x" : "y"}.`,
    }),
    measureSay: {
      en: "Each side is found the same way: the two vertices share one coordinate, and the length is the distance between the other two.",
      es: "Cada lado se halla igual: los dos vértices comparten una coordenada y la longitud es la distancia entre las otras dos.",
    },
    measureDone: {
      en: `Opposite sides of a rectangle match: two sides of ${fmt(s0.len)} and two of ${fmt(s1.len)}.`,
      es: `Los lados opuestos de un rectángulo coinciden: dos lados de ${fmt(s0.len)} y dos de ${fmt(s1.len)}.`,
    },
    perimeterSay: {
      en: "The perimeter is the distance all the way around the polygon.",
      es: "El perímetro es la distancia alrededor de todo el polígono.",
    },
    perimeterQ: {
      en: "What is the perimeter of the rectangle?",
      es: "¿Cuál es el perímetro del rectángulo?",
    },
    perimeterCue(P, opt) {
      const n = fmt(opt.n);
      const [w, h] = [fmt(P.sides[0].len), fmt(P.sides[1].len)];
      const cues = {
        half: {
          en: `${n} is ${w} + ${h}: only two of the sides (the lit ones). Walk around the whole edge: how many sides does the rectangle have?`,
          es: `${n} es ${w} + ${h}: solo dos de los lados (los resaltados). Recorre todo el borde: ¿cuántos lados tiene el rectángulo?`,
        },
        double: {
          en: `${n} counts only the two sides that are ${w} long (the lit ones). What about the other two sides?`,
          es: `${n} cuenta solo los dos lados que miden ${w} (los resaltados). ¿Y los otros dos lados?`,
        },
        area: {
          en: `${n} is ${w} × ${h}: that measures the space inside the rectangle. Perimeter is the distance around the outside. Which sides do you walk along?`,
          es: `${n} es ${w} × ${h}: eso mide el espacio dentro del rectángulo. El perímetro es la distancia alrededor del borde. ¿Por cuáles lados caminas?`,
        },
      };
      return cues[opt.kind];
    },
    perimeterOk: (P) => ({
      en: `Perimeter = ${twice(P)} units. Each length appears on two sides, so two of the terms are multiplied by 2.`,
      es: `Perímetro = ${twice(P)} unidades. Cada longitud aparece en dos lados, así que dos de los términos se multiplican por 2.`,
    }),
    perimeterCalc: perimCalc,
    transferSay: {
      en: `A new polygon: the same four dots move to vertices ${vlist(S)}. Find one side from the coordinates, then the perimeter.`,
      es: `Un polígono nuevo: los mismos cuatro puntos se mueven a los vértices ${vlist(S)}. Halla un lado con las coordenadas y luego el perímetro.`,
    },
    transferSideOk: (s) => ({
      en: `Yes: ${sideCalc(s)} units. Now the perimeter.`,
      es: `Sí: ${sideCalc(s)} unidades. Ahora el perímetro.`,
    }),
    explainLabel: {
      en: "Explain: which two vertices did you use, and why did their shared coordinate matter?",
      es: "Explica: ¿qué dos vértices usaste y por qué importó la coordenada que comparten?",
    },
    explainFrame: {
      en: "I used the vertices ___ and ___. They share the same ___-coordinate, so the side length is |___ − ___| = ___.",
      es: "Usé los vértices ___ y ___. Comparten la misma coordenada ___, así que la longitud del lado es |___ − ___| = ___.",
    },
  };
}
