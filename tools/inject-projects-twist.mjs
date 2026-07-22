#!/usr/bin/env node
// Design Twist injector — adds the shared advanced-revision challenge layer to
// every culminating project page. Same safety contract as the other
// projects-* injectors: lastIndexOf splicing (regex/first-match historically
// corrupted pages whose inline scripts contain markup-like strings), begin/end
// sentinels, idempotent re-runs, --dry-run supported. The runtime layer
// self-scopes via shared/projects/projects-twist-config.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");
const units = [...Array.from({ length: 10 }, (_, index) => `unit-${index + 1}`), "statistics"];
const versions = ["version-a", "version-b"];
const head = [
  "    <!-- projects-twist-head:begin (Design Twist — tools/inject-projects-twist.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-twist.css?v=20260722" />',
  "    <!-- projects-twist-head:end -->",
].join("\n");
const body = [
  "  <!-- projects-twist-body:begin (Design Twist — tools/inject-projects-twist.mjs) -->",
  '  <script src="/shared/projects/projects-twist.js?v=20260722" defer></script>',
  "  <!-- projects-twist-body:end -->",
].join("\n");
const startMarkers = ["projects-twist-head:begin", "projects-twist-body:begin"];

function stripExisting(html) {
  return html
    .replace(/\s*<!-- projects-twist-head:begin[\s\S]*?<!-- projects-twist-head:end -->\s*/g, "\n")
    .replace(/\s*<!-- projects-twist-body:begin[\s\S]*?<!-- projects-twist-body:end -->\s*/g, "\n");
}

function inject(relativePath) {
  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) throw new Error(`Missing project page: ${relativePath}`);
  const before = fs.readFileSync(file, "utf8");
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
for (const unit of units)
  for (const version of versions)
    if (inject(`math/${unit}/projects/${version}/index.html`)) changed += 1;

console.log(
  `Design Twist injection ${DRY_RUN ? "would update" : "updated"} ${changed} of 22 project pages.`,
);
