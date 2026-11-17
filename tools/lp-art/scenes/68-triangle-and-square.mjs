import { solidShape, shapeCard } from "../lib/f.mjs";

// Math-talk stimulus: an isosceles triangle (3 sides) and a square (4 equal sides). Geometry is the original's, exactly.
export default {
  file: "68-triangle-and-square.svg",
  w: 640,
  h: 400,
  title: "A triangle and a square side by side.",
  grain: false,
  draw: () =>
    shapeCard(640, 400) +
    solidShape((a) => `<path d="M175 95L290 305L60 305Z" ${a}/>`, "#f2a98f") +
    solidShape((a) => `<rect x="370" y="95" width="210" height="210" ${a}/>`, "#8fc6de"),
};
