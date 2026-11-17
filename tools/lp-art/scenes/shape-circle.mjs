import { solidShape, shapeCard } from "../lib/f.mjs";

// Answer-choice picture: a circle (same centre and radius as the original).
export default {
  file: "shape-circle.svg",
  w: 640,
  h: 400,
  title: "a circle",
  grain: false,
  draw: () => shapeCard(640, 400) + solidShape((a) => `<circle cx="320" cy="200" r="112" ${a}/>`, "#8fc6de"),
};
