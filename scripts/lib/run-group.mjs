/* =============================================================================
 * run-group.mjs — execFile whose timeout kills the WHOLE process tree.
 * -----------------------------------------------------------------------------
 * qa-run runs every check as `npm run <name>`, which starts node, which may
 * start a browser. `execFile`'s own `timeout` kills only the direct child (npm).
 * The grandchildren keep the stdout pipe open, so execFile's callback does not
 * fire until THEY exit: on 2026-10-09 a hung build step outlived its 15-minute
 * timeout by 34 minutes and the commit waited 49. The timeout exists so a hung
 * check is a bounded, named failure rather than a hung `git commit`; this makes
 * it actually bounded.
 *
 * Each child gets its own process group (detached), the timeout kills the group,
 * and every live group is killed if this process exits or is interrupted —
 * detaching means a Ctrl-C no longer reaches the children by itself.
 * Groups are killed only while their leader is still running, so a recycled pid
 * cannot make this signal an unrelated process.
 * ========================================================================== */

import { spawn } from "node:child_process";

const live = new Set();
let hooked = false;

function killAll() {
  for (const pid of live) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {}
  }
  live.clear();
}

function hook() {
  if (hooked) return;
  hooked = true;
  process.on("exit", killAll);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(sig, () => {
      killAll();
      process.exit(130);
    });
  }
}

/**
 * execFile(file, args, { timeout, maxBuffer, ...opts }, cb) with a tree-wide
 * timeout. Built on spawn, not execFile: execFile builds its own spawn options
 * and silently drops `detached`, so its child never gets a process group of its
 * own and there is nothing to kill the tree by.
 */
export function execGroup(file, args, { timeout, maxBuffer = 1024 * 1024, ...opts }, callback) {
  hook();
  let timedOut = false;
  let overflow = false;
  let out = "";
  let errOut = "";
  let timer;
  let done = false;
  const killGroup = () => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {}
  };
  const child = spawn(file, args, { ...opts, detached: true });
  const finish = (err) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    live.delete(child.pid);
    callback(err, out, errOut);
  };
  const collect = (which) => (chunk) => {
    if (which === "out") out += chunk;
    else errOut += chunk;
    if (!overflow && out.length + errOut.length > maxBuffer) {
      overflow = true;
      killGroup();
    }
  };
  child.stdout.setEncoding("utf8").on("data", collect("out"));
  child.stderr.setEncoding("utf8").on("data", collect("err"));
  child.on("error", (e) => finish(e));
  child.on("close", (code, signal) => {
    if (code === 0 && !timedOut && !overflow) return finish(null);
    // Shaped like execFile's error so callers need no changes: `killed` is what
    // qa-run's classifyResult reads for a timeout, `code` the exit status.
    const err = Object.assign(new Error(`Command failed: ${file} ${args.join(" ")}`), {
      code: overflow ? "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" : code,
      signal,
      killed: timedOut,
    });
    finish(err);
  });
  live.add(child.pid);
  if (timeout) {
    timer = setTimeout(() => {
      timedOut = true;
      killGroup();
    }, timeout);
  }
  return child;
}
