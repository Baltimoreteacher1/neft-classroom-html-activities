import { C, E, INK, Ln, N, Pa, R, dot, ic } from "./dsl.js";

// People take `skin` and `hair` options (index or hex); `color` recolours the clothing.
const person = (cx, base, s, c, shirt, { long = false, glasses = false } = {}) => {
  const hd = 10 * s;
  const top = base - 34 * s;
  return (
    (long ? E(cx, top - hd * 0.2, hd * 1.25, hd * 1.55, c.hair) : "") +
    Pa(
      `M${cx - 14 * s} ${base}Q${cx - 14 * s} ${top + 2 * s} ${cx} ${top + 2 * s}T${cx + 14 * s} ${base}Z`,
      shirt,
    ) +
    C(cx, top - hd * 0.5, hd, c.skin) +
    Pa(
      `M${cx - hd} ${top - hd * 0.7}Q${cx - hd * 0.9} ${top - hd * 1.9} ${cx} ${top - hd * 1.7}T${cx + hd} ${top - hd * 0.7}Q${cx + hd * 0.4} ${top - hd * 1.3} ${cx - hd} ${top - hd * 0.7}Z`,
      c.hair,
    ) +
    dot(cx - hd * 0.38, top - hd * 0.4, 1.6 * s) +
    dot(cx + hd * 0.38, top - hd * 0.4, 1.6 * s) +
    Ln(`M${cx - hd * 0.4} ${top + hd * 0.05}q${hd * 0.4} ${hd * 0.4} ${hd * 0.8} 0`, INK, 1.4) +
    (glasses
      ? Ln(
          `M${cx - hd * 0.7} ${top - hd * 0.4}h${hd * 0.6}M${cx + hd * 0.1} ${top - hd * 0.4}h${hd * 0.6}`,
          INK,
          1.4,
        )
      : "")
  );
};

// prettier-ignore
export default [
  ic("student", "people", "child kid learner pupil boy girl", "#3b7dc4", (c) => person(32, 60, 1.5, c, c.m)),
  ic("teacher", "people", "adult educator instructor class", "#4f9d5d", (c) =>
    person(32, 60, 1.5, c, c.m, { glasses: true }) + R(40, 40, 18, 13, 1.5, "#ffffff") + Ln("M43 45h12M43 49h8", INK, 1.4)),
  ic("family", "people", "home parents children together caregivers", "#d0473a", (c) =>
    person(18, 60, 1.05, c, c.m) + person(46, 60, 1.05, c, "#3b7dc4", { long: true }) + person(32, 60, 0.8, c, "#f2c335")),
];
