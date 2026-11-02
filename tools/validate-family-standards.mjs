#!/usr/bin/env node
/**
 * validate-family-standards: ONE standard code per lesson, on every family-facing surface.
 *
 * The code is `lessons/<id>/config.json` `standard` (docs/family-homework-v3/standards.md). Until 2026-10-28 the publisher
 * homework Word files and their PDFs printed "Maryland Standard 6.RP.A.3c" for lesson 4-5 while its page printed "6.AT.4",
 * and the curriculum manifest (so the hub, the family pages and the launch manifest) printed "6.AT.3" for 3-6 and 3-7
 * where the config says "6.AT.3c" (a per-lesson override in the manifest builder).
 *
 * For all 166 family lessons it checks that these print exactly that code and no other standard-shaped code:
 *   WEB      lessons/<id>/homework.html
 *   GUIDE    lessons/<id>/family/index.html          (the family guide)
 *   HUB      curriculum/units/index.html badge, families/lessons/<id>/index.html, src/data/family-lessons.json, data/curriculum-manifest.json,
 *            data/curriculum-launch-manifest.json
 *   SHEET    the Family Take-Home Sheet and grown-up page PDFs (EN + ES) and its Word file
 *   HOMEWORK homework.docx / homework-es.docx and the homework PDF
 * and, in source, that no family-facing generator reads the district crosswalk (a different taxonomy: pacing data).
 * Self-tests first; a sweep of zero lessons or zero surfaces FAILS.
 *
 *   node tools/validate-family-standards.mjs            all lessons
 *   node tools/validate-family-standards.mjs 4-5 3-6    only these ids
 */
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import JSZip from "jszip";
import { listFamilyIds, outputPaths } from "../scripts/lib/family-takehome-files.mjs";
import { printedStandard } from "../scripts/lib/homework-docx-a11y.mjs";
import { lessonStandard } from "../scripts/lib/lesson-identity.mjs";
import { pdfPath } from "../scripts/lib/student-pdf.mjs";
import { lessonPath, REPO_ROOT } from "./lib/curriculum-source.mjs";

const run = promisify(execFile);

/** Anything shaped like a standard code: 6.AT.4, 6.AT.3c, 6.NOS.3, 5.NBT.B.7, 6.RP.A.3c, MPP.3. */
const CODE = /\b(?:[5-8]\.[A-Z]{1,4}\.(?:[A-Z]\.)?\d+[a-z]?|MPP\.\d+)(?![\w.]*\w)/g;

/** Pure: the standard-shaped codes in `text`. */
export const codesIn = (text) => [...new Set(text.match(CODE) ?? [])];

/** Pure: findings for one surface's text against the lesson's code. */
export function textFindings(surface, text, code, { label = "" } = {}) {
  const found = [];
  if (!text.includes(label ? `${label}${code}` : code))
    found.push(`${surface}: does not print ${label}${code}`);
  const other = codesIn(text).filter((c) => c !== code);
  if (other.length) found.push(`${surface}: prints ${other.join(", ")} beside ${code}`);
  return found;
}

const FAMILY_SOURCES = [
  "scripts/generate-homework-html.mjs",
  "scripts/generate-lesson-support-pages.mjs",
  "scripts/generate-family-pages.mjs",
  "scripts/generate-homework.mjs",
  "scripts/lib/family-takehome-data.mjs",
  "scripts/lib/family-takehome-html.mjs",
  "scripts/lib/family-takehome-docx.mjs",
];
const CROSSWALK = /district_scope_sequence_crosswalk|standards-crosswalk-2025/;
export const crosswalkFindings = (source, file) =>
  CROSSWALK.test(source)
    ? [`SOURCE: ${file} reads the district crosswalk; family surfaces use config.standard`]
    : [];

const strip = (html) => html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, " ");

async function docxText(file) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  return (await zip.file("word/document.xml").async("string"))
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&");
}

async function pdfText(file) {
  return (await run("pdftotext", [file, "-"], { maxBuffer: 32 * 1024 * 1024 })).stdout;
}

function selfTest() {
  const must = (c, m) => {
    if (!c) throw new Error(`self-test: ${m}`);
  };
  must(
    codesIn("Maryland Standard 6.RP.A.3c and 6.AT.4, MPP.3, 5.NBT.B.7, 6.NOS.3").length === 5,
    "code pattern misses a shape",
  );
  must(
    codesIn("version 2.5.1 and 4.5 · 12.3").length === 0,
    "code pattern matches ordinary numbers",
  );
  must(
    textFindings("x", "Standard 6.AT.4", "6.AT.4", { label: "Standard " }).length === 0,
    "a clean surface was flagged",
  );
  must(
    textFindings("x", "Maryland Standard 6.RP.A.3c", "6.AT.4").length === 2,
    "the publisher code must be caught twice (missing + other)",
  );
  must(
    textFindings("x", "6.AT.3 and 6.AT.3c", "6.AT.3c").some((f) => f.includes("beside")),
    "a shorter code beside the right one must be caught",
  );
  must(
    textFindings("x", "Standard 6.AT.3", "6.AT.3c", { label: "Standard " }).length >= 1,
    "6.AT.3 must not satisfy 6.AT.3c",
  );
  must(
    crosswalkFindings("import x from 'curriculum/district_scope_sequence_crosswalk.json'", "f")
      .length === 1,
    "crosswalk read not caught",
  );
  must(
    crosswalkFindings("const standard = config.standard", "f").length === 0,
    "clean source flagged",
  );
  must(
    printedStandard("<w:t>Maryland Standard 6.RP.A.3c   ·   Learning target</w:t>") === "6.RP.A.3c",
    "printedStandard misses the publisher form",
  );
  must(
    printedStandard("<w:t>Lesson 2-11 • Standard 6.NOS.3</w:t>") === "6.NOS.3",
    "printedStandard misses the generated form",
  );
}

