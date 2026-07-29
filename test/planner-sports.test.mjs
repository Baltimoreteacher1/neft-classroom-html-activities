/* Sports season engine — the progression both kid planners run on.
 *
 * These are the rules that decide what a kid has earned, so they are checked
 * against BOTH themes: baseball (focus-school) and soccer (shai-school). The
 * two files are meant to be the same engine with a different THEME; a drift
 * between them is a bug, and the shared cases below would catch it.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function load(app) {
  const code = readFileSync(path.join(ROOT, app, "sports.js"), "utf8");
  const sandbox = { globalThis: null, document: undefined };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  assert.ok(sandbox.NeftSports, `${app}/sports.js should define NeftSports`);
  return sandbox.NeftSports;
}

const APPS = [
  ["focus-school", "baseball"],
  ["shai-school", "soccer"],
];

for (const [app, themeKey] of APPS) {
  const S = load(app);

  test(`${app}: theme is ${themeKey} and the ladder only climbs`, () => {
    assert.equal(S.THEME.key, themeKey);
    const ats = S.THEME.levels.map((l) => l.at);
    // The engine runs in its own vm realm, so compare content, not references.
    assert.equal(JSON.stringify(ats), JSON.stringify([...ats].sort((a, b) => a - b)));
    assert.equal(ats[0], 0, "level 1 must start at zero points");
    assert.equal(new Set(S.THEME.gear.map((g) => g.id)).size, S.THEME.gear.length, "gear ids unique");
    for (const g of S.THEME.gear) {
      assert.ok(
        S.THEME.slots.some(([slot]) => slot === g.slot),
        `${g.id} sits in an unknown slot ${g.slot}`,
      );
      assert.ok(g.level >= 1 && g.level <= S.THEME.levels.length, `${g.id} unlocks off the ladder`);
    }
    for (const [slot] of S.THEME.slots) {
      assert.ok(
        S.THEME.gear.some((g) => g.slot === slot && g.level === 1),
        `${slot} needs a level-1 starter so a new kid is never empty-handed`,
      );
    }
  });

  test(`${app}: finishing work adds points and levels up exactly once`, () => {
    let sport = S.normalize(null);
    assert.equal(sport.xp, 0);
    assert.equal(S.levelInfo(sport.xp).level, 1);

    const first = S.award(sport, "task");
    assert.equal(first.gain, S.pointsFor("task"));
    assert.equal(first.leveledUp, false);
    sport = first.sport;

    // Walk to the exact point the second level starts.
    const need = S.THEME.levels[1].at - sport.xp;
    const up = S.award(sport, "task", need);
    assert.equal(up.leveledUp, true, "crossing a threshold is a level-up");
    assert.equal(up.level.level, 2);
    sport = up.sport;

    const after = S.award(sport, "task", 1);
    assert.equal(after.leveledUp, false, "staying inside a level is not a level-up");
  });

  test(`${app}: unknown work still counts, and points never go backwards`, () => {
    const sport = S.normalize({ xp: 500 });
    const odd = S.award(sport, "some-future-kind");
    assert.ok(odd.gain > 0, "an unrecognized kind must not silently pay nothing");
    assert.ok(odd.sport.xp > sport.xp);
    assert.equal(S.award(sport, "task", -50).sport.xp, sport.xp, "negative award is ignored");
  });

  test(`${app}: gear unlocks by level, equips only when owned`, () => {
    const early = S.normalize({ xp: 0 });
    const late = S.normalize({ xp: 99999 });
    assert.ok(S.unlockedGear(early.xp).length > 0, "level 1 owns the starters");
    assert.equal(S.lockedGear(late.xp).length, 0, "max level owns everything");

    const locked = S.nextUnlock(early.xp);
    assert.ok(locked, "there is something to work toward at level 1");
    assert.equal(
      JSON.stringify(S.equip(early, locked.id).equipped),
      JSON.stringify(early.equipped),
      "cannot wear locked gear",
    );

    const owned = S.unlockedGear(early.xp)[0];
    assert.equal(S.equip(early, owned.id).equipped[owned.slot], owned.id);
    assert.equal(
      JSON.stringify(S.equip(early, "not-a-real-item").equipped),
      JSON.stringify(early.equipped),
    );
  });

  test(`${app}: newly unlocked gear auto-equips only an empty slot`, () => {
    const start = S.normalize({ xp: 0 });
    const chosen = S.THEME.gear.find((g) => g.level === 1);
    const wearing = S.equip(start, chosen.id);
    const jumped = S.award(wearing, "task", 99999);
    assert.equal(
      jumped.sport.equipped[chosen.slot],
      chosen.id,
      "a level-up must never silently change what the kid chose to wear",
    );
    for (const [slot] of S.THEME.slots) {
      assert.ok(jumped.sport.equipped[slot], `${slot} should end up filled after unlocking it all`);
    }
  });

  test(`${app}: a hostile synced blob cannot poison the season`, () => {
    const s = S.normalize({
      xp: "999999999999999999",
      celebrated: -4,
      equipped: { bat: "<img src=x onerror=alert(1)>", nope: "bat_ash" },
    });
    assert.ok(Number.isInteger(s.xp) && s.xp <= 10_000_000);
    assert.equal(s.celebrated, 0);
    assert.equal(Object.keys(s.equipped).length, 0, "unknown item ids are dropped, not rendered");
    assert.equal(S.normalize("garbage").xp, 0);
  });

  test(`${app}: merging devices keeps the most progress`, () => {
    const a = S.normalize({ xp: 900, celebrated: 4 });
    const b = S.normalize({ xp: 300, celebrated: 2 });
    assert.equal(S.merge(a, b).xp, 900);
    assert.equal(S.merge(b, a).xp, 900, "merge is order-independent");
    assert.equal(S.merge(a, b).celebrated, 4);
  });

  test(`${app}: rendering escapes and never leaks a locked item`, () => {
    const esc = (v) =>
      String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const sport = S.normalize({ xp: 200 });
    const view = S.renderView(sport, { esc });
    const card = S.renderCard(sport, { esc });
    assert.match(card, /sp-bar/);
    assert.ok(view.includes("sports-equip"), "owned gear is tappable");
    const locked = S.lockedGear(sport.xp)[0];
    assert.ok(
      !view.includes(`data-arg="${locked.id}"`),
      "a locked item must not be equippable from the markup",
    );
    assert.match(view, /🔒/);
  });
}

test("both apps share one engine (only the theme differs)", () => {
  const strip = (app) =>
    readFileSync(path.join(ROOT, app, "sports.js"), "utf8")
      // The file header is prose about the app it lives in, not engine code.
      .replace(/^\/\*[\s\S]*?\*\/\n/, "")
      .replace(/const THEME = \{[\s\S]*?\n {2}\};\n/, "")
      .replace(/ {2}\/\/ A (diamond|pitch)[\s\S]*?\n {4}<\/svg>`;\n/, "")
      .replace(/(diamond|pitch)Svg/g, "trackSvg")
      .replace(/Baseball Season|Soccer Season/g, "Season")
      .replace(/baseball|soccer/g, "sport");
  assert.equal(
    strip("focus-school"),
    strip("shai-school"),
    "focus-school/sports.js and shai-school/sports.js drifted outside THEME + the track graphic",
  );
});
