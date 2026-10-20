#!/usr/bin/env node
/**
 * Print-ready PDFs of the three student practice sheets.
 *
 *   node scripts/generate-worksheet-pdf.mjs            # every core lesson
 *   node scripts/generate-worksheet-pdf.mjs 3-4 6-7    # these lessons
 *   node scripts/generate-worksheet-pdf.mjs --force    # ignore the hash manifest
 *
 * Renders lessons/<id>/worksheet.html, worksheet-2.html and worksheet-level-0.html
 * with headless Chrome (the same binary discovery and print call generate-pdf.mjs
 * uses; no new dependency) to lessons/<id>/downloads/<id>-worksheet[-2|-level-0].pdf.
 * Only the student pages are rendered: the answer keys live on their own gated
 * *-answer-key.html pages and are never printed here.
 *
 * Without a Chrome binary it logs that and exits 0, like generate-pdf.mjs.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lessonPath, listLessonDirs } from "../tools/lib/curriculum-source.mjs";
import { skipExit } from "../tools/lib/skip-exit.mjs";
import { findChrome, renderPdf } from "./generate-pdf.mjs";
import {
  CORE_LESSON_RE,
  pdfPath,
  readManifest,
  sha256,
  stampLanguage,
  writeManifest,
} from "./lib/student-pdf.mjs";

// Bump when the rendering approach changes enough to invalidate every PDF.
const GENERATOR_VERSION = "worksheet-pdf-2";

// The pages ask for the system UI font, which Chrome embeds as hundreds of Type 3
// glyph programs (and is not a font a PDF should redistribute). Printing in
// Arial/Georgia keeps the files a third the size, subsetted as ordinary TrueType.
const PRINT_FONTS =
  "<style>:root{--font-body:Arial,Helvetica,sans-serif;--font-display:Georgia,'Times New Roman',serif;--font-mono:'Courier New',monospace}body{font-family:Arial,Helvetica,sans-serif}</style></head>";

const SHEETS = [
  { name: "worksheet", html: "worksheet.html" },
  { name: "worksheet-2", html: "worksheet-2.html" },
  { name: "worksheet-level-0", html: "worksheet-level-0.html" },
];

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

const chrome = findChrome();
if (!chrome) {
  process.exit(skipExit("no Chrome/Chromium binary found", "set CHROME_PATH"));
}

const manifest = readManifest();
let wrote = 0;
let skipped = 0;
const failed = [];

for (const id of listLessonDirs({ filter: CORE_LESSON_RE })) {
  if (only.length && !only.includes(id)) continue;
  for (const sheet of SHEETS) {
    const src = lessonPath(id, sheet.html);
    if (!existsSync(src)) continue;
    const out = pdfPath(id, sheet.name);
    const html = readFileSync(src, "utf8");
    const key = `${id}/${sheet.name}`;
    const hash = sha256(GENERATOR_VERSION, html);
    if (!force && manifest[key] === hash && existsSync(out)) {
      skipped++;
      continue;
    }
    // Render from a temp copy beside the lesson so relative assets still resolve.
    const tmp = join(lessonPath(id), `.pdf-render-${process.pid}-${sheet.name}.html`);
    try {
      writeFileSync(tmp, html.replace("</head>", PRINT_FONTS));
      if (await renderPdf(chrome, tmp, out)) {
        stampLanguage(out);
        manifest[key] = hash;
        wrote++;
      } else {
        delete manifest[key];
        failed.push(key);
      }
    } finally {
      rmSync(tmp, { force: true });
    }
  }
}

writeManifest(manifest);
console.log(
  `generate-worksheet-pdf: wrote ${wrote}, unchanged ${skipped}${failed.length ? `, FAILED ${failed.join(", ")}` : ""}.`,
);
if (failed.length) process.exit(1);
