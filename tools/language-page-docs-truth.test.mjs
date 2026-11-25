#!/usr/bin/env node
/* =============================================================================
 * language-page-docs-truth.test.mjs — a doc may not say the opposite of what the code does.
 *
 * Four docs told four different stories about the Teacher Hub on thelanguagepage.com (not served; redirected; behind a
 * password) while functions/_lib/language-page.js serves it with no password. Docs that disagree with the code are
 * read as fact by the next agent and by a reviewer.
 *
 * This reads the exported facts (LAB_HOST_OPEN, HUB_BASE, the served-path predicate) and fails when a doc states the
 * opposite, using a small table of "says X while the code does Y" patterns. Self-tests run first.
 * ========================================================================== */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { HUB_BASE, LAB_HOST_OPEN, languagePageRoute } from "../functions/_lib/language-page.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DOCS = [
  "docs/language-page-migration.md",
  "docs/wida-data-studio-architecture.md",
  "docs/wida-data-privacy.md",
  "docs/class-platform.md",
  "docs/languageos/site-organization-and-migration.md",
];

// Facts taken from the code, not typed here.
const hubServed =
  languagePageRoute(new URL(`https://thelanguagepage.com${HUB_BASE}/`))?.kind === "serve";
const predictiveServed =
  languagePageRoute(new URL(`https://thelanguagepage.com${HUB_BASE}/predictive/`))?.kind ===
  "serve";

/** Patterns that are FALSE when the hub is served open. A sentence that names the host and the opposite. */
export const FALSE_WHEN_HUB_OPEN = [
  /Teacher Hub is not served here/i,
  /thelanguagepage\.com (now )?(redirects?|sends) (these paths|the hub|\/access-teacher)[^.]*eduwonderlab/i,
  /thelanguagepage\.com now serves behind the same teacher gate/i,
  /(score predictor|data studio) still redirects/i,
];

export function untrueSentences(text, patterns) {
  const out = [];
  for (const line of text.split("\n"))
    for (const re of patterns) if (re.test(line)) out.push(line.trim().slice(0, 140));
  return out;
}

// ---- self-tests: the exact sentences that shipped must be caught, the corrected ones must pass
for (const bad of [
  "**The Teacher Hub is not served here.** Its rosters",
  "thelanguagepage.com redirects these paths to eduwonderlab.com (`functions/_lib/language-page.js`).",
  "which thelanguagepage.com now serves behind the same teacher gate (the score predictor still redirects to",
])
  assert.ok(untrueSentences(bad, FALSE_WHEN_HUB_OPEN).length > 0, `missed: ${bad}`);
for (const good of [
  "**The Teacher Hub is served here, with no password** (`LAB_HOST_OPEN`)",
  "On thelanguagepage.com it is served with no password (`LAB_HOST_OPEN`; Joel, 2026-11-17).",
])
  assert.equal(
    untrueSentences(good, FALSE_WHEN_HUB_OPEN).length,
    0,
    `flagged a true sentence: ${good}`,
  );

// ---- the code's own facts
assert.equal(typeof LAB_HOST_OPEN, "boolean", "LAB_HOST_OPEN is no longer a boolean");

const problems = [];
if (LAB_HOST_OPEN && hubServed && predictiveServed) {
  for (const doc of DOCS)
    for (const s of untrueSentences(readFileSync(join(ROOT, doc), "utf8"), FALSE_WHEN_HUB_OPEN))
      problems.push(`${doc}: "${s}"`);
} else {
  problems.push(
    "the code no longer serves the Teacher Hub open on thelanguagepage.com: re-derive the patterns (FALSE_WHEN_HUB_*) from the new behaviour and update the docs in the same commit",
  );
}
if (problems.length) {
  console.error("language-page-docs-truth: FAIL");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `language-page-docs-truth: PASS (${DOCS.length} docs checked against functions/_lib/language-page.js, hub served open, 5 self-tests)`,
);
