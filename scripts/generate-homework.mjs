// Generates printable per-lesson HOMEWORK .docx files from each lesson's config.
// Output: lessons/<id>/homework.docx
//
// Run: node scripts/generate-homework.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { Resvg } from "@resvg/resvg-js";
import { resolveVocabImage } from "../engine/core/vocab-images.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Rasterize a vocab term's SVG illustration to a PNG buffer so it embeds in
// Word natively (no SVG-fallback quirks). Memoized per source file. Returns
// { data, width, height } sized for a tidy ~110px-wide figure, or null if the
// asset is missing — callers degrade gracefully (text only) rather than crash.
// Ported from scripts/generate-docx.mjs (notes packets) so homework packets
// show the same visual vocabulary (picture + word + meaning).
const _vocabPngCache = new Map();
function vocabPng(term) {
  const webPath = resolveVocabImage(term); // e.g. "/assets/vocab-images/triangle.svg"
  if (_vocabPngCache.has(webPath)) return _vocabPngCache.get(webPath);
  let out = null;
  try {
    const file = join(root, webPath.replace(/^\//, ""));
    if (existsSync(file)) {
      // Strip <title>/<desc> before rasterizing: some assets embed raw "<"/">"
      // in their accessible title (fine for browsers, rejected by resvg's
      // strict XML parser). They aren't needed for rendering.
      const svg = readFileSync(file, "utf8")
        .replace(/<title[\s\S]*?<\/title>/gi, "")
        .replace(/<desc[\s\S]*?<\/desc>/gi, "");
      const r = new Resvg(svg, { fitTo: { mode: "width", value: 320 } });
      const png = r.render();
      const buf = png.asPng();
      const display = 110; // points-ish width in the doc
      const scale = display / png.width;
      out = {
        data: buf,
        width: Math.round(png.width * scale),
        height: Math.round(png.height * scale),
      };
    }
  } catch {
    out = null;
  }
  _vocabPngCache.set(webPath, out);
  return out;
}

// ---------- config loading ----------
function lessonConfigs() {
  const out = [];
  for (const dir of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith("_")) continue;
    const cfgPath = join(lessonsDir, dir.name, "config.json");
    if (!existsSync(cfgPath)) continue;
    try {
      const config = JSON.parse(readFileSync(cfgPath, "utf8"));
      out.push({ id: dir.name, config });
    } catch (err) {
      console.error(`Skipping ${dir.name}: ${err.message}`);
    }
  }
  out.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return out;
}

// ---------- small paragraph helpers ----------
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: String(text ?? ""), ...opts })],
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.alignment,
  });
}

function blankLines(n = 2) {
  // Work space: underscored lines students can write on.
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "_".repeat(70),
            color: "BBBBBB",
          }),
        ],
        spacing: { before: 120, after: 60 },
      }),
    );
  }
  return out;
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}

// ---------- practice selection ----------
// Aim for ~6-10 problems, drawn from onLevel + optional + a couple approaching.
function selectProblems(practice = {}) {
  const onLevel = Array.isArray(practice.onLevel) ? practice.onLevel : [];
  const optional = Array.isArray(practice.optional) ? practice.optional : [];
  const approaching = Array.isArray(practice.approaching)
    ? practice.approaching
    : [];

  const picked = [];
  // A couple of approaching (warm-up) problems first.
  picked.push(...approaching.slice(0, 2));
  // Core on-level work.
  picked.push(...onLevel);
  // Then optional extras.
  picked.push(...optional);

  // Keep only printable problem types we know how to render.
  const printable = picked.filter((it) => isPrintable(it));
  // Cap at 10, but ensure at least we keep what we have if fewer.
  return printable.slice(0, 10);
}

function isPrintable(it) {
  if (!it || typeof it !== "object") return false;
  return [
    "multiple-choice",
    "fill-table",
    "matching-game",
    "drag-sort",
    "error-analysis",
    "open-response",
  ].includes(it.type);
}

