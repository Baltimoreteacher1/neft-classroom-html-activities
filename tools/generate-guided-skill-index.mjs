// Writes the light data the guided session reads so its first view does not load the games (~400 KB gzip together):
//   skill-index/g<N>.json  the games and the skills that cover grade N (ids, grades, strand, titles), used to choose tonight's skill
//   game-icons.json       each game's inline icon, fetched only by the screens that draw one
//   learn-bank/<game>.json one worked idea per skill, taken from the game's own tier-1 strategy hint and tier-2 worked example
//                         on other numbers (cleaned so neither line contains the answer of the round it was drawn from)
// `--check` fails when any file is stale; tools/fluency-family-guided.test.mjs runs the same comparison.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildLearn } from "../math/fluency-lab/family/fm2/guided/guided-core.js";
import { loadAll } from "../math/fluency-lab/family/fm2/registry.js";

const DIR = new URL("../math/fluency-lab/family/fm2/guided/", import.meta.url);

// One card per grade band of the skill: its lowest grade at level 1 and, when the skill spans grades, its highest at level 2.
function cardsFor(game, skill) {
  const [low, high] = skill.grades;
  const make = (grade, level) => {
    const { idea, example, redraws } = buildLearn({ game, skill, grade, level, seed: 7 });
    return { idea, example, redraws };
  };
  const lo = make(low, 1);
  const out = { lo: { idea: lo.idea, example: lo.example } };
  if (high > low) {
    const hi = make(high, 2);
    out.hi = { idea: hi.idea, example: hi.example };
  }
  return out;
}

export async function buildFiles() {
  const games = await loadAll();
  const files = new Map();
  for (let grade = 0; grade <= 8; grade += 1) {
    const covering = games
      .map((game) => ({
        id: game.id,
        order: game.order,
        secPerRound: game.secPerRound,
        title: game.title,
        tagline: game.tagline,
        skills: game.skills
          .filter((s) => s.grades[0] <= grade && grade <= s.grades[1])
          .map(({ id, strand, title, grades }) => ({ id, strand, title, grades })),
      }))
      .filter((game) => game.skills.length);
    files.set(`skill-index/g${grade}.json`, covering);
  }
  files.set("game-icons.json", Object.fromEntries(games.map((game) => [game.id, game.icon])));
  for (const game of games)
    files.set(
      `learn-bank/${game.id}.json`,
      Object.fromEntries(game.skills.map((skill) => [skill.id, cardsFor(game, skill)])),
    );
  return new Map([...files].map(([name, value]) => [name, `${JSON.stringify(value)}\n`]));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = await buildFiles();
  if (process.argv.includes("--check")) {
    const stale = [...files]
      .filter(
        ([name, text]) =>
          !existsSync(new URL(name, DIR)) || readFileSync(new URL(name, DIR), "utf8") !== text,
      )
      .map(([name]) => name);
    if (stale.length) {
      console.error(
        `stale guided data: ${stale.join(", ")}; run node tools/generate-guided-skill-index.mjs`,
      );
      process.exit(1);
    }
    console.log(`guided data is current (${files.size} files)`);
  } else {
    mkdirSync(new URL("learn-bank/", DIR), { recursive: true });
    mkdirSync(new URL("skill-index/", DIR), { recursive: true });
    for (const [name, text] of files) writeFileSync(new URL(name, DIR), text);
    console.log(`wrote ${files.size} files`);
  }
}
