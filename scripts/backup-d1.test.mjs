/**
 * neft-student-progress is the only data on this project that cannot be rebuilt
 * from source, and as of 2026-07-30 the nightly workflow had never once
 * succeeded — so this script's failure paths have never actually executed.
 *
 * The one pinned here is the dangerous one. The restore check shells out to
 * `sqlite3`; if that binary is missing the spawn throws, and before this guard
 * the throw landed in verifyRestore's catch and printed "the dump does not
 * replay into SQLite — it is NOT restorable". "The backup is corrupt" and "the
 * tool that inspects backups is absent" are opposite conclusions, and reporting
 * the second as the first is how someone throws away a good export.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "backup-d1.mjs");

const work = mkdtempSync(join(tmpdir(), "backup-d1-test-"));
const emptyBin = mkdtempSync(join(tmpdir(), "backup-d1-nobin-"));

// An empty PATH guarantees `sqlite3` cannot be found regardless of the host.
// node itself still runs — spawnSync invokes it by absolute path.
const res = spawnSync(process.execPath, [SCRIPT, "--out", join(work, "d1")], {
  encoding: "utf8",
  env: { ...process.env, PATH: emptyBin },
});

assert.notEqual(res.status, 0, "a missing sqlite3 must fail the run");
assert.match(res.stderr, /sqlite3 is not installed/, "the failure must name the missing tool");
assert.doesNotMatch(
  res.stderr,
  /NOT restorable|does not replay/,
  "a missing checker must never be reported as an unrestorable backup",
);

// It must also give up BEFORE the export: verification is impossible either
// way, so there is no reason to pull the whole database down first.
assert.doesNotMatch(res.stdout, /Exporting/, "must fail before spending the export");

console.log("backup-d1: a missing sqlite3 fails honestly, before the export, not as a bad backup");
