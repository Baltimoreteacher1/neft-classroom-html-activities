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

  test(`${app}: the locker is deep and every level unlocks something`, () => {
    // A reward track only works if there is always something visibly close. These
    // are the shape rules for the catalog, so a future edit can't quietly hollow
    // it out: real depth, one unlock at a time per slot, no dead levels, and an
    // avatar that shows a readable subset rather than every slot at once.
    assert.ok(S.THEME.gear.length >= 40, `only ${S.THEME.gear.length} items in the locker`);
    const bySlot = new Map();
    for (const g of S.THEME.gear) {
      bySlot.set(g.slot, [...(bySlot.get(g.slot) || []), g.level]);
      assert.ok(g.name && g.name.length <= 30, `${g.id} needs a short, specific name`);
      assert.ok(g.note && g.note.length <= 60, `${g.id} needs a short note`);
      assert.ok(g.emoji, `${g.id} needs an emoji`);
    }
    for (const [slot] of S.THEME.slots) {
      const levels = bySlot.get(slot) || [];
      assert.ok(levels.length >= 3, `${slot} only has ${levels.length} items to work toward`);
      assert.equal(
        new Set(levels).size,
        levels.length,
        `${slot} unlocks two things at the same level — one at a time reads better`,
      );
    }
    // The headline slot (bats / boots) is the one a kid actually shops for.
    const headline = S.THEME.slots[0][0];
    assert.ok(
      (bySlot.get(headline) || []).length >= 10,
      `${headline} is the headline rack and should be the deepest`,
    );
    const unlocking = new Set(S.THEME.gear.map((g) => g.level));
    for (let lv = 1; lv <= S.THEME.levels.length; lv++) {
      assert.ok(unlocking.has(lv), `level ${lv} unlocks nothing — it would feel empty`);
    }
    assert.ok(S.THEME.avatarSlots?.length, "the player card needs a chosen set of avatar slots");
    assert.ok(
      S.THEME.avatarSlots.length < S.THEME.slots.length,
      "avatarSlots exists to show fewer slots than the locker holds",
    );
    for (const slot of S.THEME.avatarSlots) {
      assert.ok(
        S.THEME.slots.some(([k]) => k === slot),
        `avatarSlots names an unknown slot ${slot}`,
      );
    }
  });

  test(`${app}: the player card avatar only shows the chosen slots`, () => {
    const maxed = S.award(S.normalize({ xp: 0 }), "task", 99999).sport;
    const avatar = S.avatarFor(maxed);
    assert.equal(
      [...avatar].filter((c) => c.codePointAt(0) > 0x2000).length >= 1,
      true,
      "a fully kitted player wears something",
    );
    // One emoji per avatar slot at most — never one per locker slot.
    const worn = S.THEME.avatarSlots.filter((slot) => maxed.equipped[slot]).length;
    assert.equal(worn, S.THEME.avatarSlots.length, "every avatar slot is filled at max level");
    for (const [slot] of S.THEME.slots) {
      if (S.THEME.avatarSlots.includes(slot)) continue;
      const hidden = S.itemById(maxed.equipped[slot]);
      assert.ok(hidden, `${slot} is still equipped even though it is off the avatar`);
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

  test(`${app}: a daily streak builds, breaks, and pays a bonus`, () => {
    const day1 = S.award(S.normalize(null), "task", 10, "2026-03-02");
    assert.equal(day1.streak, 1, "first day of work starts a streak");
    assert.equal(day1.formBonus > 0, true, "keeping form pays something");

    const sameDay = S.award(day1.sport, "task", 10, "2026-03-02");
    assert.equal(sameDay.formBonus, 0, "the bonus is once per day, not per task");
    assert.equal(sameDay.streak, 1);

    const day2 = S.award(sameDay.sport, "task", 10, "2026-03-03");
    assert.equal(day2.streak, 2, "the next calendar day extends the streak");

    const afterGap = S.award(day2.sport, "task", 10, "2026-03-09");
    assert.equal(afterGap.streak, 1, "a missed day restarts the streak");
    assert.equal(afterGap.sport.bestStreak, 2, "the best streak is remembered");
    assert.ok(
      afterGap.sport.xp > day2.sport.xp,
      "breaking a streak still earns points — form never takes anything away",
    );
  });

  test(`${app}: merging keeps the streak from whichever device worked last`, () => {
    const stale = S.award(S.normalize(null), "task", 10, "2026-03-01").sport;
    const fresh = S.award(S.normalize({ xp: 50 }), "task", 10, "2026-03-08").sport;
    const merged = S.merge(stale, fresh);
    assert.equal(merged.lastDay, "2026-03-08");
    assert.equal(merged.streak, fresh.streak);
  });

  test(`${app}: trophies follow the ladder and cannot be lost`, () => {
    assert.ok(S.THEME.trophies.length > 0);
    for (const t of S.THEME.trophies) {
      assert.ok(t.level >= 1 && t.level <= S.THEME.levels.length, `${t.name} sits off the ladder`);
    }
    const esc = (v) => String(v);
    const rookie = S.renderView(S.normalize({ xp: 0 }), { esc });
    const veteran = S.renderView(S.normalize({ xp: 99999 }), { esc });
    const locks = (html) => (html.match(/Reach level/g) || []).length;
    assert.equal(locks(rookie), S.THEME.trophies.length, "a new season has every trophy locked");
    assert.equal(locks(veteran), 0, "the top of the ladder has won them all");
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
