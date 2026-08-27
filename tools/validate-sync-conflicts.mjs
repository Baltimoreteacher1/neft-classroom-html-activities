#!/usr/bin/env node
/**
 * validate-sync-conflicts — refuse to run against a tree iCloud has duplicated.
 *
 * This repo lives in ~/Documents, which is synced by iCloud Drive ("Desktop &
 * Documents Folders"). A second full clone — 3.7 GB, its own .git — sits in
 * ~/Library/Mobile Documents/.../EduWonderLab/reveal-math-activities, and it
 * carried 338 duplicate-named files of its own. When iCloud cannot reconcile a
 * file it does not fail; it writes a SECOND copy beside the original with a
 * numeric suffix: "index 3.html", "zz-gate-mutation 2.css", ".probe 2.mjs".
 *
 * Those copies are not inert. In a single session on 2026-08-27 they broke four
 * gates in three different ways, and every one of them was RIGHT while the repo
 * was fine:
 *
 *   gate-mutation           "the harness left files behind: zz-gate-mutation 2.html"
 *   validate:static         "lessons/zz-gate-mutation 3.html: missing <!DOCTYPE html>"
 *   validate:injection      sentinel counts off, from a duplicated injected page
 *   validate:css-integrity  a duplicated stylesheet parsed as a second copy
 *
 * Read cold, those look like four unrelated defects in the code under test. The
 * cost is not the cleanup — it is the diagnosis, twice over, on a tree that was
 * never broken. This check names the cause in one line, first, so nobody spends
 * that time again. It is deliberately the CHEAPEST gate in the suite.
 *
 * A build never emits these names, and no authored file in this repo is named
 * "<something> <digit>.<ext>", so the pattern is unambiguous. Files git already
 * tracks are exempt: if a duplicate was ever committed on purpose, that is a
 * content decision and not this gate's business.
 *
 * The real cure is to stop syncing a git working tree through iCloud — see
 * docs/icloud-sync.md. This gate makes the symptom loud until that happens.
 */

import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// "name 2.ext" / "name 12.ext", and extensionless "name 2".
const CONFLICT = /(^|\/)[^/]+ \d+(\.[A-Za-z0-9]+)?$/;

export function isSyncConflictName(path) {
  return CONFLICT.test(String(path || ""));
}

function selfTest() {
  const cases = [
    ["lessons/zz-gate-mutation 3.html", true],
    ["assets/zz-gate-mutation 2.css", true],
    ["math/unit-6/pemdas-alchemy/index 4.html", true],
    [".probe 2.mjs", true],
    ["data/lesson-id-sequencing-review 2.json", true],
    // Ordinary names that merely CONTAIN digits must not fire.
    ["lessons/2-7/config.json", false],
    ["assets/curriculum-hub-search.js", false],
    ["docs/standards/scope-and-sequence.md", false],
    ["lessons/10-1/index.html", false],
    ["engine/components/long-division-builder.js", false],
    // A digit directly attached to the name is not a conflict copy.
    ["assets/unit2.css", false],
  ];
  const bad = cases.filter(([p, want]) => isSyncConflictName(p) !== want);
  for (const [p, want] of bad) {
    console.error(`  SELF-TEST FAIL: ${p} — expected ${want}, got ${!want}`);
  }
  return { total: cases.length, failed: bad.length };
}

// Importable: scripts/clean-sync-conflicts.mjs reuses isSyncConflictName, and a
// module that sweeps and exits at import time would run the GATE instead of the
// cleaner — which is exactly what it did on first use.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!invokedDirectly) {
  // Nothing else to do; the pure detector above is the export.
} else {
  main();
}

function main() {
  const st = selfTest();
  if (st.failed) {
    console.error(`FAIL validate:sync-conflicts — ${st.failed}/${st.total} self-tests failed.`);
    process.exit(1);
  }

  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const hits = untracked.filter(isSyncConflictName);

  if (hits.length === 0) {
    console.log(
      `PASS validate:sync-conflicts — no iCloud conflict copies in the tree (self-tests ${st.total}/${st.total}).`,
    );
    process.exit(0);
  }

  console.error(
    `FAIL validate:sync-conflicts — ${hits.length} iCloud conflict cop(y/ies) in the tree.`,
  );
  console.error("");
  console.error("  These are NOT defects in the code under test. iCloud wrote a second copy");
  console.error("  of a file it could not reconcile, and the copies break gates that walk the");
  console.error("  filesystem — static structure, injection sentinels, CSS integrity, and the");
  console.error("  mutation harness's leftover-file check — as if the repo were broken.");
  console.error("");
  for (const h of hits.slice(0, 20)) console.error(`    ${h}`);
  if (hits.length > 20) console.error(`    ...and ${hits.length - 20} more`);
  console.error("");
  console.error("  Move them out of the tree (they are untracked, so nothing is lost):");
  console.error("    npm run clean:sync-conflicts");
  console.error("");
  console.error("  Permanent fix — stop syncing a git working tree through iCloud:");
  console.error("    docs/icloud-sync.md");
  console.error("");
  process.exit(1);
}
