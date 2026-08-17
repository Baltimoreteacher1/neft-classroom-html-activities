#!/usr/bin/env node
/* =============================================================================
 * validate-drive-sync.mjs — the Drive copy must not silently ignore leftovers.
 * -----------------------------------------------------------------------------
 * Canonical curriculum lives in this repo. Google Drive is a colleague-facing
 * derivative. scripts/sync-curriculum-to-drive.mjs copies into Drive and MUST
 * NOT delete (school-owned files, permission errors, desktop-mount races).
 *
 * The failure this exists for: a sync that cannot delete treating leftovers as
 * "not our problem." A renamed lesson then leaves TWO folders; a colleague
 * opens the stale one. Reporting extras is the repair; deleting them is a
 * separately authorized operation.
 *
 * This gate never touches the real Drive mount. It:
 *   1. asserts the sync script still reads generated manifests, never a
 *      hardcoded lesson list, and never calls unlink/rm;
 *   2. runs the script against a throwaway destination that already contains
 *      an extra file, and asserts that file is reported AND still on disk.
 * ============================================================================= */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "scripts/sync-curriculum-to-drive.mjs");
const src = readFileSync(SRC, "utf8");
const failures = [];
const fail = (m) => failures.push(m);
const check = (cond, m) => {
  if (!cond) fail(m);
};

check(/curriculum-download-manifest\.json/.test(src), "sync no longer reads the download manifest");
check(/pacing-unit-ranges\.json/.test(src), "sync no longer reads district unit order");
check(
  !/ALL_LESSON_IDS|const LESSONS\s*=\s*\[/.test(src),
  "sync grew a hardcoded lesson list — Drive layout would drift from the curriculum",
);
check(
  !/\b(unlinkSync|rmSync|rmdirSync|rm\s+-rf)\b/.test(src),
  "sync gained a delete call — Drive deletion is out of scope for this task",
);
check(/--verify/.test(src), "sync lost --verify, so leftovers cannot fail a check");
check(
  /They were NOT deleted|never-delete/.test(src),
  "sync no longer states that leftovers are reported rather than ignored",
);

const dest = mkdtempSync(join(tmpdir(), "neft-drive-sync-"));
const leftover = join(dest, "STALE leftover from renamed lesson.txt");
writeFileSync(leftover, "this file must be reported and must survive\n");

let report;
try {
  execFileSync("node", [SRC, "--dry-run", "--verify", "--dest", dest], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  fail("--verify against a dest with a leftover exited 0 — leftovers are being ignored");
} catch (err) {
  check(err.status === 2, `--verify should exit 2 on leftovers, got ${err.status}`);
  const out = String(err.stdout || "");
  try {
    report = JSON.parse(out);
  } catch {
    fail(`--verify stdout was not JSON: ${out.slice(0, 200)}`);
  }
}

if (report) {
  check(report.staleTotal >= 1, "report.staleTotal did not count the leftover");
  const names = (report.staleOnDrive || []).join("\n");
  check(
    names.includes("STALE leftover from renamed lesson.txt"),
    `leftover path missing from staleOnDrive: ${names.slice(0, 300)}`,
  );
}

try {
  const still = readFileSync(leftover, "utf8");
  check(
    still.includes("must be reported"),
    "the leftover file was modified or emptied; sync must not rewrite extras",
  );
} catch {
  fail("the leftover file was deleted — sync must never delete Drive contents");
}

rmSync(dest, { recursive: true, force: true });

if (failures.length) {
  console.error("validate-drive-sync FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("✓ drive-sync: never deletes; leftovers are reported (exit 2 under --verify).");
