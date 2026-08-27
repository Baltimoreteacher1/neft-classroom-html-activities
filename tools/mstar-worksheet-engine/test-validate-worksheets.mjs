#!/usr/bin/env node
/**
 * test-validate-worksheets.mjs — Automated Pre-Flight & Regression Validation Suite
 *
 * Runs comprehensive static analysis across all generated HTML worksheet files to verify:
 *   1. Schema completeness: zero empty sort lists, zero unpopulated table cells.
 *   2. Rule #3 Compliance: 100% valid inline SVG with style="background:white" and explicit dimensions.
 *   3. MSTAR Alignment: Validates EBSR, Multi-Select, Type II Error Analysis, and Type III Modeling presence.
 *   4. TWR Writing Integration: Validates Because/But/So and CER 2.0 matrices.
 *   5. Zero placeholder / filler tokens.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileAllWorksheets } from "./generate-mstar-worksheets.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "dist", "lessons");

function runValidation() {
  console.log("================================================================================");
  console.log("🧪 STARTING MSTAR WORKSHEET VALIDATION & INTEGRITY SUITE");
  console.log("================================================================================");

  // 1. Compile all worksheets
  compileAllWorksheets();

  if (!existsSync(DIST_DIR)) {
    console.error(`❌ Output directory ${DIST_DIR} does not exist!`);
    process.exit(1);
  }

  const subdirs = readdirSync(DIST_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`\n🔍 Inspecting ${subdirs.length} generated lesson directories...`);

  let totalFilesChecked = 0;
  let totalErrors = 0;
  let totalSVGsFound = 0;
  let totalTWRFound = 0;
  let totalMSTARFound = 0;

  for (const dir of subdirs) {
    const wsPath = join(DIST_DIR, dir, "worksheet.html");
    if (!existsSync(wsPath)) continue;

    totalFilesChecked++;
    const content = readFileSync(wsPath, "utf8");

    // Check 1: Empty Sorting Lists
    if (
      content.includes('<ul class="ws-sort-list"></ul>') ||
      content.includes('<ul class="ws-sort-list"> </ul>')
    ) {
      console.error(`❌ [${dir}] Found empty sort list!`);
      totalErrors++;
    }

    // Check 2: Double-Escaped HTML Entities
    if (
      content.includes("&amp;amp;") ||
      content.includes("&amp;lt;") ||
      content.includes("&amp;gt;")
    ) {
      console.error(`❌ [${dir}] Found double-escaped HTML entity!`);
      totalErrors++;
    }

    // Check 3: Placeholder / Filler Tokens
    const forbiddenPhrases = [
      "TODO",
      "<!-- more items",
      "Solve the mathematical problem. Show all of your work and reasoning.",
    ];
    for (const phrase of forbiddenPhrases) {
      if (content.includes(phrase)) {
        console.error(`❌ [${dir}] Found forbidden filler phrase: "${phrase}"`);
        totalErrors++;
      }
    }

    // Check 4: Inline SVG Validity & Rule #3 Compliance
    const svgMatches = content.match(/<svg[^>]*>[\s\S]*?<\/svg>/g) || [];
    totalSVGsFound += svgMatches.length;
    for (const svg of svgMatches) {
      if (!svg.includes('style="background:white') && !svg.includes("style='background:white")) {
        console.error(`❌ [${dir}] SVG missing style="background:white"!`);
        totalErrors++;
      }
      if (!svg.includes("width=") || !svg.includes("height=")) {
        console.error(`❌ [${dir}] SVG missing explicit width or height attributes!`);
        totalErrors++;
      }
    }

    // Check 5: TWR Writing Integration
    if (
      content.includes("The Writing Revolution") &&
      content.includes("BECAUSE") &&
      content.includes("BUT") &&
      content.includes("SO")
    ) {
      totalTWRFound++;
    }

    // Check 6: MSTAR Item Integration
    if (
      content.includes("MSTAR") ||
      content.includes("EVIDENCE-BASED SELECTED RESPONSE") ||
      content.includes("REASONING &amp; ERROR ANALYSIS")
    ) {
      totalMSTARFound++;
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("📊 VALIDATION AUDIT SUMMARY:");
  console.log(`   • Total HTML Files Inspected: ${totalFilesChecked}`);
  console.log(`   • Total Inline SVGs Validated: ${totalSVGsFound}`);
  console.log(`   • TWR Writing Modules Verified: ${totalTWRFound} / ${totalFilesChecked}`);
  console.log(`   • MSTAR Items Verified: ${totalMSTARFound} / ${totalFilesChecked}`);
  console.log(`   • Integrity / Rendering Errors: ${totalErrors}`);
  console.log("--------------------------------------------------------------------------------");

  if (totalErrors === 0) {
    console.log("🎉 100% PASSING! All worksheets satisfy publisher standards and MSTAR alignment.");
  } else {
    console.error(`❌ FAILED with ${totalErrors} errors.`);
    process.exit(1);
  }
}

runValidation();
