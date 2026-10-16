#!/usr/bin/env node
/**
 * inject-curriculum-utility-bar.mjs — Inject slim persistent utility bar into math sub-tools.
 *
 * Targets:
 * - /curriculum/learning-labs/* (all individual lab pages)
 * - /curriculum/math-canvas/index.html
 * - /curriculum/extra-help/index.html
 * - /curriculum/notes-studio/index.html
 *
 * Uses sentinels:
 * <!-- curriculum-utility-bar:begin -->
 * ...
 * <!-- curriculum-utility-bar:end -->
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function getSubToolPages(root = ROOT) {
  const pages = [];

  // Learning Labs (individual lab pages)
  const labsDir = resolve(root, "curriculum/learning-labs");
  try {
    const entries = readdirSync(labsDir);
    for (const entry of entries) {
      if (entry === "shared" || entry === "index.html") continue;
      const sub = join(labsDir, entry);
      if (statSync(sub).isDirectory()) {
        const file = join(sub, "index.html");
        pages.push(file);
      }
    }
  } catch (e) {
    console.error("Error reading learning labs:", e);
  }

  // Math Canvas
  pages.push(resolve(root, "curriculum/math-canvas/index.html"));

  // Extra Help
  pages.push(resolve(root, "curriculum/extra-help/index.html"));

  // Notes Studio
  pages.push(resolve(root, "curriculum/notes-studio/index.html"));

  return pages.sort();
}

export function injectUtilityBar(html, filePath) {
  // Determine tool metadata
  let toolName = "Interactive Tool";
  let unit = "";
  let lesson = "";

  if (filePath.includes("learning-labs")) {
    toolName = "Learning Lab";
    const titleMatch = html.match(/<h1>([^<]+)<\/h1>/);
    if (titleMatch) toolName = `Learning Lab: ${titleMatch[1]}`;
    const lessonMatch =
      html.match(/Lessons?\s+(\d+)\.(\d+)/i) || html.match(/\/lessons\/(\d+)-(\d+)\//);
    if (lessonMatch) {
      unit = lessonMatch[1];
      lesson = `${lessonMatch[1]}-${lessonMatch[2]}`;
    }
  } else if (filePath.includes("math-canvas")) {
    toolName = "Living Math Canvas";
  } else if (filePath.includes("extra-help")) {
    toolName = "Extra Help";
  } else if (filePath.includes("notes-studio")) {
    toolName = "Notes Studio";
  }

  // Remove old curriculum-shell or existing utility bar
  let cleanHtml = html.replace(
    /\s*<!-- curriculum-shell:begin -->[\s\S]*?<!-- curriculum-shell:end -->\s*/g,
    "\n",
  );
  cleanHtml = cleanHtml.replace(
    /\s*<!-- curriculum-utility-bar:begin -->[\s\S]*?<!-- curriculum-utility-bar:end -->\s*/g,
    "\n",
  );

  // Ensure head tags
  if (!cleanHtml.includes("/assets/curriculum-utility-bar.css")) {
    cleanHtml = cleanHtml.replace(
      "</head>",
      '  <link rel="stylesheet" href="/assets/curriculum-utility-bar.css" />\n</head>',
    );
  }
  if (!cleanHtml.includes("/assets/curriculum-shell-state.js")) {
    cleanHtml = cleanHtml.replace(
      "</head>",
      '  <script src="/assets/curriculum-shell-state.js"></script>\n</head>',
    );
  }
  if (!cleanHtml.includes("/assets/curriculum-utility-bar.js")) {
    cleanHtml = cleanHtml.replace(
      "</head>",
      '  <script src="/assets/curriculum-utility-bar.js" defer></script>\n</head>',
    );
  }

  const barMarkup = `<!-- curriculum-utility-bar:begin -->
<div class="curriculum-in-tool-bar" data-tool="${toolName}"${unit ? ` data-unit="${unit}"` : ""}${lesson ? ` data-lesson="${lesson}"` : ""}></div>
<!-- curriculum-utility-bar:end -->`;

  cleanHtml = cleanHtml.replace(/(<body[^>]*>)/i, `$1\n${barMarkup}`);
  return cleanHtml;
}

function main() {
  const isCheck = process.argv.includes("--check");
  const pages = getSubToolPages();
  let modifiedCount = 0;

  for (const page of pages) {
    let original = "";
    try {
      original = readFileSync(page, "utf8");
    } catch {
      continue;
    }

    const updated = injectUtilityBar(original, page);
    if (original !== updated) {
      if (isCheck) {
        console.error(`✗ Uninjected sub-tool utility bar: ${page}`);
        modifiedCount++;
      } else {
        writeFileSync(page, updated);
        modifiedCount++;
      }
    }
  }

  if (isCheck) {
    if (modifiedCount > 0) {
      console.error(`Found ${modifiedCount} sub-tool pages missing utility bar injection.`);
      process.exit(1);
    } else {
      console.log(`✓ All ${pages.length} sub-tool pages have verified utility bar injection.`);
    }
  } else {
    console.log(`Updated utility bar in ${modifiedCount} of ${pages.length} sub-tool pages.`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
