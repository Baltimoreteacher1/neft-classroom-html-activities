// ── MCAP review-packet generator ─────────────────────────────────────────────
// Builds the downloadable MCAP Grade 6 review-packet series from the single
// source of truth in mcap-review/data/mcap-skills.mjs.
//
// For each skill it emits:
//   • mcap-review/packets/<domain>/<skill>.docx   — TpT-quality Word study packet
//   • mcap-review/packets/<domain>/<skill>.html   — branded, printable web packet
// For each domain it emits a combined review packet:
//   • mcap-review/packets/<domain>/<domain>-review-packet.docx
// And it builds the visual download hub:
//   • mcap-review/packets/index.html
//
// Run: node scripts/generate-mcap-packets.mjs
//      npm run generate-mcap

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
  BorderStyle,
  PageNumber,
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import { DOMAINS, ALL_SKILLS, skillFileSlug } from "../mcap-review/data/mcap-skills.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outRoot = join(root, "mcap-review", "packets");

// ── brand palette (matches scripts/generate-docx.mjs) ─────────────────────────
const NAVY = "12355B";
const TEAL = "1FA6A2";
const AMBER = "B97A12";
const PURPLE = "6B4FA0";
const MUTED = "5F6F80";
const INK = "1A2733";
const RULE = "C7D2DD";
const BOX_BG = "EEF4F8";
const BOX_BORDER = "BBD0DE";
const AMBER_BG = "FBF3E2";
const TEAL_BG = "E6F4F3";
const PURPLE_BG = "EFEAF6";
const WHITE = "FFFFFF";

const choiceLetter = (i) => String.fromCharCode(65 + i);

// Human-readable, official-style label for each MCAP item type.
const ITEM_TYPE_LABEL = {
  "multiple-choice": "Selected Response",
  short: "Constructed Response",
};
const itemTypeLabel = (type) => ITEM_TYPE_LABEL[type] || "Selected Response";

// Official-style direction line per item type.
const itemDirections = (type) =>
  type === "multiple-choice"
    ? "Select the correct answer."
    : "Enter your answer in the space provided. Show your work.";

// ── DOCX helpers ──────────────────────────────────────────────────────────────
const run = (text, opts = {}) => new TextRun({ text, size: 21, color: INK, font: "Calibri", ...opts });

const para = (children, opts = {}) =>
  new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { after: 120, line: 264 }, ...opts });

function sectionHeading(text, color = NAVY) {
  return new Paragraph({
    spacing: { before: 260, after: 130 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 14, space: 6, color } },
    children: [new TextRun({ text, bold: true, color, size: 28, font: "Calibri" })],
  });
}

function cueHeading(text, tag, color) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text, bold: true, color: NAVY, size: 24, font: "Calibri" }),
      new TextRun({ text: `   ${tag}`, italics: true, color, size: 19, font: "Calibri" }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: [run(text)],
  });
}

// shaded full-width callout box (single-cell table)
function calloutBox(children, { fill = BOX_BG, border = BOX_BORDER } = {}) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: border },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: border },
      left: { style: BorderStyle.SINGLE, size: 6, color: border },
      right: { style: BorderStyle.SINGLE, size: 6, color: border },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children,
          }),
        ],
      }),
    ],
  });
}

// blank handwriting lines
function workLines(n = 3) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push(
      new Paragraph({
        spacing: { before: i === 0 ? 60 : 0, after: 0, line: 360 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 2, color: "AFBECC" } },
        children: [run("")],
      })
    );
  }
  return rows;
}

function spacer(after = 80) {
  return new Paragraph({ spacing: { after }, children: [run("")] });
}

// "Item N | Selected Response · 6.RP.A.1" label row above each MCAP item card.
function itemLabel(n, type, code, color) {
  return new Paragraph({
    spacing: { before: 30, after: 30 },
    indent: { left: 120, right: 120 },
    children: [
      new TextRun({ text: `Item ${n}`, bold: true, color: WHITE, size: 18, font: "Calibri" }),
      new TextRun({ text: "   |   ", color: WHITE, size: 18, font: "Calibri" }),
      new TextRun({ text: itemTypeLabel(type).toUpperCase(), color: WHITE, size: 16, font: "Calibri", characterSpacing: 14 }),
      new TextRun({ text: "\t", font: "Calibri" }),
      new TextRun({ text: code, bold: true, color: WHITE, size: 17, font: "Calibri" }),
    ],
    tabStops: [{ type: "right", position: 9000 }],
    shading: { type: ShadingType.CLEAR, color: "auto", fill: color },
  });
}

