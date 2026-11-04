#!/usr/bin/env node
/**
 * validate-dist-file-budget.mjs — dist/ must stay under Cloudflare Pages' 20,000-file limit.
 *
 *   node tools/validate-dist-file-budget.mjs            count dist/ (run `npm run build` first)
 *
 * WHY: Pages refuses a deployment of more than 20,000 files ("Pages only supports up to 20,000
 * files in a deployment"), and it does so at the LAST step, after a successful build. Every push to
 * main then shows a red build, production silently stays on the previous commit, and nothing in the
 * source tree looks wrong. It has frozen production twice: once from 283 byte-identical files under
 * /public/, and on 2026-11-03 from the 105-file functions/ directory plus 94 test files being copied
 * into dist/ while the lesson tree grew past the line. No gate counted files, so each time the first
 * signal was a deploy that never went live.
 *
 * The limit is 20,000; this fails at FAIL_AT so a branch is told while there is still room to fix it
 * (a few hundred files is one generator run away), and warns from WARN_AT.
 */
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PAGES_LIMIT = 20000;
export const FAIL_AT = 19950;
export const WARN_AT = 19800;

/** Every file under `root`, recursively (dotfiles included: Pages counts them). */
export function countFiles(root) {
  let n = 0;
  const stack = [root];
  while (stack.length) {
    for (const entry of readdirSync(stack.pop(), { withFileTypes: true })) {
      if (entry.isDirectory()) stack.push(join(entry.parentPath ?? entry.path, entry.name));
      else n++;
    }
  }
  return n;
}

/** Verdict for a count: "fail" | "warn" | "ok". */
export const verdict = (count) => (count > FAIL_AT ? "fail" : count >= WARN_AT ? "warn" : "ok");

/* Self-test: the thresholds must classify the boundaries correctly before the real count is trusted. */
const selfTest = [
  [0, "ok"],
  [WARN_AT - 1, "ok"],
  [WARN_AT, "warn"],
  [FAIL_AT, "warn"],
  [FAIL_AT + 1, "fail"],
  [PAGES_LIMIT + 131, "fail"],
];
for (const [count, expected] of selfTest) {
  if (verdict(count) !== expected) {
    console.error(
      `validate-dist-file-budget self-test FAILED: ${count} should be ${expected}, got ${verdict(count)}`,
    );
    process.exit(1);
  }
}
if (!(FAIL_AT < PAGES_LIMIT && WARN_AT < FAIL_AT)) {
  console.error(
    "validate-dist-file-budget: thresholds must satisfy WARN_AT < FAIL_AT < PAGES_LIMIT",
  );
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = resolve(fileURLToPath(new URL("..", import.meta.url)), "dist");
  if (!existsSync(dist)) {
    console.error("FAIL validate-dist-file-budget: dist/ is missing — run `npm run build` first");
    process.exit(1);
  }
  const count = countFiles(dist);
  const state = verdict(count);
  const headroom = PAGES_LIMIT - count;
  if (state === "fail") {
    const byDir = readdirSync(dist, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => [countFiles(join(dist, e.name)), e.name])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 8);
    console.error(
      `FAIL validate-dist-file-budget: dist/ has ${count} files; Cloudflare Pages refuses more than ${PAGES_LIMIT} and the build would fail at deploy (budget ${FAIL_AT}).`,
    );
    console.error(`  largest directories: ${byDir.map(([n, d]) => `${d}/ ${n}`).join(", ")}`);
    console.error(
      "  Stop publishing source/duplicates (see SKIP_DIRS in vite.config.js and scripts/lib/copy-filter.mjs) or cut generated output.",
    );
    process.exit(1);
  }
  console.log(
    `${state === "warn" ? "WARN" : "PASS"} validate-dist-file-budget: dist/ has ${count} files, ${headroom} under Pages' ${PAGES_LIMIT} limit${state === "warn" ? ` (fails above ${FAIL_AT})` : ""}`,
  );
}
