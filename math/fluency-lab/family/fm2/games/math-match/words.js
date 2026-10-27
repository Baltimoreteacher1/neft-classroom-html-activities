// Number words in English and Spanish (0 to 999,999) and the small text helpers every card face shares.
// @fm2 FM-020 FM-008

const EN_ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const EN_TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const ES_UNDER_30 = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];
const ES_TENS = [
  "",
  "",
  "",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];
const ES_HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function en999(n) {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundreds) parts.push(`${EN_ONES[hundreds]} hundred`);
  if (rest < 20 && rest) parts.push(EN_ONES[rest]);
  else if (rest)
    parts.push(EN_TENS[Math.floor(rest / 10)] + (rest % 10 ? `-${EN_ONES[rest % 10]}` : ""));
  return parts.join(" ");
}

export function wordsEn(n) {
  if (n === 0) return "zero";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  return [thousands ? `${en999(thousands)} thousand` : "", rest ? en999(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

// `shortOne` turns a final "uno" into "un" (before a noun or before "mil"): veintiún mil, treinta y un centavos.
function es999(n, shortOne) {
  if (n === 100) return "cien";
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundreds) parts.push(ES_HUNDREDS[hundreds]);
  if (rest) {
    let word =
      rest < 30
        ? ES_UNDER_30[rest]
        : ES_TENS[Math.floor(rest / 10)] + (rest % 10 ? ` y ${ES_UNDER_30[rest % 10]}` : "");
    if (shortOne) word = word.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
    parts.push(word);
  }
  return parts.join(" ");
}

export function wordsEs(n, shortOne = false) {
  if (n === 0) return "cero";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = thousands === 1 ? "mil" : thousands ? `${es999(thousands, true)} mil` : "";
  return [head, rest ? es999(rest, shortOne) : ""].filter(Boolean).join(" ");
}

export const words = (n, lang, shortOne = false) =>
  lang === "es" ? wordsEs(n, shortOne) : wordsEn(n);

export const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// Negative numbers use the true minus sign so they read and sort the same everywhere.
export const signed = (n) => (n < 0 ? "−" : "") + comma(Math.abs(n));
export const plural = (n, one, many) => (n === 1 ? one : many);
export const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
