// Every sentence of the ratio figures, in English and Spanish, written as a mathematics teacher would say it (not translated word for
// word). Numbers arrive already computed by ratios-calc.mjs; nothing here does arithmetic beyond choosing singular or plural.
import { eqVal, OFFER, plain, plainApprox, REF, show, txt } from "./ratios-calc.mjs";
import { wrap } from "./ratios-draw.mjs";

/** @typedef {"en" | "es"} Lang */
const T = (/** @type {Lang} */ lang) => (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);

/** Answer-box paragraphs. @param {string} s @param {number} maxPx */
export const lines = (s, maxPx) => wrap(s, 15, maxPx, true);

/** @param {Lang} lang @param {number} n */
export const cups = (lang, n) => (lang === "es" ? (n === 1 ? "taza" : "tazas") : n === 1 ? "cup" : "cups");

/** Names of the two quantities of a mix. @param {Lang} lang @param {"juice" | "color"} which */
export function names(lang, which) {
  const es = lang === "es";
  const first = which === "juice" ? (es ? "Jugo" : "Juice") : "Color";
  const second = which === "juice" ? (es ? "Agua" : "Water") : es ? "Blanco" : "White";
  return { a: first, b: second, unit: es ? "(tazas)" : "(cups)", cup1: es ? "taza" : "cup" };
}

/** Where each step of the double-line figure sits in the motion. @param {string[]} ids row ids in order @param {boolean} wrong */
export function stepsOf(ids, wrong) {
  /** @type {Record<string, number>} */
  const s = { given: 0, scale: 1 };
  let k = 2;
  for (const id of ids) if (id === "simplest" || id === "unit") s[id] = k++;
  s.wrong = wrong ? k++ : -1;
  s.head = k;
  return s;
}
/** @param {boolean} hasK @param {boolean} hasWrong */
export function convSteps(hasK, hasWrong) {
  let k = 0;
  const given = k++;
  const scale = hasK ? k++ : -1;
  const wrong = hasWrong ? k++ : -1;
  const chain = k++;
  const cancel = k++;
  const head = k++;
  const flip = k++;
  return { given, scale, wrong, chain, cancel, head, flip, last: flip };
}

/** "+2, +2" or "−4, −4" (the same amount added to both numbers). @param {number} t @param {boolean} [pair] */
export function signed(t, pair = false) {
  const s = `${t > 0 ? "+" : "−"}${Math.abs(t)}`;
  return pair ? `${s}, ${s}` : s;
}

/** @param {Lang} lang @param {boolean} scale */
export function units(lang, scale) {
  const es = lang === "es";
  const mk = (/** @type {string} */ abbr, /** @type {string} */ abbr1, /** @type {string} */ abbrN, /** @type {string} */ name, /** @type {string} */ plural, /** @type {string} */ the) => ({ abbr, abbr1, abbrN: (/** @type {number} */ n) => (n === 1 ? abbr1 : abbrN), name, plural, the });
  if (scale) return { from: es ? mk("pies", "pie", "pies", "Pies", "pies", "los") : mk("ft", "ft", "ft", "Feet", "feet", "the"), to: es ? mk("pulg", "pulg", "pulg", "Pulgadas", "pulgadas", "las") : mk("in", "in", "in", "Inches", "inches", "the") };
  return { from: es ? mk("pulg", "pulg", "pulg", "Pulgadas", "pulgadas", "las") : mk("in", "in", "in", "Inches", "inches", "the"), to: es ? mk("cm", "cm", "cm", "Centímetros", "centímetros", "los") : mk("cm", "cm", "cm", "Centimeters", "centimeters", "the") };
}
/** @typedef {ReturnType<typeof units>} Units */
/** "the inches" / "las pulgadas". @param {Units["from"]} x */
export const the = (x) => `${x.the} ${x.plural}`;

