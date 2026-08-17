#!/usr/bin/env node
/**
 * Inject the Projects COMPLETE layer into every unit culminating-project
 * WIZARD page (math/<unit>/projects/version-<x>/index.html):
 *
 *   • /shared/projects/projects-complete.css
 *   • /shared/projects/projects-complete.js
 *
 * The layer adds the portfolio completion record (localStorage
 * "nt-project-complete:v1"), interactive rubric self-scoring, the exit
 * reflection block, and the optional "Send to my teacher" submission. It gates
 * itself on <body class="pro-projects">, so a page without that class is a
 * silent no-op even if the tags are present.
 *
 * Enumerates units AND versions by GLOB — never a hardcoded
 * ["version-a","version-b"] list, which is exactly why math/unit-8/version-c
 * was historically skipped by the older injectors.
 *
 * Idempotent: begin/end sentinels + per-file guard; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match (that historically corrupted pages whose inline scripts contain
 * markup-like strings).
 *
 * Flags: --dry-run (preview only), --only=unit-4 (single unit).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";

const HEAD = [
  "    <!-- projects-complete-injected:begin (completion record + rubric self-scoring + reflection + submit — tools/inject-projects-complete.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-complete.css" />',
  "    <!-- projects-complete-injected:end -->",
].join("\n");

const BODY = [
  "  <!-- projects-complete-injected:begin (completion record + rubric self-scoring + reflection + submit — tools/inject-projects-complete.mjs) -->",
  '  <script src="/shared/projects/projects-complete.js" defer></script>',
  "  <!-- projects-complete-injected:end -->",
].join("\n");

function spliceBefore(html, closer, block) {
  const idx = html.lastIndexOf(closer);
  if (idx === -1) return null;
  return html.slice(0, idx) + block + "\n" + html.slice(idx);
}

/** Every math/<unit>/projects/version-<x>/index.html on disk. */
function discoverPages() {
  const out = [];
  const mathDir = path.join(ROOT, "math");
  if (!fs.existsSync(mathDir)) return out;
  const units = fs
    .readdirSync(mathDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((u) => !ONLY || u === ONLY)
    .sort();
  for (const unit of units) {
    const projectsDir = path.join(mathDir, unit, "projects");
    if (!fs.existsSync(projectsDir)) continue;
    const versions = fs
      .readdirSync(projectsDir, { withFileTypes: true })
      // Every project page, derived from disk. The old /^version-[a-z]$/ never
      // matched math/unit-10/projects/world-architect, so that page sat outside
      // the completion layer entirely and a student finishing it recorded
      // nothing. answer-key is excluded because it is teacher-only.
      .filter((d) => d.isDirectory() && d.name !== "answer-key")
      .map((d) => d.name)
      .sort();
    for (const v of versions) {
      const rel = `math/${unit}/projects/${v}/index.html`;
      if (fs.existsSync(path.join(ROOT, rel))) out.push(rel);
    }
  }
  return out;
}

function inject(rel) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, "utf8");
  if (before.includes("projects-complete.css")) return false; // already injected
  // Self-scoping: the layer only runs under body.pro-projects, so don't add
  // tags to any project page that isn't one of the pro wizards.
  // The layer self-gates on body.pro-projects OR the project path, so a page
  // without the class is still a valid target. It used to be skipped here,
  // which is the other half of why world-architect had no completion path.
  if (!/<body[^>]*\bpro-projects\b/.test(before)) {
    console.warn(`  · no .pro-projects body (layer self-gates on path): ${rel}`);
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

/* Runs as part of `npm run build` (before vite) so regenerated project pages
   are re-injected automatically on every deploy. Non-fatal by design. */
try {
  const pages = discoverPages();
  console.log(
    `Projects COMPLETE injection${DRY ? " (dry-run)" : ""}: ${pages.length} page(s) found`,
  );
  let changed = 0;
  for (const rel of pages) {
    if (inject(rel)) changed++;
  }
  console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-complete: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
