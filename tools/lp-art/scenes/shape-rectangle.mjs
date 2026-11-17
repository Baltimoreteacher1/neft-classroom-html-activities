import { shapeCard, solidShape } from "../lib/f.mjs";

// Answer-choice picture: a rectangle (same position and 300 by 180 proportions as the original).
export default {
  file: "shape-rectangle.svg",
  w: 640,
  h: 400,
  title: "a rectangle",
  grain: false,
  draw: () =>
    shapeCard(640, 400) +
    solidShape((a) => `<rect x="170" y="110" width="300" height="180" ${a}/>`, "#8fc6de"),
};
