// Module 8 — Signal Health.
//
// Route Monitor (module 5) proves the site SERVES. This proves the site
// REPORTS. They are different failures and the second one has been silent for
// the entire life of the project: student_progress, insight_signal and
// class_roster are empty, and game_scores has ~98 rows from 3 of ~102 games,
// because most score paths never worked. Nothing ever alerted, because an empty
// table and an unused feature look identical from the outside.
//
// This module watches the WRITERS, not the reads:
//   * a telemetry table that has stopped receiving rows (a dead pipeline that
//     still has history looks healthy on a row count alone)
//   * games wired to report that have never reported (broken integrations)
//   * the /curriculum perf budget against production
//
// Everything here is read-only: HTTP GETs and D1 SELECTs. Safe in dry-run.
import { execFileSync } from "node:child_process";
import path from "node:path";

export const name = "Signal Health";

const DB = "neft-student-progress";
const HOUR = 3_600_000;

function d1(root, sql) {
  try {
    const raw = execFileSync(
      "npx",
      ["wrangler", "d1", "execute", DB, "--remote", "--command", sql, "--json"],
      { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0])[0]?.results ?? []) : null;
  } catch {
    return null;
  }
}

/**
 * Tables whose job is to RECEIVE writes, with how stale is too stale.
 * `usage_signal` is the newest and most important: it is the only thing that
 * can ever answer "which of these 2,637 pages does anyone open".
 */
const WATCHED = [
  { table: "usage_signal", ts: "updated_at", staleHours: 48, critical: true },
  { table: "client_error", ts: "last_seen", staleHours: null, critical: false },
  { table: "game_scores", ts: "created_at", staleHours: 24 * 14, critical: false },
];

export async function run(ctx) {
  const root = ctx.root || process.cwd();
  const details = [];
  const actions = [];
  let worst = "ok";

  const escalate = (level) => {
    const order = { ok: 0, warn: 1, fail: 2 };
    if (order[level] > order[worst]) worst = level;
  };

  /* --- 1. Are the writers still writing? -------------------------------- */
  for (const { table, ts, staleHours, critical } of WATCHED) {
    const rows = d1(root, `SELECT COUNT(*) AS n, MAX(${ts}) AS last FROM ${table}`);
    if (rows === null) {
      details.push(`⚠️ \`${table}\` — could not be read (table missing, or D1 unreachable).`);
      escalate(critical ? "fail" : "warn");
      if (critical) {
        actions.push(
          `Apply migrations: \`npx wrangler d1 migrations apply ${DB} --remote\` — ` +
            `\`${table}\` does not exist, so nothing is being recorded.`,
        );
      }
      continue;
    }

    const n = rows[0]?.n ?? 0;
    const last = rows[0]?.last ? Date.parse(rows[0].last) : NaN;

    if (n === 0) {
      // "Never received anything" is NOT the same failure as "stopped
      // receiving", and conflating them is how a nightly report gets muted. A
      // freshly-deployed counter is legitimately empty until the next school
      // day, so this is a warn; a table that HAD rows and went quiet is the
      // real regression, and that is handled by the staleness branch below.
      details.push(
        `⚠️ \`${table}\` is empty — no first write yet. Expected until the next ` +
          `class session; investigate if it is still empty after real traffic.`,
      );
      escalate("warn");
      if (critical) {
        actions.push(
          `If \`${table}\` is still empty after students have used the site: check ` +
            `that /assets/nt-usage.js is served and POST /api/signal/view returns 204.`,
        );
      }
      continue;
    }

    if (staleHours && Number.isFinite(last)) {
      const ageH = Math.round((Date.now() - last) / HOUR);
      if (ageH > staleHours) {
        // This IS the real failure: the pipeline demonstrably worked and then
        // stopped. Escalate a critical table to fail — unlike an empty one,
        // there is no benign explanation.
        details.push(
          `⚠️ \`${table}\` holds ${n} rows but has received none for ${Math.round(ageH / 24)}d — ` +
            `a stalled writer, not an idle feature.`,
        );
        escalate(critical ? "fail" : "warn");
        actions.push(`Investigate the writer for \`${table}\`; it has stopped reporting.`);
        continue;
      }
    }
    details.push(`✅ \`${table}\` — ${n} rows, last write ${rows[0]?.last ?? "n/a"}.`);
  }

  /* --- 2. Games wired to report that never have -------------------------- */
  try {
    const raw = execFileSync("node", [path.join(root, "scripts", "audit-score-writers.mjs"), "--json"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const report = JSON.parse(raw);
    if (report.ok === false && report.reason === "d1-unreachable") {
      details.push("⚠️ Score-writer audit skipped — D1 unreachable.");
      escalate("warn");
    } else {
      const silent = report.silent?.length ?? 0;
      if (silent > 0) {
        details.push(
          `⚠️ ${silent} game(s) are wired to report a score but never have — ` +
            `broken integrations, not unpopular games (e.g. ${report.silent.slice(0, 3).join(", ")}).`,
        );
        escalate("warn");
        actions.push(
          "Run `npm run audit:scores` and open one silent game; a wired game that " +
            "has never written a row has a dead score path.",
        );
      } else {
        details.push(`✅ Every wired game has reported at least once.`);
      }
      if (report.uninstrumented?.length) {
        details.push(
          `ℹ️ ${report.uninstrumented.length} game(s) have no scoring wiring at all — ` +
            `their absence from \`game_scores\` carries no information.`,
        );
      }
    }
  } catch (err) {
    details.push(`⚠️ Score-writer audit failed to run — ${String(err.message || err).slice(0, 120)}`);
    escalate("warn");
  }

  /* --- 3. The hub's perf budget, against production ---------------------- */
  try {
    execFileSync(
      "node",
      [path.join(root, "scripts", "perf-curriculum.mjs"), "--live", "--record"],
      { cwd: root, encoding: "utf8", maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
    );
    details.push("✅ /curriculum is within its performance budget.");
  } catch (err) {
    const out = String(err.stdout || "") + String(err.stderr || "");
    const breach = out.match(/✗ .+/g);
    details.push(
      `⚠️ /curriculum EXCEEDED its performance budget${breach ? `: ${breach.join("; ")}` : "."}`,
    );
    escalate("warn");
    actions.push(
      "Run `npm run perf:curriculum -- --live`. This page is what students open " +
        "first on a school Chromebook; a budget breach is a lesson that starts slower.",
    );
  }

  const summary =
    worst === "ok"
      ? "Telemetry is flowing and the hub is within budget."
      : worst === "fail"
        ? "A telemetry writer that used to work has stopped — the site is going blind."
        : "Signal gaps detected (awaiting first data, silent game, or perf budget).";

  return { name, status: worst, summary, details, actions };
}
