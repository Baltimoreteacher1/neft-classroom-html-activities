#!/usr/bin/env node
/**
 * The seeded pacing baseline must match what its importer would write.
 *
 * `data/pacing-baseline-2026-27.json` and `data/pacing-unit-ranges.json` are
 * GENERATED, and both are read at runtime — the first by the planner, the second
 * by the student-facing units hub. A hand edit to either is invisible: the file
 * still parses, the page still renders, and the two copies of the unit date
 * ranges quietly stop agreeing, which is the exact defect the ranges file was
 * added to close.
 *
 * This is `--check` on the importer, run as an ordinary test so it gates every
 * push rather than waiting for someone to think of running it.
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

try {
  const out = execFileSync("node", ["tools/import-pacing-baseline.mjs", "--check"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  process.stdout.write(out);
  console.log("PASS pacing baseline is what the importer would write");
} catch (err) {
  console.error(err.stdout || "");
  console.error(err.stderr || "");
  console.error(
    "FAIL the pacing baseline on disk does not match its source.\n" +
      "     Either re-run `node tools/import-pacing-baseline.mjs`, or — if this was a\n" +
      "     hand edit — make the change in data/pacing/sources/ instead. Live pacing\n" +
      "     changes belong in the planner (D1), never in the seed.",
  );
  process.exit(1);
}
