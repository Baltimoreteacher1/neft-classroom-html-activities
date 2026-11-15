// Shared drawing and scene helpers for the expressions-group figures (expressions, factors). Pure string output: no DOM, no
// clock, no randomness. Every number drawn comes from the figure's model; this file only places and animates.
import { windows } from "../motion.mjs";
import { COLOR, COPY_FILLS } from "../tokens.mjs";

export const PAD = 12;
export const INNER = 10;

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
export const f1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
/** The drawing width a figure uses: 300 is a phone, 640 the widest the mount draws. @param {number} w */
export const clampW = (w) => Math.max(300, Math.min(640, Math.round(w || 400)));
/** @param {"en" | "es"} lang @param {string} en @param {string} es */
export const pick = (lang, en, es) => (lang === "es" ? es : en);
/** @param {number} n @param {string} one @param {string} many */
export const plural = (n, one, many) => (n === 1 ? one : many);

/** Estimated rendered width in px (a little generous, so layouts leave slack). @param {string} s @param {number} size @param {number} [weight] */
export const tw = (s, size, weight = 400) => s.length * size * (weight >= 700 ? 0.62 : 0.58);

/**
 * @param {number} x @param {number} y @param {string} body
 * @param {{ size?: number, weight?: number, anchor?: "start" | "middle" | "end", fill?: string, cls?: string }} [o]
 */
export function text(x, y, body, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, cls = "" } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${cls ? ` class="${cls}"` : ""}>${esc(body)}</text>`;
}

/** Greedy word wrap to a pixel width. @param {string} str @param {number} maxPx @param {number} size @param {number} [weight] */
export function wrapWords(str, maxPx, size, weight = 400) {
  /** @type {string[]} */
  const lines = [];
  let cur = "";
  for (const w of str.split(" ")) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && tw(next, size, weight) > maxPx) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Wrap an arithmetic chain such as "3 × 2 + 3 × 4 = 6 + 12 = 18". A line may end after an operator or begin with "=", and "=" never
 * parts from the number that follows it. @param {string} chain @param {number} maxPx @param {number} size @param {number} [weight]
 */
export function wrapChain(chain, maxPx, size, weight = 700) {
  if (tw(chain, size, weight) <= maxPx) return [chain];
  const atoms = chain.split(" ");
  /** @type {string[]} */
  const lines = [];
  let cur = "";
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i];
    const glue = a === "=" && atoms[i + 1] !== undefined ? `${a} ${atoms[++i]}` : a;
    const next = cur ? `${cur} ${glue}` : glue;
    const canBreak = cur && (/[×+−]$/.test(cur) || glue.startsWith("="));
    if (canBreak && tw(next, size, weight) > maxPx) {
      lines.push(cur);
      cur = glue;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Text lines drawn one under another, returns the markup and the y after the last line. @param {number} x @param {number} y @param {string[]} rows @param {number} lh @param {Parameters<typeof text>[3]} o */
export function textLines(x, y, rows, lh, o) {
  let out = "";
  let yy = y;
  for (const l of rows) {
    out += text(x, yy, l, o);
    yy += lh;
  }
  return { svg: out, y: yy };
}

/** A card frame: solid for the right idea, dashed for the "not this" one. @param {number} x @param {number} y @param {number} w @param {number} h @param {boolean} [dashed] */
export const frame = (x, y, w, h, dashed = false) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="10" fill="${COLOR.white}" stroke="${dashed ? COLOR.error : COLOR.ink}" stroke-width="${dashed ? 2 : 1.5}"${dashed ? ' stroke-dasharray="7 4"' : ""}/>`;

/** The numbered badge at a card's corner. @param {number} x @param {number} y @param {number} n */
export const badge = (x, y, n) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="11" fill="${COLOR.navy}"/>${text(x, y + 5, String(n), { size: 14, weight: 700, fill: COLOR.white })}`;

/** Wrap markup in an animated step group. @param {number} step @param {string} inner @param {string} [cls] */
export const group = (step, inner, cls = "ex-card") => `<g class="${cls}" data-step="${step}">${inner}</g>`;
/** An animated part of a step (pops in after its card). @param {number} step @param {string} inner @param {string} [from] "dx,dy" start offset when the part moves in */
export const part = (step, inner, from = "") => `<g class="ex-part" data-step="${step}"${from ? ` data-from="${from}"` : ""}>${inner}</g>`;

/**
 * A verdict pill: a check inside a solid green box when the two things agree, a cross inside a dashed red box when they do not.
 * Returns the markup and its height. @param {number} x @param {number} y @param {number} w @param {boolean} ok @param {string[]} lines
 */
export function pill(x, y, w, ok, lines) {
  const h = 12 + lines.length * 18;
  const col = ok ? COLOR.success : COLOR.error;
  const icon = ok
    ? `<path d="M${f1(x + 12)} ${f1(y + h / 2)} l5 6 l10 -12" fill="none" stroke="${col}" stroke-width="3"/>`
    : `<path d="M${f1(x + 12)} ${f1(y + h / 2 - 7)} l14 14 M${f1(x + 26)} ${f1(y + h / 2 - 7)} l-14 14" fill="none" stroke="${col}" stroke-width="3"/>`;
  const body = lines.map((l, i) => text(x + 38, y + 20 + i * 18, l, { size: 14, weight: 700, anchor: "start" })).join("");
  const box = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${h}" rx="8" fill="none" stroke="${col}" stroke-width="2"${ok ? "" : ' stroke-dasharray="6 4"'}/>`;
  return { svg: `${box}${icon}${body}`, h };
}

