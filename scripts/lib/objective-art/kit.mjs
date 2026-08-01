// Drawing primitives for the objective-card artwork (scripts/gen-objective-art.mjs).
//
// Every figure is authored in ONE local coordinate space — 1200 x 450 — and the
// card wrappers place that same drawing twice: once large on the content card,
// once smaller on the "talk about it" card above two partners. Drawing the model
// exactly once is the point: the language card is REQUIRED to show the same
// model the content card shows, and a shared `model()` makes that structural
// rather than a promise.
//
// Palette mirrors assets/design-tokens.css. Literal hex only — `.sg-lab`
// remaps --teal to navy, and an SVG that inherited that would go monochrome.

export const C = {
  navy: "#12355b",
  navyLight: "#18466f",
  teal: "#1fa6a2",
  tealInk: "#0c6f6b",
  tealLight: "#dff2ee",
  amber: "#f2c15b",
  amberInk: "#8a5a00",
  amberLight: "#fef7e0",
  cream: "#f7f4ec",
  coral: "#d9795d",
  coralInk: "#a8412a",
  coralLight: "#fce6de",
  ink: "#21313f",
  muted: "#5f6f80",
  line: "#d7e2ed",
  white: "#ffffff",
  green: "#0f7c4a",
  greenLight: "#e6f7ef",
};

// No webfont may be fetched (self-contained rule), so the stack degrades to the
// system UI face on a device without Outfit installed. Both names are the ones
// the rest of the site asks for, so a device that has them matches the site.
export const FONT = "Outfit, 'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** The local drawing box every model() is authored inside. */
export const MODEL_W = 1200;
export const MODEL_H = 450;

/** Card geometry — 1376 x 768 matches the aspect of the three photos it sits beside. */
export const CARD = { w: 1376, h: 768, panelX: 44, panelY: 112, panelW: 1288, panelH: 612 };

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Text. `size` is in local units; on the content card 1 unit = 1 CSS px at 1376 wide. */
export function T(x, y, size, fill, text, opts = {}) {
  const { weight = 700, anchor = "middle", letter, opacity, halo } = opts;
  // `halo` paints a white outline UNDER the glyphs (paint-order: stroke). Axis
  // numbers need it: a plotted segment lands exactly on a tick label often
  // enough that without it a student reads the label as part of the figure.
  return (
    `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}"` +
    ` fill="${fill}" text-anchor="${anchor}"` +
    (halo ? ` stroke="${C.white}" stroke-width="${halo}" paint-order="stroke"` : "") +
    (letter ? ` letter-spacing="${letter}"` : "") +
    (opacity ? ` opacity="${opacity}"` : "") +
    `>${esc(text)}</text>`
  );
}

export function rect(x, y, w, h, opts = {}) {
  const { fill = "none", stroke, sw = 2, rx = 0, dash, opacity } = opts;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : "") +
    (dash ? ` stroke-dasharray="${dash}"` : "") +
    (opacity ? ` opacity="${opacity}"` : "") +
    ` />`
  );
}

export function ln(x1, y1, x2, y2, opts = {}) {
  const { stroke = C.navy, sw = 3, dash, cap = "round" } = opts;
  return (
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"` +
    ` stroke-linecap="${cap}"` +
    (dash ? ` stroke-dasharray="${dash}"` : "") +
    ` />`
  );
}

export function circle(cx, cy, r, opts = {}) {
  const { fill = C.white, stroke, sw = 3, opacity } = opts;
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : "") +
    (opacity ? ` opacity="${opacity}"` : "") +
    ` />`
  );
}