// ---------- per-type renderers (worksheet body) ----------
function renderProblem(it, num) {
  const out = [];
  switch (it.type) {
    case "multiple-choice":
      out.push(
        p(`${num}. ${it.stem || ""}`, { bold: true, after: 80 }),
      );
      (it.choices || []).forEach((c, i) => {
        out.push(p(`     ${LETTERS[i] || i}. ${c}`, { after: 40 }));
      });
      out.push(...blankLines(1));
      break;

    case "fill-table": {
      out.push(p(`${num}. ${it.instructions || it.label || "Complete the table."}`, { bold: true, after: 80 }));
      out.push(buildWorksheetTable(it));
      out.push(...blankLines(1));
      break;
    }

    case "matching-game": {
      out.push(
        p(`${num}. ${it.label || "Match each item on the left to its answer on the right."}`, { bold: true, after: 80 }),
      );
      out.push(buildMatchingTable(it));
      out.push(...blankLines(1));
      break;
    }

    case "drag-sort": {
      out.push(p(`${num}. ${it.instructions || "Sort each item into the correct group."}`, { bold: true, after: 80 }));
      const cats = (it.categories || []).map((c) => c.label).join("   |   ");
      if (cats) out.push(p(`Groups: ${cats}`, { italics: true, after: 80 }));
      (it.items || []).forEach((item) => {
        out.push(p(`   • ${item.text}   → __________________`, { after: 40 }));
      });
      out.push(...blankLines(1));
      break;
    }

    case "error-analysis": {
      out.push(p(`${num}. ${it.title || "Find the mistake."}`, { bold: true, after: 80 }));
      (it.workedExample || []).forEach((step, i) => {
        out.push(p(`   Step ${i + 1} (${step.label}): ${step.work}`, { after: 40 }));
      });
      out.push(p("Which step has the mistake? Explain and fix it:", { italics: true, after: 60 }));
      out.push(...blankLines(3));
      break;
    }

    case "open-response": {
      out.push(p(`${num}. ${it.prompt || ""}`, { bold: true, after: 80 }));
      if (it.sentenceFrame) {
        out.push(p(`Sentence starter: ${it.sentenceFrame}`, { italics: true, after: 60 }));
      }
      out.push(...blankLines(4));
      break;
    }

    default:
      break;
  }
  return out;
}

// fill-table supports two config shapes:
//  A) { columns:[...], rows:[{given, split, answer, expanded, ...}] }  (1-1)
//  B) { headers:[...], rows:[[...]], editableCells:[{row,col,answer}] } (5-1)
function buildWorksheetTable(it) {
  let headers = [];
  let bodyRows = [];

  if (Array.isArray(it.headers) && Array.isArray(it.rows) && Array.isArray(it.rows[0])) {
    // Shape B
    headers = it.headers;
    bodyRows = it.rows.map((row) => row.map((cell) => (cell == null || cell === "" ? "" : String(cell))));
  } else if (Array.isArray(it.columns) && Array.isArray(it.rows)) {
    // Shape A — derive cell values from object keys, blanking out the "answer".
    headers = it.columns;
    const keys = headerKeysFor(it.columns, it.rows[0] || {});
    bodyRows = it.rows.map((rowObj) =>
      keys.map((k) => (k === "answer" ? "" : String(rowObj[k] ?? ""))),
    );
  } else {
    return p("(table)", { italics: true });
  }

  const makeCell = (text, isHeader) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: String(text || (isHeader ? "" : " ")), bold: !!isHeader })],
        }),
      ],
      width: { size: Math.floor(100 / Math.max(headers.length, 1)), type: WidthType.PERCENTAGE },
    });

  const rows = [];
  rows.push(new TableRow({ tableHeader: true, children: headers.map((h) => makeCell(h, true)) }));
  for (const r of bodyRows) {
    // Pad row to header width.
    const cells = [];
    for (let i = 0; i < headers.length; i++) cells.push(makeCell(r[i] ?? "", false));
    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// Map column labels (Shape A) to row-object keys.
function headerKeysFor(columns, sampleRow) {
  // Prefer well-known keys in order, falling back to row keys.
  const rowKeys = Object.keys(sampleRow);
  // Common patterns: given, split/expanded, answer
  const guesses = [];
  for (let i = 0; i < columns.length; i++) {
    if (i === 0 && rowKeys.includes("given")) guesses.push("given");
    else if (i === columns.length - 1 && rowKeys.includes("answer")) guesses.push("answer");
    else {
      // pick the next unused middle key
      const used = new Set(guesses);
      const candidate = rowKeys.find(
        (k) => !used.has(k) && k !== "given" && k !== "answer",
      );
      guesses.push(candidate || rowKeys[i] || "answer");
    }
  }
  return guesses;
}

function buildMatchingTable(it) {
  const pairs = it.pairs || [];
  // Left column = terms in order; right column = shuffled matches with letters
  // so students draw lines / write the letter.
  const matches = pairs.map((pr, i) => ({ letter: LETTERS[i] || String(i), text: pr.match }));
  // Simple deterministic shuffle (reverse) so the answers aren't aligned.
  const shuffled = [...matches].reverse();

  const makeCell = (children, opts = {}) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children })],
      ...opts,
    });

  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        makeCell([new TextRun({ text: "Item", bold: true })]),
        makeCell([new TextRun({ text: "Answer choices", bold: true })]),
      ],
    }),
  ];

  const maxLen = Math.max(pairs.length, shuffled.length);
  for (let i = 0; i < maxLen; i++) {
    const left = pairs[i] ? `____  ${pairs[i].term}` : "";
    const right = shuffled[i] ? `${shuffled[i].letter}. ${shuffled[i].text}` : "";
    rows.push(
      new TableRow({
        children: [
          makeCell([new TextRun({ text: left })]),
          makeCell([new TextRun({ text: right })]),
        ],
      }),
    );
  }

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

