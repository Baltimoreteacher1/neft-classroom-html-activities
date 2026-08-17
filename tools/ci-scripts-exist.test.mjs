#!/usr/bin/env node
/* =============================================================================
 * ci-scripts-exist — every `npm run X` in a GitHub workflow must exist.
 * -----------------------------------------------------------------------------
 * `.github/workflows/predeploy-verify.yml` ran `npm run audit:deps` while that
 * script was not in package.json. GitHub still created the job; the step died
 * as a missing-script error labelled by file path, which reads like an ordinary
 * red check and hid that the named command had never been wired.
 *
 * This gate parses workflow YAML for `npm run <name>` (comments stripped) and
 * asserts each name is a package.json script. Self-tests the extractor first
 * so a regex that stops firing cannot report a clean CI graph.
 * ============================================================================= */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const SCRIPTS = pkg.scripts || {};

/** Collect `npm run <name>` tokens from workflow text, ignoring `#` comments.
 *  Names may contain colons (`validate:secrets`) but a trailing colon is the
 *  start of a glob in a deny-list like `Bash(npm run deploy:*)`, not a script. */
export function npmScriptsIn(text) {
  const names = new Set();
  for (const line of String(text).split("\n")) {
    const code = line.replace(/#.*$/, "");
    for (const m of code.matchAll(/npm run ([a-z0-9_-]+(?::[a-z0-9_-]+)*)/gi)) {
      names.add(m[1]);
    }
  }
  return [...names].sort();
}

/* --- Self-test: the extractor must still see the defect that shipped ------ */
assert.deepEqual(npmScriptsIn("        run: npm run audit:deps\n"), ["audit:deps"]);
assert.deepEqual(npmScriptsIn('        run: npm run smoke:live -- --expect "$GITHUB_SHA"\n'), [
  "smoke:live",
]);
assert.deepEqual(npmScriptsIn("# Do NOT run npm run deploy\n"), []);
assert.deepEqual(npmScriptsIn("        run: npm ci\n"), []);
assert.deepEqual(
  npmScriptsIn('            --disallowed-tools "Bash(npm run deploy:*),Bash(npm run build:*)"\n'),
  ["build", "deploy"],
);

const workflowsDir = join(ROOT, ".github", "workflows");
const files = readdirSync(workflowsDir).filter((f) => /\.ya?ml$/i.test(f));
assert.ok(files.length > 0, "no workflow files found");

const missing = [];
for (const f of files) {
  const text = readFileSync(join(workflowsDir, f), "utf8");
  for (const name of npmScriptsIn(text)) {
    if (!(name in SCRIPTS)) missing.push(`${f}: npm run ${name}`);
  }
}

assert.deepEqual(
  missing,
  [],
  `GitHub workflows call npm scripts that do not exist in package.json:\n  ${missing.join("\n  ")}`,
);

console.log(`ci-scripts-exist: ${files.length} workflow(s), every npm run maps to a script.`);
