#!/usr/bin/env node
// G-44 forbidden-data scan. Fails when a never-collect field name (birthplace, immigration status,
// citizenship, caste, income, disability/IEP/504/SPED labels, passport, SSN, government ID ...)
// appears in D1 migration or lazily created table columns, JSON schemas, or the field names the API
// code reads, writes or logs. Reviewed pre-existing hits live in
// shared/privacy/inventory-forbidden-baseline.json with a written reason; a hit not in it fails, and
// a baseline entry that no longer fires fails too.
//
//   node tools/privacy-forbidden-scan.mjs [--root <dir>]     exit 0 pass, 1 findings, 3 tool error
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles } from "../shared/privacy/inventory-files.mjs";
import { readMigrations } from "../shared/privacy/inventory-sql.mjs";
import {
  findingKey,
  judge,
  scanJs,
  scanJsonSchema,
  scanLazyTables,
  scanTables,
} from "./privacy-forbidden-lib.mjs";

const HERE = resolve(fileURLToPath(import.meta.url), "../..");
const MIGRATION_DIRS = ["migrations", "results-worker/migrations", "lti-worker/migrations"];
const CODE_DIRS = ["functions", "workers", "results-worker/src", "lti-worker/src"];
const isTest = (f) => /\.test\.(m?js|cjs)$/.test(f);

export function scanRoot(root) {
  const read = (f) => readFileSync(join(root, f), "utf8");
  const files = listFiles(root, [...MIGRATION_DIRS, "schemas", ...CODE_DIRS]);
  const sql = files.filter(
    (f) => f.endsWith(".sql") && MIGRATION_DIRS.some((d) => f.startsWith(`${d}/`)),
  );
  const findings = scanTables(readMigrations(sql, read));
  let swept = sql.length;
  for (const f of files) {
    if (f.startsWith("schemas/") && f.endsWith(".json")) {
      findings.push(...scanJsonSchema(read(f), f));
      swept++;
    } else if (/\.(m?js)$/.test(f) && !isTest(f) && CODE_DIRS.some((d) => f.startsWith(`${d}/`))) {
      const src = read(f);
      findings.push(...scanJs(src, f), ...scanLazyTables(src, f));
      swept++;
    }
  }
  return { findings, swept };
}

function selfTest() {
  const bad = [
    scanTables(readMigrations(["x.sql"], () => "CREATE TABLE t (id TEXT, country_of_birth TEXT);")),
    scanJs("const out = { immigrationStatus: row.citizenship_status };", "x.js"),
    scanJsonSchema('{"properties":{"familyIncome":{"type":"number"}}}', "x.json"),
    scanLazyTables("db.exec(`CREATE TABLE IF NOT EXISTS r (iep_items TEXT)`)", "x.js"),
  ];
  if (bad.some((r) => r.length === 0)) throw new Error("a known-bad fixture was not flagged");
  const clean = [
    ...scanJs("const out = { incomplete: row.alias, name: 'x' };", "x.js"),
    ...scanTables(readMigrations(["x.sql"], () => "CREATE TABLE t (id TEXT, alias TEXT);")),
  ];
  if (clean.length) throw new Error("a clean fixture was flagged");
}

function main() {
  const arg = process.argv.indexOf("--root");
  const root = arg > 0 ? resolve(process.argv[arg + 1]) : HERE;
  selfTest();
  const { findings, swept } = scanRoot(root);
  if (swept < 5)
    throw new Error(`swept only ${swept} files; a sweep that finds nothing proves nothing`);
  const baselinePath = join(root, "shared/privacy/inventory-forbidden-baseline.json");
  let baseline = [];
  try {
    baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const { fresh, stale, weak } = judge(findings, baseline);
  for (const f of fresh)
    console.error(`FORBIDDEN ${findingKey(f)}${f.line ? `:${f.line}` : ""} (term: ${f.term})`);
  for (const b of stale) console.error(`STALE baseline entry no longer fires: ${b.key}`);
  for (const b of weak) console.error(`WEAK baseline reason (needs 40+ chars): ${b.key}`);
  const known = new Set(findings.map(findingKey)).size - fresh.length;
  console.log(
    `privacy-forbidden-scan: ${swept} files swept, ${fresh.length} new, ${known} reviewed baseline hit(s)`,
  );
  process.exit(fresh.length || stale.length || weak.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`privacy-forbidden-scan error: ${error.message}`);
    process.exit(3);
  }
}
