// ProgressionStore.js — Versioned localStorage manager (`tlp_games_v2`) for ACCESS Practice Lab Games & Worlds.
// Tracks Total XP, Streak + Streak Shield, Domain Practice Mastery Levels (never official WIDA proficiency claims),
// World Artifacts/Badges, UI Theme (default/dark/projector), Zen Mode preference, and the `weakSpots` queue
// of missed prompts/structures per game so learners can launch targeted Weak-Spot Replays.
// Zero PII collection (K-12 privacy safe). Safe migration/fallback if storage is corrupted.

import { safeJson, storage } from "../util.js";

export const PROGRESSION_KEY = "tlp_games_v2";
export const LEGACY_GAMES_KEY = "accessPracticeLab:v1:games";
export const SCHEMA_VERSION = 2;
export const MAX_WEAK_SPOTS_PER_GAME = 25;

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing", "Integrated"];
// Light only (Joel, 2026-11-24): no dark theme on The Language Page. A saved "dark" falls back to "default".
const THEMES = ["default", "projector"];

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function emptyProgression() {
  return {
    v: SCHEMA_VERSION,
    totalXp: 0,
    streak: 0,
    bestStreak: 0,
    streakShield: true,
    shieldsUsed: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    zenMode: true,
    theme: "default",
    domainStats: {
      Listening: { xp: 0, attempts: 0, firstTry: 0, tier: 1 },
      Reading: { xp: 0, attempts: 0, firstTry: 0, tier: 1 },
      Speaking: { xp: 0, attempts: 0, firstTry: 0, tier: 1 },
      Writing: { xp: 0, attempts: 0, firstTry: 0, tier: 1 },
      Integrated: { xp: 0, attempts: 0, firstTry: 0, tier: 1 },
    },
    worldBadges: [],
    weakSpots: {},
    updatedAt: "",
  };
}

function tierForXp(xp) {
  if (xp >= 300) return 4;
  if (xp >= 150) return 3;
  if (xp >= 50) return 2;
  return 1;
}

function normalizeDomain(skill) {
  const s = String(skill || "").toLowerCase();
  if (s.includes("listen")) return "Listening";
  if (s.includes("speak") || s.includes("echo") || s.includes("respond") || s.includes("interpret")) return "Speaking";
  if (s.includes("writ") || s.includes("spell") || s.includes("punct") || s.includes("connect") || s.includes("syntax"))
    return "Writing";
  if (s.includes("read") || s.includes("vocab") || s.includes("evidence") || s.includes("infer") || s.includes("context"))
    return "Reading";
  if (DOMAINS.includes(skill)) return skill;
  return "Integrated";
}

function cleanWeakSpotItem(item) {
  if (!isObject(item) || typeof item.id !== "string" || !item.id.trim()) return null;
  return {
    id: String(item.id).slice(0, 120),
    game: String(item.game || "").slice(0, 60),
    band: ["3-5", "6-8"].includes(item.band) ? item.band : "6-8",
    skill: String(item.skill || "language").slice(0, 60),
    prompt: String(item.prompt || "").slice(0, 240),
    misses: Math.max(1, Math.min(99, Number(item.misses) || 1)),
    lastMissedAt: typeof item.lastMissedAt === "string" ? item.lastMissedAt : new Date().toISOString(),
  };
}

