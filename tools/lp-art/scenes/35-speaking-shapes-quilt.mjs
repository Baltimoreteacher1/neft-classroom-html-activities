import {
  circle,
  contact,
  g,
  ground,
  light,
  line,
  P,
  poly,
  rect,
  rrect,
  shade,
  stroke,
  vgrad,
  wallWindow,
} from "../../../access-practice-lab/src/art/kit.js";

// Layout matches the original: T C T / R T C / C R T  (4 red triangles, 3 yellow circles, 2 blue rectangles).
const LAYOUT = ["T", "C", "T", "R", "T", "C", "C", "R", "T"];
const PATCH = [
  "#f6dfe0",
  "#e4efd9",
  "#f6dfe0",
  "#dbeaf3",
  "#f6dfe0",
  "#e4efd9",
  "#fbefcf",
  "#dbeaf3",
  "#f3e6d6",
];
const S = 96;
const X0 = 176;
const Y0 = 70;

const shape = (k, cx, cy) => {
  if (k === "T")
    return (
      poly(
        [
          [cx, cy - 32],
          [cx + 34, cy + 26],
          [cx - 34, cy + 26],
        ],
        P.red,
      ) +
      poly(
        [
          [cx, cy - 32],
          [cx + 34, cy + 26],
          [cx + 6, cy + 26],
        ],
        shade(P.red, 0.16),
        'opacity=".7"',
      ) +
      stroke(`M${cx - 30} ${cy + 22}L${cx} ${cy - 27}`, light(P.red, 0.4), 2, 'opacity=".6"')
    );
  if (k === "C")
    return (
      circle(cx, cy, 30, P.yellow) +
      circle(cx + 6, cy + 6, 24, shade(P.yellow, 0.12), 'opacity=".55"') +
      circle(cx - 9, cy - 10, 9, light(P.yellow, 0.5), 'opacity=".7"')
    );
  return (
    rect(cx - 36, cy - 20, 72, 40, P.blue) +
    rect(cx + 6, cy - 20, 30, 40, shade(P.blue, 0.15), 'opacity=".7"') +
    rect(cx - 33, cy - 17, 40, 3, light(P.blue, 0.4), 'opacity=".7"')
  );
};

const quilt = () => {
  let s = rrect(X0 - 12 + 4, Y0 - 12 + 8, S * 3 + 24, S * 3 + 24, 10, "#1c2f4a", 'opacity=".16"');
  s += rrect(X0 - 12, Y0 - 12, S * 3 + 24, S * 3 + 24, 10, P.navy);
  LAYOUT.forEach((k, i) => {
    const x = X0 + (i % 3) * S;
    const y = Y0 + Math.floor(i / 3) * S;
    s += rect(x, y, S, S, PATCH[i]);
    // tiny print dots on the fabric
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++)
        s += circle(x + 12 + a * 24, y + 12 + b * 24, 1.6, shade(PATCH[i], 0.12));
    s += rect(
      x + 5,
      y + 5,
      S - 10,
      S - 10,
      "none",
      `stroke="${shade(PATCH[i], 0.3)}" stroke-width="1.6" stroke-dasharray="5 4"`,
    );
    s += shape(k, x + S / 2, y + S / 2 + (k === "T" ? 2 : 0));
  });
  let seams = "";
  for (let i = 1; i < 3; i++)
    seams += `M${X0 + i * S} ${Y0}V${Y0 + 3 * S}M${X0} ${Y0 + i * S}H${X0 + 3 * S}`;
  s += stroke(seams, P.navyDeep, 2.4);
  // hanging rod
  s +=
    line(X0 - 34, Y0 - 22, X0 + 3 * S + 34, Y0 - 22, P.woodDark, 9) +
    line(X0 - 34, Y0 - 24, X0 + 3 * S + 34, Y0 - 24, P.woodLight, 2.4) +
    circle(X0 - 36, Y0 - 22, 8, P.wood) +
    circle(X0 + 3 * S + 36, Y0 - 22, 8, P.wood);
  for (const tx of [X0 + 20, X0 + S * 1.5, X0 + 3 * S - 20])
    s += rect(tx - 7, Y0 - 26, 14, 18, P.navy);
  return s;
};

export default {
  file: "35-speaking-shapes-quilt.svg",
  w: 640,
  h: 400,
  title:
    "A colorful quilt made of nine squares in three rows. Four squares have a red triangle, three squares have a yellow circle, and two squares have a blue rectangle.",
  draw: () =>
    rect(
      0,
      0,
      640,
      400,
      vgrad([
        [0, "#f6ecdb"],
        [1, "#efe0c8"],
      ]),
    ) +
    rect(0, 0, 640, 30, "#e9d9bf") +
    ground(640, 374, 26, "floor") +
    rect(0, 370, 640, 6, "#c7a274") +
    quilt(),
};
