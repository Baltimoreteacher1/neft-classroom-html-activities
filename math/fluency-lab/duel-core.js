// Spell Duel rules, kept free of the page so tests can play whole duels. A correct answer casts the chosen spell.
// A wrong answer never costs the wizard anything: steps appear, then a second try, then the answer is shown.
import { EGG_COST, PETS, PET_XP_LEVELS, QUESTS, SPELLS, ZONES } from "./duel-data.js";
import { localDay } from "./tutor-engine.js";

export const MAX_ROUNDS = 12;
export const CREATURES = ZONES.flatMap((zone, zoneIndex) =>
  zone.creatures.map((creature) => ({ ...creature, zone: zone.id, zoneIndex })),
);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const num = (value, max = 100000) =>
  Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), max) : 0;
const ids = (list) => (Array.isArray(list) ? list : []);

const cleanDay = (saved = {}) => ({
  date: DAY.test(saved.date) ? saved.date : "",
  wins: num(saved.wins, 99),
  first: num(saved.first, 999),
  right: num(saved.right, 999),
  run: num(saved.run, 99),
  petXp: num(saved.petXp, 999),
  spells: [...new Set(ids(saved.spells).filter((id) => SPELLS.some((spell) => spell.id === id)))],
  claimed: [...new Set(ids(saved.claimed).filter((id) => QUESTS.some((quest) => quest.id === id)))],
});

// Accepts anything (storage or a restored backup) and returns a well-formed duel record.
export function cleanDuel(saved = {}) {
  const pets = {};
  for (const pet of PETS)
    if (Number.isFinite(saved?.pets?.[pet.id])) pets[pet.id] = num(saved.pets[pet.id], 9999);
  return {
    gold: num(saved?.gold, 99999),
    wins: num(saved?.wins),
    beaten: [
      ...new Set(
        ids(saved?.beaten).filter((id) => CREATURES.some((creature) => creature.id === id)),
      ),
    ],
    pets,
    active: saved?.active in pets ? saved.active : "",
    day: cleanDay(saved?.day),
  };
}

// The day counters restart each local day; call before reading or adding to them.
export function rollDay(duel, today = localDay()) {
  if (duel.day.date !== today) duel.day = { ...cleanDay(), date: today };
  return duel.day;
}

export const creatureById = (id) => CREATURES.find((creature) => creature.id === id);
export const spellById = (id) => SPELLS.find((spell) => spell.id === id);

// A zone opens when the one before it has its boss calmed; a boss needs the zone's other creatures first.
export const zoneOpen = (duel, zoneIndex) =>
  zoneIndex === 0 ||
  duel.beaten.includes(ZONES[zoneIndex - 1].creatures.find((creature) => creature.boss).id);
export function creatureOpen(duel, creature) {
  if (!zoneOpen(duel, creature.zoneIndex)) return false;
  if (!creature.boss) return true;
  return ZONES[creature.zoneIndex].creatures
    .filter((other) => !other.boss)
    .every((other) => duel.beaten.includes(other.id));
}

export const petLevel = (xp) =>
  PET_XP_LEVELS.reduce((level, need, i) => (xp >= need ? i : level), 0);
export const petNext = (xp) => PET_XP_LEVELS.find((need) => need > xp) ?? null;
export const petBonus = (duel) => (duel.active && petLevel(duel.pets[duel.active]) >= 2 ? 1 : 0);

export function newBattle(duel, creatureId, { calm = false } = {}) {
  const creature = creatureById(creatureId);
  if (!creature || !creatureOpen(duel, creature)) return null;
  const max = Math.max(2, creature.energy + creature.zoneIndex - (calm ? 1 : 0));
  return {
    creature,
    max,
    energy: max,
    round: 0,
    first: 0,
    right: 0,
    run: 0,
    bestRun: 0,
    gold: 0,
    limit: calm ? 10 : MAX_ROUNDS,
  };
}

export const damageFor = (duel, creature, spellId) =>
  1 + (creature.weak === spellId ? 1 : 0) + petBonus(duel);

const finished = (battle) => battle.energy <= 0 || battle.round >= battle.limit;
export const battleOver = finished;

// A correct answer: the spell lands, gold arrives, the companion trains, quest counters move.
export function castRight(duel, battle, spellId, firstTry) {
  const day = rollDay(duel);
  const damage = damageFor(duel, battle.creature, spellId);
  const gold = firstTry ? 3 : 1;
  battle.round += 1;
  battle.right += 1;
  battle.energy = Math.max(0, battle.energy - damage);
  battle.gold += gold;
  battle.run = firstTry ? battle.run + 1 : 0;
  battle.bestRun = Math.max(battle.bestRun, battle.run);
  duel.gold = Math.min(99999, duel.gold + gold);
  day.right += 1;
  day.run = Math.max(day.run, battle.bestRun);
  if (firstTry) {
    battle.first += 1;
    day.first += 1;
  }
  if (!day.spells.includes(spellId)) day.spells = [...day.spells, spellId];
  if (duel.active) {
    duel.pets[duel.active] = Math.min(9999, duel.pets[duel.active] + 1);
    day.petXp += 1;
  }
  return { damage, weak: battle.creature.weak === spellId, gold };
}

// The learner could not solve it in two tries: the round passes without damage and the run starts again.
export function passRound(battle) {
  battle.round += 1;
  battle.run = 0;
}

// Ends a duel: a calmed creature is added to the bestiary and pays a bonus. Stars never depend on speed.
export function finishBattle(duel, battle) {
  const day = rollDay(duel);
  const won = battle.energy <= 0;
  const bonus = won ? 5 + battle.max : 0;
  if (won) {
    duel.wins += 1;
    day.wins += 1;
    duel.gold = Math.min(99999, duel.gold + bonus);
    if (!duel.beaten.includes(battle.creature.id))
      duel.beaten = [...duel.beaten, battle.creature.id];
  }
  const misses = battle.round - battle.right;
  return { won, bonus, stars: won ? (misses <= 1 ? 3 : 2) : 1 };
}

export const eggsLeft = (duel) => PETS.filter((pet) => !(pet.id in duel.pets));
export function buyEgg(duel) {
  const next = eggsLeft(duel)[0];
  if (!next) return { error: "all" };
  if (duel.gold < EGG_COST) return { error: "gold", need: EGG_COST - duel.gold };
  duel.gold -= EGG_COST;
  duel.pets[next.id] = 0;
  if (!duel.active) duel.active = next.id;
  return { pet: next };
}
export function chooseCompanion(duel, petId) {
  if (petId === "" || petId in duel.pets) duel.active = petId;
}

// Today's three quests: the same for everyone on the device all day, chosen by the date.
export function questsFor(today = localDay()) {
  let seed = 0;
  for (const ch of today) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const picks = [];
  for (let i = 0; picks.length < 3; i += 1) {
    const quest = QUESTS[(seed + i * 2 + Math.floor(i / 3)) % QUESTS.length];
    if (!picks.includes(quest)) picks.push(quest);
  }
  return picks;
}
export const questProgress = (day, quest) =>
  Math.min(quest.goal, quest.key === "spells" ? day.spells.length : day[quest.key]);
export function claimQuest(duel, questId, today = localDay()) {
  const day = rollDay(duel, today);
  const quest = questsFor(today).find((entry) => entry.id === questId);
  if (!quest || day.claimed.includes(quest.id) || questProgress(day, quest) < quest.goal) return 0;
  day.claimed = [...day.claimed, quest.id];
  duel.gold = Math.min(99999, duel.gold + quest.gold);
  return quest.gold;
}
