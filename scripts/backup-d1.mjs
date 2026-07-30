#!/usr/bin/env node
/**
 * D1 backup with restore verification.
 *
 * `neft-student-progress` holds the only data in this project that cannot be
 * rebuilt from the repo: student progress, the class roster, insight signals,
 * and site settings (including the global warm-up timer). Everything else on
 * eduwonderlab.com regenerates from a build. Until this script existed there
 * was no export path at all — a bad `wrangler d1 execute` was unrecoverable.
 *
 * A dump nobody has restored is not a backup, so every run replays the SQL
 * into a scratch SQLite database and compares table row counts against the
 * live export. A backup that cannot be restored fails the run loudly.
 *
 * Run:  npm run backup:d1                 # export + verify + prune
 *       npm run backup:d1 -- --dry-run    # show what would happen
 *       npm run backup:d1 -- --keep 90    # override retention
 *
 * Restoring (deliberately manual — this destroys current data):
 *   gunzip -c backups/d1/neft-student-progress-YYYY-MM-DD.sql.gz > restore.sql
 *   npx wrangler d1 execute neft-student-progress --remote --file restore.sql
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const DATABASE = "neft-student-progress";
// Backups land OUTSIDE the repo by default. They contain student data, and this
// repo is edited by automation that auto-commits and pushes to main — a dump
// inside the working tree is one stray `git add -A` away from being published.
// Override with --out <dir> or NEFT_BACKUP_DIR.
const DEFAULT_BACKUP_ROOT = process.env.NEFT_BACKUP_DIR || join(homedir(), "neft-backups");
// student_progress is the spine — an export without it is not a backup of this
// database, so its absence fails the run.
const REQUIRED_TABLES = ["student_progress"];
// Tables that carry irreplaceable data when the feature is in use. Missing ones
// are reported, not fatal: some are created lazily by their Pages Function on
// first write (class_roster is not provisioned in production as of 2026-07-28),
// so a hard requirement here would rot into a false alarm.
const EXPECTED_TABLES = [
  "board_codes",
  "class_board",
  "class_roster",
  "family_connections_state",
  "game_progress",
  "game_scores",
  "lesson_telemetry",
  "monster_saves",
  "site_settings",
  "supports_roster",
];

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const KEEP_DAYS = Number(argv[argv.indexOf("--keep") + 1]) || 30;
const BACKUP_DIR = argv.includes("--out")
  ? resolve(argv[argv.indexOf("--out") + 1])
  : join(DEFAULT_BACKUP_ROOT, "d1");

const log = (msg) => console.log(msg);
const fail = (msg) => {
  console.error(`✗ backup-d1: ${msg}`);
  process.exit(1);
};

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}

/** YYYY-MM-DD in UTC, so a backup's name matches the day it captured. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ----------------------------------------------------------------- export */

function exportDatabase(target) {
  log(`• Exporting ${DATABASE} (remote)...`);
  try {
    run("npx", ["wrangler", "d1", "export", DATABASE, "--remote", "--output", target, "-y"]);
  } catch (err) {
    const detail = (err.stderr || err.stdout || err.message || "")
      .toString()
      .trim()
      .split("\n")
      .slice(-6)
      .join("\n");
    fail(
      `wrangler export failed:\n${detail}\n\n  Check CLOUDFLARE_API_TOKEN / \`npx wrangler login\`.`,
    );
  }
  if (!existsSync(target)) fail("wrangler reported success but wrote no file");
  const sql = readFileSync(target, "utf8");
  if (sql.trim().length === 0) fail("export is empty");
  return sql;
}

/* ------------------------------------------------------- restore verification */

/**
 * The restore check shells out to `sqlite3`. When that binary is absent the
 * spawn throws ENOENT, which lands in verifyRestore's catch and gets reported
 * as "the dump does not replay into SQLite — it is NOT restorable" — condemning
 * a perfectly good export because the CHECKER was missing. Those are opposite
 * situations (one means the data is bad, the other means we cannot tell) and
 * they must never share a message. Checked up front, before the export spends
 * time and bandwidth on a run that cannot be verified anyway.
 */
