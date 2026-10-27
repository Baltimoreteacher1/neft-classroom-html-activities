// Number names in English and Spanish for the readout and the "words" target form. Whole numbers 0..999,999 and
// plain decimals to thousandths. Pure functions, no DOM. @fm2 FM-007 FM-020
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
const ES_SMALL = [
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

function enBelow1000(n) {
  const parts = [];
  if (n >= 100) parts.push(`${EN_ONES[Math.floor(n / 100)]} hundred`);
  const rest = n % 100;
  if (rest)
    parts.push(
      rest < 20
        ? EN_ONES[rest]
        : EN_TENS[Math.floor(rest / 10)] + (rest % 10 ? `-${EN_ONES[rest % 10]}` : ""),
    );
  return parts.join(" ");
}

function esBelow1000(n) {
  if (n === 100) return "cien";
  const parts = [];
  if (n >= 100) parts.push(ES_HUNDREDS[Math.floor(n / 100)]);
  const rest = n % 100;
  if (rest)
    parts.push(
      rest < 30
        ? ES_SMALL[rest]
        : ES_TENS[Math.floor(rest / 10)] + (rest % 10 ? ` y ${ES_SMALL[rest % 10]}` : ""),
    );
  return parts.join(" ");
}

// "uno" and "veintiuno" lose the o before "mil" (un mil is just "mil").
const esApocope = (text) => text.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");

export function intWords(n, lang = "en") {
  if (!Number.isInteger(n) || n < 0 || n > 999999)
    throw new RangeError("intWords handles 0..999,999");
  if (n === 0) return lang === "en" ? "zero" : "cero";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  if (lang === "en")
    return [thousands ? `${enBelow1000(thousands)} thousand` : "", rest ? enBelow1000(rest) : ""]
      .filter(Boolean)
      .join(" ");
  const head = thousands
    ? thousands === 1
      ? "mil"
      : `${esApocope(esBelow1000(thousands))} mil`
    : "";
  return [head, rest ? esBelow1000(rest) : ""].filter(Boolean).join(" ");
}

const PLACE = {
  1: ["tenth", "tenths", "décima", "décimas"],
  2: ["hundredth", "hundredths", "centésima", "centésimas"],
  3: ["thousandth", "thousandths", "milésima", "milésimas"],
};
const feminine = (text) =>
  text
    .replace(/uno$/, "una")
    .replace(/ientos$/, "ientas")
    .replace(/veintiún$/, "veintiuna");

// "34" -> "thirty-four"; "2.35" -> "two and thirty-five hundredths"; "-7" -> "negative seven".
export function wordsFor(text, lang = "en") {
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const w = Number(whole);
  const f = Number(fraction || 0);
  let out;
  if (!fraction) out = intWords(w, lang);
  else {
    const place = PLACE[fraction.length];
    const one = f === 1;
    const name = lang === "en" ? place[one ? 0 : 1] : place[one ? 2 : 3];
    const fracWords = lang === "en" ? intWords(f, "en") : feminine(intWords(f, "es"));
    const tail = `${fracWords} ${name}`;
    out = w === 0 ? tail : `${intWords(w, lang)} ${lang === "en" ? "and" : "con"} ${tail}`;
  }
  return negative && Number(text) !== 0 ? `${lang === "en" ? "negative" : "menos"} ${out}` : out;
}

// Group the whole part with commas: "1234.5" -> "1,234.5". Used for every learner-facing numeral.
export function fmtNum(text) {
  const negative = text.startsWith("-");
  const [whole, fraction] = text.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}${grouped}${fraction !== undefined ? `.${fraction}` : ""}`;
}
