import {
  circle,
  def,
  g,
  line,
  P,
  path,
  rect,
  rgrad,
  rng,
  rrect,
  stroke,
  text,
  vgrad,
} from "../../../access-practice-lab/src/art/kit.js";

// UI illustration for the river investigation lab: a field journal (FIELD NOTES / 04: a river map with two
// sample points, and a WHAT CHANGED? graph), a VOICE NOTE card (waveform + microphone) and a water-sample card
// (a sample vial and a dial), over a night-teal river landscape. It connects reading, writing, speaking and listening.
const W = 760;
const H = 530;
const ink = "#173c4c";
const rule = "#b3cbc8";

const shadow = () =>
  def(
    (i) =>
      `<filter id="${i}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#001323" flood-opacity=".42"/></filter>`,
    "sh",
  );

const backdrop = () => {
  let s = rrect(
    0,
    0,
    W,
    H,
    28,
    vgrad([
      [0, "#173f58"],
      [1, "#0a2438"],
    ]),
  );
  let d = "";
  for (let x = 26; x < W; x += 26) d += `M${x} 0V${H}`;
  for (let y = 26; y < H; y += 26) d += `M0 ${y}H${W}`;
  s += stroke(d, "#78c9cf", 1, 'opacity=".07"');
  s += circle(
    603,
    91,
    110,
    rgrad([
      [0, "#2fc0b2", 0.22],
      [1, "#2fc0b2", 0],
    ]),
  );
  s += circle(
    94,
    466,
    140,
    rgrad([
      [0, "#e9a765", 0.14],
      [1, "#e9a765", 0],
    ]),
  );
  // land and river
  s += path("M0 375C120 320 196 384 294 348s132-118 250-92 148 6 216-32v306H0Z", "#164c60");
  s += path(
    "M0 417c140-35 186 18 312-12 126-31 176-101 293-83 69 11 112 2 155-15v223H0Z",
    "#1a6f7b",
  );
  s += path(
    "M0 465c116-23 188 12 289-9 147-29 198-79 322-69 62 5 113-3 149-19v162H0Z",
    vgrad([
      [0, "#3ad6c6"],
      [1, "#1d7caa"],
    ]),
    'opacity=".82"',
  );
  s += stroke(
    "M0 474c116-23 188 12 289-9 147-29 198-79 322-69 62 5 113-3 149-19",
    "#abfff2",
    3,
    'opacity=".5"',
  );
  s += stroke("M70 500h60M300 488h44M520 430h50", "#d8fff8", 2, 'opacity=".35"');
  // reeds along the bank
  const R = rng(5);
  let reeds = "";
  for (let i = 0; i < 14; i++) {
    const x = 20 + R() * 720;
    const y = 420 + R() * 30 - (x > 400 ? 40 : 0);
    reeds += `M${x.toFixed(1)} ${y.toFixed(1)}q-3 -14 -1 -26M${(x + 4).toFixed(1)} ${y.toFixed(1)}q4 -12 7 -20`;
  }
  s += stroke(reeds, "#2b8a7f", 2, 'opacity=".55"');
  return s;
};

