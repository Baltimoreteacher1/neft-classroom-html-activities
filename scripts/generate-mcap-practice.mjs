// ── MCAP-style practice DOCX generator ───────────────────────────────────────
// SINGLE SOURCE OF TRUTH: scripts/mcap-practice/data/<lesson>.json
// (created by scripts/mcap-practice/extract-items.mjs from the curated
//  "Final_Flawless" set). This generator reads those JSON files and emits a
// polished, official-MCAP-styled Word doc back to:
//   lessons/<lesson>/downloads/printables/<lesson>-mcap-practice.docx
//
// Styling goals (clean Maryland-MCAP look):
//   • Title banner: "Grade 6 Mathematics · MCAP-Style Practice"
//   • Header row with the Reveal Lesson label and a clearly separated
//     "CCSS: <dotted code>" tag (fixes the run-together "Lesson 6-3CCSS" bug)
//   • Name / Date line
//   • Directions box
//   • Each item in its own bordered card: "Item N | <Type>", stem, choices
//     bulleted with ○ (single) / □ (multi) + A/B/C/D, answer lines for CR
//
// Idempotent: re-running regenerates identical files from the same JSON.
//
// Run: node scripts/generate-mcap-practice.mjs
//      npm run generate-mcap-practice

import { writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  PageNumber,
  Footer,
} from "docx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(__dirname, "mcap-practice", "data");
const lessonsDir = join(root, "lessons");

// ── brand / MCAP palette (matches scripts/generate-mcap-packets.mjs) ──────────
const NAVY = "12355B";
const TEAL = "1FA6A2";
const AMBER = "B97A12";
const INK = "1A2733";
const MUTED = "5F6F80";
const WHITE = "FFFFFF";
const CARD_BORDER = "C7D2DD";
const CARD_BG = "FFFFFF";
const HEADER_BG = "EEF4F8";
const HEADER_BORDER = "BBD0DE";
const DIRECTIONS_BG = "FBF3E2";
const DIRECTIONS_BORDER = "E7CF9B";
const LABEL_BG = "12355B"; // item-label chip background

const TYPE_LABELS = {
  selected: "Selected Response",
  multiselect: "Multiple Select",
  constructed: "Constructed Response",
  numeric: "Numeric Response",
};

const choiceLetter = (i) => String.fromCharCode(65 + i);
const choiceBullet = (type) => (type === "multiselect" ? "□" : "○");

// ── small helpers ─────────────────────────────────────────────────────────────
const _txt = (text, opts = {}) =>
  new TextRun({ text, size: 22, color: INK, font: "Calibri", ...opts });

function noBorders() {
  return {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };
}

function boxBorders(color, size = 6) {
  return {
    top: { style: BorderStyle.SINGLE, size, color },
    bottom: { style: BorderStyle.SINGLE, size, color },
    left: { style: BorderStyle.SINGLE, size, color },
    right: { style: BorderStyle.SINGLE, size, color },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };
}

// full-width single-cell shaded/bordered box
function box(children, { fill = WHITE, border = CARD_BORDER, size = 6, margins } = {}) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: boxBorders(border, size),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill },
            margins: margins || { top: 140, bottom: 140, left: 180, right: 180 },
            children,
          }),
        ],
      }),
    ],
  });
}

const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });

