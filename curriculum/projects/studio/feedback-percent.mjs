/** Percent missions: discount first, then simulated tax on the discounted subtotal. */
import { fmt, trap, usd } from "./feedback-util.mjs";
const WHAT = { "unit-4-a": "pop-up shop discount", "unit-4-b": "club purchase discount" };
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
export function spec(project, v) {
  const { a, b, c, d } = v;
  const W = WHAT[project.id];
  const discount = (a * b) / 100;
  const sale = a - discount;
  const tax = round2((sale * c) / 100);
  const total = round2(sale + tax);
  return {
    decimal: {
      traps: [
        trap("gave-percent", b, () => `${b} is the percent number of the ${W}. Percent means per 100, so the decimal is much smaller than ${b}.`),
        trap("shifted-one-place", b / 10, () => `That moves the decimal point one place for the ${W}, but a percent is out of 100, so it moves two places.`),
        trap("shifted-three-places", b / 1000, () => `That moves the decimal point three places for the ${W}. Percent means out of 100, which is two places.`),
      ],
      verify: (s) => `${fmt(s)} × 100 = ${fmt(s * 100)}%, but the ${W} is ${b}%. Convert per-hundred to a decimal by dividing by 100.`,
      next: `Divide ${b} by 100.`,
    },
    discount: {
      traps: [
        trap("gave-percent", b, () => `${b} is the percent, not the dollars. Take that percent of ${usd(a)}.`),
        trap("forgot-hundred", a * b, () => `That multiplies ${usd(a)} by ${b} without turning ${b}% into a decimal first.`),
        trap("gave-sale", sale, () => `That is the price left after the discount, not the amount the discount removes.`),
      ],
      verify: (s) =>
        `${usd(s)} is ${fmt((s / a) * 100)}% of ${usd(a)}, but the discount is ${b}%. The amount removed must be ${b}% of the original price.`,
      next: `Multiply ${usd(a)} by the decimal form of ${b}%.`,
    },
    sale: {
      traps: [
        trap("gave-discount", discount, () => `That is the amount taken off ${usd(a)}. The sale price is what remains after the discount.`),
        trap("subtracted-percent", a - b, () => `That subtracts ${b} percentage points as if they were dollars. Take away the dollar amount of the discount.`),
        trap("added-discount", a + discount, () => `That adds the discount instead of subtracting it. A discount lowers the price.`),
      ],
      verify: (s) =>
        s > a
          ? `A sale price cannot be higher than the original ${usd(a)}.`
          : `${usd(a)} − ${usd(s)} = ${usd(a - s)} off, which is ${fmt(((a - s) / a) * 100)}% of the original. The discount is ${b}%.`,
      next: `Subtract the discount amount from ${usd(a)}.`,
    },
    tax: {
      traps: [
        trap("tax-on-original", round2((a * c) / 100), () => `That finds ${c}% of the ORIGINAL price. In this model, tax is charged on the discounted subtotal.`),
        trap("gave-rate", c, () => `${c} is the tax rate, not the tax in dollars. Take that percent of the subtotal.`),
        trap("tax-on-discount", round2((discount * c) / 100), () => `That finds ${c}% of the discount amount. Tax applies to the price you pay before tax, the discounted subtotal.`),
      ],
      verify: (s) =>
        `${usd(s)} ÷ ${c / 100} = ${fmt(s / (c / 100 || 1))}. If tax is ${c}% of the subtotal, that quotient should be the discounted subtotal.`,
      next: `Take ${c}% of the discounted price (original minus discount) and round to cents.`,
    },
    total: {
      traps: [
        trap("forgot-tax", sale, () => `That is the sale price before tax. A receipt total includes the ${c}% tax.`),
        trap("tax-on-original", round2(sale + (a * c) / 100), () => `That includes ${c}% tax on the original price. Tax is charged on the discounted subtotal.`),
        trap("added-to-original", round2(a + tax), () => `That adds the tax to the ORIGINAL price. Add it to the discounted subtotal.`),
      ],
      verify: (s) =>
        `${usd(s)} ÷ ${fmt(1 + c / 100)} = ${fmt(s / (1 + c / 100))}. Undoing the ${c}% tax should give the subtotal after a ${b}% discount on ${usd(a)}.`,
      next: `Add your tax amount to your sale price.`,
    },
    budget: {
      traps: [
        trap("sign-flipped", total - d, () => `Budget minus total is positive when money is left over and negative when the receipt costs more than the budget. Check which of those describes your receipt.`),
        trap("ignored-tax", d - sale, () => `That subtracts the sale price, not the final total. The receipt includes ${c}% tax.`),
        trap("gave-budget", d, () => `That is the ${usd(d)} budget itself. Subtract the receipt total, which includes ${c}% tax, from it.`),
      ],
      verify: (s) =>
        `${usd(d)} − ${usd(s)} = ${usd(d - s)}. If your answer is right, that is the receipt total you found in the earlier check.`,
      next: `Subtract your final receipt total from ${usd(d)}.`,
    },
  };
}
