// Shared drawing and arithmetic helpers for the percent figures (percent-grid, percent-discount, percent-whole).
// Pure string output, no DOM. Every number shown is computed with Rat (shared/motion/exact.mjs); nothing is typed.
import { Rat, commas } from "../exact.mjs";
import { windows } from "../motion.mjs";
import { COLOR, COPY_FILLS } from "../tokens.mjs";

export const PAD = 12;
/** Glyph width per font-size unit used only for fitting text; deliberately wider than the real font so lines never overflow. */
export const CH = 0.6;

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
/** @param {number} n */
export const f1 = (n) => Math.round(n * 10) / 10;
/** @param {number} w */
export const clampWidth = (w) => Math.max(300, Math.min(600, Math.round(w || 400)));
/** @param {number} a @param {number} b @returns {number} */
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** @param {number} n @param {number} [d] */
export const rat = (n, d = 1) => new Rat(BigInt(n), BigInt(d));

/**
 * Exact decimal text of a Rat: all digits when it terminates, otherwise rounded half up to four places (the lab's own
 * rounding) and flagged inexact. Thousands get commas, trailing zeros are dropped.
 * @param {Rat} r @returns {{ text: string, exact: boolean }}
 */
export function dec(r) {
  let d = r.d;
  let a = 0;
  let b = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    a++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    b++;
  }
  const exact = d === 1n;
  const digits = exact ? Math.max(a, b) : 4;
  const neg = r.n < 0n;
  const n = neg ? -r.n : r.n;
  const scale = 10n ** BigInt(digits);
  const q = exact ? (n * scale) / r.d : (n * scale * 2n + r.d) / (2n * r.d);
  const s = q.toString().padStart(digits + 1, "0");
  const whole = s.slice(0, s.length - digits);
  const frac = s.slice(s.length - digits).replace(/0+$/, "");
  return { text: (neg ? "−" : "") + commas(BigInt(whole)) + (frac ? `.${frac}` : ""), exact };
}

/** Pick the right relation sign for a number that may be rounded. @param {{ exact: boolean }} v */
export const rel = (v) => (v.exact ? "=" : "≈");

/** Greedy benchmark pieces of p percent. @param {number} p @param {number[]} denoms @returns {Array<{ size: number, count: number, from: number, to: number, i: number }>} */
export function pieces(p, denoms) {
  const out = [];
  let left = p;
  let at = 0;
  for (const size of denoms) {
    const count = Math.floor(left / size);
    if (!count) continue;
    out.push({ size, count, from: at, to: at + size * count, i: out.length });
    at += size * count;
    left -= size * count;
  }
  return out;
}

/** Keep a short expression on one line: spaces become no-break spaces. @param {string} s */
export const nb = (s) => s.replace(/ /g, "\u00a0");

/** @param {string} lang @param {string} en @param {string} es */
export const T = (lang, en, es) => (lang === "es" ? es : en);

