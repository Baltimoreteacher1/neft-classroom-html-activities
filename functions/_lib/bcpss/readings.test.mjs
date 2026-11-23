#!/usr/bin/env node
/**
 * Vocabulary reading checks.
 *   node functions/bcpss-readings.test.mjs                     every unit has a valid reading
 *   node functions/bcpss-readings.test.mjs --file <path.mjs>   validate one authoring file only
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { BCPSS_UNITS, UNIT_CONNECTIONS } from "../../../data/bcpss-curriculum-seed.mjs";
import { validateReading } from "./reading-rules.js";

const unitById = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
const termsOf = (id) => (UNIT_CONNECTIONS.find((c) => c.unit_id === id)?.tier2_tier3_vocab || []).map((v) => v.term);

const fileIdx = process.argv.indexOf("--file");
let readings;
let expected = null;
if (fileIdx > -1) {
  const mod = await import(pathToFileURL(resolve(process.argv[fileIdx + 1])).href);
  readings = Object.values(mod).flat();
  expected = new Set(readings.map((r) => r.unit_id));
} else {
  const mod = await import("../../../db/seeds/bcpss/readings/index.mjs");
  readings = mod.UNIT_READINGS;
  expected = new Set(BCPSS_UNITS.map((u) => u.id));
}

const problems = [];
const seen = new Set();
for (const r of readings) {
  if (seen.has(r.unit_id)) problems.push(`${r.unit_id}: duplicate reading`);
  seen.add(r.unit_id);
  problems.push(...validateReading(r, unitById.get(r.unit_id), termsOf(r.unit_id)));
}
if (fileIdx === -1) {
  // Every unit in every grade must have a reading.
  const covered = new Map();
  for (const u of BCPSS_UNITS) {
    const c = covered.get(u.grade) || { have: 0, total: 0 };
    c.total += 1;
    if (seen.has(u.id)) c.have += 1;
    covered.set(u.grade, c);
  }
  for (const [grade, c] of covered) if (c.have < c.total) problems.push(`grade ${grade}: ${c.have}/${c.total} units have readings`);
  console.log(`Coverage: ${[...covered].map(([g, c]) => `${g}=${c.have}/${c.total}`).join(" ")}`);
}
void expected;
const answers = readings.flatMap((r) => (r.questions || []).map((q) => q.answer));
for (const a of [0, 1, 2]) if (answers.length > 20 && answers.filter((x) => x === a).length / answers.length > 0.5) problems.push(`answer position ${a} is used for more than half of the questions; vary it`);

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`FAIL: ${problems.length} problem(s) across ${readings.length} reading(s)`);
  process.exit(1);
}
console.log(`PASS: ${readings.length} vocabulary readings are valid`);
