#!/usr/bin/env node
/**
 * The opening instructional block, in one inspectable table.
 *
 * The Pre-Unit is the one place in the year where "which unit is this?" has two
 * correct answers: the PACING unit a date belongs to, and the CANONICAL unit
 * that owns the lesson being taught. Aug 26 is a Pre-Unit day teaching a Unit 2
 * lesson. Every defect in this area came from a surface collapsing those two
 * into one number — the picker keying the Pre-Unit "1" and hiding Unit 1, the
 * planner labelling the second week "Unit 2", the plan itself teaching the Unit
 * 1 arc because the mapping said unit 1.
 *
 * So the two columns are printed side by side, and `--check` asserts the block
 * still matches the authored sequence. Run it to SEE the opening two weeks;
 * `npm test` runs the assertions through opening-block.test.mjs.
 *
 *   node tools/opening-block-report.mjs           # print the table
 *   node tools/opening-block-report.mjs --check    # assert, print nothing on success
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const baseline = read("data/pacing-baseline-2026-27.json");
const launch = read("data/curriculum-launch-manifest.json");
const authored = read("data/pacing-unit-lessons.json");
const ranges = read("data/pacing-unit-ranges.json");

const byId = new Map(
  [...launch.lessons, ...launch.smallGroups, ...launch.catchUps, ...launch.endOfUnit].map((e) => [
    e.id,
    e,
  ]),
);
const pacingLabel = new Map((ranges.units || []).map((u) => [u.key, u.districtLabel]));

/** How a day relates to the rest of the year, in one word. */
export function roleOf(day, allDays) {
  const id = day.plan.lessonId;
  if (day.plan.dayType === "Project") return "project";
  if (day.plan.dayType === "Assessment") return "assessment";
  if (day.plan.dayType === "Review") return "review";
  if (day.plan.dayType === "Catch-Up") return "catch-up";
  if (day.plan.dayType === "Continued Lesson") return "continuation";
  if (!id) return day.plan.dayType.toLowerCase();
  const others = allDays.filter(
    (d) => d.plan.lessonId === id && d.plan.dayType === "Core Lesson" && d.date !== day.date,
  );
  if (!others.length) return "first instruction";
  const earlier = others.some((d) => d.date < day.date);
  return earlier ? "repeat (taught earlier)" : "first instruction (repeats later)";
}

/** The rows of the opening block: every date the Pre-Unit occupies. */
export function openingBlock() {
  const days = baseline.days;
  return days
    .filter((d) => d.plan.unitKey === "PRE")
    .map((d) => {
      const entry = d.plan.lessonId ? byId.get(d.plan.lessonId) : null;
      return {
        date: d.date,
        weekday: d.weekday,
        dayType: d.plan.dayType,
        lessonId: d.plan.lessonId || "",
        title: entry?.title || d.plan.planTitle || "",
        pacingUnit: pacingLabel.get(d.plan.unitKey) || d.plan.unitKey,
        canonicalUnit: entry ? `Unit ${entry.unit}` : "",
        role: roleOf(d, days),
      };
    });
}

const rows = openingBlock();
const CHECK = process.argv.includes("--check");

/* ── Assertions ────────────────────────────────────────────────────────────── */

export function problems() {
  const out = [];
  const want = authored.units.PRE.lessons;
  const taught = [];
  for (const r of rows) {
    if (r.dayType !== "Core Lesson" || !r.lessonId) continue;
    if (taught[taught.length - 1] !== r.lessonId) taught.push(r.lessonId);
  }
  if (taught.join(",") !== want.join(",")) {
    out.push(`the opening block teaches [${taught.join(", ")}], authored is [${want.join(", ")}]`);
  }
  if (!rows.length) out.push("the opening block is empty — no day is paced in PRE");
  if (rows.length !== 11)
    out.push(`the Pre-Unit occupies ${rows.length} dates, not its 11-day budget`);
  /* The point of the whole table: at least one day must be a Pre-Unit day
   * teaching a lesson another unit owns. If that stops being true, either the
   * sequence reverted to the unit-1 arc or this report stopped reading it. */
  const borrowed = rows.filter((r) => r.canonicalUnit && r.canonicalUnit !== "Unit 1");
  if (borrowed.length < 4) {
    out.push(
      `only ${borrowed.length} borrowed lesson days — the assembled sequence is not in the plan`,
    );
  }
  return out;
}

const found = problems();

if (CHECK) {
  if (found.length) {
    console.error("✗ opening block");
    for (const f of found) console.error(`   - ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

const w = (s, n) => String(s).padEnd(n);
console.log(`\nOpening instructional block — ${rows[0]?.date} to ${rows[rows.length - 1]?.date}\n`);
console.log(
  `${w("Date", 12)}${w("Day", 5)}${w("Type", 18)}${w("Lesson", 14)}${w("Pacing unit", 30)}${w("Canonical", 10)}Role`,
);
console.log("-".repeat(122));
for (const r of rows) {
  console.log(
    w(r.date, 12) +
      w(r.weekday, 5) +
      w(r.dayType, 18) +
      w(r.lessonId || "—", 14) +
      w(r.pacingUnit, 30) +
      w(r.canonicalUnit || "—", 10) +
      r.role,
  );
}
console.log(
  `\n${rows.length} dates. Titles: ${rows.filter((r) => r.title).length} resolved from the manifest.`,
);
for (const r of rows.filter((x) => x.lessonId)) console.log(`   ${r.lessonId}  ${r.title}`);
if (found.length) {
  console.error("\n✗ problems:");
  for (const f of found) console.error(`   - ${f}`);
  process.exit(1);
}
console.log("\n✓ the opening block matches the authored Pre-Unit sequence.");
