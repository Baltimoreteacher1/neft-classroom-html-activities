import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { lessonPath, REPO_ROOT } from "./lib/curriculum-source.mjs";

// Keep malformed fixtures outside the static site's discovery walk.
mkdirSync(join(REPO_ROOT, ".qa-logs"), { recursive: true });
const fixture = mkdtempSync(join(REPO_ROOT, ".qa-logs", "resource-audit-"));
mkdirSync(join(fixture, "data"));
const lessonRelative = relative(REPO_ROOT, lessonPath("2-1"));
const fixtureLesson = join(fixture, lessonRelative);
mkdirSync(fixtureLesson, { recursive: true });
const config = join(fixtureLesson, "config.json");
const entry = join(fixtureLesson, "index.html");
const manifest = {
  lessons: [
    {
      id: "1-1",
      unit: 1,
      title: "Outside scope",
      standard: "6.DS.1",
      status: {},
      resources: {
        lesson: { applicable: true, file: "missing.html" },
      },
    },
    {
      id: "2-1",
      unit: 2,
      title: "Statistics",
      standard: "6.DS.1",
      status: {},
      resources: {
        lesson: { applicable: true, file: lessonRelative },
        exitTicket: { applicable: true, inline: true, exists: true },
      },
    },
  ],
};
writeFileSync(join(fixture, "data", "curriculum-manifest.json"), JSON.stringify(manifest));
writeFileSync(config, JSON.stringify({ reflect: { exitTicket: { stem: "A question" } } }));
writeFileSync(entry, "<!doctype html><title>Statistics</title>");
const run = (...args) =>
  spawnSync(
    process.execPath,
    [join(REPO_ROOT, "scripts/audit-curriculum-resources.mjs"), "--no-write", ...args],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, REPO: fixture },
      encoding: "utf8",
    },
  );
assert.equal(
  run("--units", "2-9", "--strict").status,
  0,
  "Exclude missing out-of-scope resources.",
);
assert.equal(run("--strict").status, 1, "Strict mode must reject a missing applicable resource.");
assert.equal(run().status, 0, "Default inventory remains compatible with report-only callers.");
writeFileSync(config, "{}");
assert.equal(
  run("--units", "2", "--strict").status,
  1,
  "A stale exists flag cannot hide a missing exit ticket.",
);
writeFileSync(entry, "");
assert.equal(run("--units", "2").status, 1, "An empty directory index is an empty resource.");
for (const range of ["9-2", "0", "11", "2-90", "all", ""]) {
  assert.equal(run("--units", range).status, 2, `Invalid scope ${range} must not pass.`);
}
console.log(
  "Resource inventory: scoped checks, strict failure, actual inline source, empty routes, invalid scopes verified.",
);
