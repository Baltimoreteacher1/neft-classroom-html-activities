// living/inequality-solve-model.js — mathematics and words of the inequality-solve
// play (lesson 8-6): solve a one-step inequality with an inverse operation, keep
// the symbol, and graph the solution set. No DOM.
//
// Scope is the lesson's own: x + a ⋄ b and x − a ⋄ b, so the same inverse
// operation on both sides keeps the inequality true and the symbol never turns.
// Every wrong pick is a candidate "solution" that disagrees with the original
// inequality at a value the cue asks the student to test.

import { opWord } from "./balance-solve-model.js";
import {
  clean,
  dirOf,
  flipDir,
  holds,
  insideValue,
  isClosed,
  okInt,
  outsideValue,
  pair,
  placeCorrect,
  rangeFor,
  SYMS,
  testsDone,
} from "./inequality-line-model.js";

export { testsDone };

/** One inequality: x + a ⋄ b or x − a ⋄ b, with its solved boundary. */
export function makeIneq(spec) {
  const { form, a, sym, b } = spec || {};
  if (!["add", "sub"].includes(form) || !SYMS.includes(sym)) return null;
  if (!okInt(a, 1, 99) || !okInt(b, 1, 999)) return null;
  const limit = form === "add" ? b - a : b + a;
  if (!okInt(limit, 2, 999)) return null;
  const letter =
    typeof spec.letter === "string" && /^[a-z]$/i.test(spec.letter) ? spec.letter : "x";
  const story = clean(spec.story);
  return story ? { form, a, sym, b, limit, letter, story } : null;
}

export const origText = (q) => `${q.letter} ${q.form === "add" ? "+" : "−"} ${q.a} ${q.sym} ${q.b}`;
export const solvedText = (q) => `${q.letter} ${q.sym} ${q.limit}`;
/** The step line: "x + 3 − 3 > 53 − 3". */
export const stepText = (q) => {
  const inv = q.form === "add" ? "−" : "+";
  return `${q.letter} ${q.form === "add" ? "+" : "−"} ${q.a} ${inv} ${q.a} ${q.sym} ${q.b} ${inv} ${q.a}`;
};
export const lhsOf = (q, v) => (q.form === "add" ? v + q.a : v - q.a);
export const holdsOrig = (q, v) => holds(q.sym, lhsOf(q, v), q.b);
/** "52 + 3 = 55 > 53" — the substitution as one line. */
export const subLine = (q, v) =>
  `${v} ${q.form === "add" ? "+" : "−"} ${q.a} = ${lhsOf(q, v)}, and ${lhsOf(q, v)} ${q.sym} ${q.b}`;
const tf = (ok) => pair(ok ? "true" : "false", ok ? "verdadero" : "falso");
const mk = (q, sym, limit) => ({ sym, limit, text: `${q.letter} ${sym} ${limit}` });

/** The value closest to the boundary where the original and a candidate disagree. */
export function disagreement(q, cand) {
  const { lo, hi } = rangeFor(q.limit);
  const vs = [];
  for (let v = lo; v <= hi; v++) vs.push(v);
  vs.sort((x, y) => Math.abs(x - q.limit) - Math.abs(y - q.limit) || x - y);
  return vs.find((v) => holdsOrig(q, v) !== holds(cand.sym, v, cand.limit)) ?? null;
}

/** A cue that tests a value in the original and asks about the candidate. */
function testCue(q, cand) {
  const v = disagreement(q, cand);
  const ok = holdsOrig(q, v);
  return pair(
    `Test ${q.letter} = ${v} in ${origText(q)}: ${subLine(q, v)} is ${tf(ok).en}. Now test ${v} in ${q.letter} ${cand.sym} ${cand.limit}: is ${v} ${cand.sym} ${cand.limit} true or false? Do the two agree?`,
    `Prueba ${q.letter} = ${v} en ${origText(q)}: ${subLine(q, v).replace(", and", ", y")} es ${tf(ok).es}. Ahora prueba ${v} en ${q.letter} ${cand.sym} ${cand.limit}: ¿${v} ${cand.sym} ${cand.limit} es verdadero o falso? ¿Coinciden las dos?`,
  );
}

/** "What is the solution?" — the solved inequality and three real slips. */
export function solvedChoices(q) {
  const wrongOp = q.form === "add" ? q.b + q.a : q.b - q.a;
  const cands = [
    { id: "ok", ...mk(q, q.sym, q.limit), correct: true },
    { id: "op", correct: false, ...mk(q, q.sym, wrongOp) },
    { id: "copy", correct: false, ...mk(q, q.sym, q.b) },
    { id: "flip", correct: false, ...mk(q, flipDir(q.sym), q.limit) },
  ];
  return placeCorrect(
    cands.map((c) => {
      if (c.correct) return c;
      return { ...c, v: disagreement(q, c), cue: testCue(q, c) };
    }),
    q.b + q.a + q.limit + q.sym.charCodeAt(0),
  );
}

