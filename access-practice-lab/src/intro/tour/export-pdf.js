// Lesson-kit PDF writer. A small, dependency-free PDF 1.4 generator: Letter pages, the built-in Helvetica fonts,
// word wrapping, bullets and check boxes, URI link annotations and a vector QR code. It writes a real file in the
// browser (Blob) or in Node, so the same code is tested with pdftotext and pdftoppm.
// Text is limited to Latin-1 plus curly quotes, dashes and the bullet (the built-in fonts' WinAnsi set); other
// characters become "?", which is why the kit never puts Spanish glosses in the PDF.
import { qrModules } from "../../../../shared/qr/qr-code.mjs";
import { quickRows } from "./quickref.js";

const W = 612;
const H = 792;
const M = 54;
const MY = 42; // top and bottom margin

// Helvetica advance widths (1000 units/em), characters 32..126. Bold has its own letters; everything else shares.
const REG = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const BOLD_AZ = [
  722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667,
  611, 722, 667, 944, 667, 667, 611,
];
const BOLD_az = [
  556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556,
  333, 611, 556, 778, 556, 556, 500,
];

function charWidth(ch, bold) {
  const c = ch.charCodeAt(0);
  if (bold) {
    if (c >= 65 && c <= 90) return BOLD_AZ[c - 65];
    if (c >= 97 && c <= 122) return BOLD_az[c - 97];
  }
  return c >= 32 && c <= 126 ? REG[c - 32] : 556;
}
export const textWidth = (s, size, bold = false) =>
  ([...s].reduce((n, ch) => n + charWidth(ch, bold), 0) * size) / 1000;

const WIN = {
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
  "…": 0x85,
  "☐": 0x6f,
};
function pdfString(s) {
  let out = "";
  for (const ch of s) {
    const c = WIN[ch] ?? ch.charCodeAt(0);
    if (c === 0x28 || c === 0x29 || c === 0x5c) out += `\\${String.fromCharCode(c)}`;
    else if (c >= 32 && c <= 126) out += String.fromCharCode(c);
    else if (c >= 0xa0 && c <= 0xff) out += `\\${c.toString(8)}`;
    else if (c >= 0x80 && c <= 0x9f && Object.values(WIN).includes(c)) out += `\\${c.toString(8)}`;
    else out += "?";
  }
  return `(${out})`;
}
const n2 = (n) => (Math.round(n * 100) / 100).toString();

/** Page builder with a cursor that moves down the page. */
export class Doc {
  constructor(title) {
    this.title = title;
    this.pages = [];
    this.pageBreak();
  }

  pageBreak() {
    this.page = { ops: [], links: [] };
    this.pages.push(this.page);
    this.y = H - MY;
  }

  ensure(h) {
    if (this.y - h < MY) this.pageBreak();
  }

  /** Wrapped text. Returns nothing; moves the cursor. `link` makes every line a clickable URI. */
  text(
    s,
    {
      size = 11,
      bold = false,
      color = "0.1 0.1 0.1",
      x = M,
      width = W - 2 * M - (x - M),
      gap = 4,
      leading = 1.24,
      link = "",
    } = {},
  ) {
    const words = String(s).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (line && textWidth(t, size, bold) > width) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    for (const l of lines) {
      this.ensure(size * leading);
      this.y -= size * leading;
      this.page.ops.push(
        `BT /${bold ? "F2" : "F1"} ${n2(size)} Tf ${color} rg ${n2(x)} ${n2(this.y)} Td ${pdfString(l)} Tj ET`,
      );
      if (link) {
        const w = textWidth(l, size, bold);
        this.page.ops.push(
          `${color} RG 0.6 w ${n2(x)} ${n2(this.y - 2)} m ${n2(x + w)} ${n2(this.y - 2)} l S`,
        );
        this.page.links.push({ rect: [x, this.y - 3, x + w, this.y + size], url: link });
      }
    }
    this.y -= gap;
  }

  heading(s, size = 15) {
    this.ensure(size * 2.4);
    this.y -= 3;
    this.text(s, { size, bold: true, color: "0.08 0.2 0.38", gap: 3 });
  }

