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

/** True if an executable resolves on PATH. */
export async function hasCommand(name) {
  const r = await sh("bash", ["-lc", `command -v ${name} >/dev/null 2>&1 && echo yes || echo no`]);
  return r.stdout.trim() === "yes";
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
