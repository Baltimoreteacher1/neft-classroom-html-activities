#!/usr/bin/env node
/**
 * Inject the Projects ANSWER-KEY LINK layer into every unit culminating-project
 * WIZARD page (math/<unit>/projects/version-<x>/index.html, incl. statistics
 * and unit-8/version-c):
 *
 *   • /shared/projects/projects-answerkey-link.css
 *   • /shared/projects/projects-answerkey-link.js
 *
 * Audit item 3: the per-unit answer keys at math/<unit>/projects/answer-key/
 * existed but were linked from nothing — no project page and no hub — so
 * teachers had no path to them. The layer adds ONE teacher-only link from each
 * project page to its OWN unit's key, derived from location.pathname. The
 * teacher gate lives in the JS (localStorage nt-teacher-mode / sessionStorage
 * nt-answer-console-ok, identical to projects-gold.js) and returns before any
 * node is created, so for a student the link is absent from the DOM entirely.
 *
 * Idempotent: begin/end sentinels + per-file guard on the css filename; safe to
 * re-run. Splices at the LAST </head> and </body> (lastIndexOf) — never
 * regex/first match (that historically corrupted pages whose inline scripts
 * contain markup-like strings). Run with --dry-run to preview, --only=unit-N to
 * scope.
 *
 * Versions are enumerated by GLOB (`/^version-[a-z]$/`) so unit-8/version-c is
 * never skipped the way a hardcoded ["version-a","version-b"] list skips it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const HEAD = [
  "    <!-- projects-answerkey-link-injected:begin (teacher-only answer-key link — tools/inject-projects-answerkey-link.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-answerkey-link.css" />',
  "    <!-- projects-answerkey-link-injected:end -->",
].join("\n");
const BODY = [
  "  <!-- projects-answerkey-link-injected:begin (teacher-only answer-key link — tools/inject-projects-answerkey-link.mjs) -->",
  '  <script src="/shared/projects/projects-answerkey-link.js" defer></script>',
  "  <!-- projects-answerkey-link-injected:end -->",
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
  if (before.includes("projects-answerkey-link.css")) return false; // already injected
  // The layer is gated on <body class="pro-projects">; never inject elsewhere.
  if (!before.includes("pro-projects")) {
    console.warn(`  ! not a pro-projects page, skipped: ${rel}`);
    return false;
  }
  let after = spliceBefore(before, "</head>", HEAD);
  if (after === null) {
    console.error(`  ✗ no </head> in ${rel} — skipped`);
    return false;
  }
  after = spliceBefore(after, "</body>", BODY);
  if (after === null) {
    console.error(`  ✗ no </body> in ${rel} — skipped`);
    return false;
  }
  if (!DRY) fs.writeFileSync(file, after);
  console.log(`  + ${rel}`);
  return true;
}

const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";
const UNITS = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"].filter(
  (u) => !ONLY || u === ONLY,
);

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

/* Runs as part of `npm run build` (before vite) so regenerated project pages
   are re-injected automatically on every deploy. Non-fatal by design. */
try {
  let changed = 0;
  let targets = 0;
  console.log(`Projects answer-key-link injection${DRY ? " (dry-run)" : ""}:`);
  for (const u of UNITS) {
    for (const v of versionsOf(u)) {
      targets++;
      if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
    }
  }
  console.log(`${targets} project page(s) enumerated.`);
  console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-answerkey-link: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
