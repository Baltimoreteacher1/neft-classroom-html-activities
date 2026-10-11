// Sticker book, ranks, practice-day streak, and a small celebration. Local to this learner; nothing is sent anywhere.
import { TRAILS, factStatus, loadTrail } from "./fact-trail.js";
import { SCENE_IDS } from "./scenes.js";
import { STRATEGIES } from "./strategies.js";
import { localDay } from "./tutor-engine.js";
import { profileKey, profiles, readLocal, writeLocal } from "./school-tools.js";

const KEY = "ewl-fluency-rewards-v1";
const key = () => profileKey(KEY, profiles().active);
const DAY_MS = 86400000;

const GAME_IDS = ["match", "hunt", "sort", "picture"];
const GAME_NAMES = { match: "Fact Match", hunt: "Target Hunt", sort: "Answer Sort", picture: "Mystery Picture" };

// One suggested game per day, the same all day for everyone on this device.
export const dailyGame = (time = Date.now()) => GAME_IDS[Math.floor(time / DAY_MS) % GAME_IDS.length];

export const RANKS = [
  { at: 0, name: "Trail Starter", icon: "🥾" },
  { at: 5, name: "Path Finder", icon: "🧭" },
  { at: 15, name: "Number Explorer", icon: "🔭" },
  { at: 30, name: "Fact Hero", icon: "🦸" },
  { at: 50, name: "Math Legend", icon: "🏆" },
];

// Each sticker is earned from saved evidence, so a sticker can never be handed out for free.
export const STICKERS = [
  {
    id: "first-stop",
    icon: "🌱",
    name: "First Stop",
    hint: "Finish a trail round",
    test: (s) => s.rounds >= 1,
  },
  {
    id: "three-stars",
    icon: "🌟",
    name: "Triple Star",
    hint: "Earn 3 stars on a round",
    test: (s) => s.threeStar >= 1,
  },
  {
    id: "stars-10",
    icon: "⭐",
    name: "10 Stars",
    hint: "Collect 10 trail stars",
    test: (s) => s.stars >= 10,
  },
  {
    id: "stars-25",
    icon: "🌠",
    name: "25 Stars",
    hint: "Collect 25 trail stars",
    test: (s) => s.stars >= 25,
  },
  {
    id: "stops-3",
    icon: "🗺️",
    name: "Map Maker",
    hint: "Finish 3 trail stops",
    test: (s) => s.stops >= 3,
  },
  {
    id: "facts-10",
    icon: "🧠",
    name: "Fact Keeper",
    hint: "Fill in 10 facts on your chart",
    test: (s) => s.facts >= 10,
  },
  {
    id: "facts-30",
    icon: "🧩",
    name: "Fact Master",
    hint: "Fill in 30 facts on your chart",
    test: (s) => s.facts >= 30,
  },
  {
    id: "first-game",
    icon: "🎮",
    name: "Game On",
    hint: "Finish any game",
    test: (s) => s.plays >= 1,
  },
  {
    id: "match-3",
    icon: "🃏",
    name: "Match Maker",
    hint: "Win Fact Match with 3 stars",
    test: (s) => s.best.match >= 3,
  },
  {
    id: "hunt-3",
    icon: "🎯",
    name: "Sharp Eyes",
    hint: "Win Target Hunt with 3 stars",
    test: (s) => s.best.hunt >= 3,
  },
  {
    id: "picture-3",
    icon: "🖼️",
    name: "Picture Pro",
    hint: "Reveal a Mystery Picture with 3 stars",
    test: (s) => s.best.picture >= 3,
  },
  {
    id: "gallery",
    icon: "🎨",
    name: "Gallery Keeper",
    hint: "Reveal every Mystery Picture",
    test: (s) => s.scenes >= SCENE_IDS.length,
  },
  {
    id: "sort-3",
    icon: "🗂️",
    name: "Super Sorter",
    hint: "Win Answer Sort with 3 stars",
    test: (s) => s.best.sort >= 3,
  },
  {
    id: "thinker",
    icon: "💭",
    name: "Strategy Thinker",
    hint: "Tell how you solved something 5 times",
    test: (s) => s.strategyTotal >= 5,
  },
  {
    id: "days-3",
    icon: "🔥",
    name: "3 Days Running",
    hint: "Practice 3 days in a row",
    test: (s) => s.streak >= 3,
  },
  {
    id: "days-7",
    icon: "🚀",
    name: "Week Streak",
    hint: "Practice 7 days in a row",
    test: (s) => s.streak >= 7,
  },
];

// Accepts anything (storage or a restored backup) and returns a well-formed rewards record.
export function cleanRewards(saved = {}) {
  const num = (value) => (Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), 100000) : 0);
  const best = saved.best || {};
  const strategies = {};
  for (const id of Object.keys(STRATEGIES)) if (num(saved.strategies?.[id])) strategies[id] = num(saved.strategies[id]);
  return {
    days: Array.isArray(saved.days)
      ? saved.days.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)).slice(-60)
      : [],
    plays: num(saved.plays),
    best: { match: num(best.match), hunt: num(best.hunt), sort: num(best.sort), picture: num(best.picture) },
    scenes: Array.isArray(saved.scenes) ? saved.scenes.filter((id) => SCENE_IDS.includes(id)) : [],
    seen: Array.isArray(saved.seen) ? saved.seen.filter((id) => STICKERS.some((sticker) => sticker.id === id)) : [],
    strategies,
    calm: saved.calm === true,
  };
}

