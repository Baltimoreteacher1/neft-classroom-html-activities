// operand-misconception-tagger.mjs — authors `misconceptionTags` on PROSE
// multiple-choice items by reconstructing the problem's arithmetic model from
// the numbers in its own stem.
//
// WHY THIS EXISTS
//
// reports/misconception-coverage.md is blunt about where the gap is: 1,947 of
// 2,659 multiple-choice items are word problems, and the runtime predictor
// (engine/core/misconceptions.js scanExpression) can only infer an error from a
// stem it can parse as arithmetic. For prose, an authored `misconceptionTags`
// array is the ONLY detection path — and without one the small-group adaptive
// next-move has nothing to route on. 109 of the 204 small-group lessons carried
// zero tags before this ran.
//
// THE HONESTY CONSTRAINT
//
// An authored tag is ground truth to detectMisconception(); a wrong tag tells a
// student their thinking was something it wasn't. So this never guesses from
// prose. It tags only when the problem's model is RECOVERABLE:
//
//   1. Pull the numbers out of the stem.
//   2. Find every (a, b, op) over those numbers that reproduces the correct
//      answer EXACTLY. If the surviving models disagree about the operation
//      (2 + 2 and 2 × 2 both give 4), the item is ambiguous and gets nothing.
//   3. With the operation known, test each wrong choice against the alternate
//      models on the SAME operands. A distractor that equals "added when the
//      problem multiplies" is that error — not a guess about it.
//   4. A distractor matching two different named errors keeps NO tag.
//
// Lexical guards are used only to DISAMBIGUATE between two numerically
// identical readings (b/a is `ratio-inverted` in a stem about ratios and
// `op-reversed-division` otherwise), never to originate a tag.
//
// Existing `misconceptionTags` are never touched — hand-authored judgement, and
// the exact ×10^k / negation rules in tools/author-misconception-tags.mjs, both
// outrank derivation. This module fills the nulls those leave behind.

/** Numbers appearing in the choices are answers, not operands; only the stem's
 *  numbers describe the problem. Capped to keep the pair sweep bounded and to
 *  refuse novel-length stems whose numbers are mostly narrative. */
const MAX_STEM_NUMBERS = 8;

/* An estimation answer is written "About 80", and that one leading word was
   enough to make the whole item undiagnosable: the parse failed, so the model
   could not be reconstructed, so a distractor of "About 24" (20 + 4 where the
   problem multiplies) went unnamed across every estimation lesson in Unit 1.
   Only these hedges are stripped — a leading word in general is prose, and prose
   must still refuse to parse, or "Runner B" would become a number. */
const HEDGE = /^(about|approximately|around|roughly|nearly|almost|exactly|≈)\s+/i;

