#!/usr/bin/env node
// Export each lesson's Notes Packet (notes.html) as a single self-contained,
// downloadable HTML file you can upload to ChatGPT or Claude as source material
// when generating lesson plans.
//
// notes.html is already self-contained (inline CSS + JS) EXCEPT for vocab images
// referenced by absolute path (/assets/vocab-images/*.svg). This script inlines
// those SVGs as data URIs so each file works standalone with no server or assets.
//
// Output (dist/lesson-html/):
//   <unit>-<lesson>-<slug>.html   one portable file per lesson (download these)
//   index.html                    browsable list with download links to each
//
// Duplicate unit/lesson pairs (e.g. 1-1 and 1-1-flagship) are deduped, preferring
// the flagship variant.
//
// Usage: node scripts/export-lesson-html.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");
const ASSETS_DIR = join(ROOT, "assets");
const OUT_DIR = join(ROOT, "dist", "lesson-html");

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Inline /assets/... references (currently only vocab-image SVGs) as data URIs.
const svgCache = new Map();
function dataUriFor(absPath) {
  if (svgCache.has(absPath)) return svgCache.get(absPath);
  let uri = null;
  if (existsSync(absPath)) {
    const b64 = readFileSync(absPath).toString("base64");
    uri = `data:image/svg+xml;base64,${b64}`;
  }
  svgCache.set(absPath, uri);
  return uri;
}

function extractStyles(html) {
  return (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join("\n");
}

function extractBodyContent(html) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = m ? m[1] : html;
  // Drop scripts — the combined file is for reading/upload, not interaction.
  return body.replace(/<script[\s\S]*?<\/script>/gi, "");
}

function inlineAssets(html) {
  let missing = 0;
  const out = html.replace(/(src|href)="\/assets\/([^"]+)"/g, (m, attr, rel) => {
    const abs = join(ASSETS_DIR, rel);
    const uri = dataUriFor(abs);
    if (!uri) {
      missing++;
      return m;
    }
    return `${attr}="${uri}"`;
  });
  return { html: out, missing };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const dirs = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // Collect lessons, dedupe by unit-lesson preferring the flagship variant.
  const byKey = new Map();
  for (const name of dirs) {
    const notesPath = join(LESSONS_DIR, name, "notes.html");
    const cfgPath = join(LESSONS_DIR, name, "config.json");
    if (!existsSync(notesPath) || !existsSync(cfgPath)) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
    } catch {
      continue;
    }
    if (cfg.unit == null || cfg.lesson == null) continue;
    const key = `${cfg.unit}-${cfg.lesson}`;
    const isFlagship = name.endsWith("-flagship");
    const existing = byKey.get(key);
    if (!existing || (isFlagship && !existing.isFlagship)) {
      byKey.set(key, { name, notesPath, cfg, isFlagship });
    }
  }

  const lessons = [...byKey.values()].sort(
    (a, b) => a.cfg.unit - b.cfg.unit || a.cfg.lesson - b.cfg.lesson
  );

  let totalMissing = 0;
  const entries = [];
  for (const { notesPath, cfg } of lessons) {
    const raw = readFileSync(notesPath, "utf8");
    const { html, missing } = inlineAssets(raw);
    totalMissing += missing;
    const file = `${cfg.unit}-${cfg.lesson}-${slug(cfg.title)}.html`;
    writeFileSync(join(OUT_DIR, file), html);
    entries.push({ file, html, unit: cfg.unit, lesson: cfg.lesson, title: cfg.title, standard: cfg.standard });
  }

  // Index page with download links.
  const rows = entries
    .map(
      (e) =>
        `      <li><a href="./${e.file}" download>Unit ${e.unit}.${e.lesson} — ${esc(e.title)}</a>` +
        `${e.standard ? ` <span class="std">${esc(e.standard)}</span>` : ""}</li>`
    )
    .join("\n");
  const index = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Neft Teacher — Downloadable Lesson HTML</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:820px;margin:2rem auto;padding:0 1rem;color:#1a2233}
  h1{font-size:1.5rem} p{color:#445}
  ol{line-height:1.9;padding-left:1.4rem}
  a{color:#1d4ed8;text-decoration:none} a:hover{text-decoration:underline}
  .std{color:#64748b;font-size:.85em}
</style></head>
<body>
  <h1>Downloadable Lesson HTML (${entries.length} lessons)</h1>
  <p>Each link is a single self-contained HTML file (images inlined, no server needed).
  Download one and upload it to ChatGPT or Claude as source material when generating a lesson plan.</p>
  <ol>
${rows}
  </ol>
</body></html>
`;
  writeFileSync(join(OUT_DIR, "index.html"), index);

  // Combined single-file build: shared styles once, every lesson body concatenated.
  const sharedStyles = entries.length ? extractStyles(entries[0].html) : "";
  const toc = entries
    .map((e) => `      <li><a href="#lesson-${e.unit}-${e.lesson}">Unit ${e.unit}.${e.lesson} — ${esc(e.title)}</a></li>`)
    .join("\n");
  const sections = entries
    .map(
      (e) =>
        `<article id="lesson-${e.unit}-${e.lesson}" class="lesson-section">\n` +
        extractBodyContent(e.html) +
        `\n</article>`
    )
    .join("\n<hr class=\"lesson-divider\" />\n");
  const combined = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Neft Teacher — All Grade 6 Math Lessons</title>
${sharedStyles}
<style>
  .lesson-section{max-width:900px;margin:0 auto 2rem;padding-top:1rem}
  .lesson-divider{border:0;border-top:2px solid #cbd5e1;margin:2.5rem auto;max-width:900px}
  @media print{.lesson-section{page-break-after:always}}
  .lp-toc{max-width:900px;margin:1.5rem auto;font-family:system-ui,sans-serif}
  .lp-toc a{color:#1d4ed8;text-decoration:none}
</style>
</head>
<body>
<nav class="lp-toc"><h1>All Grade 6 Math Lessons (${entries.length})</h1>
<ol>
${toc}
</ol></nav>
<hr class="lesson-divider" />
${sections}
</body></html>
`;
  writeFileSync(join(OUT_DIR, "neft-lessons-combined.html"), combined);

  console.log(`✓ ${entries.length} self-contained lesson HTML files → ${OUT_DIR}`);
  console.log(`  index.html lists all with download links`);
  console.log(`  neft-lessons-combined.html — all lessons in one uploadable file`);
  if (totalMissing) console.log(`  ! ${totalMissing} asset reference(s) could not be inlined`);
}

main();
