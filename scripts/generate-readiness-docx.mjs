// Generates printable per-lesson READINESS practice packets (.docx)
// from the SAME JSON data files as the HTML generator.
// Input:  scripts/readiness/data/<id>.json
// Output: lessons/<id>/readiness/practice.docx
// Title/standard come from the launch manifest (scripts/readiness/lesson-identity.mjs);
// optional *_es fields print as a Spanish line under their English.
//
// Run: node scripts/generate-readiness-docx.mjs            (all data files)
//      node scripts/generate-readiness-docx.mjs 1-2 3-4    (specific lessons)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BorderStyle,
  Document,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { lessonIdentity } from "./readiness/lesson-identity.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(__dirname, "readiness", "data");

const NAVY = "0F2B3C";
const BLUE = "1A6FB5";
const GOLD = "7A5400";
const CORAL = "C45A3C";
const RULE = "C7D2DD";
const BOX_BG = "EEF4F8";
const AMBER_BG = "FBF3E2";
const MUTED = "5E6E7E";

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 6, color: RULE };
const TABLE_BORDERS = {
  top: CELL_BORDER,
  bottom: CELL_BORDER,
  left: CELL_BORDER,
  right: CELL_BORDER,
  insideHorizontal: CELL_BORDER,
  insideVertical: CELL_BORDER,
};

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
    out.push(
      p("____________________________________________________", { color: "BBBBBB", after: 80 }),
    );
  }
  return out;
}

function cellBlankLines(n = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(p("____________________________", { color: "BBBBBB", size: 18, after: 50 }));
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

// Spanish sibling paragraph, only when authored.
function esLine(s, opts = {}) {
  return s ? [p(plain(s), { italics: true, color: "3F4D5C", size: 20, after: 60, ...opts })] : [];
}

// 4-column inline Vocabulary Anchor Box (1800 + 3160 + 2200 + 2200 = 9360 DXA)
function vocabAnchorTable(id) {
  const cfgPath = join(root, "lessons", id, "config.json");
  let vocab = [];
  if (existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
      if (Array.isArray(cfg.vocabulary)) vocab = cfg.vocabulary.filter((v) => v && v.term);
    } catch {}
  }
  if (!vocab.length) return [];

  const headers = [
    { label: "Concept Term", width: 1800 },
    { label: "Student-Friendly Definition", width: 3160 },
    { label: "Non-Example", width: 2200 },
    { label: "Visual Clue", width: 2200 },
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(
      (h) =>
        new TableCell({
          width: { size: h.width, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: BOX_BG, color: "auto" },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [p(h.label, { bold: true, color: NAVY, size: 18, after: 0 })],
        }),
    ),
  });

  const rows = vocab.map(
    (v) =>
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 1800, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              p(plain(v.term), { bold: true, color: NAVY, size: 20, after: v.termEs ? 20 : 0 }),
              ...(v.termEs
                ? [p(plain(v.termEs), { italics: true, color: MUTED, size: 18, after: 0 })]
                : []),
            ],
          }),
          new TableCell({
            width: { size: 3160, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [p(plain(v.definition || ""), { size: 19, after: 0 })],
          }),
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              p(
                plain(
                  v.nonExample ||
                    `Not ${v.term}: write a counter-example that does not fit the rule.`,
                ),
                { italics: !v.nonExample, color: MUTED, size: 18, after: 30 },
              ),
              ...cellBlankLines(1),
            ],
          }),
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              p(plain(v.visual || "Sketch or label a visual model."), {
                italics: true,
                color: MUTED,
                size: 18,
                after: 0,
              }),
            ],
          }),
        ],
      }),
  );

  return [
    p("Vocabulary Anchor Box", { bold: true, size: 24, color: NAVY, before: 120, after: 60 }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      borders: TABLE_BORDERS,
      columnWidths: [1800, 3160, 2200, 2200],
      rows: [headerRow, ...rows],
    }),
  ];
}

// 3-column reasoning table for each readiness practice item (2800 + 3560 + 3000 = 9360 DXA)
function practiceCard(it, idx) {
  const q = plain(it.q).replace(/^[A-Z]\.\s*/, "");
  const col1 = [
    p(`${idx + 1}.  ${q}`, { bold: true, color: NAVY, size: 20, after: 40 }),
    ...esLine(it.q_es, { after: 40 }),
  ];
  if (it.type === "mc") {
    col1.push(
      p(`Choices: ${(it.opts || []).map((o) => plain(o.t)).join("   /   ")}`, {
        size: 18,
        color: MUTED,
        after: 0,
      }),
    );
  }

  const col2 = [...cellBlankLines(4)];

  const col3 = [
    p("Because... ________________", { bold: true, color: NAVY, size: 18, after: 30 }),
    ...cellBlankLines(1),
    p("Although... _______________", { bold: true, color: BLUE, size: 18, before: 40, after: 30 }),
    ...cellBlankLines(1),
    p("Therefore... ______________", { bold: true, color: GOLD, size: 18, before: 40, after: 30 }),
    ...cellBlankLines(1),
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    columnWidths: [2800, 3560, 3000],
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 2800, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BOX_BG, color: "auto" },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              p("CORE PROBLEM / GIVEN REPRESENTATION", {
                bold: true,
                color: NAVY,
                size: 16,
                after: 0,
              }),
            ],
          }),
          new TableCell({
            width: { size: 3560, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BOX_BG, color: "auto" },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              p("WORKING SPACE / CALCULATION STEPS", {
                bold: true,
                color: NAVY,
                size: 16,
                after: 0,
              }),
            ],
          }),
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: AMBER_BG, color: "auto" },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              p("EXPLAIN YOUR REASONING", { bold: true, color: GOLD, size: 16, after: 0 }),
            ],
          }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 2800, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: col1,
          }),
          new TableCell({
            width: { size: 3560, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: col2,
          }),
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            shading: { type: ShadingType.CLEAR, fill: AMBER_BG, color: "auto" },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: col3,
          }),
        ],
      }),
    ],
  });
}

