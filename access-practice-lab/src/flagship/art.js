// Original illustrations for the flagship Language Games, in the site illustration style (src/art/kit.js: flat
// editorial shapes with no outlines, form from a lit and a shade side, soft contact shadows, one warm light; no
// text, no ids, no scripts, no external refs — drawn inside noDefs()): a padlock (shut and open), a museum door
// with a keypad (shut and open), a case file, a newspaper stack, a quest-map path and a speech pair. 200x200
// unless noted. `flagArtSrc(key)` returns a data: URL for an <img>.
import { P, circle, contact, light, noDefs, path, rect, rrect, shade, stroke } from "../art/kit.js";

const PAPER = "#f3ead8";
const STEEL = "#c9ced8";

const svg = (vb, draw) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${noDefs(draw)}</svg>`;
const sq = (draw) => svg("0 0 200 200", draw);
const wide = (draw) => svg("0 0 400 300", draw);

const shackle = (open) => {
  const d = open ? "M62 92 V62 a38 38 0 0 1 76 0 V70" : "M62 100 V70 a38 38 0 0 1 76 0 V100";
  return (
    stroke(d, shade(STEEL, 0.3), 14) +
    stroke(d, STEEL, 10) +
    stroke(
      open ? "M70 70 a30 30 0 0 1 22 -30" : "M70 78 a30 30 0 0 1 22 -30",
      "#ffffff",
      3,
      'opacity=".7"',
    )
  );
};
const lockBody = (fill) =>
  contact(100, 184, 70, 7, 0.22) +
  rrect(40, 96, 120, 88, 16, shade(fill, 0.3)) +
  rrect(40, 92, 120, 86, 16, fill) +
  path("M124 92h20a16 16 0 0 1 16 16v54a16 16 0 0 1 -16 16h-20z", shade(fill, 0.16)) +
  rrect(50, 100, 100, 8, 4, light(fill, 0.45), 'opacity=".7"') +
  circle(100, 128, 11, P.ink) +
  rrect(95.5, 128, 9, 26, 4, P.ink);
const door = (x, y, w, h, c) =>
  rect(x, y, w, h, c) +
  rect(x + w * 0.78, y, w * 0.22, h, shade(c, 0.15)) +
  rrect(x + 14, y + 16, w - 28, 88, 4, shade(c, 0.14)) +
  rrect(x + 14, y + 16, w - 28, 4, 2, light(c, 0.2)) +
  rrect(x + 14, y + 120, w - 28, 128, 4, shade(c, 0.14)) +
  rrect(x + 14, y + 120, w - 28, 4, 2, light(c, 0.2));

export const FLAG_ART = {
  "lock-shut": sq(() => shackle(false) + lockBody(P.gold)),
  "lock-open": sq(
    () =>
      `<g transform="rotate(-14 138 70)">${shackle(true)}</g>` +
      lockBody(P.grass) +
      stroke("M150 30 l10 -10 M164 44 l14 -4 M136 22 l2 -14", P.gold, 5),
  ),
  door: svg(
    "0 0 200 300",
    () =>
      contact(100, 292, 92, 6, 0.2) +
      rrect(20, 16, 160, 276, 8, P.navy) +
      rect(150, 16, 30, 276, shade(P.navy, 0.2)) +
      door(34, 30, 132, 262, "#a95b35") +
      rrect(128, 150, 30, 46, 5, P.ink) +
      Array.from({ length: 9 }, (_, i) =>
        rect(133 + (i % 3) * 8, 156 + Math.floor(i / 3) * 9, 6, 6, P.tealLight, 'rx="1"'),
      ).join("") +
      circle(143, 188, 3, P.coralLight) +
      circle(120, 213, 7.5, shade(P.gold, 0.3)) +
      circle(120, 212, 7, P.gold) +
      circle(118, 210, 2.5, P.goldLight),
  ),
  "door-open": svg(
    "0 0 200 300",
    () =>
      contact(100, 292, 92, 6, 0.2) +
      rrect(20, 16, 160, 276, 8, P.navy) +
      rect(34, 30, 132, 262, "#fff3c4") +
      path("M34 292 L100 292 L166 230 V292Z", P.goldLight, 'opacity=".6"') +
      path("M34 30 L84 50 L84 282 L34 292 Z", "#a95b35") +
      path("M34 30 L46 35 L46 290 L34 292 Z", light("#a95b35", 0.2)) +
      path("M70 44 L84 50 L84 282 L70 285 Z", shade("#a95b35", 0.2)) +
      circle(74, 170, 6, P.gold),
  ),
  "case-file": sq(
    () =>
      contact(100, 182, 82, 7, 0.22) +
      path("M24 52 h56 l12 14 h84 v112 h-152 Z", shade(P.gold, 0.15)) +
      `<g transform="rotate(-4 94 104)">${rect(40, 42, 112, 128, "#1c2f4a", 'opacity=".12"')}${rect(38, 40, 112, 128, P.ivory)}${stroke("M52 62 h70 M52 78 h82 M52 94 h60 M52 110 h76", P.teal, 3)}</g>` +
      path("M24 88 h152 v90 h-152 Z", P.gold) +
      path("M24 88 h152 v8 h-152 Z", light(P.gold, 0.35)) +
      path("M140 88 h36 v90 h-36 Z", shade(P.gold, 0.14)) +
      rrect(104, 112, 58, 22, 3, P.coral) +
      rrect(104, 112, 58, 6, 3, light(P.coral, 0.3)) +
      `<circle cx="58" cy="138" r="20" fill="#dff0f4" opacity=".55"/>` +
      `<circle cx="58" cy="138" r="20" fill="none" stroke="${P.navy}" stroke-width="6"/>` +
      stroke("M72 152 l18 18", P.woodDark, 9) +
      stroke("M46 130a14 14 0 0 1 10 -8", "#ffffff", 3, 'opacity=".9"'),
  ),
  "news-stack": sq(
    () =>
      contact(100, 180, 84, 7, 0.22) +
      rect(30, 118, 148, 56, "#d9d2c2", 'transform="rotate(4 104 146)"') +
      rect(24, 44, 156, 124, "#1c2f4a", 'opacity=".14"') +
      rect(22, 40, 156, 124, PAPER) +
      rect(160, 40, 18, 124, shade(PAPER, 0.08)) +
      rect(34, 52, 132, 18, P.navy) +
      rect(34, 80, 62, 46, P.teal) +
      path("M34 126 l18 -20 l12 10 l12 -14 l20 24z", shade(P.teal, 0.3)) +
      circle(80, 92, 5, P.goldLight) +
      stroke(
        "M106 84 h60 M106 96 h60 M106 108 h48 M106 120 h56 M34 138 h132 M34 150 h104",
        "#5d6772",
        3,
      ) +
      stroke("M150 18 l-8 26 M168 26 l-16 22", P.coral, 5),
  ),
  "quest-map": wide(
    () =>
      rrect(16, 18, 380, 280, 18, "#1c2f4a", 'opacity=".14"') +
      rrect(10, 10, 380, 280, 18, PAPER) +
      path(
        "M10 210 Q120 170 200 230 T390 200 V272 a18 18 0 0 1 -18 18 H28 a18 18 0 0 1 -18 -18 Z",
        "#bcd6b0",
      ) +
      path(
        "M10 80 Q90 60 150 90 T260 70 T390 90 V28 a18 18 0 0 0 -18 -18 H28 a18 18 0 0 0 -18 18 Z",
        "#cfe6ee",
      ) +
      stroke(
        "M60 230 C110 150 150 250 200 170 S300 110 340 70",
        "#9a4a26",
        5,
        'stroke-dasharray="4 12"',
      ) +
      [
        [60, 230, 16, P.coral],
        [140, 196, 16, P.gold],
        [230, 150, 16, P.teal],
        [340, 70, 18, P.navy],
      ]
        .map(
          ([x, y, r, c]) =>
            circle(x + 1, y + 4, r, "#1c2f4a", 'opacity=".16"') +
            circle(x, y, r, c) +
            circle(x - r * 0.3, y - r * 0.35, r * 0.35, light(c, 0.45), 'opacity=".7"'),
        )
        .join("") +
      stroke("M330 46 v-32", P.navyDeep, 3) +
      path("M330 14 l22 8 l-22 8z", P.gold),
  ),
  "speech-pair": sq(
    () =>
      contact(100, 190, 80, 6, 0.18) +
      path(
        "M20 36 h110 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-62 l-22 22 v-22 h-26 a14 14 0 0 1 -14 -14 v-44 a14 14 0 0 1 14 -14 Z",
        P.teal,
      ) +
      path("M110 36 h20 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-20 Z", shade(P.teal, 0.15)) +
      rrect(16, 42, 110, 8, 4, light(P.teal, 0.4), 'opacity=".6"') +
      path(
        "M182 96 h-96 a14 14 0 0 0 -14 14 v42 a14 14 0 0 0 14 14 h54 l22 22 v-22 h20 a14 14 0 0 0 14 -14 v-42 a14 14 0 0 0 -14 -14 Z",
        shade(P.gold, 0.3),
      ) +
      path(
        "M180 92 h-96 a14 14 0 0 0 -14 14 v42 a14 14 0 0 0 14 14 h54 l22 22 v-22 h20 a14 14 0 0 0 14 -14 v-42 a14 14 0 0 0 -14 -14 Z",
        P.gold,
      ) +
      rrect(76, 98, 108, 8, 4, light(P.gold, 0.45), 'opacity=".7"') +
      stroke("M40 64 h70 M40 80 h48 M96 124 h66 M96 140 h44", P.ivory, 5),
  ),
};

export const FLAG_ART_FOR = {
  "escape-room": "lock-shut",
  "evidence-detective": "case-file",
  "conversation-quest": "speech-pair",
  "newsroom-challenge": "news-stack",
};

const cache = new Map();
export function flagArtSrc(key) {
  if (!cache.has(key))
    cache.set(
      key,
      FLAG_ART[key] ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FLAG_ART[key])}` : "",
    );
  return cache.get(key);
}
