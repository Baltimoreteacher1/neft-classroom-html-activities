/**
 * Exact value of a multiple-choice option, for deciding whether two options are
 * the same number written two ways ("5/2" and "2 1/2").
 *
 * Design rule, inherited from validate-math.mjs: anything not decidable returns
 * null and is SKIPPED by the caller, never failed. A false alarm in a content
 * gate is worse than a miss, because it trains the reader to ignore the gate.
 */
import { evaluateExpression, stripUnits } from "./rational.mjs";

/**
 * "60–63 inches" is a histogram bin label, not a subtraction. An en/em dash
 * between two bare numbers is a range literal; evaluating it as 60 − 63 made
 * every bin in a four-bin item collapse to the same value (−3) and looked like
 * four duplicate choices.
 */
const RANGE_LITERAL = /^\s*-?[\d.,]+\s*[–—]\s*-?[\d.,]+/;

/**
 * Items that ask which FORM is correct, not which VALUE. Equal-valued options
 * are the whole point of these — "2 × 2 × 3 × 3" and "6 × 6" both make 36, and
 * the student's job is to pick the prime factorization. Flagging them would
 * report the curriculum's correct behavior as a defect.
 */
const FORM_SELECTION =
  /prime factoriz|factor tree|which (?:expression|grouping|form|equation|shows|represents)|expression (?:means|shows|represents|for)|equivalent (?:expression|form)|another way to write|same as|associative|commutative|distributive property|order of operations|which .{0,30}(?:easiest|mentally)|what does .{1,40} mean|meaning of/i;

const STEM_FIELDS = ["stem", "prompt", "question", "problem", "given", "text"];

/** The stem text of an item node, or "" when it has none. */
export function stemOf(node) {
  for (const f of STEM_FIELDS) if (typeof node[f] === "string" && node[f].trim()) return node[f];
  return "";
}

/** Does this item ask which form/representation is right, rather than which value? */
export function isFormSelection(node) {
  return FORM_SELECTION.test(stemOf(node));
}

/**
 * A canonical key for a choice, such that two choices share a key iff they are
 * the same number(s). Returns null when the choice is not fully decidable.
 *
 * Every comma/"or"-separated term must parse. Comparing only the first term —
 * which parseAnswerValue does, by design, for answer matching — made
 * "70 + 8.5, 78 + 0.5, 80 − 1.5" and "70 + 8.5, 78 + 5, 80 − 1.5" look
 * identical and produced 500+ phantom duplicates on the first sweep.
 *
 * The unit travels with each term: "50" and "50%" are different options.
 */
export function choiceValue(raw) {
  if (typeof raw === "number") return String(raw);
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || RANGE_LITERAL.test(s)) return null;
  const terms = s
    .split(/\s*(?:,|;|\bor\b)\s*/i)
    .map((t) => t.trim())
    .filter(Boolean);
  if (!terms.length) return null;
  const parts = [];
  for (const term of terms) {
    const { text, unit } = stripUnits(term);
    const value = evaluateExpression(text);
    if (value === null) return null;
    parts.push(`${value.toString()}${unit}`);
  }
  return parts.join("|");
}

/** The keyed index of an MC node, or null when it does not declare one. */
export function keyIndexOf(node) {
  if (Number.isInteger(node.correctIndex)) return node.correctIndex;
  if (Number.isInteger(node.answer)) return node.answer;
  return null;
}
