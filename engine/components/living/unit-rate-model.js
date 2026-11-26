// living/unit-rate-model.js — the numbers and words of the unit-rate play
// (lessons 3-2 and 3-8), with no DOM. Money and quantities are held in
// HUNDREDTHS (integers), so $3 for 5 games is 300 / 5 = 60 hundredths, never a
// floating-point 0.6000000000000001. Validation, the double-number-line tick
// sets, the prediction and comparison choice sets and every bilingual line the
// play speaks are computed here from a validated config.
//
// The idea: a rate compares two different units ($ and games, miles and hours).
// Dividing BOTH numbers by the same amount gives the rate "per 1" — the unit
// rate — and with it any amount can be found by multiplying, and two deals of
// different sizes can be compared fairly.

import { cleanText, okInt, placeAway, placeCorrect } from "./ratio-parts-model.js";

export { okInt, placeAway, placeCorrect };

export const W = 480;
export const H = 272;
export const MAX_SLOTS = 9;

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{ total: number, units: number, totalH: number, rateH: number, money: boolean,
 *   totalWord: Pair, totalLabel: Pair, unitOne: Pair, unitMany: Pair, story: Pair, stops: number[],
 *   ticks: number[] }} Deal
 * @typedef {{ name: Pair, total: number, units: number, totalH: number, rateH: number }} Rival
 * @typedef {Deal & { nameA: Pair, compare: Rival | null, transfer: Deal }} UnitRateConfig
 */

/** Hundredths of a value with at most two decimals, else null. */
function hundredths(x) {
  const n = Number(x);
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) return null;
  const h = Math.round(n * 100);
  return Math.abs(n * 100 - h) < 1e-6 ? h : null;
}

/**
 * One deal: `total` of the second quantity for `units` of the first.
 * @param {any} t
 * @returns {Deal | null}
 */
function dealOf(t) {
  if (!t || typeof t !== "object") return null;
  const units = Number(t.units);
  const totalH = hundredths(t.total);
  if (!okInt(units, 2, 1000) || totalH == null || totalH % units !== 0) return null;
  const money = t.money === true;
  const totalWord = money ? { en: "dollars", es: "dólares" } : cleanText(t.totalWord, 14);
  const totalLabel = cleanText(t.totalLabel, 12);
  const unitOne = cleanText(t.unitOne, 12);
  const unitMany = cleanText(t.unitMany, 12);
  const story = cleanText(t.story, 160);
  if (!totalWord || !totalLabel || !unitOne || !unitMany || !story) return null;
  // Quantities the student can try: always 1 and the deal itself; small deals show every whole step.
  let stops;
  if (t.stops == null)
    stops = units <= 8 ? Array.from({ length: units }, (_, i) => i + 1) : [1, units];
  else if (Array.isArray(t.stops) && t.stops.every((s) => okInt(s, 1, 100000)))
    stops = [...new Set([1, units, ...t.stops])].sort((p, q) => p - q);
  else return null;
  const ticks = [0, ...stops];
  // Consecutive 0..n is drawn to scale; anything else is drawn with a break, capped for room.
  if (ticks.length > MAX_SLOTS) return null;
  if (ticks.some((v, i) => i && v * (totalH / units) > 1e9)) return null;
  return {
    total: totalH / 100,
    units,
    totalH,
    rateH: totalH / units,
    money,
    totalWord,
    totalLabel,
    unitOne,
    unitMany,
    story,
    stops,
    ticks,
  };
}

/**
 * @param {any} cfg
 * @returns {UnitRateConfig | null}
 */
export function validateUnitRate(cfg) {
  const main = dealOf(cfg);
  const transfer = dealOf(cfg?.transfer);
  if (!main || !transfer) return null;
  if (transfer.total === main.total && transfer.units === main.units) return null;
  const nameA = cleanText(cfg.nameA, 20) ?? { en: "Deal A", es: "Oferta A" };
  /** @type {Rival | null} */
  let compare = null;
  if (cfg.compare != null) {
    const c = cfg.compare;
    const name = cleanText(c?.name, 20);
    const units = Number(c?.units);
    const totalH = hundredths(c?.total);
    // A comparison needs a price per item, whole cents, and a deal that differs from the first.
    if (!main.money || !name || !okInt(units, 2, 1000) || totalH == null || totalH % units !== 0)
      return null;
    compare = { name, total: totalH / 100, units, totalH, rateH: totalH / units };
    if (compare.rateH === main.rateH || (compare.total === main.total && units === main.units))
      return null;
  }
  return { ...main, nameA, compare, transfer };
}

