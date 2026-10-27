// Drawings for Math Puzzle Studio: the balance-scale beam and stand, number bonds, magic triangles, grid and cage
// frames, squares for area balances, and the little shapes that stand for unknown weights. Every picture is computed
// from the numbers it is given (a tilt, a grid size, a list of cages), so a drawing can never disagree with the puzzle.
// Interactive spots are real buttons laid over these pictures by the game; the pictures carry no information alone.
// @fm2 FM-036 FM-059
import { escapeHtml } from "../lang.js";
import { circle, label, line, PALETTE, rect } from "./base.js";

const rad = (deg) => (deg * Math.PI) / 180;

// A picture: decorative (hidden from assistive technology) unless it is given a name.
const picture = (width, height, body, cls, name = "") =>
  `<svg class="fm2-art ${cls}" viewBox="0 0 ${width} ${height}" ${name ? `role="img" aria-label="${escapeHtml(name)}"` : 'aria-hidden="true"'} focusable="false">${body}</svg>`;

// ---- balance scale -----------------------------------------------------------------------------------------------
// A 600 x 170 picture. The beam turns about its pivot by `tilt` degrees (positive: the left pan is heavier and its
// end goes down). The pans themselves are drawn by the page, hung from the two string points this returns.
export const SCALE = { width: 600, height: 170, pivotX: 300, pivotY: 58, half: 150, rim: 120 };

export function scaleGeometry(tilt) {
  const t = rad(tilt);
  const dx = SCALE.half * Math.cos(t);
  const dy = SCALE.half * Math.sin(t);
  return {
    dx,
    dy,
    left: [SCALE.pivotX - dx, SCALE.pivotY + dy],
    right: [SCALE.pivotX + dx, SCALE.pivotY - dy],
  };
}

// How far (in 1/600ths of the picture's width) the left pan hangs below its level position; the right pan is the opposite.
export const panDrop = (tilt) => Math.round(SCALE.half * Math.sin(rad(tilt)) * 1000) / 1000;

export function scaleSvg(tilt, name) {
  const { left, right, dy } = scaleGeometry(tilt);
  const strings = (end, sign) => {
    const y = SCALE.rim + sign * dy;
    return (
      line(end[0], end[1], end[0] - 70, y, PALETTE.muted, 2) +
      line(end[0], end[1], end[0] + 70, y, PALETTE.muted, 2)
    );
  };
  const body =
    line(SCALE.pivotX, SCALE.pivotY, SCALE.pivotX, 160, PALETTE.ink, 8) +
    rect(SCALE.pivotX - 54, 156, 108, 12, PALETTE.violetSoft, PALETTE.ink, 5) +
    strings(left, 1) +
    strings(right, -1) +
    line(left[0], left[1], right[0], right[1], PALETTE.violet, 10) +
    circle(SCALE.pivotX, SCALE.pivotY, 13, PALETTE.gold) +
    circle(left[0], left[1], 6, PALETTE.paper) +
    circle(right[0], right[1], 6, PALETTE.paper);
  return picture(SCALE.width, SCALE.height, body, "pz-beam", name);
}

// ---- number bond -------------------------------------------------------------------------------------------------
// Centres of the three circles as percentages of the picture: whole, left part, right part.
export const BOND_NODES = [
  [50, 24],
  [23.3, 76],
  [76.7, 76],
];
export function bondSvg(name) {
  const W = 300;
  const H = 200;
  const at = ([x, y]) => [(x * W) / 100, (y * H) / 100];
  const [top, a, b] = BOND_NODES.map(at);
  const body =
    line(top[0], top[1], a[0], a[1], PALETTE.ink, 4) +
    line(top[0], top[1], b[0], b[1], PALETTE.ink, 4) +
    circle(top[0], top[1], 40, PALETTE.violetSoft) +
    circle(a[0], a[1], 40, PALETTE.mintSoft) +
    circle(b[0], b[1], 40, PALETTE.mintSoft);
  return picture(W, H, body, "pz-bond-art", name);
}

