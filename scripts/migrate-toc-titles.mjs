#!/usr/bin/env node
// Set every book-numbered lesson's title to the publisher's exact wording.
//
//   node scripts/migrate-toc-titles.mjs --dry-run
//   node scripts/migrate-toc-titles.mjs
//
// Source of truth is data/reveal-toc-2025.json, independently confirmed against
// the publisher's Editable Pacing Guide (both list the same 66 lesson numbers).
//
// Lessons at extra (non-book) numbers keep their own titles — they are ours,
// not the book's.
//
// NOTE: 14 of these are scope-changing, not cosmetic — the book's lesson covers
// something narrower or different from what ours currently teaches (book 2-3 is
// median only, because the book splits mean into 2-8, which we have not written).
// Those are listed in data/toc-migration.json under `titleScopeFollowUps`: the
// title now matches the book, but the CONTENT still needs aligning.

import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");

const toc = JSON.parse(readFileSync(join(ROOT, "data/reveal-toc-2025.json"), "utf8"));
const bookTitle = new Map(toc.units.flatMap((u) => u.lessons.map((l) => [l.n, l.title])));

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const LESSONS = join(ROOT, "lessons");
// A companion's title embeds the base lesson's dotted number, not its title,
// so companions need no retitling here — regenerating them picks up the base.
const dirs = readdirSync(LESSONS).filter((d) => /^\d+-\d+$/.test(d) && bookTitle.has(d));

let changed = 0;
for (const id of dirs.sort()) {
  const p = join(LESSONS, id, "config.json");
  const cfg = JSON.parse(readFileSync(p, "utf8"));
  const want = bookTitle.get(id);
  if (norm(cfg.title) === norm(want)) continue;
  console.log(`  ${id.padEnd(5)} "${cfg.title}"\n        -> "${want}"`);
  cfg.title = want;
  if (!DRY) writeFileSync(p, `${JSON.stringify(cfg, null, 2)}\n`);
  changed++;
}

console.log(
  `${DRY ? "[dry] would retitle" : "[run] retitled"} ${changed} lessons to the book's wording`,
);