/** @param {number} x @param {number} y @param {unknown} body @param {{size?: number, weight?: number, anchor?: string, fill?: string, cls?: string}} [o] */
export function text(x, y, body, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, cls = "" } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${cls ? ` class="${cls}"` : ""}>${esc(body)}</text>`;
}

/** Split on spaces into lines of at most maxCh characters. @param {string} s @param {number} maxCh */
export function wrap(s, maxCh) {
  const lines = [];
  let cur = "";
  for (const w of s.split(" ")) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxCh && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Wrapped text block. y is the first baseline. @param {number} x @param {number} y @param {string} s
 * @param {{ width: number, size?: number, weight?: number, anchor?: string, fill?: string, lineH?: number }} o
 * @returns {{ svg: string, h: number, lines: string[] }}
 */
export function block(x, y, s, o) {
  const size = o.size || 14;
  const lineH = o.lineH || Math.round(size * 1.25 + 1);
  const lines = wrap(s, Math.max(8, Math.floor(o.width / (size * CH))));
  const svg = lines.map((l, i) => text(x, y + i * lineH, l, { size, weight: o.weight, anchor: o.anchor || "start", fill: o.fill })).join("");
  return { svg, h: lines.length * lineH, lines };
}

/** @param {number} n @param {number} d @param {number} size */
export const fracWidth = (n, d, size) => Math.max(String(n).length, String(d).length) * size * CH + 10;

/** A stacked fraction centred on (cx, cy): numerator, bar, denominator. @param {number} cx @param {number} cy @param {string|number} n @param {string|number} d @param {number} size */
export function fraction(cx, cy, n, d, size) {
  const w = fracWidth(n, d, size);
  return (
    text(cx, cy - 4, n, { size, weight: 700 }) +
    `<line x1="${f1(cx - w / 2)}" y1="${f1(cy)}" x2="${f1(cx + w / 2)}" y2="${f1(cy)}" stroke="${COLOR.ink}" stroke-width="1.6"/>` +
    text(cx, cy + size, d, { size, weight: 700 })
  );
}

/**
 * A row of equivalent forms joined by "=": items are { frac: [n, d] } or { txt }. Returns the svg and its height.
 * @param {number} W @param {number} y top @param {Array<{ frac?: [number, number], txt?: string }>} items
 */
export function equivalents(W, y, items) {
  const avail = W - 2 * PAD;
  let size = 18;
  /** @param {number} s */
  const width = (s) => items.reduce((t, it) => t + (it.frac ? fracWidth(it.frac[0], it.frac[1], s) : String(it.txt).length * s * CH + 4), 0) + (items.length - 1) * (s * 1.5);
  while (size > 13 && width(size) > avail) size--;
  const cy = y + size + 6;
  let x = PAD + (avail - width(size)) / 2;
  let svg = "";
  items.forEach((it, i) => {
    if (i) {
      svg += text(x + size * 0.75, cy + size * 0.33, "=", { size, weight: 700 });
      x += size * 1.5;
    }
    if (it.frac) {
      const w = fracWidth(it.frac[0], it.frac[1], size);
      svg += fraction(x + w / 2, cy, it.frac[0], it.frac[1], size);
      x += w;
    } else {
      const w = String(it.txt).length * size * CH + 4;
      svg += text(x + w / 2, cy + size * 0.33, it.txt, { size, weight: 700 });
      x += w;
    }
  });
  return { svg, h: size * 2 + 14 };
}

/** @param {number} cx @param {number} cy @param {number} n */
export function badge(cx, cy, n) {
  return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="9" fill="${COLOR.navy}"/>${text(cx, cy + 4.5, n, { size: 13, weight: 700, fill: COLOR.white })}`;
}

/** The fill that tells piece i apart; its outline (solid or dashed) and number carry the identity too. @param {number} i */
export const fillOf = (i) => COPY_FILLS[i % COPY_FILLS.length];
/** @param {number} i */
export const dashOf = (i) => (i % 2 ? ' stroke-dasharray="4 2.5"' : "");

/**
 * One legend row: badge, bold expression, running total at the right, a muted detail line (wrapped) under it.
 * @param {{ x: number, y: number, w: number, step: number, n: number, expr: string, total: string, detail: string }} o
 */
export function legendRow(o) {
  const d = block(o.x + 26, o.y + 33, o.detail, { width: o.w - 26, size: 13, fill: COLOR.muted, lineH: 17 });
  const svg = `<g class="pm-row" data-step="${o.step}">${badge(o.x + 9, o.y + 9, o.n)}${text(o.x + 26, o.y + 14, o.expr, { weight: 700, anchor: "start" })}${text(o.x + o.w, o.y + 14, o.total, { weight: 700, anchor: "end" })}${d.svg}</g>`;
  return { svg, h: 24 + d.lines.length * 17 + 6 };
}

/**
 * A boxed statement: solid green with a check, or dashed red with a cross and the words "Not this" supplied by the caller.
 * @param {{ x: number, y: number, w: number, kind: "ok" | "no", lines: string[] }} o
 */
