/* =============================================================================
 * Number Realm — Items, Abilities & Achievements
 * -----------------------------------------------------------------------------
 * Pure data catalogs used by the shop, the battle screen, and the codex.
 * Exposes window.MRPG_ITEMS = { SHOP, ABILITIES, ACHIEVEMENTS }.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.MRPG_ITEMS) return;

  // Consumables bought with gold and used inside battle.
  var SHOP = [
    {
      id: "potion",
      emoji: "🧪",
      name: "Health Potion",
      cost: 30,
      desc: "Restore about 45% of your HP during a battle.",
      battle: true,
    },
    {
      id: "insight",
      emoji: "📜",
      name: "Scroll of Insight",
      cost: 25,
      desc: "Reveal a full worked method for the current problem (still not the final answer).",
      battle: true,
    },
    {
      id: "aegis",
      emoji: "🛡️",
      name: "Aegis Charm",
      cost: 35,
      desc: "Block the damage from your next wrong answer.",
      battle: true,
    },
    {
      id: "phoenix",
      emoji: "🔥",
      name: "Phoenix Feather",
      cost: 55,
      desc: "If you are knocked out, revive once at half HP and keep fighting.",
      battle: true,
    },
    {
      id: "tome",
      emoji: "📘",
      name: "Tome of Focus",
      cost: 40,
      desc: "Removes two wrong choices on the current problem (a 50/50).",
      battle: true,
    },
  ];

  function shopById(id) {
    for (var i = 0; i < SHOP.length; i++) if (SHOP[i].id === id) return SHOP[i];
    return null;
  }

  // Level-gated battle abilities (free, limited charges per battle).
  var ABILITIES = [
    {
      id: "focus",
      emoji: "🎯",
      name: "Focus",
      level: 2,
      charges: 1,
      desc: "Remove two wrong answers on the current problem (a 50/50).",
    },
    {
      id: "power",
      emoji: "⚡",
      name: "Power Strike",
      level: 4,
      charges: 1,
      desc: "Your next correct answer deals double damage.",
    },
    {
      id: "secondwind",
      emoji: "💨",
      name: "Second Wind",
      level: 6,
      charges: 1,
      desc: "The first time you'd be knocked out, survive and heal 40% instead.",
      passive: true,
    },
    {
      id: "scholar",
      emoji: "📚",
      name: "Scholar's Mercy",
      level: 8,
      charges: 1,
      desc: "Once per battle, a wrong answer deals no damage and shows a full explanation.",
      passive: true,
    },
  ];

  function abilityById(id) {
    for (var i = 0; i < ABILITIES.length; i++) if (ABILITIES[i].id === id) return ABILITIES[i];
    return null;
  }

  // Achievements. `hint` is shown before it is earned.
  var ACHIEVEMENTS = [
    { id: "first-blood", emoji: "⚔️", name: "First Blood", hint: "Win your first battle." },
    { id: "flawless", emoji: "💎", name: "Flawless", hint: "Win a battle with 100% accuracy." },
    { id: "no-hints-boss", emoji: "🧠", name: "Unaided", hint: "Defeat a boss without asking the Sage." },
    { id: "shopper", emoji: "🛒", name: "Well Equipped", hint: "Buy your first item from the shop." },
    { id: "level-5", emoji: "🌟", name: "Seasoned", hint: "Reach hero level 5." },
    { id: "level-10", emoji: "🏅", name: "Veteran", hint: "Reach hero level 10." },
    { id: "boss-slayer", emoji: "🐲", name: "Boss Slayer", hint: "Defeat 5 realm bosses." },
    { id: "scholar-5", emoji: "🎓", name: "Scholar", hint: "Reach Master on 5 different standards." },
    { id: "streak-3", emoji: "🔥", name: "On a Roll", hint: "Complete the Daily Quest 3 days in a row." },
    { id: "streak-7", emoji: "☄️", name: "Unstoppable", hint: "Keep a 7-day Daily Quest streak." },
    { id: "realms-3", emoji: "🗺️", name: "Wayfarer", hint: "Clear 3 realms." },
    { id: "realms-all", emoji: "👑", name: "Realm Walker", hint: "Clear all 10 unit realms." },
    { id: "the-null", emoji: "🌌", name: "The Null Undone", hint: "Defeat the final boss of the saga." },
  ];

  window.MRPG_ITEMS = {
    SHOP: SHOP,
    ABILITIES: ABILITIES,
    ACHIEVEMENTS: ACHIEVEMENTS,
    shopById: shopById,
    abilityById: abilityById,
  };
})();
