#!/usr/bin/env node
/* Idempotently inject the additive "future layer" (projects-future.css/js) into
 * student-facing unit project pages (version-a / version-b only — not the
 * chooser index, not answer-key/teacher pages).
 *
 * Injection is a simple string insert of one <link> + one <script defer> right
 * before the closing </body>. It never edits inline scripts, so it cannot
 * corrupt the pages' existing inline logic. Re-running is a no-op.
 *
 *   node scripts/inject-projects-future.mjs          # inject
 *   node scripts/inject-projects-future.mjs --check   # report only, exit 1 if any missing
 */
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const LINK = '<link rel="stylesheet" href="/shared/projects/projects-future.css" />';
const SCRIPT = '<script src="/shared/projects/projects-future.js" defer></script>';
const MARKER = "projects-future.js";

// version-a and version-b project pages across all math units.
const patterns = [
  "math/unit-*/projects/version-a/index.html",
  "math/unit-*/projects/version-b/index.html",
  "math/statistics/projects/version-*/index.html",
];

const files = [
  ...new Set(patterns.flatMap((p) => globSync(p, { cwd: ROOT }))),
].sort();

let injected = 0;
let already = 0;
let missing = 0;

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  let html;
  try {
    html = readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  if (html.includes(MARKER)) {
    already++;
    continue;
  }
  if (CHECK) {
    missing++;
    console.log("MISSING:", rel);
    continue;
  }
  const insert = `    ${LINK}\n    ${SCRIPT}\n  `;
  if (!html.includes("</body>")) {
    console.warn("SKIP (no </body>):", rel);
    continue;
  }
  const out = html.replace("</body>", insert + "</body>");
  writeFileSync(abs, out);
  injected++;
  console.log("injected:", rel);
}

console.log(
  `\n${files.length} page(s) — injected ${injected}, already ${already}, missing ${missing}`,
);
if (CHECK && missing > 0) process.exit(1);
