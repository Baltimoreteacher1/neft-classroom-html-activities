#!/usr/bin/env node
/**
 * build-scorm.mjs — package a Neft lesson as a SCORM 1.2 zip for Canvas upload.
 *
 * The zip plays the LIVE lesson inside Canvas and auto-reports the score to the
 * gradebook (no codes, no CSV). Because content stays on the live site, editing
 * a lesson does NOT require re-uploading the package.
 *
 * SINGLE SOURCE OF TRUTH: the SCO and manifest come from functions/_lib/scorm.js
 * — the same code /api/scorm serves — and the bytes come from the same
 * assets/lib/zip-store.js writer. This file used to fill its own copy of the SCO
 * from tools/scorm/template/, kept in step with the live builder by a list of
 * invariant strings in validate-sco.mjs. That list could only pin the invariants
 * someone thought to add: every hardening fix had to be applied twice, and a
 * teacher downloading from the site and a teacher running this script could get
 * materially different packages. There is now one implementation, so there is
 * nothing to keep in lockstep.
 *
 * It also no longer shells out to `zip`, which made output non-deterministic
 * (timestamps) and interpolated the lesson id straight into a shell command.
 *
 * Usage:
 *   node tools/scorm/build-scorm.mjs <lessonId | /path/ | url> ["Title"] [--codes]
 *   npm run scorm -- 1-3 "Unit 1 Lesson 3: Ratios"
 *
 * Env: NEFT_SITE overrides the base site (default https://eduwonderlab.com).
 * Output: scorm-packages/<Teacher-Readable-Name>.zip
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { buildScormFiles, packageFileName, zipStore } from "../../functions/_lib/scorm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --codes / --sheets (anywhere on the line) launches the activity in normal
// student mode so the save-code prompt shows and progress flows to the Google
// Sheets gradebook. Default mode keeps the Canvas auto-grade (SCORM) behavior.
const rawArgs = process.argv.slice(2);
const CODES_MODE = rawArgs.some((a) => a === "--codes" || a === "--sheets");
// Third argument is an explicit package id. The Canvas packages page names its
// own packages and then copies them by that name, so dropping this silently
// broke all 84 homework packages with ENOENT.
const [target, titleArg, idArg] = rawArgs.filter((a) => !a.startsWith("--"));

if (!target) {
  console.error(
    'Usage: node tools/scorm/build-scorm.mjs <lessonId | /path/ | url> ["Title"] [--codes]\n' +
      "  Examples:\n" +
      '    node tools/scorm/build-scorm.mjs 1-3 "Unit 1 Lesson 3"   # Canvas auto-grade\n' +
      '    node tools/scorm/build-scorm.mjs 1-3 "Unit 1 Lesson 3" --codes  # → Google Sheets\n' +
      "    node tools/scorm/build-scorm.mjs /ratio-color-mixer/      # any activity\n" +
      "    node tools/scorm/build-scorm.mjs https://eduwonderlab.com/fractions-soccer/",
  );
  process.exit(1);
}

const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");

let pkg;
try {
  pkg = buildScormFiles(
    {
      target,
      title: titleArg,
      codes: CODES_MODE,
      id: idArg,
      // Day-granular on purpose: enough to date a package found in a Canvas
      // course later, and it keeps two builds on the same day byte-identical
      // so a re-download is comparable to the file already uploaded.
      generatedAt: new Date().toISOString().slice(0, 10),
      generator: "eduwonderlab/build-scorm.mjs",
    },
    SITE,
  );
} catch (e) {
  console.error("✗ " + (e?.message || e));
  process.exit(1);
}

const outRoot = resolve(__dirname, "../../scorm-packages");
mkdirSync(outRoot, { recursive: true });
const outFile = resolve(outRoot, packageFileName(pkg.id, pkg.codes));
writeFileSync(outFile, zipStore(pkg.files));

// The pre-upload summary. A teacher should be able to read this and know
// exactly what is about to go into Canvas without opening the zip.
console.log("✓ Canvas SCORM package built (pre-flight passed):");
console.log("  File    : " + outFile);
console.log("  Title   : " + pkg.title + "   ← what Canvas will show");
console.log("  Activity: " + pkg.id);
console.log("  Target  : " + pkg.lessonUrl + "   ← live lesson, not a bundled copy");
console.log(`  Runtime : EduWonderLab SCORM Runtime v${pkg.runtime} (protocol v${pkg.protocol})`);
console.log(
  "  Mode    : " +
    (CODES_MODE ? "save codes → Google Sheets gradebook" : "Canvas auto-grade (SCORM score)"),
);
console.log("\nNext (all manual, in Canvas):");
console.log("  1. Upload the .zip WITHOUT unzipping it, via the course's SCORM area.");
console.log("  2. Create/complete the assignment Canvas offers for the uploaded package.");
console.log("  3. Configure points and availability, then publish it.");
console.log("  4. Open it once in Student View to confirm the lesson launches.");
console.log("\nSee docs/scorm-runtime.md for the full workflow and troubleshooting codes.");
