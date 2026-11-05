#!/usr/bin/env node
// Family Practice content inventory: one row per generated page (lessons/<id>/homework.html),
// written to docs/family-mission/inventory.json and inventory.md.
//
// It READS the generated pages, sidecars and configs; it never runs the page generator.
//   node scripts/build-family-mission-inventory.mjs            write both files
//   node scripts/build-family-mission-inventory.mjs --check    exit 1 if the committed files are stale
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import {
  coverageMarkdown,
  inventoryMarkdown,
  inventoryRow,
} from "../tools/lib/family-mission-inventory.mjs";
import { familyPageIds } from "../tools/lib/family-mission-page.mjs";
import { analyzePage } from "../tools/lib/family-mission-run.mjs";

const OUT = join(REPO_ROOT, "docs", "family-mission");

export function buildInventory() {
  const ids = familyPageIds();
  if (ids.length === 0)
    throw new Error("swept zero family pages: an inventory of nothing proves nothing");
  return ids.map((id) => inventoryRow(analyzePage(id)));
}

function main() {
  const rows = buildInventory();
  const json = `${JSON.stringify({ pages: rows.length, rows }, null, 2)}\n`;
  const md = inventoryMarkdown(rows);
  const coverage = coverageMarkdown(rows);
  if (process.argv.includes("--check")) {
    const same = (f, text) =>
      existsSync(join(OUT, f)) && readFileSync(join(OUT, f), "utf8") === text;
    if (
      !same("inventory.json", json) ||
      !same("inventory.md", md) ||
      !same("coverage.md", coverage)
    ) {
      console.error(
        "FAIL docs/family-mission/inventory.* is stale: run node scripts/build-family-mission-inventory.mjs",
      );
      process.exit(1);
    }
    console.log(`OK inventory is current (${rows.length} pages)`);
    return;
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "inventory.json"), json);
  writeFileSync(join(OUT, "inventory.md"), md);
  writeFileSync(join(OUT, "coverage.md"), coverage);
  console.log(
    `wrote docs/family-mission/inventory.json, inventory.md and coverage.md (${rows.length} pages)`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
