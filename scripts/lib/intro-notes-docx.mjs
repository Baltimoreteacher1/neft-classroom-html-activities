// The presenter notes as an editable Word file, built from presenter-notes.js (the same data as the PDF and the
// Markdown script). Single column, real headings and lists, real hyperlinks, the one QR code as a PNG with alt text.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HeadingLevel, ImageRun } from "docx";
import { absUrl, ENTRANCE, shortUrl } from "../../access-practice-lab/src/intro/data.js";
import {
  BACKUP_ALL,
  DOWNLOAD_NAMES,
  HANDOFF,
  PRESENTER_NOTES,
  ROOM_SETUP,
} from "../../access-practice-lab/src/intro/presenter-notes.js";
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
import { NOTES_TITLE } from "./intro-notes-html.mjs";

const QR_PNG = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "access-practice-lab",
  "guides",
  "qr-start.png",
);
const sub = (text) =>
  para([bold(text, { color: MUTED })], { spacing: { before: 60, after: 20 }, keepNext: true });
const bullets = (items) => items.map((i) => list(i));
const say = (lines) =>
  para([bold("Say: "), run(lines.map((s) => `“${s}”`).join(" "))], {
    spacing: { before: 40, after: 60 },
  });
const openLine = (route, label) =>
  para([bold("Link: "), link(label, absUrl(route)), run(` ${shortUrl(route)}`, { color: MUTED })], {
    keepNext: true,
    spacing: { after: 20 },
  });

function rowBlock(r) {
  return [
    heading(`${r.range} min: ${r.title}`, HeadingLevel.HEADING_3),
    openLine(r.route, r.openLabel),
    say(r.say),
    sub("You"),
    ...bullets(r.presenterDoes),
    sub("Teachers"),
    ...bullets(r.teachersDo),
    para([bold("Watch for: "), run(r.watchFor)]),
    para([bold("Backup: "), run(r.backup)]),
  ];
}

export async function buildNotesDocx() {
  const qr = new ImageRun({
    type: "png",
    data: readFileSync(QR_PNG),
    transformation: { width: 88, height: 88 },
    altText: {
      name: "QR code",
      title: "QR code",
      description: `QR code for ${ENTRANCE.short}, the teacher starting page.`,
    },
  });
  const children = [
    heading(NOTES_TITLE, HeadingLevel.HEADING_1),
    para([qr]),
    para(
      "Run this script top to bottom. The times match the schedule, then the 20-minute exploration.",
    ),
    para([
      bold("One link for teachers: "),
      link(ENTRANCE.short, ENTRANCE.url),
      run(" (the QR code above opens it)"),
    ]),
    heading("Before the room fills", HeadingLevel.HEADING_2),
    ...bullets(ROOM_SETUP),
    heading("The 30 minutes", HeadingLevel.HEADING_2),
    ...PRESENTER_NOTES.flatMap(rowBlock),
    heading(`30 min: ${HANDOFF.title}`, HeadingLevel.HEADING_3),
    openLine(HANDOFF.route, HANDOFF.openLabel),
    para([bold("On screen: "), run(HANDOFF.onScreen)]),
    say(HANDOFF.say),
    sub("How teachers choose a focus"),
    ...bullets(HANDOFF.chooseFocus),
    sub("You"),
    ...bullets(HANDOFF.presenterDoes),
    para(HANDOFF.downloads),
    heading("If something fails", HeadingLevel.HEADING_2),
    ...["audio", "microphones", "network"].flatMap((k) => [
      heading(BACKUP_ALL[k].problem, HeadingLevel.HEADING_3),
      ...bullets(BACKUP_ALL[k].steps),
    ]),
    heading("The three downloads", HeadingLevel.HEADING_2),
    ...DOWNLOAD_NAMES.map((d) =>
      list([
        bold(`${d.name}, `),
        run(`${d.detail}: `),
        link("PDF", absUrl(d.pdf.replace("/access-practice-lab", ""))),
        run(" and "),
        link("Word", absUrl(d.docx.replace("/access-practice-lab", ""))),
      ]),
    ),
  ];
  return toBuffer(
    buildDocument({
      title: NOTES_TITLE,
      description:
        "Presenter script for the 30-minute introduction, with room setup and backup plans.",
      headerText: "The Language Page presenter notes",
      children,
    }),
  );
}
