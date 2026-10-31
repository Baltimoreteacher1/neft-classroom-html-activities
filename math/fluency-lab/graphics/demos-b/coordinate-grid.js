const triangle = [
  { x: -4, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 4 },
];
const range = { xmin: -6, xmax: 6, ymin: -6, ymax: 6 };
export const COORDINATE_GRID = {
  explore: {
    range,
    label: "Move the triangle",
    points: triangle,
    closed: true,
    transform: { type: "translate", dx: 5, dy: -4 },
  },
  build: { range, label: "Plot and join points to make a shape", points: [], step: 1 },
  check: {
    range,
    label: "Plot the points (3, -2) and (-4, 5)",
    points: [],
    target: { points: [[3, -2], [-4, 5]] },
  },
};
