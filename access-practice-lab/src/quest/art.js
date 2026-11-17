// Language Quest art: original inline SVG, drawn from data. Nothing is a bitmap and nothing comes from outside the lab.
// Scenes are layered (sky, far, floor, near) so a little ambient motion can move layers apart; motion is CSS only and is
// switched off by prefers-reduced-motion and by the lab's own motion setting (quest.css). Every figure used as content
// has a text description supplied by the caller (aria-label / <title> or a visible caption).
// Style: the site's illustration kit (src/art/kit.js): editorial picture-book flat art with no dark outlines. Form
// comes from a lit side and a shade side of each fill, soft contact shadows, hazy distance and one warm light, in the
// Deep Harbor palette unless the content names a colour. Glyphs and portraits are repeated on a page, so they carry no
// ids; each scene's gradients get ids unique to that call.
import { esc } from "../util.js";
import {
  P,
  SKIN,
  circle,
  cloud,
  ellipse,
  haze,
  light,
  noDefs,
  path,
  poly,
  rect,
  rrect,
  shade,
  stroke,
} from "../art/kit.js";

const INK = P.ink;
const PAPER = P.ivory;
const SH = "#1c2f4a"; // shadow tone (the kit's contact shadow colour)
const drop = (x, y, rx, ry = rx * 0.2, o = 0.2) =>
  ellipse(x, y, rx, ry, SH, `opacity="${o}"`);
const op = (o) => `opacity="${o}"`;

// Named colours from content: yellow sticky note, red light, red flag, golden star, red curtains.
const GLASS = "#cfe9f2";
const GLASS2 = "#9cc9de";
const STEEL = "#7f8b99";
const STEEL_L = "#a8b3bf";
const SLATE = "#5d6b80";
const BRASS = "#c99a3e";
const STICKY = "#f3cd6f";
const RED = P.red;

/** A gear outline with n square teeth. */
function gearPath(r1, r2, n) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const t = Math.PI / n / 1.6;
    const pt = (rr, aa) =>
      `${(Math.cos(aa) * rr).toFixed(1)} ${(Math.sin(aa) * rr).toFixed(1)}`;
    d += `${i ? "L" : "M"}${pt(r1, a - t * 1.3)}L${pt(r2, a - t)}L${pt(r2, a + t)}L${pt(r1, a + t * 1.3)}`;
  }
  return `${d}Z`;
}
const STAR = "M0 -26L7 -8L26 -8L11 4L17 24L0 12L-17 24L-11 4L-26 -8L-7 -8Z";

