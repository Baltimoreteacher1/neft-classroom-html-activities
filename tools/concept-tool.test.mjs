// Pins the stem -> manipulative rules that decide which lab a problem offers.
// Both halves matter: the substring collisions that used to open the WRONG lab
// (cabinet/net, made/mad, power cable/exponents) and the rules that must keep
// firing. One detector serves the lesson renderer and the small-group studio.
import assert from "node:assert";

const { detectConceptTool } = await import("@eduwonderlab/engine/core/concept-tool.js");
const k = (s) => detectConceptTool(s)?.kind ?? null;
// the collisions this rewrite exists to stop
assert.strictEqual(
  k("The Star Blaster cabinet scored 90 points in 3 games."),
  null,
  "cabinet ≠ net",
);
assert.strictEqual(k("How many inches tall is the 7-foot cabinet?"), null, "cabinet ≠ net");
assert.strictEqual(
  k("An L-shaped room is made of two rectangles: 10 ft × 6 ft"),
  "area-morph",
  "made ≠ mad",
);
assert.strictEqual(k("A power cable measures 2.5 kilometers"), null, "power cable ≠ exponents");
assert.strictEqual(
  k("A triangle has base 12 and height 8. Find the area."),
  "area-morph",
  "base+height is geometry",
);
// the rules that must keep firing
assert.strictEqual(k("Fold the net to find the surface area of the prism."), "surface-area-packer");
assert.strictEqual(k("Find the mean absolute deviation of the data."), "mad-balance-sandbox");
assert.strictEqual(k("What is 3 to the 4th power? Use exponents."), "power-builder");
assert.strictEqual(k("Divide the fraction 3/4 ÷ 1/2."), "fraction-divide");
assert.strictEqual(k("Solve the equation x + 5 = 12."), "algebra-balance-scale");
assert.strictEqual(k("Graph the inequality x ≥ 6."), "neon-inequality");
assert.strictEqual(k("Plot the ordered pair in quadrant II."), "coordinate-navigator");
assert.strictEqual(k("Which quartile holds the median? Read the box plot."), "box-plot-detective");
console.log("concept-tool: 13 cases PASS");
