#!/usr/bin/env node
/**
 * inject-number-realm-evidence.mjs — add the shared evidence layer to the
 * Number Realm pages.
 *
 * Sentinel-wrapped and idempotent, following the repo's existing injector
 * convention (`<family>-injected:begin/end`), so `npm run validate:injection`
 * checks it and `--revert` removes it cleanly.
 *
 * What it adds, and nothing more:
 *   /shared/evidence/learning-evidence.js          the shared evidence store
 *   /shared/evidence/curriculum-registry-client.js standard alias resolution
 *   /shared/evidence/adapters/number-realm-adapter.js  read-only normalization
 *   a two-line boot that calls EWLEvidence.sync() after the page settles
 *
 * The adapter never writes to `mrpg:hero` or `mrpg:unit<N>` and never touches
 * gameplay. Removing this injection returns Number Realm to exactly its prior
 * behaviour.
 *
 * Usage:
 *   node tools/inject-number-realm-evidence.mjs [--dry-run] [--revert]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "node:fs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BEGIN = "<!-- nre-injected:begin (Number Realm evidence — tools/inject-number-realm-evidence.mjs) -->";
const END = "<!-- nre-injected:end -->";

const BLOCK = `  ${BEGIN}
  <script src="/shared/evidence/learning-evidence.js" defer></script>
  <script src="/shared/evidence/curriculum-registry-client.js" defer></script>
  <script src="/shared/evidence/adapters/number-realm-adapter.js" defer></script>
  <script defer>
    /* Normalize Number Realm progress into the shared evidence layer once the
     * realm has finished loading. Read-only: the hero profile and realm saves
     * are never modified. Any failure is swallowed so the game is unaffected. */
    window.addEventListener("load", function () {
      try {
        if (window.EWLRegistry) {
          window.EWLRegistry.load().then(function () {
            window.EWLEvidence && window.EWLEvidence.sync();
          });
        } else if (window.EWLEvidence) {
          window.EWLEvidence.sync();
        }
      } catch (_e) {
        /* evidence is optional — never break a realm over it */
      }
    });
  </script>
  ${END}`;

const dryRun = process.argv.includes("--dry-run");
const revert = process.argv.includes("--revert");

const targets = globSync("math-rpg/**/index.html", { cwd: ROOT }).map((p) => resolve(ROOT, p));

let changed = 0;
let skipped = 0;

for (const file of targets) {
  const original = readFileSync(file, "utf8");
  let next = original;

  const hasBlock = original.includes(BEGIN);

  if (revert) {
    if (!hasBlock) {
      skipped += 1;
      continue;
    }
    const start = original.indexOf(BEGIN);
    const end = original.indexOf(END, start) + END.length;
    // Also consume the indentation before the sentinel and the trailing newline.
    let from = start;
    while (from > 0 && (original[from - 1] === " " || original[from - 1] === "\t")) from -= 1;
    let to = end;
    if (original[to] === "\n") to += 1;
    next = original.slice(0, from) + original.slice(to);
  } else {
    if (hasBlock) {
      skipped += 1;
      continue;
    }
    if (!original.includes("</body>")) {
      skipped += 1;
      continue;
    }
    next = original.replace("</body>", `${BLOCK}\n  </body>`);
  }

  if (next !== original) {
    if (!dryRun) writeFileSync(file, next);
    changed += 1;
  }
}

console.log(
  `inject-number-realm-evidence: ${revert ? "reverted" : "injected"} ${changed} file(s), ${skipped} already ${revert ? "clean" : "wired"}${dryRun ? " (dry run)" : ""}.`,
);
