// A short, kind note about the likely slip behind a wrong whole-number answer ("that adds; this asks for the
// difference"). It names the idea to check and never says or hints at the right number.
import { t } from "./i18n.js";

const ARITHMETIC = /^(-?\d[\d,]*) ([+−×÷]) \(?(-?\d[\d,]*)\)? = \?$/;
const num = (text) => Number(String(text).replaceAll(",", "").replace("−", "-"));

const DETECTABLE_PATTERNS = {
  subtractInsteadOfAdding: () => t("Subtracted instead of adding"),
  omittedAddend: () => t("Left out an addend"),
  addedInsteadOfSubtracting: () => t("Added instead of subtracting"),
  reversedSubtraction: () => t("Reversed the subtraction"),
  addedFactors: () => t("Added the factors instead of multiplying"),
  oneGroupOff: () => t("Off by one equal group"),
  subtractedInsteadOfDividing: () => t("Subtracted instead of dividing"),
  multipliedInsteadOfDividing: () => t("Multiplied instead of dividing"),
  addedInsteadOfDividing: () => t("Added instead of dividing"),
};

export function classifyMistake(item, raw) {
  if (item?.kind !== "number") return null;
  const match = String(item.expr || item.question || "").match(ARITHMETIC);
  const submitted = num(raw);
  const answer = num(item.answers?.[0]);
  if (!match || !Number.isFinite(submitted) || !Number.isFinite(answer) || submitted === answer) return null;
  const [a, b, op] = [num(match[1]), num(match[3]), match[2]];
  let id = null;
  if (op === "+" && submitted === Math.abs(a - b)) id = "subtractInsteadOfAdding";
  else if (op === "+" && (submitted === a || submitted === b)) id = "omittedAddend";
  else if (op === "−" && submitted === a + b) id = "addedInsteadOfSubtracting";
  else if (op === "−" && submitted === b - a) id = "reversedSubtraction";
  else if (op === "×" && submitted === a + b) id = "addedFactors";
  else if (op === "×" && [answer + a, answer - a, answer + b, answer - b].includes(submitted)) id = "oneGroupOff";
  else if (op === "÷" && submitted === a - b) id = "subtractedInsteadOfDividing";
  else if (op === "÷" && submitted === a * b) id = "multipliedInsteadOfDividing";
  else if (op === "÷" && submitted === a + b) id = "addedInsteadOfDividing";
  return id ? { id, label: DETECTABLE_PATTERNS[id]() } : null;
}

export const isKnownMistakeCategory = (id) => Object.hasOwn(DETECTABLE_PATTERNS, id);
export const mistakeCategoryLabel = (id) => isKnownMistakeCategory(id) ? DETECTABLE_PATTERNS[id]() : "";

export function likelyMistake(item, raw) {
  if (item?.kind !== "number") return "";
  const match = String(item.expr || item.question || "").match(ARITHMETIC);
  const submitted = num(raw);
  const answer = num(item.answers?.[0]);
  if (!match || !Number.isFinite(submitted) || !Number.isFinite(answer) || submitted === answer) return "";
  const [a, b, op] = [num(match[1]), num(match[3]), match[2]];
  const gap = Math.abs(submitted - answer);
  const off = (size) => gap === size;

  if (op === "+") {
    if (submitted === Math.abs(a - b)) return t("That takes the numbers apart. This problem puts them together.");
    if (submitted === a || submitted === b) return t("That is one of the numbers in the problem. Add the other one in too.");
  } else if (op === "−") {
    if (submitted === a + b) return t("That puts the numbers together. This problem asks how much is left or how far apart they are.");
    if (submitted === b - a) return t("Check the order. Start with the whole and take the smaller part away.");
  } else if (op === "×") {
    if (submitted === a + b) return t("That adds the numbers. Multiplying counts equal groups.");
    if (submitted === answer + a || submitted === answer - a || submitted === answer + b || submitted === answer - b)
      return t("You are one group away. Check how many groups there are and how many are in each.");
  } else if (op === "÷") {
    if (submitted === a - b) return t("That takes one group away. Division asks how many equal groups fit.");
    if (submitted === a * b) return t("That multiplies. Division is the opposite: how many times does the small number fit in the big one?");
    if (submitted === a + b) return t("That puts the numbers together. Division splits a total into equal groups.");
  }
  if (off(1)) return t("Close! Count again carefully. You are one away.");
  if (off(10) || off(100) || off(1000)) return t("Check the place values. A ten, hundred, or thousand may have been missed or regrouped wrongly.");
  return "";
}