const journal = () => {
  let s = rrect(0, 0, 463, 312, 18, "#d9c9a6") + rrect(4, 4, 455, 304, 15, "#e8dcc0");
  s += rrect(
    11,
    11,
    441,
    290,
    10,
    vgrad([
      [0, "#fbf8f0"],
      [1, "#f3ecdc"],
    ]),
  );
  s += rect(
    226,
    12,
    10,
    288,
    vgrad(
      [
        [0, "#e2d8c2"],
        [0.5, "#f8f3e6"],
        [1, "#e2d8c2"],
      ],
      { x2: 1, y2: 0 },
    ),
  );
  for (let y = 34; y < 300; y += 26)
    s += circle(231, y, 4.2, "#9aa7b0") + circle(230, y - 1, 1.6, "#e9eef1");
  // left page: title, notes, map
  s += text(34, 48, "FIELD NOTES / 04", {
    size: 17,
    fill: ink,
    anchor: "start",
    extra: 'letter-spacing="2"',
  });
  s += stroke("M30 74h174M30 88h132", rule, 3);
  s += rrect(28, 106, 178, 150, 8, "#d5e6db");
  s += `<clipPath id="mapclip"><rect x="28" y="106" width="178" height="150" rx="8"/></clipPath><g clip-path="url(#mapclip)">`;
  s += path("M28 218c41-43 69-29 95-55 22-22 56-13 83-37v130H28Z", "#97ba94");
  s += stroke("M28 150c40 -14 80 -6 120 -30M28 180c50 -18 100 -4 178 -40", "#b9d2bd", 1.6);
  s += stroke("M30 246c42-33 65-17 94-38 28-21 44-33 80-40", "#318fb0", 22);
  s += stroke(
    "M30 246c42-33 65-17 94-38 28-21 44-33 80-40",
    "#b1efe9",
    4,
    'stroke-dasharray="2 10"',
  );
  s += `</g>`;
  for (const [x, y] of [
    [68, 219],
    [153, 190],
  ])
    s +=
      circle(x, y + 2, 8, "#0f3a4a", 'opacity=".25"') +
      circle(x, y, 7.5, "#f6c37a") +
      circle(x, y, 7.5, "none", 'stroke="#ffffff" stroke-width="3"');
  s += text(30, 280, "RIVER STUDY · NORTH BANK", {
    size: 11,
    fill: "#4a6768",
    weight: 700,
    anchor: "start",
  });
  // right page: graph and notes
  s += text(254, 49, "WHAT CHANGED?", { size: 14, fill: ink, anchor: "start" });
  s += stroke("M254 68h174M254 82h148", rule, 3);
  s += rrect(254, 104, 176, 120, 7, "#e6f1ed");
  s += stroke("M272 204h142M273 114v91", "#9bbab8", 2);
  s += stroke("M272 180h142M272 156h142M272 132h142", "#cfe0dc", 1.2);
  s += stroke("M276 190l32-22 31 7 37-43 35 12", "#e08761", 5);
  for (const [x, y] of [
    [276, 190],
    [308, 168],
    [339, 175],
    [376, 132],
    [411, 144],
  ])
    s += circle(x, y, 4.2, "#ffffff") + circle(x, y, 2.6, "#e08761");
  s += stroke("M254 244h170M254 259h155M254 274h109", rule, 3);
  // pencil resting across the spread
  s += `<g transform="translate(330 292) rotate(-14)">${rrect(0, -4, 96, 8, 2, "#f2c335")}${rect(0, -4, 96, 2.4, "#f7d978")}${path("M96 -4 l16 4 l-16 4Z", "#f0d6b0")}${path("M106 -1.4 l6 1.4 l-6 1.4Z", "#3b3b3b")}${rect(-10, -4, 10, 8, "#e58fb0")}${rect(-2, -4, 3, 8, "#c9ced3")}</g>`;
  return s;
};

const voiceCard = () => {
  let s = rrect(
    0,
    0,
    155,
    166,
    20,
    vgrad([
      [0, "#f1fbf8"],
      [1, "#e1f3ef"],
    ]),
  );
  s += rrect(18, 19, 119, 40, 12, "#d1ece9");
  const bars = [8, 20, 8, 26, 15, 33, 11, 27, 6, 18, 12];
  bars.forEach(
    (h, i) => (s += line(30 + i * 9, 39 - h / 2, 30 + i * 9, 39 + h / 2, "#198b91", 3.2)),
  );
  s +=
    circle(77, 106, 34, "#0f7a80", 'opacity=".18"') +
    circle(
      77,
      105,
      29,
      vgrad([
        [0, "#1d9aa0"],
        [1, "#127076"],
      ]),
    );
  s +=
    rrect(70, 88, 14, 24, 7, "#ffffff") +
    stroke("M64 101a13 13 0 0 0 26 0M77 114v8M69 122h16", "#ffffff", 3.6);
  s += text(77, 151, "VOICE NOTE", { size: 10.5, fill: "#28535a", extra: 'letter-spacing="1"' });
  return s;
};

const sampleCard = () => {
  let s = rrect(
    0,
    0,
    146,
    92,
    14,
    vgrad([
      [0, "#fffaf0"],
      [1, "#f6eedc"],
    ]),
  );
  // sample vial
  s +=
    rrect(18, 18, 18, 56, 8, "#e6f2f5") +
    rrect(19, 44, 16, 29, 7, "#6cc2b3") +
    rrect(16, 13, 22, 8, 3, "#2f7f8a") +
    rect(22, 24, 3, 44, "#ffffff", 'opacity=".7"');
  // dial
  s +=
    circle(68, 46, 21, "#dce9db") +
    path(
      "M50 54 A20 20 0 0 1 86 54",
      "none",
      'stroke="#a8c8b6" stroke-width="5" stroke-linecap="round"',
    );
  s += line(68, 46, 78, 31, "#268b72", 4) + circle(68, 46, 4, "#268b72");
  s += stroke("M100 31h34M100 45h24M100 59h30", "#b8c8bd", 4);
  return s;
};

export default {
  file: "lab-investigation.svg",
  w: W,
  h: H,
  title: "A student investigates a changing river",
  grain: false,
  draw: () => {
    const sh = shadow();
    return (
      backdrop() +
      g(
        `<g transform="translate(68 72) rotate(-5 232 155)">${journal()}</g>`,
        `filter="url(#${sh})"`,
      ) +
      g(
        `<g transform="translate(539 131) rotate(2 77 83)">${voiceCard()}</g>`,
        `filter="url(#${sh})"`,
      ) +
      g(
        `<g transform="translate(530 346) rotate(-2 73 46)">${sampleCard()}</g>`,
        `filter="url(#${sh})"`,
      )
    );
  },
};
