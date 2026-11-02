/**
 * family-takehome-docx.mjs: the Family Take-Home Sheet and its grown-up page as an editable Word file.
 *
 * Same content as the PDF (buildTakeHome), same type scale (12pt body, 14pt section heads, 22pt title) and the
 * same unit accent. What makes it a real Word document, not a picture of one (checked by tools/validate-docx-a11y.mjs):
 *   - Heading 1 / Heading 2 styles on the title and every section head
 *   - alt text on the model and the QR code
 *   - practice and answers are numbered lists (w:numPr), the stuck prompts a bullet list
 *   - answer lines are tab leaders, one per answer, 0.4in tall
 *   - document title and language set; no tables (nothing in the sheet is tabular)
 */
import { Resvg } from "@resvg/resvg-js";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import { renderModel } from "../../assets/design/family/art/math-models.mjs";
import { accentFor } from "./family-takehome-css.mjs";
import { SHEET_UI } from "./family-takehome-data.mjs";
import { qrSvg } from "./qr-code.mjs";

const FONT = "Arial";
const DOC_LANG = { en: "en-US", es: "es-US" };
const RIGHT_TAB = 10080; // 7in text width in twips (Letter, 0.75in side margins)
const TWIP_IN = 1440;

const hex = (css) => css.replace("#", "").toUpperCase();

/** resvg has no CSS custom properties: resolve `var(--x, fallback)` to its fallback before rasterizing. */
const resolveVars = (svg) => svg.replace(/var\(--[\w-]+,\s*([^()]*)\)/g, "$1");

function png(svg, width) {
  const r = new Resvg(resolveVars(svg), {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
  });
  const out = r.render();
  return { data: out.asPng(), width: out.width, height: out.height };
}

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: 24, ...o });

function pic(img, widthPx, alt) {
  const height = Math.round((widthPx * img.height) / img.width);
  return new ImageRun({
    type: "png",
    data: img.data,
    transformation: { width: widthPx, height },
    altText: alt,
  });
}

/** Real Heading 1 / Heading 2: the look comes from the document styles, not from run formatting. */
function heading(text, level) {
  return new Paragraph({ heading: level, keepNext: true, children: [new TextRun({ text })] });
}

const body = (text, o = {}) =>
  new Paragraph({ spacing: { after: 80, line: 276 }, ...o, children: [run(text, o.run)] });

const answerLine = (label) =>
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB, leader: "underscore" }],
    spacing: { before: 120, after: 160, line: 576, lineRule: "atLeast" }, // 0.4in
    indent: { left: 360 },
    children: [run(`${label} `, { bold: true, size: 22 }), run("\t", {})],
  });

function sheetParagraphs(data) {
  const ui = SHEET_UI[data.lang];
  const accent = hex(accentFor(data.unit));
  const out = [];
  out.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 2 } },
      tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
      children: [
        run(ui.wordmark, { bold: true, color: accent }),
        run(`\t${data.label} · ${data.standard}`),
      ],
    }),
    heading(data.title, HeadingLevel.HEADING_1),
    body(data.standardPlain),
    new Paragraph({
      tabStops: [
        { type: TabStopType.LEFT, position: 5400, leader: "underscore" },
        { type: TabStopType.LEFT, position: 5760 },
        { type: TabStopType.RIGHT, position: RIGHT_TAB, leader: "underscore" },
      ],
      spacing: { before: 120, after: 160 },
      children: [
        run(`${ui.name} `, { bold: true }),
        run("\t\t"),
        run(`${ui.date} `, { bold: true }),
        run("\t"),
      ],
    }),
    heading(ui.hookHead, HeadingLevel.HEADING_2),
    new Paragraph({
      border: { top: line(), bottom: line(), left: line(), right: line() },
      shading: { fill: "F3F3F1" },
      spacing: { after: 80, line: 276 },
      children: [run(data.hook.text), run(" "), run(data.hook.guess, { bold: true })],
    }),
  );
  if (data.model) {
    const img = png(renderModel(data.model.raw, { lang: data.lang }), 1300);
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        spacing: { before: 120 },
        children: [
          pic(img, 420, { name: "model", title: data.model.name, description: data.model.alt }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [run(`${ui.modelHead}: ${data.model.name}`, { bold: true })],
      }),
    );
  }
  const framesOnly = data.items.every((i) => i.kind === "frame");
  out.push(
    heading(ui.tryHead, HeadingLevel.HEADING_2),
    body(framesOnly ? ui.frameNote : ui.tryNote),
  );
  for (const item of data.items) {
    out.push(
      new Paragraph({
        numbering: { reference: "items", level: 0 },
        keepNext: true,
        spacing: { before: 120, after: 40 },
        children: [run(item.stem, { bold: true })],
      }),
    );
    if (item.choices.length) {
      out.push(
        new Paragraph({
          indent: { left: 360 },
          keepNext: true,
          spacing: { after: 40 },
          children: [run(item.choices.map((c) => `${c.letter}. ${c.text}`).join("      "))],
        }),
      );
    }
    out.push(answerLine(item.kind === "frame" ? ui.thinking : ui.answer));
  }
  out.push(
    heading(ui.talkHead, HeadingLevel.HEADING_2),
    body(data.talk),
    heading(ui.missionHead, HeadingLevel.HEADING_2),
    body(data.mission),
    heading(ui.stuckHead, HeadingLevel.HEADING_2),
    ...data.stuck.map(
      (s) =>
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 40 },
          children: [run(s)],
        }),
    ),
    heading(ui.qrHead, HeadingLevel.HEADING_2),
  );
  const qr = png(qrSvg(data.url, { px: 400 }), 400);
  out.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        pic(qr, 96, { name: "qr", title: ui.qrHead, description: `${ui.qrHead}: ${data.link}` }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        run(`${ui.qrNote} `),
        new ExternalHyperlink({
          link: data.url,
          children: [run(data.link, { bold: true, style: "Hyperlink" })],
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        run(`${ui.feelHead} `, { bold: true }),
        run(ui.feel.map((f) => `☐ ${f}`).join("     ")),
      ],
    }),
  );
  return out;
}

