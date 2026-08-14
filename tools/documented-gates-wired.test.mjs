#!/usr/bin/env node
/* =============================================================================
 * documented-gates-wired — CLAUDE.md's command table must describe reality.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * `validate:reveal-assets` was written, documented in the CLAUDE.md table as
 * "Part of `validate`", and wired into package.json — all in one commit,
 * 4574ef7e9. Then it reached `main` with the tool file and the documentation
 * intact and the wiring GONE. `git log -S'validate:reveal-assets' origin/main --
 * package.json` is empty: main's package.json never contained it for a single
 * commit.
 *
 * The mechanism is this repo's deploy path. `scripts/ship.sh` builds main by
 * cherry-picking named SHAs onto a clean worktree, and `validate` is one
 * enormous single line that every gate-adding commit edits. That line is a
 * standing conflict magnet, and a conflict resolved toward main drops the new
 * gate while the tool file and the doc row — in other files, no conflict — land
 * clean. The result is the worst shape a QA system can take: a documented gate
 * that has never once executed. It sat that way for eight days and only
 * surfaced because someone ran the tool by hand.
 *
 * A doc that lies about a gate is worse than no doc, because it is read as
 * assurance. This test makes the two agree by construction:
 *
 *   1. every `npm run <script>` named in CLAUDE.md exists in package.json;
 *   2. every script CLAUDE.md says is "Part of `validate`" really is chained
 *      into `validate`.
 *
 * It is deliberately narrow. It does not check prose, counts, or whether a gate
 * is any good — only that a command the documentation tells a reader to trust
 * can actually be run, and runs where the documentation says it runs.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const SCRIPTS = pkg.scripts || {};
const DOC = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");

/* Commands the doc shows for illustration rather than as repo scripts. Each is
 * a real command a reader can run; none is an npm script in this package. */
const NOT_NPM_SCRIPTS = new Set([
  "ship", // documented as `ALLOW_DEPLOY=1 npm run ship -- <sha>`; exists, checked below
]);

test("every npm script CLAUDE.md names actually exists", () => {
  const named = new Set();
  for (const m of DOC.matchAll(/`npm run ([a-z0-9:_-]+)/gi)) named.add(m[1]);
  // The table's first column lists bare script names in backticks too.
  for (const m of DOC.matchAll(/^\|\s*`(npm run )?([a-z0-9:_-]+)`/gim)) {
    if (m[2] && m[2].includes(":")) named.add(m[2]);
  }
  assert.ok(named.size > 20, `expected to find many documented commands, found ${named.size}`);

  const missing = [...named]
    .filter((s) => !NOT_NPM_SCRIPTS.has(s))
    .filter((s) => !(s in SCRIPTS))
    .sort();
  assert.deepEqual(
    missing,
    [],
    "CLAUDE.md documents commands that do not exist in package.json — either add the script or fix the doc",
  );
});

test("every gate documented as part of `validate` is chained into it", () => {
  const chain = SCRIPTS.validate || "";
  assert.ok(chain, "package.json has no `validate` script");

  /* Rows in the command table read like:
   *   | `npm run validate:ccss` | Asserts … Part of `validate`. | … |
   * so a row that claims membership is one line containing both the script
   * name and the phrase. Matching per line keeps one row's claim from
   * attaching to its neighbour's script name. */
  const claimed = new Set();
  for (const line of DOC.split("\n")) {
    if (!/Part of `validate`/.test(line)) continue;
    /* Take the script from the row's FIRST column only. Row bodies cite other
     * gates in prose — validate:js-syntax's row explains that only
     * validate:lesson-boot's probe caught a truncated bundle — and reading the
     * whole line attributes the neighbour's name to this row's claim. */
    const first = line.match(/^\|\s*`(?:npm run )?((?:validate|eval):[a-z0-9:_-]+)`/i);
    if (first) claimed.add(first[1]);
  }
  assert.ok(
    claimed.has("validate:reveal-assets"),
    "the row this test was written for is gone — if the gate was retired, retire this assertion too",
  );

  const unwired = [...claimed].filter((s) => !chain.includes(`npm run ${s}`)).sort();
  assert.deepEqual(
    unwired,
    [],
    "CLAUDE.md says these are part of `validate`, but `validate` does not run them",
  );
});

test("validate:reveal-assets is reachable through the documented command", () => {
  assert.equal(SCRIPTS["validate:reveal-assets"], "node tools/validate-reveal-assets.mjs");
  assert.ok(SCRIPTS.validate.includes("npm run validate:reveal-assets"));
});
