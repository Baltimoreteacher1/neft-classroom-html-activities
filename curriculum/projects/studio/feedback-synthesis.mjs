/** Synthesis mission: area gives the material cost, a percent is a fraction of that subtotal, and visitors drive a linear total. */
import { fmt, trap, usd } from "./feedback-util.mjs";
export const judged = [
  "Whether your proposal connects space, price and growth in a way a community would accept",
  "The tradeoff you defend with at least two of the strands (area, percent, two-variable relationship)",
  "The cost the model leaves out and how you label units on the floor plan",
];
export function facts(project, by, v, ok) {
  const out = [];
  if (ok("area", "subtotal")) out.push(`The ${fmt(v.a)} m by ${fmt(v.b)} floor costs ${usd(by.subtotal)} in materials before the discount.`);
  if (ok("materials", "total")) out.push(`The fixed material cost is ${usd(by.materials)} and each visitor adds ${usd(v.e)}, so the total for ${v.f} visitors is ${usd(by.total)}.`);
  return out;
}
export function spec(project, v) {
  const { a, b, c, d, e, f } = v;
  const area = a * b, subtotal = area * c, discount = (subtotal * d) / 100, materials = subtotal - discount;
  return {
    area: {
      traps: [
        trap("perimeter", 2 * (a + b), () => `That is the distance around the ${fmt(a)} m by ${fmt(b)} m floor, a length. Area counts the squares inside.`),
        trap("added", a + b, () => `${fmt(a)} + ${fmt(b)} adds two sides. Area multiplies them.`),
      ],
      verify: (s) => `${fmt(s)} m² spread over ${fmt(b)} rows is ${fmt(s / b)} squares per row, but the floor is ${fmt(a)} m long.`,
      next: `Multiply the length ${fmt(a)} by the width ${fmt(b)}.`,
    },
    subtotal: {
      traps: [
        trap("gave-area", area, () => `That is the floor area in m². The price is ${usd(c)} for each m², so the area is multiplied by the rate.`),
        trap("priced-perimeter", 2 * (a + b) * c, () => `That prices the distance around the floor. Material covers the area, not the edge.`),
        trap("added-rate", area + c, () => `That adds a price per m² to a number of m². Multiply the area by the rate.`),
      ],
      verify: (s) => `${usd(s)} ÷ ${usd(c)} per m² is ${fmt(s / c)} m² of material, which is not the size of this floor.`,
      next: `Multiply the floor area by ${usd(c)} per m².`,
    },
    discount: {
      traps: [
        trap("gave-percent", d, () => `That is the discount rate. The discount is that percent OF the material subtotal.`),
        trap("forgot-hundred", subtotal * d, () => `That multiplies by ${d} instead of ${d}%. A percent is ${d} out of 100.`),
        trap("gave-materials", materials, () => `That is what remains after the discount. The question asks how much the discount takes off.`),
        trap("percent-of-area", (area * d) / 100, () => `That takes ${d}% of the floor area in m². The discount applies to the material cost in dollars.`),
      ],
      verify: (s) => `${usd(s)} out of the subtotal is ${fmt((s * 100) / subtotal)}%, but the discount is ${d}%.`,
      next: `Take ${d}% of the material subtotal: ${d} ÷ 100 times the subtotal.`,
    },
    materials: {
      traps: [
        trap("gave-discount", discount, () => `That is the amount taken off. The discounted cost is what is left of the subtotal.`),
        trap("subtracted-percent", subtotal - d, () => `That subtracts ${d} dollars. The discount is ${d}% of the subtotal, not ${d} dollars.`),
        trap("added-discount", subtotal + discount, () => `A discount lowers the cost. Subtract it from the subtotal.`),
      ],
      verify: (s) => `${usd(subtotal)} − ${usd(s)} = ${usd(subtotal - s)} would be the discount, but ${d}% of the subtotal is a different amount.`,
      next: `Subtract the discount from the material subtotal.`,
    },
    total: {
      traps: [
        trap("one-visitor", materials + e, () => `That adds the supplies for one visitor. The rule multiplies the cost per visitor by ${f} visitors.`),
        trap("forgot-materials", e * f, () => `That is only the visitor supplies. The discounted materials are part of the total.`),
        trap("undiscounted", subtotal + e * f, () => `That uses the material cost before the discount. The discounted materials are used here.`),
        trap("discounted-supplies", materials + (e * f * (100 - d)) / 100, () => `That also discounts the visitor supplies. In this model only the materials are discounted.`),
      ],
      verify: (s) => `Taking the supplies for ${f} visitors (${usd(e * f)}) away from ${usd(s)} leaves ${usd(s - e * f)} for materials, but your discounted materials are a different amount.`,
      next: `Add the discounted materials to ${usd(e)} times ${f} visitors.`,
    },
    extra: {
      traps: [
        trap("gave-rate", e, () => `That is the cost for one visitor. The question asks about 10 more visitors.`),
        trap("used-visitors", e * f, () => `That uses all ${f} visitors. The question asks only about the 10 additional ones.`),
        trap("added-fixed", materials + 10 * e, () => `That includes the fixed material cost, which does not change when visitors are added.`),
        trap("gave-ten", 10, () => `That is the number of added visitors. The question asks for the cost they add.`),
      ],
      verify: (s) => `${usd(s)} ÷ 10 visitors is ${usd(s / 10)} per visitor, but each visitor needs ${usd(e)}.`,
      next: `Multiply the cost per visitor, ${usd(e)}, by 10.`,
    },
  };
}
