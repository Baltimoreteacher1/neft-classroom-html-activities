// Generates printable per-lesson READINESS practice packets (.docx).
// Output: lessons/<id>/readiness/practice.docx
//
// Data-driven: add an entry to READINESS for each lesson. The HTML readiness
// page (lessons/<id>/readiness/index.html) and this packet stay in sync because
// both cover the same prerequisite skills.
//
// Run: node scripts/generate-readiness-docx.mjs            (all entries)
//      node scripts/generate-readiness-docx.mjs 1-2        (one lesson)
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from "docx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ---------- readiness content (one entry per lesson) ----------
const READINESS = {
  "1-2": {
    title: "Greatest Common Factor",
    standard: "6.NS.4",
    why: "To find the greatest common factor of two numbers you first list each number's factors quickly — which runs on multiplication facts and divisibility. Warm these up and GCF feels easy.",
    skills: ["Multiplication facts", "Listing factors (factor pairs)", "Divisibility", "Common factors & GCF"],
    tiers: [
      {
        level: 0,
        label: "Level 0 · Most support",
        intro: "List factors one step at a time.",
        items: [
          { q: "Fill the missing partner:  1 × ____ = 6", a: "6" },
          { q: "Fill the missing partner:  2 × ____ = 6", a: "3" },
          { q: "So the factors of 6 are 1, 2, 3, and ____", a: "6" },
          { q: "Fill the missing partner:  1 × ____ = 8", a: "8" },
          { q: "Fill the missing partner:  2 × ____ = 8", a: "4" },
        ],
      },
      {
        level: 1,
        label: "Level 1 · Support",
        intro: "List the factors, then spot the shared ones.",
        items: [
          { q: "List ALL the factors of 8.", a: "1, 2, 4, 8" },
          { q: "List ALL the factors of 12.", a: "1, 2, 3, 4, 6, 12" },
          { q: "Circle the factors 8 and 12 SHARE (common factors).", a: "1, 2, 4" },
          { q: "Which is a common factor of 8 and 12: 3, 4, or 8?", a: "4" },
        ],
      },
      {
        level: 2,
        label: "Level 2 · Stretch",
        intro: "Warm up straight into GCF.",
        items: [
          { q: "Factors of 18 and 24 — what is the GREATEST factor they share?", a: "6" },
          { q: "GCF of 9 and 15 = ?", a: "3" },
          { q: "GCF of 16 and 24 = ?", a: "8" },
          { q: "GCF of 7 and 21 = ?", a: "7" },
        ],
      },
    ],
    exit: [
      { q: "Name a factor of 10 that is greater than 1 and less than 10.", a: "2 or 5" },
      { q: "Greatest common factor of 6 and 9 = ?", a: "3" },
    ],
  },
};

// ---------- helpers ----------
const NAVY = "0F2B3C";
const BLUE = "1A6FB5";
const GOLD = "7A5400";

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: String(text ?? ""), ...opts })],
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.alignment,
  });
}

function blankWork(n = 2) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(p("____________________________________________________", { color: "BBBBBB", after: 80 }));
  }
  return out;
}

function buildDoc(id, data) {
  const kids = [];

  kids.push(p(`Get Ready: ${data.title}`, { bold: true, size: 36, color: NAVY, after: 60 }));
  kids.push(p(`Readiness practice for Lesson ${id}  ·  Builds toward ${data.standard}`, { italics: true, color: BLUE, size: 20, after: 120 }));
  kids.push(p("Name: ______________________________      Period: ______      Date: __________", { size: 22, after: 160 }));

  kids.push(p("Why this matters", { bold: true, size: 24, color: GOLD, after: 60 }));
  kids.push(p(data.why, { size: 22, after: 100 }));
  kids.push(p(`Skills you'll warm up: ${data.skills.join("  ·  ")}`, { size: 20, color: "5E6E7E", after: 160 }));

  kids.push(p("Pick your level (your teacher or the online check will point you to one):", { bold: true, size: 22, after: 120 }));

  for (const tier of data.tiers) {
    kids.push(p(`${tier.label}`, { bold: true, size: 24, color: NAVY, before: 160, after: 40 }));
    kids.push(p(tier.intro, { italics: true, size: 20, after: 100 }));
    tier.items.forEach((it, i) => {
      kids.push(p(`${i + 1}.  ${it.q}`, { size: 22, after: 40 }));
      kids.push(...blankWork(1));
    });
  }

  kids.push(p("Exit Ticket — show you're ready", { bold: true, size: 24, color: "C45A3C", before: 200, after: 60 }));
  data.exit.forEach((it, i) => {
    kids.push(p(`${i + 1}.  ${it.q}`, { size: 22, after: 40 }));
    kids.push(...blankWork(1));
  });

  kids.push(p("When you've finished, open Lesson " + id + " and find the Greatest Common Factor!", { italics: true, size: 20, color: BLUE, before: 120, after: 60 }));

  // Answer key on its own page
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(p("Answer Key (teacher)", { bold: true, size: 28, color: NAVY, after: 100 }));
  for (const tier of data.tiers) {
    kids.push(p(tier.label, { bold: true, size: 22, color: BLUE, before: 100, after: 40 }));
    tier.items.forEach((it, i) => kids.push(p(`${i + 1}. ${it.a}`, { size: 20, after: 30 })));
  }
  kids.push(p("Exit Ticket", { bold: true, size: 22, color: "C45A3C", before: 100, after: 40 }));
  data.exit.forEach((it, i) => kids.push(p(`${i + 1}. ${it.a}`, { size: 20, after: 30 })));

  return new Document({
    creator: "Neft Teacher",
    title: `Readiness — Lesson ${id} — ${data.title}`,
    sections: [{ properties: {}, children: kids }],
  });
}

// ---------- run ----------
const only = process.argv[2];
const ids = only ? [only] : Object.keys(READINESS);
let count = 0;
for (const id of ids) {
  const data = READINESS[id];
  if (!data) {
    console.error(`No readiness data for lesson ${id} — skipping.`);
    continue;
  }
  const outDir = join(root, "lessons", id, "readiness");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const doc = buildDoc(id, data);
  const buf = await Packer.toBuffer(doc);
  const outPath = join(outDir, "practice.docx");
  writeFileSync(outPath, buf);
  console.log(`Wrote ${outPath} (${buf.length} bytes)`);
  count++;
}
console.log(`Done. ${count} packet(s) generated.`);
