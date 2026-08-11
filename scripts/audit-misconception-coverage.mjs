#!/usr/bin/env node
/**
 * Can a lesson actually ACT on the error it just diagnosed?
 *
 * The engine detects a specific misconception the moment a student picks a
 * wrong multiple-choice option (engine/core/misconceptions.js infers a tag from
 * the distractor). But engine/core/adaptive.js — the thing that decides what
 * comes next — reads only attempts/correct/streak/accuracy. The diagnosis is
 * recorded and then thrown away at the branch point, so two students at the
 * same accuracy with completely different errors get the same next problem.
 *
 * Before wiring misconception-aware sequencing, this answers the question that
 * decides whether such a sequencer can work at all:
 *
 *   When a student trips misconception T inside lesson L, is there ANOTHER
 *   item in L that also engages T — somewhere to send them?
 *
 * A tag with no second item in its own lesson is a DEAD END: the sequencer
 * would diagnose precisely, then have nothing to offer and silently fall back
 * to tier logic. Knowing where those are is the difference between a feature
 * that works and one that looks like it works.
 *
 * Diagnosability is computed exactly the way the runtime computes it — by
 * calling the real diagnoseChoice() over every distractor of every item — so
 * this measures the shipped behaviour, not a model of it.
 *
 *   node scripts/audit-misconception-coverage.mjs
 *   node scripts/audit-misconception-coverage.mjs --json
 *
 * Writes reports/misconception-coverage.md. Reports only; changes nothing.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { diagnoseChoice, MISCONCEPTIONS, scanExpression } from "../engine/core/misconceptions.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const REPORTS = join(ROOT, "reports");

const TIERS = ["approaching", "onLevel", "extending", "optional"];

/** Every practice item in a config, flattened with its tier. */
function practiceItems(config) {
  const p = config.practice || {};
  const out = [];
  for (const tier of TIERS) {
    for (const [i, item] of (p[tier] || []).entries()) out.push({ tier, index: i, item });
  }
  return out;
}

/**
 * Which misconceptions this ONE item can diagnose, using the shipped detector.
 * An item can only diagnose what its own distractors encode.
 */
function tagsForItem(item) {
  const tags = new Set();
  if (!Array.isArray(item?.choices)) return tags;
  for (let i = 0; i < item.choices.length; i++) {
    const hit = diagnoseChoice(item, i);
    if (hit?.id) tags.add(hit.id);
  }
  return tags;
}

const lessonIds = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((id) => existsSync(join(LESSONS, id, "config.json")))
  .sort();

const lessons = [];
const globalTag = new Map(); // tag → { items, lessons:Set }
let totalItems = 0;
let diagnosableItems = 0;

/* WHY an item cannot be diagnosed. This is the actionable half of the audit:
 * the remedy is completely different depending on which bucket an item lands
 * in, and the totals turned out to be lopsided enough to redirect the whole
 * plan. */
const why = {
  choiceItems: 0, // has choices[] — diagnosable in principle
  authored: 0, // already carries misconceptionTags
  noExpression: 0, // stem is prose; the predictor has no arithmetic to model
  noMatch: 0, // expression parses, but no distractor equals a predicted error
};

for (const id of lessonIds) {
  let config;
  try {
    config = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
  } catch {
    continue;
  }
  const items = practiceItems(config);
  const perTag = new Map(); // tag → item count within THIS lesson
  for (const { item } of items) {
    totalItems += 1;
    const tags = tagsForItem(item);
    if (tags.size) diagnosableItems += 1;
    if (Array.isArray(item?.choices)) {
      why.choiceItems += 1;
      if (Array.isArray(item.misconceptionTags)) why.authored += 1;
      if (!tags.size) {
        if (scanExpression(item?.stem || item?.title || "")) why.noMatch += 1;
        else why.noExpression += 1;
      }
    }
    for (const t of tags) {
      perTag.set(t, (perTag.get(t) || 0) + 1);
      if (!globalTag.has(t)) globalTag.set(t, { items: 0, lessons: new Set() });
      const g = globalTag.get(t);
      g.items += 1;
      g.lessons.add(id);
    }
  }
  // A tag seen on exactly ONE item in this lesson is a dead end: diagnose it
  // and there is no second item to route to.
  const deadEnds = [...perTag.entries()].filter(([, n]) => n === 1).map(([t]) => t);
  const routable = [...perTag.entries()].filter(([, n]) => n >= 2).map(([t]) => t);
  lessons.push({ id, items: items.length, perTag, deadEnds, routable });
}

const isCore = (id) => /^\d{1,2}-\d{1,2}$/.test(id);
const core = lessons.filter((l) => isCore(l.id));

const coreWithRoutable = core.filter((l) => l.routable.length).length;
const coreWithNothing = core.filter((l) => l.perTag.size === 0);
const coreDeadEndOnly = core.filter((l) => l.perTag.size > 0 && !l.routable.length);

const knownTags = Object.keys(MISCONCEPTIONS);
const unusedTags = knownTags.filter((t) => !globalTag.has(t));

