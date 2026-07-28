// Night Shift — briefing builder. Turns module results into markdown + json.
import path from "node:path";
import { writeText, writeJson } from "./util.mjs";

const ICON = { ok: "✅", warn: "⚠️", fail: "❌", skip: "⏭️" };

// "10202874 ms" is unreadable, and it hid that a run had taken 2h50m — the
// signal that the machine had slept mid-run and the timings were wall-clock.
function formatDuration(ms) {
  if (!Number.isFinite(ms)) return "unknown";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}

function rollup(results) {
  const counts = { ok: 0, warn: 0, fail: 0, skip: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  const headline = counts.fail
    ? `${counts.fail} module(s) need attention`
    : counts.warn
      ? `${counts.warn} warning(s) to review`
      : "all clear";
  return { counts, headline };
}

export function buildMarkdown(results, meta) {
  const { counts, headline } = rollup(results);
  const lines = [];
  lines.push(`# Night Shift Briefing — ${meta.date}`);
  lines.push("");
  lines.push(`**Status:** ${headline}  `);
  lines.push(
    `**Modules:** ${counts.ok}✅ ${counts.warn}⚠️ ${counts.fail}❌ ${counts.skip}⏭️  `,
  );
  lines.push(`**Branch:** \`${meta.branch}\`  **Mode:** ${meta.dryRun ? "dry-run" : "live"}  `);
  // What the source-truth modules actually judged. Without this the briefing
  // reads as a verdict on the working tree, which is exactly the confusion the
  // audit worktree exists to end.
  lines.push(
    meta.auditRef
      ? `**Audited:** \`${meta.auditRef}\` @ \`${(meta.auditSha || "").slice(0, 9)}\` (clean worktree)  `
      : "**Audited:** ⚠️ no clean checkout — source modules inconclusive  ",
  );
  lines.push(`**Duration:** ${formatDuration(meta.durationMs)}`);
  lines.push("");

  // Actions you may need to take, surfaced first.
  const actions = results.flatMap((r) => (r.actions || []).map((a) => ({ mod: r.name, a })));
  if (actions.length) {
    lines.push("## ⏰ Needs you");
    for (const { mod, a } of actions) lines.push(`- **[${mod}]** ${a}`);
    lines.push("");
  }

  lines.push("## Modules");
  for (const r of results) {
    lines.push(`### ${ICON[r.status]} ${r.name}`);
    lines.push(r.summary || "(no summary)");
    if (r.details && r.details.length) {
      lines.push("");
      for (const d of r.details) lines.push(`- ${d}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function writeBriefing(root, results, meta) {
  const dir = path.join(root, "night-shift", "briefings");
  const md = buildMarkdown(results, meta);
  await writeText(path.join(dir, `${meta.date}.md`), md);
  await writeText(path.join(dir, "latest.md"), md);
  await writeJson(path.join(dir, "latest.json"), { meta, results });
  return { dir, ...rollup(results) };
}