const line = () => ({ style: BorderStyle.SINGLE, size: 8, color: "14181D", space: 4 });

function guideParagraphs(data) {
  const ui = SHEET_UI[data.lang];
  const accent = hex(accentFor(data.unit));
  const out = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: accent, space: 2 } },
      tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
      children: [
        run(`${ui.wordmark} · ${ui.guideHead}`, { bold: true, color: accent }),
        run(`\t${data.label} · ${data.standard}`),
      ],
    }),
    heading(ui.guideTitle, HeadingLevel.HEADING_1),
    body(data.title),
    heading(ui.learnHead, HeadingLevel.HEADING_2),
    body(data.learning),
    heading(ui.answersHead, HeadingLevel.HEADING_2),
    body(ui.answersNote),
  ];
  for (const item of data.items) {
    const lead =
      item.kind === "choice"
        ? `${item.answerLetter}. ${item.choices.find((c) => c.letter === item.answerLetter).text}. `
        : "";
    out.push(
      new Paragraph({
        numbering: { reference: "answers", level: 0 },
        spacing: { after: 60 },
        children: [run(lead, { bold: true }), run(item.explanation)],
      }),
    );
  }
  const bullets = (items) =>
    items.map(
      (s) =>
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 40 },
          children: [run(s)],
        }),
    );
  out.push(
    heading(ui.talkHead, HeadingLevel.HEADING_2),
    body(data.talk),
    heading(ui.stuckGuide, HeadingLevel.HEADING_2),
    ...bullets(data.stuck),
    heading(ui.avoidHead, HeadingLevel.HEADING_2),
    ...bullets(data.avoid),
    heading(ui.missionHead, HeadingLevel.HEADING_2),
    body(data.mission),
  );
  return out;
}

const list = (reference, format, text) => ({
  reference,
  levels: [
    {
      level: 0,
      format,
      text,
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360, hanging: 360 } }, run: { font: FONT } },
    },
  ],
});

/** The Word file for one lesson and language: the sheet, then the grown-up page after a page break. */
export async function buildDocx(data) {
  const accent = hex(accentFor(data.unit));
  const doc = new Document({
    creator: "Family Math Studio",
    title: `${data.label}: ${data.title}`,
    description: data.standardPlain,
    language: DOC_LANG[data.lang],
    styles: {
      default: {
        document: { run: { font: FONT, size: 24, language: { value: DOC_LANG[data.lang] } } },
        heading1: {
          run: { font: FONT, size: 44, bold: true, color: accent },
          paragraph: { spacing: { before: 120, after: 60 } },
        },
        heading2: {
          run: { font: FONT, size: 28, bold: true, color: accent },
          paragraph: { spacing: { before: 200, after: 60 } },
        },
      },
    },
    numbering: {
      config: [
        list("items", LevelFormat.DECIMAL, "%1."),
        list("answers", LevelFormat.DECIMAL, "%1."),
        list("bullets", LevelFormat.BULLET, "•"),
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: 0.6 * TWIP_IN,
              bottom: 0.7 * TWIP_IN,
              left: 0.75 * TWIP_IN,
              right: 0.75 * TWIP_IN,
            },
          },
        },
        children: [...sheetParagraphs(data), ...guideParagraphs(data)],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
