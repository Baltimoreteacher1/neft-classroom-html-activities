#!/usr/bin/env node
// Part 2's leveled table sets must not repeat themselves. Before 2026-08-27,
// every one of the 76 part2 configs repeated 3-8 Review warm-up questions
// inside its group sets, and 36 also carried internal duplicates hidden by a
// "(Lesson X.Y)" label prefix — a student met "Find the mean of: 10, 14, 8,
// 12, 16" three times in one 45-minute block. The generator now normalizes
// and dedupes; this pins it. Levels are also capped at five problems, because
// ten-problem sets turned Group Work into a second worksheet with the actual
// collaborative solve seven screens down.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const lessonsDir = join(root, "lessons");

function normStem(s) {
  return String(s)
    .replace(/\(Lesson \d+\.\d+\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function auditConfig(cfg) {
  const problems = [];
  const warmup = new Set(
    ((cfg.reviewWarmup || {}).questions || []).map((q) => normStem(q?.stem || "")).filter(Boolean),
  );
  for (const [level, items] of Object.entries(cfg.groupLevels || {})) {
    if (!Array.isArray(items)) continue;
    if (items.length > 5) problems.push(`${level}: ${items.length} problems (cap is 5)`);
    const seen = new Set();
    for (const item of items) {
      const stem = normStem(item?.stem || item?.prompt || "");
      if (!stem) continue;
      if (seen.has(stem)) problems.push(`${level}: duplicate stem "${stem.slice(0, 60)}"`);
      if (warmup.has(stem)) problems.push(`${level}: repeats warm-up stem "${stem.slice(0, 60)}"`);
      seen.add(stem);
    }
  }
  return problems;
}

// ── Self-test: the detector must fire on the exact shapes that shipped. ──
const shipped = {
  reviewWarmup: { questions: [{ stem: "Find the mean of: 10, 14, 8, 12, 16" }] },
  groupLevels: {
    level1: [
      { stem: "Find the mean of: 10, 14, 8, 12, 16" }, // warm-up repeat
      { stem: "Order the data set 3, 9, 5" },
      { stem: "(Lesson 2.3) Order the data set 3, 9, 5" }, // labeled duplicate
    ],
  },
};
assert.equal(auditConfig(shipped).length, 2, "detectors stopped firing on the shipped shapes");
assert.equal(
  auditConfig({
    groupLevels: { level1: [1, 2, 3, 4, 5, 6].map((n) => ({ stem: `Problem ${n}` })) },
  }).length,
  1,
  "the level cap detector stopped firing",
);
assert.equal(
  auditConfig({ groupLevels: { level1: [{ stem: "One" }, { stem: "Two" }] } }).length,
  0,
);

// ── The real sweep ──
const ids = readdirSync(lessonsDir).filter((d) => /-part2$/.test(d));
assert.ok(ids.length >= 70, `expected the part2 fleet, found ${ids.length}`);
const failures = [];
for (const id of ids) {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
  } catch {
    continue;
  }
  for (const problem of auditConfig(cfg)) failures.push(`${id} ${problem}`);
}
assert.deepEqual(failures, [], `part2 group sets regressed:\n${failures.join("\n")}`);

console.log(`part-two-integrity: PASS (${ids.length} configs, 3 detectors self-tested)`);
