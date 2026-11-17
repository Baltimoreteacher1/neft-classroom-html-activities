// Original vector art for the Language Game Studio: scenes, two recurring guides and shared pieces.
// Everything is drawn here (no stock images, no raster), so it is crisp at any size, weighs a few
// kilobytes and carries no license question. Scenes and guides use the site illustration kit
// (src/art/kit.js): editorial picture-book flat shapes with no outlines, form from a lit and a shade
// side, soft contact shadows and one warm light. Two band house styles share that drawing:
//   3-5  "Storybook"      warm morning light and a soft sun glow, full Deep Harbor colour
//   6-8  "Field Journal"  the same scene cooler and quieter (every fill eased toward slate), a fine
//                         journal grid and an inset paper rule
// Gradient ids are unique per call, so a page can show the same scene many times.
// No violet, purple or magenta anywhere (validate:no-purple).
//
// The small legacy helpers at the bottom (stroke, sky, cloud, hill, tree, star, book) are kept with their
// old output for the other game modules that import them.
import {
  FONT,
  P,
  circle,
  contact,
  ellipse,
  ground,
  hills,
  house,
  cloud as kCloud,
  stroke as kStroke,
  tree as kTree,
  haze,
  light,
  line,
  moon,
  noDefs,
  path,
  person,
  poly,
  rect,
  rrect,
  shade,
  stars,
  tr,
  tuft,
  flower,
  kid,
} from "../art/kit.js";
import { chip, collect, coolAll, lg, magnifier, rg, tile, word } from "../art/i-scene.js";
import { raw } from "../util.js";

export const C = {
  navy: "#17324d",
  ink: "#14263d",
  teal: "#1fa6a2",
  tealDk: "#126e6c",
  tealLt: "#bfe9e6",
  coral: "#f2765a",
  coralDk: "#c94f3b",
  gold: "#f2c15b",
  goldDk: "#d99a22",
  sand: "#f6e9cc",
  paper: "#fbf4e2",
  leaf: "#3f9b5f",
  leafDk: "#2b7447",
  leafLt: "#9fd8a8",
  sky: "#8fc7e8",
  skyLt: "#d6ecf8",
  cloud: "#ffffff",
  stone: "#9aa9b8",
  stoneDk: "#6d7e90",
  wood: "#b9814a",
  woodDk: "#8a5a2f",
  night: "#10243b",
  white: "#ffffff",
};
const styleOf = (band) => (band === "6-8" ? "journal" : "storybook");
const stroke = (band, w = 3) =>
  styleOf(band) === "storybook"
    ? `stroke="${C.navy}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
    : 'stroke="none"';

export const svg = (vb, body, { label = "", cls = "", style = "" } = {}) =>
  raw(
    `<svg class="gs-art ${cls}" ${style ? `style="${style}"` : ""} viewBox="${vb}" ${label ? `role="img" aria-label="${label.replace(/"/g, "&quot;")}"` : 'aria-hidden="true" focusable="false"'} xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
  );

/* ── band treatment ─────────────────────────────────────────────────────────────────────── */
/** Draw with local gradients, then apply the band's house style. */
function banded(band, draw, { w = 480, h = 270, frame = true } = {}) {
  const journal = styleOf(band) === "journal";
  const [defs, body] = collect(() =>
    noDefs(() => {
      let s = draw();
      if (!frame) return s;
      if (journal) {
        let d = "";
        for (let x = 30; x < w; x += 30) d += `M${x} 0V${h}`;
        for (let y = 30; y < h; y += 30) d += `M0 ${y}H${w}`;
        s += `<path d="${d}" stroke="#123a5c" stroke-width=".6" opacity=".07" fill="none"/>`;
        s += `<rect x="9" y="9" width="${w - 18}" height="${h - 18}" rx="6" fill="none" stroke="#fbf6ec" stroke-width="1.3" opacity=".6"/>`;
      } else
        s += rect(
          0,
          0,
          w,
          h,
          rg(
            [
              [0, "#fff1c9", 0.3],
              [0.6, "#fff1c9", 0.08],
              [1, "#fff1c9", 0],
            ],
            { cx: 0.82, cy: 0.08, r: 0.75 },
          ),
        );
      return s;
    }),
  );
  const out = (defs ? `<defs>${defs}</defs>` : "") + body;
  return journal ? coolAll(out) : out;
}

/* ── scene pieces ───────────────────────────────────────────────────────────────────────── */
const W = 480;
const H = 270;
const skyG = (a, b, c, h = H) =>
  rect(
    0,
    0,
    W,
    h,
    lg([
      [0, a],
      [0.6, b],
      [1, c],
    ]),
  );
const sunG = (x, y, r = 20) =>
  circle(
    x,
    y,
    r * 3.4,
    rg([
      [0, "#fff3c4", 0.8],
      [1, "#fff3c4", 0],
    ]),
  ) +
  circle(x, y, r, P.gold) +
  circle(x - r * 0.12, y - r * 0.12, r * 0.82, P.goldLight) +
  circle(x - r * 0.3, y - r * 0.32, r * 0.3, "#fff6cf", 'opacity=".7"');
/** Soft studio backdrop with a tabletop, for scenes built from cards and boards. */
const backdrop = (a, b, top = 214) =>
  skyG(a, b, light(b, 0.2)) +
  circle(
    390,
    40,
    190,
    rg([
      [0, "#ffffff", 0.55],
      [1, "#ffffff", 0],
    ]),
  ) +
  rect(
    0,
    top,
    W,
    H - top,
    lg([
      [0, P.woodLight],
      [1, P.wood],
    ]),
  ) +
  rect(0, top, W, 4, light(P.woodLight, 0.35)) +
  kStroke(`M0 ${top + 22}H${W}M0 ${top + 42}H${W}`, shade(P.wood, 0.12), 1.2, 'opacity=".5"');
