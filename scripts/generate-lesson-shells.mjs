#!/usr/bin/env node
// Regenerate every lesson index.html shell with a consistent TPT-quality
// document head (fonts, save/resume hooks). Lesson content still loads from
// lesson.js + config.json via the Vite engine bundle.
//
// Usage: node scripts/generate-lesson-shells.mjs
//        node scripts/generate-lesson-shells.mjs 3-2 6-1   # specific lessons

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeGenerated } from "./lib/preserve-injected.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");

const FONT_LINK = `    <link rel="stylesheet" href="/assets/fonts/engine-body.css" />`;

const SAVE_RESUME_HEAD = `    <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
  <!-- nsr-injected:end -->`;

const SAVE_RESUME_BODY = `    <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js" defer></script>
  <!-- nsr-injected:end -->`;

function readTitle(lessonDir) {
  const cfgPath = join(lessonDir, "config.json");
  if (!existsSync(cfgPath)) return "Neft Teacher Activity";
  try {
    const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
    return cfg.title ? `${cfg.title} — Neft Teacher` : "Neft Teacher Activity";
  } catch {
    return "Neft Teacher Activity";
  }
}

// Which lesson's Learning-Supports adaptations this shell should load.
// Canonical lessons use their own id. Differentiated pathways (1-1-group1,
// 1-3-catchup) use their BASE lesson id, because learning-supports.js looks the
// id up in assets/learning-supports/manifest.json — which is keyed by canonical
// ids only — and silently skips every adaptation on a miss. A pathway teaches the
// same lesson's objective and vocabulary, so the base entry is the correct one.
// Pathways used to get no supports at all; see tools/inject-supports-pathways.js.
function supportsLessonId(lessonId) {
  if (/^\d+-\d+$/.test(lessonId)) return lessonId;
  const pathway = /^(\d+-\d+)-(?:group\d+|catchup)$/.exec(lessonId);
  return pathway ? pathway[1] : null;
}

function buildShell(lessonId, title) {
  const supportsId = supportsLessonId(lessonId);
  const htmlTag = supportsId
    ? `<html lang="en" data-ewl-supports-lesson="${supportsId}">`
    : `<html lang="en">`;
  const supportHead = supportsId
    ? `\n<!-- ewl-supports-injected:begin -->\n  <link rel="stylesheet" href="/assets/learning-supports/learning-supports.css" />\n<!-- ewl-supports-injected:end -->`
    : "";
  const supportBody = supportsId
    ? `\n<!-- ewl-supports-injected:begin -->\n  <script src="/assets/learning-supports/learning-supports.js" defer></script>\n<!-- ewl-supports-injected:end -->`
    : "";

  return `<!doctype html>
${htmlTag}
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Grade 6 Reveal Math interactive lesson activity — ${title.replace(/ — Neft Teacher$/, "")}" />
    <title>${title}</title>
${FONT_LINK}
${SAVE_RESUME_HEAD}${supportHead}
</head>
  <body>
    <div id="app"></div>
    <script>window.NT_ACTIVITY = false;</script>
    <script type="module" src="./lesson.js"></script>
    <script src="/assets/nt-page-enhance.js" defer></script>
    <script src="/assets/edupulse-config.js" defer></script>
    <script src="/assets/edupulse-bridge.js" defer></script>
${SAVE_RESUME_BODY}${supportBody}
</body>
</html>
`;
}

function main() {
  const only = process.argv.slice(2).filter(Boolean);
  const dirs = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((name) => !only.length || only.includes(name));

  let updated = 0;
  for (const name of dirs) {
    const lessonDir = join(LESSONS_DIR, name);
    const out = join(lessonDir, "index.html");
    if (!existsSync(join(lessonDir, "lesson.js"))) continue;
    const html = buildShell(name, readTitle(lessonDir));
    // writeGenerated, not writeFileSync — see tools/generators-preserve-injected.test.mjs.
    // These 223 lesson index.html shells are the LAUNCHER pages, and every one of
    // them carries injected sentinel blocks (Save/Resume, mobile-access, the
    // enterprise head, UIFR). A full-render overwrite deletes all of them.
    writeGenerated(out, html);
    updated++;
  }
  console.log(`Updated ${updated} lesson index.html shells in lessons/`);
}

main();
