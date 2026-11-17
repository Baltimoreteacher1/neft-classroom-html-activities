import {
  circle,
  clipRect,
  contact,
  ellipse,
  g,
  HAIR,
  light,
  mix,
  moon,
  P,
  path,
  person,
  rect,
  rgrad,
  rrect,
  SKIN,
  shade,
  sky,
  stars,
  stroke,
  tree,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";

const wall = "#9a6a5c";
const win = { x: 160, y: 166, w: 160, h: 132 };

export default {
  file: "35-reading-night.svg",
  w: 640,
  h: 400,
  title:
    "A child looks out of a window at night and waves. A round, bright moon and stars shine in the dark sky.",
  draw: () =>
    sky(640, 400, "night") +
    stars(640, 230, 46, 11) +
    moon(520, 86, 36) +
    path("M0 318 Q120 286 260 304 Q420 280 640 300 L640 400 L0 400Z", "#1f3b57") +
    tree(590, 338, 0.85, { tone: "#2c5a63" }) +
    tree(452, 330, 0.5, { kind: "pine", tone: "#24505a" }) +
    rect(
      0,
      338,
      640,
      62,
      vgrad([
        [0, "#2f5a4f"],
        [1, "#203f3a"],
      ]),
    ) +
    // house
    contact(250, 352, 220, 10, 0.3) +
    rect(60, 120, 330, 232, wall) +
    rect(300, 120, 90, 232, shade(wall, 0.18)) +
    path("M38 128 L225 30 L412 128Z", "#4b3a4f") +
    path("M225 30 L412 128 L225 128Z", shade("#4b3a4f", 0.25)) +
    rect(36, 124, 378, 10, "#3c2f40") +
    // door
    rect(336, 262, 40, 90, "#3c4f66") +
    circle(368, 308, 2.4, P.goldLight) +
    circle(356, 248, 5, "#ffe7a1") +
    circle(356, 248, 22, "#ffe7a1", 'opacity=".22"') +
    // window glow on the lawn
    ellipse(
      240,
      364,
      150,
      22,
      rgrad([
        [0, "#ffd98a", 0.35],
        [1, "#ffd98a", 0],
      ]),
    ) +
    // lit window with the child
    rect(win.x - 10, win.y - 10, win.w + 20, win.h + 20, "#efe3cf") +
    clipRect(
      win.x,
      win.y,
      win.w,
      win.h,
      0,
      rect(
        win.x,
        win.y,
        win.w,
        win.h,
        vgrad([
          [0, "#ffe9b0"],
          [1, "#f4c36a"],
        ]),
      ) +
        circle(win.x + 40, win.y + 20, 70, "#fff6d6", 'opacity=".45"') +
        rect(win.x, win.y + 96, win.w, 40, "#e2a96a", 'opacity=".5"') +
        person(232, win.y + 168, 150, {
          pose: "wave",
          skin: SKIN[3],
          hair: HAIR[0],
          hairStyle: "curly",
          top: P.teal,
          bottom: P.navy,
          mouth: "open",
        }) +
        path(`M${win.x} ${win.y} h26 q-8 ${win.h / 2} 4 ${win.h} h-30Z`, P.coral) +
        path(
          `M${win.x + win.w} ${win.y} h-26 q8 ${win.h / 2} -4 ${win.h} h30Z`,
          shade(P.coral, 0.1),
        ),
    ) +
    rect(win.x - 18, win.y + win.h + 4, win.w + 36, 12, "#e4d6bf") +
    rect(win.x - 18, win.y + win.h + 12, win.w + 36, 4, shade("#e4d6bf", 0.3)) +
    // shrubs
    tree(88, 360, 0.6, { kind: "bush", tone: "#2f6450" }) +
    tree(300, 362, 0.55, { kind: "bush", tone: "#2a5c4a" }) +
    tree(20, 376, 0.5, { kind: "bush", tone: "#285646" }),
};
