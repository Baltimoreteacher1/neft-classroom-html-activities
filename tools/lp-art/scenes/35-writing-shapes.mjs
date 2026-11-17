import {
  circle,
  clipRect,
  g,
  light,
  P,
  poly,
  rect,
  rgrad,
  rrect,
  shade,
  stroke,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";

// Counting picture: exactly three red circles in a row, two blue triangles beside them, one yellow square
// below the circles. Paper cut-outs with a little thickness and a soft shadow on a wooden table.
const RED = "#d0473a";
const BLUE = "#3b7dc4";
const YELLOW = "#f2c335";
const lift = (body, dark) =>
  g(
    `<g transform="translate(4 7)" opacity=".18">${body.replace(/fill="[^"]+"/g, 'fill="#1c2f4a"')}</g>`,
  ) +
  g(`<g transform="translate(0 4)">${body.replace(/fill="[^"]+"/g, `fill="${dark}"`)}</g>`) +
  body;
const disc = (x, y) =>
  lift(circle(x, y, 38, RED), shade(RED, 0.3)) +
  circle(x - 12, y - 13, 12, light(RED, 0.4), 'opacity=".45"');
const tri = (x, y) =>
  lift(
    poly(
      [
        [x, y - 44],
        [x + 48, y + 38],
        [x - 48, y + 38],
      ],
      BLUE,
    ),
    shade(BLUE, 0.3),
  ) +
  poly(
    [
      [x, y - 30],
      [x + 10, y - 12],
      [x - 14, y + 4],
    ],
    light(BLUE, 0.4),
    'opacity=".4"',
  );
const square = (x, y) =>
  lift(rrect(x - 42, y - 42, 84, 84, 3, YELLOW), shade(YELLOW, 0.3)) +
  rrect(x - 34, y - 34, 30, 14, 4, light(YELLOW, 0.5), 'opacity=".5"');

const table = () => {
  let planks = "";
  for (let i = 1; i < 6; i++) planks += `M40 ${40 + i * 54}H600`;
  let grain = "";
  for (let i = 0; i < 18; i++)
    grain += `M${60 + ((i * 97) % 520)} ${52 + ((i * 53) % 300)}q40 -4 90 0`;
  return (
    rrect(46, 48, 560, 330, 22, "#1c2f4a", 'opacity=".2"') +
    rrect(
      40,
      36,
      560,
      330,
      22,
      vgrad([
        [0, "#c99a6b"],
        [1, "#b07f52"],
      ]),
    ) +
    clipRect(
      40,
      36,
      560,
      330,
      22,
      stroke(planks, "#94673f", 1.6, 'opacity=".55"') +
        stroke(grain, "#a6764b", 1.4, 'opacity=".45"') +
        rect(
          40,
          36,
          560,
          330,
          rgrad(
            [
              [0, "#fff1d6", 0.35],
              [1, "#fff1d6", 0],
            ],
            { cx: 0.3, cy: 0.2, r: 0.8 },
          ),
        ),
    )
  );
};

export default {
  file: "35-writing-shapes.svg",
  w: 640,
  h: 400,
  title: "Shapes on a table: three red circles, two blue triangles, and one yellow square.",
  draw: () =>
    rect(
      0,
      0,
      640,
      400,
      vgrad([
        [0, "#efe4d2"],
        [1, "#e2d3bb"],
      ]),
    ) +
    table() +
    disc(126, 140) +
    disc(218, 140) +
    disc(310, 140) +
    tri(418, 142) +
    tri(526, 142) +
    square(218, 272),
};
