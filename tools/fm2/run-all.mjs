#!/usr/bin/env node
// Runs the Family Math 2.0 suites and records pass/fail per file in docs/family-math-2-results.json,
// which tools/fm2/trace.mjs reads. A suite that was not run keeps its previous result.
//
//   node tools/fm2/run-all.mjs --unit            math and logic suites (tools/fm2/**/*.test.mjs)
//   node tools/fm2/run-all.mjs --browser         browser suites (tools/fm2/**/accept-*.mjs, e2e-*.mjs)
//   node tools/fm2/run-all.mjs --only <substr>   only files whose path contains the text
import { execFile, execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { kindOf } from "./trace.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const RESULTS = join(ROOT, "docs/family-math-2-results.json");
const args = process.argv.slice(2);
const wantUnit = args.includes("--unit") || !args.includes("--browser");
const wantBrowser = args.includes("--browser") || !args.includes("--unit");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : "";
const JOBS = Number(process.env.FM2_JOBS || 3);

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
};

const files = walk(join(ROOT, "tools/fm2"))
  .map((abs) => relative(ROOT, abs))
  .filter((file) => {
    const kind = kindOf(file);
    return (
      ((kind === "unit" && wantUnit) || (kind === "browser" && wantBrowser)) && file.includes(only)
    );
  })
  .sort();

const run = (file) =>
  new Promise((resolve) => {
    const started = Date.now();
    execFile(
      "node",
      [file],
      { cwd: ROOT, timeout: 900_000, maxBuffer: 32 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const tail = `${stdout}\n${stderr}`.trim().split("\n").slice(-4).join(" | ").slice(0, 400);
        resolve({ file, pass: !error, ms: Date.now() - started, tail });
      },
    );
  });

const previous = existsSync(RESULTS) ? JSON.parse(readFileSync(RESULTS, "utf8")) : { results: {} };
const results = { ...previous.results };
const queue = [...files];
await Promise.all(
  Array.from({ length: JOBS }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const outcome = await run(item);
      results[item] = {
        pass: outcome.pass,
        ms: outcome.ms,
        at: new Date().toISOString(),
        tail: outcome.pass ? "" : outcome.tail,
      };
      console.log(
        `${outcome.pass ? "PASS" : "FAIL"}  ${item}  ${outcome.ms}ms${outcome.pass ? "" : `\n      ${outcome.tail}`}`,
      );
    }
  }),
);
for (const file of Object.keys(results)) if (!existsSync(join(ROOT, file))) delete results[file];
const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
writeFileSync(
  RESULTS,
  `${JSON.stringify({ sha, ranAt: new Date().toISOString(), results }, null, 1)}\n`,
);
const failed = files.filter((file) => results[file]?.pass === false);
console.log(`${files.length - failed.length}/${files.length} suites passed.`);
process.exit(failed.length ? 1 : 0);
