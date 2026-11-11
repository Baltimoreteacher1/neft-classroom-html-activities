// The Quick Guide as an editable Word file, built from the same model as the page and the PDF (quick-guide-model.js).
// Two Letter pages; real hyperlinks, list and heading styles, a header row on the activity tables, the one QR code
// as a PNG with alt text. Checkboxes are the character U+2610 so they print and can be changed in Word.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HeadingLevel,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Paragraph,
  TabStopType,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
} from "docx";
import { ADDRESS_PREFIX } from "../../access-practice-lab/src/intro/quick-guide-model.js";
import {
  bold,
  buildDocument,
  dataTable,
  heading,
  link,
  list,
  MUTED,
  para,
  run,
  TEXT_WIDTH,
  toBuffer,
  writeLine,
} from "./intro-docx-kit.mjs";

const QR_PNG = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "access-practice-lab",
  "guides",
  "qr-start.png",
);
const BOX = "☐";

const url = (u) => run(` ${u}`, { color: MUTED });

function startBlock(p) {
  const qr = new ImageRun({
    type: "png",
    data: readFileSync(QR_PNG),
    transformation: { width: 96, height: 96 },
    altText: { name: "QR code", title: "QR code", description: p.start.qrAlt },
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.MARGIN,
        align: HorizontalPositionAlign.RIGHT,
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PARAGRAPH,
        align: VerticalPositionAlign.TOP,
      },
      wrap: { type: TextWrappingType.SQUARE },
      margin: { left: 100000, bottom: 40000 },
    },
  });
  return [
    heading("Start here", HeadingLevel.HEADING_2),
    para([qr, run(p.startHere)]),
    para([
      run(`${p.start.text} `),
      link(p.start.link.text, p.start.link.url),
      url(p.start.link.short),
    ]),
    para([
      run(`${p.start.more.text} `),
      ...p.start.more.links.flatMap((l, i) => [
        ...(i ? [run(" · ")] : []),
        link(l.text, l.url),
        url(l.route),
      ]),
    ]),
  ];
}

/** One table for every domain when each has one activity: the domain name leads the activity cell. */
function compactTable(pathways) {
  const rows = pathways.map((pw) => {
    const a = pw.activities[0];
    return [
      [
        para([bold(pw.name)], { spacing: { after: 20 } }),
        para([run(`${BOX} `), link(a.name, a.link.url)], { spacing: { after: 20 } }),
        para([run(a.link.shown || a.link.route, { color: MUTED })], { spacing: { after: 0 } }),
      ],
      [para(a.tryNow, { spacing: { after: 0 } })],
      [para(a.classroomUse, { spacing: { after: 0 } })],
    ];
  });
  return [dataTable(["Activity", "What to try", "One classroom use"], rows, [3000, 3960, 3552])];
}

function activityTable(pw) {
  const rows = pw.activities.map((a) => [
    [
      para([run(`${BOX} `), link(a.name, a.link.url)], { spacing: { after: 20 } }),
      para([run(a.link.shown || a.link.route, { color: MUTED })], { spacing: { after: 0 } }),
    ],
    [para(a.tryNow, { spacing: { after: 0 } })],
    [para(a.classroomUse, { spacing: { after: 0 } })],
  ]);
  return [
    heading(`${pw.name}: ${pw.blurb}`, HeadingLevel.HEADING_2),
    dataTable(["Activity", "What to try", "One classroom use"], rows, [3000, 3960, 3552]),
  ];
}

/** A bold prompt followed by a ruled line to the margin, on one row. */
const labelledLine = (label) =>
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH, leader: "underscore" }],
    spacing: { before: 180, after: 0 },
    children: [bold(`${label} `), run("\t")],
  });

function planning(pl) {
  return [
    heading(pl.heading, HeadingLevel.HEADING_2),
    ...pl.prompts.map((q) => labelledLine(q.label)),
    para([bold(`${pl.frameLabel}: `), run(pl.frame)], {
      spacing: { before: 120, after: 0 },
      keepNext: true,
    }),
    writeLine(200),
  ];
}

function page2(p) {
  const l = p.links;
  const addr = (route) => run(` ${route}`, { color: MUTED });
  return [
    heading(p.heading, HeadingLevel.HEADING_1, { pageBreakBefore: true }),
    para([bold(`${p.topic}, ${p.minutes} minutes. `), run(p.objective)]),
    para([bold("Say to students: "), run(`“${p.prompt}” `), bold("Frame: "), run(p.frame)]),
    para(
      [
        link(l.lesson.label, l.lesson.url),
        addr(l.lesson.route),
        run("     "),
        link(l.activity.label, l.activity.url),
        addr(l.activity.route),
      ],
      { spacing: { after: 20 } },
    ),
    para([
      link(l.siteGuide.text, l.siteGuide.url),
      addr(l.siteGuide.route),
      run("     "),
      run(p.addressNoteText ?? `Web addresses here begin with ${ADDRESS_PREFIX}`, { color: MUTED }),
    ]),
    heading("The five steps", HeadingLevel.HEADING_2),
    ...p.steps.map((s) =>
      list(
        [
          bold(`${s.name} `),
          run(`${s.minutes} ${s.minutes === 1 ? "minute" : "minutes"}. `, { color: MUTED }),
          run(s.direction),
        ],
        "steps",
        1,
      ),
    ),
    heading("Sample learner work", HeadingLevel.HEADING_2),
    para([bold(`${p.sample.firstLabel}: `), run(p.sample.first)]),
    para([bold(`${p.sample.improvedLabel}: `), run(p.sample.improved)]),
    para([run(p.sample.note, { color: MUTED })]),
    para([bold("One feedback cue: "), run(p.cue)]),
    para([bold("Quick check: "), run(p.check)]),
    para([bold("Follow-up: "), run(p.followUp)]),
    heading(`Three support choices. ${p.fade}`, HeadingLevel.HEADING_2),
    ...p.supports.flatMap((s) => [
      para([bold(s.name)], { spacing: { after: 20 }, keepNext: true }),
      ...s.items.map((i) => list(i)),
    ]),
    para([run(`${p.fadeDetail} ${p.homeLanguage}`)], { spacing: { before: 100 } }),
  ];
}

export async function buildGuideDocx(model) {
  const { page1, page2: p2 } = model;
  const children = [
    heading(page1.heading, HeadingLevel.HEADING_1),
    ...startBlock(page1),
    heading("The 20 minutes", HeadingLevel.HEADING_2),
    ...page1.sequence.map((s) =>
      para([bold(`${s.range}  `), bold(`${s.name}. `), run(s.detail)], { spacing: { after: 20 } }),
    ),
    para([run(page1.addressNote, { color: MUTED })], { spacing: { before: 80 } }),
    ...(page1.pathways.every((pw) => pw.activities.length === 1)
      ? compactTable(page1.pathways)
      : page1.pathways.flatMap(activityTable)),
    ...planning(page1.planning),
    ...page2({ ...p2, addressNoteText: page1.addressNote }),
  ];
  return toBuffer(
    buildDocument({
      title: `${model.siteName} ${model.title}`,
      description: "Two-page teacher guide: a 20-minute exploration and the featured lesson.",
      headerText: `${model.siteName} ${model.title}`,
      children,
    }),
  );
}
