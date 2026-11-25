// Minimal D1/SQLite schema reader shared by the privacy inventory, the forbidden-data scan and the
// deletion tests. It reads CREATE TABLE and ALTER TABLE ... ADD COLUMN from migration files and
// returns { tables: Map<name, { columns: string[], file }> }. It is deliberately small: the
// migrations here use plain DDL, and a statement it cannot parse throws instead of being skipped.

const CONSTRAINT_START = /^(primary|unique|foreign|check|constraint)\b/i;

export function stripSqlComments(sql) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Index of the ")" that closes the "(" at `open`, ignoring quoted text. */
function matchParen(text, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")" && --depth === 0) return i;
  }
  throw new Error("unbalanced parentheses in CREATE TABLE");
}

/** Split on commas that are not inside parentheses or quotes. */
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"' || ch === "`") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(body.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(body.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

const unquote = (name) => name.replace(/^["'`[]|["'`\]]$/g, "");

/** Add every table and column declared in `sql` to `tables`. `file` is recorded for reports. */
export function readSchema(sql, file, tables = new Map(), { lenient = false } = {}) {
  const text = stripSqlComments(sql);
  const create = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"[]?[A-Za-z_][A-Za-z0-9_]*[`"\]]?)\s*\(/gi;
  for (let m = create.exec(text); m; m = create.exec(text)) {
    const name = unquote(m[1]);
    const open = m.index + m[0].length - 1;
    const close = matchParen(text, open);
    const columns = [];
    for (const part of splitTopLevel(text.slice(open + 1, close))) {
      if (CONSTRAINT_START.test(part)) continue;
      columns.push(unquote(part.split(/\s+/)[0]));
    }
    if (!columns.length) throw new Error(`${file}: table ${name} has no columns`);
    if (tables.has(name)) throw new Error(`${file}: table ${name} is created twice`);
    tables.set(name, { columns, file });
  }
  const alter =
    /ALTER\s+TABLE\s+([`"[]?[A-Za-z_][A-Za-z0-9_]*[`"\]]?)\s+ADD\s+(?:COLUMN\s+)?([`"[]?[A-Za-z_][A-Za-z0-9_]*[`"\]]?)/gi;
  for (let m = alter.exec(text); m; m = alter.exec(text)) {
    const table = tables.get(unquote(m[1]));
    if (!table) {
      // Source files (not migrations) may ALTER a table built by a template string we cannot read.
      if (lenient) continue;
      throw new Error(`${file}: ALTER TABLE on unknown table ${unquote(m[1])}`);
    }
    table.columns.push(unquote(m[2]));
  }
  return tables;
}

/** Read every .sql file of the given migration directories, in file-name order. */
export function readMigrations(files, readFile) {
  const tables = new Map();
  for (const file of [...files].sort()) readSchema(readFile(file), file, tables);
  return tables;
}
