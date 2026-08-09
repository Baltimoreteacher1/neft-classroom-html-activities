#!/usr/bin/env node
/**
 * Check the edges in tools/graph/deploy-graph.json still hold.
 *
 * Three invariants, each one a bug that has actually happened here:
 *
 *   1. Every artifact this repo owns exists at the path claimed. A moved or
 *      renamed file leaves the map lying, and the map is the thing people
 *      trust when they ask "does editing this reach anyone?".
 *
 *   2. Every mirror names the artifact it mirrors, and a gate. An ungated
 *      mirror is how fix-it-design-challenge drifted 3,800 lines behind the
 *      page it mirrored while looking like a normal repo to edit.
 *
 *   3. Every hook command in .claude/settings.json points at a file that
 *      exists. Caught pre-bash-guard.sh, wired into PreToolUse for every
 *      Bash call and absent from the repo.
 *
 * Cross-repo paths are NOT checked — those repos are not on disk here. That
 * limit is reported rather than hidden, so nobody reads a pass as more than
 * it is.
 *
 *   node tools/graph/validate-graph.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const THIS_REPO = "neft-classroom-html-activities";

const graph = JSON.parse(readFileSync(resolve(HERE, "deploy-graph.json"), "utf8"));

const problems = [];
const notes = [];
let checked = 0;

const fail = (msg) => problems.push(msg);
const pass = (msg) => {
  checked++;
  console.log(`   ✓ ${msg}`);
};

console.log("deploy graph");

/* 1. Artifacts this repo owns must exist where the map says. */
for (const artifact of graph.artifacts) {
  if (artifact.repo !== THIS_REPO) {
    notes.push(`${artifact.id}: in ${artifact.repo}, not checkable from here`);
    continue;
  }
  if (!existsSync(resolve(ROOT, artifact.path))) {
    fail(`artifact "${artifact.id}" claims ${artifact.path}, which does not exist`);
    continue;
  }
  pass(`${artifact.id} → ${artifact.servedAt}`);
}

/* 2. Every mirror declares what it mirrors, and a gate that would catch drift. */
const artifactIds = new Set(graph.artifacts.map((a) => a.id));
for (const mirror of graph.mirrors) {
  if (!artifactIds.has(mirror.mirrorOf)) {
    fail(`mirror "${mirror.id}" mirrors unknown artifact "${mirror.mirrorOf}"`);
    continue;
  }
  if (!mirror.gate) {
    fail(
      `mirror "${mirror.id}" has no gate — an ungated mirror goes stale silently, ` +
        `which is the failure this file exists to prevent`,
    );
    continue;
  }
  if (graph.repos[mirror.repo]?.deploys) {
    fail(`"${mirror.repo}" is listed as a mirror but also claims a deploy pipeline`);
    continue;
  }
  pass(`${mirror.id} mirrors ${mirror.mirrorOf}, gated by ${mirror.gate}`);
}

/* 3. Hook commands must resolve. A hook pointing at a missing script is a
      broken repo for anyone who clones it fresh. */
const settingsPath = resolve(ROOT, ".claude/settings.json");
if (existsSync(settingsPath)) {
  const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  const commands = Object.values(settings.hooks ?? {})
    .flat()
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command)
    .filter((command) => typeof command === "string");

  for (const command of commands) {
    // Only the plain "$CLAUDE_PROJECT_DIR/path" form is resolvable statically;
    // anything with arguments or shell syntax is left alone deliberately.
    const match = command.match(/^\$CLAUDE_PROJECT_DIR\/([\w./-]+)$/);
    if (!match) {
      notes.push(`hook command not statically checkable: ${command}`);
      continue;
    }
    if (!existsSync(resolve(ROOT, match[1]))) {
      fail(`.claude/settings.json wires a hook to ${match[1]}, which does not exist`);
      continue;
    }
    pass(`hook ${match[1]} exists`);
  }
}

/* Route ownership is documentation, but overlapping exact patterns are not. */
const exact = graph.routeOwnership.filter((r) => !r.pattern.includes("*")).map((r) => r.pattern);
if (new Set(exact).size !== exact.length) {
  fail("two routeOwnership entries claim the same exact pattern");
} else {
  pass(`${graph.routeOwnership.length} route ownership entries, no exact-pattern collision`);
}

if (notes.length) {
  console.log("\n   not checkable from this repo:");
  for (const note of notes) console.log(`   · ${note}`);
}

if (problems.length) {
  console.error(`\n✗ deploy graph is out of date (${problems.length}):`);
  for (const problem of problems) console.error(`   - ${problem}`);
  console.error(
    "\n  Fix the repo or fix the map — but do not leave them disagreeing.\n" +
      "  A map that lies is worse than no map, because people trust it.",
  );
  process.exit(1);
}

console.log(`\n✓ deploy graph holds (${checked} edges checked)`);
