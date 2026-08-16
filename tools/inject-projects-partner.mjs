#!/usr/bin/env node
/**
 * Inject the Projects PARTNER GUIDE into every unit culminating-project
 * WIZARD page (math/<unit>/projects/version-<x>/index.html, incl. statistics
 * and unit-8/version-c):
 *
 *   • /shared/projects/projects-partner.css
 *   • /shared/projects/projects-partner.js
 *
 * The layer gives each step an explicit partner script (named roles that
 * alternate per step, concrete moves, sentence starters) for Level 0 and
 * Level 1 only. At Level 2 it builds nothing.
 *
 * Idempotent: begin/end sentinels + per-file guard; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match (that historically corrupted pages whose inline scripts contain
 * markup-like strings). Run with --dry-run to preview, --only=unit-N to scope.
 *
 * Versions are enumerated by GLOB (`/^version-[a-z]$/`) so unit-8/version-c is
 * never skipped the way a hardcoded ["version-a","version-b"] list skips it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_UNITS } from "./lib/project-units.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const HEAD = [
  "    <!-- projects-partner-injected:begin (Level 0/1 partner guide — tools/inject-projects-partner.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-partner.css" />',
  "    <!-- projects-partner-injected:end -->",
].join("\n");
const BODY = [
  "  <!-- projects-partner-injected:begin (Level 0/1 partner guide — tools/inject-projects-partner.mjs) -->",
  '  <script src="/shared/projects/projects-partner.js" defer></script>',
  "  <!-- projects-partner-injected:end -->",
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
  if (before.includes("projects-partner.css")) return false; // already injected
  // Only wizard pages carry the shared project chrome.
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
const UNITS = PROJECT_UNITS.filter((u) => !ONLY || u === ONLY);

try {
  let changed = 0;
  console.log(`Projects partner-guide injection${DRY ? " (dry-run)" : ""}:`);
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
  console.error(`inject-projects-partner: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
