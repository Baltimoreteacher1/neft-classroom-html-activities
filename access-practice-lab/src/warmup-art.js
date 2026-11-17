// Word-card pictures for the Daily Warm-Up: twelve themed scenes drawn in code (original EduWonderLab art, no image
// files). A word's picture shows the theme it belongs to, so the learner links the new word to a place or a feeling
// before reading its meaning. Pure strings, no DOM: Node tests import THEMES.
//
// Art: the site illustration kit (./art/kit.js) in its picture-book style: no outlines, a lit and a shade side on
// each shape, a soft contact shadow, Deep Harbor colours. Drawn inside noDefs(): many cards share a page, so no ids.
// Every scene carries a <title> (and the card names the theme in words), so colour and shape are never the only signal.

import {
  P,
  circle,
  contact,
  ellipse,
  light,
  noDefs,
  path,
  poly,
  rect,
  rrect,
  shade,
  stroke,
  tr,
} from "./art/kit.js";

const frame = (title, bg, body) =>
  `<svg class="wu-art" viewBox="0 0 240 150" role="img" aria-label="${title}" focusable="false"><title>${title}</title><rect width="240" height="150" rx="14" fill="${bg}"/>${body}</svg>`;

/** A soft round spot behind the subject and a floor shadow, so every card reads as one family. */
const stage = (tone, y = 128) =>
  circle(120, 74, 56, tone, 'opacity=".55"') + contact(120, y, 70, 7, 0.14);

const book = (x, y, w, h, c) =>
  rrect(x, y, w, h, 4, c) +
  rect(x + 6, y + h - 7, w - 10, 5, "#fbf6ec") +
  rect(x, y, w, 5, light(c, 0.25), 'rx="2"') +
  rect(x + w - 16, y, 10, h - 7, shade(c, 0.15));

