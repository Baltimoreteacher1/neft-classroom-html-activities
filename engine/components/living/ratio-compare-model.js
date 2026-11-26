// living/ratio-compare-model.js — the numbers and words of the ratio-compare
// play (lesson 3-5, Compare Ratio Relationships), with no DOM. Validation, the
// common-term arithmetic (least common multiple, scale factors, matched
// amounts), the choice sets and every bilingual line the play speaks are
// computed here from a validated config.
//
// The idea: two ratios cannot be compared while their second amounts differ.
// Scale BOTH ratios (multiplying both numbers) until that amount is the same;
// then the first amounts can be compared directly. Cocoa 3 : 5 and 4 : 7 both
// reach 35 ounces of milk: 21 against 20.

import { cleanText, okInt, placeCorrect } from "./ratio-parts-model.js";

export { okInt, placeCorrect };

export const W = 480;
export const H = 236;
export const MAX_REPEAT = 10; // batches of one ratio that fit on the stage
export const MAX_COMMON = 40;

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{ name: Pair, a: number, b: number }} Mix
 * @typedef {{ first: Mix, second: Mix, labelA: Pair, labelB: Pair, theA: Pair, theB: Pair, tagA: Pair, tagB: Pair,
 *   moneyA: boolean, goal: "more" | "less", question: Pair, verdict: Pair, story: Pair }} CompareCore
 * @typedef {CompareCore & { transfer: CompareCore }} CompareConfig
 */

const cap = (/** @type {string} */ x) => x.charAt(0).toUpperCase() + x.slice(1);
const gcd = (x, y) => (y ? gcd(y, x % y) : x);
export const lcm = (x, y) => (x / gcd(x, y)) * y;

/** @param {unknown} v @param {number} max @returns {Pair | null} */
function optText(v, max) {
  if (v == null || v === "") return { en: "", es: "" };
  return cleanText(v, max);
}

/** @param {any} m @returns {Mix | null} */
function mixOf(m) {
  const name = cleanText(m?.name, 16);
  const a = Number(m?.a);
  const b = Number(m?.b);
  return name && okInt(a, 1, 12) && okInt(b, 1, 12) ? { name, a, b } : null;
}

/** The matched second amount, the scale factors and the matched first amounts. */
export function commonTerm(first, second) {
  const L = lcm(first.b, second.b);
  const fF = L / first.b;
  const fS = L / second.b;
  return { L, fF, fS, mF: first.a * fF, mS: second.a * fS };
}

/**
 * @param {any} t
 * @returns {CompareCore | null}
 */
function core(t) {
  if (!t || typeof t !== "object") return null;
  const first = mixOf(t.first);
  const second = mixOf(t.second);
  const labelA = cleanText(t.labelA, 12);
  const labelB = cleanText(t.labelB, 12);
  const theA = cleanText(t.theA, 16);
  const theB = cleanText(t.theB, 16);
  const moneyA = t.moneyA === true;
  const tagA = moneyA ? { en: "", es: "" } : cleanText(t.tagA, 18);
  const tagB = optText(t.tagB, 18);
  const question = cleanText(t.question, 80);
  const verdict = cleanText(t.verdict, 100);
  const story = cleanText(t.story, 160);
  if (
    !first ||
    !second ||
    !labelA ||
    !labelB ||
    !theA ||
    !theB ||
    !tagA ||
    !tagB ||
    !question ||
    !verdict ||
    !story
  )
    return null;
  if (!tagA.en && !moneyA) return null;
  if (!verdict.en.includes("{name}") || !verdict.es.includes("{name}")) return null;
  if (t.goal !== "more" && t.goal !== "less") return null;
  if (first.name.en === second.name.en) return null;
  // Equal second amounts need no scaling; equivalent ratios have nothing to compare.
  if (first.b === second.b || first.a * second.b === second.a * first.b) return null;
  const c = commonTerm(first, second);
  if (c.L > MAX_COMMON || c.fF > MAX_REPEAT || c.fS > MAX_REPEAT) return null;
  if (c.mF > 99 || c.mS > 99) return null;
  return {
    first,
    second,
    labelA,
    labelB,
    theA,
    theB,
    tagA,
    tagB,
    moneyA,
    goal: t.goal,
    question,
    verdict,
    story,
  };
}