  bullet(s, { box = false, indent = 14, size = 11 } = {}) {
    this.ensure(size * 1.4);
    const top = this.y - size * 1.2;
    if (box) this.page.ops.push(`0.3 0.3 0.3 RG 0.8 w ${n2(M + 1)} ${n2(top + 1)} 8 8 re S`);
    else
      this.page.ops.push(
        `BT /F1 ${size} Tf 0.1 0.1 0.1 rg ${n2(M + 2)} ${n2(top + 1.5)} Td ${pdfString("•")} Tj ET`,
      );
    this.text(s, { size, x: M + indent, gap: 2 });
  }

  rule() {
    this.ensure(10);
    this.y -= 4;
    this.page.ops.push(`0.8 0.82 0.86 RG 0.8 w ${M} ${n2(this.y)} m ${W - M} ${n2(this.y)} l S`);
    this.y -= 6;
  }

  qr(url, size = 130, x = M) {
    const m = qrModules(url);
    const q = 4;
    const unit = size / (m.length + 2 * q);
    this.ensure(size + 6);
    const top = this.y;
    this.page.ops.push(`1 1 1 rg ${n2(x)} ${n2(top - size)} ${n2(size)} ${n2(size)} re f 0 0 0 rg`);
    for (let r = 0; r < m.length; r++)
      for (let c = 0; c < m.length; c++)
        if (m[r][c])
          this.page.ops.push(
            `${n2(x + (c + q) * unit)} ${n2(top - (r + q + 1) * unit)} ${n2(unit)} ${n2(unit)} re f`,
          );
    this.y -= size + 6;
  }

