/** Shared drawing helpers for the Studio's pure-SVG model builders. No DOM; every function returns a string. */
export const INK = "#142c3b", TEAL = "#14594f", ORANGE = "#b53e20", LIME = "#e4efbb", MINT = "#dbece5", PEACH = "#f6cfbb", MUTED = "#405764", BLUE = "#124f7a";
export const esc = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export const f2 = (n) => (Number.isInteger(n) ? String(n) : Number(n.toFixed(2)).toString());
export const usd = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
export const W = 360;
export const text = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size || 13}" fill="${o.fill || INK}" text-anchor="${o.anchor || "start"}"${o.bold ? ' font-weight="700"' : ""}>${esc(s)}</text>`;
export const rect = (x, y, w, h, fill, stroke = TEAL, extra = "") =>
  `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(Math.max(0, w))}" height="${f2(h)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${extra}/>`;
export const line = (x1, y1, x2, y2, stroke = MUTED, extra = "") => `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
export const svg = (label, h, body) => `<svg class="wb-svg" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}"><rect width="${W}" height="${h}" fill="#fff"/>${body}</svg>`;
export const figure = (title, svgOrHtml, caption, wide = false) =>
  `<figure class="wb-figure${wide ? " wb-wide" : ""}"><figcaption class="wb-title">${esc(title)}</figcaption>${svgOrHtml}<p class="wb-caption">${esc(caption)}</p></figure>`;
export const unknown = '<span class="wb-unknown" title="Not checked yet">?</span>';
export const circle = (x, y, r, fill, stroke = INK, extra = "") => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
export const poly = (points, fill, stroke = TEAL, extra = "") => `<polygon points="${points.map(([px, py]) => `${f2(px)},${f2(py)}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${extra}/>`;
/** Typographic minus for labels. */
export const sg = (n) => f2(n).replace("-", "−");
/** A labelled text box for a builder; `key` is the builder slot saved in workbench.builder. */
export const bInput = (key, label, value, hint = "") =>
  `<label for="wb-${key}">${esc(label)}</label><input id="wb-${key}" data-wb-builder="${key}" type="text" inputmode="decimal" value="${esc(value)}" maxlength="12" autocomplete="off"${hint ? ` aria-describedby="${hint}"` : ""}>`;
export const bSelect = (key, label, value, options) =>
  `<label for="wb-${key}">${esc(label)}</label><select id="wb-${key}" data-wb-builder="${key}"><option value="">Choose…</option>${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
/** Verdict lines for a builder result. */
export const verdictHTML = (r) => `<div class="wb-verdicts" role="status">${r.lines.map((l) => `<p class="wb-verdict ${r.ok ? "good" : ""}">${esc(l)}</p>`).join("")}</div>`;
/** Oblique drawing of a rectangular box (length x width x height). `open` leaves the top face off. */
export function obliqueBox(len, wid, hgt, open, labels = {}) {
  const s = Math.min(190 / (len + wid * 0.5), 120 / (hgt + wid * 0.35), 40), x0 = 46, dx = wid * s * 0.5, dy = wid * s * 0.35;
  const top = 18 + dy, fw = len * s, fh = hgt * s;
  let body = poly([[x0, top], [x0 + fw, top], [x0 + fw + dx, top - dy], [x0 + dx, top - dy]], open ? "#fff" : MINT, TEAL, open ? 'stroke-dasharray="5 4"' : "");
  body += poly([[x0 + fw, top], [x0 + fw + dx, top - dy], [x0 + fw + dx, top - dy + fh], [x0 + fw, top + fh]], PEACH, ORANGE);
  body += rect(x0, top, fw, fh, LIME);
  body += text(x0 + fw / 2, top + fh + 16, labels.len ?? "", { anchor: "middle", size: 12, bold: true });
  body += text(x0 - 6, top + fh / 2 + 4, labels.hgt ?? "", { anchor: "end", size: 12, bold: true });
  body += text(x0 + fw + dx + 6, top - dy + fh / 2 + dy / 2, labels.wid ?? "", { anchor: "start", size: 12, bold: true });
  if (labels.center) body += text(10, top + fh + 38, labels.center, { size: 12, bold: true, fill: TEAL });
  return { body, height: top + fh + (labels.center ? 50 : 30), width: x0 + fw + dx };
}
/** Cross-shaped net of a box. Returns the drawing; nets built this way fold into the box by construction. */
export function netBody(a, b, c, open, show = true) {
  const unitsW = 2 * c + a, unitsH = c + b + c + (open ? 0 : b);
  const s = Math.min(300 / unitsW, 230 / unitsH, 34), x0 = (360 - unitsW * s) / 2, y0 = 12;
  const faces = [
    ["Back", x0 + c * s, y0, a, c, LIME],
    ["Left", x0, y0 + c * s, c, b, MINT],
    ["Base", x0 + c * s, y0 + c * s, a, b, PEACH],
    ["Right", x0 + (c + a) * s, y0 + c * s, c, b, MINT],
    ["Front", x0 + c * s, y0 + (c + b) * s, a, c, LIME],
  ];
  if (!open) faces.push(["Top", x0 + c * s, y0 + (c + b + c) * s, a, b, PEACH]);
  let body = "";
  for (const [name, x, y, w, h, fill] of faces) {
    body += rect(x, y, w * s, h * s, fill, TEAL);
    const size = s > 14 ? 11 : 10, full = `${name} ${f2(w)} × ${f2(h)}`, short = `${f2(w)} × ${f2(h)}`;
    const fits = (t) => t.length * size * 0.56 <= w * s - 4 && h * s > size + 6;
    if (show && (fits(full) || fits(short))) body += text(x + (w * s) / 2, y + (h * s) / 2 + 4, fits(full) ? full : short, { anchor: "middle", size });
  }
  if (open) body += text(x0 + c * s + (a * s) / 2, y0 + (c + b + c) * s + 16, "no top face (open)", { anchor: "middle", size: 11, fill: ORANGE, bold: true });
  return { body, height: y0 + unitsH * s + (open ? 26 : 12) };
}
