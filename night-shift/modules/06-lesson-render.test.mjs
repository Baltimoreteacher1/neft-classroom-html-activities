// 06-lesson-render.test.mjs — the render module must not cry wolf.
//
// 2026-08-24: the nightly ~288-page `--all --variants` probe was killed mid-run.
// The module mapped "process died" onto "a lesson failed to render" and filed a
// ❌ FAIL whose own summary read "Live lesson(s) NOT rendering — PASS 2-2-group2
// #app/mount 185440" — i.e. it reported a PASS row as the failure. The lessons
// were fine. A monitor that reports healthy pages as broken gets ignored, which
// costs more than the check is worth, so these cases are pinned.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "./06-lesson-render.mjs";

// Build a throwaway repo root whose tools/smoke-lesson-boot.mjs is a stub we
// control, so we exercise the module's interpretation of a probe run without
// touching the network or a real browser.
function rootWithStub(body) {
  const root = mkdtempSync(path.join(tmpdir(), "ns-render-"));
  mkdirSync(path.join(root, "tools"), { recursive: true });
  writeFileSync(path.join(root, "tools", "smoke-lesson-boot.mjs"), body);
  return root;
}

const ctxFor = (root, lessonRender = {}) => ({
  root,
  config: { lessonRender: { base: "https://example.test", ...lessonRender } },
});

const roots = [];
const stub = (body) => {
  const r = rootWithStub(body);
  roots.push(r);
  return r;
};

let failures = 0;
async function check(label, fn) {
  try {
    await fn();
    console.log(`  PASS  ${label}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL  ${label}\n        ${err.message}`);
  }
}

// 1. THE REGRESSION: killed mid-stream — PASS rows flushed, no summary, exit 1.
await check("killed mid-run is INCONCLUSIVE, never a render failure", async () => {
  const root = stub(
    `console.log("Render smoke — LIVE @ https://example.test");
     console.log("  PASS  2-2-group2             #app/mount 185440");
     process.exit(1);`,
  );
  const res = await run(ctxFor(root));
  assert.equal(res.status, "warn", `expected warn, got ${res.status}`);
  assert.match(res.summary, /INCONCLUSIVE/);
  assert.doesNotMatch(res.summary, /NOT rendering/);
  // the specific absurdity: a PASS row presented as the failure summary
  assert.doesNotMatch(res.summary, /PASS/);
});

// 2. A real render failure must still be reported loudly.
await check("genuine FAIL rows still report status=fail", async () => {
  const root = stub(
    `console.log("  FAIL  3-1                    #app/mount 0 (uncaught ReferenceError)");
     console.log("1/2 pages rendered; 1 failed.");
     process.exit(1);`,
  );
  const res = await run(ctxFor(root));
  assert.equal(res.status, "fail", `expected fail, got ${res.status}`);
  assert.match(res.summary, /NOT rendering/);
  assert.ok(res.details.some((d) => d.includes("3-1")), "FAIL row must survive into details");
});

// 3. Success path — and the summary regex must match the real wording ("pages
//    rendered"); the old /lessons? rendered/ never matched and fell through to
//    whatever the last line happened to be.
await check("clean run reports ok with the real summary line", async () => {
  const root = stub(
    `console.log("  PASS  1-1                    #app/mount 5481");
     console.log("288/288 pages rendered; 0 failed.");
     console.log("PASS — all probed pages render.");
     process.exit(0);`,
  );
  const res = await run(ctxFor(root));
  assert.equal(res.status, "ok", `expected ok, got ${res.status}`);
  assert.match(res.summary, /288\/288 pages rendered/);
});

// 4. Wall-clock timeout kill is the same class of non-evidence as (1).
await check("timeout kill is INCONCLUSIVE, not a render failure", async () => {
  const root = stub(
    `console.log("  PASS  1-1                    #app/mount 5481");
     setTimeout(() => process.exit(0), 60000);`,
  );
  const res = await run(ctxFor(root, { timeoutMs: 1200 }));
  assert.equal(res.status, "warn", `expected warn, got ${res.status}`);
  assert.match(res.summary, /INCONCLUSIVE/);
});

// 5. "Could not run" (exit 2) keeps its own distinct, actionable warning.
await check("exit 2 still reports could-not-run", async () => {
  const root = stub(`process.exit(2);`);
  const res = await run(ctxFor(root));
  assert.equal(res.status, "warn");
  assert.match(res.summary, /could not run/i);
});

for (const r of roots) rmSync(r, { recursive: true, force: true });

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll render-module checks passed.");
