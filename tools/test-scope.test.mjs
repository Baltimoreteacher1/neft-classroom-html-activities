// Pins the contract of test-impact scoping (tools/lib/test-scope.mjs, the tracer
// in tools/lib/test-trace-preload.mjs and the runner's --record / scope /
// verify modes). The property that matters: a test is NEVER skipped when a file
// it can read changed. Every case here is a way that property could break.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collapse,
  entryFromTrace,
  selectTests,
  serializeManifest,
  verifyReads,
} from "./lib/test-scope.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tracked = new Set(["data/a.json", "data/b.json", "lib/x.js"]);
const helpers = {
  isTracked: (p) => tracked.has(p) || p === "data" || p === "lib",
  existsRel: (p) => tracked.has(p) || p === "data" || p === "lib" || p === "build/out.json",
};

/* --- collapse never narrows ------------------------------------------------ */
const many = Array.from({ length: 25 }, (_, i) => `pages/${i}/config.json`);
assert.deepEqual(collapse(many, []).dirs, ["pages/"], "25 files under one prefix fold to it");
assert.deepEqual(collapse(many, []).files, [], "folded files are not also listed");
assert.deepEqual(collapse(["a/x.js", "b/y.js"], []).files, ["a/x.js", "b/y.js"], "few files stay");
const nested = collapse(
  [...Array.from({ length: 22 }, (_, i) => `data/set/${i}.json`), "data/other.json"],
  [],
);
assert.deepEqual(nested.dirs, ["data/set/"], "folds at the deepest prefix that crosses the bar");
assert.deepEqual(nested.files, ["data/other.json"]);
assert.deepEqual(collapse(["pages/1/a.js"], ["pages"]).files, [], "a listed dir covers its files");

/* --- entries: opaque inputs become always-run ------------------------------ */
assert.deepEqual(
  entryFromTrace({ files: ["data/a.json"], dirs: [], wide: "spawns a subprocess" }, helpers),
  {
    wide: "spawns a subprocess",
  },
);
assert.match(
  entryFromTrace({ files: ["build/out.json"], dirs: [], wide: null }, helpers).wide,
  /untracked file build\/out\.json/,
  "a generated (untracked) input must make the test always run",
);
assert.deepEqual(entryFromTrace({ files: ["data/a.json"], dirs: ["lib"], wide: null }, helpers), {
  files: ["data/a.json"],
  dirs: ["lib/"],
});
const asDir = entryFromTrace({ files: ["data"], dirs: [], wide: null }, helpers);
assert.equal(asDir.wide, undefined, "reading a tracked DIRECTORY is not 'untracked'");

/* --- selection ------------------------------------------------------------- */
const manifest = {
  version: 1,
  tests: {
    "t/a.test.mjs": { files: ["data/a.json", "t/a.test.mjs"], dirs: [] },
    "t/b.test.mjs": { files: ["t/b.test.mjs"], dirs: ["pages/"] },
    "t/c.test.mjs": { wide: "spawns a subprocess" },
  },
};
const all = ["t/a.test.mjs", "t/b.test.mjs", "t/c.test.mjs", "t/new.test.mjs"];
const pick = (changed, m = manifest) => selectTests(all, m, changed).selected;
assert.deepEqual(pick(["data/a.json"]), ["t/a.test.mjs", "t/c.test.mjs", "t/new.test.mjs"]);
assert.deepEqual(pick(["pages/3-2/config.json"]), [
  "t/b.test.mjs",
  "t/c.test.mjs",
  "t/new.test.mjs",
]);
assert.ok(pick(["t/b.test.mjs"]).includes("t/b.test.mjs"), "a changed test runs itself");
assert.ok(pick(["README.md"]).includes("t/c.test.mjs"), "opaque tests always run");
assert.ok(
  pick(["README.md"]).includes("t/new.test.mjs"),
  "a test the manifest has not seen always runs",
);
assert.ok(
  !pick(["README.md"]).includes("t/a.test.mjs"),
  "an unrelated change skips a covered test",
);
// A deleted or renamed-away file is a change too: a test that read it must rerun.
assert.ok(pick(["data/a.json"]).includes("t/a.test.mjs"));
for (const trigger of [
  "package.json",
  "package-lock.json",
  "engine/package.json",
  "data/test-reads.json",
  "tools/run-tests.mjs",
  "tools/lib/test-scope.mjs",
]) {
  assert.equal(pick([trigger]).length, all.length, `${trigger} must run everything`);
}
assert.equal(pick([]).length, all.length, "no change list means no scoping");
assert.equal(
  selectTests(all, null, ["data/a.json"]).selected.length,
  all.length,
  "no manifest means run all",
);
assert.equal(selectTests(all, null, ["x"]).scoped, false);