export function callout(o) {
  const color = o.kind === "ok" ? COLOR.success : COLOR.error;
  const inner = o.w - 48;
  const rows = o.lines.flatMap((l, i) => block(0, 0, l, { width: inner, weight: i === 0 ? 700 : 400, size: 14 }).lines.map((t) => ({ t, bold: i === 0 })));
  const h = 18 + rows.length * 18;
  const icon = o.kind === "ok" ? `<path d="M${f1(o.x + 12)} ${f1(o.y + 18)} l5 6 l10 -12" fill="none" stroke="${color}" stroke-width="3"/>` : `<path d="M${f1(o.x + 12)} ${f1(o.y + 12)} l14 14 M${f1(o.x + 26)} ${f1(o.y + 12)} l-14 14" fill="none" stroke="${color}" stroke-width="3"/>`;
  const body = rows.map((r, i) => text(o.x + 38, o.y + 22 + i * 18, r.t, { weight: r.bold ? 700 : 400, anchor: "start" })).join("");
  const svg = `<g class="pm-final"><rect x="${f1(o.x)}" y="${f1(o.y)}" width="${f1(o.w)}" height="${h}" rx="8" fill="none" stroke="${color}" stroke-width="2"${o.kind === "no" ? ' stroke-dasharray="6 4"' : ""}/>${icon}${body}</g>`;
  return { svg, h: h + 10 };
}

/**
 * A tape diagram on a 0-extent percent scale. Pieces are drawn in their own fills with numbered badges beneath; an optional
 * dashed remainder shows what is left of the whole; brackets under the tape name the shaded part and the rest.
 * @param {{ W: number, y: number, extent: number, pieces: ReturnType<typeof pieces>, remainderFrom?: number, wholeLabel: string, brackets: Array<{ from: number, to: number, label: string, dashed?: boolean }>, pieceStep?: (i: number) => number }} o
 */
export function tape(o) {
  const x0 = PAD + 2;
  const w = o.W - 2 * PAD - 4;
  /** @param {number} pct */
  const sx = (pct) => x0 + (pct / o.extent) * w;
  const H = 34;
  let y = o.y;
  let svg = "";
  const top = block(sx(50), y + 14, o.wholeLabel, { width: Math.min(sx(100) - x0, o.W - 2 * PAD), anchor: "middle", weight: 700 });
  svg += top.svg;
  y += top.h + 2;
  svg += `<path d="M${f1(sx(0))} ${f1(y + 7)} V${f1(y)} H${f1(sx(100))} V${f1(y + 7)}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6"/>`;
  y += 12;
  const tapeTop = y;
  svg += `<rect x="${f1(x0)}" y="${f1(tapeTop)}" width="${f1(w)}" height="${H}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  if (o.remainderFrom !== undefined) svg += `<rect class="pm-rest" x="${f1(sx(o.remainderFrom))}" y="${f1(tapeTop + 1)}" width="${f1(sx(100) - sx(o.remainderFrom))}" height="${H - 2}" fill="none" stroke="${COLOR.ink}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
  /** @type {Array<{ cx: number, n: number, step: number }>} */
  const badges = [];
  for (const g of o.pieces) {
    const pw = sx(g.to) - sx(g.from);
    svg += `<g class="pm-pop" data-step="${g.i + 1}"><rect x="${f1(sx(g.from))}" y="${f1(tapeTop)}" width="${f1(pw)}" height="${H}" fill="${fillOf(g.i)}"${pw >= 6 ? ` stroke="${COLOR.ink}" stroke-width="1.2"${dashOf(g.i)}` : ""}/></g>`;
    badges.push({ cx: sx((g.from + g.to) / 2), n: g.i + 1, step: g.i + 1 });
  }
  for (let t = 10; t < o.extent; t += 10) svg += `<line x1="${f1(sx(t))}" y1="${f1(tapeTop + H - 7)}" x2="${f1(sx(t))}" y2="${f1(tapeTop + H)}" stroke="${COLOR.muted}" stroke-width="1"/>`;
  if (o.extent > 100) svg += `<line x1="${f1(sx(100))}" y1="${f1(tapeTop - 6)}" x2="${f1(sx(100))}" y2="${f1(tapeTop + H + 4)}" stroke="${COLOR.ink}" stroke-width="2" stroke-dasharray="5 3"/>`;
  // numbered badges under the tape; a badge that would touch its neighbour moves to a lower row, joined to its piece by a leader
  const bottom = tapeTop + H;
  /** @type {number[]} */
  const lastX = [];
  for (const b of [...badges].sort((a, c) => a.cx - c.cx)) {
    const cx = Math.max(x0 + 9, Math.min(b.cx, x0 + w - 9));
    let r = lastX.findIndex((last) => cx - last >= 21);
    if (r < 0) r = lastX.length;
    lastX[r] = cx;
    const cy = bottom + 15 + r * 21;
    svg += `<g class="pm-pop" data-step="${b.step}"><line x1="${f1(b.cx)}" y1="${f1(bottom)}" x2="${f1(cx)}" y2="${f1(cy - 9)}" stroke="${COLOR.ink}" stroke-width="1"/>${badge(cx, cy, b.n)}</g>`;
  }
  y = bottom + (badges.length ? 15 + lastX.length * 21 : 4) + 4;
  for (const br of o.brackets) {
    const a = sx(br.from);
    const b = sx(br.to);
    svg += `<g class="pm-final"><path d="M${f1(a)} ${f1(y)} V${f1(y + 7)} H${f1(b)} V${f1(y)}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6"${br.dashed ? ' stroke-dasharray="5 3"' : ""}/>`;
    const half = Math.min(o.W - 2 * PAD, br.label.length * 14 * CH) / 2;
    const cx = Math.max(PAD + half, Math.min((a + b) / 2, o.W - PAD - half));
    const t = block(cx, y + 25, br.label, { width: o.W - 2 * PAD, anchor: "middle", weight: 700 });
    svg += `${t.svg}</g>`;
    y += 14 + t.h + 8;
  }
  return { svg, bottom: y };
}

