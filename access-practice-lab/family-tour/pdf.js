// A small PDF 1.4 writer: Letter pages, the built-in Helvetica fonts (Latin-1 text, so English and Spanish accents
// work with no font file), filled rectangles, links and word wrapping. No dependency, nothing leaves the device.
const W = [
  // Helvetica widths for characters 32..126 (units of 1/1000 em)
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278,
  584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944,
  667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500,
  278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const WB = [
  // Helvetica-Bold
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333,
  584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944,
  667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556,
  333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

// Characters outside ASCII that WinAnsi encodes at a different byte than their Unicode value.
const WIN = { "“": 0x93, "”": 0x94, "‘": 0x91, "’": 0x92, "–": 0x96, "—": 0x97, "•": 0x95, "…": 0x85, "−": 0x2d, "·": 0xb7 };

const byteOf = (ch) => {
  if (WIN[ch]) return WIN[ch];
  const c = ch.codePointAt(0);
  return c >= 32 && c <= 255 ? c : 63;
};

function charWidth(ch, bold) {
  const table = bold ? WB : W;
  const c = ch.codePointAt(0);
  if (c >= 32 && c <= 126) return table[c - 32];
  if (ch === "¿") return 611;
  if (ch === "¡") return 333;
  if (WIN[ch]) return ch === "—" ? 1000 : ch === "…" ? 1000 : ch === "•" ? 350 : ch === "–" ? 556 : 333;
  const base = ch.normalize("NFD")[0];
  const bc = base.codePointAt(0);
  return bc >= 32 && bc <= 126 ? table[bc - 32] : 556;
}

export const textWidth = (s, size, bold = false) => ([...s].reduce((sum, ch) => sum + charWidth(ch, bold), 0) * size) / 1000;

export function wrap(text, size, maxWidth, bold = false) {
  const out = [];
  for (const para of String(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (textWidth(next, size, bold) * 1.03 <= maxWidth || !line) line = next;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

const hex = (s) => [...s].map((ch) => byteOf(ch).toString(16).padStart(2, "0")).join("");
const n = (x) => (Math.round(x * 100) / 100).toString();
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => n(v / 255)).join(" ");

export class Pdf {
  constructor({ title = "", lang = "en-US", margin = 54 } = {}) {
    this.title = title;
    this.lang = lang;
    this.w = 612;
    this.h = 792;
    this.m = margin;
    this.pages = [];
    this.links = [];
    this.addPage();
  }
  addPage() {
    this.pages.push({ ops: [], links: [] });
    this.y = this.h - this.m;
    this.page = this.pages[this.pages.length - 1];
    return this;
  }
  get room() {
    return this.y - this.m;
  }
  ensure(height) {
    if (this.room < height) this.addPage();
  }
  rect(x, y, w, h, color) {
    this.page.ops.push(`${rgb(color)} rg ${n(x)} ${n(y)} ${n(w)} ${n(h)} re f`);
  }
  strokeRect(x, y, w, h, color, width = 1) {
    this.page.ops.push(`${rgb(color)} RG ${n(width)} w ${n(x)} ${n(y)} ${n(w)} ${n(h)} re S`);
  }
  /** One line of text with its baseline at (x, y). */
  textAt(s, x, y, { size = 12, bold = false, color = 0x111a3b } = {}) {
    this.page.ops.push(`BT /${bold ? "F2" : "F1"} ${n(size)} Tf ${rgb(color)} rg ${n(x)} ${n(y)} Td <${hex(s)}> Tj ET`);
  }
  /** Wrapped paragraph from the cursor; returns the height used. */
  para(text, { size = 12, bold = false, color = 0x111a3b, x = this.m, width = this.w - this.m * 2, lead = 1.38, gap = 6, link = "" } = {}) {
    const lines = wrap(text, size, width, bold);
    const lh = size * lead;
    for (const line of lines) {
      this.ensure(lh);
      this.y -= lh;
      this.textAt(line, x, this.y + size * 0.28, { size, bold, color });
      if (link) this.page.links.push({ x, y: this.y, w: Math.min(width, textWidth(line, size, bold)), h: lh, url: link });
    }
    this.y -= gap;
    return lines.length * lh + gap;
  }
  space(h) {
    this.y -= h;
  }
  /** Black QR modules (a boolean matrix) with a quiet zone, top-left at (x, topY). */
  qr(matrix, x, topY, size) {
    const q = 4;
    const cells = matrix.length + q * 2;
    const u = size / cells;
    this.rect(x, topY - size, size, size, 0xffffff);
    for (let r = 0; r < matrix.length; r++)
      for (let c = 0; c < matrix.length; c++)
        if (matrix[r][c]) this.rect(x + (c + q) * u, topY - (r + q + 1) * u, u + 0.2, u + 0.2, 0x000000);
  }
  link(x, y, w, h, url) {
    this.page.links.push({ x, y, w, h, url });
  }
  build() {
    const objs = [];
    const add = (body) => objs.push(body) && objs.length;
    const catalog = add("");
    const pagesObj = add("");
    const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const kids = [];
    for (const page of this.pages) {
      const content = page.ops.join("\n");
      const c = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      const annots = page.links.map((l) =>
        add(`<< /Type /Annot /Subtype /Link /Rect [${n(l.x)} ${n(l.y)} ${n(l.x + l.w)} ${n(l.y + l.h)}] /Border [0 0 0] /A << /S /URI /URI (${l.url.replace(/[\\()]/g, "\\$&")}) >> >>`),
      );
      const p = add(
        `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${this.w} ${this.h}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R${annots.length ? ` /Annots [${annots.map((a) => `${a} 0 R`).join(" ")}]` : ""} >>`,
      );
      kids.push(p);
    }
    objs[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
    objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R /Lang (${this.lang}) /ViewerPreferences << /DisplayDocTitle true >> >>`;
    const info = add(`<< /Title <${"feff" + [...this.title].map((ch) => ch.charCodeAt(0).toString(16).padStart(4, "0")).join("")}> /Producer (The Language Page) >>`);
    let out = "%PDF-1.4\n";
    const offsets = [];
    objs.forEach((body, i) => {
      offsets.push(out.length);
      out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return out;
  }
  /** Bytes, one per character: every character in the document is below U+0100 by construction. */
  toBlob() {
    const s = this.build();
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 255;
    return new Blob([bytes], { type: "application/pdf" });
  }
}
