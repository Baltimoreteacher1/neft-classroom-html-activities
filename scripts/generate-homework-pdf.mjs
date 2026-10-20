#!/usr/bin/env node
/**
 * Print-ready PDF of each core lesson's student homework Word file.
 *
 *   node scripts/generate-homework-pdf.mjs            # every core lesson
 *   node scripts/generate-homework-pdf.mjs 3-4 6-7    # these lessons
 *   node scripts/generate-homework-pdf.mjs --force    # ignore the hash manifest
 *
 * lessons/<id>/homework.docx -> lessons/<id>/downloads/<id>-homework.pdf, converted
 * with headless LibreOffice so the PDF is the Word file's own layout rather than a
 * second rendering of the same content. Generated homework files carry a teacher
 * answer-key page; it is cut from the temporary copy that gets converted, so the
 * student PDF never prints it (the .docx itself is not touched).
 *
 * LibreOffice runs with a private profile (a shared one hands the job to whatever
 * instance already owns it and exits 0 with no output) and exports a tagged PDF.
 * Without soffice it logs that and exits 0.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lessonPath, listLessonDirs } from "../tools/lib/curriculum-source.mjs";
import { skipExit } from "../tools/lib/skip-exit.mjs";
import { withoutTeacherKey } from "./lib/homework-docx-a11y.mjs";
import {
  CORE_LESSON_RE,
  pdfPath,
  readManifest,
  sha256,
  stampLanguage,
  writeManifest,
} from "./lib/student-pdf.mjs";

const GENERATOR_VERSION = "homework-pdf-1";
const FILTER = 'pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"}}';

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

const probe = spawnSync("soffice", ["--version"], { encoding: "utf8" });
if (probe.error || probe.status !== 0) {
  process.exit(
    skipExit(
      "soffice (LibreOffice) not found",
      "install LibreOffice; the .docx downloads still work",
    ),
  );
}

const manifest = readManifest();
const work = mkdtempSync(join(tmpdir(), "neft-hwpdf-"));
const profile = join(work, "profile");
const pending = [];
let skipped = 0;

try {
  const inDir = join(work, "in");
  mkdirSync(inDir);
  for (const id of listLessonDirs({ filter: CORE_LESSON_RE })) {
    if (only.length && !only.includes(id)) continue;
    const src = lessonPath(id, "homework.docx");
    if (!existsSync(src)) continue;
    const student = await withoutTeacherKey(readFileSync(src));
    const key = `${id}/homework`;
    const hash = sha256(GENERATOR_VERSION, student);
    if (!force && manifest[key] === hash && existsSync(pdfPath(id, "homework"))) {
      skipped++;
      continue;
    }
    writeFileSync(join(inDir, `${id}-homework.docx`), student);
    pending.push({ id, key, hash });
  }

  if (pending.length) {
    const outDir = join(work, "out");
    mkdirSync(outDir);
    const run = spawnSync(
      "soffice",
      [
        "--headless",
        "--norestore",
        `-env:UserInstallation=file://${profile}`,
        "--convert-to",
        FILTER,
        "--outdir",
        outDir,
        ...pending.map(({ id }) => join(inDir, `${id}-homework.docx`)),
      ],
      { encoding: "utf8", timeout: 20 * 60 * 1000 },
    );
    if (run.status !== 0) throw new Error(`soffice exited ${run.status}: ${run.stderr}`);
    for (const { id, key, hash } of pending) {
      const made = join(outDir, `${id}-homework.pdf`);
      if (!existsSync(made)) {
        delete manifest[key];
        console.error(`generate-homework-pdf: no output for ${id}`);
        continue;
      }
      mkdirSync(join(lessonPath(id), "downloads"), { recursive: true });
      copyFileSync(made, pdfPath(id, "homework"));
      stampLanguage(pdfPath(id, "homework"));
      manifest[key] = hash;
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

writeManifest(manifest);
const missing = pending.filter(({ key }) => !manifest[key]).length;
console.log(`generate-homework-pdf: wrote ${pending.length - missing}, unchanged ${skipped}.`);
if (missing) process.exit(1);
