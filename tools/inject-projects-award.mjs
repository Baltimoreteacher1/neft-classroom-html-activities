#!/usr/bin/env node

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
  "    <!-- projects-award-head:begin (Community Math Studio — tools/inject-projects-award.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-award.css?v=20260714" />',
  "    <!-- projects-award-head:end -->",
].join("\n");
const body = [
  "  <!-- projects-award-body:begin (Community Math Studio — tools/inject-projects-award.mjs) -->",
  '  <script src="/shared/projects/projects-award.js?v=20260714" defer></script>',
  "  <!-- projects-award-body:end -->",
].join("\n");
const startMarkers = ["projects-award-head:begin", "projects-award-body:begin"];

function stripExisting(html) {
  return html
    .replace(/\s*<!-- projects-award-head:begin[\s\S]*?<!-- projects-award-head:end -->\s*/g, "\n")
    .replace(/\s*<!-- projects-award-body:begin[\s\S]*?<!-- projects-award-body:end -->\s*/g, "\n");
}

function inject(relativePath) {
  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) throw new Error(`Missing project page: ${relativePath}`);
  const before = fs.readFileSync(file, "utf8");
  // Already carrying this exact layer? Leave it exactly where it is.
  //
  // Without this, strip-then-append moves the block to the end of <head>/<body>
  // on every run, and the sibling injector that does the same thing moves its
  // own block back — so the two rewrote all 23 project pages on every single
  // build, forever. Position is not part of the contract for a <link> or a
  // deferred <script>.
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
for (const unit of units)
  for (const version of versionsOf(unit)) {
    targets += 1;
    if (inject(`math/${unit}/projects/${version}/index.html`)) changed += 1;
  }

console.log(
  `Community Math Studio injection ${DRY_RUN ? "would update" : "updated"} ${changed} of ${targets} project pages.`,
);
