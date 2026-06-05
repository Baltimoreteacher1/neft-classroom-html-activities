// ── Editable teacher version of each lesson's TPT-style bonus activity ───────
// For every lesson whose config.json has practice.optionalActivity, this emits
// a clean, EDITABLE Microsoft Word document containing the full activity with
// answers and explanations — the teacher's answer key / customizable source.
// Upload to Google Drive to edit it as a Google Doc, or edit directly in Word.
//
// Output is written to a TEACHER-ONLY area (not linked from student pages):
//   teacher-tools/activity-guides/<id>-activity-teacher.docx
// plus an index page:
//   teacher-tools/activity-guides/index.html
//
// Usage:
//   node scripts/generate-activity-teacher-docs.mjs            # all lessons
//   node scripts/generate-activity-teacher-docs.mjs 1-1 5-1    # specific lessons

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LESSONS = join(ROOT, "lessons");
const OUT_DIR = join(ROOT, "teacher-tools", "activity-guides");

const NAVY = "153F53";
const TEAL = "0E7C86";
const AMBER = "B45309";
const GREEN = "166534";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.align,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 22, // half-points → 11pt
        color: opts.color,
        font: "Calibri",
      }),
    ],
  });
}

function shadedLabel(text, fill) {
  return new Paragraph({
    spacing: { after: 80, before: 160 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill },
    children: [
      new TextRun({ text, bold: true, color: "FFFFFF", size: 22, font: "Calibri" }),
    ],
  });
}

function renderItem(item, idx, stepWord) {
  const out = [];
  const label = `${stepWord} ${idx + 1}`;
  const type = item.type;

  if (type === "multiple-choice") {
    out.push(shadedLabel(`${label} · Multiple Choice`, TEAL));
    out.push(p(item.stem || "", { bold: true }));
    (item.choices || []).forEach((c, i) => {
      const correct = i === item.correctIndex;
      out.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${LETTERS[i]}. `, bold: true, size: 22, font: "Calibri" }),
            new TextRun({ text: String(c), size: 22, font: "Calibri" }),
            ...(correct
              ? [new TextRun({ text: "   ✓ correct", bold: true, color: GREEN, size: 22, font: "Calibri" })]
              : []),
          ],
        }),
      );
    });
    if (item.explanation) out.push(p(`Why: ${item.explanation}`, { italics: true, color: "555555", before: 40 }));
  } else if (type === "drag-sort") {
    out.push(shadedLabel(`${label} · Sort`, TEAL));
    if (item.instructions) out.push(p(item.instructions, { bold: true }));
    const cats = item.categories || [];
    cats.forEach((cat) => {
      out.push(p(cat.label || cat.id, { bold: true, color: NAVY, before: 60 }));
      (item.items || [])
        .filter((it) => it.category === cat.id)
        .forEach((it) => out.push(p(`•  ${it.text}`, { after: 30 })));
    });
  } else if (type === "matching-game") {
    out.push(shadedLabel(`${label} · Matching`, TEAL));
    if (item.label) out.push(p(item.label, { bold: true }));
    (item.pairs || []).forEach((pr) =>
      out.push(p(`${pr.term}   →   ${pr.match}`, { after: 30 })),
    );
  } else if (type === "error-analysis") {
    out.push(shadedLabel(`${item.title || label} · Error Analysis`, AMBER));
    (item.workedExample || []).forEach((step, i) => {
      const isErr = i === item.errorStep;
      out.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${step.label}: `, bold: true, size: 22, font: "Calibri" }),
            new TextRun({ text: String(step.work), size: 22, font: "Calibri" }),
            ...(isErr
              ? [new TextRun({ text: "   ⟵ mistake here", bold: true, color: AMBER, size: 22, font: "Calibri" })]
              : []),
          ],
        }),
      );
    });
    if (item.correctWork) out.push(p(`Correct: ${item.correctWork}`, { bold: true, color: GREEN, before: 60 }));
    (item.hints || []).forEach((h) => out.push(p(`Hint: ${h}`, { italics: true, color: "555555", after: 30 })));
  } else {
    out.push(shadedLabel(`${label} · ${type}`, TEAL));
    out.push(p(item.instructions || item.stem || item.label || JSON.stringify(item), {}));
  }
  return out;
}

