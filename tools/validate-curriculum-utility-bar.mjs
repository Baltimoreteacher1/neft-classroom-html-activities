#!/usr/bin/env node
/**
 * validate-curriculum-utility-bar.mjs — Validate 100% injection of in-tool utility bar.
 *
 * Checks:
 * - Negative controls: corrupt / missing pieces must fail loudly.
 * - Fleet check: every sub-tool page carries sentinel, markup, stylesheet, and runtime scripts.
 */

import { readFileSync } from "node:fs";
import { getSubToolPages } from "./inject-curriculum-utility-bar.mjs";

export function auditPage(html, path = "test-page.html") {
  const issues = [];
  if (!html.includes("<!-- curriculum-utility-bar:begin -->")) {
    issues.push("missing <!-- curriculum-utility-bar:begin --> sentinel");
  }
  if (!html.includes("<!-- curriculum-utility-bar:end -->")) {
    issues.push("missing <!-- curriculum-utility-bar:end --> sentinel");
  }
  if (!html.includes("curriculum-in-tool-bar")) {
    issues.push("missing .curriculum-in-tool-bar container");
  }
  if (!html.includes("/assets/curriculum-utility-bar.css")) {
    issues.push("missing curriculum-utility-bar.css stylesheet");
  }
  if (!html.includes("/assets/curriculum-utility-bar.js")) {
    issues.push("missing curriculum-utility-bar.js script");
  }
  if (!html.includes("/assets/curriculum-shell-state.js")) {
    issues.push("missing curriculum-shell-state.js script");
  }
  return { ok: issues.length === 0, issues, path };
}

export function runSelfTest() {
  process.stdout.write("running validate:curriculum-utility-bar self-test (negative controls)... ");

  // Control 1: Empty HTML
  const c1 = auditPage("<html><head></head><body></body></html>", "c1.html");
  if (c1.ok || c1.issues.length < 5) {
    throw new Error("Negative control 1 failed: empty HTML was not flagged as defective.");
  }

  // Control 2: Missing CSS
  const c2Html = `<html><head><script src="/assets/curriculum-shell-state.js"></script><script src="/assets/curriculum-utility-bar.js"></script></head><body><!-- curriculum-utility-bar:begin --><div class="curriculum-in-tool-bar"></div><!-- curriculum-utility-bar:end --></body></html>`;
  const c2 = auditPage(c2Html, "c2.html");
  if (c2.ok || !c2.issues.some((i) => i.includes("css"))) {
    throw new Error("Negative control 2 failed: missing CSS was not flagged.");
  }

  // Control 3: Missing Sentinel
  const c3Html = `<html><head><link rel="stylesheet" href="/assets/curriculum-utility-bar.css"><script src="/assets/curriculum-shell-state.js"></script><script src="/assets/curriculum-utility-bar.js"></script></head><body><div class="curriculum-in-tool-bar"></div></body></html>`;
  const c3 = auditPage(c3Html, "c3.html");
  if (c3.ok || !c3.issues.some((i) => i.includes("sentinel"))) {
    throw new Error("Negative control 3 failed: missing sentinel was not flagged.");
  }

  console.log("✓ Negative controls passed: all defective inputs caught.");
}

function main() {
  runSelfTest();

  const pages = getSubToolPages();
  const failures = [];

  for (const page of pages) {
    let src = "";
    try {
      src = readFileSync(page, "utf8");
    } catch (e) {
      failures.push({ path: page, issues: [`File unreadable: ${e.message}`] });
      continue;
    }

    const res = auditPage(src, page);
    if (!res.ok) {
      failures.push(res);
    }
  }

  if (failures.length > 0) {
    console.error(`\n✗ validate:curriculum-utility-bar FAILED on ${failures.length} pages:`);
    for (const f of failures) {
      console.error(`  • ${f.path}`);
      for (const issue of f.issues) {
        console.error(`      - ${issue}`);
      }
    }
    process.exit(1);
  }

  console.log(
    `✓ validate:curriculum-utility-bar passed — 100% coverage across ${pages.length} sub-tool pages.`,
  );
}

main();