// ── small icons, drawn in a 60 x 60 box around (0,0) ────────────────────────────────────────────────────────────
const G = {
  window:
    rrect(-28, -30, 56, 60, 4, P.wall) +
    rrect(13, -30, 15, 60, 4, shade(P.wall, 0.12)) +
    rect(-22, -24, 44, 48, GLASS) +
    rect(-22, 0, 44, 24, GLASS2) +
    poly(
      [
        [-22, 14],
        [-4, -24],
        [6, -24],
        [-12, 24],
        [-22, 24],
      ],
      P.white,
      op(0.35),
    ) +
    rect(-2, -24, 4, 48, P.wall) +
    rect(-22, -2, 44, 4, P.wall) +
    rrect(-7, 1, 14, 7, 2, P.gold) +
    rect(-7, 5, 14, 3, shade(P.gold, 0.25)) +
    rrect(-32, 27, 64, 7, 2, P.woodLight) +
    rect(-32, 31, 64, 3, P.woodDark),
  case:
    drop(0, 31, 32, 4) +
    rrect(-31, 19, 62, 11, 2, "#3e4a5c") +
    rect(-31, 19, 62, 3, SLATE) +
    rect(-26, -6, 52, 25, GLASS, op(0.8)) +
    rect(13, -6, 13, 25, GLASS2, op(0.55)) +
    poly(
      [
        [-26, -6],
        [-18, -17],
        [18, -17],
        [26, -6],
      ],
      "#e6f4f8",
    ) +
    poly(
      [
        [18, -17],
        [26, -6],
        [13, -6],
      ],
      GLASS2,
      op(0.6),
    ) +
    poly(
      [
        [-20, 19],
        [-8, -6],
        [0, -6],
        [-12, 19],
      ],
      P.white,
      op(0.5),
    ) +
    stroke("M-26 -6H26M-26 -6V19M26 -6V19", "#7f97a8", 1.4, op(0.7)),
  badge:
    drop(2, 30, 18, 3) +
    rrect(-19, -28, 38, 56, 5, PAPER) +
    rrect(9, -28, 10, 56, 4, shade(PAPER, 0.1)) +
    rrect(-19, -28, 38, 11, 5, P.navy) +
    rect(-19, -22, 38, 5, P.navy) +
    rrect(-5, -32, 10, 7, 2, STEEL) +
    rrect(-11, -13, 22, 19, 3, "#d8e6ee") +
    circle(0, -6, 4.6, SKIN[3]) +
    path("M-7 6Q-7 -1 0 -1Q7 -1 7 6Z", P.teal) +
    rrect(-11, 11, 22, 3.4, 1.7, "#9aa7b4") +
    rrect(-11, 17, 14, 3.4, 1.7, "#c3cbd3"),
  note:
    `<g transform="rotate(-6)">` +
    rect(-19, -19, 44, 44, SH, op(0.16)) +
    path("M-22 -22H22V10L10 22H-22Z", STICKY) +
    rect(-22, -22, 44, 8, "#ebbd4e") +
    poly(
      [
        [22, 10],
        [10, 10],
        [10, 22],
      ],
      "#d9a838",
    ) +
    rrect(-15, -6, 28, 2.6, 1.3, "#a87a1e", op(0.55)) +
    rrect(-15, 2, 28, 2.6, 1.3, "#a87a1e", op(0.55)) +
    rrect(-15, 10, 18, 2.6, 1.3, "#a87a1e", op(0.55)) +
    `</g>`,
  cup:
    drop(-2, 25, 19, 3.5) +
    stroke("M13 -7H19Q27 -7 27 1Q27 9 18 9H13", shade(PAPER, 0.18), 5) +
    path("M-18 -16H14V10Q14 24 -2 24Q-18 24 -18 10Z", PAPER) +
    path("M3 -16H14V10Q14 24 -2 24Q5 18 3 -16Z", shade(PAPER, 0.14)) +
    rect(-18, -6, 32, 6, P.teal) +
    rect(3, -6, 11, 6, shade(P.teal, 0.2)) +
    ellipse(-2, -16, 16, 3.6, "#e6dccb") +
    ellipse(-2, -15.6, 13, 2.4, "#6b452b") +
    stroke(
      "M-10 -24Q-6 -30 -10 -36M2 -24Q6 -30 2 -36",
      "#9aa7b4",
      2.2,
      op(0.75),
    ),
  fan:
    drop(0, 29, 24, 3.5) +
    circle(0, 0, 27, P.stoneDark) +
    circle(-1, -1, 25, P.stone) +
    circle(0, 0, 21, "#ece8e1") +
    path("M0 -21A21 21 0 0 1 0 21A16 21 0 0 0 0 -21Z", SH, op(0.08)) +
    circle(0, 0, 14, "none", `stroke="#c4bdb2" stroke-width="1.2"`) +
    `<g fill="${P.navy}"><path d="M0 0C-7 -22 9 -24 6 -3Z"/><path d="M0 0C-7 -22 9 -24 6 -3Z" transform="rotate(120)"/><path d="M0 0C-7 -22 9 -24 6 -3Z" transform="rotate(240)"/></g>` +
    path("M0 0C-4 -16 4 -20 4 -6Z", light(P.navy, 0.3)) +
    circle(0, 0, 9, RED, op(0.3)) +
    circle(0, 0, 5, RED) +
    circle(-1.5, -1.5, 1.6, P.white, op(0.7)),
  board:
    drop(0, 29, 28, 3) +
    rrect(-31, -25, 62, 50, 4, "#9aa3ad") +
    rrect(-28, -22, 56, 44, 2, "#fbfcfd") +
    path("M-28 22L28 -22V22Z", "#e8edf1", op(0.6)) +
    rrect(-20, -13, 40, 4.4, 2.2, P.navy) +
    rrect(-20, -3, 40, 4.4, 2.2, P.teal, op(0.75)) +
    rrect(-20, 7, 26, 4.4, 2.2, P.coral, op(0.8)) +
    rect(-24, 25, 48, 4, "#7f8994"),
  sun:
    circle(0, 0, 25, P.goldLight, op(0.28)) +
    stroke(
      "M0 -26V-20M0 20V26M-26 0H-20M20 0H26M-18 -18l4 4M14 14l4 4M18 -18l-4 4M-14 14l-4 4",
      P.gold,
      3.6,
    ) +
    circle(0, 0, 15, P.gold) +
    circle(-3, -3, 10, "#f6cf5d") +
    circle(-5, -5, 4.5, "#fff3c4", op(0.8)),
  tree:
    drop(0, 30, 17, 3.2) +
    path("M-5 30L-3 2H3L5 30Z", P.bark) +
    rect(0, 2, 4, 28, P.barkDark, op(0.6)) +
    circle(-13, 0, 12, shade(P.leaf, 0.18)) +
    circle(13, -2, 13, shade(P.leaf, 0.18)) +
    circle(0, -10, 21, shade(P.leaf, 0.1)) +
    circle(-4, -13, 17, P.leaf) +
    circle(-14, -2, 8, P.leaf) +
    ellipse(-9, -20, 8, 5, P.leafLight, op(0.8)),
  factory:
    drop(0, 29, 32, 3.5) +
    rect(16, -32, 8, 26, P.brick) +
    rect(20, -32, 4, 26, shade(P.brick, 0.2)) +
    circle(22, -38, 5, "#d8dde2", op(0.85)) +
    circle(28, -44, 6.5, "#e4e8eb", op(0.7)) +
    rect(-28, -6, 56, 34, "#6c7a8c") +
    rect(10, -6, 18, 34, shade("#6c7a8c", 0.15)) +
    path("M-28 -6L-14 -20V-6L0 -20V-6L14 -20V-6Z", "#7f8da0") +
    poly(
      [
        [-14, -20],
        [-14, -6],
        [-18, -6],
      ],
      STICKY,
      op(0.75),
    ) +
    poly(
      [
        [0, -20],
        [0, -6],
        [-4, -6],
      ],
      STICKY,
      op(0.75),
    ) +
    poly(
      [
        [14, -20],
        [14, -6],
        [10, -6],
      ],
      STICKY,
      op(0.75),
    ) +
    rrect(-23, 2, 9, 7, 1.5, STICKY) +
    rrect(14, 2, 9, 7, 1.5, STICKY) +
    rect(-7, 10, 14, 18, P.navy),
  house:
    drop(0, 29, 26, 3.5) +
    rect(-20, -2, 40, 30, P.wall) +
    rect(8, -2, 12, 30, shade(P.wall, 0.1)) +
    rect(10, -24, 6, 12, P.brick) +
    poly(
      [
        [-27, -1],
        [0, -26],
        [27, -1],
      ],
      P.coral,
    ) +
    poly(
      [
        [0, -26],
        [27, -1],
        [0, -1],
      ],
      shade(P.coral, 0.2),
    ) +
    rect(-5, 10, 10, 18, P.teal) +
    circle(3, 19, 1, P.goldLight) +
    rect(-16, 4, 8, 8, GLASS) +
    rect(-16, 8, 8, 4, GLASS2),
  gears:
    circle(1.5, 1.5, 24, SH, op(0.15)) +
    path(gearPath(17, 24, 9), STEEL) +
    circle(0, 0, 17, STEEL_L) +
    path("M0 -17A17 17 0 0 1 0 17A12 17 0 0 0 0 -17Z", STEEL, op(0.6)) +
    circle(0, 0, 7, SLATE) +
    circle(0, 0, 3, "#e9edf1"),
  fox:
    drop(0, 27, 20, 3) +
    poly(
      [
        [-24, -6],
        [-18, -29],
        [-4, -14],
      ],
      "#c4642a",
    ) +
    poly(
      [
        [24, -6],
        [18, -29],
        [4, -14],
      ],
      "#c4642a",
    ) +
    poly(
      [
        [-19, -10],
        [-17, -23],
        [-9, -14],
      ],
      "#3a2a22",
    ) +
    poly(
      [
        [19, -10],
        [17, -23],
        [9, -14],
      ],
      "#3a2a22",
    ) +
    path("M-24 -6L-14 -15H14L24 -6Q24 20 0 26Q-24 20 -24 -6Z", "#e07b39") +
    path("M4 -15H14L24 -6Q24 20 0 26Q14 14 4 -15Z", shade("#e07b39", 0.14)) +
    path("M-14 6Q0 28 14 6Q8 12 0 12Q-8 12 -14 6Z", PAPER) +
    circle(-9, -2, 2.8, INK) +
    circle(9, -2, 2.8, INK) +
    ellipse(0, 9, 3.6, 2.6, INK),
  owl:
    drop(0, 29, 18, 3) +
    path("M-20 -18L-13 -28L-6 -20ZM20 -18L13 -28L6 -20Z", "#7d5436") +
    ellipse(0, 2, 22, 26, "#9a6a44") +
    ellipse(9, 4, 13, 24, shade("#9a6a44", 0.14)) +
    ellipse(0, 10, 13, 15, "#d9b48a") +
    stroke("M-5 6q2 2 4 0M1 12q2 2 4 0M-5 18q2 2 4 0", "#a8805a", 1.4) +
    circle(-9, -5, 9, PAPER) +
    circle(9, -5, 9, PAPER) +
    circle(-9, -5, 4, INK) +
    circle(9, -5, 4, INK) +
    circle(-7.6, -6.4, 1.3, P.white) +
    circle(10.4, -6.4, 1.3, P.white) +
    path("M-4 3L0 11L4 3Z", P.gold) +
    rect(-9, 26, 6, 3, P.gold) +
    rect(3, 26, 6, 3, P.gold),
  robot:
    drop(0, 26, 22, 3) +
    stroke("M0 -18V-28", STEEL, 2.4) +
    circle(0, -30, 6, P.gold, op(0.35)) +
    circle(0, -30, 3.8, P.gold) +
    rrect(-27, -6, 6, 12, 2, STEEL) +
    rrect(21, -6, 6, 12, 2, shade(STEEL, 0.15)) +
    rrect(-22, -18, 44, 40, 9, "#9fb4c4") +
    rrect(8, -18, 14, 40, 7, shade("#9fb4c4", 0.15)) +
    rrect(-16, -11, 32, 21, 5, P.navy) +
    circle(-8, -2, 6, P.tealLight, op(0.3)) +
    circle(8, -2, 6, P.tealLight, op(0.3)) +
    circle(-8, -2, 3.4, "#8fe0d4") +
    circle(8, -2, 3.4, "#8fe0d4") +
    rrect(-7, 5, 14, 2.6, 1.3, "#8fe0d4", op(0.7)) +
    rrect(-14, 14, 28, 3, 1.5, light("#9fb4c4", 0.3)),
  kite:
    stroke("M0 16Q-8 24 0 30Q8 36 0 42", INK, 1.4, op(0.6)) +
    poly(
      [
        [-4, 26],
        [4, 22],
        [3, 29],
      ],
      P.coral,
    ) +
    poly(
      [
        [-3, 36],
        [5, 34],
        [2, 40],
      ],
      P.gold,
    ) +
    poly(
      [
        [0, -28],
        [-18, -4],
        [0, -4],
      ],
      P.coralLight,
    ) +
    poly(
      [
        [0, -28],
        [18, -4],
        [0, -4],
      ],
      P.coral,
    ) +
    poly(
      [
        [-18, -4],
        [0, 16],
        [0, -4],
      ],
      P.goldLight,
    ) +
    poly(
      [
        [18, -4],
        [0, 16],
        [0, -4],
      ],
      P.gold,
    ) +
    stroke("M0 -28V16M-18 -4H18", P.woodDark, 1.4, op(0.65)),
  key:
    `<path d="M-24 0a12 12 0 1 0 24 0a12 12 0 1 0 -24 0ZM-16.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0Z" fill="${P.gold}" fill-rule="evenodd"/>` +
    path(
      "M-24 0a12 12 0 0 0 24 0h-4.5a7.5 7.5 0 0 1 -15 0Z",
      shade(P.gold, 0.18),
    ) +
    rect(-1, -2.5, 28, 5, P.gold) +
    rect(-1, 0.5, 28, 2, shade(P.gold, 0.18)) +
    rect(16, 2, 4, 8, shade(P.gold, 0.1)) +
    rect(22, 2, 4, 6, shade(P.gold, 0.1)) +
    path(
      "M-21 -5a9 9 0 0 1 8 -6",
      "none",
      `stroke="#f8e3a6" stroke-width="2" stroke-linecap="round"`,
    ),
  bridge:
    drop(0, 14, 34, 3) +
    path("M-32 7Q0 -19 32 7V13Q0 -11 -32 13Z", P.wood) +
    path("M-32 11Q0 -15 32 11V13Q0 -11 -32 13Z", P.woodDark) +
    stroke(
      "M-24 1V-10M-12 -6V-17M0 -8V-19M12 -6V-17M24 1V-10",
      P.woodDark,
      2.4,
    ) +
    stroke("M-27 -5Q0 -29 27 -5", P.woodLight, 2.6),
  star:
    drop(0, 28, 16, 2.6, 0.15) +
    path(STAR, P.gold) +
    path("M0 -26L7 -8L26 -8L11 4L17 24L0 12Z", shade(P.gold, 0.12)) +
    path("M0 -26L-7 -8L-26 -8L-11 4L0 0Z", "#f6cf5d") +
    circle(-6, -8, 2.6, P.white, op(0.6)),
  river:
    path("M-30 -16Q-15 -26 0 -16T30 -16V22Q15 12 0 22T-30 22Z", P.water) +
    path("M-30 8Q-15 -2 0 8T30 8V22Q15 12 0 22T-30 22Z", P.waterDark) +
    stroke(
      "M-24 -10Q-15 -16 -6 -10M6 -2Q15 -8 24 -2M-20 10Q-11 4 -2 10",
      P.waterLight,
      2.4,
      op(0.9),
    ),
  compass:
    drop(0, 27, 22, 3) +
    circle(0, 0, 25, BRASS) +
    path("M0 -25A25 25 0 0 1 0 25A19 25 0 0 0 0 -25Z", shade(BRASS, 0.2)) +
    circle(0, 0, 20, PAPER) +
    stroke("M0 -19V-15M0 15V19M-19 0H-15M15 0H19", "#9aa7b4", 1.6) +
    path("M0 -17L6 0H-6Z", P.coral) +
    path("M0 -17L6 0H0Z", shade(P.coral, 0.2)) +
    path("M0 17L6 0H-6Z", P.navy) +
    path("M0 17L-6 0H0Z", light(P.navy, 0.2)) +
    circle(0, 0, 2.6, BRASS),
  bell:
    stroke("M-6 -24Q0 -32 6 -24", P.woodDark, 3) +
    path("M-20 14Q-20 -22 0 -22Q20 -22 20 14Z", "#c98a3e") +
    path("M4 -21Q20 -18 20 14H8Q12 -6 4 -21Z", shade("#c98a3e", 0.2)) +
    path("M-14 8Q-15 -12 -5 -18Q-10 -6 -9 8Z", "#e8b46a", op(0.85)) +
    rrect(-26, 12, 52, 6, 3, shade("#c98a3e", 0.28)) +
    circle(0, 23, 5, SLATE),
  tower:
    drop(0, 29, 14, 2.5) +
    path("M-11 28L-5 -18H5L11 28H6L2 -12H-2L-6 28Z", SLATE) +
    stroke("M-8 16L5 4M-4 4L6 -6M-8 16H8M-5 4H5", STEEL, 1.5) +
    rect(-8, -22, 16, 4, STEEL) +
    stroke("M-14 -26L0 -30L14 -26", STEEL, 2) +
    circle(0, -34, 8, RED, op(0.25)) +
    circle(0, -34, 4, RED),
  lens:
    `<g transform="rotate(45 16 16)">${rrect(10, 12, 26, 8, 4, P.wood)}${rect(10, 16, 26, 4, P.woodDark, op(0.6))}</g>` +
    circle(-4, -4, 19, P.navy) +
    circle(-4, -4, 14, GLASS, op(0.95)) +
    path(
      "M-14 -8a11 11 0 0 1 9 -9",
      "none",
      `stroke="${P.white}" stroke-width="3" stroke-linecap="round" opacity=".85"`,
    ),
  book:
    drop(0, 24, 28, 3) +
    path("M-27 -16H0V22H-27Z", P.navy) +
    path("M27 -16H0V22H27Z", shade(P.navy, 0.15)) +
    path("M-24 -19Q-12 -21 0 -16V19Q-12 15 -24 17Z", PAPER) +
    path("M24 -19Q12 -21 0 -16V19Q12 15 24 17Z", shade(PAPER, 0.08)) +
    path("M-3 -16H3V19H-3Z", SH, op(0.08)) +
    rrect(-19, -10, 14, 2.4, 1.2, "#9aa7b4") +
    rrect(-19, -4, 14, 2.4, 1.2, "#9aa7b4") +
    rrect(-19, 2, 10, 2.4, 1.2, "#9aa7b4") +
    rrect(5, -10, 14, 2.4, 1.2, "#9aa7b4") +
    rrect(5, -4, 14, 2.4, 1.2, "#9aa7b4"),
  flask:
    drop(0, 28, 22, 3) +
    path(
      "M-8 -26H8V-8L24 22Q26 28 18 28H-18Q-26 28 -24 22L-8 -8Z",
      "#e2f1f4",
      op(0.92),
    ) +
    path("M-16 12H16L20 22Q21 26 17 26H-17Q-21 26 -20 22Z", P.teal) +
    ellipse(0, 12, 16, 2.6, P.tealLight) +
    circle(-4, 18, 2, P.white, op(0.7)) +
    circle(5, 20, 1.4, P.white, op(0.7)) +
    rrect(-10, -29, 20, 5, 2, "#c3cbd3") +
    stroke("M-4 -20V-8L-16 16", P.white, 2.4, op(0.8)),
  pencil:
    `<g transform="rotate(-45)">` +
    drop(4, 8, 30, 3, 0.14) +
    rect(-20, -6, 36, 12, P.yellow) +
    rect(-20, -6, 36, 4, "#f8db76") +
    rect(-20, 2, 36, 4, shade(P.yellow, 0.15)) +
    rect(16, -6, 6, 12, STEEL_L) +
    rrect(21, -6, 9, 12, 3, P.coralLight) +
    poly(
      [
        [-20, -6],
        [-32, 0],
        [-20, 6],
      ],
      "#f0d6b0",
    ) +
    poly(
      [
        [-27, -2.5],
        [-32, 0],
        [-27, 2.5],
      ],
      INK,
    ) +
    `</g>`,
  bubble:
    path(
      "M-24 -15H28Q32 -15 32 -11V11Q32 15 28 15H2L-10 27V15H-24Q-28 15 -28 11V-11Q-28 -15 -24 -15Z",
      SH,
      op(0.14),
    ) +
    path(
      "M-26 -18H26Q30 -18 30 -14V8Q30 12 26 12H0L-12 24V12H-26Q-30 12 -30 8V-14Q-30 -18 -26 -18Z",
      PAPER,
    ) +
    path(
      "M-30 2V8Q-30 12 -26 12H-12V24L0 12H26Q30 12 30 8V2Z",
      shade(PAPER, 0.07),
    ) +
    rrect(-18, -9, 34, 4, 2, P.navy) +
    rrect(-18, -1, 22, 4, 2, P.navy, op(0.55)),
  hammer:
    drop(0, 31, 14, 2.5) +
    rrect(-5, -8, 10, 38, 3, P.wood) +
    rect(1, -8, 4, 38, P.woodDark, op(0.6)) +
    rrect(-25, -25, 50, 18, 3, STEEL) +
    rect(-25, -25, 50, 5, STEEL_L) +
    rrect(-27, -24, 6, 16, 2, SLATE),
  anvil:
    drop(0, 25, 30, 4) +
    path("M-28 -6H24L30 -14H16L12 -22H-20V-6Z", "#4a5563") +
    path("M-20 -22H12L16 -14H30L28 -12H-20Z", STEEL) +
    path("M-14 -6H10L6 16H12V24H-16V16H-10Z", "#3e4754") +
    rect(0, -6, 10, 30, SH, op(0.2)),
  chest:
    drop(0, 25, 30, 4) +
    rrect(-26, -8, 52, 32, 3, P.woodDark) +
    rect(-26, -8, 52, 4, P.wood) +
    path("M-26 -8Q-26 -25 0 -25Q26 -25 26 -8Z", P.wood) +
    path("M10 -24Q26 -21 26 -8H14Q16 -18 10 -24Z", shade(P.wood, 0.15)) +
    rect(-18, -24, 5, 48, P.gold) +
    rect(13, -24, 5, 48, shade(P.gold, 0.15)) +
    rrect(-6, 0, 12, 12, 2, P.goldLight) +
    rect(-1.2, 4, 2.4, 5, INK),
  speaker:
    drop(0, 27, 18, 3) +
    rrect(-15, -25, 30, 50, 5, P.navy) +
    rrect(5, -25, 10, 50, 4, shade(P.navy, 0.25)) +
    circle(0, -10, 7, "#2a4a66") +
    circle(0, -10, 3.5, "#5d7a94") +
    circle(0, 10, 10, "#2a4a66") +
    circle(0, 10, 5.5, "#5d7a94") +
    circle(-1.5, 8.5, 2, "#8fa6ba"),
  radio:
    drop(0, 22, 28, 3) +
    stroke("M14 -14L22 -30", STEEL, 2.2) +
    rrect(-27, -15, 54, 36, 6, P.teal) +
    rrect(10, -15, 17, 36, 5, shade(P.teal, 0.2)) +
    rect(-27, -15, 54, 4, P.tealLight, op(0.6)) +
    circle(-10, 4, 10, "#0b5a54") +
    circle(-10, 4, 6, "#2f8f86") +
    rrect(5, -6, 16, 8, 2, PAPER) +
    stroke("M9 -6V-2M13 -6V-3M17 -6V-2", "#9aa7b4", 1.2) +
    circle(9, 11, 3, P.goldLight) +
    circle(18, 11, 3, P.goldLight),
  flag:
    drop(-6, 29, 10, 2) +
    rect(-10, -27, 4, 56, "#9aa7b4") +
    rect(-8, -27, 2, 56, STEEL) +
    circle(-8, -29, 3.4, P.gold) +
    path("M-6 -26H22L14 -14L22 -2H-6Z", RED) +
    path("M-6 -14H14L22 -2H-6Z", shade(RED, 0.18)),
};
export const GLYPHS = Object.keys(G);
export const glyphSVG = (name, x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${G[name] || G.star}</g>`;

// ── scene backgrounds ──────────────────────────────────────────────────────────────────────────────────────────
// Each theme: sky gradient stops, a far layer (drifts when motion is allowed), the floor, and a near layer. Strings
// are built once per theme with a "__U__" placeholder that each call swaps for its own id suffix.
const lines = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");
const glowDef = (u, color) =>
  `<radialGradient id="q-glow-${u}"><stop offset="0" stop-color="${color}" stop-opacity=".85"/><stop offset=".45" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const GLOW = "url(#q-glow-__U__)";
/** A building face for skylines: body, shade side, rows of window strips, roof cap. */
const tower = (x, top, w, base, col) =>
  rect(x, top, w, base - top, col) +
  rect(x + w * 0.72, top, w * 0.28, base - top, shade(col, 0.14)) +
  rect(x - 3, top - 6, w + 6, 7, shade(col, 0.22)) +
  lines(Math.floor((base - top - 24) / 36), (i) => rect(x + 7, top + 14 + i * 36, w - 14, 12, light(col, 0.32), op(0.8)));
/** A soft glow without a gradient: stacked ellipses fading toward the edge. */
const haloes = (x, y, rx, ry, col, o) => [1, 0.75, 0.5, 0.3].map((k) => ellipse(x, y, rx * k, ry * k, col, op((o / 4).toFixed(2)))).join("");
const blob = (x, y, r, col) => circle(x - r * 0.55, y + r * 0.25, r * 0.65, col) + circle(x + r * 0.5, y + r * 0.2, r * 0.7, col) + circle(x, y - r * 0.15, r * 0.85, col);
const bgTree = (x, y, r, col) => rect(x - 4, y, 8, r * 1.1, shade(col, 0.3)) + blob(x, y - r * 0.2, r, col);
const scallops = (y, r, n, col) => lines(n, (i) => circle((1000 / n) * (i + 0.5), y, r, col));
const STARS = [[80, 60], [190, 140], [330, 50], [450, 110], [610, 40], [660, 160], [820, 70], [930, 40], [900, 200], [110, 230], [260, 90], [530, 70], [720, 120], [380, 180], [40, 150], [980, 120]];
const starField = (n, col = "#fff7d6") => STARS.slice(0, n).map(([x, y], i) => circle(x, y, 1.2 + (i % 3) * 0.7, col, op(0.55 + (i % 4) * 0.12))).join("");

const THEMES = {
  lab: () => ({
    sky: ["#d5e5e2", "#eef1ea"],
    far:
      rect(0, 0, 1000, 34, "#c2d2ce") +
      lines(3, (i) => ellipse(195 + i * 310, 44, 130, 30, "#fffdf3", op(0.45)) + rrect(120 + i * 310, 12, 150, 14, 7, "#fffdf3")) +
      rect(0, 300, 1000, 100, "#c6dbd6") +
      rect(0, 296, 1000, 6, "#b3cbc5") +
      // shelf of glassware
      rect(206, 100, 160, 8, P.woodDark) +
      rect(206, 106, 160, 4, SH, op(0.15)) +
      rrect(222, 70, 16, 30, 4, P.tealLight, op(0.75)) +
      rrect(250, 78, 22, 22, 6, P.coralLight, op(0.75)) +
      rrect(284, 64, 12, 36, 4, GLASS2) +
      rrect(310, 74, 24, 26, 4, P.goldLight, op(0.85)) +
      rrect(342, 82, 14, 18, 4, P.tealLight, op(0.6)) +
      // the door on the right
      rect(820, 136, 132, 264, "#b3cbc5") +
      rect(830, 146, 112, 254, "#3f6f78") +
      rect(910, 146, 32, 254, shade("#3f6f78", 0.15)) +
      rrect(848, 170, 46, 64, 4, GLASS, op(0.85)) +
      rrect(920, 280, 6, 26, 3, STEEL_L),
    floor: rect(0, 400, 1000, 160, "#d9dedb") + stroke(lines(6, (i) => `M${i * 200 - 60} 560L${i * 180 + 40} 400`) + "M0 470H1000", "#c3c9c6", 1.5),
    near:
      rect(44, 404, 912, 10, SH, op(0.18)) +
      rect(44, 360, 912, 46, "#e9e4da") +
      rect(800, 360, 156, 46, shade("#e9e4da", 0.1)) +
      stroke(lines(5, (i) => `M${196 + i * 152} 364V402`), "#cfc7b8", 1.5) +
      lines(6, (i) => rrect(110 + i * 152, 372, 24, 5, 2.5, STEEL)) +
      rect(30, 346, 940, 15, "#3e4a5c") +
      rect(30, 346, 940, 4, SLATE),
  }),
  city: () => ({
    sky: ["#8ec5e0", "#cfe6ee", "#fbe9cf"],
    far:
      haloes(860, 110, 220, 160, P.goldLight, 0.45) +
      noDefs(() => cloud(230, 90, 0.9) + cloud(620, 60, 0.6)) +
      lines(9, (i) => rect(i * 118 - 20, 200 - ((i * 37) % 70), 90, 200, "#b4cad6")) +
      tower(60, 150, 90, 380, haze(P.navy, 0.45)) +
      tower(170, 110, 70, 380, haze(P.teal, 0.42)) +
      tower(430, 170, 100, 380, haze(P.brick, 0.5)) +
      tower(560, 140, 80, 380, haze(P.navy, 0.55)) +
      tower(800, 130, 100, 380, haze(P.teal, 0.48)) +
      tower(920, 180, 60, 380, haze(P.brick, 0.42)),
    floor: rect(0, 400, 1000, 160, "#cbc6bc"),
    near:
      rect(0, 370, 1000, 12, "#dcd7cc") +
      rect(0, 380, 1000, 40, P.road) +
      rect(0, 380, 1000, 4, "#4a5057") +
      `<path d="M0 400H1000" stroke="#f3dd8a" stroke-width="4" stroke-dasharray="26 22"/>` +
      rect(0, 420, 1000, 6, "#dcd7cc"),
  }),
  forge: () => ({
    sky: ["#2a1a12", "#4e2d18"],
    glow: "#f29a3a",
    far:
      stroke(lines(8, (r) => `M0 ${r * 48 + 60}H1000` + lines(11, (c) => `M${c * 100 - (r % 2) * 50} ${r * 48 + 60}v48`)), "#2a170d", 3, op(0.55)) +
      ellipse(500, 300, 470, 300, GLOW) +
      rect(0, 0, 1000, 62, "#1c1009") +
      rect(0, 56, 1000, 6, "#3a2414") +
      // shelves of word-part tiles
      lines(2, (s) =>
        lines(2, (k) => {
          const x0 = s ? 730 : 50;
          const y0 = 150 + k * 92;
          return rect(x0, y0, 220, 9, P.woodDark) + rect(x0, y0 + 9, 220, 5, SH, op(0.3)) + lines(5, (i) => rrect(x0 + 8 + i * 42, y0 - 30, 34, 30, 3, "#ecdcbd") + rect(x0 + 32 + i * 42, y0 - 30, 10, 30, "#c9b48c", op(0.7)) + rrect(x0 + 15 + i * 42, y0 - 18, 16, 4, 2, "#8a6a45"));
        }),
      ) +
      // hood and hearth
      poly([[360, 62], [640, 62], [602, 170], [398, 170]], "#3a2a20") +
      poly([[500, 62], [640, 62], [602, 170], [500, 170]], "#2c1f17") +
      path("M340 400V250Q340 160 500 160Q660 160 660 400Z", "#6b5a4e") +
      path("M500 160Q660 160 660 250V400H600V260Q600 200 500 200Z", "#574a40") +
      lines(6, (i) => rrect(352 + (i % 2) * 270, 210 + Math.floor(i / 2) * 60, 26, 22, 4, "#7d6b5e")) +
      path("M388 400V265Q388 205 500 205Q612 205 612 400Z", "#1a0f0a") +
      ellipse(500, 360, 150, 80, GLOW) +
      path("M410 400Q420 320 452 300Q446 350 470 360Q470 290 506 250Q508 320 540 330Q540 296 560 286Q590 340 590 400Z", P.coral) +
      path("M440 400Q450 350 470 336Q474 370 494 372Q496 316 516 296Q520 350 546 356Q560 380 560 400Z", P.orange) +
      path("M470 400Q478 370 494 362Q500 380 512 382Q518 350 528 340Q540 380 540 400Z", P.goldLight) +
      ellipse(500, 400, 100, 12, "#7a2a14"),
    floor: rect(0, 400, 1000, 160, "#3a2618"),
    near: rect(0, 420, 1000, 140, "#2b1a10") + ellipse(500, 432, 360, 40, "#e8823a", op(0.2)) + ellipse(500, 428, 220, 22, "#f2a65a", op(0.22)),
  }),
  newsroom: () => ({
    sky: ["#ebe3d5", "#f6f1e8"],
    far:
      ellipse(250, 90, 380, 160, "#fffaf0", op(0.4)) +
      // corkboard with three clippings
      rect(98, 90, 336, 206, SH, op(0.12)) +
      rect(92, 82, 336, 206, P.wood) +
      rect(100, 90, 320, 190, "#c8a778") +
      rect(360, 90, 60, 190, shade("#c8a778", 0.1)) +
      [[125, 115, -3], [225, 120, 2], [320, 112, -1]].map(([x, y, a]) => `<g transform="rotate(${a} ${x + 40} ${y + 30})">${rect(x + 3, y + 4, 80, 60, SH, op(0.15))}${rect(x, y, 80, 60, PAPER)}${rect(x + 8, y + 10, 64, 6, P.navy, op(0.75))}${rect(x + 8, y + 24, 64, 3, "#9aa7b4")}${rect(x + 8, y + 32, 64, 3, "#9aa7b4")}${rect(x + 8, y + 40, 44, 3, "#9aa7b4")}${circle(x + 40, y + 4, 4, P.coral)}</g>`).join("") +
      // clock
      circle(610, 92, 25, P.navy) +
      circle(610, 92, 20, PAPER) +
      stroke("M610 92V78M610 92L620 98", INK, 2.6) +
      // window with the closed bridge in the distance
      rect(772, 72, 176, 216, PAPER) +
      rect(780, 80, 160, 200, "#bfe0ee") +
      rect(780, 180, 160, 100, "#9cc9de") +
      path("M780 180Q830 150 880 170T940 160V180Z", haze(P.leaf, 0.45)) +
      rect(780, 206, 160, 74, P.water, op(0.7)) +
      rect(800, 160, 8, 46, SLATE) +
      rect(908, 160, 8, 46, SLATE) +
      stroke("M804 162Q858 196 912 162", SLATE, 2) +
      rect(780, 196, 160, 7, SLATE) +
      lines(5, (i) => rect(824 + i * 14, 188, 7, 6, i % 2 ? PAPER : P.coral)) +
      stroke("M860 80V280M780 180H940", PAPER, 5),
    floor: rect(0, 400, 1000, 160, "#cdb894") + stroke("M0 440H1000M0 490H1000", "#bba57d", 1.5),
    near:
      rect(40, 412, 920, 10, SH, op(0.16)) +
      rect(40, 386, 920, 28, P.woodDark) +
      rect(40, 372, 920, 15, P.wood) +
      rect(40, 372, 920, 4, P.woodLight),
  }),
  map: () => ({
    sky: ["#8f6140", "#6b452b"],
    far:
      rrect(48, 40, 920, 470, 18, SH, op(0.35)) +
      rrect(40, 30, 920, 470, 18, "#dcbf86") +
      rrect(52, 42, 896, 446, 14, "#f3e3b8") +
      ellipse(240, 160, 140, 90, "#ead59f", op(0.6)) +
      ellipse(760, 400, 160, 70, "#ead59f", op(0.6)) +
      stroke(lines(8, (i) => `M${130 + i * 110} 50V480`) + lines(4, (i) => `M60 ${120 + i * 100}H940`), "#c9a86a", 1, `opacity=".35" stroke-dasharray="6 8"`) +
      // the river, top to bottom
      path("M548 42C528 140 604 200 562 270C520 340 602 420 574 488H622C650 420 570 340 610 270C652 200 578 140 596 42Z", P.water, op(0.85)) +
      stroke("M572 70C560 140 600 200 584 250M590 300C566 360 610 420 596 470", P.waterLight, 3, op(0.8)) +
      // hills and the cave mound
      path("M150 140L190 90L230 140Z", "#c9a578") +
      path("M190 90L230 140H198Z", "#b08a5e") +
      path("M210 150L250 106L290 150Z", "#c9a578") +
      path("M250 106L290 150H258Z", "#b08a5e") +
      path("M796 150Q860 60 932 150Z", "#b9a48a") +
      path("M864 82Q932 120 932 150H880Z", "#a08b72") +
      path("M842 150Q864 112 886 150Z", "#4a3a2c"),
    floor: "",
    near: "",
  }),
  portal: () => ({
    sky: ["#1b2c4a", "#3d5a8a", "#c98a6a"],
    glow: "#ffcf8a",
    far:
      starField(10) +
      path("M0 330Q180 270 360 310T760 290T1000 300V420H0Z", "#2b3d58") +
      // the harbor seen through the arch
      path("M300 410V190Q300 100 500 100Q700 100 700 190V410Z", "#f0b98a") +
      ellipse(500, 250, 260, 230, GLOW) +
      circle(610, 230, 26, "#ffe1a6") +
      rect(300, 286, 400, 124, "#3f7fa6") +
      rect(300, 286, 400, 10, "#78a9c4") +
      path("M300 300Q360 222 440 252Q480 270 506 300Z", "#5c8a63") +
      rect(352, 236, 46, 30, P.wall) +
      poly([[346, 238], [374, 216], [384, 224], [358, 238]], P.coral) +
      stroke("M374 216L404 238M386 226V238M396 232V238", P.woodDark, 2) +
      path("M560 286L568 300H612L620 286Z", P.coral) +
      stroke("M590 286V250", P.woodDark, 2) +
      poly([[592, 252], [610, 280], [592, 280]], PAPER) +
      path("M630 290L636 302H668L674 290Z", P.teal) +
      stroke("M652 290V262", P.woodDark, 2) +
      lines(7, (i) => (i === 3 ? "" : rect(300 + i * 58, 306, 54, 18, i % 2 ? "#8a8f98" : "#9aa0a8"))) +
      poly([[478, 324], [500, 312], [532, 324]], "#8a8f98") +
      // stone arch with a warm glowing rim
      path("M230 410V180Q230 30 500 30Q770 30 770 180V410H700V190Q700 100 500 100Q300 100 300 190V410Z", "#8a8f98") +
      path("M500 30Q770 30 770 180V410H700V190Q700 100 500 100Z", "#767b85") +
      stroke("M232 150L298 166M262 72L318 118M400 34L420 102M600 34L580 102M738 72L682 118M768 150L702 166M230 270H300M700 270H770", "#6a6f78", 3) +
      stroke("M302 410V190Q302 102 500 102Q698 102 698 190V410", "#ffd99a", 8, op(0.45)) +
      // the bell's wooden frame
      rect(436, 214, 10, 196, P.woodDark) +
      rect(554, 214, 10, 196, shade(P.woodDark, 0.15)) +
      rect(424, 206, 152, 12, P.wood) +
      rect(424, 214, 152, 4, P.woodDark),
    floor: rect(0, 400, 1000, 160, "#5a4c42"),
    near: rect(0, 410, 1000, 150, "#4b4038") + lines(9, (i) => ellipse(60 + i * 110, 450 + (i % 3) * 30, 34, 9, "#574a41")),
  }),
  forum: () => ({
    sky: ["#ece3d6", "#f5efe6"],
    far:
      ellipse(500, 60, 420, 140, "#fffaf0", op(0.45)) +
      rect(0, 250, 1000, 150, "#a0724e") +
      rect(0, 250, 1000, 8, "#b98457") +
      lines(6, (i) => rect(40 + i * 160, 274, 120, 104, shade("#a0724e", 0.08))) +
      rect(52, 30, 36, 370, "#d9c8b0") +
      rect(76, 30, 12, 370, shade("#d9c8b0", 0.12)) +
      rect(912, 30, 36, 370, "#d9c8b0") +
      rect(936, 30, 12, 370, shade("#d9c8b0", 0.12)) +
      // a garden drawing and a sports-court drawing
      rect(126, 76, 166, 124, P.woodDark) +
      rect(134, 84, 150, 108, "#e9f2e4") +
      rect(134, 150, 150, 42, P.grassLight) +
      bgTree(176, 136, 22, P.leaf) +
      lines(5, (i) => circle(214 + i * 14, 168 + (i % 2) * 8, 4, [P.coral, P.gold, P.pink][i % 3])) +
      rect(708, 76, 166, 124, P.woodDark) +
      rect(716, 84, 150, 108, "#e9f2e4") +
      rect(728, 96, 126, 84, "#d9733f") +
      stroke("M791 96V180M728 138H854", PAPER, 2.5) +
      circle(791, 138, 14, "none", `stroke="${PAPER}" stroke-width="2.5"`),
    floor: rect(0, 400, 1000, 160, "#8c6444"),
    near:
      path("M120 368Q500 308 880 368V420H120Z", SH, op(0.2)) +
      path("M120 360Q500 300 880 360V420H120Z", P.woodDark) +
      path("M120 360Q500 300 880 360V372Q500 312 120 372Z", P.wood) +
      [360, 500, 640].map((x) => poly([[x - 26, 336 + Math.abs(x - 500) * 0.05], [x + 26, 336 + Math.abs(x - 500) * 0.05], [x + 22, 318 + Math.abs(x - 500) * 0.05], [x - 22, 318 + Math.abs(x - 500) * 0.05]], PAPER)).join("") +
      poly([[466, 548], [534, 548], [544, 462], [456, 462]], P.wood) +
      poly([[500, 548], [534, 548], [544, 462], [500, 462]], P.woodDark) +
      rrect(446, 452, 108, 14, 3, P.woodLight),
  }),
  studio: () => ({
    sky: ["#1a2238", "#2b3550"],
    far:
      path("M420 40H580L790 470H210Z", P.ivory, op(0.1)) +
      path("M450 40H550L690 470H310Z", P.ivory, op(0.08)) +
      path("M0 0H210Q190 220 30 300H0Z", "#b5402f") +
      path("M1000 0H790Q810 220 970 300H1000Z", "#b5402f") +
      lines(4, (i) => path(`M${30 + i * 44} 0Q${24 + i * 40} 150 ${10 + i * 24} 280L${26 + i * 24} 278Q${46 + i * 40} 150 ${52 + i * 44} 0Z`, i % 2 ? "#8f2f22" : "#d0604a", op(0.75))) +
      lines(4, (i) => path(`M${970 - i * 44} 0Q${976 - i * 40} 150 ${990 - i * 24} 280L${974 - i * 24} 278Q${954 - i * 40} 150 ${948 - i * 44} 0Z`, i % 2 ? "#8f2f22" : "#d0604a", op(0.75))) +
      rect(0, 0, 1000, 36, "#9c3526") +
      scallops(36, 22, 18, "#9c3526") +
      rect(0, 30, 1000, 5, P.gold),
    floor: rect(0, 400, 1000, 160, "#a8754a") + stroke("M0 430H1000M0 470H1000M0 512H1000", "#8f6140", 1.5, op(0.7)) + ellipse(500, 440, 300, 40, P.ivory, op(0.12)),
    near: rect(0, 520, 1000, 40, "#5a3b26") + rect(0, 520, 1000, 4, "#7a5236") + lines(8, (i) => ellipse(66 + i * 124, 520, 30, 8, P.goldLight, op(0.35)) + ellipse(66 + i * 124, 522, 12, 4, P.goldLight)),
  }),
  nexus: () => ({
    sky: ["#17304f", "#3d5a8a", "#e9a87a", "#f6c890"],
    far:
      starField(6) +
      haloes(250, 300, 260, 130, "#ffd39a", 0.5) +
      circle(250, 300, 48, "#ffe0a8") +
      path("M0 300Q200 250 420 285T1000 270V420H0Z", "#3d5876") +
      // radio tower behind a small building
      path("M816 330L832 70H848L864 330H852L842 110H838L828 330Z", SLATE) +
      stroke("M822 300L852 260M828 260L854 220M832 220L852 180M834 180L850 140M822 300H858M828 260H854M832 220H852M834 180H850", STEEL, 2) +
      circle(840, 60, 16, RED, op(0.25)) +
      circle(840, 60, 7, RED) +
      path("M0 330Q250 250 500 320T1000 300V420H0Z", "#2f5d46") +
      path("M0 330Q250 250 500 320T1000 300V312Q750 330 500 332Q250 262 0 342Z", "#4f8f5b", op(0.55)) +
      rect(782, 276, 120, 60, PAPER) +
      rect(862, 276, 40, 60, shade(PAPER, 0.12)) +
      poly([[774, 278], [842, 250], [910, 278]], P.navy) +
      rect(800, 296, 22, 18, P.goldLight) +
      rect(840, 300, 18, 36, P.teal),
    floor: rect(0, 400, 1000, 160, "#2f5d46"),
    near:
      ellipse(500, 452, 210, 14, SH, op(0.3)) +
      rect(330, 410, 12, 40, P.woodDark) +
      rect(658, 410, 12, 40, P.woodDark) +
      rect(300, 396, 400, 16, P.wood) +
      rect(300, 396, 400, 4, P.woodLight),
  }),
  forest: () => ({
    sky: ["#cfe6e6", "#eef3e2"],
    far:
      path("M0 300Q200 230 420 280T1000 260V420H0Z", haze(P.grass, 0.6)) +
      [[80, 250, 60], [210, 270, 46], [330, 262, 54], [690, 258, 50], [820, 246, 62], [950, 268, 44]].map(([x, y, r]) => bgTree(x, y, r, haze(P.leaf, 0.5))).join("") +
      path("M0 340Q260 290 520 330T1000 310V420H0Z", haze(P.grass, 0.3)),
    floor: rect(0, 400, 1000, 160, P.grass) + rect(0, 400, 1000, 30, P.grassLight, op(0.6)),
    near: stroke("M60 540l-4 -16M66 540l4 -20M72 540l8 -14M920 530l-4 -16M926 530l4 -20M932 530l8 -14M450 550l-4 -14M456 550l4 -18", P.grassDark, 2.4) + lines(4, (i) => circle(120 + i * 250, 500 + (i % 2) * 20, 5, [P.coral, P.gold, PAPER, P.coralLight][i])),
  }),
  beach: () => ({
    sky: ["#a9d8ec", "#d9eef4", "#fbeccb"],
    far:
      haloes(840, 100, 230, 160, P.goldLight, 0.45) +
      path("M120 262Q190 222 260 240Q310 230 360 262Z", haze(P.leaf, 0.55)) +
      rect(0, 260, 1000, 140, P.water) +
      rect(0, 260, 1000, 16, P.waterLight) +
      rect(0, 330, 1000, 70, P.waterDark, op(0.35)) +
      stroke("M120 300h40M300 320h60M520 296h36M700 340h50M860 310h40", P.white, 2.4, op(0.7)) +
      stroke("M360 140q8 -8 16 0q8 -8 16 0M420 110q6 -6 12 0q6 -6 12 0", P.navy, 2, op(0.6)),
    floor: rect(0, 400, 1000, 160, "#ecd9a8") + rect(0, 400, 1000, 22, "#d9c08a") + path("M0 400Q60 412 120 400T240 400T360 400T480 400T600 400T720 400T840 400T960 400T1080 400V396H0Z", P.white, op(0.8)),
    near: lines(3, (i) => ellipse(180 + i * 300, 500 + (i % 2) * 24, 9, 6, [P.coralLight, PAPER, P.goldLight][i])),
  }),
  space: () => ({
    sky: ["#0c1d36", "#1d3360"],
    far:
      starField(16) +
      haloes(400, 160, 280, 80, "#3d5a8a", 0.45) +
      circle(160, 120, 22, "#c9c3b8") +
      circle(168, 114, 20, "#e6e0d4") +
      path("M680 260A140 26 0 0 1 960 260", "none", `stroke="#f3cd6f" stroke-width="5" opacity=".45"`) +
      circle(820, 250, 90, "#d28b58") +
      path("M820 160A90 90 0 0 1 820 340A62 90 0 0 0 820 160Z", shade("#d28b58", 0.25)) +
      path("M736 220Q820 200 904 224V236Q820 214 736 232Z", "#e6a77a", op(0.7)) +
      circle(780, 230, 14, "#b9774a") +
      path("M680 260A140 26 0 0 0 960 260", "none", `stroke="#f3cd6f" stroke-width="5" opacity=".7"`),
    floor: rect(0, 400, 1000, 160, "#2b3b62") + rect(0, 400, 1000, 10, "#3a4d78") + ellipse(200, 470, 70, 14, "#22314f") + ellipse(760, 500, 90, 16, "#22314f") + ellipse(480, 440, 40, 8, "#22314f"),
    near: ellipse(90, 540, 60, 22, "#33467a") + ellipse(940, 548, 70, 24, "#33467a"),
  }),
};
const BUILT = {};
function built(theme) {
  if (!BUILT[theme]) {
    const t = (THEMES[theme] || THEMES.lab)();
    const stops = t.sky.map((c, i) => `<stop offset="${(i / (t.sky.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join("");
    BUILT[theme] = {
      defs: `<linearGradient id="q-sky-__U__" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>${t.glow ? glowDef("__U__", t.glow) : ""}`,
      far: t.far,
      floor: t.floor,
      near: t.near,
    };
  }
  return BUILT[theme];
}
/** Far and near layers carry `data-depth` so quest.css can drift them apart a few pixels when motion is allowed. */
function backdrop(theme, uid) {
  const b = built(THEMES[theme] ? theme : "lab");
  const u = (s) => s.replaceAll("__U__", uid);
  return `<defs>${u(b.defs)}</defs>
  <rect width="1000" height="560" fill="url(#q-sky-${uid})"/>
  <g data-depth="far">${u(b.far)}</g>
  ${b.floor ? `<g data-depth="floor">${b.floor}</g>` : ""}
  <g data-depth="near">${b.near}</g>`;
}
const DECO = {
  lab: [["window", 140, 170, 1.7], ["case", 300, 330, 2], ["flask", 520, 320, 2], ["fan", 740, 340, 1.8], ["note", 880, 250, 1.1]],
  city: [["house", 150, 340, 2.2], ["factory", 440, 330, 2.2], ["tree", 690, 360, 2], ["sun", 860, 110, 2]],
  forge: [["anvil", 500, 430, 3.2], ["hammer", 720, 400, 2.2], ["gears", 240, 380, 2.2], ["key", 860, 260, 1.4]],
  newsroom: [["board", 290, 230, 2.1], ["pencil", 700, 380, 2.2], ["book", 520, 390, 1.9], ["bubble", 840, 200, 1.6]],
  map: [["house", 140, 440, 1.8], ["tree", 300, 260, 1.8], ["flag", 300, 380, 1.6], ["bridge", 570, 260, 2], ["gears", 780, 170, 1.6], ["star", 860, 80, 1.5]],
  portal: [["bell", 500, 300, 2.6], ["house", 240, 420, 1.9], ["chest", 760, 430, 1.9]],
  forum: [["bubble", 290, 300, 2.2], ["board", 710, 300, 2.2], ["flag", 500, 240, 1.7]],
  studio: [["chest", 150, 440, 1.9], ["book", 290, 410, 2.3], ["bubble", 640, 250, 2.2], ["star", 820, 390, 1.7], ["pencil", 500, 430, 2.2]],
  nexus: [["radio", 420, 410, 2.3], ["speaker", 250, 380, 2.1], ["compass", 620, 400, 1.9]],
  forest: [["tree", 150, 360, 2.4], ["fox", 480, 400, 2.2], ["tree", 860, 350, 2.2]],
  beach: [["sun", 840, 100, 2.4], ["bridge", 300, 340, 1.8]],
  space: [["star", 220, 150, 1.6], ["robot", 500, 380, 2.2]],
};
const deco = (theme) => (DECO[theme] || []).map(([g, x, y, k]) => glyphSVG(g, x, y, k)).join("");
let uidN = 0;
const nextUid = () => `s${++uidN}`;

/** The scene, with object glyphs drawn in it. `marks` = { objectId: "yes" | "no" } puts a check or a cross by finished ones. */
export function sceneSVG(theme, { objects = [], marks = {}, alt = "", extra = "" } = {}) {
  const uid = nextUid();
  const pins = objects
    .filter((o) => o.glyph)
    .map((o) => {
      const mark = marks[o.id];
      return `<g class="q-obj ${mark ? `is-${mark}` : ""}" data-obj="${esc(o.id)}">${glyphSVG(o.glyph, o.x, o.y, 1.5)}<text x="${o.x}" y="${o.y + 62}" text-anchor="middle" class="q-obj-label">${esc(o.label)}</text>${mark ? `<g transform="translate(${o.x + 30} ${o.y - 34})"><circle r="15" fill="${SH}" opacity=".18" cy="2"/><circle r="13" fill="${mark === "yes" ? "#17694a" : "#59637f"}"/>${mark === "yes" ? '<path d="M-6 0l4 5 8-10" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M-6 0h12" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'}</g>` : ""}</g>`;
    })
    .join("");
  return `<svg class="q-scene q-theme-${theme}" viewBox="0 0 1000 560" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">${backdrop(theme, uid)}${objects.length ? "" : `<g class="q-deco">${deco(theme)}</g>`}${pins}${extra}</svg>`;
}

// ── characters ───────────────────────────────────────────────────────────────────────────────────────────────────
// The same face family as the kit's person(): round head with a shade side, dot eyes, warm cheeks, simple mouth.
const MOUTH = { happy: "M-8 11Q0 19 8 11", think: "M-6 14H6", cheer: "M-9 9Q0 25 9 9Z", ask: "M-5 14Q0 10 5 14" };
const BROWS = { happy: ["M-14 -8Q-9 -12 -4 -8", "M4 -8Q9 -12 14 -8"], think: ["M-14 -10L-4 -7", "M4 -7L14 -10"], cheer: ["M-14 -11Q-9 -15 -4 -11", "M4 -11Q9 -15 14 -11"], ask: ["M-14 -8Q-9 -13 -4 -9", "M4 -9Q9 -13 14 -8"] };
const HAIRDO = { investigator: "bun", storyteller: "long", scientist: "short", editor: "curly", guide: "puffs", architect: "short" };
const HAIR_STYLES = ["short", "long", "bun", "curly", "puffs"];
function hairOf(ch, hair) {
  const style = HAIRDO[ch.id] || HAIR_STYLES[[...String(ch.id || ch.name || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % HAIR_STYLES.length];
  const hi = `<path d="M-13 -30Q-2 -38 9 -33" fill="none" stroke="${light(hair, 0.45)}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  const back = {
    long: path("M-27 -12Q-32 22 -18 34H18Q32 22 27 -12Z", hair),
    bun: circle(0, -40, 11, hair) + circle(-3, -43, 4, light(hair, 0.3), op(0.5)),
    puffs: circle(-26, -26, 13, hair) + circle(26, -26, 13, hair),
  }[style] || "";
  const cap = {
    short: path("M-26 -6Q-28 -38 0 -38Q28 -38 26 -6Q22 -24 6 -24Q-14 -26 -26 -6Z", hair),
    long: path("M-27 4Q-30 -40 0 -40Q30 -40 27 4Q22 -22 4 -26Q-6 -18 -20 -20Q-24 -10 -27 4Z", hair),
    bun: path("M-26 -8Q-27 -36 0 -36Q27 -36 26 -8Q16 -26 0 -26Q-16 -26 -26 -8Z", hair),
    curly: [[-19, -22], [-8, -32], [6, -32], [18, -24], [-25, -10], [25, -10]].map(([x, y]) => circle(x, y, 10.5, hair)).join(""),
    puffs: path("M-25 -8Q-26 -36 0 -36Q26 -36 25 -8Q14 -24 0 -24Q-14 -24 -25 -8Z", hair),
  }[style];
  return { back, cap: cap + (style === "curly" ? "" : hi) };
}
/** An original instructional character: a face, a coat in the role colour and the prop that names the role. */
export function portraitSVG(ch, mood = "happy", { w = 96, label = "" } = {}) {
  const m = MOUTH[mood] ? mood : "happy";
  const l = ch.look;
  const skinS = shade(l.skin, 0.18);
  const h = hairOf(ch, l.hair);
  const mouth =
    m === "cheer"
      ? `<path d="${MOUTH.cheer}" fill="#7a2f2a"/><path d="M-5 14Q0 18 5 14Q0 12 -5 14Z" fill="${P.coralLight}"/>`
      : m === "ask"
        ? `<ellipse cx="0" cy="13" rx="3.4" ry="4" fill="#7a2f2a"/>`
        : `<path d="${MOUTH[m]}" stroke="${shade(l.skin, 0.55)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return `<svg class="q-portrait q-mood-${m}" viewBox="-40 -52 80 110" width="${w}" height="${Math.round(w * 1.375)}" role="img" aria-label="${esc(label || `${ch.name}, ${ch.role.en}`)}">
  ${h.back}<path d="M-31 58Q-31 24 0 21Q31 24 31 58Z" fill="${l.coat}"/><path d="M6 21.6Q31 24 31 58H12Q14 34 6 21.6Z" fill="${shade(l.coat, 0.18)}" opacity=".8"/>
  <rect x="-6" y="8" width="12" height="16" fill="${skinS}"/><path d="M-10 22L0 35L10 22Z" fill="${l.accent || PAPER}"/>
  <circle cx="-24" cy="-6" r="4.5" fill="${skinS}"/><circle cx="24" cy="-6" r="4.5" fill="${skinS}"/>
  <circle cx="0" cy="-8" r="25" fill="${l.skin}"/><path d="M3 -33A25 25 0 0 1 3 17A18 25 0 0 0 3 -33Z" fill="${skinS}" opacity=".45"/>
  ${h.cap}
  <circle cx="-9" cy="-4" r="2.9" fill="${INK}" class="q-eye"/><circle cx="9" cy="-4" r="2.9" fill="${INK}" class="q-eye"/>
  <ellipse cx="-14" cy="4" rx="4.4" ry="2.6" fill="${P.coralLight}" opacity=".45"/><ellipse cx="14" cy="4" rx="4.4" ry="2.6" fill="${P.coralLight}" opacity=".45"/>
  <path d="${BROWS[m][0]}${BROWS[m][1] ? ` ${BROWS[m][1]}` : ""}" stroke="${shade(l.hair, 0.1)}" stroke-width="2.2" fill="none" stroke-linecap="round" transform="translate(0 -4)"/>
  ${mouth}
  <circle cx="26" cy="38" r="18" fill="${SH}" opacity=".18"/><circle cx="26" cy="36" r="18" fill="${PAPER}"/><g transform="translate(26 36) scale(.5)">${G[ch.prop] || ""}</g></svg>`;
}

// ── Science City model ───────────────────────────────────────────────────────────────────────────────────────────
const FACADES = [P.wall, "#e3d2bb", "#d7dfe2", "#e9d9c6"];
/** The fictional city, drawn from the picked projects: more trees, white roofs, a park, a wider road, AC boxes. */
export function citySVG(picked = [], metrics = null, alt = "") {
  const uid = nextUid();
  const has = (id) => picked.includes(id);
  const roofs = [0, 1, 2, 3]
    .map((i) => {
      const x = 130 + i * 190;
      const y = 250 + (i % 2) * 20;
      const f = FACADES[i];
      const roof = has("roofs") ? "#fbfbf8" : "#33404f";
      return (
        drop(x + 65, y + 110, 78, 6, 0.2) +
        rect(x, y, 130, 110, f) +
        rect(x + 96, y, 34, 110, shade(f, 0.12)) +
        lines(3, (r) => rect(x + 14, y + 16 + r * 30, 102, 12, GLASS2, op(0.85)) + rect(x + 14, y + 16 + r * 30, 34, 12, GLASS)) +
        rect(x - 4, y - 10, 138, 16, roof) +
        rect(x - 4, y - 10, 138, 4, has("roofs") ? P.white : "#4a5869") +
        rect(x + 100, y - 10, 34, 16, shade(roof, 0.12))
      );
    })
    .join("");
  const trees = has("trees") ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<g class="q-grow" style="--d:${i * 70}ms">${glyphSVG("tree", 90 + i * 115, 410, 1)}</g>`).join("") : [0, 1].map((i) => glyphSVG("tree", 120 + i * 700, 410, 0.7)).join("");
  const park = has("park")
    ? `${rrect(420, 400, 190, 90, 14, P.grass)}${rrect(420, 400, 190, 14, 10, P.grassLight)}${path("M440 490Q500 440 590 410", "none", `stroke="#ead9b4" stroke-width="10" stroke-linecap="round"`)}${glyphSVG("tree", 460, 440, 0.8)}${glyphSVG("tree", 570, 440, 0.8)}`
    : `${rect(420, 400, 190, 90, P.road)}${stroke("M454 410V480M488 410V480M522 410V480M556 410V480M590 410V480", PAPER, 2.5, op(0.8))}${rrect(462, 436, 22, 34, 6, P.coral)}${rrect(465, 444, 16, 10, 3, GLASS2)}${rrect(530, 430, 22, 34, 6, P.teal)}${rrect(533, 438, 16, 10, 3, GLASS2)}`;
  const road = `${rect(0, has("roads") ? 488 : 500, 1000, has("roads") ? 72 : 60, "#3a4250")}${rect(0, has("roads") ? 488 : 500, 1000, 4, "#566070")}`;
  const ac = has("ac") ? [0, 1, 2].map((i) => `${rect(170 + i * 190, 222 + (i % 2) * 20, 26, 16, STEEL_L)}${rect(186 + i * 190, 222 + (i % 2) * 20, 10, 16, STEEL)}${circle(180 + i * 190, 230 + (i % 2) * 20, 5, SLATE)}`).join("") : "";
  const t = metrics?.temp;
  const wash = t == null ? "" : `<rect width="1000" height="560" fill="${t >= 95 ? "#d28b58" : t >= 92 ? "#f2c15b" : "#91e2d6"}" opacity="${Math.min(0.28, Math.abs(t - 91) * 0.035 + 0.06)}"/>`;
  const level = t == null ? 0 : Math.max(8, Math.min(108, (t - 80) * 6));
  const therm = t == null ? "" : `<g transform="translate(930 40)"><rect x="-17" y="-3" width="34" height="126" rx="17" fill="${P.navy}"/><rect x="-12" y="2" width="24" height="116" rx="12" fill="${PAPER}"/><rect x="-7" y="${120 - level}" width="14" height="${level}" rx="7" fill="${t >= 95 ? "#b0261c" : t >= 92 ? "#d28b58" : "#15969a"}"/><text y="146" text-anchor="middle" font-size="22" font-weight="700" fill="${INK}" stroke="${PAPER}" stroke-width="5" paint-order="stroke">${t}°F</text></g>`;
  return `<svg class="q-scene q-theme-city" viewBox="0 0 1000 560" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">${backdrop("city", uid)}${roofs}${ac}${park}${trees}${road}${wash}${therm}</svg>`;
}

// ── Story stage (Build the Perfect Story) ────────────────────────────────────────────────────────────────────────
/** A stage the learner's sentences act out. `shown` lists revealed slot reveals; `say` is the learner's own dialogue. */
export function storyStageSVG(pick, shown = [], say = "", alt = "", animate = false) {
  const uid = nextUid();
  const setting = pick.setting?.id === "beach" ? "beach" : pick.setting?.id === "space" ? "space" : "forest";
  const has = (k) => shown.includes(k);
  const cx = has("attempt") ? 620 : has("approach") ? 520 : has("enter") ? 300 : -120;
  const char = pick.character ? `<g class="q-actor" style="transform:translate(${cx}px,380px)"><g class="q-actor-in">${glyphSVG(pick.character.glyph, 0, 0, 2.2)}</g></g>` : "";
  const prob = pick.problem && has("problem") ? `<g class="q-prop ${has("resolve") ? "is-solved" : "is-problem"}">${glyphSVG(pick.problem.glyph, 760, 300, 2.2)}</g>` : "";
  const star = has("resolve") ? `<g class="q-pop">${glyphSVG("star", 760, 220, 1.5)}</g>` : "";
  const bubble = has("speak") && say ? `<g><rect x="256" y="96" width="500" height="92" rx="16" fill="${SH}" opacity=".16"/><path d="M330 176L318 214L370 178Z" fill="${PAPER}"/><rect x="250" y="90" width="500" height="92" rx="16" fill="${PAPER}"/><foreignObject x="266" y="98" width="468" height="78"><div xmlns="http://www.w3.org/1999/xhtml" class="q-bubble-text">${esc(say.replace(/^["“]|["”]$/g, ""))}</div></foreignObject></g>` : "";
  return `<svg class="q-scene q-theme-${setting}${animate ? " q-anim" : ""}" viewBox="0 0 1000 560" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">${backdrop(setting, uid)}${setting === "forest" ? [0, 1, 2].map((i) => glyphSVG("tree", 90 + i * 380, 360, 1.6)).join("") : ""}${prob}${char}${star}${bubble}</svg>`;
}

// ── Explorers' route grid ────────────────────────────────────────────────────────────────────────────────────────
/** Draws the grid, the planned or walked path and where the walker stopped. */
export function routeSVG(grid, path = [], stop = null, { animate = false, alt = "" } = {}) {
  const cell = 120;
  const W = grid.w * cell;
  const H = grid.h * cell;
  const blocked = new Set((grid.blocked || []).map((b) => b.join(",")));
  const tiles = [];
  for (let y = 0; y < grid.h; y++)
    for (let x = 0; x < grid.w; x++) {
      const k = `${x},${y}`;
      const isBlocked = blocked.has(k);
      const lm = grid.landmarks?.[k];
      const gx = x * cell;
      const gy = y * cell;
      tiles.push(`<rect x="${gx}" y="${gy}" width="${cell}" height="${cell}" fill="${isBlocked ? "#8fc4dc" : (x + y) % 2 ? "#f1dfae" : "#f4e5bb"}" stroke="#c9a86a" stroke-width="1.5"/>`);
      if (isBlocked) tiles.push(`<rect x="${gx}" y="${gy + cell * 0.55}" width="${cell}" height="${cell * 0.45}" fill="${P.water}" opacity=".35"/><path d="M${gx + 12} ${gy + 40}q16 -14 32 0t32 0t32 0M${gx + 12} ${gy + 74}q16 -14 32 0t32 0t32 0" fill="none" stroke="${P.waterDark}" stroke-width="3.5" stroke-linecap="round"/><path d="M${gx + 20} ${gy + 34}q8 -6 16 0" fill="none" stroke="${P.white}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`);
      if (lm) {
        const g = { camp: "house", "oak tree": "tree", "red flag": "flag", bridge: "bridge", windmill: "gears", cave: "star" }[lm] || "star";
        tiles.push(glyphSVG(g, gx + cell / 2, gy + cell / 2 - 6, 1.1) + `<text x="${gx + cell / 2}" y="${gy + cell - 8}" text-anchor="middle" class="q-grid-label">${esc(lm)}</text>`);
      }
    }
  const pts = path.map(([x, y]) => `${x * cell + cell / 2},${y * cell + cell / 2}`);
  const line = pts.length > 1 ? `<polyline points="${pts.join(" ")}" fill="none" stroke="${P.coral}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 14"/>` : "";
  const last = path.at(-1) || grid.start;
  const walker = `<g class="q-walker">${animate && pts.length > 1 ? `<animateMotion dur="${Math.max(1, pts.length * 0.45)}s" fill="freeze" path="M${pts.join(" L")}"/>` : ""}<circle r="24" fill="${SH}" opacity=".2" ${animate ? 'cy="3"' : `cx="${last[0] * cell + cell / 2}" cy="${last[1] * cell + cell / 2 + 3}"`}/><circle r="22" fill="${P.navy}" stroke="${PAPER}" stroke-width="4" ${animate ? "" : `cx="${last[0] * cell + cell / 2}" cy="${last[1] * cell + cell / 2}"`}/><text ${animate ? "" : `x="${last[0] * cell + cell / 2}" y="${last[1] * cell + cell / 2 + 7}"`} text-anchor="middle" fill="#fff" font-size="20" font-weight="700" ${animate ? 'y="7"' : ""}>K</text></g>`;
  const halt = stop ? `<g transform="translate(${stop[0] * cell + cell / 2} ${stop[1] * cell + cell / 2})"><circle r="30" fill="${P.coral}" opacity=".15"/><circle r="28" fill="none" stroke="${P.coral}" stroke-width="6" stroke-dasharray="6 6"/></g>` : "";
  return `<svg class="q-route" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}">${tiles.join("")}${line}${halt}${walker}</svg>`;
}

// ── bar chart (with a real table alternative) ───────────────────────────────────────────────────────────────────
export function chartHTML(chart) {
  const rows = chart.rows;
  const max = Math.max(...rows.map((r) => r.value));
  const min = chart.min ?? 0;
  const bar = (r, i) => {
    const pct = Math.max(4, ((r.value - min) / (max - min || 1)) * 100);
    return `<g transform="translate(0 ${i * 52})"><text x="0" y="20" class="q-bar-label">${esc(r.label)}</text><rect x="260" y="4" width="520" height="28" rx="6" fill="#ece5d8"/><rect x="260" y="4" width="${pct * 5.2}" height="28" rx="6" fill="${P.navy}"/><text x="${260 + pct * 5.2 + 10}" y="25" class="q-bar-val">${r.value}${esc(chart.unit || "")}</text></g>`;
  };
  return `<figure class="q-chart"><figcaption>${esc(chart.title)}</figcaption><svg viewBox="0 0 880 ${rows.length * 52 + 10}" role="img" aria-label="${esc(`${chart.title}. ${rows.map((r) => `${r.label}: ${r.value}${chart.unit || ""}`).join("; ")}.`)}">${rows.map(bar).join("")}</svg><table class="visually-hidden"><caption>${esc(chart.title)}</caption><tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${r.value}${esc(chart.unit || "")}</td></tr>`).join("")}</tbody></table></figure>`;
}

/** A small world badge for cards: the world's theme scene, cropped. */
export const thumbSVG = (theme, alt = "") => sceneSVG(theme, { alt }).replace('class="q-scene', 'class="q-scene q-thumb');
