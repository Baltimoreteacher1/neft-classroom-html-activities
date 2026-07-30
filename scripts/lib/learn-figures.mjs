// Worked-example figures for the Learn It page.
//
// A publisher never prints a worked example without a picture of the thing
// being solved: the parallelogram with its base and height marked, the box
// with its three edges labelled, the number line with the point on it. Our
// Learn It page had vocabulary art and a real-world photo, but nothing showing
// THIS problem's numbers — so the sentence "a base of 14 feet and a height of
// 9 feet" was the only place a student could find the figure.
//
// This module reads the lesson's own worked example (launch.conceptIntro.iDo)
// and, when it can identify the figure and its measurements with certainty,
// returns a labelled inline SVG of exactly that problem. It draws NOTHING when
// it is not sure — a diagram that disagrees with the text is far worse than no
// diagram, because a student trusts the picture over the paragraph. Every
// reader here is a strict pattern, never a guess.
//
// Layout rule: the drawing lives inside a fixed stage and every label lives in
// a reserved gutter, so nothing can clip at the edge or collide with the art.
//
// Every renderer returns { svg, alt, kind, values }. `values` is the list of
// numbers the picture claims; scripts/validate-learn-figures.mjs checks them
// back against the lesson text on every build.

const NAVY = "#12355b";
const TEAL = "#1fa6a2";
const TEAL_INK = "#0c6f6b";
const AMBER_INK = "#8a5a00";
const FILL = "#dff2ee";
const LINE = "#c3d3e2";
const MUTED = "#5f6f80";

const W = 460; // canvas
const H = 300;

