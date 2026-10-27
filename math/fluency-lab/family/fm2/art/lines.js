// Number-line drawing for Family Math 2.0: a scaled axis with ticks, thinned labels, fixed marks (flags, rings, dots),
// hop arcs and a highlighted stretch. Pure functions: positions come in as exact rationals and are only turned into
// pixels here. Interactive markers are HTML elements laid over this figure by the game. @fm2 FM-036 FM-012
import { add, mul, frac, toNumber } from "../rational.js";
import { PALETTE, label, line, svg } from "./base.js";

export const PAD = 28;

export function makeScale(width, min, max) {
  const lo = toNumber(min);
  const span = toNumber(max) - lo;
  const inner = width - 2 * PAD;
  const num = (v) => (typeof v === "number" ? v : toNumber(v));
  return {
    width,
    lo,
    span,
    inner,
    x: (v) => PAD + ((num(v) - lo) / span) * inner,
    at: (px) => lo + ((px - PAD) / inner) * span,
  };
}

// min, min + spacing, ... up to max (inclusive). The count is capped so a bad spec cannot flood the page.
export function gridValues(min, max, spacing, cap = 600) {
  const out = [];
  for (let i = 0; i <= cap; i += 1) {
    const v = add(min, mul(spacing, frac(i)));
    if (toNumber(v) > toNumber(max) + 1e-9) break;
    out.push(v);
  }
  return out;
}

// Keep labels that fit; the two ends win over their neighbours.
export function visibleLabels(values, scale, text) {
  const items = values.map((v) => ({ v, x: scale.x(v), t: text(v) })).sort((a, b) => a.x - b.x);
  const kept = [];
  for (const item of items) {
    const prev = kept.at(-1);
    const need = prev ? Math.max(30, (prev.t.length + item.t.length) * 4.6 + 10) : 0;
    if (!prev || item.x - prev.x >= need) kept.push(item);
    else if (item === items.at(-1)) {
      while (
        kept.length > 1 &&
        item.x - kept.at(-1).x < Math.max(30, (kept.at(-1).t.length + item.t.length) * 4.6 + 10)
      )
        kept.pop();
      kept.push(item);
    }
  }
  return kept;
}

const flag = (x, y, text, fill) =>
  `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 44}" stroke="${PALETTE.ink}" stroke-width="3"/><path d="M${x} ${y - 44} l22 8 l-22 8 z" fill="${fill}" stroke="${PALETTE.ink}" stroke-width="2"/>${label(x, y - 52, text, 14)}`;

function mark(m, scale, base) {
  const x = scale.x(m.v);
  if (m.shape === "flag") return flag(x, base, m.text, PALETTE.gold);
  const fill =
    m.shape === "start" ? PALETTE.mintSoft : m.shape === "dot" ? PALETTE.coral : PALETTE.paper;
  const stroke =
    m.shape === "dot" ? PALETTE.ink : m.shape === "start" ? PALETTE.mint : PALETTE.violet;
  const lift = m.lift || 0;
  const leader = lift ? `<line x1="${x}" y1="${base - 10}" x2="${x}" y2="${base - lift - 12}" stroke="${PALETTE.muted}" stroke-width="2" stroke-dasharray="3 3"/>` : "";
  return `${leader}<circle cx="${x}" cy="${base}" r="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/>${m.text ? label(x, base - 16 - lift, m.text, 14) : ""}`;
}

function arc(a, scale, base, index) {
  const x1 = scale.x(a.from);
  const x2 = scale.x(a.to);
  const span = Math.abs(x2 - x1);
  const rise = Math.min(46, Math.max(12, span * 0.4)) + (index % 2) * 4;
  const mid = (x1 + x2) / 2;
  const y = base - 5;
  const dir = x2 >= x1 ? 1 : -1;
  const dash = a.back ? ' stroke-dasharray="6 4"' : "";
  const head = `<path d="M${x2} ${y} l${-6 * dir} -6 l0 12 z" fill="${PALETTE.violet}"/>`;
  const text = span >= 26 ? label(mid, y - rise * 0.75 - 6, a.text, 13, PALETTE.violet) : "";
  return `<path d="M${x1} ${y} Q${mid} ${y - rise * 2} ${x2} ${y}" fill="none" stroke="${PALETTE.violet}" stroke-width="3"${dash}/>${head}${text}`;
}

// Options: width, min, max, ticks (spacing), labels (values to label), text(v) -> label string, marks, arcs, bracket,
// baseline (y of the axis), aria (accessible description of the figure).
export function numberLineSvg(o) {
  const scale = makeScale(o.width, o.min, o.max);
  const base = o.baseline ?? 100;
  const height = base + 46;
  const parts = [];
  if (o.bracket) {
    const x1 = scale.x(o.bracket.from);
    parts.push(
      `<rect x="${x1}" y="${base - 9}" width="${scale.x(o.bracket.to) - x1}" height="18" rx="4" fill="${PALETTE.goldSoft}" stroke="${PALETTE.gold}" stroke-width="2"/>`,
    );
  }
  parts.push(line(scale.x(o.min), base, scale.x(o.max), base, PALETTE.ink, 3));
  const ticks = o.ticks ? gridValues(o.min, o.max, o.ticks) : [];
  const stride =
    ticks.length > 1
      ? Math.max(1, Math.ceil(6 / Math.abs(scale.x(ticks[1]) - scale.x(ticks[0]))))
      : 1;
  ticks.forEach((v, i) => {
    if (i % stride === 0 || i === ticks.length - 1)
      parts.push(line(scale.x(v), base - 6, scale.x(v), base + 6, PALETTE.muted, 2));
  });
  for (const item of visibleLabels(o.labels || [], scale, o.text)) {
    parts.push(
      line(item.x, base - 11, item.x, base + 11, PALETTE.ink, 3),
      label(item.x, base + 32, item.t, 14),
    );
  }
  (o.arcs || []).forEach((a, i) => parts.push(arc(a, scale, base, i)));
  for (const m of o.marks || []) parts.push(mark(m, scale, base));
  return svg(
    o.width,
    height,
    parts.join(""),
    o.aria || "",
    `width="${o.width}" height="${height}"`,
  );
}