function buildDoc(id, cfg) {
  const pr = cfg.practice || {};
  const act = pr.optionalActivity || {};
  const items = Array.isArray(pr.optional) ? pr.optional : [];
  const stepWord = act.stepLabel || "Stage";
  const children = [];

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "TEACHER VERSION · ANSWER KEY", bold: true, color: AMBER, size: 18, font: "Calibri" }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `${act.emoji ? act.emoji + " " : ""}${act.name || "Bonus Activity"}`,
          bold: true,
          color: NAVY,
          size: 36,
          font: "Calibri",
        }),
      ],
    }),
  );
  children.push(
    p(
      `Lesson ${id}${cfg.title ? " — " + cfg.title : ""}${cfg.standard ? "  ·  " + cfg.standard : ""}`,
      { color: "555555", size: 20 },
    ),
  );
  if (act.intro) children.push(p(act.intro, { italics: true, after: 80 }));
  children.push(
    p(
      "This is the editable teacher copy of the student bonus activity. Edit names, numbers, or supports as needed. Answers and explanations are for teacher use only — they are auto-checked in the student interactive version and are not shown here to students.",
      { italics: true, color: "777777", size: 18, after: 160 },
    ),
  );
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL } },
      spacing: { after: 120 },
      children: [],
    }),
  );

  items.forEach((item, i) => renderItem(item, i, stepWord).forEach((c) => children.push(c)));

  return new Document({
    creator: "Neft Teacher",
    title: `${act.name || "Activity"} — Teacher Version (${id})`,
    sections: [
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children,
      },
    ],
  });
}

function lessonIds() {
  return readdirSync(LESSONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_template")
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const argIds = process.argv.slice(2);
const ids = (argIds.length ? argIds : lessonIds()).filter((id) =>
  existsSync(join(LESSONS, id, "config.json")),
);

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const made = [];
for (const id of ids) {
  const cfg = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
  const act = cfg.practice?.optionalActivity;
  const items = cfg.practice?.optional;
  if (!act || !Array.isArray(items) || !items.length) continue;
  const doc = buildDoc(id, cfg);
  const buf = await Packer.toBuffer(doc);
  const file = `${id}-activity-teacher.docx`;
  writeFileSync(join(OUT_DIR, file), buf);
  made.push({ id, name: act.name, standard: cfg.standard, title: cfg.title, file });
}

// Teacher index page (NOT linked from any student-facing hub).
made.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
const rows = made
  .map(
    (m) =>
      `      <tr><td>${m.id}</td><td>${m.standard || ""}</td><td>${escapeHtml(m.name)}</td><td><a href="./${m.file}" download>Edit (DOCX)</a></td></tr>`,
  )
  .join("\n");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Teacher Activity Guides — Neft Teacher</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#143;}
  h1{color:#153F53;} p.note{color:#555;}
  table{border-collapse:collapse;width:100%;margin-top:1rem;}
  th,td{border:1px solid #cbd5e1;padding:.5rem .6rem;text-align:left;font-size:.95rem;}
  th{background:#153F53;color:#fff;} tr:nth-child(even){background:#f1f5f9;}
  a{color:#0E7C86;font-weight:600;}
</style></head>
<body>
  <h1>Teacher Activity Guides</h1>
  <p class="note">Editable teacher (answer-key) versions of every lesson's bonus TPT-style activity.
  Download the DOCX to edit in Word, or upload to Google Drive to edit as a Google Doc. The student
  version is the auto-graded interactive activity inside each lesson. <strong>Teacher use only.</strong></p>
  <table>
    <thead><tr><th>Lesson</th><th>Standard</th><th>Activity</th><th>Teacher copy</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <p class="note">${made.length} activities.</p>
</body></html>
`;
writeFileSync(join(OUT_DIR, "index.html"), html);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

console.log(`Generated ${made.length} teacher activity DOCX + index.html in teacher-tools/activity-guides/`);
