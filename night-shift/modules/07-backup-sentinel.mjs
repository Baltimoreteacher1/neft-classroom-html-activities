// Module 7 — Backup Sentinel.
//
// `neft-student-progress` is the only data here that cannot be rebuilt from a
// build. `scripts/backup-d1.mjs` exports it and proves the dump replays into
// SQLite before accepting it — but a verified backup is worthless if the job
// silently stops running, which is exactly what happened: the nightly GitHub
// Action never fired (Actions billing failed, every run dies at 0s), so for
// weeks the only copy was whatever had last been captured by hand.
//
// This module reads the backup manifest and fails loudly when the newest
// restore-verified capture is stale, missing, or suspiciously empty. It checks
// the ARTEFACT, not the scheduler, so it stays honest no matter which mechanism
// is producing backups.
import { readFile, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const name = "Backup Sentinel";

const DAY = 86_400_000;

export async function run(ctx) {
  const cfg = ctx.config.backupSentinel || {};
  // Mirrors scripts/backup-d1.mjs: backups live OUTSIDE the repo by default.
  const root = cfg.dir || process.env.NEFT_BACKUP_DIR || path.join(homedir(), "neft-backups");
  const dir = path.join(root, "d1");
  const warnAfterH = cfg.warnAfterHours ?? 36;
  const failAfterH = cfg.failAfterHours ?? 72;

  const details = [];
  const actions = [];
  let worst = "ok";

  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(dir, "latest.json"), "utf8"));
  } catch {
    return {
      name,
      status: "fail",
      summary: "No backup manifest — student progress is UNBACKED.",
      details: [`❌ No \`latest.json\` under \`${dir}\`.`],
      actions: ["Run `npm run backup:d1` — there is no verified backup of student progress."],
    };
  }

  const capturedAt = Date.parse(manifest.capturedAt || "");
  if (!Number.isFinite(capturedAt)) {
    return {
      name,
      status: "fail",
      summary: "Backup manifest is unreadable.",
      details: [`❌ \`latest.json\` has no parseable \`capturedAt\`.`],
      actions: ["Re-run `npm run backup:d1` and inspect the manifest it writes."],
    };
  }

  const ageH = Math.round((Date.now() - capturedAt) / 3600_000);
  const ageLabel = ageH < 48 ? `${ageH}h ago` : `${Math.round(ageH / 24)}d ago`;

  if (ageH >= failAfterH) {
    worst = "fail";
    details.push(`❌ Newest verified backup is ${ageLabel} (threshold ${failAfterH}h).`);
    actions.push(
      `Student-progress backup is ${ageLabel} — the nightly job is not running. Check the launchd job \`com.neft.d1-backup\` and run \`npm run backup:d1\` now.`,
    );
  } else if (ageH >= warnAfterH) {
    worst = "warn";
    details.push(`⚠️ Newest verified backup is ${ageLabel} (warn after ${warnAfterH}h).`);
    actions.push(`Backup is aging (${ageLabel}) — confirm the nightly job still runs.`);
  } else {
    details.push(`✅ Newest verified backup ${ageLabel} (${(manifest.bytes / 1024).toFixed(1)} KB).`);
  }

  if (manifest.restoreVerified !== true) {
    worst = "fail";
    details.push("❌ Manifest does not claim `restoreVerified` — this dump was never replayed.");
    actions.push("A dump nobody restored is not a backup — re-run `npm run backup:d1`.");
  }

  // Retention: one file is a single point of failure. Corruption discovered
  // late needs an older generation to fall back to.
  let generations = [];
  try {
    generations = (await readdir(dir)).filter((f) => f.endsWith(".sql.gz"));
  } catch {
    /* handled above */
  }
  if (generations.length <= 1) {
    if (worst === "ok") worst = "warn";
    details.push(
      `⚠️ Only ${generations.length} backup generation on disk — no fallback if the newest is corrupt.`,
    );
    actions.push("Let the nightly job build up generations, or capture a second one now.");
  } else {
    details.push(`✅ ${generations.length} generations retained in \`${dir}\`.`);
  }

  const spine = manifest.tables?.student_progress;
  if (typeof spine === "number") {
    details.push(
      spine === 0
        ? `⚠️ \`student_progress\` captured EMPTY — expected during the summer, alarming once the term starts.`
        : `✅ \`student_progress\`: ${spine} row(s) captured.`,
    );
    if (spine === 0 && worst === "ok") worst = "warn";
  }

  const summary =
    worst === "fail"
      ? "Student-progress backup is stale or unverified."
      : worst === "warn"
        ? `Backup present (${ageLabel}) with caveats.`
        : `Backup verified and fresh (${ageLabel}).`;

  return { name, status: worst, summary, details, actions };
}
