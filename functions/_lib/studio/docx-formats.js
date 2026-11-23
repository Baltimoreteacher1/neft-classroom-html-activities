// The STUDENT Word form of each question format. Real paragraphs and tables, editable in Word; glyphs for
// bubbles and boxes are text. No answers, hints or explanations: those only appear in the key (docx.js).

import { Paragraph } from "docx";
import {
  blankModel,
  buildModel,
  choiceModel,
  fillTableModel,
  hotspotModel,
  identifyText,
  LETTERS,
  matchModel,
  numberLineModel,
  orderModel,
  plotModel,
  sortModel,
  writingLines,
} from "../../../access-practice-lab/src/studio/print/paper-model.js";
import {
  ARROW,
  allBorders,
  BOX,
  BUBBLE,
  box,
  boxed,
  gap,
  glyphRun,
  INK_BORDER,
  imageParagraph,
  label,
  mathTextRuns,
  noBorders,
  PT,
  para,
  ruledLines,
  TEXT_W,
  table,
  textRun,
  underline,
} from "./docx-kit.js";

const IND = { left: 720, hanging: 360 };
const how = (c, key) =>
  para(
    c.t(`how.${key}`),
    { keepNext: true, spacing: { after: 100 } },
    { italics: true, size: PT(11) },
  );

function optionParagraph(glyph, letter, text) {
  return new Paragraph({
    indent: IND,
    spacing: { after: 90 },
    keepLines: true,
    children: [
      glyphRun(`${glyph} `),
      textRun(`${letter}.  `, { bold: true }),
      ...mathTextRuns(text),
    ],
  });
}

const bankBox = (c, words) => [
  label(c.t("wordBank")),
  boxed(
    words.join("     •     "),
    { shading: { fill: "F5F6F7", type: "clear", color: "auto" } },
    { bold: true },
  ),
];

/** Number line as a real table: the line is a bottom border, ticks are left borders, labels sit under ticks. */
function numberLineTable(q) {
  const m = numberLineModel(q);
  let ticks = m.ticks;
  if (m.count > 24)
    ticks = ticks.filter((_, i) => i % Math.ceil(m.count / 24) === 0 || i === m.count);
  const k = ticks.length - 1;
  const colW = Math.floor(TEXT_W / (2 * k + 2));
  const widths = Array.from({ length: 2 * k + 2 }, () => colW);
  const line = { style: "single", size: 12, color: "000000" };
  const none = { style: "none", size: 0, color: "FFFFFF" };
  const tick = { style: "single", size: 12, color: "000000" };
  const lineRow = [
    { children: [new Paragraph({ children: [] })], borders: { ...noBorders, bottom: line } },
  ];
  for (let i = 0; i < k; i++)
    lineRow.push({
      span: 2,
      children: [new Paragraph({ spacing: { after: 0, line: 300 }, children: [] })],
      borders: { top: none, right: i === k - 1 ? tick : none, bottom: line, left: tick },
    });
  lineRow.push({
    children: [new Paragraph({ children: [] })],
    borders: { ...noBorders, bottom: line },
  });
  const labelRow = ticks.map((t) => ({
    span: 2,
    text: t.label,
    align: "center",
    borders: noBorders,
  }));
  return table([lineRow, labelRow], { widths, borders: noBorders });
}

/** Coordinate grid as a table: each cell is one whole-number point; students mark the cell with an X. */
function gridTable(q) {
  const m = plotModel(q);
  if (m.span > 20) return null;
  const n = m.values.length;
  const lab = Math.floor(TEXT_W * 0.06);
  const cell = Math.min(430, Math.floor((TEXT_W * 0.55 - lab) / n));
  const widths = [lab, ...Array.from({ length: n }, () => cell)];
  const thin = { style: "single", size: 4, color: "AAAAAA" };
  const axis = { style: "single", size: 14, color: "000000" };
  const rows = [];
  for (let r = n - 1; r >= 0; r--) {
    const y = m.values[r];
    const cells = [{ text: y.label || "", align: "right", borders: noBorders }];
    for (let ci = 0; ci < n; ci++) {
      const x = m.values[ci];
      cells.push({
        text: "·",
        align: "center",
        borders: {
          top: y.v === 0 && m.axisX ? axis : thin,
          bottom: thin,
          left: x.v === 0 && m.axisY ? axis : thin,
          right: thin,
        },
      });
    }
    rows.push(cells);
  }
  rows.push([
    { text: "", borders: noBorders },
    ...m.values.map((x) => ({ text: x.label || "", align: "center", borders: noBorders })),
  ]);
  return table(rows, { widths, minHeight: cell, borders: noBorders });
}

