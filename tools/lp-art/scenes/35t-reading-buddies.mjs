import { P, SKIN, HAIR, kid, tr, rect, circle, ellipse, path, stroke, vgrad, rgrad, shade, light, wallWindow, contact, g } from "../../../access-practice-lab/src/art/kit.js";
import { room, shelf, poseMix, floorSitter, openBook, plantPot, lightShaft } from "../lib/e.mjs";

// A classroom reading corner with a bookshelf. Left: a girl reads a book by herself on an orange beanbag.
// Right: two boys sit together on a blue rug and share one book.
const beanbag = (x, y, c = P.orange) =>
  g(
    contact(x, y + 2, 80, 10, 0.25) +
      path(`M${x - 78} ${y} Q${x - 92} ${y - 70} ${x - 40} ${y - 92} Q${x} ${y - 108} ${x + 44} ${y - 88} Q${x + 90} ${y - 62} ${x + 76} ${y} Z`, c) +
      path(`M${x + 44} ${y - 88} Q${x + 90} ${y - 62} ${x + 76} ${y} L${x + 30} ${y} Q${x + 40} ${y - 50} ${x + 44} ${y - 88}Z`, shade(c, 0.16), 'opacity=".75"') +
      path(`M${x - 64} ${y - 50} Q${x - 50} ${y - 84} ${x - 20} ${y - 92}`, "none", `stroke="${light(c, 0.35)}" stroke-width="6" opacity=".6"`) +
      path(`M${x - 70} ${y - 8} Q${x} ${y - 40} ${x + 70} ${y - 8}`, "none", `stroke="${shade(c, 0.22)}" stroke-width="3" opacity=".5"`),
  );

const rug = (x, y, rx, ry, c = "#3b7dc4") =>
  g(ellipse(x, y + 3, rx + 2, ry + 2, "#1c2f4a", 'opacity=".15"') + ellipse(x, y, rx, ry, c) + ellipse(x, y, rx * 0.8, ry * 0.74, "none", `stroke="${light(c, 0.3)}" stroke-width="4" opacity=".7"`) + ellipse(x, y, rx * 0.55, ry * 0.5, "none", `stroke="${shade(c, 0.2)}" stroke-width="3" opacity=".5"`));

export default {
  file: "35t-reading-buddies.svg",
  w: 640,
  h: 400,
  title: "A classroom reading corner with a bookshelf. On the left, a girl reads a book by herself on an orange beanbag chair. On the right, two boys sit together on a blue rug and read one book together.",
  draw: () =>
    room(640, 400, 262, { wall: "#efe3cc" }) +
    // paper bunting over the reading corner
    stroke("M20 40 Q120 70 230 44", "#8a6a48", 1.6) +
    [[40, P.coral], [72, P.gold], [104, P.teal], [136, P.blue], [168, P.pink], [200, P.green]]
      .map(([x, c], i) => {
        const y = 40 + Math.sin(((x - 20) / 210) * Math.PI) * 22 + (i < 3 ? 2 : -2);
        return path(`M${x - 11} ${y} L${x + 11} ${y} L${x} ${y + 24}Z`, c);
      })
      .join("") +
    wallWindow(468, 60, 120, 100, { view: "day", frame: P.ivory }) +
    lightShaft([[468, 160], [588, 160], [520, 262], [380, 262]], 0.14) +
    shelf(250, 262, 150, 196, { seed: 7, color: "#9a6a44", shelves: 4 }) +
    plantPot(600, 262, 0.75, { pot: "#c8704f" }) +
    // left: girl alone on the beanbag
    beanbag(140, 356) +
    poseMix(130, 304, 150, { ...kid(1), top: P.teal, bottom: "#3e4a5c", skirt: false, mouth: "smile", facing: 1 }, "read", "sit") +
    openBook(166, 278, 40, { cover: P.coral, tilt: -8 }) +
    // right: two boys on the blue rug sharing one book
    rug(470, 352, 150, 34) +
    floorSitter(414, 356, 140, { ...kid(0), top: P.gold, bottom: P.navy, facing: 1, mouth: "open" }, "read") +
    floorSitter(528, 356, 140, { ...kid(3), hairStyle: "short", top: P.coral, bottom: "#3e4a5c", facing: -1 }, "read") +
    openBook(471, 316, 52, { cover: P.blue }),
};