function requireSqlite3() {
  try {
    run("sqlite3", ["-version"]);
  } catch (err) {
    fail(
      "sqlite3 is not installed, so no export can be restore-verified.\n" +
        "  This says NOTHING about the database — it is the checker that is missing,\n" +
        "  not the backup that is broken. Install sqlite3 and re-run.\n" +
        `  (${String(err?.message || err).split("\n")[0]})`,
    );
  }
}

/**
 * Replay the dump into a scratch SQLite file and return {table: rowCount}.
 * This is the part that turns a dump into a verified backup.
 */
function verifyRestore(sqlPath) {
  const scratch = join(tmpdir(), `d1-restore-check-${process.pid}.sqlite`);
  try {
    rmSync(scratch, { force: true });
    try {
      run("sqlite3", [scratch], {
        input: readFileSync(sqlPath, "utf8"),
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      fail(
        `the dump does not replay into SQLite — it is NOT restorable:\n${(err.stderr || err.message).toString().trim()}`,
      );
    }
    const tableList = run("sqlite3", [
      scratch,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';",
    ])
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    const counts = {};
    for (const t of tableList) {
      counts[t] = Number(run("sqlite3", [scratch, `SELECT COUNT(*) FROM "${t}";`]).trim()) || 0;
    }
    return counts;
  } finally {
    rmSync(scratch, { force: true });
  }
}

/* -------------------------------------------------------------- retention */

function prune(keepDays) {
  if (!existsSync(BACKUP_DIR)) return [];
  const cutoff = Date.now() - keepDays * 86400 * 1000;
  const removed = [];
  for (const name of readdirSync(BACKUP_DIR)) {
    if (!name.endsWith(".sql.gz")) continue;
    const path = join(BACKUP_DIR, name);
    if (statSync(path).mtimeMs < cutoff) {
      if (!DRY_RUN) unlinkSync(path);
      removed.push(name);
    }
  }
  return removed;
}

/* ------------------------------------------------------------------- main */

mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = today();
const rawPath = join(BACKUP_DIR, `${DATABASE}-${stamp}.sql`);
const gzPath = `${rawPath}.gz`;

if (DRY_RUN) {
  log(
    `DRY RUN — would export ${DATABASE} → ${gzPath}, verify the restore, and prune backups older than ${KEEP_DAYS} days.`,
  );
  process.exit(0);
}

// Before spending a remote export on a run that could not be verified anyway.
requireSqlite3();

const sql = exportDatabase(rawPath);

log("• Verifying the dump restores into SQLite...");
const counts = verifyRestore(rawPath);
const missing = REQUIRED_TABLES.filter((t) => !(t in counts));
if (missing.length) fail(`export is missing required table(s): ${missing.join(", ")}`);
const absent = EXPECTED_TABLES.filter((t) => !(t in counts));

writeFileSync(gzPath, gzipSync(sql));
unlinkSync(rawPath);

const manifest = {
  database: DATABASE,
  capturedAt: new Date().toISOString(),
  file: gzPath,
  bytes: statSync(gzPath).size,
  tables: counts,
  restoreVerified: true,
};
writeFileSync(join(BACKUP_DIR, "latest.json"), JSON.stringify(manifest, null, 2) + "\n");

const removed = prune(KEEP_DAYS);

log(`✓ ${gzPath} (${(manifest.bytes / 1024).toFixed(1)} KB) — restore verified`);
for (const [t, n] of Object.entries(counts).sort()) log(`    ${t}: ${n} row(s)`);
if (removed.length) log(`• Pruned ${removed.length} backup(s) older than ${KEEP_DAYS} days`);

// An empty table is legal early in a term, but silently shipping an empty
// backup forever is how data loss goes unnoticed — say it out loud.
const empties = [...REQUIRED_TABLES, ...EXPECTED_TABLES].filter((t) => counts[t] === 0);
if (empties.length) log(`⚠ empty table(s) in this capture: ${empties.join(", ")}`);
if (absent.length) log(`⚠ not provisioned in this database: ${absent.join(", ")}`);
