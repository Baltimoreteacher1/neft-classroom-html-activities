import {
  bars,
  begin,
  blob,
  card,
  check,
  circle,
  floorShadow,
  halo,
  light,
  magnifier,
  P,
  path,
  rect,
  rot,
  rrect,
  shade,
  sparkle,
  vgrad,
  wash,
} from "../lib/g.mjs";

// The flagged word (navy) with a coral wavy underline: one underlined word in the sentence.
const squiggle = (x, y, w, sw = 2.6) => {
  let d = `M${x} ${y}`;
  for (let i = 0; i < w / 8; i++) d += ` q2 -4 4 0 t4 0`;
  return path(d, "none", `stroke="${P.coral}" stroke-width="${sw}" stroke-linecap="round"`);
};
// Sentence lines: grey word-bars, the flagged word at line 2.
function sentence() {
  let s = "";
  const rows = [
    [
      [0, 70],
      [78, 52],
      [138, 90],
    ],
    [
      [0, 44],
      [52, 60, 1],
      [120, 72],
      [200, 34],
    ],
    [
      [0, 96],
      [104, 58],
      [170, 50],
    ],
    [
      [0, 62],
      [70, 80],
    ],
  ];
  rows.forEach((r, i) => {
    const y = 104 + i * 30;
    for (const [x, w, hit] of r)
      s +=
        rrect(102 + x, y, w, 9, 4.5, hit ? P.navy : "#cdd5df") +
        (hit ? squiggle(102 + x, y + 18, w) : "");
  });
  return s;
}

export default {
  file: "ds/studio-detective.svg",
  w: 480,
  h: 360,
  title: "A sentence card with one underlined word under a magnifying glass, and a check badge",
  draw: () =>
    begin() +
    wash(480, 360, "#fdf0ec", "#f7ddd6", { glow: "#ffffff", gy: 0.42 }) +
    blob(240, 176, 196, 136, "#f8d9cf", { tilt: -6 }) +
    floorShadow(250, 300, 168, 12, 0.16) +
    rot(
      240,
      170,
      -4,
      card(78, 76, 300, 190, 16, "#ffffff") +
        rrect(78, 76, 300, 12, 6, P.coral, 'opacity=".9"') +
        sentence(),
    ) +
    magnifier(186, 146, 52, {
      deg: 48,
      inner: `<g transform="translate(186 146) scale(1.45) translate(-186 -146)">${rot(240, 170, -4, rrect(60, 60, 340, 200, 0, "#ffffff") + sentence())}</g>`,
    }) +
    check(110, 268, 32, P.teal) +
    sparkle(400, 74, 10, P.gold) +
    sparkle(56, 120, 7, P.navy) +
    circle(420, 168, 4.5, P.teal) +
    circle(70, 64, 4, P.coral) +
    sparkle(430, 300, 6, P.coral),
};