// ── document sections ─────────────────────────────────────────────────────────
function titleBanner() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: NAVY },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: "Grade 6 Mathematics",
                    bold: true,
                    color: WHITE,
                    size: 30,
                    font: "Calibri",
                  }),
                  new TextRun({ text: "  ·  ", color: TEAL, size: 30, font: "Calibri" }),
                  new TextRun({
                    text: "MCAP-Style Practice",
                    bold: true,
                    color: TEAL,
                    size: 30,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// header row: Lesson label (left) + clearly separated CCSS tag (right)
function headerRow(data) {
  const lessonText = data.revealLabel ? `Lesson ${data.revealLabel}` : "MCAP-Style Practice";
  const _ccssText = data.ccss ? `CCSS: ${data.ccss}` : "CCSS: —";
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: boxBorders(HEADER_BORDER, 6),
    columnWidths: [5400, 4600],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: HEADER_BG },
            margins: { top: 120, bottom: 120, left: 180, right: 120 },
            verticalAlign: "center",
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: lessonText,
                    bold: true,
                    color: NAVY,
                    size: 24,
                    font: "Calibri",
                  }),
                ],
              }),
              ...(data.title
                ? [
                    new Paragraph({
                      spacing: { before: 30, after: 0 },
                      children: [
                        new TextRun({ text: data.title, color: MUTED, size: 19, font: "Calibri" }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: HEADER_BG },
            margins: { top: 120, bottom: 120, left: 120, right: 180 },
            verticalAlign: "center",
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: "CCSS: ",
                    bold: true,
                    color: AMBER,
                    size: 24,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: data.ccss || "—",
                    bold: true,
                    color: NAVY,
                    size: 24,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function nameDateLine() {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({ text: "Name: ", bold: true, color: MUTED, size: 21, font: "Calibri" }),
      new TextRun({
        text: "______________________________________",
        color: MUTED,
        size: 21,
        font: "Calibri",
      }),
      new TextRun({ text: "      Date: ", bold: true, color: MUTED, size: 21, font: "Calibri" }),
      new TextRun({ text: "____________________", color: MUTED, size: 21, font: "Calibri" }),
    ],
  });
}

function directionsBox() {
  return box(
    [
      new Paragraph({
        spacing: { after: 0, line: 264 },
        children: [
          new TextRun({
            text: "Directions:  ",
            bold: true,
            color: AMBER,
            size: 21,
            font: "Calibri",
          }),
          new TextRun({
            text:
              "Read each item carefully. For selected-response items, choose the best answer. " +
              "For multiple-select items, mark every correct option. For constructed-response items, " +
              "show or explain your reasoning in the answer space.",
            color: INK,
            size: 21,
            font: "Calibri",
          }),
        ],
      }),
    ],
    { fill: DIRECTIONS_BG, border: DIRECTIONS_BORDER },
  );
}

// item-label chip: "Item N" navy chip + type label
function itemLabelParagraph(item) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: `  Item ${item.n}  `,
        bold: true,
        color: WHITE,
        size: 21,
        font: "Calibri",
        shading: { type: ShadingType.CLEAR, color: "auto", fill: LABEL_BG },
      }),
      new TextRun({ text: "   ", size: 21, font: "Calibri" }),
      new TextRun({
        text: (TYPE_LABELS[item.type] || "Item").toUpperCase(),
        bold: true,
        color: TEAL,
        size: 18,
        font: "Calibri",
        allCaps: false,
      }),
    ],
  });
}

function stemParagraph(item) {
  return new Paragraph({
    spacing: { after: item.choices && item.choices.length ? 110 : 80, line: 270 },
    children: [new TextRun({ text: item.stem, color: INK, size: 22, font: "Calibri" })],
  });
}

function choiceParagraph(item, choice, i) {
  return new Paragraph({
    spacing: { after: 60, line: 264 },
    indent: { left: 240 },
    children: [
      new TextRun({ text: `${choiceBullet(item.type)}  `, color: NAVY, size: 24, font: "Calibri" }),
      new TextRun({
        text: `${choiceLetter(i)}. `,
        bold: true,
        color: NAVY,
        size: 22,
        font: "Calibri",
      }),
      new TextRun({ text: choice, color: INK, size: 22, font: "Calibri" }),
    ],
  });
}

