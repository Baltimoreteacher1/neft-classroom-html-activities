// Records which repo files one test script touches. Loaded with `node --import`
// by tools/run-tests.mjs when QA_TRACE_OUT is set; a no-op otherwise.
//
// Writes { files, dirs, wide } to QA_TRACE_OUT on exit, paths relative to
// QA_TRACE_ROOT. `files` are read/stat'ed/imported files, `dirs` are directories
// the test listed or copied (a dependency on everything beneath), and `wide`
// names why the trace cannot be trusted (see tools/lib/test-scope.mjs).
//
// Module loads are caught by a module hook rather than the fs patch: the ESM
// and CJS loaders read source through internal bindings fs never sees.

import childProcess from "node:child_process";
import fs from "node:fs";
import moduleApi, { registerHooks, syncBuiltinESMExports } from "node:module";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import workerThreads from "node:worker_threads";

const OUT = process.env.QA_TRACE_OUT;
const ROOT = process.env.QA_TRACE_ROOT;

const FILE_READS = [
  "readFileSync",
  "readFile",
  "openSync",
  "open",
  "createReadStream",
  "statSync",
  "lstatSync",
  "stat",
  "lstat",
  "existsSync",
  "accessSync",
  "access",
  "readlinkSync",
  "readlink",
  "realpathSync",
  "realpath",
  "copyFileSync",
  "copyFile",
];
const DIR_READS = ["readdirSync", "readdir", "opendirSync", "opendir", "cpSync", "cp"];
const SPAWNERS = ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"];

function install() {
  const files = new Set();
  const dirs = new Set();
  let wide = null;
  const writeOut = fs.writeFileSync;
  const widen = (why) => {
    wide ??= why;
  };

  /** Repo-relative path, or null for anything outside the repo / in node_modules. */
  function rel(p) {
    let abs;
    if (typeof p === "string") abs = p;
    else if (p instanceof URL) abs = p.protocol === "file:" ? fileURLToPath(p) : null;
    else if (Buffer.isBuffer(p)) abs = p.toString();
    if (!abs) return null;
    const r = relative(ROOT, resolve(process.cwd(), abs)).split("\\").join("/");
    if (r.startsWith("..") || isAbsolute(r) || r.startsWith("node_modules/")) return null;
    return r;
  }
  function note(p, set) {
    const r = rel(p);
    if (r === null) return;
    if (r === ".git" || r.startsWith(".git/")) widen("reads .git");
    else if (r === "dist" || r.startsWith("dist/")) widen("reads dist/");
    else if (r === "") {
      if (set === dirs) widen("lists the repo root");
    } else set.add(r);
  }
  const noteFile = (p) => note(p, files);
  const noteDir = (p) => note(p, dirs);

  function wrap(target, name, record) {
    const orig = target[name];
    if (typeof orig !== "function") return;
    const wrapped = function (...args) {
      try {
        record(args);
      } catch {}
      return orig.apply(this, args);
    };
    for (const key of Reflect.ownKeys(orig)) {
      if (key === "length" || key === "name" || key === "prototype" || key === promisify.custom) {
        continue;
      }
      Object.defineProperty(wrapped, key, Object.getOwnPropertyDescriptor(orig, key));
    }
    // util.promisify(execFile) returns this pre-built variant, which would
    // otherwise sail past the wrapper (it calls the original, not `wrapped`).
    const custom = orig[promisify.custom];
    if (typeof custom === "function") {
      Object.defineProperty(wrapped, promisify.custom, {
        value(...args) {
          try {
            record(args);
          } catch {}
          return custom.apply(this, args);
        },
      });
    }
    target[name] = wrapped;
  }

  for (const name of FILE_READS) {
    wrap(fs, name, (a) => noteFile(a[0]));
    wrap(fs.promises, name, (a) => noteFile(a[0]));
  }
  for (const name of DIR_READS) {
    wrap(fs, name, (a) => noteDir(a[0]));
    wrap(fs.promises, name, (a) => noteDir(a[0]));
  }
  // glob walks a tree from `cwd`, which is a dependency on all of it.
  for (const name of ["globSync", "glob"]) {
    wrap(fs, name, (a) => noteDir(a[1]?.cwd ?? process.cwd()));
  }
  wrap(fs.promises, "glob", (a) => noteDir(a[1]?.cwd ?? process.cwd()));
  for (const name of SPAWNERS) wrap(childProcess, name, () => widen("spawns a subprocess"));

  // module.register() runs loader hooks on another thread: reads there are unseen.
  wrap(moduleApi, "register", () => widen("registers module loader hooks"));

  const NativeWorker = workerThreads.Worker;
  workerThreads.Worker = class extends NativeWorker {
    constructor(...args) {
      widen("starts a worker thread");
      super(...args);
    }
  };
  syncBuiltinESMExports();

  registerHooks({
    load(url, context, nextLoad) {
      if (url.startsWith("file:")) noteFile(new URL(url));
      return nextLoad(url, context);
    },
  });
  if (process.argv[1]) noteFile(process.argv[1]);

  process.on("exit", () => {
    try {
      writeOut(OUT, JSON.stringify({ files: [...files].sort(), dirs: [...dirs].sort(), wide }));
    } catch {}
  });
}

if (OUT && ROOT) install();
