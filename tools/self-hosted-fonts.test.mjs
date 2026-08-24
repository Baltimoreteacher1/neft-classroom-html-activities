#!/usr/bin/env node
/**
 * self-hosted-fonts.test.mjs — negative controls for validate:self-hosted-fonts.
 *
 * Two failure paths, both driven through the REAL script:
 *
 *   1. The sweep collapses. The guard must fail and name itself. A script that
 *      dies on a missing import also exits non-zero and proves nothing, so the
 *      assertion checks the guard's own message, not just the exit code.
 *   2. A converted page goes back to the CDN. The check must fail and name that
 *      page.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "tools", "validate-self-hosted-fonts.mjs");

const run = (env = {}) => {
  try {
    return {
      code: 0,
      out: execFileSync(process.execPath, [SCRIPT], {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, ...env },
      }),
    };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` };
  }
};

test("the fleet is currently clean", () => {
  const r = run();
  assert.equal(r.code, 0, `expected a pass, got:\n${r.out}`);
  assert.match(r.out, /none reference fonts\.googleapis\.com/);
});

test("an empty sweep fails, and the guard is what fails it", () => {
  const r = run({ SWEEP_GUARD_FORCE_EMPTY: "validate:self-hosted-fonts", CI: "" });
  assert.notEqual(r.code, 0, "an empty sweep reported success");
  assert.match(
    r.out,
    /FAIL\s+validate:self-hosted-fonts: swept 0/,
    `exited non-zero for some other reason, which proves nothing about the guard:\n${r.out.slice(0, 400)}`,
  );
});

test("a converted page that goes back to the CDN is caught", async () => {
  // The detector, run against a page that carries both a self-hosted bundle and
  // the CDN link — the exact regression a generator or a copy-paste produces.
  const dir = mkdtempSync(join(tmpdir(), "shf-"));
  try {
    mkdirSync(join(dir, "lessons", "9-9"), { recursive: true });
    const page = join("lessons", "9-9", "index.html");
    writeFileSync(
      join(dir, page),
      `<link rel="stylesheet" href="/assets/fonts/engine-body.css" />
       <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit&display=swap" />`,
    );
    const { regressions } = await import(`file://${SCRIPT}`);
    const bad = regressions([page], dir);
    assert.deepEqual(
      bad,
      [page],
      "a page loading both a local bundle and the CDN was not reported",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