function esc(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function num(s) {
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

// Rough advance width for the label font, used only to keep text inside the
// canvas — it never needs to be exact, just never optimistic.
function textW(text, size) {
  return String(text).length * size * 0.58;
}

function label(x, y, text, opts = {}) {
  const size = opts.size || 17;
  let anchor = opts.anchor || "middle";
  let cx = x;
  // Clamp so a long label can never run off the canvas.
  const w = textW(text, size);
  const half = anchor === "middle" ? w / 2 : anchor === "end" ? w : 0;
  const left = cx - half;
  const right = anchor === "middle" ? cx + w / 2 : anchor === "end" ? cx : cx + w;
  if (left < 4) cx += 4 - left;
  if (right > W - 4) cx -= right - (W - 4);
  return `<text x="${Math.round(cx)}" y="${Math.round(y)}" text-anchor="${anchor}" font-family="Outfit, system-ui, sans-serif" font-size="${size}" font-weight="${opts.weight || 800}" fill="${opts.color || NAVY}">${esc(text)}</text>`;
}

// Wrap a sentence onto stacked lines so a caption never overflows.
function lines(x, y, text, opts = {}) {
  const size = opts.size || 15;
  const max = opts.max || W - 24;
  const words = String(text).split(" ");
  const out = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? cur + " " + word : word;
    if (textW(next, size) > max && cur) {
      out.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out.map((l, i) => label(x, y + i * (size + 5), l, { ...opts, size })).join("");
}

function svgWrap(inner, alt, h) {
  return `<svg class="li-fig-svg" viewBox="0 0 ${W} ${h || H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(alt)}" xmlns="http://www.w3.org/2000/svg"><title>${esc(alt)}</title>${inner}</svg>`;
}

// The square that tells a sixth grader the height is perpendicular — the whole
// point of the parallelogram lesson.
function rightAngle(x, y, size = 13) {
  return `<path d="M ${x + size} ${y} L ${x + size} ${y - size} L ${x} ${y - size}" fill="none" stroke="${NAVY}" stroke-width="2" />`;
}

/* ---------------- area figures ----------------
   Stage: x 34..286. Gutter: x 300..456 holds the height label, so it can never
   overlap the shape or clip at the edge. */

const STAGE_X = 34;
const STAGE_W = 252;
const STAGE_TOP = 44;
const STAGE_H = 170;
const GUT_X = 300;

function areaFigure(shape, dims, unit) {
  const u = unit ? " " + unit : "";
  const fitH = (h, wide) => Math.min(STAGE_W / wide, STAGE_H / h);

  if (shape === "parallelogram") {
    const { b, h } = dims;
    const s = fitH(h, b * 1.3);
    const bw = b * s;
    const bh = h * s;
    const lean = Math.min(bw * 0.28, 52);
    const x0 = STAGE_X;
    const yB = STAGE_TOP + bh;
    const hx = x0 + lean + bw * 0.4;
    return {
      kind: "parallelogram",
      h: Math.max(yB + 58, STAGE_TOP + bh / 2 + 90),
      values: [b, h],
      alt: `A parallelogram with a base of ${fmt(b)}${u} and a perpendicular height of ${fmt(h)}${u}. The height is drawn straight up from the base, not along the slanted side.`,
      inner: `<polygon points="${x0},${yB} ${x0 + bw},${yB} ${x0 + bw + lean},${STAGE_TOP} ${x0 + lean},${STAGE_TOP}" fill="${FILL}" stroke="${NAVY}" stroke-width="2.5" />
        <line x1="${hx}" y1="${STAGE_TOP}" x2="${hx}" y2="${yB}" stroke="${TEAL_INK}" stroke-width="2.5" stroke-dasharray="7 5" />
        ${rightAngle(hx, yB)}
        <line x1="${x0}" y1="${yB + 18}" x2="${x0 + bw}" y2="${yB + 18}" stroke="${NAVY}" stroke-width="2" />
        ${label(x0 + bw / 2, yB + 42, "base = " + fmt(b) + u)}
        <line x1="${hx + 4}" y1="${STAGE_TOP + bh / 2}" x2="${GUT_X - 8}" y2="${STAGE_TOP + bh / 2}" stroke="${LINE}" stroke-width="1.5" />
        ${label(GUT_X, STAGE_TOP + bh / 2 - 6, "height", { anchor: "start", color: TEAL_INK, size: 16 })}
        ${label(GUT_X, STAGE_TOP + bh / 2 + 16, "= " + fmt(h) + u, { anchor: "start", color: TEAL_INK, size: 18 })}
        ${lines(GUT_X, STAGE_TOP + bh / 2 + 52, "The slanted side is NOT the height.", { anchor: "start", size: 13, weight: 700, color: AMBER_INK, max: W - GUT_X - 8 })}`,
    };
  }

  if (shape === "triangle") {
    const { b, h } = dims;
    const s = fitH(h, b * 1.05);
    const bw = b * s;
    const bh = h * s;
    const x0 = STAGE_X;
    const yB = STAGE_TOP + bh;
    const apex = x0 + bw * 0.62;
    return {
      kind: "triangle",
      h: yB + 58,
      values: [b, h],
      alt: `A triangle with a base of ${fmt(b)}${u} and a perpendicular height of ${fmt(h)}${u}.`,
      inner: `<polygon points="${x0},${yB} ${x0 + bw},${yB} ${apex},${STAGE_TOP}" fill="${FILL}" stroke="${NAVY}" stroke-width="2.5" />
        <line x1="${apex}" y1="${STAGE_TOP}" x2="${apex}" y2="${yB}" stroke="${TEAL_INK}" stroke-width="2.5" stroke-dasharray="7 5" />
        ${rightAngle(apex, yB)}
        <line x1="${x0}" y1="${yB + 18}" x2="${x0 + bw}" y2="${yB + 18}" stroke="${NAVY}" stroke-width="2" />
        ${label(x0 + bw / 2, yB + 42, "base = " + fmt(b) + u)}
        <line x1="${apex + 4}" y1="${STAGE_TOP + bh / 2}" x2="${GUT_X - 8}" y2="${STAGE_TOP + bh / 2}" stroke="${LINE}" stroke-width="1.5" />
        ${label(GUT_X, STAGE_TOP + bh / 2 - 6, "height", { anchor: "start", color: TEAL_INK, size: 16 })}
        ${label(GUT_X, STAGE_TOP + bh / 2 + 16, "= " + fmt(h) + u, { anchor: "start", color: TEAL_INK, size: 18 })}`,
    };
  }

  if (shape === "trapezoid") {
    const { b1, b2, h } = dims;
    const big = Math.max(b1, b2);
    const s = fitH(h, big * 1.05);
    const wTop = b1 * s;
    const wBot = b2 * s;
    const bh = h * s;
    const x0 = STAGE_X;
    const yB = STAGE_TOP + bh;
    const topX = x0 + (wBot - wTop) / 2;
    const hx = x0 + wBot / 2;
    return {
      kind: "trapezoid",
      h: yB + 52,
      values: [b1, b2, h],
      alt: `A trapezoid with a top base of ${fmt(b1)}${u}, a bottom base of ${fmt(b2)}${u}, and a perpendicular height of ${fmt(h)}${u}.`,
      inner: `<polygon points="${x0},${yB} ${x0 + wBot},${yB} ${topX + wTop},${STAGE_TOP} ${topX},${STAGE_TOP}" fill="${FILL}" stroke="${NAVY}" stroke-width="2.5" />
        <line x1="${hx}" y1="${STAGE_TOP}" x2="${hx}" y2="${yB}" stroke="${TEAL_INK}" stroke-width="2.5" stroke-dasharray="7 5" />
        ${rightAngle(hx, yB)}
        ${label(topX + wTop / 2, STAGE_TOP - 14, "top base = " + fmt(b1) + u, { size: 16 })}
        ${label(x0 + wBot / 2, yB + 34, "bottom base = " + fmt(b2) + u, { size: 16 })}
        <line x1="${hx + 4}" y1="${STAGE_TOP + bh / 2}" x2="${GUT_X - 8}" y2="${STAGE_TOP + bh / 2}" stroke="${LINE}" stroke-width="1.5" />
        ${label(GUT_X, STAGE_TOP + bh / 2 - 6, "height", { anchor: "start", color: TEAL_INK, size: 16 })}
        ${label(GUT_X, STAGE_TOP + bh / 2 + 16, "= " + fmt(h) + u, { anchor: "start", color: TEAL_INK, size: 18 })}`,
    };
  }

  if (shape === "rectangle") {
    const { b, h } = dims;
    const s = fitH(h, b * 1.05);
    const bw = b * s;
    const bh = h * s;
    const x0 = STAGE_X + 40;
    const yB = STAGE_TOP + bh;
    return {
      kind: "rectangle",
      h: yB + 52,
      values: [b, h],
      alt: `A rectangle ${fmt(b)}${u} long and ${fmt(h)}${u} tall.`,
      inner: `<rect x="${x0}" y="${STAGE_TOP}" width="${bw}" height="${bh}" fill="${FILL}" stroke="${NAVY}" stroke-width="2.5" />
        ${label(x0 + bw / 2, yB + 36, fmt(b) + u)}
        ${label(x0 - 14, STAGE_TOP + bh / 2 + 6, fmt(h) + u, { anchor: "end", color: TEAL_INK })}`,
    };
  }
  return null;
}

/* ---------------- rectangular prism ----------------
   Stage: x 118..330, leaving a left gutter for "height" and a right gutter for
   "width" so neither can clip. */

function prismFigure(l, w, h, unit) {
  const u = unit ? " " + unit : "";
  const s = Math.min(170 / Math.max(l, 1), 120 / Math.max(h, 1), 56);
  const bw = Math.max(l * s, 64);
  const bh = Math.max(h * s, 46);
  const d = Math.max(Math.min(w * s, 62), 26);
  const dx = d * 0.66;
  const dy = d * 0.52;
  const x = 122;
  const y = 96;
  return {
    kind: "prism",
    h: y + bh + 56,
    values: [l, w, h],
    alt: `A rectangular box ${fmt(l)}${u} long, ${fmt(w)}${u} wide, and ${fmt(h)}${u} tall.`,
    inner: `<polygon points="${x},${y} ${x + bw},${y} ${x + bw + dx},${y - dy} ${x + dx},${y - dy}" fill="#eef7f5" stroke="${NAVY}" stroke-width="2.5" />
      <polygon points="${x + bw},${y} ${x + bw + dx},${y - dy} ${x + bw + dx},${y - dy + bh} ${x + bw},${y + bh}" fill="#cfe9e3" stroke="${NAVY}" stroke-width="2.5" />
      <rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${FILL}" stroke="${NAVY}" stroke-width="2.5" />
      ${label(x + bw / 2, y + bh + 38, "length = " + fmt(l) + u)}
      <line x1="${x - 8}" y1="${y + bh / 2}" x2="${x - 4}" y2="${y + bh / 2}" stroke="${LINE}" stroke-width="1.5" />
      ${label(x - 14, y + bh / 2 - 4, "height", { anchor: "end", color: TEAL_INK, size: 15 })}
      ${label(x - 14, y + bh / 2 + 16, "= " + fmt(h) + u, { anchor: "end", color: TEAL_INK, size: 17 })}
      ${label(x + bw + dx + 12, y - dy + 14, "width", { anchor: "start", color: TEAL_INK, size: 15 })}
      ${label(x + bw + dx + 12, y - dy + 34, "= " + fmt(w) + u, { anchor: "start", color: TEAL_INK, size: 17 })}`,
  };
}

/* ---------------- number line ---------------- */

function numberLineFigure(opts) {
  const { min, max, points = [], ray = null, alt } = opts;
  const X0 = 48;
  const X1 = 412;
  const Y = 138;
  const span = max - min || 1;
  const at = (v) => X0 + ((v - min) / span) * (X1 - X0);
  const stepRaw = span / 10;
  const step = stepRaw <= 0.5 ? 0.5 : Math.max(1, Math.round(stepRaw));
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    const x = at(v);
    const zero = Math.abs(v) < 1e-9;
    ticks.push(
      `<line x1="${x}" y1="${Y - (zero ? 15 : 9)}" x2="${x}" y2="${Y + (zero ? 15 : 9)}" stroke="${zero ? NAVY : LINE}" stroke-width="${zero ? 3 : 2}" />` +
        label(x, Y + 36, fmt(Number(v.toFixed(2))), {
          size: 15,
          weight: zero ? 800 : 600,
          color: zero ? NAVY : MUTED,
        }),
    );
  }
  const rayEls = ray
    ? (() => {
        const x = at(ray.at);
        const toX = ray.dir > 0 ? X1 - 6 : X0 + 6;
        return `<line x1="${x}" y1="${Y}" x2="${toX}" y2="${Y}" stroke="${TEAL}" stroke-width="9" stroke-linecap="round" opacity=".5" />
          <polygon points="${toX},${Y - 12} ${toX + ray.dir * 17},${Y} ${toX},${Y + 12}" fill="${TEAL}" opacity=".85" />
          <circle cx="${x}" cy="${Y}" r="10" fill="${ray.closed ? TEAL_INK : "#fff"}" stroke="${TEAL_INK}" stroke-width="3.5" />
          ${label(x, Y - 30, ray.label, { color: TEAL_INK, size: 19 })}
          ${lines(W / 2, Y + 74, ray.note, { size: 14, weight: 700, color: MUTED })}`;
      })()
    : "";
  // Alternate label heights so two nearby points never sit on top of each other.
  const pointEls = points
    .map(
      (p, i) =>
        `<circle cx="${at(p.at)}" cy="${Y}" r="10" fill="${TEAL_INK}" stroke="#fff" stroke-width="2.5" />` +
        label(at(p.at), Y - (points.length > 1 && i % 2 ? 48 : 28), p.label, {
          color: TEAL_INK,
          size: 19,
        }) +
        (points.length > 1 && i % 2
          ? `<line x1="${at(p.at)}" y1="${Y - 42}" x2="${at(p.at)}" y2="${Y - 14}" stroke="${LINE}" stroke-width="1.5" />`
          : ""),
    )
    .join("");
  return {
    kind: "number-line",
    h: ray && ray.note ? Y + 116 : Y + 62,
    values: points.map((p) => p.at).concat(ray ? [ray.at] : []),
    alt,
    inner: `<line x1="${X0 - 16}" y1="${Y}" x2="${X1 + 16}" y2="${Y}" stroke="${NAVY}" stroke-width="2.5" />
      <polygon points="${X0 - 16},${Y - 8} ${X0 - 30},${Y} ${X0 - 16},${Y + 8}" fill="${NAVY}" />
      <polygon points="${X1 + 16},${Y - 8} ${X1 + 30},${Y} ${X1 + 16},${Y + 8}" fill="${NAVY}" />
      ${ticks.join("")}${rayEls}${pointEls}`,
  };
}

/* ---------------- coordinate plane ---------------- */

function coordFigure(points, opts = {}) {
  const all = points.concat(opts.extra || []);
  const lim = Math.max(5, ...all.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)) + 1));
  const CX = 230;
  const CY = 140;
  const R = 108;
  const s = R / lim;
  const px = (x) => CX + x * s;
  const py = (y) => CY - y * s;
  const grid = [];
  for (let v = -Math.floor(lim); v <= Math.floor(lim); v++) {
    if (v === 0) continue;
    grid.push(
      `<line x1="${px(v)}" y1="${CY - R}" x2="${px(v)}" y2="${CY + R}" stroke="${LINE}" stroke-width="1" opacity=".55" />` +
        `<line x1="${CX - R}" y1="${py(v)}" x2="${CX + R}" y2="${py(v)}" stroke="${LINE}" stroke-width="1" opacity=".55" />`,
    );
  }
  // Push each label into the quadrant it points away from, so a label never
  // sits on the axis, on the grid line, or on another point.
  const place = (p) => {
    const right = p.x >= 0;
    return {
      x: px(p.x) + (right ? 13 : -13),
      y: py(p.y) + (p.y >= 0 ? -14 : 24),
      anchor: right ? "start" : "end",
    };
  };
  const dots = points
    .map((p) => {
      const l = place(p);
      return (
        `<circle cx="${px(p.x)}" cy="${py(p.y)}" r="8.5" fill="${TEAL_INK}" stroke="#fff" stroke-width="2.5" />` +
        label(l.x, l.y, p.label || `(${p.x}, ${p.y})`, {
          anchor: l.anchor,
          size: 16,
          color: TEAL_INK,
        })
      );
    })
    .join("");
  const ghosts = (opts.extra || [])
    .map((p) => {
      const l = place(p);
      return (
        `<circle cx="${px(p.x)}" cy="${py(p.y)}" r="7.5" fill="#fff" stroke="${AMBER_INK}" stroke-width="3" stroke-dasharray="4 3" />` +
        label(l.x, l.y, p.label || `(${p.x}, ${p.y})`, {
          anchor: l.anchor,
          size: 15,
          color: AMBER_INK,
        })
      );
    })
    .join("");
  const connector =
    opts.connect && points.length === 2
      ? `<line x1="${px(points[0].x)}" y1="${py(points[0].y)}" x2="${px(points[1].x)}" y2="${py(points[1].y)}" stroke="${TEAL}" stroke-width="4.5" stroke-dasharray="8 5" />`
      : opts.polyline && points.length > 2
        ? `<polyline points="${px(0)},${py(0)} ${points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}" fill="none" stroke="${TEAL}" stroke-width="3.5" />`
        : "";
  const note = opts.note
    ? lines(W / 2, CY + R + 46, opts.note, { size: 14, weight: 700, color: MUTED })
    : "";
  return {
    kind: "coordinate-plane",
    h: opts.note ? CY + R + 82 : CY + R + 34,
    values: points.flatMap((p) => [p.x, p.y]),
    alt:
      opts.alt ||
      `A coordinate grid with ${points.map((p) => `(${p.x}, ${p.y})`).join(" and ")} plotted.`,
    inner: `${grid.join("")}
      <line x1="${CX - R - 14}" y1="${CY}" x2="${CX + R + 14}" y2="${CY}" stroke="${NAVY}" stroke-width="2.5" />
      <line x1="${CX}" y1="${CY - R - 14}" x2="${CX}" y2="${CY + R + 14}" stroke="${NAVY}" stroke-width="2.5" />
      ${label(CX + R + 26, CY + 6, "x", { size: 16 })}
      ${label(CX, CY - R - 22, "y", { size: 16 })}
      ${label(CX - 10, CY + 19, "0", { anchor: "end", size: 14, color: MUTED, weight: 700 })}
      ${connector}${ghosts}${dots}${note}`,
  };
}

