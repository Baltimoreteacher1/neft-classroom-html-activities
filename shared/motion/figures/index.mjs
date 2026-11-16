// Registry of lesson-specific motion figures, keyed by the lab model they accompany ("kind:mode", the same key the learning-lab
// bench uses). One module per representation family; each exports an array of figures. See docs/motion-figure-contract.md.
import data from "./data.mjs";
import decimals from "./decimals.mjs";
import equations from "./equations.mjs";
import expressions from "./expressions.mjs";
import exponents from "./exponents.mjs";
import fractions from "./fractions.mjs";
import geometry from "./geometry.mjs";
import linesCoordinates from "./lines-coordinates.mjs";
import percent from "./percent.mjs";
import ratios from "./ratios.mjs";

/** @typedef {import("./mount.mjs").Figure} Figure */

/** @type {Figure[]} */
export const FIGURES = [...fractions, ...ratios, ...percent, ...expressions, ...data, ...decimals, ...geometry, ...linesCoordinates, ...equations, ...exponents];

/** @type {Map<string, Figure>} */
const byKey = new Map();
for (const f of FIGURES) {
  for (const k of f.keys) {
    if (byKey.has(k)) throw new Error(`two motion figures claim ${k}`);
    byKey.set(k, f);
  }
}

/** The figure for a lab model key such as "fraction:servings", or null. @param {string} key */
export const figureFor = (key) => byKey.get(key) || null;