/** Tolerant numeric parse: hedge word, $, commas, spaces, %, trailing units. */
export function parseQuantity(text) {
  const raw = String(text ?? "")
    .trim()
    .replace(HEDGE, "");
  if (!raw) return null;
  const cleaned = raw
    .replace(/[$,\s]/g, "")
    .replace(/%$/, "")
    .replace(/[a-zA-Z°²³]+$/u, "");
  const frac = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (frac && Number(frac[2]) !== 0) return Number(frac[1]) / Number(frac[2]);
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** The operands a word problem hands you: every number written in its stem. */
export function stemNumbers(stem) {
  const out = [];
  for (const match of String(stem ?? "").matchAll(/\d+(?:\.\d+)?/g)) {
    const value = Number(match[0]);
    if (Number.isFinite(value)) out.push(value);
  }
  return out.slice(0, MAX_STEM_NUMBERS);
}

/** Float-safe equality at the scale of the values being compared. */
const near = (a, b) =>
  a !== null &&
  b !== null &&
  Number.isFinite(a) &&
  Number.isFinite(b) &&
  Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

const has = (text, re) => re.test(String(text ?? ""));

/** Every ordered pair (a, b) of distinct stem positions. */
function pairs(numbers) {
  const out = [];
  for (let i = 0; i < numbers.length; i++)
    for (let j = 0; j < numbers.length; j++) if (i !== j) out.push([numbers[i], numbers[j]]);
  return out;
}

/**
 * Binary models over the stem's numbers that reproduce the correct answer.
 * Returns null when the models disagree about which operation the problem is —
 * that ambiguity is the whole reason most naive taggers are unsafe.
 */
export function binaryModel(numbers, correct) {
  const models = [];
  for (const [a, b] of pairs(numbers)) {
    if (near(a * b, correct)) models.push({ op: "*", a, b });
    if (near(a + b, correct)) models.push({ op: "+", a, b });
    if (near(a - b, correct)) models.push({ op: "-", a, b });
    if (b !== 0 && near(a / b, correct)) models.push({ op: "/", a, b });
  }
  const ops = new Set(models.map((model) => model.op));
  return ops.size === 1 ? { op: models[0].op, models } : null;
}

/** Named errors a distractor can express under a known binary model. */
function binaryTags(op, models, wrong, stem) {
  const hits = new Set();
  for (const { a, b } of models) {
    if (op === "*") {
      if (near(a + b, wrong)) hits.add("op-added-instead-of-multiplied");
      if (b !== 0 && near(a / b, wrong)) hits.add("op-divided-instead-of-multiplied");
    } else if (op === "+") {
      if (near(a * b, wrong)) hits.add("op-multiplied-instead-of-added");
    } else if (op === "-") {
      if (near(b - a, wrong)) hits.add("op-reversed-subtraction");
    } else if (op === "/") {
      if (near(a * b, wrong)) hits.add("op-multiplied-instead-of-divided");
      // b/a is the same arithmetic under two different names. A stem that talks
      // about ratios means the student flipped the ratio; otherwise they divided
      // in the wrong order. Same tag either way if the stem says both.
      if (a !== 0 && near(b / a, wrong))
        hits.add(has(stem, /\bratios?\b/i) ? "ratio-inverted" : "op-reversed-division");
      // "Gave the total instead of the unit rate" is only a meaningful reading
      // when the stem actually asks for a per-one amount.
      if (has(stem, /\bper\b|\bunit rate\b|\beach\b/i) && (near(a, wrong) || near(b, wrong)))
        hits.add("rate-not-per-one");
    }
  }
  return hits;
}

/** Errors that need more than two operands: means, areas, volumes. */
function structuralTags(numbers, correct, wrong, stem) {
  const hits = new Set();
  const sum = numbers.reduce((total, value) => total + value, 0);
  // Averaged the set, student summed it. Needs 3+ values so a two-number stem
  // (where mean and half-the-sum are the same shape) cannot trigger it.
  if (numbers.length >= 3 && near(sum / numbers.length, correct) && near(sum, wrong))
    hits.add("stat-summed-instead-of-averaged");

  for (const [a, b] of pairs(numbers)) {
    // Triangle area without the half.
    if (has(stem, /\btriangle\b/i) && near((a * b) / 2, correct) && near(a * b, wrong))
      hits.add("geom-triangle-area-no-half");
    // Area ↔ perimeter, in both directions.
    if (has(stem, /\bperimeter\b/i) && has(stem, /\barea\b/i)) {
      if (near(a * b, correct) && near(2 * (a + b), wrong)) hits.add("measure-area-perimeter-swap");
      if (near(2 * (a + b), correct) && near(a * b, wrong)) hits.add("measure-area-perimeter-swap");
    }
  }
  for (const [a, b] of pairs(numbers))
    for (const c of numbers) {
      if (c === a && c === b) continue;
      const volume = a * b * c;
      const surface = 2 * (a * b + a * c + b * c);
      if (near(volume, correct) && near(a + b + c, wrong)) hits.add("geom-volume-added-dimensions");
      if (has(stem, /surface area/i) && near(surface, correct) && near(volume, wrong))
        hits.add("geom-surface-area-as-volume");
    }
  return hits;
}

/**
 * Tags for one item, or null when nothing is derivable.
 *
 * @param {object} item  a lesson practice item ({ stem, choices, correctIndex })
 * @returns {(string|null)[]|null} one entry per choice, taxonomy ids verbatim
 */
export function deriveOperandTags(item) {
  if (!item || typeof item !== "object") return null;
  if (item.misconceptionTags) return null;
  if (!Array.isArray(item.choices) || item.choices.length < 2) return null;
  const correctIndex = item.correctIndex;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= item.choices.length)
    return null;
  const correct = parseQuantity(item.choices[correctIndex]);
  if (correct === null) return null;
  const numbers = stemNumbers(item.stem);
  if (numbers.length < 2) return null;

  const model = binaryModel(numbers, correct);
  const tags = item.choices.map((choice, index) => {
    if (index === correctIndex) return null;
    const wrong = parseQuantity(choice);
    if (wrong === null || near(wrong, correct)) return null;
    const hits = new Set([
      ...(model ? binaryTags(model.op, model.models, wrong, item.stem) : []),
      ...structuralTags(numbers, correct, wrong, item.stem),
    ]);
    // Two names for one distractor is an ambiguous diagnosis. Say nothing.
    return hits.size === 1 ? [...hits][0] : null;
  });
  return tags.some(Boolean) ? tags : null;
}