/* ---------------- tape / bar models ---------------- */

function tapeSumFigure(varName, part, total) {
  const X0 = 48;
  const BW = 364;
  const Y = 92;
  const BH = 66;
  const uw = ((total - part) / total) * BW;
  return {
    kind: "tape-sum",
    h: Y + BH + 66,
    values: [part, total],
    alt: `A bar model: a bar for ${fmt(total)} split into an unknown part labelled ${varName} and a known part of ${fmt(part)}.`,
    inner: `<line x1="${X0}" y1="${Y - 24}" x2="${X0 + BW}" y2="${Y - 24}" stroke="${NAVY}" stroke-width="2" />
      <line x1="${X0}" y1="${Y - 31}" x2="${X0}" y2="${Y - 17}" stroke="${NAVY}" stroke-width="2" />
      <line x1="${X0 + BW}" y1="${Y - 31}" x2="${X0 + BW}" y2="${Y - 17}" stroke="${NAVY}" stroke-width="2" />
      ${label(X0 + BW / 2, Y - 36, "total = " + fmt(total), { size: 18 })}
      <rect x="${X0}" y="${Y}" width="${uw}" height="${BH}" rx="4" fill="#fff6e0" stroke="${AMBER_INK}" stroke-width="2.5" stroke-dasharray="7 5" />
      <rect x="${X0 + uw}" y="${Y}" width="${BW - uw}" height="${BH}" rx="4" fill="${FILL}" stroke="${NAVY}" stroke-width="2.5" />
      ${label(X0 + uw / 2, Y + BH / 2 + 8, varName + " = ?", { size: 21, color: AMBER_INK })}
      ${label(X0 + uw + (BW - uw) / 2, Y + BH / 2 + 8, fmt(part), { size: 21 })}
      ${lines(W / 2, Y + BH + 38, "The unknown part and " + fmt(part) + " together make " + fmt(total) + ".", { size: 15, weight: 700, color: MUTED })}`,
  };
}

