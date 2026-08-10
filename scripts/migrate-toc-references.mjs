#!/usr/bin/env node
// Rewrite every /lessons/<old-id> reference to its new book number.
//
//   node scripts/migrate-toc-references.mjs --dry-run
//   node scripts/migrate-toc-references.mjs
//
// SINGLE PASS, deliberately. The old and new numbering spaces overlap almost
// completely (9-1 -> 7-5 while 7-5 -> 8-5), so replacing one id at a time would
// re-replace ids that an earlier substitution had already produced. One regex
// alternation over all ids, resolved through a lookup, cannot double-apply.
//
// Only path-shaped references are touched. A bare "9-1" is never rewritten:
// lesson content is full of numbers, and this migration must not edit anyone's
// arithmetic.

import { execFileSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");

const map = JSON.parse(readFileSync(join(ROOT, "data/toc-migration.json"), "utf8"));
const lookup = new Map();
for (const mv of map.moves) if (mv.from !== mv.to) lookup.set(mv.from, mv.to);

// Longest-first so 10-1 is tried before 1-1, and a trailing (?![\d-]) stops
// /lessons/1-1 from matching inside /lessons/1-10 or /lessons/1-1-group1's id.
const ids = [...lookup.keys()].sort((a, b) => b.length - a.length);
const RE = new RegExp(`/lessons/(${ids.join("|")})(?![\\d-])`, "g");
// Companion paths carry the base id then a suffix: /lessons/9-7-group1
const RE_COMPANION = new RegExp(`/lessons/(${ids.join("|")})(-(?:group\\d+|catchup))`, "g");

const files = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((f) => /\.(html|js|mjs|cjs|json|md|css)$/.test(f))
  .filter((f) => !f.startsWith("node_modules/"));

let touched = 0;
let edits = 0;
const perFile = [];

for (const rel of files) {
  const abs = join(ROOT, rel);
  let st;
  try {
    st = statSync(abs);
  } catch {
    continue;
  }
  if (!st.isFile() || st.size > 20 * 1024 * 1024) continue;

  const before = readFileSync(abs, "utf8");
  if (!before.includes("/lessons/")) continue;

  let n = 0;
  const after = before
    .replace(RE_COMPANION, (_m, id, sfx) => {
      n++;
      return `/lessons/${lookup.get(id)}${sfx}`;
    })
    .replace(RE, (_m, id) => {
      n++;
      return `/lessons/${lookup.get(id)}`;
    });

  if (!n) continue;
  touched++;
  edits += n;
  perFile.push([rel, n]);
  if (!DRY) writeFileSync(abs, after);
}

perFile.sort((a, b) => b[1] - a[1]);
for (const [f, n] of perFile.slice(0, 15)) console.log(`  ${String(n).padStart(5)}  ${f}`);
if (perFile.length > 15) console.log(`  … and ${perFile.length - 15} more files`);
console.log(
  `${DRY ? "[dry] would rewrite" : "[run] rewrote"} ${edits} refs across ${touched} files`,
);
