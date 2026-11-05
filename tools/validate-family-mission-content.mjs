#!/usr/bin/env node
/* =============================================================================
 * validate-family-mission-content: every Family Practice page teaches ITS lesson, counts what it
 * shows, speaks both languages, keys its answers correctly, names its objective and links to files
 * that exist.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * The family pages are generated from a lesson config, a sidecar and shared topic banks. Each
 * string is well-formed, so the per-field gates pass, while the PAGE says the wrong thing:
 *   - all ten Unit 4 percent pages print a ratio visual ("1 batch: 2 cups flour : 3 cups water ...
 *     Scaling a ratio is like making a double batch of a recipe") because the generator maps the
 *     percent standard (6.AT.4) to its "ratios" topic and the percent branch of the mini model is
 *     unreachable;
 *   - the Quick route promises "one example and 2 problems" while the first paint shows a goal of 4;
 *   - Part 2 pages show Spanish per-choice notes with no English ones;
 *   - 25 page titles were never translated.
 *
 * RULES (each is proven to fire by tools/lib/family-mission-fixtures.mjs before the sweep)
 *   CONTAMINATION  text whose concept belongs to another lesson family (concept lexicon, per sentence)
 *                  unless tolerated, bridged with "because", or on the page by design (spiral review)
 *   COUNTS         every number a family sees equals what the page renders for that route
 *   BILINGUAL      EN and ES for every user-facing string; ES is not the English copied over
 *   ANSWER KEYS    keyed answers recomputed from the stem with exact arithmetic where the stem is
 *                  recognised; the rest is reported as un-checkable, never silently passed
 *   OBJECTIVE      config title = Reveal TOC title, session text present, standard code valid
 *   LINKS          internal links resolve to repo files; external links are listed in
 *                  data/homework-external-resources.json
 *
 * RATCHET: data/family-mission-content-baseline.json lists the KNOWN open findings. The gate fails on
 * a finding that is not in it. A baseline entry that no longer fires is reported (prune it with
 * --write-baseline); fixing a defect never breaks the gate. Unit 10 is reported, never gated.
 *
 *   node tools/validate-family-mission-content.mjs                 the gate (all 166 pages, ~40 s)
 *   node tools/validate-family-mission-content.mjs 4-1 4-1-part2   only these pages (no stale-entry report)
 *   node tools/validate-family-mission-content.mjs --report        list every finding by rule
 *   node tools/validate-family-mission-content.mjs --write-baseline  rewrite the baseline from today's findings
 * ========================================================================== */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { runSelfTests } from "./lib/family-mission-fixtures.mjs";
import { familyPageIds } from "./lib/family-mission-page.mjs";
import { analyzePage, findingKey } from "./lib/family-mission-run.mjs";

// FAMILY_MISSION_BASELINE lets the test point the gate at an empty baseline.
const BASELINE =
  process.env.FAMILY_MISSION_BASELINE ||
  join(REPO_ROOT, "data", "family-mission-content-baseline.json");

/** Who can close each open class. Written into the baseline so a finding is never an orphan. */
const OWNERS = {
  CONTAMINATION:
    "generator: scripts/lib/homework-experience.mjs renderMiniConceptSvg is called with topic 'ratios' for percent lessons",
  TOPIC_MISMATCH:
    "generator: scripts/homework-alignment.mjs detectVisualTopic maps 6.AT.4 to 'ratios'",
  COUNT_STATIC_GOAL:
    "generator: scripts/lib/homework-experience.mjs prints GOAL_TARGET in the first-paint chips regardless of the default route",
  BILINGUAL: "authoring or generator: see docs/family-mission/content-fixes.md",
  BILINGUAL_UNPAIRED: "generator",
};

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const ids = args.filter((a) => !a.startsWith("--"));

function readBaseline() {
  return existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : { findings: {} };
}

function groupByRule(findings) {
  const out = {};
  for (const f of findings) (out[f.rule] ||= []).push(f);
  return out;
}

