// Shared room props for illustrator L's modules (Real-Life Scenarios rooms and Language City interiors), built from the
// site kit: flat fills lit from the upper left, shade strips on the right, soft contact shadows, no outlines, no ids.
import { P, contact, ellipse, light, mix, path, rect, rrect, shade, stroke } from "./kit.js";

/* room parts: scenes are 640 x 280 with the floor line at y = 200 */

/** Wall and floor with a baseboard, a warm light patch on the wall and a darker strip where the floor meets it. */
export const room = (wall, floor) =>
  rect(0, 0, 640, 200, wall) +
  ellipse(120, 10, 420, 170, light(wall, 0.4), 'opacity=".22"') +
  ellipse(110, 0, 280, 110, light(wall, 0.4), 'opacity=".22"') +
  rect(0, 190, 640, 10, shade(wall, 0.14)) +
  rect(0, 200, 640, 80, floor) +
  rect(0, 200, 640, 8, shade(floor, 0.16)) +
  stroke("M0 236H640M0 262H640", light(floor, 0.25), 1.4, 'opacity=".6"');

/** A box lit from the upper left: face, a shade strip on the right, a light lip on top. */
export const box = (x, y, w, h, c, r = 3) =>
  rrect(x, y, w, h, r, c) +
  rect(x + w * 0.8, y + 2, w * 0.2 - 1, h - 3, shade(c, 0.14), 'opacity=".7"') +
  rect(x + 2, y, w - 4, Math.min(5, h * 0.25), light(c, 0.3), 'opacity=".8"');

/** A counter or desk standing on the floor line: top slab, front, contact shadow. */
export const counter = (x, y, w, h, c) =>
  contact(x + w / 2, y + h, w * 0.55, 5, 0.18) +
  rect(x, y + 6, w, h - 6, shade(c, 0.08)) +
  rect(x + w * 0.78, y + 6, w * 0.22, h - 6, shade(c, 0.2), 'opacity=".7"') +
  rrect(x - 6, y, w + 12, 9, 3, light(c, 0.12)) +
  rect(x - 6, y + 7, w + 12, 3, shade(c, 0.3), 'opacity=".5"');

/** Table on legs (top at y). */
export const legTable = (x, y, w, c, legH = 46) =>
  contact(x + w / 2, y + legH, w * 0.5, 5, 0.16) +
  rect(x + 10, y + 6, 8, legH - 6, shade(c, 0.3)) +
  rect(x + w - 18, y + 6, 8, legH - 6, shade(c, 0.3)) +
  rrect(x, y, w, 10, 4, c) +
  rect(x + 2, y + 7, w - 4, 3, shade(c, 0.25));

/** A framed picture/sign on the wall with a soft cast shadow. */
export const plaque = (x, y, w, h, c, r = 6) =>
  rrect(x + 3, y + 4, w, h, r, "#1c2f4a", 'opacity=".12"') + rrect(x, y, w, h, r, c);

/** Window with a sky view, sill and glare. */
export const win = (x, y, w, h, frame = P.ivory, sky = P.sky) =>
  plaque(x - 6, y - 6, w + 12, h + 12, frame, 4) +
  rect(x, y, w, h, sky) +
  rect(x, y + h * 0.62, w, h * 0.38, mix(sky, P.skyLow, 0.7)) +
  path(
    `M${x + w * 0.1} ${y + h}L${x + w * 0.45} ${y}H${x + w * 0.62}L${x + w * 0.27} ${y + h}Z`,
    "#ffffff",
    'opacity=".28"',
  ) +
  rect(x - 10, y + h + 6, w + 20, 6, shade(frame, 0.12));

/** Shelf plank with small goods in a row. */
export const shelf = (x, y, w, goods) =>
  goods + rect(x, y, w, 8, P.wood) + rect(x, y + 6, w, 3, P.woodDark);
export const goodsRow = (x, y, list) => {
  let s = "";
  let cx = x;
  for (const [w, h, c, r = 2] of list) {
    s += box(cx, y - h, w, h, c, r);
    cx += w + 6;
  }
  return s;
};

export const sofa = (x, y, w, c) =>
  contact(x + w / 2, y + 62, w * 0.52, 6, 0.2) +
  rrect(x + 6, y, w - 12, 46, 18, shade(c, 0.1)) +
  rrect(x, y + 28, w, 34, 14, c) +
  rrect(x - 8, y + 18, 26, 44, 12, light(c, 0.08)) +
  rrect(x + w - 18, y + 18, 26, 44, 12, shade(c, 0.12)) +
  rrect(x + 24, y + 22, w - 48, 12, 6, light(c, 0.25), 'opacity=".7"');

export const plant = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${contact(0, 0, 18, 4, 0.18)}${path("M-12 -26H12L9 0H-9Z", P.coral)}${rect(2, -26, 10, 26, shade(P.coral, 0.2), 'opacity=".5"')}${ellipse(-10, -38, 10, 16, P.leaf, 'transform="rotate(-25 -10 -38)"')}${ellipse(10, -40, 10, 17, P.leafDark, 'transform="rotate(25 10 -40)"')}${ellipse(0, -48, 9, 18, P.leafLight)}</g>`;

export const papers = (x, y) =>
  rect(x + 3, y - 2, 34, 8, "#e8e1d2") +
  rect(x, y - 6, 34, 8, "#ffffff") +
  stroke(`M${x + 5} ${y - 3}h18`, "#9aa7b4", 1.2);

export const cross = (cx, cy, s, c) =>
  rrect(cx - s * 0.18, cy - s / 2, s * 0.36, s, 2, c) +
  rrect(cx - s / 2, cy - s * 0.18, s, s * 0.36, 2, c);

/** A bookshelf with varied spines, deterministic so the picture never changes between renders. */
export function bookshelfFlat(x, y, w, h) {
  const cols = [P.coral, P.teal, P.gold, P.navy, P.blue, P.green, "#e9e2d0", P.orange];
  let s =
    contact(x + w / 2, y, w * 0.55, 5, 0.18) +
    rect(x, y - h, w, h, P.woodDark) +
    rect(x + 6, y - h + 6, w - 12, h - 12, shade(P.woodDark, 0.3));
  const rows = 3;
  const sh = (h - 12) / rows;
  let k = 0;
  for (let i = 0; i < rows; i++) {
    const sy = y - h + 6 + sh * (i + 1);
    let bx = x + 10;
    while (bx < x + w - 22) {
      const bw = 8 + ((k * 7) % 5);
      const bh = sh * (0.6 + ((k * 13) % 7) / 25);
      const c = cols[(k * 5 + i) % cols.length];
      s +=
        rect(bx, sy - bh - 4, bw - 1, bh, c) +
        rect(bx + 1, sy - bh - 1, bw - 3, 2, light(c, 0.4), 'opacity=".7"');
      bx += bw + (k % 6 === 5 ? 10 : 0);
      k++;
    }
    s += rect(x + 4, sy - 4, w - 8, 5, P.woodDark);
  }
  return s;
}

