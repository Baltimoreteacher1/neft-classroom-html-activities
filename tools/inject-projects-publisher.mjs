#!/usr/bin/env node
/**
 * Inject the Projects PUBLISHER pedagogy layer into every unit
 * culminating-project WIZARD page
 * (math/unit-N/projects/version-{a,b}/index.html, + statistics):
 *
 *   • /shared/projects/projects-publisher.css
 *   • /shared/projects/projects-publisher.js
 *     (sentence-starter chips, exemplar panel from ./publisher.json,
 *      Rate My Work rubric self-assessment folded into buildReport)
 *
 * Idempotent: begin/end sentinels + per-file guards; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match, which historically corrupted pages whose inline scripts contain
 * markup-like strings. Run with --dry-run to preview.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const PUB_HEAD = [
  "    <!-- projects-publisher-injected:begin (publisher pedagogy layer — tools/inject-projects-publisher.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-publisher.css" />',
  "    <!-- projects-publisher-injected:end -->",
].join("\n");
const PUB_BODY = [
  "  <!-- projects-publisher-injected:begin (publisher pedagogy layer — tools/inject-projects-publisher.mjs) -->",
  '  <script src="/shared/projects/projects-publisher.js" defer></script>',
  "  <!-- projects-publisher-injected:end -->",
].join("\n");

function spliceBefore(html, closer, block) {
  const idx = html.lastIndexOf(closer);
  if (idx === -1) return null;
  return html.slice(0, idx) + block + "\n" + html.slice(idx);
}

function inject(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn(`  ! missing: ${rel}`);
    return false;
  }
  const before = fs.readFileSync(file, "utf8");
  if (before.includes("projects-publisher.css")) return false; // already injected
  let after = spliceBefore(before, "</head>", PUB_HEAD);
  if (after === null) {
    console.error(`  ✗ no </head> in ${rel} — skipped`);
    return false;
  }
  after = spliceBefore(after, "</body>", PUB_BODY);
  if (after === null) {
    console.error(`  ✗ no </body> in ${rel} — skipped`);
    return false;
  }
  if (!DRY) fs.writeFileSync(file, after);
  console.log(`  + ${rel}`);
  return true;
}

const UNITS = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"];

let changed = 0;
console.log(`Projects PUBLISHER injection${DRY ? " (dry-run)" : ""}:`);
for (const u of UNITS) {
  for (const v of ["version-a", "version-b"]) {
    if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
  }
}
console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
