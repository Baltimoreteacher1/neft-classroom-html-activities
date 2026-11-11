// The Featured Lesson backup as an editable Word file. Page 1 is for students (no teacher guidance); page 2 is for the
// teacher. Built from lesson-backup-model.js, the same model as the PDF. The lesson picture (a file under pictures/,
// or the early-learner garden scene) is rasterized with its alt text; every link is a real hyperlink.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
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
  writeLine,
} from "./intro-docx-kit.mjs";

const LAB = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "access-practice-lab");

/** The lesson picture: a file under pictures/ or, for the early-learner scene drawn in code, an SVG data URI. */
function pictureSvg(src) {
  const inline = /^data:image\/svg\+xml;charset=utf-8,(.*)$/.exec(src);
  if (inline) return decodeURIComponent(inline[1]);
  return readFileSync(join(LAB, src.replace("/access-practice-lab/", "")), "utf8");
}

function picture(pic) {
  const svg = pictureSvg(pic.src);
  const data = new Resvg(svg, { fitTo: { mode: "width", value: 1036 } }).render().asPng();
  return new ImageRun({
    type: "png",
    data,
    transformation: { width: 272, height: 170 },
    altText: { name: pic.name, title: pic.name, description: pic.alt },
  });
}

/** An empty bordered box to draw in (Kindergarten and Grade 1). */
const drawBox = () =>
  para([run(" ")], {
    border: ["top", "bottom", "left", "right"].reduce(
      (b, side) => ({ ...b, [side]: { style: "single", size: 8, color: "6B7280", space: 4 } }),
      {},
    ),
    spacing: { before: 60, after: 120, line: 3600, lineRule: "exact" },
  });

function studentPage(s) {
  return [
    para([bold(s.subheading, { color: MUTED })], { spacing: { after: 0 } }),
    heading(s.heading, HeadingLevel.HEADING_1),
    para([bold("Name "), run("\t")], {
      tabStops: [{ type: "right", position: 10512, leader: "underscore" }],
      spacing: { after: 120 },
    }),
    para([picture(s.picture)], { spacing: { after: 80 } }),
    para([bold(`${s.promptLabel}: `), run(s.prompt, { size: 26 })], {
      spacing: { after: 100, line: 276 },
    }),
    para([bold(`${s.frameLabel}: `), run(s.frame)], { spacing: { after: 120 } }),
    heading(s.directionsLabel, HeadingLevel.HEADING_2),
    ...s.directions.map((d) => list(d, "steps", 1)),
    ...s.writing.flatMap((w) => [
      heading(w.label, HeadingLevel.HEADING_2),
      ...(w.draw ? [drawBox()] : Array.from({ length: w.lines - 1 }, () => writeLine(230))),
    ]),
    para([bold(`${s.materialsLabel}: `), run(`${s.materials.join("; ")}.`)], {
      spacing: { before: 140 },
    }),
    para([
      bold("Time: "),
      run(`${s.time}. `),
      bold(`${s.link.text}: `),
      link(s.link.short, s.link.url),
    ]),
  ];
}

function teacherPage(t) {
  return [
    heading(t.heading, HeadingLevel.HEADING_1, { pageBreakBefore: true }),
    para(t.intro),
    para([bold(`${t.objectiveLabel}: `), run(t.objective)]),
    heading("Five steps", HeadingLevel.HEADING_2),
    ...t.steps.map((s) =>
      list(
        [
          bold(`${s.name} `),
          run(`${s.minutes} ${s.minutes === 1 ? "minute" : "minutes"}. `, { color: MUTED }),
          run(s.direction),
        ],
        "steps",
        2,
      ),
    ),
    heading("Example learner work", HeadingLevel.HEADING_2),
    para([bold(`${t.sample.firstLabel}: `), run(t.sample.first)]),
    para([bold(`${t.sample.improvedLabel}: `), run(t.sample.improved)]),
    para([run(t.sample.note, { color: MUTED })]),
    para([bold("One feedback cue: "), run(t.cue)]),
    para([bold("Quick check: "), run(t.check)]),
    para([bold("Follow-up: "), run(t.followUp)]),
    heading("Three support choices", HeadingLevel.HEADING_2),
    ...t.supports.flatMap((s) => [
      para([bold(s.name)], { spacing: { after: 20 }, keepNext: true }),
      ...s.items.map((i) => list(i)),
    ]),
    para([run(t.notes.join(" "))], { spacing: { before: 100 } }),
    para([run(`${t.entrance.text}: `), link(t.entrance.short, t.entrance.url)]),
  ];
}

export async function buildBackupDocx(model) {
  return toBuffer(
    buildDocument({
      title: model.title,
      description: "Backup copy of the featured lesson: a student page and a teacher page.",
      headerText: "The Language Page: Featured Lesson",
      children: [...studentPage(model.student), ...teacherPage(model.teacher)],
    }),
  );
}
