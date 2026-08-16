#!/usr/bin/env node
/**
 * Inject the Projects ZOOM layer into every unit culminating-project WIZARD
 * page (math/<unit>/projects/version-<x>/index.html, all units + statistics):
 *
 *   • /shared/projects/projects-zoom.css
 *   • /shared/projects/projects-zoom.js
 *     (tags each static .visual-svg diagram `.nz-zoomable`, wraps it in a
 *      <figure class="nz-fig"> with a "Tap to enlarge" hint, and opens a
 *      keyboard-accessible fullscreen lightbox — a page with no .visual-svg
 *      is a silent no-op)
 *
 * WHY THIS EXISTS: the zoom layer was originally hand-wired into 21 of the 23
 * project pages (its tags live inside the projects-visuals sentinel block on
 * those pages) and had no injector, so unit-6/version-a and unit-7/version-a
 * silently missed it and nothing could detect the drift. This injector makes
 * the layer reproducible; the per-file guard below sees the hand-wired tags on
 * the other 21 pages and leaves them exactly as they are.
 *
 * Idempotent: begin/end sentinels + per-file guard; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match, which historically corrupted pages whose inline scripts contain
 * markup-like strings. Run with --dry-run to preview, --only=unit-N to scope.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECT_UNITS } from "./lib/project-units.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const ZOOM_HEAD = [
  "    <!-- projects-zoom-injected:begin (diagram zoom — tools/inject-projects-zoom.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-zoom.css" />',
  "    <!-- projects-zoom-injected:end -->",
].join("\n");
const ZOOM_BODY = [
  "  <!-- projects-zoom-injected:begin (diagram zoom — tools/inject-projects-zoom.mjs) -->",
  '  <script src="/shared/projects/projects-zoom.js" defer></script>',
  "  <!-- projects-zoom-injected:end -->",
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
  // Guard on the asset path, not the sentinel: the 21 hand-wired pages carry
  // the same <link>/<script> under the projects-visuals sentinel and must not
  // be double-injected.
  if (before.includes("projects-zoom.css")) return false;
  let after = spliceBefore(before, "</head>", ZOOM_HEAD);
  if (after === null) {
    console.error(`  ✗ no </head> in ${rel} — skipped`);
    return false;
  }
  after = spliceBefore(after, "</body>", ZOOM_BODY);
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
   are re-injected automatically on every deploy. Non-fatal by design: a
   build-time step must never block the whole site deploy. */
try {
  let changed = 0;
  let targets = 0;
  console.log(`Projects ZOOM injection${DRY ? " (dry-run)" : ""}:`);
  for (const u of UNITS) {
    for (const v of versionsOf(u)) {
      targets++;
      if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
    }
  }
  console.log(`${targets} project page(s) enumerated.`);
  console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-zoom: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
