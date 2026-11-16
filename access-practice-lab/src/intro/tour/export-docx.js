// Editable lesson (.docx) writer: WordprocessingML plus a minimal stored (uncompressed) ZIP, with no dependencies, so
// the browser builds a real Word file from the teacher's lesson. All text is real paragraphs (headings, bullets,
// hyperlinks), so it edits normally in Word, Pages and Google Docs. The QR code is in the PDF and the on-screen card.
import { quickRows } from "./quickref.js";

const enc = new TextEncoder();
const esc = (s) =>
  String(s).replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c],
  );
// Control characters are illegal in XML 1.0.
const clean = (s) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

/* ── ZIP (store only) ── */
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zipStore(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const u16 = (n) => [n & 0xff, (n >>> 8) & 0xff];
  const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  for (const [name, text] of files) {
    const nameB = enc.encode(name);
    const data = enc.encode(text);
    const crc = crc32(data);
    const head = [
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0x0800),
      ...u16(0),
      ...u16(0),
      ...u16(0x21),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(nameB.length),
      ...u16(0),
    ];
    chunks.push(new Uint8Array(head), nameB, data);
    central.push(
      new Uint8Array([
        ...u32(0x02014b50),
        ...u16(20),
        ...u16(20),
        ...u16(0x0800),
        ...u16(0),
        ...u16(0),
        ...u16(0x21),
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(nameB.length),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u32(0),
        ...u32(offset),
      ]),
      nameB,
    );
    offset += head.length + nameB.length + data.length;
  }
  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(files.length),
    ...u16(files.length),
    ...u32(cdSize),
    ...u32(offset),
    ...u16(0),
  ]);
  const all = [...chunks, ...central, end];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of all) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/* ── WordprocessingML ── */
const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

class Body {
  constructor() {
    this.xml = [];
    this.links = [];
  }
  run(text, { bold, size, color, underline } = {}) {
    const rpr = `${bold ? "<w:b/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}${size ? `<w:sz w:val="${size * 2}"/>` : ""}${underline ? '<w:u w:val="single"/>' : ""}`;
    return `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(clean(text))}</w:t></w:r>`;
  }
  para(text, { style, bold, size, indent, hanging, after, pageBreakBefore } = {}) {
    const ppr = `${style ? `<w:pStyle w:val="${style}"/>` : ""}${pageBreakBefore ? "<w:pageBreakBefore/>" : ""}${after != null ? `<w:spacing w:after="${after}"/>` : ""}${indent ? `<w:ind w:left="${indent}"${hanging ? ` w:hanging="${hanging}"` : ""}/>` : ""}`;
    this.xml.push(
      `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${this.run(text, { bold, size })}</w:p>`,
    );
  }
  heading(text, level = 1, pageBreakBefore = false) {
    this.para(text, { style: `Heading${level}`, pageBreakBefore });
  }
  bullet(text, box = false) {
    this.para(`${box ? "☐" : "•"}\t${text}`, { indent: 540, hanging: 270, after: 60 });
  }
  link(label, url) {
    const id = `rIdL${this.links.length + 1}`;
    this.links.push({ id, url });
    this.xml.push(
      `<w:p><w:hyperlink r:id="${id}" w:history="1"><w:r><w:rPr><w:color w:val="0B5BD3"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${esc(clean(label))}</w:t></w:r></w:hyperlink></w:p>`,
    );
  }
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="143361"/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="143361"/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`;

/** The kit as a .docx (Uint8Array). Same five components, in the same order as the PDF. */
export function kitDocx(lesson) {
  const b = new Body();
  const s = lesson.student;
  b.para(lesson.title, { style: "Title" });
  b.para(`${lesson.gradeLabel} · ${lesson.domainLabel} · ${lesson.minutes} minutes`, { size: 11 });
  b.para(`Activity: ${lesson.resource.where}`);
  b.heading("Learning target", 2);
  b.para(lesson.target, { bold: true, size: 13 });
  b.heading("Prepare", 2);
  for (const t of lesson.prep) b.bullet(t);
  b.heading("Lesson steps", 2);
  for (const blk of lesson.blocks) {
    b.para(`${blk.minutes} min · ${blk.name}`, { bold: true, after: 40 });
    for (const t of blk.steps) b.bullet(t);
  }
  b.heading("Teacher talk moves", 2);
  for (const t of lesson.talkMoves) b.bullet(t);
  b.heading("Suggested scaffolds", 2);
  b.para(lesson.differentiation.lead);
  for (const t of lesson.differentiation.lines) b.bullet(t);
  b.heading("Evidence of learning", 2);
  for (const c of lesson.evidence) b.bullet(c, true);
  if (lesson.evidenceNote) b.para(lesson.evidenceNote);
  b.heading("Feedback and revision", 2);
  b.bullet(`Strength: ${lesson.feedback.praise}`);
  b.bullet(`Next step: ${lesson.feedback.next}`);
  b.bullet(`Revise: ${lesson.feedback.revise}`);
  b.para("Student link:");
  b.link(s.url, s.url);

  b.heading("Student Activity Card", 1, true);
  b.para(s.title, { bold: true, size: 20 });
  b.para("Directions", { bold: true });
  b.para(s.directions, { size: 14 });
  b.para("Your task", { bold: true });
  b.para(s.prompt, { size: 14 });
  if (s.expected) b.para(s.expected);
  if (s.optional) b.para(`Need help? ${s.optional}`);
  b.para("Open the activity:", { bold: true });
  b.link(s.url, s.url);

  const p = lesson.projection;
  b.heading("Classroom Projection View", 1, true);
  b.para("Today’s target", { bold: true });
  b.para(p.target, { bold: true, size: 26 });
  b.para("Directions", { bold: true });
  b.para(p.directions, { size: 20 });
  b.para(p.prompt, { bold: true, size: 20 });
  for (const f of p.frames) b.para(f, { size: 18 });
  b.para("Open the activity:", { bold: true });
  b.link(p.url, p.url);

  const c = lesson.supportCard;
  b.heading("Language Support and Feedback Card", 1, true);
  b.heading("Academic vocabulary", 2);
  for (const v of c.vocab) b.bullet(`${v.term}: ${v.def}`);
  b.heading("Sentence frames and starters", 2);
  for (const f of c.frames) b.bullet(f);
  if (c.bank.length) b.para(`Word bank: ${c.bank.join(", ")}`);
  b.heading("Modeling suggestion", 2);
  b.para(c.modeling || "Model one sentence aloud before students begin.");
  b.heading("Evidence checklist", 2);
  for (const e of c.evidence) b.bullet(e, true);
  b.heading("Feedback example", 2);
  b.para(c.feedbackExample);
  b.heading("Revision or new-attempt prompt", 2);
  b.para(c.revisionPrompt);

  b.heading("Your Quick Guide to The Language Page", 1, true);
  for (const q of quickRows()) {
    b.para(q.want, { bold: true, after: 20 });
    b.para(q.text, { after: 20 });
    b.link(`${q.label}: ${q.url}`, q.url);
  }

  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${b.xml.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${b.links.map((l) => `<Relationship Id="${l.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(l.url)}" TargetMode="External"/>`).join("")}</Relationships>`;
  return zipStore([
    [
      "[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    ],
    [
      "_rels/.rels",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ],
    ["word/document.xml", doc],
    ["word/styles.xml", STYLES],
    ["word/_rels/document.xml.rels", rels],
  ]);
}
