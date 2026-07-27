#!/usr/bin/env node
/**
 * Inject the Projects META layer into every unit culminating-project WIZARD
 * page (math/{unit-1..unit-10,statistics}/projects/version-*\/index.html):
 *
 *   • static <meta name="standard" ...> tags — one per MCCRS code the page
 *     teaches, in the exact key format of data/ccss-standards.json (which is
 *     what data/asset-concept-map.json's byStandard and scripts/lib/ccss.mjs
 *     both use), so file-scraping consumers (build-asset-concept-map.mjs,
 *     the pacing map, PLC data-prep) can join without executing the page.
 *   • /shared/projects/projects-meta.css
 *   • /shared/projects/projects-meta.js  (standards strip, Spanish parity
 *     gap-fill, Level-0 supports — all read from projects-meta-config.json)
 *
 * Pages absent from projects-meta-config.json are skipped, so this is safe to
 * run over regenerated or newly added project folders.
 *
 * Idempotent: begin/end sentinels + per-file guard; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match (that historically corrupted pages whose inline scripts contain
 * markup-like strings). Run with --dry-run to preview, --only=unit-N to scope.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";

const CONFIG_PATH = path.join(ROOT, "shared", "projects", "projects-meta-config.json");
const GUARD = "projects-meta.css";
const BEGIN =
  "projects-meta-injected:begin (standards + ES parity + Level 0 — tools/inject-projects-meta.mjs)";
const END = "projects-meta-injected:end";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function headBlock(id, entry) {
  const lines = [`    <!-- ${BEGIN} -->`, `    <meta name="nt-project-id" content="${esc(id)}" />`];
  const codes = (entry.standards || []).map((s) => s.code);
  for (const s of entry.standards || []) {
    const unit = entry.unit == null ? "" : ` · Unit ${entry.unit}`;
    const legacy = s.legacy ? ` data-standard-legacy="${esc(s.legacy)}"` : "";
    lines.push(
      `    <meta name="standard" content="${esc(s.code + unit)}" data-standard="${esc(s.code)}"${legacy} data-unit="${esc(entry.unit == null ? "" : entry.unit)}" />`,
    );
  }
  if (codes.length)
    lines.push(`    <meta name="nt-project-standards" content="${esc(codes.join(","))}" />`);
  if (entry.revealUnit != null)
    lines.push(`    <meta name="nt-project-reveal-unit" content="${esc(entry.revealUnit)}" />`);
  lines.push('    <link rel="stylesheet" href="/shared/projects/projects-meta.css?v=20260727" />');
  lines.push(`    <!-- ${END} -->`);
  return lines.join("\n");
}

const BODY = [
  `  <!-- ${BEGIN} -->`,
  '  <script src="/shared/projects/projects-meta.js?v=20260727" defer></script>',
  `  <!-- ${END} -->`,
].join("\n");

function spliceBefore(html, closer, block) {
  const idx = html.lastIndexOf(closer);
  if (idx === -1) return null;
  return html.slice(0, idx) + block + "\n" + html.slice(idx);
}

function inject(rel, id, entry) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn(`  ! missing: ${rel}`);
    return false;
  }
  const before = fs.readFileSync(file, "utf8");
  if (before.includes(GUARD)) return false; // already injected
  let after = spliceBefore(before, "</head>", headBlock(id, entry));
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
  console.log(
    `  + ${rel}  [${(entry.standards || []).map((s) => s.code).join(" ") || "no codes"}]`,
  );
  return true;
}

/* Runs as part of `npm run build` (before vite) so regenerated project pages
   are re-injected automatically on every deploy. Non-fatal by design. */
try {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const units = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"].filter(
    (u) => !ONLY || u === ONLY,
  );

  let changed = 0;
  let seen = 0;
  console.log(`Projects META injection${DRY ? " (dry-run)" : ""}:`);
  for (const u of units) {
    const dir = path.join(ROOT, "math", u, "projects");
    if (!fs.existsSync(dir)) continue;
    /* Glob the version folders — a hardcoded ["version-a","version-b"] list is
       why unit-8/version-c is missing from most of the older injectors. */
    const versions = fs
      .readdirSync(dir)
      .filter((d) => /^version-[a-z]$/.test(d))
      .sort();
    for (const v of versions) {
      const id = `${u}-${v.slice(-1)}`;
      const entry = config.pages && config.pages[id];
      if (!entry) {
        console.warn(`  · no config entry for ${id} — skipped`);
        continue;
      }
      seen++;
      if (inject(`math/${u}/projects/${v}/index.html`, id, entry)) changed++;
    }
  }
  console.log(`${seen} page(s) targeted; ${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
} catch (err) {
  console.error(`inject-projects-meta: non-fatal error — ${err?.message || err}`);
}
process.exit(0);
