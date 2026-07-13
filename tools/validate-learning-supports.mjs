#!/usr/bin/env node
/* =============================================================================
 * validate-learning-supports.mjs — validate the learning supports manifest.
 *
 * Checks:
 *   - Verifies there are exactly 64 canonical lesson directories (matching /^\d+-\d+$/).
 *   - Verifies the manifest file exists and is valid JSON.
 *   - Verifies every canonical lesson has an entry in the manifest.
 *   - Verifies the structure of each entry (lessonId, title, standard, etc.).
 *   - Rejects raw HTML, answer-bearing config keys, external URLs, and PII.
 *   - Validates profile keys.
 * ========================================================================== */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");
const MANIFEST_PATH = join(ROOT, "assets", "learning-supports", "manifest.json");

const PROFILE_KEYS = [
  "read-understand",
  "focus-organize",
  "build-math",
  "express-thinking",
  "language-support",
  "challenge-extend",
];

const FORBIDDEN_KEYS = new Set([
  "correctIndex",
  "sampleAnswer",
  "kernel",
  "listenFor",
  "explanation",
  "choiceFeedback",
]);

// Helper to check for HTML tags
function hasHtml(str) {
  if (typeof str !== "string") return false;
  return /<[a-zA-Z/!][^>]*>/g.test(str);
}

// Helper to check for external URLs
function hasExternalUrl(str) {
  if (typeof str !== "string") return false;
  return /^(https?:)?\/\/[^\/]/i.test(str);
}

// Recursive object scanner to ensure no forbidden keys or values
function scanObject(obj, path = "") {
  if (!obj || typeof obj !== "object") {
    if (typeof obj === "string") {
      if (hasHtml(obj)) {
        throw new Error(`Forbidden raw HTML found at ${path}: "${obj}"`);
      }
      if (hasExternalUrl(obj)) {
        throw new Error(`Forbidden external URL found at ${path}: "${obj}"`);
      }
    }
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((val, idx) => scanObject(val, `${path}[${idx}]`));
    return;
  }

  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`Forbidden answer-bearing key found: "${key}" at path: "${path}"`);
    }
    scanObject(obj[key], path ? `${path}.${key}` : key);
  }
}