/** The student's move on the scale of symbols: the right one and two slips. */
export function moveChoices(q) {
  const inv = q.form === "add" ? "sub" : "add";
  const [verb, prep] =
    inv === "sub" ? [pair("Subtract", "Resta"), "from"] : [pair("Add", "Suma"), "to"];
  const a = q.a;
  const copy = { sym: q.sym, limit: q.b, text: `${q.letter} ${q.sym} ${q.b}` };
  const options = [
    { id: "ok", label: opWord(inv, a), correct: true },
    {
      id: "one",
      label: pair(
        `${verb.en} ${a} ${prep} the left side only`,
        inv === "sub"
          ? `Resta ${a} solo en el lado izquierdo`
          : `Suma ${a} solo en el lado izquierdo`,
      ),
      v: disagreement(q, copy),
      cue: testCue(q, copy),
    },
    {
      id: "same",
      label: opWord(q.form === "add" ? "add" : "sub", a),
      cue: pair(
        `Both sides change equally, but ${q.letter} ${q.form === "add" ? "+" : "−"} ${2 * a} still has more attached to ${q.letter}. What undoes ${q.form === "add" ? "+" : "−"} ${a}?`,
        `Los dos lados cambian por igual, pero ${q.letter} ${q.form === "add" ? "+" : "−"} ${2 * a} todavía tiene más pegado a ${q.letter}. ¿Qué deshace ${q.form === "add" ? "+" : "−"} ${a}?`,
      ),
    },
  ];
  return placeCorrect(options, q.a + q.b + q.sym.charCodeAt(0));
}

export function validateInequalitySolve(cfg) {
  if (!cfg || typeof cfg !== "object" || cfg.mode !== "solve") return null;
  const main = makeIneq(cfg);
  const transfer = makeIneq(cfg.transfer);
  if (!main || !transfer) return null;
  // The transfer is the lesson's other move, and its graph differs from the first.
  if (transfer.form === main.form) return null;
  if (dirOf(transfer.sym) === dirOf(main.sym) && isClosed(transfer.sym) === isClosed(main.sym))
    return null;
  for (const q of [main, transfer]) {
    if (solvedChoices(q).some((o) => !o.correct && o.v == null)) return null;
    if (moveChoices(q).some((o) => !o.correct && o.v === null)) return null;
    if (new Set(solvedChoices(q).map((o) => o.text)).size !== 4) return null;
  }
  return { mode: "solve", main, transfer };
}

/** Which sentence says the verdict of a tested value, on both forms. */
export const verdictBoth = (q, v) => {
  const ok = holds(q.sym, v, q.limit);
  return pair(
    `${q.letter} = ${v}: ${subLine(q, v)} is ${tf(ok).en}; ${v} ${q.sym} ${q.limit} is ${tf(ok).en} ${ok ? "✓" : "✗"}`,
    `${q.letter} = ${v}: ${subLine(q, v).replace(", and", ", y")} es ${tf(ok).es}; ${v} ${q.sym} ${q.limit} es ${tf(ok).es} ${ok ? "✓" : "✗"}`,
  );
};

/**
 * Every sentence the play says, as {en, es} pairs, from a validated config.
 * @returns {any}
 */