/* --- drift: a manifest that has fallen behind the tests must be detected --- */
const entry = { files: ["data/a.json"], dirs: ["pages/"] };
assert.deepEqual(
  verifyReads(entry, { files: ["data/a.json", "pages/1/x.json"], dirs: [], wide: null }, helpers),
  [],
);
assert.deepEqual(
  verifyReads(entry, { files: ["data/a.json", "data/b.json"], dirs: [], wide: null }, helpers),
  ["data/b.json"],
  "a read the manifest does not cover is reported",
);
assert.deepEqual(
  verifyReads(entry, { files: ["data/a.json"], dirs: ["lib"], wide: null }, helpers),
  ["lib/ (listed)"],
  "a newly listed directory is reported",
);
assert.deepEqual(
  verifyReads({ wide: "x" }, { files: ["anything"], dirs: [], wide: null }, helpers),
  [],
);
assert.match(
  verifyReads(entry, { files: ["data/a.json"], dirs: [], wide: "spawns a subprocess" }, helpers)[0],
  /now spawns a subprocess/,
  "a test that starts spawning must no longer be scoped",
);

/* --- the manifest is one test per line (concurrent edits merge) ------------ */
const text = serializeManifest(manifest.tests);
assert.deepEqual(JSON.parse(text), manifest);
assert.equal(text.split("\n").filter((l) => l.includes(".test.mjs")).length, 3);

/* --- end to end in a throwaway repo ---------------------------------------- */
// Inside a git hook, git exports GIT_INDEX_FILE (and friends) pointing at the REAL
// repository. A `git init` / `git add -A` here would then rewrite the caller's
// index instead of the throwaway repo's — it did, on the first commit of this
// test, replacing a 16,556-entry index with 10. Strip every GIT_* variable from
// anything this test spawns, and prove the caller's index was left alone.
const cleanEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
);
const callerIndex = process.env.GIT_INDEX_FILE;
const indexBefore = callerIndex ? statSync(callerIndex) : null;
const dir = mkdtempSync(join(tmpdir(), "test-scope-"));
try {
  mkdirSync(join(dir, "tools/lib"), { recursive: true });
  mkdirSync(join(dir, "data"));
  for (const f of [
    "run-tests.mjs",
    "lib/test-scope.mjs",
    "lib/test-trace-preload.mjs",
    "lib/skip-exit.mjs",
  ]) {
    copyFileSync(join(ROOT, "tools", f), join(dir, "tools", f));
  }
  writeFileSync(join(dir, "package.json"), '{"type":"module"}\n');
  writeFileSync(join(dir, "data/a.json"), '{"a":1}\n');
  writeFileSync(join(dir, "data/b.json"), '{"b":1}\n');
  const reader = (file) =>
    `import { readFileSync } from "node:fs";\nreadFileSync("data/${file}", "utf8");\n`;
  writeFileSync(join(dir, "a.test.mjs"), reader("a.json"));
  writeFileSync(join(dir, "b.test.mjs"), reader("b.json"));
  writeFileSync(
    join(dir, "c.test.mjs"),
    'import { execFileSync } from "node:child_process";\nexecFileSync(process.execPath, ["-e", "0"]);\n',
  );
  execFileSync("git", ["init", "-q"], { cwd: dir, env: cleanEnv });
  execFileSync("git", ["add", "-A"], { cwd: dir, env: cleanEnv });
  const run = (args, env = {}) =>
    spawnSync(process.execPath, ["tools/run-tests.mjs", ...args], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...cleanEnv,
        QA_BUILD_VERIFIED: "",
        QA_TEST_SCOPE_FILES: "",
        QA_TEST_VERIFY: "",
        ...env,
      },
    });

  const recorded = run(["--record"]);
  assert.equal(recorded.status, 0, recorded.stdout + recorded.stderr);
  const m = JSON.parse(readFileSync(join(dir, "data/test-reads.json"), "utf8")).tests;
  assert.ok(m["a.test.mjs"].files.includes("data/a.json"), "the tracer saw the fs read");
  assert.ok(!m["a.test.mjs"].files.includes("data/b.json"));
  assert.equal(m["c.test.mjs"].wide, "spawns a subprocess", "a spawning test is always-run");

  const scopeFile = join(dir, "changed.txt");
  writeFileSync(scopeFile, "data/a.json\n");
  const scoped = run([], { QA_TEST_SCOPE_FILES: scopeFile, QA_TEST_VERIFY: "1" });
  assert.equal(scoped.status, 0, scoped.stdout + scoped.stderr);
  assert.match(scoped.stdout, /test scope: 2 of 3 scripts/);
  assert.match(scoped.stdout, /PASS {2}a\.test\.mjs/);
  assert.match(scoped.stdout, /PASS {2}c\.test\.mjs/);
  assert.doesNotMatch(scoped.stdout, /b\.test\.mjs/, "an unaffected test must not run");

  // The test now reads a file the manifest has never seen: verification must FAIL.
  writeFileSync(
    join(dir, "a.test.mjs"),
    `${reader("a.json")}readFileSync("data/b.json", "utf8");\n`,
  );
  const stale = run([], { QA_TEST_VERIFY: "1" });
  assert.equal(stale.status, 1, "a stale manifest must fail the run");
  assert.match(stale.stderr, /MANIFEST IS STALE/);
  assert.match(stale.stderr, /a\.test\.mjs: data\/b\.json/);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (indexBefore) {
  const after = statSync(callerIndex);
  assert.equal(
    after.mtimeMs,
    indexBefore.mtimeMs,
    "this test must never touch the caller's git index",
  );
  assert.equal(after.size, indexBefore.size);
}

console.log("test-scope: selection, drift detection and the record/scope/verify loop hold");
