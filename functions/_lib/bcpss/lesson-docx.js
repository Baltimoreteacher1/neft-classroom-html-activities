// Lesson Companion Word twin: renders the same document model as lesson-doc.js to .docx with the non-affiliation line in every footer.
// Entry point: renderLessonDocx(lesson, { level, part }) -> Uint8Array.

import { docxPackage, wDocument, wField, wFooter, wGap, wParagraph, wRun } from "./docx-kit.js";
import { buildLessonDocument, DISCLAIMER } from "./lesson-doc.js";
import { documentBody, stylesXml } from "./studio-docx.js";
import { MUTED, RULE, textRuns } from "./studio-docx-runs.js";

// Two short paragraphs: the disclaimer (wraps freely) and the page number. 10pt (sz 20) like the HTML twin.
function footerXml() {
  const o = { bold: true, size: 20, color: MUTED };
  return wFooter(
    wParagraph(textRuns(DISCLAIMER, o), {
      style: "Footer",
      borders: { top: { sz: 6, space: 6, color: RULE } },
      spaceBefore: 0,
      spaceAfter: 0,
    }) +
      wParagraph(wRun("Page ", o) + wField("PAGE", o), {
        style: "Footer",
        align: "right",
        spaceBefore: 0,
        spaceAfter: 0,
      }),
  );
}

export function renderLessonDocx(lesson, options = {}) {
  const doc = buildLessonDocument(lesson, options);
  const footer = footerXml();
  return docxPackage({
    documentXml: wDocument(documentBody(doc)),
    stylesXml: stylesXml(),
    footers: { footerP: footer, footerL: footer, footerNone: wFooter(wGap(20)) },
    title: `${doc.title} · Lesson Companion`,
  });
}
