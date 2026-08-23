#!/usr/bin/env node
/* =============================================================================
 * validate-external-scripts.mjs — a student page should not fetch code from a
 * host this repo does not control.
 *
 * WHY IT MATTERS HERE. These pages run in a school building, on school
 * networks, for children. A third-party script tag is a standing dependency on
 * someone else's uptime, someone else's TLS, and someone else's idea of what
 * that URL should serve tomorrow — and a request that leaves the building
 * carries a referrer identifying the lesson a specific class is doing.
 * Filtering proxies also block these hosts routinely, and the failure mode is
 * an activity that is simply blank for one class and fine for another.
 *
 * The repo already knows this: fonts are self-hosted (validate:self-hosted-fonts),
 * and three.js is vendored under assets/vendor/. The nets notebook was still
 * pulling three.js and an import-map shim from two CDNs while an identical,
 * correctly-pinned copy sat in assets/vendor/three-0.160.0 — 4 external
 * requests per page load, for files already on disk. That is now local.
 *
 * WHAT THIS GATE DOES. It does not demand zero — 50 references remain, mostly
 * Phaser in the arcade games, and vendoring those is a real piece of work with
 * real render risk per game. It pins the number so it can only fall: today's
 * pages cannot regress, and a new CDN script tag fails the build the moment it
 * is added.
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CEILING = JSON.parse(
  readFileSync(join(ROOT, "data", "external-script-debt.json"), "utf8"),
).ceiling;

/* Script/module hosts only. Not an allow-list of the whole web: a link a
 * teacher clicks is fine, an <img> is fine — this is about executable code. */
const HOSTS =
  /https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|ga\.jspm\.io|cdnjs\.cloudflare\.com|code\.jquery\.com|ajax\.googleapis\.com|esm\.sh|skypack\.dev)\//g;

const files = execFileSync("git", ["ls-files", "-z", "*.html"], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\0")
  .filter((f) => f && !f.startsWith("dist/"));

assertNonEmpty("tracked HTML pages", files, "git ls-files '*.html'", 100);
assertSweptEnough("validate:external-scripts", files, "git ls-files '*.html'");

const hits = [];
let total = 0;
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  HOSTS.lastIndex = 0;
  const n = (src.match(HOSTS) || []).length;
  if (n) {
    total += n;
    hits.push({ rel, n });
  }
}

if (total > CEILING) {
  console.error(
    `FAIL  validate:external-scripts: ${total} third-party code reference(s) on ` +
      `student pages, above the pinned ceiling of ${CEILING}.`,
  );
  console.error("      Vendor the file under assets/vendor/ and point the page at it.");
  for (const h of hits.slice(0, 15)) console.error(`      ${h.rel}  (${h.n})`);
  process.exit(1);
}
const note = total < CEILING ? ` — below the pinned ${CEILING}; lower the ceiling` : ", at ceiling";
console.log(
  `PASS  validate:external-scripts — ${files.length} pages, ${total} third-party reference(s)${note}.`,
);
