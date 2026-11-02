// Learner-facing text helpers for the coordinate grid (every phrase goes through t()).
import { num, t } from "./b-core.js";
import { show } from "./b-rational.js";

export const numText = (v) => num(show(v));
export const pair = (p) => `(${numText(p.x)}, ${numText(p.y)})`;

export const where = (q) =>
  ({
    I: t("quadrant I"),
    II: t("quadrant II"),
    III: t("quadrant III"),
    IV: t("quadrant IV"),
    "x-axis": t("on the x-axis"),
    "y-axis": t("on the y-axis"),
    origin: t("at the origin"),
  })[q];
