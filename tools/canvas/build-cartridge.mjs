#!/usr/bin/env node
/**
 * build-cartridge.mjs — generate a Canvas-importable Common Cartridge (.imscc)
 * that creates one graded assignment per Reveal Math lesson, each linking to the
 * live lesson and accepting the student's completion code (online text entry).
 *
 * Import in Canvas: Course → Settings → Import Course Content →
 *   "Common Cartridge 1.x Package" → upload → Import. Assignments import
 *   UNPUBLISHED so you can review before publishing. No admin needed.
 *
 * Usage:
 *   node tools/canvas/build-cartridge.mjs            # all 74 lessons
 *   node tools/canvas/build-cartridge.mjs 1          # just Unit 1 (good first test)
 *   npm run cartridge -- 1
 *
 * Env: NEFT_SITE overrides base site (default https://eduwonderlab.com).
 * Output: canvas-packages/neft-lessons[-unitN].imscc
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { execSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");
const unitFilter = process.argv[2] ? Number(process.argv[2]) : null;

const xml = (s) =>
  String(s == null ? "" : s).replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c],
  );

const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
let lessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id && !l.flagship);
if (unitFilter) lessons = lessons.filter((l) => Number(l.unit) === unitFilter);
if (!lessons.length) {
  console.error("No lessons matched.");
  process.exit(1);
}

const GROUP_ID = "g_neft_lessons";
const stage = resolve(repoRoot, "canvas-packages", "_stage");
rmSync(stage, { recursive: true, force: true });
mkdirSync(resolve(stage, "course_settings"), { recursive: true });

const assignmentHtml = (l, url) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${xml(l.title)}</title></head><body>
<h2>${xml(`Unit ${l.unit} Lesson ${l.lesson}: ${l.title}`)}</h2>
<p>Click the link below to do the lesson. When you finish, a code will pop up
(already copied). Come back here, <strong>paste the code in the box, and click
Submit</strong>.</p>
<p><a href="${xml(url)}" target="_blank" rel="noopener">▶ Start the lesson: ${xml(l.title)}</a></p>
<p style="color:#475569;font-size:14px;">Tip: enter your name exactly as it is in Canvas when the lesson asks.</p>
</body></html>`;

const settingsXml = (l, ident, pos) => `<?xml version="1.0" encoding="UTF-8"?>
<assignment identifier="${ident}" xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>${xml(`Unit ${l.unit} Lesson ${l.lesson}: ${l.title}`)}</title>
  <assignment_group_identifierref>${GROUP_ID}</assignment_group_identifierref>
  <points_possible>100.0</points_possible>
  <grading_type>points</grading_type>
  <submission_types>online_text_entry</submission_types>
  <position>${pos}</position>
  <workflow_state>unpublished</workflow_state>
</assignment>`;

const items = [];
const resources = [];
lessons.forEach((l, i) => {
  const ident = "neftasg_" + l.id.replace(/[^a-z0-9]+/gi, "_");
  const dir = ident;
  const htmlHref = `${dir}/${ident}.html`;
  const url = `${SITE}/lessons/${l.id}/`;
  mkdirSync(resolve(stage, dir), { recursive: true });
  writeFileSync(resolve(stage, dir, `${ident}.html`), assignmentHtml(l, url));
  writeFileSync(resolve(stage, dir, "assignment_settings.xml"), settingsXml(l, ident, i + 1));

  items.push(
    `        <item identifier="i_${ident}" identifierref="res_${ident}">\n` +
      `          <title>${xml(`Unit ${l.unit} Lesson ${l.lesson}: ${l.title}`)}</title>\n` +
      `        </item>`,
  );
  resources.push(
    `    <resource identifier="res_${ident}" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="${htmlHref}">\n` +
      `      <file href="${htmlHref}"/>\n` +
      `      <file href="${dir}/assignment_settings.xml"/>\n` +
      `    </resource>`,
  );
});

// course_settings: assignment group + Canvas-cartridge marker
writeFileSync(
  resolve(stage, "course_settings", "assignment_groups.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<assignmentGroups xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <assignmentGroup identifier="${GROUP_ID}">
    <title>Math Lessons</title>
    <position>1</position>
    <group_weight>0.0</group_weight>
  </assignmentGroup>
</assignmentGroups>`,
);
writeFileSync(
  resolve(stage, "course_settings", "canvas_export.txt"),
  "Q: What is the version of this Canvas export?\nA: This is a Canvas Common Cartridge export of Neft math lesson assignments.\n",
);

const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="neft-lessons-cartridge" xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
  </metadata>
  <organizations>
    <organization identifier="org_1" structure="rooted-hierarchy">
      <item identifier="LearningModules">
${items.join("\n")}
      </item>
    </organization>
  </organizations>
  <resources>
${resources.join("\n")}
    <resource identifier="res_course_settings" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="course_settings/canvas_export.txt">
      <file href="course_settings/assignment_groups.xml"/>
      <file href="course_settings/canvas_export.txt"/>
    </resource>
  </resources>
</manifest>`;
writeFileSync(resolve(stage, "imsmanifest.xml"), manifestXml);

const outName = unitFilter ? `neft-lessons-unit${unitFilter}.imscc` : "neft-lessons.imscc";
const outFile = resolve(repoRoot, "canvas-packages", outName);
rmSync(outFile, { force: true });
execSync(`cd "${stage}" && zip -r -q -X "${outFile}" . -x ".*"`);
rmSync(stage, { recursive: true, force: true });

console.log(`✓ Common Cartridge built: ${outFile}`);
console.log(
  `  ${lessons.length} assignment(s)${unitFilter ? ` (Unit ${unitFilter})` : ""}, all UNPUBLISHED.`,
);
console.log(`\nImport: Canvas → Course → Settings → Import Course Content →`);
console.log(`  "Common Cartridge 1.x Package" → upload this file → Import.`);