export function cleanProgression(raw, legacyGames = null) {
  const out = emptyProgression();
  if (isObject(raw)) {
    out.totalXp = Math.max(0, Math.min(500000, Math.floor(Number(raw.totalXp) || 0)));
    out.streak = Math.max(0, Math.min(9999, Math.floor(Number(raw.streak) || 0)));
    out.bestStreak = Math.max(out.streak, Math.min(9999, Math.floor(Number(raw.bestStreak) || 0)));
    out.streakShield = raw.streakShield !== false;
    out.shieldsUsed = Math.max(0, Math.min(9999, Math.floor(Number(raw.shieldsUsed) || 0)));
    out.totalAttempts = Math.max(0, Math.min(999999, Math.floor(Number(raw.totalAttempts) || 0)));
    out.totalCorrect = Math.max(0, Math.min(out.totalAttempts, Math.floor(Number(raw.totalCorrect) || 0)));
    out.zenMode = raw.zenMode !== false;
    out.theme = THEMES.includes(raw.theme) ? raw.theme : "default";
    out.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : "";

    if (isObject(raw.domainStats)) {
      for (const dom of DOMAINS) {
        const d = raw.domainStats[dom];
        if (isObject(d)) {
          const xp = Math.max(0, Math.min(100000, Math.floor(Number(d.xp) || 0)));
          const attempts = Math.max(0, Math.min(100000, Math.floor(Number(d.attempts) || 0)));
          const firstTry = Math.max(0, Math.min(attempts, Math.floor(Number(d.firstTry) || 0)));
          out.domainStats[dom] = { xp, attempts, firstTry, tier: tierForXp(xp) };
        }
      }
    }

    if (Array.isArray(raw.worldBadges)) {
      out.worldBadges = [...new Set(raw.worldBadges.filter((x) => typeof x === "string" && x.length <= 80))].slice(
        0,
        120,
      );
    }

    if (isObject(raw.weakSpots)) {
      for (const [key, list] of Object.entries(raw.weakSpots)) {
        if (!Array.isArray(list)) continue;
        const cleaned = list.map(cleanWeakSpotItem).filter(Boolean).slice(-MAX_WEAK_SPOTS_PER_GAME);
        if (cleaned.length) out.weakSpots[key] = cleaned;
      }
    }
  }

  // Safe migration from v1 game history if v2 is empty
  if (out.totalAttempts === 0 && isObject(legacyGames) && Array.isArray(legacyGames.history)) {
    for (const h of legacyGames.history) {
      if (!isObject(h)) continue;
      const rounds = Math.max(0, Number(h.rounds) || 0);
      const firstTry = Math.max(0, Number(h.firstTry) || 0);
      out.totalAttempts += rounds;
      out.totalCorrect += firstTry;
      out.totalXp += firstTry * 10 + Math.max(0, rounds - firstTry) * 5;
    }
    if (Array.isArray(legacyGames.awards)) {
      out.worldBadges = [...new Set([...out.worldBadges, ...legacyGames.awards.filter((a) => typeof a === "string")])];
    }
  }

  return out;
}

export function loadProgression(read = (k) => storage.get(k)) {
  const raw = safeJson(read(PROGRESSION_KEY), null);
  const legacy = raw ? null : safeJson(read(LEGACY_GAMES_KEY), null);
  return cleanProgression(raw, legacy);
}

export function saveProgression(prog, write = (k, v) => storage.set(k, v)) {
  const cleaned = cleanProgression(prog);
  cleaned.updatedAt = new Date().toISOString();
  write(PROGRESSION_KEY, JSON.stringify(cleaned));
  return cleaned;
}

/**
 * Record a round judgment into `tlp_games_v2`:
 * - Updates XP, Streak, Streak Shield (absorbs 1 miss when streak >= 2), Accuracy, Domain stats
 * - Logs or clears the item in the game's `weakSpots` queue
 */
