#!/usr/bin/env node
// Writes one link per lesson from the unit hub (curriculum/units/index.html) to
// that lesson's Math Universe game, from math/games/universe/registry.js.
//
// Additive and idempotent, the same way generate-learning-labs.mjs writes its
// lab links: every `<!-- universe-game:<id> -->…<!-- /universe-game -->` block
// is removed, then one is written directly after that lesson's learning-lab
// block. Nothing else in the hand-edited hub is touched. The Edit-tool format
// hook reformats this 21k-line file, so never hand-edit these blocks.
//
// Usage: node scripts/generate-universe-links.mjs [--check]

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GAMES, launchHref } from "../math/games/universe/registry.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const HUB = join(ROOT, "curriculum/units/index.html");
const check = process.argv.includes("--check");

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

export function spliceUniverseLinks(html, games = GAMES) {
  let out = html.replace(/\s*<!-- universe-game:[\w-]+ -->[\s\S]*?<!-- \/universe-game -->/g, "");
  for (const game of games)
    for (const id of game.lessons) {
      const anchor = new RegExp(`(<!-- learning-lab:${id} -->[\\s\\S]*?<!-- /learning-lab -->)`);
      if (!anchor.test(out))
        throw new Error(`generate-universe-links: no learning-lab block for lesson ${id}`);
      out = out.replace(
        anchor,
        `$1<!-- universe-game:${id} --><a class="res" href="${launchHref(game, id)}">🎮 Math Universe: ${esc(game.title.en)} <span class="res-sub">${esc(game.genre.en)}</span></a><!-- /universe-game -->`,
      );
    }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const before = readFileSync(HUB, "utf8");
  const after = spliceUniverseLinks(before);
  if (check) {
    if (after !== before) {
      console.error(
        "FAIL curriculum/units/index.html universe-game links are stale: run node scripts/generate-universe-links.mjs",
      );
      process.exit(1);
    }
    console.log("PASS universe-game links are current");
  } else {
    if (after !== before) writeFileSync(HUB, after);
    const n = GAMES.reduce((k, g) => k + g.lessons.length, 0);
    console.log(
      `universe-game links: ${n} lesson row(s) ${after === before ? "already current" : "written"}`,
    );
  }
}
