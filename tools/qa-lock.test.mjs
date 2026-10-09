#!/usr/bin/env node
/* qa-lock.test.mjs — pins the properties that make the cross-session gate lock
 * safe to leave on: it excludes, it never blocks forever, and it never waits on
 * a dead owner. Uses a throwaway lock directory under the OS tmpdir. */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { acquireGateLock, isStale, STALE_MS } from "../scripts/lib/qa-lock.mjs";

const root = mkdtempSync(join(tmpdir(), "qa-lock-test-"));
let n = 0;
const fresh = () => join(root, `lock-${n++}`);
const quick = { pollMs: 20, waitMs: 400, graceMs: 100 };
const logs = [];
const log = (m) => logs.push(m);
// The lock marks the holder's environment so nested gates skip it. These
// scenarios stand in for a SEPARATE process contending, so clear the mark.
const asOtherProcess = () => delete process.env.QA_GATE_LOCK_HELD;

try {
  // A pid that is certainly dead: a child that has already exited.
  const deadPid = spawnSync(process.execPath, ["-e", ""]).pid;

  {
    const dir = fresh();
    const lock = await acquireGateLock({ label: "a", lockDir: dir, log, ...quick });
    assert.equal(lock.held, true);
    assert.ok(existsSync(join(dir, "owner.json")), "owner recorded");
    lock.release();
    assert.equal(existsSync(dir), false, "release removes the lock");
  }

  {
    const dir = fresh();
    const first = await acquireGateLock({ label: "first", lockDir: dir, log, ...quick });
    logs.length = 0;
    asOtherProcess();
    const second = await acquireGateLock({ label: "second", lockDir: dir, log, ...quick });
    assert.equal(second.held, false, "a live owner is waited on, then the caller proceeds");
    assert.ok(
      logs.some((m) => /running anyway/.test(m)),
      "giving up is announced, not silent",
    );
    second.release(); // must NOT remove the first owner's lock
    assert.ok(existsSync(dir), "a caller that never held the lock cannot release it");
    first.release();
    assert.equal(existsSync(dir), false);
  }

  {
    const dir = fresh();
    const taken = await acquireGateLock({ label: "x", lockDir: dir, log, ...quick });
    taken.release();
    // Re-create it as if a crashed gate left it behind.
    const crashed = join(dir);
    const { mkdirSync } = await import("node:fs");
    mkdirSync(crashed);
    writeFileSync(
      join(crashed, "owner.json"),
      JSON.stringify({ pid: deadPid, label: "crashed", startedAt: Date.now() }),
    );
    logs.length = 0;
    const lock = await acquireGateLock({ label: "after-crash", lockDir: dir, log, ...quick });
    assert.equal(lock.held, true, "a dead owner never blocks");
    assert.ok(logs.some((m) => /taking over/.test(m)));
    lock.release();
  }

  {
    const now = Date.now();
    assert.equal(isStale({ pid: process.pid, startedAt: now }, now), false, "live and recent");
    assert.equal(
      isStale({ pid: process.pid, startedAt: now - STALE_MS - 1 }, now),
      true,
      "older than any real gate is dead even if the pid was reused",
    );
    assert.equal(isStale({ pid: deadPid, startedAt: now }, now), true, "dead pid");
    assert.equal(isStale(null), false, "no owner file yet is not stale (winner is mid-write)");
  }

  {
    const dir = fresh();
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dir); // owner.json never appears: the winner died between mkdir and write
    const lock = await acquireGateLock({ label: "gap", lockDir: dir, log, ...quick });
    assert.equal(lock.held, true, "an ownerless lock is reclaimed after the grace period");
    lock.release();
  }

  {
    const dir = fresh();
    process.env.QA_NO_LOCK = "1";
    const lock = await acquireGateLock({ label: "off", lockDir: dir, log, ...quick });
    delete process.env.QA_NO_LOCK;
    assert.equal(lock.held, false);
    assert.equal(existsSync(dir), false, "QA_NO_LOCK=1 creates nothing");
  }

  {
    const dir = fresh();
    const parent = await acquireGateLock({ label: "parent", lockDir: dir, log, ...quick });
    assert.equal(process.env.QA_GATE_LOCK_HELD, "1", "children of a holder are marked");
    const t0 = Date.now();
    const nested = await acquireGateLock({ label: "nested", lockDir: dir, log, ...quick });
    assert.equal(nested.held, false);
    assert.ok(
      Date.now() - t0 < 200,
      "a nested gate returns at once instead of waiting on its parent",
    );
    parent.release();
    delete process.env.QA_GATE_LOCK_HELD;
  }

  console.log("✓ qa-lock: excludes, times out loudly, ignores dead owners, honours QA_NO_LOCK.");
} finally {
  rmSync(root, { recursive: true, force: true });
}
