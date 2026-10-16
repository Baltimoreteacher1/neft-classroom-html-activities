// Text helpers for read-aloud. Pure functions, no DOM: unit-tested in
// ls-speech-text.test.mjs.
//
// Read-aloud highlights the word being spoken, so every word the page shows is
// kept as its own token. A token carries the SPOKEN form (math notation
// spelled out) separately from the DISPLAYED form, and the chunk builder
// records where each token starts inside the text handed to the voice, so the
// voice's "boundary" events can be mapped back to the word on screen.

/** @typedef {"en" | "es"} Lang */
/** @typedef {{ text: string, lang: Lang, breakAfter?: boolean }} SpeakToken */
/**
 * @typedef {object} Chunk
 * @property {Lang} lang
 * @property {string} text what the voice is given
 * @property {number[]} starts start offset of each token inside `text`
 * @property {number[]} indices which input token each offset belongs to
 */

const SYMBOLS = {
  en: {
    "×": "times",
    "÷": "divided by",
    "=": "equals",
    "+": "plus",
    "<": "is less than",
    ">": "is greater than",
    "≤": "is less than or equal to",
    "≥": "is greater than or equal to",
    "≠": "is not equal to",
    "≈": "is about",
    "%": "percent",
    "°": "degrees",
    π: "pi",
    "√": "square root of",
  },
  es: {
    "×": "por",
    "÷": "dividido entre",
    "=": "es igual a",
    "+": "más",
    "<": "es menor que",
    ">": "es mayor que",
    "≤": "es menor o igual que",
    "≥": "es mayor o igual que",
    "≠": "no es igual a",
    "≈": "es aproximadamente",
    "%": "por ciento",
    "°": "grados",
    π: "pi",
    "√": "raíz cuadrada de",
  },
};

const UNITS = {
  en: {
    mm: "millimeters",
    cm: "centimeters",
    km: "kilometers",
    m: "meters",
    in: "inches",
    ft: "feet",
    yd: "yards",
    mi: "miles",
  },
  es: {
    mm: "milímetros",
    cm: "centímetros",
    km: "kilómetros",
    m: "metros",
    in: "pulgadas",
    ft: "pies",
    yd: "yardas",
    mi: "millas",
  },
};

const WORDS = {
  en: { neg: "negative", minus: "minus", over: "over", to: "to", sq: "squared", cu: "cubed" },
  es: { neg: "menos", minus: "menos", over: "sobre", to: "a", sq: "al cuadrado", cu: "al cubo" },
};

/**
 * What a voice should say for one displayed word. Numbers and the words around
 * them are never rewritten; only notation a voice would mangle is spelled out.
 * @param {string} raw one whitespace-free word as displayed
 * @param {Lang} lang
 * @returns {string}
 */
export function verbalizeToken(raw, lang) {
  const sym = SYMBOLS[lang];
  const w = WORDS[lang];
  const unitWords = UNITS[lang];
  // Pictures and separators are for the eye; a voice would read "game controller".
  let s = String(raw)
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/^[·•|▪◦]+$/u, "");
  if (!s) return "";

  // A bare dash between two spaced words is a minus sign.
  if (/^[-−–]$/.test(s)) return w.minus;

  // 12 cm² / m^3: "square centimeters" / "centímetros cúbicos".
  s = s.replace(/(?<![A-Za-z])(mm|cm|km|m|in|ft|yd|mi)(?:²|\^2)/g, (_m, u) =>
    lang === "en" ? ` square ${unitWords[u]}` : ` ${unitWords[u]} cuadrados`,
  );
  s = s.replace(/(?<![A-Za-z])(mm|cm|km|m|in|ft|yd|mi)(?:³|\^3)/g, (_m, u) =>
    lang === "en" ? ` cubic ${unitWords[u]}` : ` ${unitWords[u]} cúbicos`,
  );

  // x², y^3, 2^5
  s = s.replace(/([\p{L}\d)])(?:²|\^2)/gu, `$1 ${w.sq}`);
  s = s.replace(/([\p{L}\d)])(?:³|\^3)/gu, `$1 ${w.cu}`);
  s = s.replace(
    /([\p{L}\d)])\^(\d+)/gu,
    lang === "en" ? "$1 to the power of $2" : "$1 a la potencia $2",
  );

  s = s.replace(/(\d+)\s?:\s?(\d+)/g, `$1 ${w.to} $2`);
  s = s.replace(/(\d+)\/(\d+)/g, `$1 ${w.over} $2`);

  s = s.replace(/\$(\d[\d,]*(?:\.\d+)?)/g, lang === "en" ? "$1 dollars" : "$1 dólares");

  // A minus sign in front of a number is "negative", not subtraction.
  s = s.replace(/(^|[(\[=+×÷<>])[-−](?=\.?\d)/g, `$1${w.neg} `);

  s = s.replace(/[×÷=+<>≤≥≠≈%°π√]/g, (ch) => ` ${sym[/** @type {keyof typeof sym} */ (ch)]} `);
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Break a block of text into the words a reader sees.
 * @param {string} text
 * @returns {{ start: number, end: number, text: string }[]}
 */
export function splitWords(text) {
  const out = [];
  const re = /\S+/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

const SENTENCE_END = /[.!?:;]["')\]”’]?$/;

/**
 * Group tokens into utterances. Long unbroken speech is cut off by some
 * browsers after about fifteen seconds, so text is split at sentence ends and
 * at the end of each block (heading, paragraph, list item), and always when the
 * language changes. Each chunk remembers where every token begins.
 * @param {SpeakToken[]} tokens
 * @param {{ maxChars?: number, minSentence?: number }} [opts]
 * @returns {Chunk[]}
 */
export function buildChunks(tokens, { maxChars = 220, minSentence = 40 } = {}) {
  /** @type {Chunk[]} */
  const chunks = [];
  /** @type {Chunk | null} */
  let cur = null;
  tokens.forEach((tok, index) => {
    let spoken = tok.text;
    if (!spoken) return;
    // A heading or list item has no full stop; a pause makes it sound like one.
    if (tok.breakAfter && !/[.!?:;,]$/.test(spoken)) spoken += ".";
    if (cur && (cur.lang !== tok.lang || cur.text.length + 1 + spoken.length > maxChars)) {
      chunks.push(cur);
      cur = null;
    }
    if (!cur) cur = { lang: tok.lang, text: "", starts: [], indices: [] };
    if (cur.text) cur.text += " ";
    cur.starts.push(cur.text.length);
    cur.indices.push(index);
    cur.text += spoken;
    if (tok.breakAfter || (SENTENCE_END.test(spoken) && cur.text.length >= minSentence)) {
      chunks.push(cur);
      cur = null;
    }
  });
  if (cur) chunks.push(cur);
  return chunks;
}

/**
 * The input token a voice is speaking at `charIndex` of a chunk's text.
 * @param {Chunk} chunk
 * @param {number} charIndex
 * @returns {number}
 */
export function tokenIndexAt(chunk, charIndex) {
  let lo = 0;
  let hi = chunk.starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (chunk.starts[mid] <= charIndex) lo = mid;
    else hi = mid - 1;
  }
  return chunk.indices[lo];
}
