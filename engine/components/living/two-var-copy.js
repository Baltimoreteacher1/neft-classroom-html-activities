// living/two-var-copy.js — every bilingual line of the "variables" (9-1) and
// "graph" (9-2) modes, and their choice sets, from a validated config. No DOM.
// Spanish never puts an article in front of a quantity name (genders differ):
// it says "la cantidad «…»" or uses the name right after its number.

import {
  fmt,
  fmtY,
  pairText,
  placeCorrect,
  pointChoices,
  r2,
  readOut,
  rowsOf,
  yOf,
} from "./two-var-model.js";

/** @param {string} en @param {string} es */
export const P = (en, es) => ({ en, es });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const capP = (p) => P(cap(p.en), cap(p.es));
const both = (f) => P(f("en"), f("es"));

export const SCENE_LABELS = {
  situate: P("The situation", "La situación"),
  predict: P("Predict", "Predice"),
  try: P("Try it", "Pruébalo"),
  say: P("Say it", "Dilo"),
  transfer: P("On your own", "Por tu cuenta"),
  plot: P("Make points", "Haz puntos"),
  check: P("Is it on the graph?", "¿Está en la gráfica?"),
  steep: P("Steeper", "Más inclinada"),
};

export function variablesCopy(v) {
  const { main: m, transfer: t } = v;
  const rows = rowsOf(m);
  const need = Math.min(3, m.xs.length);
  const list = rows.map((r) => `${fmt(r.x)} → ${fmtY(m, r.y)}`).join(", ");
  const wrongSwap = (sit) => ({
    en: `Read it back: in this sentence the quantity that depends is the one that was chosen. Which quantity did we say was chosen, ${sit.xName.en} or ${sit.yName.en}?`,
    es: `Léela otra vez: en esta oración depende la cantidad que se eligió. ¿Cuál dijimos que se eligió: «${sit.xName.es}» o «${sit.yName.es}»?`,
  });
  return {
    title: P("Change one, watch the other", "Cambia una y mira cómo responde la otra"),
    ariaLabel: P(
      `Two cards, ${m.xName.en} and ${m.yName.en}. Choosing a different value of the first changes the second, and each pair becomes a row of a table.`,
      `Dos tarjetas, «${m.xName.es}» y «${m.yName.es}». Elegir otro valor de la primera cambia la segunda, y cada par se vuelve una fila de una tabla.`,
    ),
    printSummary: P(
      `${cap(m.xName.en)} is chosen, so it is the independent variable. ${cap(m.yName.en)} responds, so it is the dependent variable. Pairs: ${list}. ${m.sentences.right.en}`,
      `«${cap(m.xName.es)}» se elige, así que es la variable independiente. «${cap(m.yName.es)}» responde, así que es la variable dependiente. Pares: ${list}. ${m.sentences.right.es}`,
    ),
    situate: m.story,
    predict: {
      say: P(
        "Two numbers go together on these cards. Before anything changes, decide which one was chosen.",
        "Dos números van juntos en estas tarjetas. Antes de cambiar nada, decide cuál se eligió.",
      ),
      question: P(
        "Which quantity was CHOSEN, on purpose, first?",
        "¿Cuál cantidad se ELIGIÓ primero, a propósito?",
      ),
      options: placeCorrect(
        [
          { label: capP(m.xName), correct: true },
          {
            label: capP(m.yName),
            correct: false,
            cue: P(
              "Look at the two cards. Which number could someone set on purpose before anything happens, and which one is only read off afterwards?",
              "Mira las dos tarjetas. ¿Cuál número se puede fijar a propósito antes de que pase algo, y cuál solo se lee después?",
            ),
          },
          {
            label: P("The bigger number", "El número más grande"),
            correct: false,
            cue: P(
              "Size does not decide it. Ask instead: which card could someone set on purpose?",
              "El tamaño no lo decide. Pregunta mejor: ¿cuál tarjeta se podría fijar a propósito?",
            ),
          },
          {
            label: P("Neither: they are just two numbers", "Ninguna: son solo dos números"),
            correct: false,
            cue: P(
              `Look at the cards: ${fmt(rows[0].x)} goes with ${fmtY(m, rows[0].y)}. Can both of them be free to pick, or does one follow from the other?`,
              `Mira las tarjetas: ${fmt(rows[0].x)} va con ${fmtY(m, rows[0].y)}. ¿Pueden elegirse los dos libremente o uno sale del otro?`,
            ),
          },
        ],
        Math.round(m.k * 10) + m.xs.length,
      ),
      ok: P(
        `Yes. Someone chooses the ${m.xName.en} first, so that quantity is the independent variable. The ${m.yName.en} responds, so that quantity is the dependent variable.`,
        `Sí. Alguien elige primero «${m.xName.es}», así que esa cantidad es la variable independiente. «${cap(m.yName.es)}» responde, así que esa cantidad es la variable dependiente.`,
      ),
    },
    try: {
      say: P(
        `Pick a different ${m.xName.en}. Watch the ${m.yName.en} respond.`,
        `Elige otro valor de «${m.xName.es}». Mira cómo responde «${m.yName.es}».`,
      ),
      group: P("Choose", "Elige"),
      progress: (n) =>
        P(
          `Try ${need} different values to see the pattern (${n}/${need}).`,
          `Prueba ${need} valores distintos para ver el patrón (${n}/${need}).`,
        ),
      done: P(
        `Every time you chose a new ${m.xName.en}, the ${m.yName.en} followed. You choose one; the other responds. Each pair is a row of the table.`,
        `Cada vez que elegiste otro valor de «${m.xName.es}», «${m.yName.es}» lo siguió. Tú eliges una; la otra responde. Cada par es una fila de la tabla.`,
      ),
    },
    say: {
      say: P(
        "Say the relationship in a sentence. The quantity that responds comes first, then “depends on”.",
        "Di la relación en una oración. Primero va la cantidad que responde, luego «depende de».",
      ),
      question: P(
        "Which sentence is in the correct order?",
        "¿Cuál oración está en el orden correcto?",
      ),
      options: placeCorrect(
        [
          { label: m.sentences.right, correct: true },
          { label: m.sentences.swapped, correct: false, cue: wrongSwap(m) },
          {
            label: P(
              "Neither quantity depends on the other.",
              "Ninguna cantidad depende de la otra.",
            ),
            correct: false,
            cue: P(
              "Look at the table. When the first column changed, did the second column stay the same?",
              "Mira la tabla. Cuando cambió la primera columna, ¿se quedó igual la segunda?",
            ),
          },
        ],
        m.xs.length + 1,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes. The dependent quantity comes first, then “depends on”, then the independent one: ${m.sentences.right.en}`
          : `Sí. Primero va la cantidad dependiente, luego «depende de» y después la independiente: ${m.sentences.right.es}`,
      ),
    },
    transfer: {
      say: t.story,
      question: P(
        "Which quantity is the independent variable?",
        "¿Cuál cantidad es la variable independiente?",
      ),
      options: placeCorrect(
        [
          { label: capP(t.xName), correct: true },
          {
            label: capP(t.yName),
            correct: false,
            cue: P(
              "Which quantity was set up on purpose, and which was only measured afterwards? Look at the cards.",
              "¿Cuál cantidad se preparó a propósito y cuál solo se midió después? Mira las tarjetas.",
            ),
          },
          {
            label: P("Neither: they just happen to match", "Ninguna: solo coinciden"),
            correct: false,
            cue: P(
              "Look at the table. When the first column grows, what does the second column do?",
              "Mira la tabla. Cuando crece la primera columna, ¿qué hace la segunda?",
            ),
          },
        ],
        t.xs.length + 2,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes: you choose the ${t.xName.en}, so that quantity is independent. The ${t.yName.en} responds, so that quantity is dependent. ${t.sentences.right.en}`
          : `Sí: tú eliges «${t.xName.es}», así que esa cantidad es independiente. «${cap(t.yName.es)}» responde, así que esa cantidad es dependiente. ${t.sentences.right.es}`,
      ),
      explain: P(
        "Explain: how do you know which one is independent?",
        "Explica: ¿cómo sabes cuál es la independiente?",
      ),
      frame: P(
        "___ is independent because ___. ___ depends on ___.",
        "___ es independiente porque ___. ___ depende de ___.",
      ),
    },
  };
}

