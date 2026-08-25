import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSmallGroups } from "./validate-small-group-lessons.mjs";

/* The detector under test reads the unit/lesson markup, which now lives on the
   units page; this fixture has to come from the same file the gate reads. */
const html = readFileSync(new URL("../curriculum/units/index.html", import.meta.url), "utf8");
const rows = JSON.parse(readFileSync(new URL("./small-group-rows.json", import.meta.url), "utf8"));
const readLessonConfig = (lessonId) =>
  JSON.parse(readFileSync(new URL(`../lessons/${lessonId}/config.json`, import.meta.url), "utf8"));

const ok = validateSmallGroups({ html, rows });
assert.equal(ok.parents, 84);
assert.equal(ok.variants, 168);

assert.throws(
  () => validateSmallGroups({ html, rows: rows.slice(0, -1) }),
  /must have exactly Group 1 and Group 2/,
  "an incomplete parent pair must fail",
);

const first = rows[0];
const second = rows[1];
const group1Link = `href="/lessons/${first.id}/"`;
const group2Link = `href="/lessons/${second.id}/"`;
const outOfOrder = html
  .replace(group1Link, 'href="/lessons/__swap__/"')
  .replace(group2Link, group1Link)
  .replace('href="/lessons/__swap__/"', group2Link);
assert.throws(
  () => validateSmallGroups({ html: outOfOrder, rows }),
  /must appear in parent, Group 1, Group 2 order/,
  "reordered variants must fail",
);

for (const lessonId of ["6-2", "6-2-group1", "6-2-group2"]) {
  const config = readLessonConfig(lessonId);
  const exitTicket = config.reflect.exitTicket;
  assert.match(config.connect.scenario, /5\/6/);
  assert.match(config.connect.scenario, /1\/12/);
  assert.match(exitTicket.stem, /5\/6 ÷ 1\/12/, `${lessonId} problem must match its scenario`);
  assert.match(
    exitTicket.explanation,
    /5\/6 ÷ 1\/12 = 10/,
    `${lessonId} explanation must match its scenario`,
  );
  assert.equal(exitTicket.choices[exitTicket.correctIndex], "10");
}

// Catch-up parity: every catch-up station carries the same 12-problem
// parallel-practice contract as the small-group lessons (typed-in visual
// models + guided steps, unique ids/stems, catch-up-scoped ids).
const catchups = JSON.parse(readFileSync(new URL("./catchup-rows.json", import.meta.url), "utf8"));
// 20 unit-slice bands + 16 legacy-strand stations the generator adopted on
// 2026-08-14 (see LEGACY_STRAND_BANDS in generate-catchup-lessons.mjs).
assert.equal(catchups.length, 36, "expected 36 catch-up stations");
for (const row of catchups) {
  const config = readLessonConfig(row.id);
  const parallel = config.parallelPractice || [];
  assert.equal(parallel.length, 12, `${row.id} needs 12 parallel problems`);
  assert.equal(
    new Set(parallel.map((item) => item.id)).size,
    12,
    `${row.id} parallel IDs must be unique`,
  );
  assert.equal(
    new Set(parallel.map((item) => item.stem)).size,
    12,
    `${row.id} parallel stems must be unique`,
  );
  for (const item of parallel) {
    assert.match(
      item.id,
      new RegExp(`^${row.id}-parallel-\\d{2}$`),
      `${row.id} parallel IDs must be catch-up scoped`,
    );
    assert.ok(item.answer != null, `${row.id}/${item.id} needs a checkable answer`);
    assert.ok(item.visual?.kind, `${row.id}/${item.id} needs a visual model`);
    assert.ok(item.steps?.length >= 2, `${row.id}/${item.id} needs guided steps`);
  }
}

console.log("small-group validator contracts passed");