/** A down arrow with its operation written beside it. @param {number} x @param {number} y @param {number} h @param {string} label @param {number} maxPx */
export function downArrow(x, y, h, label, maxPx) {
  const arrow = `<path d="M${f1(x)} ${f1(y)} L${f1(x)} ${f1(y + h - 3)} M${f1(x - 5)} ${f1(y + h - 10)} L${f1(x)} ${f1(y + h - 3)} L${f1(x + 5)} ${f1(y + h - 10)}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
  const t = wrapWords(label, maxPx, 14, 700);
  return { svg: arrow + textLines(x + 12, y + h / 2 + 5 - ((t.length - 1) * 8), t, 16, { size: 14, weight: 700, anchor: "start" }).svg };
}

/** Swatches that say what each fill and outline means (so colour is never the only cue). @param {number} x @param {number} y @param {"solid" | "dashed"} style @param {number} fillIdx */
export const swatch = (x, y, style, fillIdx) => `<rect x="${f1(x)}" y="${f1(y)}" width="18" height="14" rx="3" fill="${COPY_FILLS[fillIdx]}" fill-opacity="0.7" stroke="${COLOR.ink}" stroke-width="1.4"${style === "dashed" ? ' stroke-dasharray="4 2.5"' : ""}/>`;

const rise = [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }];
const fade = [{ opacity: 0 }, { opacity: 1 }];
const pop = [{ opacity: 0, transform: "scale(0.85)", transformBox: "fill-box", transformOrigin: "center" }, { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" }];

/** Scene length: about a second a step, never under 1.8 s or over 9 s. @param {number} steps */
export const durationFor = (steps) => Math.max(1800, Math.min(9000, 1100 * (steps + 1)));

/**
 * One window per step. Inside a step: the card rises, its parts arrive one after another (a part with data-from slides in from that
 * offset instead of popping), its links fade in last. The first keyframe is the transient state; the last is the drawn picture.
 * @param {ParentNode} root @param {number} steps
 */
export function stepScene(root, steps) {
  const slots = windows(steps);
  /** @type {Array<{ els: Element[], from: number, to: number, keyframes: Keyframe[] }>} */
  const tracks = [];
  const all = (/** @type {string} */ sel) => [...root.querySelectorAll(sel)];
  slots.forEach(({ from, to }, i) => {
    const n = i + 1;
    const len = to - from;
    tracks.push({ els: all(`.ex-card[data-step="${n}"]`), from, to: from + len * 0.3, keyframes: rise });
    const parts = all(`.ex-part[data-step="${n}"]`);
    const k = Math.max(1, parts.length);
    parts.forEach((el, c) => {
      const a = from + len * (0.2 + (0.55 * c) / k);
      const mv = el.getAttribute("data-from");
      const keyframes = mv ? [{ opacity: 0, transform: `translate(${mv.split(",")[0]}px, ${mv.split(",")[1]}px)` }, { opacity: 1, transform: "none" }] : pop;
      tracks.push({ els: [el], from: a, to: Math.min(to, a + len * 0.3), keyframes });
    });
    tracks.push({ els: all(`.ex-link[data-step="${n}"]`), from: from + len * 0.5, to: from + len * 0.9, keyframes: fade });
  });
  return { durationMs: durationFor(steps), tracks };
}

/**
 * Centre labels on given x positions; when two would touch, the later one drops to the next row. Everything stays inside the width.
 * @param {Array<{ cx: number, str: string }>} items @param {number} W @param {number} y baseline of the first row @param {number} lh row height
 * @param {{ size?: number, weight?: number, up?: boolean }} [o] up: later rows go upward
 */
export function placeLabels(items, W, y, lh, o = {}) {
  const { size = 13, weight = 700, up = false } = o;
  /** @type {number[]} */
  const right = [];
  let out = "";
  for (const it of [...items].sort((p, q) => p.cx - q.cx)) {
    const w = tw(it.str, size, weight);
    const cx = Math.max(PAD + w / 2, Math.min(W - PAD - w / 2, it.cx));
    let row = 0;
    while ((right[row] ?? -1e9) + 8 > cx - w / 2) row++;
    right[row] = cx + w / 2;
    out += text(cx, y + (up ? -row : row) * lh, it.str, { size, weight });
  }
  return { svg: out, rows: Math.max(1, right.length) };
}
