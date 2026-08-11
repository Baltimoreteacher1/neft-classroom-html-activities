#!/usr/bin/env node
// extract-es-gap.mjs — lists the English strings in small-group practice that
// still have no Spanish, deduplicated across the three variants that share them.
//
//   node tools/extract-es-gap.mjs              # counts per field
//   node tools/extract-es-gap.mjs --field stem --limit 60 [--offset 120]
//                                              # a batch to translate, as JSON
//
// The batch form prints `{ "english": "" }` ready to be filled in and saved as
// a data/es-translations/*.json part. Strings already translated are skipped, so
// re-running after each batch always shows what is genuinely left.

import {
  loadTranslations,
  missingStrings,
  practiceItems,
  readConfig,
  smallGroupLessons,
} from "./es-parity-lib.mjs";

const arg = (flag, fallback = null) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1];
};

const FIELDS = ["stem", "choices", "explanation", "hints"];

function gap() {
  const known = loadTranslations();
  const buckets = Object.fromEntries(FIELDS.map((field) => [field, new Set()]));
  for (const lesson of smallGroupLessons())
    for (const item of practiceItems(readConfig(lesson))) {
      const missing = missingStrings(item);
      for (const field of FIELDS)
        for (const text of missing[field]) if (!known.has(text)) buckets[field].add(text);
    }
  return buckets;
}

const buckets = gap();
const field = arg("--field");

if (!field) {
  let total = 0;
  for (const name of FIELDS) {
    const size = buckets[name].size;
    const chars = [...buckets[name]].join("").length;
    total += size;
    console.log(`${name.padEnd(12)} ${String(size).padStart(5)} strings  ${chars} chars`);
  }
  console.log(`${"TOTAL".padEnd(12)} ${String(total).padStart(5)} strings still untranslated`);
  process.exit(0);
}

if (!FIELDS.includes(field)) {
  console.error(`unknown --field ${field} (expected one of ${FIELDS.join(", ")})`);
  process.exit(1);
}

const offset = Number(arg("--offset", "0"));
const limit = Number(arg("--limit", "40"));
const slice = [...buckets[field]].sort().slice(offset, offset + limit);
console.log(JSON.stringify(Object.fromEntries(slice.map((text) => [text, ""])), null, 2));
