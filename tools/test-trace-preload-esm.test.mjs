#!/usr/bin/env node
/**
 * test-trace-preload-esm.test.mjs — the gate's read tracer must not break tests
 * that load ES modules through CommonJS.
 *
 * Every gated `test` run loads tools/lib/test-trace-preload.mjs with
 * `node --import`. On Node 22.16 through 24.11, installing ANY module.registerHooks
 * hook makes a CommonJS file (imported from ESM) that require()s an ES module with
 * a sibling import throw ERR_VM_MODULE_LINK_FAILURE. jsdom 30 takes exactly that
 * path, so with the tracer on, every test touching jsdom died before running and
 * the whole `test` check was red on a tree where `npm test` passed.
 *
 * The preload now probes for the defect and, when present, drops its hook and
 * reports the trace as wide (the scoper then runs the test unconditionally). This
 * test drives the REAL preload at the failing shape and asserts three things:
 *   1. the script runs to completion (exit 0) — this is the one that failed before;
 *   2. the trace is still written and parseable;
 *   3. a repo file the script reads through fs is still recorded, so the tracer
 *      keeps doing its job where hooks are not needed.
 * On a Node without the defect, (1) passes trivially and the trace stays precise.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRELOAD = pathToFileURL(join(ROOT, "tools/lib/test-trace-preload.mjs")).href;

test("a test that loads an ES module through CommonJS still runs under the tracer", () => {
  const dir = mkdtempSync(join(tmpdir(), "trace-esm-"));
  try {
    // dep (CJS) -> require(ESM b) -> import sibling c: the shape jsdom 30 has.
    mkdirSync(join(dir, "dep"));
    writeFileSync(join(dir, "dep/c.mjs"), "export const c = 1;\n");
    writeFileSync(
      join(dir, "dep/b.mjs"),
      'import { c } from "./c.mjs";\nexport const b = c + 1;\n',
    );
    writeFileSync(join(dir, "dep/index.cjs"), 'module.exports = require("./b.mjs");\n');
    const main = join(dir, "main.mjs");
    writeFileSync(
      main,
      `import dep from "./dep/index.cjs";\nimport fs from "node:fs";\n` +
        `fs.readFileSync(${JSON.stringify(join(ROOT, "package.json"))});\nconsole.log("b=" + dep.b);\n`,
    );
    const out = join(dir, "trace.json");
    const stdout = execFileSync(process.execPath, ["--import", PRELOAD, main], {
      env: { ...process.env, QA_TRACE_OUT: out, QA_TRACE_ROOT: ROOT },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.match(stdout, /b=2/, "the ES module graph loaded and ran");
    const trace = JSON.parse(readFileSync(out, "utf8"));
    assert.ok(trace.files.includes("package.json"), "an fs read of a repo file is still recorded");
    if (trace.wide)
      assert.match(trace.wide, /cannot be traced on this Node/, "a degraded trace says why");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
