// living/two-var-copy-solve.js — every bilingual line of the "equation" (9-3)
// and "apply" (9-4) modes and their choice sets, from a validated config. No DOM.
// Rule texts are mathematics, so they are the same in both languages.

import { P } from "./two-var-copy.js";
import {
  askChoices,
  atLeastChoices,
  failingRow,
  fmt,
  fmtY,
  placeCorrect,
  r2,
  rowsOf,
  ruleCheck,
  ruleChoices,
  solveChoices,
  yOf,
} from "./two-var-model.js";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const both = (f) => P(f("en"), f("es"));
const same = (s) => P(s, s);

/** "Let m = months and c = total cost." */
const letPair = (sit) =>
  P(
    `Let ${sit.vars.x} = ${sit.xName.en} and ${sit.vars.y} = ${sit.yName.en}.`,
    `Sea ${sit.vars.x} = «${sit.xName.es}» y ${sit.vars.y} = «${sit.yName.es}».`,
  );

/** Cue for a wrong rule: test it on one row and compare with the table. */
function ruleCue(sit, c) {
  const x = failingRow(sit, c.kind);
  const r = ruleCheck(sit, c.kind, x);
  const tail = {
    added: P(
      "Does the rule use the rate for every row, or add it only once?",
      "¿La regla usa la tasa en cada fila o la suma solo una vez?",
    ),
    swapped: P(
      "Which quantity depends on the other? The dependent one goes alone on the left of the equals sign.",
      "¿Cuál cantidad depende de la otra? La dependiente va sola a la izquierda del signo igual.",
    ),
    bigRate: P(
      "Test the first row too: what does that row say?",
      "Prueba también la primera fila: ¿qué dice?",
    ),
    minus: P(
      "Should a larger input give a smaller output here?",
      "¿Debería una entrada mayor dar una salida menor aquí?",
    ),
  }[c.kind];
  const head = (l) =>
    l === "en"
      ? `Test it on the row where ${sit.vars.x} = ${x}: ${r.shows} ${r.gotText}, but the table says ${r.expectText}. `
      : `Pruébala en la fila donde ${sit.vars.x} = ${x}: ${r.shows} ${r.gotText}, pero la tabla dice ${r.expectText}. `;
  return P(head("en") + tail.en, head("es") + tail.es);
}

