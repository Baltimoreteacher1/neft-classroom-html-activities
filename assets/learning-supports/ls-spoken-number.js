// Turns what a student SAID into what they would have TYPED, in English or
// Spanish: "twelve point five" -> "12.5", "tres cuartos" -> "3/4",
// "menos siete" -> "-7", "forty percent" -> "40%".
//
// It only rewrites number words and a short list of operator words. Anything
// else is left exactly as heard, so a spoken sentence stays a sentence. It
// never works anything out: "three plus four" becomes "3 + 4", not "7".
//
// Pure functions, no DOM: unit-tested in ls-spoken-number.test.mjs.

/** @typedef {"en" | "es"} Lang */

/** @param {string} s */
const plain = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const EN_UNITS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const ES_UNITS = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiun: 21,
  veintiuno: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
};

const ES_HUNDREDS = {
  cien: 100,
  ciento: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
};

/** Denominator words, singular and plural, mapped to the denominator. */
const EN_DENOMS = {
  half: 2,
  halves: 2,
  third: 3,
  thirds: 3,
  fourth: 4,
  fourths: 4,
  quarter: 4,
  quarters: 4,
  fifth: 5,
  fifths: 5,
  sixth: 6,
  sixths: 6,
  seventh: 7,
  sevenths: 7,
  eighth: 8,
  eighths: 8,
  ninth: 9,
  ninths: 9,
  tenth: 10,
  tenths: 10,
  twelfth: 12,
  twelfths: 12,
  hundredth: 100,
  hundredths: 100,
};

const ES_DENOMS = {
  medio: 2,
  medios: 2,
  mitad: 2,
  tercio: 3,
  tercios: 3,
  cuarto: 4,
  cuartos: 4,
  quinto: 5,
  quintos: 5,
  sexto: 6,
  sextos: 6,
  septimo: 7,
  septimos: 7,
  octavo: 8,
  octavos: 8,
  noveno: 9,
  novenos: 9,
  decimo: 10,
  decimos: 10,
  centesimo: 100,
  centesimos: 100,
};

/**
 * Operator words that students say inside an expression. Binary minus is the
 * same word as the sign, so "minus" is handled in the number grammar below.
 * @type {Record<Lang, Record<string, string>>}
 */
const OPERATORS = {
  en: {
    plus: "+",
    times: "×",
    equals: "=",
    "divided by": "÷",
    "multiplied by": "×",
    "is equal to": "=",
  },
  es: {
    mas: "+",
    por: "×",
    igual: "=",
    "es igual a": "=",
    "dividido entre": "÷",
    "dividido por": "÷",
    "multiplicado por": "×",
  },
};

/**
 * @param {string} transcript
 * @param {Lang} lang
 * @returns {string[]}
 */
function tokenize(transcript, lang) {
  const text = plain(transcript)
    .replace(/(\d)\s*%/g, "$1 percent")
    // A trailing sentence period is the recogniser's, not part of a decimal.
    .replace(/[¿?!;]/g, " ")
    .replace(/(\D)[.,]\s/g, "$1 ")
    .replace(/[.,]$/g, "");
  const phrases = Object.keys(OPERATORS[lang]).sort((a, b) => b.length - a.length);
  let joined = text;
  for (const p of phrases) joined = joined.replaceAll(p, p.replaceAll(" ", "_"));
  if (lang === "es") joined = joined.replaceAll("por ciento", "porciento");
  return joined.split(/\s+/).filter(Boolean);
}

/** @param {string} tok */
const isDigits = (tok) => /^\d+(\.\d+)?$/.test(tok);

/**
 * Is `tok` ("and" / "y") a joiner INSIDE one number, given its neighbours?
 * English joins after hundred/thousand ("one hundred and five"); Spanish joins
 * a tens word to a single digit ("treinta y cinco").
 * @param {string} prev
 * @param {string} tok
 * @param {string | undefined} next
 * @param {Lang} lang
 */
function isJoiner(prev, tok, next, lang) {
  if (next === undefined) return false;
  if (lang === "en") {
    return tok === "and" && ["hundred", "thousand", "million"].includes(prev) && next in EN_UNITS;
  }
  return tok === "y" && ES_UNITS[prev] >= 30 && ES_UNITS[next] >= 1 && ES_UNITS[next] < 10;
}

/**
 * Read one cardinal number starting at `i`. Returns the value and the index of
 * the first token that is not part of it.
 * @param {string[]} toks
 * @param {number} i
 * @param {Lang} lang
 * @returns {{ value: number, next: number } | null}
 */
function readCardinal(toks, i, lang) {
  if (isDigits(toks[i])) return { value: Number(toks[i]), next: i + 1 };
  const units = lang === "es" ? ES_UNITS : EN_UNITS;
  let total = 0;
  let current = 0;
  let used = 0;
  let j = i;
  while (j < toks.length) {
    const tok = toks[j];
    if (tok in units) {
      current += units[tok];
    } else if (lang === "es" && tok in ES_HUNDREDS) {
      current += ES_HUNDREDS[tok];
    } else if (lang === "en" && tok === "hundred") {
      current = (current || 1) * 100;
    } else if ((lang === "en" && tok === "thousand") || (lang === "es" && tok === "mil")) {
      total += (current || 1) * 1000;
      current = 0;
    } else if (
      (lang === "en" && tok === "million") ||
      (lang === "es" && (tok === "millon" || tok === "millones"))
    ) {
      total += (current || 1) * 1000000;
      current = 0;
    } else if (
      // "one hundred AND five", "treinta Y cinco": the joiner is not a value.
      // It only joins inside one number, so "three and one half" stays mixed.
      used > 0 &&
      isJoiner(toks[j - 1], toks[j], toks[j + 1], lang)
    ) {
      j += 1;
      continue;
    } else {
      break;
    }
    used += 1;
    j += 1;
  }
  return used ? { value: total + current, next: j } : null;
}

