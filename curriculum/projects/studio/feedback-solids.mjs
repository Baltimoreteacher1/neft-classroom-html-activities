/** Solids missions: volume is inside (cubic), surface area is the material (square); an open top removes one face. */
import { fmt, trap, usd } from "./feedback-util.mjs";
export const judged = [
  "Whether the package or model you chose fits its purpose, beyond meeting the numbers",
  "How clearly your net labels every face and which edge folds onto which",
  "The trade-off you defend between capacity and material, and what the ideal model leaves out",
];
const OPEN = (project) => project.id === "unit-10-b";
export function facts(project, by, v, ok) {
  const out = [];
  if (ok("volume", "capacity")) out.push(by.capacity >= 0 ? `The design holds ${fmt(by.capacity)} cubic units more than the minimum capacity.` : `The design is ${fmt(-by.capacity)} cubic units short of the minimum capacity.`);
  if (ok("surface", "cost")) out.push(`The ${OPEN(project) ? "five-face" : "six-face"} model needs ${fmt(by.surface)} square units of material, which costs ${usd(by.cost)}.`);
  if (ok("volume", "surface")) out.push(`It holds ${Number((by.volume / by.surface).toFixed(2))} cubic units of space for each square unit of material.`);
  return out;
}
export function spec(project, v) {
  const { a, b, c, d, e } = v;
  const open = OPEN(project);
  const floor = a * b, vol = floor * c, sa = (open ? 1 : 2) * floor + 2 * a * c + 2 * b * c;
  const faces = open ? "five" : "six";
  return {
    floor: {
      traps: [
        trap("perimeter", 2 * (a + b), () => `That is the distance around the ${fmt(a)} by ${fmt(b)} base, a length. Base area counts the squares inside it.`),
        trap("added", a + b, () => `${fmt(a)} + ${fmt(b)} adds two edges. Area multiplies them.`),
        trap("volume", vol, () => `That multiplies in the height of ${fmt(c)} too, which gives volume. The base area uses length and width only.`),
      ],
      verify: (s) => `${fmt(s)} square units ÷ ${fmt(b)} is ${fmt(s / b)} for the length, but the base is ${fmt(a)} long.`,
      next: `Multiply the length ${fmt(a)} by the width ${fmt(b)}.`,
    },
    volume: {
      traps: [
        trap("base-only", floor, () => `That is the base area, in square units. Volume also uses the height of ${fmt(c)}.`),
        trap("surface", sa, () => `That is the material area, in square units. Volume counts cubes inside, in cubic units.`),
        trap("added", a + b + c, () => `Adding the three edges gives a length. Volume multiplies them.`),
      ],
      verify: (s) => `${fmt(s)} cubic units ÷ ${fmt(c)} high is ${fmt(s / c)} square units of base, but ${fmt(a)} × ${fmt(b)} is the base.`,
      next: `Multiply the base area by the height of ${fmt(c)}.`,
    },
    pair: {
      traps: [
        trap("one-face", a * c, () => `That is one length-by-height face. The two side faces come in a pair of equal size.`),
        trap("other-pair", 2 * b * c, () => `That uses the width ${fmt(b)}. The faces in this pair are length ${fmt(a)} by height ${fmt(c)}.`),
        trap("all-four", 2 * a * c + 2 * b * c, () => `That adds the other pair of walls too. The question names only the two length-by-height faces.`),
        trap("base-pair", 2 * floor, () => `That is the top and bottom. The question asks about the two side faces, which use the height.`),
      ],
      verify: (s) => `Half of ${fmt(s)} is ${fmt(s / 2)} for one face, but a face that is ${fmt(a)} long and ${fmt(c)} high is not that size.`,
      next: `Find one length-by-height face, then double it.`,
    },
    surface: {
      traps: [
        trap("volume", vol, () => `That is the volume, in cubic units. Material is the area of the faces, in square units.`),
        trap("three-faces", floor + a * c + b * c, () => `That counts one face of each kind. Faces come in pairs.`),
        trap("wrong-face-count", open ? sa + floor : sa - floor, () => (open ? `That counts a top face. This model is open at the top, so it has five faces.` : `That leaves out a face. A closed box has six faces.`)),
        trap("walls-only", 2 * a * c + 2 * b * c, () => `That counts the four walls only. The ${faces}-face model also has ${open ? "a base" : "a base and a top"}.`),
      ],
      verify: (s) => `Taking the four walls (${fmt(2 * a * c + 2 * b * c)}) away from ${fmt(s)} leaves ${fmt(s - 2 * a * c - 2 * b * c)} for the ${open ? "base" : "base and top"}, but a ${fmt(a)} by ${fmt(b)} face has its own area.`,
      next: `Add the ${faces} face areas: ${open ? "one base" : "two bases"} and the four walls.`,
    },
    cost: {
      traps: [
        trap("area-only", sa, () => `That is the material area, in square units. Each square unit costs ${usd(d)}, so multiply by the price.`),
        trap("volume-priced", vol * d, () => `That prices the volume. Material is bought by area, so the price multiplies the surface area.`),
        trap("added-rate", sa + d, () => `That adds a price to an area. A price per square unit multiplies the area.`),
      ],
      verify: (s) => `${usd(s)} ÷ ${usd(d)} per square unit is ${fmt(s / d)} square units of material, which does not match the ${faces} faces of your model.`,
      next: `Multiply the total material area by ${usd(d)}.`,
    },
    capacity: {
      traps: [
        trap("sign-flipped", e - vol, () => `The sign is reversed. The question subtracts the minimum capacity from the volume, so a design that falls short is negative.`),
        trap("gave-volume", vol, () => `That is the volume. The question compares it with the minimum capacity of ${fmt(e)}.`),
        trap("gave-target", e, () => `That is the minimum capacity itself. Subtract it from the volume.`),
      ],
      verify: (s) => `A difference of ${fmt(s)} would mean the volume is ${fmt(s + e)} cubic units (difference + ${fmt(e)}), but your base area and height do not make that volume.`,
      next: `Subtract the minimum capacity of ${fmt(e)} from the volume you found.`,
    },
  };
}
