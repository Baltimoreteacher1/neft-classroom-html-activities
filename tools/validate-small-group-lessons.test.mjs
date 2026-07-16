import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSmallGroups } from "./validate-small-group-lessons.mjs";

const html = readFileSync(new URL("../curriculum/index.html", import.meta.url), "utf8");
const rows = JSON.parse(readFileSync(new URL("./small-group-rows.json", import.meta.url), "utf8"));
const readLessonConfig = (lessonId) =>
  JSON.parse(readFileSync(new URL(`../lessons/${lessonId}/config.json`, import.meta.url), "utf8"));

const ok = validateSmallGroups({ html, rows });
assert.equal(ok.parents, 64);
assert.equal(ok.variants, 128);

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

for (const lessonId of ["2-3", "2-3-group1", "2-3-group2"]) {
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

console.log("small-group validator contracts passed");
