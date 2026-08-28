#!/usr/bin/env node
/* =============================================================================
 * report-apply-day-tiers.mjs — how much of each Apply Day level is its own.
 * -----------------------------------------------------------------------------
 * REPORT ONLY. It never fails, and it is deliberately not a gate.
 *
 * `scripts/generate-part-two.mjs` dedupes each Apply Day level WITHIN itself and
 * not across the three, and says why in its own source:
 *
 *   "The three levels run at the same time at different tables, so a problem
 *    serving two of them is invisible; deduping globally instead let the first
 *    level drain the pool and left 27 lessons with an empty challenge set."
 *
 * That is a decision a human made, and this file does not reverse it. Making it
 * a failing gate would enforce the opposite decision, which is the exact
 * anti-pattern CLAUDE.md's "Regression pins vs product decisions" describes.
 *
 * What it does do is put a number on the cost, because the premise holds less
 * well than it reads. The three chips sit on ONE screen with their counts on
 * them, so a table that picks "🟣 Level 3 · Stretch (5)" and gets five problems
 * the other tables already solved can see that it did. Measured 2026-08-28:
 * 25 of 76 lessons have a level that is ENTIRELY a repeat of an earlier one —
 * in every case Level 3, the stretch set, which owns 39% of what it shows while
 * Levels 1 and 2 own 100% and 98%.
 *
 * THREE FIXES WERE TRIED AND MEASURED. None ships; recording them so the next
 * person does not spend the afternoon rediscovering it:
 *
 * 1. Cross-dedupe the levels. In EVERY claiming order this just moves the
 *    shortage onto Level 2, the grade-level table where most students sit
 *    (median 5 items → 2). There is no ordering that wins.
 * 2. Source from another authored pool. There is none: on 5-2 the generator
 *    already feeds 21 raw items into Level 3 and its own within-level dedupe
 *    leaves 3, all of which are in Levels 1-2 too.
 * 3. Promote the lesson's MSTAR items — `reflect.mstarPractice`, 144 authored
 *    state-assessment parts that NOTHING reads, since this builder only ever
 *    looked at `practice.*` and `parallelPractice`. This one WORKS
 *    mechanically: leading Level 3 with them takes the hollow levels 25 → 0 and
 *    lifts its own share to 60%, without touching the dedupe decision. It is
 *    blocked on content, not code, on two counts:
 *      - 0 of the 144 parts carry `choiceFeedback`, and
 *        tools/distractor-feedback.test.mjs requires every wrong choice of a
 *        multiple-choice item to name the specific error. Compliance is 432
 *        authored diagnostic messages, and deriving "what this student did
 *        wrong" from an explanation of the RIGHT answer is fabrication.
 *      - 28 Part B stems say "the equation chosen in Part A", which dangles the
 *        moment the part is lifted out and numbered on its own.
 *    Unblock either of those and this becomes a small generator change.
 *
 * So the remaining fix is authored: either those 432 distractor messages, or
 * ~2-3 fresh stretch items per affected lesson. This report scopes that work
 * and tracks it shrinking.
 * ========================================================================== */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const OUT = join(ROOT, "reports", "apply-day-tiers.md");

const LEVELS = [
  ["level1", "Level 1 · Build it"],
  ["level2", "Level 2 · Grade level"],
  ["level3", "Level 3 · Stretch"],
];

const printable = (pool) =>
  (Array.isArray(pool) ? pool : []).filter((p) => p && (p.type || p.stem || p.prompt));

/**
 * The SAME normalized stem `generate-part-two.mjs` dedupes on, deliberately.
 *
 * A whole-item fingerprint is the stricter comparison and therefore the wrong
 * one: the parallel banks label their copies "(Lesson 2.3)", so comparing whole
 * items sees two different problems where a student sees the same one — the
 * generator's own comment records that this hid duplicates in 36 of 76 configs.
 * Measured both ways on the same tree, whole-item reported 24 hollow levels and
 * this reports 25. A report that undercounts what a student meets is not a
 * report about students.
 */
