// One voice for student-facing microcopy (docs/style-guide.md section 9).
//
// The ENGINE reads this file: the coaching lines it shows when a student misses
// (so no component invents a bare "Try again"), the test for authored feedback
// that says "wrong" without saying what to try, the phrases no lesson may use,
// and the preferred name for each concept. tools/validate-microcopy.mjs reads it
// too, so the gate and the product can never disagree about what is allowed.
//
// Pure data and pure functions: no DOM, so Node can import it.

// ---------------------------------------------------------------------------
// 1. Feedback: say what to try
// ---------------------------------------------------------------------------

const LEAD = /^(?:not quite|not yet|incorrect|wrong|oops|nope|sorry|almost)\b[\s.,:;!—–-]*/i;
// What is left after the lead says nothing: only a request to repeat.
const BARE_RETRY =
  /^(?:please\s+)?(?:try|check|look|go|have)(?:\s+(?:it|that|this))?\s+(?:again|once more|one more time|another (?:look|go|try))(?:\s+(?:and|then)\s+try\s+(?:it\s+)?(?:again|once more))?[\s.!?]*$/i;
// Authored boilerplate that never names the mistake.
const BOILERPLATE =
  /^(?:re-?read the problem(?: carefully)?|take another look)(?: and)? try again[\s.!?]*$/i;

/**
 * True when feedback says "wrong" (or "try again") and nothing else: it names no
 * quantity, step or idea to look at. Marks and emoji are ignored.
 */
