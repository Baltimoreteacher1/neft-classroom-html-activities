#!/usr/bin/env node
/**
 * `functions/teacher-small-group/_facilitation-data.js` must be what its
 * generator would write today.
 *
 * WHY THIS EXISTS. That module is the teacher's small-group panel — who to
 * pull, what to ask, what to look for, what to do if they are stuck — and it is
 * GENERATED from every lesson's own config by
 * tools/generate-small-group-lessons.mjs. Generated lesson PAGES have
 * tools/generated-pages-fresh.test.mjs. This generated teacher DATA had
 * nothing, so a change to a lesson's vocabulary, its commonMistake, its
 * misconception tags, or to a facilitation template reached the panel only if
 * somebody remembered to re-run the generator.
 *
 * Nobody always remembers. Measured 2026-08-24: regenerating the module with no
 * source change of any kind moved 82 insertions and 84 deletions, including 108
 * sentence-frame lines that had been showing teachers a unit title
 * ("In this problem, appropriate measures of center means ___") where the
 * generator would now show the lesson's own vocabulary term
 * ("In this problem, mean means ___"). The panel was serving a build of itself
 * that no committed source produced.
 *
 * The comparison is on the DATA, not the file text — the module is written by
 * JSON.stringify and then reformatted by Biome, so a text comparison would fail
 * on whitespace and teach everyone to ignore this gate.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let output = "";
let ok = true;
try {
  output = execFileSync(
    process.execPath,
    [resolve(ROOT, "tools/generate-small-group-lessons.mjs"), "--check"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (error) {
  ok = false;
  output = `${error.stdout || ""}${error.stderr || ""}`;
}

assert.ok(
  ok,
  `the committed facilitation module is stale:\n${output.trim()}\n` +
    `Fix: node tools/generate-small-group-lessons.mjs --facilitation-only`,
);

/* A gate that stops firing and a gate watching a clean tree print the same
 * line, so prove the checker can still fail before trusting that it passed. */
assert.match(
  output,
  /facilitation freshness: \d+ lesson\(s\) match/,
  `--check did not report a comparison at all — it may have stopped comparing:\n${output}`,
);
const counted = Number(/facilitation freshness: (\d+)/.exec(output)?.[1] || 0);
assert.ok(
  counted >= 168,
  `--check compared only ${counted} lessons; a sweep that small has verified almost nothing`,
);

console.log(`facilitation data fresh: ${counted} small-group lessons match their generator.`);