function writeBaseline(findings) {
  const old = readBaseline();
  const byRule = groupByRule(findings);
  const doc = {
    _comment:
      "KNOWN open findings of tools/validate-family-mission-content.mjs. The gate fails on any finding not listed here; entries that no longer fire are reported so they can be pruned (node tools/validate-family-mission-content.mjs --write-baseline). Do not add an entry to silence a new defect: fix the source, or list it in docs/family-mission/content-fixes.md under needs-lead.",
    rules: Object.fromEntries(
      Object.keys(byRule)
        .sort()
        .map((r) => [
          r,
          { open: byRule[r].length, owner: old.rules?.[r]?.owner || OWNERS[r] || "unassigned" },
        ]),
    ),
    findings: Object.fromEntries(
      Object.keys(byRule)
        .sort()
        .map((r) => [r, [...new Set(byRule[r].map(findingKey))].sort()]),
    ),
  };
  writeFileSync(BASELINE, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`wrote ${BASELINE.replace(`${REPO_ROOT}/`, "")}: ${findings.length} known findings`);
}

function main() {
  runSelfTests();
  const all = familyPageIds();
  if (all.length === 0)
    throw new Error("swept zero family pages: a sweep that checks nothing verifies nothing");
  const sweep = ids.length ? ids : all;
  const findings = [];
  const tally = { ok: 0, mismatch: 0, uncheckable: 0, duplicate: 0 };
  const dirty = new Set();
  for (const id of sweep) {
    if (!all.includes(id)) throw new Error(`${id}: no lessons/${id}/homework.html`);
    const r = analyzePage(id);
    for (const k of Object.keys(tally)) tally[k] += r.answerTally[k];
    findings.push(...r.findings);
    if (r.findings.some((f) => !f.outOfScope)) dirty.add(id);
  }
  const inScope = findings.filter((f) => !f.outOfScope);
  if (flag("--write-baseline")) return writeBaseline(inScope);

  const known = new Set(Object.values(readBaseline().findings).flat());
  const fresh = inScope.filter((f) => !known.has(findingKey(f)));
  const seen = new Set(inScope.map(findingKey));
  const stale = [...known].filter((k) => !seen.has(k));
  const byRule = groupByRule(inScope);

  if (flag("--report")) {
    for (const [rule, list] of Object.entries(byRule)) {
      console.log(`\n${rule} (${list.length})`);
      for (const f of list.slice(0, 40))
        console.log(`  ${f.lesson} | ${f.field} | ${f.quote} | ${f.detail}`);
      if (list.length > 40) console.log(`  ... and ${list.length - 40} more`);
    }
  }
  const summary =
    Object.entries(byRule)
      .map(([r, l]) => `${r} ${l.length}`)
      .join(", ") || "none";
  console.log(
    `family-mission-content: ${sweep.length} pages, ${sweep.length - dirty.size} with no finding; known open: ${summary}; unit 10 (not gated): ${findings.length - inScope.length}`,
  );
  console.log(
    `answer keys: ${tally.ok} recomputed OK, ${tally.mismatch} mismatched, ${tally.uncheckable} un-checkable (not a pass), ${tally.duplicate} duplicate-value choices`,
  );
  if (!ids.length && stale.length)
    console.log(
      `note: ${stale.length} baseline entr${stale.length > 1 ? "ies" : "y"} no longer fire (fixed). Prune with --write-baseline.`,
    );
  if (fresh.length) {
    console.error(
      `\nFAIL validate-family-mission-content: ${fresh.length} finding(s) not in the baseline`,
    );
    for (const f of fresh.slice(0, 60))
      console.error(`  - [${f.rule}] ${f.lesson} | ${f.field} | ${f.quote} | ${f.detail}`);
    if (fresh.length > 60) console.error(`  ... and ${fresh.length - 60} more`);
    process.exit(1);
  }
  console.log("OK validate-family-mission-content (self-tests passed, no new findings)");
}

main();