export function recordRoundOutcome({
  gameId,
  band = "6-8",
  itemId,
  skill = "Integrated",
  ok = false,
  first = false,
  revised = false,
  prompt = "",
  read = (k) => storage.get(k),
  write = (k, v) => storage.set(k, v),
} = {}) {
  const prog = loadProgression(read);
  const dom = normalizeDomain(skill);
  const ds = prog.domainStats[dom] || prog.domainStats.Integrated;
  const gameKey = `${gameId}:${band}`;
  const baseId = String(itemId || "").split(":")[0] || String(itemId || "round");

  prog.totalAttempts += 1;
  ds.attempts += 1;

  let xpEarned = 0;
  let shieldTriggered = false;

  if (ok) {
    prog.totalCorrect += 1;
    if (first) {
      prog.streak += 1;
      prog.bestStreak = Math.max(prog.bestStreak, prog.streak);
      ds.firstTry += 1;
      const comboBonus = Math.min(15, Math.max(0, (prog.streak - 1) * 3));
      xpEarned = 10 + comboBonus;
      // Earn back Streak Shield on a 4-streak
      if (prog.streak > 0 && prog.streak % 4 === 0) {
        prog.streakShield = true;
      }
      // Remove from weakSpots if mastered on first try
      if (Array.isArray(prog.weakSpots[gameKey])) {
        prog.weakSpots[gameKey] = prog.weakSpots[gameKey].filter(
          (w) => w.id !== baseId && w.id !== String(itemId),
        );
        if (!prog.weakSpots[gameKey].length) delete prog.weakSpots[gameKey];
      }
    } else {
      // Revised after hint/retry
      xpEarned = 6;
    }
  } else {
    // Miss: check Streak Shield first
    if (prog.streak >= 2 && prog.streakShield) {
      prog.streakShield = false;
      prog.shieldsUsed += 1;
      shieldTriggered = true;
    } else {
      prog.streak = 0;
    }
  }

  // Queue into weakSpots if missed or needed revision
  if ((!ok || revised) && gameId && baseId) {
    const list = (prog.weakSpots[gameKey] ||= []);
    const existing = list.find((w) => w.id === baseId);
    if (existing) {
      existing.misses = Math.min(99, existing.misses + 1);
      existing.lastMissedAt = new Date().toISOString();
      if (prompt) existing.prompt = String(prompt).slice(0, 240);
    } else {
      list.push({
        id: baseId,
        game: String(gameId),
        band: ["3-5", "6-8"].includes(band) ? band : "6-8",
        skill: String(skill || dom),
        prompt: String(prompt || "").slice(0, 240),
        misses: 1,
        lastMissedAt: new Date().toISOString(),
      });
      if (list.length > MAX_WEAK_SPOTS_PER_GAME) {
        prog.weakSpots[gameKey] = list.slice(-MAX_WEAK_SPOTS_PER_GAME);
      }
    }
  }

  prog.totalXp += xpEarned;
  ds.xp += xpEarned;
  ds.tier = tierForXp(ds.xp);

  saveProgression(prog, write);
  return {
    progression: prog,
    xpEarned,
    shieldTriggered,
    streak: prog.streak,
    streakShield: prog.streakShield,
  };
}

export function getWeakSpots(gameId, band = "6-8", read = (k) => storage.get(k)) {
  const prog = loadProgression(read);
  return prog.weakSpots[`${gameId}:${band}`] || [];
}

export function clearWeakSpots(gameId, band = "6-8", read = (k) => storage.get(k), write = (k, v) => storage.set(k, v)) {
  const prog = loadProgression(read);
  delete prog.weakSpots[`${gameId}:${band}`];
  return saveProgression(prog, write);
}

export function unlockWorldBadge(badgeId, read = (k) => storage.get(k), write = (k, v) => storage.set(k, v)) {
  if (!badgeId || typeof badgeId !== "string") return loadProgression(read);
  const prog = loadProgression(read);
  if (!prog.worldBadges.includes(badgeId)) {
    prog.worldBadges.push(badgeId.slice(0, 80));
    return saveProgression(prog, write);
  }
  return prog;
}

export function setGameTheme(theme, read = (k) => storage.get(k), write = (k, v) => storage.set(k, v)) {
  const next = THEMES.includes(theme) ? theme : "default";
  const prog = loadProgression(read);
  prog.theme = next;
  if (typeof document !== "undefined" && document.documentElement) {
    if (next === "default") delete document.documentElement.dataset.gameTheme;
    else document.documentElement.dataset.gameTheme = next;
  }
  return saveProgression(prog, write);
}

export function cycleGameTheme(read = (k) => storage.get(k), write = (k, v) => storage.set(k, v)) {
  const prog = loadProgression(read);
  const idx = THEMES.indexOf(prog.theme);
  const next = THEMES[(idx + 1) % THEMES.length];
  return setGameTheme(next, read, write);
}

export function setZenMode(zen, read = (k) => storage.get(k), write = (k, v) => storage.set(k, v)) {
  const prog = loadProgression(read);
  prog.zenMode = Boolean(zen);
  return saveProgression(prog, write);
}

export function sessionAccuracy(rounds = [], progression = null) {
  const settled = Array.isArray(rounds) ? rounds.filter((r) => r && r.final !== false) : [];
  if (settled.length > 0) {
    const right = settled.filter((r) => r.ok && r.first).length;
    return Math.round((right / settled.length) * 100);
  }
  if (progression && progression.totalAttempts > 0) {
    return Math.round((progression.totalCorrect / progression.totalAttempts) * 100);
  }
  return 100;
}
