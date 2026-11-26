// Every lesson that authors `launch.conceptIntro.livingScene` names a play that
// exists and gives it numbers it accepts. A play returns null on a config it
// cannot draw correctly, and the page then shows nothing — so an authored scene
// that fails validation is a silent hole on the Learn It, the Practice Studio
// and the family page at once. This makes it a test failure instead.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIVING_PLAYS } from "@eduwonderlab/engine/components/living/index.js";

const root = new URL("..", import.meta.url).pathname;
const lessons = readdirSync(join(root, "lessons"));
let seen = 0;
for (const id of lessons) {
  const file = join(root, "lessons", id, "config.json");
  if (!existsSync(file)) continue;
  const cfg = JSON.parse(readFileSync(file, "utf8"));
  const living = cfg.launch?.conceptIntro?.livingScene;
  if (!living) continue;
  seen++;
  assert.equal(living.kind, "living-scene", `${id}: livingScene.kind must be "living-scene"`);
  assert.ok(
    Object.hasOwn(LIVING_PLAYS, living.play),
    `${id}: unknown living play "${living.play}"`,
  );
  const build = await LIVING_PLAYS[living.play]();
  const play = build(living);
  assert.ok(play, `${id}: the ${living.play} play refused this config: ${JSON.stringify(living)}`);
  assert.ok(
    Array.isArray(play.scenes) && play.scenes.length >= 3,
    `${id}: a play needs at least three scenes`,
  );
}
assert.ok(seen > 0, "no lesson authors a livingScene: the sweep checked nothing");
console.log(`PASS living-scene configs (${seen} lessons)`);
