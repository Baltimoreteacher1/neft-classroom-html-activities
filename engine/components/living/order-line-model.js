// living/order-line-model.js — the mathematics and the words of the order-line
// play (Lesson 7-4: compare and order integers: further right is greater).
//
// Pure functions only (no DOM): every number the play shows a student is
// computed here so order-line.test.mjs can check each one in node.

import { num, okInt, pairOf, placeCorrect } from "./numline-model.js";

export { placeCorrect };

export const abs = (x) => Math.abs(x);
const byValue = (p, q) => p.v - q.v;
const byDistance = (p, q) => abs(p.v) - abs(q.v) || p.v - q.v;

/** Item indices from least to greatest value. */
export const valueOrder = (items) =>
  items
    .map((it, i) => ({ v: it.v, i }))
    .sort(byValue)
    .map((x) => x.i);

/** Item indices from closest to 0 to farthest from 0. */
export const distanceOrder = (items) =>
  items
    .map((it, i) => ({ v: it.v, i }))
    .sort(byDistance)
    .map((x) => x.i);

/** The least of the items still in `left` (indices). */
export const leastOf = (items, left) => left.reduce((m, i) => (items[i].v < items[m].v ? i : m));

/** The item closest to 0 among `left`. */
export const closestOf = (items, left) =>
  left.reduce((m, i) => (abs(items[i].v) < abs(items[m].v) ? i : m));

/** A pair a < b < 0 whose digits mislead: the larger digit is the lesser number. */
function validPair(p, min, max) {
  const a = Number(p?.a);
  const b = Number(p?.b);
  if (!okInt(a, min, max) || !okInt(b, min, max) || !(a < b && b < 0)) return null;
  return { a, b };
}

export function validateOrderLine(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const min = Number(cfg.min);
  const max = Number(cfg.max);
  if (!okInt(min, -20, -3) || !okInt(max, 1, 12) || max - min > 18) return null;
  if (!Array.isArray(cfg.items) || cfg.items.length < 4 || cfg.items.length > 6) return null;
  const items = cfg.items.map((it) => ({ v: Number(it?.v), name: pairOf(it?.name, 24) }));
  if (items.some((it) => !it.name || !okInt(it.v, min, max))) return null;
  const vs = items.map((it) => it.v).sort((p, q) => p - q);
  if (vs.some((x, i) => i && x - vs[i - 1] < 2)) return null; // labels must not collide
  const all = items.map((_, i) => i);
  const least = leastOf(items, all);
  // The order-by-distance trap must exist: the nearest to 0 is not the least.
  if (closestOf(items, all) === least) return null;
  const has = (x) => items.some((it) => it.v === x);
  const compare = validPair(cfg.compare, min, max);
  const transfer = validPair(cfg.transfer, min, max);
  if (!compare || !transfer || ![compare.a, compare.b, transfer.a, transfer.b].every(has))
    return null;
  if (compare.a === transfer.a && compare.b === transfer.b) return null;
  return {
    min,
    max,
    items,
    compare,
    transfer,
    story: pairOf(cfg.story, 200),
    labelEvery: okInt(Number(cfg.labelEvery), 1, 5) ? Number(cfg.labelEvery) : 1,
  };
}

/** Predict choices for a < b < 0: the true comparison and two real mistakes. */
export function compareChoices() {
  return [{ kind: "right", correct: true }, { kind: "digits" }, { kind: "farther" }];
}

/** Transfer choices for a < b < 0: one true statement, two false ones. */
export function statementChoices(a, b) {
  return [
    { kind: "true", text: `${num(a)} < ${num(b)}`, correct: true },
    { kind: "digits", text: `${num(a)} > ${num(b)}` },
    { kind: "flipped", text: `${num(b)} < ${num(a)}` },
  ];
}

export const holds = (text) => {
  const m = /^(\S+) ([<>]) (\S+)$/.exec(text);
  if (!m) return null;
  const parse = (s) => Number(s.replace("−", "-"));
  return m[2] === "<" ? parse(m[1]) < parse(m[3]) : parse(m[1]) > parse(m[3]);
};

