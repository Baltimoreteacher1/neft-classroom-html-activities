// living/balance-test-model.js — mathematics and words of the balance-test play
// (lesson 8-1): a true equation balances; a solution is a value that makes both
// sides equal, found by testing values. No DOM.

import {
  clean,
  eqText,
  MIN_PIECE_PX,
  makeEq,
  okInt,
  P,
  PAN_PX,
  pair,
  pan,
  placeCorrect,
  stepText,
} from "./balance-solve-model.js";

export { placeCorrect };

/** Pans for "x + a = b" with the unknown replaced by t. */
export function testPans(e, t) {
  return {
    L: pan([P(t, String(t), "x", 1), P(e.a, String(e.a))]),
    R: pan([P(e.b, String(e.b))]),
  };
}
export const testScale = (e) => PAN_PX / (e.b + e.a);
export const cmp = (l, r) => (l === r ? "=" : l < r ? "<" : ">");

/** Choices for "write the equation from the clue" (test-mode transfer). */
export function writeChoices(e) {
  const { a, b, L } = e;
  const bad = (text, en, es) => ({ id: text, text, cue: pair(en, es) });
  return placeCorrect(
    [
      { id: "ok", text: eqText(e), correct: true },
      bad(
        `${a}${L} = ${b}`,
        `“Plus” means add. Does ${a}${L} add anything to ${L}?`,
        `«Más» significa sumar. ¿${a}${L} le suma algo a ${L}?`,
      ),
      bad(
        `${L} − ${a} = ${b}`,
        `“Plus ${a}” puts ${a} more with the number. Does ${L} − ${a} add or take away?`,
        `«Más ${a}» junta ${a} más con el número. ¿${L} − ${a} suma o quita?`,
      ),
      bad(
        `${L} + ${b} = ${a}`,
        `Which number is the total, the one after “equals”? Which number is added to ${L}?`,
        `¿Cuál número es el total, el que va después de «es igual a»? ¿Cuál número se le suma a ${L}?`,
      ),
    ],
    a + b,
  );
}

/** Solution-value choices for test mode: each wrong value is checked by substituting. */
export function valueChoices(e) {
  const tests = [e.b, e.a, e.b + e.a].filter((w, i, all) => w !== e.x && all.indexOf(w) === i);
  const opts = tests.slice(0, 3).map((w) => ({
    id: `v${w}`,
    text: String(w),
    cue: pair(
      `Substitute ${w}: ${w} + ${e.a} = ${w + e.a}. Is that the same as ${e.b}?`,
      `Sustituye ${w}: ${w} + ${e.a} = ${w + e.a}. ¿Es igual a ${e.b}?`,
    ),
  }));
  return placeCorrect([{ id: "ok", text: String(e.x), correct: true }, ...opts], e.a * 7 + e.b);
}

/** The three predict options of test mode: balance, left heavier, right heavier. */
export function guessChoices(e, g) {
  const l = g + e.a;
  const heavier = l > e.b ? "left" : "right";
  const wrongWay = () =>
    pair(
      `Compare ${l} with ${e.b}: which number is bigger? Which side holds it?`,
      `Compara ${l} con ${e.b}: ¿cuál número es mayor? ¿Cuál lado lo tiene?`,
    );
  return placeCorrect(
    [
      {
        id: "bal",
        label: pair("It balances", "Se equilibra"),
        cue: pair(
          `Put ${g} in for ${e.L}: ${g} + ${e.a} = ${l}. Is ${l} the same as ${e.b}?`,
          `Pon ${g} en lugar de ${e.L}: ${g} + ${e.a} = ${l}. ¿${l} es igual a ${e.b}?`,
        ),
      },
      {
        id: "left",
        label: pair("The left side is heavier", "El lado izquierdo pesa más"),
        correct: heavier === "left",
        cue: wrongWay(),
      },
      {
        id: "right",
        label: pair("The right side is heavier", "El lado derecho pesa más"),
        correct: heavier === "right",
        cue: wrongWay(),
      },
    ],
    g + e.b,
  );
}

const drawableTest = (e) =>
  e.a * testScale(e) >= MIN_PIECE_PX && e.b * testScale(e) >= MIN_PIECE_PX;

export function validateBalanceTest(cfg) {
  if (!cfg || typeof cfg !== "object" || cfg.mode !== "test") return null;
  const eq = makeEq(cfg);
  const story = clean(cfg.story);
  const tr = cfg.transfer;
  if (!eq || eq.form !== "add" || !drawableTest(eq)) return null;
  const words = Array.isArray(cfg.words) ? cfg.words.map((w) => clean(w, 60)) : [];
  const guess = Number(cfg.guess);
  if (words.length !== 3 || words.some((w) => !w) || !story) return null;
  if (!okInt(guess, 0, eq.b) || guess === eq.x) return null;
  const t = makeEq({ ...tr, form: "add" });
  const tstory = clean(tr?.story);
  if (!t || !tstory || !drawableTest(t) || t.x === t.a || t.x === t.b) return null;
  return { mode: "test", eq, story, words, guess, transfer: { eq: t, story: tstory } };
}

/**
 * Every sentence of the play, as {en, es} pairs, from a validated config.
 * @returns {any}
 */