// ── Report ────────────────────────────────────────────────────────────────
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const L = [];
L.push(`# Misconception coverage — can the lesson act on what it diagnosed?`);
L.push("");
L.push(
  `Generated by \`scripts/audit-misconception-coverage.mjs\` · ${lessons.length} lessons · ` +
    `${totalItems} practice items`,
);
L.push("");
L.push(`## The headline`);
L.push("");
L.push(
  `- **${diagnosableItems}** of ${totalItems} practice items (${pct(diagnosableItems, totalItems)}%) can diagnose a specific misconception.`,
);
L.push(
  `- **${coreWithRoutable}** of ${core.length} core lessons (${pct(coreWithRoutable, core.length)}%) have at least one misconception with a second item to route to.`,
);
L.push(
  `- **${coreDeadEndOnly.length}** core lessons can diagnose an error but have nowhere to send the student (every tag appears on exactly one item).`,
);
L.push(`- **${coreWithNothing.length}** core lessons diagnose nothing at all.`);
L.push(
  `- **${unusedTags.length}** of ${knownTags.length} taxonomy entries are never diagnosable anywhere.`,
);
L.push("");

L.push(`## Why undiagnosable items are undiagnosable`);
L.push("");
L.push(
  `Only items with \`choices[]\` can be diagnosed at all — the renderer diagnoses a wrong ` +
    `SELECTION, so open-response, drag-sort, matching and fill-table items are out of scope ` +
    `by construction.`,
);
L.push("");
L.push(`| | Items |`);
L.push(`| --- | ---: |`);
L.push(`| Multiple-choice items (diagnosable in principle) | ${why.choiceItems} |`);
L.push(`| …already diagnosing | ${diagnosableItems} |`);
L.push(`| …carrying authored \`misconceptionTags\` | ${why.authored} |`);
L.push(`| …stem is PROSE — no arithmetic for the predictor to model | **${why.noExpression}** |`);
L.push(`| …expression parses, but no distractor matches a predicted error | ${why.noMatch} |`);
L.push("");
L.push(
  `**This is the finding that matters.** ${why.noExpression} of ${why.choiceItems} ` +
    `multiple-choice items (${pct(why.noExpression, why.choiceItems)}%) are word problems. ` +
    `The predictor infers a misconception by re-computing the arithmetic it can SEE in the ` +
    `stem ("7/2 ÷ 1/4"), and this curriculum is overwhelmingly prose ("Chef Montoya's recipe ` +
    `calls for 3 cups…"). So the gap is not a weak predictor to tune — it is a detection path ` +
    `that structurally cannot reach most of the bank.`,
);
L.push("");
L.push(
  `The one path that works regardless of stem prose is an authored ` +
    `\`misconceptionTags\` array, which \`detectMisconception()\` checks FIRST and trusts over ` +
    `any prediction. ${why.authored} items already carry one. That — not predictor tuning — ` +
    `is the lever.`,
);
L.push("");

L.push(`## Routable tags per lesson`);
L.push("");
L.push(`A tag is *routable* in a lesson when 2+ items engage it — the sequencer has a follow-up.`);
L.push("");
L.push(`| Lesson | Items | Diagnosable tags | Routable | Dead ends |`);
L.push(`| --- | ---: | ---: | --- | --- |`);
for (const l of core) {
  L.push(
    `| ${l.id} | ${l.items} | ${l.perTag.size} | ${l.routable.join(", ") || "—"} | ${l.deadEnds.join(", ") || "—"} |`,
  );
}
L.push("");

L.push(`## Tags site-wide`);
L.push("");
L.push(`| Misconception | Items | Lessons |`);
L.push(`| --- | ---: | ---: |`);
for (const [tag, g] of [...globalTag.entries()].sort((a, b) => b[1].items - a[1].items)) {
  L.push(`| \`${tag}\` | ${g.items} | ${g.lessons.size} |`);
}
L.push("");

if (unusedTags.length) {
  L.push(`## Taxonomy entries nothing can diagnose`);
  L.push("");
  L.push(
    `These are defined in \`engine/core/misconceptions.js\` with student-facing text in EN and ES, ` +
      `but no shipped item's distractors produce them — so they can never fire.`,
  );
  L.push("");
  for (const t of unusedTags) L.push(`- \`${t}\` — ${MISCONCEPTIONS[t].label}`);
  L.push("");
}

L.push(`## What this means for misconception-aware sequencing`);
L.push("");
if (coreWithRoutable === 0) {
  L.push(
    `No lesson has a routable tag. A misconception-aware sequencer would fall back to tier ` +
      `logic 100% of the time — build item coverage first.`,
  );
} else {
  L.push(
    `${coreWithRoutable} core lesson(s) can support real misconception-aware routing today. ` +
      `The dead-end tags above are where the sequencer must fall back to tier logic — that ` +
      `fallback is required, not optional, and should be explicit in the engine rather than ` +
      `accidental.`,
  );
}
L.push("");

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "misconception-coverage.md"), `${L.join("\n")}\n`);

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        totalItems,
        diagnosableItems,
        coreLessons: core.length,
        coreWithRoutable,
        coreDeadEndOnly: coreDeadEndOnly.map((l) => l.id),
        coreWithNothing: coreWithNothing.map((l) => l.id),
        unusedTags,
        tags: Object.fromEntries(
          [...globalTag.entries()].map(([t, g]) => [
            t,
            { items: g.items, lessons: g.lessons.size },
          ]),
        ),
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    `misconception coverage: ${diagnosableItems}/${totalItems} items diagnosable · ` +
      `${coreWithRoutable}/${core.length} core lessons routable · ` +
      `${unusedTags.length}/${knownTags.length} taxonomy entries never fire\n` +
      `→ reports/misconception-coverage.md`,
  );
}