// ---------- answer key ----------
function renderAnswer(it, num) {
  const out = [];
  switch (it.type) {
    case "multiple-choice": {
      const idx = it.correctIndex ?? 0;
      const letter = LETTERS[idx] || String(idx);
      const ans = (it.choices || [])[idx] ?? "";
      out.push(p(`${num}. ${letter}. ${ans}`, { bold: true, after: 40 }));
      if (it.explanation) out.push(p(`     ${it.explanation}`, { after: 80 }));
      break;
    }
    case "fill-table": {
      const answers = fillTableAnswers(it);
      out.push(p(`${num}. ${it.label || it.instructions || "Table"}`, { bold: true, after: 40 }));
      if (answers.length) {
        answers.forEach((a) => out.push(p(`     ${a}`, { after: 20 })));
      } else {
        out.push(p("     (See completed table.)", { after: 40 }));
      }
      out.push(p("", { after: 40 }));
      break;
    }
    case "matching-game": {
      out.push(p(`${num}. Matches:`, { bold: true, after: 40 }));
      (it.pairs || []).forEach((pr) => {
        out.push(p(`     ${pr.term} → ${pr.match}`, { after: 20 }));
      });
      out.push(p("", { after: 40 }));
      break;
    }
    case "drag-sort": {
      out.push(p(`${num}. Correct groups:`, { bold: true, after: 40 }));
      const catLabel = {};
      (it.categories || []).forEach((c) => (catLabel[c.id] = c.label));
      (it.items || []).forEach((item) => {
        out.push(p(`     ${item.text} → ${catLabel[item.category] || item.category}`, { after: 20 }));
      });
      out.push(p("", { after: 40 }));
      break;
    }
    case "error-analysis": {
      out.push(p(`${num}. ${it.title || "Error analysis"}`, { bold: true, after: 40 }));
      if (typeof it.errorStep === "number") {
        out.push(p(`     The mistake is in Step ${it.errorStep + 1}.`, { after: 20 }));
      }
      if (it.correctWork) out.push(p(`     ${it.correctWork}`, { after: 80 }));
      break;
    }
    case "open-response": {
      out.push(p(`${num}. Open response — answers will vary.`, { bold: true, after: 40 }));
      if (Array.isArray(it.keywords) && it.keywords.length) {
        out.push(p(`     Look for key words: ${it.keywords.join(", ")}.`, { after: 80 }));
      }
      break;
    }
    default:
      break;
  }
  return out;
}

