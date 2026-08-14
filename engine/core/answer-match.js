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
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "")
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
    .replace(/\s*([x+\-=:/(),<>≤≥])\s*/g, "$1")
    // Restore the leading zero students drop (".5" becomes "0.5"). The numeric
    // parse below already accepts a bare ".5", but only when that number is the
    // WHOLE answer — so a composite answer like "0.5 = 50%" still red-X'd a
    // student who typed ".5 = 50%". Normalizing here covers every shape, and
    // because both sides run through this same function it can only equate
    // values that were already equal. Anchored on a non-digit, non-dot so an
    // interior point ("2.5") and a run of dots are left alone.
    .replace(/(^|[^\d.])\.(\d)/g, (_m, before, digit) => before + "0." + digit)
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

function matchesOne(typed, answer) {
  if (answer == null) return false;
  if (norm(typed) === norm(answer)) return true;
  const typedCore = stripLabel(typed);
  const answerCore = stripLabel(answer);
  if (norm(typedCore) === norm(answerCore)) return true;
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
