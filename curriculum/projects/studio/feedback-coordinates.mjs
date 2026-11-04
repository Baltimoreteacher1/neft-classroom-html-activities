/** Coordinate missions: location (signed) is not distance (unsigned); reflections change one sign. */
import { fmt, trap } from "./feedback-util.mjs";
export const judged = [
  "Whether your map makes direction and distance unambiguous for a visitor or a crew",
  "How clearly the plan labels axes, quadrants and the reflected point",
  "Your explanation of why signed coordinates and distances answer different questions",
];
export function facts(project, by, v, ok) {
  const out = [];
  if (ok("distance", "a-zero")) out.push(Math.sign(v.a) * Math.sign(v.c) < 0 ? "A and B are on opposite sides of the y-axis, so their distances from zero add to the route length." : "A and B are on the same side of the y-axis, so the route length is the difference of their distances from zero.");
  if (ok("reflect-x", "reflect-y")) out.push(`Across the y-axis A moves to (${fmt(-v.a)}, ${fmt(v.b)}); across the x-axis it moves to (${fmt(v.a)}, ${fmt(-v.b)}). Each reflection changes exactly one sign.`);
  return out;
}
export function spec(project, v) {
  const { a, b, c } = v;
  const dist = Math.abs(c - a);
  const bigger = Math.abs(a) >= Math.abs(c) ? a : c;
  return {
    distance: {
      traps: [
        trap("signed", c < a ? c - a : [], () => `A distance is never negative. It is how many units apart the points are, with the direction left out.`),
        trap("added-absolutes", Math.abs(a) + Math.abs(c), () => `That adds each point's distance from zero. Doing that only works when the points are on opposite sides of the y-axis; here A is at x = ${a} and B is at x = ${c}.`),
        trap("ignored-sides", Math.abs(Math.abs(a) - Math.abs(c)), () => `That subtracts the two distances from zero. Doing that only works when both points are on the same side of the y-axis; here A is at x = ${a} and B is at x = ${c}.`),
      ],
      verify: (s) => `${fmt(s)} units does not take A (x = ${a}) to B (x = ${c}) along the shared row y = ${b}. Count the steps between ${a} and ${c} on a number line.`,
      next: `Place ${a} and ${c} on a number line and count the steps between them, with no minus sign on the answer.`,
    },
    "a-zero": {
      traps: [
        trap("signed", a < 0 ? a : [], () => `A distance from zero is not negative. It is how far the point is from the axis, whichever side it is on.`),
        trap("used-b", Math.abs(b), () => `That is the distance of A's y-coordinate, ${b}, from zero. The question asks about the x-coordinate ${a}.`),
        trap("used-c", Math.abs(c), () => `That is point B's x-coordinate, ${c}. The question is about A's x-coordinate, ${a}.`),
      ],
      verify: (s) => `A distance of ${fmt(s)} from zero puts the point at ${fmt(s)} or at -${fmt(s)}, but A's x-coordinate is ${a}.`,
      next: `Count the steps from ${a} to 0 on a number line.`,
    },
    "reflect-x": {
      traps: [
        trap("no-change", a, () => `That is A's x-coordinate before the reflection. A mirror in the y-axis swaps left and right, so x changes.`),
        trap("wrong-axis", -b, () => `That is the y-coordinate after a reflection across the x-axis. This question reflects across the y-axis and asks for the new x.`),
        trap("gave-y", b, () => `That is A's y-coordinate. The question asks for the new x-coordinate.`),
      ],
      verify: (s) => `The point A is at x = ${a}, which is ${Math.abs(a)} from the y-axis. A reflection lands the same distance away on the other side, but ${fmt(s)} is ${fmt(Math.abs(s))} from it.`,
      next: `A reflection across the y-axis keeps the distance from the y-axis and moves to the other side.`,
    },
    "reflect-y": {
      traps: [
        trap("no-change", b, () => `That is A's y-coordinate before the reflection. A mirror in the x-axis swaps above and below, so y changes.`),
        trap("wrong-axis", -a, () => `That is the new x-coordinate after reflecting across the y-axis. This question reflects across the x-axis and asks for the new y.`),
        trap("gave-x", a, () => `That is A's x-coordinate. The question asks for the new y-coordinate.`),
      ],
      verify: (s) => `A is at y = ${b}, which is ${Math.abs(b)} from the x-axis. A reflection lands the same distance away on the other side, but ${fmt(s)} is ${fmt(Math.abs(s))} from it.`,
      next: `A reflection across the x-axis keeps the distance from the x-axis and moves to the other side.`,
    },
    opposite: {
      traps: [
        trap("half", Math.abs(b), () => `That is only the distance from A to the x-axis. The reflection is the same distance on the other side, so there are two such stretches.`),
        trap("signed", b < 0 ? 2 * b : [], () => `A distance cannot be negative. Count the units between the two points without a sign.`),
        trap("y-axis-pair", 2 * Math.abs(a), () => `That is the gap to a reflection across the y-axis. This question reflects across the x-axis, so it depends on y = ${b}.`),
      ],
      verify: (s) => `Half of ${fmt(s)} is ${fmt(s / 2)} on each side of the x-axis, but A is ${Math.abs(b)} from it (its y is ${b}).`,
      next: `Find A's distance from the x-axis, then count the same distance on the other side.`,
    },
    compare: {
      traps: [
        trap("larger-absolute", bigger, () => `That is the number farther from zero. On a number line the larger number is the one farther to the right, whatever its sign.`),
        trap("smaller", Math.min(a, c), () => `That is the smaller of the two. The question asks for the larger signed number.`),
      ],
      verify: (s) => `${fmt(s)} is neither ${a} nor ${c}. Compare ${a} and ${c} on a number line and pick the one farther right.`,
      next: `Put ${a} and ${c} on a number line. The one farther right is larger.`,
    },
  };
}
