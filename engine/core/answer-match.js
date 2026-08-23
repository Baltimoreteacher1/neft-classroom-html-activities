// Single source of truth for student answer checking across the whole site —
// lesson skill practice, Connect-check blanks, fill-in tables, homework pages,
// and the small-group studio. Tolerant of the ways grade-6 students actually
// type math: $ and comma formatting, fractions ("3/4"), mixed numbers
// ("1 1/2"), × vs x, an optional variable label ("m = 4" and "4" are the same
// answer), and optional trailing units ("24 sq. ft." and "24" are the same
// answer) — while never crediting a bare number against a non-numeric answer
// like "2 × 3 × 7".
//
// The rule this file encodes: a student is assessed on the VALUE they found,
// not on the bookkeeping around it. Naming the variable and labelling the unit
// are good habits worth suggesting, but they must never turn a correct answer
// into a red X.

export const norm = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    // Strip accents so "área" and "area" match. NFD (canonical) only — NFKD
    // would fold a superscript power like 2^3 into "23" and let a student's
    // "23" match it. (Powers are written out here rather than as glyphs: this
    // file is inlined into every homework page, and audit:homework reads a
    // literal superscript as "this page shows an exponents visual".)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[×·*]/g, "x")
    // Division was the one operation whose two spellings did NOT unify: "84/21"
    // normalised to "84/21" and "84 ÷ 21" stayed "84 ÷ 21", so a student who
    // typed the symbol on their keyboard instead of the one in the lesson was
    // marked wrong. Words are folded for the same reason (Joel, 2026-08-23:
    // "I don't want the tables to be so strict throughout").
    .replace(/÷/g, "/")
    .replace(/\bdivided by\b/g, "/")
    .replace(/\btimes\b/g, "x")
    .replace(/\bplus\b/g, "+")
    .replace(/\bminus\b/g, "-")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "")
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
    .replace(/\s*([x+\-=:/(),<>≤≥])\s*/g, "$1")
    .replace(/(\d)\s*r\s*(\d)/g, "$1r$2");

// Strict full-string numeric parse: mixed number, fraction, or plain number
// (with optional $ prefix / % suffix). Returns null for anything else — a
// stem like "x + 2 = 4" must never collapse to its first digit.
export const numberOf = (value) => {
  const text = String(value ?? "")
    .replace(/[$,]/g, "")
    .replace(/%\s*$/, "")
    .trim();
  const mixed = text.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[4]);
    if (!denominator) return null;
    const sign = mixed[1] === "-" ? -1 : 1;
    return sign * (Number(mixed[2]) + Number(mixed[3]) / denominator);
  }
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
  // Accept ".5" as well as "0.5" — students drop the leading zero constantly.
  const plain = text.match(/^-?(?:\d+(?:\.\d+)?|\.\d+)$/);
  return plain ? Number.parseFloat(plain[0]) : null;
};

// "m = 4", "m=4", "m is 4", "4 = m" and "4" are the same answer: the variable
// label restates the question, it is not the thing being assessed. ONLY "="
// is stripped — an inequality ("x > 5") keeps its relation, because there a
// bare "5" really is an incomplete answer. A multi-character left side
// ("3x = 12") is left alone: that is an equation, not a labelled value.
const LABEL_LEADING = /^([a-z][a-z0-9]?)\s*(?:=|\bis\b)\s*(.+)$/i;
const LABEL_TRAILING = /^(.+?)\s*=\s*([a-z][a-z0-9]?)$/i;

export const stripLabel = (value) => {
  const text = String(value ?? "").trim();
  const leading = text.match(LABEL_LEADING);
  if (leading) return leading[2].trim();
  const trailing = text.match(LABEL_TRAILING);
  if (trailing) return trailing[1].trim();
  return text;
};

// Units and labels are optional on both sides. "24", "24 sq. ft.",
// "24 square feet" and "24 boxes" are the same answer. The tail is only
// dropped when it contains a letter AND a number is left behind, so a power
// like 2^3 written with a superscript (no letter in the tail) and a word
// answer like "quotient" (nothing left) are never hollowed out.
const UNIT_TAIL = /[a-z°²³.\s/]+$/i;

// "24 sq. ft." → "24". Returns the input unchanged when there is no unit to
// drop, so it is safe to run over any answer.
export const stripUnit = (value) => {
  const text = String(value ?? "").trim();
  if (numberOf(text) != null) return text;
  const tail = text.match(UNIT_TAIL);
  if (!tail || !/[a-z]/i.test(tail[0])) return text;
  const head = text.slice(0, text.length - tail[0].length).trim();
  return head && numberOf(head) != null ? head : text;
};

export const numericValue = (value) => numberOf(stripUnit(value));

/* ── Phrasing ────────────────────────────────────────────────────────────────
   An answer that DESCRIBES a move has no single spelling: "Divide both sides
   by 3", "divide by 3" and "÷ 3" are one answer. phraseKey reduces such an
   answer to what it actually names — the operation and the number — with
   filler words and word order dropped.

   Word order has to be dropped for this to work at all, and dropping it is
   only safe while there is nothing for the order to mean. So the layer is
   refused the moment either side names TWO numbers: "56 ÷ 8" and "8 ÷ 56" are
   different answers, and no amount of flexibility may say otherwise. */