/**
 * The scene: step 1, 2, ... appear one after another (everything marked data-step="i"), then the .pm-final blocks.
 * Pieces marked .pm-pop pop in; everything else rises. Fractions of the scene, deterministic.
 * @param {ParentNode} root
 */
export function stepScene(root) {
  const all = [...root.querySelectorAll("[data-step]")];
  const steps = [...new Set(all.map((e) => Number(e.getAttribute("data-step"))))].sort((a, b) => a - b);
  const finals = [...root.querySelectorAll(".pm-final")];
  const slots = windows(steps.length + 1);
  const rise = [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }];
  const pop = [
    { opacity: 0, transform: "scale(0.85)", transformBox: "fill-box", transformOrigin: "center" },
    { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" },
  ];
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  steps.forEach((s, i) => {
    const { from, to } = slots[i];
    const end = from + (to - from) * 0.6;
    const mine = all.filter((e) => Number(e.getAttribute("data-step")) === s);
    tracks.push({ els: mine.filter((e) => e.classList.contains("pm-pop")), from, to: end, keyframes: pop });
    tracks.push({ els: mine.filter((e) => !e.classList.contains("pm-pop")), from, to: end, keyframes: rise });
  });
  const last = slots[steps.length];
  const span = last.to - last.from;
  finals.forEach((el, i) => {
    const a = last.from + (span * 0.6 * i) / Math.max(1, finals.length);
    tracks.push({ els: [el], from: a, to: Math.min(1, a + span * 0.4), keyframes: rise });
  });
  return { durationMs: Math.max(2200, Math.min(8500, 1100 * (steps.length + 2))), tracks: tracks.filter((t) => t.els.length) };
}

/**
 * The name of a benchmark piece: 10% is one tenth, 25% one fourth, 50% half. `whole` names 100% in the caller's picture.
 * @param {string} lang @param {number} size @param {number} count @param {{ en: string, es: string }} whole
 */
export function benchmarkWord(lang, size, count, whole) {
  const es = lang === "es";
  if (size === 100) return count === 1 ? whole[lang === "es" ? "es" : "en"] : `${count} ${es ? "totales" : "wholes"}`;
  if (size === 50) return es ? "la mitad" : "half";
  if (size === 25) return es ? "un cuarto" : "one fourth";
  const names = /** @type {Record<number, [string, string, string, string]>} */ ({
    10: ["one tenth", "tenths", "un décimo", "décimos"],
    5: ["one twentieth", "twentieths", "un veinteavo", "veinteavos"],
    1: ["one hundredth", "hundredths", "un centésimo", "centésimos"],
  })[size];
  if (es) return count === 1 ? names[2] : `${count} ${names[3]}`;
  return count === 1 ? names[0] : `${count} ${names[1]}`;
}

/** "+ 2 × 10%" for the i-th piece. @param {{ size: number, count: number, i: number }} g */
export const pieceExpr = (g) => `${g.i ? "+ " : ""}${g.count > 1 ? `${g.count} × ` : ""}${g.size}%`;
