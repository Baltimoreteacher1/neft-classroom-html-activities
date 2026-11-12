// Spell Duel: rules (zones, damage, gold, pets, quests, cleaning bad data), Spanish coverage of its data, and a duel
// played end to end in jsdom on the shared result screen.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 4), ...rest);
const wait = (ms = 15) => new Promise((resolve) => realSetTimeout(resolve, ms));

const html = readFileSync(new URL("../math/fluency-lab/lab.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/lab.html?grade=4&view=games",
  pretendToBeVisual: true,
});
const win = dom.window;
win.HTMLElement.prototype.scrollIntoView = () => {};
win.print = () => {};
for (const [key, value] of Object.entries({
  window: win,
  document: win.document,
  location: win.location,
  history: win.history,
  localStorage: win.localStorage,
  CustomEvent: win.CustomEvent,
  Event: win.Event,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const core = await import("../math/fluency-lab/duel-core.js");
const data = await import("../math/fluency-lab/duel-data.js");
const { ES_DUEL } = await import("../math/fluency-lab/i18n-es-duel.js");
const { loadRewards, STICKERS } = await import("../math/fluency-lab/rewards.js");

// ---- Content: every name and quest has Spanish, ids are unique, each weakness is a real spell
const ids = [...core.CREATURES, ...data.PETS, ...data.SPELLS, ...data.QUESTS].map((x) => x.id);
assert.equal(new Set(ids).size, ids.length, "Ids are unique");
for (const creature of core.CREATURES) {
  assert.ok(core.spellById(creature.weak), `${creature.name} is weak to a real spell`);
  assert.ok(creature.energy >= 3, "Creatures have energy");
}
for (const zone of data.ZONES)
  assert.equal(zone.creatures.filter((c) => c.boss).length, 1, `${zone.name} has one boss`);
const names = [
  ...data.ZONES.flatMap((z) => [z.name, ...z.creatures.map((c) => c.name)]),
  ...data.SPELLS.map((s) => s.name),
  ...data.PETS.map((p) => p.name),
  ...data.PET_STAGES,
  ...data.QUESTS.map((q) => q.name),
  ...STICKERS.filter((s) => s.id.startsWith("duel-")).flatMap((s) => [s.name, s.hint]),
];
for (const name of names) assert.ok(name in ES_DUEL, `Spanish for "${name}"`);

// ---- Cleaning: junk in, safe record out
const junk = core.cleanDuel({
  gold: -5,
  wins: "x",
  beaten: ["grub", "nope"],
  pets: { pip: 3, ghost: 9 },
  active: "ghost",
  day: { date: "yesterday", spells: ["spark", "x"] },
});
assert.equal(junk.gold, 0);
assert.deepEqual(junk.beaten, ["grub"]);
assert.deepEqual(Object.keys(junk.pets), ["pip"]);
assert.equal(junk.active, "", "A companion the learner does not own is dropped");
assert.deepEqual(junk.day.spells, ["spark"]);
assert.deepEqual(core.cleanDuel(undefined).beaten, []);

// ---- Unlocking: a boss needs its zone's creatures; the next zone needs the boss
const duel = core.cleanDuel();
assert.equal(core.newBattle(duel, "owl"), null, "Boss is locked at first");
assert.equal(core.newBattle(duel, "penguin"), null, "Zone 2 is locked at first");
assert.ok(core.newBattle(duel, "grub"));

const play = (id, spell, { first = true } = {}) => {
  const battle = core.newBattle(duel, id);
  while (!core.battleOver(battle)) core.castRight(duel, battle, spell, first);
  return { battle, result: core.finishBattle(duel, battle) };
};
for (const id of ["grub", "frog", "bee"]) assert.ok(play(id, "spark").result.won);
assert.ok(core.newBattle(duel, "owl"), "Boss opens after the others");
assert.equal(core.newBattle(duel, "penguin"), null, "Zone 2 waits for the boss");
assert.ok(play("owl", "tide").result.won);
assert.ok(core.newBattle(duel, "penguin"), "Zone 2 opens after the boss");
assert.equal(duel.wins, 4);

// ---- Damage and rewards
const grub = core.creatureById("grub");
assert.equal(core.damageFor(core.cleanDuel(), grub, "leaf"), 2, "Weak spell adds one");
assert.equal(core.damageFor(core.cleanDuel(), grub, "tide"), 1);
const fresh = core.cleanDuel();
const b = core.newBattle(fresh, "grub");
core.castRight(fresh, b, "spark", true);
assert.equal(fresh.gold, 3, "First try pays 3");
core.castRight(fresh, b, "spark", false);
assert.equal(fresh.gold, 4, "A try after a miss pays 1");
const calm = core.newBattle(core.cleanDuel(), "grub", { calm: true });
assert.ok(calm.max < core.newBattle(core.cleanDuel(), "grub").max, "Calm mode lowers energy");

// ---- A creature that is never solved still ends, with nothing lost
const never = core.newBattle(core.cleanDuel(), "grub");
for (let i = 0; i < never.limit; i += 1) core.passRound(never);
assert.ok(core.battleOver(never));
const lost = core.cleanDuel();
const settled = core.finishBattle(lost, never);
assert.deepEqual([settled.won, settled.stars, lost.gold, lost.beaten.length], [false, 1, 0, 0]);

// ---- Pets: eggs hatch in order, cost gold, and growth adds damage
const shop = core.cleanDuel({ gold: 24 });
assert.deepEqual(core.buyEgg(shop), { error: "gold", need: 1 });
shop.gold = 25 * data.PETS.length;
for (const pet of data.PETS) assert.equal(core.buyEgg(shop).pet.id, pet.id);
assert.equal(core.buyEgg(shop).error, "all");
assert.equal(shop.gold, 0);
assert.equal(shop.active, "pip", "The first pet becomes the companion");
assert.equal(core.petBonus(shop), 0);
shop.pets.pip = data.PET_XP_LEVELS[2];
assert.equal(core.petBonus(shop), 1, "A fully grown companion adds 1");
core.chooseCompanion(shop, "ghost");
assert.equal(shop.active, "pip", "Cannot pick a pet the learner does not own");
const pb = core.newBattle(shop, "grub");
core.castRight(shop, pb, "spark", true);
assert.equal(shop.pets.pip, data.PET_XP_LEVELS[2] + 1, "A landed spell trains the companion");

// ---- Quests: three a day, stable for the date, paid once
const quests = core.questsFor("2026-10-31");
assert.equal(new Set(quests.map((q) => q.id)).size, 3);
assert.deepEqual(core.questsFor("2026-10-31"), quests);
const daily = core.cleanDuel();
const dayKey = "2026-10-31";
core.rollDay(daily, dayKey);
assert.equal(core.claimQuest(daily, quests[0].id, dayKey), 0, "Cannot collect before finishing");
core.rollDay(daily, dayKey);
daily.day[quests[0].key === "spells" ? "right" : quests[0].key] = quests[0].goal;
if (quests[0].key === "spells") daily.day.spells = data.SPELLS.map((s) => s.id);
assert.equal(core.claimQuest(daily, quests[0].id, dayKey), quests[0].gold);
assert.equal(core.claimQuest(daily, quests[0].id, dayKey), 0, "A quest pays once");
core.rollDay(daily, "2026-11-01");
assert.equal(daily.day.claimed.length, 0, "A new day clears the counters");

// ---- The duel record travels in the JSON backup
const { cleanPlay } = await import("../math/fluency-lab/play-backup.js");
const restored = cleanPlay({
  rewards: { duel: { gold: 7, beaten: ["grub", "bad"], pets: { pip: 2 }, active: "pip" } },
});
assert.deepEqual(
  [restored.rewards.duel.gold, restored.rewards.duel.beaten, restored.rewards.duel.active],
  [7, ["grub"], "pip"],
);

// ---- The game in the Game Room (Grade 4)
await import("../math/fluency-lab/app.js");
const $ = (selector) => win.document.querySelector(selector);
const $$ = (selector) => [...win.document.querySelectorAll(selector)];
const click = (selector) => {
  assert.ok($(selector), `Missing ${selector}`);
  $(selector).click();
};
const submit = () =>
  $(".gm-ask-form").dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
await wait();
assert.ok($('[data-game="duel"]'), "Spell Duel is offered");
click('[data-game="duel"]');
await wait();
assert.ok($(".dl-zone"), "The map shows zones");
assert.ok(
  $('[data-creature="penguin"]').disabled && $('[data-creature="owl"]').disabled,
  "Locked creatures are disabled",
);
click('[data-creature="grub"]');
await wait();
click('[data-spell="leaf"]');
assert.equal($('[data-spell="leaf"]').getAttribute("aria-pressed"), "true");

const evaluate = (q) => {
  const m = q
    .replace(/\s+/g, " ")
    .trim()
    .match(/^(\d+) ([×+−-]) (\d+) = \?$/);
  if (!m) return null;
  const [a, b2] = [Number(m[1]), Number(m[3])];
  return m[2] === "×" ? a * b2 : m[2] === "+" ? a + b2 : a - b2;
};
let solvedHere = 0;
for (let guard = 0; guard < 14 && !$(".gm-result"); guard += 1) {
  const answer = evaluate($("#gm-q").textContent);
  if (answer !== null) {
    $("#gm-input").value = String(answer);
    submit();
    solvedHere += 1;
  } else {
    for (let miss = 0; miss < 2; miss += 1) {
      $("#gm-input").value = "-999";
      submit();
      if ($("[data-feedback-action='try-again']")) $("[data-feedback-action='try-again']").click();
    }
  }
  const next = $("[data-feedback-action='next']");
  if (next) next.click();
  await wait();
}
assert.ok($(".gm-result"), "The duel ends on the shared result screen");
assert.ok(solvedHere >= 1, "At least one problem was answerable by the test");
assert.match($(".tr-score").textContent, /Spell Duel/);
const saved = loadRewards();
assert.ok(saved.duel.gold > 0 && saved.best.duel >= 1, "Gold and best stars are kept");
click("[data-again]");
await wait();
assert.ok($(".dl-zone") && $(".dl-gold"), "Play again returns to the map with gold shown");
click("[data-gm-menu]");
await wait();
assert.ok($(".gm-menu"), "Back to the Game Room");
void $$;
console.log("fluency-duel: ok");
process.exit(0);
