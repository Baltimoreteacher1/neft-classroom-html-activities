// The family handout as an editable Word file, one Letter page per language, from the same model as the PDF
// (intro-family-handout.mjs). Large type (13 pt body), the QR from guides/qr-family.png with alt text, a real hyperlink,
// real Heading styles and real lists, and a ruled line for the teacher's name.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HeadingLevel, ImageRun, TabStopType } from "docx";
import {
  bold,
  buildDocument,
  heading,
  link,
  list,
  MUTED,
  PT,
  para,
  run,
  TEXT_WIDTH,
  toBuffer,
} from "./intro-docx-kit.mjs";
import { HANDOUT_DOC_LANG } from "./intro-family-handout.mjs";

const BIG = { size: PT(13) };

export async function buildFamilyHandoutDocx(m, guidesDir) {
  const qr = new ImageRun({
    type: "png",
    data: readFileSync(join(guidesDir, "qr-family.png")),
    transformation: { width: 132, height: 132 },
    altText: { name: "QR code", title: "QR code", description: m.qrAlt },
  });
  const children = [
    para([bold(m.siteName, { color: MUTED })], { spacing: { after: 0 } }),
    heading(m.title, HeadingLevel.HEADING_1),
    para([run(m.what, { size: PT(14) })], { spacing: { after: 100, line: 280 } }),
    para([run(m.grade, BIG)], { spacing: { after: 120 } }),
    para([qr]),
    para([run(`${m.scan} `, BIG), link(m.short, m.url, BIG)], { spacing: { after: 160 } }),
    heading(m.stepsHeading, HeadingLevel.HEADING_2),
    ...m.steps.map((s) => list([bold(`${s.head}. `, BIG), run(s.body, BIG)], "steps", 1)),
    heading(m.choicesHeading, HeadingLevel.HEADING_2),
    ...m.choices.map((c) => list([bold(`${c.name}. `, BIG), run(c.line, BIG)], "bullet", 0)),
    para([run(m.early, { color: MUTED })], { spacing: { before: 60, after: 60 } }),
    heading(m.factsHeading, HeadingLevel.HEADING_2),
    ...m.facts.map((f) => list([run(f, BIG)], "bullet", 0)),
    para([bold(`${m.teacher} `, BIG), run("\t", BIG)], {
      tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH, leader: "underscore" }],
      spacing: { before: 280 },
    }),
  ];
  const doc = buildDocument({
    title: `${m.siteName}: ${m.title}`,
    description: m.what,
    headerText: `${m.siteName} · ${m.title}`,
    lang: HANDOUT_DOC_LANG[m.lang],
    children,
  });
  return toBuffer(doc);
}