/**
 * @param {any} cfg
 * @returns {CompareConfig | null}
 */
export function validateRatioCompare(cfg) {
  const main = core(cfg);
  const transfer = core(cfg?.transfer);
  return main && transfer ? { ...main, transfer } : null;
}

/** The winner of a comparison at the matched amount: "first" or "second". */
export function winnerOf(core) {
  const { mF, mS } = commonTerm(core.first, core.second);
  const firstBigger = mF > mS;
  return (core.goal === "more") === firstBigger ? "first" : "second";
}

/** @param {CompareCore} s @param {number} n @param {"A" | "B"} side @param {"en" | "es"} l */
export function qty(s, n, side, l) {
  if (side === "A") return s.moneyA ? `$${n}` : `${n} ${s.tagA[l]}`;
  return `${n} ${s.tagB[l]}`.trim();
}

/**
 * Prediction choices: the right deal, the other deal, "they are the same".
 * @param {CompareCore} s
 */
export function whichChoices(s) {
  const win = winnerOf(s);
  const lose = win === "first" ? "second" : "first";
  return [
    { key: win, correct: true, kind: "right" },
    { key: lose, correct: false, kind: "other" },
    { key: "same", correct: false, kind: "same" },
  ];
}

/**
 * Transfer choices: the second mix's first amount once its second amount is matched.
 * @param {CompareCore} s
 */
export function matchedChoices(s) {
  const { L, mF, mS } = commonTerm(s.first, s.second);
  const raw = [
    { n: mS, correct: true, kind: "right" },
    { n: s.second.a + (L - s.second.b), correct: false, kind: "additive" },
    { n: mF, correct: false, kind: "otherSide" },
    { n: s.second.a, correct: false, kind: "unscaled" },
  ];
  const seen = new Set();
  return raw.filter((o) => o.n > 0 && !seen.has(o.n) && seen.add(o.n));
}

const fill = (/** @type {string} */ tpl, /** @type {string} */ name) => tpl.replace("{name}", name);

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {CompareConfig} v
 */
