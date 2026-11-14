#!/usr/bin/env node
/**
 * Content-integrity gate for the ACCESS Practice Lab (thelanguagepage.com).
 *
 * Every activity and every practice test is hashed in full (activity text,
 * problem stems, options, answer keys, pictures, standards tags). The hashes
 * live in tools/lib/access-lab-integrity.json. Presentation, structure
 * and metadata work must not change them: new metadata goes in sidecar files
 * keyed by activity id, never into the activity objects.
 *
 *   node tools/access-lab-integrity.mjs           check (exit 1 on drift)
 *   node tools/access-lab-integrity.mjs --write   re-record after an intended edit
 *
 * An intended content edit must be re-recorded AND its ids added to `allow`
 * in integrity.json with a reason, so the change is visible in review.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { allActivities, loadTests, REPO_ROOT } from "./lib/access-lab-content.mjs";

export const INTEGRITY_FILE = join(REPO_ROOT, "tools", "lib", "access-lab-integrity.json");

/** JSON with object keys sorted, so key order never changes a hash. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

const hash = (value) => createHash("sha256").update(canonical(value)).digest("hex").slice(0, 16);

export function computeIntegrity() {
  const activities = {};
  for (const { band, domain, level, activity } of allActivities()) {
    const key = `${band}/${domain}/${level}/${activity.id}`;
    if (key in activities) throw new Error(`duplicate activity key ${key}`);
    activities[key] = hash(activity);
  }
  const tests = {};
  for (const { data } of loadTests()) tests[data.id] = hash(data);
  return { activities, tests };
}

/** Compare current content with the recorded hashes. Returns a list of problems. */
export function checkIntegrity(recorded, current = computeIntegrity()) {
  const allow = new Set((recorded.allow || []).map((a) => a.key));
  const problems = [];
  for (const group of ["activities", "tests"]) {
    const was = recorded[group] || {};
    const now = current[group];
    for (const key of Object.keys(was))
      if (!(key in now)) {
        if (!allow.has(key)) problems.push(`${group}: removed ${key}`);
      } else if (was[key] !== now[key] && !allow.has(key))
        problems.push(`${group}: changed ${key}`);
    for (const key of Object.keys(now))
      if (!(key in was) && !allow.has(key)) problems.push(`${group}: added ${key}`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const current = computeIntegrity();
  if (process.argv.includes("--write")) {
    let allow = [];
    try {
      allow = JSON.parse(readFileSync(INTEGRITY_FILE, "utf8")).allow || [];
    } catch {}
    writeFileSync(
      INTEGRITY_FILE,
      `${JSON.stringify({ version: 1, allow, ...current }, null, 1)}\n`,
    );
    console.log(
      `access-lab-integrity: recorded ${Object.keys(current.activities).length} activities, ${Object.keys(current.tests).length} tests`,
    );
  } else {
    const problems = checkIntegrity(JSON.parse(readFileSync(INTEGRITY_FILE, "utf8")), current);
    if (problems.length) {
      console.error(`access-lab-integrity: ${problems.length} problem(s)`);
      for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
      process.exit(1);
    }
    console.log(
      `access-lab-integrity: ok — ${Object.keys(current.activities).length} activities, ${Object.keys(current.tests).length} tests unchanged`,
    );
  }
}
