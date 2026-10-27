// The skill inventory: counts per grade and per game recomputed by brute force, and every coverage rule proven to
// fire on a deliberately broken shelf. @fm2 FM-006 FM-018 FM-019 FM-017 FM-020
import assert from "node:assert/strict";
import {
  buildInventory,
  coverageProblems,
  skillsFor,
} from "../../math/fluency-lab/family/fm2/inventory.js";
import { FAKE_GAMES, makeFakeGames } from "./fixtures/fake-games.mjs";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const clone = () => makeFakeGames();

// Brute force: walk every game, skill and grade by hand.
const expected = {};
for (let g = 0; g <= 8; g += 1) expected[g] = [];
for (const game of FAKE_GAMES)
  for (const skill of game.skills)
    for (let g = skill.grades[0]; g <= skill.grades[1]; g += 1)
      expected[g].push(`${game.id}:${skill.id}`);

const inventory = buildInventory(FAKE_GAMES);
for (let g = 0; g <= 8; g += 1) {
  const got = inventory.byGrade[g].map((e) => `${e.gameId}:${e.skillId}`);
  ok(
    got.length === expected[g].length && [...got].sort().join() === [...expected[g]].sort().join(),
    `grade ${g} lists exactly the skills that cover it`,
  );
  ok(
    JSON.stringify(skillsFor(FAKE_GAMES, g)) === JSON.stringify(inventory.byGrade[g]),
    `skillsFor(${g}) matches byGrade`,
  );
  ok(
    inventory.byGrade[g].length >= 10 &&
      new Set(inventory.byGrade[g].map((e) => e.gameId)).size >= 6,
    `grade ${g}: 10+ skills across 6+ games`,
  );
  ok(inventory.totals.perGrade[g].skills === expected[g].length, `totals.perGrade[${g}].skills`);
  for (const entry of inventory.byGrade[g]) {
    ok(
      entry.levels === 3 &&
        entry.standard.length > 2 &&
        entry.strand.en &&
        entry.strand.es &&
        entry.title.en &&
        entry.title.es,
      "entry shape",
    );
    const game = FAKE_GAMES.find((x) => x.id === entry.gameId);
    const skill = game.skills.find((s) => s.id === entry.skillId);
    ok(skill.grades[0] <= g && g <= skill.grades[1], "entry really covers the grade");
  }
}
for (const game of FAKE_GAMES) {
  ok(inventory.perGame[game.id].skillCount === game.skills.length, `${game.id} skillCount`);
  ok(
    JSON.stringify(inventory.perGame[game.id].grades) ===
      JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    `${game.id} covers K-8`,
  );
}
ok(
  inventory.totals.games === 10 &&
    inventory.totals.skills === FAKE_GAMES.reduce((n, g) => n + g.skills.length, 0),
  "totals",
);
ok(
  JSON.stringify(skillsFor(FAKE_GAMES, 99)) === "[]" && JSON.stringify(skillsFor([], 3)) === "[]",
  "out-of-range grade and empty shelf give []",
);
ok(
  coverageProblems(FAKE_GAMES).length === 0,
  `fixture shelf is clean: ${coverageProblems(FAKE_GAMES)}`,
);

// Each rule fires on its own defect.
const has = (games, pattern) => coverageProblems(games).some((p) => pattern.test(p));
{
  const games = clone();
  games[3].mechanic = games[0].mechanic.toUpperCase();
  ok(has(games, /share the mechanic/), "duplicate mechanic is flagged (case-insensitive)");
}
{
  const games = clone();
  games[4].skills = games[4].skills.filter((s) => !(s.grades[0] <= 8 && s.grades[1] >= 8));
  ok(has(games, /array-architect does not cover grade 8/), "a game that misses a grade is flagged");
}
{
  const games = clone().slice(0, 9);
  ok(has(games, /expected 10 games/), "nine games is flagged");
}
{
  const games = clone();
  for (const game of games.slice(0, 5))
    game.skills = game.skills.filter((s) => !(s.grades[0] <= 5 && s.grades[1] >= 5));
  ok(has(games, /grade 5: only 5 games/), "grade 5 with only 5 games is flagged");
}
{
  const games = clone();
  for (const game of games)
    if (game.id !== "number-builder")
      game.skills = game.skills.filter((s) => !(s.grades[0] <= 3 && s.grades[1] >= 3));
  ok(
    has(games, /grade 3: only 3 skills/) && has(games, /grade 3: only 1 games/),
    "grade 3 with three skills in one game is flagged for both rules",
  );
  for (const game of games)
    if (game.id !== "number-builder")
      game.skills.push({ ...game.skills[0], id: `${game.id}-extra`, grades: [3, 3] });
  ok(
    !has(games, /grade 3: only \d+ skills/),
    "restoring a skill per game clears the skill-count problem",
  );
}
{
  const games = clone();
  games[1].title = { en: "Match", es: "" };
  games[2].skills[0].title = { en: "x" };
  games[5].together = { en: "Take turns." };
  const problems = coverageProblems(games);
  ok(
    problems.some((p) => /math-match\.title\.es/.test(p)) &&
      problems.some((p) => /fraction-kitchen-g0\.title\.es/.test(p)) &&
      problems.some((p) => /number-line-quest\.together\.es/.test(p)),
    "missing Spanish is flagged for title, skill title and together",
  );
}
{
  const games = clone();
  games[0].skills[0].standard = "";
  games[0].skills[1].grades = [3, 1];
  games[0].skills[2].id = games[0].skills[3].id;
  const problems = coverageProblems(games);
  ok(
    problems.some((p) => /missing standard/.test(p)) &&
      problems.some((p) => /invalid grade range/.test(p)) &&
      problems.some((p) => /duplicate skill id/.test(p)),
    "standard, range and duplicate id problems",
  );
}
{
  const games = clone();
  games[7].id = games[6].id;
  ok(has(games, /duplicate game id/), "duplicate game id");
  games[8].mechanic = "";
  ok(has(games, /missing mechanic/), "blank mechanic");
  delete games[9].howTo.es;
  ok(has(games, /howTo\.es/), "missing howTo language");
}
ok(
  Array.isArray(coverageProblems(null)) && coverageProblems(undefined).length > 0,
  "null shelf reports problems instead of throwing",
);

console.log(`PASS inventory: ${checks} checks`);
