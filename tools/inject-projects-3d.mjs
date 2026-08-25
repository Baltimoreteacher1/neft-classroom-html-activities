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
import { PROJECT_UNITS } from "./lib/project-units.mjs";

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
  // Self-scoping: only inject pages that actually ship a build3d.json sibling,
  // so the 3D loader is never added to project pages that don't use it.
  if (!fs.existsSync(path.join(path.dirname(file), "build3d.json"))) return false;
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
   are re-injected automatically on every deploy. Non-fatal by design. */
try {
  let changed = 0;
  let targets = 0;
  console.log(`Projects 3D injection${DRY ? " (dry-run)" : ""}:`);
  for (const u of UNITS) {
    for (const v of versionsOf(u)) {
      targets++;
      if (inject(`math/${u}/projects/${v}/index.html`)) changed++;
    }
  }
  console.log(`${targets} project page(s) enumerated.`);
  console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-3d: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
