import { P, sky, ground, wallWindow, rect, ellipse, vgrad, g, shade } from "../kit.mjs";
import { room, sitDog, sitCat, plantPot } from "../lib/e.mjs";

// A calm living-room portrait: the dog (left, bigger) and the cat (right, smaller) sit side by side on a rug.
export default {
  file: "68-dog-and-cat.svg",
  w: 640,
  h: 400,
  title: "A brown dog and an orange cat sitting side by side.",
  draw: () =>
    room(640, 400, 268, { wall: "#e9dcc4" }) +
    wallWindow(232, 66, 176, 120, { view: "day", frame: P.ivory }) +
    rect(0, 0, 640, 400, vgrad([[0, "#fff3d6", 0.0], [0.5, "#fff3d6", 0.12], [1, "#fff3d6", 0]], { x1: 0, y1: 0, x2: 1, y2: 0 })) +
    plantPot(90, 268, 1.05, { pot: "#b9694a", leaf: "#5f9a6a" }) +
    plantPot(560, 268, 0.85, { pot: "#d0885e", leaf: "#4f8f5b" }) +
    g(ellipse(320, 340, 250, 46, shade("#c9a26f", 0.1)) + ellipse(320, 336, 240, 42, "#d8b98a") + ellipse(320, 336, 200, 32, "none", 'stroke="#c9a26f" stroke-width="4" opacity=".7"') + ellipse(320, 336, 150, 22, "none", 'stroke="#b88a57" stroke-width="2" opacity=".45"')) +
    sitDog(240, 352, 2.2, { color: "#9c6436", facing: 1, collar: P.teal }) +
    sitCat(424, 352, 1.9, { color: "#e8913f", facing: -1 }),
};
