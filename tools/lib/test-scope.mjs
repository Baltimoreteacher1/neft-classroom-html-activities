// Test-impact scoping: decide which test scripts a change can affect.
//
// WHY: `npm test` runs ~350 node scripts (~55s of wall time) and almost every
// QA coverage rule lists it, so even a one-file change paid for all of them.
//
// HOW (sound by construction, default-deny):
//   1. tools/lib/test-trace-preload.mjs records every repo file a test script
//      actually touches — fs reads, directory listings, ESM/CJS module loads.
//   2. data/test-reads.json stores that set per test (see `npm run test:reads`).
//   3. A test is selected when a changed path is in its set, under a directory
//      it listed, or is the test itself.
// A test's outcome is a function of the files it reads, so a test none of whose
// files changed cannot change outcome. Everything this cannot see is ALWAYS RUN:
//   - a test that spawns a subprocess or worker (what the child reads is unseen)
//   - a test that reads dist/ or .git/ (derived from the whole tree)
//   - a test that reads an untracked/ignored file (a build product whose inputs
//     are other files)
//   - a test absent from the manifest
//   - any change to package.json, the lockfile, the runner or this tooling
// Reads the manifest does not list are caught as DRIFT by `verifyReads`, so a
// stale manifest fails loudly instead of silently under-selecting.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const MANIFEST_PATH = "data/test-reads.json";
export const COLLAPSE_AT = 20;

/** A change to any of these can alter what every test does or what the manifest means. */
export const GLOBAL_TRIGGERS = new Set([
  "package.json",
  "package-lock.json",
  "tools/run-tests.mjs",
  "tools/lib/test-scope.mjs",
  "tools/lib/test-trace-preload.mjs",
  MANIFEST_PATH,
]);

const toDir = (d) => (d.endsWith("/") ? d : `${d}/`);

/** Fold many file reads under one prefix into a directory dependency (over-approximates, never under). */
export function collapse(files, dirs = [], threshold = COLLAPSE_AT) {
  const dirSet = new Set(dirs.map(toDir));
  const covered = (p) => [...dirSet].some((d) => p.startsWith(d));
  let rest = [...new Set(files)].filter((p) => !covered(p));
  for (const depth of [2, 1]) {
    const groups = new Map();
    for (const p of rest) {
      const seg = p.split("/");
      if (seg.length <= depth) continue; // a file directly at this level has no prefix to fold into
      const key = `${seg.slice(0, depth).join("/")}/`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    for (const [key, n] of groups) if (n > threshold) dirSet.add(key);
    rest = rest.filter((p) => !covered(p));
  }
  const kept = [...dirSet].filter((d) => ![...dirSet].some((o) => o !== d && d.startsWith(o)));
  return { files: rest.sort(), dirs: kept.sort() };
}

/** Turn one raw trace into a manifest entry. `isTracked(path)` says whether git knows the file. */
export function entryFromTrace(trace, { isTracked, existsRel }) {
  if (trace.wide) return { wide: trace.wide };
  const generated = trace.files.find((p) => existsRel(p) && !isTracked(p));
  if (generated) return { wide: `reads untracked file ${generated}` };
  return collapse(trace.files, trace.dirs);
}

export const covers = (entry, path) =>
  entry.files?.includes(path) || (entry.dirs ?? []).some((d) => path.startsWith(d));

/**
 * Reads in `trace` that `entry` does not account for. Empty means the manifest is
 * still sound for this test; anything else means scoping could under-select it.
 */
export function verifyReads(entry, trace, helpers) {
  if (entry.wide) return [];
  const actual = entryFromTrace(trace, helpers);
  if (actual.wide) return [`now ${actual.wide}`];
  const missing = [];
  for (const p of trace.files) if (!covers(entry, p)) missing.push(p);
  for (const d of trace.dirs) if (!covers(entry, toDir(d))) missing.push(`${toDir(d)} (listed)`);
  return missing;
}

export function loadManifest(root) {
  const path = join(root, MANIFEST_PATH);
  if (!existsSync(path)) return null;
  try {
    const m = JSON.parse(readFileSync(path, "utf8"));
    return m && m.version === 1 && m.tests ? m : null;
  } catch {
    return null;
  }
}

/** One test per line so concurrent edits to different tests merge cleanly in git. */
export function serializeManifest(tests) {
  const lines = Object.keys(tests)
    .sort()
    .map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(tests[k])}`);
  return `{\n  "version": 1,\n  "tests": {\n${lines.join(",\n")}\n  }\n}\n`;
}

/**
 * Pick the tests to run. `all` is the discovered set (repo-relative). Returns
 * the selected list plus a human-readable account of why anything was widened.
 */
export function selectTests(all, manifest, changed) {
  const everything = (why) => ({ selected: [...all], why, scoped: false });
  if (!manifest) return everything("no data/test-reads.json (run `npm run test:reads`)");
  if (changed.length === 0) return everything("no change list");
  // Node reads the nearest package.json ("type", "exports") whenever it loads a
  // module, below the layer the tracer can see — so any of them is global.
  const trigger = changed.find((p) => GLOBAL_TRIGGERS.has(p) || p.endsWith("/package.json"));
  if (trigger) return everything(`${trigger} changed`);
  const counts = { wide: 0, unlisted: 0, hit: 0 };
  const selected = all.filter((t) => {
    const entry = manifest.tests[t];
    if (!entry) {
      counts.unlisted++;
      return true;
    }
    if (entry.wide) {
      counts.wide++;
      return true;
    }
    if (changed.includes(t) || changed.some((p) => covers(entry, p))) {
      counts.hit++;
      return true;
    }
    return false;
  });
  return {
    selected,
    scoped: true,
    why: `${counts.hit} affected by ${changed.length} changed file(s), ${counts.wide} always run (opaque), ${counts.unlisted} not in manifest`,
  };
}
