// Words for the "decimal" family: place names, step labels, hints and notes in English and Spanish.
// Numbers print with decimal points in both languages (the site's convention). `-` shows as "−".
import { t } from "./core.mjs";
import { whole } from "./decimal-math.mjs";

export const MINUS = "−";

const PLACES = {
  "-3": { en: ["thousandth", "thousandths"], es: ["milésima", "milésimas"] },
  "-2": { en: ["hundredth", "hundredths"], es: ["centésima", "centésimas"] },
  "-1": { en: ["tenth", "tenths"], es: ["décima", "décimas"] },
  0: { en: ["one", "ones"], es: ["unidad", "unidades"] },
  1: { en: ["ten", "tens"], es: ["decena", "decenas"] },
  2: { en: ["hundred", "hundreds"], es: ["centena", "centenas"] },
  3: { en: ["thousand", "thousands"], es: ["unidad de millar", "unidades de millar"] },
  4: { en: ["ten thousand", "ten thousands"], es: ["decena de millar", "decenas de millar"] },
  5: { en: ["hundred thousand", "hundred thousands"], es: ["centena de millar", "centenas de millar"] },
};
const up = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Name of the place with exponent e: place(0,"en") = "ones"; place(0,"en",{one:true}) = "one". */
export const place = (e, lang, { one = false, cap = false } = {}) => {
  const name = PLACES[e][lang === "es" ? "es" : "en"][one ? 0 : 1];
  return cap ? up(name) : name;
};
/** "carry 1 to the tens" / "lleva 1 a las decenas". */
export const toThe = (e, lang) =>
  lang === "es" ? `a ${e === 3 ? "los millares" : `las ${place(e, "es")}`}` : `to the ${place(e, "en")}`;
/** What one of that place is worth: "1", "10", "0.1", "0.01". */
export const placeValue = (e) => (e >= 0 ? whole(10 ** e) : `0.${"0".repeat(-e - 1)}1`);
export const placesWord = (n, lang) => (lang === "es" ? (n === 1 ? "lugar decimal" : "lugares decimales") : n === 1 ? "decimal place" : "decimal places");
export const placeInfo = (e, lang) =>
  t(lang, {
    en: `${place(e, "en", { cap: true })}: one ${place(e, "en", { one: true })} is worth ${placeValue(e)}. Ten ${place(e, "en")} make 1 ${place(e + 1, "en", { one: true })}.`,
    es: `${place(e, "es", { cap: true })}: una ${place(e, "es", { one: true })} vale ${placeValue(e)}. Diez ${place(e, "es")} forman 1 ${place(e + 1, "es", { one: true })}.`,
  });

