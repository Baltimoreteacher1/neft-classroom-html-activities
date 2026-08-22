#!/usr/bin/env node
import { execFileSync } from "node:child_process";
/**
 * validate-self-hosted-fonts.mjs — a converted page must not go back to the CDN.
 *
 * WHAT THIS HOLDS. Every page that has been moved to a self-hosted font bundle
 * stays moved. A render-blocking stylesheet on fonts.googleapis.com is not slow
 * when that host is BLOCKED — measured, a hard block makes first paint faster,
 * because the request fails immediately. It is catastrophic when the host
 * HANGS: 12,056ms to first paint on a worksheet, and a hub that never painted
 * within 15 seconds. A generator or a copy-paste that reintroduces the link
 * puts that page back in front of that risk silently.
 *
 * THE GUARD IS ON THE SWEEP, NOT ON A SIDE LIST. `validate:static` guards a
 * 14-entry required-file list while walking 3,197 HTML files, so a walk that
 * returned zero would clear its guard and validate nothing; `audit` and
 * `validate:ccss` have the same mis-attachment. Here the floor is checked
 * against `pages` — the discovered set this check actually reads — so a
 * discovery that collapses cannot report a clean fleet.
 *
 * SCOPE, STATED HONESTLY. This does NOT assert zero CDN references repo-wide.
 * 941 lesson printables and answer keys were deliberately reverted (a superset
 * bundle changed their font matching and shifted their layout), and 170 pages
 * outside the curriculum were never in scope. Asserting a repo-wide zero would
 * fail on all of those, so the invariant is the one that is true and worth
 * keeping: a page already converted may not regress.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = /fonts\.(googleapis|gstatic)\.com/;

/** Every page that references a self-hosted bundle — the converted set. */
export function discoverConvertedPages(root = ROOT) {
  const out = execFileSync(
    "rg",
    ["-l", "assets/fonts/", "--glob", "!node_modules", "--glob", "!dist", "--glob", "*.html", "."],
    { cwd: root, encoding: "utf8" },
  );
  return out
    .split("\n")
    .filter(Boolean)
    .map((f) => f.replace(/^\.\//, ""));
}

export function regressions(pages, root = ROOT) {
  const bad = [];
  for (const page of pages) {
    const src = readFileSync(resolve(root, page), "utf8");
    if (CDN.test(src)) bad.push(page);
  }
  return bad;
}

function main() {
  const pages = discoverConvertedPages();

  // The floor sits on the SWEEP. If discovery returns 4 pages where it used to
  // return 605, this check has verified nothing and must say so.
  assertSweptEnough(
    "validate:self-hosted-fonts",
    pages,
    "rg found far fewer pages referencing /assets/fonts/ than the pinned floor — the glob or the tree changed, and a shrunken sweep cannot report a clean fleet.",
  );

  const bad = regressions(pages);
  if (bad.length === 0) {
    console.log(
      `PASS validate:self-hosted-fonts — ${pages.length} converted page(s), none reference fonts.googleapis.com or fonts.gstatic.com.`,
    );
    return;
  }
  for (const p of bad) {
    console.error(
      `  FAIL  ${p} is a self-hosted page that also loads the font CDN — it is back on a host that can hang.`,
    );
  }
  console.error(`\nFAIL validate:self-hosted-fonts — ${bad.length} converted page(s) regressed.`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
