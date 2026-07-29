#!/usr/bin/env node
/* Idempotently inject the additive project layers into student-facing unit
 * project pages (version-a / version-b + statistics — not the chooser index,
 * not answer-key/teacher pages).
 *
 * Injects, before </body>, any of these includes that are not already present:
 *   - projects-future.css / .js  (metacognition, portfolio export, telemetry)
 *   - projects-coach.css  / .js  (AI Socratic coach; self-hides if no backend)
 *
 * Each include is inserted independently, so re-running on a page that already
 * has the future layer will add only the missing coach lines. It never edits
 * inline scripts, so it cannot corrupt existing inline logic.
 *
 *   node scripts/inject-projects-future.mjs           # inject missing includes
 *   node scripts/inject-projects-future.mjs --check    # report only, exit 1 if any missing
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// Each include: a unique marker (to test presence) + the exact tag to insert.
const INCLUDES = [
  {
    marker: "projects-future.css",
    tag: '<link rel="stylesheet" href="/shared/projects/projects-future.css" />',
  },
  {
    marker: "projects-future.js",
    tag: '<script src="/shared/projects/projects-future.js" defer></script>',
  },
  {
    marker: "projects-coach.css",
    tag: '<link rel="stylesheet" href="/shared/projects/projects-coach.css" />',
  },
  {
    marker: "projects-coach.js",
    tag: '<script src="/shared/projects/projects-coach.js" defer></script>',
  },
];

const patterns = [
  "math/unit-*/projects/version-a/index.html",
  "math/unit-*/projects/version-b/index.html",
  "math/statistics/projects/version-*/index.html",
];

const files = [...new Set(patterns.flatMap((p) => globSync(p, { cwd: ROOT })))].sort();

let pagesTouched = 0;
let includesAdded = 0;
let missing = 0;

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  let html;
  try {
    html = readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  if (!html.includes("</body>")) {
    console.warn("SKIP (no </body>):", rel);
    continue;
  }

  const need = INCLUDES.filter((inc) => !html.includes(inc.marker));
  if (!need.length) continue;

  if (CHECK) {
    missing += need.length;
    console.log("MISSING:", rel, "→", need.map((n) => n.marker).join(", "));
    continue;
  }

  const block = need.map((n) => "    " + n.tag).join("\n") + "\n  ";
  html = html.replace("</body>", block + "</body>");
  writeFileSync(abs, html);
  pagesTouched++;
  includesAdded += need.length;
  console.log("updated:", rel, "(+" + need.length + ")");
}

console.log(
  `\n${files.length} page(s) — touched ${pagesTouched}, includes added ${includesAdded}, missing ${missing}`,
);
if (CHECK && missing > 0) process.exit(1);
