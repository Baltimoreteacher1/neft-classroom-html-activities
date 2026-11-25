// "My Week" Word export. Lays out the shared document model (shared/planner/render.js planDoc): same words as the
// HTML/PDF sheet, tight spacing, 0.6in margins, no page breaks, navy and teal accents.
import { planDoc } from "../../../shared/planner/render.js";
import {
  docxPackage,
  wCell,
  wDocument,
  wGap,
  wParagraph,
  wRun,
  wSectPr,
  wTbl,
} from "./docx-kit.js";
import { stylesXml } from "./studio-docx.js";

const NAVY = "1B365D";
const TEAL = "0F766E";
const RULE = "9AA5B1";
const MARGIN = 864; // 0.6in
const WIDTHS = [1000, 5200, 4312]; // sums to Letter width minus both margins
const TIGHT = { spaceBefore: 0, spaceAfter: 0 };
const NO_BOX = { top: "nil", left: "nil", right: "nil" };

const text = (s, o = {}) => wRun(s, { size: 20, ...o });

function heading(block) {
  if (block.t === "h1") {
    return wParagraph(text(block.text, { size: 32, bold: true, color: NAVY }), {
      style: "Heading1",
      spaceBefore: 0,
      spaceAfter: 60,
    });
  }
  return wParagraph(text(block.text, { size: 24, bold: true, color: NAVY }), {
    style: "Heading2",
    spaceBefore: 140,
    spaceAfter: 40,
    borders: { bottom: { sz: 10, space: 1, color: TEAL } },
  });
}

function row(block, header) {
  const cells = block.cells.map((c, i) =>
    wCell(wParagraph(text(c, header ? { size: 17, bold: true, color: NAVY } : {}), TIGHT), {
      widthDxa: WIDTHS[i],
      margins: { top: 25, bottom: 25, left: 70, right: 70 },
      borders: { ...NO_BOX, bottom: { sz: header ? 6 : 4, color: header ? NAVY : RULE } },
    }),
  );
  return { cells, header };
}

/** Consecutive head/row blocks become one table. */
function bodyXml(doc) {
  const out = [];
  let rows = null;
  const flush = () => {
    if (rows) out.push(wTbl({ widths: WIDTHS, rows }), wGap(40));
    rows = null;
  };
  for (const b of doc.blocks) {
    if (b.t === "head" || b.t === "row") {
      rows = rows || [];
      rows.push(row(b, b.t === "head"));
      continue;
    }
    flush();
    out.push(b.t === "p" ? wParagraph(text(b.text), { ...TIGHT, spaceAfter: 30 }) : heading(b));
  }
  flush();
  return out.join("");
}

export function renderWeekPlanDocx(plan) {
  const doc = planDoc(plan);
  const sect = wSectPr({
    margins: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
  });
  return docxPackage({
    documentXml: wDocument(bodyXml(doc) + sect),
    stylesXml: stylesXml(),
    title: doc.title,
  });
}
