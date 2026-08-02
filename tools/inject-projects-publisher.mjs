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

/* Storefront hubs get student directions before their project choices. Each
   project owns its evidence and success criteria; we never promise false
   interchangeability between contexts or extensions. */
const HUB_STRIP = [
  "      <!-- pub-hub-injected:begin (publisher storefront strip — tools/inject-projects-publisher.mjs) -->",
  '      <section aria-labelledby="pickpath-heading">',
  '        <div class="section-heading">',
  '          <p class="eyebrow">Students Start Here</p>',
  '          <h2 id="pickpath-heading">Pick Your Path</h2>',
  "        </div>",
  '        <div class="note-panel">',
  "          <p>",
  "            <strong>Choose the project your teacher assigned—or the context that fits you.</strong>",
  "            Each path has its own aligned success criteria, math evidence, and final product.",
  "          </p>",
  "          <p>",
  "            <strong>Take your time.</strong> Plan for two to three class",
  "            periods. Your work saves automatically, so you can stop and come",
  "            back.",
  "          </p>",
  "          <p>",
  "            <strong>Stuck on writing?</strong> Every response box has a",
  "            &ldquo;Need a starter?&rdquo; helper, and the last step includes a",
  "            Rate My Work check before you turn it in.",
  "          </p>",
  "        </div>",
  "      </section>",
  "      <!-- pub-hub-injected:end -->",
].join("\n");
const HUB_ANCHOR = '<section aria-labelledby="versions-heading">';

function injectHub(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn(`  ! missing: ${rel}`);
    return false;
  }
  const before = fs.readFileSync(file, "utf8");
  if (before.includes("pub-hub-injected:begin")) return false; // already injected
  const idx = before.lastIndexOf(HUB_ANCHOR);
  if (idx === -1) {
    console.error(`  ✗ no versions-heading section in ${rel} — skipped`);
    return false;
  }
  const after = `${before.slice(0, idx)}${HUB_STRIP}\n\n      ${before.slice(idx)}`;
  if (!DRY) fs.writeFileSync(file, after);
  console.log(`  + ${rel}`);
  return true;
}

const UNITS = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"];

/* Enumerate version folders from disk (version-a, version-b, version-c, …).
   A hardcoded ["version-a","version-b"] list is why unit-8/version-c was
   invisible to nearly every projects-* layer — never reintroduce one. */
function versionsOf(unit) {
  try {
    return fs
      .readdirSync(path.join(ROOT, "math", unit, "projects"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^version-[a-z]$/.test(d.name))
      .map((d) => d.name)
      .sort();
  } catch (_e) {
    return [];
  }
}

let changed = 0;
let targets = 0;
console.log(`Projects PUBLISHER injection${DRY ? " (dry-run)" : ""}:`);
for (const u of UNITS) {
  for (const v of versionsOf(u)) {
    targets++;
    if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
  }
}
console.log(`${targets} project page(s) enumerated.`);
console.log(`Storefront strip injection${DRY ? " (dry-run)" : ""}:`);
for (const u of UNITS) {
  if (injectHub(`math/${u}/projects/index.html`)) changed++;
}
console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
