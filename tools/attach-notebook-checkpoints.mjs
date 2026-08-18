#!/usr/bin/env node
/**
 * attach-notebook-checkpoints.mjs — give every core lesson its three notebook
 * checkpoints.
 *
 * The checkpoints themselves are just `{ box, phase }`: `prompt` is optional and
 * falls back to the shared classroom copy in engine/core/notebook-checkpoint.js,
 * so a lesson gets a working, correctly-worded checkpoint on day one and
 * authoring a lesson-specific prompt is an upgrade rather than a prerequisite.
 *
 * NON-DESTRUCTIVE. A lesson that already declares `notebook` is left exactly as
 * it is — this script never overwrites an authored prompt, and re-running it is
 * a no-op. That is the generator rule this repo learned the hard way: the
 * generator owns what it emits, and anything on disk it does not emit is
 * authored and survives.
 *
 * Phase mapping (see the engine's positional PHASE_IDS):
 *   box 1 Math Words   → launch    — vocabulary is an extra panel, not a phase;
 *                                    launch is the first gateable phase.
 *   box 2 Today's Math → explore   — where the rule/model is built.
 *   box 3 My Work      → practice  — where the numbered problems are.
 *
 * A lesson missing any of those three sections is REPORTED AND SKIPPED, never
 * guessed at: a checkpoint on the wrong phase is worse than none.
 *
 * CORE LESSONS ONLY, and that is a hard boundary rather than a starting scope.
 * The small-group (group1 / group2) and catch-up variants are rendered by
 * engine/core/small-group-renderer.js, which never calls createApp() — so the
 * block and the gate are both unreachable there. Their configs DO carry
 * launch/explore/practice sections, so widening the `CORE` pattern would write
 * three checkpoints into each of 204 pathways that render nowhere and gate
 * nothing. validate:notebook fails if any variant ever carries one.
 *
 * Usage: node tools/attach-notebook-checkpoints.mjs [--dry-run]
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LESSONS = "lessons";
const CORE = /^\d+-\d+$/;
const MAP = [
  { box: 1, phase: "launch", section: "launch" },
  { box: 2, phase: "explore", section: "explore" },
  { box: 3, phase: "practice", section: "practice" },
];

const EXPECTED = { checkpoints: MAP.map(({ box, phase }) => ({ box, phase })) };
const BLOCK = JSON.stringify({ notebook: EXPECTED }, null, 2).split("\n").slice(1, -1).join("\n");

const dryRun = process.argv.includes("--dry-run");
const added = [];
const kept = [];
const skipped = [];

for (const id of readdirSync(LESSONS)
  .filter((d) => CORE.test(d))
  .sort()) {
  const file = join(LESSONS, id, "config.json");
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    skipped.push(`${id}: no readable config.json`);
    continue;
  }
  if (config.notebook) {
    kept.push(id);
    continue;
  }
  const missing = MAP.filter((m) => !config[m.section]).map((m) => m.section);
  if (missing.length) {
    skipped.push(`${id}: no ${missing.join(", ")} section — phase match not confident`);
    continue;
  }
  // TEXTUAL insertion, not a JSON round-trip. Re-serialising the whole config
  // would silently reformat every line these files have that Biome does not
  // police (lesson configs are outside its `includes`), burying a 16-line
  // addition in a hundred lines of unrelated whitespace churn.
  const raw = readFileSync(file, "utf8");
  const close = raw.lastIndexOf("}");
  if (close < 0) {
    skipped.push(`${id}: config.json has no closing brace`);
    continue;
  }
  const head = raw.slice(0, close).replace(/\s+$/, "");
  const patched = `${head},\n${BLOCK}\n}\n`;
  // Never write something that does not parse back to the same lesson.
  const reparsed = JSON.parse(patched);
  if (JSON.stringify(reparsed.notebook) !== JSON.stringify(EXPECTED)) {
    skipped.push(`${id}: patched config did not round-trip`);
    continue;
  }
  if (!dryRun) writeFileSync(file, patched);
  added.push(id);
}

console.log(`notebook checkpoints — added: ${added.length}, already present: ${kept.length}`);
if (skipped.length) {
  console.log(`SKIPPED (${skipped.length}) — phases could not be matched confidently:`);
  for (const s of skipped) console.log(`  - ${s}`);
}
if (dryRun) console.log("(dry run — nothing written)");
