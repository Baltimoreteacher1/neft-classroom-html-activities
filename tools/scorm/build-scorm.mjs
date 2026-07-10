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
// --codes / --sheets (anywhere on the line) launches the activity in normal
// student mode so the save-code prompt shows and progress flows to the Google
// Sheets gradebook. Default mode keeps the Canvas auto-grade (SCORM) behavior.
const rawArgs = process.argv.slice(2);
const CODES_MODE = rawArgs.some((a) => a === "--codes" || a === "--sheets");
const [target, titleArg, idArg] = rawArgs.filter((a) => !a.startsWith("--"));
// ?lms=scorm relays the score to Canvas AND hides the save-code prompt. Codes
// mode drops it so students enter a save code → roster/grades land in the Sheets.
// Joined with "&" (not "?") when the target URL already carries a query string
// (e.g. practice-arcade/?unit=3) so we never emit a second "?".
const LAUNCH_PARAMS = CODES_MODE ? "embed=1" : "lms=scorm&embed=1";

if (!target) {
  console.error(
    'Usage: node tools/scorm/build-scorm.mjs <lessonId | /path/ | url> ["Title"] [--codes]\n' +
      "  Examples:\n" +
      '    node tools/scorm/build-scorm.mjs 1-3 "Unit 1 Lesson 3"   # Canvas auto-grade\n' +
      '    node tools/scorm/build-scorm.mjs 1-3 "Unit 1 Lesson 3" --codes  # → Google Sheets\n' +
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
// Stable id/slug for filenames + the SCORM manifest identifier. When no
// explicit id is given, fold the recognizable query params in so targets that
// share a path (practice-arcade/?unit=1 vs ?lesson=1-3) never collide —
// mirrors functions/_lib/scorm.js resolveTarget.
const defaultId = () => {
  const u = new URL(lessonUrl);
  let id = u.pathname.split("/").filter(Boolean).pop() || "activity";
  const qLesson = u.searchParams.get("lesson");
  const qUnit = u.searchParams.get("unit");
  if (qLesson) id += `-lesson-${qLesson}`;
  else if (qUnit) id += `-unit-${qUnit}`;
  return id;
};
const lessonId = (idArg && idArg.trim()) || (isLessonId ? target : defaultId());
const title = titleArg || (isLessonId ? `Lesson ${target}` : lessonId);
const LAUNCH_QUERY = (lessonUrl.includes("?") ? "&" : "?") + LAUNCH_PARAMS;

const tplDir = resolve(__dirname, "template");
const fill = (s) =>
  s
    .replaceAll("{{LESSON_ID}}", lessonId)
    .replaceAll("{{TITLE}}", title)
    .replaceAll("{{LESSON_URL}}", lessonUrl)
    .replaceAll("{{LAUNCH_QUERY}}", LAUNCH_QUERY)
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

const zip = resolve(outRoot, `neft-lesson-${lessonId}${CODES_MODE ? "-codes" : ""}.zip`);
rmSync(zip, { force: true });
execSync(`cd "${stage}" && zip -r -q "${zip}" .`);
rmSync(stage, { recursive: true, force: true });

console.log("✓ SCORM package built:");
console.log("  " + zip);
console.log("  Lesson: " + lessonUrl);
console.log(
  "  Mode:   " +
    (CODES_MODE ? "save codes → Google Sheets gradebook" : "Canvas auto-grade (SCORM score)"),
);
console.log(
  "\nUpload it in Canvas: Settings → Navigation/Apps → SCORM, or via the SCORM tool, then deploy as a graded assignment.",
);
