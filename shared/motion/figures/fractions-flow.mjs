// Inline layout with stacked fractions for the fraction figures. A line is a list of atoms: words, and fractions drawn as
// numerator over a bar over denominator (never "3/4" inline). Atoms wrap between chunks; an atom marked `nb` stays with the one
// before it, so "5 1/2 × 3/4 = 4 1/8" never splits. Pure string output.
import { COLOR } from "../tokens.mjs";

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
export const f1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;

/** @typedef {{ k: "w", s: string, bold?: boolean, fill?: string, nb?: boolean, tight?: boolean }} Word */
/** @typedef {{ k: "m", wh: string, n: string, d: string, bold?: boolean, fill?: string, nb?: boolean, tight?: boolean }} Frac a fraction, with a whole part when `wh` is not empty */
/** @typedef {Word | Frac} Atom */

/** @param {string} s @param {Partial<Word>} [o] @returns {Word} */
export const w = (s, o = {}) => ({ k: "w", s, ...o });
/** An operator glued to the atom before it. @param {string} s @returns {Word} */
export const op = (s) => w(s, { nb: true });
/** @param {number | string | bigint} n @param {number | string | bigint} d @returns {Frac} */
export const fr = (n, d) => ({ k: "m", wh: "", n: String(n), d: String(d) });

/** A Rat as a whole number, a stacked fraction, or a stacked mixed number. @param {import("../exact.mjs").Rat} r @returns {Atom} */
export function num(r) {
  const whole = r.n / r.d;
  const rem = r.n % r.d;
  if (rem === 0n) return w(String(whole));
  return { k: "m", wh: whole === 0n ? "" : String(whole), n: String(rem), d: String(r.d) };
}

/** Everything after the first atom stays with it. @param {Atom[]} items @returns {Atom[]} */
export const expr = (...items) => items.map((it, i) => (i ? { ...it, nb: true } : it));

/** A sentence as word atoms. @param {string} s @param {Partial<Word>} [o] @returns {Atom[]} */
export const words = (s, o = {}) => s.split(" ").filter(Boolean).map((t) => w(t, o));

/**
 * @param {Atom[]} items
 * @param {{ x: number, y: number, w: number, size?: number, weight?: number, fill?: string, align?: "start" | "middle", wrap?: boolean, lineGap?: number }} o
 * @returns {{ svg: string, h: number, endX: number, endY: number, maxW: number }} h: height used; endX/endY: where the last atom ends (baseline)
 */
export function flow(items, o) {
  const size = o.size ?? 14;
  const weight = o.weight ?? 400;
  const dfill = o.fill ?? COLOR.ink;
  const wrap = o.wrap !== false;
  const gap = size * 0.3;
  const bold = (/** @type {Atom} */ it) => it.bold ?? weight >= 700;
  const wd = items.map((it) => (it.k === "w" ? it.s.length * size * (bold(it) ? 0.6 : 0.56) : (it.wh ? it.wh.length * size * 0.62 + 5 : 0) + Math.max(it.n.length, it.d.length) * size * 0.56 + 7));
  const before = (/** @type {number} */ i) => (i === 0 || items[i].tight ? 0 : gap);
  /** @type {number[][]} */
  const chunks = [];
  items.forEach((it, i) => {
    if (i && (it.nb || it.tight)) chunks[chunks.length - 1].push(i);
    else chunks.push([i]);
  });
  const chunkW = (/** @type {number[]} */ c) => c.reduce((s, i, k) => s + wd[i] + (k ? before(i) : 0), 0);
  /** @type {number[][]} */
  const lines = [];
  /** @type {number[]} */
  let cur = [];
  let curW = 0;
  for (const c of chunks) {
    const cw = chunkW(c);
    const add = cur.length ? gap + cw : cw;
    if (wrap && cur.length && curW + add > o.w) {
      lines.push(cur);
      cur = [...c];
      curW = cw;
    } else {
      cur.push(...c);
      curW += add;
    }
  }
  if (cur.length) lines.push(cur);

  let y = o.y;
  let out = "";
  let endX = o.x;
  let endY = o.y;
  let maxW = 0;
  const txt = (/** @type {number} */ x, /** @type {number} */ by, /** @type {string} */ s, /** @type {boolean} */ b, /** @type {string} */ f, /** @type {string} */ anchor = "start") => `<text x="${f1(x)}" y="${f1(by)}" text-anchor="${anchor}" font-size="${size}" font-weight="${b ? 700 : 400}" fill="${f}">${esc(s)}</text>`;
  for (const ln of lines) {
    const hasFrac = ln.some((i) => items[i].k === "m");
    const asc = hasFrac ? size * 1.02 + 4 : size * 0.8 + 1;
    const desc = hasFrac ? size * 0.42 + 5 : size * 0.28 + 1;
    const lw = chunkW(ln);
    maxW = Math.max(maxW, lw);
    let x = o.align === "middle" ? o.x + Math.max(0, (o.w - lw) / 2) : o.x;
    const by = y + asc;
    /** @type {{ x: number, s: string, b: boolean, f: string } | null} */
    let run = null;
    const flush = () => {
      if (run) out += txt(run.x, by, run.s, run.b, run.f);
      run = null;
    };
    ln.forEach((i, k) => {
      const it = items[i];
      if (k) x += before(i);
      const b = bold(it);
      const f = it.fill ?? dfill;
      if (it.k === "w") {
        if (run && run.b === b && run.f === f) run.s += (it.tight ? "" : " ") + it.s;
        else {
          flush();
          run = { x, s: it.s, b, f };
        }
      } else {
        flush();
        const whW = it.wh ? it.wh.length * size * 0.62 + 5 : 0;
        const fw = Math.max(it.n.length, it.d.length) * size * 0.56 + 7;
        const fx = x + whW;
        const axis = by - 0.3 * size;
        if (it.wh) out += txt(x, by, it.wh, b, f);
        out += txt(fx + fw / 2, axis - 3, it.n, b, f, "middle");
        out += `<line x1="${f1(fx + 1)}" y1="${f1(axis)}" x2="${f1(fx + fw - 1)}" y2="${f1(axis)}" stroke="${f}" stroke-width="1.6"/>`;
        out += txt(fx + fw / 2, axis + 3 + 0.74 * size, it.d, b, f, "middle");
      }
      x += wd[i];
    });
    flush();
    endX = x;
    endY = by;
    y += asc + desc + (o.lineGap ?? 3);
  }
  return { svg: out, h: y - o.y, endX, endY, maxW };
}