const group = (/** @type {number} */ n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Hundredths as a number: 60 → "0.60" for money, 12000 → "120". */
export function numText(h, money) {
  const whole = Math.trunc(h / 100);
  const frac = h % 100;
  if (frac === 0) return group(whole);
  return `${group(whole)}.${money ? String(frac).padStart(2, "0") : String(frac).padStart(2, "0").replace(/0$/, "")}`;
}

/** An amount of the deal's second quantity, in one language: "$0.60" or "40 miles". */
export function amount(d, h, lang) {
  return d.money ? `$${numText(h, true)}` : `${numText(h, false)} ${d.totalWord[lang]}`;
}

/** A distractor shown as a rounded decimal, not as an exact amount. */
const approx = (/** @type {number} */ x) => Number(x.toFixed(x < 1 ? 3 : 2));

/**
 * "How much for 1?" choices: the right unit rate, the division the wrong way
 * round, the whole total (nothing divided) and total × units (multiplied).
 * @param {Deal} d
 */
export function rateChoices(d) {
  const per = d.totalH / 100 / d.units;
  const inv = d.units / (d.totalH / 100);
  const raw = [
    { text: numText(d.rateH, d.money), value: per, money: d.money, correct: true, kind: "right" },
    { text: String(approx(inv)), value: inv, money: d.money, correct: false, kind: "inverted" },
    {
      text: numText(d.totalH, d.money),
      value: d.totalH / 100,
      money: d.money,
      correct: false,
      kind: "whole",
    },
    {
      text: numText(d.totalH * d.units, d.money),
      value: (d.totalH / 100) * d.units,
      money: d.money,
      correct: false,
      kind: "product",
    },
  ];
  const seen = new Set();
  return raw.filter((o) => !seen.has(approx(o.value)) && seen.add(approx(o.value)));
}

/** The label of a choice: "$0.60" for money, the bare number otherwise. */
export const choiceLabel = (o) => (o.money ? `$${o.text}` : o.text);

/**
 * Which deal is the better buy (lower price per item), the other, and a reason
 * the worse one is tempting.
 * @param {{ totalH: number, units: number, rateH: number }} a
 * @param {{ totalH: number, units: number, rateH: number }} b
 */
export function betterBuy(a, b) {
  const aWins = a.rateH < b.rateH;
  const win = aWins ? "A" : "B";
  const [good, bad] = aWins ? [a, b] : [b, a];
  const tempt =
    bad.totalH < good.totalH ? "lowerTotal" : bad.units > good.units ? "moreItems" : "other";
  return { win, lose: win === "A" ? "B" : "A", tempt };
}

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {UnitRateConfig} v
 */
export function unitRateCopy(v) {
  /** @param {(lang: "en" | "es") => string} f */
  const bi = (f) => ({ en: f("en"), es: f("es") });
  const d = v;
  const t = v.transfer;
  const c = v.compare;
  const forW = { en: "for", es: "por" };
  const per = { en: "per", es: "por" };
  const unitRateWord = { en: "unit rate", es: "tasa unitaria" };
  const rateTxt = (/** @type {Deal} */ x, /** @type {"en"|"es"} */ l) => amount(x, x.rateH, l);
  const totTxt = (/** @type {Deal} */ x, /** @type {"en"|"es"} */ l) => amount(x, x.totalH, l);
  const perOne = (/** @type {Deal} */ x, /** @type {"en"|"es"} */ l) =>
    `${rateTxt(x, l)} ${per[l]} ${x.unitOne[l]}`;
  const many = (/** @type {Deal} */ x, /** @type {"en"|"es"} */ l, n = x.units) =>
    `${group(n)} ${n === 1 ? x.unitOne[l] : x.unitMany[l]}`;
  const deal = (/** @type {Deal} */ x, /** @type {"en"|"es"} */ l) =>
    `${totTxt(x, l)} ${forW[l]} ${many(x, l)}`;

  const out = {
    d,
    t,
    c,
    title: bi((l) =>
      l === "en"
        ? `A rate, and the rate for just 1 ${d.unitOne.en}`
        : `Una tasa, y la tasa para solo 1 ${d.unitOne.es}`,
    ),
    ariaLabel: bi((l) =>
      l === "en"
        ? `A double number line: ${many(d, "en")} on the top line and ${totTxt(d, "en")} on the bottom line. Dividing both by ${d.units} gives ${perOne(d, "en")}.`
        : `Una recta numérica doble: ${many(d, "es")} en la recta de arriba y ${totTxt(d, "es")} en la de abajo. Al dividir las dos entre ${d.units} se obtiene ${perOne(d, "es")}.`,
    ),
    printSummary: bi((l) =>
      l === "en"
        ? `${d.story.en} ${deal(d, "en")} is a rate: it compares two different units. Divide both numbers by ${d.units} to get the unit rate, ${perOne(d, "en")}.${c ? ` ${c.name.en}: ${c.units} ${d.unitMany.en} for $${numText(c.totalH, true)} is $${numText(c.rateH, true)} per ${d.unitOne.en}.` : ""}`
        : `${d.story.es} ${deal(d, "es")} es una tasa: compara dos unidades distintas. Divide los dos números entre ${d.units} para hallar la tasa unitaria, ${perOne(d, "es")}.${c ? ` ${c.name.es}: ${c.units} ${d.unitMany.es} por $${numText(c.totalH, true)} es $${numText(c.rateH, true)} por ${d.unitOne.es}.` : ""}`,
    ),
    situate: bi((l) =>
      l === "en"
        ? `${d.story.en} That is a rate: it compares two different units, ${d.totalLabel.en.toLowerCase()} and ${d.unitMany.en}.`
        : `${d.story.es} Eso es una tasa: compara dos unidades distintas, ${d.totalLabel.es.toLowerCase()} y ${d.unitMany.es}.`,
    ),
    dealText: bi((l) => deal(d, l)),
    tdealText: bi((l) => deal(t, l)),
    ratePhrase: bi((l) => perOne(d, l)),
    perOneT: bi((l) => perOne(t, l)),
    predict: {
      say: bi((l) =>
        l === "en"
          ? `${deal(d, "en")}. Predict how much goes with just 1 ${d.unitOne.en}.`
          : `${deal(d, "es")}. Predice cuánto corresponde a solo 1 ${d.unitOne.es}.`,
      ),
      question: bi((l) =>
        l === "en"
          ? `${d.totalLabel.en} of 1 ${d.unitOne.en} =`
          : `${d.totalLabel.es} de 1 ${d.unitOne.es} =`,
      ),
      cues: {
        inverted: bi((l) =>
          l === "en"
            ? `That divides the wrong way round (${d.units} ÷ ${numText(d.totalH, d.money)}). Which number goes with ONE ${d.unitOne.en}: the ${d.totalLabel.en.toLowerCase()} or the ${d.unitMany.en}?`
            : `Eso divide al revés (${d.units} ÷ ${numText(d.totalH, d.money)}). ¿Qué número corresponde a UNA ${d.unitOne.es}: el de ${d.totalLabel.es.toLowerCase()} o el de ${d.unitMany.es}?`,
        ),
        whole: bi((l) =>
          l === "en"
            ? `That is the ${d.totalLabel.en.toLowerCase()} of all ${d.units} ${d.unitMany.en}. Look at the line: which mark is for just 1 ${d.unitOne.en}?`
            : `Eso es ${d.totalLabel.es.toLowerCase()} de las ${d.units} ${d.unitMany.es}. Mira la recta: ¿qué marca es la de solo 1 ${d.unitOne.es}?`,
        ),
        product: bi((l) =>
          l === "en"
            ? `Can 1 ${d.unitOne.en} be more than all ${d.units} ${d.unitMany.en} together? Look at the ${numText(d.totalH, d.money)} mark.`
            : `¿Puede 1 ${d.unitOne.es} ser más que las ${d.units} ${d.unitMany.es} juntas? Mira la marca de ${numText(d.totalH, d.money)}.`,
        ),
      },
      ok: bi((l) =>
        l === "en"
          ? `Yes: ${totTxt(d, "en")} shared equally by ${d.units} ${d.unitMany.en} is ${perOne(d, "en")}.`
          : `Sí: ${totTxt(d, "es")} repartidos en partes iguales entre ${d.units} ${d.unitMany.es} son ${perOne(d, "es")}.`,
      ),
    },
    use: {
      say: bi((l) =>
        l === "en"
          ? `With ${perOne(d, "en")}, any amount is a multiplication. Pick a quantity and watch both lines move together.`
          : `Con ${perOne(d, "es")}, cualquier cantidad es una multiplicación. Elige una cantidad y mira cómo se mueven las dos rectas juntas.`,
      ),
      button: (/** @type {number} */ n) => ({
        en: `${group(n)} ${n === 1 ? d.unitOne.en : d.unitMany.en}`,
        es: `${group(n)} ${n === 1 ? d.unitOne.es : d.unitMany.es}`,
      }),
      line: (/** @type {number} */ n) =>
        bi((l) =>
          l === "en"
            ? `${many(d, "en", n)}: ${group(n)} × ${rateTxt(d, "en")} = ${amount(d, n * d.rateH, "en")}.`
            : `${many(d, "es", n)}: ${group(n)} × ${rateTxt(d, "es")} = ${amount(d, n * d.rateH, "es")}.`,
        ),
      progress: (/** @type {number} */ k, /** @type {number} */ need) => ({
        en: `Try ${need} different quantities, including 1 (${Math.min(k, need)}/${need}).`,
        es: `Prueba ${need} cantidades distintas, incluida 1 (${Math.min(k, need)}/${need}).`,
      }),
      done: bi((l) =>
        l === "en"
          ? `Every quantity is that many times the rate for 1: the ${unitRateWord.en} ${perOne(d, "en")} builds ${totTxt(d, "en")} at ${many(d, "en")}.`
          : `Cada cantidad es esa cantidad de veces la tasa de 1: la ${unitRateWord.es} ${perOne(d, "es")} forma ${totTxt(d, "es")} con ${many(d, "es")}.`,
      ),
    },
    connect: {
      say: bi((l) =>
        l === "en"
          ? `Divide BOTH numbers by ${d.units}: ${many(d, "en")} ÷ ${d.units} = 1 ${d.unitOne.en}, and ${totTxt(d, "en")} ÷ ${d.units} = ${rateTxt(d, "en")}. That is the ${unitRateWord.en}: ${perOne(d, "en")}.${d.money ? " Money for one item has its own name: the unit price." : ""}`
          : `Divide LOS DOS números entre ${d.units}: ${many(d, "es")} ÷ ${d.units} = 1 ${d.unitOne.es}, y ${totTxt(d, "es")} ÷ ${d.units} = ${rateTxt(d, "es")}. Esa es la ${unitRateWord.es}: ${perOne(d, "es")}.${d.money ? " El dinero por un artículo tiene su propio nombre: el precio unitario." : ""}`,
      ),
      expr: `${numText(d.totalH, d.money)} ÷ ${d.units} = ${numText(d.rateH, d.money)}`,
      jump: (/** @type {number} */ n) =>
        `+${amount({ ...d, totalWord: { en: "", es: "" } }, n * d.rateH, "en").trim()}`,
      unitRateWord,
    },
    transferCopy: {
      say: bi((l) =>
        l === "en"
          ? `${t.story.en} Find the rate for just 1 ${t.unitOne.en}.`
          : `${t.story.es} Halla la tasa de solo 1 ${t.unitOne.es}.`,
      ),
      question: bi((l) =>
        l === "en"
          ? `${t.totalLabel.en} in 1 ${t.unitOne.en} =`
          : `${t.totalLabel.es} en 1 ${t.unitOne.es} =`,
      ),
      cues: {
        inverted: bi((l) =>
          l === "en"
            ? `That divides the wrong way round (${t.units} ÷ ${numText(t.totalH, t.money)}). Which number goes with ONE ${t.unitOne.en}: the ${t.totalLabel.en.toLowerCase()} or the ${t.unitMany.en}?`
            : `Eso divide al revés (${t.units} ÷ ${numText(t.totalH, t.money)}). ¿Qué número corresponde a UNA ${t.unitOne.es}: el de ${t.totalLabel.es.toLowerCase()} o el de ${t.unitMany.es}?`,
        ),
        whole: bi((l) =>
          l === "en"
            ? `That is the ${t.totalLabel.en.toLowerCase()} of all ${t.units} ${t.unitMany.en}. Which mark is for just 1 ${t.unitOne.en}?`
            : `Eso es ${t.totalLabel.es.toLowerCase()} de las ${t.units} ${t.unitMany.es}. ¿Qué marca es la de solo 1 ${t.unitOne.es}?`,
        ),
        product: bi((l) =>
          l === "en"
            ? `Multiplying makes a number far bigger than ${numText(t.totalH, t.money)}. Should 1 ${t.unitOne.en} be more than all ${t.units}?`
            : `Multiplicar da un número mucho mayor que ${numText(t.totalH, t.money)}. ¿Debe 1 ${t.unitOne.es} ser más que las ${t.units}?`,
        ),
      },
      ok: bi((l) =>
        l === "en"
          ? `Yes: ${numText(t.totalH, t.money)} ÷ ${t.units} = ${numText(t.rateH, t.money)}. The rate is ${perOne(t, "en")}.`
          : `Sí: ${numText(t.totalH, t.money)} ÷ ${t.units} = ${numText(t.rateH, t.money)}. La tasa es ${perOne(t, "es")}.`,
      ),
      explain: bi((l) =>
        l === "en"
          ? "Explain: what does a unit rate tell you, and how do you find it?"
          : "Explica: ¿qué te dice una tasa unitaria y cómo se halla?",
      ),
      frame: bi((l) =>
        l === "en"
          ? "A unit rate tells ___ for 1 ___. I find it by dividing ___ by ___."
          : "Una tasa unitaria dice ___ por 1 ___. La hallo dividiendo ___ entre ___.",
      ),
    },
  };

  if (!c) return { ...out, compareCopy: null };
  const cd = { ...d, total: c.total, units: c.units, totalH: c.totalH, rateH: c.rateH };
  const { win, lose, tempt } = betterBuy(d, c);
  const nameOf = (/** @type {string} */ k) => (k === "A" ? d.nameA : c.name);
  const dealOfK = (/** @type {string} */ k) => (k === "A" ? d : cd);
  const W_ = dealOfK(win);
  const L_ = dealOfK(lose);
  const compareCopy = {
    win,
    lose,
    rows: {
      A: bi((l) => `${d.nameA[l]}: ${deal(d, l)}`),
      B: bi((l) => `${c.name[l]}: ${deal(cd, l)}`),
    },
    barLabel: (/** @type {"A"|"B"} */ k) => bi((l) => perOne(dealOfK(k), l)),
    say: bi((l) =>
      l === "en"
        ? `${d.nameA.en} sells ${many(d, "en")} for ${totTxt(d, "en")}. ${c.name.en} sells ${many(cd, "en")} for ${totTxt(cd, "en")}. Which is the better buy?`
        : `${d.nameA.es} vende ${many(d, "es")} por ${totTxt(d, "es")}. ${c.name.es} vende ${many(cd, "es")} por ${totTxt(cd, "es")}. ¿Cuál es la mejor compra?`,
    ),
    question: bi((l) => (l === "en" ? "The better buy is" : "La mejor compra es")),
    options: placeAway(
      [
        { key: win, correct: true, label: nameOf(win), cue: null },
        {
          key: lose,
          correct: false,
          label: nameOf(lose),
          cue: bi((l) => {
            const n = nameOf(lose)[l];
            if (tempt === "lowerTotal")
              return l === "en"
                ? `${n} has the lower total, but the two deals buy different numbers of ${d.unitMany.en}. What does 1 ${d.unitOne.en} cost at each?`
                : `${n} tiene el total más bajo, pero las dos ofertas compran distinto número de ${d.unitMany.es}. ¿Cuánto cuesta 1 ${d.unitOne.es} en cada una?`;
            if (tempt === "moreItems")
              return l === "en"
                ? `${n} gets more ${d.unitMany.en}, but more is not the same as cheaper for each. What does 1 ${d.unitOne.en} cost at each?`
                : `${n} da más ${d.unitMany.es}, pero más no significa más barato por cada una. ¿Cuánto cuesta 1 ${d.unitOne.es} en cada una?`;
            return l === "en"
              ? `Deals of different sizes cannot be compared by their totals. What does 1 ${d.unitOne.en} cost at each?`
              : `Las ofertas de distinto tamaño no se comparan por sus totales. ¿Cuánto cuesta 1 ${d.unitOne.es} en cada una?`;
          }),
        },
        {
          key: "same",
          correct: false,
          label: { en: "They cost the same", es: "Cuestan lo mismo" },
          cue: bi((l) =>
            l === "en"
              ? `Divide each total by its number of ${d.unitMany.en}. Do you get the same price for 1 ${d.unitOne.en}?`
              : `Divide cada total entre su número de ${d.unitMany.es}. ¿Sale el mismo precio por 1 ${d.unitOne.es}?`,
          ),
        },
      ],
      d.units + c.units,
    ),
    ok: bi((l) =>
      l === "en"
        ? `${nameOf(win).en} is the better buy: ${perOne(W_, "en")} is less than ${perOne(L_, "en")}. Compare the rate for 1, not the totals.`
        : `${nameOf(win).es} es la mejor compra: ${perOne(W_, "es")} es menos que ${perOne(L_, "es")}. Compara la tasa de 1, no los totales.`,
    ),
    expr: `$${numText(W_.rateH, true)} &lt; $${numText(L_.rateH, true)}`,
  };
  return { ...out, compareCopy };
}