function tapeGroupsFigure(groups, varName, total) {
  const X0 = 48;
  const BW = 364;
  const Y = 92;
  const BH = 66;
  const gw = BW / groups;
  const boxes = [];
  for (let i = 0; i < groups; i++) {
    boxes.push(
      `<rect x="${X0 + i * gw}" y="${Y}" width="${gw}" height="${BH}" rx="4" fill="#fff6e0" stroke="${AMBER_INK}" stroke-width="2.5" />` +
        label(X0 + i * gw + gw / 2, Y + BH / 2 + 8, varName, { size: 21, color: AMBER_INK }),
    );
  }
  return {
    kind: "tape-groups",
    h: Y + BH + 66,
    values: [groups, total],
    alt: `A bar model: ${fmt(groups)} equal boxes, each labelled ${varName}, making a total of ${fmt(total)}.`,
    inner: `<line x1="${X0}" y1="${Y - 24}" x2="${X0 + BW}" y2="${Y - 24}" stroke="${NAVY}" stroke-width="2" />
      <line x1="${X0}" y1="${Y - 31}" x2="${X0}" y2="${Y - 17}" stroke="${NAVY}" stroke-width="2" />
      <line x1="${X0 + BW}" y1="${Y - 31}" x2="${X0 + BW}" y2="${Y - 17}" stroke="${NAVY}" stroke-width="2" />
      ${label(X0 + BW / 2, Y - 36, "total = " + fmt(total), { size: 18 })}
      ${boxes.join("")}
      ${lines(W / 2, Y + BH + 38, fmt(groups) + " equal groups of " + varName + " make " + fmt(total) + ".", { size: 15, weight: 700, color: MUTED })}`,
  };
}