/**
 * Digits after a decimal point: "point zero five" -> "05"; "point 5" -> "5".
 * @param {string[]} toks
 * @param {number} i
 * @param {Lang} lang
 * @returns {{ digits: string, next: number } | null}
 */
function readDecimalDigits(toks, i, lang) {
  const units = lang === "es" ? ES_UNITS : EN_UNITS;
  let digits = "";
  let j = i;
  while (j < toks.length) {
    const tok = toks[j];
    if (/^\d+$/.test(tok)) digits += tok;
    else if (tok in units && units[tok] < 10) digits += String(units[tok]);
    else break;
    j += 1;
  }
  return digits ? { digits, next: j } : null;
}

/**
 * One number phrase: sign, whole part, decimal, fraction or mixed number.
 * @param {string[]} toks
 * @param {number} start
 * @param {Lang} lang
 * @returns {{ text: string, next: number } | null}
 */
function readNumber(toks, start, lang) {
  const denoms = lang === "es" ? ES_DENOMS : EN_DENOMS;
  const decimalWords = lang === "es" ? ["coma", "punto"] : ["point", "dot"];
  const overWords = lang === "es" ? ["sobre", "entre"] : ["over"];
  const negWords = lang === "es" ? ["menos", "negativo"] : ["negative", "minus"];
  const andWord = lang === "es" ? "y" : "and";
  let i = start;
  let sign = "";
  if (negWords.includes(toks[i])) {
    sign = "-";
    i += 1;
  }

  // "half", "medio": a bare denominator word means one of them.
  if (toks[i] in denoms && denoms[toks[i]] === 2 && !isDigits(toks[i])) {
    return { text: `${sign}1/2`, next: i + 1 };
  }
  if ((toks[i] === "a" || toks[i] === "un") && toks[i + 1] in denoms) {
    return { text: `${sign}1/${denoms[toks[i + 1]]}`, next: i + 2 };
  }

  const whole = readCardinal(toks, i, lang);
  if (!whole) return null;
  i = whole.next;
  let text = String(whole.value);

  if (decimalWords.includes(toks[i])) {
    const dec = readDecimalDigits(toks, i + 1, lang);
    if (dec) return { text: `${sign}${text}.${dec.digits}`, next: dec.next };
  }
  // "2.5" arrives as one token already; keep what the recogniser typed.
  if (isDigits(toks[start + (sign ? 1 : 0)]) && toks[i - 1].includes(".")) {
    return { text: `${sign}${toks[i - 1]}`, next: i };
  }

  if (overWords.includes(toks[i])) {
    const bottom = readCardinal(toks, i + 1, lang);
    if (bottom) return { text: `${sign}${text}/${bottom.value}`, next: bottom.next };
  }
  if (toks[i] in denoms && !isDigits(toks[i])) {
    return { text: `${sign}${text}/${denoms[toks[i]]}`, next: i + 1 };
  }

  // Mixed number: "three and one half", "tres y medio".
  if (toks[i] === andWord) {
    const frac = readNumber(toks, i + 1, lang);
    if (frac && frac.text.includes("/") && !frac.text.startsWith("-")) {
      return { text: `${sign}${text} ${frac.text}`, next: frac.next };
    }
  }
  return { text: `${sign}${text}`, next: i };
}

/**
 * @param {string} transcript what the speech service heard
 * @param {Lang} [lang]
 * @returns {string} what the student would have typed
 */
export function spokenToText(transcript, lang = "en") {
  const toks = tokenize(String(transcript ?? ""), lang);
  const ops = OPERATORS[lang];
  const original = String(transcript ?? "")
    .trim()
    .split(/\s+/);
  /** @type {string[]} */
  const out = [];
  let i = 0;
  while (i < toks.length) {
    const tok = toks[i];
    const phrase = tok.replaceAll("_", " ");
    // "minus" is a sign before a number and an operator after one.
    const afterNumber = out.length > 0 && /[\d)]$/.test(out[out.length - 1]);
    const signWord = lang === "es" ? tok === "menos" : tok === "minus";
    if (signWord && afterNumber && readNumber(toks, i + 1, lang)) {
      out.push("-");
      i += 1;
      continue;
    }
    const num = readNumber(toks, i, lang);
    if (num) {
      let text = num.text;
      i = num.next;
      const unit = toks[i];
      if (unit === "percent" || unit === "porciento") {
        text += "%";
        i += 1;
      }
      out.push(text);
      continue;
    }
    if (phrase in ops) {
      out.push(ops[phrase]);
    } else if (tok === "percent" || tok === "porciento") {
      out.push("%");
    } else {
      // Not a number word: keep the speaker's own spelling and casing.
      out.push(original[i] ?? tok);
    }
    i += 1;
  }
  return out
    .join(" ")
    .replace(/(\d) ?\/ ?(\d)/g, "$1/$2")
    .replace(/(\d) %/g, "$1%")
    .trim();
}

/**
 * The text for a NUMBER field: only a clean numeric answer is accepted, so a
 * misheard sentence never lands in a box that expects a number.
 * @param {string} transcript
 * @param {Lang} [lang]
 * @returns {string} "" when nothing numeric was heard
 */
export function spokenToNumberAnswer(transcript, lang = "en") {
  const text = spokenToText(transcript, lang);
  const m = text.match(/^-?\d+(\.\d+)?( \d+\/\d+)?(\/\d+)?%?$/);
  if (m) return text;
  const first = text.match(/-?\d+(\.\d+)?(\/\d+)?%?/);
  return first ? first[0] : "";
}
