#!/usr/bin/env node
/**
 * validate-deps-installed — lockfile <-> node_modules integrity preflight.
 *
 * Why this exists. On 2026-08-18 a full verification cycle (qa:loop, npm test,
 * validate:production — three stages, ~10 minutes) failed on every gate at once
 * because `web-vitals` was declared in package.json and present in
 * package-lock.json but absent from node_modules. Nothing said so. What the
 * operator saw was:
 *
 *     error during build:
 *     Error: [vite]: Rolldown failed to resolve import "web-vitals"
 *       from "assets/nt-web-vitals.js"
 *
 * `build` is the barrier ahead of every other check in scripts/qa-run.mjs, so
 * its failure reported all 76 checks as FAILED, and validate:lesson-boot then
 * failed 6 pages with "Failed to resolve module specifier web-vitals" — which
 * reads exactly like a broken lesson shell. The branch under test was blamed
 * for a stale install, and the cycle was only recovered by hand-building bare
 * origin/main to prove the failure pre-existed the branch.
 *
 * A resolve error names the IMPORT. It never names the cause, because a
 * bundler cannot tell "this package was never declared" (a real defect, fix the
 * code) from "this package is declared and locked but not on disk" (an
 * environment fault, run npm ci). Those two have opposite remedies and the same
 * message. This check runs BEFORE the bundler and separates them, so the
 * environment fault announces itself in the one sentence that fixes it.
 *
 * It compares the lockfile against the tree in both directions that matter:
 *   MISSING  — locked, required on this platform, not on disk.
 *   MISMATCH — on disk at a version the lockfile does not describe (the state
 *              a hand-run `npm install <pkg>` leaves behind).
 * Extraneous packages are NOT failed: a stray directory breaks nothing, and
 * failing on it would make the check fire on ordinary local experimentation.
 *
 * Platform-conditional packages are skipped by their own `os`/`cpu` fields, and
 * `optional` entries are skipped entirely — npm is permitted not to install
 * them, so requiring them would make this gate fail on a healthy tree (fsevents
 * on Linux CI is the standing example).
 *
 * Self-tests every detector against synthetic fixtures before reading the real
 * tree: a gate that has stopped firing reports a perfectly installed repo.
 *
 * Usage:  node tools/validate-deps-installed.mjs [--self-test-only] [--quiet]
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------------------------------------------------------- pure core */

/** Does a locked entry apply to the platform we are running on? */
export function appliesToPlatform(entry, platform, arch) {
  const listOk = (list, actual) => {
    if (!Array.isArray(list) || list.length === 0) return true;
    const negations = list.filter((v) => v.startsWith("!"));
    // npm semantics: a list of negations is an exclude-list; otherwise allow-list.
    if (negations.length === list.length) return !list.includes(`!${actual}`);
    return list.includes(actual);
  };
  return listOk(entry.os, platform) && listOk(entry.cpu, arch);
}

/** Should this lockfile entry be required to exist on disk? */
export function isRequired(name, entry, platform, arch) {
  if (!name.startsWith("node_modules/")) return false; // root "" and workspaces
  if (!entry || typeof entry !== "object") return false;
  if (entry.link) return false; // workspace symlink, not a fetched package
  if (entry.optional) return false; // npm may legitimately skip it
  if (entry.extraneous) return false;
  if (!entry.version) return false; // nothing to compare against
  return appliesToPlatform(entry, platform, arch);
}

/**
 * Compare a lockfile's packages map against a tree.
 * `readVersion(path)` returns the installed version, or null if absent.
 */
export function auditLock(packages, readVersion, platform, arch) {
  const missing = [];
  const mismatched = [];
  let checked = 0;
  for (const [name, entry] of Object.entries(packages || {})) {
    if (!isRequired(name, entry, platform, arch)) continue;
    checked++;
    const onDisk = readVersion(name);
    if (onDisk === null) {
      missing.push({ name, want: entry.version });
    } else if (onDisk !== entry.version) {
      mismatched.push({ name, want: entry.version, got: onDisk });
    }
  }
  return { missing, mismatched, checked };
}

/* ------------------------------------------------------------- self-tests */

