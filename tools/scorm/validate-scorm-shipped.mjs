#!/usr/bin/env node
/**
 * validate-scorm-shipped.mjs — judge the ZIPs that are actually ON DISK.
 *
 * `validate:scorm:fleet` builds every package in memory and validates the bytes
 * it just produced. That proves the BUILDER is correct. It cannot say anything
 * about `scorm-packages/`, which is what a teacher opens and uploads — and that
 * folder is where the two problems below were found:
 *
 *   1. THREE GENERATIONS SIDE BY SIDE. scorm-packages/ is gitignored and purely
 *      additive: nothing prunes it. It accumulated `neft-lesson-*.zip`,
 *      `Neft_*_Interactive_SCORM.zip`, `EduWonderLab_*_SCORM.zip` and the
 *      current, unprefixed `<id>_<Title>_SCORM.zip` — 1019 files for 433
 *      distinct activities.
 *      277 old packages carry the SAME <manifest identifier> as a current one,
 *      so an LMS that keys on the manifest id sees a re-import of an activity
 *      the teacher believes is new, and the upload picker offers three files
 *      per lesson with no way to tell which is live.
 *
 *   2. A STALE PACKAGE STILL LAUNCHES. Every package iframes the live site, so
 *      an old ZIP does not look broken — it quietly points at whatever URL it
 *      was built with. Only the bytes on disk can tell you which.
 *
 * This gate never deletes anything. It reports what is there and fails on the
 * conditions that would actually hurt an import.
 *
 * Run:  npm run validate:scorm:shipped
 * Exit: 0 = clean, 1 = a problem, 3 = the folder is absent (nothing verified).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exitSkipped } from "../lib/skip-exit.mjs";
import { readZip } from "./zip-read.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = join(ROOT, "scorm-packages");

// Anything that only resolves on a developer's machine or a preview deploy.
// A package carrying one of these launches to nothing in a real classroom.
const DEV_ORIGIN =
  /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local\b|\.pages\.dev|\.workers\.dev|ngrok|file:\/\//i;
const TEACHER_LEAKS = [
  ["teacher PIN", /TeacherNeft/],
  ["teacher key", /TEACHER_KEY|neft\.teacher\.key/],
  ["teacher-only route", /\/teacher-tools\/|teacher-notes|answer-key|answerKey/i],
  ["teacher mode flag", /nt-teacher-mode/],
  ["api secret", /(api[_-]?secret|bearer\s+[A-Za-z0-9._-]{16,})/i],
  ["test scaffolding", /mock-lms/],
];
const UNSAFE_PATH = /^(\/|[A-Za-z]:)|(^|\/)\.\.(\/|$)|%2e%2e/i;
const NMTOKEN = /^[A-Za-z0-9._\-:]+$/;

if (!existsSync(DIR))
  exitSkipped(
    "scorm-packages/ does not exist",
    "Build the packages first: npm run scorm:build:all",
  );

const zips = readdirSync(DIR)
  .filter((f) => f.toLowerCase().endsWith(".zip"))
  .sort();
if (!zips.length) exitSkipped("scorm-packages/ holds no .zip files", "npm run scorm:build:all");

const problems = [];
const stale = [];
const byManifestId = new Map();
let entriesSeen = 0;

for (const name of zips) {
  const P = (m) => problems.push(`${name}: ${m}`);
  let entries;
  try {
    entries = readZip(readFileSync(join(DIR, name)));
  } catch (e) {
    P(`will not open — ${e.message}`);
    continue;
  }
  entriesSeen += entries.length;
  const byName = new Map(entries.map((e) => [e.name, e]));
  for (const e of entries)
    if (UNSAFE_PATH.test(e.name)) P(`entry "${e.name}" can escape extraction`);

  const mf = byName.get("imsmanifest.xml");
  if (!mf) {
    P("no imsmanifest.xml at the archive root — no LMS can import this");
    continue;
  }
  const xml = mf.text();
  if (!/<manifest[\s>]/.test(xml) || !/<\/manifest>/.test(xml)) P("manifest is not well-formed");
  if (!/ADL SCORM/.test(xml) || !/<schemaversion>\s*1\.2/.test(xml))
    P("manifest does not declare SCORM 1.2");
  if (!/imsproject\.org\/xsd\/imscp_rootv1p1p2/.test(xml)) P("missing IMS packaging namespace");
  if (!/adlnet\.org\/xsd\/adlcp_rootv1p2/.test(xml)) P("missing ADL SCORM 1.2 namespace");
  if (!/adlcp:scormtype="sco"/.test(xml)) P("no resource is declared as an SCO");

  const mid = /<manifest\s+identifier="([^"]+)"/.exec(xml)?.[1];
  if (!mid) P("manifest has no identifier");
  else if (!NMTOKEN.test(mid)) P(`identifier "${mid}" is not a valid XML NMTOKEN`);
  else {
    if (!byManifestId.has(mid)) byManifestId.set(mid, []);
    byManifestId.get(mid).push(name);
  }

  const href = /<resource[^>]*\shref="([^"]+)"/.exec(xml)?.[1];
  if (!href) P("no launch resource href");
  else if (!byName.has(href)) P(`launch href "${href}" is not in the archive`);
  for (const m of xml.matchAll(/<file\s+href="([^"]+)"\s*\/?>/g))
    if (!byName.has(m[1])) P(`manifest declares "${m[1]}", which is not in the archive`);

  for (const e of entries) {
    const text = e.text();
    for (const [label, re] of TEACHER_LEAKS)
      if (re.test(text)) P(`packaged ${label} in "${e.name}"`);
    for (const u of text.matchAll(/https?:\/\/[A-Za-z0-9._:/-]+/g))
      if (DEV_ORIGIN.test(u[0])) P(`dev-only reference "${u[0]}" in "${e.name}"`);
  }
}

// Names produced by the builder today: <id>_<Short_Title>_SCORM.zip, with none
// of the retired generation prefixes (`neft-`, `Neft_`, `EduWonderLab_`).
const CURRENT_NAME = /^(?!neft[-_]|EduWonderLab_)[A-Za-z0-9._-]+_SCORM\.zip$/i;

// A duplicated manifest identifier is the stale-generation signature. Name the
// current package (the one the builder produces today) and list what shadows it.
for (const [mid, names] of byManifestId)
  if (names.length > 1) {
    // Which of the shadowing files is the one the builder produces TODAY? The
    // detector used to key on the "EduWonderLab_" prefix, which is exactly the
    // thing the current generation dropped — so it is now the negative test:
    // current names carry neither the `neft-` nor the `Neft_` nor the brand
    // prefix of the three older generations.
    const current = names.find((n) => CURRENT_NAME.test(n));
    stale.push(
      `identifier "${mid}" is carried by ${names.length} packages: ${names.join(", ")}` +
        (current ? ` — current is ${current}` : ""),
    );
  }

console.log("SCORM shipped-package validation (scorm-packages/)\n");
console.log(`  packages on disk    : ${zips.length}`);
console.log(`  entries read        : ${entriesSeen}`);
console.log(`  distinct manifest ids: ${byManifestId.size}`);

if (stale.length) {
  console.log(`\n  ${stale.length} identifier(s) shared by more than one package on disk:`);
  for (const s of stale.slice(0, 8)) console.log(`   · ${s}`);
  if (stale.length > 8) console.log(`   · …and ${stale.length - 8} more`);
  console.log(
    "\n  These are older generations that nothing prunes. An LMS keying on the\n" +
      "  manifest identifier treats the import as a repeat of an activity the\n" +
      "  teacher believes is new, and the upload picker cannot show which file is\n" +
      "  live. Clear the folder and rebuild: rm -rf scorm-packages && npm run scorm:build:all",
  );
}

if (problems.length) {
  console.log(`\nFAIL — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 40)) console.log("  ✗ " + p);
  if (problems.length > 40) console.log(`  …and ${problems.length - 40} more`);
  process.exit(1);
}

if (stale.length) {
  console.log("\nRESULT: FAIL ❌ (every archive is valid, but the folder ships duplicates)");
  process.exit(1);
}

console.log("\nRESULT: PASS ✅ (every shipped archive opens, validates and is unambiguous)");
