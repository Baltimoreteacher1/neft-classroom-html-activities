#!/usr/bin/env node
/**
 * Inject the Projects DISCOURSE layer into every unit culminating-project
 * WIZARD page (math/<unit>/projects/version-<x>/index.html, incl. statistics
 * and unit-8/version-c):
 *
 *   • /shared/projects/projects-discourse.css
 *   • /shared/projects/projects-discourse.js
 *
 * Adds (C2) one collapsed Turn & Talk prompt per working step, matching the
 * lesson engine's discourse pedagogy, and (C3) a structured partner-compare
 * block — sentence frames + named capture fields + a compare-and-justify
 * prompt — on the page's "interview a classmate" step. Both read
 * /shared/projects/projects-check-config.json; Turn & Talk falls back to
 * generated prompts when a page has no authored entry.
 *
 * Idempotent: begin/end sentinels + per-file guard; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match. Run with --dry-run to preview, --only=unit-N to scope.
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
  "    <!-- projects-discourse-injected:begin (Turn & Talk + structured peer compare — tools/inject-projects-discourse.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-discourse.css" />',
  "    <!-- projects-discourse-injected:end -->",
].join("\n");
const BODY = [
  "  <!-- projects-discourse-injected:begin (Turn & Talk + structured peer compare — tools/inject-projects-discourse.mjs) -->",
  '  <script src="/shared/projects/projects-discourse.js" defer></script>',
  "  <!-- projects-discourse-injected:end -->",
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
  if (before.includes("projects-discourse.css")) return false; // already injected
  if (!before.includes("pro-projects")) return false;
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

/* Runs as part of `npm run build` (before vite) so regenerated project pages
   are re-injected automatically on every deploy. Non-fatal by design. */
try {
  let changed = 0;
  console.log(`Projects discourse injection${DRY ? " (dry-run)" : ""}:`);
  for (const u of UNITS) {
    const dir = path.join(ROOT, "math", u, "projects");
    if (!fs.existsSync(dir)) continue;
    const versions = fs
      .readdirSync(dir)
      .filter((d) => /^version-[a-z]$/.test(d))
      .sort();
    for (const v of versions) {
      if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
    }
  }
  console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-discourse: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
