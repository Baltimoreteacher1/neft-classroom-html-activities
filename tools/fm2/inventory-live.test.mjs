// The real ten games, loaded through the registry. Expected to fail until every game exists. Small on purpose: the
// per-game math suites do the heavy checking; this proves the shelf as a whole. @fm2 FM-006 FM-017 FM-018 FM-019
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang=en><body></body></html>", {
  url: "https://example.test/",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent,
});
const { loadAll, GAME_IDS } = await import("../../math/fluency-lab/family/fm2/registry.js");
const { buildInventory, coverageProblems } = await import(
  "../../math/fluency-lab/family/fm2/inventory.js"
);
const { validateGame } = await import("../../math/fluency-lab/family/fm2/contract.js");

const games = await loadAll();
let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};

ok(
  games.length === 10 && games.map((g) => g.id).join() === GAME_IDS.join(),
  "ten games, in shelf order",
);
for (const game of games)
  ok(validateGame(game).length === 0, `${game.id} honors the contract: ${validateGame(game)}`);
const problems = coverageProblems(games);
ok(problems.length === 0, `coverage problems:\n${problems.join("\n")}`);

// FM-017: ten different mechanics, and no two games share a skill id.
const mechanics = games.map((g) => g.mechanic.trim().toLowerCase());
ok(new Set(mechanics).size === 10, "ten distinct mechanics");
// FM-006 / FM-018: every grade K-8 has 10+ skills across 6+ games; every game has 14+ skills with 2+ per grade.
const inventory = buildInventory(games);
for (let g = 0; g <= 8; g += 1) {
  ok(
    inventory.totals.perGrade[g].skills >= 10 && inventory.totals.perGrade[g].games >= 6,
    `grade ${g} coverage`,
  );
  for (const game of games)
    ok(
      inventory.byGrade[g].filter((e) => e.gameId === game.id).length >= 2,
      `${game.id} has 2+ skills at grade ${g}`,
    );
}
for (const game of games) ok(game.skills.length >= 14, `${game.id} has 14+ skills`);

console.log(
  `PASS inventory-live: ${games.length} real games, ${inventory.totals.skills} skills, ${checks} checks`,
);
