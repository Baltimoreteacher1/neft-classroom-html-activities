// Test kit for the privacy tools: a D1-shaped wrapper over node:sqlite (no new dependency), the real
// migrations applied in order, and a seeder that fills EVERY table in the delete plan from the schema
// itself, so a table added to the plan is exercised without anyone writing a fixture for it.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { DELETE_PLAN } from "../functions/_lib/privacy/tables.js";
import { readMigrations } from "../shared/privacy/inventory-sql.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function migrationFiles() {
  return readdirSync(join(ROOT, "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => `migrations/${f}`);
}

/** Tables declared by migrations/ (main database only), parsed from the SQL text. */
export const migrationTables = () =>
  readMigrations(migrationFiles(), (f) => readFileSync(join(ROOT, f), "utf8"));

/** A D1-shaped binding over a node:sqlite database. `batch` is one transaction, as on D1. */
export function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    run: async () => {
      const r = sqlite.prepare(sql).run(...params);
      return { success: true, meta: { changes: Number(r.changes) } };
    },
  });
  return {
    sqlite,
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec("COMMIT");
        return out;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

/** A database with every migration applied, as `wrangler d1 migrations apply` would leave it. */
export function freshDb(path = ":memory:") {
  const sqlite = new DatabaseSync(path);
  for (const f of migrationFiles()) sqlite.exec(readFileSync(join(ROOT, f), "utf8"));
  return sqlite;
}

const PARENT_KEYS = {
  room_id: "room",
  book_id: "book",
  take_id: "take",
  activity_id: "act",
};
const STUDENT_COLUMNS = new Set(["student_id", "owner_id", "by_id"]);

/**
 * Insert one row into each delete-plan table for `code`, owned by `studentId`. Parent ids embed the
 * class and the student, so two students in one class never collide and every child row points at a
 * parent seeded in the same call. Columns with a default are left to the default, so CHECK constraints
 * hold. Returns the number of rows inserted per table.
 */
export function seedClass(sqlite, { code, studentId, alias = "Seed Alias" }) {
  const inserted = {};
  for (const { table } of [...DELETE_PLAN].reverse()) {
    const info = sqlite.prepare(`PRAGMA table_info(${table})`).all();
    const cols = [];
    const vals = [];
    for (const c of info) {
      let v;
      if (c.name === "code" || c.name === "class_code") v = code;
      else if (STUDENT_COLUMNS.has(c.name)) v = studentId;
      else if (PARENT_KEYS[c.name]) v = `${PARENT_KEYS[c.name]}-${code}-${studentId}`;
      else if (c.name === "alias") v = alias;
      else if (c.name === "item_id" && table === "class_platform_review")
        v = `item-${code}-${studentId}`;
      else if (c.dflt_value !== null) continue;
      else if (c.pk && info.filter((x) => x.pk).length === 1 && /^INTEGER$/i.test(c.type))
        continue; // rowid alias: let the database number it
      else if (/INT|REAL/i.test(c.type)) v = 1;
      else if (/BLOB/i.test(c.type)) v = new Uint8Array([1]);
      else v = `x-${code}-${studentId}`;
      cols.push(c.name);
      vals.push(v);
    }
    const sql = `INSERT OR IGNORE INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`;
    inserted[table] = Number(sqlite.prepare(sql).run(...vals).changes);
  }
  return inserted;
}

export const countWhere = (sqlite, table, where, ...binds) =>
  Number(sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get(...binds).n);
