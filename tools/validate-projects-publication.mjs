#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UNITS = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"];
const VERSIONS = ["version-a", "version-b"];
const failures = [];
const pages = [];

function count(text, needle) {
  return text.split(needle).length - 1;
}

function fail(rel, message) {
  failures.push(`${rel}: ${message}`);
}

for (const unit of UNITS) {
  for (const version of VERSIONS) {
    const rel = `math/${unit}/projects/${version}/index.html`;
    const file = path.join(ROOT, rel);
    pages.push(rel);
    if (!fs.existsSync(file)) {
      fail(rel, "page is missing");
      continue;
    }

    const html = fs.readFileSync(file, "utf8");
    const requirements = [
      ["projects-publication-head:begin", 1],
      ["projects-publication-head:end", 1],
      ["projects-publication-body:begin", 1],
      ["projects-publication-body:end", 1],
      ["/shared/projects/projects-publication.css?v=20260714", 1],
      ["/shared/projects/projects-publication.js?v=20260714", 1],
    ];
    for (const [needle, expected] of requirements) {
      const actual = count(html, needle);
      if (actual !== expected) fail(rel, `expected ${expected} occurrence of ${needle}, found ${actual}`);
    }

    if (!html.includes('class="step-panel') && !html.includes("class='step-panel")) {
      fail(rel, "no project step panels found");
    }
    if (!html.includes("data-research-find")) fail(rel, "no research evidence field found");
    if (/href\s*=\s*["']\s*(?:javascript:|data:|#|)["']/i.test(html)) {
      fail(rel, "contains an empty, fragment-only, or unsafe link");
    }
  }
}

if (pages.length !== 22) failures.push(`expected 22 project pages, enumerated ${pages.length}`);

if (failures.length) {
  console.error(`Publication Studio validation failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Publication Studio validation passed: ${pages.length} project pages.`);
