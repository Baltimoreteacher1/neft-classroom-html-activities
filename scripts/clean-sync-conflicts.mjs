#!/usr/bin/env node
/**
 * clean-sync-conflicts — move iCloud conflict copies out of the working tree.
 *
 * MOVES, never deletes. The copies differ from their originals often enough
 * that discarding them unseen would be a guess about someone's unsaved work:
 * one of them, "data/lesson-id-sequencing-review 2.json", was the only remaining
 * trace of a file whose branch had been superseded. They go to
 * .sync-conflicts/<timestamp>/ (gitignored) so they can be read or restored.
 *
 * Only UNTRACKED files are eligible, so a duplicate that was ever committed on
 * purpose is left alone. --dry-run prints the plan and changes nothing.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isSyncConflictName } from "../tools/validate-sync-conflicts.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

const hits = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean)
  .filter(isSyncConflictName);

if (hits.length === 0) {
  console.log("clean:sync-conflicts — nothing to move.");
  process.exit(0);
}

// OUTSIDE the repo, deliberately.
//
// The first version parked these in .sync-conflicts/ inside the tree and
// gitignored it — which fixed nothing, because the gates that these files break
// walk the FILESYSTEM, not the index. validate:static promptly failed on
// ".sync-conflicts/latest/lessons/zz-gate-mutation 2.html: missing <!DOCTYPE
// html>". A quarantine inside the quarantined area is not a quarantine.
const dest = join(
  homedir(),
  ".neft-sync-conflicts",
  "reveal-math-activities",
  String(process.env.SYNC_STAMP || "latest"),
);
console.log(`${dryRun ? "[dry-run] " : ""}${hits.length} conflict cop(y/ies) -> ${dest}`);
for (const rel of hits) {
  console.log(`  ${rel}`);
  if (dryRun) continue;
  const target = join(dest, rel);
  mkdirSync(dirname(target), { recursive: true });
  if (existsSync(target)) {
    console.log("    (a copy is already parked there; leaving this one in place)");
    continue;
  }
  renameSync(join(ROOT, rel), target);
}
if (!dryRun) console.log(`\nMoved, not deleted. Read or restore them from ${dest}`);
