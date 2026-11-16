// Which lab model's motion figure goes with a lesson when its Practice bench model is not the lesson's own mathematics.
// 5-10 is volume with fractional edges; its bench uses the regular-polygon area model, so it takes the fractional-volume figure
// (a standalone figure: the lab solid model has only whole-number edges).
// 5-4 is composite areas; its bench uses the trapezoid model, so it takes the composite figure (a standalone figure with no lab of its own).
export const FIGURE_KEY_OVERRIDE = Object.freeze({ "5-10": "solid:fractional", "5-4": "area:composite" });

/** @param {string} lessonId @param {string} benchKey */
export const figureKeyFor = (lessonId, benchKey) => /** @type {Record<string, string>} */ (FIGURE_KEY_OVERRIDE)[lessonId] || benchKey;
