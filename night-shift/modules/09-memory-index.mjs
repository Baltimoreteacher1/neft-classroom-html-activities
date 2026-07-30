// Module 9 — Memory Index Sentinel.
//
// `~/.claude/projects/-Users-joelneft/memory/MEMORY.md` is the index loaded into
// context at the start of every session. It is read up to a hard byte limit;
// past that the file is TRUNCATED, and truncation is silent — the tail simply
// stops arriving and memories quietly stop informing anything. Nothing errors,
// nothing turns red, and the only symptom is an assistant that has forgotten
// something it was told.
//
// The tail is also the worst place to lose: entries are appended, so the newest
// memories truncate first, and the bottom sections here are the infra/toolkit
// notes rather than the daily classroom-repo rules.
//
// This judges the ARTEFACT, not any writer or schedule — same stance as the
// Backup Sentinel (07). It warns with real headroom left so the cut can be made
// deliberately, instead of being discovered after a memory has gone missing.
import { readFile, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const name = "Memory Index";

export async function run(ctx) {
  const cfg = ctx.config.memoryIndex || {};
  const dir =
    cfg.dir ||
    process.env.NEFT_MEMORY_DIR ||
    path.join(homedir(), ".claude", "projects", "-Users-joelneft", "memory");
  const file = path.join(dir, "MEMORY.md");
  // The read limit the harness enforces. warnBytes leaves deliberate headroom.
  const limitBytes = cfg.limitBytes ?? 24_400;
  const warnBytes = cfg.warnBytes ?? 23_000;

  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    // Absent is not a failure here: this machine may simply have no memory dir.
    return {
      name,
      status: "ok",
      summary: "No memory index on this machine.",
      details: [`ℹ️ No \`MEMORY.md\` under \`${dir}\` — nothing to police.`],
      actions: [],
    };
  }

  const bytes = Buffer.byteLength(text, "utf8");
  const entries = (text.match(/^- /gm) || []).length;
  const pct = Math.round((bytes / limitBytes) * 100);
  const headroom = limitBytes - bytes;
  const perEntry = entries ? Math.round(bytes / entries) : 0;
  const roomFor = perEntry ? Math.floor(headroom / perEntry) : 0;

  const details = [];
  const actions = [];
  let status = "ok";

  if (bytes >= limitBytes) {
    status = "fail";
    details.push(
      `❌ \`MEMORY.md\` is ${bytes} bytes — OVER the ${limitBytes} limit. It is being truncated, and the newest entries are the ones being lost.`,
    );
    actions.push(
      `Compact \`MEMORY.md\` now: it exceeds the read limit, so its tail is silently missing from every session. Merge or retire entries — the linked topic files keep the detail.`,
    );
  } else if (bytes >= warnBytes) {
    status = "warn";
    details.push(
      `⚠️ \`MEMORY.md\` is ${bytes} bytes (${pct}% of the ${limitBytes} limit) — room for about ${roomFor} more ${roomFor === 1 ? "entry" : "entries"}.`,
    );
    actions.push(
      `Compact \`MEMORY.md\` while there is still headroom: retire finished entries and merge related ones. Deliberate now beats silent truncation later.`,
    );
  } else {
    details.push(
      `✅ \`MEMORY.md\` ${bytes} bytes (${pct}% of limit), ${entries} entries — room for ~${roomFor} more.`,
    );
  }

  // A dangling index line points at a memory that no longer exists; a file with
  // no index line is a memory that will never be recalled. Both are cheap to
  // detect and invisible otherwise.
  try {
    const onDisk = (await readdir(dir)).filter((f) => f.endsWith(".md") && f !== "MEMORY.md");
    // BOTH link forms count as indexed. The index uses markdown links
    // `[label](file.md)` for primary entries and bare `[[slug]]` wikilinks for
    // secondary ones hung off another entry. Counting only the first form
    // reports a dozen perfectly reachable memories as orphans — which is how a
    // sentinel teaches you to stop reading it.
    // A markdown link IS an index entry, so a missing target is a broken entry.
    const mdLinked = new Set(
      Array.from(text.matchAll(/\]\(([^)]+\.md)\)/g)).map((m) => path.basename(m[1])),
    );
    // A [[wikilink]] is a cross-reference, and the memory format explicitly
    // ALLOWS it to dangle — an unwritten `[[slug]]` marks something worth
    // writing later. So wikilinks count towards "this memory is reachable" but
    // never towards "this link is broken".
    const linked = new Set(mdLinked);
    for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      linked.add(m[1].endsWith(".md") ? m[1] : `${m[1]}.md`);
    }
    const missing = Array.from(mdLinked).filter((f) => !onDisk.includes(f));
    const unindexed = onDisk.filter((f) => !linked.has(f));

    if (missing.length) {
      if (status === "ok") status = "warn";
      details.push(
        `⚠️ ${missing.length} index link(s) point at a file that no longer exists: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " …" : ""}`,
      );
      actions.push("Remove or repoint the dead MEMORY.md links listed above.");
    }
    if (unindexed.length) {
      if (status === "ok") status = "warn";
      details.push(
        `⚠️ ${unindexed.length} memory file(s) have no index line, so they will never be recalled: ${unindexed.slice(0, 5).join(", ")}${unindexed.length > 5 ? " …" : ""}`,
      );
      actions.push("Add a one-line MEMORY.md pointer for the unindexed memories listed above.");
    }
    if (!missing.length && !unindexed.length) {
      details.push(`✅ Index and disk agree — ${onDisk.length} memory file(s), all linked.`);
    }
  } catch {
    details.push("ℹ️ Could not enumerate the memory directory; size check only.");
  }

  const summary =
    status === "fail"
      ? "Memory index is over the read limit and truncating."
      : status === "warn"
        ? `Memory index needs attention (${bytes} bytes, ${pct}% of limit).`
        : `Memory index healthy (${bytes} bytes, ${pct}% of limit).`;

  return { name, status, summary, details, actions };
}