const dark = (a, b) =>
  rect(
    0,
    0,
    W,
    H,
    lg([
      [0, a],
      [1, b],
    ]),
  );
const starG = (x, y, r, c) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    const k = i % 2 ? r * 0.45 : r;
    d += `${i ? "L" : "M"}${(x + k * Math.cos(a)).toFixed(1)} ${(y + k * Math.sin(a)).toFixed(1)}`;
  }
  return (
    path(`${d}Z`, c) +
    path(
      `M${x} ${y - r}L${x} ${y + r * 0.5}L${(x - r * 0.95).toFixed(1)} ${(y - r * 0.3).toFixed(1)}Z`,
      light(c, 0.35),
      'opacity=".55"',
    )
  );
};
/** A stone or rock: shade base, lit top. */
const stone = (x, y, rx, ry, c = P.stone) =>
  ellipse(x + 2, y + ry * 0.55, rx, ry, shade(c, 0.35)) +
  ellipse(x, y, rx, ry, c) +
  ellipse(x - rx * 0.22, y - ry * 0.35, rx * 0.5, ry * 0.38, light(c, 0.45), 'opacity=".8"');
const mountain = (x, top, base, hw, c = P.stoneDark, snow = true) =>
  poly(
    [
      [x - hw, base],
      [x, top],
      [x + hw, base],
    ],
    light(c, 0.12),
  ) +
  poly(
    [
      [x, top],
      [x + hw, base],
      [x + hw * 0.1, base],
    ],
    shade(c, 0.2),
  ) +
  (snow
    ? poly(
        [
          [x - hw * 0.26, top + (base - top) * 0.26],
          [x, top],
          [x + hw * 0.26, top + (base - top) * 0.26],
          [x + hw * 0.08, top + (base - top) * 0.2],
          [x - hw * 0.06, top + (base - top) * 0.3],
        ],
        "#f7fbfd",
      )
    : "");
const gear = (x, y, r, n, c) => {
  const body = (dx, dy, col) =>
    `<g transform="translate(${x + dx} ${y + dy})">${Array.from({ length: n }, (_, i) => rrect(-r * 0.18, -r * 1.28, r * 0.36, r * 0.42, r * 0.08, col, `transform="rotate(${(360 / n) * i})"`)).join("")}${circle(0, 0, r, col)}</g>`;
  return (
    
    body(0, 3, shade(c, 0.3)) +
    body(0, 0, c) +
    circle(x - r * 0.25, y - r * 0.3, r * 0.42, light(c, 0.35), 'opacity=".55"') +
    circle(x, y + 1, r * 0.38, shade(c, 0.45)) +
    circle(x, y, r * 0.34, P.ivory)
  );
};
const wave = (x0, y0, n, step, wdt, amp, c) =>
  Array.from({ length: n }, (_, i) => {
    const h = (((i * 13 + amp) % 34) * 2 + 12) | 0;
    return rrect(x0 + i * step, y0 - h / 2, wdt, h, wdt / 2, c);
  }).join("");
const leafPair = (x, y, c = P.leafLight) =>
  path(`M${x} ${y}q-24 -8 -30 12q20 6 30 -12Z`, c) +
  path(`M${x} ${y}q24 -8 30 12q-20 6 -30 -12Z`, shade(c, 0.15)) +
  kStroke(`M${x - 26} ${y + 9}Q${x - 14} ${y + 1} ${x} ${y}`, shade(c, 0.35), 1);

/* ── guides ─────────────────────────────────────────────────────────────────────────────── */
const eyesFor = (mood, dx = 10) =>
  mood === "cheer"
    ? kStroke(`M${-dx - 5} -4q5 -7 10 0M${dx - 5} -4q5 -7 10 0`, P.navy, 3)
    : [-dx, dx]
        .map((x) => {
          const px = x + (mood === "think" ? 2 : 0);
          const py = mood === "think" ? -6 : -4;
          return (
            circle(x, -4, 6.4, "#ffffff") +
            circle(px, py, 3.4, P.navy) +
            circle(px + 1.2, py - 1.3, 1.1, "#ffffff")
          );
        })
        .join("");