function selfTest() {
  const cases = [];
  const t = (label, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    cases.push({ label, ok, actual, expected });
  };

  // Detector 1: the exact shipped failure — locked, declared, not installed.
  t(
    "a locked package absent from disk is MISSING",
    auditLock({ "node_modules/web-vitals": { version: "6.0.1" } }, () => null, "darwin", "arm64")
      .missing,
    [{ name: "node_modules/web-vitals", want: "6.0.1" }],
  );

  // Detector 2: installed at the wrong version.
  t(
    "a wrong installed version is MISMATCH",
    auditLock({ "node_modules/vite": { version: "7.0.0" } }, () => "6.1.0", "darwin", "arm64")
      .mismatched,
    [{ name: "node_modules/vite", want: "7.0.0", got: "6.1.0" }],
  );

  // A healthy tree must be silent, or the gate cries wolf every run.
  const healthy = auditLock(
    { "node_modules/vite": { version: "7.0.0" } },
    () => "7.0.0",
    "darwin",
    "arm64",
  );
  t("a correctly installed package is clean", [healthy.missing, healthy.mismatched], [[], []]);

  // optional packages: npm is allowed to skip them.
  t(
    "an absent optional package is not a failure",
    auditLock(
      { "node_modules/fsevents": { version: "2.3.3", optional: true } },
      () => null,
      "linux",
      "x64",
    ).missing,
    [],
  );

  // platform gating, both directions.
  t(
    "an os-mismatched package is not required",
    auditLock(
      { "node_modules/mac-only": { version: "1.0.0", os: ["darwin"] } },
      () => null,
      "linux",
      "x64",
    ).missing,
    [],
  );
  t(
    "an os-MATCHED package is still required",
    auditLock(
      { "node_modules/mac-only": { version: "1.0.0", os: ["darwin"] } },
      () => null,
      "darwin",
      "arm64",
    ).missing,
    [{ name: "node_modules/mac-only", want: "1.0.0" }],
  );
  t(
    "a negated os list excludes only that os",
    appliesToPlatform({ os: ["!win32"] }, "win32"),
    false,
  );
  t(
    "a negated os list admits everything else",
    appliesToPlatform({ os: ["!win32"] }, "darwin"),
    true,
  );

  // workspace links and the root entry are not fetched packages.
  t(
    "a workspace link is not required",
    auditLock(
      { "node_modules/my-pkg": { link: true, resolved: "packages/x" } },
      () => null,
      "darwin",
      "arm64",
    ).missing,
    [],
  );
  t(
    "the root lockfile entry is ignored",
    auditLock({ "": { name: "root", version: "1.0.0" } }, () => null, "darwin", "arm64").missing,
    [],
  );

  // An extraneous on-disk package is deliberately NOT a failure.
  t(
    "nothing is reported for packages absent from the lockfile",
    auditLock({}, () => "9.9.9", "darwin", "arm64").checked,
    0,
  );

  const failed = cases.filter((c) => !c.ok);
  for (const c of failed) {
    console.error(`  SELF-TEST FAIL: ${c.label}`);
    console.error(`    expected ${JSON.stringify(c.expected)}`);
    console.error(`    actual   ${JSON.stringify(c.actual)}`);
  }
  return { total: cases.length, failed: failed.length };
}

/* -------------------------------------------------------------------- main */

function main() {
  const quiet = process.argv.includes("--quiet");
  const st = selfTest();
  if (st.failed) {
    console.error(`FAIL validate:deps-installed — ${st.failed}/${st.total} self-tests failed.`);
    console.error("The detector itself is broken; it cannot vouch for the tree.");
    process.exit(1);
  }
  if (process.argv.includes("--self-test-only")) {
    console.log(`self-tests: ${st.total}/${st.total} passed`);
    return;
  }

  const lockPath = join(ROOT, "package-lock.json");
  if (!existsSync(lockPath)) {
    console.error("FAIL validate:deps-installed — package-lock.json is missing.");
    process.exit(1);
  }
  if (!existsSync(join(ROOT, "node_modules"))) {
    console.error("FAIL validate:deps-installed — node_modules/ does not exist.");
    console.error("\n  Run:  npm ci\n");
    process.exit(1);
  }

  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  const readVersion = (relPath) => {
    const pj = join(ROOT, relPath, "package.json");
    if (!existsSync(pj)) return null;
    try {
      return JSON.parse(readFileSync(pj, "utf8")).version ?? null;
    } catch {
      return null;
    }
  };

  const { missing, mismatched, checked } = auditLock(
    lock.packages,
    readVersion,
    process.platform,
    process.arch,
  );

  if (missing.length === 0 && mismatched.length === 0) {
    if (!quiet) {
      console.log(
        `PASS validate:deps-installed — ${checked} locked packages present at the locked version ` +
          `(self-tests ${st.total}/${st.total}).`,
      );
    }
    return;
  }

  console.error("FAIL validate:deps-installed — node_modules does not match package-lock.json.");
  console.error("");
  console.error("  This is an ENVIRONMENT fault, not a defect in the code under test.");
  console.error("  Left unfixed it surfaces later as a bundler resolve error naming the");
  console.error("  IMPORT rather than the cause, which reads like a broken source file:");
  console.error('    Error: [vite]: Rolldown failed to resolve import "<pkg>"');
  console.error("");
  if (missing.length) {
    console.error(`  MISSING (${missing.length}) — locked, required here, not on disk:`);
    for (const m of missing.slice(0, 20)) {
      console.error(`    ${m.name.replace(/^node_modules\//, "")}@${m.want}`);
    }
    if (missing.length > 20) console.error(`    ...and ${missing.length - 20} more`);
    console.error("");
  }
  if (mismatched.length) {
    console.error(`  VERSION MISMATCH (${mismatched.length}) — on disk at an unlocked version:`);
    for (const m of mismatched.slice(0, 20)) {
      console.error(
        `    ${m.name.replace(/^node_modules\//, "")}  locked ${m.want}  installed ${m.got}`,
      );
    }
    if (mismatched.length > 20) console.error(`    ...and ${mismatched.length - 20} more`);
    console.error("");
  }
  console.error("  Run:  npm ci");
  console.error("");
  process.exit(1);
}

main();
