#!/usr/bin/env node
/**
 * CI gate: assert the CCSS single source of truth (data/ccss-standards.json)
 * actually covers every standard referenced by lesson configs.
 *
 * Fails (exit 1) if any lessons/<id>/config.json carries a `standard` that is
 * not present in the canonical registry, so the registry can't silently drift
 * out of sync with the curriculum. Run: npm run validate:ccss
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assertNonEmpty } from "../tools/lib/non-empty.mjs";
import { allStandardCodes, isKnownStandard } from "./lib/ccss.mjs";

const root = process.cwd();
const lessonsDir = join(root, "lessons");

const used = new Map(); // standard -> [lessonIds]
for (const id of readdirSync(lessonsDir)) {
  const cfg = join(lessonsDir, id, "config.json");
  if (!existsSync(cfg)) continue;
  let data;
  try {
    data = JSON.parse(readFileSync(cfg, "utf8"));
  } catch {
    continue;
  }
  if (!data.standard) continue;
  if (!used.has(data.standard)) used.set(data.standard, []);
  used.get(data.standard).push(id);
}

assertNonEmpty(
  "lesson standards",
  used,
  "Nothing was read from lessons/*/config.json — a zero here means the walk broke, not that no lesson declares a standard.",
);
const missing = [...used.keys()].filter((s) => !isKnownStandard(s));

if (missing.length) {
  console.error(
    "validate-ccss: FAIL — standards used by lessons but missing from data/ccss-standards.json:",
  );
  for (const s of missing) console.error(`  ${s}  (used by: ${used.get(s).join(", ")})`);
  console.error("Add these to data/ccss-standards.json.");
  process.exit(1);
}

console.log(
  `validate-ccss: PASS — ${used.size} distinct lesson standards all present in the registry (${allStandardCodes().length} standards defined).`,
);