function answerLines(n = 7) {
  const rows = [];
  rows.push(
    new Paragraph({
      spacing: { before: 40, after: 60 },
      children: [
        new TextRun({
          text: "Answer Space",
          italics: true,
          bold: true,
          color: MUTED,
          size: 19,
          font: "Calibri",
        }),
      ],
    }),
  );
  for (let i = 0; i < n; i++) {
    rows.push(
      new Paragraph({
        spacing: { after: 0, line: 360 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 2, color: CARD_BORDER } },
        children: [new TextRun({ text: " ", size: 22, font: "Calibri" })],
      }),
    );
  }
  return rows;
}

function itemCard(item) {
  const children = [itemLabelParagraph(item), stemParagraph(item)];
  if (item.choices && item.choices.length) {
    item.choices.forEach((c, i) => children.push(choiceParagraph(item, c, i)));
  }
  if (item.type === "constructed" || item.type === "numeric") {
    children.push(...answerLines(item.answerSpaceLines || 7));
  }
  return box(children, {
    fill: CARD_BG,
    border: CARD_BORDER,
    size: 6,
    margins: { top: 150, bottom: 150, left: 200, right: 200 },
  });
}

function footer(data) {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        children: [
          new TextRun({
            text: "Neft Teacher · Grade 6 Mathematics · MCAP-Style Practice",
            color: MUTED,
            size: 16,
            font: "Calibri",
          }),
          ...(data.ccss
            ? [
                new TextRun({
                  text: `  ·  CCSS ${data.ccss}`,
                  color: MUTED,
                  size: 16,
                  font: "Calibri",
                }),
              ]
            : []),
          new TextRun({ text: "   ·   Page ", color: MUTED, size: 16, font: "Calibri" }),
          new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 16, font: "Calibri" }),
        ],
      }),
    ],
  });
}

// ── build one DOCX ─────────────────────────────────────────────────────────────
function buildDoc(data) {
  const body = [
    titleBanner(),
    spacer(120),
    headerRow(data),
    nameDateLine(),
    directionsBox(),
    spacer(160),
  ];
  data.items.forEach((item, idx) => {
    body.push(itemCard(item));
    if (idx < data.items.length - 1) body.push(spacer(160));
  });

  return new Document({
    creator: "Neft Teacher",
    title: `${data.revealLabel ? `Lesson ${data.revealLabel} ` : ""}MCAP-Style Practice`,
    description: data.ccss
      ? `Grade 6 Mathematics · CCSS ${data.ccss}`
      : "Grade 6 Mathematics MCAP-Style Practice",
    styles: { default: { document: { run: { font: "Calibri", size: 22, color: INK } } } },
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
        },
        footers: { default: footer(data) },
        children: body,
      },
    ],
  });
}

// ── driver ────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(dataDir)) {
    console.error(`No data dir ${dataDir}. Run extract-items.mjs first.`);
    process.exit(1);
  }
  const files = readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  if (files.length === 0) {
    console.error(`No JSON data files in ${dataDir}. Run extract-items.mjs first.`);
    process.exit(1);
  }

  let ok = 0;
  const skipped = [];
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(dataDir, f), "utf8"));
    const id = data.classroomId;
    const outDir = join(lessonsDir, id, "downloads", "printables");
    const outPath = join(outDir, `${id}-mcap-practice.docx`);
    if (!existsSync(outDir)) {
      skipped.push(`${id} (no target dir)`);
      continue;
    }
    if (!data.items || data.items.length === 0) {
      skipped.push(`${id} (no items)`);
      continue;
    }
    const doc = buildDoc(data);
    const buf = await Packer.toBuffer(doc);
    writeFileSync(outPath, buf);
    console.log(
      `  ✓ ${id.padEnd(14)} ${(data.revealLabel || "?").padEnd(6)} ${(data.ccss || "—").padEnd(13)} ${data.items.length} items`,
    );
    ok++;
  }
  console.log(
    `\nGenerated ${ok} MCAP-practice DOCX${skipped.length ? ` · skipped ${skipped.length}: ${skipped.join(", ")}` : ""}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
