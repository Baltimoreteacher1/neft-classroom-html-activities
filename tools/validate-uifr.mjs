#!/usr/bin/env node
/**
 * CI gate: assert every lesson creates the conditions for a BCPS UIFR
 * TEACH · Level 4 (Highly Effective) rating on all DIRECT indicators (T1–T5).
 *
 * Uses the same engine module as runtime (engine/core/uifr.js) so the gate, the
 * hidden runtime <meta> stamp, the Teacher Mode panel, and the coverage report
 * can never drift. Fails (exit 1) if any lesson is missing a direct indicator.
 * T6–T7 are teacher-facilitated and reported, not gated. Run: npm run validate:uifr
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeTeachL4Evidence } from "../engine/core/uifr.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDir = join(root, "lessons");

let total = 0;
const failures = [];
for (const id of readdirSync(lessonsDir).sort()) {
  const cfgPath = join(lessonsDir, id, "config.json");
  if (!existsSync(cfgPath)) continue;
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  } catch (e) {
    failures.push(`${id}: config.json is not valid JSON (${e.message})`);
    continue;
  }
  total += 1;
  const ev = computeTeachL4Evidence(cfg);
  const missing = ev.indicators
    .filter((i) => i.applicability === "direct" && !i.covered)
    .map((i) => i.code);
  if (missing.length) failures.push(`${id}: missing Level 4 conditions for ${missing.join(", ")}`);
}

if (failures.length) {
  console.error("validate-uifr: FAIL — lessons missing TEACH Level 4 conditions on direct indicators:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `validate-uifr: PASS — all ${total} lessons create the conditions for TEACH Level 4 on every direct indicator (T1–T5).`,
);
