import { t } from "./i18n.js";
// A short, plain "why" for a guided step, read from the step's own words and neighbours. Steps that already
// explain themselves in words get no extra line; an empty string means there is nothing to add.
const NUM = "-?[\\d,]+(?:\\.\\d+)?";
const RULES = [
  [new RegExp(`^(\\d+) \\+ (\\d+) = 10$`), () => t("Making a 10 first gives you an easy number to build on.")],
  [/^10 \+ \d+ = /, () => t("Now add what is left over to the ten.")],
  [/^Start at /, () => t("Start with the number you already have.")],
  [/^Count on /, () => t("Counting on adds one at a time, so you can see each step.")],
  [/^Count back /, () => t("Counting back takes away one at a time.")],
  [/^(\d+) \+ \? = /, () => t("Subtraction asks: how much do I add to the small number to reach the big one?")],
  [/^(\d+) × \? = /, () => t("Division asks: what number times the divisor makes the total?")],
  [/^So /, () => t("Now we can say what the original problem equals.")],
  [/^10 × \d+ = /, () => t("Ten groups is easy: just put a zero on the end.")],
  [/^5 × \d+ = /, () => t("Five groups is half of ten groups, so it is easy to find.")],
  [/^Add \d+ zeros?:/, () => t("Each zero stands for a times-10, so they go on the end.")],
  [new RegExp(`^(\\d+) \\+ \\1 = ${NUM}$`), (m, i, steps) => (steps.length > 1 ? t("Doubles are easy facts to remember.") : t("A double means the same number twice, and doubles are facts worth knowing."))],
  [new RegExp(`^(\\d+) \\+ 1 = ${NUM}$`), () => t("The numbers are one apart, so use a double and add 1.")],
  [new RegExp(`^(${NUM}) − (${NUM}) = ${NUM}$`), (m, i, steps) => (/^10 × /.test(steps[i - 1] || "") ? t("Nine groups is one group fewer than ten groups, so take one group away.") : i > 0 ? t("Take away the rest, so the whole amount is gone.") : t("Take away a friendly chunk first to keep the work easy."))],
  [new RegExp(`^(${NUM}) × (${NUM}) = ${NUM}$`), (m, i, steps) => (/^[1-3] × /.test(m[0]) && /^5 × /.test(steps[i - 1] || "") ? t("These are the groups left over after the five.") : /Add \d+ zero/.test(steps[i + 1] || "") ? t("Do the basic fact first. The zeros wait until the end.") : t("Multiply one easy part at a time, then put the parts together."))],
  [new RegExp(`^(${NUM}) \\+ (${NUM}) = ${NUM}$`), (m, i, steps) => (/×/.test(steps[i - 1] || "") ? t("Add the parts. Together they make all the groups.") : i > 0 ? t("Now add the part that is left, so nothing is missed.") : t("Jump by a friendly chunk first, then add what is left."))],
];

export function whyFor(line, index, steps) {
  const text = String(line).replace(/^\s+/, "");
  for (const [pattern, build] of RULES) {
    const match = text.match(pattern);
    if (match) return build(match, index, steps);
  }
  return "";
}
