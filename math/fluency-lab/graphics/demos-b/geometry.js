export const GEOMETRY = {
  explore: { label: "Shapes and measurement", tool: "shape", shape: "parallelogram" },
  build: { label: "Drag the corners to make a trapezoid with area 24", tool: "shape", shape: "trapezoid" },
  check: {
    label: "Make a rectangle with an area of 24 square units",
    tools: ["shape"],
    tool: "shape",
    shape: "rectangle",
    target: { shape: "rectangle", area: 24 },
  },
};