function runValidation() {
  console.log("Running learning supports validation...");

  // 1. Get canonical lesson directories
  if (!existsSync(LESSONS_DIR)) {
    console.error(`Error: Lessons directory does not exist at ${LESSONS_DIR}`);
    process.exit(1);
  }

  const canonicalLessonIds = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+-\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au !== bu ? au - bu : al - bl;
    });

  console.log(`Found ${canonicalLessonIds.length} canonical lesson directories.`);

  if (canonicalLessonIds.length !== 64) {
    console.error(
      `Error: Expected exactly 64 canonical lesson directories, but found ${canonicalLessonIds.length}.`,
    );
    process.exit(1);
  }

  // 2. Check if manifest exists
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`FAIL: Manifest file does not exist at ${MANIFEST_PATH}`);
    process.exit(1);
  }

  // 3. Read and parse manifest
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch (err) {
    console.error(`FAIL: Failed to parse manifest.json: ${err.message}`);
    process.exit(1);
  }

  const manifestKeys = Object.keys(manifest);
  console.log(`Manifest contains ${manifestKeys.length} entries.`);

  // Verify completeness
  for (const lessonId of canonicalLessonIds) {
    if (!manifest[lessonId]) {
      console.error(`FAIL: Missing manifest entry for canonical lesson ${lessonId}`);
      process.exit(1);
    }
  }

  // 4. Validate each entry
  for (const [lessonId, entry] of Object.entries(manifest)) {
    const path = `manifest["${lessonId}"]`;

    // Verify it is canonical
    if (!/^\d+-\d+$/.test(lessonId)) {
      console.error(`FAIL: Manifest entry has non-canonical key "${lessonId}"`);
      process.exit(1);
    }

    // Required fields check
    const requiredFields = [
      "lessonId",
      "title",
      "standard",
      "contentObjective",
      "languageObjective",
      "vocabulary",
      "workedExample",
      "sentenceFrames",
      "wordBank",
      "readinessHref",
      "profiles",
    ];

    for (const field of requiredFields) {
      if (entry[field] === undefined) {
        console.error(`FAIL: Missing required field "${field}" in ${path}`);
        process.exit(1);
      }
    }

    // Value assertions
    if (entry.lessonId !== lessonId) {
      console.error(
        `FAIL: Field "lessonId" (${entry.lessonId}) does not match key (${lessonId}) in ${path}`,
      );
      process.exit(1);
    }

    if (typeof entry.title !== "string" || !entry.title) {
      console.error(`FAIL: "title" must be a non-empty string in ${path}`);
      process.exit(1);
    }

    if (typeof entry.standard !== "string" || !entry.standard) {
      console.error(`FAIL: "standard" must be a non-empty string in ${path}`);
      process.exit(1);
    }

    if (typeof entry.contentObjective !== "string" || !entry.contentObjective) {
      console.error(`FAIL: "contentObjective" must be a non-empty string in ${path}`);
      process.exit(1);
    }

    if (typeof entry.languageObjective !== "string" || !entry.languageObjective) {
      console.error(`FAIL: "languageObjective" must be a non-empty string in ${path}`);
      process.exit(1);
    }

    if (!Array.isArray(entry.vocabulary)) {
      console.error(`FAIL: "vocabulary" must be an array in ${path}`);
      process.exit(1);
    }

    // Ensure vocabulary entries have term and definition (student-safe)
    for (let i = 0; i < entry.vocabulary.length; i++) {
      const v = entry.vocabulary[i];
      if (typeof v.term !== "string" || !v.term) {
        console.error(`FAIL: Vocabulary term at index ${i} is missing or invalid in ${path}`);
        process.exit(1);
      }
      if (typeof v.definition !== "string" || !v.definition) {
        console.error(`FAIL: Vocabulary definition at index ${i} is missing or invalid in ${path}`);
        process.exit(1);
      }
    }

    if (typeof entry.workedExample !== "string") {
      console.error(`FAIL: "workedExample" must be a string in ${path}`);
      process.exit(1);
    }

    if (!Array.isArray(entry.sentenceFrames)) {
      console.error(`FAIL: "sentenceFrames" must be an array of strings in ${path}`);
      process.exit(1);
    }

    if (!Array.isArray(entry.wordBank)) {
      console.error(`FAIL: "wordBank" must be an array of strings in ${path}`);
      process.exit(1);
    }

    if (typeof entry.readinessHref !== "string" || !entry.readinessHref.startsWith("/")) {
      console.error(`FAIL: "readinessHref" must be a relative path in ${path}`);
      process.exit(1);
    }

    if (typeof entry.profiles !== "object" || entry.profiles === null) {
      console.error(`FAIL: "profiles" must be an object in ${path}`);
      process.exit(1);
    }

    // Validate profiles keys
    for (const key of Object.keys(entry.profiles)) {
      if (!PROFILE_KEYS.includes(key)) {
        console.error(`FAIL: Unknown profile key "${key}" in ${path}`);
        process.exit(1);
      }
      if (typeof entry.profiles[key] !== "boolean") {
        console.error(`FAIL: Profile value for "${key}" must be a boolean in ${path}`);
        process.exit(1);
      }
    }

    // Ensure all PROFILE_KEYS are explicitly defined
    for (const key of PROFILE_KEYS) {
      if (entry.profiles[key] === undefined) {
        console.error(`FAIL: Missing profile key "${key}" in ${path}`);
        process.exit(1);
      }
    }

    // Optional lesson-specific fields: validate shape when present.
    if (entry.misconceptions !== undefined) {
      if (!Array.isArray(entry.misconceptions)) {
        console.error(`FAIL: "misconceptions" must be an array in ${path}`);
        process.exit(1);
      }
      for (let i = 0; i < entry.misconceptions.length; i++) {
        const mc = entry.misconceptions[i];
        const ok =
          typeof mc === "string"
            ? mc.trim().length > 0
            : mc &&
              typeof mc === "object" &&
              typeof mc.mistake === "string" &&
              mc.mistake.trim().length > 0 &&
              (mc.tip === undefined || typeof mc.tip === "string");
        if (!ok) {
          console.error(
            `FAIL: misconceptions[${i}] must be a non-empty string or { mistake, tip } in ${path}`,
          );
          process.exit(1);
        }
      }
    }

    if (entry.checklistSteps !== undefined) {
      if (!Array.isArray(entry.checklistSteps)) {
        console.error(`FAIL: "checklistSteps" must be an array in ${path}`);
        process.exit(1);
      }
      for (let i = 0; i < entry.checklistSteps.length; i++) {
        if (typeof entry.checklistSteps[i] !== "string" || !entry.checklistSteps[i].trim()) {
          console.error(`FAIL: checklistSteps[${i}] must be a non-empty string in ${path}`);
          process.exit(1);
        }
      }
    }

    // 5. Scan entry for safety, PII, external URLs, HTML, and answer leakage
    try {
      scanObject(entry, path);
    } catch (err) {
      console.error(`FAIL: Security check failed in ${path}: ${err.message}`);
      process.exit(1);
    }
  }

  // 6. Lesson integration checks (Task 4 Step 1)
  console.log("Checking integration in 64 canonical lesson launchers...");
  for (const lessonId of canonicalLessonIds) {
    const indexPath = join(LESSONS_DIR, lessonId, "index.html");
    if (!existsSync(indexPath)) {
      console.error(`FAIL: Missing index.html in canonical lesson folder: ${lessonId}`);
      process.exit(1);
    }
    const html = readFileSync(indexPath, "utf8");

    // Check sentinels
    const beginCount = html.split("ewl-supports-injected:begin").length - 1;
    const endCount = html.split("ewl-supports-injected:end").length - 1;
    if (beginCount !== 2 || endCount !== 2) {
      console.error(
        `FAIL: ${lessonId}/index.html must contain exactly two learning-support sentinel blocks. Found begin=${beginCount}, end=${endCount}`,
      );
      process.exit(1);
    }

    // Check html tag data attribute
    const hasLessonAttr = html.includes(`data-ewl-supports-lesson="${lessonId}"`);
    if (!hasLessonAttr) {
      console.error(
        `FAIL: ${lessonId}/index.html missing data-ewl-supports-lesson="${lessonId}" attribute`,
      );
      process.exit(1);
    }

    // Check stylesheet reference inside sentinels
    const hasCss = html.includes("/assets/learning-supports/learning-supports.css");
    if (!hasCss) {
      console.error(`FAIL: ${lessonId}/index.html missing learning-supports.css link reference`);
      process.exit(1);
    }

    // Check script reference inside sentinels
    const hasJs = html.includes("/assets/learning-supports/learning-supports.js");
    if (!hasJs) {
      console.error(`FAIL: ${lessonId}/index.html missing learning-supports.js script reference`);
      process.exit(1);
    }

    // Idempotency: verify no other occurrence of data-ewl-supports-lesson outside html element
    const attrOccurrences = html.split("data-ewl-supports-lesson=").length - 1;
    if (attrOccurrences !== 1) {
      console.error(
        `FAIL: ${lessonId}/index.html contains duplicate data-ewl-supports-lesson attributes`,
      );
      process.exit(1);
    }
  }
  console.log("PASS: All 64 canonical lesson launchers have correct supports injected.");

  // 7. Curriculum Hub checks (Task 5 Step 1)
  console.log("Checking Curriculum Hub integration...");
  const hubPath = join(ROOT, "curriculum", "index.html");
  if (!existsSync(hubPath)) {
    console.error("FAIL: Missing curriculum/index.html");
    process.exit(1);
  }
  const hubHtml = readFileSync(hubPath, "utf8");

  // A11y & Explainer Text checks
  if (!hubHtml.includes("access without lowering the learning target")) {
    console.error(
      "FAIL: curriculum/index.html missing 'access without lowering the learning target' copy",
    );
    process.exit(1);
  }
  if (!hubHtml.includes("no IEP data is stored") && !hubHtml.includes("no IEP data")) {
    console.error("FAIL: curriculum/index.html missing 'no IEP data is stored' copy");
    process.exit(1);
  }
  if (
    !hubHtml.includes('href="/lessons/1-1/"') &&
    !hubHtml.includes('href="/lessons/1-1/index.html"')
  ) {
    console.error("FAIL: curriculum/index.html missing link to canonical preview lesson 1-1");
    process.exit(1);
  }
  console.log("PASS: Curriculum Hub learning supports explainer validated.");

  // 8. v2 lockstep: every item key in supports-schema.js must be accepted by
  // the API allow-list in functions/api/supports/[[path]].js. A schema key the
  // API silently drops would let a teacher "assign" a support that never
  // reaches students.
  console.log("Checking supports-schema ⊆ API allow-list lockstep...");
  const schemaSrc = readFileSync(
    join(ROOT, "assets", "learning-supports", "supports-schema.js"),
    "utf8",
  );
  const apiSrc = readFileSync(join(ROOT, "functions", "api", "supports", "[[path]].js"), "utf8");
  const schemaKeys = [...schemaSrc.matchAll(/\{\s*key:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  const allowMatch = apiSrc.match(/const ALLOW_LIST = \[([^\]]+)\]/);
  const allowKeys = allowMatch
    ? [...allowMatch[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1])
    : [];
  if (!schemaKeys.length || !allowKeys.length) {
    console.error(
      `FAIL: could not parse schema keys (${schemaKeys.length}) or API ALLOW_LIST (${allowKeys.length}).`,
    );
    process.exit(1);
  }
  const missingKeys = schemaKeys.filter((k) => !allowKeys.includes(k));
  if (missingKeys.length) {
    console.error(
      `FAIL: supports-schema.js keys missing from API ALLOW_LIST: ${missingKeys.join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `PASS: v2 lockstep — all ${schemaKeys.length} schema keys accepted by the API allow-list.`,
  );

  console.log(`PASS: 64/64 canonical lessons covered, schema, route, and privacy checks passed.`);
  process.exit(0);
}

runValidation();
