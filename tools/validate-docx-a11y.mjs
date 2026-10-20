#!/usr/bin/env node
/**
 * validate-docx-a11y — every shipped student homework Word file must be usable
 * with a screen reader and must not leak internal labels.
 *
 * Measured on the live site 2026-10-20 (84 core lessons): 54 had no Heading
 * styles and 20+ layout tables, 54 carried the internal token
 * `PUBLISHER_WORKSPACE:` as image alt text, 30 had drawings with no alt text
 * at all, 54 were titled like "3.4 Session 1 HW Version 2", and every one
 * printed "Version 2 / Regular" to the student. A visual check cannot see any
 * of that, so this opens the package and reads the XML.
 *
 * Checks, per lessons/<id>/homework.docx and homework-es.docx:
 *   HEADING   at least one Heading 1-3 paragraph, and the style is defined
 *   ALT       every <wp:docPr> drawing has non-empty alt text
 *   TOKEN     no PUBLISHER_WORKSPACE token anywhere in the document body
 *   TITLE     docProps/core.xml has a real title (not empty, not "... HW Version N")
 *   LANGUAGE  a document language is declared
 *   LABEL     no "Version N" / "Regular" internal label in header, footer or
 *             the title block
 *   TABLE     every table is captioned as layout/data or has a header row
 *
 * Usage: node tools/validate-docx-a11y.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import JSZip from "jszip";
import { lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";

const FILES = ["homework.docx", "homework-es.docx"];
const BAD_TITLE = /HW\s+Version|Version\s+\d|^\s*$|^\d+\.\d+\s+Session/i;
const LABEL_HEADER_FOOTER = /\bVersion\s+\d|\bRegular\b|\bV\d\b/;
const LABEL_TITLE_BLOCK = /^Version\s+\d+(\s*[/·]\s*\w+)?$/;

const textOf = (xml) =>
  xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ");

/** Findings for one .docx buffer. Pure: no filesystem access. */
export async function auditDocx(buffer) {
  const found = [];
  const zip = await JSZip.loadAsync(buffer);
  const read = async (name) => (zip.file(name) ? zip.file(name).async("string") : "");
  const doc = await read("word/document.xml");
  const styles = await read("word/styles.xml");
  const core = await read("docProps/core.xml");

  const headings = [...doc.matchAll(/<w:pStyle w:val="(Heading[1-3])"/g)].map((m) => m[1]);
  if (!headings.length) found.push("HEADING: no Heading 1-3 paragraph");
  for (const id of new Set(headings)) {
    if (!styles.includes(`w:styleId="${id}"`))
      found.push(`HEADING: style ${id} is used but not defined`);
  }

  const drawings = [...doc.matchAll(/<wp:docPr\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = drawings.filter((d) => !/\sdescr="\s*[^"\s][^"]*"/.test(d)).length;
  if (noAlt) found.push(`ALT: ${noAlt} of ${drawings.length} drawings have no alt text`);

  if (/PUBLISHER_WORKSPACE/.test(doc))
    found.push("TOKEN: PUBLISHER_WORKSPACE appears in the document");

  const title = (core.match(/<dc:title>([\s\S]*?)<\/dc:title>/) || [])[1] ?? "";
  if (BAD_TITLE.test(title))
    found.push(`TITLE: "${title.trim()}" is empty or an internal file name`);

  const lang = /<dc:language>\s*\S+/.test(core) || /<w:lang\s+w:val="[a-zA-Z-]+"/.test(styles);
  if (!lang) found.push("LANGUAGE: no document language declared");

  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(header|footer)\d*\.xml$/.test(name)) continue;
    const text = textOf(await read(name));
    if (LABEL_HEADER_FOOTER.test(text))
      found.push(`LABEL: ${name} prints an internal version/level label`);
  }
  const blockLabel = textOf(doc)
    .split("\n")
    .slice(0, 12)
    .some((line) => LABEL_TITLE_BLOCK.test(line.trim()));
  if (blockLabel) found.push('LABEL: the title block prints "Version N / level"');

  const tables = [
    ...doc.matchAll(/<w:tbl>[\s\S]*?<w:tblPr>([\s\S]*?)<\/w:tblPr>([\s\S]*?)<\/w:tr>/g),
  ];
  const unmarked = tables.filter(
    ([, pr, firstRow]) => !/<w:tblCaption\b/.test(pr) && !/<w:tblHeader\b/.test(firstRow),
  ).length;
  if (unmarked) found.push(`TABLE: ${unmarked} table(s) neither captioned nor given a header row`);

  return found;
}

