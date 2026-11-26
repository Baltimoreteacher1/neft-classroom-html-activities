// living/power-stack-model.js — the mathematics of the power-stack play (6-3).
//
// Pure functions only (no DOM): every number the play shows a student is
// computed here, so power-stack.test.mjs can check each one in node.

import { okInt, placeCorrect } from "./mean-balance-model.js";

export { placeCorrect };

export const MAX_POWER = 125; // the longest bar a config may ask for
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** 2 -> "²", 14 -> "¹⁴": the raised exponent as it is printed in the lesson. */
export const sup = (n) =>
  String(n)
    .split("")
    .map((d) => SUP[Number(d)])
    .join("");

/** The most factors a base may grow to on this stage: 6 boxes, bar at most MAX_POWER. */
export function maxExponent(base) {
  let e = 1;
  while (e < 6 && base ** (e + 1) <= MAX_POWER) e++;
  return e;
}

const validPair = (p) => {
  const base = Number(p?.base);
  const exp = Number(p?.exp);
  if (!okInt(base, 2, 5) || !okInt(exp, 2, 4)) return null;
  if (base ** exp > MAX_POWER || maxExponent(base) < 3 || !choiceSet(base, exp)) return null;
  return { base, exp };
};

export function validatePowerStack(cfg) {
  const main = validPair(cfg);
  if (!main) return null;
  const t = validPair(cfg?.transfer);
  const fallback = main.base === 5 ? { base: 3, exp: 2 } : { base: 5, exp: 2 };
  const transfer = t && !(t.base === main.base && t.exp === main.exp) ? t : fallback;
  return { ...main, emax: maxExponent(main.base), transfer };
}

/** Repeated factors: [2, 2, 2]. */
export const factors = (base, exp) => Array.from({ length: exp }, () => base);

/** "2 × 2 × 2" and "2 + 2 + 2". */
export const asProduct = (base, exp) => factors(base, exp).join(" × ");
export const asSum = (base, exp) => factors(base, exp).join(" + ");

/** The running product after k factors: 2, 4, 8. */
export const running = (base, k) => base ** k;

/**
 * Predict/transfer choices: the power plus up to three wrong values, each one a
 * real slip (times for power, base and exponent swapped, adding, one factor too
 * few or too many). Values are distinct and never equal the power.
 */
export function choiceSet(base, exp) {
  const correct = base ** exp;
  const out = [{ kind: "power", value: correct, correct: true }];
  for (const p of [
    { kind: "times", value: base * exp },
    { kind: "swap", value: exp ** base },
    { kind: "plus", value: base + exp },
    { kind: "short", value: base ** (exp - 1) },
    { kind: "long", value: base ** (exp + 1) },
  ]) {
    if (out.length < 4 && !out.some((o) => o.value === p.value)) out.push({ ...p, correct: false });
  }
  return out.length === 4 ? out : null;
}

const pair = (en, es) => ({ en, es });

