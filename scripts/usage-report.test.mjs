/**
 * The usage report is the input to "what should we build next?" and "what is
 * safe to retire?" (see CLAUDE.md). Until 2026-07-30 it caught every query
 * failure, substituted an empty result set, and wrote a confident report:
 * six failed D1 queries rendered as "222 have never been opened", listed under
 * a "prune candidates" heading, exit code 0.
 *
 * These two cases pin the distinction the script has to keep making:
 *   1. a query that FAILS must abort and write nothing;
 *   2. a query that legitimately returns NO ROWS must still produce a report.
 *
 * Both run the real CLI in a scratch cwd, so neither can clobber the repo's
 * reports/usage-report.md.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "usage-report.mjs");

function runIn(cwd, args, extraPath = null) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    encoding: "utf8",
    env: extraPath ? { ...process.env, PATH: `${extraPath}:${process.env.PATH}` } : process.env,
  });
}

/* -- 1. a failing query aborts, loudly, without writing ------------------- */
{
  const cwd = mkdtempSync(join(tmpdir(), "usage-report-fail-"));
  // A database under a directory that does not exist: sqlite3 cannot open it,
  // and where sqlite3 is not installed at all the spawn fails outright. Either
  // way `query()` throws, which is the condition under test.
  const res = runIn(cwd, ["--db", join(cwd, "no-such-dir", "missing.sqlite")]);

  assert.notEqual(res.status, 0, "a failed query must exit non-zero");
  assert.equal(
    existsSync(join(cwd, "reports", "usage-report.md")),
    false,
    "a failed query must not write a report — a fabricated report is worse than none",
  );
  assert.match(res.stderr, /ABORTED/, "the abort must be unmissable in stderr");
  assert.match(res.stderr, /lessonEvents/, "stderr must name which query failed");
  assert.doesNotMatch(
    res.stdout,
    /never been opened|prune candidates/,
    "stdout must not report absence-of-data as absence-of-usage",
  );
}

/* -- 2. a genuinely empty database still reports ------------------------- */
{
  const cwd = mkdtempSync(join(tmpdir(), "usage-report-empty-"));
  const bin = join(cwd, "bin");
  mkdirSync(bin);
  // Stand-in for sqlite3 that answers every query with zero rows — the shape of
  // a real database that nobody has used yet.
  const stub = join(bin, "sqlite3");
  writeFileSync(stub, "#!/bin/sh\necho '[]'\n");
  chmodSync(stub, 0o755);

  const res = runIn(cwd, ["--db", join(cwd, "empty.sqlite")], bin);

  assert.equal(res.status, 0, `an empty database is a finding, not a failure:\n${res.stderr}`);
  assert.equal(
    existsSync(join(cwd, "reports", "usage-report.md")),
    true,
    "an empty database must still produce a report",
  );
  assert.match(res.stdout, /0 events/, "the empty report should state zero events");
}

console.log("usage report: query failure aborts without writing; empty database still reports");
