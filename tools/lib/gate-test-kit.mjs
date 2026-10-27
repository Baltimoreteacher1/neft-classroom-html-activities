// Shared harness for the negative-control tests of the browser gates.
//
// A gate that has quietly stopped firing and a gate watching a clean page print the same thing.
// So each test runs the REAL gate CLI against tiny static fixtures (tools/fixtures/browser-gates),
// one seeded with exactly one defect, and asserts the gate exits 1 and NAMES the defect - then
// runs it on the clean fixture and asserts exit 0. Nothing is written: reports are suppressed
// with --no-report and the fixtures are served from a throwaway in-process server.
import { execFile } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launchBrowser, startStaticServer } from "./lesson-gate-kit.mjs";
import { exitSkipped } from "./skip-exit.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const FIXTURES = join(ROOT, "tools/fixtures/browser-gates");

export async function withFixtures(fn) {
  const b = await launchBrowser();
  if (!b) exitSkipped("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium");
  await b.close();
  const srv = await startStaticServer(FIXTURES);
  const run = (script, fixtures, extra = []) =>
    new Promise((ok) => {
      execFile(
        process.execPath,
        [
          join(ROOT, "tools", script),
          "--base",
          srv.base,
          "--static",
          "--path",
          "/{id}.html",
          "--lessons",
          fixtures.join(","),
          "--no-report",
          "--no-phases",
          ...extra,
        ],
        { cwd: ROOT, env: process.env, maxBuffer: 16 * 1024 * 1024, timeout: 120000 },
        (err, stdout, stderr) =>
          ok({
            code: err ? (typeof err.code === "number" ? err.code : 1) : 0,
            out: `${stdout}\n${stderr}`,
          }),
      );
    });
  try {
    await fn(run);
  } finally {
    await srv.close();
  }
}

let failures = 0;
export function check(name, cond, detail = "") {
  if (cond) console.log(`ok   ${name}`);
  else {
    failures++;
    console.error(`FAIL ${name}${detail ? `\n${String(detail).slice(0, 1500)}` : ""}`);
  }
}
export function finish() {
  if (failures) {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("\nall checks passed");
}