const PHRASE_FILLER = new Set([
  "a",
  "an",
  "the",
  "and",
  "then",
  "so",
  "is",
  "are",
  "be",
  "to",
  "of",
  "it",
  "by",
  "on",
  "in",
  "with",
  "for",
  "each",
  "every",
  "both",
  "side",
  "sides",
  "step",
  "steps",
  "we",
  "i",
  "you",
  "my",
  "your",
  "answer",
  "value",
  "number",
  "equation",
  "problem",
  "result",
  "over",
  "use",
  "using",
  "same",
  "get",
]);

const PHRASE_OPERATIONS = [
  [/\/|\bdividing\b|\bdivide\b|\bdivision\b/g, " divide "],
  // norm() has already folded × · * into "x" AND closed the spaces around it,
  // so "× 4" arrives as "x4" and "3 × 4" as "3x4". Read that x as multiply only
  // where a digit follows it; a trailing x ("3x = 12") is the variable and must
  // survive, or a coefficient would be torn off its term.
  [
    /(?<=\d)x(?=\d)|(?<=\s)x(?=\d)|(?<=\s)x(?=\s)|\bmultiplying\b|\bmultiply\b|\bmultiplication\b/g,
    " multiply ",
  ],
  [/\+|\badding\b|\badd\b|\baddition\b/g, " add "],
  [/\bsubtracting\b|\bsubtract\b|\bsubtraction\b/g, " subtract "],
];

const NUMBER_WORDS = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
};

export function phraseKey(value) {
  // NOTE: no template literals anywhere in this file — it is inlined verbatim
  // into homework HTML inside one (scripts/homework-answer-match.mjs).
  let text = " " + norm(value) + " ";
  for (const [pattern, word] of PHRASE_OPERATIONS) text = text.replace(pattern, word);
  const tokens = text
    .split(/[^a-z0-9.]+/)
    .map((token) => NUMBER_WORDS[token] || token)
    .filter((token) => token && !PHRASE_FILLER.has(token));
  return tokens.sort().join("|");
}

/** How many distinct numbers a phrase names — the guard on word order above. */
function numberCount(key) {
  return new Set(key.split("|").filter((token) => /^\d/.test(token))).size;
}

function phraseMatches(typed, answer) {
  // This layer exists for an answer that DESCRIBES a move in words. An answer
  // with no letters in it is notation, not description, and notation is already
  // handled by norm() — running it through a token bag can only lose
  // information. It did: phraseKey drops characters it has no token for, so
  // a power written with a superscript glyph reduced to its base, and 2^3 was
  // answered by 2. (Powers are written 2^3 here: audit:homework reads a literal
  // superscript in this file as "this page shows an exponents visual".)
  if (!/[a-z]/i.test(String(answer ?? ""))) return false;
  const answerKey = phraseKey(answer);
  const typedKey = phraseKey(typed);
  if (!answerKey || answerKey !== typedKey) return false;
  // Must name an operation — otherwise this is free prose, and two different
  // explanations built from the same words would compare equal.
  if (!/divide|multiply|add|subtract/.test(answerKey)) return false;
  return numberCount(answerKey) <= 1;
}

/* ── Either half of a stated equation ────────────────────────────────────────
   Work authored as "3x ÷ 3 = 21 ÷ 3" states the SAME move on both sides; a
   student who writes only the half that does the arithmetic has answered it.
   A half with no digit in it is refused, so "x = 7" is never answered by "x". */
function equationHalves(value) {
  const text = String(value ?? "").trim();
  if (!text.includes("=")) return [];
  return text
    .split("=")
    .map((part) => part.trim())
    .filter((part) => part && /\d/.test(part));
}

function matchesOne(typed, answer) {
  if (answer == null) return false;
  if (norm(typed) === norm(answer)) return true;
  const typedCore = stripLabel(typed);
  const answerCore = stripLabel(answer);
  if (norm(typedCore) === norm(answerCore)) return true;
  if (phraseMatches(typed, answer)) return true;
  // Only the halves of the ANSWER are opened up. Splitting what the STUDENT
  // typed would credit "7 = 8" against 7.
  for (const half of equationHalves(answer)) {
    if (norm(typed) === norm(half)) return true;
    if (norm(typedCore) === norm(stripLabel(half))) return true;
  }
  const target = numericValue(answerCore);
  if (target == null) return false;
  const value = numericValue(typedCore);
  return value != null && Math.abs(value - target) < 1e-9;
}

// "answer" may be a single accepted form or an array of equivalent forms.
export function isRight(input, answer) {
  if (answer == null) return false;
  if (!String(input ?? "").trim()) return false;
  const accepted = Array.isArray(answer) ? answer : [answer];
  return accepted.some((one) => matchesOne(input, one));
}

// The fuller authored form ("m = 4", "24 sq. ft.") when the student's own
// correct answer left the label or unit off. Callers use this to SUGGEST the
// fuller form after crediting the answer — never to withhold credit. Returns
// null when there is nothing extra worth showing.
export function fullerFormHint(input, answer) {
  const accepted = Array.isArray(answer) ? answer : [answer];
  const shown = accepted.find((a) => a != null && String(a).trim());
  if (shown == null) return null;
  const text = String(shown).trim();
  if (norm(input) === norm(text)) return null;
  // Only worth showing when the authored form adds a variable label or a unit
  // to a value the student already got right.
  const core = stripLabel(text);
  const addsLabel = core !== text;
  const addsUnit = numberOf(core) == null && numericValue(core) != null;
  return addsLabel || addsUnit ? text : null;
}