function ratioTapeFigure(a, b, nameA, nameB) {
  const clip = (s) => (s.length > 17 ? s.slice(0, 16).trim() + "…" : s);
  const A = clip(nameA);
  const B = clip(nameB);
  const X0 = 158;
  const most = Math.max(a, b);
  const cell = Math.min(38, Math.floor((W - X0 - 14) / most) - 6);
  const gap = 6;
  const Y = 68;
  const BH = 42;
  const row = (n, y, fill, stroke) =>
    Array.from({ length: n })
      .map(
        (_, i) =>
          `<rect x="${X0 + i * (cell + gap)}" y="${y}" width="${cell}" height="${BH}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />`,
      )
      .join("");
  return {
    kind: "ratio-tape",
    h: Y + 70 + BH + 106,
    values: [a, b],
    alt: `A bar model comparing ${fmt(a)} parts of ${nameA} with ${fmt(b)} parts of ${nameB}, a ratio of ${fmt(a)} to ${fmt(b)}.`,
    inner: `${label(X0 - 14, Y + BH / 2 + 6, A, { anchor: "end", size: 16, color: TEAL_INK })}
      ${row(a, Y, FILL, NAVY)}
      ${label(X0 - 14, Y + 70 + BH / 2 + 6, B, { anchor: "end", size: 16, color: AMBER_INK })}
      ${row(b, Y + 70, "#fff6e0", AMBER_INK)}
      ${label(W / 2, Y + 70 + BH + 54, "ratio = " + fmt(a) + " : " + fmt(b), { size: 26, color: NAVY })}
      ${lines(W / 2, Y + 70 + BH + 82, "For every " + fmt(a) + " " + A + " there are " + fmt(b) + " " + B + ".", { size: 14, weight: 700, color: MUTED })}`,
  };
}

