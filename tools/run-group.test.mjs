#!/usr/bin/env node
/* run-group.test.mjs — a timed-out check must take its grandchildren with it,
 * or execFile's callback waits on the pipe they hold (a 15 min timeout ran 49). */

import assert from "node:assert/strict";
import { execGroup } from "../scripts/lib/run-group.mjs";

const run = (file, args, opts) =>
  new Promise((resolve) => {
    const t0 = Date.now();
    execGroup(file, args, opts, (err, stdout, stderr) =>
      resolve({ err, stdout, stderr, ms: Date.now() - t0 }),
    );
  });
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

{
  const r = await run("sh", ["-c", "echo hi; exit 0"], { timeout: 5000 });
  assert.equal(r.err, null);
  assert.equal(r.stdout.trim(), "hi");
}
{
  const r = await run("sh", ["-c", "exit 3"], { timeout: 5000 });
  assert.equal(r.err.code, 3, "a failing exit code reaches the caller unchanged");
  assert.notEqual(r.err.killed, true, "an ordinary failure is not reported as a timeout");
}
{
  // A grandchild that holds the pipe far longer than the timeout.
  const r = await run("sh", ["-c", "sleep 60 & echo $!; wait"], { timeout: 700 });
  assert.equal(r.err.killed, true, "a timeout is reported as killed");
  assert.ok(r.ms < 5000, `returned in ${r.ms}ms, not after the grandchild's 60s`);
  const grandchild = Number(r.stdout.trim());
  await new Promise((res) => setTimeout(res, 200));
  assert.ok(grandchild > 1, "test captured the grandchild's pid");
  assert.equal(alive(grandchild), false, "the grandchild was killed with its parent");
}
console.log("✓ run-group: timeout kills the whole tree, ordinary results are untouched.");
