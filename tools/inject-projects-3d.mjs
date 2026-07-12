#!/usr/bin/env node
/**
 * Inject the Projects 3D layer into every unit culminating-project WIZARD page
 * (math/unit-N/projects/version-{a,b}/index.html, + statistics):
 *
 *   • /shared/projects/projects-3d.css
 *   • /shared/projects/projects-3d.js   (core loader; reads ./build3d.json —
 *     no build3d.json on a page → silent no-op)
 *
 * The core lazy-loads three.js + the matching build3d-<kind>.js builder only
 * when a build card scrolls into view, so pages without a build3d.json pay
 * nothing beyond one tiny guarded script.
 *
 * Idempotent: begin/end sentinels + per-file guard; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match (that historically corrupted pages whose inline scripts contain
 * markup-like strings). Run with --dry-run to preview.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const HEAD = [
  "    <!-- projects-3d-injected:begin (build-in-3D + WebXR AR — tools/inject-projects-3d.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-3d.css" />',
  "    <!-- projects-3d-injected:end -->",
].join("\n");
const BODY = [
  "  <!-- projects-3d-injected:begin (build-in-3D + WebXR AR — tools/inject-projects-3d.mjs) -->",
  '  <script src="/shared/projects/projects-3d.js" defer></script>',
  "  <!-- projects-3d-injected:end -->",
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
  if (before.includes("projects-3d.css")) return false; // already injected
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
  (u) => !ONLY || u === ONLY
);

/* Runs as part of `npm run build` (before vite) so regenerated project pages
   are re-injected automatically on every deploy. Non-fatal by design. */
try {
  let changed = 0;
  console.log(`Projects 3D injection${DRY ? " (dry-run)" : ""}:`);
  for (const u of UNITS) {
    for (const v of ["version-a", "version-b"]) {
      if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
    }
  }
  console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-3d: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