// ---------------------------------------------------------------- sentences drawn in the "not this" boxes and answer boxes
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").doubleLine>} m */
export function doubleWrong(lang, m) {
  const t = T(lang);
  const w = /** @type {NonNullable<typeof m.wrong>} */ (m.wrong);
  const [a, b, d] = [m.a, m.b, w.d];
  return t(
    `Not this: adding ${d} to both gives ${a + d} : ${b + d}, a different ratio. Doing ×2 to both gives ${2 * a} : ${2 * b}.`,
    `No así: sumar ${d} a las dos cantidades da ${a + d} : ${b + d}, otra razón. Hacer ×2 en las dos da ${2 * a} : ${2 * b}.`,
  );
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").compareModel>} m */
export function compareVerdict(lang, m) {
  const t = T(lang);
  const head = t(`${txt(m.mine)} cups of color against ${txt(m.ref)} for ${m.L} cups of white.`, `${txt(m.mine)} tazas de color contra ${txt(m.ref)} con ${m.L} tazas de blanco.`);
  const tail = m.verdict > 0 ? t("Your mix is stronger.", "Tu mezcla es más fuerte.") : m.verdict < 0 ? t("Your mix is weaker.", "Tu mezcla es más débil.") : t("The same strength.", "La misma fuerza.");
  return `${head} ${tail}`;
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").compareModel>} m */
export function compareWrong(lang, m) {
  const t = T(lang);
  const w = /** @type {NonNullable<typeof m.wrong>} */ (m.wrong);
  const [c, k] = [txt(w.color), Math.abs(w.t)];
  return w.t > 0
    ? t(`Not this: adding ${k} to both numbers of ${m.a} : ${m.b} gives ${c} : ${REF[1]}, a different mix. Use × or ÷.`, `No así: sumar ${k} a los dos números de ${m.a} : ${m.b} da ${c} : ${REF[1]}, otra mezcla. Usa × o ÷.`)
    : t(`Not this: taking ${k} off both numbers of ${m.a} : ${m.b} gives ${c} : ${REF[1]}, a different mix. Use × or ÷.`, `No así: quitar ${k} a los dos números de ${m.a} : ${m.b} da ${c} : ${REF[1]}, otra mezcla. Usa × o ÷.`);
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").rateModel>} m */
export function rateVerdict(lang, m) {
  const t = T(lang);
  if (m.verdict === 0) return t("Same price per item.", "El mismo precio por artículo.");
  return m.verdict < 0 ? t("Better buy: your pack. It costs less for each item.", "Mejor compra: tu paquete. Cuesta menos por cada artículo.") : t("Better buy: the offer. It costs less for each item.", "Mejor compra: la oferta. Cuesta menos por cada artículo.");
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").rateModel>} m */
export function rateWrong(lang, m) {
  const t = T(lang);
  const w = /** @type {NonNullable<typeof m.wrong>} */ (m.wrong);
  const d = txt(w.dollars, true);
  return t(`Not this: taking ${w.off} off both gives ${d} for 1 item. Dividing, $${m.p} ÷ ${m.n}, gives the unit price.`, `No así: quitar ${w.off} a las dos da ${d} por 1 artículo. Dividir, $${m.p} ÷ ${m.n}, da el precio unitario.`);
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").graphModel>} m */
export function graphVerdict(lang, m) {
  const t = T(lang);
  return m.proportional
    ? t(`Every row has the same y ÷ x, ${m.r}: the points make a line through (0, 0).`, `Todas las filas tienen el mismo y ÷ x, ${m.r}: los puntos forman una recta que pasa por (0, 0).`)
    : t("y ÷ x changes from row to row: the points are in a line, but it does not pass through (0, 0).", "y ÷ x cambia de una fila a otra: los puntos están en una recta, pero no pasa por (0, 0).");
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").graphModel>} m */
export function graphWrong(lang, m) {
  const t = T(lang);
  const w = /** @type {NonNullable<typeof m.wrong>} */ (m.wrong);
  if ("through" in w) return t(`Not this: a line through (0, 0). The line starts at (0, ${m.s}), so it misses the origin.`, `No así: una recta por (0, 0). La recta empieza en (0, ${m.s}), así que no pasa por el origen.`);
  return t(
    `Not this: adding ${w.add} to both gives (${w.x}, ${w.y}), off the line through (0, 0). Doing ×${m.c} gives (${m.c}, ${m.r * m.c}).`,
    `No así: sumar ${w.add} a las dos da (${w.x}, ${w.y}), fuera de la recta por (0, 0). Hacer ×${m.c} da (${m.c}, ${m.r * m.c}).`,
  );
}
/** @param {Lang} lang @param {Units} u */
export function cancelNote(lang, u) {
  const cap = (/** @type {string} */ x) => x[0].toUpperCase() + x.slice(1);
  return lang === "es" ? `${cap(the(u.from))} se cancelan (${u.from.abbr} ÷ ${u.from.abbr} = 1) y quedan ${the(u.to)}.` : `${cap(the(u.from))} cancel (${u.from.abbr} ÷ ${u.from.abbr} = 1), and ${the(u.to)} are left.`;
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").convModel>} m @param {Units} u */
export function convAdd(lang, m, u) {
  const t = T(lang);
  const w = /** @type {NonNullable<typeof m.wrong>} */ (m.wrong);
  return t(
    `Not this: adding ${w.add} to both gives ${m.L} ${u.from.abbr} : ${txt(w.bottom)} ${u.to.abbr}. Doing ×${m.L} to both gives ${m.L} ${u.from.abbr} : ${txt(m.result)} ${u.to.abbr}.`,
    `No así: sumar ${w.add} a las dos da ${m.L} ${u.from.abbrN(m.L)} : ${txt(w.bottom)} ${u.to.abbr}. Hacer ×${m.L} en las dos da ${m.L} ${u.from.abbrN(m.L)} : ${txt(m.result)} ${u.to.abbr}.`,
  );
}
/** @param {Lang} lang @param {ReturnType<typeof import("./ratios-calc.mjs").convModel>} m @param {Units} u */
export function convFlip(lang, m, u) {
  const t = T(lang);
  const v = eqVal(show(m.flipped));
  return t(
    `Not this: with the factor upside down, ${the(u.from)} stay on top and do not cancel. ${m.L} ÷ ${txt(m.f)} ${v} is not the length in ${u.to.plural}.`,
    `No así: con el factor al revés, ${the(u.from)} quedan arriba y no se cancelan. ${m.L} ÷ ${txt(m.f)} ${v} no es la longitud en ${u.to.plural}.`,
  );
}

// ---------------------------------------------------------------- the full text equivalents
/** @param {ReturnType<typeof import("./ratios-calc.mjs").tapeModel>} m @param {Lang} lang */
export function describeTape(m, lang) {
  const t = T(lang);
  const { a, b, total } = m;
  return [
    t(`One tape of ${total} boxes, each box 1 cup: ${a} solid boxes for juice and ${b} slashed boxes for water.`, `Una cinta de ${total} casillas, cada una de 1 taza: ${a} casillas lisas de jugo y ${b} casillas con raya de agua.`),
    t(`The whole drink is ${a} + ${b} = ${total} cups.`, `La bebida completa es ${a} + ${b} = ${total} tazas.`),
    t(`Juice to water is ${a} : ${b}, part to part. Juice to the whole drink is ${a} : ${total}, part to whole. Water to the whole drink is ${b} : ${total}.`, `Jugo a agua es ${a} : ${b}, parte a parte. Jugo a la bebida completa es ${a} : ${total}, parte a todo. Agua a la bebida completa es ${b} : ${total}.`),
    t(`Not this: ${a} : ${b} is part to part. For part to whole, the whole goes second: ${a} : ${total}.`, `No así: ${a} : ${b} es parte a parte. Para parte a todo, el total va en segundo lugar: ${a} : ${total}.`),
  ].join(" ");
}
/** @param {ReturnType<typeof import("./ratios-calc.mjs").doubleLine>} m @param {Lang} lang */
export function describeDouble(m, lang) {
  const t = T(lang);
  const { a, b, g } = m;
  const out = [
    t(`A double number line and a ratio table for juice and water: ${a} cups of juice for ${b} cups of water, ${a} : ${b}.`, `Una recta numérica doble y una tabla de razones para jugo y agua: ${a} tazas de jugo por ${b} tazas de agua, ${a} : ${b}.`),
    t(`Multiplying both by 2 gives ${2 * a} : ${2 * b}.`, `Multiplicar los dos por 2 da ${2 * a} : ${2 * b}.`),
  ];
  if (m.rows.some((r) => r.id === "simplest")) out.push(t(`Dividing both by ${g} gives the simplest form, ${a / g} : ${b / g}.`, `Dividir los dos entre ${g} da la forma más simple, ${a / g} : ${b / g}.`));
  if (b > 1) out.push(t(`Dividing both by ${b} gives ${plainApprox(show(m.value), false)} cups of juice for 1 cup of water.`, `Dividir los dos entre ${b} da ${plainApprox(show(m.value), true)} tazas de jugo por 1 taza de agua.`));
  if (m.wrong) out.push(doubleWrong(lang, m));
  out.push(t(`Juice for 1 cup of water: ${a} ÷ ${b} = ${plainApprox(show(m.value), false)}.`, `Jugo por 1 taza de agua: ${a} ÷ ${b} = ${plainApprox(show(m.value), true)}.`));
  return out.join(" ");
}
/** @param {ReturnType<typeof import("./ratios-calc.mjs").compareModel>} m @param {Lang} lang */
export function describeCompare(m, lang) {
  const t = T(lang);
  const es = lang === "es";
  const out = [
    t(`Your mix has ${m.a} cups of color for ${m.b} cups of white. The reference mix has ${REF[0]} cups of color for ${REF[1]} cups of white.`, `Tu mezcla tiene ${m.a} tazas de color por ${m.b} tazas de blanco. La mezcla de referencia tiene ${REF[0]} tazas de color por ${REF[1]} tazas de blanco.`),
    t(`To compare fairly, use the same white, ${m.L} cups. Your mix is multiplied by ${m.kMine} and the reference by ${m.kRef}.`, `Para comparar con justicia, usa el mismo blanco, ${m.L} tazas. Tu mezcla se multiplica por ${m.kMine} y la de referencia por ${m.kRef}.`),
    compareVerdict(lang, m),
    t(`Color for 1 cup of white: ${m.a} ÷ ${m.b} = ${plainApprox(show(m.value), false)}. Reference: ${REF[0]} ÷ ${REF[1]} = ${plain(show(m.refValue))}.`, `Color por 1 taza de blanco: ${m.a} ÷ ${m.b} = ${plainApprox(show(m.value), es)}. Referencia: ${REF[0]} ÷ ${REF[1]} = ${plain(show(m.refValue))}.`),
  ];
  if (m.wrong) out.push(compareWrong(lang, m));
  return out.join(" ");
}
/** @param {ReturnType<typeof import("./ratios-calc.mjs").rateModel>} m @param {Lang} lang */
export function describeRate(m, lang) {
  const t = T(lang);
  const es = lang === "es";
  const u = plainApprox(show(m.unit, { money: true }), es);
  const o = plainApprox(show(m.offerUnit, { money: true }), es);
  const out = [
    t(`Your pack costs $${m.p} for ${m.n} ${m.n === 1 ? "item" : "items"}. Dividing both quantities by ${m.n} gives ${u} for 1 item.`, `Tu paquete cuesta $${m.p} por ${m.n} ${m.n === 1 ? "artículo" : "artículos"}. Dividir las dos cantidades entre ${m.n} da ${u} por 1 artículo.`),
    t(`The offer is $${OFFER[0]} for ${OFFER[1]} items. Dividing by ${OFFER[1]} gives ${o} for 1 item.`, `La oferta es $${OFFER[0]} por ${OFFER[1]} artículos. Dividir entre ${OFFER[1]} da ${o} por 1 artículo.`),
    rateVerdict(lang, m),
    t(`Unit price: $${m.p} ÷ ${m.n} = ${u}.`, `Precio unitario: $${m.p} ÷ ${m.n} = ${u}.`),
  ];
  if (m.wrong) out.push(rateWrong(lang, m));
  return out.join(" ");
}
/** @param {ReturnType<typeof import("./ratios-calc.mjs").graphModel>} m @param {Lang} lang */
export function describeGraph(m, lang) {
  const t = T(lang);
  const pts = m.rows.map((r) => `(${r.x}, ${r.y})`).join(", ");
  const out = [
    t(`A table and a graph of carriages (x) and passengers (y). Each row of the table is one point: ${pts}.`, `Una tabla y una gráfica de vagones (x) y pasajeros (y). Cada fila de la tabla es un punto: ${pts}.`),
    m.proportional
      ? t(`Each carriage holds ${m.r} passengers, so each row is the first row multiplied by its number of carriages.`, `Cada vagón lleva ${m.r} pasajeros, así que cada fila es la primera multiplicada por su número de vagones.`)
      : t(`Each carriage adds ${m.r} passengers and ${m.s} riders were already aboard, so the line starts at (0, ${m.s}).`, `Cada vagón suma ${m.r} pasajeros y ya había ${m.s} a bordo, así que la recta empieza en (0, ${m.s}).`),
    graphVerdict(lang, m),
    t(`Passengers: ${m.proportional ? `${m.r} × ${m.c}` : `${m.r} × ${m.c} + ${m.s}`} = ${plain(show(m.value))}.`, `Pasajeros: ${m.proportional ? `${m.r} × ${m.c}` : `${m.r} × ${m.c} + ${m.s}`} = ${plain(show(m.value))}.`),
  ];
  if (m.wrong) out.push(graphWrong(lang, m));
  return out.join(" ");
}
/** @param {ReturnType<typeof import("./ratios-calc.mjs").convModel>} m @param {Lang} lang */
export function describeConv(m, lang) {
  const t = T(lang);
  const u = units(lang, m.scale);
  const f = txt(m.f);
  const out = [
    t(`1 ${u.from.abbr} is ${f} ${u.to.abbr}. On the double number line and in the ratio table, ${m.L} ${u.from.abbr} is the unit ratio multiplied by ${m.L}: ${txt(m.result)} ${u.to.abbr}.`, `1 ${u.from.abbr1} son ${f} ${u.to.abbr}. En la recta numérica doble y en la tabla de razones, ${m.L} ${u.from.abbrN(m.L)} es la razón unitaria multiplicada por ${m.L}: ${txt(m.result)} ${u.to.abbr}.`),
  ];
  if (m.wrong) out.push(convAdd(lang, m, u));
  out.push(
    t(`As a chain: ${m.L} ${u.from.abbr} over 1, times ${f} ${u.to.abbr} over 1 ${u.from.abbr}. The ${u.from.plural} cancel and ${txt(m.result)} ${u.to.abbr} over 1 is left.`, `En cadena: ${m.L} ${u.from.abbrN(m.L)} sobre 1, por ${f} ${u.to.abbr} sobre 1 ${u.from.abbr1}. Las ${u.from.plural} se cancelan y queda ${txt(m.result)} ${u.to.abbr} sobre 1.`),
    t(`Length: ${m.L} × ${f} = ${txt(m.result)} ${u.to.abbr}.`, `Longitud: ${m.L} × ${f} = ${txt(m.result)} ${u.to.abbr}.`),
    convFlip(lang, m, u),
  );
  return out.join(" ");
}
