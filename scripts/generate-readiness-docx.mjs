// Generates printable per-lesson READINESS practice packets (.docx)
// from the SAME JSON data files as the HTML generator.
// Input:  scripts/readiness/data/<id>.json
// Output: lessons/<id>/readiness/practice.docx
//
// Run: node scripts/generate-readiness-docx.mjs            (all data files)
//      node scripts/generate-readiness-docx.mjs 1-2 3-4    (specific lessons)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Document, Packer, Paragraph, TextRun, PageBreak } from "docx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(__dirname, "readiness", "data");

const NAVY = "0F2B3C";
const BLUE = "1A6FB5";
const GOLD = "7A5400";
const CORAL = "C45A3C";

// Strip inline HTML tags + decode the few entities we use, for Word text.
function plain(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&times;/g, "×")
    .trim();
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: String(text ?? ""), ...opts })],
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.alignment,
  });
}

function blankWork(n = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(p("____________________________________________________", { color: "BBBBBB", after: 80 }));
  }
  return out;
}

const TIER_LABEL = ["Level 0 · Most support", "Level 1 · Support", "Level 2 · Stretch"];

// Resolve the printable answer for an item.
function answerText(item) {
  if (item.type === "mc") {
    const opt = (item.opts || []).find((o) => o.v === item.ans);
    return opt ? plain(opt.t) : String(item.ans);
  }
  return String(item.ans);
}

function buildDoc(d) {
  const id = d.lessonId;
  const tiers = [...d.tiers].sort((a, b) => a.level - b.level);
  const kids = [];

  kids.push(p(`Get Ready: ${plain(d.title)}`, { bold: true, size: 36, color: NAVY, after: 60 }));
  kids.push(p(`Readiness practice for Lesson ${id}  ·  Builds toward ${d.standard}`, { italics: true, color: BLUE, size: 20, after: 120 }));
  kids.push(p("Name: ______________________________      Period: ______      Date: __________", { size: 22, after: 160 }));

  kids.push(p("Why this matters", { bold: true, size: 24, color: GOLD, after: 60 }));
  kids.push(p(plain(d.why), { size: 22, after: 100 }));
  if (Array.isArray(d.skills) && d.skills.length) {
    kids.push(p(`Skills you'll warm up: ${d.skills.join("  ·  ")}`, { size: 20, color: "5E6E7E", after: 160 }));
  }

  kids.push(p("Pick your level (your teacher or the online check will point you to one):", { bold: true, size: 22, after: 120 }));

  for (const tier of tiers) {
    kids.push(p(TIER_LABEL[tier.level], { bold: true, size: 24, color: NAVY, before: 160, after: 40 }));
    if (tier.intro) kids.push(p(plain(tier.intro), { italics: true, size: 20, after: 100 }));
    tier.items.forEach((it, i) => {
      const q = plain(it.q).replace(/^[A-Z]\.\s*/, "");
      kids.push(p(`${i + 1}.  ${q}`, { size: 22, after: 40 }));
      if (it.type === "mc") {
        kids.push(p(`     choices: ${(it.opts || []).map((o) => plain(o.t)).join("   /   ")}`, { size: 20, color: "5E6E7E", after: 40 }));
      }
      kids.push(...blankWork(1));
    });
  }

  kids.push(p("Exit Ticket — show you're ready", { bold: true, size: 24, color: CORAL, before: 200, after: 60 }));
  d.exit.forEach((it, i) => {
    const q = plain(it.q).replace(/^\d+\.\s*/, "");
    kids.push(p(`${i + 1}.  ${q}`, { size: 22, after: 40 }));
    if (it.type === "mc") {
      kids.push(p(`     choices: ${(it.opts || []).map((o) => plain(o.t)).join("   /   ")}`, { size: 20, color: "5E6E7E", after: 40 }));
    }
    kids.push(...blankWork(1));
  });

  kids.push(p(`When you've finished, open Lesson ${id} and dive in!`, { italics: true, size: 20, color: BLUE, before: 120, after: 60 }));

  // Answer key on its own page
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(p("Answer Key (teacher)", { bold: true, size: 28, color: NAVY, after: 100 }));
  for (const tier of tiers) {
    kids.push(p(TIER_LABEL[tier.level], { bold: true, size: 22, color: BLUE, before: 100, after: 40 }));
    tier.items.forEach((it, i) => kids.push(p(`${i + 1}. ${answerText(it)}`, { size: 20, after: 30 })));
  }
  kids.push(p("Exit Ticket", { bold: true, size: 22, color: CORAL, before: 100, after: 40 }));
  d.exit.forEach((it, i) => kids.push(p(`${i + 1}. ${answerText(it)}`, { size: 20, after: 30 })));

  return new Document({
    creator: "Neft Teacher",
    title: `Readiness — Lesson ${id} — ${plain(d.title)}`,
    sections: [{ properties: {}, children: kids }],
  });
}

// ---------- run ----------
const args = process.argv.slice(2);
const files = args.length
  ? args.map((a) => `${a}.json`)
  : readdirSync(dataDir).filter((f) => f.endsWith(".json"));

let count = 0;
for (const f of files) {
  const path = join(dataDir, f);
  if (!existsSync(path)) {
    console.error(`Missing data file: ${f}`);
    continue;
  }
  const d = JSON.parse(readFileSync(path, "utf8"));
  const outDir = join(root, "lessons", d.lessonId, "readiness");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const buf = await Packer.toBuffer(buildDoc(d));
  writeFileSync(join(outDir, "practice.docx"), buf);
  count++;
}
console.log(`Generated ${count} readiness DOCX packet(s).`);
