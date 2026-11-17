import {
  bookshelf,
  chair,
  circle,
  contact,
  ellipse,
  g,
  ground,
  HAIR,
  light,
  line,
  P,
  path,
  person,
  poly,
  rect,
  rrect,
  SKIN,
  shade,
  sky,
  stroke,
  vgrad,
  wallWindow,
} from "../../../access-practice-lab/src/art/kit.js";
import { bookCover, icon } from "../lib/a.mjs";

const FLOOR = 292;
const TOP = 298; // table top

const sharkArt = (x, y, w, h) => {
  const cx = 0;
  const cy = 0;
  let s = rect(
    x + 6,
    y - h,
    w - 8,
    h,
    vgrad([
      [0, "#7cc4df"],
      [1, "#2f7ea6"],
    ]),
  );
  s += stroke(
    `M${x + 12} ${y - 10} q6 -4 12 0 t12 0M${x + 34} ${y - h + 12} q5 -3 10 0`,
    "#bfe4f0",
    1.4,
    'opacity=".8"',
  );
  let k = "";
  k += path(
    `M${cx - 22} ${cy} Q${cx - 6} ${cy - 12} ${cx + 16} ${cy - 3} L${cx + 26} ${cy - 12} L${cx + 23} ${cy + 1} L${cx + 27} ${cy + 12} L${cx + 15} ${cy + 4} Q${cx - 4} ${cy + 12} ${cx - 22} ${cy}Z`,
    "#8a9aa8",
  );
  k += path(`M${cx - 4} ${cy - 8} L${cx + 2} ${cy - 20} L${cx + 6} ${cy - 6}Z`, "#8a9aa8");
  k += path(
    `M${cx - 20} ${cy + 1} Q${cx - 4} ${cy + 9} ${cx + 14} ${cy + 3}`,
    "#e9eef2",
    'opacity=".9"',
  );
  k += circle(cx - 14, cy - 2, 1.6, P.ink) + stroke(`M${cx - 18} ${cy + 3} h5`, P.ink, 1);
  return s + `<g transform="translate(${x + w / 2 + 2} ${y - h / 2 + 4}) scale(1.15)">${k}</g>`;
};
const moonArt = (x, y, w, h) => {
  let s = rect(
    x + 6,
    y - h,
    w - 8,
    h,
    vgrad([
      [0, "#1d3157"],
      [1, P.navyDeep],
    ]),
  );
  s +=
    circle(x + w / 2 + 2, y - h / 2 + 2, 19, "#f8edc4") +
    circle(x + w / 2 + 8, y - h / 2 - 4, 3.4, "#e6d8a6") +
    circle(x + w / 2 - 6, y - h / 2 + 8, 2.6, "#e6d8a6") +
    circle(x + w / 2 + 6, y - h / 2 + 10, 2, "#e6d8a6");
  for (const [sx, sy] of [
    [14, -h + 10],
    [w - 12, -h + 14],
    [16, -14],
    [w - 14, -12],
  ])
    s += icon("star", x + sx, y + sy, 3.4, "#fff3c4");
  return s;
};

export default {
  file: "35-reading-library.svg",
  w: 640,
  h: 400,
  title:
    "A boy and a girl read at a big table in a library. The boy's book has a shark on the cover, and the girl's book has a moon on the cover. Bookshelves are behind them.",
  draw: () =>
    sky(640, FLOOR, "indoor") +
    ground(640, FLOOR, 400 - FLOOR, "floor") +
    rect(0, FLOOR - 6, 640, 8, "#c9a77c") +
    bookshelf(18, FLOOR, 150, 236, { seed: 3 }) +
    bookshelf(472, FLOOR, 150, 236, { seed: 12 }) +
    wallWindow(252, 46, 136, 92, { view: "day" }) +
    rrect(186, 172, 268, 6, 3, "#d9c19c") +
    // chairs behind the children
    rrect(196, 186, 72, 114, 12, P.teal) +
    rrect(204, 194, 56, 8, 4, light(P.teal, 0.2)) +
    rrect(374, 186, 72, 114, 12, P.coral) +
    rrect(382, 194, 56, 8, 4, light(P.coral, 0.2)) +
    // Kenji (shark book) and his sister (moon book)
    person(232, 352, 158, {
      pose: "stand",
      skin: SKIN[1],
      hair: HAIR[6],
      hairStyle: "short",
      top: P.blue,
      bottom: P.navy,
      glasses: false,
    }) +
    person(410, 352, 152, {
      pose: "stand",
      facing: -1,
      skin: SKIN[1],
      hair: HAIR[6],
      hairStyle: "long",
      top: P.gold,
      bottom: P.navy,
      skirt: false,
    }) +
    // the big table (front panel hides legs)
    contact(320, 386, 250, 10, 0.22) +
    rect(
      104,
      TOP + 8,
      432,
      76,
      vgrad([
        [0, shade(P.wood, 0.3)],
        [1, shade(P.wood, 0.12)],
      ]),
    ) +
    rect(
      120,
      TOP + 20,
      190,
      52,
      "none",
      `stroke="${shade(P.wood, 0.35)}" stroke-width="2" rx="4"`,
    ) +
    rect(
      330,
      TOP + 20,
      190,
      52,
      "none",
      `stroke="${shade(P.wood, 0.35)}" stroke-width="2" rx="4"`,
    ) +
    rrect(92, TOP - 4, 456, 14, 4, P.wood) +
    rect(92, TOP - 4, 456, 4, light(P.wood, 0.3)) +
    // books held upright, covers toward us, resting on the table
    bookCover(198, TOP + 4, 70, 62, sharkArt(198, TOP + 4, 70, 62), { color: "#2f7ea6" }) +
    bookCover(374, TOP + 4, 70, 62, moonArt(374, TOP + 4, 70, 62), { color: P.navyDeep }) +
    circle(200, TOP - 24, 8, SKIN[1]) +
    circle(270, TOP - 24, 8, SKIN[1]) +
    circle(376, TOP - 24, 8, SKIN[1]) +
    circle(446, TOP - 24, 8, SKIN[1]) +
    // a reading lamp between them
    contact(320, TOP - 3, 20, 3) +
    rect(304, TOP - 8, 32, 6, P.ink) +
    line(320, TOP - 6, 316, TOP - 52, P.ink, 3) +
    path(`M298 ${TOP - 46} L336 ${TOP - 46} L328 ${TOP - 66} L306 ${TOP - 66}Z`, P.teal) +
    ellipse(317, TOP - 46, 17, 3, "#fff3c4"),
};
