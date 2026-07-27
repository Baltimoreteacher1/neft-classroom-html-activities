#!/usr/bin/env node
/**
 * Add the Projects DECLUTTER layer (Level-2 challenges become opt-in
 * "⭐ Optional Challenge" expanders) to every culminating-project wizard page.
 * Additive + idempotent (sentinel + body-class guard). Purely presentational —
 * no ids move — so Save/Resume, grading, and the report are untouched.
 * Edits source in place; Cloudflare rebuilds dist on push.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// NOTE: this module declares a local `function process(rel)`, which hoists and
// shadows Node's global `process`. Read argv off globalThis explicitly.
const DRY = globalThis.process.argv.includes("--dry-run");

const UNITS = Array.from({ length: 10 }, (_, i) => i + 1);
const DIRS = [...UNITS.map((u) => `math/unit-${u}/projects`), "math/statistics/projects"];

const SENT = "projects-declutter";
const HEAD = [
  `<!-- ${SENT}-injected:begin (tools/inject-projects-declutter.mjs) -->`,
  '<link rel="stylesheet" href="/shared/projects/projects-declutter.css" />',
  `<!-- ${SENT}-injected:end -->`,
];
const BODY = [
  `<!-- ${SENT}-injected:begin (tools/inject-projects-declutter.mjs) -->`,
  '<script src="/shared/projects/projects-declutter.js" defer></script>',
  `<!-- ${SENT}-injected:end -->`,
];

function addHead(html) {
  if (html.includes("projects-declutter.css")) return html;
  const b = HEAD.map((l) => "    " + l).join("\n");
  return html.replace(/([ \t]*)<\/head>/i, `${b}\n$1</head>`);
}
function addBody(html) {
  if (html.includes("projects-declutter.js")) return html;
  const b = BODY.map((l) => "  " + l).join("\n");
  return html.replace(/([ \t]*)<\/body>/i, `${b}\n$1</body>`);
}
function addClass(html) {
  if (/<body[^>]*\bdeclutter-projects\b/.test(html)) return html;
  if (/<body class="[^"]*"/.test(html))
    return html.replace(/<body class="([^"]*)"/, '<body class="$1 declutter-projects"');
  return html.replace(/<body(\s|>)/, '<body class="declutter-projects"$1');
}

let changed = 0;
const touched = [];
function process(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes("pro-projects")) return;
  if (!before.includes("lvl2-block")) return; // nothing to declutter
  let after = addHead(before);
  after = addClass(after);
  after = addBody(after);
  if (after !== before) {
    if (!DRY) fs.writeFileSync(file, after);
    changed++;
    touched.push(rel);
  }
}

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
  `Projects declutter injection${DRY ? " (dry-run)" : ""}: ${targets} page(s) enumerated, ${changed} ${DRY ? "would be updated" : "updated"}.`,
);
touched.forEach((t) => console.log("  +", t));