export function testCopy(v) {
  const { eq: e } = v;
  const { a, b, x, L } = e;
  const story = v.story;
  const kicker = pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo");
  const sc = (...xs) => xs.map(([en, es]) => pair(en, es));
  const [w0, w1, w2] = v.words;
  const g = v.guess;
  const t = v.transfer.eq;
  const rows = [];
  for (let i = Math.max(0, x - 2), k = 0; k < 5; i++, k++) {
    rows.push(`${i} + ${a} = ${i + a}${i === x ? " ✓" : ` ≠ ${b}`}`);
  }
  return {
    kicker,
    title: pair("Does it balance?", "¿Se equilibra?"),
    ariaLabel: pair(
      `A balance scale: ${L} plus ${a} on the left, ${b} on the right. Sliding ${L} to a value tips the scale or balances it.`,
      `Una balanza: ${L} más ${a} a la izquierda, ${b} a la derecha. Al deslizar ${L} a un valor, la balanza se inclina o se equilibra.`,
    ),
    printSummary: pair(
      `${story.en} The equation is ${eqText(e)}. A solution is a value of ${L} that makes both sides equal. Substituting ${x}: ${x} + ${a} = ${b}, so ${x} is a solution. Other values, such as ${g}, are not: ${g} + ${a} = ${g + a}.`,
      `${story.es} La ecuación es ${eqText(e)}. Una solución es un valor de ${L} que hace iguales los dos lados. Al sustituir ${x}: ${x} + ${a} = ${b}, así que ${x} es una solución. Otros valores, como ${g}, no lo son: ${g} + ${a} = ${g + a}.`,
    ),
    labels: sc(
      ["The clue", "La pista"],
      ["Predict", "Predice"],
      ["Test values", "Prueba valores"],
      ["Check", "Comprueba"],
      ["On your own", "Por tu cuenta"],
    ),
    situateSay: pair(
      `${story.en} Each part of the words becomes a part of the equation: “${w0.en}” is ${L}, “${w1.en}” is + ${a}, and “${w2.en}” is = ${b}. The equal sign says the two sides balance.`,
      `${story.es} Cada parte de las palabras se vuelve una parte de la ecuación: «${w0.es}» es ${L}, «${w1.es}» es + ${a} y «${w2.es}» es = ${b}. El signo igual dice que los dos lados se equilibran.`,
    ),
    exprSteps: [L, `${L} + ${a}`, eqText(e)],
    predictSay: pair(
      `A detective guesses ${L} = ${g}. Put ${g} in for ${L}: the left side becomes ${g} + ${a}. Does the scale still balance?`,
      `Un detective supone que ${L} = ${g}. Pon ${g} en lugar de ${L}: el lado izquierdo queda ${g} + ${a}. ¿La balanza sigue equilibrada?`,
    ),
    predictQ: pair(`With ${L} = ${g}, the scale…`, `Con ${L} = ${g}, la balanza…`),
    predictOk: pair(
      `Yes: ${g} + ${a} = ${g + a}, and ${g + a} ${cmp(g + a, b)} ${b}, so the left side is ${g + a < b ? "lighter" : "heavier"}. ${g} is not a solution.`,
      `Sí: ${g} + ${a} = ${g + a}, y ${g + a} ${cmp(g + a, b)} ${b}, así que el lado izquierdo pesa ${g + a < b ? "menos" : "más"}. ${g} no es una solución.`,
    ),
    testSay: pair(
      `Slide ${L} to try other values. The left side, ${L} + ${a}, is weighed against ${b}. Find the value that balances the scale.`,
      `Desliza ${L} para probar otros valores. El lado izquierdo, ${L} + ${a}, se pesa contra ${b}. Encuentra el valor que equilibra la balanza.`,
    ),
    testMiss: (n) => {
      const l = n + a;
      return pair(
        `${n} + ${a} = ${l}, and ${l} ${cmp(l, b)} ${b}: not balanced, so ${n} is not a solution. Try another value.`,
        `${n} + ${a} = ${l}, y ${l} ${cmp(l, b)} ${b}: no está equilibrada, así que ${n} no es una solución. Prueba otro valor.`,
      );
    },
    testFound: pair(
      `${x} + ${a} = ${b}: balanced! ${x} is a solution of ${eqText(e)}. Slide to a value next to it: does anything else balance?`,
      `${x} + ${a} = ${b}: ¡equilibrada! ${x} es una solución de ${eqText(e)}. Desliza a un valor vecino: ¿se equilibra algo más?`,
    ),
    connectSay: pair(
      `Testing a value means substituting it for ${L} and comparing the two sides. Only ${x} makes ${eqText(e)} true.`,
      `Probar un valor es sustituirlo en lugar de ${L} y comparar los dos lados. Solo ${x} hace verdadera ${eqText(e)}.`,
    ),
    rows,
    transferSay: pair(
      `${v.transfer.story.en} First write the equation that matches the clue.`,
      `${v.transfer.story.es} Primero escribe la ecuación que corresponde a la pista.`,
    ),
    q1: pair("Which equation matches the clue?", "¿Qué ecuación corresponde a la pista?"),
    ok1: pair(
      `Yes: “plus ${t.a}” is + ${t.a} and “equals ${t.b}” is = ${t.b}. Now test values.`,
      `Sí: «más ${t.a}» es + ${t.a} y «es igual a ${t.b}» es = ${t.b}. Ahora prueba valores.`,
    ),
    q2: pair(
      `Which value is a solution of ${eqText(t)}?`,
      `¿Qué valor es una solución de ${eqText(t)}?`,
    ),
    ok2: pair(
      `${t.x} + ${t.a} = ${t.b}: balanced. ${t.x} is the solution.`,
      `${t.x} + ${t.a} = ${t.b}: equilibrada. ${t.x} es la solución.`,
    ),
    explainLabel: pair(
      "Explain: how do you know a value is a solution of an equation?",
      "Explica: ¿cómo sabes que un valor es una solución de una ecuación?",
    ),
    explainFrame: pair(
      "A value is a solution when I ___ it for the letter and both sides ___.",
      "Un valor es una solución cuando lo ___ en lugar de la letra y los dos lados ___.",
    ),
  };
}
