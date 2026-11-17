import { P, panels, wallWindow } from "../kit.mjs";
import { kitchenBack, plate, breadSlice, cheeseLettuce, sandwichHalf, butterKnife } from "../lib/d.mjs";

// Three numbered steps, same counter, same plate: bread -> cheese and lettuce -> cut in half.
const step = (i, x, y, w, h) => {
  const cy = y + h * 0.34;
  const cx = x + w / 2;
  const py = y + h * 0.62;
  let s = kitchenBack(x, y, w, h, cy) + wallWindow(cx - 46, y + 34, 92, 64, { frame: P.ivory }) + plate(cx, py, 88);
  if (i === 0) s += breadSlice(cx - 40, py - 8, 74) + breadSlice(cx + 40, py - 8, 74);
  if (i === 1) s += breadSlice(cx - 40, py - 8, 74) + breadSlice(cx + 40, py - 8, 74) + cheeseLettuce(cx + 40, py - 14, 74);
  if (i === 2) s += sandwichHalf(cx - 30, py - 4, 84, -1) + sandwichHalf(cx + 30, py + 4, 84, 1) + butterKnife(cx + 6, py + 78, 1.3, -6);
  return s;
};

export default {
  file: "35-writing-sandwich-steps.svg",
  w: 640,
  h: 400,
  title: "Three steps to make a sandwich: 1) two slices of bread on a plate, 2) cheese and lettuce on one slice, 3) the finished sandwich cut in half.",
  draw: () => panels(640, 400, 3, step),
};
