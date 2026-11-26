// living/inequality-graph-model.js — mathematics and words of the inequality-graph
// play (lesson 8-5), with no DOM. The picture of an inequality is a circle at the
// boundary (closed when it is included) and a shaded ray; every wrong pick gets a
// cue that makes the student substitute or test a value, never the answer.

import {
  clean,
  dirOf,
  flipIncl,
  holds,
  insideValue,
  isClosed,
  okInt,
  outsideValue,
  pair,
  placeCorrect,
  rangeFor,
  SYMS,
  validCase,
} from "./inequality-line-model.js";

export function validateInequalityGraph(cfg) {
  if (!cfg || typeof cfg !== "object" || cfg.mode !== "graph") return null;
  const main = validCase(cfg);
  const transfer = validCase(cfg.transfer);
  if (!main || !transfer || transfer.sym === main.sym) return null;
  // The transfer must not be answerable by copying the main case's picture.
  if (dirOf(transfer.sym) === dirOf(main.sym) && isClosed(transfer.sym) === isClosed(main.sym))
    return null;
  return { mode: "graph", main, transfer };
}

/** The verdict in "graph" mode: the substitution, with its symbol. */
export function verdictSymbol(c, v) {
  const ok = holds(c.sym, v, c.limit);
  return pair(
    `${c.letter} = ${v}: ${v} ${c.sym} ${c.limit} is ${ok ? "true ✓" : "false ✗"}`,
    `${c.letter} = ${v}: ${v} ${c.sym} ${c.limit} es ${ok ? "verdadero ✓" : "falso ✗"}`,
  );
}

const circleWord = (closed) =>
  closed
    ? pair("Closed circle ●", "Círculo cerrado ●")
    : pair("Open circle ○", "Círculo abierto ○");
const dirWord = (dir) =>
  dir === "right"
    ? pair("shade right →", "sombrea a la derecha →")
    : pair("shade left ←", "sombrea a la izquierda ←");

/** "Open or closed?" for the boundary: three picks, two of them slips. */
export function circleChoices(c) {
  const { sym, limit: L, letter } = c;
  const sub = pair(
    `Substitute ${L} for ${letter}: is ${L} ${sym} ${L} true? That tells you whether ${L} is a solution.`,
    `Sustituye ${letter} por ${L}: ¿es verdadero ${L} ${sym} ${L}? Eso te dice si el ${L} es una solución.`,
  );
  const options = [
    { id: "closed", label: pair("● Closed (filled) circle", "● Círculo cerrado (relleno)") },
    { id: "open", label: pair("○ Open (empty) circle", "○ Círculo abierto (vacío)") },
    {
      id: "none",
      label: pair("No circle: only the shading matters", "Sin círculo: solo importa el sombreado"),
      cue: pair(
        `Where does the shading start? Something has to mark the exact spot ${L}.`,
        `¿Dónde empieza el sombreado? Algo tiene que marcar el lugar exacto ${L}.`,
      ),
    },
  ].map((o) => {
    if (o.id === "none") return o;
    return isClosed(sym) === (o.id === "closed") ? { ...o, correct: true } : { ...o, cue: sub };
  });
  return placeCorrect(options, L + sym.charCodeAt(0));
}

/** Cue for a graph whose circle or direction is wrong; null when both are right. */
export function graphCue(c, circleClosed, dir) {
  const { sym, limit: L, letter } = c;
  if (circleClosed != null && circleClosed !== isClosed(sym))
    return pair(
      `Substitute ${L} for ${letter}: is ${L} ${sym} ${L} true? Then look at your circle.`,
      `Sustituye ${letter} por ${L}: ¿es verdadero ${L} ${sym} ${L}? Luego mira tu círculo.`,
    );
  if (dir != null && dir !== dirOf(sym)) {
    const v = dir === "right" ? L + 2 : L - 2;
    return pair(
      `Test ${v}, inside your shading: is ${v} ${sym} ${L} true? Is ${v} a solution?`,
      `Prueba el ${v}, dentro de tu sombreado: ¿es verdadero ${v} ${sym} ${L}? ¿Es el ${v} una solución?`,
    );
  }
  return null;
}

/** The four graphs (circle × direction) for the transfer, one right. */
export function graphChoices(c) {
  const options = [];
  for (const closed of [true, false])
    for (const dir of ["left", "right"]) {
      const a = circleWord(closed);
      const b = dirWord(dir);
      const label = pair(`${a.en} at ${c.limit}, ${b.en}`, `${a.es} en ${c.limit}, ${b.es}`);
      const ok = closed === isClosed(c.sym) && dir === dirOf(c.sym);
      options.push({
        id: `${closed}-${dir}`,
        closed,
        dir,
        label,
        correct: ok,
        cue: graphCue(c, closed, dir),
      });
    }
  return placeCorrect(options, c.limit + c.sym.charCodeAt(0) + 7);
}

export const wordsOf = { circleWord, dirWord };

/**
 * Every sentence the play says, as {en, es} pairs, from a validated config.
 * @returns {any}
 */
