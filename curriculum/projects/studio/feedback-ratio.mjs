/** Ratio missions: equivalent ratios scale both parts; fair comparisons use unit rates. */
import { fmt, trap, usd } from "./feedback-util.mjs";
const SPORT = project => project.id === "unit-3-b";
export function spec(project, v) {
  const { a, b, c, d, e, f, g } = v;
  const sport = SPORT(project);
  const A = sport ? "points" : "parts of A";
  const B = sport ? "games" : "parts of B";
  const money = (n) => (sport ? fmt(n) : usd(n));
  const rateWord = sport ? "points per game" : "cost per unit";
  const rA = d / e;
  const rB = f / g;
  const ownerA = sport ? "Player A" : "Offer A";
  const ownerB = sport ? "Player B" : "Offer B";
  const totalA = sport ? `${fmt(d)} points in ${fmt(e)} games` : `${usd(d)} for ${fmt(e)} units`;
  const totalB = sport ? `${fmt(f)} points in ${fmt(g)} games` : `${usd(f)} for ${fmt(g)} units`;
  return {
    "scale-a": {
      traps: [
        trap("added", a + c, (s) => `${s} comes from adding ${c} to ${a}. A ratio is scaled by multiplying; adding the same number to each part changes the relationship.`),
        trap("swapped", b * c, () => `That scales the second quantity. This question asks for the new FIRST quantity, which starts from ${a}.`),
      ],
      verify: (s) =>
        `${fmt(s)} ÷ ${a} = ${fmt(s / a)}, but the scale factor is ${c}. The new first quantity is ${a} multiplied by that same factor.`,
      next: `Multiply ${a} (${A}) by the scale factor ${c}.`,
    },
    "scale-b": {
      traps: [
        trap("added", b + c, (s) => `${s} comes from adding ${c} to ${b}. Scale by multiplying, the same way as for the first quantity.`),
        trap("used-first", a * c, () => `That is the new FIRST quantity. This question asks for the new second quantity, which starts from ${b}.`),
      ],
      verify: (s) =>
        `${fmt(s)} ÷ ${b} = ${fmt(s / b)}, but the first quantity was scaled by ${c}. Both quantities must use the same factor.`,
      next: `Multiply ${b} (${B}) by the same scale factor ${c}.`,
    },
    "base-rate": {
      traps: [
        trap("inverted", b / a, () => `That is B per A. The question asks for how much A for ONE B, so divide A by B.`),
        trap("subtracted", a - b, () => `That is the difference of the parts. A rate compares them by division.`),
      ],
      verify: (s) =>
        `If there are ${fmt(s)} of A for each 1 of B, then ${b} of B would have ${fmt(s * b)} of A, but the base ratio ${a} : ${b} has ${a}.`,
      next: `Divide ${a} by ${b}, keeping the order A per B.`,
    },
    "rate-a": {
      traps: [
        trap("inverted", e / d, () => `That divides the quantity by the total. The ${rateWord} divides ${sport ? "points by games" : "cost by quantity"}.`),
        trap("gave-total", d, () => `That is the ${sport ? "total points" : "total cost"}. A unit rate is for ONE ${sport ? "game" : "unit"}, so divide by the ${sport ? "games" : "quantity"}.`),
        trap("subtracted", d - e, () => `Subtraction does not make a rate. Divide to find the amount for one ${sport ? "game" : "unit"}.`),
      ],
      verify: (s) =>
        `${fmt(s)} × ${fmt(e)} = ${fmt(s * e)}, but ${ownerA} is ${totalA}. At your rate, ${fmt(e)} ${sport ? "games" : "units"} would not match.`,
      next: `Divide ${sport ? fmt(d) : usd(d)} by ${fmt(e)}.`,
    },
    "rate-b": {
      traps: [
        trap("inverted", g / f, () => `That divides the quantity by the total. Use the same order as for ${ownerA}.`),
        trap("gave-total", f, () => `That is the ${sport ? "total points" : "total cost"}. Divide by the ${sport ? "games" : "quantity"} to get one ${sport ? "game" : "unit"}.`),
        trap("used-a", rA, () => `That is ${ownerA}'s rate. This question is about ${ownerB}: ${totalB}.`),
      ],
      verify: (s) =>
        `${fmt(s)} × ${fmt(g)} = ${fmt(s * g)}, but ${ownerB} is ${totalB}. Use the same division order you used for ${ownerA}.`,
      next: `Divide ${sport ? fmt(f) : usd(f)} by ${fmt(g)}.`,
    },
    difference: {
      traps: [
        trap("signed", -Math.abs(rA - rB), () => `A gap between two rates is the larger minus the smaller, so it is not negative.`),
        trap("compared-totals", Math.abs(d - f), () => `That compares the totals ${sport ? fmt(d) + " and " + fmt(f) : usd(d) + " and " + usd(f)}. A fair comparison uses the ${rateWord} of each.`),
        trap("compared-quantities", Math.abs(e - g), () => `That compares the quantities ${fmt(e)} and ${fmt(g)}. Compare the rates instead.`),
      ],
      verify: (s) =>
        s < 0
          ? `A gap between two rates is not negative; ${fmt(s)} is below zero. Subtract the smaller rate from the larger.`
          : `${fmt(s)} is not the gap between the two ${rateWord} figures. Divide ${sport ? fmt(d) : usd(d)} by ${fmt(e)} and ${sport ? fmt(f) : usd(f)} by ${fmt(g)}, then subtract the smaller from the larger.`,
      next: `Use your two rates, then subtract the smaller from the larger.`,
    },
  };
}