// One MCAP item rendered as a bordered card (label bar + body).
function mcapItemCard(it, n, code, color) {
  const body = [];
  // label bar (single-cell shaded row handled by the table shading)
  body.push(itemLabel(n, it.type, code, color));
  body.push(
    new Paragraph({
      spacing: { before: 90, after: 30 },
      indent: { left: 140, right: 120 },
      children: [run(it.prompt, { bold: true })],
    })
  );
  body.push(
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 140, right: 120 },
      children: [new TextRun({ text: itemDirections(it.type), italics: true, color: MUTED, size: 18, font: "Calibri" })],
    })
  );
  if (it.type === "multiple-choice") {
    it.choices.forEach((c, ci) =>
      body.push(
        new Paragraph({
          spacing: { after: 24 },
          indent: { left: 380 },
          children: [
            new TextRun({ text: "○  ", color: color, size: 22, font: "Calibri" }),
            new TextRun({ text: `${choiceLetter(ci)}.  `, bold: true, color: INK, size: 21, font: "Calibri" }),
            new TextRun({ text: c, size: 21, color: INK, font: "Calibri" }),
          ],
        })
      )
    );
  } else {
    body.push(
      new Paragraph({
        spacing: { before: 30, after: 6, line: 360 },
        indent: { left: 140, right: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 2, color: "AFBECC" } },
        children: [run("")],
      })
    );
    body.push(
      new Paragraph({
        spacing: { after: 0, line: 360 },
        indent: { left: 140, right: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 2, color: "AFBECC" } },
        children: [run("")],
      })
    );
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 6, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 6, color: RULE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 0, bottom: 120, left: 0, right: 160 },
            children: body,
          }),
        ],
      }),
    ],
  });
}

// vocabulary as a 2-col table of cards
function vocabTable(vocab) {
  const cellFor = (v) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: TEAL_BG },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [
        new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: v.term, bold: true, color: NAVY, size: 21, font: "Calibri" })] }),
        new Paragraph({ children: [new TextRun({ text: v.def, size: 19, color: INK, font: "Calibri" })] }),
      ],
    });
  const rows = [];
  for (let i = 0; i < vocab.length; i += 2) {
    const cells = [cellFor(vocab[i])];
    if (vocab[i + 1]) cells.push(cellFor(vocab[i + 1]));
    else
      cells.push(
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [run("")] })] })
      );
    rows.push(new TableRow({ children: cells }));
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: WHITE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: WHITE },
      left: { style: BorderStyle.SINGLE, size: 4, color: WHITE },
      right: { style: BorderStyle.SINGLE, size: 4, color: WHITE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: WHITE },
      insideVertical: { style: BorderStyle.SINGLE, size: 8, color: WHITE },
    },
    rows,
  });
}

function noBorders() {
  const n = { style: BorderStyle.NONE, size: 0, color: WHITE };
  return { top: n, bottom: n, left: n, right: n };
}

function coverBlock(skill) {
  return [
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "NEFT TEACHER", bold: true, color: TEAL, size: 18, font: "Calibri" }),
        new TextRun({ text: "   ·   MCAP GRADE 6 REVIEW", color: MUTED, size: 18, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 30 },
      children: [new TextRun({ text: skill.title, bold: true, color: NAVY, size: 40, font: "Calibri" })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, space: 8, color: skill.domainColor } },
      children: [
        new TextRun({ text: `${skill.domainTitle}`, color: INK, size: 22, font: "Calibri" }),
        new TextRun({ text: `   ·   Standard ${skill.code}`, bold: true, color: skill.domainColor, size: 22, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "Name: ", bold: true, color: MUTED, size: 20, font: "Calibri" }),
        new TextRun({ text: "______________________________      ", size: 20, color: MUTED, font: "Calibri" }),
        new TextRun({ text: "Date: ", bold: true, color: MUTED, size: 20, font: "Calibri" }),
        new TextRun({ text: "________________", size: 20, color: MUTED, font: "Calibri" }),
      ],
    }),
  ];
}

