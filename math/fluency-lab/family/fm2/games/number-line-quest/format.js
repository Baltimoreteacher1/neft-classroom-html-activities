// Number display and speech for Number Line Quest: one place that turns an exact rational into the text a learner
// reads (fraction, mixed number, decimal, whole number, scientific notation, radical) and the words a screen reader says.
// @fm2 FM-052 FM-053 FM-054 FM-055
import { toDecimalString } from "../../rational.js";

export const MINUS = "−";
const NB = " ";
const SUP = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  "-": "⁻",
};

const signed = (negative, text) => (negative ? MINUS + text : text);
// Five or more digits are grouped with a no-break space (SI style) so 100000 reads as 100 000 in both languages.
export const groupDigits = (digits) =>
  digits.length >= 5 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, NB) : digits;

// mode: "int" | "dec" | "frac" | "mixed". `places` pads decimals ("1.0") so tick labels line up.
export function showNum(v, mode = "int", places = 0) {
  const negative = v.n < 0;
  const a = { n: Math.abs(v.n), d: v.d };
  if (mode === "dec" || a.d === 1) {
    const dec = toDecimalString(a);
    if (dec !== null) {
      const [whole, part = ""] = dec.split(".");
      const padded = mode === "dec" ? part.padEnd(places, "0") : part;
      return signed(negative, groupDigits(whole) + (padded ? `.${padded}` : ""));
    }
  }
  if (mode === "mixed" && a.n > a.d)
    return signed(negative, `${Math.floor(a.n / a.d)} ${a.n % a.d}/${a.d}`);
  return signed(negative, `${a.n}/${a.d}`);
}

// Number of decimal places a step needs (0.01 -> 2), or 0 for a fraction step.
export function placesOf(step) {
  const dec = toDecimalString({ n: Math.abs(step.n), d: step.d });
  return dec && dec.includes(".") ? dec.split(".")[1].length : 0;
}

const DEN = {
  en: {
    2: ["half", "halves"],
    3: ["third", "thirds"],
    4: ["fourth", "fourths"],
    5: ["fifth", "fifths"],
    6: ["sixth", "sixths"],
    7: ["seventh", "sevenths"],
    8: ["eighth", "eighths"],
    9: ["ninth", "ninths"],
    10: ["tenth", "tenths"],
    12: ["twelfth", "twelfths"],
  },
  es: {
    2: ["medio", "medios"],
    3: ["tercio", "tercios"],
    4: ["cuarto", "cuartos"],
    5: ["quinto", "quintos"],
    6: ["sexto", "sextos"],
    7: ["séptimo", "séptimos"],
    8: ["octavo", "octavos"],
    9: ["noveno", "novenos"],
    10: ["décimo", "décimos"],
    12: ["doceavo", "doceavos"],
  },
};
const fracWords = (n, d, lang) => {
  const names = DEN[lang][d];
  return names ? `${n} ${names[n === 1 ? 0 : 1]}` : `${n} ${lang === "es" ? "sobre" : "over"} ${d}`;
};

// What a screen reader should say for a value (aria-valuetext and announcements), in words rather than symbols.
export function spokenNum(v, mode, lang) {
  const a = { n: Math.abs(v.n), d: v.d };
  let text;
  const dec = mode === "dec" || a.d === 1 ? toDecimalString(a) : null;
  if (dec !== null) {
    const [whole, part] = dec.split(".");
    text = part
      ? `${whole} ${lang === "es" ? "punto" : "point"} ${part.split("").join(" ")}`
      : whole;
  } else if (mode === "mixed" && a.n > a.d) {
    text = `${Math.floor(a.n / a.d)} ${lang === "es" ? "y" : "and"} ${fracWords(a.n % a.d, a.d, lang)}`;
  } else text = fracWords(a.n, a.d, lang);
  return v.n < 0 ? `${lang === "es" ? "menos" : "negative"} ${text}` : text;
}

export const supText = (e) =>
  String(e)
    .split("")
    .map((c) => SUP[c])
    .join("");
export const sciText = (coef, exp) => `${showNum(coef, "dec")} × 10${supText(exp)}`;
export const spokenSci = (coef, exp, lang) =>
  `${showNum(coef, "dec")} ${lang === "es" ? "por 10 a la" : "times 10 to the"} ${exp < 0 ? `${lang === "es" ? "menos" : "negative"} ${-exp}` : exp}`;
export const rootText = (index, radicand) => `${index === 3 ? "∛" : "√"}${radicand}`;
export const spokenRoot = (index, radicand, lang) =>
  lang === "es"
    ? `raíz ${index === 3 ? "cúbica" : "cuadrada"} de ${radicand}`
    : `${index === 3 ? "cube" : "square"} root of ${radicand}`;
