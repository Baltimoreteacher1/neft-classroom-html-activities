#!/usr/bin/env node
/**
 * Inject the Projects VISUALS layer into every unit culminating-project
 * WIZARD page (math/unit-N/projects/version-{a,b}/index.html, + statistics):
 *
 *   • /shared/projects/projects-visuals.css
 *   • /shared/projects/projects-visuals.js
 *     (mounts interactive manip-*.js math tools into step panels, driven by
 *      the page's ./visuals.json — no visuals.json → silent no-op)
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

const VIZ_HEAD = [
  "    <!-- projects-visuals-injected:begin (interactive math tools — tools/inject-projects-visuals.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-visuals.css" />',
  "    <!-- projects-visuals-injected:end -->",
].join("\n");
const VIZ_BODY = [
  "  <!-- projects-visuals-injected:begin (interactive math tools — tools/inject-projects-visuals.mjs) -->",
  '  <script src="/shared/projects/projects-visuals.js" defer></script>',
  "  <!-- projects-visuals-injected:end -->",
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
  if (before.includes("projects-visuals.css")) return false; // already injected
  let after = spliceBefore(before, "</head>", VIZ_HEAD);
  if (after === null) {
    console.error(`  ✗ no </head> in ${rel} — skipped`);
    return false;
  }
  after = spliceBefore(after, "</body>", VIZ_BODY);
  if (after === null) {
    console.error(`  ✗ no </body> in ${rel} — skipped`);
    return false;
  }
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

/* Runs as part of `npm run build` (before vite) so regenerated project pages
   are re-injected automatically on every deploy. Non-fatal by design: a
   build-time step must never block the whole site deploy. */
try {
  let changed = 0;
  let targets = 0;
  console.log(`Projects VISUALS injection${DRY ? " (dry-run)" : ""}:`);
  for (const u of UNITS) {
    for (const v of versionsOf(u)) {
      targets++;
      if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
    }
  }
  console.log(`${targets} project page(s) enumerated.`);
  console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-visuals: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
