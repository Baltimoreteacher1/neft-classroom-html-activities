// Night Shift — shared utilities. Pure Node, zero deps.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);

/** Run a command, capturing stdout/stderr/exit without throwing on non-zero. */
export async function sh(cmd, args = [], opts = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd: opts.cwd,
      maxBuffer: 32 * 1024 * 1024,
      timeout: opts.timeout ?? 0,
      env: { ...process.env, ...(opts.env || {}) },
    });
    return { ok: true, code: 0, timedOut: false, stdout: stdout.toString(), stderr: stderr.toString() };
  } catch (err) {
    // execFile kills on timeout (SIGTERM) and throws the same shape as a real
    // non-zero exit. Callers must be able to tell "too slow" from "broken":
    // reporting a timeout as a failure produced weeks of false ❌ in the
    // briefings, with mid-run progress text presented as the error tail.
    return {
      ok: false,
      code: err.code ?? 1,
      timedOut: Boolean(err.killed) && err.signal === "SIGTERM",
      stdout: (err.stdout || "").toString(),
      stderr: (err.stderr || err.message || "").toString(),
    };
  }
}

// Resolution has to hand back a PATH, not a yes/no, and it has to answer for
// the environment the caller will actually execute in. Under launchd this job
// gets the bare PATH from its plist; `claude` lives in a mise-managed node
// prefix that only ever joins PATH via `mise activate` in ~/.zshrc — and .zshrc
// is sourced for INTERACTIVE shells only. So no login-shell probe, bash or zsh,
// can see it from a scheduled run: the old check said yes from a terminal and
// no at 2am. Ask the PATH we will really use, then ask mise directly.
const commandCache = new Map();

/** Absolute path to an executable, or null. Safe to execFile as-is. */
export async function resolveCommand(name, opts = {}) {
  const key = `${name}::${opts.cwd || ""}`;
  if (commandCache.has(key)) return commandCache.get(key);

  const absolute = (out) => {
    const first = (out || "").trim().split("\n")[0].trim();
    // `command -v` also echoes builtins and functions by bare name; only an
    // absolute path is something execFile can run.
    return first.startsWith("/") ? first : null;
  };

  // 1. The process PATH — identical to what execFile will search.
  let resolved = absolute((await sh("bash", ["-c", `command -v ${name} 2>/dev/null`])).stdout);

  // 2. Version-manager shims live outside that PATH under launchd. mise itself
  //    is installed system-wide, so it can be asked where the real binary is.
  if (!resolved && (await sh("bash", ["-c", "command -v mise 2>/dev/null"])).stdout.trim()) {
    const r = await sh("mise", ["which", name], { cwd: opts.cwd });
    if (r.ok) resolved = absolute(r.stdout);
  }

  commandCache.set(key, resolved);
  return resolved;
}

/** True if an executable resolves — via the same lookup the caller will run. */
export async function hasCommand(name, opts = {}) {
  return (await resolveCommand(name, opts)) !== null;
}

export function makeLogger(prefix = "night-shift") {
  const ts = () => new Date().toISOString().replace("T", " ").slice(0, 19);
  return {
    info: (m) => console.log(`[${ts()}] [${prefix}] ${m}`),
    warn: (m) => console.warn(`[${ts()}] [${prefix}] WARN ${m}`),
    error: (m) => console.error(`[${ts()}] [${prefix}] ERROR ${m}`),
  };
}

export async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

export async function writeJson(file, obj) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

export async function writeText(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
}

/** Minimal git helper bound to a repo root. */
export function gitFor(root) {
  const git = (...args) => sh("git", ["-C", root, ...args]);
  return {
    raw: git,
    async currentBranch() {
      return (await git("rev-parse", "--abbrev-ref", "HEAD")).stdout.trim();
    },
    async showAtRef(ref, relPath) {
      // Returns { ok, content } for <ref>:<path>; ok=false if path absent at ref.
      const r = await git("show", `${ref}:${relPath}`);
      return { ok: r.ok, content: r.stdout };
    },
    async aheadBehind(local, remoteRef) {
      const r = await git("rev-list", "--left-right", "--count", `${local}...${remoteRef}`);
      if (!r.ok) return null;
      const [ahead, behind] = r.stdout.trim().split(/\s+/).map((n) => parseInt(n, 10));
      return { ahead, behind };
    },
  };
}

export function repoRoot() {
  // night-shift/lib/util.mjs -> repo root is two levels up.
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
}

export { existsSync, path };
