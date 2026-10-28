#!/usr/bin/env node
// Runs the five browser gates in ONE browser pass per viewport and writes each gate's report
// (reports/gate-<name>-<label>.json). Identical verdicts to running them one at a time, at about
// a fifth of the browser time - this is what the publisher scorecard uses to collect its data.
//
//   node tools/run-browser-gates.mjs --base http://localhost:4499 --label before
//   node tools/run-browser-gates.mjs --only contrast-browser,axe-lessons --lessons 3-1
//
// Exit code: 1 if ANY selected gate fails, 3 if it could not run at all.
import { pathToFileURL } from "node:url";
import { parseArgs, runGates } from "./lib/lesson-gate-kit.mjs";
import { gate as axe } from "./validate-axe-lessons.mjs";
import { gate as consoleClean } from "./validate-console-clean.mjs";
import { gate as contrast } from "./validate-contrast-browser.mjs";
import { gate as responsive } from "./validate-responsive.mjs";
import { gate as typography } from "./validate-typography-browser.mjs";

export const ALL_GATES = [contrast, typography, responsive, consoleClean, axe];

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const only = args.only ? String(args.only).split(",") : null;
  const gates = ALL_GATES.filter((g) => !only || only.includes(g.name));
  if (!gates.length) {
    console.error(`--only matched no gate (have: ${ALL_GATES.map((g) => g.name).join(", ")})`);
    process.exit(1);
  }
  process.exit(await runGates(gates));
}
