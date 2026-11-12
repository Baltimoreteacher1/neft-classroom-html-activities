import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rng } from "../access-practice-lab/src/games/engine.js";
import { GAMES } from "../access-practice-lab/src/games/registry.js";

const root = path.resolve("access-practice-lab");
const contentDir = path.join(root, "content/games");
for (const game of GAMES) {
  const doc = JSON.parse(fs.readFileSync(path.join(contentDir, `${game.id}.json`), "utf8"));
  assert.equal(doc.id, game.id, `${game.id}: id mismatch`);
  assert.ok(
    doc.mechanic && !/timer|countdown/i.test(JSON.stringify(doc)),
    `${game.id}: missing mechanic or timer copy`,
  );
  assert.deepEqual(
    Object.keys(doc.rules || {}).sort(),
    ["3-5", "6-8"],
    `${game.id}: rules need both bands`,
  );
  for (const band of ["3-5", "6-8"]) {
    assert.ok(doc.rules[band].length >= 2, `${game.id}/${band}: add bilingual rules`);
    for (const rule of doc.rules[band])
      assert.ok(rule.en && rule.es, `${game.id}/${band}: rules must be bilingual`);
    assert.ok(doc.bands?.[band], `${game.id}/${band}: missing content`);
  }
  const mod = (await import(pathToFileURL(path.join(root, `src/games/${game.module}.js`)))).default;
  const errors = mod.validate?.(doc) || [];
  assert.deepEqual(errors, [], `${game.id}: ${errors.join("; ")}`);
  for (const band of ["3-5", "6-8"]) {
    const rows = doc.bands[band].rounds || [];
    if (rows.length && rows[0].choices) {
      const pos = rows.map((row) => row.answer);
      const freq = new Map();
      pos.forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));
      assert.ok(
        Math.max(...freq.values()) - Math.min(...[0, 1, 2].map((n) => freq.get(n) || 0)) <= 1,
        `${game.id}/${band}: answer positions are unbalanced (${pos})`,
      );
      const positions = new Set();
      for (let seed = 1; seed <= 120; seed++) {
        const state = mod.init({
          content: { bands: { [band]: doc.bands[band] } },
          band,
          rng: rng(seed),
          count: (full) => full,
        });
        positions.add(state.rounds[0].answer);
      }
      assert.ok(positions.size >= 3, `${game.id}/${band}: shuffled answer positions should vary`);
    }
  }
}
const css = [
  "games.css",
  "games-a.css",
  "games-b.css",
  "games-c.css",
  "games-d.css",
  "games-e.css",
  "games-f.css",
  "games-g.css",
  "games-h.css",
  "games-i.css",
  "games-j.css",
  "games-k.css",
  "games-l.css",
]
  .map((f) => fs.readFileSync(path.join(root, f), "utf8"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "");
assert.doesNotMatch(css, /\b(?:purple|violet|indigo)\b/i, "game CSS must not use purple");
assert.doesNotMatch(
  css,
  /setInterval\s*\(|countdown|timeLimit/i,
  "game CSS must not include timers",
);
console.log(
  `ACCESS Game Studio content: ${GAMES.length} modules, two bands, bilingual rules, answer-hint and choice-balance checks passed.`,
);
