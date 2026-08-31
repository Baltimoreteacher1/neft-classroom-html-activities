#!/usr/bin/env node
// fix-6-1-parallel-practice-shape.mjs — write the corrected
// tools/lib/small-group-parallel-practice.mjs output for 6-1's two small
// groups straight into their committed configs.
//
// WHY A DEDICATED TOOL, NOT `generate-small-group-lessons.mjs`
//
// The generator is additive by default (tools/lib/authored-overlay.mjs):
// parallelPractice items are matched by `id`, and 6-1's twelve ids
// (`6-1-group{N}-parallel-01` … `-12`) already exist on disk, so a plain
// `--only 6-1` run sees nothing NEW to add and leaves the old fraction ÷
// fraction items in place — confirmed by running it, which reported
// "nothing added" while the file was unchanged. `--replace` would pick up
// the fix, but it would also delete the four authored warm-up sets, the
// authored "Fix our table's thinking" task, and 6-1's authored practice
// items (added by tools/add-nonunit-fraction-division-items.mjs) — a dry
// run showed 39 authored values with no home under `--replace`. Writing
// the one field this fix touches, directly, is the smaller and safer move.
//
// Idempotent: buildParallelPractice() is pure arithmetic (no Math.random()),
// so re-running always recomputes the same 12 items and this is a no-op
// once applied.
import { readFileSync, writeFileSync } from "node:fs";
import { buildParallelPractice } from "./lib/small-group-parallel-practice.mjs";

const DRY = process.argv.includes("--dry-run");
const base = JSON.parse(readFileSync("lessons/6-1/config.json", "utf8"));

for (const group of [1, 2]) {
  const id = `6-1-group${group}`;
  const path = `lessons/${id}/config.json`;
  const config = JSON.parse(readFileSync(path, "utf8"));
  const bank = buildParallelPractice(base, id, group);
  const before = JSON.stringify(config.parallelPractice ?? null);
  const after = JSON.stringify(bank);
  if (before === after) {
    console.log(`${path}: already current`);
    continue;
  }
  config.parallelPractice = bank;
  console.log(`${DRY ? "[dry] " : ""}${path}: parallelPractice rewritten (12 items)`);
  if (!DRY) writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
}
