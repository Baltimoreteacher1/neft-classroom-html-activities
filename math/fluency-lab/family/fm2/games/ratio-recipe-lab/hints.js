// Hints for Ratio Recipe Lab. Tier 0 nudges, tier 1 names the strategy using only the givens, tier 2 works a PARALLEL example
// whose numbers are chosen to share nothing with this round, tier 3 states the full solution. None of tiers 0-2 prints a
// number the learner has to work out. @fm2 FM-062
import { cmp, div, eq } from "../../rational.js";
import { everyValue, fmtVal, qty, R, valueOf, wordOf } from "./kit.js";
import { answerText, plain } from "./logic.js";

const both = (en, es) => ({ en, es });
const list2 = (round) => round.cols[0];

// Every whole number the round uses (conservative: numerators and denominators too), so a parallel example never repeats one.
function usedNumbers(round) {
  const seen = new Set();
  const add = (r) => {
    seen.add(r.n);
    seen.add(r.d);
    seen.add(Math.round(r.n / r.d));
  };
  for (const v of everyValue(round)) add(v);
  for (const e of round.extra) {
    if (e.kind === "ratio") e.answer.forEach((n) => seen.add(n));
  }
  for (const pair of round.source?.pairs || []) pair.forEach(add);
  for (const col of round.cols) for (const pair of col.source?.pairs || []) pair.forEach(add);
  return seen;
}

function pairPool(round) {
  const cap = round.grade <= 2 ? 20 : round.grade <= 5 ? 100 : 400;
  const out = [];
  for (let p = 2; p <= 19; p += 1) for (let q = 2; q <= 12; q += 1) if (p !== q && p * q <= cap) out.push([p, q]);
  return out;
}
const SEQ_POOL = [
  [3, 4],
  [4, 3],
  [5, 3],
  [2, 6],
  [5, 4],
  [3, 5],
  [4, 5],
  [2, 7],
  [6, 3],
  [7, 3],
  [8, 3],
  [9, 3],
];
const LIMIT_POOL = [
  [7, 5, 3],
  [8, 4, 3],
  [9, 3, 5],
  [6, 6, 4],
  [11, 3, 7],
  [12, 4, 5],
  [13, 3, 8],
  [14, 5, 9],
];

function pickFrom(round, pool, numbersOf) {
  const used = usedNumbers(round);
  const start = [...used].reduce((a, b) => a + b, 0) % pool.length;
  for (let i = 0; i < pool.length; i += 1) {
    const item = pool[(start + i) % pool.length];
    if (numbersOf(item).every((n) => !used.has(n))) return item;
  }
  return null;
}
const pair = (round) => pickFrom(round, pairPool(round), ([p, q]) => [p, q, p * q]);
const seqOf = (p, q) => Array.from({ length: q }, (_, i) => p * (i + 1));
const sequence = (round) => pickFrom(round, SEQ_POOL, ([p, q]) => [p, q, ...seqOf(p, q)]);
const limitPair = (round, exact) =>
  pickFrom(round, LIMIT_POOL, ([p, k, r]) => [p, k, exact ? p * k : r, p * k + (exact ? 0 : r)]);

const num = (round, r) => fmtVal(r, round.style);
const rowOf = (round, key) => round.rows.find((r) => r.key === key);

function extrasNote(round) {
  const bits = { en: "", es: "" };
  for (const e of round.extra) {
    if (e.kind === "ratio") {
      bits.en +=
        " For the simplest form of a ratio, divide both numbers by the same factor until you cannot go further.";
      bits.es +=
        " Para la forma más simple de una razón, divide ambos números entre el mismo factor hasta que ya no puedas.";
    } else if (e.key === "gap") {
      bits.en += " To see how much stronger, subtract the smaller unit rate from the larger one.";
      bits.es += " Para saber cuánto más fuerte, resta la tasa unitaria menor de la mayor.";
    } else if (e.key === "speed") {
      bits.en += " Speed is the miles in a single hour: divide the miles by the hours.";
      bits.es += " La velocidad son las millas de una sola hora: divide las millas entre las horas.";
    } else if (e.key === "k") {
      bits.en += " k is the y of the first pair divided by its x.";
      bits.es += " k es la y del primer par dividida entre su x.";
    }
  }
  return bits;
}

