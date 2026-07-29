#!/usr/bin/env node
/* Inject the Futures Study Buddy layer (assets/futures/futures-tutor.{css,js})
 * into lesson index.html pages, idempotently, using begin/end markers that
 * match the repo's other injectors (save-resume, mobile-access, math-workbench).
 *
 * Usage:
 *   node tools/inject-futures-tutor.js            # flagship lessons (default)
 *   node tools/inject-futures-tutor.js --all      # every lessons/<x>/index.html
 *   node tools/inject-futures-tutor.js 1-1 2-1     # explicit lesson folders
 *
 * Safe: only adds two tags; never removes lesson content; skips pages that
 * already carry the markers. Re-run after regenerating lesson HTML.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LESSONS_DIR = join(__dirname, "..", "lessons");
const CSS_TAG =
  "  <!-- futures-injected:begin (Futures Study Buddy — tools/inject-futures-tutor.js) -->\n" +
  '  <link rel="stylesheet" href="/assets/futures-tutor.css">\n' +
  "  <!-- futures-injected:end -->\n";
const JS_TAG =
  "  <!-- futures-injected:begin (Futures Study Buddy — tools/inject-futures-tutor.js) -->\n" +
  '  <script src="/assets/futures-tutor.js" defer></script>\n' +
  "  <!-- futures-injected:end -->\n";

function targets(argv) {
  const args = argv.slice(2);
  if (args.includes("--all")) {
    return readdirSync(LESSONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }
  const explicit = args.filter((a) => !a.startsWith("--"));
  if (explicit.length) return explicit;
  // Default: flagship lessons only.
  return readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith("-flagship"))
    .map((d) => d.name);
}

function injectBefore(html, anchor, tag) {
  const idx = html.lastIndexOf(anchor);
  if (idx === -1) return html; // anchor missing — leave untouched
  return html.slice(0, idx) + tag + html.slice(idx);
}

let changed = 0;
let skipped = 0;
let missing = 0;

for (const name of targets(process.argv)) {
  const file = join(LESSONS_DIR, name, "index.html");
  if (!existsSync(file)) {
    missing++;
    continue;
  }
  let html = readFileSync(file, "utf8");
  if (html.includes("futures-injected:begin")) {
    skipped++;
    continue;
  }
  const before = html;
  html = injectBefore(html, "</head>", CSS_TAG);
  html = injectBefore(html, "</body>", JS_TAG);
  if (html !== before) {
    writeFileSync(file, html);
    changed++;
    console.log("injected:", relative(join(__dirname, ".."), file));
  } else {
    console.log("no anchor (skipped):", name);
  }
}

console.log(
  `\nFutures Study Buddy: ${changed} injected, ${skipped} already present, ${missing} missing index.html`,
);
