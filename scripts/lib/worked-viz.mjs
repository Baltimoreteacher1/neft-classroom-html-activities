// Draws the figure authored for a lesson's "Watch me" worked example (launch.conceptIntro.iDo.viz) with the same figure
// library the Practice Studios use (assets/studio-viz*.js). One renderer for the interactive lesson, the generated Learn It
// page and the validators, so a figure cannot look different in two places.
import "./studio-viz-global.mjs";
import "../../assets/studio-viz.js";
import "../../assets/studio-viz-geo.js";
import "../../assets/studio-viz-model.js";

/** @returns {string} an <svg> string, or "" when the spec cannot be drawn */
export function renderWorkedViz(spec) {
  const V = /** @type {any} */ (globalThis).StudioViz;
  if (!V || !spec || typeof spec !== "object" || !V.types.includes(spec.t)) return "";
  let svg = "";
  try {
    svg = V.render(JSON.parse(JSON.stringify(spec)));
  } catch {
    return "";
  }
  if (!svg.startsWith("<svg") || /data-viz-error/.test(svg)) return "";
  // learn.html and the printable put figures on a white page; the studio figure is transparent so it can take a world's colours.
  return svg
    .replace(/^<svg /, '<svg data-worked-viz="1" ')
    .replace(/style="/, 'style="background:white;');
}

const numbersIn = (s) =>
  (String(s).match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || []).map((n) => Number(n.replace(/,/g, "")));

/**
 * Problems with an authored figure, as strings. The rule is the one validate:learn-figures holds for drawn figures: a
 * figure that disagrees with the problem is worse than none, so every number the figure PRINTS must be a number the worked
 * example states (or a simple whole-number position on a scale axis).
 */
export function workedVizProblems(id, lines, spec) {
  const p = [];
  const svg = renderWorkedViz(spec);
  if (!svg) return [`${id}: iDo.viz does not render (${spec && spec.t})`];
  if (!/<title>[^<]{4,}<\/title>/.test(svg)) p.push(`${id}: figure has no text alternative`);
  if (/NaN|undefined|Infinity|\[object/.test(svg))
    p.push(`${id}: figure prints a non-finite value`);
  const said = new Set(numbersIn(lines.join(" ")));
  const title = (svg.match(/<title>([^<]*)<\/title>/) || [, ""])[1];
  const printed = numbersIn(title);
  const stray = printed.filter((n) => !said.has(n));
  if (stray.length)
    p.push(
      `${id}: figure prints ${[...new Set(stray)].join(", ")} but the worked example never states it`,
    );
  return p;
}
