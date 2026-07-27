#!/usr/bin/env node
/**
 * Inject the Projects PRO premium layer into every unit culminating-project
 * WIZARD page (math/unit-N/projects/version-{a,b}/index.html).
 *
 * These pages are self-contained (inline <style> + <script>, no shared project
 * CSS). This layer adds — additively, scoped under `body.pro-projects` so it
 * cannot affect the `.pk-hub` storefront pages:
 *   • Plus Jakarta Sans display font (premium headings)
 *   • /shared/projects/projects-pro.css  (premium visual elevation)
 *   • /shared/projects/projects-pro.js   (reading bar, keyboard nav, reveal,
 *                                          back-to-top, premium ribbon)
 *   • `pro-projects` class on <body>
 *
 * Idempotent: safe to re-run (begin/end markers + class guard). Edits source
 * files in place — Cloudflare rebuilds dist/ from source on push to main.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// NOTE: this module declares a local `function process(rel)`, which hoists and
// shadows Node's global `process`. Read argv off globalThis explicitly.
const DRY = globalThis.process.argv.includes("--dry-run");

const HEAD_BLOCK = [
  "<!-- projects-pro-injected:begin (premium layer — tools/inject-projects-pro.mjs) -->",
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />',
  '<link rel="stylesheet" href="/shared/projects/projects-pro.css" />',
  "<!-- projects-pro-injected:end -->",
];
const BODY_BLOCK = [
  "<!-- projects-pro-injected:begin (premium layer — tools/inject-projects-pro.mjs) -->",
  '<script src="/shared/projects/projects-pro.js" defer></script>',
  "<!-- projects-pro-injected:end -->",
];

const _MARK = "projects-pro-injected:begin";

const UNITS = Array.from({ length: 10 }, (_, i) => i + 1);

function addHead(html) {
  if (html.includes("projects-pro.css")) return html;
  const indented = HEAD_BLOCK.map((l) => "    " + l).join("\n");
  return html.replace(/([ \t]*)<\/head>/i, `${indented}\n$1</head>`);
}

function addBody(html) {
  if (html.includes("projects-pro.js")) return html;
  const indented = BODY_BLOCK.map((l) => "  " + l).join("\n");
  return html.replace(/([ \t]*)<\/body>/i, `${indented}\n$1</body>`);
}

function addBodyClass(html) {
  if (/<body[^>]*\bpro-projects\b/.test(html)) return html;
  if (/<body class="[^"]*"/.test(html)) {
    return html.replace(/<body class="([^"]*)"/, '<body class="$1 pro-projects"');
  }
  return html.replace(/<body(\s|>)/, '<body class="pro-projects"$1');
}

let changed = 0;
const touched = [];

function process(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, "utf8");
  let after = addHead(before);
  after = addBodyClass(after);
  after = addBody(after);
  if (after !== before) {
    if (!DRY) fs.writeFileSync(file, after);
    changed++;
    touched.push(rel);
  }
}

const DIRS = [...UNITS.map((u) => `math/unit-${u}/projects`), "math/statistics/projects"];

/* Enumerate version folders from disk (version-a, version-b, version-c, …).
   A hardcoded ["version-a","version-b"] list is why unit-8/version-c was
   invisible to nearly every projects-* layer — never reintroduce one. */
function versionsOf(dir) {
  try {
    return fs
      .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^version-[a-z]$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (_e) {
    return [];
  }
}

let targets = 0;
for (const dir of DIRS) {
  for (const v of versionsOf(dir)) {
    targets++;
    process(`${dir}/${v}/index.html`);
  }
}

console.log(
  `Projects PRO injection${DRY ? " (dry-run)" : ""}: ${targets} page(s) enumerated, ${changed} ${DRY ? "would be updated" : "updated"}.`,
);
touched.forEach((t) => console.log("  +", t));