export function isGenericFeedback(text) {
  const raw = String(text ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[✓✔✗✘❌✅\u{1F4A1}\u{1F44D}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return false;
  if (BOILERPLATE.test(raw)) return true;
  if (!LEAD.test(raw)) return false;
  const rest = raw.replace(LEAD, "").trim();
  return rest === "" || BARE_RETRY.test(rest);
}

/**
 * What the engine says after a miss when the lesson supplied nothing better.
 * Every line names a thing to look at, never just "try again". `kind`:
 *   choice   a multiple-choice miss with no authored or diagnosed feedback
 *   step     a miss on one line of a worked solution
 *   answer   a typed answer that did not match
 *   retry    asking for a second go after a hint was shown
 *   tool     a miss inside an interactive model
 */
export const MISS_COACH = {
  choice: {
    en: "Not quite. Reread the question, find what it asks for, and pick again.",
    es: "No exactamente. Vuelve a leer la pregunta, busca lo que pide y elige otra vez.",
  },
  step: {
    en: "Not yet. Check the line above for a sign or an operation, then fix this step.",
    es: "Todavía no. Revisa la línea de arriba para ver el signo o la operación y corrige este paso.",
  },
  answer: {
    en: "Not yet. Compare each number you used with the numbers in the problem.",
    es: "Todavía no. Compara cada número que usaste con los números del problema.",
  },
  retry: {
    en: "Not quite. Picture it with objects or a quick sketch, then answer again.",
    es: "No exactamente. Imagínalo con objetos o un dibujo rápido y responde otra vez.",
  },
  tool: {
    en: "Not quite. Look at the model again and match each part to the question.",
    es: "No exactamente. Mira el modelo otra vez y relaciona cada parte con la pregunta.",
  },
};

/**
 * Authored per-choice feedback that carries no information about the chosen
 * distractor. These exact strings are templated across hundreds of lesson items;
 * the multiple-choice component recognises them so a diagnosed misconception
 * (or a coaching line) takes precedence. They are DETECTED here, never shown.
 */
export const AUTHORED_BOILERPLATE = [
  "Check your operation. Re-read what the problem asks.",
  "Double-check: verify the math step-by-step against the question.",
  "Re-read the problem carefully and try again.",
  "Take another look and try again.",
  "Not quite — try again.",
];

/** The coaching line for a kind of miss, in the requested language. */
export function missCoach(kind = "choice", lang = "en") {
  const entry = MISS_COACH[kind] || MISS_COACH.choice;
  return lang === "es" ? entry.es : entry.en;
}

// ---------------------------------------------------------------------------
// 2. Phrases a student should never read
// ---------------------------------------------------------------------------
// Only phrases whose every observed use was a problem. "clearly" and "simply"
// were tried and dropped: all 41 hits in the 84 core configs were ordinary
// adverbs ("label units clearly", "simply divide"), not talking down.

export const BANNED_PHRASES = [
  {
    id: "belittling",
    re: /\b(?:obviously|of course|everyone knows|as you (?:can )?see|trivial|stupid|dumb|silly|easy peasy|super easy|so easy|that'?s easy|it'?s easy)\b/i,
    why: "implies the student should already know",
  },
  {
    id: "blaming",
    re: /\b(?:you (?:failed|messed up|were wrong|are wrong|ignored|didn'?t (?:read|listen|pay attention))|your fault)\b/i,
    why: "blames the student",
  },
  {
    id: "babyish",
    re: /\b(?:kiddos?|little ones|good boy|good girl|boys and girls,)\b/i,
    why: "babyish",
  },
  { id: "label-esol", re: /\bESOL\b/, why: "never label a student ESOL (lesson-authoring rule)" },
  {
    id: "slangy",
    re: /\b(?:oops|whoops|uh[- ]oh|yikes|nope)\b/i,
    why: "sarcastic or babyish tone",
  },
];

/** At most this many exclamation marks in one string (one per screen overall). */
export const MAX_EXCLAMATIONS_PER_STRING = 1;

// ---------------------------------------------------------------------------
// 3. One concept, one name
// ---------------------------------------------------------------------------
// `variants` are other spellings of the SAME concept. `enforce: true` means the
// variant is a spelling or near-synonym nobody needs (the gate fails on it);
// `enforce: false` means both names are legitimate in places (a tool is called
// "Bar Model", a student says "average") and the gate only reports the split.

export const TERMS = [
  { concept: "percent", preferred: "percent", variants: [/\bper cent\b/i], enforce: true },
  {
    concept: "box plot",
    preferred: "box plot",
    variants: [/\bbox[- ]and[- ]whisker (?:plot|diagram|graph)s?\b/i, /\bboxplot\b/i],
    enforce: true,
  },
  {
    concept: "greatest common factor",
    preferred: "greatest common factor",
    variants: [/\bgreatest common divisor\b/i, /\bhighest common factor\b/i],
    enforce: true,
  },
  {
    concept: "least common multiple",
    preferred: "least common multiple",
    variants: [/\blowest common multiple\b/i],
    enforce: true,
  },
  {
    concept: "simplest form",
    preferred: "simplest form",
    variants: [/\blowest terms\b/i],
    enforce: true,
  },
  {
    concept: "ordered pair",
    preferred: "ordered pair",
    variants: [/\bcoordinate pair\b/i],
    enforce: true,
  },
  {
    concept: "negative number",
    preferred: "negative number",
    variants: [/\bminus number\b/i],
    enforce: true,
  },
  { concept: "dot plot", preferred: "dot plot", variants: [/\bline plot\b/i], enforce: false },
  {
    concept: "independent variable",
    preferred: "independent variable",
    variants: [/\binput\b/i, /\bx-value\b/i],
    enforce: false,
  },
  {
    concept: "dependent variable",
    preferred: "dependent variable",
    variants: [/\boutput\b/i, /\by-value\b/i],
    enforce: false,
  },
  {
    concept: "unit rate",
    preferred: "unit rate",
    variants: [/\brate per (?:one|1)\b/i, /\bper[- ]unit rate\b/i],
    enforce: false,
  },
  {
    concept: "tape diagram",
    preferred: "tape diagram",
    variants: [/\bbar model\b/i, /\bstrip diagram\b/i, /\bbar diagram\b/i],
    enforce: false,
  },
  {
    concept: "equation",
    preferred: "equation",
    variants: [/\bnumber sentence\b/i, /\bmath sentence\b/i],
    enforce: false,
  },
  { concept: "variable", preferred: "variable", variants: [/\bplaceholder\b/i], enforce: false },
  { concept: "mean", preferred: "mean", variants: [/\baverage\b/i], enforce: false },
];

/** The replacement a fixer may apply for an enforced variant (the preferred term). */
export function preferredFor(variantText) {
  for (const t of TERMS) {
    if (!t.enforce) continue;
    if (t.variants.some((v) => v.test(variantText))) return t.preferred;
  }
  return null;
}
