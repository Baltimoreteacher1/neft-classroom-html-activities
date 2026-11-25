#!/usr/bin/env node
// Data inventory generator and drift gate (G "inventory drift").
//
//   node tools/privacy-inventory.mjs --write     regenerate docs/privacy/data-inventory.md
//   node tools/privacy-inventory.mjs --check     fail when the doc is stale, a D1 column has no
//                                                annotation, or a storage key in source has none
//   node tools/privacy-inventory.mjs --root <d>  run against another tree (negative-control fixtures)
//
// Exit 0 pass, 1 drift found, 3 tool error (CI treats 3 as a failure).
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkInventory,
  collectAnnotations,
  READ_SKIP,
  renderMarkdown,
} from "../shared/privacy/inventory.mjs";
import { listFiles } from "../shared/privacy/inventory-files.mjs";
import { readMigrations } from "../shared/privacy/inventory-sql.mjs";

const HERE = resolve(fileURLToPath(import.meta.url), "../..");
const MIGRATION_DIRS = ["migrations", "results-worker/migrations", "lti-worker/migrations"];
const DOC = "docs/privacy/data-inventory.md";
const SOURCE = /\.(m?js|cjs|html)$/;

export function loadInventory(root) {
  const all = listFiles(root, ["."]);
  const files = {};
  for (const f of all) {
    if (SOURCE.test(f) && !READ_SKIP.test(f)) files[f] = readFileSync(join(root, f), "utf8");
  }
  const sql = all.filter(
    (f) => f.endsWith(".sql") && MIGRATION_DIRS.some((d) => f.startsWith(`${d}/`)),
  );
  const read = (f) => readFileSync(join(root, f), "utf8");
  const tables = readMigrations(sql, read);
  const annotations = collectAnnotations(files);
  const readSource = (p) => {
    try {
      return readFileSync(join(root, p), "utf8");
    } catch {
      return null;
    }
  };
  const result = checkInventory({ files, tables, annotations, readSource });
  return { tables, annotations, result, markdown: renderMarkdown(annotations, tables) };
}

function main() {
  const args = process.argv.slice(2);
  const rootAt = args.indexOf("--root");
  const root = rootAt >= 0 ? resolve(args[rootAt + 1]) : HERE;
  const write = args.includes("--write");
  if (!write && !args.includes("--check")) throw new Error("pass --write or --check");
  const { markdown, result, tables, annotations } = loadInventory(root);
  if (tables.size < 3)
    throw new Error(
      `read only ${tables.size} D1 tables; a sweep that finds nothing proves nothing`,
    );
  const docPath = join(root, DOC);
  const errors = [...result.errors];
  if (write) {
    if (errors.length) {
      for (const e of errors) console.error(`DRIFT ${e}`);
      console.error(
        "fix the annotations first; the inventory is not written while it is incomplete",
      );
      process.exit(1);
    }
    writeFileSync(docPath, `${markdown}\n`);
    console.log(`wrote ${DOC}: ${tables.size} tables, ${annotations.data.length} annotations`);
    return;
  }
  let current = null;
  try {
    current = readFileSync(docPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (current !== `${markdown}\n`)
    errors.push(`${DOC} is stale or missing; run node tools/privacy-inventory.mjs --write`);
  for (const e of errors) console.error(`DRIFT ${e}`);
  console.log(
    `privacy-inventory: ${tables.size} tables, ${result.d1Columns} D1 columns, ${result.deviceKeysFound} storage-key candidates, ${annotations.data.length} annotations, ${errors.length} problem(s)`,
  );
  process.exit(errors.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`privacy-inventory error: ${error.message}`);
    process.exit(3);
  }
}
