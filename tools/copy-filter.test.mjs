#!/usr/bin/env node
/* =============================================================================
 * copy-filter.test.mjs — the static-copy filter must be rooted, not absolute.
 * -----------------------------------------------------------------------------
 * `scripts/ship.sh` assembles its deploy worktree under `.claude/worktrees/`,
 * and cpSync hands the filter ABSOLUTE paths. When the filter tested those, the
 * `/.claude/` branch of the pattern matched every file in the worktree and the
 * entire static copy silently did nothing — Rollup's own output still landed,
 * so `dist/` looked populated while containing none of the committed statics.
 *
 * That was invisible until vite.config.js grew a fail-loudly check for four
 * critical assets, at which point every deploy was blocked by a bug that only
 * ever existed in the deploy harness. Production was never wrong: Cloudflare
 * builds on a runner with no `.claude` ancestor. That asymmetry is exactly why
 * this needs a test rather than a comment — the failure mode is invisible in
 * the environment that matters and fatal in the one you develop in.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeCopyFilter, SKIP_COPY_RE } from "../scripts/lib/copy-filter.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* --- 1. The regression: a repo checked out under a `.claude/` ancestor ------ */
const WT = "/Users/x/repo/.claude/worktrees/deploy-abc";
const inWorktree = makeCopyFilter(WT);

for (const rel of [
  "assets/neft-theme.js",
  "assets/nt-page-enhance.js",
  "assets/nt-usage.js",
  "shared/save-resume/save-resume-engine.js",
  "curriculum/index.html",
  "math/unit-1/index.html",
]) {
  assert.equal(
    inWorktree(`${WT}/${rel}`),
    true,
    `"${rel}" must copy even when the repo root sits under a .claude/ directory — this is the bug that blocked every deploy`,
  );
}

/* --- 2. It must still reject what it was written to reject ----------------- */
const plain = makeCopyFilter("/Users/x/repo");
for (const rel of [
  ".claude/settings.json",
  "curriculum/thing/.claude/notes.json",
  "activities/demo/node_modules/pkg/index.js",
  "activities/demo/.git/HEAD",
  "engine/_engine/scratch.js",
  "docs/README.md",
  "activities/demo/NOTES.md",
]) {
  assert.equal(
    plain(`/Users/x/repo/${rel}`),
    false,
    `"${rel}" must NOT be copied into the published site`,
  );
}

/* --- 3. Paths outside the copy root are refused, not silently relativised --- */
assert.equal(
  plain("/Users/x/other/assets/app.js"),
  false,
  "a path outside the copy root must be refused",
);

/* --- 4. The root itself copies (cpSync tests it first) --------------------- */
assert.equal(plain("/Users/x/repo"), true, "the copy root itself must not be filtered out");

/* --- 5. vite.config.js must use the rooted factory, not a bare regex -------- */
const vite = readFileSync(join(ROOT, "vite.config.js"), "utf8");
assert.match(
  vite,
  /makeCopyFilter\(__dirname\)/,
  "vite.config.js must build its copy filter with makeCopyFilter(__dirname)",
);
assert.doesNotMatch(
  vite,
  /copyFilter\s*=\s*\(src\)\s*=>\s*!SKIP_COPY_RE\.test\(src\)/,
  "vite.config.js must not test the ABSOLUTE path again — that is the bug this file exists for",
);

/* --- 6. The pattern still contains the branches the site depends on --------- */
for (const frag of ["claude", "node_modules", "_engine"]) {
  assert.ok(SKIP_COPY_RE.source.includes(frag), `SKIP_COPY_RE lost its "${frag}" branch`);
}

console.log(
  "Static-copy filter: rooted at the copy root, 6 cases + the .claude-worktree regression covered.",
);