/** Every sentence the play says, as {en, es} pairs, from a validated config. */
export function powerCopy(v) {
  const { base: b, exp: e, emax, transfer: t } = v;
  const P = b ** e;
  const S = b * e;
  const tP = t.base ** t.exp;
  return {
    kicker: pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: pair("What an exponent counts", "Qué cuenta un exponente"),
    ariaLabel: pair(
      `${b}${sup(e)} drawn as ${e} boxes that each hold ${b}. Multiplying them gives ${P}; adding ${e} copies of ${b} gives only ${S}.`,
      `${b}${sup(e)} dibujado como ${e} cajas que valen ${b} cada una. Al multiplicarlas se obtiene ${P}; al sumar ${e} copias de ${b} solo se obtiene ${S}.`,
    ),
    printSummary: pair(
      `${b}${sup(e)} means ${b} is used as a factor ${e} times: ${asProduct(b, e)} = ${P}. It is not ${b} × ${e} = ${S}, which is ${asSum(b, e)}. Each extra factor multiplies the value by ${b} again.`,
      `${b}${sup(e)} significa que ${b} se usa como factor ${e} veces: ${asProduct(b, e)} = ${P}. No es ${b} × ${e} = ${S}, que es ${asSum(b, e)}. Cada factor extra vuelve a multiplicar el valor por ${b}.`,
    ),
    scene: {
      situate: pair(`What the ${e} counts`, `Qué cuenta el ${e}`),
      predict: pair("Predict", "Predice"),
      build: pair("Multiply it out", "Multiplícalo"),
      connect: pair("Not times", "No es por"),
      change: pair("Change the exponent", "Cambia el exponente"),
      transfer: pair("On your own", "Por tu cuenta"),
    },
    base: pair("base", "base"),
    exponent: pair("exponent", "exponente"),
    mulLabel: pair("multiply", "multiplicar"),
    addLabel: pair("add", "sumar"),
    situateSay: pair(
      `A power is a short way to write repeated multiplication. The big ${b} is the base: the factor. The small raised ${e} is the exponent: it counts how many ${b}s are in the product. Here are ${e} boxes, one for each factor.`,
      `Una potencia es una forma corta de escribir una multiplicación repetida. El ${b} grande es la base: el factor. El ${e} pequeño y elevado es el exponente: cuenta cuántos ${b} hay en el producto. Aquí hay ${e} cajas, una por cada factor.`,
    ),
    predictSay: pair(
      `Look at the ${e} boxes of ${b}. Predict: what is the value of ${b}${sup(e)}?`,
      `Mira las ${e} cajas de ${b}. Predice: ¿cuál es el valor de ${b}${sup(e)}?`,
    ),
    predictQ: pair(`${b}${sup(e)} is equal to…`, `${b}${sup(e)} es igual a…`),
    predictOk: pair(
      `Yes: ${asProduct(b, e)} = ${P}. Next, multiply the boxes out yourself.`,
      `Sí: ${asProduct(b, e)} = ${P}. Ahora multiplica tú las cajas.`,
    ),
    /** A wrong value: names what it IS, then asks a question about the boxes. */
    cue(opt) {
      const x = opt.value;
      return {
        times: pair(
          `${x} is ${b} × ${e}, which is ${e} copies of ${b} added together. The exponent ${e} says how many ${b}s to multiply. How many boxes are on the stage, and what do you get when you multiply their numbers?`,
          `${x} es ${b} × ${e}, que son ${e} copias de ${b} sumadas. El exponente ${e} dice cuántos ${b} hay que multiplicar. ¿Cuántas cajas hay en el escenario y qué obtienes al multiplicar sus números?`,
        ),
        swap: pair(
          `${x} would be ${e}${sup(b)}: ${e} used ${b} times. Which number is the base, the one being repeated, and which is the exponent that counts the boxes?`,
          `${x} sería ${e}${sup(b)}: ${e} usado ${b} veces. ¿Cuál es la base, el número que se repite, y cuál es el exponente que cuenta las cajas?`,
        ),
        plus: pair(
          `${x} is ${b} + ${e}. An exponent does not add the base and the exponent: it counts the ${b}s that are multiplied. How many ${b}s are in the boxes?`,
          `${x} es ${b} + ${e}. Un exponente no suma la base y el exponente: cuenta los ${b} que se multiplican. ¿Cuántos ${b} hay en las cajas?`,
        ),
        short: pair(
          `${x} uses only ${e - 1} ${b}${e - 1 === 1 ? "" : "s"} as factors. Count the boxes on the stage: how many ${b}s are there?`,
          `${x} usa solo ${e - 1} ${b} como factor${e - 1 === 1 ? "" : "es"}. Cuenta las cajas del escenario: ¿cuántos ${b} hay?`,
        ),
        long: pair(
          `${x} uses ${e + 1} factors of ${b}, one too many. Count the boxes on the stage: how many ${b}s are there?`,
          `${x} usa ${e + 1} factores de ${b}, uno de más. Cuenta las cajas del escenario: ¿cuántos ${b} hay?`,
        ),
      }[opt.kind];
    },
    cueFor: (opt, q) => {
      // The transfer scene asks about its own power; rebuild the cue for it.
      const c = powerCopy({ ...v, base: q.base, exp: q.exp, transfer: t });
      return c.cue(opt);
    },
    buildSay: pair(
      `Multiply the boxes one at a time. Each press brings in the next ${b}. The first box is just ${b}.`,
      `Multiplica las cajas de una en una. Cada vez que presionas, entra el siguiente ${b}. La primera caja es solo ${b}.`,
    ),
    buildBtn: (k) =>
      pair(
        k === 0 ? `Start with ${b}` : `Multiply by ${b} (factor ${k + 1} of ${e})`,
        k === 0 ? `Empieza con ${b}` : `Multiplica por ${b} (factor ${k + 1} de ${e})`,
      ),
    startOver: pair("Start over", "Empezar de nuevo"),
    buildStep: (k) => (k === 1 ? `${b}` : `${running(b, k - 1)} × ${b} = ${running(b, k)}`),
    buildDone: pair(
      `All ${e} boxes are multiplied: ${b}${sup(e)} = ${asProduct(b, e)} = ${P}. The exponent counted the boxes; it did not multiply the base.`,
      `Las ${e} cajas están multiplicadas: ${b}${sup(e)} = ${asProduct(b, e)} = ${P}. El exponente contó las cajas; no multiplicó la base.`,
    ),
    connectSay: pair(
      `Same ${b} and same ${e}, two different pictures. Adding ${e} copies of ${b} reaches ${S}. Multiplying ${e} copies of ${b} reaches ${P}.`,
      `Mismo ${b} y mismo ${e}, dos dibujos diferentes. Sumar ${e} copias de ${b} llega a ${S}. Multiplicar ${e} copias de ${b} llega a ${P}.`,
    ),
    connectExpr: `${b}${sup(e)} = ${asProduct(b, e)} = ${P}`,
    connectExpr2: `${b} × ${e} = ${asSum(b, e)} = ${S}`,
    connectDone: pair(
      `${P} and ${S} are not equal, so ${b}${sup(e)} ≠ ${b} × ${e}. A power means repeated multiplication.`,
      `${P} y ${S} no son iguales, así que ${b}${sup(e)} ≠ ${b} × ${e}. Una potencia significa multiplicación repetida.`,
    ),
    changeSay: pair(
      `Keep the base ${b} and change the exponent. Watch the number of boxes, the product bar and the added bar.`,
      `Deja la base ${b} y cambia el exponente. Observa el número de cajas, la barra del producto y la barra de la suma.`,
    ),
    expLabel: pair("Exponent", "Exponente"),
    changeRow: (k) =>
      pair(
        `${b}${sup(k)} = ${asProduct(b, k)} = ${b ** k}   ·   ${b} × ${k} = ${b * k}`,
        `${b}${sup(k)} = ${asProduct(b, k)} = ${b ** k}   ·   ${b} × ${k} = ${b * k}`,
      ),
    changeLesson: pair(
      `Every new box multiplies the value by ${b} again, so the power races ahead of ${b} × the exponent.`,
      `Cada caja nueva vuelve a multiplicar el valor por ${b}, así que la potencia se adelanta mucho a ${b} × el exponente.`,
    ),
    tryMore: (left) =>
      pair(
        left === 1 ? "Try one more exponent." : "Try two more exponents.",
        left === 1 ? "Prueba un exponente más." : "Prueba dos exponentes más.",
      ),
    tryThree: pair(
      "Try at least three different exponents.",
      "Prueba al menos tres exponentes diferentes.",
    ),
    emax,
    transferSay: pair(
      `New power: ${t.base}${sup(t.exp)}. There are ${t.exp} boxes of ${t.base}. Find its value.`,
      `Potencia nueva: ${t.base}${sup(t.exp)}. Hay ${t.exp} cajas de ${t.base}. Halla su valor.`,
    ),
    transferQ: pair(`${t.base}${sup(t.exp)} is equal to…`, `${t.base}${sup(t.exp)} es igual a…`),
    transferOk: pair(
      `Right: ${asProduct(t.base, t.exp)} = ${tP}, not ${t.base} × ${t.exp} = ${t.base * t.exp}.`,
      `Correcto: ${asProduct(t.base, t.exp)} = ${tP}, no ${t.base} × ${t.exp} = ${t.base * t.exp}.`,
    ),
    explainLabel: pair(
      `Explain: why is ${t.base}${sup(t.exp)} not the same as ${t.base} × ${t.exp}?`,
      `Explica: ¿por qué ${t.base}${sup(t.exp)} no es lo mismo que ${t.base} × ${t.exp}?`,
    ),
    explainFrame: pair(
      "The exponent tells me ___, so I multiply ___ by itself ___ times.",
      "El exponente me dice ___, así que multiplico ___ por sí mismo ___ veces.",
    ),
  };
}
