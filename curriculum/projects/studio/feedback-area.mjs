/** Area missions: area counts squares, perimeter is a length, volume counts cubes; a price multiplies by the area. */
import { fmt, trap, usd } from "./feedback-util.mjs";
export const judged = [
  "Whether your floor plan leaves a clear path and useful space for the lounge or studio you chose",
  "How clearly the plan labels the base and perpendicular height of the triangle and the units on each quantity",
  "What you say the flooring price includes and excludes, such as labor and offcuts",
];
export function facts(project, by, v, ok) {
  const out = [];
  if (ok("rectangle", "triangle", "composite")) out.push(`The triangular nook is ${Number(((100 * by.triangle) / by.composite).toFixed(1))}% of the combined floor, so the rectangle holds the rest.`);
  if (ok("volume", "surface")) out.push(`The storage box holds ${fmt(by.volume)} m³ inside and has ${fmt(by.surface)} m² of surface, which is ${Number((by.volume / by.surface).toFixed(2))} m³ of space for each m² of material.`);
  return out;
}
export function spec(project, v) {
  const { a, b, c, d, e, f, g, h } = v;
  const rect = a * b, tri = (c * d) / 2, vol = f * g * h, sa = 2 * (f * g + f * h + g * h);
  return {
    rectangle: {
      traps: [
        trap("perimeter", 2 * (a + b), () => `That is the distance around the ${a} m by ${b} m floor (its perimeter), a length. Area counts the square meters inside.`),
        trap("added", a + b, () => `${a} + ${b} adds the two sides. Area covers the floor with squares, so the sides are multiplied.`),
        trap("halved", rect / 2, () => `That takes half of ${a} × ${b}. Half belongs to the triangle, not to a rectangle.`),
      ],
      verify: (s) => `${fmt(s)} m² spread over ${b} rows is ${fmt(s / b)} squares per row, but a floor ${a} m long holds ${a} squares in every row.`,
      next: `Picture the ${a} m by ${b} m floor covered in 1 m squares and count them row by row.`,
    },
    triangle: {
      traps: [
        trap("forgot-half", c * d, () => `That is the area of the whole ${c} m by ${d} m rectangle around the nook. A triangle covers only part of it.`),
        trap("added", c + d, () => `${c} + ${d} adds the base and the height. Area multiplies them, and a triangle takes half of that.`),
        trap("halved-twice", (c * d) / 4, () => `That halves the product twice. The triangle is one half of base × height.`),
        trap("halved-floor", rect / 2, () => `That is half of the main ${a} m by ${b} m floor. The nook has its own base ${c} m and height ${d} m.`),
      ],
      verify: (s) => `Doubling ${fmt(s)} m² gives ${fmt(2 * s)} m². A triangle with base ${c} m and perpendicular height ${d} m is half of a ${c} m by ${d} m rectangle, so doubling it should give that rectangle.`,
      next: `Draw the ${c} m by ${d} m rectangle around the nook and take half of it.`,
    },
    composite: {
      traps: [
        trap("only-rectangle", rect, () => `That counts only the main ${a} m by ${b} m floor. The triangular nook is floor space too.`),
        trap("only-triangle", tri, () => `That counts only the nook. The main floor is part of the combined area.`),
        trap("full-rectangle-nook", rect + c * d, () => `That counts the nook as a full ${c} m by ${d} m rectangle. A triangle is only half of it.`),
        trap("multiplied", rect * tri, () => `Separate regions are added, not multiplied. Multiplying two areas gives units of m⁴.`),
      ],
      verify: (s) => `Taking the ${a} m by ${b} m floor away from ${fmt(s)} m² leaves ${fmt(s - rect)} m² for the nook, but the nook has base ${c} m and height ${d} m.`,
      next: `Add the area of the main floor and the area of the nook.`,
    },
    "floor-cost": {
      traps: [
        trap("area-only", rect + tri, () => `That is the floor area in m². The price is $${fmt(e)} for each m², so the area is multiplied by the rate.`),
        trap("rectangle-only", rect * e, () => `That prices only the main floor. The nook has to be floored too.`),
        trap("added-rate", rect + tri + e, () => `That adds a price per m² to a number of m². Different kinds of quantities are multiplied, not added.`),
      ],
      verify: (s) => `${usd(s)} ÷ $${fmt(e)} per m² is ${fmt(s / e)} m² of flooring, but your combined floor is not that size.`,
      next: `Multiply the combined floor area by the price of $${fmt(e)} per m².`,
    },
    volume: {
      traps: [
        trap("surface", sa, () => `That is the area of the outside faces, in square units. Volume counts the unit cubes inside, in cubic units.`),
        trap("base-only", f * g, () => `That is the area of the bottom face only. Volume also needs the height of ${fmt(h)} m.`),
        trap("added", f + g + h, () => `Adding the edges gives a length. Volume multiplies the three edges.`),
      ],
      verify: (s) => `${fmt(s)} m³ ÷ ${fmt(h)} m is ${fmt(s / h)} m² for the bottom of the box, but ${fmt(f)} m × ${fmt(g)} m is the bottom.`,
      next: `Multiply the length ${fmt(f)}, the width ${fmt(g)} and the height ${fmt(h)}.`,
    },
    surface: {
      traps: [
        trap("volume", vol, () => `That is the volume, in cubic units. Surface area adds up the flat faces, in square units.`),
        trap("three-faces", f * g + f * h + g * h, () => `That counts one of each kind of face. A closed box has two of every kind: six faces.`),
        trap("five-faces", sa - f * g, () => `That leaves out one face. A closed net has six faces.`),
        trap("walls-only", 2 * (f * h + g * h), () => `That counts only the four walls. The closed box also has a top and a bottom.`),
      ],
      verify: (s) => `Half of ${fmt(s)} m² is ${fmt(s / 2)} m² for one of each kind of face, but the three kinds for this box are ${fmt(f)} by ${fmt(g)}, ${fmt(f)} by ${fmt(h)} and ${fmt(g)} by ${fmt(h)}.`,
      next: `Find the three face areas, add them, then double the total.`,
    },
  };
}
