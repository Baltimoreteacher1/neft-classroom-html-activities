#!/usr/bin/env node
/**
 * validate-printables-fresh.mjs — fail if any lessons/<id>/printable.html is
 * stale against its config.json source.
 *
 * Editing lesson content without re-running the generator leaves the checked-in
 * printable carrying superseded text, so a student's printout disagrees with
 * what is on screen. This regenerates into a scratch copy and diffs; it never
 * writes to the working tree.
 *
 * Usage: node scripts/validate-printables-fresh.mjs
 * Exit 0 = fresh, 1 = stale (lists the files), 2 = could not run.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();
const GENERATOR = join(ROOT, "scripts", "generate-printable-lesson.mjs");

if (!existsSync(GENERATOR)) {
  console.error(
    "validate-printables: generator not found at scripts/generate-printable-lesson.mjs",
  );
  process.exit(2);
}

const listPrintables = () =>
  execFileSync("git", ["ls-files", "lessons/*/printable.html"], { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

const tracked = listPrintables();
if (tracked.length === 0) {
  console.error("validate-printables: no tracked printables found — is this the classroom repo?");
  process.exit(2);
}

const before = new Map(tracked.map((f) => [f, readFileSync(join(ROOT, f), "utf8")]));

// Regenerate in a scratch clone of the working tree so the real tree is untouched.
const scratch = mkdtempSync(join(tmpdir(), "printables-fresh-"));
let stale = [];
try {
  // tools/lib rides along because generators import the curriculum-source seam
  // (and its own import.meta.url-derived root then correctly points at the scratch).
  for (const dir of ["lessons", "scripts", "engine", "shared", "assets", "tools/lib"]) {
    const src = join(ROOT, dir);
    if (existsSync(src)) cpSync(src, join(scratch, dir), { recursive: true });
  }
  for (const f of ["package.json"]) {
    if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(scratch, f));
  }

  execFileSync(process.execPath, [join(scratch, "scripts", "generate-printable-lesson.mjs")], {
    cwd: scratch,
    stdio: "pipe",
  });

  stale = tracked.filter((f) => {
    const regenerated = join(scratch, f);
    if (!existsSync(regenerated)) return false; // generator does not own this one
    return readFileSync(regenerated, "utf8") !== before.get(f);
  });
} catch (err) {
  console.error("validate-printables: generator failed to run in scratch tree");
  console.error(String(err.stderr || err.message || err).slice(0, 800));
  process.exit(2);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (stale.length) {
  console.error(
    `validate-printables: ${stale.length} stale printable(s) — source changed without regenerating:`,
  );
  for (const f of stale) console.error(`  ${f}`);
  console.error(
    "\nFix: npm run generate-printable-lessons  (or npm run build), then commit the result.",
  );
  process.exit(1);
}

console.log(`validate-printables: PASS — ${tracked.length} printables match their sources.`);
