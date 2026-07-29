#!/usr/bin/env node
/* =============================================================================
 * brief — one read-only command that reports what the LIVE system is doing.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * Everything needed to answer "is the site healthy and is anyone using it" was
 * already reachable — D1 counts, the live smoke test, the perf budget, the link
 * audit — but each lived behind a different command, so in practice no one ran
 * any of them and every session started from memory files instead of from the
 * real system. Memory goes stale; production does not.
 *
 * This is deliberately READ-ONLY and safe to run at any time, including against
 * production. It writes nothing, deploys nothing, and never fails the shell on
 * a bad reading — a broken site should print a red line, not crash the tool
 * that was supposed to tell you the site is broken.
 *
 *   npm run brief              # full snapshot
 *   npm run brief -- --json    # machine-readable (for the nightly job)
 *   npm run brief -- --fast    # skip the network probes
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const AS_JSON = process.argv.includes("--json");
const FAST = process.argv.includes("--fast");
const DB = "neft-student-progress";
const SITE = "https://eduwonderlab.com";

const out = { generatedAt: new Date().toISOString(), d1: {}, live: {}, perf: null, inventory: {} };

const GREEN = "[32m";
const RED = "[31m";
const DIM = "[2m";
const YELLOW = "[33m";
const RESET = "[0m";

function d1(sql) {
  try {
    const raw = execFileSync(
      "npx",
      ["wrangler", "d1", "execute", DB, "--remote", "--command", sql, "--json"],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0])[0]?.results ?? []) : null;
  } catch {
    return null;
  }
}

/* --- 1. Is data flowing? ------------------------------------------------- */
// Row counts alone hide a dead pipeline: a table can hold thousands of rows and
// have received none since March. Report the LAST WRITE next to the count, so a
// stalled writer is visible instead of looking like healthy history.
const TABLES = [
  ["usage_signal", "updated_at"],
  ["client_error", "last_seen"],
  ["game_scores", "created_at"],
  ["student_progress", "updated_at"],
  ["insight_signal", "captured_at"],
  ["class_roster", null],
];

function tableStats() {
  const stats = {};
  for (const [table, tsCol] of TABLES) {
    const select = tsCol
      ? `SELECT COUNT(*) AS n, MAX(${tsCol}) AS last FROM ${table}`
      : `SELECT COUNT(*) AS n, NULL AS last FROM ${table}`;
    const rows = d1(select);
    if (rows === null) {
      stats[table] = { n: null, last: null, error: "unreachable-or-missing" };
      continue;
    }
    stats[table] = { n: rows[0]?.n ?? 0, last: rows[0]?.last ?? null };
  }
  return stats;
}

function daysSince(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

/* --- 2. Is the site up? -------------------------------------------------- */
async function probe(path) {
  const url = `${SITE}${path}`;
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    return { path, status: res.status, ms: Date.now() - started, bytes: body.length };
  } catch (err) {
    return { path, status: 0, ms: Date.now() - started, error: String(err.message || err) };
  }
}

/* --- 3. What is on disk? ------------------------------------------------- */
function inventory() {
  const count = (cmd) => {
    try {
      return Number(execFileSync("bash", ["-c", cmd], { cwd: ROOT, encoding: "utf8" }).trim()) || 0;
    } catch {
      return 0;
    }
  };
  return {
    htmlPages: count(`git ls-files '*.html' | grep -v '^dist/' | wc -l`),
    gamePages: count(
      `grep -rl "game-fx.js" --include="index.html" . 2>/dev/null | grep -v node_modules | grep -v "^./dist/" | wc -l`,
    ),
    // A page is instrumented either by carrying the tag directly OR by loading
    // a shared runtime that injects it (save-resume-engine / nt-page-enhance).
    // Counting only the literal tag reports ~12% when real coverage is ~100%.
    instrumented: count(
      `grep -rlE "nt-usage\\.js|save-resume-engine\\.js|nt-page-enhance\\.js" --include="*.html" . 2>/dev/null | grep -v node_modules | grep -v "^./dist/" | wc -l`,
    ),
  };
}

function latestPerf() {
  const file = resolve(ROOT, "reports/perf-curriculum.json");
  if (!existsSync(file)) return null;
  try {
    const runs = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(runs) ? (runs[runs.length - 1] ?? null) : runs;
  } catch {
    return null;
  }
}

/* --- run ----------------------------------------------------------------- */
out.d1 = tableStats();
out.inventory = inventory();
out.perf = latestPerf();

if (!FAST) {
  out.live = {
    routes: await Promise.all(
      ["/", "/curriculum/", "/math/games/practice-arcade/", "/api/signal/health"].map(probe),
    ),
  };
}

if (AS_JSON) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

console.log(`\n${DIM}eduwonderlab — production brief  ${out.generatedAt}${RESET}\n`);

console.log("D1 — is data flowing?");
for (const [table, s] of Object.entries(out.d1)) {
  if (s.error) {
    console.log(`  ${RED}?${RESET} ${table.padEnd(18)} ${DIM}${s.error}${RESET}`);
    continue;
  }
  const age = daysSince(s.last);
  const stale = s.n > 0 && age !== null && age > 7;
  const mark = s.n === 0 ? `${YELLOW}0${RESET}` : stale ? `${YELLOW}!${RESET}` : `${GREEN}✓${RESET}`;
  const when =
    s.last === null ? "" : age === 0 ? "last write today" : `last write ${age}d ago`;
  console.log(
    `  ${mark} ${table.padEnd(18)} ${String(s.n).padStart(7)} rows   ${DIM}${when}${RESET}`,
  );
}

console.log("\nInventory");
console.log(`    ${out.inventory.htmlPages} HTML pages, ${out.inventory.gamePages} game pages`);
const cov =
  out.inventory.htmlPages > 0
    ? Math.round((out.inventory.instrumented / out.inventory.htmlPages) * 100)
    : 0;
console.log(`    ${out.inventory.instrumented} carry the usage beacon (${cov}% instrumented)`);

if (out.perf) {
  console.log("\nPerf — /curriculum (last recorded run)");
  const p = out.perf;
  console.log(
    `    LCP ${p.lcp ?? "?"}ms   transfer ${p.transferKb ?? "?"}KB   ` +
      `DOM ${p.domContentLoaded ?? "?"}ms   ${DIM}${p.recordedAt ?? ""}${RESET}`,
  );
} else {
  console.log(`\nPerf${DIM} — no run recorded yet (npm run perf:curriculum)${RESET}`);
}

if (!FAST) {
  console.log("\nLive routes");
  for (const r of out.live.routes) {
    const ok = r.status >= 200 && r.status < 400;
    const mark = ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const detail = r.error ? `${RED}${r.error}${RESET}` : `${r.status}  ${r.ms}ms  ${Math.round((r.bytes || 0) / 1024)}KB`;
    console.log(`  ${mark} ${r.path.padEnd(32)} ${detail}`);
  }
}

const empty = Object.entries(out.d1).filter(([, s]) => s.n === 0).map(([t]) => t);
if (empty.length) {
  console.log(
    `\n${YELLOW}Note:${RESET} ${empty.join(", ")} ${empty.length === 1 ? "is" : "are"} empty. ` +
      `An empty table is not proof of non-use —\n      it is usually proof that nothing writes to it. Check the writer first.`,
  );
}
console.log("");
