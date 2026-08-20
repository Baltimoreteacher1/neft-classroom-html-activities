#!/usr/bin/env node
/* =============================================================================
 * gate-mutation.test.mjs — a gate that cannot fail is not a gate.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * Every other check in this repo answers "is the tree clean?". None of them
 * answers "would this gate NOTICE if it weren't?" — and the difference is
 * invisible in a green run, because a gate that has quietly stopped firing and
 * a gate watching a clean tree print exactly the same line.
 *
 * This repo has already paid for that distinction more than once. A documented
 * gate lost its `package.json` wiring in a cherry-pick and reported nothing for
 * eight days. `smoke-injection.mjs` served the source tree instead of `dist/`,
 * so it failed 6/6 on specifiers that cannot exist before a build, and was
 * therefore never wired at all. Individual validators answer this for their own
 * detectors by self-testing them; nothing answered it end-to-end, for the
 * command the pre-push hook actually runs.
 *
 * HOW IT WORKS. For each case: plant a file that SHOULD be caught, run the real
 * gate script, and assert it exits non-zero. The mutation is the input, never
 * the validator — mutating the validator would prove only that broken code
 * breaks.
 *
 * TWO SAFETY PROPERTIES, both load-bearing, because this runs inside `npm test`
 * and therefore inside the pre-push hook:
 *
 *  1. ADDITIVE ONLY. Every mutation creates a NEW file and deletes it. No
 *     tracked file is ever modified, so a crash mid-run cannot leave the repo
 *     holding a damaged lesson, stylesheet or auth module. That rules out
 *     tempting targets — `validate:auth-contract` is content-pinned and would
 *     be a perfect mutation subject, but tripping it means editing an auth
 *     file, and no test is worth that risk.
 *
 *  2. THE REAL GIT INDEX IS NEVER TOUCHED. These validators enumerate their
 *     subject with `git ls-files`, so an untracked file is invisible to them
 *     and the mutation would silently prove nothing — the exact false pass this
 *     file exists to prevent. Staging it for real would mutate the index during
 *     a push, so instead each case runs against a THROWAWAY COPY of the index
 *     via `GIT_INDEX_FILE`. The child sees the file as tracked; the repo never
 *     does.
 *
 * A case that stops tripping is a real finding: either the gate stopped firing,
 * or its subject moved and it is now watching the wrong thing.
 * ========================================================================== */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { exitSkipped } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// A real git dir is the whole mechanism here; without one every mutation would
// be invisible to the validators and every case would "pass" having proved
// nothing. That is a SKIP, not a pass.
try {
  execFileSync("git", ["rev-parse", "--git-dir"], { cwd: ROOT, stdio: "ignore" });
} catch {
  exitSkipped(
    "no git repository — these validators enumerate with `git ls-files`, so a mutation would be invisible",
    "Run from a git checkout.",
  );
}

/**
 * Cases. `file` is created, staged into a throwaway index, and deleted.
 *
 * Paths are deliberately named `zz-gate-mutation.*` and live in directories the
 * validators genuinely sweep — a mutation parked somewhere unswept proves the
 * gate is quiet, not that it is watching.
 */
