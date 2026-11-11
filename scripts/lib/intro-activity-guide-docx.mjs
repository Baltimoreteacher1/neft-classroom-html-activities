// The Activity Guide as an editable Word file, from the same model as the PDF (activity-guide-model.js): a first
// section "How to use these activities" with the one QR code, then one activity per page with real headings, lists,
// hyperlinks and alt text.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HeadingLevel, ImageRun } from "docx";
import {
  bold,
  buildDocument,
  heading,
  link,
  list,
  MUTED,
  para,
  run,
  toBuffer,
} from "./intro-docx-kit.mjs";

const QR_PNG = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "access-practice-lab",
  "guides",
  "qr-start.png",
);

function cover(m) {
  const h = m.howTo;
  return [
    heading(m.title, HeadingLevel.HEADING_1),
    heading(h.heading, HeadingLevel.HEADING_2),
    para(h.lead),
    ...h.points.map(([head, text]) => list([bold(`${head}. `), run(text)], "steps", 1)),
    heading(h.start.text, HeadingLevel.HEADING_2),
    para([
      new ImageRun({
        type: "png",
        data: readFileSync(QR_PNG),
        transformation: { width: 104, height: 104 },
        altText: { name: "QR code", title: "QR code", description: h.qrAlt },
      }),
    ]),
    para([link(h.start.short, h.start.url)]),
    heading("In this guide", HeadingLevel.HEADING_2),
    ...m.cards.map((c, i) =>
      list(
        [
          link(c.name, c.link.url),
          run(`  ${c.kind}, ${c.group.toLowerCase()}, ${c.time}. Page ${i + 2}.`, { color: MUTED }),
        ],
        "steps",
        2,
      ),
    ),
  ];
}

function card(c, i) {
  return [
    heading(c.name, HeadingLevel.HEADING_1, { pageBreakBefore: true }),
    para([bold(`${c.kind} · ${c.group} · Activity ${i + 1}`, { color: MUTED })]),
    para([
      bold("Where: "),
      run(`${c.where}. `),
      bold("Time: "),
      run(`${c.time}. `),
      bold("Link: "),
      link(c.link.short, c.link.url),
    ]),
    para([bold("What it is. "), run(c.does)]),
    ...(c.why ? [heading("Why it works", HeadingLevel.HEADING_2), para(c.why)] : []),
    para([bold("How to open it. "), run(c.open)]),
    heading("How students use it", HeadingLevel.HEADING_2),
    ...c.steps.map((s) => list(s, "steps", 10 + i)),
    heading("Feedback students get", HeadingLevel.HEADING_2),
    para(c.feedback),
    heading("Built-in help (part of the activity)", HeadingLevel.HEADING_2),
    ...c.builtIn.map((b) => list(b)),
    heading("Teaching moves (what you add)", HeadingLevel.HEADING_2),
    ...(c.moves.length ? c.moves : ["Use the before, during and after ideas below."]).map((b) =>
      list(b),
    ),
    ...(c.limits
      ? [para([bold("Good to know. "), run(c.limits)], { spacing: { before: 80, after: 60 } })]
      : []),
    heading("Teach it", HeadingLevel.HEADING_2),
    para([bold("Before: "), run(c.teach.before)]),
    para([bold("During: "), run(c.teach.during)]),
    para([bold("After: "), run(c.teach.after)]),
    heading("If something goes wrong", HeadingLevel.HEADING_2),
    ...c.stuck.map((s) => list([bold(`${s.problem}: `), run(s.fix)])),
  ];
}

export async function buildActivityGuideDocx(model) {
  return toBuffer(
    buildDocument({
      title: model.title,
      description: "How to use each activity: steps, feedback, supports, teaching moves and fixes.",
      headerText: model.title,
      children: [...cover(model), ...model.cards.flatMap(card)],
    }),
  );
}
