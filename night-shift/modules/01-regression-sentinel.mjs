// Module 1 — Regression Sentinel.
// Detects clobbering of hand-maintained critical files vs a baseline git ref.
import { readFile } from "node:fs/promises";
import path from "node:path";

export const name = "Regression Sentinel";

export async function run(ctx) {
  const cfg = ctx.config.regressionSentinel || {};
  const ref = cfg.baselineRef;
  const files = cfg.criticalFiles || [];
  const shrinkPct = cfg.shrinkPctThreshold ?? 35;
  const details = [];
  const actions = [];
  let worst = "ok";

  if (!ref) {
    return { name, status: "skip", summary: "No baselineRef configured.", details, actions };
  }

  for (const entry of files) {
    const rel = typeof entry === "string" ? entry : entry.path;
    const markers = (typeof entry === "object" && entry.requireMarkers) || [];
    const abs = path.join(ctx.root, rel);

    let current = null;
    try {
      current = await readFile(abs, "utf8");
    } catch {
      details.push(`❌ \`${rel}\` — MISSING on disk (present at \`${ref}\`?)`);
      worst = "fail";
      actions.push(`\`${rel}\` is gone — restore from \`${ref}\` or recover your edits.`);
      continue;
    }

    const base = await ctx.git.showAtRef(ref, rel);
    if (!base.ok) {
      details.push(`⏭️ \`${rel}\` — not in baseline \`${ref}\`, skipped (size ${current.length}B).`);
      continue;
    }

    const baseLen = base.content.length;
    const curLen = current.length;
    const dropPct = baseLen > 0 ? Math.round(((baseLen - curLen) / baseLen) * 100) : 0;

    const missingMarkers = markers.filter((m) => !current.includes(m));
    const shrankTooMuch = dropPct >= shrinkPct;

    if (missingMarkers.length || shrankTooMuch) {
      worst = "fail";
      const why = [];
      if (shrankTooMuch) why.push(`shrank ${dropPct}% (${baseLen}→${curLen}B)`);
      if (missingMarkers.length) why.push(`lost marker(s): ${missingMarkers.join(", ")}`);
      details.push(`❌ \`${rel}\` — likely clobbered: ${why.join("; ")}`);

      if (cfg.autoRestore && !ctx.dryRun) {
        const r = await ctx.git.raw("checkout", ref, "--", rel);
        if (r.ok) {
          details.push(`   ↳ auto-restored \`${rel}\` from \`${ref}\`.`);
          actions.push(`Restored \`${rel}\` from \`${ref}\` — review the diff before committing.`);
        } else {
          actions.push(`Tried but FAILED to restore \`${rel}\`: ${r.stderr.trim()}`);
        }
      } else {
        actions.push(
          `\`${rel}\` looks clobbered — inspect, then \`git checkout ${ref} -- ${rel}\` if needed.`,
        );
      }
    } else if (dropPct >= Math.round(shrinkPct / 2)) {
      if (worst === "ok") worst = "warn";
      details.push(`⚠️ \`${rel}\` — shrank ${dropPct}% vs baseline; watch it.`);
    } else {
      const delta = dropPct > 0 ? `−${dropPct}%` : dropPct < 0 ? `+${-dropPct}% larger` : "same size";
      details.push(`✅ \`${rel}\` — intact (${curLen}B, ${delta} vs baseline).`);
    }
  }

  const summary =
    worst === "fail"
      ? `Possible clobbering detected vs \`${ref}\`. See "Needs you".`
      : worst === "warn"
        ? `Minor drift vs \`${ref}\` — nothing critical.`
        : `All ${files.length} critical file(s) intact vs \`${ref}\`.`;

  return { name, status: worst, summary, details, actions };
}