function fillTableAnswers(it) {
  const out = [];
  if (Array.isArray(it.editableCells)) {
    // Shape B
    for (const ec of it.editableCells) {
      const header = (it.headers || [])[ec.col] || `Col ${ec.col}`;
      const rowLabel = ((it.rows || [])[ec.row] || [])[0] || `Row ${ec.row + 1}`;
      out.push(`${rowLabel} — ${header}: ${ec.answer}`);
    }
  } else if (Array.isArray(it.rows)) {
    // Shape A
    for (const r of it.rows) {
      if (r && typeof r === "object" && r.answer != null) {
        const label = r.given != null ? r.given : "";
        out.push(`${label} → ${r.answer}`);
      }
    }
  }
  return out;
}

// ---------- document assembly ----------
function buildDoc(id, config) {
  const children = [];

  // Header: title + standard
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 60 },
      children: [new TextRun({ text: `${config.title || "Lesson"} — Homework`, bold: true })],
    }),
  );
  if (config.standard) {
    children.push(p(`Lesson ${config.lessonId || id}  •  Standard ${config.standard}`, { italics: true, after: 160 }));
  }

  // Name / Period / Date line
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Name: ", bold: true }),
        new TextRun({ text: "______________________     " }),
        new TextRun({ text: "Period: ", bold: true }),
        new TextRun({ text: "______     " }),
        new TextRun({ text: "Date: ", bold: true }),
        new TextRun({ text: "____________" }),
      ],
    }),
  );

  // Objectives
  if (config.contentObjective || config.languageObjective) {
    children.push(sectionHeading("Today's Goals"));
    if (config.contentObjective) {
      children.push(p(`Content: ${objectiveText(config.contentObjective)}`, { after: 60 }));
    }
    if (config.languageObjective) {
      children.push(p(`Language: ${objectiveText(config.languageObjective)}`, { after: 60 }));
    }
  }

  // Key Words — picture first (when available), then the word + plain meaning,
  // mirroring the visual-vocabulary house pattern used in the notes packets.
  const vocab = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  if (vocab.length) {
    children.push(sectionHeading("Key Words"));
    vocab.forEach((v) => {
      const pic = vocabPng(v.term);
      if (pic) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 20 },
            keepNext: true,
            children: [
              new ImageRun({
                type: "png",
                data: pic.data,
                transformation: { width: pic.width, height: pic.height },
              }),
            ],
          }),
        );
      }
      const es = v.termEs ? ` (${v.termEs})` : "";
      children.push(
        new Paragraph({
          spacing: { after: pic ? 120 : 60 },
          keepNext: !!pic,
          children: [
            new TextRun({ text: `${v.term}${es}`, bold: true }),
            new TextRun({ text: ` — ${v.definition || ""}` }),
          ],
        }),
      );
    });
  }

  // Practice
  const problems = selectProblems(config.practice || {});
  children.push(sectionHeading("Practice"));
  children.push(p("Show your work. Use the blank space under each problem.", { italics: true, after: 160 }));

  if (!problems.length) {
    children.push(p("No printable practice problems for this lesson.", { italics: true }));
  } else {
    problems.forEach((it, i) => {
      for (const node of renderProblem(it, i + 1)) children.push(node);
    });
  }

  // Answer Key (page break before)
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Answer Key (Teacher)", bold: true })],
    }),
  );
  if (!problems.length) {
    children.push(p("No problems.", { italics: true }));
  } else {
    problems.forEach((it, i) => {
      for (const node of renderAnswer(it, i + 1)) children.push(node);
    });
  }

  return new Document({
    creator: "Neft Teacher",
    title: `${config.title || id} Homework`,
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
        },
        children,
      },
    ],
  });
}

// Objectives may already start with "I can"; keep them clean and simple.
function objectiveText(obj) {
  const t = String(obj || "").trim();
  return t;
}

// ---------- main ----------
async function main() {
  const lessons = lessonConfigs();
  let count = 0;
  for (const { id, config } of lessons) {
    const doc = buildDoc(id, config);
    const buffer = await Packer.toBuffer(doc);
    const outPath = join(lessonsDir, id, "homework.docx");
    writeFileSync(outPath, buffer);
    count++;
  }
  console.log(`Generated ${count} homework.docx files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