/* ---------------- readers ----------------
   Each reader is a strict pattern over the worked-example text. If the pattern
   does not match exactly, the reader returns null and no picture is drawn. */

const UNIT_RE =
  "(?:feet|foot|ft|inches|inch|in|cm|centimeters|m|meters|mm|yards|yd|miles|mi|units)";

function readArea(text) {
  const trap = text.match(
    new RegExp(
      `top base of ([\\d.,]+)\\s*(${UNIT_RE})?[^.]{0,50}?bottom base of ([\\d.,]+)[^.]{0,50}?height of ([\\d.,]+)`,
      "i",
    ),
  );
  if (trap) {
    const b1 = num(trap[1]);
    const b2 = num(trap[3]);
    const h = num(trap[4]);
    if (b1 && b2 && h) return areaFigure("trapezoid", { b1, b2, h }, trap[2] || "");
  }
  const bh = text.match(
    new RegExp(`\\bbase of ([\\d.,]+)\\s*(${UNIT_RE})?[^.]{0,60}?\\bheight of ([\\d.,]+)`, "i"),
  );
  if (!bh) return null;
  const b = num(bh[1]);
  const h = num(bh[3]);
  if (!b || !h) return null;
  const head = text.slice(0, bh.index + 1).toLowerCase();
  const shape = /triangul|triangle/.test(head)
    ? "triangle"
    : /parallelogram/.test(head)
      ? "parallelogram"
      : /rectangle|rectangular(?! prism)/.test(head)
        ? "rectangle"
        : null;
  if (!shape) return null;
  return areaFigure(shape, { b, h }, bh[2] || "");
}

