import { fracCircle } from "../lib/a.mjs";

export default {
  file: "35-listening-frac-3of6.svg",
  w: 640,
  h: 400,
  title: "A circle cut into six equal parts. Three parts are shaded.",
  draw: () => fracCircle(6, 3),
};