// build the body for one skill (without cover or answer key)
function skillBody(skill, { includeWorkLines = true } = {}) {
  const out = [];

  // Goal box
  out.push(
    calloutBox(
      [
        new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "🎯 Learning Goal", bold: true, color: NAVY, size: 20, font: "Calibri" })] }),
        new Paragraph({ children: [run(skill.summary)] }),
      ],
      { fill: BOX_BG, border: BOX_BORDER }
    )
  );
  out.push(spacer());

  // Vocabulary
  out.push(sectionHeading("Vocabulary", TEAL));
  out.push(vocabTable(skill.vocab));
  out.push(spacer());

  // What You Need to Know
  out.push(sectionHeading("What You Need to Know", NAVY));
  skill.needToKnow.forEach((b) => out.push(bullet(b)));

  // Worked example — I Do
  out.push(cueHeading("Worked Example", "I Do — watch how it works", TEAL));
  out.push(
    calloutBox(
      [
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: skill.workedExample.problem, bold: true, color: INK, size: 21, font: "Calibri" })] }),
        ...skill.workedExample.steps.map(
          (s, i) =>
            new Paragraph({
              spacing: { after: 40, line: 260 },
              children: [new TextRun({ text: `Step ${i + 1}.  `, bold: true, color: TEAL, size: 20, font: "Calibri" }), run(s)],
            })
        ),
        new Paragraph({
          spacing: { before: 40 },
          children: [new TextRun({ text: "Answer:  ", bold: true, color: NAVY, size: 21, font: "Calibri" }), new TextRun({ text: skill.workedExample.answer, bold: true, color: INK, size: 21, font: "Calibri" })],
        }),
      ],
      { fill: TEAL_BG, border: TEAL }
    )
  );
  out.push(spacer());

  // Guided practice — We Do
  out.push(cueHeading("Guided Practice", "We Do — try it together (hints given)", PURPLE));
  skill.guided.forEach((g, i) => {
    out.push(
      new Paragraph({
        spacing: { before: 100, after: 30 },
        children: [new TextRun({ text: `${i + 1}.  `, bold: true, color: PURPLE, size: 21, font: "Calibri" }), run(g.problem)],
      })
    );
    out.push(new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: `💡 Hint: ${g.hint}`, italics: true, color: MUTED, size: 19, font: "Calibri" })] }));
    if (includeWorkLines) out.push(...workLines(2));
  });
  out.push(spacer());

  // Independent practice — You Do
  out.push(cueHeading("Independent Practice", "You Do — show your work", AMBER));
  skill.independent.forEach((p, i) => {
    out.push(
      new Paragraph({
        spacing: { before: 100, after: 30 },
        children: [new TextRun({ text: `${i + 1}.  `, bold: true, color: AMBER, size: 21, font: "Calibri" }), run(p.problem)],
      })
    );
    if (includeWorkLines) out.push(...workLines(2));
  });
  out.push(spacer());

  // MCAP-style practice — official assessment look
  out.push(sectionHeading("MCAP-Style Practice", skill.domainColor));
  out.push(
    calloutBox(
      [
        new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "Directions", bold: true, color: NAVY, size: 19, font: "Calibri" })] }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Read each item carefully and answer it the way you would on the MCAP. For selected-response items, fill in the circle (○) next to the correct answer. For constructed-response items, enter your answer and show your work. Every item below assesses standard ${skill.code}.`,
              color: INK,
              size: 19,
              font: "Calibri",
            }),
          ],
        }),
      ],
      { fill: BOX_BG, border: BOX_BORDER }
    )
  );
  out.push(spacer(120));
  skill.mcapItems.forEach((it, i) => {
    out.push(mcapItemCard(it, i + 1, skill.code, skill.domainColor));
    out.push(spacer(100));
  });

  return out;
}

function answerKey(skills, label) {
  const out = [];
  out.push(new Paragraph({ pageBreakBefore: true, spacing: { after: 60 }, children: [new TextRun({ text: "🔑 Teacher Answer Key", bold: true, color: NAVY, size: 30, font: "Calibri" })] }));
  out.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `${label} — for teacher use. Remove before copying for students.`, italics: true, color: MUTED, size: 19, font: "Calibri" })] }));

  skills.forEach((skill) => {
    out.push(sectionHeading(`${skill.code} — ${skill.title}`, skill.domainColor));
    out.push(new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "Independent Practice: ", bold: true, color: AMBER, size: 20, font: "Calibri" })] }));
    skill.independent.forEach((p, i) =>
      out.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 200 }, children: [new TextRun({ text: `${i + 1}. `, bold: true, size: 19, color: INK, font: "Calibri" }), new TextRun({ text: p.answer, size: 19, color: INK, font: "Calibri" })] }))
    );
    out.push(new Paragraph({ spacing: { before: 60, after: 30 }, children: [new TextRun({ text: `MCAP-Style Practice (${skill.code}): `, bold: true, color: NAVY, size: 20, font: "Calibri" })] }));
    skill.mcapItems.forEach((it, i) =>
      out.push(
        new Paragraph({
          spacing: { after: 20 },
          indent: { left: 200 },
          children: [
            new TextRun({ text: `Item ${i + 1} `, bold: true, size: 19, color: INK, font: "Calibri" }),
            new TextRun({ text: `(${itemTypeLabel(it.type)}): `, size: 17, color: MUTED, font: "Calibri" }),
            new TextRun({ text: it.answer, bold: true, size: 19, color: NAVY, font: "Calibri" }),
            new TextRun({ text: `  — ${it.why}`, size: 19, color: MUTED, font: "Calibri" }),
          ],
        })
      )
    );
    out.push(new Paragraph({ spacing: { before: 50, after: 30 }, children: [new TextRun({ text: "Guided Practice: ", bold: true, color: PURPLE, size: 20, font: "Calibri" })] }));
    skill.guided.forEach((g, i) =>
      out.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 200 }, children: [new TextRun({ text: `${i + 1}. `, bold: true, size: 19, color: INK, font: "Calibri" }), new TextRun({ text: g.answer, size: 19, color: INK, font: "Calibri" })] }))
    );
  });
  return out;
}

function docFor(sections, title) {
  return new Document({
    creator: "Neft Teacher",
    title,
    description: "MCAP Grade 6 review packet",
    styles: { default: { document: { run: { font: "Calibri", size: 21, color: INK } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                tabStops: [{ type: "right", position: 9360 }],
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 4, color: RULE } },
                children: [
                  new TextRun({ text: "Neft Teacher · MCAP Grade 6 Review", color: MUTED, size: 16, font: "Calibri" }),
                  new TextRun({ text: "\t" + title, color: MUTED, size: 16, font: "Calibri" }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], color: MUTED, size: 16, font: "Calibri" })],
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });
}

// ── HTML packet ───────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function htmlPacket(skill) {
  const docName = `${skillFileSlug(skill.code)}.docx`;
  const vocab = skill.vocab
    .map((v) => `<div class="vcard"><strong>${esc(v.term)}</strong><span>${esc(v.def)}</span></div>`)
    .join("");
  const ntk = skill.needToKnow.map((b) => `<li>${esc(b)}</li>`).join("");
  const steps = skill.workedExample.steps.map((s, i) => `<li><b>Step ${i + 1}.</b> ${esc(s)}</li>`).join("");
  const guided = skill.guided
    .map((g, i) => `<li><span class="qn">${i + 1}.</span> ${esc(g.problem)}<div class="hint">💡 Hint: ${esc(g.hint)}</div><div class="rule"></div><div class="rule"></div></li>`)
    .join("");
  const indep = skill.independent
    .map((p, i) => `<li><span class="qn">${i + 1}.</span> ${esc(p.problem)}<div class="rule"></div><div class="rule"></div></li>`)
    .join("");
  const mcap = skill.mcapItems
    .map((it, i) => {
      const body =
        it.type === "multiple-choice"
          ? `<div class="choices">${it.choices.map((c, ci) => `<label><span class="bub">○</span> <b>${choiceLetter(ci)}.</b> ${esc(c)}</label>`).join("")}</div>`
          : `<div class="fill"><span class="filllabel">Enter your answer:</span><span class="blank"></span></div>`;
      return `<div class="item">
        <div class="itembar"><span class="itemno">Item ${i + 1}</span><span class="itemtype">${esc(itemTypeLabel(it.type))}</span><span class="itemstd">${esc(skill.code)}</span></div>
        <div class="itembody"><p class="stem">${esc(it.prompt)}</p><p class="idir">${esc(itemDirections(it.type))}</p>${body}</div>
      </div>`;
    })
    .join("");
  const keyRows = [
    ...skill.independent.map((p, i) => `<tr><td>Independent ${i + 1}</td><td>${esc(p.answer)}</td></tr>`),
    ...skill.mcapItems.map(
      (it, i) =>
        `<tr><td>Item ${i + 1} · ${esc(skill.code)}</td><td><b>${esc(it.answer)}</b> — ${esc(it.why)}</td></tr>`
    ),
  ].join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(skill.title)} · MCAP ${esc(skill.code)} · Neft Teacher</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/shared.css">
<link rel="stylesheet" href="/assets/design-tokens.css">
<link rel="stylesheet" href="/assets/nt-activity-kit.css">
<style>
  :root{ --domain:#${skill.domainColor}; --navy:#12355B; --teal:#1FA6A2; --amber:#B97A12; --purple:#6B4FA0; --ink:#1A2733; --muted:#5F6F80; --rule:#C7D2DD; }
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,system-ui,sans-serif;color:var(--ink);background:#eef2f6;margin:0;line-height:1.55;font-size:17px}
  .wrap{max-width:880px;margin:0 auto;padding:24px 18px 80px}
  .topbar{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-bottom:18px}
  .crumbs a{color:var(--muted);text-decoration:none;font-size:.86rem}
  .crumbs a:hover{color:var(--teal)}
  .btns{display:flex;gap:8px;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:#fff;border:none;border-radius:9px;padding:9px 15px;font-size:.9rem;font-weight:600;text-decoration:none;cursor:pointer}
  .btn.alt{background:var(--teal)}
  .btn.ghost{background:#fff;color:var(--navy);border:1.5px solid var(--navy)}
  .card{background:#fff;border:1px solid #dbe3ec;border-radius:6px;box-shadow:0 2px 10px rgba(18,53,91,.06);padding:0 0 30px;overflow:hidden}
  .banner{background:var(--navy);color:#fff;padding:22px 34px 20px;border-top:6px solid var(--domain)}
  .eyebrow{font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;color:#cfe0ec;font-weight:700}
  .banner h1{margin:.18em 0 .2em;color:#fff;font-size:1.95rem;line-height:1.15}
  .bannermeta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:.95rem;color:#dbe7f1}
  .std{display:inline-block;background:var(--domain);color:#fff;font-weight:700;padding:4px 12px;border-radius:4px;font-size:.85rem;letter-spacing:.02em}
  .body{padding:6px 34px 0}
  .goal{background:#EEF4F8;border:1px solid #BBD0DE;border-left:5px solid var(--navy);border-radius:5px;padding:14px 18px;margin:20px 0}
  .goal b{color:var(--navy)}
  h2{color:var(--navy);border-bottom:2px solid var(--domain);padding-bottom:6px;margin-top:34px;font-size:1.28rem;letter-spacing:.01em}
  .cue{font-style:italic;color:var(--muted);font-size:.9rem;font-weight:400;margin-left:8px}
  .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
  .vcard{background:#E6F4F3;border:1px solid #cde8e6;border-radius:6px;padding:12px 14px}
  .vcard strong{display:block;color:var(--navy)}
  .vcard span{font-size:.92rem}
  ul.ntk li{margin:7px 0}
  .ido{background:#E6F4F3;border:1px solid var(--teal);border-radius:6px;padding:16px 20px;margin:12px 0}
  .ido .prob{font-weight:700;margin-bottom:8px}
  .ido ol{margin:0;padding-left:20px}
  .ido li{margin:5px 0}
  .ido .ans{margin-top:10px;font-weight:700;color:var(--navy)}
  ol.work{list-style:none;padding:0;counter-reset:none}
  ol.work li{margin:16px 0}
  .qn{font-weight:800;color:var(--domain);margin-right:6px}
  .hint{font-style:italic;color:var(--muted);font-size:.9rem;margin:5px 0}
  .rule{border-bottom:1.5px solid #cfdae6;height:26px}
  /* official MCAP item cards */
  .directions{background:#f5f8fb;border:1px solid var(--rule);border-radius:5px;padding:12px 16px;margin:12px 0 18px;font-size:.95rem}
  .items{display:flex;flex-direction:column;gap:16px}
  .item{border:1px solid var(--rule);border-radius:6px;overflow:hidden;background:#fff}
  .itembar{display:flex;align-items:center;gap:12px;background:var(--domain);color:#fff;padding:8px 16px;font-size:.8rem}
  .itembar .itemno{font-weight:800}
  .itembar .itemtype{text-transform:uppercase;letter-spacing:.08em;font-weight:600;opacity:.95}
  .itembar .itemstd{margin-left:auto;font-weight:800;letter-spacing:.02em;background:rgba(255,255,255,.18);padding:2px 9px;border-radius:4px}
  .itembody{padding:14px 18px 16px}
  .itembody .stem{margin:0 0 4px;font-weight:600}
  .itembody .idir{margin:0 0 10px;font-style:italic;color:var(--muted);font-size:.88rem}
  .choices{display:flex;flex-direction:column;gap:4px;margin:0}
  .choices label{display:block;padding:7px 10px;border:1px solid #e3e9f0;border-radius:5px}
  .bub{color:var(--domain);font-weight:700}
  .fill{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .fill .filllabel{font-weight:600;color:var(--muted)}
  .fill .blank{display:inline-block;border-bottom:1.5px solid #aebccb;flex:1;min-width:200px;height:22px}
  details.key{margin:30px 0 0;background:#FBF3E2;border:1px solid #E5D2A6;border-radius:6px;padding:6px 18px}
  details.key summary{cursor:pointer;font-weight:700;color:var(--navy);padding:10px 0}
  table.key{width:100%;border-collapse:collapse;font-size:.92rem;margin:8px 0 14px}
  table.key td{border-bottom:1px solid #e7dcc0;padding:6px 8px;vertical-align:top}
  table.key td:first-child{white-space:nowrap;font-weight:600;color:var(--muted);width:150px}
  .foot{text-align:center;color:var(--muted);font-size:.82rem;margin-top:26px;padding:0 34px}
  @media(max-width:620px){.vgrid{grid-template-columns:1fr}.banner,.body,.foot{padding-left:18px;padding-right:18px}}
  @media print{
    body{background:#fff;font-size:12pt}.topbar,.btns,details.key{display:none}
    .card{box-shadow:none;border:none}
    .item,.directions{break-inside:avoid}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <div class="crumbs"><a href="/mcap-review/">← MCAP Review</a> &nbsp;/&nbsp; <a href="/mcap-review/packets/">Review Packets</a> &nbsp;/&nbsp; ${esc(skill.domainTitle)}</div>
    <div class="btns">
      <a class="btn alt" href="./${docName}" download>⬇ Word (.docx)</a>
      <button class="btn" onclick="window.print()">🖨 Print / PDF</button>
    </div>
  </div>
  <div class="card">
    <div class="banner">
      <div class="eyebrow">Neft Teacher · MCAP Grade 6 Mathematics Review</div>
      <h1>${esc(skill.title)}</h1>
      <div class="bannermeta"><span class="std">${esc(skill.code)}</span><span>${esc(skill.domainTitle)}</span></div>
    </div>
    <div class="body">
    <div class="goal"><b>Learning Goal:</b> ${esc(skill.summary)}</div>

    <h2>Vocabulary</h2>
    <div class="vgrid">${vocab}</div>

    <h2>What You Need to Know</h2>
    <ul class="ntk">${ntk}</ul>

    <h2>Worked Example <span class="cue">I Do — watch how it works</span></h2>
    <div class="ido"><div class="prob">${esc(skill.workedExample.problem)}</div><ol>${steps}</ol><div class="ans">Answer: ${esc(skill.workedExample.answer)}</div></div>

    <h2>Guided Practice <span class="cue">We Do — try it together</span></h2>
    <ol class="work">${guided}</ol>

    <h2>Independent Practice <span class="cue">You Do — show your work</span></h2>
    <ol class="work">${indep}</ol>

    <h2>MCAP-Style Practice</h2>
    <div class="directions"><b>Directions:</b> Answer each item the way you would on the MCAP. For selected-response items, fill in the circle (○) next to the correct answer. For constructed-response items, enter your answer and show your work. Every item below assesses standard <b>${esc(skill.code)}</b>.</div>
    <div class="items">${mcap}</div>

    <details class="key"><summary>Teacher Answer Key (click to show)</summary>
      <table class="key">${keyRows}</table>
    </details>
    </div>
    <div class="foot">Neft Teacher · Grade 6 MCAP Mathematics Review · Standard ${esc(skill.code)}</div>
  </div>
</div>
</body>
</html>`;
}

