// living/volume-layers-model.js — the mathematics and the words of volume-layers.
//
// Pure functions only (no DOM). Volume as LAYERS: cover the floor (base area
// B = l × w), stack layers (V = B × h), and see that B × h is l × w × h.
//   mode "whole"    — 5-5: whole-number edges; a layer is one unit tall
//   mode "fraction" — 5-10: an edge may be a half unit; the stack grows in half
//                     units and the base area × height rule does not change
// Every number a scene states is computed here from the config.

import { okInt, placeCorrect, unitSet } from "./net-fold-model.js";

export { placeCorrect };

const N = (en, es) => ({ en, es });
const both = (f) => ({ en: f("en"), es: f("es") });
/** 4 → "4", 0.5 → "0.5", 13.5 → "13.5": exact for half-unit arithmetic. */
export const fmt = (n) => String(Math.round(n * 100) / 100);
export const volume = (l, w, h) => l * w * h;
const isHalves = (n, lo, hi) => Number.isFinite(n) && n >= lo && n <= hi && (n * 2) % 1 === 0;

/** The layer thickness a mode stacks in. */
export const stepOf = (mode) => (mode === "whole" ? 1 : 0.5);

/** The three ways to stand the box: [base edge, base edge, height] and its volume. */
export function orientations(l, w, h) {
  return [
    [l, w, h],
    [l, h, w],
    [w, h, l],
  ].map(([p, q, r]) => ({ p, q, r, base: p * q, v: p * q * r }));
}

/** Four volume choices: the right one and three real slips; null when two coincide. */
export function volumeChoices(mode, l, w, h) {
  const B = l * w;
  const slip =
    mode === "whole" ? { kind: "baseplus", value: B + h } : { kind: "divide", value: B / h };
  const out = [
    { kind: "total", value: volume(l, w, h), correct: true },
    { kind: "add", value: l + w + h },
    { kind: "base", value: B },
    slip,
  ];
  return new Set(out.map((o) => o.value)).size === out.length ? out : null;
}

function validWhole(c) {
  const [l, w, h] = [Number(c?.l), Number(c?.w), Number(c?.h)];
  if (![l, w, h].every((x) => okInt(x, 1, 10)) || l * w < 2) return null;
  return volumeChoices("whole", l, w, h) ? { l, w, h } : null;
}

function validFraction(c, floorWhole) {
  const [l, w, h] = [Number(c?.l), Number(c?.w), Number(c?.h)];
  if (![l, w, h].every((x) => isHalves(x, 0.5, 10))) return null;
  const fractional = [l, w, h].some((x) => !Number.isInteger(x));
  if (!fractional || (floorWhole && !(Number.isInteger(l) && Number.isInteger(w)))) return null;
  return volumeChoices("fraction", l, w, h) ? { l, w, h } : null;
}

/** Validated config, or null when the stage cannot draw the box correctly. */
export function validateVolumeLayers(cfg) {
  const unit = unitSet(cfg?.unit ?? "units");
  const mode = cfg?.mode;
  if (!unit || (mode !== "whole" && mode !== "fraction")) return null;
  const ok = mode === "whole" ? validWhole : (c) => validFraction(c, true);
  const main = ok(cfg);
  if (!main) return null;
  const dflt = mode === "whole" ? { l: 5, w: 2, h: 2 } : { l: 4, w: 3, h: 1.5 };
  const tr =
    cfg.transfer == null
      ? dflt
      : mode === "whole"
        ? validWhole(cfg.transfer)
        : validFraction(cfg.transfer, false);
  if (!tr || volume(tr.l, tr.w, tr.h) === volume(main.l, main.w, main.h)) return null;
  // The slider in "stack" goes up to a whole unit above a fractional height.
  const stackMax = mode === "whole" ? main.h : Math.max(1, Math.ceil(main.h));
  return { mode, ...main, unit, tr, step: stepOf(mode), stackMax };
}

