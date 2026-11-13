// The equation line under a picture (`eq`) is one string the engines write in English notation: "LCM(10, 5) = 10",
// "slope = rise ÷ run", "most votes: apples". The picture above it and the caption below it already follow the
// language, so under Spanish they sat beside "LCM(...)" and "slope". `eqIn` writes the line in the reader's language
// from the lab's own Spanish terms (MCD, mcm, DMA, RIC, FRUIT_ES), leaving numbers, operators and variables alone.
// English is returned untouched: the leak checks and the explanation/model alignment test read `eq` as English.
// A word with no entry stays as it is, and svg-language.test.mjs fails on any English word left in a Spanish line.
import { FRUIT_ES } from "../question-es.js";

const PHRASES = [
  [/\bmost votes\b/g, "más votos"],
  [/\binterval width\b/g, "ancho del intervalo"],
  [/\bsix faces\b/g, "seis caras"],
  [/\bmultiples of\b/g, "múltiplos de"],
  [/\bfactors of\b/g, "factores de"],
  [/\bis even\b/g, "es par"],
  [/\bis odd\b/g, "es impar"],
  [/\bis positive\b/g, "es positivo"],
  [/\bis negative\b/g, "es negativo"],
  [/\bP\(win\)/g, "P(ganar)"],
  [/\bin²/g, "pulg²"],
];
const WORDS = {
  ...FRUIT_ES,
  GCF: "MCD",
  LCM: "mcm",
  IQR: "RIC",
  MAD: "DMA",
  yes: "sí",
  book: "libro",
  books: "libros",
  pet: "mascota",
  pets: "mascotas",
  pairs: "pares",
  whole: "entero",
  of: "de",
  mean: "media",
  median: "mediana",
  rise: "subida",
  run: "avance",
  slope: "pendiente",
  quadrant: "cuadrante",
  reflect: "reflejar",
  step: "paso",
  positive: "positiva",
  negative: "negativa",
  none: "ninguna",
};

export const eqIn = (eq, lang) => {
  const text = String(eq ?? "");
  if (lang !== "es" || !text) return text;
  const phrased = PHRASES.reduce((out, [pattern, es]) => out.replace(pattern, es), text);
  return phrased.replace(/[A-Za-z]{2,}/g, (word) => WORDS[word] ?? word);
};
