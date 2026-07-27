#!/usr/bin/env node
/**
 * Attach the shared Publication Studio to every culminating-project version.
 * Idempotent, marker-paired, and safe around markup-like strings in inline JS.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");
const UNITS = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"];

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

const HEAD = [
  "    <!-- projects-publication-head:begin (Publication Studio — tools/inject-projects-publication.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-publication.css?v=20260714" />',
  "    <!-- projects-publication-head:end -->",
].join("\n");
const BODY = [
  "  <!-- projects-publication-body:begin (Publication Studio — tools/inject-projects-publication.mjs) -->",
  '  <script src="/shared/projects/projects-publication.js?v=20260714" defer></script>',
  "  <!-- projects-publication-body:end -->",
].join("\n");
const TOKENS = [
  "projects-publication-head:begin",
  "projects-publication-head:end",
  "projects-publication-body:begin",
  "projects-publication-body:end",
  "/shared/projects/projects-publication.css?v=20260714",
  "/shared/projects/projects-publication.js?v=20260714",
];

function count(text, needle) {
  return text.split(needle).length - 1;
}

function spliceBefore(html, closer, block) {
  const index = html.lastIndexOf(closer);
  if (index < 0) throw new Error(`missing ${closer}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function inject(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) throw new Error("page is missing");
  const before = fs.readFileSync(file, "utf8");
  const counts = TOKENS.map((token) => count(before, token));
  if (counts.every((value) => value === 1)) return false;
  if (counts.some((value) => value !== 0)) {
    throw new Error(`partial or duplicate Publication Studio markers (${counts.join(",")})`);
  }
  let after = spliceBefore(before, "</head>", HEAD);
  after = spliceBefore(after, "</body>", BODY);
  if (!DRY_RUN) fs.writeFileSync(file, after);
  console.log(`  + ${rel}`);
  return true;
}

let changed = 0;
let failed = 0;
let targets = 0;
console.log(`Projects Publication Studio injection${DRY_RUN ? " (dry-run)" : ""}:`);
for (const unit of UNITS) {
  for (const version of versionsOf(unit)) {
    const rel = `math/${unit}/projects/${version}/index.html`;
    targets++;
    try {
      if (inject(rel)) changed++;
    } catch (error) {
      failed++;
      console.error(`  x ${rel}: ${error.message}`);
    }
  }
}
console.log(`${targets} project page(s) enumerated.`);
console.log(`${changed} file(s) ${DRY_RUN ? "would be " : ""}updated.`);
if (failed) process.exit(1);
