#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const root = REPO_ROOT;
const index = readFileSync(join(root, "curriculum/practice-workbooks/index.html"), "utf8");
const failures = [];
const ids = listLessonDirs().filter((id) => existsSync(lessonPath(id, "worksheet.html")));
for (const id of ids) {
  const base = lessonPath(id, "downloads", `${id}-practice-workbook`);
  for (const [extension, signature] of [
    ["docx", "PK\x03\x04"],
    ["pdf", "%PDF-"],
  ]) {
    const path = `${base}.${extension}`;
    if (!existsSync(path)) {
      failures.push(`${id}: missing ${extension}`);
      continue;
    }
    if (statSync(path).size < 2000) failures.push(`${id}: ${extension} is unexpectedly small`);
    const start = readFileSync(path).subarray(0, signature.length).toString("latin1");
    if (start !== signature) failures.push(`${id}: invalid ${extension} signature`);
    if (!index.includes(`/lessons/${id}/downloads/${id}-practice-workbook.${extension}`))
      failures.push(`${id}: ${extension} is not linked in the workbook library`);
  }
}
const cards = (index.match(/<article class="sheet"/g) || []).length;
if (cards !== ids.length) failures.push(`library has ${cards} sheets; expected ${ids.length}`);
if (failures.length) {
  console.error(failures.slice(0, 40).join("\n"));
  console.error(`${failures.length} practice workbook errors`);
  process.exit(1);
}
console.log(`${ids.length} lessons have valid DOCX and PDF files and working library links.`);