export function graphCopy(v) {
  const { main: m, transfer: t, check, pointX } = v;
  const rows = rowsOf(m);
  const px = m.xs[1];
  const py = yOf(m, px);
  const trows = rowsOf(t);
  const tPoint = trows.find((r) => r.x === pointX);
  const list = rows.map((r) => pairText(m, r.x, r.y)).join(", ");
  const yCheck = yOf(m, check.x);
  const y2 = r2(t.second * t.xMax);
  const readP = (sit, x, y) => both((l) => readOut(sit, x, y, l));
  const means = (sit, x, y) =>
    P(
      `The point ${pairText(sit, x, y)} means: ${readOut(sit, x, y, "en")}.`,
      `El punto ${pairText(sit, x, y)} significa: ${readOut(sit, x, y, "es")}.`,
    );
  const pointCue = {
    swapped: P(
      "Which number goes first in an ordered pair, and which axis is that one? Read the axis labels.",
      "¿Cuál número va primero en un par ordenado y a cuál eje corresponde? Lee los rótulos de los ejes.",
    ),
    added: P(
      `Look at the table. Does the row for ${fmt(px)} say only ${fmtY(m, m.k + px)}? Read what the table says for ${fmt(px)}.`,
      `Mira la tabla. ¿La fila de ${fmt(px)} dice solo ${fmtY(m, m.k + px)}? Lee lo que dice la tabla para ${fmt(px)}.`,
    ),
    repeat: P(
      `The hollow point is at the same height as the row for ${fmt(m.xs[0])}. Should ${fmt(px)} and ${fmt(m.xs[0])} have the same ${m.yName.en}? Check the table.`,
      `El punto hueco está a la misma altura que la fila de ${fmt(m.xs[0])}. ¿Deben ${fmt(px)} y ${fmt(m.xs[0])} tener lo mismo en «${m.yName.es}»? Revisa la tabla.`,
    ),
  };
  const climb = both((l) =>
    l === "en"
      ? `The points rise to the right: more ${m.xName.en}, more ${m.yName.en}.`
      : `Los puntos suben hacia la derecha: más «${m.xName.es}», más «${m.yName.es}».`,
  );
  return {
    list,
    px,
    py,
    title: P("From the table to the graph", "De la tabla a la gráfica"),
    ariaLabel: P(
      `A table of ${m.xName.en} and ${m.yName.en}. Each row slides onto a graph and becomes one point; the points climb to the right.`,
      `Una tabla de «${m.xName.es}» y «${m.yName.es}». Cada fila se desliza a una gráfica y se vuelve un punto; los puntos suben hacia la derecha.`,
    ),
    printSummary: P(
      `Each row (${m.xName.en}, ${m.yName.en}) is an ordered pair and one point: ${list}. The independent variable goes first. ${climb.en}`,
      `Cada fila («${m.xName.es}», «${m.yName.es}») es un par ordenado y un punto: ${list}. La variable independiente va primero. ${climb.es}`,
    ),
    situate: m.story,
    predict: {
      say: P(
        `Each row of the table will slide onto the graph and become one point. Predict where the row for ${fmt(px)} ${m.xName.en} lands.`,
        `Cada fila de la tabla se deslizará a la gráfica y se volverá un punto. Predice dónde queda la fila de ${fmt(px)} ${m.xName.es}.`,
      ),
      question: P(
        `Where does the point for ${fmt(px)} ${m.xName.en} go?`,
        `¿Dónde queda el punto de ${fmt(px)} ${m.xName.es}?`,
      ),
      options: placeCorrect(
        pointChoices(m, px).map((o) => ({
          ...o,
          label: P(pairText(m, o.px, o.py), pairText(m, o.px, o.py)),
          cue: pointCue[o.kind],
        })),
        2,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes: the row (${fmt(px)}, ${fmt(py, m.cents)}) becomes the point ${pairText(m, px, py)}. ${cap(readOut(m, px, py, "en"))}.`
          : `Sí: la fila (${fmt(px)}, ${fmt(py, m.cents)}) se vuelve el punto ${pairText(m, px, py)}. ${cap(readOut(m, px, py, "es"))}.`,
      ),
    },
    plot: {
      say: P(
        "Tap a pair to slide its row onto the graph. Then read what the point means.",
        "Toca un par para deslizar su fila a la gráfica. Luego lee qué significa el punto.",
      ),
      group: P("Rows", "Filas"),
      means: (r) => means(m, r.x, r.y),
      progress: (n) =>
        P(
          `Read all ${rows.length} points (${n}/${rows.length}).`,
          `Lee los ${rows.length} puntos (${n}/${rows.length}).`,
        ),
      done: both((l) =>
        l === "en"
          ? `Every row is a point now. ${climb.en} The line joins them.${m.dashNote ? ` ${m.dashNote.en}` : ""}`
          : `Ahora cada fila es un punto. ${climb.es} La recta los une.${m.dashNote ? ` ${m.dashNote.es}` : ""}`,
      ),
    },
    check: {
      say: P(
        `A hollow point is marked at ${pairText(m, check.x, check.y)}. Find ${fmt(check.x)} on the horizontal axis and see where the line is.`,
        `Hay un punto hueco en ${pairText(m, check.x, check.y)}. Busca ${fmt(check.x)} en el eje horizontal y mira dónde pasa la recta.`,
      ),
      question: P(
        `Is ${pairText(m, check.x, check.y)} a point on this graph?`,
        `¿Es ${pairText(m, check.x, check.y)} un punto de esta gráfica?`,
      ),
      options: placeCorrect(
        [
          {
            label: P(
              `No: the line passes through ${pairText(m, check.x, yCheck)}`,
              `No: la recta pasa por ${pairText(m, check.x, yCheck)}`,
            ),
            correct: true,
          },
          {
            label: P("Yes: the points keep climbing", "Sí: los puntos siguen subiendo"),
            correct: false,
            cue: P(
              "Climbing is not enough. Is the hollow point ON the line, or above it?",
              "Subir no basta. ¿El punto hueco está SOBRE la recta o arriba de ella?",
            ),
          },
          {
            label: P("Yes: it is close to the line", "Sí: está cerca de la recta"),
            correct: false,
            cue: P(
              "Close is not on. Does the line touch the hollow point? Which number would make it touch?",
              "Cerca no es sobre. ¿La recta toca el punto hueco? ¿Qué número lo haría tocar?",
            ),
          },
          {
            label: P("I cannot tell without another row", "No se puede saber sin otra fila"),
            correct: false,
            cue: P(
              `The rows already show how much each step adds: ${fmtY(m, rows[0].y)}, then ${fmtY(m, rows[1].y)}, then ${fmtY(m, rows[2].y)}. Use that to follow the line to ${fmt(check.x)}.`,
              `Las filas ya muestran cuánto suma cada paso: ${fmtY(m, rows[0].y)}, luego ${fmtY(m, rows[1].y)} y luego ${fmtY(m, rows[2].y)}. Úsalo para seguir la recta hasta ${fmt(check.x)}.`,
            ),
          },
        ],
        check.x + Math.round(m.k),
      ),
      ok: both((l) =>
        l === "en"
          ? `No. ${fmt(check.x)} × ${fmt(m.k, m.cents)} = ${fmtY(m, yCheck)}, so the point on the graph is ${pairText(m, check.x, yCheck)}. The hollow point is above the line.${m.dashNote ? ` ${m.dashNote.en}` : ""}`
          : `No. ${fmt(check.x)} × ${fmt(m.k, m.cents)} = ${fmtY(m, yCheck)}, así que el punto de la gráfica es ${pairText(m, check.x, yCheck)}. El punto hueco queda arriba de la recta.${m.dashNote ? ` ${m.dashNote.es}` : ""}`,
      ),
    },
    steep: {
      say: both((l) =>
        l === "en"
          ? `A new graph. ${t.story.en} ${t.secondStory.en} Both are drawn on the same axes.`
          : `Una gráfica nueva. ${t.story.es} ${t.secondStory.es} Las dos se dibujan en los mismos ejes.`,
      ),
      question: P(
        "How does the second line compare with the first?",
        "¿Cómo se compara la segunda recta con la primera?",
      ),
      options: placeCorrect(
        [
          {
            label: P(
              "The first line is steeper: it climbs more for each step to the right",
              "La primera recta es más inclinada: sube más por cada paso a la derecha",
            ),
            correct: true,
          },
          {
            label: P("The second line is steeper", "La segunda recta es más inclinada"),
            correct: false,
            cue: P(
              `Compare them at ${fmt(t.xMax)} on the horizontal axis. Which one is higher there? The higher one climbed faster.`,
              `Compáralas en ${fmt(t.xMax)} del eje horizontal. ¿Cuál queda más alta ahí? La más alta subió más rápido.`,
            ),
          },
          {
            label: P("The two lines are the same", "Las dos rectas son iguales"),
            correct: false,
            cue: P(
              `The first graph has a point at height ${fmtY(t, yOf(t, t.xMax))} when the horizontal value is ${fmt(t.xMax)}. Does the second graph reach that height?`,
              `La primera gráfica tiene un punto a la altura ${fmtY(t, yOf(t, t.xMax))} cuando el valor horizontal es ${fmt(t.xMax)}. ¿La segunda gráfica llega a esa altura?`,
            ),
          },
          {
            label: P("The second line goes down", "La segunda recta baja"),
            correct: false,
            cue: P(
              "Follow the second line from left to right. Does it ever get closer to 0?",
              "Sigue la segunda recta de izquierda a derecha. ¿Se acerca alguna vez a 0?",
            ),
          },
        ],
        3,
      ),
      ok: both((l) =>
        l === "en"
          ? `Right. At ${fmt(t.xMax)} the first line is at ${fmtY(t, yOf(t, t.xMax))} and the second is at ${fmtY(t, y2)}. The line with the larger rate changes faster, so it is steeper.`
          : `Correcto. En ${fmt(t.xMax)} la primera recta está en ${fmtY(t, yOf(t, t.xMax))} y la segunda en ${fmtY(t, y2)}. La recta con la tasa mayor cambia más rápido, así que es más inclinada.`,
      ),
    },
    transfer: {
      say: P(
        `One point on the graph is marked: ${pairText(t, pointX, tPoint.y)}. What does it mean?`,
        `En la gráfica hay un punto marcado: ${pairText(t, pointX, tPoint.y)}. ¿Qué significa?`,
      ),
      question: P(
        `What does the point ${pairText(t, pointX, tPoint.y)} mean?`,
        `¿Qué significa el punto ${pairText(t, pointX, tPoint.y)}?`,
      ),
      options: placeCorrect(
        [
          { label: capP(readP(t, pointX, tPoint.y)), correct: true },
          {
            label: capP(readP(t, tPoint.y, pointX)),
            correct: false,
            cue: P(
              "Check the axes. The first number of the pair goes with the horizontal axis. Which quantity is on that axis?",
              "Revisa los ejes. El primer número del par va con el eje horizontal. ¿Cuál cantidad está en ese eje?",
            ),
          },
          ...t.wrongReads.map((w) => ({ label: w.text, correct: false, cue: w.cue })),
        ],
        1,
      ),
      ok: both((l) =>
        l === "en"
          ? `Yes: ${readOut(t, pointX, tPoint.y, "en")}. The first number is on the horizontal axis and the second is on the vertical axis.`
          : `Sí: ${readOut(t, pointX, tPoint.y, "es")}. El primer número está en el eje horizontal y el segundo en el vertical.`,
      ),
      explain: P(
        `Explain: what does the point ${pairText(t, pointX, tPoint.y)} tell you?`,
        `Explica: ¿qué te dice el punto ${pairText(t, pointX, tPoint.y)}?`,
      ),
      frame: P("The point (___, ___) means ___.", "El punto (___, ___) significa ___."),
    },
  };
}
