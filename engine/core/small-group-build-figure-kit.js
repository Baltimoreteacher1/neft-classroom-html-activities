// Drawing helpers shared by the two Build-figure modules
// (small-group-build-figures.js, small-group-build-figures-shapes.js).

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** 1200 → "1,200", -3 → "−3", 2.50 → "2.5" — one grouping rule, so an axis never mixes 9600 and 16,800. */
export function fmt(n) {
  if (typeof n !== "number") return String(n);
  const neg = n < 0;
  const abs = Math.abs(Math.round(n * 1e6) / 1e6);
  const [int, dec] = String(abs).split(".");
  const grouped = int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : int;
  return `${neg ? "−" : ""}${grouped}${dec ? `.${dec}` : ""}`;
}

export function svg(w, h, body, label) {
  return `<svg class="sgf-svg" viewBox="0 0 ${Math.ceil(w)} ${Math.ceil(h)}" width="${Math.ceil(w)}" height="${Math.ceil(h)}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

const FRACTION = /(\d+)?\{(\d+)\/(\d+)\}/g;

/** Estimated rendered width of a label at `size` px (fractions count as one narrow column). */
export function textWidth(s, size = 15) {
  const str = String(s ?? "").replace(
    FRACTION,
    (_, w, n, d) => `${w || ""}${n.length >= d.length ? n : d}`,
  );
  return str.length * size * 0.6 + 8;
}

/**
 * A label. Authored fractions ({3/4}, 2{1/2}) are set stacked, the way a
 * printed number line shows them. SVG cannot measure text while the string is
 * built, so widths are estimated from character counts at the label size —
 * close enough to centre a label on a tick.
 */
export function text(x, y, s, cls = "sgf-t", anchor = "middle", size = 15) {
  const str = String(s ?? "");
  if (!str.includes("{")) {
    return `<text class="${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}">${esc(str)}</text>`;
  }
  const cw = size * 0.6;
  const parts = [];
  let last = 0;
  for (const m of str.matchAll(FRACTION)) {
    if (m.index > last) parts.push({ t: str.slice(last, m.index) });
    if (m[1]) parts.push({ t: m[1] });
    parts.push({ n: m[2], d: m[3] });
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push({ t: str.slice(last) });
  const width = (p) =>
    p.t !== undefined ? p.t.length * cw : Math.max(p.n.length, p.d.length) * cw * 0.78 + 7;
  const total = parts.reduce((a, p) => a + width(p), 0);
  let cx = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;
  let out = "";
  for (const p of parts) {
    const w = width(p);
    if (p.t !== undefined) {
      // SVG collapses edge spaces inside <text>; keep the gap next to a fraction.
      out += `<text class="${cls}" x="${cx.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="start">${esc(p.t).replace(/ /g, "\u00a0")}</text>`;
    } else {
      const mid = cx + w / 2;
      out += `<text class="${cls} sgf-frac" x="${mid.toFixed(1)}" y="${(y - size * 0.55).toFixed(1)}" text-anchor="middle">${esc(p.n)}</text>`;
      out += `<line class="sgf-fracbar" x1="${(cx + 1).toFixed(1)}" y1="${(y - size * 0.38).toFixed(1)}" x2="${(cx + w - 1).toFixed(1)}" y2="${(y - size * 0.38).toFixed(1)}"/>`;
      out += `<text class="${cls} sgf-frac" x="${mid.toFixed(1)}" y="${(y + size * 0.42).toFixed(1)}" text-anchor="middle">${esc(p.d)}</text>`;
    }
    cx += w;
  }
  return `<g aria-label="${esc(str.replace(FRACTION, (_, w, n, d) => `${w ? `${w} and ` : ""}${n}/${d}`))}">${out}</g>`;
}

/** Escape, then typeset the authored math notation: {3/4}, 2{1/2}, ⟶. */
export function mathHtml(value) {
  return esc(value)
    .replace(
      /(\d+)?\{(\d+)\/(\d+)\}/g,
      (_, whole, n, d) =>
        `${whole ? `<span class="sgb-whole">${whole}</span>` : ""}<span class="sgb-frac" role="math" aria-label="${whole ? `${whole} and ` : ""}${n} over ${d}"><span class="sgb-n">${n}</span><span class="sgb-d">${d}</span></span>`,
    )
    .replace(/\s*⟶\s*/g, ' <span class="sgb-arrow" aria-label="then">⟶</span> ');
}

const VULGAR = { "½": "1/2", "¼": "1/4", "¾": "3/4", "⅓": "1/3", "⅔": "2/3" };

/** The number a typed answer states — "3 1/2", "3½", "7/2", "3.50", "-4" — or null. */
export function numericValue(value) {
  const s = String(value ?? "")
    .trim()
    .replace(/[½¼¾⅓⅔]/g, (c) => ` ${VULGAR[c]}`)
    .replace(/\{(\d+)\/(\d+)\}/g, " $1/$2")
    .replace(/[−–]/g, "-")
    .replace(/[,$%]/g, "")
    .trim();
  let m = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  m = s.match(/^-?\d*\.?\d+$/);
  return m ? Number(s) : null;
}