export function orderCopy(v) {
  const { items, compare: c, transfer: t } = v;
  const both = (en, es) => ({ en, es });
  const all = items.map((_, i) => i);
  const vOrder = valueOrder(items);
  const dOrder = distanceOrder(items);
  const least = items[leastOf(items, all)];
  const close = items[closestOf(items, all)];
  const chain = vOrder.map((i) => num(items[i].v)).join(" < ");
  const named = items.map((it) => `${it.name.en} ${num(it.v)}`).join(", ");
  const namedEs = items.map((it) => `${it.name.es} ${num(it.v)}`).join(", ");
  const dChain = dOrder.map((i) => num(items[i].v)).join(", ");
  const story = v.story || {
    en: "Depths below sea level are negative. Heights above it are positive.",
    es: "Las profundidades bajo el nivel del mar son negativas. Las alturas sobre él son positivas.",
  };
  return {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: both("Left is less, right is greater", "A la izquierda es menor, a la derecha es mayor"),
    ariaLabel: both(
      `A horizontal number line from ${num(v.min)} to ${v.max} with ${items.length} points. Numbers get greater to the right and less to the left. From least to greatest: ${chain}.`,
      `Una recta numérica horizontal de ${num(v.min)} a ${v.max} con ${items.length} puntos. Los números son mayores hacia la derecha y menores hacia la izquierda. De menor a mayor: ${chain}.`,
    ),
    printSummary: both(
      `On a number line the number farther to the right is greater. ${num(c.a)} < ${num(c.b)} because ${num(c.a)} is farther left. Least to greatest: ${chain}. The number closest to 0 (${num(close.v)}) is not the least; the least is ${num(least.v)}. ${num(t.a)} < ${num(t.b)}.`,
      `En una recta numérica, el número más a la derecha es mayor. ${num(c.a)} < ${num(c.b)} porque ${num(c.a)} está más a la izquierda. De menor a mayor: ${chain}. El número más cercano al 0 (${num(close.v)}) no es el menor; el menor es ${num(least.v)}. ${num(t.a)} < ${num(t.b)}.`,
    ),
    scene: {
      situate: both("The treasures", "Los tesoros"),
      predict: both("Predict", "Predice"),
      order: both("Put them in order", "Ponlos en orden"),
      chain: both("Write it", "Escríbelo"),
      trap: both("Value or distance?", "¿Valor o distancia?"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    chain,
    dChain,
    items,
    situateSay: both(
      `${story.en} ${items.length} treasures: ${named}.`,
      `${story.es} ${items.length} tesoros: ${namedEs}.`,
    ),
    predictSay: both(
      `Compare two treasures, ${num(c.a)} and ${num(c.b)}. Which number is greater?`,
      `Compara dos tesoros, ${num(c.a)} y ${num(c.b)}. ¿Cuál número es mayor?`,
    ),
    predictQ: both(
      `Which is greater, ${num(c.a)} or ${num(c.b)}?`,
      `¿Cuál es mayor, ${num(c.a)} o ${num(c.b)}?`,
    ),
    predictLabel: (kind) =>
      ({
        right: both(`${num(c.b)} is greater`, `${num(c.b)} es mayor`),
        digits: both(
          `${num(c.a)} is greater, because ${abs(c.a)} is more than ${abs(c.b)}`,
          `${num(c.a)} es mayor, porque ${abs(c.a)} es más que ${abs(c.b)}`,
        ),
        farther: both(
          `${num(c.a)} is greater, because it is farther from 0`,
          `${num(c.a)} es mayor, porque está más lejos del 0`,
        ),
      })[kind],
    predictCue: (kind) =>
      ({
        digits: both(
          `${abs(c.a)} is more than ${abs(c.b)}, but ${num(c.a)} is ${abs(c.a)} steps to the LEFT of 0. Look at the two dots: which one is farther to the right?`,
          `${abs(c.a)} es más que ${abs(c.b)}, pero ${num(c.a)} está ${abs(c.a)} pasos a la IZQUIERDA del 0. Mira los dos puntos: ¿cuál está más a la derecha?`,
        ),
        farther: both(
          `Farther from 0 means a bigger distance, not a bigger number. On a number line, greater means farther to the right. Which of the two dots is farther right?`,
          `Estar más lejos del 0 significa una distancia mayor, no un número mayor. En la recta numérica, mayor significa más a la derecha. ¿Cuál de los dos puntos está más a la derecha?`,
        ),
      })[kind],
    predictOk: both(
      `Yes: ${num(c.b)} is farther to the right, so ${num(c.b)} is greater and ${num(c.a)} < ${num(c.b)}. The open side of < points to the greater number.`,
      `Sí: ${num(c.b)} está más a la derecha, así que ${num(c.b)} es mayor y ${num(c.a)} < ${num(c.b)}. El lado abierto de < apunta al número mayor.`,
    ),
    orderSay: both(
      `Put all ${items.length} treasures in order from least to greatest. Each time, tap the least number that is left.`,
      `Pon los ${items.length} tesoros en orden de menor a mayor. Cada vez, toca el número menor que queda.`,
    ),
    orderQ: (done) => ({
      en: `Tap the least number that is left (${done + 1} of ${items.length}).`,
      es: `Toca el número menor que queda (${done + 1} de ${items.length}).`,
    }),
    orderBtn: (i) => both(num(items[i].v), num(items[i].v)),
    orderCue(picked, left) {
      const p = items[picked].v;
      return closestOf(items, left) === picked
        ? both(
            `${num(p)} is the closest to 0, but closest to 0 is not the same as least. Least means farthest LEFT. Is there a dot farther left than ${num(p)}?`,
            `${num(p)} es el más cercano al 0, pero más cerca del 0 no es lo mismo que menor. Menor es lo más a la IZQUIERDA. ¿Hay un punto más a la izquierda que ${num(p)}?`,
          )
        : both(
            `Look at the dot for ${num(p)}. Is there a dot farther to the left? Least means farthest left.`,
            `Mira el punto de ${num(p)}. ¿Hay un punto más a la izquierda? Menor es lo más a la izquierda.`,
          );
    },
    orderStep: (i) => ({
      en: `${num(items[i].v)} is the farthest left of the ones that are left, so it goes next.`,
      es: `${num(items[i].v)} es el que está más a la izquierda de los que quedan, así que va después.`,
    }),
    orderOk: both(
      `All in order, least to greatest: ${chain}. Each number is farther right than the one before it.`,
      `Todos en orden, de menor a mayor: ${chain}. Cada número está más a la derecha que el anterior.`,
    ),
    chainSay: both(
      `Read it from left to right: each number is less than the next. The open side of < points to the greater number. ${num(items[vOrder[0]].v)} < ${num(items[vOrder[1]].v)} says the first is farther left.`,
      `Léelo de izquierda a derecha: cada número es menor que el siguiente. El lado abierto de < apunta al número mayor. ${num(items[vOrder[0]].v)} < ${num(items[vOrder[1]].v)} dice que el primero está más a la izquierda.`,
    ),
    chainFb: both(
      `Least is ${num(least.v)}, greatest is ${num(items[vOrder[vOrder.length - 1]].v)}. Left is less, right is greater, always, even when the numbers are negative.`,
      `El menor es ${num(least.v)} y el mayor es ${num(items[vOrder[vOrder.length - 1]].v)}. A la izquierda es menor, a la derecha es mayor, siempre, incluso cuando los números son negativos.`,
    ),
    trapSay: both(
      `Now order the same treasures by distance from 0 instead. Does it match?`,
      `Ahora ordena los mismos tesoros por su distancia al 0. ¿Coincide?`,
    ),
    trapBtn: both("Order by distance from 0", "Ordenar por distancia al 0"),
    trapBack: both("Order by value", "Ordenar por valor"),
    capValue: both("least → greatest", "menor → mayor"),
    capDist: both("closest to 0 → farthest from 0", "más cerca del 0 → más lejos del 0"),
    trapQ: both(
      `Is the number closest to 0 always the least?`,
      `¿El número más cercano al 0 siempre es el menor?`,
    ),
    trapOpts: {
      no: both(
        `No: ${num(close.v)} is closest to 0, but ${num(least.v)} is the least`,
        `No: ${num(close.v)} es el más cercano al 0, pero ${num(least.v)} es el menor`,
      ),
      near: both("Yes: closer to 0 means less", "Sí: más cerca del 0 significa menor"),
      digit: both(
        `Yes: ${abs(close.v)} is a smaller digit than ${abs(least.v)}`,
        `Sí: ${abs(close.v)} es un dígito menor que ${abs(least.v)}`,
      ),
    },
    trapCue: {
      near: both(
        `Check the line: ${num(close.v)} is closest to 0. Is it the dot farthest left? Distance from 0 and position left or right are two different questions.`,
        `Revisa la recta: ${num(close.v)} es el más cercano al 0. ¿Es el punto más a la izquierda? La distancia al 0 y la posición a izquierda o derecha son dos preguntas distintas.`,
      ),
      digit: both(
        `${abs(close.v)} is a smaller digit than ${abs(least.v)}, but ${num(close.v)} is not farther left than ${num(least.v)}. Which dot is farther left?`,
        `${abs(close.v)} es un dígito menor que ${abs(least.v)}, pero ${num(close.v)} no está más a la izquierda que ${num(least.v)}. ¿Cuál punto está más a la izquierda?`,
      ),
    },
    trapOk: both(
      `Right: the two orders do not match. By distance: ${dChain}. By value: ${chain}. For negative numbers, farther from 0 means LESS, so always use left and right to compare.`,
      `Correcto: los dos órdenes no coinciden. Por distancia: ${dChain}. Por valor: ${chain}. Con números negativos, más lejos del 0 significa MENOR, así que siempre usa izquierda y derecha para comparar.`,
    ),
    transferSay: both(
      `Last one: compare ${num(t.a)} and ${num(t.b)}. Which statement is true?`,
      `La última: compara ${num(t.a)} y ${num(t.b)}. ¿Qué enunciado es verdadero?`,
    ),
    transferQ: both("Which statement is true?", "¿Qué enunciado es verdadero?"),
    transferCue: (kind) =>
      ({
        digits: both(
          `${abs(t.a)} is more than ${abs(t.b)}, but these are negative numbers. Which dot is farther right, ${num(t.a)} or ${num(t.b)}?`,
          `${abs(t.a)} es más que ${abs(t.b)}, pero estos son números negativos. ¿Cuál punto está más a la derecha, ${num(t.a)} o ${num(t.b)}?`,
        ),
        flipped: both(
          `${num(t.b)} < ${num(t.a)} says ${num(t.b)} is the lesser one. Which dot is farther left, and so lesser?`,
          `${num(t.b)} < ${num(t.a)} dice que ${num(t.b)} es el menor. ¿Cuál punto está más a la izquierda y por tanto es el menor?`,
        ),
      })[kind],
    transferOk: both(
      `Yes: ${num(t.a)} is farther left than ${num(t.b)}, so ${num(t.a)} < ${num(t.b)}.`,
      `Sí: ${num(t.a)} está más a la izquierda que ${num(t.b)}, así que ${num(t.a)} < ${num(t.b)}.`,
    ),
    explainLabel: both(
      `Explain: how do you know ${num(t.a)} is less than ${num(t.b)}?`,
      `Explica: ¿cómo sabes que ${num(t.a)} es menor que ${num(t.b)}?`,
    ),
    explainFrame: both(
      `${num(t.a)} is less than ${num(t.b)} because it is farther ___ on the number line.`,
      `${num(t.a)} es menor que ${num(t.b)} porque está más ___ en la recta numérica.`,
    ),
  };
}
