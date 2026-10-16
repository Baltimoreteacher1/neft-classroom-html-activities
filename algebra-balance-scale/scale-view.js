/**
 * Drawings for the Balance Builder: the scale and the number line. Pure string
 * builders. Shapes differ as well as colours (box = x, round weight = number,
 * balloon = negative) so nothing relies on colour alone, and every drawing is
 * described in words by the caller.
 */
import { sideText } from "./balance-model.js";
import * as R from "./rational.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const MINUS = "−";
const MAX_BOXES = 4;

function xLabel(mag, v) {
  const lead = mag.n === 1 ? "" : String(mag.n);
  return `${lead}${v}${mag.d === 1 ? "" : `/${mag.d}`}`;
}

/** The things sitting in one pan. */
export function chipsOf(s, v) {
  const out = [];
  if (!R.isZero(s.a)) {
    const mag = R.abs(s.a);
    if (s.a.n < 0) out.push({ kind: "balloon", label: `${MINUS}${xLabel(mag, v)}` });
    else if (R.isInt(mag) && mag.n <= MAX_BOXES) {
      for (let i = 0; i < mag.n; i += 1) out.push({ kind: "box", label: v });
    } else out.push({ kind: "box", label: xLabel(mag, v) });
  }
  if (!R.isZero(s.b)) {
    out.push(
      s.b.n < 0
        ? { kind: "balloon", label: `${MINUS}${R.fmt(R.abs(s.b))}` }
        : { kind: "weight", label: R.fmt(s.b) },
    );
  }
  return out;
}

function chipSvg(chip, x, y) {
  const label = esc(chip.label);
  const small = chip.label.length > 4 ? 11 : 15;
  const text = (cx, cy) =>
    `<text x="${cx}" y="${cy}" class="bb-chip-text" font-size="${small}" text-anchor="middle">${label}</text>`;
  if (chip.kind === "box") {
    const w = chip.label.length > 2 ? 46 : 34;
    return `<g class="bb-chip bb-box"><rect x="${x - w / 2}" y="${y - 30}" width="${w}" height="30" rx="6"/>${text(x, y - 10)}</g>`;
  }
  if (chip.kind === "weight") {
    const r = chip.label.length > 3 ? 21 : 17;
    return `<g class="bb-chip bb-weight"><circle cx="${x}" cy="${y - r}" r="${r}"/>${text(x, y - r + 5)}</g>`;
  }
  return `<g class="bb-chip bb-balloon"><ellipse cx="${x}" cy="${y - 52}" rx="22" ry="20"/><path d="M${x} ${y - 32} L${x - 4} ${y - 6} M${x} ${y - 32} L${x + 4} ${y - 6}"/>${text(x, y - 47)}</g>`;
}

function panSvg(s, v, cx, cy) {
  const chips = chipsOf(s, v);
  const perRow = 3;
  let svg = "";
  chips.forEach((chip, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, chips.length - row * perRow);
    const col = i % perRow;
    const x = cx + (col - (inRow - 1) / 2) * 44;
    svg += chipSvg(chip, x, cy - 6 - row * 34);
  });
  return (
    `<path class="bb-pan" d="M${cx - 66} ${cy} H${cx + 66} Q${cx + 58} ${cy + 26} ${cx} ${cy + 26} Q${cx - 58} ${cy + 26} ${cx - 66} ${cy} Z"/>` +
    svg
  );
}

/**
 * The balance. `lean` is +1 when the left pan is lower, -1 when the right is, 0 when level.
 * A level beam means the sides are equal; the lower pan is the heavier one.
 */
export function scaleSvg(eq, v, lean = 0) {
  const angle = (-lean * 8 * Math.PI) / 180;
  const half = 170;
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;
  const lx = 260 - dx;
  const ly = 70 - dy;
  const rx = 260 + dx;
  const ry = 70 + dy;
  const hang = 78;
  return (
    `<svg class="bb-svg" viewBox="0 0 520 250" aria-hidden="true" focusable="false">` +
    `<path class="bb-stand" d="M260 70 L238 236 H282 Z"/><rect class="bb-stand" x="204" y="232" width="112" height="12" rx="6"/>` +
    `<g class="bb-hangers"><path d="M${lx} ${ly} L${lx - 56} ${ly + hang} M${lx} ${ly} L${lx + 56} ${ly + hang}"/><path d="M${rx} ${ry} L${rx - 56} ${ry + hang} M${rx} ${ry} L${rx + 56} ${ry + hang}"/></g>` +
    `<line class="bb-beam" x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}"/>` +
    `<circle class="bb-pivot" cx="260" cy="70" r="10"/>` +
    panSvg(eq.l, v, lx, ly + hang) +
    panSvg(eq.r, v, rx, ry + hang) +
    `</svg>`
  );
}

/** The equation as large type under the scale. */
export const equationHtml = (eq, v) =>
  `<span class="bb-side">${esc(sideText(eq.l, v))}</span><span class="bb-rel">${esc(eq.rel)}</span><span class="bb-side">${esc(sideText(eq.r, v))}</span>`;

/**
 * A number line around `boundary`. Until the student chooses, only the ticks show.
 * choice = { open: boolean, dir: "left" | "right" } | null
 */
export function numberLineSvg(boundary, choice, v) {
  const lo = boundary - 5;
  const hi = boundary + 5;
  const X = (n) => 30 + ((n - lo) / (hi - lo)) * 460;
  let ticks = "";
  for (let n = lo; n <= hi; n += 1) {
    ticks += `<line x1="${X(n)}" y1="48" x2="${X(n)}" y2="62"/><text x="${X(n)}" y="82" text-anchor="middle" class="bb-tick">${n < 0 ? `${MINUS}${-n}` : n}</text>`;
  }
  let shape = "";
  if (choice) {
    const to = choice.dir === "right" ? 500 : 20;
    shape =
      `<line class="bb-ray" x1="${X(boundary)}" y1="55" x2="${to}" y2="55"/>` +
      `<path class="bb-ray-head" d="${
        choice.dir === "right" ? "M506 55 L494 47 L494 63 Z" : "M14 55 L26 47 L26 63 Z"
      }"/>` +
      `<circle class="bb-dot ${choice.open ? "bb-open" : "bb-closed"}" cx="${X(boundary)}" cy="55" r="8"/>`;
  }
  return `<svg class="bb-line" viewBox="0 0 520 96" aria-hidden="true" focusable="false"><line class="bb-axis" x1="20" y1="55" x2="500" y2="55"/>${ticks}${shape}<text x="260" y="16" text-anchor="middle" class="bb-tick">${esc(v)}</text></svg>`;
}
