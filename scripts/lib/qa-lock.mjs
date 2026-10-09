/* =============================================================================
 * qa-lock.mjs — one full QA gate at a time per machine.
 * -----------------------------------------------------------------------------
 * Several sessions and worktrees share this Mac, and every commit or push runs
 * a gate that ends in a lane of real-browser checks. Measured 2026-10-09: with
 * 3-4 gates running at once the load average sat at 30-60, a gate that takes
 * ~4 min alone took 8-10, and the browser checks (which lose races to plain CPU
 * load — see EXCLUSIVE in qa-run.mjs) had to be retried. Running them one after
 * another finishes every gate sooner than running them all at once.
 *
 * Properties, in order of how much they matter:
 *   - It can never block a push forever: after `waitMs` the caller proceeds
 *     WITHOUT the lock and says so. A slow gate is an annoyance; a gate that
 *     cannot start is the reason people reach for --no-verify.
 *   - A dead owner never blocks anyone: the owner's pid is probed, and a lock
 *     older than STALE_MS is taken over even if the pid number was reused.
 *   - Acquisition is atomic (mkdir), so two gates starting together cannot both
 *     win. Only the owner removes the lock.
 *   - A gate nested inside a gate (QA_GATE_LOCK_HELD=1, inherited) never waits on its parent.
 *   - QA_NO_LOCK=1 turns it off.
 * ========================================================================== */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const LOCK_DIR = join(tmpdir(), "eduwonderlab-qa-gate.lock");
/** No real gate runs this long (every check is killed at 15 min), so an older lock is dead. */
export const STALE_MS = 90 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM"; // exists, owned by someone else
  }
}

function readOwner(lockDir) {
  try {
    return JSON.parse(readFileSync(join(lockDir, "owner.json"), "utf8"));
  } catch {
    return null;
  }
}

/** True when the lock's owner is gone (or the lock is implausibly old). */
export function isStale(owner, now = Date.now()) {
  if (!owner) return false; // mkdir won but owner.json is not written yet: give it a moment
  if (now - owner.startedAt > STALE_MS) return true;
  return !pidAlive(owner.pid);
}

function tryClaim(lockDir, label) {
  try {
    mkdirSync(lockDir);
  } catch (e) {
    if (e.code === "EEXIST") return false;
    throw e;
  }
  writeFileSync(
    join(lockDir, "owner.json"),
    JSON.stringify({ pid: process.pid, label, startedAt: Date.now() }),
  );
  return true;
}

/**
 * Wait for the gate lock. Resolves `{ held, release }`; `held` is false when it
 * gave up (timeout) or the lock is disabled, in which case the caller carries
 * on without exclusion.
 */
export async function acquireGateLock({
  label,
  log = () => {},
  lockDir = LOCK_DIR,
  waitMs = Number(process.env.QA_LOCK_WAIT_MS) || 30 * 60 * 1000,
  pollMs = 1500,
  graceMs = 5000,
} = {}) {
  if (process.env.QA_NO_LOCK === "1") return { held: false, release() {} };
  // A gate started BY a running gate (a check that shells out to qa-run) must not
  // queue behind its own parent: that is a deadlock until the wait times out.
  if (process.env.QA_GATE_LOCK_HELD === "1") return { held: false, release() {} };

  const deadline = Date.now() + waitMs;
  let announced = 0;
  let graceUntil = 0;
  for (;;) {
    if (tryClaim(lockDir, label)) break;
    const owner = readOwner(lockDir);
    if (!owner) {
      // Between the winner's mkdir and its owner.json write. If it never
      // appears the winner died in that gap; do not wait on it forever.
      graceUntil ||= Date.now() + graceMs;
      if (Date.now() > graceUntil) rmSync(lockDir, { recursive: true, force: true });
    } else if (isStale(owner)) {
      log(`qa-lock: taking over a dead gate lock (pid ${owner.pid}, ${owner.label})`);
      rmSync(lockDir, { recursive: true, force: true });
    } else {
      graceUntil = 0;
      if (Date.now() >= deadline) {
        log(
          `qa-lock: still held by pid ${owner.pid} (${owner.label}) after ${Math.round(waitMs / 1000)}s — running anyway, unserialised`,
        );
        return { held: false, release() {} };
      }
      if (Date.now() - announced > 30_000) {
        announced = Date.now();
        const mins = ((Date.now() - owner.startedAt) / 60000).toFixed(1);
        log(
          `qa-lock: another QA gate is running (${owner.label}, pid ${owner.pid}, ${mins} min) — waiting`,
        );
      }
    }
    await sleep(pollMs);
  }

  process.env.QA_GATE_LOCK_HELD = "1"; // inherited by every check this gate spawns
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    delete process.env.QA_GATE_LOCK_HELD;
    if (readOwner(lockDir)?.pid === process.pid) rmSync(lockDir, { recursive: true, force: true });
  };
  process.on("exit", release);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(sig, () => {
      release();
      process.exit(128);
    });
  }
  return { held: true, release };
}