export const loadRewards = () => cleanRewards(readLocal(key(), {}));

export function recordStrategy(data, id) {
  if (!STRATEGIES[id]) return;
  noteToday(data);
  data.strategies[id] = (data.strategies[id] || 0) + 1;
}

export const saveRewards = (data) => writeLocal(key(), data);

export function noteToday(data) {
  const today = localDay();
  if (!data.days.includes(today)) data.days = [...data.days, today].slice(-60);
}

export function recordGame(data, game, stars, scene = null) {
  noteToday(data);
  data.plays += 1;
  data.best[game] = Math.max(data.best[game] || 0, stars);
  if (scene && stars >= 1 && !data.scenes.includes(scene)) data.scenes = [...data.scenes, scene];
}

// Days in a row ending today (or yesterday, so an evening visit never erases the streak).
export function streakOf(days) {
  const set = new Set(days);
  let cursor = Date.now();
  if (!set.has(localDay(cursor))) cursor -= DAY_MS;
  let run = 0;
  while (set.has(localDay(cursor))) {
    run += 1;
    cursor -= DAY_MS;
  }
  return run;
}

export function summarize(trail = loadTrail(), data = loadRewards()) {
  const entries = Object.values(trail.stations);
  const facts = Object.keys(trail.facts).filter((id) => factStatus(trail, id) === "known").length;
  const stars = entries.reduce((sum, entry) => sum + (entry.stars || 0), 0);
  return {
    rounds: entries.reduce((sum, entry) => sum + (entry.rounds || 0), 0),
    threeStar: entries.filter((entry) => entry.stars >= 3).length,
    stars,
    stops: entries.filter((entry) => entry.stars >= 2).length,
    facts,
    plays: data.plays,
    best: data.best,
    scenes: data.scenes.length,
    strategyTotal: Object.values(data.strategies).reduce((sum, count) => sum + count, 0),
    streak: streakOf(data.days),
  };
}

export const earnedIds = (summary) =>
  STICKERS.filter((sticker) => sticker.test(summary)).map((sticker) => sticker.id);

export function rankFor(summary) {
  const score = summary.stars + summary.plays * 2 + summary.scenes * 3;
  const index = RANKS.reduce((best, rank, i) => (score >= rank.at ? i : best), 0);
  return { ...RANKS[index], next: RANKS[index + 1] || null, score };
}

// Stickers earned since the learner last looked; marks them seen.
export function claimNewStickers(data, summary) {
  const fresh = earnedIds(summary).filter((id) => !data.seen.includes(id));
  if (fresh.length) data.seen = [...data.seen, ...fresh];
  return fresh.map((id) => STICKERS.find((sticker) => sticker.id === id));
}

export const stickerToast = (stickers) =>
  stickers.length
    ? `<div class="rw-toast" role="status"><b>New sticker${stickers.length > 1 ? "s" : ""}!</b> ${stickers.map((s) => `<span title="${s.name}">${s.icon} ${s.name}</span>`).join("")}</div>`
    : "";

export function stickerShelf(summary) {
  const earned = new Set(earnedIds(summary));
  return `<ul class="rw-shelf" aria-label="Sticker book, ${earned.size} of ${STICKERS.length} earned">${STICKERS.map(
    (s) =>
      earned.has(s.id)
        ? `<li class="on"><span aria-hidden="true">${s.icon}</span><b>${s.name}</b><small>${s.hint}</small></li>`
        : `<li><span aria-hidden="true" class="lock">?</span><b>${s.name}</b><small>${s.hint}</small></li>`,
  ).join("")}</ul>`;
}

export function rewardStrip(grade) {
  const data = loadRewards();
  const summary = summarize(loadTrail(), data);
  const rank = rankFor(summary);
  const toNext = rank.next ? `${rank.next.at - rank.score} more to ${rank.next.name}` : "Top rank";
  const streak = summary.streak;
  return `<div class="rw-strip" aria-label="Your rewards">
    <span class="rw-chip"><b aria-hidden="true">${rank.icon}</b>${rank.name}<small>${toNext}</small></span>
    <span class="rw-chip"><b aria-hidden="true">🔥</b>${streak} day${streak === 1 ? "" : "s"} in a row<small>${streak ? "Come back tomorrow" : "Practice today to start"}</small></span>
    <button type="button" class="rw-chip rw-go" data-daily-game="${dailyGame()}"><b aria-hidden="true">🎮</b>Play today’s game<small>${GAME_NAMES[dailyGame()]}</small></button>
    <span class="rw-chip"><b aria-hidden="true">🎖️</b>${earnedIds(summary).length} of ${STICKERS.length} stickers<small>${TRAILS[grade] ? "See the Games tab" : ""}</small></span>
  </div>`;
}

// Confetti that only moves for people who have not asked for reduced motion.
export function celebrate(host) {
  if (!host || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const layer = host.ownerDocument.createElement("div");
  layer.className = "rw-confetti";
  layer.setAttribute("aria-hidden", "true");
  const colors = ["#d14f7a", "#f0a92b", "#2f9e6e", "#3b82c4", "#8a5cc8"];
  layer.innerHTML = Array.from(
    { length: 36 },
    (_, i) =>
      `<i style="--x:${(i * 37) % 100}%;--d:${(i % 9) * 0.09}s;--c:${colors[i % colors.length]};--r:${(i * 53) % 360}deg"></i>`,
  ).join("");
  host.append(layer);
  setTimeout(() => layer.remove(), 2600);
}