  /** Serialize to PDF bytes. */
  bytes() {
    const objs = [];
    const add = (body) => objs.push(body) && objs.length;
    add("<< /Type /Catalog /Pages 2 0 R /Lang (en-US) >>");
    add("");
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const kids = [];
    for (const p of this.pages) {
      const stream = p.ops.join("\n");
      const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const annots = p.links.map((l) =>
        add(
          `<< /Type /Annot /Subtype /Link /Rect [${l.rect.map(n2).join(" ")}] /Border [0 0 0] /A << /S /URI /URI ${pdfString(l.url)} >> >>`,
        ),
      );
      const page = add(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${content} 0 R${annots.length ? ` /Annots [${annots.map((a) => `${a} 0 R`).join(" ")}]` : ""} >>`,
      );
      kids.push(`${page} 0 R`);
    }
    objs[1] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >>`;
    const info = add(`<< /Title ${pdfString(this.title)} /Producer (The Language Page) >>`);
    let out = "%PDF-1.4\n";
    const offsets = [];
    objs.forEach((b, i) => {
      offsets.push(out.length);
      out += `${i + 1} 0 obj\n${b}\nendobj\n`;
    });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    // Every character is ASCII or an escape, so a single byte per code unit is exact.
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}

const label = (d, s) => d.text(s, { size: 9, bold: true, color: "0.35 0.38 0.42", gap: 1 });

/** The five-part kit as a PDF. Each component starts on its own page. */
export function kitPdf(lesson) {
  const d = new Doc(lesson.title);
  const s = lesson.student;
  // A. Teacher guide
  d.text(lesson.title, { size: 20, bold: true, color: "0.08 0.2 0.38", gap: 2 });
  d.text(
    `${lesson.gradeLabel} · ${lesson.domainLabel} · ${lesson.minutes} minutes · ${lesson.resource.where}`,
    { size: 10, color: "0.3 0.3 0.3" },
  );
  d.rule();
  d.heading("Learning target", 12.5);
  d.text(lesson.target, { size: 12, bold: true });
  d.heading("Prepare", 12.5);
  for (const p of lesson.prep) d.bullet(p.replace(/: https?:\/\/\S+$/, " (link below)"), { size: 9.5 });
  d.heading("Lesson steps", 12.5);
  for (const b of lesson.blocks) {
    d.text(`${b.minutes} min · ${b.name}`, { size: 10.5, bold: true, gap: 1 });
    for (const t of b.steps) d.bullet(t, { size: 9.5 });
  }
  d.heading("Teacher talk moves", 12.5);
  for (const t of lesson.talkMoves) d.bullet(t, { size: 9.5 });
  d.heading("Suggested scaffolds", 12.5);
  d.text(lesson.differentiation.lead, { size: 9.5 });
  for (const t of lesson.differentiation.lines) d.bullet(t, { size: 9.5 });
  d.heading("Evidence of learning", 12.5);
  for (const c of lesson.evidence) d.bullet(c, { box: true, size: 9.5 });
  if (lesson.evidenceNote) d.text(lesson.evidenceNote, { size: 10 });
  d.heading("Feedback and revision", 12.5);
  d.bullet(`Strength: ${lesson.feedback.praise}`, { size: 9.5 });
  d.bullet(`Next step: ${lesson.feedback.next}`, { size: 9.5 });
  d.bullet(`Revise: ${lesson.feedback.revise}`, { size: 9.5 });
  d.text(`Student link: ${s.url}`, { size: 9.5, color: "0.05 0.25 0.6", link: s.url });

  // B. Student activity card
  d.pageBreak();
  label(d, "STUDENT ACTIVITY CARD");
  d.text(s.title, { size: 24, bold: true, color: "0.08 0.2 0.38", gap: 8 });
  d.text("Directions", { size: 12, bold: true, gap: 1 });
  d.text(s.directions, { size: 14, gap: 8 });
  d.text("Your task", { size: 12, bold: true, gap: 1 });
  d.text(s.prompt, { size: 14, gap: 8 });
  if (s.expected) d.text(s.expected, { size: 12, gap: 8 });
  if (s.optional) d.text(`Need help? ${s.optional}`, { size: 11.5, gap: 10 });
  d.text("Scan the code or type the link:", { size: 12, bold: true, gap: 4 });
  d.qr(s.url, 150);
  d.text(s.url, { size: 11, color: "0.05 0.25 0.6", link: s.url });

  // C. Classroom projection view
  const p = lesson.projection;
  d.pageBreak();
  label(d, "CLASSROOM PROJECTION VIEW");
  d.text("Today’s target", { size: 16, bold: true, color: "0.35 0.38 0.42", gap: 2 });
  d.text(p.target, { size: 30, bold: true, color: "0.08 0.2 0.38", gap: 14, leading: 1.2 });
  d.text("Directions", { size: 16, bold: true, color: "0.35 0.38 0.42", gap: 2 });
  d.text(p.directions, { size: 22, gap: 12, leading: 1.25 });
  d.text(p.prompt, { size: 22, bold: true, gap: 12, leading: 1.25 });
  for (const f of p.frames) d.text(f, { size: 19, color: "0.1 0.3 0.15", gap: 4 });
  d.text("Open the activity:", { size: 16, bold: true, gap: 4 });
  d.qr(p.url, 140);
  d.text(p.url, { size: 12, color: "0.05 0.25 0.6", link: p.url });

  // D. Language support and feedback card
  const c = lesson.supportCard;
  d.pageBreak();
  label(d, "LANGUAGE SUPPORT AND FEEDBACK CARD");
  d.text(s.title, { size: 18, bold: true, color: "0.08 0.2 0.38" });
  d.heading("Academic vocabulary");
  for (const v of c.vocab) d.bullet(`${v.term}: ${v.def}`, { size: 10.5 });
  d.heading("Sentence frames and starters");
  for (const f of c.frames) d.bullet(f, { size: 10.5 });
  if (c.bank.length) d.text(`Word bank: ${c.bank.join(", ")}`, { size: 10.5 });
  d.heading("Modeling suggestion");
  d.text(c.modeling || "Model one sentence aloud before students begin.", { size: 10.5 });
  d.heading("Evidence checklist");
  for (const e of c.evidence) d.bullet(e, { box: true, size: 10.5 });
  d.heading("Feedback example");
  d.text(c.feedbackExample, { size: 10.5 });
  d.heading("Revision or new-attempt prompt");
  d.text(c.revisionPrompt, { size: 10.5 });

  // E. Quick reference
  d.pageBreak();
  label(d, "TEACHER QUICK REFERENCE");
  d.text("Your Quick Guide to The Language Page", {
    size: 20,
    bold: true,
    color: "0.08 0.2 0.38",
    gap: 6,
  });
  for (const q of quickRows()) {
    d.text(q.want, { size: 12, bold: true, gap: 1 });
    d.text(q.text, { size: 10.5, gap: 1 });
    d.text(`${q.label}: ${q.url}`, { size: 10, color: "0.05 0.25 0.6", link: q.url, gap: 7 });
  }
  return d.bytes();
}
