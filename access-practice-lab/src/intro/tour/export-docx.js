// Editable lesson (.docx) writer. The WordprocessingML and ZIP packaging live in the lab's one Word writer
// (src/download/docx-writer.js); this module lays out the kit. All text is real paragraphs (headings, bullets,
// hyperlinks), so it edits normally in Word, Pages and Google Docs. The QR code is in the PDF and the on-screen card.
import { quickRows } from "./quickref.js";
import { Body, packDocx } from "../../download/docx-writer.js";
import { zipStore as zipStoreFiles } from "../../../../assets/lib/zip-store.js";

/* ── CRC-32 (kept as an export: the kit's tests pin the check value) ── */
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

/** A stored ZIP from [[name, text], …] (the shared writer, assets/lib/zip-store.js). */
export const zipStore = (files) => zipStoreFiles(Object.fromEntries(files));

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

  return packDocx(b);
}
