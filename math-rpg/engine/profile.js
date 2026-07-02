/* =============================================================================
 * Number Realm — Global Hero Profile
 * -----------------------------------------------------------------------------
 * One hero that travels across every realm. Persists level, XP, gold, HP,
 * inventory, unlocked abilities, per-standard mastery, achievements, and
 * lifetime stats in localStorage under "mrpg:hero". Realms keep only their own
 * progress (cleared chapters); the hero is shared, so gold earned in Unit 1
 * buys potions used in Unit 7.
 *
 * Pure data + logic, no DOM. Exposes window.MRPG_PROFILE.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.MRPG_PROFILE) return;

  var KEY = "mrpg:hero";
  var VERSION = 2;

  function xpForLevel(level) {
    return level * 120; // XP needed to go from `level` to `level+1`
  }
  function maxHpForLevel(level) {
    return 60 + (level - 1) * 12;
  }

  // Ability unlock thresholds (level -> ability id). Charges reset each battle.
  var ABILITY_UNLOCKS = [
    { level: 2, id: "focus" },
    { level: 4, id: "power" },
    { level: 6, id: "secondwind" },
    { level: 8, id: "scholar" },
  ];

  function fresh() {
    return {
      v: VERSION,
      name: "",
      avatar: "🧑‍🎓",
      level: 1,
      xp: 0,
      xpNext: xpForLevel(1),
      gold: 0,
      maxHp: maxHpForLevel(1),
      inventory: {}, // itemId -> count
      abilities: {}, // abilityId -> true (unlocked)
      mastery: {}, // standard -> { correct, total }
      achievements: {}, // id -> true
      // Weeks-long engagement: daily quest + return streak tracking.
      daily: {
        lastDate: null, // last calendar day the hero played (YYYY-MM-DD)
        streak: 0, // consecutive days the daily quest was completed
        longest: 0, // best streak ever
        completed: {}, // dateStr -> true  (daily quest finished that day)
        daysPlayed: 0, // distinct calendar days visited
      },
      stats: {
        problemsSolved: 0,
        battlesWon: 0,
        bossesBeaten: 0,
        perfectBattles: 0,
        realmsCleared: 0,
        hintsUsed: 0,
        goldEarned: 0,
      },
    };
  }

  var DATA = null;

  function load() {
    if (DATA) return DATA;
    var g = null;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) g = JSON.parse(raw);
    } catch (e) {}
    if (!g || typeof g !== "object") g = fresh();
    // Backfill any missing fields (forward-compatible).
    var base = fresh();
    Object.keys(base).forEach(function (k) {
      if (g[k] == null) g[k] = base[k];
    });
    Object.keys(base.stats).forEach(function (k) {
      if (g.stats[k] == null) g.stats[k] = 0;
    });
    if (!g.daily || typeof g.daily !== "object") g.daily = base.daily;
    Object.keys(base.daily).forEach(function (k) {
      if (g.daily[k] == null) g.daily[k] = base.daily[k];
    });
    g.v = VERSION;
    DATA = g;
    syncAbilities();
    return DATA;
  }

  function save() {
    if (!DATA) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(DATA));
    } catch (e) {}
  }

  // One-time migration: pull a legacy per-unit hero (from v1 unit saves) into
  // the global profile so early testers keep their level. Takes the best hero.
  function migrateFrom(unitHero) {
    load();
    if (!unitHero || typeof unitHero !== "object") return;
    if ((unitHero.level || 1) > DATA.level) {
      DATA.level = unitHero.level;
      DATA.xp = unitHero.xp || 0;
      DATA.xpNext = xpForLevel(DATA.level);
      DATA.maxHp = maxHpForLevel(DATA.level);
    }
    if ((unitHero.gold || 0) > DATA.gold) DATA.gold = unitHero.gold;
    syncAbilities();
    save();
  }

  function syncAbilities() {
    ABILITY_UNLOCKS.forEach(function (a) {
      if (DATA.level >= a.level) DATA.abilities[a.id] = true;
    });
  }

  function addXp(amount) {
    load();
    DATA.xp += amount;
    var gained = 0;
    var newAbilities = [];
    while (DATA.xp >= DATA.xpNext) {
      DATA.xp -= DATA.xpNext;
      DATA.level++;
      DATA.xpNext = xpForLevel(DATA.level);
      DATA.maxHp = maxHpForLevel(DATA.level);
      gained++;
      ABILITY_UNLOCKS.forEach(function (a) {
        if (a.level === DATA.level && !DATA.abilities[a.id]) {
          DATA.abilities[a.id] = true;
          newAbilities.push(a.id);
        }
      });
    }
    save();
    return { levels: gained, abilities: newAbilities };
  }

  function addGold(amount) {
    load();
    DATA.gold += amount;
    DATA.stats.goldEarned += Math.max(0, amount);
    save();
  }

  function spendGold(amount) {
    load();
    if (DATA.gold < amount) return false;
    DATA.gold -= amount;
    save();
    return true;
  }

  function addItem(id, n) {
    load();
    DATA.inventory[id] = (DATA.inventory[id] || 0) + (n || 1);
    save();
  }

  function useItem(id) {
    load();
    if (!DATA.inventory[id] || DATA.inventory[id] <= 0) return false;
    DATA.inventory[id]--;
    if (DATA.inventory[id] <= 0) delete DATA.inventory[id];
    save();
    return true;
  }

  function itemCount(id) {
    load();
    return DATA.inventory[id] || 0;
  }

  function totalItems() {
    load();
    return Object.keys(DATA.inventory).reduce(function (s, k) {
      return s + DATA.inventory[k];
    }, 0);
  }

  function recordAnswer(standard, correct) {
    load();
    if (standard) {
      var m = DATA.mastery[standard] || { correct: 0, total: 0 };
      m.total++;
      if (correct) m.correct++;
      DATA.mastery[standard] = m;
    }
    if (correct) DATA.stats.problemsSolved++;
    save();
  }

  // Mastery tier for a standard: null (untried), novice, apprentice, master.
  function masteryTier(standard) {
    load();
    var m = DATA.mastery[standard];
    if (!m || m.total === 0) return null;
    var acc = m.correct / m.total;
    if (m.total >= 5 && acc >= 0.8) return "master";
    if (acc >= 0.6) return "apprentice";
    return "novice";
  }

  function masteredCount() {
    load();
    return Object.keys(DATA.mastery).filter(function (s) {
      return masteryTier(s) === "master";
    }).length;
  }

  function grant(achievementId) {
    load();
    if (DATA.achievements[achievementId]) return false; // already had it
    DATA.achievements[achievementId] = true;
    save();
    return true; // newly granted
  }

  function has(achievementId) {
    load();
    return !!DATA.achievements[achievementId];
  }

  function bump(statKey, by) {
    load();
    DATA.stats[statKey] = (DATA.stats[statKey] || 0) + (by == null ? 1 : by);
    save();
  }

  /* ---- daily quest / return streak ------------------------------------- */
  // Register a visit on calendar day `today` (YYYY-MM-DD). `yesterday` is the
  // prior calendar day string. Counts distinct days played. Returns
  // { isNewDay }.
  function touchDay(today, yesterday) {
    load();
    var d = DATA.daily;
    var isNewDay = d.lastDate !== today;
    if (isNewDay) {
      d.daysPlayed++;
      d.lastDate = today;
      // If they missed a day (didn't complete yesterday's daily), the daily
      // streak is reconciled when they next complete a daily; nothing to do
      // here beyond recording the visit.
      save();
    }
    return { isNewDay: isNewDay };
  }

  function dailyDone(today) {
    load();
    return !!DATA.daily.completed[today];
  }

  // Mark the daily quest complete for `today`; update the streak using
  // `yesterday`. Returns { streak, longest, alreadyDone }.
  function completeDaily(today, yesterday) {
    load();
    var d = DATA.daily;
    if (d.completed[today]) {
      return { streak: d.streak, longest: d.longest, alreadyDone: true };
    }
    d.completed[today] = true;
    d.streak = d.completed[yesterday] ? d.streak + 1 : 1;
    if (d.streak > d.longest) d.longest = d.streak;
    // Keep the completed map from growing without bound (last ~90 days).
    var keys = Object.keys(d.completed).sort();
    if (keys.length > 90) {
      keys.slice(0, keys.length - 90).forEach(function (k) {
        delete d.completed[k];
      });
    }
    save();
    return { streak: d.streak, longest: d.longest, alreadyDone: false };
  }

  function get() {
    return load();
  }

  function reset() {
    DATA = fresh();
    save();
    return DATA;
  }

  window.MRPG_PROFILE = {
    get: get,
    load: load,
    save: save,
    migrateFrom: migrateFrom,
    addXp: addXp,
    addGold: addGold,
    spendGold: spendGold,
    addItem: addItem,
    useItem: useItem,
    itemCount: itemCount,
    totalItems: totalItems,
    recordAnswer: recordAnswer,
    masteryTier: masteryTier,
    masteredCount: masteredCount,
    grant: grant,
    has: has,
    bump: bump,
    touchDay: touchDay,
    dailyDone: dailyDone,
    completeDaily: completeDaily,
    reset: reset,
    xpForLevel: xpForLevel,
    maxHpForLevel: maxHpForLevel,
    ABILITY_UNLOCKS: ABILITY_UNLOCKS,
  };
})();
