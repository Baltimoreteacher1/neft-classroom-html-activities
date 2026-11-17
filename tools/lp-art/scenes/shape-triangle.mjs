import { solidShape, shapeCard } from "../lib/f.mjs";

// Answer-choice picture: a triangle (same three vertices as the original).
export default {
  file: "shape-triangle.svg",
  w: 640,
  h: 400,
  title: "a triangle",
  grain: false,
  draw: () => shapeCard(640, 400) + solidShape((a) => `<path d="M320 82L455 316L185 316Z" ${a}/>`, "#8fc6de"),
};
