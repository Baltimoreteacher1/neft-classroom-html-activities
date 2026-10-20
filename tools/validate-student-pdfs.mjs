#!/usr/bin/env node
/**
 * validate-student-pdfs — the print-ready PDFs of the student homework and the
 * three practice worksheets exist for every core lesson that has the source,
 * are real PDFs, and are tagged, marked and language-stamped (the same three
 * properties validate-pdf-tagged asks of the notes PDFs).
 *
 * Until 2026-10-20 only the guided notes had a PDF, so a family without Word
 * could not print the homework or a worksheet at all. A missing file is a 404 a
 * link checker would only see if something linked it; this holds the set.
 *
 * Usage: node tools/validate-student-pdfs.mjs
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { CORE_LESSON_RE, pdfPath, TAGGED_CHECKS } from "../scripts/lib/student-pdf.mjs";
import { lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";

const WANTED = [
  { name: "worksheet", source: "worksheet.html" },
  { name: "worksheet-2", source: "worksheet-2.html" },
  { name: "worksheet-level-0", source: "worksheet-level-0.html" },
  { name: "homework", source: "homework.docx" },
];

/** Findings for one PDF's bytes. Pure. */
export function auditPdf(bytes) {
  const found = [];
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") found.push("not a PDF");
  const text = bytes.toString("latin1");
  for (const check of TAGGED_CHECKS) if (!check.re.test(text)) found.push(`missing ${check.name}`);
  return found;
}

function selfTest() {
  const good = Buffer.from(
    "%PDF-1.7 /StructTreeRoot /Marked true /Lang(en-US) /Type /Catalog",
    "latin1",
  );
  if (auditPdf(good).length)
    throw new Error("self-test: a tagged, language-stamped PDF was rejected");
  const bad = auditPdf(Buffer.from("%PDF-1.7 /Type /Catalog", "latin1"));
  if (bad.length !== 3)
    throw new Error(`self-test: untagged PDF produced ${bad.length} findings, expected 3`);
  if (!auditPdf(Buffer.from("PK", "latin1")).includes("not a PDF"))
    throw new Error("self-test: a non-PDF was accepted");
}

selfTest();
const failures = [];
let checked = 0;
for (const id of listLessonDirs({ filter: CORE_LESSON_RE })) {
  for (const { name, source } of WANTED) {
    if (!existsSync(lessonPath(id, source))) continue;
    const file = pdfPath(id, name);
    if (!existsSync(file)) {
      failures.push(`${id}: missing downloads/${id}-${name}.pdf`);
      continue;
    }
    checked++;
    if (statSync(file).size < 2000) failures.push(`${id}/${name}: unexpectedly small`);
    for (const finding of auditPdf(readFileSync(file))) failures.push(`${id}/${name}: ${finding}`);
  }
}

if (!checked) {
  console.error(
    "validate-student-pdfs: FAIL — no student PDFs found; a sweep of zero verifies nothing.",
  );
  process.exit(1);
}
if (failures.length) {
  console.error(failures.slice(0, 80).join("\n"));
  console.error(
    `validate-student-pdfs: FAIL — ${failures.length} finding(s) across ${checked} PDFs.`,
  );
  process.exit(1);
}
console.log(
  `validate-student-pdfs: PASS — ${checked} homework and worksheet PDFs are tagged, marked and language-stamped.`,
);
