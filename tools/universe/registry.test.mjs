// Math Universe registry — every game in math/games/universe/registry.js is
// really wired into the site, and nothing names a game the registry lacks.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GAMES, gameForLesson, launchHref } from "../../math/games/universe/registry.js";
import { spliceUniverseLinks } from "../../scripts/generate-universe-links.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const manifest = JSON.parse(read("data/curriculum-launch-manifest.json"));
const known = new Set(JSON.stringify(manifest).match(/"\d+-\d+"/g).map((s) => s.slice(1, -1)));
const labs = JSON.parse(read("data/learning-labs.json")).labs;
const scorm = JSON.parse(read("tools/scorm/activity-catalog.json")).activities.map((a) => a.path);
const arcade = read("math/games/index.html");
const hub = read("curriculum/units/index.html");
const tags = Object.keys(JSON.parse(read("data/misconception-labels.json")).tags);

const dirs = readdirSync(join(ROOT, "math/games/universe/games"));
assert.deepEqual(
  dirs.filter((d) => existsSync(join(ROOT, "math/games/universe/games", d, "index.html"))).sort(),
  GAMES.map((g) => g.id).sort(),
  "every game folder is in the registry and every registry game has a folder",
);
assert.equal(new Set(GAMES.flatMap((g) => g.lessons)).size, GAMES.flatMap((g) => g.lessons).length, "one game per lesson");

for (const g of GAMES) {
  const dir = `math/games/universe/games/${g.id}`;
  assert.equal(g.href, `/${dir}/`);
  for (const k of ["title", "genre", "tagline"]) {
    assert.ok(g[k].en && g[k].es, `${g.id}.${k} has English and Spanish`);
    assert.notEqual(g[k].en, g[k].es, `${g.id}.${k} Spanish is not a copy`);
  }
  for (const l of g.lessons) {
    assert.ok(known.has(l), `${g.id}: lesson ${l} is in the launch manifest`);
    assert.equal(gameForLesson(l), g);
    assert.ok(hub.includes(`<!-- universe-game:${l} --><a class="res" href="${launchHref(g, l)}">`), `${g.id}: unit hub row ${l} links the game`);
    const lab = labs.find((x) => x.lessons.includes(l));
    const content = JSON.parse(read(`curriculum/learning-labs/${lab.id}/content.json`));
    assert.ok(content.universe?.some((u) => u.id === g.id), `${g.id}: the ${lab.id} lab's Games stage launches it`);
  }
  assert.ok(existsSync(join(ROOT, `tools/universe/${g.id}.test.mjs`)), `${g.id}: has a playthrough test`);
  assert.ok(existsSync(join(ROOT, `tools/universe/drivers/${g.id}.mjs`)), `${g.id}: has a browser driver`);
  assert.ok(scorm.includes(dir), `${g.id}: is assignable in Canvas (tools/scorm/activity-catalog.json)`);
  assert.ok(arcade.includes(`href="${g.href}"`), `${g.id}: has a card on /math/games/`);
  const html = read(`${dir}/index.html`);
  assert.ok(html.includes("canvas-bridge-injected:begin"), `${g.id}: carries the Canvas bridge`);
  assert.ok(/NeftCanvasBridgeConfig = \{[^}]*manual: true/.test(html), `${g.id}: owns its own completion`);
  // Misconception tags the game emits come from the site taxonomy.
  for (const f of readdirSync(join(ROOT, dir)).filter((f) => f.endsWith(".js")))
    for (const m of read(`${dir}/${f}`).matchAll(/misconception(?:Tag)?\s*[:=]\s*"([a-z0-9-]+)"/g))
      assert.ok(tags.includes(m[1]), `${g.id}/${f}: misconception tag "${m[1]}" is not in data/misconception-labels.json`);
}

// The hub splice is current and idempotent.
assert.equal(spliceUniverseLinks(hub), hub, "run node scripts/generate-universe-links.mjs");
assert.equal(spliceUniverseLinks(spliceUniverseLinks(hub)), hub);

console.log(`PASS universe registry: ${GAMES.length} game(s) wired into hub, labs, arcade and Canvas`);
