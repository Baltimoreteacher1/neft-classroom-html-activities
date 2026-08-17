#!/usr/bin/env node
/* =============================================================================
 * validate-production.mjs — production-readiness with honest skip semantics.
 * -----------------------------------------------------------------------------
 * qa:loop is the pre-push gate. This command is the production-readiness
 * report: the same invariants, plus live smoke, with SKIPPED and
 * NOT AVAILABLE IN THIS ENVIRONMENT as first-class statuses.
 *
 * A skipped required check is NOT a pass. Locally, `validate:lesson-boot`
 * exits 0 when there is no browser and qa:loop prints PASS. That is
 * intentional for everyday pushes on machines without Chromium. It is
 * dishonest for a command whose job is to say whether the site is ready.
 *
 * Exit codes:
 *   0  every required check PASSed
 *   1  at least one required check FAILed
 *   2  no failures, but a required check was SKIPPED or NOT AVAILABLE
 *
 *   node scripts/validate-production.mjs
 *   node scripts/validate-production.mjs --no-live   # do not hit production
 *   node scripts/validate-production.mjs --list
 * ============================================================================= */
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const NO_LIVE = argv.includes("--no-live");
const LIST_ONLY = argv.includes("--list");

/** Status strings this command is allowed to print. Do not invent a fifth. */
export const STATUSES = Object.freeze([
  "PASS",
  "FAIL",
  "SKIPPED",
  "NOT AVAILABLE IN THIS ENVIRONMENT",
]);

/**
 * Classify one check from its process result. lesson-boot's local skip used
 * to look identical to 16 pages rendering; production-readiness must not.
 */
export function classify({ name, exitCode, stdout = "", stderr = "" }) {
  const text = `${stdout}\n${stderr}`;
  if (/render smoke SKIPPED|SKIPPED \(not a page defect\)/.test(text)) {
    return "SKIPPED";
  }
  if (
    name === "smoke:live" &&
    exitCode !== 0 &&
    /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed|network|UND_ERR|aborted/i.test(text)
  ) {
    return "NOT AVAILABLE IN THIS ENVIRONMENT";
  }
  if (exitCode === 0) return "PASS";
  return "FAIL";
}

export function overallExit(rows) {
  const required = rows.filter((r) => r.required);
  if (required.some((r) => r.status === "FAIL")) return 1;
  if (
    required.some((r) => r.status === "SKIPPED" || r.status === "NOT AVAILABLE IN THIS ENVIRONMENT")
  ) {
    return 2;
  }
  return 0;
}

const CHECKS = [
  { name: "validate", required: true },
  { name: "validate:lesson-boot", required: true },
  { name: "smoke:live", required: !NO_LIVE, live: true },
];

export { CHECKS };

function runNpm(name) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    execFile(
      "npm",
      ["run", name],
      { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const exitCode = err && typeof err.code === "number" ? err.code : err ? 1 : 0;
        resolve({
          name,
          exitCode,
          stdout: String(stdout || ""),
          stderr: String(stderr || ""),
          secs: ((Date.now() - t0) / 1000).toFixed(1),
        });
      },
    );
  });
}

async function main() {
  console.log("===============================================================");
  console.log("EduWonderLab — production-readiness");
  console.log("PASS / FAIL / SKIPPED / NOT AVAILABLE IN THIS ENVIRONMENT");
  console.log("A skipped required check is not a pass. Production is not modified.");
  console.log("===============================================================");

  if (LIST_ONLY) {
    for (const c of CHECKS) {
      const flag = c.required ? "required" : "optional";
      console.log(
        `  ${c.name.padEnd(28)} ${flag}${c.live ? "  (hits production, read-only)" : ""}`,
      );
    }
    process.exit(0);
  }

  const rows = [];
  for (const c of CHECKS) {
    if (c.live && NO_LIVE) {
      rows.push({
        name: c.name,
        required: false,
        status: "NOT AVAILABLE IN THIS ENVIRONMENT",
        secs: "0.0",
        detail: "--no-live: production was not contacted",
      });
      console.log(`NOT AVAILABLE  ${c.name.padEnd(28)} 0.0s  (--no-live)`);
      continue;
    }
    const result = await runNpm(c.name);
    const status = classify(result);
    const detail = status === "FAIL" ? tail(result.stdout, result.stderr) : "";
    rows.push({ name: c.name, required: c.required, status, secs: result.secs, detail });
    console.log(`${status.padEnd(14)} ${c.name.padEnd(28)} ${result.secs}s`);
    if (detail) {
      for (const line of detail.split("\n").slice(0, 8)) console.log(`      | ${line}`);
    }
  }

  const exit = overallExit(rows);
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length]),
  );
  console.log("---------------------------------------------------------------");
  console.log(
    `PASS ${counts.PASS}  FAIL ${counts.FAIL}  SKIPPED ${counts.SKIPPED}  NOT AVAILABLE ${counts["NOT AVAILABLE IN THIS ENVIRONMENT"]}`,
  );
  if (exit === 0) {
    console.log("STATUS: PASS — every required check ran and passed. Production was not modified.");
  } else if (exit === 1) {
    console.log("STATUS: FAIL — a required check failed.");
  } else {
    console.log(
      "STATUS: INCOMPLETE — a required check was skipped or unavailable in this environment. This is not green.",
    );
  }
  process.exit(exit);
}

function tail(stdout, stderr) {
  return `${stdout}\n${stderr}`.trim().split("\n").slice(-12).join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