const FORMATS = {
  choice: (c, q) => [
    how(c, "choice"),
    ...choiceModel(q).map((o) => optionParagraph(BUBBLE, o.letter, o.text)),
  ],
  multi: (c, q) => [
    how(c, "multi"),
    ...choiceModel(q).map((o) => optionParagraph(BOX, o.letter, o.text)),
  ],

  match: (c, q) => {
    const m = matchModel(c.activity, q);
    const rows = m.left.map((l, i) => [
      { text: `${l.n}.   ${underline(5)}   ${l.text}` },
      { text: `${m.right[i].letter}.   ${m.right[i].text}` },
    ]);
    return [how(c, "match"), table(rows, { widths: [TEXT_W / 2, TEXT_W / 2], minHeight: 440 })];
  },

  sort: (c, q) => {
    const m = sortModel(c.activity, q);
    const w = Math.floor(TEXT_W / m.categories.length);
    const rows = [m.categories.map((cat) => cat.label)];
    for (let i = 0; i < m.rows; i++) rows.push(m.categories.map(() => ""));
    return [
      how(c, "sort"),
      ...bankBox(
        c,
        m.bank.map((b) => b.text),
      ),
      table(rows, { widths: m.categories.map(() => w), header: true, minHeight: 440 }),
    ];
  },

  order: (c, q) => {
    const m = orderModel(c.activity, q);
    return [
      how(c, "order"),
      ...m.items.map(
        (o) =>
          new Paragraph({
            indent: IND,
            spacing: { after: 80 },
            children: [textRun(`${o.letter}.  `, { bold: true }), ...mathTextRuns(o.text)],
          }),
      ),
      para(Array.from({ length: m.slots }, (_, i) => `${i + 1}. ${underline(5)}`).join("      "), {
        spacing: { before: 100, after: 120 },
      }),
    ];
  },

  blank: (c, q) => {
    const m = blankModel(c.activity, q);
    const runs = m.parts.flatMap((p) =>
      p.t === "text" ? mathTextRuns(p.v) : [textRun(`(${p.n}) ${underline(14)}`)],
    );
    return [
      how(c, m.bank.length ? "bank" : "blank"),
      ...(m.bank.length ? bankBox(c, m.bank) : []),
      new Paragraph({ spacing: { after: 140, line: 400 }, children: runs }),
    ];
  },

  number: (c, q) => [
    how(c, "number"),
    box(c.t("workSpace"), c.workspace === "roomy" ? 2700 : 1500),
    para(
      `${c.t("answer")}: ${underline(22)}${q.unit ? `  ${q.unit}` : ""}`,
      { spacing: { before: 120, after: 120 } },
      { bold: true },
    ),
  ],

  short: (c, q) => [
    how(c, q.kind === "explain" ? "explain" : "write"),
    ruledLines(writingLines(q, c.workspace)),
  ],

  identify: (c, q) => [
    how(c, "identify"),
    boxed(identifyText(q), { spacing: { before: 80, after: 200, line: 400 } }, { size: PT(13) }),
  ],

  hotspot: (c, q) => {
    const m = hotspotModel(q);
    // Regions cannot be drawn over a picture in an editable file, so the Word form is a choice question.
    const pic = m.image
      ? [
          imageParagraph({ src: m.image, alt: m.alt }, { placeholder: c.t("picturePlaceholder") })
            .paragraph,
        ]
      : [];
    return [
      how(c, "choice"),
      ...pic,
      ...m.regions.map((r) => optionParagraph(BUBBLE, r.letter, r.label)),
    ];
  },

  numberline: (c, q) => [how(c, "numberline"), numberLineTable(q), gap()],

  plot: (c, q) => {
    const g = gridTable(q);
    return g ? [how(c, "plotWord"), g, gap()] : [how(c, "plot"), gap(400)];
  },

  build: (c, q) => {
    const m = buildModel(c.activity, q);
    const w = Math.floor(TEXT_W / m.cards.length);
    return [
      how(c, "build"),
      table([m.cards.map((card) => ({ text: card, align: "center" }))], {
        widths: m.cards.map(() => w),
        borders: allBorders(INK_BORDER),
      }),
      label(c.t("yourSentence")),
      ruledLines(2),
    ];
  },

  error: (c, q) => [
    how(c, "error"),
    table(
      q.steps.map((s, i) => [
        { text: `${c.t("step")} ${i + 1}`, shade: "F5F6F7" },
        { text: s.text },
      ]),
      { widths: [1700, TEXT_W - 1700] },
    ),
    label(c.t("fix")),
    ...q.fixOptions.map((o, i) => optionParagraph(BUBBLE, LETTERS[i], o.text)),
  ],

  fillTable: (c, q) => {
    const m = fillTableModel(q);
    const cols = Math.max(m.headers.length, ...m.rows.map((r) => r.length), 1);
    const w = Math.floor(TEXT_W / cols);
    const rows = [m.headers.length ? m.headers : Array.from({ length: cols }, () => "")];
    for (const r of m.rows) rows.push(r.map((cell) => (cell.blank ? "" : cell.text)));
    return [
      how(c, "fillTable"),
      table(rows, {
        widths: Array.from({ length: cols }, () => w),
        header: true,
        minHeight: c.workspace === "roomy" ? 880 : 620,
      }),
    ];
  },
};

export const questionBody = (c, q) => (FORMATS[q.format] || FORMATS.choice)(c, q);
