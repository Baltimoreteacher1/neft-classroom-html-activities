// Illustrated backdrops for the eight places language happens (JOURNEY.md `environment`).
// Pure string builders: `environmentArt(id, mood, band)` returns an inline <svg> (viewBox 800 x 480) wrapped with raw().
//
// Every scene has a left, a centre and a right zone, because hotspot positions are author-chosen percentages of
// this picture. `mood` (good | warn | bad | neutral) changes light and one "life" element (plants, liquid, lamp,
// fog...), so a control change is visible in the picture as well as in the words. Grades 3-5 get the warm, full
// palette; grades 6-8 get the same scene with calmer, more muted colour. Nothing here is purple, violet or magenta.
import { raw } from "../../util.js";

export const ENVIRONMENT_IDS = [
  "classroom",
  "lab",
  "garden",
  "community",
  "museum",
  "library",
  "map",
  "debate",
];
export const MOODS = ["good", "warn", "bad", "neutral"];

// ── colour ───────────────────────────────────────────────────────────────────────────────────────
function hslOf(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function hexOf(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
const SAT = { good: 1.06, neutral: 1, warn: 0.8, bad: 0.45 };
const LIGHT = { good: 0.02, neutral: 0, warn: -0.02, bad: -0.06 };
/** Tints an authored hex for the band (6-8 calmer) and the mood. Hue never moves, so no colour drifts toward purple. */
const tinter = (band, mood) => (hex) => {
  const [h, s, l] = hslOf(hex);
  const sat = Math.min(1, s * (band === "6-8" ? 0.72 : 1) * SAT[mood]);
  return hexOf(h, sat, Math.min(0.97, Math.max(0.05, l + LIGHT[mood])));
};

// ── shapes ───────────────────────────────────────────────────────────────────────────────────────
const r = (x, y, w, h, fill, rx = 0, x2 = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${x2}/>`;
const c = (cx, cy, rad, fill, x2 = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}" ${x2}/>`;
const e = (cx, cy, rx, ry, fill, x2 = "") =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${x2}/>`;
const p = (d, fill, x2 = "") => `<path d="${d}" fill="${fill}" ${x2}/>`;
const ln = (x1, y1, x2, y2, stroke, w = 2, x3 = "") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${x3}/>`;
const grad = (id, top, bottom, mid = "") =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/>${mid ? `<stop offset=".55" stop-color="${mid}"/>` : ""}<stop offset="1" stop-color="${bottom}"/></linearGradient>`;
const glow = (id, color) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".85"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const cloud = (x, y, s, fill) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}" opacity=".92">${e(0, 0, 46, 15, fill)}${c(-18, -12, 18, fill)}${c(10, -18, 23, fill)}</g>`;
const veil = (mood, color) =>
  mood === "bad"
    ? r(0, 0, 800, 480, color, 0, 'opacity=".2"')
    : mood === "warn"
      ? r(0, 0, 800, 480, color, 0, 'opacity=".07"')
      : "";

/** A book spine row: deterministic colours so the picture never shuffles between renders. */
function books(k, x, y, w, h, palette, seed = 0) {
  let out = "";
  let cx = x;
  for (let i = 0; cx < x + w - 10; i++) {
    const bw = 11 + ((i * 7 + seed) % 9);
    const bh = h - 6 - ((i * 5 + seed) % 14);
    out += r(cx, y + h - bh, bw, bh, k(palette[(i + seed) % palette.length]), 2);
    out += r(cx + 2, y + h - bh + 6, bw - 4, 3, "#ffffff", 1, 'opacity=".35"');
    cx += bw + 2;
  }
  return out;
}
const BOOKS = ["#d9534f", "#2e7d9a", "#e8a33d", "#4f9d69", "#2e4a94", "#c9722f", "#7fb7a4"];

// ── scenes (left | centre | right) ───────────────────────────────────────────────────────────────
function garden({ k, id, lv, mood }) {
  const stems = (x, n, tall, leaf, bloom) =>
    Array.from({ length: n }, (_, i) => {
      const px = x + 22 + i * 32;
      const t = tall - (i % 2) * 8;
      const drop = lv === 0 ? 'transform="rotate(14 ' + px + ' 330)"' : "";
      return `<g ${drop}>${ln(px, 332, px, 332 - t, k("#3f8f4f"), 4)}${e(px - 11, 332 - t * 0.6, 12, 6, k(leaf), 'transform="rotate(-25 ' + (px - 11) + " " + (332 - t * 0.6) + ')"')}${e(px + 11, 332 - t * 0.8, 12, 6, k(leaf), 'transform="rotate(25 ' + (px + 11) + " " + (332 - t * 0.8) + ')"')}${bloom ? c(px, 332 - t - 4, 6, "#fff3b0") : ""}</g>`;
    }).join("");
  const bed2 =
    lv === 2
      ? stems(488, 5, 66, "#58b05f", true)
      : lv === 1
        ? stems(488, 5, 30, "#b9c45a", false)
        : stems(488, 5, 14, "#a58452", false);
  return `<defs>${grad(`${id}-sky`, k("#8fd3ee"), k("#eef8da"))}${grad(`${id}-grass`, k("#8fcd78"), k("#5fa05f"))}${glow(`${id}-sun`, k("#ffe27a"))}</defs>
${r(0, 0, 800, 330, `url(#${id}-sky)`)}
${lv > 0 ? c(112, 88, 120, `url(#${id}-sun)`) : ""}${c(112, 88, 40, k(lv === 0 ? "#e9dca3" : "#ffd84d"))}
${lv === 2 ? [0, 45, 90, 135, 180, 225, 270, 315].map((a) => ln(112 + 52 * Math.cos((a * Math.PI) / 180), 88 + 52 * Math.sin((a * Math.PI) / 180), 112 + 70 * Math.cos((a * Math.PI) / 180), 88 + 70 * Math.sin((a * Math.PI) / 180), k("#ffd84d"), 4)).join("") : ""}
${cloud(300, 60, 1, "#ffffff")}${cloud(560, 96, 0.8, "#ffffff")}${lv === 0 ? cloud(130, 80, 1.5, k("#b9c4c9")) : ""}
${p("M0 250 Q120 190 250 240 T520 230 T800 245 V340 H0Z", k("#b3dc9f"))}${p("M0 285 Q180 235 380 280 T800 272 V345 H0Z", k("#8cc77a"))}
${Array.from({ length: 12 }, (_, i) => r(20 + i * 68, 262, 8, 52, k("#e8d3a8"), 2) + p(`M${16 + i * 68} 262 l8 -10 l8 10z`, k("#e8d3a8"))).join("")}${r(0, 282, 800, 6, k("#e8d3a8"))}${r(0, 298, 800, 6, k("#e8d3a8"))}
${r(0, 322, 800, 158, `url(#${id}-grass)`)}
${p("M335 322 H465 L560 480 H240Z", k("#e3c697"))}${p("M365 322 H435 L470 480 H330Z", k("#ecd3a6"), 'opacity=".6"')}
${r(361, 150, 10, 176, k("#9a6a3c"), 3)}${r(300, 70, 132, 90, k("#c99a63"), 9)}${r(308, 78, 116, 74, k("#fffaf0"), 6)}
${ln(322, 135, 322, 100, k("#4f9d69"), 10)}${ln(366, 135, 366, 124, k("#e8a33d"), 10)}${ln(410, 135, 410, 92, k("#2e7d9a"), 10)}${ln(318, 140, 414, 140, k("#8a7a62"), 2)}
${r(52, 296, 190, 84, k("#b97d45"), 7)}${r(62, 304, 170, 66, k("#6b4a32"), 5)}${stems(54, 5, 74, "#4aa655", false)}${r(52, 366, 190, 14, k("#9a6a3c"), 6)}
${r(482, 296, 190, 84, k("#b97d45"), 7)}${r(492, 304, 170, 66, k("#6b4a32"), 5)}${bed2}${r(482, 366, 190, 14, k("#9a6a3c"), 6)}
${r(706, 190, 30, 150, k("#7a5232"), 6)}${c(718, 150, 78, k("#2f7d4a"))}${c(660, 176, 58, k("#3a8f55"))}${c(776, 168, 58, k("#35864f"))}${c(716, 110, 46, k("#43a060"))}
${e(584, 352, 150, 30, "#1d3b2a", 'opacity=".2"')}
${r(298, 342, 46, 30, k("#5c8fa8"), 6)}${p("M344 352 L376 336 L380 342 L346 364z", k("#5c8fa8"))}${p("M298 346 q-22 -4 -20 16", "none", `stroke="${k("#456f84")}" stroke-width="5"`)}
${r(432, 392, 40, 34, k("#c9722f"), 4)}${r(428, 388, 48, 10, k("#d98a45"), 4)}${r(436, 380, 32, 10, k("#4a3322"), 4)}
${r(690, 396, 84, 34, k("#d9483f"), 6)}${c(708, 436, 11, k("#2c2c2c"))}${c(756, 436, 11, k("#2c2c2c"))}${ln(690, 396, 672, 380, k("#8a2e28"), 5)}
${veil(mood, "#4d5a5e")}`;
}

function classroom({ k, id, lv, mood }) {
  const desk = (x, y) =>
    `${r(x, y, 190, 16, k("#c99a63"), 4)}${r(x + 12, y + 16, 8, 62, k("#8a6a43"))}${r(x + 170, y + 16, 8, 62, k("#8a6a43"))}${r(x + 55, y + 50, 76, 40, k("#4f8fb0"), 8)}`;
  const leaf = (dx) =>
    `<g transform="rotate(${lv === 0 ? dx * 1.8 : dx} 0 0)">${e(0, -16, 8, 20, k(lv === 0 ? "#a8985c" : "#4f9d69"))}</g>`;
  return `<defs>${grad(`${id}-wall`, k("#fdf3dc"), k("#f1deb4"))}${grad(`${id}-floor`, k("#d7a86d"), k("#b98a52"))}${grad(`${id}-win`, k("#9fd8ef"), k("#e8f5ee"))}${glow(`${id}-lamp`, k("#fff0b0"))}</defs>
${r(0, 0, 800, 345, `url(#${id}-wall)`)}${r(0, 328, 800, 20, k("#d9c08c"))}${r(0, 345, 800, 135, `url(#${id}-floor)`)}
${[0, 1, 2, 3, 4, 5].map((i) => ln(i * 160, 345, i * 200 - 100, 480, k("#a87a46"), 2, 'opacity=".5"')).join("")}
${r(70, 56, 300, 150, k("#f6fbf6"), 8, `stroke="${k("#9aa7ad")}" stroke-width="8"`)}${ln(96, 92, 250, 92, k("#2e7d9a"), 5)}${ln(96, 122, 320, 122, k("#4f9d69"), 5)}${ln(96, 152, 210, 152, k("#d9772f"), 5)}${r(120, 206, 200, 9, k("#9aa7ad"), 4)}
${r(556, 56, 210, 156, k("#ffffff"), 8, `stroke="${k("#c99a63")}" stroke-width="9"`)}${r(564, 64, 194, 140, `url(#${id}-win)`)}${ln(661, 64, 661, 204, k("#ffffff"), 6)}${ln(564, 134, 758, 134, k("#ffffff"), 6)}${cloud(620, 100, 0.55, "#ffffff")}
${lv > 0 ? p("M564 204 H758 L700 345 H520Z", k("#fff6c9"), `opacity="${lv === 2 ? ".38" : ".18"}"`) : ""}
${[0, 1, 2, 3, 4].map((i) => r(410 + (i % 3) * 46, 76 + Math.floor(i / 3) * 52, 38, 42, k(["#fde08a", "#bfe3d0", "#f6c0a0", "#bcd6ef", "#f7d7a1"][i]), 4)).join("")}
${ln(400, 0, 400, 32, k("#8a8a8a"), 3)}${p("M360 56 Q400 20 440 56Z", k("#e8a33d"))}${lv > 0 ? c(400, 70, 110, `url(#${id}-lamp)`, `opacity="${lv === 2 ? 0.7 : 0.35}"`) : ""}
${desk(40, 296)}${desk(300, 316)}${r(626, 236, 150, 120, k("#a97c48"), 6)}${r(634, 244, 134, 48, k("#6b4a32"))}${r(634, 300, 134, 48, k("#6b4a32"))}${books(k, 638, 250, 126, 40, BOOKS, 1)}${books(k, 638, 306, 126, 40, BOOKS, 4)}
<g transform="translate(700 236)">${r(-20, -24, 40, 24, k("#c9722f"), 4)}<g transform="translate(0 -22)">${leaf(-30)}${leaf(0)}${leaf(30)}</g></g>
${veil(mood, "#40484d")}`;
}

function lab({ k, id, lv, mood }) {
  const beaker = (x, level, color, bubbles) =>
    `<g>${p(`M${x} 250 h54 v90 q0 14 -14 14 h-26 q-14 0 -14 -14z`, "#e8f6f8", 'opacity=".85"')}${p(`M${x + 3} ${354 - level} h48 v${level - 14} q0 11 -11 11 h-26 q-11 0 -11 -11z`, k(color))}${bubbles ? [0, 1, 2].map((i) => c(x + 14 + i * 13, 330 - level / 2 - i * 12, 4, "#ffffff", 'opacity=".7"')).join("") : ""}${r(x - 4, 246, 62, 8, k("#9aa7ad"), 3)}</g>`;
  const liquid =
    lv === 2 ? ["#59c4a0", 70, true] : lv === 1 ? ["#d9c45a", 46, false] : ["#8a6a43", 24, false];
  return `<defs>${grad(`${id}-wall`, k("#e6f2f0"), k("#cfe3e0"))}${grad(`${id}-floor`, k("#a8b8c4"), k("#8294a2"))}${glow(`${id}-lamp`, k("#e8fff8"))}</defs>
${r(0, 0, 800, 350, `url(#${id}-wall)`)}${[1, 2, 3, 4, 5, 6, 7].map((i) => ln(i * 100, 0, i * 100, 350, k("#b9d2cf"), 2, 'opacity=".7"')).join("")}${[1, 2, 3].map((i) => ln(0, i * 88, 800, i * 88, k("#b9d2cf"), 2, 'opacity=".7"')).join("")}
${r(0, 350, 800, 130, `url(#${id}-floor)`)}
${r(300, 60, 190, 130, k("#fbfdfd"), 8, `stroke="${k("#8fa6ad")}" stroke-width="7"`)}${ln(326, 168, 326, 84, k("#59707a"), 3)}${ln(326, 168, 468, 168, k("#59707a"), 3)}<polyline points="332,150 366,128 400,134 436,98 464,90" fill="none" stroke="${k("#d9772f")}" stroke-width="5" stroke-linejoin="round"/>${c(436, 98, 5, k("#d9772f"))}${c(366, 128, 5, k("#d9772f"))}
${r(40, 90, 150, 14, k("#a97c48"), 4)}${r(40, 150, 150, 14, k("#a97c48"), 4)}${[0, 1, 2, 3].map((i) => r(52 + i * 34, 62 + (i % 2) * 6, 22, 28 - (i % 2) * 6, k(["#4f9d69", "#2e7d9a", "#e8a33d", "#d9534f"][i]), 4)).join("")}${[0, 1, 2].map((i) => r(58 + i * 44, 124, 26, 26, k(["#59c4a0", "#e8a33d", "#8fc3e0"][i]), 5)).join("")}
${r(0, 320, 800, 30, k("#8a9aa4"))}${r(0, 340, 800, 140, k("#5f7684"))}${r(0, 340, 800, 6, k("#3c5160"))}${[0, 1, 2, 3, 4, 5].map((i) => r(20 + i * 134, 360, 118, 100, k("#6f8795"), 6, `stroke="${k("#3c5160")}" stroke-width="2"`)).join("")}
${r(70, 262, 100, 14, k("#2e4a94"), 5)}${r(112, 200, 16, 66, k("#2e4a94"), 5)}${p("M128 206 q40 -10 38 36 q-4 22 -32 16", "none", `stroke="${k("#2e4a94")}" stroke-width="12" stroke-linecap="round"`)}${r(88, 168, 22, 52, k("#59707a"), 6, 'transform="rotate(-18 99 194)"')}${r(180, 304, 30, 18, "#dbe8ea", 4, `stroke="${k("#59707a")}" stroke-width="3"`)}
${beaker(560, liquid[1], liquid[0], liquid[2])}${beaker(630, 40, "#8fc3e0", false)}${p("M710 250 h20 v30 l30 56 q6 16 -12 16 h-56 q-18 0 -12 -16 l30 -56z", "#e8f6f8", 'opacity=".9"')}${p("M696 338 l24 -46 l24 46 q4 12 -8 12 h-32 q-12 0 -8 -12z", k(lv === 2 ? "#59c4a0" : lv === 1 ? "#d9c45a" : "#8a6a43"))}
${lv > 0 ? c(400, 8, 130, `url(#${id}-lamp)`, `opacity="${lv === 2 ? 0.8 : 0.4}"`) : ""}
${veil(mood, "#33414a")}`;
}

function community({ k, id, lv, mood }) {
  const flowers =
    lv === 2 ? ["#e8a33d", "#d9534f", "#fff3b0"] : lv === 1 ? ["#d9c45a", "#c9a46a"] : ["#8a7a5a"];
  const person = (x, col) =>
    `<g>${r(x - 12, 360, 24, 46, k(col), 10)}${c(x, 348, 12, k("#e0b48a"))}${r(x - 10, 406, 8, 20, k("#3c4a6a"), 3)}${r(x + 2, 406, 8, 20, k("#3c4a6a"), 3)}</g>`;
  return `<defs>${grad(`${id}-sky`, k("#9ad3ee"), k("#f2f6e2"))}</defs>
${r(0, 0, 800, 350, `url(#${id}-sky)`)}${c(660, 70, 36, k(lv === 0 ? "#e9dca3" : "#ffd84d"))}${cloud(230, 70, 0.9, "#ffffff")}${cloud(430, 110, 0.7, "#ffffff")}${lv === 0 ? cloud(560, 70, 1.4, k("#b9c4c9")) : ""}
${[0, 1, 2, 3, 4, 5, 6].map((i) => r(10 + i * 112, 160 + ((i * 37) % 70), 70, 190, k(["#9db8c9", "#b6c9c4", "#c4b9a3", "#a9bdd0"][i % 4]), 4)).join("")}
${r(36, 168, 250, 180, k("#c9622f"), 6)}${r(36, 168, 250, 18, k("#a84e24"))}${r(130, 268, 52, 80, k("#7a4a2d"), 4)}${[0, 1].map((i) => r(58 + i * 150, 206, 54, 44, k("#cfe8f2"), 4, `stroke="${k("#fff6e0")}" stroke-width="5"`)).join("")}${p("M114 262 H198 L190 246 H122Z", k("#2e7d9a"))}
${r(300, 292, 190, 58, k("#7fc072"), 28)}${r(374, 232, 14, 90, k("#8a5a32"), 4)}${c(381, 214, 50, k("#3a8f55"))}${c(340, 236, 34, k("#43a060"))}${c(422, 236, 34, k("#35864f"))}${r(320, 316, 70, 8, k("#9a6a3c"), 3)}${r(326, 324, 6, 20, k("#6b4a32"))}${r(380, 324, 6, 20, k("#6b4a32"))}
${r(520, 150, 262, 200, k("#e8c26a"), 6)}${r(520, 150, 262, 22, k("#2e7d9a"))}${[0, 1, 2, 3, 4, 5].map((i) => r(528 + i * 42, 172, 21, 26, k(i % 2 ? "#ffffff" : "#2e7d9a"), 0)).join("")}${r(620, 262, 62, 88, k("#8a5a32"), 4)}${r(542, 214, 56, 56, k("#cfe8f2"), 4, `stroke="${k("#fff6e0")}" stroke-width="5"`)}${r(704, 214, 56, 56, k("#cfe8f2"), 4, `stroke="${k("#fff6e0")}" stroke-width="5"`)}
${r(0, 346, 800, 40, k("#d9d4c6"))}${r(0, 386, 800, 94, k("#6e7780"))}${[0, 1, 2, 3, 4, 5].map((i) => r(20 + i * 140, 432, 70, 7, "#f6f1dd", 3)).join("")}${r(0, 383, 800, 6, k("#a8a291"))}
${ln(500, 346, 500, 262, k("#4a5a66"), 6)}${c(500, 252, 12, k("#e8c26a"))}${r(470, 296, 60, 20, k("#d9534f"), 4)}
${flowers.map((col, i) => [0, 1, 2, 3, 4].map((j) => c(312 + j * 36 + i * 9, 330 - ((j + i) % 2) * 4, 7, k(col))).join("")).join("")}
${person(250, "#e8a33d")}${person(560, "#4f8fb0")}${person(610, "#4f9d69")}
${veil(mood, "#4a545c")}`;
}

function museum({ k, id, lv, mood }) {
  const frame = (x, y, w, h, a, b) =>
    `${r(x, y, w, h, k("#b88a4a"), 4)}${r(x + 8, y + 8, w - 16, h - 16, k(a), 2)}${p(`M${x + 8} ${y + h - 8} l${(w - 16) * 0.35} -${h * 0.32} l${(w - 16) * 0.25} ${h * 0.14} l${(w - 16) * 0.4} -${h * 0.3} v${h * 0.48 - 8}z`, k(b))}`;
  return `<defs>${grad(`${id}-wall`, k("#f1e8d6"), k("#e2d4b8"))}${grad(`${id}-floor`, k("#dcc9a0"), k("#b59a70"))}<linearGradient id="${id}-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k("#fff3c4")}" stop-opacity=".9"/><stop offset="1" stop-color="${k("#fff3c4")}" stop-opacity=".05"/></linearGradient></defs>
${r(0, 0, 800, 330, `url(#${id}-wall)`)}${r(0, 250, 800, 80, k("#cdbb99"))}${r(0, 246, 800, 8, k("#b59a70"))}${r(0, 330, 800, 150, `url(#${id}-floor)`)}${e(400, 420, 330, 50, "#ffffff", 'opacity=".12"')}
${frame(36, 70, 150, 104, "#bfe0ee", "#4f9d69")}${frame(206, 92, 84, 110, "#f6dcaa", "#c9722f")}${frame(60, 196, 100, 40, "#cfe6d0", "#2e7d9a")}
${p("M340 0 H460 L520 330 H280Z", `url(#${id}-beam)`, `opacity="${lv === 2 ? 0.8 : lv === 1 ? 0.45 : 0.18}"`)}${r(380, 0, 40, 14, k("#59707a"), 4)}
${r(330, 296, 140, 60, k("#8a6a43"), 4)}${r(340, 220, 120, 80, "#eaf5f7", 6, 'opacity=".55" stroke="#9fb6bd" stroke-width="3"')}${e(400, 276, 34, 22, k("#e8a33d"))}${p("M372 276 q28 -34 56 0", "none", `stroke="${k("#8a5a1a")}" stroke-width="6"`)}${c(400, 262, 10, k("#c9722f"))}
${r(560, 120, 220, 130, k("#fbf6e8"), 6, `stroke="${k("#b88a4a")}" stroke-width="6"`)}${[0, 1, 2, 3, 4, 5, 6].map((i) => r(578 + i * 28, 200 - i * 8 - (i % 3) * 6, 18, 36 + i * 8, k("#d9b46a"), 4)).join("")}${ln(582, 152, 740, 152, k("#9aa7ad"), 3)}${ln(582, 170, 700, 170, k("#9aa7ad"), 3)}
${r(594, 320, 150, 14, k("#8a6a43"), 4)}${r(604, 334, 8, 34, k("#6b4a32"))}${r(726, 334, 8, 34, k("#6b4a32"))}
${[40, 220].map((x) => `${r(x, 330, 8, 70, k("#c9a24a"), 3)}${c(x + 4, 328, 8, k("#c9a24a"))}`).join("")}<path d="M44 350 Q132 392 224 350" fill="none" stroke="${k("#2e4a94")}" stroke-width="6"/>
${veil(mood, "#3c3a36")}`;
}

function library({ k, id, lv, mood }) {
  const shelf = (x) =>
    `${r(x, 40, 210, 340, k("#8a5a32"), 6)}${[0, 1, 2, 3].map((i) => r(x + 8, 52 + i * 80, 194, 4, k("#6b4a32")) + books(k, x + 8, 56 + i * 80, 194, 70, BOOKS, i * 2 + (x > 400 ? 3 : 0))).join("")}`;
  return `<defs>${grad(`${id}-wall`, k("#d9b283"), k("#b88a55"))}${grad(`${id}-floor`, k("#a8754a"), k("#7d5233"))}${grad(`${id}-win`, k("#b6e0f0"), k("#f2f6e2"))}${glow(`${id}-lamp`, k("#ffe8a0"))}</defs>
${r(0, 0, 800, 380, `url(#${id}-wall)`)}${r(0, 380, 800, 100, `url(#${id}-floor)`)}${[1, 2, 3, 4, 5].map((i) => ln(i * 150, 380, i * 190 - 60, 480, k("#6b4a32"), 2, 'opacity=".5"')).join("")}
${shelf(20)}${shelf(570)}
${p("M320 250 V140 Q320 70 400 70 Q480 70 480 140 V250Z", `url(#${id}-win)`, `stroke="${k("#6b4a32")}" stroke-width="10"`)}${ln(400, 70, 400, 250, k("#6b4a32"), 6)}${ln(320, 160, 480, 160, k("#6b4a32"), 6)}${cloud(440, 120, 0.4, "#ffffff")}
${e(400, 430, 190, 28, k("#c9622f"), 'opacity=".85"')}${e(400, 430, 150, 18, k("#e8a33d"), 'opacity=".6"')}
${r(300, 330, 200, 14, k("#a97c48"), 5)}${r(318, 344, 10, 56, k("#6b4a32"))}${r(472, 344, 10, 56, k("#6b4a32"))}${r(352, 312, 44, 18, k("#d9534f"), 3)}${r(360, 300, 44, 14, k("#2e7d9a"), 3)}${r(430, 316, 36, 14, k("#4f9d69"), 3)}
${r(438, 270, 6, 46, k("#59707a"))}${p("M410 276 H474 L462 244 H422Z", k(lv === 0 ? "#cdbb99" : "#e8a33d"))}${lv > 0 ? c(442, 268, 110, `url(#${id}-lamp)`, `opacity="${lv === 2 ? 0.85 : 0.45}"`) : ""}
${r(250, 360, 36, 40, k("#2e4a94"), 4)}${c(268, 342, 30, k("#4f8fb0"))}${ln(238, 342, 298, 342, k("#c9a24a"), 4)}
${veil(mood, "#403a32")}`;
}

function map({ k, id, lv, mood }) {
  const route =
    lv === 0
      ? 'stroke-dasharray="2 14" opacity=".45"'
      : lv === 1
        ? 'stroke-dasharray="10 10" opacity=".8"'
        : 'stroke-dasharray="14 8"';
  const tree = (x, y) =>
    `${r(x - 2, y, 4, 9, k("#6b4a32"))}${p(`M${x - 11} ${y + 2} L${x} ${y - 20} L${x + 11} ${y + 2}Z`, k("#3f8f4f"))}`;
  return `<defs>${grad(`${id}-sea`, k("#8fc9e0"), k("#5f9fc0"))}${grad(`${id}-paper`, k("#f6e8c3"), k("#e8d3a0"))}${glow(`${id}-fog`, "#e8eef0")}</defs>
${r(0, 0, 800, 480, `url(#${id}-paper)`)}${r(26, 26, 748, 428, `url(#${id}-sea)`, 14, `stroke="${k("#8a5a32")}" stroke-width="10"`)}
${[1, 2, 3, 4, 5, 6, 7].map((i) => ln(26 + i * 93, 26, 26 + i * 93, 454, "#ffffff", 1.5, 'opacity=".28"')).join("")}${[1, 2, 3, 4].map((i) => ln(26, 26 + i * 86, 774, 26 + i * 86, "#ffffff", 1.5, 'opacity=".28"')).join("")}
${p("M60 170 Q80 90 170 96 Q250 100 262 170 Q268 250 190 276 Q100 296 70 240Z", k("#a9d08a"))}${p("M90 190 Q110 130 170 134 Q220 140 226 190 Q226 236 170 248 Q112 256 96 220Z", k("#8cc77a"))}${tree(130, 200)}${tree(166, 178)}${tree(196, 210)}
${p("M520 26 Q560 90 600 120 Q690 150 774 140 V454 H500 Q470 380 520 330 Q560 280 520 230 Q490 140 520 26Z", k("#e3cf9d"))}${p("M600 160 Q680 150 760 170 V300 Q680 320 620 280 Q580 220 600 160Z", k("#a9d08a"))}
${[0, 1, 2].map((i) => p(`M${566 + i * 48} 120 l24 -50 l24 50z`, k("#8a8f94")) + p(`M${578 + i * 48} 92 l12 -22 l12 22z`, "#ffffff")).join("")}${tree(640, 240)}${tree(676, 226)}${tree(706, 250)}
${p("M520 330 Q470 380 420 400 Q360 420 300 380", "none", `stroke="${k("#5f9fc0")}" stroke-width="3" opacity=".0"`)}
<path d="M170 250 Q250 340 360 300 Q440 270 500 330 Q560 380 650 320" fill="none" stroke="${k("#c4402f")}" stroke-width="6" stroke-linecap="round" ${route}/>
${ln(634, 300, 664, 340, k("#c4402f"), 8)}${ln(664, 300, 634, 340, k("#c4402f"), 8)}${r(168, 236, 4, 38, k("#6b4a32"))}${p("M172 236 h34 l-8 10 l8 10 h-34z", k("#d9534f"))}
${p("M360 300 q22 -28 50 -10 q-26 30 -50 10z", k("#8a6a43"))}${e(330, 400, 56, 18, k("#f6e8c3"), 'opacity=".5"')}
<g transform="translate(690 396)">${c(0, 0, 40, k("#fbf0da"), `stroke="${k("#8a5a32")}" stroke-width="5"`)}${p("M0 -34 L8 0 L0 34 L-8 0Z", k("#c4402f"))}${p("M-34 0 L0 -8 L34 0 L0 8Z", k("#2e4a94"))}${c(0, 0, 5, k("#8a5a32"))}</g>
${lv === 0 ? e(400, 250, 360, 190, `url(#${id}-fog)`, 'opacity=".75"') : lv === 1 ? e(400, 250, 360, 190, `url(#${id}-fog)`, 'opacity=".25"') : ""}
${veil(mood, "#4a545c")}`;
}

function debate({ k, id, lv, mood }) {
  const podium = (x, col) =>
    `${p(`M${x} 270 h150 l-14 140 h-122z`, k("#a97c48"))}${r(x - 8, 258, 166, 18, k("#c99a63"), 5)}${r(x + 28, 296, 94, 46, k(col), 4)}${ln(x + 75, 250, x + 75, 170, k("#59707a"), 4)}${c(x + 75, 162, 14, k(col))}`;
  const beam = (x1, x2) =>
    p(
      `M${x1} 30 L${x2 - 70} 400 H${x2 + 70} L${x1} 30`,
      k("#fff3c4"),
      `opacity="${lv === 2 ? 0.34 : lv === 1 ? 0.18 : 0.06}"`,
    );
  return `<defs>${grad(`${id}-curt`, k("#2e6a7a"), k("#1d4552"))}${grad(`${id}-stage`, k("#c99a63"), k("#9a6f3e"))}</defs>
${r(0, 0, 800, 480, `url(#${id}-curt)`)}${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => r(i * 68, 0, 34, 360, k("#000000"), 0, 'opacity=".08"')).join("")}${r(0, 0, 800, 40, k("#1d3b46"))}${r(0, 36, 800, 6, k("#c9a24a"))}
${[130, 400, 670].map((x) => `${r(x - 16, 14, 32, 14, k("#59707a"), 4)}`).join("")}${beam(130, 190)}${beam(670, 610)}${beam(400, 400)}
${r(0, 372, 800, 108, `url(#${id}-stage)`)}${r(0, 366, 800, 10, k("#7a5232"))}
${podium(112, "#2e7d9a")}${podium(540, "#e8a33d")}
${r(360, 260, 80, 8, k("#59707a"), 3)}${ln(400, 200, 400, 260, k("#59707a"), 6)}${ln(340, 214, 460, 214, k("#59707a"), 5)}${p("M330 214 q10 30 20 0z", k("#c9a24a"))}${p("M450 214 q10 30 20 0z", k("#c9a24a"))}${r(372, 268, 56, 36, k("#7a5232"), 4)}
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => c(40 + i * 80 + (i % 2) * 20, 452 - (i % 3) * 10, 22, k("#1d2b58"), 'opacity=".78"') + e(40 + i * 80 + (i % 2) * 20, 488 - (i % 3) * 10, 32, 24, k("#1d2b58"), 'opacity=".78"')).join("")}
${veil(mood, "#202a30")}`;
}

const SCENES = { classroom, lab, garden, community, museum, library, map, debate };
const LIFE = { good: 2, neutral: 1, warn: 1, bad: 0 };

/**
 * Inline SVG backdrop for one environment.
 * @param {string} id one of ENVIRONMENT_IDS
 * @param {"good"|"warn"|"bad"|"neutral"} mood what the scene shows now; changes light and the "life" element
 * @param {"3-5"|"6-8"} band grades 3-5 warm and full, grades 6-8 the same scene calmer and muted
 */
export function environmentArt(id, mood = "neutral", band = "3-5") {
  const scene = SCENES[id];
  if (!scene) throw new Error(`Unknown environment "${id}"`);
  const m = MOODS.includes(mood) ? mood : "neutral";
  const body = scene({ k: tinter(band, m), id: `ea-${id}`, lv: LIFE[m], mood: m });
  return raw(
    `<svg class="ea ea-${id}" data-mood="${m}" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
  );
}