/** Every sentence the play says. `v` is a validated config. */
export function volumeCopy(v) {
  const { mode, l, w, h, unit: u, tr } = v;
  const whole = mode === "whole";
  const B = l * w;
  const V = volume(l, w, h);
  const tB = tr.l * tr.w;
  const tV = volume(tr.l, tr.w, tr.h);
  const cu = (n, g) => `${fmt(n)} ${u.cu[g]}`;
  const size = both((g) => `${l} ${u.len[g]} × ${w} ${u.len[g]} × ${fmt(h)} ${u.len[g]}`);
  const sizeLong = both((g) =>
    g === "en"
      ? `${l} ${u.len.en} long, ${w} wide and ${fmt(h)} tall`
      : `${l} ${u.len.es} de largo, ${w} de ancho y ${fmt(h)} de alto`,
  );
  const layerWord = (n, g) =>
    g === "en" ? (n === 1 ? "layer" : "layers") : n === 1 ? "capa" : "capas";
  const cueOf = (kind, value) =>
    ({
      add: both((g) =>
        g === "en"
          ? `${fmt(value)} is ${l} + ${w} + ${fmt(h)}. Adding the edges gives a length, not a space. Volume counts the cubes that fill the box. How many are in the bottom layer?`
          : `${fmt(value)} es ${l} + ${w} + ${fmt(h)}. Sumar las aristas da una longitud, no un espacio. El volumen cuenta los cubos que llenan la caja. ¿Cuántos hay en la capa de abajo?`,
      ),
      base: both((g) =>
        whole
          ? g === "en"
            ? `${fmt(value)} is only the bottom layer, ${l} × ${w}. The box is ${h} layers tall. How many layers need to be counted?`
            : `${fmt(value)} es solo la capa de abajo, ${l} × ${w}. La caja tiene ${h} capas de alto. ¿Cuántas capas hay que contar?`
          : g === "en"
            ? `${fmt(value)} is one full layer, ${l} × ${w}, a whole unit tall. This box is only ${fmt(h)} tall. How much of a full layer is that?`
            : `${fmt(value)} es una capa completa, ${l} × ${w}, de una unidad de alto. Esta caja mide solo ${fmt(h)} de alto. ¿Qué parte de una capa completa es?`,
      ),
      baseplus: both((g) =>
        g === "en"
          ? `${fmt(value)} adds the height ${h} to the base ${B}. Every layer adds a whole base of cubes. How many bases are stacked?`
          : `${fmt(value)} suma la altura ${h} a la base ${B}. Cada capa agrega una base completa de cubos. ¿Cuántas bases hay apiladas?`,
      ),
      divide: both((g) =>
        g === "en"
          ? `${fmt(value)} is ${B} ÷ ${fmt(h)}. A box that is shorter than one layer holds less than a full layer, not more. Should the volume be more or less than ${B}?`
          : `${fmt(value)} es ${B} ÷ ${fmt(h)}. Una caja más baja que una capa tiene menos que una capa completa, no más. ¿El volumen debe ser mayor o menor que ${B}?`,
      ),
    })[kind];
  return {
    kicker: N("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: N("Volume, one layer at a time", "El volumen, una capa a la vez"),
    ariaLabel: {
      en: `A box ${sizeLong.en}. Covering the floor takes ${l} × ${w} = ${B} unit squares. Stacking layers of the base up the height gives a volume of ${B} × ${fmt(h)} = ${cu(V, "en")}.`,
      es: `Una caja de ${sizeLong.es}. Cubrir el piso lleva ${l} × ${w} = ${B} cuadrados unitarios. Apilar capas de la base a lo alto da un volumen de ${B} × ${fmt(h)} = ${cu(V, "es")}.`,
    },
    printSummary: {
      en: `A box ${sizeLong.en}. The floor takes ${l} × ${w} = ${B} unit squares, so the base area is B = ${B}. Stacking the base up the height: V = B × h = ${B} × ${fmt(h)} = ${cu(V, "en")}. The same number comes from l × w × h = ${l} × ${w} × ${fmt(h)} = ${cu(V, "en")}.`,
      es: `Una caja de ${sizeLong.es}. El piso lleva ${l} × ${w} = ${B} cuadrados unitarios, así que el área de la base es B = ${B}. Apilando la base a lo alto: V = B × h = ${B} × ${fmt(h)} = ${cu(V, "es")}. El mismo número sale de l × w × h = ${l} × ${w} × ${fmt(h)} = ${cu(V, "es")}.`,
    },
    scene: {
      situate: N("The box", "La caja"),
      predict: N("Predict", "Predice"),
      floor: N("Cover the floor", "Cubre el piso"),
      stack: N("Stack layers", "Apila capas"),
      tip: N("Turn the box", "Gira la caja"),
      connect: N("Two ways", "Dos maneras"),
      transfer: N("A new box", "Una caja nueva"),
    },
    size,
    edge: (n) => both((g) => `${fmt(n)} ${u.len[g]}`),
    situateSay: whole
      ? both((g) =>
          g === "en"
            ? `A box ${sizeLong.en}. Volume is how much space is inside. We count it in unit cubes, so the answer is in cubic units.`
            : `Una caja de ${sizeLong.es}. El volumen es cuánto espacio hay adentro. Lo contamos en cubos unitarios, así que la respuesta va en unidades cúbicas.`,
        )
      : both((g) =>
          g === "en"
            ? `A box ${sizeLong.en}. One edge is a fraction of a unit, but volume is still how much space is inside, counted in cubic units.`
            : `Una caja de ${sizeLong.es}. Una arista es una fracción de unidad, pero el volumen sigue siendo cuánto espacio hay adentro, contado en unidades cúbicas.`,
        ),
    predictQ: {
      en: "What is the volume of this box, in cubic units?",
      es: "¿Cuál es el volumen de esta caja, en unidades cúbicas?",
    },
    predictCue: cueOf,
    predictOk: whole
      ? {
          en: `Yes: ${cu(V, "en")}. Next, build it: cover the floor, then stack layers.`,
          es: `Sí: ${cu(V, "es")}. Ahora constrúyela: cubre el piso y luego apila capas.`,
        }
      : {
          en: `Yes: ${cu(V, "en")}. Next, build it: cover the floor, then stack the base up to the height.`,
          es: `Sí: ${cu(V, "es")}. Ahora constrúyela: cubre el piso y luego apila la base hasta la altura.`,
        },
    floorSay: {
      en: `Cover the floor with unit squares, one row at a time. Each row has ${l} squares.`,
      es: `Cubre el piso con cuadrados unitarios, una fila a la vez. Cada fila tiene ${l} cuadrados.`,
    },
    rowsLabel: N("Rows", "Filas"),
    rowsExpr: (rows) => (rows === 0 ? "" : `${rows} × ${l} = ${rows * l}`),
    floorDone: {
      en: `The floor is covered: ${l} × ${w} = ${B} squares. That is the base area, B = ${B}. It is one layer.`,
      es: `El piso está cubierto: ${l} × ${w} = ${B} cuadrados. Esa es el área de la base, B = ${B}. Es una capa.`,
    },
    floorMore: (left) => ({
      en: left === 1 ? "One more row to go." : `${left} more rows to go.`,
      es: left === 1 ? "Falta una fila." : `Faltan ${left} filas.`,
    }),
    stackSay: whole
      ? {
          en: `Stack layers on the base. Each layer is ${B} cubes. The box is ${h} layers tall.`,
          es: `Apila capas sobre la base. Cada capa tiene ${B} cubos. La caja tiene ${h} capas de alto.`,
        }
      : {
          en: `A full layer is 1 unit tall and holds ${B} cubes. Slide the height up in half units, and stop at the top of the dashed box, which is ${fmt(h)} tall.`,
          es: `Una capa completa mide 1 unidad de alto y tiene ${B} cubos. Desliza la altura de media unidad en media unidad y detente en la parte de arriba de la caja punteada, que mide ${fmt(h)} de alto.`,
        },
    heightLabel: whole ? N("Layers", "Capas") : N("Height", "Altura"),
    stackRow: (n) =>
      both((g) =>
        whole
          ? `${n} ${layerWord(n, g)}: ${B} × ${n} = ${B * n} ${g === "en" ? "cubes" : "cubos"}`
          : `${g === "en" ? "Height" : "Altura"} ${fmt(n)}: ${B} × ${fmt(n)} = ${fmt(B * n)} ${u.cu[g]}`,
      ),
    stackExpr: (n) => (n === 0 ? "" : `${B} × ${fmt(n)} = ${fmt(B * n)}`),
    stackOver: {
      en: `That stack is taller than the box. The dashed box is only ${fmt(h)} tall. Stop at its top.`,
      es: `Esa pila es más alta que la caja. La caja punteada mide solo ${fmt(h)} de alto. Detente en su parte de arriba.`,
    },
    stackDone: whole
      ? {
          en: `${h} layers of ${B} cubes: ${B} × ${h} = ${V} cubes. Volume = base area × height.`,
          es: `${h} capas de ${B} cubos: ${B} × ${h} = ${V} cubos. Volumen = área de la base × altura.`,
        }
      : both((g) =>
          g === "en"
            ? `Base area × height: ${B} × ${fmt(h)} = ${fmt(V)} cubic units.${h < 1 ? ` The box is shorter than one full layer, so the volume is less than ${B}.` : ""}`
            : `Área de la base × altura: ${B} × ${fmt(h)} = ${fmt(V)} unidades cúbicas.${h < 1 ? ` La caja es más baja que una capa completa, así que el volumen es menor que ${B}.` : ""}`,
        ),
    stackMore: {
      en: `Keep stacking until the height reaches ${fmt(h)}.`,
      es: `Sigue apilando hasta que la altura llegue a ${fmt(h)}.`,
    },
    connectSay: {
      en: "Two ways to write the same volume: multiply the three edges, or find the base area first and multiply by the height.",
      es: "Dos maneras de escribir el mismo volumen: multiplicar las tres aristas, o hallar primero el área de la base y multiplicarla por la altura.",
    },
    connectExpr: `${l} × ${w} × ${fmt(h)} = ${B} × ${fmt(h)} = ${fmt(V)}`,
    connectDone: {
      en: `${l} × ${w} × ${fmt(h)} and B × h = ${B} × ${fmt(h)} are the same number, ${cu(V, "en")}, because B × h already used the length and the width.`,
      es: `${l} × ${w} × ${fmt(h)} y B × h = ${B} × ${fmt(h)} son el mismo número, ${cu(V, "es")}, porque B × h ya usó el largo y el ancho.`,
    },
    tipSay: {
      en: "Turn the box onto a different face. Pick which face is the base, and watch the layers.",
      es: "Gira la caja y apóyala en otra cara. Elige qué cara es la base y mira las capas.",
    },
    tipLabel: (o) =>
      both((g) =>
        g === "en"
          ? `Base ${fmt(o.p)} × ${fmt(o.q)}, height ${fmt(o.r)}`
          : `Base ${fmt(o.p)} × ${fmt(o.q)}, altura ${fmt(o.r)}`,
      ),
    tipRow: (o) =>
      both((g) =>
        g === "en"
          ? `Base ${fmt(o.p)} × ${fmt(o.q)} = ${fmt(o.base)}. Height ${fmt(o.r)}. Volume ${fmt(o.base)} × ${fmt(o.r)} = ${fmt(o.v)} ${u.cu.en}.`
          : `Base ${fmt(o.p)} × ${fmt(o.q)} = ${fmt(o.base)}. Altura ${fmt(o.r)}. Volumen ${fmt(o.base)} × ${fmt(o.r)} = ${fmt(o.v)} ${u.cu.es}.`,
      ),
    tipExpr: (o) =>
      `(${fmt(o.p)} × ${fmt(o.q)}) × ${fmt(o.r)} = ${fmt(o.base)} × ${fmt(o.r)} = ${fmt(o.v)}`,
    tipMore: (n) => ({
      en: n === 1 ? "Try the last way to stand it." : `Try ${n} more ways to stand it.`,
      es: n === 1 ? "Prueba la última manera de apoyarla." : `Prueba ${n} maneras más de apoyarla.`,
    }),
    tipDone: {
      en: `Every way gives ${cu(V, "en")}. It is the same box, so the same space. Pick any two edges for the base, then multiply by the third.`,
      es: `Todas las maneras dan ${cu(V, "es")}. Es la misma caja, así que el mismo espacio. Elige dos aristas cualesquiera para la base y multiplica por la tercera.`,
    },
    transferSay: whole
      ? both((g) =>
          g === "en"
            ? `A new box: ${tr.l} ${u.len.en} long, ${tr.w} wide, ${tr.h} tall. Use the base area and the height.`
            : `Una caja nueva: ${tr.l} ${u.len.es} de largo, ${tr.w} de ancho, ${tr.h} de alto. Usa el área de la base y la altura.`,
        )
      : both((g) =>
          g === "en"
            ? `A new box: ${tr.l} ${u.len.en} long, ${tr.w} wide, ${fmt(tr.h)} tall. An edge is a fraction, and the rule does not change.`
            : `Una caja nueva: ${tr.l} ${u.len.es} de largo, ${tr.w} de ancho, ${fmt(tr.h)} de alto. Una arista es una fracción y la regla no cambia.`,
        ),
    transferQ: {
      en: "What is the volume of this new box?",
      es: "¿Cuál es el volumen de esta caja nueva?",
    },
    transferCue: (kind, value) => {
      const [tl, tw, th] = [tr.l, tr.w, tr.h];
      return {
        add: both((g) =>
          g === "en"
            ? `${fmt(value)} is ${fmt(tl)} + ${fmt(tw)} + ${fmt(th)}. Adding edges gives a length, not a space. What is the base area, and how many layers of it are stacked?`
            : `${fmt(value)} es ${fmt(tl)} + ${fmt(tw)} + ${fmt(th)}. Sumar aristas da una longitud, no un espacio. ¿Cuál es el área de la base y cuántas capas de ella hay apiladas?`,
        ),
        base: both((g) =>
          g === "en"
            ? `${fmt(value)} is the base area only, ${fmt(tl)} × ${fmt(tw)}. The box also has a height of ${fmt(th)}. What does the height do to the base?`
            : `${fmt(value)} es solo el área de la base, ${fmt(tl)} × ${fmt(tw)}. La caja también tiene una altura de ${fmt(th)}. ¿Qué le hace la altura a la base?`,
        ),
        baseplus: both((g) =>
          g === "en"
            ? `${fmt(value)} adds the height to the base. Each layer is a whole base, so the height says how many bases to stack. Multiply, don't add.`
            : `${fmt(value)} suma la altura a la base. Cada capa es una base completa, así que la altura dice cuántas bases apilar. Multiplica, no sumes.`,
        ),
        divide: both((g) =>
          g === "en"
            ? `${fmt(value)} is ${fmt(tB)} ÷ ${fmt(th)}. Is the box taller or shorter than a full unit layer? Should the volume be more or less than the base area, ${fmt(tB)}?`
            : `${fmt(value)} es ${fmt(tB)} ÷ ${fmt(th)}. ¿La caja es más alta o más baja que una capa de una unidad? ¿El volumen debe ser mayor o menor que el área de la base, ${fmt(tB)}?`,
        ),
      }[kind];
    },
    transferOk: both((g) =>
      g === "en"
        ? `Right: base ${fmt(tr.l)} × ${fmt(tr.w)} = ${fmt(tB)}, then ${fmt(tB)} × ${fmt(tr.h)} = ${cu(tV, "en")}.`
        : `Correcto: base ${fmt(tr.l)} × ${fmt(tr.w)} = ${fmt(tB)}, luego ${fmt(tB)} × ${fmt(tr.h)} = ${cu(tV, "es")}.`,
    ),
    transferExpr: `${fmt(tB)} × ${fmt(tr.h)} = ${fmt(tV)}`,
    explainLabel: whole
      ? {
          en: "Explain: why do you multiply the base area by the height?",
          es: "Explica: ¿por qué multiplicas el área de la base por la altura?",
        }
      : {
          en: "Explain: why does base area × height still work when the height is a fraction?",
          es: "Explica: ¿por qué área de la base × altura sigue funcionando cuando la altura es una fracción?",
        },
    explainFrame: whole
      ? {
          en: "One layer has ___ cubes, and there are ___ layers, so the volume is ___.",
          es: "Una capa tiene ___ cubos y hay ___ capas, así que el volumen es ___.",
        }
      : {
          en: "The base area is ___. A height of ___ is part of a layer, so the volume is ___.",
          es: "El área de la base es ___. Una altura de ___ es una parte de una capa, así que el volumen es ___.",
        },
    tB,
  };
}
