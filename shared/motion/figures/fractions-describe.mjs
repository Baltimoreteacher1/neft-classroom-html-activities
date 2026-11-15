// The complete text equivalent of the fraction figure, in words (no digits over digits), grade 6.
import { completeWord, fracWords, mixedWords, nounFor, otherA, servingWords, supplyWords, unA, unitFor } from "./fractions-words.mjs";

/** The question the picture asks, as one sentence. @param {import("./fractions-model.mjs").FractionModel} m @param {"en" | "es"} lang */
export function questionText(m, lang) {
  const { ctx } = m;
  const noun = nounFor(ctx, lang, true);
  const serving = servingWords(m.b, m.c, ctx, lang);
  const supply = supplyWords(m.a, ctx, lang);
  return lang === "es" ? `¿Cuánt${ctx.noun.g === "m" ? "os" : "as"} ${noun} de ${serving} caben en ${supply}?` : `How many ${noun} of ${serving} fit in ${supply}?`;
}

/** "how many pieces" / "cuántos trozos". @param {import("./fractions-model.mjs").FractionModel} m @param {"en" | "es"} lang */
export const howMany = (m, lang) => (lang === "es" ? `cuánt${m.ctx.noun.g === "m" ? "os" : "as"} ${nounFor(m.ctx, lang, true)}` : `how many ${nounFor(m.ctx, lang, true)}`);

/** "7 complete pieces and one third of another." as plain words. @param {import("./fractions-model.mjs").FractionModel} m @param {"en" | "es"} lang */
export function resultText(m, lang) {
  const { ctx, complete: n, leftover: f } = m;
  const es = lang === "es";
  const fw = f.n === 0n ? "" : fracWords(Number(f.n), Number(f.d), lang);
  const noun = nounFor(ctx, lang, n !== 1);
  if (f.n === 0n) return es ? `${n} ${noun} ${completeWord(ctx, lang, n !== 1)}, sin sobrante.` : `${n} complete ${noun}, nothing left over.`;
  if (n === 0) return es ? `No cabe ni ${unA(ctx)} ${nounFor(ctx, lang, false)} ${completeWord(ctx, lang, false)}: solo cabe ${fw} de ${unA(ctx)}.` : `Not even 1 complete ${nounFor(ctx, lang, false)}: only ${fw} of one fits.`;
  return es ? `${n} ${noun} ${completeWord(ctx, lang, n !== 1)} y ${fw} de ${otherA(ctx)}.` : `${n} complete ${noun} and ${fw} of another.`;
}

/** @param {import("./fractions-model.mjs").FractionModel} m @param {"en" | "es"} lang */
export function describe(m, lang) {
  const { ctx } = m;
  const es = lang === "es";
  const A = mixedWords(m.a, lang);
  const P = mixedWords(m.parts, lang);
  const Q = mixedWords(m.q, lang);
  const S = fracWords(m.b, m.c, lang);
  const unit = unitFor(ctx, lang, false);
  const partsWord = (/** @type {number} */ n) => (es ? (n === 1 ? "parte" : "partes") : n === 1 ? "part" : "parts");
  const pw = m.parts.d === 1n && m.parts.n === 1n ? partsWord(1) : partsWord(2);
  const out = [];
  if (es) {
    out.push(questionText(m, lang));
    out.push(`Paso 1: dibuja el total, ${supplyWords(m.a, ctx, lang)}, como barras de 1 ${unit}.`);
    out.push(`Paso 2: corta cada barra en ${m.c} partes iguales; cada parte es ${fracWords(1, m.c, lang)} de una barra. ${A} por ${m.c} es igual a ${P} ${pw}.`);
    out.push(`Paso 3: pon ${m.b} ${partsWord(m.b)} en cada ${nounFor(ctx, lang, false)} y cuenta. ${P} dividido entre ${m.b} es igual a ${Q}.`);
    out.push(`Respuesta: ${A} dividido entre ${S} es igual a ${Q}. ${resultText(m, lang)}`);
    out.push(`Comprobación: ${Q} por ${S} es igual a ${mixedWords(m.check, lang)}, el total.`);
    if (m.wrong?.kind === "multiply") out.push(`No es esto: ${A} por ${S} es igual a ${mixedWords(m.wrong.value, lang)}. Multiplicar no cuenta ${howMany(m, lang)} caben.`);
    if (m.wrong?.kind === "flip") out.push(`No es esto: ${S} dividido entre ${A} es igual a ${mixedWords(m.wrong.value, lang)}. Al invertir el orden se compara el tamaño de un grupo con el total.`);
    if (m.wrong?.kind === "leftover") out.push(`No es esto: quedarse en ${m.complete} ${nounFor(ctx, lang, m.complete !== 1)}. La parte sobrante, ${mixedWords(m.wrong.value, lang)} de ${unA(ctx)} ${nounFor(ctx, lang, false)}, también es parte de la respuesta.`);
  } else {
    out.push(questionText(m, lang));
    out.push(`Step 1: draw the supply, ${supplyWords(m.a, ctx, lang)}, as bars of 1 ${unit}.`);
    out.push(`Step 2: cut each bar into ${m.c} equal parts; each part is ${fracWords(1, m.c, lang)} of a bar. ${A} times ${m.c} equals ${P} ${pw}.`);
    out.push(`Step 3: put ${m.b} ${partsWord(m.b)} in each ${nounFor(ctx, lang, false)} and count. ${P} divided by ${m.b} equals ${Q}.`);
    out.push(`Answer: ${A} divided by ${S} equals ${Q}. ${resultText(m, lang)}`);
    out.push(`Check: ${Q} times ${S} equals ${mixedWords(m.check, lang)}, the supply.`);
    if (m.wrong?.kind === "multiply") out.push(`Not this: ${A} times ${S} equals ${mixedWords(m.wrong.value, lang)}. Multiplying does not count ${howMany(m, lang)} fit.`);
    if (m.wrong?.kind === "flip") out.push(`Not this: ${S} divided by ${A} equals ${mixedWords(m.wrong.value, lang)}. Flipping the order compares the size of one group with the supply.`);
    if (m.wrong?.kind === "leftover") out.push(`Not this: stopping at ${m.complete} ${nounFor(ctx, lang, m.complete !== 1)}. The leftover ${mixedWords(m.wrong.value, lang)} of a ${nounFor(ctx, lang, false)} is part of the answer.`);
  }
  return out.join(" ");
}