/** Guides: Pip the owl (teal) and Juno the fox (coral). mood: "hi" | "think" | "cheer". */
export function mascot(name = "pip", band = "3-5", mood = "hi", size = 120) {
  const T = P.teal;
  const owl = () =>
    contact(0, 66, 30, 5, 0.22) +
    path("M-30 18Q-46 32 -34 50Q-24 36 -26 20Z", shade(T, 0.3)) +
    path("M30 18Q46 32 34 50Q24 36 26 20Z", shade(T, 0.35)) +
    ellipse(0, 24, 30, 34, T) +
    path("M6 -8Q30 4 30 24Q30 52 4 58Q22 40 6 -8Z", shade(T, 0.18), 'opacity=".8"') +
    ellipse(0, 32, 19, 23, "#c9ebe5") +
    kStroke(
      "M-10 26q4 4 8 0M2 26q4 4 8 0M-6 36q4 4 8 0M-12 44q4 3 8 0M4 44q4 3 8 0",
      "#8fcfc6",
      1.6,
    ) +
    poly(
      [
        [-27, -8],
        [-23, -32],
        [-8, -18],
      ],
      T,
    ) +
    poly(
      [
        [27, -8],
        [23, -32],
        [8, -18],
      ],
      shade(T, 0.15),
    ) +
    ellipse(0, -4, 30, 26, T) +
    path("M12 -26Q30 -18 30 -4Q30 14 12 22Q26 4 12 -26Z", shade(T, 0.16), 'opacity=".8"') +
    circle(-16, -16, 5, light(T, 0.4), 'opacity=".5"') +
    ellipse(-10, -3, 11, 10, light(T, 0.55)) +
    ellipse(10, -3, 11, 10, light(T, 0.48)) +
    eyesFor(mood, 10) +
    poly(
      [
        [-5, 5],
        [0, 13],
        [5, 5],
      ],
      P.gold,
    ) +
    poly(
      [
        [0, 5],
        [0, 13],
        [5, 5],
      ],
      shade(P.gold, 0.25),
    ) +
    ellipse(-10, 60, 7, 3.4, shade(P.gold, 0.1)) +
    ellipse(10, 60, 7, 3.4, shade(P.gold, 0.1)) +
    (band === "6-8" ? kStroke("M-15 -21q7 -4 13 -1M2 -22q7 -3 13 1", P.gold, 3) : "");
  const F = P.coral;
  const cream = "#f7e6cc";
  const fox = () =>
    contact(4, 66, 34, 5, 0.22) +
    path("M22 36Q60 26 56 62Q40 58 22 52Z", shade(F, 0.12)) +
    path("M44 54Q56 58 56 62Q44 62 38 56Z", "#fbf6ec") +
    ellipse(0, 28, 26, 32, F) +
    path("M8 -2Q26 8 26 28Q26 52 6 60Q20 36 8 -2Z", shade(F, 0.2), 'opacity=".8"') +
    ellipse(0, 36, 15, 22, cream) +
    ellipse(-9, 62, 7, 3.6, shade(F, 0.35)) +
    ellipse(9, 62, 7, 3.6, shade(F, 0.35)) +
    poly(
      [
        [-28, -6],
        [-26, -32],
        [-8, -16],
      ],
      F,
    ) +
    poly(
      [
        [28, -6],
        [26, -32],
        [8, -16],
      ],
      shade(F, 0.18),
    ) +
    poly(
      [
        [-24, -10],
        [-23, -25],
        [-14, -16],
      ],
      "#3a2a2a",
    ) +
    poly(
      [
        [24, -10],
        [23, -25],
        [14, -16],
      ],
      "#3a2a2a",
    ) +
    ellipse(0, -6, 28.5, 14, F) +
    path("M-28 -4Q0 -26 28 -4Q26 22 0 26Q-26 22 -28 -4Z", F) +
    path("M10 -16Q28 -10 28 -4Q26 18 6 25Q20 8 10 -16Z", shade(F, 0.18), 'opacity=".8"') +
    circle(-17, -10, 4, light(F, 0.4), 'opacity=".5"') +
    path("M-22 4Q0 9 22 4Q12 22 0 24Q-12 22 -22 4Z", cream) +
    eyesFor(mood, 10) +
    ellipse(0, 8, 4.4, 3.2, P.navy) +
    ellipse(-1.2, 7, 1.4, 0.9, "#ffffff", 'opacity=".7"') +
    (band === "6-8" ? path("M-20 22Q0 32 20 22L18 30Q0 38 -18 30Z", P.teal) : "");
  return svg("-60 -42 120 118", banded(band, name === "juno" ? fox : owl, { frame: false }), {
    cls: `gs-mascot gs-mascot-${name}`,
    style: `width:${size}px;height:auto;max-width:100%`,
  });
}
export const mascotHTML = mascot;

/* ── scenes ─────────────────────────────────────────────────────────────────────────────── */
const parrot = (x, y) =>
  tr(
    x,
    y,
    path("M-14 6L-40 30L-34 32L-10 14Z", P.teal) +
      path("M-14 6L-40 30L-30 24Z", shade(P.teal, 0.25)) +
      ellipse(0, 0, 18, 13, P.coral) +
      ellipse(2, 4, 12, 7, P.coralLight, 'opacity=".6"') +
      path("M-14 -4Q-4 -10 8 -2Q0 10 -14 6Z", P.teal) +
      circle(13, -10, 10, P.coral) +
      circle(10, -14, 4, light(P.coral, 0.35), 'opacity=".6"') +
      path("M21 -12l11 4l-10 5Z", P.gold) +
      circle(16, -12, 2.4, P.ink) +
      circle(16.8, -12.8, 0.8, "#ffffff"),
  );
const canopy = () =>
  [
    [20, 0, 38],
    [80, -10, 36],
    [150, -6, 30],
    [230, -14, 34],
    [300, -8, 30],
    [370, -12, 38],
    [450, 0, 40],
  ]
    .map(
      ([x, y, r]) =>
        circle(x, y + 6, r, shade(P.leaf, 0.3)) +
        circle(x - 4, y, r * 0.86, P.leaf) +
        ellipse(x - 10, y - r * 0.2, r * 0.4, r * 0.2, P.leafLight, 'opacity=".6"'),
    )
    .join("");

