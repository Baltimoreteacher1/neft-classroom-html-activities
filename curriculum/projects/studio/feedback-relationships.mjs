/** Relationship missions: y = rate × x + start; the start is the output at x = 0, the rate is the repeated change. */
import { fmt, trap } from "./feedback-util.mjs";
export const judged = [
  "Whether you name the independent and dependent variables with units that fit the story",
  "How clearly your table, graph and equation are labeled so another reader can compare them",
  "Your explanation of the starting value, the rate and the limit of a constant-growth model",
];
export function facts(project, by, v, ok) {
  const out = [];
  if (ok("zero", "increase")) out.push(`The graph crosses the y-axis at (0, ${fmt(by.zero)}) and rises ${fmt(by.increase)} for each 1 across.`);
  if (ok("two", "target")) out.push(`At x = ${v.c} the model predicts ${fmt(by.target)}, which is ${fmt(by.target - by.two)} more than at x = 2.`);
  return out;
}
export function spec(project, v) {
  const { a, b, c } = v;
  return {
    zero: {
      traps: [
        trap("gave-rate", a, () => `That is the rate in y = ${a}x + ${b}. At x = 0 the term ${a}x is multiplied by 0 and disappears; what remains is the starting amount.`),
        trap("added-rate", a + b, () => `That is the output at x = 1. At x = 0 the term ${a}x is 0.`),
        trap("gave-zero", 0, () => `0 × ${a} is 0, but the starting amount ${b} is still added.`),
      ],
      verify: (s) => `At x = 0 the rule is y = ${a} × 0 + ${b}. ${fmt(s)} is not what that gives.`,
      next: `Replace x with 0 in y = ${a}x + ${b}.`,
    },
    one: {
      traps: [
        trap("gave-rate", a, () => `That is the rate alone. The output at x = 1 also includes the starting amount of ${b}.`),
        trap("gave-start", b, () => `That is the output at x = 0. At x = 1 the rate is added once.`),
        trap("multiplied", a * b, () => `That multiplies the rate by the starting amount. The rule multiplies the rate by x, then adds the start.`),
      ],
      verify: (s) => `At x = 1 the rule is y = ${a} × 1 + ${b}. ${fmt(s)} is ${fmt(s - b)} above the start of ${b}, but the rate is ${a}.`,
      next: `Replace x with 1 in y = ${a}x + ${b}.`,
    },
    two: {
      traps: [
        trap("forgot-start", 2 * a, () => `That is two steps of the rate. The starting amount of ${b} is still added.`),
        trap("doubled-everything", 2 * (a + b), () => `That doubles the starting amount too. Only the rate is multiplied by x.`),
        trap("added-input", a + b + 2, () => `That adds 2 instead of multiplying the rate by 2.`),
      ],
      verify: (s) => `Taking the start ${b} away from ${fmt(s)} leaves ${fmt(s - b)}, and ${fmt(s - b)} ÷ 2 is ${fmt((s - b) / 2)} per step, but the rate is ${a}.`,
      next: `Multiply the rate ${a} by 2, then add the start of ${b}.`,
    },
    target: {
      traps: [
        trap("forgot-start", a * c, () => `That is the rate times ${c}. The starting amount of ${b} is added after.`),
        trap("added-all", a + b + c, () => `That adds the three numbers. The rate multiplies the input, and then the start is added.`),
        trap("multiplied-sum", (a + b) * c, () => `That multiplies the start by ${c} too. Only the rate is multiplied by x.`),
      ],
      verify: (s) => `Taking the start ${b} away from ${fmt(s)} leaves ${fmt(s - b)}, and ${fmt(s - b)} ÷ ${c} is ${fmt((s - b) / c)} per input unit, but the rate is ${a}.`,
      next: `Multiply the rate ${a} by ${c} first, then add ${b}.`,
    },
    increase: {
      traps: [
        trap("gave-start", b, () => `That is the starting amount. The increase for each extra 1 of x is the rate.`),
        trap("gave-output", a + b, () => `That is the output at x = 1. The question asks how much y grows for one more x.`),
      ],
      verify: (s) => `If y grows ${fmt(s)} each step, the outputs at x = 0 and x = 1 differ by ${fmt(s)}, but they are ${b} and ${a + b}.`,
      next: `Compare the outputs at x = 1 and x = 0 and find how far apart they are.`,
    },
    delta: {
      traps: [
        trap("forgot-subtract", a * c, () => `That is the rate times ${c}, the change from x = 0. The question starts at x = 2.`),
        trap("gave-input-gap", c - 2, () => `That is the change in x. The question asks for the change in y, so multiply it by the rate.`),
        trap("added-start", a * (c - 2) + b, () => `That adds the starting amount. The start is in both outputs, so it cancels.`),
        trap("gave-target", a * c + b, () => `That is the output at x = ${c}. The question asks how much y changes from x = 2.`),
      ],
      verify: (s) => `${fmt(s)} ÷ ${c - 2} (the change in x) is ${fmt(s / (c - 2))} per step, but the rate is ${a}.`,
      next: `Find the change in x, ${c} − 2, and multiply by the rate ${a}.`,
    },
  };
}
