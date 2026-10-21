// Pins tools/lib/test-trace-commands.mjs: which non-node commands a traced test
// may spawn without becoming opaque, and what each one is recorded as reading.
// The property that matters is the same as test-scope's: a modelled command may
// over-state its reads but never under-state them, and anything outside the
// exact allow-listed shapes stays opaque.
import assert from "node:assert/strict";
import { commandReads } from "./lib/test-trace-commands.mjs";

const root = "/repo";
const ctx = (extra = {}) => ({ root, cwd: root, env: {}, sync: true, ...extra });
const reads = (cmd, args, extra) => commandReads(cmd, args, ctx(extra));
const opaque = (cmd, args, extra, why) =>
  assert.ok(reads(cmd, args, extra).opaque, why ?? `${cmd} ${args.join(" ")} must stay opaque`);

/* --- git ------------------------------------------------------------------- */
assert.deepEqual(reads("git", ["ls-files", "tools", "scripts"]), {
  files: ["/repo/tools", "/repo/scripts"],
  dirs: ["/repo/tools", "/repo/scripts"],
});
assert.deepEqual(reads("git", ["ls-files", "-z", "pages/*/config.json"]).dirs, ["/repo/pages"]);
assert.deepEqual(
  reads("git", ["ls-files", "*.html"]).dirs,
  ["/repo"],
  "a glob at the top level depends on the whole tree (recorded as the root, which is opaque)",
);
assert.deepEqual(reads("git", ["ls-files"]).dirs, ["/repo"], "no pathspec means everything");
assert.deepEqual(
  reads("git", ["ls-files", "api"], { cwd: "/repo/functions" }).dirs,
  ["/repo/functions/api"],
  "pathspecs are relative to the child's cwd",
);
opaque("git", ["ls-files", "--with-tree=HEAD", "x"], {}, "an unknown ls-files flag is opaque");
opaque("git", ["ls-files", ":(glob)**/x"], {}, "pathspec magic is opaque");
opaque(
  "git",
  ["ls-files", "x"],
  { env: { GIT_DIR: "/elsewhere" } },
  "another repository's git dir",
);
assert.deepEqual(
  reads("git", ["ls-files", "x"], { env: { GIT_DIR: "/gitdir" }, gitDir: "/gitdir" }).dirs,
  ["/repo/x"],
  "a hook's GIT_DIR naming this checkout's own git dir is still this repository",
);
assert.ok(reads("git", ["ls-files", "x"], { env: { GIT_DIR: ".git" }, gitDir: "/repo/.git" }).dirs);
opaque("git", ["ls-files", "x"], { env: { GIT_WORK_TREE: "/other" } });
opaque("git", ["diff", "--name-only"], {}, "history-dependent git commands are opaque");
opaque("git", ["show", "HEAD:x.json"], {}, "only the index form of git show is modelled");
opaque("git", ["-C", "/repo", "ls-files"]);
assert.deepEqual(reads("git", ["show", ":data/a.json"]), {
  files: ["/repo/data/a.json"],
  dirs: [],
});
assert.deepEqual(
  reads("git", ["init", "-q"], { cwd: "/tmp/x" }),
  { files: [], dirs: [] },
  "a repository outside the tree reads nothing of it",
);
opaque("git", ["clone", "/repo", "y"], { cwd: "/tmp/x" }, "unless an argument points back in");

/* --- rg -------------------------------------------------------------------- */
const rg = reads("rg", ["-l", "--glob", "*.js", "assets/fonts/", "tools"]);
assert.deepEqual(
  rg.dirs,
  ["/repo/tools"],
  "the first positional is the pattern, the rest are paths",
);
assert.ok(rg.files.includes("/repo/.gitignore"), "rg's ignore files up to the root are read too");
assert.deepEqual(reads("rg", ["-e", "x", "a", "b"]).dirs, ["/repo/a", "/repo/b"]);
assert.deepEqual(reads("rg", ["x"]).dirs, ["/repo"], "no path searches the cwd");
opaque("rg", ["--pre", "cat", "x", "tools"], {}, "--pre runs a program");
opaque("rg", ["-f", "patterns.txt", "tools"], {}, "a pattern file is an unmodelled read");
opaque("rg", ["--no-ignore", "x", "tools"]);

/* --- unzip, sqlite3, bash -n, npx biome ------------------------------------ */
assert.deepEqual(reads("unzip", ["-p", "docs/a.docx", "word/document.xml"]).files, [
  "/repo/docs/a.docx",
]);
opaque("unzip", ["-Z", "a.zip"]);
assert.deepEqual(reads("sqlite3", ["-version"], { stdinIgnored: true }), { files: [], dirs: [] });
assert.deepEqual(reads("sqlite3", ["/tmp/x.db", "SELECT 1"]).files, ["/tmp/x.db"]);
opaque("sqlite3", ["/tmp/x.db", "ATTACH 'data/a.db' AS a"], {}, "ATTACH reads another file");
opaque("sqlite3", ["/tmp/x.db"], { input: ".read data/x.sql" }, "a dot-command can read a file");
opaque("sqlite3", ["/tmp/x.db"], { sync: false }, "an async stdin stream is unseen");
opaque("sqlite3", ["-cmd", ".read x", "/tmp/x.db"]);
assert.deepEqual(reads("bash", ["-n", "scripts/ship.sh"]).files, ["/repo/scripts/ship.sh"]);
opaque("bash", ["scripts/ship.sh"], {}, "running a script is opaque; only -n is a pure read");
const biome = reads("npx", ["biome", "format", "--stdin-file-path=/repo/assets/x.js"]);
assert.ok(
  biome.files.includes("/repo/biome.json") && biome.files.includes("/repo/assets/biome.json"),
);
opaque("npx", ["biome", "format", "--write", "assets/x.js"]);
opaque("npx", ["vite", "build"]);
opaque("sh", ["-c", "echo hi"]);
opaque("chrome-headless-shell", ["--headless"]);

console.log(
  "test-trace-commands: modelled commands record their reads; everything else stays opaque",
);
