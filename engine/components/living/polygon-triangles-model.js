// living/polygon-triangles-model.js — the mathematics of the polygon-triangles play.
//
// Pure functions only (no DOM): every number and sentence the play shows is
// computed here, so polygon-triangles.test.mjs can recompute each one in node.
//
// A regular polygon with n sides cuts from its center into n congruent
// triangles. One triangle has base = a side and height = the distance from the
// center to the middle of a side (the lesson's rounded measure), so
// A = n × (½ × side × height). Geometry is in screen orientation (y DOWN) on a
// unit circle; the play scales it.

import { near, okInt, placeCorrect } from "./mean-balance-model.js";

export { near, placeCorrect };

export const NAMES = {
  3: { en: "triangle", es: "triángulo" },
  4: { en: "square", es: "cuadrado" },
  5: { en: "pentagon", es: "pentágono" },
  6: { en: "hexagon", es: "hexágono" },
  7: { en: "heptagon", es: "heptágono" },
  8: { en: "octagon", es: "octágono" },
  9: { en: "nonagon", es: "eneágono" },
  10: { en: "decagon", es: "decágono" },
  12: { en: "dodecagon", es: "dodecágono" },
};
export const MAX_N = 12;
/** How far the lesson's rounded height may sit from the true center-to-side distance. */
export const HEIGHT_TOLERANCE = 0.12;

export const r6 = (x) => Math.round(x * 1e6) / 1e6;
/** A number as a student reads it: no float dust, no trailing zeros. */
export const fmt = (x) => String(Math.round(x * 1e4) / 1e4);
const tenths = (x) => Number.isFinite(x) && x > 0 && x <= 60 && near(x * 10, Math.round(x * 10));

/** The true center-to-side distance for a side length: side / (2 tan(π/n)). */
export const trueHeight = (n, side) => side / (2 * Math.tan(Math.PI / n));

/** A regular polygon the stage can draw: { n, side, a }, or null. */
export function readPoly(p) {
  const [n, side, a] = [Number(p?.n), Number(p?.side), Number(p?.a)];
  if (!okInt(n, 3, MAX_N) || !NAMES[n] || !tenths(side) || !tenths(a)) return null;
  if (Math.abs(a - trueHeight(n, side)) / trueHeight(n, side) > HEIGHT_TOLERANCE) return null;
  return { n, side, a };
}
/** Area of one center triangle and of the whole polygon, from the lesson's own numbers. */
export const triArea = (s) => r6((s.side * s.a) / 2);
export const polyArea = (s) => r6(s.n * triArea(s));

/** Vertex k of the unit-circle polygon, flat side down: screen angle 90° ± 180/n. */
export function verts(n) {
  return Array.from({ length: n }, (_, k) => {
    const t = ((90 - 180 / n + (360 * k) / n) * Math.PI) / 180;
    return [Math.cos(t), Math.sin(t)];
  });
}
/** Triangle k: the center and two corners. */
export const triangle = (n, k) => {
  const v = verts(n);
  return [[0, 0], v[k], v[(k + 1) % n]];
};
/** The direction triangle k points away from the center (unit vector, y down). */
export const outward = (n, k) => {
  const t = ((90 + (360 * k) / n) * Math.PI) / 180;
  return [Math.cos(t), Math.sin(t)];
};

const textPair = (p, max = 400) =>
  p && typeof p.en === "string" && p.en.trim()
    ? { en: p.en.slice(0, max), es: String(p.es || p.en).slice(0, max) }
    : null;
export function readUnit(u) {
  const s = (p, max, d) => textPair(p, max) ?? d;
  return {
    abbr: s(u?.abbr, 12, { en: "units", es: "unidades" }),
    sq: s(u?.sq, 30, { en: "square units", es: "unidades cuadradas" }),
  };
}

/** The lesson's own other figures when a config authors none (5-9's explore table). */
const FALLBACK = { second: { n: 5, side: 6, a: 4 }, transfer: { n: 8, side: 5, a: 6 } };

