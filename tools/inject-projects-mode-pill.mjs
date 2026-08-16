#!/usr/bin/env node
// Teacher/Student mode chip injector — adds the shared mode toggle to every
// culminating project page (version wizards) and every unit project hub.
//
// Same safety contract as the other projects-* injectors: lastIndexOf splicing
// (regex/first-match historically corrupted pages whose inline scripts contain
// markup-like strings), begin/end sentinels, idempotent re-runs, --dry-run.
// The runtime layer self-gates on <body class="pro-projects"> / "pk-hub", so a
// page that is neither simply renders nothing.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasEquivalentBlock } from "./lib/injection.mjs";
import { PROJECT_UNITS } from "./lib/project-units.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");
const units = PROJECT_UNITS;

/* Enumerate version folders from disk (version-a, version-b, version-c, …).
   A hardcoded ["version-a","version-b"] list is why unit-8/version-c was
   invisible to nearly every projects-* layer — never reintroduce one. */
function versionsOf(unit) {
  try {
    return fs
      .readdirSync(path.join(ROOT, "math", unit, "projects"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^version-[a-z]$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (_error) {
    return [];
  }
}

const head = [
  "    <!-- projects-mode-pill-head:begin (Teacher/Student mode chip — tools/inject-projects-mode-pill.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-mode-pill.css?v=20260810" />',
  "    <!-- projects-mode-pill-head:end -->",
].join("\n");
const body = [
  "  <!-- projects-mode-pill-body:begin (Teacher/Student mode chip — tools/inject-projects-mode-pill.mjs) -->",
  '  <script src="/shared/projects/projects-mode-pill.js?v=20260810" defer></script>',
  "  <!-- projects-mode-pill-body:end -->",
].join("\n");
const startMarkers = ["projects-mode-pill-head:begin", "projects-mode-pill-body:begin"];

function stripExisting(html) {
  return html
    .replace(
      /\s*<!-- projects-mode-pill-head:begin[\s\S]*?<!-- projects-mode-pill-head:end -->\s*/g,
      "\n",
    )
    .replace(
      /\s*<!-- projects-mode-pill-body:begin[\s\S]*?<!-- projects-mode-pill-body:end -->\s*/g,
      "\n",
    );
}

function inject(relativePath) {
  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) return null; // hub pages are enumerated optimistically
  const before = fs.readFileSync(file, "utf8");
  // Already carrying this exact layer? Leave it exactly where it is — see the
  // note in inject-projects-twist.mjs: strip-then-append makes sibling
  // injectors rewrite all 23 pages on every build, forever.
  if (hasEquivalentBlock(before, head) && hasEquivalentBlock(before, body)) return false;
  let after = stripExisting(before);
  const headIndex = after.lastIndexOf("</head>");
  const bodyIndex = after.lastIndexOf("</body>");
  if (headIndex === -1 || bodyIndex === -1) throw new Error(`Missing HTML closer: ${relativePath}`);
  after = `${after.slice(0, headIndex)}${head}\n${after.slice(headIndex)}`;
  const updatedBodyIndex = after.lastIndexOf("</body>");
  after = `${after.slice(0, updatedBodyIndex)}${body}\n${after.slice(updatedBodyIndex)}`;
  for (const marker of startMarkers)
    if (after.split(marker).length - 1 !== 1)
      throw new Error(`Duplicate marker ${marker}: ${relativePath}`);
  if (after === before) return false;
  if (!DRY_RUN) fs.writeFileSync(file, after);
  return true;
}

let changed = 0;
let targets = 0;
for (const unit of units) {
  for (const version of versionsOf(unit)) {
    const result = inject(`math/${unit}/projects/${version}/index.html`);
    if (result !== null) targets += 1;
    if (result) changed += 1;
  }
  // The unit project hub itself — a teacher browsing versions needs the same
  // way out of teacher mode as the wizard pages.
  const hub = inject(`math/${unit}/projects/index.html`);
  if (hub !== null) targets += 1;
  if (hub) changed += 1;
}

console.log(
  `Mode-chip injection ${DRY_RUN ? "would update" : "updated"} ${changed} of ${targets} project pages.`,
);
