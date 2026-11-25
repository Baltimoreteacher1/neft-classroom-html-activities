#!/usr/bin/env node
// F4 Overnight QA Job for the Language Page gate suite.
// Runs validate-language-page.mjs, diffs results against tools/language-page/qa-baseline.json,
// and writes overnight-qa.md + overnight-qa.json to ~/Documents/EduWonderLab/reports-YYYY-MM-DD/
// (never inside the repository's reports/ directory).
//
// Usage:
//   node tools/overnight-qa-language-page.mjs [--no-browser] [--dry-run] [--date YYYY-MM-DD] [--only G-01,G-02]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = path.join(REPO_ROOT, "tools/language-page/qa-baseline.json");
const VALIDATOR_PATH = path.join(REPO_ROOT, "tools/validate-language-page.mjs");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve the external report directory outside the repository:
 * ~/Documents/EduWonderLab/reports-YYYY-MM-DD
 */
export function resolveReportDir(dateStr = new Date().toISOString().slice(0, 10)) {
  const normalized = String(dateStr ?? "").trim();
  if (!DATE_RE.test(normalized)) {
    throw new Error(`Invalid dateStr "${dateStr}": expected YYYY-MM-DD`);
  }
  return path.join(os.homedir(), "Documents/EduWonderLab", `reports-${normalized}`);
}

/**
 * Pure diff of current gate rows against a committed baseline map.
 * @param {Array<{ id: string, name?: string, status: string, errors?: number }>} currentRows
 * @param {{ version?: number, gates?: Record<string, string> }} baseline
 */
export function diffAgainstBaseline(currentRows, baseline) {
  const rows = Array.isArray(currentRows) ? currentRows : [];
  const baseGates = baseline && typeof baseline.gates === "object" ? baseline.gates : {};

  const regressions = [];
  const improvements = [];
  const newGates = [];

  let pass = 0;
  let fail = 0;
  let skip = 0;

  for (const row of rows) {
    const id = String(row?.id ?? "");
    const name = String(row?.name ?? "");
    const status = String(row?.status ?? "FAIL");

    if (status === "PASS") pass += 1;
    else if (status === "SKIP") skip += 1;
    else fail += 1;

    const prev = baseGates[id];
    if (!prev) {
      newGates.push({ id, name, status });
    } else if (prev === "PASS" && status === "FAIL") {
      regressions.push({ id, name, from: prev, to: status, errors: row.errors ?? 1 });
    } else if (prev === "FAIL" && status === "PASS") {
      improvements.push({ id, name, from: prev, to: status });
    }
  }

  return {
    regressions,
    improvements,
    newGates,
    summary: {
      total: rows.length,
      pass,
      fail,
      skip,
      regressionCount: regressions.length,
      improvementCount: improvements.length,
      newGateCount: newGates.length,
    },
  };
}

function formatMarkdownReport({ dateStr, diff, rows }) {
  const lines = [
    `# Overnight Language Page QA — ${dateStr}`,
    "",
    `- Total gates: ${diff.summary.total}`,
    `- Pass: ${diff.summary.pass} | Fail: ${diff.summary.fail} | Skip: ${diff.summary.skip}`,
    `- Regressions: ${diff.summary.regressionCount} | Improvements: ${diff.summary.improvementCount} | New gates: ${diff.summary.newGateCount}`,
    "",
  ];

  if (diff.regressions.length) {
    lines.push("## Regressions (PASS -> FAIL)", "");
    for (const r of diff.regressions) {
      lines.push(`- **${r.id}** ${r.name}: ${r.from} -> ${r.to} (${r.errors} error(s))`);
    }
    lines.push("");
  }

  if (diff.improvements.length) {
    lines.push("## Improvements (FAIL -> PASS)", "");
    for (const imp of diff.improvements) {
      lines.push(`- **${imp.id}** ${imp.name}: ${imp.from} -> ${imp.to}`);
    }
    lines.push("");
  }

  if (diff.newGates.length) {
    lines.push("## New Gates (Not in Baseline)", "");
    for (const g of diff.newGates) {
      lines.push(`- **${g.id}** ${g.name}: ${g.status}`);
    }
    lines.push("");
  }

  lines.push("## Gate Results", "", "| Gate | Name | Status |", "| --- | --- | --- |");
  for (const row of rows) {
    lines.push(`| ${row.id} | ${row.name ?? ""} | ${row.status} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function runCli() {
  const args = process.argv.slice(2);
  const hasFlag = (f) => args.includes(f);
  const getVal = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);

  const noBrowser = hasFlag("--no-browser");
  const dryRun = hasFlag("--dry-run");
  const only = getVal("--only");
  const dateStr = getVal("--date") ?? new Date().toISOString().slice(0, 10);

  const reportDir = resolveReportDir(dateStr);
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));

  const tmpJson = path.join(os.tmpdir(), `overnight-qa-${process.pid}-${Date.now()}.json`);
  const validatorArgs = [VALIDATOR_PATH, "--json", tmpJson];
  if (noBrowser) validatorArgs.push("--no-browser");
  if (only) validatorArgs.push("--only", only);

  const proc = spawnSync(process.execPath, validatorArgs, {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });

  let rows = [];
  if (fs.existsSync(tmpJson)) {
    rows = JSON.parse(fs.readFileSync(tmpJson, "utf8"));
    fs.rmSync(tmpJson, { force: true });
  }

  const diff = diffAgainstBaseline(rows, baseline);
  const md = formatMarkdownReport({ dateStr, diff, rows });
  const jsonPayload = {
    generatedAt: new Date().toISOString(),
    date: dateStr,
    baselineVersion: baseline.version ?? 1,
    validatorExitCode: proc.status ?? 1,
    diff,
    rows,
  };

  if (dryRun) {
    console.log(`[dry-run] Would write overnight-qa.md and overnight-qa.json to ${reportDir}`);
    console.log(JSON.stringify(diff.summary, null, 2));
  } else {
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, "overnight-qa.md"), md, "utf8");
    fs.writeFileSync(
      path.join(reportDir, "overnight-qa.json"),
      JSON.stringify(jsonPayload, null, 2),
      "utf8",
    );
    console.log(`Wrote overnight QA reports to ${reportDir}`);
  }

  if (diff.summary.regressionCount > 0 || diff.summary.fail > 0) {
    process.exit(1);
  }
  process.exit(0);
}

const invokedAsScript =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedAsScript) {
  runCli();
}