const KINDS = {
  count: {
    0: () =>
      both(
        "Look at one bowl first. How many scoops does it hold? Every bowl holds the same.",
        "Mira primero un tazón. ¿Cuántos cucharones tiene? Todos los tazones tienen lo mismo.",
      ),
    1: () =>
      both(
        "Count the scoops one bowl at a time, or add the same number again for each bowl. Press + until the picture shows the bowls the question names.",
        "Cuenta los cucharones tazón por tazón, o suma el mismo número otra vez por cada tazón. Pulsa + hasta que el dibujo muestre los tazones que nombra la pregunta.",
      ),
    2: (round) => {
      const s = sequence(round);
      return s
        ? both(
            `Pretend example: ${s[1]} bowls with ${s[0]} scoops each. Count by ${s[0]}s: ${seqOf(...s).join(", ")}. The last number is how many scoops in all.`,
            `Ejemplo inventado: ${s[1]} tazones con ${s[0]} cucharones cada uno. Cuenta de ${s[0]} en ${s[0]}: ${seqOf(...s).join(", ")}. El último número es el total de cucharones.`,
          )
        : both(
            "Pretend example: count by the same number once for every bowl. The last number you say is how many in all.",
            "Ejemplo inventado: cuenta de la misma cantidad una vez por cada tazón. El último número que digas es el total.",
          );
    },
  },
  "compare-count": {
    0: () =>
      both(
        "Find how many scoops are in each whole tray before you compare.",
        "Halla cuántos cucharones hay en cada bandeja completa antes de comparar.",
      ),
    1: (round) => {
      const note = round.extra.length
        ? {
            en: " To find how many more, subtract the smaller total from the larger.",
            es: " Para saber cuántos más, resta el total menor del mayor.",
          }
        : { en: "", es: "" };
      return both(
        `For each tray, set its bowls, then count the scoops in every bowl. The tray with the bigger total has more.${note.en}`,
        `En cada bandeja, elige sus tazones y cuenta los cucharones de cada tazón. La bandeja con el total mayor tiene más.${note.es}`,
      );
    },
    2: (round) => {
      const s = sequence(round);
      return s
        ? both(
            `Pretend tray: ${s[1]} bowls with ${s[0]} scoops each: ${seqOf(...s).join(", ")}. Compare the totals, not how many bowls there are.`,
            `Bandeja inventada: ${s[1]} tazones con ${s[0]} cucharones cada uno: ${seqOf(...s).join(", ")}. Compara los totales, no cuántos tazones hay.`,
          )
        : both(
            "Pretend tray: count by the scoops in one bowl once for each bowl. Compare the totals, not how many bowls there are.",
            "Bandeja inventada: cuenta los cucharones de un tazón una vez por cada tazón. Compara los totales, no cuántos tazones hay.",
          );
    },
  },
  scale: {
    0: () =>
      both(
        "Which amount does the question fix? Change the batch until that amount matches, then give every other amount the same batch.",
        "¿Qué cantidad fija la pregunta? Cambia la tanda hasta que esa cantidad coincida y luego aplica la misma tanda a las demás.",
      ),
    1: (round) => {
      const col = list2(round);
      const note = extrasNote(round);
      if (round.cols.length > 1)
        return both(
          `In each column, divide the amount you are given by the amount in a single batch to find the number of batches. Then multiply the other amount by that number.${note.en}`,
          `En cada columna, divide la cantidad que te dan entre la cantidad de una sola tanda para hallar el número de tandas. Luego multiplica la otra cantidad por ese número.${note.es}`,
        );
      const row = rowOf(round, col.pin.key);
      const per = col.per[col.pin.key];
      if (eq(per, R(1)))
        return both(
          `The question tells you how many ${plain(row, "en")}. Set the batch to that number, then multiply each amount in a single batch by it.${note.en}`,
          `La pregunta dice cuántos ${plain(row, "es")} hay. Elige esa tanda y multiplica por ella cada cantidad de una sola tanda.${note.es}`,
        );
      const shrink =
        cmp(col.batch, R(1)) < 0
          ? {
              en: " A batch smaller than a single batch makes every amount smaller.",
              es: " Una tanda menor que una sola tanda hace más pequeña cada cantidad.",
            }
          : { en: "", es: "" };
      return both(
        `Divide the amount you need (${qty(row, col.pin.value, "en", round.style)}) by the amount in a single batch (${qty(row, per, "en", round.style)}) to get the number of batches. Then multiply every other amount in a single batch by that number.${shrink.en}${note.en}`,
        `Divide la cantidad que necesitas (${qty(row, col.pin.value, "es", round.style)}) entre la cantidad de una sola tanda (${qty(row, per, "es", round.style)}) para saber cuántas tandas. Luego multiplica por ese número cada una de las otras cantidades de una sola tanda.${shrink.es}${note.es}`,
      );
    },
    2: (round) => {
      const t = pair(round);
      return t
        ? both(
            `Pretend recipe: a single batch makes ${t[0]} and you need ${t[0] * t[1]}. ${t[0] * t[1]} ÷ ${t[0]} = ${t[1]} batches. Every other amount in that recipe is multiplied by ${t[1]}.`,
            `Receta inventada: una sola tanda da ${t[0]} y necesitas ${t[0] * t[1]}. ${t[0] * t[1]} ÷ ${t[0]} = ${t[1]} tandas. Cada otra cantidad de esa receta se multiplica por ${t[1]}.`,
          )
        : both(
            "Pretend recipe: divide the amount you need by the amount in a single batch, then multiply every other amount by that number.",
            "Receta inventada: divide la cantidad que necesitas entre la de una sola tanda y multiplica cada otra cantidad por ese número.",
          );
    },
  },
  inverse: {
    0: () =>
      both(
        "Think of the answer as how many are in each group. Try a number and check it: groups times the amount in each should match the total.",
        "Piensa en la respuesta como cuántos hay en cada grupo. Prueba un número y compruébalo: grupos por la cantidad en cada uno debe dar el total.",
      ),
    1: (round) => {
      const col = list2(round);
      return both(
        `Equal sharing is division. Split ${num(round, col.pin.value)} into ${num(round, col.per[col.pin.key])} equal groups: ${num(round, col.pin.value)} ÷ ${num(round, col.per[col.pin.key])}. Or ask: what number times ${num(round, col.per[col.pin.key])} makes ${num(round, col.pin.value)}?`,
        `Repartir en partes iguales es dividir. Reparte ${num(round, col.pin.value)} en ${num(round, col.per[col.pin.key])} grupos iguales: ${num(round, col.pin.value)} ÷ ${num(round, col.per[col.pin.key])}. O pregunta: ¿qué número por ${num(round, col.per[col.pin.key])} da ${num(round, col.pin.value)}?`,
      );
    },
    2: (round) => {
      const t = pair(round);
      return t
        ? both(
            `Pretend: ${t[0] * t[1]} shared into ${t[1]} equal groups. ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]} in each group, because ${t[0]} × ${t[1]} = ${t[0] * t[1]}.`,
            `Ejemplo inventado: ${t[0] * t[1]} repartidos en ${t[1]} grupos iguales. ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]} en cada grupo, porque ${t[0]} × ${t[1]} = ${t[0] * t[1]}.`,
          )
        : both(
            "Pretend: split a total into equal groups by dividing, then check by multiplying back.",
            "Ejemplo inventado: reparte un total en grupos iguales dividiendo y comprueba multiplicando.",
          );
    },
  },
  limit: {
    0: () =>
      both(
        "Each ingredient you have puts a limit on the batch. Ask how many batches each one allows.",
        "Cada ingrediente que tienes pone un límite a la tanda. Pregunta cuántas tandas permite cada uno.",
      ),
    1: (round) => {
      const col = list2(round);
      const keys = Object.keys(col.limit.have);
      const sums = keys
        .map((k) => `${num(round, col.limit.have[k])} ÷ ${num(round, col.per[k])}`)
        .join(", ");
      const steps = round.exact
        ? { en: "", es: "" }
        : {
            en: ` Batches go up in steps of ${col.step.n}/${col.step.d}, so count only whole steps.`,
            es: ` Las tandas suben de ${col.step.n}/${col.step.d} en ${col.step.n}/${col.step.d}; cuenta solo pasos completos.`,
          };
      const last =
        keys.length > 1
          ? {
              en: " The smallest answer limits the batch.",
              es: " La respuesta más pequeña limita la tanda.",
            }
          : { en: " That answer limits the batch.", es: " Esa respuesta limita la tanda." };
      return both(
        `For each ingredient you have, divide what you have by what a single batch uses: ${sums}.${steps.en}${last.en}`,
        `Para cada ingrediente que tienes, divide lo que tienes entre lo que usa una sola tanda: ${sums}.${steps.es}${last.es}`,
      );
    },
    2: (round) => {
      const t = limitPair(round, Boolean(round.exact));
      if (!t)
        return both(
          "Pretend: divide what you have by what a single batch uses, and keep only whole batches.",
          "Ejemplo inventado: divide lo que tienes entre lo que usa una sola tanda y quédate con tandas completas.",
        );
      const [p, k, r] = t;
      const more = round.remainder
        ? {
            en: " If batches go up in smaller steps, use the leftover to count extra steps.",
            es: " Si las tandas suben en pasos más pequeños, usa lo que sobra para contar pasos extra.",
          }
        : { en: "", es: "" };
      return round.exact
        ? both(
            `Pretend: you have ${p * k} and a single batch uses ${p}. ${p * k} ÷ ${p} = ${k} batches.`,
            `Ejemplo inventado: tienes ${p * k} y una sola tanda usa ${p}. ${p * k} ÷ ${p} = ${k} tandas.`,
          )
        : both(
            `Pretend: you have ${p * k + r} and a single batch uses ${p}. ${p * k + r} ÷ ${p} is ${k} with ${r} left over, so the biggest whole batch is ${k}.${more.en}`,
            `Ejemplo inventado: tienes ${p * k + r} y una sola tanda usa ${p}. ${p * k + r} ÷ ${p} es ${k} y sobran ${r}, así que la tanda entera más grande es ${k}.${more.es}`,
          );
    },
  },
  unit: {
    0: () =>
      both(
        "A unit rate tells how much for just 1. Scale the batch until the amount you are counting per is exactly 1.",
        "Una tasa unitaria dice cuánto hay por solo 1. Cambia la tanda hasta que la cantidad por la que cuentas sea exactamente 1.",
      ),
    1: (round) => {
      const col = list2(round);
      const ask = rowOf(round, col.ask[0]);
      const pin = rowOf(round, col.pin.key);
      const second =
        round.cols.length > 1
          ? {
              en: " For the second rate, divide the other way around.",
              es: " Para la segunda tasa, divide al revés.",
            }
          : { en: "", es: "" };
      return both(
        `Divide the amounts in the sentence: ${num(round, col.per[ask.key])} ÷ ${num(round, col.per[pin.key])}. The answer is how much ${plain(ask, "en")} goes with each 1 ${wordOf(pin).one.en}.${second.en}`,
        `Divide las cantidades del enunciado: ${num(round, col.per[ask.key])} ÷ ${num(round, col.per[pin.key])}. La respuesta es cuánto ${plain(ask, "es")} corresponde a cada 1 ${wordOf(pin).one.es}.${second.es}`,
      );
    },
    2: (round) => {
      const t = pair(round);
      return t
        ? both(
            `Pretend: ${t[0] * t[1]} in ${t[1]} groups. ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]} for each 1 group.`,
            `Ejemplo inventado: ${t[0] * t[1]} en ${t[1]} grupos. ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]} por cada 1 grupo.`,
          )
        : both(
            "Pretend: to find the amount for each 1, divide the total amount by the number of groups.",
            "Ejemplo inventado: para hallar la cantidad por cada 1, divide la cantidad total entre el número de grupos.",
          );
    },
  },
  compare: {
    0: (round) =>
      round.skillId === "compare-rates"
        ? both(
            "Find each unit rate first: how much y goes with each 1 of x.",
            "Halla primero cada tasa unitaria: cuánto de y corresponde a cada 1 de x.",
          )
        : both(
            "To compare fairly, give both mixes the same amount of the second ingredient: scale each one to exactly 1.",
            "Para comparar con justicia, da a ambas mezclas la misma cantidad del segundo ingrediente: reduce cada una a exactamente 1.",
          ),
    1: (round) => {
      if (round.skillId === "compare-rates")
        return both(
          "In a table, divide y by x for any pair. In an equation y = kx, k is the number multiplying x. On a graph, pick a point on the line and divide its y by its x. Then compare the rates.",
          "En una tabla, divide y entre x en cualquier par. En una ecuación y = kx, k es el número que multiplica a x. En una gráfica, elige un punto de la recta y divide su y entre su x. Luego compara las tasas.",
        );
      const rowA = rowOf(round, "a");
      const rowB = rowOf(round, "b");
      return both(
        `For each mix, divide the ${plain(rowA, "en")} by the ${plain(rowB, "en")} in that mix. The mix with the bigger answer is stronger.`,
        `En cada mezcla, divide ${plain(rowA, "es")} entre ${plain(rowB, "es")} de esa mezcla. La mezcla con el resultado mayor es la más fuerte.`,
      );
    },
    2: (round) => {
      const t = pair(round);
      if (!t)
        return both(
          "Pretend: divide each amount by its second amount to get a rate per 1, then compare the rates.",
          "Ejemplo inventado: divide cada cantidad entre su segunda cantidad para obtener una tasa por 1 y compara las tasas.",
        );
      return round.skillId === "compare-rates"
        ? both(
            `Pretend: the point (${t[1]}, ${t[0] * t[1]}) is on a line. ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]}, so the unit rate is ${t[0]}.`,
            `Ejemplo inventado: el punto (${t[1]}, ${t[0] * t[1]}) está en una recta. ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]}, así que la tasa unitaria es ${t[0]}.`,
          )
        : both(
            `Pretend: ${t[0] * t[1]} with ${t[1]} of water gives ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]} for each 1 of water. Do the same for both mixes, then compare.`,
            `Ejemplo inventado: ${t[0] * t[1]} con ${t[1]} de agua da ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]} por cada 1 de agua. Haz lo mismo con ambas mezclas y compara.`,
          );
    },
  },
  read: {
    0: () =>
      both(
        "The unit rate is how much y goes with each 1 of x.",
        "La tasa unitaria es cuánto de y corresponde a cada 1 de x.",
      ),
    1: (round) => {
      const more =
        round.cols.length > 1
          ? {
              en: " Once you know the rate, multiply it by a new x to find its y.",
              es: " Cuando conozcas la tasa, multiplícala por una x nueva para hallar su y.",
            }
          : { en: "", es: "" };
      return both(
        `Pick any pair from the table, or any point on the line, and divide its y by its x. Try a second pair: you should get the same number.${more.en}`,
        `Elige cualquier par de la tabla, o cualquier punto de la recta, y divide su y entre su x. Prueba con un segundo par: debes obtener el mismo número.${more.es}`,
      );
    },
    2: (round) => {
      const t = pair(round);
      return t
        ? both(
            `Pretend: the pair (${t[1]}, ${t[0] * t[1]}). ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]}, so the unit rate is ${t[0]}.`,
            `Ejemplo inventado: el par (${t[1]}, ${t[0] * t[1]}). ${t[0] * t[1]} ÷ ${t[1]} = ${t[0]}, así que la tasa unitaria es ${t[0]}.`,
          )
        : both(
            "Pretend: divide y by x for a pair to get the unit rate.",
            "Ejemplo inventado: divide y entre x en un par para obtener la tasa unitaria.",
          );
    },
  },
  equation: {
    0: () =>
      both(
        "Put the number you are given in place of the matching letter in the equation.",
        "Pon el número que te dan en lugar de la letra que le corresponde en la ecuación.",
      ),
    1: (round) => {
      const [sx, sy] = round.source.syms;
      return both(
        `In ${sy} = k${sx}, k is the number that multiplies ${sx}. To find ${sy}, multiply k by ${sx}. To find ${sx} when you know ${sy}, divide ${sy} by k.`,
        `En ${sy} = k${sx}, k es el número que multiplica a ${sx}. Para hallar ${sy}, multiplica k por ${sx}. Para hallar ${sx} cuando conoces ${sy}, divide ${sy} entre k.`,
      );
    },
    2: (round) => {
      const t = pair(round);
      return t
        ? both(
            `Pretend: for y = ${t[0]}x, when x = ${t[1]}, y = ${t[0]} × ${t[1]} = ${t[0] * t[1]}. Going backward: if y = ${t[0] * t[1]}, then x = ${t[0] * t[1]} ÷ ${t[0]} = ${t[1]}.`,
            `Ejemplo inventado: en y = ${t[0]}x, si x = ${t[1]}, y = ${t[0]} × ${t[1]} = ${t[0] * t[1]}. Al revés: si y = ${t[0] * t[1]}, entonces x = ${t[0] * t[1]} ÷ ${t[0]} = ${t[1]}.`,
          )
        : both(
            "Pretend: multiply k by x to find y, and divide y by k to find x.",
            "Ejemplo inventado: multiplica k por x para hallar y y divide y entre k para hallar x.",
          );
    },
  },
};