export function equationCopy(v) {
  const { main: m, transfer: t, other, probeStart } = v;
  const rows = rowsOf(m);
  const k = fmt(m.k, m.cents);
  const rule = (s) => `${s.vars.y} = ${fmt(s.k, s.cents)}${s.vars.x}`;
  const ruleOpts = (sit, fourth) =>
    ruleChoices(sit, fourth).map((c) => ({
      ...c,
      label: same(c.text),
      cue: c.correct ? undefined : ruleCue(sit, c),
    }));
  const wrongVar = m.vars.x === "x" ? "z" : "x";
  const ox = other.k;
  const oRow = m.xs[1];
  return {
    letPair,
    rule,
    title: P("One rule for every row", "Una regla para cada fila"),
    ariaLabel: P(
      `A table of ${m.xName.en} and ${m.yName.en}, a graph of its points on one line, and the equation ${rule(m)} that fits every row.`,
      `Una tabla de «${m.xName.es}» y «${m.yName.es}», una gráfica con sus puntos en una recta y la ecuación ${rule(m)} que sirve para cada fila.`,
    ),
    printSummary: P(
      `Each row adds ${fmtY(m, m.k)}, so ${rule(m)}. Test it on every row: ${rows.map((r) => `${k} × ${r.x} = ${fmtY(m, r.y)}`).join(", ")}. The points are on one line through (0, 0), and the equation works for any ${m.xName.en}.`,
      `Cada fila suma ${fmtY(m, m.k)}, así que ${rule(m)}. Pruébala en cada fila: ${rows.map((r) => `${k} × ${r.x} = ${fmtY(m, r.y)}`).join(", ")}. Los puntos están en una recta que pasa por (0, 0), y la ecuación sirve para cualquier valor de «${m.xName.es}».`,
    ),
    situate: both((l) =>
      l === "en"
        ? `${m.story.en} Each new row adds the same amount: ${fmtY(m, m.k)}.`
        : `${m.story.es} Cada fila nueva suma la misma cantidad: ${fmtY(m, m.k)}.`,
    ),
    predict: {
      say: both(
        (l) =>
          `${letPair(m)[l]} ${l === "en" ? "Pick the equation you think matches the table; it will be tested on the rows." : "Elige la ecuación que crees que corresponde a la tabla; se probará en las filas."}`,
      ),
      question: P("Which equation matches the table?", "¿Cuál ecuación corresponde a la tabla?"),
      options: placeCorrect(ruleOpts(m, "bigRate"), m.xs.length + 3),
      test: (c) => {
        const x = failingRow(m, c.kind);
        const r = ruleCheck(m, c.kind, x);
        return { x, text: `${r.shows} ${r.gotText} ≠ ${r.expectText}` };
      },
      ok: both((l) =>
        l === "en"
          ? `Yes: ${rule(m)}. In every row, ${m.vars.y} is ${k} times ${m.vars.x}.`
          : `Sí: ${rule(m)}. En cada fila, ${m.vars.y} es ${k} por ${m.vars.x}.`,
      ),
    },
    check: {
      say: P(
        "The rows slide onto the graph. Tap a row to test the rule on it.",
        "Las filas se deslizan a la gráfica. Toca una fila para probar la regla en ella.",
      ),
      group: P("Test row", "Probar fila"),
      label: (r) => `${m.vars.x} = ${r.x}`,
      result: (r) => {
        const c = ruleCheck(m, "right", r.x);
        return P(
          `${c.shows} = ${fmtY(m, c.got)}. The table says ${fmtY(m, r.y)}: it matches.`,
          `${c.shows} = ${fmtY(m, c.got)}. La tabla dice ${fmtY(m, r.y)}: coincide.`,
        );
      },
      progress: (n) =>
        P(`Test every row (${n}/${rows.length}).`, `Prueba cada fila (${n}/${rows.length}).`),
      done: P(
        `The rule works on every row, and the points sit on one straight line through (0, 0).`,
        `La regla sirve en cada fila, y los puntos están en una recta que pasa por (0, 0).`,
      ),
    },
    any: {
      say: P(
        `The table lists only a few rows. The equation gives the answer for any number of ${m.xName.en}. Slide ${m.vars.x}.`,
        `La tabla solo muestra algunas filas. La ecuación da la respuesta para cualquier cantidad de «${m.xName.es}». Mueve ${m.vars.x}.`,
      ),
      label: P(`${cap(m.xName.en)} (${m.vars.x})`, `${cap(m.xName.es)} (${m.vars.x})`),
      start: probeStart,
      progress: (n) =>
        P(`Slide to 3 different values (${n}/3).`, `Mueve a 3 valores distintos (${n}/3).`),
      done: P(
        `Any number of ${m.xName.en} works: ${rule(m)} gives the ${m.yName.en} every time, even where the table has no row.`,
        `Cualquier cantidad de «${m.xName.es}» sirve: ${rule(m)} da «${m.yName.es}» cada vez, incluso donde la tabla no tiene fila.`,
      ),
    },
    other: {
      say: both((l) => `${other.story[l]}`),
      question: P(
        "How does the equation change for this other rate?",
        "¿Cómo cambia la ecuación para esta otra tasa?",
      ),
      options: placeCorrect(
        [
          {
            label: P(
              `The rate changes: ${m.vars.y} = ${fmt(ox, m.cents)}${m.vars.x}`,
              `Cambia la tasa: ${m.vars.y} = ${fmt(ox, m.cents)}${m.vars.x}`,
            ),
            correct: true,
          },
          {
            label: same(`${m.vars.y} = ${k}${wrongVar}`),
            correct: false,
            cue: P(
              `Does ${m.vars.x} still count ${m.xName.en}? Did that change, or did the rate?`,
              `¿${m.vars.x} sigue contando «${m.xName.es}»? ¿Cambió eso o cambió la tasa?`,
            ),
          },
          {
            label: same(`${m.vars.y} = ${fmt(ox, m.cents)} + ${m.vars.x}`),
            correct: false,
            cue: P(
              `Test it with ${oRow}: ${fmt(ox, m.cents)} + ${oRow} = ${fmt(r2(ox + oRow), m.cents)}. Is ${fmt(ox, m.cents)} charged for each of the ${oRow}?`,
              `Pruébala con ${oRow}: ${fmt(ox, m.cents)} + ${oRow} = ${fmt(r2(ox + oRow), m.cents)}. ¿Se cobra ${fmt(ox, m.cents)} por cada uno de los ${oRow}?`,
            ),
          },
          {
            label: P(
              "Nothing changes: the equation stays the same",
              "Nada cambia: la ecuación sigue igual",
            ),
            correct: false,
            cue: P(
              `Compare the two rates: ${k} and ${fmt(ox, m.cents)}. Are they the same? Look at where the two lines end.`,
              `Compara las dos tasas: ${k} y ${fmt(ox, m.cents)}. ¿Son iguales? Mira dónde terminan las dos rectas.`,
            ),
          },
        ],
        m.xMax + 1,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes: only the rate changes, so ${m.vars.y} = ${fmt(ox, m.cents)}${m.vars.x}. ${m.vars.x} still counts ${m.xName.en}. The dotted line is flatter because its rate is smaller.`
          : `Sí: solo cambia la tasa, así que ${m.vars.y} = ${fmt(ox, m.cents)}${m.vars.x}. ${m.vars.x} sigue contando «${m.xName.es}». La recta punteada es más plana porque su tasa es menor.`,
      ),
    },
    transfer: {
      say: both((l) => `${t.story[l]} ${letPair(t)[l]}`),
      question: P("Which equation matches this table?", "¿Cuál ecuación corresponde a esta tabla?"),
      options: placeCorrect(ruleOpts(t, "minus"), t.xs[0] + t.xs.length),
      test: (c) => {
        const x = failingRow(t, c.kind);
        const r = ruleCheck(t, c.kind, x);
        return { x, text: `${r.shows} ${r.gotText} ≠ ${r.expectText}` };
      },
      ok: both((l) =>
        l === "en"
          ? `Yes: ${rule(t)}. Test it: ${t.xs.map((x) => `${fmt(t.k)} × ${x} = ${fmtY(t, yOf(t, x))}`).join(" and ")}. Both rows match.`
          : `Sí: ${rule(t)}. Pruébala: ${t.xs.map((x) => `${fmt(t.k)} × ${x} = ${fmtY(t, yOf(t, x))}`).join(" y ")}. Las dos filas coinciden.`,
      ),
      explain: P(
        "Explain: how do you know your equation is right?",
        "Explica: ¿cómo sabes que tu ecuación es correcta?",
      ),
      frame: P(
        "My equation is ___ because ___. I tested the row ___ and got ___.",
        "Mi ecuación es ___ porque ___. Probé la fila ___ y obtuve ___.",
      ),
    },
  };
}

export function applyCopy(v) {
  const { main: m, transfer: t, ask, goals, goalXs, solve, need } = v;
  const k = fmt(m.k);
  const X = m.vars.x;
  const Y = m.vars.y;
  const eq = `${Y} = ${k}${X}`;
  const lastX = m.xs[m.xs.length - 1];
  const hSolve = r2(solve.target / m.k);
  const sub = (sit, x) => `${sit.vars.y} = ${fmt(sit.k)} × ${fmt(x)} = ${fmtY(sit, yOf(sit, x))}`;
  const askCue = {
    added: P(
      `That adds ${k} + ${ask.x}. The rate ${k} should be used for EACH of the ${ask.x}, not once. Is the line really that low at ${ask.x}?`,
      `Eso suma ${k} + ${ask.x}. La tasa ${k} se debe usar por CADA uno de los ${ask.x}, no una vez. ¿La recta está de verdad tan baja en ${ask.x}?`,
    ),
    lastRow: P(
      `${fmtY(m, yOf(m, lastX))} is the value in the last row of the table, at ${lastX}. Is ${ask.x} the same place on the horizontal axis?`,
      `${fmtY(m, yOf(m, lastX))} es el valor de la última fila de la tabla, en ${lastX}. ¿Es ${ask.x} el mismo lugar del eje horizontal?`,
    ),
    slip: P(
      `Check which value of ${X} you used. The hollow point is not on the line at ${ask.x}.`,
      `Revisa qué valor de ${X} usaste. El punto hueco no está sobre la recta en ${ask.x}.`,
    ),
  };
  const solveCue = (o) => {
    const check = `${k} × ${fmt(o.value)} = ${fmt(r2(m.k * o.value))}`;
    const tail = {
      times: P(
        "To undo multiplying, use the opposite operation.",
        "Para deshacer una multiplicación, usa la operación contraria.",
      ),
      minus: P("Subtracting does not undo multiplying.", "Restar no deshace una multiplicación."),
      small: P(
        "Compare the size of your answer with the target.",
        "Compara el tamaño de tu respuesta con la meta.",
      ),
    }[o.kind];
    return P(
      `Substitute to check: ${check}. Is that ${fmt(solve.target)}? ${tail.en}`,
      `Sustituye para comprobar: ${check}. ¿Es ${fmt(solve.target)}? ${tail.es}`,
    );
  };
  const atCue = (o) => {
    const prod = `${fmt(t.k)} × ${o.n} = ${fmtY(t, yOf(t, o.n))}`;
    const tail =
      o.kind === "round"
        ? P(
            "That reaches the goal, but is it the LEAST number that does?",
            "Eso llega a la meta, pero ¿es el MENOR número que lo logra?",
          )
        : P(
            "Is that at least the goal? Compare the hollow point with the goal line.",
            "¿Llega al menos a la meta? Compara el punto hueco con la recta de la meta.",
          );
    return P(`${prod}. ${tail.en}`, `${prod}. ${tail.es}`);
  };
  return {
    eq,
    title: P("Use the equation to answer", "Usa la ecuación para responder"),
    ariaLabel: P(
      `A table, a graph and the equation ${eq} for ${m.yName.en} and ${m.xName.en}. Slide along the line to answer how much when, and read across to answer when is.`,
      `Una tabla, una gráfica y la ecuación ${eq} para «${m.yName.es}» y «${m.xName.es}». Desliza por la recta para responder cuánto cuando, y lee hacia el lado para responder cuándo.`,
    ),
    printSummary: P(
      `${eq}. How much when: substitute ${X} = ${ask.x} to get ${sub(m, ask.x)}. When is: ${k}${X} = ${fmt(solve.target)} gives ${X} = ${fmt(hSolve)}. ${solve.interpret.en}`,
      `${eq}. Cuánto cuando: sustituye ${X} = ${ask.x} y obtienes ${sub(m, ask.x)}. Cuándo es: ${k}${X} = ${fmt(solve.target)} da ${X} = ${fmt(hSolve)}. ${solve.interpret.es}`,
    ),
    situate: both((l) =>
      l === "en"
        ? `${m.story.en} The table, the graph and the equation ${eq} all describe the same relationship.`
        : `${m.story.es} La tabla, la gráfica y la ecuación ${eq} describen la misma relación.`,
    ),
    predict: {
      say: both(
        (l) =>
          `${letPair(m)[l]} ${l === "en" ? "Use the equation or the graph to predict." : "Usa la ecuación o la gráfica para predecir."}`,
      ),
      question: P(
        `What is ${Y} when ${X} = ${ask.x}?`,
        `¿Cuánto vale ${Y} cuando ${X} = ${ask.x}?`,
      ),
      options: placeCorrect(
        askChoices(m, ask.x).map((o) => ({ ...o, label: same(fmtY(m, o.y)), cue: askCue[o.kind] })),
        ask.x + m.xs.length,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes: substitute ${X} = ${ask.x}. ${sub(m, ask.x)}.`
          : `Sí: sustituye ${X} = ${ask.x}. ${sub(m, ask.x)}.`,
      ),
    },
    how: {
      say: P(
        `“How much when…?” Slide ${X}. Substitute it into the equation and multiply.`,
        `«¿Cuánto cuando…?» Mueve ${X}. Sustituye ese valor en la ecuación y multiplica.`,
      ),
      label: P(`${cap(m.xName.en)} (${X})`, `${cap(m.xName.es)} (${X})`),
      progress: (n) =>
        P(`Slide to 3 different values (${n}/3).`, `Mueve a 3 valores distintos (${n}/3).`),
      done: P(
        `That is “how much when…?”: put the value in for ${X}, multiply, and read ${Y}. The point stays on the line.`,
        `Eso es «¿cuánto cuando…?»: pon el valor en lugar de ${X}, multiplica y lee ${Y}. El punto se queda sobre la recta.`,
      ),
    },
    when: {
      say: P(
        `“When is…?” Pick an amount of ${Y} you want. Read across to the line, then down to ${X}.`,
        `«¿Cuándo es…?» Elige cuánto quieres de ${Y}. Lee hacia el lado hasta la recta y luego hacia abajo hasta ${X}.`,
      ),
      group: P(`Goal for ${Y}`, `Meta para ${Y}`),
      label: (g) => `${Y} = ${fmt(g)}`,
      result: (g, x) =>
        P(
          `${k}${X} = ${fmt(g)}, so ${X} = ${fmt(g)} ÷ ${k} = ${fmt(x)}.`,
          `${k}${X} = ${fmt(g)}, así que ${X} = ${fmt(g)} ÷ ${k} = ${fmt(x)}.`,
        ),
      progress: (n) => P(`Try 2 different goals (${n}/2).`, `Prueba 2 metas distintas (${n}/2).`),
      done: P(
        `That is “when is…?”: set ${Y} to the goal and divide both sides by ${k} to find ${X}.`,
        `Eso es «¿cuándo es…?»: pon la meta en ${Y} y divide los dos lados entre ${k} para hallar ${X}.`,
      ),
      goals,
      goalXs,
    },
    solve: {
      say: P(
        `The goal is ${Y} = ${fmt(solve.target)}. The graph only goes up to ${fmt(m.scale.yMax)}, but the equation still works: ${k}${X} = ${fmt(solve.target)}.`,
        `La meta es ${Y} = ${fmt(solve.target)}. La gráfica solo llega hasta ${fmt(m.scale.yMax)}, pero la ecuación sigue sirviendo: ${k}${X} = ${fmt(solve.target)}.`,
      ),
      note: [
        P("The graph stops", "La gráfica llega"),
        P(`at ${fmt(m.scale.yMax)}. Use the`, `hasta ${fmt(m.scale.yMax)}. Usa la`),
        P(`equation for ${fmt(solve.target)}.`, `ecuación para ${fmt(solve.target)}.`),
      ],
      question: P(
        `${k}${X} = ${fmt(solve.target)}. What is ${X}?`,
        `${k}${X} = ${fmt(solve.target)}. ¿Cuánto vale ${X}?`,
      ),
      options: placeCorrect(
        solveChoices(m.k, solve.target).map((o) => ({
          ...o,
          label: same(fmt(o.value)),
          cue: o.correct ? undefined : solveCue(o),
        })),
        solve.target % 7,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes: divide both sides by ${k}: ${X} = ${fmt(solve.target)} ÷ ${k} = ${fmt(hSolve)}. Check: ${k} × ${fmt(hSolve)} = ${fmt(solve.target)}. ${solve.interpret.en}`
          : `Sí: divide los dos lados entre ${k}: ${X} = ${fmt(solve.target)} ÷ ${k} = ${fmt(hSolve)}. Comprobación: ${k} × ${fmt(hSolve)} = ${fmt(solve.target)}. ${solve.interpret.es}`,
      ),
    },
    transfer: {
      say: both((l) => `${t.story[l]} ${letPair(t)[l]}`),
      question: P(
        `${fmt(t.k)}${t.vars.x} = ${fmt(t.goal)}. At least how many ${t.xName.en} reach the goal?`,
        `${fmt(t.k)}${t.vars.x} = ${fmt(t.goal)}. ¿Al menos cuántos «${t.xName.es}» llegan a la meta?`,
      ),
      options: placeCorrect(
        atLeastChoices(t.k, t.goal).map((o) => ({
          ...o,
          label: same(String(o.n)),
          cue: o.correct ? undefined : atCue(o),
        })),
        need,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes: ${fmt(t.k)} × ${need} = ${fmtY(t, yOf(t, need))} reaches ${fmtY(t, t.goal)}, but ${fmt(t.k)} × ${need - 1} = ${fmtY(t, yOf(t, need - 1))} does not. ${t.dashNote.en}`
          : `Sí: ${fmt(t.k)} × ${need} = ${fmtY(t, yOf(t, need))} llega a ${fmtY(t, t.goal)}, pero ${fmt(t.k)} × ${need - 1} = ${fmtY(t, yOf(t, need - 1))} no. ${t.dashNote.es}`,
      ),
      explain: P(
        `Explain: why must it be ${need} and not ${need - 1}?`,
        `Explica: ¿por qué debe ser ${need} y no ${need - 1}?`,
      ),
      frame: P(
        "They need at least ___ because ___ is only ___.",
        "Necesitan al menos ___ porque ___ es solo ___.",
      ),
    },
  };
}