export function poly(points, opts = {}) {
  const { fill = C.navy, stroke, sw = 2, opacity } = opts;
  return (
    `<polygon points="${points}" fill="${fill}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : "") +
    (opacity ? ` opacity="${opacity}"` : "") +
    ` />`
  );
}

export function path(d, opts = {}) {
  const { fill = "none", stroke, sw = 3, dash, cap = "round" } = opts;
  return (
    `<path d="${d}" fill="${fill}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"` : "") +
    (dash ? ` stroke-dasharray="${dash}"` : "") +
    ` />`
  );
}

/** A straight arrow with a solid head — no <marker>, so ids can never collide. */
export function arrow(x1, y1, x2, y2, opts = {}) {
  const { stroke = C.navy, sw = 3, head = 14, dash } = opts;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const px = -uy;
  const py = ux;
  return (
    ln(x1, y1, bx, by, { stroke, sw, dash }) +
    poly(
      `${x2},${y2} ${bx + px * head * 0.55},${by + py * head * 0.55} ${bx - px * head * 0.55},${by - py * head * 0.55}`,
      { fill: stroke },
    )
  );
}

/** A curved "same-thing-again" arrow, used for ×2 / reflection moves. */
export function curveArrow(x1, y1, x2, y2, lift, opts = {}) {
  const { stroke = C.coral, sw = 3.5, head = 14 } = opts;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + lift;
  // Tangent at the end of a quadratic Bezier points from the control point.
  const dx = x2 - mx;
  const dy = y2 - my;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const px = -uy;
  const py = ux;
  return (
    path(`M ${x1} ${y1} Q ${mx} ${my} ${bx} ${by}`, { stroke, sw }) +
    poly(
      `${x2},${y2} ${bx + px * head * 0.55},${by + py * head * 0.55} ${bx - px * head * 0.55},${by - py * head * 0.55}`,
      { fill: stroke },
    )
  );
}

/** Rounded label pill. Width is measured, so callers never guess. */
export function chip(cx, cy, text, opts = {}) {
  const {
    size = 30,
    fill = C.tealLight,
    stroke = C.teal,
    textFill = C.navy,
    padX = 20,
    h = size + 24,
    weight = 800,
    minW = 0,
  } = opts;
  const w = Math.max(minW, textW(text, size, weight) + padX * 2);
  return (
    rect(cx - w / 2, cy - h / 2, w, h, { fill, stroke, sw: 2.5, rx: h / 2 }) +
    T(cx, cy + size * 0.35, size, textFill, text, { weight })
  );
}

/**
 * Approximate advance width. Outfit is a fairly narrow geometric sans; these
 * per-class ratios were tuned against the rendered screenshots until no chip in
 * the set clipped its own text. Approximate is fine: every use adds padding and
 * the screenshot pass is what actually signs the layout off.
 */
export function textW(text, size, weight = 700) {
  let units = 0;
  for (const ch of String(text)) {
    if (/[ .,:;'’!|]/.test(ch)) units += 0.3;
    else if (/[iIl1jt()[\]]/.test(ch)) units += 0.34;
    else if (/[rfс]/.test(ch)) units += 0.42;
    else if (/[A-Z0-9×÷−–—≤≥<>=+]/.test(ch)) units += 0.62;
    else if (/[mwMW]/.test(ch)) units += 0.86;
    else units += 0.55;
  }
  return units * size * (weight >= 800 ? 1.04 : 1);
}

/** Horizontal number line with a value→x mapper. */
export function numberLine(opts) {
  const {
    x,
    y,
    w,
    min,
    max,
    step = 1,
    labelEvery = 1,
    labelSize = 26,
    labelFmt = (v) => String(v).replace("-", "\u2212"),
    stroke = C.navy,
    tick = 12,
    labelDy = 40,
    arrows = true,
  } = opts;
  const X = (v) => x + ((v - min) / (max - min)) * w;
  let s = ln(x - (arrows ? 18 : 0), y, x + w + (arrows ? 18 : 0), y, { stroke, sw: 4 });
  if (arrows) {
    s += poly(`${x - 26},${y} ${x - 8},${y - 10} ${x - 8},${y + 10}`, { fill: stroke });
    s += poly(`${x + w + 26},${y} ${x + w + 8},${y - 10} ${x + w + 8},${y + 10}`, { fill: stroke });
  }
  const n = Math.round((max - min) / step);
  for (let i = 0; i <= n; i += 1) {
    const v = min + i * step;
    const px = X(v);
    const major = Math.abs(v / (step * labelEvery) - Math.round(v / (step * labelEvery))) < 1e-9;
    s += ln(px, y - (major ? tick : tick * 0.55), px, y + (major ? tick : tick * 0.55), {
      stroke,
      sw: major ? 3.5 : 2.5,
    });
    if (major) s += T(px, y + labelDy, labelSize, C.ink, labelFmt(v), { weight: 700 });
  }
  return { svg: s, X };
}

/** A dot at `v` on a number line drawn at `y`. */
export function dot(cx, cy, r, fill, opts = {}) {
  const { open = false } = opts;
  return open
    ? circle(cx, cy, r, { fill: C.white, stroke: fill, sw: 5 })
    : circle(cx, cy, r, { fill });
}

/** Four-quadrant coordinate plane with a value→pixel mapper. */
export function coordPlane(opts) {
  const {
    cx,
    cy,
    unit,
    min = -5,
    max = 5,
    labelSize = 22,
    labelEvery = 1,
    grid = C.line,
    axis = C.navy,
    axisNames = true,
  } = opts;
  const X = (v) => cx + v * unit;
  const Y = (v) => cy - v * unit;
  const lo = X(min);
  const hi = X(max);
  const top = Y(max);
  const bot = Y(min);
  let s = rect(lo, top, hi - lo, bot - top, { fill: C.white });
  for (let v = min; v <= max; v += 1) {
    s += ln(X(v), top, X(v), bot, { stroke: grid, sw: v === 0 ? 0.1 : 1.6, cap: "butt" });
    s += ln(lo, Y(v), hi, Y(v), { stroke: grid, sw: v === 0 ? 0.1 : 1.6, cap: "butt" });
  }
  s += ln(lo - 14, Y(0), hi + 14, Y(0), { stroke: axis, sw: 3.5 });
  s += ln(X(0), top - 14, X(0), bot + 14, { stroke: axis, sw: 3.5 });
  s += poly(`${hi + 22},${Y(0)} ${hi + 4},${Y(0) - 9} ${hi + 4},${Y(0) + 9}`, { fill: axis });
  s += poly(`${lo - 22},${Y(0)} ${lo - 4},${Y(0) - 9} ${lo - 4},${Y(0) + 9}`, { fill: axis });
  s += poly(`${X(0)},${top - 22} ${X(0) - 9},${top - 4} ${X(0) + 9},${top - 4}`, { fill: axis });
  s += poly(`${X(0)},${bot + 22} ${X(0) - 9},${bot + 4} ${X(0) + 9},${bot + 4}`, { fill: axis });
  for (let v = min; v <= max; v += 1) {
    if (v === 0 || v % labelEvery !== 0) continue;
    const label = String(v).replace("-", "\u2212");
    s += T(X(v), Y(0) + labelSize + 12, labelSize, C.muted, label, { weight: 700, halo: 5 });
    s += T(X(0) - 16, Y(v) + labelSize * 0.36, labelSize, C.muted, label, {
      weight: 700,
      anchor: "end",
      halo: 5,
    });
  }
  s += T(X(0) - 14, Y(0) + labelSize + 12, labelSize, C.muted, "0", {
    weight: 700,
    anchor: "end",
    halo: 5,
  });
  if (axisNames) {
    s += T(hi + 40, Y(0) + 9, 26, C.navy, "x", { weight: 800 });
    s += T(X(0) + 2, top - 34, 26, C.navy, "y", { weight: 800 });
  }
  return { svg: s, X, Y, lo, hi, top, bot };
}

/** Plotted point with its ordered pair printed beside it. */
export function plotPoint(px, py, label, opts = {}) {
  const { fill = C.coral, dx = 18, dy = -18, size = 26, anchor = "start", labelFill } = opts;
  return (
    circle(px, py, 11, { fill, stroke: C.white, sw: 3 }) +
    (label
      ? T(px + dx, py + dy, size, labelFill || C.coralInk, label, { weight: 800, anchor })
      : "")
  );
}

/** A bordered data table. `rows[0]` is the header row. */
export function table(opts) {
  const {
    x,
    y,
    colW,
    rowH,
    rows,
    size = 30,
    headFill = C.navy,
    headText = C.white,
    bodyFill = C.white,
    stroke = C.navy,
  } = opts;
  const cols = rows[0].length;
  const w = colW * cols;
  let s = "";
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const cxr = x + c * colW;
      const cyr = y + r * rowH;
      s += rect(cxr, cyr, colW, rowH, {
        fill: r === 0 ? headFill : bodyFill,
        stroke,
        sw: 2,
      });
      s += T(cxr + colW / 2, cyr + rowH / 2 + size * 0.35, size, r === 0 ? headText : C.ink, cell, {
        weight: r === 0 ? 800 : 700,
      });
    });
  });
  s += rect(x, y, w, rowH * rows.length, { stroke, sw: 3.5, rx: 6 });
  return s;
}

/** Two partner silhouettes, drawn as flat brand-coloured shapes. */
export function partner(cx, cy, fill, opts = {}) {
  const { r = 30, flip = false } = opts;
  const arm = flip ? -1 : 1;
  return (
    path(`M ${cx - r * 1.25} ${cy + r * 1.5} a ${r * 1.25} ${r * 1.25} 0 0 1 ${r * 2.5} 0 z`, {
      fill,
    }) +
    circle(cx, cy, r, { fill }) +
    circle(cx + arm * r * 0.34, cy - r * 0.12, r * 0.13, { fill: C.white }) +
    circle(cx - arm * r * 0.14, cy - r * 0.12, r * 0.13, { fill: C.white }) +
    path(`M ${cx - r * 0.3} ${cy + r * 0.36} q ${r * 0.3} ${r * 0.28} ${r * 0.6} 0`, {
      stroke: C.white,
      sw: r * 0.11,
    })
  );
}

/** Rounded speech bubble with a tail on the given side and up to two text lines. */
export function bubble(x, y, w, h, lines, opts = {}) {
  const { side = "left", fill = C.white, stroke = C.teal, size = 30, textFill = C.ink } = opts;
  const tail =
    side === "left"
      ? poly(`${x - 26},${y + h * 0.55} ${x + 2},${y + h * 0.34} ${x + 2},${y + h * 0.76}`, {
          fill,
          stroke,
          sw: 2.5,
        })
      : poly(
          `${x + w + 26},${y + h * 0.55} ${x + w - 2},${y + h * 0.34} ${x + w - 2},${y + h * 0.76}`,
          { fill, stroke, sw: 2.5 },
        );
  const body = rect(x, y, w, h, { fill, stroke, sw: 2.5, rx: 20 });
  const startY = y + h / 2 - (lines.length - 1) * 19 + size * 0.34;
  const text = lines
    .map((t, i) => T(x + w / 2, startY + i * 38, size, textFill, t, { weight: 700 }))
    .join("");
  return tail + body + text;
}

/**
 * Shared card chrome. `heading` is the words printed on the card; `title` is the
 * SVG <title>, and the generator always passes the catalogue's `alt` there so a
 * file can never describe itself differently from the module that captions it.
 */
export function cardSvg({ heading, title, note, titleId, body, accent = C.navy }) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD.w} ${CARD.h}" width="${CARD.w}"` +
    ` height="${CARD.h}" role="img" aria-labelledby="${titleId}">\n` +
    `<title id="${titleId}">${esc(title)}</title>\n` +
    rect(0, 0, CARD.w, CARD.h, { fill: C.cream }) +
    "\n" +
    rect(20, 20, CARD.w - 40, CARD.h - 40, { fill: "none", stroke: C.line, sw: 3, rx: 30 }) +
    "\n" +
    T(72, 82, 42, accent, heading, { weight: 800, anchor: "start" }) +
    (note ? T(CARD.w - 72, 82, 32, C.tealInk, note, { weight: 800, anchor: "end" }) : "") +
    "\n" +
    rect(CARD.panelX, CARD.panelY, CARD.panelW, CARD.panelH, {
      fill: C.white,
      stroke: C.line,
      sw: 3,
      rx: 26,
    }) +
    "\n" +
    body +
    "\n</svg>\n"
  );
}

/** Places a model() drawing (1200x450 local space) at a scale and offset. */
export function place(body, tx, ty, scale = 1) {
  return `<g transform="translate(${tx} ${ty}) scale(${scale})">${body}</g>`;
}
