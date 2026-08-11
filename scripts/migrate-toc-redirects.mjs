#!/usr/bin/env node
// Append old-number -> new-number redirects to data/routes.json, but ONLY for
// old paths that are actually vacant now.
//
// The renumbering reused most of the old URL space: 48 old lesson numbers now
// serve a DIFFERENT lesson. A redirect for one of those would be worse than
// useless — functions/_middleware.js only consults the map as a 404 fallback,
// so it could never fire, and if it landed in the first 100 rules of
// _redirects it would shadow the real lesson and take it off the site.
//
// Vacancy is read off disk rather than derived, so this stays correct if the
// map changes.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");

const map = JSON.parse(readFileSync(join(ROOT, "data/toc-migration.json"), "utf8"));
const routesPath = join(ROOT, "data/routes.json");
const routes = JSON.parse(readFileSync(routesPath, "utf8"));

const SUFFIXES = ["", "-group1", "-group2", "-catchup"];
const existing = new Set((routes.redirects || []).map((r) => r.source));

const added = [];
const skipped = [];

for (const mv of map.moves) {
  if (mv.from === mv.to) continue;
  for (const sfx of SUFFIXES) {
    const oldId = mv.from + sfx;
    const newId = mv.to + sfx;
    // Only redirect if the new target exists and the old path is now vacant.
    if (!existsSync(join(ROOT, "lessons", newId))) continue;
    if (existsSync(join(ROOT, "lessons", oldId))) {
      skipped.push(oldId);
      continue;
    }
    for (const source of [`/lessons/${oldId}`, `/lessons/${oldId}/*`]) {
      if (existing.has(source)) continue;
      routes.redirects.push({ source, destination: `/lessons/${newId}/`, status: 301 });
      existing.add(source);
      added.push(source);
    }
  }
}

console.log(`redirects added:   ${added.length}`);
console.log(`  ${added.join("\n  ") || "(none)"}`);
console.log(
  `\nold paths REUSED by a different lesson (deliberately NOT redirected): ${skipped.length}`,
);
console.log(`  ${[...new Set(skipped)].sort().join(", ")}`);

if (!DRY) {
  writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`);
  console.log(`\nwrote data/routes.json (${routes.redirects.length} rules total)`);
}