// The full worked solution, one paragraph per column, ending with the answer text.
function solutionText(round, lang) {
  const steps = round.cols.map((col) => {
    const lines = [];
    const prefix = round.cols.length > 1 ? `${col.label[lang]}: ` : "";
    if (col.pin) {
      const per = col.per[col.pin.key];
      lines.push(
        eq(per, R(1))
          ? `${lang === "en" ? "Set the batch to" : "Elige la tanda"} ${num(round, col.batch)}.`
          : `${num(round, col.pin.value)} ÷ ${num(round, per)} = ${num(round, col.batch)}.`,
      );
    } else {
      for (const [key, have] of Object.entries(col.limit.have))
        lines.push(
          `${plain(rowOf(round, key), lang)}: ${num(round, have)} ÷ ${num(round, col.per[key])} = ${num(round, div(have, col.per[key]))}.`,
        );
      lines.push(
        lang === "en"
          ? `Biggest batch: ${num(round, col.batch)}.`
          : `Tanda más grande: ${num(round, col.batch)}.`,
      );
    }
    for (const key of col.ask)
      lines.push(
        `${plain(rowOf(round, key), lang)}: ${num(round, col.per[key])} × ${num(round, col.batch)} = ${num(round, valueOf(col, key))}.`,
      );
    return prefix + lines.join(" ");
  });
  const extra = round.extra.map((e) =>
    e.kind === "ratio" ? `${e.answer[0]}:${e.answer[1]}` : `${e.key} = ${num(round, e.answer)}`,
  );
  const pick = round.pick ? [round.pick.options[round.pick.answer][lang]] : [];
  const tail = [...extra, ...pick].join("; ");
  return `${steps.join(" ")}${tail ? ` ${tail}.` : ""} ${lang === "en" ? "Answer" : "Respuesta"}: ${answerText(round)}`;
}

export function hint(round, tier) {
  if (tier >= 3) return both(solutionText(round, "en"), solutionText(round, "es"));
  const family = KINDS[round.hintKind] || KINDS.scale;
  return family[Math.max(0, Math.min(2, tier))](round);
}