// ---------- self-test: a synthetic bad file must trip every detector ----------

async function syntheticDocx({ bad }) {
  const zip = new JSZip();
  const ns =
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  const alt = bad
    ? 'descr="PUBLISHER_WORKSPACE: Blank ruled workspace"'
    : 'descr="Blank ruled workspace for calculations"';
  const noAlt = bad ? "" : 'descr="Blank grid"';
  const body = bad
    ? `<w:p><w:r><w:t>Version 2 / Regular</w:t></w:r></w:p><w:p><w:r><w:t>Plain title</w:t></w:r></w:p>
       <w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="a" ${alt}/></wp:inline></w:drawing></w:r></w:p>
       <w:p><w:r><w:drawing><wp:inline><wp:docPr id="2" name="b" ${noAlt}/></wp:inline></w:drawing></w:r></w:p>
       <w:tbl><w:tblPr><w:tblW w:w="1" w:type="dxa"/></w:tblPr><w:tr><w:tc><w:p/></w:tc></w:tr></w:tbl>`
    : `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Plain title</w:t></w:r></w:p>
       <w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="a" ${alt}/></wp:inline></w:drawing></w:r></w:p>
       <w:tbl><w:tblPr><w:tblCaption w:val="Layout"/></w:tblPr><w:tr><w:tc><w:p/></w:tc></w:tr></w:tbl>`;
  zip.file("word/document.xml", `<w:document ${ns}><w:body>${body}</w:body></w:document>`);
  zip.file(
    "word/styles.xml",
    `<w:styles ${ns}>${bad ? "" : '<w:docDefaults><w:rPrDefault><w:rPr><w:lang w:val="en-US"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Heading1"/>'}</w:styles>`,
  );
  zip.file(
    "word/header1.xml",
    `<w:hdr ${ns}><w:p><w:r><w:t>${bad ? "HOMEWORK / V2" : "HOMEWORK"}</w:t></w:r></w:p></w:hdr>`,
  );
  zip.file(
    "docProps/core.xml",
    `<cp:coreProperties xmlns:cp="x" xmlns:dc="y"><dc:title>${bad ? "3.4 Session 1 HW Version 2" : "Lesson 3.4 Homework — Session 1"}</dc:title></cp:coreProperties>`,
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

async function selfTest() {
  const good = await auditDocx(await syntheticDocx({ bad: false }));
  if (good.length) throw new Error(`self-test: the clean fixture failed: ${good.join("; ")}`);
  const bad = (await auditDocx(await syntheticDocx({ bad: true }))).map((f) => f.split(":")[0]);
  for (const kind of ["HEADING", "ALT", "TOKEN", "TITLE", "LANGUAGE", "LABEL", "TABLE"]) {
    if (!bad.includes(kind))
      throw new Error(`self-test: the ${kind} detector did not fire on the bad fixture`);
  }
}

async function main() {
  await selfTest();
  const failures = [];
  let checked = 0;
  for (const id of listLessonDirs()) {
    for (const file of FILES) {
      const path = lessonPath(id, file);
      if (!existsSync(path)) continue;
      checked++;
      for (const finding of await auditDocx(readFileSync(path)))
        failures.push(`${id}/${file}: ${finding}`);
    }
  }
  if (!checked) {
    console.error(
      "validate-docx-a11y: FAIL — no homework .docx files found; a sweep of zero verifies nothing.",
    );
    process.exit(1);
  }
  if (failures.length) {
    console.error(failures.slice(0, 400).join("\n"));
    console.error(
      `validate-docx-a11y: FAIL — ${failures.length} finding(s) across ${checked} file(s).`,
    );
    process.exit(1);
  }
  console.log(
    `validate-docx-a11y: PASS — ${checked} homework .docx files (headings, alt text, titles, language, labels, tables).`,
  );
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await main();