export function graphCopy(v) {
  const { main: c, transfer: t } = v;
  const L = c.limit;
  const kicker = pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo");
  const sc = (...xs) => xs.map(([en, es]) => pair(en, es));
  const closedTxt = (s) =>
    isClosed(s)
      ? pair("closed circle ● (included)", "círculo cerrado ● (incluido)")
      : pair("open circle ○ (not included)", "círculo abierto ○ (no incluido)");
  const solved = (q) => `${q.letter} ${q.sym} ${q.limit}`;
  const common = {
    kicker,
    marker: (q) =>
      isClosed(q.sym) ? pair("● included", "● incluido") : pair("○ not included", "○ no incluido"),
  };
  return {
    ...common,
    title: pair("Draw every solution", "Dibuja todas las soluciones"),
    ariaLabel: pair(
      `A number line from ${rangeFor(L).lo} to ${rangeFor(L).hi}. A circle at ${L} and shading show every value that makes ${solved(c)} true.`,
      `Una recta numérica de ${rangeFor(L).lo} a ${rangeFor(L).hi}. Un círculo en ${L} y el sombreado muestran todos los valores que hacen verdadera ${solved(c)}.`,
    ),
    printSummary: pair(
      `${c.story.en} ${solved(c)}: draw a ${closedTxt(c.sym).en} at ${L} and shade ${dirOf(c.sym)}. ${t.letter} ${t.sym} ${t.limit} needs a ${closedTxt(t.sym).en} at ${t.limit}, shaded ${dirOf(t.sym)}.`,
      `${c.story.es} ${solved(c)}: dibuja un ${closedTxt(c.sym).es} en ${L} y sombrea a la ${dirOf(c.sym) === "right" ? "derecha" : "izquierda"}. ${t.letter} ${t.sym} ${t.limit} lleva un ${closedTxt(t.sym).es} en ${t.limit}, sombreado a la ${dirOf(t.sym) === "right" ? "derecha" : "izquierda"}.`,
    ),
    labels: sc(
      ["The rule", "La regla"],
      ["The circle", "El círculo"],
      ["Draw it", "Dibújala"],
      ["Every value", "Todos los valores"],
      ["On your own", "Por tu cuenta"],
    ),
    situateSay: pair(
      `${c.story.en} A solution is any value of ${c.letter} that makes ${solved(c)} true. The boundary number is ${L}.`,
      `${c.story.es} Una solución es cualquier valor de ${c.letter} que hace verdadera ${solved(c)}. El número límite es ${L}.`,
    ),
    predictSay: pair(
      `Is ${L} itself a solution of ${solved(c)}? That decides the circle at ${L}.`,
      `¿Es el ${L} mismo una solución de ${solved(c)}? Eso decide el círculo en ${L}.`,
    ),
    predictQ: pair(`Which circle goes at ${L}?`, `¿Qué círculo va en ${L}?`),
    predictOk: pair(
      `Yes: ${L} ${c.sym} ${L} is ${isClosed(c.sym) ? "true" : "false"}, so ${L} ${isClosed(c.sym) ? "is" : "is not"} a solution: ${closedTxt(c.sym).en}.`,
      `Sí: ${L} ${c.sym} ${L} es ${isClosed(c.sym) ? "verdadero" : "falso"}, así que el ${L} ${isClosed(c.sym) ? "es" : "no es"} una solución: ${closedTxt(c.sym).es}.`,
    ),
    drawSay: pair(
      `Draw the graph of ${solved(c)}: choose the circle and the direction of the shading. Check your picture by testing a value.`,
      `Dibuja la gráfica de ${solved(c)}: elige el círculo y la dirección del sombreado. Comprueba tu dibujo probando un valor.`,
    ),
    circleLabel: pair("Circle at the boundary", "Círculo en el límite"),
    dirLabel: pair("Shading", "Sombreado"),
    drawOk: pair(
      `That is the graph of ${solved(c)}: ${closedTxt(c.sym).en} at ${L}, shaded ${dirOf(c.sym)}.`,
      `Esa es la gráfica de ${solved(c)}: ${closedTxt(c.sym).es} en ${L}, sombreada a la ${dirOf(c.sym) === "right" ? "derecha" : "izquierda"}.`,
    ),
    everySay: pair(
      `The shading is not a few dots: every value on the ray is a solution, including decimals, and the arrow means it keeps going.`,
      `El sombreado no son unos pocos puntos: cada valor del rayo es una solución, incluso los decimales, y la flecha significa que sigue.`,
    ),
    /** Values to mark on the finished graph: decimals, the boundary, one that fails. */
    samples: (q) => {
      const s = dirOf(q.sym) === "right" ? 1 : -1;
      const { lo, hi } = rangeFor(q.limit);
      const pick = [q.limit + s * 1.5, q.limit + s * 3, q.limit, q.limit - s];
      return pick.map((x) => Math.min(hi, Math.max(lo, x))).filter((x, i, a) => a.indexOf(x) === i);
    },
    transferSay: pair(
      `${t.story.en} Which graph shows ${solved(t)}?`,
      `${t.story.es} ¿Qué gráfica muestra ${solved(t)}?`,
    ),
    transferQ: pair(`Graph of ${solved(t)}`, `Gráfica de ${solved(t)}`),
    transferOk: pair(
      `${solved(t)}: ${closedTxt(t.sym).en} at ${t.limit}, shaded ${dirOf(t.sym)}. Only the circle changes between ${t.letter} ${flipIncl(t.sym)} ${t.limit} and ${solved(t)}.`,
      `${solved(t)}: ${closedTxt(t.sym).es} en ${t.limit}, sombreada a la ${dirOf(t.sym) === "right" ? "derecha" : "izquierda"}. Solo cambia el círculo entre ${t.letter} ${flipIncl(t.sym)} ${t.limit} y ${solved(t)}.`,
    ),
    explainLabel: pair(
      "Explain: how do you decide between an open and a closed circle?",
      "Explica: ¿cómo decides entre un círculo abierto y uno cerrado?",
    ),
    explainFrame: pair(
      "I use a closed circle when ___ because ___. I use an open circle when ___.",
      "Uso un círculo cerrado cuando ___ porque ___. Uso un círculo abierto cuando ___.",
    ),
  };
}
