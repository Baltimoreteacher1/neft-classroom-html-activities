/** Equation missions: inverse operations keep both sides balanced; "at least" includes its boundary; a solution is checked by substitution. */
import { fmt, trap } from "./feedback-util.mjs";
export const WORDS = {
  "unit-8-a": { first: "first lock", gate: "threshold gate" },
  "unit-8-b": { first: "first progress equation", gate: "at-least goal" },
  "unit-8-c": { first: "addition lock", gate: "inequality gate" },
};
export const judged = [
  "Whether the story you write matches each equation and inequality",
  "The inverse-operation steps you show and how you explain keeping both sides equal",
  "Your explanation of the boundary, and why an inequality has many solutions but an equation has one",
];
export function facts(project, by, v, ok) {
  const out = [];
  if (ok("addition", "multiplication")) out.push(`Both equations are solved by x = ${fmt(by.addition)}, so they are equivalent for this secret value: they have exactly the same solution.`);
  if (ok("boundary", "strict")) out.push(`n ≥ ${fmt(v.a)} and n > ${fmt(v.a)} differ only at ${fmt(v.a)}: the first allows it and the second does not.`);
  return out;
}
export function spec(project, v) {
  const { a, b, c } = v;
  const W = WORDS[project.id];
  return {
    addition: {
      traps: [
        trap("added-again", a + 2 * b, () => `That adds ${b} to both sides instead of taking ${b} away. The inverse of adding ${b} is subtracting ${b}.`),
        trap("gave-right-side", a + b, () => `That is the right-hand side of the equation, not x. Undo the + ${b} to get x alone.`),
        trap("gave-added", b, () => `That is the amount added to x. The question asks for x itself.`),
      ],
      verify: (s) => `Substituting x = ${fmt(s)}: ${fmt(s)} + ${b} = ${fmt(s + b)}, but the right-hand side of the ${W.first} is ${a + b}. The two sides are not equal.`,
      next: `Subtract ${b} from both sides, then substitute back to check.`,
    },
    multiplication: {
      traps: [
        trap("multiplied", c * c * a, () => `That multiplies both sides by ${c}. The inverse of multiplying by ${c} is dividing by ${c}.`),
        trap("gave-right-side", c * a, () => `That is the right-hand side. Divide it by ${c} to undo the multiplication.`),
        trap("subtracted", c * a - c, () => `Subtracting ${c} does not undo a multiplication. Use division.`),
        trap("gave-coefficient", c, () => `That is the multiplier of x. The question asks for x itself.`),
      ],
      verify: (s) => `Substituting x = ${fmt(s)}: ${c} × ${fmt(s)} = ${fmt(c * s)}, but the right-hand side is ${c * a}. The two sides are not equal.`,
      next: `Divide both sides by ${c}, then substitute back to check.`,
    },
    substitution: {
      traps: [
        trap("gave-solution", a, () => `That is x itself. The question asks for the value of the left-hand side, x + ${b}.`),
        trap("multiplied", a * b, () => `That multiplies x by ${b}. The left-hand side adds ${b}.`),
        trap("subtracted", a - b, () => `That subtracts ${b}. The left-hand side is x + ${b}.`),
      ],
      verify: (s) => `${fmt(s)} − ${b} = ${fmt(s - b)}, so x would have to be ${fmt(s - b)}. Replace x with your solution from the first equation and add ${b}.`,
      next: `Put your solution from the ${W.first} in place of x, then add ${b}.`,
    },
    boundary: {
      traps: [
        trap("above-boundary", a + 1, () => `That starts above the boundary. "At least ${a}" includes ${a} itself, so a smaller whole number is allowed.`),
        trap("below-boundary", a - 1, () => `${a - 1} is below the boundary, so it fails n ≥ ${a}.`),
      ],
      verify: (s) => `Test ${fmt(s)}: it is ${s < a ? "less than" : "greater than"} ${a}. The ${W.gate} allows n ≥ ${a}. Look for the smallest whole number that still passes.`,
      next: `Test whole numbers around ${a} in n ≥ ${a}.`,
    },
    strict: {
      traps: [
        trap("included-boundary", a, () => `${a} is not allowed by n > ${a}: greater than excludes the boundary.`),
        trap("two-above", a + 2, () => `${a + 2} works, but a smaller whole number also does. The question asks for the smallest.`),
        trap("half-above", a + 0.5, () => `${a + 0.5} is not a whole number. The question asks for the smallest WHOLE number.`),
      ],
      verify: (s) => `Test ${fmt(s)} in n > ${a}: it is ${s > a ? "greater than" : "not greater than"} ${a}. Find the smallest whole number that passes.`,
      next: `Start at ${a} and move up through whole numbers until n > ${a} is true.`,
    },
    difference: {
      traps: [
        trap("gave-left", c * (a + 1), () => `That is the left side at the proposed value. The question asks how much it exceeds the right side.`),
        trap("gave-right", c * a, () => `That is the right-hand side. Compare it with the left side at x = ${a + 1}.`),
        trap("gave-one", 1, () => `The proposed x is 1 more than the solution, but the left side changes ${c} times as much as x does.`),
        trap("gave-proposed", a + 1, () => `That is the proposed value of x. The question asks about the left side minus the right side.`),
      ],
      verify: (s) => `At x = ${a + 1} the left side is ${c} × ${a + 1} = ${c * (a + 1)} and the right side is ${c * a}. Subtract them and compare with ${fmt(s)}.`,
      next: `Substitute ${a + 1} into ${c}x, then subtract the right-hand side.`,
    },
  };
}
