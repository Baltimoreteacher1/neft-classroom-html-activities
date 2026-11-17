import { fracCircle } from "../lib/a.mjs";

export default {
  file: "35-listening-frac-1of4.svg",
  w: 640,
  h: 400,
  title: "A circle cut into four equal parts. One part is shaded.",
  draw: () => fracCircle(4, 1),
};