async function main() {
  selfTest();
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const ids = listFamilyIds().filter((id) => !only.length || only.includes(id));
  const failures = [];
  let surfaces = 0;
  const check = (id, found) => {
    surfaces++;
    for (const f of found) failures.push(`${id}: ${f}`);
  };

  for (const file of FAMILY_SOURCES)
    check("source", crosswalkFindings(readFileSync(join(REPO_ROOT, file), "utf8"), file));

  const familyLessons = JSON.parse(
    readFileSync(join(REPO_ROOT, "src/data/family-lessons.json"), "utf8"),
  );
  const manifest = JSON.parse(
    readFileSync(join(REPO_ROOT, "data/curriculum-manifest.json"), "utf8"),
  );
  const launch = JSON.parse(
    readFileSync(join(REPO_ROOT, "data/curriculum-launch-manifest.json"), "utf8"),
  );
  const byId = (list, key) => new Map(list.map((l) => [l[key], l]));
  const hubs = [
    ["src/data/family-lessons.json", byId(familyLessons, "lessonId")],
    ["data/curriculum-manifest.json", byId(manifest.lessons, "id")],
    ["data/curriculum-launch-manifest.json", byId(launch.lessons, "id")],
  ];

  const unitsHub = readFileSync(join(REPO_ROOT, "curriculum/units/index.html"), "utf8");
  const hubBadge = (id) =>
    new RegExp(`data-search="${id} [\\s\\S]*?<span class="badge badge-std">([^<]*)</span>`).exec(
      unitsHub,
    )?.[1];

  for (const id of ids) {
    const code = lessonStandard(id);
    const badge = hubBadge(id);
    if (badge !== undefined)
      check(
        id,
        badge === code
          ? []
          : [`HUB curriculum/units/index.html: badge is ${badge}, config says ${code}`],
      );
    check(
      id,
      textFindings(
        "WEB homework.html",
        strip(readFileSync(lessonPath(id, "homework.html"), "utf8")),
        code,
      ),
    );

    const guide = lessonPath(id, "family", "index.html");
    if (existsSync(guide))
      check(
        id,
        textFindings("GUIDE family/index.html", strip(readFileSync(guide, "utf8")), code, {
          label: "Standard ",
        }),
      );

    const hubPage = join(REPO_ROOT, "families/lessons", id, "index.html");
    if (existsSync(hubPage))
      check(
        id,
        textFindings("HUB families/lessons page", strip(readFileSync(hubPage, "utf8")), code, {
          label: "Standard: ",
        }),
      );
    for (const [name, map] of hubs) {
      const row = map.get(id);
      if (row)
        check(
          id,
          row.standard === code
            ? []
            : [`HUB ${name}: standard is ${row.standard}, config says ${code}`],
        );
    }

    for (const lang of ["en", "es"]) {
      const files = outputPaths(id, lang);
      for (const [name, file] of [
        ["sheet PDF", files.sheetPdf],
        ["grown-up PDF", files.guidePdf],
      ]) {
        if (existsSync(file))
          check(id, textFindings(`SHEET ${lang} ${name}`, await pdfText(file), code));
        else failures.push(`${id}: SHEET ${lang} ${name} is missing`);
      }
      if (existsSync(files.docx))
        check(id, textFindings(`SHEET ${lang} Word`, await docxText(files.docx), code));
      else failures.push(`${id}: SHEET ${lang} Word file is missing`);
    }

    for (const name of ["homework.docx", "homework-es.docx"]) {
      const file = lessonPath(id, name);
      if (!existsSync(file)) continue;
      const printed = printedStandard(
        await docxText(file).then((t) => `<w:t>${t.replace(/\n/g, " ")}</w:t>`),
      );
      if (printed !== null)
        check(
          id,
          printed === code ? [] : [`HOMEWORK ${name}: prints ${printed}, config says ${code}`],
        );
    }
    const hwPdf = pdfPath(id, "homework");
    if (existsSync(hwPdf))
      check(
        id,
        textFindings("HOMEWORK PDF", await pdfText(hwPdf), code, { label: "Standard " }).filter(
          (f) => !f.includes("does not print"),
        ),
      );
  }

  if (!ids.length || surfaces < ids.length) {
    console.error(
      "validate-family-standards: FAIL - the sweep covered too little; a sweep of zero verifies nothing.",
    );
    process.exit(1);
  }
  if (failures.length) {
    console.error(failures.slice(0, 60).join("\n"));
    console.error(
      `validate-family-standards: FAIL - ${failures.length} finding(s) across ${surfaces} surfaces.`,
    );
    process.exit(1);
  }
  console.log(
    `validate-family-standards: PASS - ${ids.length} lessons, ${surfaces} surfaces: web, family guide, hub, take-home sheets, Word and PDF homework all print the one config.json code.`,
  );
}

main().catch((error) => {
  console.error(`validate-family-standards: ${error.stack ?? error}`);
  process.exit(1);
});
