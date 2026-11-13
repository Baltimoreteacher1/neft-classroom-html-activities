import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const universeSource = readFileSync(resolve(root, "assets/mentor-universe.js"), "utf8");
const rosterSource = readFileSync(resolve(root, "assets/mentor-roster.js"), "utf8");
const manifest = JSON.parse(
  readFileSync(resolve(root, "data/curriculum-launch-manifest.json"), "utf8"),
);

function load(source, seed = null) {
  let stored = seed;
  const localStorage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value;
    },
  };
  const window = { localStorage };
  new Function("window", "localStorage", source)(window, localStorage);
  return { window, stored: () => stored };
}

const universeHarness = load(universeSource);
const U = universeHarness.window.NTMentorUniverse;
const rosterHarness = load(rosterSource);
const R = rosterHarness.window.NTMentorRoster;

assert.equal(manifest.lessonCount, 84, "mentor mapping must use the actual 84-lesson manifest");
assert.equal(manifest.lessons.length, 84, "manifest lesson array drifted from lessonCount");
assert.equal(Object.keys(U.investigations).length, 10, "one investigation is required per unit");

for (const lesson of manifest.lessons) {
  const en = U.momentFor(lesson, "en");
  const es = U.momentFor(lesson, "es");
  assert.ok(U.labOrder.includes(en.lab), `${lesson.id}: unknown thinking move ${en.lab}`);
  assert.ok(en.text.includes(lesson.title), `${lesson.id}: English moment is not contextual`);
  assert.ok(es.text.includes(lesson.title), `${lesson.id}: Spanish moment is not contextual`);
  assert.notEqual(en.text, es.text, `${lesson.id}: Spanish moment copied from English`);
}

assert.equal(R.mentors.length, 44, "stable 44-person roster changed");
assert.equal(R.labs.length, 8, "stable eight thinking moves changed");
assert.deepEqual(
  U.labOrder,
  R.labs.map((lab) => lab.id),
  "Mentor Universe must use the roster's stable thinking-move IDs",
);
for (const mentor of R.mentors) {
  const sources = U.sourcesFor(mentor);
  assert.ok(sources.length >= 2, `${mentor.id}: needs at least two source paths`);
  assert.ok(
    sources.every((source) => source.href.startsWith("https://")),
    `${mentor.id}: source must use HTTPS`,
  );
  const interaction = U.interactionFor(mentor, "en");
  assert.ok(interaction.prompt && interaction.answer && interaction.hint, `${mentor.id}: no interaction`);
  assert.equal(
    U.checkInteraction(mentor, interaction.answer, "en").correct,
    true,
    `${mentor.id}: own interaction answer is rejected`,
  );
}

const legacy = U.migrate(
  JSON.stringify({
    mentorId: R.mentors[0].id,
    moves: ["noticing"],
    seenStories: ["story"],
    lang: "es",
  }),
);
assert.equal(legacy.version, 2);
assert.equal(legacy.id, R.mentors[0].id, "legacy mentorId was not migrated");
assert.deepEqual(legacy.moves, ["noticing"], "existing thinking moves were not preserved");
assert.deepEqual(legacy.seenStories, ["story"], "existing story history was not preserved");
assert.equal(legacy.lang, "es", "existing language was not preserved");
assert.ok(legacy.studio && legacy.journey, "new state branches were not initialized");

const html = readFileSync(resolve(root, "mentor-lab/index.html"), "utf8");
for (const id of [
  "mu-studio",
  "mu-journey",
  "mu-switchboard",
  "mu-archive",
  "mu-mashup",
  "mu-moments",
]) {
  assert.ok(html.includes(`id="${id}"`), `missing signature surface #${id}`);
}
assert.ok(html.includes("7t − 24"), "Lesson 6-5 archive is missing 7t − 24");
assert.ok(
  html.includes("There is no secure automatic class aggregation"),
  "privacy copy must not imply secure class aggregation exists",
);

const labScript = readFileSync(resolve(root, "mentor-lab/mentor-lab.js"), "utf8");
for (const misconception of ["seven coupons", "reverses the quantities", "fixed coupon"]) {
  assert.ok(labScript.includes(misconception), `6-5 feedback missing: ${misconception}`);
}

console.log(
  `mentor-universe: ${R.mentors.length} mentors, ${R.labs.length} moves, ` +
    `${manifest.lessons.length} lesson moments, 10 investigations — all checks passed`,
);
