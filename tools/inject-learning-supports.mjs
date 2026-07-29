#!/usr/bin/env node
/* =============================================================================
 * inject-learning-supports.mjs — safely inject/revert learning support refs
 * in the 64 canonical lesson index.html files.
 *
 * Usage:
 *   node tools/inject-learning-supports.mjs            # Inject
 *   node tools/inject-learning-supports.mjs --revert   # Remove/Restore
 *   node tools/inject-learning-supports.mjs --check    # Check status
 * ========================================================================== */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");

const BEGIN_MARK = "<!-- ewl-supports-injected:begin -->";
const END_MARK = "<!-- ewl-supports-injected:end -->";

const CSS_BLOCK = `\n${BEGIN_MARK}\n    <link rel="stylesheet" href="/assets/learning-supports/learning-supports.css?v=20260714-supports-v28" />\n${END_MARK}`;
const JS_BLOCK = `\n${BEGIN_MARK}\n    <script src="/assets/learning-supports/learning-supports.js?v=20260714-supports-v28" defer></script>\n${END_MARK}`;

function getCanonicalLessons() {
  if (!existsSync(LESSONS_DIR)) {
    console.error("Lessons directory does not exist.");
    process.exit(1);
  }
  return readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+-\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au !== bu ? au - bu : al - bl;
    });
}

function realCloseIndex(html, tag) {
  const lower = html.toLowerCase();
  const index = lower.lastIndexOf(tag);
  return index;
}

function revertFile(file, lessonId) {
  let html = readFileSync(file, "utf8");
  let changed = false;

  // 1. Remove sentinel blocks
  const blockRe =
    /<!--\s*ewl-supports-injected:begin\s*-->[\s\S]*?<!--\s*ewl-supports-injected:end\s*-->\s*/gi;
  if (blockRe.test(html)) {
    html = html.replace(blockRe, "");
    changed = true;
  }

  // 2. Remove HTML attribute
  const attrRe = new RegExp(`\\s*data-ewl-supports-lesson="${lessonId}"`, "i");
  if (attrRe.test(html)) {
    html = html.replace(attrRe, "");
    changed = true;
  }

  if (changed) {
    writeFileSync(file, html, "utf8");
    console.log(`  REVERTED: ${lessonId}`);
    return true;
  }
  return false;
}

function injectFile(file, lessonId) {
  let html = readFileSync(file, "utf8");
  let changed = false;

  // 1. Inject html tag attribute
  if (!html.includes("data-ewl-supports-lesson=")) {
    html = html.replace(/<html\b/i, `<html data-ewl-supports-lesson="${lessonId}"`);
    changed = true;
  }

  // 2. Inject CSS Link before </head>
  if (!html.includes("learning-supports.css?v=20260714-supports-v28")) {
    const headAt = realCloseIndex(html, "</head>");
    if (headAt !== -1) {
      html = html.slice(0, headAt) + CSS_BLOCK + "\n" + html.slice(headAt);
      changed = true;
    }
  }

  // 3. Inject JS script before </body>
  if (!html.includes("learning-supports.js?v=20260714-supports-v28")) {
    const bodyAt = realCloseIndex(html, "</body>");
    if (bodyAt !== -1) {
      html = html.slice(0, bodyAt) + JS_BLOCK + "\n" + html.slice(bodyAt);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, html, "utf8");
    console.log(`  INJECTED: ${lessonId}`);
    return true;
  }
  return false;
}

function checkFile(file, lessonId) {
  const html = readFileSync(file, "utf8");
  const beginCount = html.split("ewl-supports-injected:begin").length - 1;
  const endCount = html.split("ewl-supports-injected:end").length - 1;
  const hasAttr = html.includes(`data-ewl-supports-lesson="${lessonId}"`);
  const hasCss = html.includes(
    "/assets/learning-supports/learning-supports.css?v=20260714-supports-v26",
  );
  const hasJs = html.includes(
    "/assets/learning-supports/learning-supports.js?v=20260714-supports-v26",
  );

  return beginCount === 2 && endCount === 2 && hasAttr && hasCss && hasJs;
}

function main() {
  const args = process.argv.slice(2);
  const isRevert = args.includes("--revert");
  const isCheck = args.includes("--check");

  console.log(
    `Learning Supports Integration - Mode: ${isRevert ? "REVERT" : isCheck ? "CHECK" : "INJECT"}`,
  );

  const lessons = getCanonicalLessons();
  let touched = 0;
  let invalidCount = 0;

  for (const lessonId of lessons) {
    const file = join(LESSONS_DIR, lessonId, "index.html");
    if (!existsSync(file)) {
      if (isCheck) {
        console.error(`  MISSING: ${lessonId}/index.html`);
        invalidCount++;
      }
      continue;
    }

    if (isRevert) {
      if (revertFile(file, lessonId)) touched++;
    } else if (isCheck) {
      const ok = checkFile(file, lessonId);
      if (!ok) {
        console.log(`  INVALID: ${lessonId}`);
        invalidCount++;
      }
    } else {
      if (injectFile(file, lessonId)) touched++;
    }
  }

  if (isCheck) {
    console.log(
      `Check complete. ${lessons.length - invalidCount}/${lessons.length} lessons integrated.`,
    );
    process.exit(invalidCount > 0 ? 1 : 0);
  } else {
    console.log(`Operation complete. Modified ${touched} lesson launchers.`);
  }
}

main();