const SCENES = {
  jungle: () =>
    skyG("#9fd3cf", "#d3eedd", "#f3efd2") +
    sunG(400, 64, 18) +
    hills(W, 152, { color: P.leaf, far: 0.5, seed: 5, amp: 30 }) +
    
    kTree(330, 176, 0.62, { kind: "palm" }) +
    kTree(446, 182, 0.72, { tone: "#4f8f5b", seed: 3 }) +
    rect(0, 176, W, 94, lg([[0, P.grassLight], [0.4, P.grass], [1, P.grassDark]])) +
    kTree(236, 200, 0.95, { seed: 9 }) +
    path(
      "M0 214C120 200 200 234 300 222S440 206 480 214V252C400 244 300 262 200 252S60 242 0 250Z",
      P.water,
    ) +
    kStroke("M30 226h40M160 236h30M330 228h44M420 222h24", P.waterLight, 2.4, 'opacity=".8"') +
    [
      [96, 230],
      [172, 238],
      [248, 236],
      [324, 230],
    ]
      .map(([x, y]) => stone(x, y, 30, 9))
      .join("") +
    canopy() +
    [
      [60, "M60 0Q74 60 58 112", 112],
      [150, "M150 0Q134 56 150 100", 100],
      [404, "M404 0Q420 60 398 116", 116],
    ]
      .map(([x, d, y]) => kStroke(d, P.leafDark, 4) + leafPair(x, y * 0.45) + leafPair(x - 2, y))
      .join("") +
    kStroke("M372 162Q406 154 444 160", P.bark, 6) +
    parrot(406, 146) +
    tuft(30, 266, 1.2) +
    flower(456, 268, 0.9, { color: P.coral }) +
    flower(20, 214, 0.7, { color: P.gold, center: P.coral }),
  quest: () =>
    rect(
      0,
      0,
      W,
      H,
      lg([
        [0, "#c9955f"],
        [1, "#a87442"],
      ]),
    ) +
    kStroke("M0 40h480M0 120h480M0 200h480", "#9a683c", 1.4, 'opacity=".45"') +
    rrect(20, 20, 448, 240, 10, "#1c2f4a", 'opacity=".22"') +
    rrect(14, 12, 452, 240, 10, "#f6ead0") +
    rect(162, 12, 8, 240, shade("#f6ead0", 0.1), 'opacity=".7"') +
    rect(318, 12, 8, 240, light("#f6ead0", 0.4)) +
    path(
      "M14 214Q110 180 180 212T330 216Q410 190 466 224V242a10 10 0 0 1 -10 10H24a10 10 0 0 1 -10 -10Z",
      "#9fcfe0",
    ) +
    kStroke("M30 220Q110 188 180 220T330 224Q410 198 460 230", "#ffffff", 2, 'opacity=".6"') +
    mountain(100, 60, 112, 40) +
    mountain(156, 76, 112, 36) +
    kTree(330, 140, 0.32, { seed: 4 }) +
    kTree(364, 152, 0.26, { kind: "pine" }) +
    kStroke("M40 190q60 -70 130 -30t120 -50t150 10", P.coral, 4, 'stroke-dasharray="2 10"') +
    circle(412, 80, 32, "#1c2f4a", 'opacity=".18"') +
    circle(410, 76, 31, P.gold) +
    circle(410, 76, 26, P.ivory) +
    poly(
      [
        [410, 54],
        [416, 76],
        [404, 76],
      ],
      P.coral,
    ) +
    poly(
      [
        [410, 98],
        [404, 76],
        [416, 76],
      ],
      P.navy,
    ) +
    circle(410, 76, 3.5, P.gold) +
    word(410, 64, "N", 9, P.navy) +
    chip(170, 158, 13, P.gold) +
    word(170, 163, "1", 14, P.navy) +
    chip(290, 158, 13, P.gold) +
    word(290, 163, "2", 14, P.navy) +
    chip(440, 158, 13, P.coral) +
    kStroke("M434 152l12 12M446 152l-12 12", "#ffffff", 3.4),
  detective: () =>
    dark("#0c1d36", "#2b4f78") +
    stars(W, 140, 22, 4) +
    moon(410, 48, 18) +
    [
      [10, 60, 60],
      [90, 80, 50],
      [250, 50, 70],
      [350, 70, 60],
    ]
      .map(([x, h, w]) => rect(x, 205 - h - 30, w, h + 30, "#1f3a5c"))
      .join("") +
    [
      [30, 80, 70],
      [120, 110, 60],
      [200, 70, 84],
      [300, 96, 66],
      [380, 84, 80],
    ]
      .map(([x, h, w], i) => {
        const c = i % 2 ? "#2b4a68" : "#24405e";
        let s =
          rect(x, 205 - h, w, h, c) +
          rect(x + w * 0.72, 205 - h, w * 0.28, h, shade(c, 0.25)) +
          rect(x - 3, 199 - h, w + 6, 7, light(c, 0.12));
        for (let r = 0; r < Math.floor(h / 26); r++)
          for (let k = 0; k < Math.floor(w / 26); k++) {
            const on = (r + k + i) % 3;
            s += rect(
              x + 8 + k * 24,
              215 - h + r * 24,
              12,
              14,
              on ? P.goldLight : "#35536f",
              'rx="1.5"',
            );
          }
        return s;
      })
      .join("") +
    rect(0, 205, W, 65, "#1a2f47") +
    rect(0, 205, W, 6, "#2f4c6b") +
    path("M122 212L158 126H174L210 212Z", P.goldLight, 'opacity=".14"') +
    rect(163, 112, 6, 100, "#14263d") +
    rrect(156, 106, 20, 12, 4, "#14263d") +
    circle(166, 120, 6, P.goldLight) +
    [
      [70, 240],
      [92, 232],
      [114, 240],
      [136, 232],
    ]
      .map(([x, y]) => ellipse(x, y, 7, 4, "#6f8aa3", 'opacity=".7"'))
      .join("") +
    magnifier(330, 192, 26),
  strategy: () =>
    backdrop("#e8f4f2", "#f7efdc") +
    contact(240, 238, 120, 8, 0.2) +
    tile(130, 44, 220, 192, 18, P.ivory) +
    kStroke("M204 56V226M276 56V226M142 108H338M142 172H338", P.navy, 5, 'opacity=".75"') +
    [
      [168, 82, "x"],
      [240, 82, "o"],
      [312, 140, "x"],
      [240, 200, "o"],
      [168, 200, "x"],
    ]
      .map(([x, y, k]) =>
        k === "x"
          ? kStroke(
              `M${x - 14} ${y - 12}l28 28M${x + 14} ${y - 12}l-28 28`,
              "#1c2f4a",
              8,
              'opacity=".15"',
            ) + kStroke(`M${x - 14} ${y - 14}l28 28M${x + 14} ${y - 14}l-28 28`, P.coral, 8)
          : `<circle cx="${x}" cy="${y + 2}" r="15" fill="none" stroke="#1c2f4a" stroke-width="8" opacity=".15"/><circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${P.teal}" stroke-width="8"/>`,
      )
      .join("") +
    starG(240, 140, 13, P.gold) +
    [
      [76, 200, P.teal],
      [404, 206, P.coral],
    ]
      .map(
        ([x, y, c]) =>
          contact(x, y, 22, 5, 0.22) +
          ellipse(x, y - 4, 20, 7, shade(c, 0.25)) +
          path(
            `M${x - 16} ${y - 6}Q${x - 10} ${y - 30} ${x - 6} ${y - 40}H${x + 6}Q${x + 10} ${y - 30} ${x + 16} ${y - 6}Z`,
            c,
          ) +
          path(
            `M${x + 2} ${y - 40}H${x + 6}Q${x + 10} ${y - 30} ${x + 16} ${y - 6}H${x + 6}Z`,
            shade(c, 0.2),
            'opacity=".7"',
          ) +
          circle(x, y - 48, 12, c) +
          circle(x - 4, y - 52, 4, light(c, 0.45), 'opacity=".7"'),
      )
      .join(""),
  studio: () =>
    dark("#1b4468", "#0c2840") +
    [40, 120, 200, 280, 360]
      .map((x) => rrect(x, 18, 70, 108, 8, "#1f4a70", 'opacity=".55"'))
      .join("") +
    `<g transform="translate(60 40)">${Array.from({ length: 26 }, (_, i) => {
      const k = (i * 7 + (i % 5) * 11) % 38;
      return rrect(i * 14, 50 - k, 8, k * 2 + 8, 4, i < 15 ? P.tealLight : "#4a6a86");
    }).join("")}</g>` +
    word(64, 134, "sh · ch · th", 26, P.goldLight).replace(
      'text-anchor="middle"',
      'text-anchor="start"',
    ) +
    `<path d="M374 74a30 30 0 0 1 60 0" fill="none" stroke="${shade(P.coral, 0.2)}" stroke-width="10" stroke-linecap="round"/><path d="M374 72a30 30 0 0 1 60 0" fill="none" stroke="${P.coral}" stroke-width="7" stroke-linecap="round"/>` +
    tile(364, 68, 18, 32, 8, P.coral, { lift: 2, glow: 0.4 }) +
    tile(426, 68, 18, 32, 8, P.coral, { lift: 2, glow: 0.4 }) +
    tile(26, 150, 428, 96, 16, "#23415f", { glow: 0.12 }) +
    Array.from(
      { length: 8 },
      (_, i) =>
        rrect(52 + i * 50, 166, 8, 64, 4, "#0f2338") +
        tile(46 + i * 50, 176 + ((i * 17) % 40), 20, 12, 4, i % 2 ? P.teal : P.gold, { lift: 2 }),
    ).join(""),
  theater: () =>
    dark("#20385a", "#14263d") +
    path(
      "M130 270L196 52H284L350 270Z",
      rg(
        [
          [0, "#fff1c9", 0.5],
          [1, "#fff1c9", 0.05],
        ],
        { cy: 0.1, r: 1 },
      ),
    ) +
    path("M130 270L196 52H284L350 270Z", P.goldLight, 'opacity=".1"') +
    rect(
      40,
      222,
      400,
      48,
      lg([
        [0, P.woodLight],
        [1, P.wood],
      ]),
    ) +
    rect(40, 222, 400, 5, light(P.woodLight, 0.35)) +
    kStroke("M40 244H440M40 260H440", shade(P.wood, 0.15), 1.2, 'opacity=".6"') +
    ellipse(240, 240, 120, 14, "#fff1c9", 'opacity=".25"') +
    contact(240, 224, 46, 6) +
    rect(236, 186, 8, 38, P.woodDark) +
    path("M192 160Q216 150 240 164V194Q216 182 192 190Z", P.ivory) +
    path("M288 160Q264 150 240 164V194Q264 182 288 190Z", shade(P.ivory, 0.08)) +
    kStroke("M202 170h26M202 178h22M252 170h26M252 178h22", "#9aa7b4", 1.6) +
    person(130, 228, 100, kid(1, { top: P.teal, pose: "wave", mouth: "open" })) +
    starG(354, 120, 14, P.gold) +
    starG(386, 84, 8, P.goldLight) +
    path("M0 0H480V36Q240 58 0 36Z", shade(P.coral, 0.2)) +
    [0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => path(`M${i * 60} 36q30 22 60 0`, shade(P.coral, 0.32)))
      .join("") +
    ["L", "R"]
      .map((s) => {
        const m = s === "L" ? "" : ' transform="translate(480 0) scale(-1 1)"';
        return `<g${m}>${path("M0 30Q76 90 34 270H0Z", P.coral)}${path("M14 34Q52 110 22 270H8Q36 110 0 34Z", shade(P.coral, 0.22))}${path("M38 40Q66 100 40 160", "none", `stroke="${light(P.coral, 0.3)}" stroke-width="5" opacity=".6"`)}</g>`;
      })
      .join(""),
  echo: () =>
    backdrop("#dff2f0", "#fbf0d6") +
    tile(52, 66, 168, 140, 16, P.white) +
    tile(260, 66, 168, 140, 16, P.white) +
    wave(66, 136, 14, 11.5, 6, 0, P.teal) +
    `<g transform="translate(272 136)">${Array.from({ length: 14 }, (_, i) => {
      const h = ((i * 9 + 7) % 34) * 2 + 12;
      return rrect(i * 11.5, -h / 2, 6, h, 3, P.coral);
    }).join("")}</g>` +
    kStroke("M226 136H254M244 126l10 10l-10 10", P.navy, 5) +
    contact(240, 262, 20, 4) +
    rect(237, 238, 6, 22, shade(P.navy, 0.1)) +
    rrect(226, 258, 28, 5, 2, P.navy) +
    `<path d="M222 222a18 18 0 0 0 36 0" fill="none" stroke="${P.navy}" stroke-width="4" stroke-linecap="round"/>` +
    tile(230, 196, 20, 36, 10, P.navy, { lift: 2, glow: 0.45 }),
  world: () =>
    skyG(P.skyTop, P.sky, "#f6ecd6") +
    sunG(80, 52, 18) +
    kCloud(200, 42, 0.6) +
    kCloud(392, 56, 0.7) +
    hills(W, 160, { color: P.grass, far: 0.45, seed: 8, amp: 32 }) +
    ground(W, 168, 50, "grass", { seed: 3 }) +
    house(32, 200, 64, 44, { color: P.ivory, roof: P.coral }) +
    house(110, 206, 60, 40, { color: P.goldLight, roof: P.navy, window: false }) +
    house(350, 198, 66, 46, { color: P.wall, roof: P.teal }) +
    kTree(300, 198, 0.42, { seed: 5 }) +
    kTree(446, 204, 0.36, { kind: "pine" }) +
    path(
      "M0 210Q120 194 240 212T480 204V270H0Z",
      lg([
        [0, P.waterLight],
        [1, P.water],
      ]),
    ) +
    kStroke("M40 236h40M300 230h30M160 252h50M400 250h30", "#ffffff", 2, 'opacity=".6"') +
    rect(206, 214, 6, 22, P.woodDark) +
    rect(284, 214, 6, 22, P.woodDark) +
    rect(198, 206, 100, 10, P.wood) +
    rect(198, 206, 100, 3, light(P.wood, 0.3)) +
    chip(248, 196, 9, P.gold) +
    kStroke("M248 191v10M243 196h10", P.navy, 2),
  jeopardy: () =>
    dark("#1b4468", "#0c2840") +
    Array.from({ length: 20 }, (_, i) => {
      const x = 40 + (i % 5) * 80;
      const y = 40 + Math.floor(i / 5) * 50;
      const head = i < 5;
      return (
        tile(x, y, 72, 42, 8, head ? P.teal : P.gold, { lift: 3, glow: head ? 0.25 : 0 }) +
        (head ? "" : word(x + 36, y + 28, i < 10 ? 100 : i < 15 ? 200 : 300, 19, P.navy))
      );
    }).join("") +
    chip(440, 26, 15, P.coral) +
    word(440, 33, "?", 20, "#ffffff"),
  memory: () =>
    backdrop("#e3f3f1", "#fbf0d6", 228) +
    Array.from({ length: 8 }, (_, i) => {
      const x = 70 + (i % 4) * 88;
      const y = 40 + Math.floor(i / 4) * 100;
      const up = i === 1 || i === 6;
      return up
        ? tile(x, y, 72, 88, 12, P.white) +
            chip(x + 36, y + 44, 20, P.gold) +
            kStroke(`M${x + 26} ${y + 44}l7 8 13-16`, P.navy, 5)
        : tile(x, y, 72, 88, 12, P.teal, { glow: 0.25 }) + starG(x + 36, y + 46, 18, "#9fdcd4");
    }).join(""),
  mystery: () =>
    backdrop("#fbf0d6", "#dff2f0") +
    ["W", "O", "R", "D", "?"]
      .map((c, i) => {
        const x = 50 + i * 78;
        const f = [P.green, P.gold, P.stoneDark, P.green, P.sand || "#ecd9b0"][i] || "#ecd9b0";
        return (
          tile(x, 92, 68, 76, 10, f) +
          word(x + 34, 143, c, 40, i === 2 || i === 4 ? P.navy : "#ffffff")
        );
      })
      .join("") +
    magnifier(398, 56, 24),
  bingo: () =>
    backdrop("#fbf0d6", "#dff2f0", 236) +
    tile(120, 38, 240, 200, 16, P.white) +
    Array.from({ length: 16 }, (_, i) => {
      const x = 138 + (i % 4) * 51;
      const y = 54 + Math.floor(i / 4) * 46;
      const on = [0, 5, 10, 15, 3].includes(i);
      return (
        rrect(x, y, 44, 38, 8, on ? "#cdeee9" : "#f4e9d2") +
        (on ? chip(x + 22, y + 18, 13, P.coral) : rrect(x + 8, y + 17, 28, 5, 2.5, "#c9bfa9"))
      );
    }).join("") +
    chip(60, 62, 30, P.gold) +
    circle(60, 62, 18, P.ivory) +
    word(60, 71, "B", 24, P.navy),
  factory: () =>
    skyG("#e4edf1", "#eef0ea", "#f6e9cc") +
    rect(0, 176, W, 94, "#51647a") +
    rect(0, 176, W, 14, "#3b4c60") +
    rect(0, 190, W, 3, "#6b7f95") +
    Array.from({ length: 12 }, (_, i) => chip(i * 42 + 20, 214, 8, "#8296ab")).join("") +
    [
      ["The", P.gold, 40],
      ["owl", P.teal, 150],
      ["reads", P.coral, 258],
    ]
      .map(
        ([w, c, x]) =>
          tile(x, 128, 84, 46, 10, c) + word(x + 42, 159, w, 22, c === P.gold ? P.navy : "#ffffff"),
      )
      .join("") +
    gear(404, 70, 40, 8, "#8fa1b3") +
    gear(70, 70, 26, 6, P.gold),
  expedition: () =>
    skyG("#9fd0ea", "#cfe8ef", "#fbeed4") +
    kCloud(380, 52, 0.7) +
    mountain(290, 40, 270, 140) +
    mountain(120, 96, 270, 120, haze(P.stoneDark, 0.1)) +
    hills(W, 222, { color: P.grass, far: 0.1, seed: 2, amp: 18 }) +
    kStroke("M60 250q90 -30 150 -70t100 -110", P.coral, 4, 'stroke-dasharray="2 9"') +
    line(292, 40, 292, 6, P.navy, 3) +
    path("M292 6l26 8l-26 10Z", P.coral) +
    contact(86, 238, 30, 5) +
    poly(
      [
        [62, 238],
        [86, 202],
        [110, 238],
      ],
      P.gold,
    ) +
    poly(
      [
        [86, 202],
        [110, 238],
        [86, 238],
      ],
      shade(P.gold, 0.25),
    ) +
    poly(
      [
        [80, 238],
        [86, 222],
        [92, 238],
      ],
      shade(P.gold, 0.55),
    ) +
    tuft(30, 262) +
    tuft(450, 258, 1.2),
  search: () =>
    backdrop("#e3f3f1", "#fbf0d6") +
    tile(20, 24, 260, 220, 16, P.white) +
    rrect(28, 78, 172, 34, 17, P.teal) +
    "SEARCHFINDWORDS"
      .split("")
      .concat("LETTERSGRIDPUZZLE".split(""))
      .slice(0, 36)
      .map((ch, i) =>
        word(
          42 + (i % 6) * 43,
          62 + Math.floor(i / 6) * 38,
          ch,
          22,
          i >= 6 && i <= 9 ? "#ffffff" : P.navy,
        ),
      )
      .join("") +
    tile(352, 62, 88, 120, 12, "#f4e6c4") +
    rect(362, 72, 68, 70, "#bfe0ee") +
    circle(380, 92, 10, P.gold) +
    poly(
      [
        [362, 142],
        [384, 108],
        [406, 142],
      ],
      P.green,
    ) +
    poly(
      [
        [392, 142],
        [412, 116],
        [430, 142],
      ],
      shade(P.green, 0.2),
    ) +
    rrect(364, 154, 54, 6, 3, "#d6c39c") +
    rrect(364, 166, 36, 6, 3, "#d6c39c"),
  creator: () =>
    backdrop("#fbf0d6", "#dff2f0") +
    [0, 1, 2]
      .map((i) => {
        const x = 30 + i * 150;
        const inner = [
          kTree(x + 65, 128, 0.32, { seed: 3 }) + rect(x + 8, 126, 114, 8, P.grass),
          person(x + 65, 132, 54, kid(3, { pose: "wave" })),
          path(`M${x + 8} 134Q${x + 65} 92 ${x + 122} 134Z`, P.grass) +
            circle(x + 98, 86, 8, P.gold),
        ][i];
        return (
          tile(x, 62, 130, 100, 10, P.white) +
          rect(x + 8, 70, 114, 64, ["#cfe7f2", "#cdeee9", "#fbe3d6"][i], 'rx="5"') +
          `<g>${inner}</g>` +
          rrect(x + 10, 142, 60, 5, 2.5, "#c4ccd4") +
          rrect(x + 10, 151, 40, 5, 2.5, "#c4ccd4")
        );
      })
      .join("") +
    `<g transform="translate(330 214) rotate(-30)">${rrect(2, 4, 110, 16, 8, "#1c2f4a", 'opacity=".18"')}${rrect(0, 0, 110, 16, 8, P.gold)}${rect(0, 8, 110, 8, shade(P.gold, 0.2), 'rx="4"')}${path("M110 0l16 8l-16 8Z", "#f0d6b0")}${path("M120 5l6 3l-6 3Z", P.ink)}${rrect(0, 0, 22, 16, 6, P.coral)}</g>`,
  arcade: () =>
    dark("#1b4468", "#0c2840") +
    Array.from({ length: 6 }, (_, r) =>
      Array.from({ length: 10 }, (_, c) =>
        ((r * 7 + c * 3) % 4 === 0 || r === 0 || c === 0 || r === 5 || c === 9) &&
        !(r === 1 && c === 1) &&
        !(r === 4 && c === 8)
          ? rrect(40 + c * 40, 31 + r * 34, 36, 30, 6, "#16334f") +
            rrect(40 + c * 40, 28 + r * 34, 36, 28, 6, "#2f5a7d")
          : "",
      ).join(""),
    ).join("") +
    circle(78, 62, 11, P.gold) +
    path("M60 62l14 -12v24Z", "#16314a") +
    circle(76, 56, 1.6, P.navy) +
    contact(402, 174, 12, 3) +
    rrect(392, 156, 20, 16, 4, P.teal) +
    rect(404, 156, 8, 16, shade(P.teal, 0.2)) +
    line(402, 156, 402, 144, "#ffffff", 3) +
    line(394, 142, 410, 142, P.coral, 6) +
    tile(136, 216, 188, 40, 20, "#0f2338", { glow: 0.15 }) +
    chip(174, 234, 11, P.coral) +
    chip(206, 234, 11, P.gold) +
    tile(244, 228, 64, 14, 7, P.teal, { lift: 2 }),
  escape: () =>
    dark("#2a4a6c", "#1b2f48") +
    rect(
      0,
      226,
      W,
      44,
      lg([
        [0, "#3a5878"],
        [1, "#24405e"],
      ]),
    ) +
    rect(0, 226, W, 4, "#4a6a8c") +
    circle(
      240,
      120,
      150,
      rg([
        [0, P.goldLight, 0.22],
        [1, P.goldLight, 0],
      ]),
    ) +
    contact(240, 236, 70, 6, 0.3) +
    rect(176, 50, 128, 186, "#14263d") +
    rect(182, 56, 116, 180, P.wood) +
    rect(268, 56, 30, 180, shade(P.wood, 0.15)) +
    rrect(196, 70, 88, 62, 6, shade(P.wood, 0.14)) +
    rrect(196, 70, 88, 4, 2, light(P.wood, 0.25)) +
    rrect(196, 142, 88, 76, 6, shade(P.wood, 0.14)) +
    rrect(196, 142, 88, 4, 2, light(P.wood, 0.25)) +
    chip(274, 168, 6, P.gold) +
    `<path d="M228 120v-12a12 12 0 0 1 24 0v12" fill="none" stroke="${shade(P.stone, 0.15)}" stroke-width="7" stroke-linecap="round"/>` +
    tile(218, 116, 44, 34, 8, P.gold) +
    circle(240, 131, 5, P.navy) +
    rect(238.5, 131, 3, 9, P.navy) +
    [
      [94, 90, "A", P.teal],
      [94, 158, "B", P.coral],
      [386, 90, "C", P.gold],
      [386, 158, "D", P.blue],
    ]
      .map(
        ([x, y, t, c]) =>
          tile(x - 30, y - 24, 60, 48, 8, c) +
          word(x, y + 9, t, 26, c === P.gold ? P.navy : "#ffffff"),
      )
      .join(""),
};