export const STR = {
  problem: { en: "Pick a problem", es: "Elige un problema" },
  tap: { en: "Next step", es: "Siguiente paso" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  done: { en: "All steps done.", es: "Todos los pasos hechos." },
  columns: { en: "Place-value columns. Tap one to read its name.", es: "Columnas de valor posicional. Toca una para leer su nombre." },
  raw: { en: "The numbers as written", es: "Los números como están escritos" },
  grid: { en: "Place-value chart", es: "Tabla de valor posicional" },
  carry: { en: "Regrouping", es: "Reagrupación" },
  answerRow: { en: "Answer", es: "Respuesta" },
  trail: { en: "So far", es: "Hasta ahora" },
  estimate: { en: "Estimate", es: "Estimación" },
  pickPlaces: { en: "How many places from the right?", es: "¿Cuántos lugares desde la derecha?" },
  annexed: { en: "annexed zero", es: "cero agregado" },
  empty: { en: "empty", es: "vacío" },
};

export const MOVE = {
  estimate: { en: "Round each number", es: "Redondear cada número" },
  align: { en: "Line up the decimal points", es: "Alinear los puntos decimales" },
  annex: { en: "Annex zeros", es: "Agregar ceros" },
  point: { en: "Drop the decimal point", es: "Bajar el punto decimal" },
  mEstimate: { en: "Round each factor", es: "Redondear cada factor" },
  ignore: { en: "Ignore the points", es: "Ignorar los puntos" },
  multiply: { en: "Multiply the whole numbers", es: "Multiplicar los números enteros" },
  count: { en: "Count the decimal places", es: "Contar los lugares decimales" },
  place: { en: "Place the point", es: "Poner el punto" },
  check: { en: "Check with the estimate", es: "Comprobar con la estimación" },
};
export const colMove = (m, sign, lang) =>
  t(lang, {
    en: `${sign > 0 ? "Add" : "Subtract"} the ${place(m.e, "en")}`,
    es: `${sign > 0 ? "Sumar" : "Restar"} las ${place(m.e, "es")}`,
  });

const HINT = {
  estimate: {
    en: "Estimate first. Round every number to a whole number and guess the size of the answer. This is only for checking, never for a grade.",
    es: "Primero estima. Redondea cada número a un entero y adivina el tamaño de la respuesta. Es solo para comprobar, nunca para una nota.",
  },
  align: {
    en: "Write the numbers one under the other so the decimal points line up in one column.",
    es: "Escribe los números uno debajo del otro para que los puntos decimales queden en una sola columna.",
  },
  annex: {
    en: "Some numbers have fewer decimal places. Annex zeros so every number has the same decimal places. Zeros at the end do not change the value.",
    es: "Algunos números tienen menos lugares decimales. Agrega ceros para que todos tengan los mismos lugares decimales. Los ceros al final no cambian el valor.",
  },
  point: {
    en: "Bring the decimal point straight down into the answer.",
    es: "Baja el punto decimal en línea recta a la respuesta.",
  },
  mEstimate: {
    en: "Estimate first. Round each factor to a whole number and multiply them. This is only for checking, never for a grade.",
    es: "Primero estima. Redondea cada factor a un entero y multiplícalos. Es solo para comprobar, nunca para una nota.",
  },
  ignore: {
    en: "Cover the decimal points. Read each factor as a whole number.",
    es: "Tapa los puntos decimales. Lee cada factor como un número entero.",
  },
  multiply: { en: "Multiply the two whole numbers.", es: "Multiplica los dos números enteros." },
  count: {
    en: "Count the decimal places in each factor. Then add the two counts.",
    es: "Cuenta los lugares decimales de cada factor. Luego suma los dos conteos.",
  },
  place: {
    en: "Put the decimal point that many places from the right. Tap the number of places.",
    es: "Pon el punto decimal esa cantidad de lugares desde la derecha. Toca el número de lugares.",
  },
  check: {
    en: "Compare the answer with your estimate. Is the point in a sensible place?",
    es: "Compara la respuesta con tu estimación. ¿Está el punto en un lugar razonable?",
  },
};

const lent = (cin, lang) => (cin ? ` ${MINUS} 1 (${t(lang, { en: "regrouped", es: "reagrupado" })})` : "");

/** What to do in the next column, without giving the digit away. */
export function colHint(m, sign, lang) {
  const p = place(m.e, lang, { cap: true });
  if (sign > 0) {
    return t(lang, {
      en: `${p}: ${m.da} + ${m.db}${m.cin ? " + 1 (carried)" : ""}. Tap to add.`,
      es: `${p}: ${m.da} + ${m.db}${m.cin ? " + 1 (llevado)" : ""}. Toca para sumar.`,
    });
  }
  return t(lang, {
    en: `${p}: ${m.da}${lent(m.cin, lang)} ${MINUS} ${m.db}. Tap to subtract. Regroup if you need to.`,
    es: `${p}: ${m.da}${lent(m.cin, lang)} ${MINUS} ${m.db}. Toca para restar. Reagrupa si lo necesitas.`,
  });
}

/** What happened in a finished column, regrouping included. */
export function colNote(m, sign, lang) {
  const p = place(m.e, lang, { cap: true });
  if (sign > 0) {
    const sum = m.da + m.db + m.cin;
    const base = `${p}: ${m.da} + ${m.db}${m.cin ? t(lang, { en: " + 1 (carried)", es: " + 1 (llevado)" }) : ""} = ${sum}.`;
    return `${base} ${m.out ? t(lang, { en: `Write ${m.digit} and carry 1 ${toThe(m.e + 1, "en")}.`, es: `Escribe ${m.digit} y lleva 1 ${toThe(m.e + 1, "es")}.` }) : t(lang, { en: `Write ${m.digit}.`, es: `Escribe ${m.digit}.` })}`;
  }
  const left = `${m.da}${lent(m.cin, lang)}`;
  if (!m.out) return `${p}: ${left} ${MINUS} ${m.db} = ${m.digit}.`;
  return t(lang, {
    en: `${p}: ${left} is less than ${m.db}. Regroup 1 ${place(m.e + 1, "en", { one: true })} as 10 ${place(m.e, "en")}: ${m.eff + 10} ${MINUS} ${m.db} = ${m.digit}.`,
    es: `${p}: ${left} es menos que ${m.db}. Reagrupa 1 ${place(m.e + 1, "es", { one: true })} como 10 ${place(m.e, "es")}: ${m.eff + 10} ${MINUS} ${m.db} = ${m.digit}.`,
  });
}

/** The hint for the next move (also the polite announcement). */
export function hintFor(d, lang) {
  const m = d.next;
  if (!m) return t(lang, STR.done);
  return m.k === "col" ? colHint(m, d.ops[m.op].sign, lang) : t(lang, HINT[m.k]);
}
export const hintText = (k, lang) => t(lang, HINT[k]);

const sgn = (n) => (n < 0 ? MINUS : "+");
/** Every term with its sign for display: "128.75 + 46.8 − 19.35". */
export const chainText = (parts) => parts.map((p, i) => (i ? `${sgn(p.sign)} ${p.text}` : p.text)).join(" ");

export function estimateLine(est, lang) {
  const body = est.parts.map((p, i) => (i ? `${sgn(p.sign)} ${p.rounded}` : String(p.rounded))).join(" ");
  return t(lang, {
    en: `Rounded to whole numbers: ${body} = ${est.total}. The answer should be about ${est.total}.`,
    es: `Redondeados a enteros: ${body} = ${est.total}. La respuesta debe ser de unos ${est.total}.`,
  });
}
