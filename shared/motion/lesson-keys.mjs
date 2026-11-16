// Which lab model's motion figure goes with a lesson when its Practice bench model is not the lesson's own mathematics.
// 5-10 is volume of rectangular prisms; its bench uses the regular-polygon area model, so it takes the prism-volume figure
// (whole-number edges only: the lab's solid model has no fractional edges, which is a known gap).
export const FIGURE_KEY_OVERRIDE = Object.freeze({ "5-10": "solid:net" });

/** @param {string} lessonId @param {string} benchKey */
export const figureKeyFor = (lessonId, benchKey) => /** @type {Record<string, string>} */ (FIGURE_KEY_OVERRIDE)[lessonId] || benchKey;