function exitChecklistTable() {
  const checks = [
    "☐ 1. Units & Labels Verified",
    "☐ 2. Reasoning Stated (Because / Although / Therefore)",
    "☐ 3. Calculations Double-Checked",
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    columnWidths: [3120, 3120, 3120],
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 3,
            width: { size: 9360, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BOX_BG, color: "auto" },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              p("EXIT CHECK · 3-POINT SELF-ASSESSMENT CHECKLIST", {
                bold: true,
                color: NAVY,
                size: 18,
                after: 0,
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: checks.map(
          (label) =>
            new TableCell({
              width: { size: 3120, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [p(label, { bold: true, color: NAVY, size: 18, after: 0 })],
            }),
        ),
      }),
    ],
  });
}

function buildDoc(d) {
  const id = d.lessonId;
  const who = lessonIdentity(id);
  const tiers = [...d.tiers].sort((a, b) => a.level - b.level);
  const kids = [];

  kids.push(p(`Get Ready: ${plain(who.title)}`, { bold: true, size: 36, color: NAVY, after: 60 }));
  kids.push(
    p(`Readiness practice for Lesson ${id} (${who.unitLabel})  ·  Builds toward ${who.standard}`, {
      italics: true,
      color: BLUE,
      size: 20,
      after: 120,
    }),
  );
  kids.push(
    p("Name: ______________________________      Period: ______      Date: __________", {
      size: 22,
      after: 160,
    }),
  );

  kids.push(p("Why this matters", { bold: true, size: 24, color: GOLD, after: 60 }));
  kids.push(p(plain(d.why), { size: 22, after: d.why_es ? 40 : 100 }));
  kids.push(...esLine(d.why_es, { after: 100 }));
  if (Array.isArray(d.skills) && d.skills.length) {
    kids.push(
      p(`Skills you'll warm up: ${d.skills.join("  ·  ")}`, {
        size: 20,
        color: "5E6E7E",
        after: 160,
      }),
    );
  }

  kids.push(...vocabAnchorTable(id));

  kids.push(
    p("Pick your level (your teacher or the online check will point you to one):", {
      bold: true,
      size: 22,
      before: 140,
      after: 120,
    }),
  );

  for (const tier of tiers) {
    kids.push(
      p(TIER_LABEL[tier.level], { bold: true, size: 24, color: NAVY, before: 160, after: 40 }),
    );
    if (tier.intro) kids.push(p(plain(tier.intro), { italics: true, size: 20, after: 100 }));
    kids.push(...esLine(tier.intro_es));
    tier.items.forEach((it, i) => {
      kids.push(practiceCard(it, i));
      kids.push(p("", { after: 60 }));
    });
  }

  kids.push(
    p("Exit Ticket — show you're ready", {
      bold: true,
      size: 24,
      color: CORAL,
      before: 200,
      after: 60,
    }),
  );
  d.exit.forEach((it, i) => {
    const q = plain(it.q).replace(/^\d+\.\s*/, "");
    kids.push(p(`${i + 1}.  ${q}`, { size: 22, after: 40 }));
    kids.push(...esLine(it.q_es));
    if (it.type === "mc") {
      kids.push(
        p(`     choices: ${(it.opts || []).map((o) => plain(o.t)).join("   /   ")}`, {
          size: 20,
          color: "5E6E7E",
          after: 40,
        }),
      );
    }
    kids.push(...blankWork(1));
  });
  kids.push(exitChecklistTable());

  kids.push(
    p(`When you've finished, open Lesson ${id} and dive in!`, {
      italics: true,
      size: 20,
      color: BLUE,
      before: 120,
      after: 60,
    }),
  );

  // Answer key on its own page
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(p("Answer Key (teacher)", { bold: true, size: 28, color: NAVY, after: 100 }));
  for (const tier of tiers) {
    kids.push(
      p(TIER_LABEL[tier.level], { bold: true, size: 22, color: BLUE, before: 100, after: 40 }),
    );
    tier.items.forEach((it, i) =>
      kids.push(p(`${i + 1}. ${answerText(it)}`, { size: 20, after: 30 })),
    );
  }
  kids.push(p("Exit Ticket", { bold: true, size: 22, color: CORAL, before: 100, after: 40 }));
  d.exit.forEach((it, i) => kids.push(p(`${i + 1}. ${answerText(it)}`, { size: 20, after: 30 })));

  return new Document({
    creator: "Neft Teacher",
    title: `Readiness — Lesson ${id} — ${plain(who.title)}`,
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