/** A full scene (16:9). `key` is a registry art key; `band` selects the house style. */
export function scene(key, band = "3-5", label = "") {
  const draw = SCENES[key] || SCENES.quest;
  return svg(
    "0 0 480 270",
    banded(band, () => draw(band)),
    { label, cls: `gs-scene gs-scene-${key}` },
  );
}

/* ── legacy helpers (unchanged output; imported by other game modules) ──────────────────── */
const sky = (id, a, b) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="480" height="270" fill="url(#${id})"/>`;
const cloud = (x, y, s = 1, o = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="0" rx="30" ry="12" fill="#fff"/><circle cx="-12" cy="-8" r="13" fill="#fff"/><circle cx="8" cy="-12" r="16" fill="#fff"/></g>`;
const hill = (y, fill, amp = 24, k = 0) =>
  `<path d="M0 270V${y}C90 ${y - amp + k} 170 ${y + amp / 2} 260 ${y}S400 ${y - amp} 480 ${y + 6}V270Z" fill="${fill}"/>`;
const tree = (x, y, s, a, b, band) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-4" y="-6" width="8" height="30" rx="3" fill="${C.woodDk}"/><circle cx="0" cy="-22" r="22" fill="${a}" ${stroke(band, 2.4)}/><circle cx="-14" cy="-10" r="14" fill="${b}"/><circle cx="14" cy="-12" r="13" fill="${b}"/></g>`;
const star = (x, y, r, f) =>
  `<path transform="translate(${x} ${y})" d="M0 ${-r}L${r * 0.3} ${-r * 0.3}L${r} ${-r * 0.2}L${r * 0.45} ${r * 0.25}L${r * 0.6} ${r}L0 ${r * 0.55}L${-r * 0.6} ${r}L${-r * 0.45} ${r * 0.25}L${-r} ${-r * 0.2}L${-r * 0.3} ${-r * 0.3}Z" fill="${f}"/>`;
const book = (x, y, w, h, a, b, band) =>
  `<g transform="translate(${x} ${y})"><path d="M0 4Q${w / 2 - 4} -6 ${w / 2} 6V${h}Q${w / 4} ${h - 6} 0 ${h - 2}Z" fill="${a}" ${stroke(band, 2)}/><path d="M${w} 4Q${w / 2 + 4} -6 ${w / 2} 6V${h}Q${w * 0.75} ${h - 6} ${w} ${h - 2}Z" fill="${b}" ${stroke(band, 2)}/><path d="M${w * 0.12} 16h${w * 0.28}M${w * 0.12} 24h${w * 0.24}M${w * 0.6} 16h${w * 0.26}M${w * 0.6} 24h${w * 0.22}" stroke="${C.navy}" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/></g>`;

export { SCENES, tree, cloud, hill, star, book, stroke, sky, banded };