export function ratioCompareCopy(v) {
  /** @param {(l: "en" | "es") => string} f */
  const bi = (f) => ({ en: f("en"), es: f("es") });
  const sets = { m: v, t: v.transfer };
  /** @param {"m" | "t"} k */
  const pieces = (k) => {
    const s = sets[k];
    const c = commonTerm(s.first, s.second);
    const win = winnerOf(s);
    const winner = win === "first" ? s.first : s.second;
    const loser = win === "first" ? s.second : s.first;
    const wM = win === "first" ? c.mF : c.mS;
    const lM = win === "first" ? c.mS : c.mF;
    const rel = s.goal === "more" ? ">" : "<";
    return { s, c, winner, loser, wM, lM, rel };
  };
  const p = pieces("m");
  const q = pieces("t");
  const { s, c } = p;
  const mix = (/** @type {Mix} */ m) => `${m.a}\u00a0:\u00a0${m.b}`;
  return {
    p,
    q,
    title: bi((l) =>
      l === "en"
        ? `Compare ${mix(s.first)} and ${mix(s.second)}: match ${s.theB.en}`
        : `Compara ${mix(s.first)} y ${mix(s.second)}: iguala ${s.theB.es}`,
    ),
    ariaLabel: bi((l) =>
      l === "en"
        ? `Two bars per mix: ${s.labelB.en} on top, ${s.labelA.en} below, built from equal batches. ${s.first.name.en} makes ${mix(s.first)} and ${s.second.name.en} makes ${mix(s.second)}. Both reach ${qty(s, c.L, "B", "en")}, and then ${s.theA.en} amounts are compared.`
        : `Dos barras por mezcla: ${s.theB.es} arriba y ${s.theA.es} abajo, hechas con tandas iguales. ${s.first.name.es} hace ${mix(s.first)} y ${s.second.name.es} hace ${mix(s.second)}. Las dos llegan a ${qty(s, c.L, "B", "es")} y entonces se comparan las cantidades de ${s.labelA.es}.`,
    ),
    printSummary: bi((l) =>
      l === "en"
        ? `${s.story.en} The ${s.labelB.en} amounts differ (${s.first.b} and ${s.second.b}), so scale both ratios to ${qty(s, c.L, "B", "en")}: ${s.first.name.en} ${mix(s.first)} = ${c.mF} : ${c.L} and ${s.second.name.en} ${mix(s.second)} = ${c.mS} : ${c.L}. With ${s.theB.en} equal, ${qty(s, p.wM, "A", "en")} ${p.rel} ${qty(s, p.lM, "A", "en")}: ${fill(s.verdict.en, p.winner.name.en)}.`
        : `${s.story.es} Las cantidades de ${s.labelB.es} son distintas (${s.first.b} y ${s.second.b}), así que escala las dos razones hasta ${qty(s, c.L, "B", "es")}: ${s.first.name.es} ${mix(s.first)} = ${c.mF} : ${c.L} y ${s.second.name.es} ${mix(s.second)} = ${c.mS} : ${c.L}. Con ${s.theB.es} igual, ${qty(s, p.wM, "A", "es")} ${p.rel} ${qty(s, p.lM, "A", "es")}: ${fill(s.verdict.es, p.winner.name.es)}.`,
    ),
    situate: bi((l) =>
      l === "en"
        ? `${s.story.en} One batch each: ${s.first.name.en} ${mix(s.first)}, ${s.second.name.en} ${mix(s.second)}. The ${s.labelB.en} bars are not the same length.`
        : `${s.story.es} Una tanda cada uno: ${s.first.name.es} ${mix(s.first)}, ${s.second.name.es} ${mix(s.second)}. Las barras de ${s.labelB.es} no tienen la misma longitud.`,
    ),
    predict: {
      say: bi((l) =>
        l === "en"
          ? `${s.question.en} Predict before you build.`
          : `${s.question.es} Predice antes de construir.`,
      ),
      cues: {
        other: bi((l) =>
          l === "en"
            ? `The two ${s.labelB.en} amounts are different. Look at the dashed line: can ${s.theA.en} be compared fairly yet?`
            : `Las dos cantidades de ${s.labelB.es} son distintas. Mira la línea de puntos: ¿ya se puede comparar ${s.theA.es} de forma justa?`,
        ),
        same: bi((l) =>
          l === "en"
            ? `First compare ${s.theB.en} bars: are they the same length? What would have to match before ${s.theA.en} can say anything?`
            : `Primero compara las barras de ${s.labelB.es}: ¿tienen la misma longitud? ¿Qué tendría que igualarse antes de que ${s.theA.es} diga algo?`,
        ),
      },
      ok: bi((l) =>
        l === "en"
          ? `Yes. Now see why: build both mixes until ${s.theB.en} matches.`
          : `Sí. Ahora mira por qué: construye las dos mezclas hasta que ${s.theB.es} coincida.`,
      ),
    },
    match: {
      say: bi((l) =>
        l === "en"
          ? `Add batches with the sliders until both ${s.labelB.en} bars end at the same mark. Every batch adds ${s.first.a} : ${s.first.b} to ${s.first.name.en}, or ${s.second.a} : ${s.second.b} to ${s.second.name.en}.`
          : `Agrega tandas con los controles hasta que las dos barras de ${s.labelB.es} terminen en la misma marca. Cada tanda suma ${s.first.a} : ${s.first.b} a ${s.first.name.es}, o ${s.second.a} : ${s.second.b} a ${s.second.name.es}.`,
      ),
      sliderLabel: (/** @type {"first" | "second"} */ k) => ({
        en: `${s[k].name.en} batches`,
        es: `Tandas de ${s[k].name.es}`,
      }),
      status: (/** @type {number} */ nF, /** @type {number} */ nS) =>
        bi((l) =>
          l === "en"
            ? `${s.first.name.en}: ${qty(s, nF * s.first.b, "B", "en")}. ${s.second.name.en}: ${qty(s, nS * s.second.b, "B", "en")}. The ${s.labelB.en} is not equal yet.`
            : `${s.first.name.es}: ${qty(s, nF * s.first.b, "B", "es")}. ${s.second.name.es}: ${qty(s, nS * s.second.b, "B", "es")}. ${cap(s.theB.es)} aún no es igual.`,
        ),
      done: bi((l) =>
        l === "en"
          ? `Matched at ${qty(s, c.L, "B", "en")}: ${s.first.name.en} made ${c.fF} batches (× ${c.fF} on both numbers) and ${s.second.name.en} made ${c.fS} (× ${c.fS}).`
          : `Igualado en ${qty(s, c.L, "B", "es")}: ${s.first.name.es} hizo ${c.fF} tandas (× ${c.fF} en los dos números) y ${s.second.name.es} hizo ${c.fS} (× ${c.fS}).`,
      ),
    },
    compare: {
      say: bi((l) =>
        l === "en"
          ? `Same ${s.labelB.en}, so now ${s.theA.en} can be compared: ${qty(s, p.wM, "A", "en")} ${p.rel} ${qty(s, p.lM, "A", "en")}. ${fill(s.verdict.en, p.winner.name.en)}.`
          : `Con ${s.theB.es} igual, ya se puede comparar ${s.theA.es}: ${qty(s, p.wM, "A", "es")} ${p.rel} ${qty(s, p.lM, "A", "es")}. ${fill(s.verdict.es, p.winner.name.es)}.`,
      ),
      rows: bi(() => `${mix(s.first)} = ${c.mF} : ${c.L} · ${mix(s.second)} = ${c.mS} : ${c.L}`),
    },
    transfer: {
      say: bi((l) =>
        l === "en"
          ? `${q.s.story.en} Match ${q.s.theB.en} at ${qty(q.s, q.c.L, "B", "en")}, then compare.`
          : `${q.s.story.es} Iguala ${q.s.theB.es} en ${qty(q.s, q.c.L, "B", "es")} y luego compara.`,
      ),
      question: bi((l) =>
        l === "en"
          ? `${q.s.second.name.en}: for ${qty(q.s, q.c.L, "B", "en")}, ${q.s.theA.en} is`
          : `${q.s.second.name.es}: para ${qty(q.s, q.c.L, "B", "es")}, ${q.s.theA.es} es`,
      ),
      cues: {
        additive: bi((l) =>
          l === "en"
            ? `That adds to both numbers. Look at what ${q.s.theB.en} was multiplied by: was ${q.s.theA.en} multiplied the same way?`
            : `Eso suma a los dos números. Mira por qué se multiplicó ${q.s.theB.es}: ¿se multiplicó igual ${q.s.theA.es}?`,
        ),
        otherSide: bi((l) =>
          l === "en"
            ? `That belongs to ${q.s.first.name.en}. Which mix is this question about?`
            : `Eso es de ${q.s.first.name.es}. ¿De qué mezcla trata esta pregunta?`,
        ),
        unscaled: bi((l) =>
          l === "en"
            ? `That is only one batch of ${q.s.second.name.en}. Scale it to match ${q.s.theB.en}.`
            : `Eso es solo una tanda de ${q.s.second.name.es}. Escálala para igualar ${q.s.theB.es}.`,
        ),
      },
      ok: bi((l) =>
        l === "en"
          ? `Yes: × ${q.c.fS} on both numbers makes ${mix(q.s.second)} = ${q.c.mS} : ${q.c.L}. Now ${qty(q.s, q.wM, "A", "en")} ${q.rel} ${qty(q.s, q.lM, "A", "en")}: ${fill(q.s.verdict.en, q.winner.name.en)}.`
          : `Sí: × ${q.c.fS} en los dos números da ${mix(q.s.second)} = ${q.c.mS} : ${q.c.L}. Ahora ${qty(q.s, q.wM, "A", "es")} ${q.rel} ${qty(q.s, q.lM, "A", "es")}: ${fill(q.s.verdict.es, q.winner.name.es)}.`,
      ),
      explain: bi((l) =>
        l === "en"
          ? "Explain: how do you compare two ratios fairly?"
          : "Explica: ¿cómo comparas dos razones de forma justa?",
      ),
      frame: bi((l) =>
        l === "en"
          ? "I make the ___ match by multiplying both numbers by ___. Then I compare the ___."
          : "Igualo ___ multiplicando los dos números por ___. Luego comparo ___.",
      ),
    },
  };
}
