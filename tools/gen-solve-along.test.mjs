#!/usr/bin/env node
/**
 * The solve-along sidecars must be exactly what tools/gen-solve-along.mjs
 * would write, and its --check mode must be able to fail.
 *
 * The generator used to carry its own stale copy of every worked example; had
 * anyone run it, six hand-corrected sidecars would have been overwritten (Unit 1
 * Version A back to GCF goodie bags). It now treats the sidecars as the single
 * authored source and owns only formatting, the unit-2 ← statistics mirror and
 * gap reporting. This test runs --check on the real tree, then proves each
 * detector fires against a throwaway copy in the OS temp dir (nothing in the
 * repo is ever written).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GEN = path.join(ROOT, "tools", "gen-solve-along.mjs");

let failures = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`   ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`   ✗ ${name}\n     ${error.message}`);
  }
};
const run = (...args) => spawnSync(process.execPath, [GEN, ...args], { encoding: "utf8" });

console.log("solve-along generator freshness");

const SIDE = (unit, ver) => path.join("math", unit, "projects", ver, "solve-along.json");

test("committed sidecars match the generator (--check exits 0, writes nothing)", () => {
  const files = ["statistics", "unit-1", "pre-unit"].map((u) =>
    path.join(ROOT, SIDE(u, "version-a")),
  );
  const before = files.map((f) => fs.readFileSync(f, "utf8"));
  const res = run("--check");
  assert.equal(res.status, 0, `--check failed:\n${res.stdout}${res.stderr}`);
  assert.deepEqual(
    files.map((f) => fs.readFileSync(f, "utf8")),
    before,
    "--check modified a sidecar",
  );
});

/* A minimal tree: statistics + its unit-2 mirror, and one ordinary unit. */
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-solve-along-"));
  for (const unit of ["statistics", "unit-2", "unit-3"]) {
    const src = path.join(ROOT, SIDE(unit, "version-a"));
    const dest = path.join(dir, SIDE(unit, "version-a"));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    fs.writeFileSync(
      path.join(path.dirname(dest), "index.html"),
      '<script src="/shared/projects/projects-solve.js"></script>\n',
    );
  }
  return dir;
}

function withFixture(fn) {
  const dir = fixture();
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("a clean fixture passes --check", () => {
  withFixture((dir) => {
    const res = run("--check", `--root=${dir}`);
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /3 checked, 0 stale/);
  });
});

test("--check fails on non-canonical formatting, and a write repairs it", () => {
  withFixture((dir) => {
    const f = path.join(dir, SIDE("unit-3", "version-a"));
    fs.writeFileSync(f, JSON.stringify(JSON.parse(fs.readFileSync(f, "utf8"))));
    const bad = run("--check", `--root=${dir}`);
    assert.equal(bad.status, 1, "compact JSON was not flagged");
    assert.match(bad.stderr, /unit-3\/projects\/version-a\/solve-along\.json: not canonical/);
    assert.equal(run(`--root=${dir}`).status, 0);
    assert.equal(run("--check", `--root=${dir}`).status, 0, "write did not converge");
  });
});

test("--check fails when the unit-2 mirror drifts from statistics", () => {
  withFixture((dir) => {
    const f = path.join(dir, SIDE("unit-2", "version-a"));
    const data = JSON.parse(fs.readFileSync(f, "utf8"));
    data.solves[0].title.en = "Hand-edited only in the mirror";
    fs.writeFileSync(f, `${JSON.stringify(data, null, 2)}\n`);
    const bad = run("--check", `--root=${dir}`);
    assert.equal(bad.status, 1, "a drifted mirror was not flagged");
    assert.match(bad.stderr, /unit-2\/projects\/version-a/);
    run(`--root=${dir}`);
    assert.equal(
      fs.readFileSync(f, "utf8"),
      fs.readFileSync(path.join(dir, SIDE("statistics", "version-a")), "utf8"),
      "the write did not restore the mirror from statistics",
    );
  });
});

test("a page that loads projects-solve.js with no sidecar is a problem, never invented", () => {
  withFixture((dir) => {
    const f = path.join(dir, SIDE("unit-3", "version-a"));
    fs.rmSync(f);
    const res = run(`--root=${dir}`);
    assert.equal(res.status, 1, "missing sidecar was not reported");
    assert.match(res.stderr, /missing, but the page loads projects-solve\.js/);
    assert.equal(fs.existsSync(f), false, "the generator invented a sidecar");
  });
});

if (failures) {
  console.error(`\n${failures} solve-along generator check(s) failed.`);
  process.exit(1);
}
