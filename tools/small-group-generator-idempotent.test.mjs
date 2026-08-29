#!/usr/bin/env node
/**
 * small-group-generator-idempotent.test.mjs — the committed config is canonical.
 *
 * `tools/generate-small-group-lessons.mjs` and `tools/generate-catchup-lessons.mjs`
 * used to rebuild every variant from its base and write the result whole, so a
 * clean-tree run rewrote ~505 files and quietly reverted hand-improved content:
 * rewritten key ideas back to textbook dumps, "Ve más a fondo:" framing dropped,
 * warmup ids renamed (they key save/resume), whole practice items deleted
 * (docs/known-defects.md, "generate-small-group-lessons.mjs reverts
 * hand-improved content").
 *
 * The rule now: a lesson with a committed config.json is only ever ADDED to,
 * and only with what the generator itself authors; a variant with no committed
 * config is generated in full. Two things must therefore both be true, and this
 * file drives the SHIPPED generators — through their REPO hook, against a copy
 * of real lessons in a throwaway tree — to prove each:
 *
 *   1. a full run leaves every committed config, shell and lesson.js
 *      byte-identical (so `git status` after a run is empty), and
 *   2. deleting a variant and regenerating produces a valid config again.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SMALL_GROUP = join(ROOT, "tools/generate-small-group-lessons.mjs");
const CATCHUP = join(ROOT, "tools/generate-catchup-lessons.mjs");

/* One band of one unit, with every variant the two generators would produce
 * for it. Three bases so the catch-up generator has a real band; the unit's
 * second band is empty and skipped, and the legacy strands need lessons the
 * fixture lacks, so nothing outside this set is generated. */
const BASES = ["3-1", "3-2", "3-3"];
const VARIANTS = [...BASES.flatMap((id) => [`${id}-group1`, `${id}-group2`]), "3-3-catchup"];
const FILES = ["config.json", "index.html", "lesson.js"];

/* Both generators write their rows manifest next to their own source, which
 * REPO does not redirect. Snapshot and restore so a test run never leaves the
 * real repo dirty. */
const SIDECARS = [join(ROOT, "tools/small-group-rows.json"), join(ROOT, "tools/catchup-rows.json")];
const sidecarBackup = new Map(SIDECARS.map((f) => [f, readFileSync(f)]));

let fixture;
const fixturePath = (...p) => join(fixture, "lessons", ...p);
const repoPath = (...p) => join(ROOT, "lessons", ...p);

function run(generator, args = []) {
  execFileSync(process.execPath, [generator, ...args], {
    env: { ...process.env, REPO: fixture },
    stdio: "pipe",
  });
}

function runBoth() {
  run(SMALL_GROUP);
  run(CATCHUP);
}

function assertByteIdentical(id) {
  for (const file of FILES) {
    const got = readFileSync(fixturePath(id, file));
    const want = readFileSync(repoPath(id, file));
    assert.ok(
      got.equals(want),
      `lessons/${id}/${file} changed on a clean-tree run — the committed file is canonical`,
    );
  }
}

before(() => {
  fixture = mkdtempSync(join(tmpdir(), "sg-idempotent-"));
  mkdirSync(join(fixture, "functions/teacher-small-group"), { recursive: true });
  mkdirSync(join(fixture, "data"), { recursive: true });
  copyFileSync(
    join(ROOT, "data/misconception-labels.json"),
    join(fixture, "data/misconception-labels.json"),
  );
  for (const id of BASES) {
    mkdirSync(fixturePath(id), { recursive: true });
    copyFileSync(repoPath(id, "config.json"), fixturePath(id, "config.json"));
  }
  for (const id of VARIANTS) {
    mkdirSync(fixturePath(id), { recursive: true });
    for (const file of FILES) copyFileSync(repoPath(id, file), fixturePath(id, file));
  }
});

after(() => {
  rmSync(fixture, { recursive: true, force: true });
  for (const [f, buf] of sidecarBackup) writeFileSync(f, buf);
});

test("a full run leaves every committed variant byte-identical", () => {
  runBoth();
  for (const id of VARIANTS) assertByteIdentical(id);
});

test("a variant with no committed config is generated in full, and is valid", () => {
  rmSync(fixturePath("3-1-group2"), { recursive: true, force: true });
  rmSync(fixturePath("3-3-catchup"), { recursive: true, force: true });
  runBoth();

  for (const id of ["3-1-group2", "3-3-catchup"]) {
    for (const file of FILES) {
      assert.ok(existsSync(fixturePath(id, file)), `lessons/${id}/${file} was not generated`);
    }
    const config = JSON.parse(readFileSync(fixturePath(id, "config.json"), "utf8"));
    assert.equal(config.lessonId, id);
    for (const phase of ["launch", "explore", "practice", "connect", "reflect"]) {
      assert.ok(config[phase], `${id}: missing phase ${phase}`);
    }
    const tiers = ["approaching", "onLevel", "extending", "optional"];
    const items = tiers.reduce((n, tier) => n + (config.practice[tier] || []).length, 0);
    assert.ok(items >= 10, `${id}: only ${items} practice items — not a usable variant`);
    assert.ok(config.reflect.exitTicket, `${id}: no exit ticket`);
  }

  // Regenerating the missing variants must not have touched the others.
  for (const id of VARIANTS.filter((v) => v !== "3-1-group2" && v !== "3-3-catchup")) {
    assertByteIdentical(id);
  }
});

test("a regenerated variant is itself stable on the next run", () => {
  const before = Object.fromEntries(
    ["3-1-group2", "3-3-catchup"].map((id) => [id, readFileSync(fixturePath(id, "config.json"))]),
  );
  runBoth();
  for (const [id, buf] of Object.entries(before)) {
    assert.ok(
      readFileSync(fixturePath(id, "config.json")).equals(buf),
      `lessons/${id}/config.json is not a fixed point of its own generator`,
    );
  }
});