const fingerprint = (item) => {
  const stem = String(item?.stem || item?.prompt || "")
    .replace(/\(Lesson \d+\.\d+\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  // A stemless item (a drag-sort carries its prompt on `instructions`) would
  // fingerprint to "" and every one of them would collapse into a single
  // "repeat" — the exact bug the Set B dedupe shipped with. Fall back to the
  // whole item, which is distinct even when the stem is absent. The generator
  // avoids this differently, by dropping stemless items outright; a report must
  // still count what is on disk.
  if (stem) return stem;
  const { origin: _o, ...rest } = item || {};
  return JSON.stringify(rest, Object.keys(rest).sort());
};

/**
 * For each level, how many of its items had not already appeared in a level
 * before it. Order matters and is the authored order: a repeat belongs to
 * whichever level got there first.
 */
export function tierOwnership(groupLevels) {
  const seen = new Set();
  return LEVELS.map(([key]) => {
    const items = printable(groupLevels?.[key]);
    let own = 0;
    for (const item of items) {
      const f = fingerprint(item);
      if (!seen.has(f)) {
        own += 1;
        seen.add(f);
      }
    }
    return { key, total: items.length, own, repeated: items.length - own };
  });
}

/* --- Self-test: a report that has stopped measuring reports a healthy fleet -- */
{
  const fails = [];
  const a = { stem: "a" };
  const b = { stem: "b" };
  const clean = tierOwnership({ level1: [a], level2: [b], level3: [{ stem: "c" }] });
  if (clean.some((t) => t.repeated)) fails.push("distinct items were reported as repeats");

  const dup = tierOwnership({ level1: [a, b], level2: [b], level3: [a, b] });
  if (dup[1].repeated !== 1) fails.push("a repeat in level2 was not counted");
  if (dup[2].own !== 0) fails.push("a level that is entirely a repeat was not detected");

  // The "(Lesson 2.3)" label the parallel banks add is not a different problem.
  const labelled = tierOwnership({
    level1: [{ stem: "Find the mean of 4, 6, 8" }],
    level2: [{ stem: "Find the mean of 4, 6, 8 (Lesson 2.3)" }],
    level3: [],
  });
  if (!labelled[1].repeated) {
    fails.push("a parallel-bank copy carrying a (Lesson n.n) label was not seen as a repeat");
  }

  // Two DIFFERENT stemless items must not collapse into one. Both carry their
  // prompt on `instructions`, so a stem-only fingerprint makes them identical.
  const stemless = tierOwnership({
    level1: [{ type: "drag-sort", instructions: "Sort by operation" }],
    level2: [{ type: "drag-sort", instructions: "Sort by size" }],
    level3: [],
  });
  if (stemless[1].repeated) fails.push("two different stemless items were merged");
  // …and a stemless item repeated verbatim still counts as a repeat.
  const sameStemless = tierOwnership({
    level1: [{ type: "drag-sort", instructions: "Sort by operation" }],
    level2: [{ type: "drag-sort", instructions: "Sort by operation" }],
    level3: [],
  });
  if (!sameStemless[1].repeated) fails.push("an identical stemless item was not seen as a repeat");

  if (fails.length) {
    console.error("report-apply-day-tiers self-test FAILED:");
    for (const f of fails) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
}

const dirs = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith("-part2"))
  .map((d) => d.name)
  .sort();

const rows = [];
for (const id of dirs) {
  const configPath = join(LESSONS, id, "config.json");
  if (!existsSync(configPath)) continue;
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  rows.push({ id, tiers: tierOwnership(config.groupLevels) });
}

const hollow = rows.filter((r) => r.tiers.some((t) => t.total > 0 && t.own === 0));
const partial = rows.filter((r) => !hollow.includes(r) && r.tiers.some((t) => t.repeated > 0));
const clean = rows.length - hollow.length - partial.length;

const totals = LEVELS.map(([, label], i) => {
  const total = rows.reduce((s, r) => s + r.tiers[i].total, 0);
  const own = rows.reduce((s, r) => s + r.tiers[i].own, 0);
  return { label, total, own, repeated: total - own };
});

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "—");

const lines = [];
lines.push("# Apply Day — how much of each level is its own");
lines.push("");
lines.push(
  `${rows.length} Part 2 lessons. **Report only** — the within-level dedupe is a`,
  "decision `scripts/generate-part-two.mjs` documents in its own source, and this",
  "file does not reverse it. See the header of `tools/report-apply-day-tiers.mjs`",
  "for why a failing gate here would be the wrong instrument.",
  "",
);
lines.push("## Headline");
lines.push("");
lines.push(
  `- **${hollow.length}** lessons have a level that is ENTIRELY a repeat of an earlier one.`,
);
lines.push(`- ${partial.length} lessons overlap partially. ${clean} have no overlap at all.`);
lines.push("");
lines.push("## By level");
lines.push("");
lines.push("| Level | Items | Its own | Repeated | Own share |");
lines.push("|---|---:|---:|---:|---:|");
for (const t of totals) {
  lines.push(`| ${t.label} | ${t.total} | ${t.own} | ${t.repeated} | ${pct(t.own, t.total)} |`);
}
lines.push("");

if (hollow.length) {
  lines.push("## Levels with nothing of their own");
  lines.push("");
  lines.push(
    "A table sent to one of these picks its chip, sees the count the chip",
    "advertises, and solves problems another table already has. Each needs a",
    "handful of authored items — there is no pool left to source them from.",
    "",
  );
  lines.push("| Lesson | Level | Items shown | All repeats of |");
  lines.push("|---|---|---:|---|");
  for (const r of hollow) {
    for (let i = 0; i < r.tiers.length; i += 1) {
      const t = r.tiers[i];
      if (t.total > 0 && t.own === 0) {
        const earlier = LEVELS.slice(0, i)
          .map(([, l]) => l.split(" · ")[0])
          .join(" / ");
        lines.push(`| ${r.id} | ${LEVELS[i][1]} | ${t.total} | ${earlier} |`);
      }
    }
  }
  lines.push("");
}

lines.push("## Every lesson");
lines.push("");
lines.push("`own/total` per level.");
lines.push("");
lines.push("| Lesson | L1 Build it | L2 Grade level | L3 Stretch |");
lines.push("|---|---|---|---|");
for (const r of rows) {
  const cells = r.tiers.map((t) => (t.total ? `${t.own}/${t.total}` : "—"));
  lines.push(`| ${r.id} | ${cells.join(" | ")} |`);
}
lines.push("");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${lines.join("\n")}\n`);

console.log(
  `apply-day-tiers: ${rows.length} lessons — ${hollow.length} with a level that is entirely a ` +
    `repeat, ${partial.length} partial, ${clean} clean. ` +
    `Level 3 owns ${pct(totals[2].own, totals[2].total)} of what it shows. → reports/apply-day-tiers.md`,
);