function readPrism(text) {
  const m = text.match(
    new RegExp(
      `([\\d.,]+)\\s*(${UNIT_RE})?\\s*long,\\s*([\\d.,]+)\\s*(?:${UNIT_RE})?\\s*wide,\\s*and\\s*([\\d.,]+)\\s*(?:${UNIT_RE})?\\s*tall`,
      "i",
    ),
  );
  if (!m) return null;
  const l = num(m[1]);
  const w = num(m[3]);
  const h = num(m[4]);
  if (!l || !w || !h) return null;
  return prismFigure(l, w, h, m[2] || "");
}

function readNumberLine(text) {
  const abs = text.match(/absolute value of (-?[\d.]+)/i);
  if (abs) {
    const v = num(abs[1]);
    if (v === null) return null;
    const lim = Math.max(Math.abs(v) + 2, 4);
    return numberLineFigure({
      min: -lim,
      max: lim,
      points: [{ at: v, label: fmt(v) }],
      alt: `A number line with ${fmt(v)} marked, showing how many steps it sits from zero.`,
    });
  }
  const cmp = text.match(/compare (-?[\d.]+) and (-?[\d.]+)/i);
  if (cmp) {
    const a = num(cmp[1]);
    const b = num(cmp[2]);
    if (a === null || b === null) return null;
    const lim = Math.max(Math.abs(a), Math.abs(b)) + 2;
    return numberLineFigure({
      min: -lim,
      max: lim,
      points: [
        { at: a, label: fmt(a) },
        { at: b, label: fmt(b) },
      ],
      alt: `A number line with ${fmt(a)} and ${fmt(b)} marked so they can be compared.`,
    });
  }
  const plot = text.match(/plot (-?[\d.]+) on the number line/i);
  if (plot) {
    const v = num(plot[1]);
    if (v === null) return null;
    const lim = Math.max(Math.abs(v) + 2, 4);
    return numberLineFigure({
      min: -lim,
      max: lim,
      points: [{ at: v, label: fmt(v) }],
      alt: `A number line with ${fmt(v)} plotted.`,
    });
  }
  const ineq = text.match(/graph\s+([a-z])\s*(≥|≤|>|<)\s*(-?[\d.]+)/i);
  if (ineq) {
    const v = num(ineq[3]);
    if (v === null) return null;
    const op = ineq[2];
    const dir = op === ">" || op === "≥" ? 1 : -1;
    const closed = op === "≥" || op === "≤";
    const lim = Math.max(Math.abs(v) + 5, 6);
    return numberLineFigure({
      min: v - lim / 2,
      max: v + lim / 2,
      ray: {
        at: v,
        dir,
        closed,
        label: `${ineq[1]} ${op} ${fmt(v)}`,
        note: `${closed ? "A filled circle means " + fmt(v) + " is included." : "An open circle means " + fmt(v) + " is NOT included."} The shading goes ${dir > 0 ? "right" : "left"}.`,
      },
      alt: `A number line graphing ${ineq[1]} ${op} ${fmt(v)}: a ${closed ? "closed" : "open"} circle at ${fmt(v)} with the line shaded to the ${dir > 0 ? "right" : "left"}.`,
    });
  }
  return null;
}