// ---- magic triangle ----------------------------------------------------------------------------------------------
// Centres of the six spots as percentages: top, bottom left, bottom right, left side, bottom side, right side.
export const TRI_NODES = [
  [50, 15],
  [13.3, 87],
  [86.7, 87],
  [31.7, 51],
  [50, 87],
  [68.3, 51],
];
export function triangleSvg(name, target) {
  const W = 300;
  const H = 270;
  const at = ([x, y]) => [(x * W) / 100, (y * H) / 100];
  const [top, bl, br] = [0, 1, 2].map((i) => at(TRI_NODES[i]));
  const body =
    `<path d="M${top[0]} ${top[1]} L${bl[0]} ${bl[1]} L${br[0]} ${br[1]} Z" fill="${PALETTE.skySoft}" stroke="${PALETTE.ink}" stroke-width="4" stroke-linejoin="round"/>` +
    TRI_NODES.map((n) => circle(...at(n), 27, PALETTE.paper, PALETTE.violet)).join("") +
    label(150, 140, `${target}`, 30, PALETTE.violet);
  return picture(W, H, body, "pz-tri-art", name);
}

// ---- grids and cages ---------------------------------------------------------------------------------------------
// An n x n frame in a 100-unit cell grid. `cages` ([{cells, label}]) get a heavy outline and a label in the cell that
// comes first in reading order; thin lines separate every square.
export function gridFrameSvg(n, cages = [], name = "") {
  const S = 100;
  const owner = new Map();
  cages.forEach((cage, k) => {
    for (const c of cage.cells) owner.set(c, k);
  });
  let body = "";
  for (let i = 1; i < n; i += 1) {
    body +=
      line(i * S, 0, i * S, n * S, PALETTE.line, 2) + line(0, i * S, n * S, i * S, PALETTE.line, 2);
  }
  const edge = (c, d) => {
    const r = Math.floor(c / n);
    const col = c % n;
    const other = d === "r" ? (col < n - 1 ? c + 1 : -1) : r < n - 1 ? c + n : -1;
    if (other >= 0 && owner.get(c) === owner.get(other) && owner.has(c)) return "";
    if (!cages.length) return "";
    const x = col * S;
    const y = r * S;
    return d === "r"
      ? line(x + S, y, x + S, y + S, PALETTE.ink, 6)
      : line(x, y + S, x + S, y + S, PALETTE.ink, 6);
  };
  if (cages.length) {
    for (let c = 0; c < n * n; c += 1) {
      body += edge(c, "r") + edge(c, "d");
      if (c % n === 0)
        body += line(0, Math.floor(c / n) * S, 0, Math.floor(c / n) * S + S, PALETTE.ink, 6);
      if (c < n) body += line(c * S, 0, c * S + S, 0, PALETTE.ink, 6);
    }
    for (const cage of cages) {
      const first = Math.min(...cage.cells);
      body += label(
        (first % n) * S + 8,
        Math.floor(first / n) * S + 24,
        cage.label,
        22,
        PALETTE.violet,
        "start",
      );
    }
  } else {
    body += rect(1, 1, n * S - 2, n * S - 2, "none", PALETTE.ink, 8);
  }
  return picture(n * S, n * S, body, "pz-frame", name);
}

// ---- squares and small weights -----------------------------------------------------------------------------------
// A square of side `side` drawn at `unit` pixels per unit of length (capped), with a grid of unit squares for small sides.
export function squareSvg(side, unit = 8, cap = 88) {
  const px = Math.max(10, Math.min(cap, side * unit));
  const cell = px / side;
  let grid = "";
  if (side <= 12) {
    for (let i = 1; i < side; i += 1)
      grid +=
        line(i * cell, 0, i * cell, px, PALETTE.skySoft, 1) +
        line(0, i * cell, px, i * cell, PALETTE.skySoft, 1);
  }
  return `<svg class="pz-sq" viewBox="0 0 ${px + 4} ${px + 4}" width="${px + 4}" height="${px + 4}" aria-hidden="true" focusable="false"><g transform="translate(2 2)">${rect(0, 0, px, px, PALETTE.sky + "33", PALETTE.sky, 2)}${grid}</g></svg>`;
}

// The unknown-weight boxes: an x-box, a cube and a ball, each marked with its letter so shape is never the only clue.
export function weightSvg(kind) {
  const mark = kind === "ball" ? "y" : "x";
  const shape =
    kind === "ball"
      ? circle(24, 24, 20, PALETTE.coralSoft, PALETTE.coral)
      : rect(
          5,
          5,
          38,
          38,
          kind === "cube" ? PALETTE.skySoft : PALETTE.goldSoft,
          kind === "cube" ? PALETTE.sky : PALETTE.gold,
          6,
        );
  return `<svg class="pz-box" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">${shape}${label(24, 31, mark, 20, PALETTE.ink)}</svg>`;
}
