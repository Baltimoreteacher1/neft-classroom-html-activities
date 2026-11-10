// Shared Word helpers for the introduction handouts (quick guide, featured lesson backup, presenter notes): one house
// style so the three files match. Letter, 0.6in margins, Arial 11 pt minimum, real Heading styles, real lists,
// real hyperlinks, a header row on every table, alt text on every image, document title and language.
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
} from "docx";

export const FONT = "Arial";
export const DISPLAY = "Georgia";
export const INK = "1D2B58";
export const MUTED = "3A4566";
export const LINE = "9AA3BC";
/** Letter minus 0.6in margins on both sides, in twips. */
export const TEXT_WIDTH = 10512;
const MARGIN = 864;
export const PT = (n) => n * 2;

export const run = (text, o = {}) => new TextRun({ text, font: FONT, size: PT(11), ...o });
export const bold = (text, o = {}) => run(text, { bold: true, ...o });

/** A real hyperlink: the text is the readable label, the target is the public URL. */
export const link = (text, url, o = {}) =>
  new ExternalHyperlink({
    link: url,
    children: [
      new TextRun({ text, style: "Hyperlink", font: FONT, size: PT(11), bold: true, ...o }),
    ],
  });

export const para = (children, o = {}) =>
  new Paragraph({
    children: Array.isArray(children) ? children : [run(children)],
    spacing: { after: 60, line: 240 },
    ...o,
  });

export const heading = (text, level = HeadingLevel.HEADING_2, o = {}) =>
  new Paragraph({ heading: level, children: [new TextRun({ text })], ...o });

/** A ruled writing line the full text width (tab leader), so it prints and stays editable. */
export const writeLine = (before = 160) =>
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH, leader: "underscore" }],
    spacing: { before, after: 40 },
    children: [run("\t")],
  });

export const list = (children, ref = "bullet", instance = 0) =>
  new Paragraph({
    children: Array.isArray(children) ? children : [run(children)],
    numbering: { reference: ref, level: 0, instance },
    spacing: { after: 30, line: 240 },
  });

const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const HAIR = { style: BorderStyle.SINGLE, size: 4, color: "C9CFDF" };

/** A data table with a repeating header row. `rows` is an array of arrays of Paragraph[]; `widths` in twips. */
export function dataTable(headers, rows, widths) {
  const cell = (paras, i, head) =>
    new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 60, right: 100 },
      borders: {
        top: NONE,
        left: NONE,
        right: NONE,
        bottom: head ? { ...HAIR, size: 8, color: MUTED } : HAIR,
      },
      children: paras,
    });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map((h, i) =>
          cell([para([bold(h, { color: MUTED })], { spacing: { after: 0 } })], i, true),
        ),
      }),
      ...rows.map(
        (r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }),
      ),
    ],
  });
}

const style = (id, name, run_, para_ = {}) => ({
  id,
  name,
  basedOn: "Normal",
  next: "Normal",
  quickFormat: true,
  run: run_,
  paragraph: para_,
});

/** One Document with the shared styles, numbering, header and footer. */
export function buildDocument({ title, description, children, headerText, lang = "en-US" }) {
  const numLevel = (format, text) => ({
    level: 0,
    format,
    text,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 260 } } },
  });
  return new Document({
    title,
    description,
    creator: "The Language Page",
    styles: {
      default: { document: { run: { font: FONT, size: PT(11), language: { value: lang } } } },
      characterStyles: [
        {
          id: "Hyperlink",
          name: "Hyperlink",
          basedOn: "DefaultParagraphFont",
          run: { color: "1A2F78", underline: {} },
        },
      ],
      paragraphStyles: [
        style(
          "Heading1",
          "Heading 1",
          { font: DISPLAY, size: PT(19), bold: true, color: INK },
          { spacing: { before: 60, after: 100 }, keepNext: true },
        ),
        style(
          "Heading2",
          "Heading 2",
          { font: FONT, size: PT(12), bold: true, color: INK },
          { spacing: { before: 140, after: 60 }, keepNext: true },
        ),
        style(
          "Heading3",
          "Heading 3",
          { font: FONT, size: PT(11), bold: true, color: INK },
          { spacing: { before: 80, after: 40 }, keepNext: true },
        ),
      ],
    },
    numbering: {
      config: [
        { reference: "bullet", levels: [numLevel(LevelFormat.BULLET, "•")] },
        { reference: "steps", levels: [numLevel(LevelFormat.DECIMAL, "%1.")] },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: MARGIN,
              bottom: MARGIN,
              left: MARGIN,
              right: MARGIN,
              header: 360,
              footer: 360,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }],
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 2 },
                },
                children: [
                  bold(headerText, { color: MUTED }),
                  run("\tPage ", { color: MUTED }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT,
                    size: PT(11),
                    color: MUTED,
                  }),
                  run(" of ", { color: MUTED }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT,
                    size: PT(11),
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

export const toBuffer = (doc) => Packer.toBuffer(doc);