export function validatePolygonTriangles(cfg) {
  const main = readPoly(cfg);
  if (!main) return null;
  const unit = readUnit(cfg.unit);
  const extra = (key) => {
    const c = cfg[key];
    const own = readPoly(c);
    const spec = own ?? readPoly(FALLBACK[key]);
    return {
      spec,
      unit: own && c.unit ? readUnit(c.unit) : unit,
      story: own ? textPair(c.story) : null,
    };
  };
  const [second, transfer] = [extra("second"), extra("transfer")];
  if (!second.spec || !transfer.spec) return null;
  const choices = [countChoices(main.n), areaChoices(second.spec), areaChoices(transfer.spec)];
  if (choices.some((c) => !c)) return null;
  return { main, unit, story: textPair(cfg.story), second, transfer };
}

/** "How many triangles?": n plus real misconceptions (cutting from one corner, half, double). */
export function countChoices(n) {
  const out = [{ kind: "count", value: n, correct: true }];
  const cands = [
    { kind: "fromCorner", value: n - 2 },
    { kind: "half", value: n % 2 === 0 ? n / 2 : 0 },
    { kind: "double", value: 2 * n },
  ];
  for (const { kind, value } of cands)
    if (value >= 2 && !out.some((o) => o.value === value))
      out.push({ kind, value, correct: false });
  return out.length >= 3 ? out : null;
}

/** "What is the whole area?": the area plus one triangle, no half, and n − 2 triangles. */
export function areaChoices(s) {
  const tri = triArea(s);
  const out = [{ kind: "total", value: polyArea(s), correct: true }];
  const cands = [
    { kind: "one", value: tri },
    { kind: "noHalf", value: r6(s.n * s.side * s.a) },
    { kind: "fromCorner", value: r6((s.n - 2) * tri) },
  ];
  for (const { kind, value } of cands)
    if (value > 0 && !out.some((o) => near(o.value, value)))
      out.push({ kind, value, correct: false });
  return out.length >= 3 ? out : null;
}

const both = (en, es) => ({ en, es });
const NOTE = both(
  " The height is a rounded measure, so the area is an estimate.",
  " La altura es una medida redondeada, así que el área es una estimación.",
);
/** True when the lesson's height is rounded enough that the area is an estimate. */
export const isEstimate = (s) => Math.abs(s.a - trueHeight(s.n, s.side)) > 0.05;

