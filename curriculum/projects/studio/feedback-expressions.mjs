/** Expression missions: order of operations, then distributing a(x + b) and checking equivalence. */
import { fmt, trap } from "./feedback-util.mjs";
export function spec(project, v) {
  const { a, b, c, d } = v;
  const sq = d ** 2;
  const inside = c + b;
  const value = a * inside + sq;
  return {
    square: {
      traps: [
        trap("doubled", 2 * d, () => `That doubles ${d}. The exponent 2 means ${d} × ${d}.`),
        trap("kept-base", d, () => `That is ${d} itself. Squaring multiplies ${d} by itself.`),
      ],
      verify: (s) => `${fmt(s)} ÷ ${d} = ${fmt(s / d)}, but ${d}² means ${d} multiplied by ${d}, so that quotient should be ${d}.`,
      next: `Multiply ${d} by itself.`,
    },
    inside: {
      traps: [
        trap("multiplied", c * b, () => `That multiplies ${c} and ${b}. The expression adds ${b} to x.`),
        trap("gave-x", c, () => `That is just the input. The parentheses also add ${b}.`),
      ],
      verify: (s) => `${fmt(s)} − ${c} = ${fmt(s - c)}, but the expression adds ${b} to x = ${c}.`,
      next: `Replace x with ${c}, then add ${b}.`,
    },
    value: {
      traps: [
        trap("forgot-square", a * inside + d, () => `That adds ${d} instead of ${d}². Evaluate the exponent before adding.`),
        trap("doubled-not-squared", a * inside + 2 * d, () => `That adds ${2 * d}, which is ${d} doubled. The exponent means ${d} × ${d}.`),
        trap("distributed-one-term", a * c + b + sq, () => `That multiplies ${a} by x only. The ${a} multiplies everything inside the parentheses.`),
        trap("multiplied-square", a * (inside + sq), () => `That multiplies the square by ${a} as well. In ${a}(x + ${b}) + ${d}², the square is added after the multiplication.`),
        trap("left-to-right", (a * inside + d) ** 2, () => `That squares the whole running total. The exponent applies only to ${d}.`),
      ],
      verify: (s) =>
        `Undo your steps: (${fmt(s)} − ${sq}) ÷ ${a} = ${fmt((s - sq) / a)}. That should equal x + ${b} at x = ${c}.`,
      next: `Work in order: parentheses, the exponent, multiplication, then addition.`,
    },
    coefficient: {
      traps: [
        trap("gave-product", a * b, () => `${a * b} comes from multiplying ${a} by ${b}. That number has no x with it, so it is not the coefficient of x.`),
        trap("gave-inner-constant", b, () => `${b} is the amount added to x inside the parentheses. The coefficient is the number multiplying x after you distribute.`),
        trap("gave-one", 1, () => `The x inside the parentheses has coefficient 1, but the whole expression is multiplied by ${a} first. Distribute before reading the coefficient.`),
        trap("added", a + b, () => `That adds ${a} and ${b}. Distributing multiplies; it does not add.`),
      ],
      verify: () => `Multiply ${a} by each term inside (x + ${b}). The coefficient is the number in front of the term that has x.`,
      next: `Expand ${a}(x + ${b}) and read the number multiplying x.`,
    },
    constant: {
      traps: [
        trap("forgot-square", a * b, () => `That is only the distributed part. The ${d}² from the original rule belongs in the constant too.`),
        trap("forgot-distribute", b + sq, () => `That did not multiply ${b} by ${a}. The ${a} multiplies BOTH terms inside the parentheses.`),
        trap("multiplied-square", a * (b + sq), () => `That multiplies ${d}² by ${a}. The square is added after the multiplication, so it is not multiplied by ${a}.`),
        trap("doubled-not-squared", a * b + 2 * d, () => `That uses ${2 * d} for the square. ${d}² means ${d} × ${d}.`),
      ],
      verify: () => `The constant collects every part with no x after you distribute ${a} to BOTH terms inside the parentheses, together with the squared amount. Check which parts your number includes.`,
      next: `Distribute, evaluate ${d}², then combine the parts that have no x.`,
    },
    "new-input": {
      traps: [
        trap("old-input", value, () => `That is the value at x = ${c}, the earlier input. This question uses x = ${c + 1}.`),
        trap("distributed-one-term", a * (c + 1) + b + sq, () => `That multiplies ${a} by x only. The expanded form multiplies ${a} by x and by ${b}.`),
        trap("forgot-square", a * (c + 1 + b), () => `That leaves out the ${d}² part of the rule.`),
      ],
      verify: (s) => `At x = ${c + 1}, the expanded form is your coefficient times ${c + 1} plus your constant. Does ${fmt(s)} match that?`,
      next: `Substitute x = ${c + 1} into the expanded expression and calculate.`,
    },
  };
}