export function solveCopy(v) {
  const { main: q, transfer: t } = v;
  const sc = (...xs) => xs.map(([en, es]) => pair(en, es));
  const closed = (s) =>
    isClosed(s)
      ? pair("a closed circle ● (included)", "un círculo cerrado ● (incluido)")
      : pair("an open circle ○ (not included)", "un círculo abierto ○ (no incluido)");
  const side = (s) => (dirOf(s) === "right" ? pair("right", "derecha") : pair("left", "izquierda"));
  return {
    kicker: pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: pair("Solve it, then graph it", "Resuélvela y luego grafícala"),
    marker: (s) =>
      isClosed(s.sym) ? pair("● included", "● incluido") : pair("○ not included", "○ no incluido"),
    ariaLabel: pair(
      `A number line from ${rangeFor(q.limit).lo} to ${rangeFor(q.limit).hi} for the inequality ${origText(q)}. Solving it gives ${solvedText(q)}, shown as a circle and a shaded ray.`,
      `Una recta numérica de ${rangeFor(q.limit).lo} a ${rangeFor(q.limit).hi} para la desigualdad ${origText(q)}. Al resolverla se obtiene ${solvedText(q)}, que se muestra con un círculo y un rayo sombreado.`,
    ),
    printSummary: pair(
      `${origText(q)}: do the inverse operation to both sides, ${stepText(q)}, so ${solvedText(q)}. Graph ${closed(q.sym).en} at ${q.limit}, shaded ${side(q.sym).en}. Check by testing a value. ${origText(t)} works the same way: ${solvedText(t)}.`,
      `${origText(q)}: haz la operación inversa en los dos lados, ${stepText(q)}, así que ${solvedText(q)}. Grafica ${closed(q.sym).es} en ${q.limit}, sombreado a la ${side(q.sym).es}. Comprueba probando un valor. ${origText(t)} funciona igual: ${solvedText(t)}.`,
    ),
    labels: sc(
      ["The inequality", "La desigualdad"],
      ["Predict", "Predice"],
      ["Solve it", "Resuélvela"],
      ["Check it", "Compruébala"],
      ["On your own", "Por tu cuenta"],
    ),
    situateSay: pair(
      `${q.story.en} Many values of ${q.letter} could make ${origText(q)} true. Solving shows all of them at once.`,
      `${q.story.es} Muchos valores de ${q.letter} podrían hacer verdadera ${origText(q)}. Al resolver se ven todos a la vez.`,
    ),
    predictSay: pair(
      `Solve ${origText(q)} the way you solve an equation. Which inequality shows every solution?`,
      `Resuelve ${origText(q)} como resuelves una ecuación. ¿Qué desigualdad muestra todas las soluciones?`,
    ),
    predictQ: pair("The solution is…", "La solución es…"),
    predictOk: pair(
      `Yes: ${solvedText(q)}. Next you will see why, by keeping the inequality true while ${q.letter} gets alone.`,
      `Sí: ${solvedText(q)}. Ahora verás por qué, manteniendo verdadera la desigualdad mientras ${q.letter} queda sola.`,
    ),
    moveSay: pair(
      `Get ${q.letter} alone. Choose a move; the same move goes on both sides.`,
      `Deja sola a ${q.letter}. Elige un movimiento; el mismo movimiento va en los dos lados.`,
    ),
    moveQ: pair(
      `Which move gets ${q.letter} alone and keeps the inequality true?`,
      `¿Qué movimiento deja sola a ${q.letter} y mantiene verdadera la desigualdad?`,
    ),
    moveOk: (p) =>
      pair(
        `${stepText(p)}, so ${solvedText(p)}. The symbol stays ${p.sym}, because only a number moved. ${origText(p)} and ${solvedText(p)} have the same solutions.`,
        `${stepText(p)}, así que ${solvedText(p)}. El símbolo sigue siendo ${p.sym}, porque solo se movió un número. ${origText(p)} y ${solvedText(p)} tienen las mismas soluciones.`,
      ),
    checkSay: pair(
      `Test values in BOTH ${origText(q)} and ${solvedText(q)}. Try the boundary, a value on the ray and one off it: do the two always agree?`,
      `Prueba valores en LAS DOS, ${origText(q)} y ${solvedText(q)}. Prueba el límite, un valor del rayo y uno fuera de él: ¿coinciden siempre?`,
    ),
    needBoundary: pair(
      `Now test the boundary number, ${q.limit}.`,
      `Ahora prueba el número límite, ${q.limit}.`,
    ),
    needInside: pair("Now find a value on the ray.", "Ahora encuentra un valor del rayo."),
    needOutside: pair("Now find a value off the ray.", "Ahora encuentra un valor fuera del rayo."),
    checkDone: pair(
      `Every test agreed. ${solvedText(q)} is ${closed(q.sym).en}, shaded ${side(q.sym).en}: every value on the ray makes ${origText(q)} true.`,
      `Todas las pruebas coincidieron. ${solvedText(q)} es ${closed(q.sym).es}, sombreada a la ${side(q.sym).es}: cada valor del rayo hace verdadera ${origText(q)}.`,
    ),
    transferSay: pair(
      `${t.story.en} Solve ${origText(t)}. Which graph shows the solution?`,
      `${t.story.es} Resuelve ${origText(t)}. ¿Qué gráfica muestra la solución?`,
    ),
    transferQ: pair("The solution is…", "La solución es…"),
    transferOk: pair(
      `${stepText(t)}, so ${solvedText(t)}: ${closed(t.sym).en} at ${t.limit}, shaded ${side(t.sym).en}. Check: ${t.letter} = ${insideValue(t.sym, t.limit)} gives ${subLine(t, insideValue(t.sym, t.limit))}.`,
      `${stepText(t)}, así que ${solvedText(t)}: ${closed(t.sym).es} en ${t.limit}, sombreado a la ${side(t.sym).es}. Comprueba: ${t.letter} = ${insideValue(t.sym, t.limit)} da ${subLine(t, insideValue(t.sym, t.limit)).replace(", and", ", y")}.`,
    ),
    explainLabel: pair(
      "Explain: how is solving an inequality like solving an equation, and how is it different?",
      "Explica: ¿en qué se parece resolver una desigualdad a resolver una ecuación y en qué se diferencia?",
    ),
    explainFrame: pair(
      "It is like an equation because I still ___. It is different because the answer is ___ instead of ___.",
      "Se parece a una ecuación porque todavía ___. Es diferente porque la respuesta es ___ en lugar de ___.",
    ),
  };
}