const DRAW = {
  school: () =>
    frame(
      "Books and a pencil",
      "#e4eef2",
      stage("#cfe2ea") +
        book(52, 96, 110, 24, P.navy) +
        book(62, 72, 96, 24, P.coral) +
        book(72, 50, 80, 22, P.teal) +
        `<g transform="rotate(26 190 84)">${rect(182, 40, 16, 70, P.yellow)}${rect(190, 40, 8, 70, shade(P.yellow, 0.15))}${poly(
          [
            [182, 110],
            [198, 110],
            [190, 126],
          ],
          "#f0d6b0",
        )}${poly(
          [
            [187, 120],
            [193, 120],
            [190, 126],
          ],
          P.ink,
        )}${rect(182, 30, 16, 10, P.pink, 'rx="3"')}${rect(182, 38, 16, 4, "#b9c0c8")}</g>`,
    ),
  food: () =>
    frame(
      "An apple in a bowl",
      "#f8ecd8",
      stage("#f1d9b8") +
        circle(140, 72, 22, P.yellow) +
        path("M150 52 A22 22 0 0 1 150 92 A16 22 0 0 0 150 52Z", shade(P.yellow, 0.14)) +
        circle(104, 68, 27, P.red) +
        path("M112 42 A27 27 0 0 1 112 94 A20 27 0 0 0 112 42Z", shade(P.red, 0.2)) +
        ellipse(94, 58, 6, 10, "#fff", 'opacity=".45"') +
        stroke("M104 42 q2 -10 10 -14", P.barkDark, 3.5) +
        path("M110 32 q10 -10 20 -2 q-10 8 -20 2Z", P.leaf) +
        path("M58 88 H182 Q178 128 120 130 Q62 128 58 88Z", P.teal) +
        path("M120 88 H182 Q178 128 120 130Z", shade(P.teal, 0.18)) +
        rect(56, 86, 128, 7, light(P.teal, 0.3), 'rx="3.5"'),
    ),
  home: () =>
    frame(
      "A house with a door",
      "#e6f0ea",
      stage("#cfe3d6") +
        rect(64, 66, 112, 62, "#f1e4cf") +
        rect(136, 66, 40, 62, shade("#f1e4cf", 0.1)) +
        poly(
          [
            [52, 70],
            [120, 22],
            [188, 70],
          ],
          P.coral,
        ) +
        poly(
          [
            [120, 22],
            [188, 70],
            [120, 70],
          ],
          shade(P.coral, 0.2),
        ) +
        rect(152, 30, 14, 26, P.brick) +
        rrect(104, 88, 32, 40, 3, P.navy) +
        circle(130, 110, 2.2, P.goldLight) +
        rect(74, 80, 22, 20, "#fbf6ec") +
        rect(77, 83, 16, 14, "#a8d3ea") +
        rect(146, 80, 22, 20, "#fbf6ec") +
        rect(149, 83, 16, 14, "#a8d3ea"),
    ),
  body: () => {
    const S = "#e0a98a";
    const D = shade(S, 0.16);
    const finger = (x, y, h) =>
      rrect(x, y, 14, h, 7, S) +
      rect(x + 9, y + 6, 5, h - 8, D, 'rx="2.5"') +
      ellipse(x + 7, y + 6, 4, 3, light(S, 0.3));
    return frame(
      "An open hand",
      "#f6e6dc",
      stage("#efd2c2") +
        finger(92, 34, 54) +
        finger(109, 24, 62) +
        finger(126, 30, 58) +
        finger(143, 44, 46) +
        path("M90 80 H158 Q164 116 130 132 Q96 136 90 112Z", S) +
        path("M140 80 H158 Q164 116 130 132 Q148 110 140 80Z", D) +
        path("M92 92 L72 70 Q64 64 60 72 Q60 78 66 84 L88 116Z", S) +
        stroke("M104 100 q10 12 26 14", D, 2),
    );
  },
  nature: () =>
    frame(
      "A tree on grass",
      "#e2efe2",
      rect(0, 112, 240, 38, P.grass) +
        rect(0, 112, 240, 6, P.grassLight) +
        circle(196, 36, 18, "#fff4c9", 'opacity=".5"') +
        circle(196, 36, 13, "#f4c54a") +
        contact(120, 116, 44, 6, 0.2) +
        path("M112 116 C113 100 112 86 115 70 L125 70 C128 86 127 100 128 116Z", P.bark) +
        path(
          "M121 70 C124 86 125 100 128 116 L122 116 C121 100 120 86 119 70Z",
          P.barkDark,
          'opacity=".6"',
        ) +
        circle(94, 66, 24, shade(P.leaf, 0.16)) +
        circle(146, 66, 24, shade(P.leaf, 0.16)) +
        circle(120, 46, 32, shade(P.leaf, 0.12)) +
        circle(114, 40, 26, P.leaf) +
        circle(90, 62, 18, P.leaf) +
        circle(140, 60, 18, P.leaf) +
        ellipse(106, 30, 12, 7, P.leafLight, 'opacity=".8"'),
    ),
  weather: () =>
    frame(
      "A sun behind a cloud with rain",
      "#dcebf4",
      circle(82, 52, 34, "#fff4c9", 'opacity=".55"') +
        circle(82, 52, 25, "#f4c54a") +
        circle(76, 46, 10, "#fde39a", 'opacity=".8"') +
        tr(
          128,
          76,
          ellipse(0, 8, 52, 15, "#d5e5ee") +
            circle(-26, 0, 20, "#fff") +
            circle(2, -12, 28, "#fff") +
            circle(30, 0, 19, "#fff") +
            ellipse(0, 6, 52, 14, "#fff"),
        ) +
        [
          [100, 104],
          [126, 112],
          [152, 104],
          [114, 128],
          [140, 128],
        ]
          .map(([x, y]) =>
            path(
              `M${x} ${y - 10} Q${x + 6} ${y} ${x} ${y + 4} Q${x - 6} ${y} ${x} ${y - 10}Z`,
              P.water,
            ),
          )
          .join(""),
    ),
  community: () =>
    frame(
      "Three buildings on a street",
      "#e8ebf0",
      rect(0, 128, 240, 22, "#c9ced6") +
        rect(0, 126, 240, 4, "#dfe3e8") +
        [
          [28, 68, 52, P.teal],
          [86, 42, 58, P.coral],
          [150, 80, 64, P.navy],
        ]
          .map(([x, y, w, c]) => {
            let b =
              rect(x, y, w, 128 - y, c) +
              rect(x + w * 0.7, y, w * 0.3, 128 - y, shade(c, 0.15)) +
              rect(x - 3, y - 5, w + 6, 6, shade(c, 0.3));
            for (let wy = y + 10; wy < 112; wy += 20)
              for (let wx = x + 9; wx < x + w - 14; wx += 18) b += rect(wx, wy, 10, 11, "#fbe9b8");
            return b;
          })
          .join(""),
    ),
  feelings: () =>
    frame(
      "A smiling face",
      "#f8ecd8",
      contact(120, 130, 40, 5, 0.12) +
        circle(120, 74, 50, P.gold) +
        path("M132 25 A50 50 0 0 1 132 123 A38 50 0 0 0 132 25Z", shade(P.gold, 0.14)) +
        ellipse(100, 46, 14, 8, P.goldLight, 'opacity=".8" transform="rotate(-25 100 46)"') +
        ellipse(104, 66, 5, 7, P.ink) +
        ellipse(136, 66, 5, 7, P.ink) +
        ellipse(92, 86, 8, 5, P.coralLight, 'opacity=".6"') +
        ellipse(148, 86, 8, 5, P.coralLight, 'opacity=".6"') +
        path("M98 88 Q120 112 142 88 Q120 98 98 88Z", "#7a2f2a"),
    ),
  science: () =>
    frame(
      "A flask with bubbles",
      "#dff0ee",
      stage("#c6e4e0") +
        path("M106 24 H134 V58 L166 112 Q172 128 156 128 H84 Q68 128 74 112 L106 58Z", "#e3f2f6") +
        path("M90 92 H150 L166 112 Q172 128 156 128 H84 Q68 128 74 112Z", P.tealLight) +
        path("M134 92 H150 L166 112 Q172 128 156 128 H140Z", P.teal) +
        rect(102, 18, 36, 8, "#c4dde4", 'rx="4"') +
        path("M110 30 V60 L84 104", "none", 'stroke="#ffffff" stroke-width="4" opacity=".7"') +
        circle(112, 108, 6, "#ffffff", 'opacity=".75"') +
        circle(130, 98, 4.5, "#ffffff", 'opacity=".75"') +
        circle(122, 76, 4, P.tealLight) +
        circle(128, 58, 3, P.tealLight),
    ),
  math: () =>
    frame(
      "A triangle, a square and a circle",
      "#e4ebf4",
      contact(120, 124, 100, 6, 0.12) +
        poly(
          [
            [30, 118],
            [70, 44],
            [110, 118],
          ],
          P.teal,
        ) +
        poly(
          [
            [70, 44],
            [110, 118],
            [70, 118],
          ],
          shade(P.teal, 0.15),
        ) +
        rect(116, 62, 56, 56, P.gold) +
        rect(152, 62, 20, 56, shade(P.gold, 0.15)) +
        circle(204, 94, 24, P.coral) +
        path("M210 70 A24 24 0 0 1 210 118 A17 24 0 0 0 210 70Z", shade(P.coral, 0.18)),
    ),
  story: () =>
    frame(
      "An open book with a star",
      "#f4ead8",
      stage("#ecd9b8", 130) +
        path("M120 52 C102 40 76 38 50 44 V122 C76 116 102 118 120 130Z", "#ffffff") +
        path("M120 52 C138 40 164 38 190 44 V122 C164 116 138 118 120 130Z", "#f1e4cf") +
        path("M120 52 V130", "none", `stroke="${shade("#f1e4cf", 0.25)}" stroke-width="2"`) +
        stroke(
          "M62 62 q24 -4 46 4M62 76 q24 -4 46 4M62 90 q24 -4 46 4M132 66 q24 -8 46 -4M132 80 q24 -8 46 -4",
          "#c9bfae",
          2.4,
        ) +
        path(
          "M120 10 L126 23 L140 24 L129 33 L133 47 L120 40 L107 47 L111 33 L100 24 L114 23Z",
          P.gold,
        ) +
        path("M120 10 L126 23 L140 24 L129 33 L133 47 L120 40Z", shade(P.gold, 0.12)),
    ),
  movement: () =>
    frame(
      "A ball bouncing along a path",
      "#e2efdf",
      rect(0, 124, 240, 26, P.grass) +
        rect(0, 124, 240, 5, P.grassLight) +
        path(
          "M20 120c40-70 80-70 100 0 20-70 60-70 100 0",
          "none",
          'stroke="#123a5c" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round" opacity=".55"',
        ) +
        contact(120, 124, 18, 4, 0.18) +
        circle(120, 58, 22, P.coral) +
        stroke("M100 50 Q120 62 140 50M120 36 Q110 58 120 80", shade(P.coral, 0.3), 2.4) +
        path("M126 36 A22 22 0 0 1 126 80 A16 22 0 0 0 126 36Z", shade(P.coral, 0.2)) +
        circle(112, 48, 5, "#ffffff", 'opacity=".5"'),
    ),
};

export const THEMES = Object.keys(DRAW);
export const THEME_NAMES = {
  school: ["School", "Escuela"],
  food: ["Food", "Comida"],
  home: ["Home", "Hogar"],
  body: ["The body", "El cuerpo"],
  nature: ["Nature", "Naturaleza"],
  weather: ["Weather", "El tiempo"],
  community: ["Community", "Comunidad"],
  feelings: ["Feelings", "Sentimientos"],
  science: ["Science", "Ciencias"],
  math: ["Math and shapes", "Matemáticas y formas"],
  story: ["Stories", "Cuentos"],
  movement: ["Moving and playing", "Moverse y jugar"],
};
export const themeSVG = (theme) => noDefs(DRAW[theme] || DRAW.story);
