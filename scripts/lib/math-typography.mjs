// Math typography for text a student reads: a true minus sign (U+2212) for negatives and subtraction, × for "3 x 4".
// Applied to display text only. Answers, ids, kinds and figure specs are left alone, so every check still compares what it did.
const SKIP = new Set([
  "id",
  "k",
  "g",
  "kind",
  "a",
  "ans",
  "answer",
  "level",
  "lv",
  "seed",
  "viz",
  "p",
  "gen",
  "meta",
  "tag",
  "type",
]);
const NEG = /(^|[\s(\[{=,;:/×÷+±<>≤≥≠])-(?=\.?\d)/g;
const SUB = /(\d|\)|[a-z]) - (?=[\d(a-z])/gi;
const TIMES = /(\d)\s[x*]\s(?=\d)/g;

export function typographize(/** @type {string} */ s) {
  return String(s).replace(NEG, "$1−").replace(SUB, "$1 − ").replace(TIMES, "$1 × ");
}

/** Deep copy of an item list with display strings typographized. `p` (an activity's parameters) and `a` (answers) are untouched. */
export function typographizeItems(/** @type {any} */ v, /** @type {string} */ key = "") {
  if (typeof v === "string") return SKIP.has(key) ? v : typographize(v);
  if (Array.isArray(v)) return v.map((x) => typographizeItems(x, key));
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, SKIP.has(k) ? x : typographizeItems(x, k)]),
    );
  return v;
}
