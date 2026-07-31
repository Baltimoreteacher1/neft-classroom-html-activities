#!/usr/bin/env node
/**
 * The a11y sample must cover every page template, and every sampled path must
 * exist on disk.
 *
 * `npm run audit:a11y` reported "0 violations across 12 pages" — of ~2,600.
 * Nine of the twelve were lesson pages, so games, projects, graphic novels,
 * printables and family pages were never looked at. A clean report over a
 * sample that misses most of the site reads as "the site is accessible", which
 * is the failure mode worth gating against.
 *
 * The sample is now derived per template (scripts/lib/page-templates.mjs).
 * This test fails if a template resolves to nothing — meaning either the
 * template lost all its pages, or the site grew a layout the audit does not
 * sample.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  missingTemplates,
  representativePages,
  TEMPLATES,
} from "../scripts/lib/page-templates.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
const fail = (m) => {
  failures++;
  console.error(`   ✗ ${m}`);
};

console.log("a11y template coverage");

const missing = missingTemplates();
if (missing.length) {
  fail(
    `${missing.length} template(s) resolve to no page: ${missing.join(", ")}.\n` +
      `     Either the pages moved (fix the resolver in scripts/lib/page-templates.mjs)\n` +
      `     or they are gone (remove the template).`,
  );
}

const pages = representativePages();

// A path that 404s makes the audit silently smaller, which is the same failure
// as not sampling it at all. Check each resolves to a real file.
for (const page of pages) {
  const rel = page.path.replace(/^\//, "");
  const candidates = page.path.endsWith("/")
    ? [`${rel}index.html`, rel.replace(/\/$/, ".html")]
    : [rel];
  if (!candidates.some((c) => existsSync(resolve(ROOT, c)))) {
    fail(`template "${page.template}" points at ${page.path}, which is not on disk`);
  }
}

if (pages.length < TEMPLATES.length) {
  fail(`only ${pages.length} of ${TEMPLATES.length} templates produced a page`);
}

if (failures) {
  console.error(`\n✗ a11y coverage: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`   ✓ all ${TEMPLATES.length} page templates have a representative in the a11y sample`);
for (const p of pages) console.log(`     ${p.template.padEnd(20)} ${p.path}`);
