// A misconception tag is not one thing; it is nine, spread across six surfaces.
//
// Adding an entry to engine/core/misconceptions.js is step one of a fan-out that
// reaches the student card, the second-level micro-task, the Leitner/prereq map,
// the class pulse, the Class Boss bank, a Teach the Machine persona, the family
// broadcast's kitchen-table bank, and the teacher's next-move list. Several of
// those surfaces have their own validators, but each only sees its own file —
// so a tag can be half-built and every individual gate still passes.
//
// The failure that motivates this is specific and silent: a tag with a taxonomy
// entry but no intervention degrades to a shorter ladder with no complaint; a
// tag missing from class-pulse is DROPPED from the student-safe payload, so the
// Boss and Teach the Machine never see it and no error is raised anywhere.
//
// This asserts the whole fan-out at once, from the canonical list.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const { MISCONCEPTIONS } = await import("../engine/core/misconceptions.js");
const { INTERVENTIONS } = await import("../engine/core/misconception-interventions.js");
const { BOSS_TAGS, QUESTION_BANK } = await import("../curriculum/class-boss/questions.js");
const { PERSONAS, TAGS: TTM_TAGS } = await import("../curriculum/teach-the-machine/personas.js");
const broadcast = await import("../curriculum/family-connections/broadcast/broadcast-content.js");

const tags = Object.keys(MISCONCEPTIONS).sort();
const prereq = JSON.parse(read("data/standards-prerequisites.json"));
const tagStandards = prereq.tagStandards || prereq.misconceptionStandards || prereq;
const pulse = read("functions/api/class-pulse.js");
const nextMove = read("assets/curriculum-next-move.js");
const ttmApi = read("functions/api/teach-machine.js");

const missing = [];
const note = (tag, what) => missing.push(`${tag} → ${what}`);

for (const tag of tags) {
  const entry = MISCONCEPTIONS[tag];

  // 1. Student-facing text, in both languages. A tag with no `student` string
  //    renders an empty diagnosis card and eats the student's retry.
  if (!entry.label) note(tag, "taxonomy label");
  if (!entry.labelEs) note(tag, "taxonomy labelEs");
  if (!entry.student) note(tag, "taxonomy student text");
  if (!entry.studentEs) note(tag, "taxonomy studentEs");
  if (!entry.watchFor) note(tag, "taxonomy watchFor (teacher move)");

  // 2. The second-level micro-task.
  if (!INTERVENTIONS[tag]) note(tag, "misconception-interventions.js micro-task");

  // 3. Standards map — without it, live telemetry lights up nothing.
  const std = tagStandards[tag];
  if (!Array.isArray(std) || !std.length)
    note(tag, "data/standards-prerequisites.json tagStandards");

  // 4. Class pulse (inlined vocabulary; drift here silently drops the tag).
  if (!pulse.includes(`"${tag}"`)) note(tag, "functions/api/class-pulse.js");

  // 5. Class Boss — registered AND stocked with at least four templates.
  if (!BOSS_TAGS.includes(tag)) note(tag, "class-boss BOSS_TAGS");
  else if ((QUESTION_BANK[tag] || []).length < 4) note(tag, "class-boss (needs >= 4 templates)");

  // 6. Teach the Machine — persona plus the API allowlist.
  if (!PERSONAS[tag]) note(tag, "teach-the-machine persona");
  if (!TTM_TAGS.includes(tag)) note(tag, "teach-the-machine TAGS");
  if (!ttmApi.includes(`"${tag}"`)) note(tag, "functions/api/teach-machine.js ALLOWED_TAGS");

  // 7. Family broadcast — a label AND something a family can actually do.
  if (!broadcast.TAGS?.[tag]) note(tag, "broadcast-content TAGS");
  if (!broadcast.KITCHEN_TABLE?.[tag] && !broadcast.DEFAULT_KITCHEN_TABLE?.[tag])
    note(tag, "broadcast-content kitchen-table activity");

  // 8. The teacher's next move.
  if (!nextMove.includes(`"${tag}"`)) note(tag, "assets/curriculum-next-move.js");
}

assert.deepEqual(
  missing,
  [],
  `Incomplete misconception tag(s) — each needs every surface before it ships:\n  ${missing.join("\n  ")}`,
);

// The canonical list and the generated label file must agree, or the surfaces
// that read the generated file see a different taxonomy from the engine.
const labels = JSON.parse(read("data/misconception-labels.json"));
assert.equal(
  labels.count,
  tags.length,
  `data/misconception-labels.json is stale (${labels.count} vs ${tags.length}) — run scripts/generate-misconception-labels.mjs`,
);

console.log(
  `PASS misconception-tag-completeness: ${tags.length} tags complete across 6 surfaces (taxonomy, intervention, standards+pulse, boss, teach-machine, family+next-move)`,
);