const CASES = [
  {
    name: "validate:secrets catches a credential shape",
    script: "tools/validate-secrets.mjs",
    file: "assets/zz-gate-mutation.js",
    // Assembled from fragments ON PURPOSE. Writing the literal here would put a
    // credential-shaped string into a TRACKED file, and `validate:secrets`
    // sweeps tracked files — so the harness would trip the very gate it is
    // testing, from its own source, on every run. It did exactly that once this
    // file was first committed: 86/87, FAILED validate:secrets, pointing at
    // tools/gate-mutation.test.mjs. The planted file on disk still matches
    // /\bAKIA[0-9A-Z]{16}\b/; this source does not.
    content: `const k = "${["AKIA", "IOSFODNN", "7EXAMPLE"].join("")}";\n`,
    why: "an AWS access-key shape in a tracked file must fail the secret scan",
  },
  {
    name: "validate:css-integrity catches a committed merge conflict",
    script: "tools/validate-css-integrity.mjs",
    file: "assets/zz-gate-mutation.css",
    content: "a{color:red}\n<<<<<<< HEAD\nb{color:blue}\n=======\nb{color:green}\n>>>>>>> other\n",
    why: "a conflict marker in a stylesheet shipped to production once; the browser drops the rules it cannot parse and reports nothing",
  },
  {
    name: "validate:injection catches an unbalanced sentinel",
    script: "tools/validate-injection-integrity.mjs",
    file: "lessons/zz-gate-mutation.html",
    content: "<html><body><!-- nsr-injected:begin --><p>x</p></body></html>\n",
    why: "a begin without an end is a half-applied injector run",
  },
  {
    name: "validate:generator-safety catches a scoped generator with no containment",
    script: "tools/validate-generator-safety.mjs",
    file: "tools/generate-zz-gate-mutation.mjs",
    content:
      'const only = process.argv.includes("--only");\nwriteFileSync(join(LESSONS, "x"), "y");\n',
    why: "a generator that accepts --only and writes lessons without assertWriteSetContained can write outside its scope",
  },
  {
    name: "validate:gate-coverage catches a newly dark validator",
    script: "tools/validate-gate-coverage.mjs",
    file: "tools/validate-zz-gate-mutation.mjs",
    content: "process.exit(0);\n",
    // This one needs no index at all: it reads the filesystem, not `git ls-files`.
    needsIndex: false,
    why: "a validator that is neither gated nor exempted is the failure the coverage gate exists for",
  },
];

/* `validate:js-syntax` is the highest-value mutation here — it is what caught
 * `assets/game-fx.js` shipping truncated mid-function, dead across ~114 games —
 * but it sweeps ~1,000 files plus ~3,100 inline blocks and costs ~36s, which
 * would more than half again the whole test suite on every push. It is proven
 * on demand instead: QA_MUTATE_SLOW=1 npm test */
if (process.env.QA_MUTATE_SLOW) {
  CASES.push({
    name: "validate:js-syntax catches a truncated script",
    script: "tools/validate-js-syntax.mjs",
    file: "assets/zz-gate-mutation-syntax.js",
    content: "function ( { unclosed\n",
    why: "the game-fx truncation class: the file still serves 200 and nothing in it runs",
  });
}

/** Run one mutation and return the gate's exit code. */
function runMutation(c) {
  const abs = join(ROOT, c.file);
  const tmp = mkdtempSync(join(tmpdir(), "gate-mutation-"));
  const index = join(tmp, "index");
  let code = 0;
  try {
    writeFileSync(abs, c.content);
    const env = { ...process.env };
    if (c.needsIndex !== false) {
      copyFileSync(join(ROOT, ".git", "index"), index);
      env.GIT_INDEX_FILE = index;
      execFileSync("git", ["add", "-N", c.file], { cwd: ROOT, env, stdio: "ignore" });
    }
    try {
      execFileSync("node", [join(ROOT, c.script)], { cwd: ROOT, env, stdio: "ignore" });
    } catch (e) {
      code = typeof e.status === "number" ? e.status : 1;
    }
  } finally {
    // Ordered so the planted file goes first: it is the one that would be
    // committed by mistake. The throwaway index is outside the repo entirely.
    rmSync(abs, { force: true });
    rmSync(tmp, { recursive: true, force: true });
  }
  return code;
}

for (const c of CASES) {
  test(c.name, () => {
    const code = runMutation(c);
    assert.notEqual(
      code,
      0,
      `${c.script} exited 0 with a planted defect in ${c.file}.\n` +
        `  Expected it to fail because: ${c.why}\n` +
        "  Either this gate has stopped firing, or its subject moved and it is now watching\n" +
        "  the wrong thing. Both are real findings — do not relax this assertion.",
    );
  });
}

test("the mutation harness leaves no trace in the working tree", () => {
  // The cleanup is in a `finally`, but a `finally` that is wrong is exactly the
  // kind of thing that only shows up as a mystery file in someone's next commit.
  const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter((l) => l.includes("zz-gate-mutation"));
  assert.deepEqual(dirty, [], `the harness left files behind:\n  ${dirty.join("\n  ")}`);
});