// Named slips for "A student solved this" rounds (mistake-bank.js). Each id has a short label the learner can pick
// as the cause and a kind note shown once the error is found; none of them states the right number.
// The place-value note is the same slip likelyMistake() names for a wrong whole-number answer.
const SLIPS = {
  "no-regroup": () => ({ label: t("Forgot to carry"), note: t("When the ones add up to ten or more, a ten moves to the tens place. That ten was left behind.") }),
  "place-value": () => ({ label: t("Place value slip"), note: t("Check the place values. A ten, hundred, or thousand may have been missed or regrouped wrongly.") }),
  "kept-whole": () => ({ label: t("Used a part twice"), note: t("A number was split into parts, but the whole number was still used as well.") }),
  "both-up": () => ({ label: t("Changed both numbers the same way"), note: t("To keep an addition the same, one number goes up by as much as the other goes down.") }),
  opposite: () => ({ label: t("Moved the numbers in opposite directions"), note: t("To keep a subtraction the same, move both numbers the same way.") }),
  "small-from-big": () => ({ label: t("Subtracted the smaller digit from the larger"), note: t("In each place the top digit comes first. When it is smaller, regroup or let the result be negative.") }),
  "one-part": () => ({ label: t("Used the number on only one part"), note: t("A multiplier or divisor has to reach every part inside the parentheses.") }),
  "add-across": () => ({ label: t("Added the bottom numbers too"), note: t("The bottom number names the size of the pieces. Pieces of the same size are counted, and their size stays the same.") }),
  "cd-top": () => ({ label: t("Changed the bottom but not the top"), note: t("When the pieces get a new size, the top must change by the same factor as the bottom.") }),
  "mul-bottom": () => ({ label: t("Multiplied the tops but not the bottoms"), note: t("When multiplying fractions, multiply the tops together and the bottoms together.") }),
  "no-flip": () => ({ label: t("Did not flip the second fraction"), note: t("Dividing by a fraction means multiplying by its flip, the reciprocal.") }),
  "flip-first": () => ({ label: t("Flipped the first fraction"), note: t("Only the fraction you divide by is flipped.") }),
  "add-not-mult": () => ({ label: t("Added where it should multiply"), note: t("To keep a fraction or ratio the same size, multiply or divide both parts by the same number. Adding changes it.") }),
  "diff-factor": () => ({ label: t("Divided the top only"), note: t("To keep a fraction the same size, divide the top and the bottom by the same number.") }),
  "wrong-way": () => ({ label: t("Multiplied where it should divide"), note: t("Finding a fraction of a number: divide by the bottom number, then multiply by the top.") }),
  "point-count": () => ({ label: t("Miscounted the decimal places"), note: t("The product has as many decimal places as both factors together. Write each decimal as a fraction to check.") }),
  "pct-shift": () => ({ label: t("Moved the decimal point the wrong way"), note: t("Percent means per hundred, so the decimal point moves two places to the left.") }),
  "no-hundred": () => ({ label: t("Forgot to divide by 100"), note: t("Percent means per hundred. Divide by 100 before you multiply.") }),
  "change-only": () => ({ label: t("Gave only the change, not the new amount"), note: t("Check what the question asks for: the amount after the increase or decrease.") }),
  "flip-ratio": () => ({ label: t("Flipped the fraction"), note: t("Order matters in a rate or a slope. Check which amount goes on top.") }),
  "wrong-unit-op": () => ({ label: t("Used the wrong operation to change units"), note: t("Smaller units mean more of them; bigger units mean fewer. Decide which way you are going first.") }),
  "sub-neg": () => ({ label: t("Did not turn minus a negative into plus"), note: t("Subtracting a negative number gives the same result as adding a positive one.") }),
  "neg-neg": () => ({ label: t("Made negative times negative negative"), note: t("A negative number times a negative number is positive.") }),
  "lost-sign": () => ({ label: t("Lost a negative sign"), note: t("Adding a negative number moves down. Keep the sign with the number.") }),
  "wrong-undo": () => ({ label: t("Used the wrong undo operation"), note: t("Undo multiplication with division, and undo addition with subtraction.") }),
  "one-side": () => ({ label: t("Changed only one side"), note: t("Whatever you do to one side of an equation, do to the other side too.") }),
  "no-flip-ineq": () => ({ label: t("Forgot to flip the inequality sign"), note: t("Multiplying or dividing both sides by a negative number flips the inequality sign.") }),
  "order-ops": () => ({ label: t("Did not follow the order of operations"), note: t("Finish parentheses first, then multiply and divide, then add and subtract.") }),
  "exp-slip": () => ({ label: t("Multiplied the base by the exponent"), note: t("An exponent counts how many times the base is used as a factor. It is not a multiplier.") }),
  "sq-sum": () => ({ label: t("Squared the sum"), note: t("Square each number first, then add. The square of a sum is a different number.") }),
  "dropped-side": () => ({ label: t("Left out a side"), note: t("A perimeter adds every side. Count each side once.") }),
  "r-doubled": () => ({ label: t("Doubled the radius instead of squaring it"), note: t("A radius squared means radius times radius, not radius times two.") }),
};

export const SLIP_IDS = Object.keys(SLIPS);
export const slipInfo = (id) => SLIPS[id]();
