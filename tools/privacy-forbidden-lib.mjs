// G-44 forbidden-data scan: looks for never-collect field names in D1 migration columns, JSON
// schemas and the field names the API code reads, writes or logs. Pure functions over text so the
// negative-control test can feed a known-bad fixture through exactly the code the gate runs.

import { forbiddenTermIn } from "../shared/privacy/inventory-forbidden.mjs";
import { readSchema } from "../shared/privacy/inventory-sql.mjs";

/** Remove // and block comments, keeping line breaks so reported line numbers stay true. */
export function stripJsComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:\\'"`])\/\/[^\n]*/g, "$1");
}

/** `tables` is the Map returned by readMigrations: ALTER TABLE columns are already folded in. */
export function scanTables(tables) {
  const out = [];
  for (const [table, { columns, file }] of tables) {
    const hit = forbiddenTermIn(table);
    if (hit) out.push({ kind: "sql-table", file, name: table, term: hit });
    for (const column of columns) {
      const colHit = forbiddenTermIn(column);
      if (colHit) out.push({ kind: "sql-column", file, name: `${table}.${column}`, term: colHit });
    }
  }
  return out;
}

function schemaKeys(node, path, keys) {
  if (Array.isArray(node)) return node.forEach((v, i) => schemaKeys(v, `${path}[${i}]`, keys));
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (path.endsWith("properties") || path.endsWith("patternProperties")) keys.push(key);
    schemaKeys(value, path ? `${path}.${key}` : key, keys);
  }
}

export function scanJsonSchema(text, file) {
  const keys = [];
  schemaKeys(JSON.parse(text), "", keys);
  return keys.flatMap((name) => {
    const term = forbiddenTermIn(name);
    return term ? [{ kind: "schema-property", file, name, term }] : [];
  });
}

const KEY = /(?:^|[^\w$.])["']?([A-Za-z_$][\w$]*)["']?\s*:(?!:)/g;
const PROP = /\.([A-Za-z_$][\w$]*)/g;

export function scanJs(src, file) {
  const out = [];
  const lines = stripJsComments(src).split("\n");
  lines.forEach((line, i) => {
    for (const re of [KEY, PROP]) {
      re.lastIndex = 0;
      for (let m = re.exec(line); m; m = re.exec(line)) {
        const term = forbiddenTermIn(m[1]);
        if (term) out.push({ kind: "api-field", file, line: i + 1, name: m[1], term });
      }
    }
  });
  return out;
}

/** Tables created lazily inside API code (CREATE TABLE IF NOT EXISTS in a template string). */
export function scanLazyTables(src, file) {
  if (!/CREATE\s+TABLE/i.test(src)) return [];
  return scanTables(
    readSchema(src.replace(/\$\{[^}]*\}/g, "x"), file, new Map(), { lenient: true }),
  );
}

/** Stable identity of a finding for the reviewed-baseline file. */
export const findingKey = (f) => `${f.kind}|${f.file}|${f.name}`;

/**
 * Compare findings with the reviewed baseline. A new finding fails; a baseline entry that no longer
 * fires also fails (a stale absolution is how a gate stops being read).
 */
export function judge(findings, baseline) {
  const known = new Map(baseline.map((b) => [b.key, b]));
  const seen = new Set(findings.map(findingKey));
  const fresh = [...new Map(findings.map((f) => [findingKey(f), f])).values()].filter(
    (f) => !known.has(findingKey(f)),
  );
  const stale = baseline.filter((b) => !seen.has(b.key));
  const weak = baseline.filter((b) => !b.reason || String(b.reason).length < 40);
  return { fresh, stale, weak };
}
