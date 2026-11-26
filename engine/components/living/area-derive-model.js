// living/area-derive-model.js — the mathematics of the area-derive play.
//
// Pure functions only (no DOM): every number and sentence the play shows is
// computed here, so area-derive.test.mjs can recompute each one in node.
//
// One idea per shape, all by moving the SAME pieces:
//   parallelogram — cut the triangle off one end and slide it across: a
//                   rectangle, so A = b × h (the height, not the slanted side);
//   triangle      — two copies make a parallelogram, so A = ½ × b × h;
//   trapezoid     — two copies make a parallelogram with base b1 + b2, so
//                   A = ½ × (b1 + b2) × h.
// Geometry is in math units with y UP; the play maps it to the stage.

import { near, okInt, placeCorrect } from "./mean-balance-model.js";

export { near, okInt, placeCorrect };

export const SHAPES = ["parallelogram", "triangle", "trapezoid"];
export const r4 = (x) => Math.round(x * 1e4) / 1e4;
/** A number as a student reads it: no float dust, no trailing zeros. */
export const fmt = (x) => String(r4(x));
export const shoelace = (pts) =>
  Math.abs(
    pts.reduce((s, [x1, y1], i) => {
      const [x2, y2] = pts[(i + 1) % pts.length];
      return s + x1 * y2 - x2 * y1;
    }, 0),
  ) / 2;

/** The stand-in numbers when a lesson authors no transfer (the lessons' own practice figures). */
const FALLBACK = {
  parallelogram: { b: 10, h: 7 },
  triangle: { b: 10, h: 6 },
  trapezoid: { b1: 6, b2: 10, h: 4 },
};

/** A spec is one drawable figure: { shape, h, lean, b | b1,b2 }. null when it cannot be drawn. */
export function readSpec(shape, c) {
  const h = Number(c?.h);
  if (!SHAPES.includes(shape) || !okInt(h, 1, 30)) return null;
  if (shape === "trapezoid") {
    const [b1, b2] = [Number(c.b1), Number(c.b2)];
    if (!okInt(b1, 1, 29) || !okInt(b2, b1 + 1, 30)) return null;
    const lean = c.offset == null ? Math.floor((b2 - b1) / 2) : Number(c.offset);
    return okInt(lean, 0, b2 - b1) ? { shape, h, b1, b2, lean } : null;
  }
  const b = Number(c.b);
  if (!okInt(b, 2, 30)) return null;
  const key = shape === "triangle" ? "apex" : "offset";
  const dflt = shape === "triangle" ? Math.round(b / 2) : Math.min(2, b);
  const lean = c[key] == null ? dflt : Number(c[key]);
  if (!okInt(lean, 0, b) || (shape === "parallelogram" && lean < 1)) return null;
  return { shape, h, b, lean };
}

export const baseOf = (s) => (s.shape === "trapezoid" ? s.b2 : s.b);
export const area = (s) =>
  s.shape === "parallelogram"
    ? s.b * s.h
    : s.shape === "triangle"
      ? (s.b * s.h) / 2
      : ((s.b1 + s.b2) * s.h) / 2;
/** The doubled figure's area: the parallelogram (or rectangle) the pieces build. */
export const wholeArea = (s) => (s.shape === "trapezoid" ? (s.b1 + s.b2) * s.h : s.b * s.h);
/** The lean slider's range: top-edge offset (parallelogram, trapezoid) or apex position (triangle). */
export const leanMax = (s) =>
  s.shape === "parallelogram"
    ? Math.min(s.b, s.lean + 4)
    : s.shape === "triangle"
      ? s.b
      : s.b2 - s.b1;