// ── hub index ─────────────────────────────────────────────────────────────────
function hubIndex() {
  const cards = DOMAINS.map((d) => {
    const skills = d.skills
      .map(
        (s) => `
        <li>
          <div class="srow">
            <span class="scode">${esc(s.code)}</span>
            <span class="stitle">${esc(s.title)}</span>
          </div>
          <div class="sdl">
            <a href="./${d.slug}/${skillFileSlug(s.code)}.html">Study&nbsp;online</a>
            <a class="dl" href="./${d.slug}/${skillFileSlug(s.code)}.docx" download>Word ⬇</a>
          </div>
        </li>`
      )
      .join("");
    return `
    <section class="domain" style="--domain:#${d.color}">
      <header class="dhead">
        <div><span class="dicon">${esc(d.icon)}</span><h2>${esc(d.domainTitle)}</h2><span class="dcount">${d.skills.length} skills</span></div>
        <a class="bundle" href="./${d.slug}/${d.slug}-review-packet.docx" download>⬇ Full domain packet (Word)</a>
      </header>
      <ul class="skills">${skills}</ul>
    </section>`;
  }).join("");

  const total = ALL_SKILLS.length;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MCAP Grade 6 Review Packets · Neft Teacher</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/shared.css">
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;color:#1A2733;background:#f4f7fa;margin:0;line-height:1.5}
  .wrap{max-width:1000px;margin:0 auto;padding:26px 18px 80px}
  .crumbs a{color:#5F6F80;text-decoration:none;font-size:.86rem}.crumbs a:hover{color:#1FA6A2}
  .hero{background:linear-gradient(135deg,#12355B,#1FA6A2);color:#fff;border-radius:18px;padding:30px 32px;margin:14px 0 26px}
  .hero h1{margin:0 0 .25em;font-size:2.1rem}
  .hero p{margin:0;opacity:.95;max-width:62ch}
  .hero .stat{margin-top:14px;display:inline-block;background:rgba(255,255,255,.16);padding:6px 14px;border-radius:30px;font-weight:600;font-size:.9rem}
  .domain{background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(18,53,91,.07);padding:20px 24px;margin:0 0 20px;border-left:8px solid var(--domain)}
  .dhead{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;border-bottom:2px solid #eef2f6;padding-bottom:12px;margin-bottom:6px}
  .dhead>div{display:flex;align-items:center;gap:10px}
  .dicon{font-size:1.5rem}
  .dhead h2{margin:0;color:#12355B;font-size:1.3rem}
  .dcount{background:var(--domain);color:#fff;font-size:.74rem;font-weight:700;padding:3px 10px;border-radius:20px}
  .bundle{background:var(--domain);color:#fff;text-decoration:none;font-weight:600;font-size:.84rem;padding:8px 14px;border-radius:9px}
  ul.skills{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 18px}
  ul.skills li{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;padding:9px 4px;border-bottom:1px solid #eef2f6}
  .srow{display:flex;flex-direction:column;gap:3px}
  .scode{align-self:flex-start;font-size:.7rem;font-weight:700;color:#fff;background:var(--domain);padding:1px 8px;border-radius:4px;letter-spacing:.02em}
  .stitle{font-size:.95rem;font-weight:600;color:#1A2733}
  .sdl{display:flex;gap:8px;align-items:center;white-space:nowrap}
  .sdl a{font-size:.82rem;text-decoration:none;color:#12355B;font-weight:600}
  .sdl a.dl{background:#1FA6A2;color:#fff;padding:4px 9px;border-radius:7px}
  .sdl a:hover{opacity:.85}
  .tips{background:#EEF4F8;border:1px solid #BBD0DE;border-radius:14px;padding:18px 22px;margin-top:8px}
  .tips h3{margin:0 0 8px;color:#12355B}
  .foot{text-align:center;color:#5F6F80;font-size:.82rem;margin-top:30px}
  @media(max-width:680px){ul.skills{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <div class="crumbs"><a href="/">Home</a> &nbsp;/&nbsp; <a href="/mcap-review/">MCAP Review</a> &nbsp;/&nbsp; Review Packets</div>
  <div class="hero">
    <h1>📘 MCAP Grade 6 Review Packets</h1>
    <p>Guided study packets for every skill the MCAP is most likely to test — vocabulary, worked examples, guided &amp; independent practice, and test-style questions. Study online or download a clean Word document for printing.</p>
    <span class="stat">${total} skill packets · 5 domains · printable Word + online</span>
  </div>
  ${cards}
  <div class="tips">
    <h3>How to use these packets</h3>
    <ul>
      <li><b>Study online</b> for a clean, mobile-friendly version with a built-in answer key you can reveal.</li>
      <li><b>Download the Word file</b> to print, edit, or assign as homework — each one includes work space and a teacher answer key on the last page.</li>
      <li><b>Grab the full domain packet</b> to review a whole strand (like Geometry) in one document.</li>
    </ul>
  </div>
  <div class="foot">Neft Teacher · Grade 6 MCAP Review · ${total} skill packets</div>
</div>
</body>
</html>`;
}

// ── run ───────────────────────────────────────────────────────────────────────
async function main() {
  let docs = 0,
    htmls = 0;
  for (const d of DOMAINS) {
    const dir = join(outRoot, d.slug);
    mkdirSync(dir, { recursive: true });

    for (const s of d.skills) {
      const skill = { ...s, domainTitle: d.domainTitle, domainColor: d.color, domainSlug: d.slug };
      const slug = skillFileSlug(s.code);

      // per-skill DOCX
      const sections = [...coverBlock(skill), ...skillBody(skill), ...answerKey([skill], `${skill.code} — ${skill.title}`)];
      const buf = await Packer.toBuffer(docFor(sections, `${skill.code} ${skill.title}`));
      writeFileSync(join(dir, `${slug}.docx`), buf);
      docs++;

      // per-skill HTML
      writeFileSync(join(dir, `${slug}.html`), htmlPacket(skill));
      htmls++;
    }

    // combined domain review packet
    const skillsWithMeta = d.skills.map((s) => ({ ...s, domainTitle: d.domainTitle, domainColor: d.color, domainSlug: d.slug }));
    const combined = [
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "NEFT TEACHER · MCAP GRADE 6 REVIEW", bold: true, color: TEAL, size: 18, font: "Calibri" })] }),
      new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: `${d.domainTitle}`, bold: true, color: NAVY, size: 40, font: "Calibri" })] }),
      new Paragraph({
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 18, space: 8, color: d.color } },
        children: [new TextRun({ text: `Complete Review Packet · ${d.skills.length} skills`, color: INK, size: 22, font: "Calibri" })],
      }),
    ];
    skillsWithMeta.forEach((skill, idx) => {
      combined.push(
        new Paragraph({
          pageBreakBefore: idx > 0,
          spacing: { after: 10 },
          children: [new TextRun({ text: `${skill.code} · ${skill.title}`, bold: true, color: skill.domainColor, size: 30, font: "Calibri" })],
        })
      );
      combined.push(...skillBody(skill));
    });
    combined.push(...answerKey(skillsWithMeta, `${d.domainTitle} — full domain`));
    const cbuf = await Packer.toBuffer(docFor(combined, `${d.domainTitle} Review Packet`));
    writeFileSync(join(dir, `${d.slug}-review-packet.docx`), cbuf);
    docs++;
  }

  // hub index
  if (!existsSync(outRoot)) mkdirSync(outRoot, { recursive: true });
  writeFileSync(join(outRoot, "index.html"), hubIndex());

  console.log(`✓ MCAP packets generated: ${docs} DOCX, ${htmls} HTML pages, 1 hub index`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