function readCoordinate(text) {
  const pair = (s) => {
    const m = String(s).match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
  };
  const refl = text.match(/reflect\s*(\(\s*-?\d+\s*,\s*-?\d+\s*\))\s*over the (x|y)-axis/i);
  if (refl) {
    const p = pair(refl[1]);
    if (!p) return null;
    const axis = refl[2].toLowerCase();
    const q = axis === "y" ? { x: -p.x, y: p.y } : { x: p.x, y: -p.y };
    return coordFigure([{ ...p, label: `(${p.x}, ${p.y})` }], {
      extra: [{ ...q, label: `(${q.x}, ${q.y})` }],
      note: `The dotted point is the reflection of (${p.x}, ${p.y}) over the ${axis}-axis.`,
      alt: `A coordinate grid showing (${p.x}, ${p.y}) and its reflection over the ${axis}-axis at (${q.x}, ${q.y}).`,
    });
  }
  const dist = text.match(
    /distance from\s*(\(\s*-?\d+\s*,\s*-?\d+\s*\))\s*to\s*(\(\s*-?\d+\s*,\s*-?\d+\s*\))/i,
  );
  if (dist) {
    const a = pair(dist[1]);
    const b = pair(dist[2]);
    if (!a || !b) return null;
    return coordFigure(
      [
        { ...a, label: `(${a.x}, ${a.y})` },
        { ...b, label: `(${b.x}, ${b.y})` },
      ],
      {
        connect: true,
        note: "Count the units along the dashed line to find the distance.",
        alt: `A coordinate grid with (${a.x}, ${a.y}) and (${b.x}, ${b.y}) plotted and joined, so the distance between them can be counted.`,
      },
    );
  }
  if (!/\bplot\b/i.test(text)) return null;
  // Take EVERY ordered pair the example plots, not just the first: a lesson
  // that builds (1, 2), (2, 4), (3, 6) into a line is misrepresented by a grid
  // showing one lonely dot. The origin is dropped — the grid already draws it,
  // and "I start at the origin (0, 0)" is narration, not a plotted point.
  const seen = new Set();
  const pts = [];
  const re = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    const key = `${x},${y}`;
    if ((x === 0 && y === 0) || seen.has(key)) continue;
    seen.add(key);
    pts.push({ x, y, label: `(${x}, ${y})` });
  }
  if (!pts.length || pts.length > 4) return null;
  const joins = pts.length > 2 && /\b(?:connect|straight line)\b/i.test(text);
  return coordFigure(pts, {
    polyline: joins,
    note: joins ? "The points line up straight through the origin." : "",
    alt: `A coordinate grid with ${pts.map((p) => `(${p.x}, ${p.y})`).join(", ")} plotted${joins ? ", forming a straight line through the origin" : ""}.`,
  });
}

function readEquationTape(text) {
  const sum = text.match(/solve\s+([a-z])\s*\+\s*([\d,]+)\s*=\s*([\d,]+)/i);
  if (sum) {
    const part = num(sum[2]);
    const total = num(sum[3]);
    if (part && total && total > part) return tapeSumFigure(sum[1], part, total);
  }
  const words = text.match(/\bplus ([\d,]+) more equals ([\d,]+)\b/i);
  if (words) {
    const part = num(words[1]);
    const total = num(words[2]);
    if (part && total && total > part) return tapeSumFigure("n", part, total);
  }
  const groups = text.match(/solve\s+([\d,]+)\s*([a-z])\s*=\s*([\d,]+)/i);
  if (groups) {
    const g = num(groups[1]);
    const total = num(groups[3]);
    if (g && total && g >= 2 && g <= 10) return tapeGroupsFigure(g, groups[2], total);
  }
  return null;
}

function readRatioTape(text) {
  const m = text.match(
    /(\d+)\s+(?:cups?|ounces?|tablespoons?|tbsp|parts?)\s+of\s+([a-z ]{2,22}?)\s+for every\s+(\d+)\s+(?:cups?|ounces?|tablespoons?|tbsp|parts?)\s+of\s+([a-z ]{2,22}?)[.,]/i,
  );
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  if (!(a >= 1 && a <= 8 && b >= 1 && b <= 8)) return null;
  return ratioTapeFigure(a, b, m[2].trim(), m[4].trim());
}

const READERS = [
  readArea,
  readPrism,
  readNumberLine,
  readCoordinate,
  readEquationTape,
  readRatioTape,
];

// The public entry point: a labelled picture of THIS lesson's worked example,
// or null when the text does not describe one we can draw with certainty.
export function workedFigure(cfg = {}) {
  const intro = (cfg.launch && cfg.launch.conceptIntro) || cfg.conceptIntro;
  const lines = intro && intro.iDo && Array.isArray(intro.iDo.lines) ? intro.iDo.lines : [];
  if (!lines.length) return null;
  const text = lines.join(" ").replace(/\s+/g, " ");
  for (const read of READERS) {
    let fig = null;
    try {
      fig = read(text);
    } catch {
      fig = null;
    }
    if (fig)
      return {
        kind: fig.kind,
        values: fig.values,
        alt: fig.alt,
        svg: svgWrap(fig.inner, fig.alt, fig.h),
      };
  }
  return null;
}

export const _internals = {
  readArea,
  readPrism,
  readNumberLine,
  readCoordinate,
  readEquationTape,
  readRatioTape,
};