/** Every sentence the play says, as {en, es} pairs. */
export function polygonCopy(v) {
  const { main: s, unit, second, transfer } = v;
  const [u, sq] = [unit.abbr, unit.sq];
  const nm = NAMES[s.n];
  const tri = fmt(triArea(s));
  const tot = fmt(polyArea(s));
  const note = (spec) => (isEstimate(spec) ? NOTE : both("", ""));
  const [p2, p3] = [second.spec, transfer.spec];
  const [n2, n3] = [NAMES[p2.n], NAMES[p3.n]];
  const [t2, t3] = [fmt(triArea(p2)), fmt(triArea(p3))];
  const [a2, a3] = [fmt(polyArea(p2)), fmt(polyArea(p3))];
  const T = {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: both("Cut a polygon into equal triangles", "Corta un polígono en triángulos iguales"),
    ariaLabel: {
      en: `A regular ${nm.en} with ${s.n} equal sides of ${s.side} ${u.en}. Cut from the center to each corner, it makes ${s.n} equal triangles. Each has base ${s.side} and height ${s.a}, so ½ × ${s.side} × ${s.a} = ${tri} ${sq.en}. All ${s.n} together: ${s.n} × ${tri} = ${tot} ${sq.en}.`,
      es: `Un ${nm.es} regular con ${s.n} lados iguales de ${s.side} ${u.es}. Si lo cortas del centro a cada esquina, forma ${s.n} triángulos iguales. Cada uno tiene base ${s.side} y altura ${s.a}, así que ½ × ${s.side} × ${s.a} = ${tri} ${sq.es}. Los ${s.n} juntos: ${s.n} × ${tri} = ${tot} ${sq.es}.`,
    },
    printSummary: {
      en: `A regular ${nm.en} splits from its center into ${s.n} congruent triangles. One triangle: ½ × ${s.side} × ${s.a} = ${tri} ${sq.en}. Whole ${nm.en}: ${s.n} × ${tri} = ${tot} ${sq.en}. The same idea gives a ${n2.en} with ${p2.n} triangles of ${t2}: ${a2} ${second.unit.sq.en}.`,
      es: `Un ${nm.es} regular se divide desde su centro en ${s.n} triángulos congruentes. Un triángulo: ½ × ${s.side} × ${s.a} = ${tri} ${sq.es}. Todo el ${nm.es}: ${s.n} × ${tri} = ${tot} ${sq.es}. La misma idea da un ${n2.es} con ${p2.n} triángulos de ${t2}: ${a2} ${second.unit.sq.es}.`,
    },
    scene: {
      situate: both("The polygon", "El polígono"),
      predict: both("Predict", "Predice"),
      cut: both("Cut it", "Córtalo"),
      connect: both("One triangle", "Un triángulo"),
      other: both("Another polygon", "Otro polígono"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    base: both("base", "base"),
    side: both("side", "lado"),
    height: both("height", "altura"),
    situateSay: {
      en: `${v.story?.en ?? `A regular ${nm.en} has ${s.n} equal sides of ${s.side} ${u.en}.`} In a regular polygon every side is the same length and every angle is the same size.`,
      es: `${v.story?.es ?? `Un ${nm.es} regular tiene ${s.n} lados iguales de ${s.side} ${u.es}.`} En un polígono regular todos los lados miden lo mismo y todos los ángulos son iguales.`,
    },
    predictQ: both(
      `Cut the ${nm.en} from its center to every corner. How many triangles do you get?`,
      `Corta el ${nm.es} del centro a cada esquina. ¿Cuántos triángulos salen?`,
    ),
    predictSay: both(
      "Predict first, then we will cut it and count.",
      "Primero predice y luego lo cortamos y contamos.",
    ),
    predictOk: {
      en: `Yes, ${s.n} triangles: one for each side.`,
      es: `Sí, ${s.n} triángulos: uno por cada lado.`,
    },
    cutLabel: both("Pull out triangles", "Saca triángulos"),
    cutSay: both(
      "The cuts run from the center to each corner. Use the slider to pull the triangles out one at a time, and count them.",
      "Los cortes van del centro a cada esquina. Usa el control para sacar los triángulos uno por uno, y cuéntalos.",
    ),
    cutKeep: (k) => both(`${k} out. Keep going.`, `${k} fuera. Sigue.`),
    cutDone: {
      en: `All ${s.n} triangles are out, and they are the same size: ${s.n} sides, ${s.n} triangles.`,
      es: `Los ${s.n} triángulos están fuera y son del mismo tamaño: ${s.n} lados, ${s.n} triángulos.`,
    },
    connectSay1: {
      en: `One triangle: its base is a side of the ${nm.en}, ${s.side} ${u.en}, and its height is ${s.a} ${u.en}, from the center to the middle of the side. Area = ½ × ${s.side} × ${s.a} = ${tri} ${sq.en}.${note(s).en}`,
      es: `Un triángulo: su base es un lado del ${nm.es}, ${s.side} ${u.es}, y su altura es ${s.a} ${u.es}, del centro al medio del lado. Área = ½ × ${s.side} × ${s.a} = ${tri} ${sq.es}.${note(s).es}`,
    },
    allLabel: both(`Use all ${s.n} triangles`, `Usa los ${s.n} triángulos`),
    connectSay2: {
      en: `All ${s.n} triangles are the same, so multiply instead of adding ${s.n} times: ${s.n} × ${tri} = ${tot} ${sq.en}.`,
      es: `Los ${s.n} triángulos son iguales, así que multiplica en vez de sumar ${s.n} veces: ${s.n} × ${tri} = ${tot} ${sq.es}.`,
    },
    otherSay: {
      en: `${second.story?.en ?? `Here is a ${n2.en} with ${p2.n} equal sides of ${p2.side} ${second.unit.abbr.en}.`} It cuts into triangles from the center. One triangle has base ${p2.side} and height ${p2.a}.${note(p2).en}`,
      es: `${second.story?.es ?? `Aquí hay un ${n2.es} con ${p2.n} lados iguales de ${p2.side} ${second.unit.abbr.es}.`} Se corta en triángulos desde el centro. Un triángulo tiene base ${p2.side} y altura ${p2.a}.${note(p2).es}`,
    },
    otherQ: both(
      `What is the area of the whole ${n2.en}, in ${second.unit.sq.en}?`,
      `¿Cuál es el área de todo el ${n2.es}, en ${second.unit.sq.es}?`,
    ),
    otherOk: {
      en: `Right: ½ × ${p2.side} × ${p2.a} = ${t2} for one triangle, and ${p2.n} × ${t2} = ${a2} ${second.unit.sq.en}.`,
      es: `Correcto: ½ × ${p2.side} × ${p2.a} = ${t2} por un triángulo, y ${p2.n} × ${t2} = ${a2} ${second.unit.sq.es}.`,
    },
    transferSay: {
      en: `${transfer.story?.en ?? `A regular ${n3.en} has ${p3.n} equal sides of ${p3.side} ${transfer.unit.abbr.en}.`} The height from the center to the middle of a side is ${p3.a} ${transfer.unit.abbr.en}. No cuts are drawn this time.${note(p3).en}`,
      es: `${transfer.story?.es ?? `Un ${n3.es} regular tiene ${p3.n} lados iguales de ${p3.side} ${transfer.unit.abbr.es}.`} La altura del centro al medio de un lado es ${p3.a} ${transfer.unit.abbr.es}. Esta vez no hay cortes dibujados.${note(p3).es}`,
    },
    transferQ: both(
      `What is the area of the whole ${n3.en}, in ${transfer.unit.sq.en}?`,
      `¿Cuál es el área de todo el ${n3.es}, en ${transfer.unit.sq.es}?`,
    ),
    transferOk: {
      en: `Right: ${p3.n} triangles, ½ × ${p3.side} × ${p3.a} = ${t3} each, and ${p3.n} × ${t3} = ${a3} ${transfer.unit.sq.en}.`,
      es: `Correcto: ${p3.n} triángulos, ½ × ${p3.side} × ${p3.a} = ${t3} cada uno, y ${p3.n} × ${t3} = ${a3} ${transfer.unit.sq.es}.`,
    },
    explainLabel: both(
      "Explain: why do we multiply by the number of sides?",
      "Explica: ¿por qué multiplicamos por el número de lados?",
    ),
    explainFrame: both(
      "A regular polygon splits into ___ equal triangles, one for each ___, so I ___ one triangle's area by ___.",
      "Un polígono regular se divide en ___ triángulos iguales, uno por cada ___, así que ___ el área de un triángulo por ___.",
    ),
    /** A cue for a wrong count: names what the pick is, asks a question, never gives the count. */
    cueCount(opt) {
      const x = String(opt.value);
      return {
        fromCorner: both(
          `${x} is what you get cutting from just ONE corner. Here every cut starts at the center. How many sides does the ${nm.en} have?`,
          `${x} es lo que sale al cortar desde UNA sola esquina. Aquí todos los cortes parten del centro. ¿Cuántos lados tiene el ${nm.es}?`,
        ),
        half: both(
          `${x} is half the number of sides. Every side becomes the base of a triangle. Do two sides share one triangle?`,
          `${x} es la mitad del número de lados. Cada lado es la base de un triángulo. ¿Dos lados comparten un triángulo?`,
        ),
        double: both(
          `${x} is twice the number of sides. How many triangles does ONE side make?`,
          `${x} es el doble del número de lados. ¿Cuántos triángulos forma UN lado?`,
        ),
      }[opt.kind];
    },
    /** A cue for a wrong area on a given polygon. */
    cueArea(opt, spec) {
      const x = fmt(opt.value);
      return {
        one: both(
          `${x} is the area of just ONE triangle. How many triangles make the whole ${NAMES[spec.n].en}?`,
          `${x} es el área de UN solo triángulo. ¿Cuántos triángulos forman todo el ${NAMES[spec.n].es}?`,
        ),
        noHalf: both(
          `${x} is ${spec.n} × ${spec.side} × ${spec.a}. Each triangle is only half of a ${spec.side} by ${spec.a} rectangle. Did we take the half?`,
          `${x} es ${spec.n} × ${spec.side} × ${spec.a}. Cada triángulo es solo la mitad de un rectángulo de ${spec.side} por ${spec.a}. ¿Tomamos la mitad?`,
        ),
        fromCorner: both(
          `${x} counts ${spec.n - 2} triangles. From the center, how many triangles are there?`,
          `${x} cuenta ${spec.n - 2} triángulos. Desde el centro, ¿cuántos triángulos hay?`,
        ),
      }[opt.kind];
    },
  };
  return T;
}
