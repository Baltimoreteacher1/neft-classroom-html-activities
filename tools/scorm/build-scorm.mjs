#!/usr/bin/env node
/**
 * build-scorm.mjs — package a Neft lesson as a SCORM 1.2 zip for Canvas upload.
 *
 * The zip plays the LIVE lesson inside Canvas and auto-reports the score to the
 * gradebook (no codes, no CSV). Because content stays on the live site, editing
 * a lesson does NOT require re-uploading the package.
 *
 * Usage:
 *   node tools/scorm/build-scorm.mjs <lessonId> ["Assignment Title"]
 *   npm run scorm -- 1-3 "Unit 1 Lesson 3: Ratios"
 *
 * Env: NEFT_SITE overrides the base site (default https://eduwonderlab.com).
 * Output: scorm-packages/neft-lesson-<lessonId>.zip
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { execSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const [target, titleArg] = process.argv.slice(2);

if (!target) {
  console.error(
    'Usage: node tools/scorm/build-scorm.mjs <lessonId | /path/ | url> ["Title"]\n' +
      "  Examples:\n" +
      '    node tools/scorm/build-scorm.mjs 1-3 "Unit 1 Lesson 3"   # a lesson\n' +
      "    node tools/scorm/build-scorm.mjs /ratio-color-mixer/      # any activity\n" +
      "    node tools/scorm/build-scorm.mjs https://eduwonderlab.com/fractions-soccer/",
  );
  process.exit(1);
}

const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");
const origin = new URL(SITE).origin;

// Accept three target forms:
//   - a bare lesson id ("1-3")        → /lessons/1-3/   (back-compat)
//   - a site-relative path ("/x/")    → SITE + /x/
//   - a full URL                      → used as-is
// A "lesson id" is the legacy shorthand: no slash and no scheme.
const isUrl = /^https?:\/\//i.test(target);
const isLessonId = !isUrl && !target.includes("/");
const lessonUrl = isUrl
  ? target
  : isLessonId
    ? `${SITE}/lessons/${target}/`
    : `${SITE}/${target.replace(/^\/+/, "")}`;
// Stable id/slug for filenames + the SCORM manifest identifier.
const lessonId = isLessonId
  ? target
  : new URL(lessonUrl).pathname.split("/").filter(Boolean).pop() || "activity";
const title = titleArg || (isLessonId ? `Lesson ${target}` : lessonId);

const tplDir = resolve(__dirname, "template");
const fill = (s) =>
  s
    .replaceAll("{{LESSON_ID}}", lessonId)
    .replaceAll("{{TITLE}}", title)
    .replaceAll("{{LESSON_URL}}", lessonUrl)
    .replaceAll("{{LESSON_ORIGIN}}", origin);

const outRoot = resolve(__dirname, "../../scorm-packages");
const stage = resolve(outRoot, `_stage-${lessonId}`);
mkdirSync(stage, { recursive: true });
// [templateFile, outputFile] — the SCO template is *.tpl so the site audit
// doesn't treat its {{LESSON_URL}} placeholder as a broken link.
for (const [src, dest] of [
  ["imsmanifest.xml", "imsmanifest.xml"],
  ["index.html.tpl", "index.html"],
]) {
  writeFileSync(resolve(stage, dest), fill(readFileSync(resolve(tplDir, src), "utf8")));
}

const zip = resolve(outRoot, `neft-lesson-${lessonId}.zip`);
rmSync(zip, { force: true });
execSync(`cd "${stage}" && zip -r -q "${zip}" .`);
rmSync(stage, { recursive: true, force: true });

console.log("✓ SCORM package built:");
console.log("  " + zip);
console.log("  Lesson: " + lessonUrl);
console.log(
  "\nUpload it in Canvas: Settings → Navigation/Apps → SCORM, or via the SCORM tool, then deploy as a graded assignment.",
);
