#!/usr/bin/env node
/* =============================================================================
 * minify-dist-json — strip indentation from the JSON data files in dist/data/.
 * -----------------------------------------------------------------------------
 * WHY
 * /curriculum/ fetches five data files at load (launch manifest, curriculum
 * manifest, document downloads, search index, nervous system). Source keeps
 * them pretty-printed because people diff and review them; the browser does
 * not need the whitespace, and it was ~540 KB of the hub's 3 MB decoded
 * payload — the margin by which the page exceeded its 3,000 KB decoded budget
 * (scripts/perf-curriculum.mjs). Brotli hides most of it on the wire, but a
 * school Chromebook still decodes and parses every byte.
 *
 * WHY dist/ ONLY
 * Source files are untouched, so every generator, validator and `--check`
 * that compares committed JSON against a fresh generation keeps working, and
 * review diffs stay readable.
 *
 * SAFETY
 * Each file is parsed and re-serialised; the VALUE is identical by
 * construction. A file that does not parse is left exactly as it was and
 * reported, never rewritten. Idempotent.
 * ========================================================================== */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "dist", "data");

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (name.endsWith(".json")) yield path;
  }
}

let files = 0;
let saved = 0;
const skipped = [];
for (const path of walk(DIR)) {
  const text = readFileSync(path, "utf8");
  let compact;
  try {
    compact = JSON.stringify(JSON.parse(text));
  } catch {
    skipped.push(relative(ROOT, path));
    continue;
  }
  if (compact.length >= text.length) continue;
  writeFileSync(path, compact);
  files += 1;
  saved += Buffer.byteLength(text) - Buffer.byteLength(compact);
}

console.log(
  `minify-dist-json: ${files} file(s) in dist/data compacted, ${Math.round(saved / 1024)} KB of whitespace removed.` +
    (skipped.length ? ` Left unparsable files untouched: ${skipped.join(", ")}` : ""),
);