/** The box the stage must hold, in units: the figure at every lean the slider allows, and the doubled figure. */
export function bounds(s) {
  const pts = [];
  for (let l = 0; l <= leanMax(s); l++) pts.push(...geom(s, l).outline);
  pts.push(...geom(s).final);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** The slanted side (left side/leg), rounded to a tenth for labels; null when it is the height. */
export const slantLen = (s, lean = s.lean) => Math.hypot(lean, s.h);
export const slantLabel = (s) => (s.lean > 0 ? Math.round(slantLen(s) * 10) / 10 : null);

/**
 * Every polygon of the figure at a given lean.
 *  outline — the figure; p1/p2 — the two pieces (p2 is what moves);
 *  move — para: p2 slides by (b, 0); pivot — tri/trap: p2 is flipped over it (a half turn);
 *  final — the shape the two pieces make; foot — x of the height line.
 */
export function geom(s, lean = s.lean) {
  const { h } = s;
  if (s.shape === "parallelogram") {
    const [o, b] = [lean, s.b];
    return {
      outline: [
        [0, 0],
        [b, 0],
        [b + o, h],
        [o, h],
      ],
      p1: [
        [o, 0],
        [b, 0],
        [b + o, h],
        [o, h],
      ],
      p2: [
        [0, 0],
        [o, 0],
        [o, h],
      ],
      move: [b, 0],
      pivot: null,
      final: [
        [o, 0],
        [b + o, 0],
        [b + o, h],
        [o, h],
      ],
      foot: o,
      left: [
        [0, 0],
        [o, h],
      ],
      baseSpan: [0, b],
    };
  }
  const outline =
    s.shape === "triangle"
      ? [
          [0, 0],
          [s.b, 0],
          [lean, h],
        ]
      : [
          [0, 0],
          [s.b2, 0],
          [lean + s.b1, h],
          [lean, h],
        ];
  const [b, t] = s.shape === "triangle" ? [s.b, 0] : [s.b2, s.b1];
  // Half turn about the middle of the right side (a leg of the trapezoid).
  const c = outline[2];
  const pivot = [(b + c[0]) / 2, h / 2];
  return {
    outline,
    p1: outline,
    p2: outline,
    move: null,
    pivot,
    final:
      s.shape === "triangle"
        ? [
            [0, 0],
            [b, 0],
            [b + lean, h],
            [lean, h],
          ]
        : [
            [0, 0],
            [b + t, 0],
            [b + t + lean, h],
            [lean, h],
          ],
    foot: lean,
    left: [
      [0, 0],
      [lean, h],
    ],
    baseSpan: [0, b],
  };
}

/** Where a point lands when the copy is flipped sideways, then upside down, over the pivot (a half turn). */
export const turned = (pt, pivot) => [2 * pivot[0] - pt[0], 2 * pivot[1] - pt[1]];

/** The choices for "what is the area?": the area plus real misconceptions, or null. */
export function choiceSet(s) {
  const out = [{ kind: "correct", value: area(s), correct: true }];
  const sl = slantLabel(s);
  const cands =
    s.shape === "parallelogram"
      ? [
          ["slant", sl && s.b * sl],
          ["add", s.b + s.h],
          ["half", (s.b * s.h) / 2],
        ]
      : s.shape === "triangle"
        ? [
            ["noHalf", s.b * s.h],
            ["slant", sl && (s.b * sl) / 2],
            ["add", s.b + s.h],
          ]
        : [
            ["noHalf", (s.b1 + s.b2) * s.h],
            ["longBase", (s.b2 * s.h) / 2],
            ["slant", sl && ((s.b1 + s.b2) * sl) / 2],
            ["add", s.b1 + s.b2 + s.h],
          ];
  for (const [kind, raw] of cands) {
    const value = r4(raw || 0);
    if (out.length < 4 && value > 0 && !out.some((o) => near(o.value, value)))
      out.push({ kind, value, correct: false });
  }
  return out.length >= 3 ? out : null;
}

const textPair = (p, max = 400) =>
  p && typeof p.en === "string" && p.en.trim()
    ? { en: p.en.slice(0, max), es: String(p.es || p.en).slice(0, max) }
    : null;
const short = (p, max, d) => textPair(p, max) ?? d;

export function readUnit(u) {
  return {
    abbr: short(u?.abbr, 12, { en: "units", es: "unidades" }),
    sq: short(u?.sq, 30, { en: "square units", es: "unidades cuadradas" }),
  };
}

/** The transfer figure: authored dims when valid, else the lesson-family stand-in. */
function readTransfer(shape, t, unit) {
  const fb = FALLBACK[shape];
  const spec = (t && readSpec(shape, t)) || readSpec(shape, fb);
  return {
    spec,
    unit: t && readSpec(shape, t) && t.unit ? readUnit(t.unit) : unit,
    story: textPair(t?.story),
  };
}

export function validateAreaDerive(cfg) {
  const main = readSpec(cfg?.shape, cfg);
  if (!main || !choiceSet(main)) return null;
  const unit = readUnit(cfg.unit);
  const transfer = readTransfer(main.shape, cfg.transfer, unit);
  if (!transfer.spec || !choiceSet(transfer.spec)) return null;
  return { main, unit, story: textPair(cfg.story), transfer };
}

const NAME = {
  parallelogram: { en: "parallelogram", es: "paralelogramo" },
  triangle: { en: "triangle", es: "triángulo" },
  trapezoid: { en: "trapezoid", es: "trapecio" },
};

/** The formula with numbers in, as text: "½ × 12 × 8". */
export function formula(s) {
  if (s.shape === "parallelogram") return `${s.b} × ${s.h}`;
  if (s.shape === "triangle") return `½ × ${s.b} × ${s.h}`;
  return `½ × (${s.b1} + ${s.b2}) × ${s.h}`;
}
export const wholeFormula = (s) =>
  s.shape === "trapezoid" ? `(${s.b1} + ${s.b2}) × ${s.h}` : `${s.b} × ${s.h}`;

/** Every sentence the play says, as {en, es} pairs. */
export function deriveCopy(v) {
  const { main: s, unit, story } = v;
  const sh = s.shape;
  const u = unit.abbr;
  const sq = unit.sq;
  const nm = NAME[sh];
  const both = (en, es) => ({ en, es });
  const A = fmt(area(s));
  const W = fmt(wholeArea(s));
  const sl = slantLabel(s);
  const isPar = sh === "parallelogram";
  const isTri = sh === "triangle";
  const dims = (spec, un) => {
    const x = un.abbr;
    return spec.shape === "trapezoid"
      ? {
          en: `bases ${spec.b1} ${x.en} and ${spec.b2} ${x.en}, height ${spec.h} ${x.en}`,
          es: `bases de ${spec.b1} ${x.es} y ${spec.b2} ${x.es}, altura de ${spec.h} ${x.es}`,
        }
      : {
          en: `base ${spec.b} ${x.en}, height ${spec.h} ${x.en}`,
          es: `base de ${spec.b} ${x.es}, altura de ${spec.h} ${x.es}`,
        };
  };
  const dm = dims(s, unit);
  const slantEn = sl ? ` The slanted side is about ${fmt(sl)} ${u.en}; it is not the height.` : "";
  const slantEs = sl ? ` El lado inclinado mide unos ${fmt(sl)} ${u.es}; no es la altura.` : "";
  const aria = {
    parallelogram: {
      en: `A parallelogram with base ${s.b} ${u.en} and height ${s.h} ${u.en}. Cut along the height and slide the triangle to the other end: a rectangle ${s.b} by ${s.h}, area ${W} ${sq.en}.`,
      es: `Un paralelogramo con base de ${s.b} ${u.es} y altura de ${s.h} ${u.es}. Se corta por la altura y se desliza el triángulo al otro extremo: un rectángulo de ${s.b} por ${s.h}, área ${W} ${sq.es}.`,
    },
    triangle: {
      en: `A triangle with base ${s.b} ${u.en} and height ${s.h} ${u.en}. A flipped copy makes a parallelogram of area ${W} ${sq.en}, so the triangle is half: ${A} ${sq.en}.`,
      es: `Un triángulo con base de ${s.b} ${u.es} y altura de ${s.h} ${u.es}. Una copia volteada forma un paralelogramo de área ${W} ${sq.es}, así que el triángulo es la mitad: ${A} ${sq.es}.`,
    },
    trapezoid: {
      en: `A trapezoid with bases ${s.b1} and ${s.b2} ${u.en} and height ${s.h} ${u.en}. A flipped copy makes a parallelogram of base ${s.b1 + s.b2}, area ${W} ${sq.en}, so the trapezoid is half: ${A} ${sq.en}.`,
      es: `Un trapecio con bases de ${s.b1} y ${s.b2} ${u.es} y altura de ${s.h} ${u.es}. Una copia volteada forma un paralelogramo de base ${s.b1 + s.b2}, área ${W} ${sq.es}, así que el trapecio es la mitad: ${A} ${sq.es}.`,
    },
  }[sh];
  const T = {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: {
      parallelogram: both(
        "Slide a triangle: parallelogram to rectangle",
        "Desliza un triángulo: de paralelogramo a rectángulo",
      ),
      triangle: both(
        "Two triangles make a parallelogram",
        "Dos triángulos forman un paralelogramo",
      ),
      trapezoid: both(
        "Two trapezoids make a parallelogram",
        "Dos trapecios forman un paralelogramo",
      ),
    }[sh],
    ariaLabel: aria,
    printSummary: {
      en: `${aria.en} Area = ${formula(s)} = ${A} ${sq.en}.`,
      es: `${aria.es} Área = ${formula(s)} = ${A} ${sq.es}.`,
    },
    scene: {
      situate: both("The shape", "La figura"),
      predict: both("Predict", "Predice"),
      build: isPar
        ? both("Cut and slide", "Corta y desliza")
        : both("Copy and turn", "Copia y gira"),
      connect: both("The formula", "La fórmula"),
      change: both("What if it leans?", "¿Y si se inclina?"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    base: both("base", "base"),
    height: both("height", "altura"),
    slant: both("slanted side", "lado inclinado"),
    slantShort: both("slanted", "inclinado"),
    startOver: both("Start over", "Empezar de nuevo"),
    situateSay: {
      en: `${story?.en ?? `A ${nm.en}: ${dm.en}.`} The dashed line is the height: ${s.h} ${u.en}, straight up from the base at a square corner.${slantEn}`,
      es: `${story?.es ?? `Un ${nm.es}: ${dm.es}.`} La línea punteada es la altura: ${s.h} ${u.es}, derecho hacia arriba desde la base en una esquina recta.${slantEs}`,
    },
    predictQ: both(
      `What do you predict the area is, in ${sq.en}?`,
      `¿Cuál crees que es el área, en ${sq.es}?`,
    ),
    predictSay: both(
      "Predict first, then we will test it with the pieces. Look at the picture: which measurements matter?",
      "Primero predice y luego lo probamos con las piezas. Mira la figura: ¿qué medidas importan?",
    ),
    predictOk: both(
      `Good prediction: ${A} ${sq.en}. Now let us see why it works.`,
      `Buena predicción: ${A} ${sq.es}. Ahora veamos por qué funciona.`,
    ),
    slideLabel: both("Slide the triangle", "Desliza el triángulo"),
    turnLabel: both("Flip the copy", "Voltea la copia"),
    buildSay: {
      parallelogram: both(
        "Cut along the dashed height. That makes a triangle at the left end. Use the slider to slide that triangle to the right end.",
        "Corta por la altura punteada. Eso forma un triángulo en el extremo izquierdo. Usa el control para deslizar ese triángulo al extremo derecho.",
      ),
      triangle: both(
        "Here is a copy of the triangle on top of it (amber). Use the slider to flip the copy over the dot, the middle of the right side: first sideways, then upside down.",
        "Aquí hay una copia del triángulo encima (ámbar). Usa el control para voltear la copia sobre el punto, el medio del lado derecho: primero hacia un lado y luego de cabeza.",
      ),
      trapezoid: both(
        "Here is a copy of the trapezoid on top of it (amber). Use the slider to flip the copy over the dot, the middle of the right leg: first sideways, then upside down.",
        "Aquí hay una copia del trapecio encima (ámbar). Usa el control para voltear la copia sobre el punto, el medio del lado derecho: primero hacia un lado y luego de cabeza.",
      ),
    }[sh],
    slideKeep: (left) =>
      both(`Keep sliding: ${left} more ${u.en}.`, `Sigue deslizando: faltan ${left} ${u.es}.`),
    turnKeep: both("Keep flipping the copy.", "Sigue volteando la copia."),
    buildDone: {
      parallelogram: both(
        `It fits. Nothing was added or taken away, so the area did not change. The parallelogram is now a rectangle ${s.b} ${u.en} wide and ${s.h} ${u.en} tall.`,
        `Encaja. No se agregó ni se quitó nada, así que el área no cambió. El paralelogramo ahora es un rectángulo de ${s.b} ${u.es} de ancho y ${s.h} ${u.es} de alto.`,
      ),
      triangle: both(
        `The two triangles fit into a parallelogram with base ${s.b} ${u.en} and height ${s.h} ${u.en}. Two equal triangles make it, so one triangle is half of it.`,
        `Los dos triángulos encajan en un paralelogramo con base de ${s.b} ${u.es} y altura de ${s.h} ${u.es}. Lo forman dos triángulos iguales, así que un triángulo es la mitad.`,
      ),
      trapezoid: both(
        `The two trapezoids fit into a parallelogram. Its base is ${s.b2} + ${s.b1} = ${s.b1 + s.b2} ${u.en} and its height is still ${s.h} ${u.en}. One trapezoid is half of it.`,
        `Los dos trapecios encajan en un paralelogramo. Su base es ${s.b2} + ${s.b1} = ${s.b1 + s.b2} ${u.es} y su altura sigue siendo ${s.h} ${u.es}. Un trapecio es la mitad.`,
      ),
    }[sh],
    connectSay1: {
      parallelogram: both(
        `The rectangle is ${s.b} wide and ${s.h} tall: ${s.b} × ${s.h} = ${W} ${sq.en}. The grid shows ${s.h} rows of ${s.b} squares. The triangle only moved, so the parallelogram has this area too. Area = base × height.`,
        `El rectángulo mide ${s.b} de ancho y ${s.h} de alto: ${s.b} × ${s.h} = ${W} ${sq.es}. La cuadrícula muestra ${s.h} filas de ${s.b} cuadrados. El triángulo solo se movió, así que el paralelogramo tiene esta misma área. Área = base × altura.`,
      ),
      triangle: both(
        `Both triangles together: base ${s.b} × height ${s.h} = ${W} ${sq.en}.`,
        `Los dos triángulos juntos: base ${s.b} × altura ${s.h} = ${W} ${sq.es}.`,
      ),
      trapezoid: both(
        `Both trapezoids together: (${s.b1} + ${s.b2}) × ${s.h} = ${W} ${sq.en}.`,
        `Los dos trapecios juntos: (${s.b1} + ${s.b2}) × ${s.h} = ${W} ${sq.es}.`,
      ),
    }[sh],
    connectSay2: {
      parallelogram: null,
      triangle: both(
        `One triangle is half of that: ½ × ${s.b} × ${s.h} = ${A} ${sq.en}. Area = ½ × base × height.`,
        `Un triángulo es la mitad: ½ × ${s.b} × ${s.h} = ${A} ${sq.es}. Área = ½ × base × altura.`,
      ),
      trapezoid: both(
        `One trapezoid is half of that: ½ × (${s.b1} + ${s.b2}) × ${s.h} = ${A} ${sq.en}. Area = ½ × (b1 + b2) × height.`,
        `Un trapecio es la mitad: ½ × (${s.b1} + ${s.b2}) × ${s.h} = ${A} ${sq.es}. Área = ½ × (b1 + b2) × altura.`,
      ),
    }[sh],
    leanLabel: {
      parallelogram: both("Lean the top", "Inclina la parte de arriba"),
      triangle: both("Move the top corner", "Mueve la esquina de arriba"),
      trapezoid: both("Slide the top edge", "Desliza el borde de arriba"),
    }[sh],
    changeSay: {
      parallelogram: both(
        `Use the slider to lean the top. The slanted side changes. Watch the base (${s.b}) and the height (${s.h}): do they change? Does the area?`,
        `Usa el control para inclinar la parte de arriba. El lado inclinado cambia. Mira la base (${s.b}) y la altura (${s.h}): ¿cambian? ¿Cambia el área?`,
      ),
      triangle: both(
        `Use the slider to move the top corner along the top. Both slanted sides change. Watch the base (${s.b}) and the height (${s.h}): do they change? Does the area?`,
        `Usa el control para mover la esquina de arriba. Los dos lados inclinados cambian. Mira la base (${s.b}) y la altura (${s.h}): ¿cambian? ¿Cambia el área?`,
      ),
      trapezoid: both(
        `Use the slider to slide the top edge sideways. The legs change. Watch the bases and the height (${s.h}): do they change? Does the area?`,
        `Usa el control para deslizar el borde de arriba hacia un lado. Los lados cambian. Mira las bases y la altura (${s.h}): ¿cambian? ¿Cambia el área?`,
      ),
    }[sh],
    changeRow: {
      en: `${isPar || isTri ? `Base ${s.b}` : `Bases ${s.b1} and ${s.b2}`}, height ${s.h} did not change. Area = ${formula(s)} = <b>${A}</b> ${sq.en}. Still ${A}.`,
      es: `${isPar || isTri ? `Base ${s.b}` : `Bases ${s.b1} y ${s.b2}`}, altura ${s.h}: no cambiaron. Área = ${formula(s)} = <b>${A}</b> ${sq.es}. Sigue siendo ${A}.`,
    },
    tryMore: (left) =>
      both(
        left === 1 ? "Try one more position." : "Try two more positions.",
        left === 1 ? "Prueba una posición más." : "Prueba dos posiciones más.",
      ),
    tryThree: both(
      "Try at least three different positions.",
      "Prueba al menos tres posiciones diferentes.",
    ),
    changeLesson: {
      parallelogram: both(
        `The slant changed, but the base and the height did not, and neither did the area. The slanted side never goes in the formula: use the height that meets the base at a square corner.`,
        `La inclinación cambió, pero la base y la altura no, y el área tampoco. El lado inclinado nunca va en la fórmula: usa la altura que forma una esquina recta con la base.`,
      ),
      triangle: both(
        `The corner moved, but with the same base and height the area stayed ${A}. Only the base and the perpendicular height decide the area.`,
        `La esquina se movió, pero con la misma base y altura el área se quedó en ${A}. Solo la base y la altura perpendicular deciden el área.`,
      ),
      trapezoid: both(
        `The top edge moved, but with the same bases and height the area stayed ${A}. Only the two bases and the perpendicular height decide the area.`,
        `El borde de arriba se movió, pero con las mismas bases y altura el área se quedó en ${A}. Solo las dos bases y la altura perpendicular deciden el área.`,
      ),
    }[sh],
    explainLabel: {
      parallelogram: both(
        "Explain: why do we use the height, not the slanted side?",
        "Explica: ¿por qué usamos la altura y no el lado inclinado?",
      ),
      triangle: both("Explain: why do we take half?", "Explica: ¿por qué tomamos la mitad?"),
      trapezoid: both(
        "Explain: why do we add the bases and take half?",
        "Explica: ¿por qué sumamos las bases y tomamos la mitad?",
      ),
    }[sh],
    explainFrame: {
      parallelogram: both(
        "The height meets the base at a ___ corner. The slanted side is ___, so ___.",
        "La altura forma una esquina ___ con la base. El lado inclinado es ___, así que ___.",
      ),
      triangle: both(
        "Two triangles make a ___ with area ___ × ___, so one triangle is ___.",
        "Dos triángulos forman un ___ con área ___ × ___, así que un triángulo es ___.",
      ),
      trapezoid: both(
        "Two trapezoids make a ___ with base ___ + ___, so one trapezoid is ___.",
        "Dos trapecios forman un ___ con base ___ + ___, así que un trapecio es ___.",
      ),
    }[sh],
  };
  const tr = v.transfer;
  const tu = tr.unit;
  const td = dims(tr.spec, tu);
  const tA = fmt(area(tr.spec));
  T.transferSay = {
    en: `${tr.story?.en ?? `A new ${nm.en}: ${td.en}.`} No pieces this time. Find the area on your own.`,
    es: `${tr.story?.es ?? `Un ${nm.es} nuevo: ${td.es}.`} Esta vez no hay piezas. Halla el área por tu cuenta.`,
  };
  T.transferQ = both("What is the area of this figure?", "¿Cuál es el área de esta figura?");
  T.transferOk = {
    en: `Right: ${formula(tr.spec)} = ${tA} ${tu.sq.en}.`,
    es: `Correcto: ${formula(tr.spec)} = ${tA} ${tu.sq.es}.`,
  };
  /** A cue for a wrong choice: names what the pick IS, asks a question, never gives the area. */
  T.cue = (opt, spec, un) => {
    const val = fmt(opt.value);
    const x = un.abbr;
    const sk = spec.shape;
    const sL = fmt(slantLabel(spec) ?? 0);
    const q = {
      slant: both(
        `${val} multiplies by the slanted side, about ${sL} ${x.en}. Is the slanted side the straight-up distance? Look at the dashed line.`,
        `${val} multiplica por el lado inclinado, unos ${sL} ${x.es}. ¿El lado inclinado es la distancia recta hacia arriba? Mira la línea punteada.`,
      ),
      add: both(
        `${val} comes from adding. Area counts squares that cover the inside: rows of squares, not lengths added together. Would adding count them?`,
        `${val} sale de sumar. El área cuenta los cuadrados que cubren el interior: filas de cuadrados, no longitudes sumadas. ¿Sumar los cuenta?`,
      ),
      half: both(
        `${val} is half of ${spec.b} × ${spec.h}. Does the parallelogram slide into a whole ${spec.b} by ${spec.h} rectangle, or only half of one?`,
        `${val} es la mitad de ${spec.b} × ${spec.h}. ¿El paralelogramo se desliza hasta formar un rectángulo completo de ${spec.b} por ${spec.h}, o solo la mitad?`,
      ),
      noHalf: both(
        `${val} is the whole parallelogram the two copies make. How many copies of the ${NAME[sk].en} are in that parallelogram?`,
        `${val} es todo el paralelogramo que forman las dos copias. ¿Cuántas copias del ${NAME[sk].es} hay en ese paralelogramo?`,
      ),
      longBase: both(
        `${val} uses only the long base. Are the top and bottom edges the same length? What does the top edge add?`,
        `${val} usa solo la base larga. ¿El borde de arriba y el de abajo miden lo mismo? ¿Qué aporta el borde de arriba?`,
      ),
    }[opt.kind];
    return q;
  };
  return T;
}
