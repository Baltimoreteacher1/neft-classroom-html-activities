#!/usr/bin/env node
// Regenerate every lesson index.html shell with a consistent TPT-quality
// document head (fonts, save/resume hooks). Lesson content still loads from
// lesson.js + config.json via the Vite engine bundle.
//
// Usage: node scripts/generate-lesson-shells.mjs
//        node scripts/generate-lesson-shells.mjs 3-2 6-1   # specific lessons

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");

const FONT_LINK = `    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Hanken+Grotesk:ital,wght@0,400;0,500;0,700;1,400&display=swap"
      rel="stylesheet"
    />`;

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

function buildShell(lessonId, title) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Grade 6 Reveal Math interactive lesson activity — ${title.replace(/ — Neft Teacher$/, "")}" />
    <title>${title}</title>
${FONT_LINK}
${SAVE_RESUME_HEAD}
</head>
  <body>
    <div id="app"></div>
    <script>window.NT_ACTIVITY = false;</script>
    <script type="module" src="./lesson.js"></script>
    <script src="/assets/nt-page-enhance.js" defer></script>
${SAVE_RESUME_BODY}
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
    writeFileSync(out, html);
    updated++;
  }
  console.log(`Updated ${updated} lesson index.html shells in lessons/`);
}

main();
