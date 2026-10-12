// Sticker book, ranks, practice-day streak, and a small celebration. Local to this learner; nothing is sent anywhere.
import { TRAILS, factStatus, loadTrail } from "./fact-trail.js";
import { COLORS, ITEMS, SLOTS } from "./buddy-items.js";
import { GAMES_BY_ID_NAME } from "./game-names.js";
import { t } from "./i18n.js";
import { chime } from "./sounds.js";
import { SCENE_IDS } from "./scenes.js";
import { STRATEGIES } from "./strategies.js";
import { localDay } from "./tutor-engine.js";
import { profileKey, profiles, readLocal, writeLocal } from "./school-tools.js";

const KEY = "ewl-fluency-rewards-v1";
const key = () => profileKey(KEY, profiles().active);
const DAY_MS = 86400000;

const GAME_IDS = ["match", "hunt", "sort", "mistake", "make", "family", "balance", "picture", "flip"];

// One suggested game per day, the same all day for everyone on this device.
// One suggested game per day; Fact Family Builder is a Grades 1-5 game, so it is skipped for older grades.
export const dailyGame = (time = Date.now(), grade = 0) => {
  const list = GAME_IDS.filter((id) => id !== "flip" && !(id === "family" && grade > 5));
  // Count local calendar days, so the pick changes at the learner's midnight and not at UTC midnight.
  const date = new Date(time);
  return list[Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS) % list.length];
};

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
    id: "mistake-3",
    icon: "🔍",
    name: "Mistake Spotter",
    hint: "Win Spot the Mistake with 3 stars",
    test: (s) => s.best.mistake >= 3,
  },
  {
    id: "make-3",
    icon: "🧩",
    name: "Pair Master",
    hint: "Win Make It with 3 stars",
    test: (s) => s.best.make >= 3,
  },
  {
    id: "family-3",
    icon: "👨‍👩‍👧",
    name: "Family Builder",
    hint: "Win Fact Family Builder with 3 stars",
    test: (s) => s.best.family >= 3,
  },
  {
    id: "balance-3",
    icon: "⚖️",
    name: "Balance Master",
    hint: "Win Balance It with 3 stars",
    test: (s) => s.best.balance >= 3,
  },
  {
    id: "boss",
    icon: "👑",
    name: "Boss Beater",
    hint: "Beat a trail's boss round with 2 stars",
    test: (s) => s.boss >= 1,
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
    id: "retired-5",
    icon: "💪",
    name: "Comeback Kid",
    hint: "Retire 5 tricky fact cards",
    test: (s) => s.retired >= 5,
  },
  {
    id: "goal",
    icon: "🎯",
    name: "Goal Getter",
    hint: "Reach your weekly practice goal",
    test: (s) => s.goalWeeks >= 1,
  },
  {
    id: "days-3",
    icon: "🔥",
    name: "3 Days Running",
    hint: "Practice 3 days in a row",
    test: (s) => s.bestStreak >= 3,
  },
  {
    id: "days-7",
    icon: "🚀",
    name: "Week Streak",
    hint: "Practice 7 days in a row",
    test: (s) => s.bestStreak >= 7,
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
    best: { match: num(best.match), hunt: num(best.hunt), sort: num(best.sort), mistake: num(best.mistake), make: num(best.make), family: num(best.family), balance: num(best.balance), picture: num(best.picture), flip: num(best.flip) },
    scenes: Array.isArray(saved.scenes) ? saved.scenes.filter((id) => SCENE_IDS.includes(id)) : [],
    seen: Array.isArray(saved.seen) ? saved.seen.filter((id) => STICKERS.some((sticker) => sticker.id === id)) : [],
    strategies,
    calm: saved.calm === true,
    buddy: cleanBuddy(saved.buddy),
    goal: [2, 3, 4, 5].includes(saved.goal) ? saved.goal : 3,
    retired: num(saved.retired),
    bestStreak: num(saved.bestStreak),
    goalWeeks: Array.isArray(saved.goalWeeks) ? saved.goalWeeks.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)).slice(-60) : [],
  };
}

// Colour and one accessory per slot; anything unknown falls back to the default look.
export function cleanBuddy(saved = {}) {
  const look = { color: saved?.color in COLORS ? saved.color : "blue" };
  for (const slot of SLOTS) look[slot] = ITEMS.some((item) => item.slot === slot && item.id === saved?.[slot]) ? saved[slot] : "";
  return look;
}

// Weekly goal: the week runs Monday to Sunday, counted in distinct practice days.
export const weekStart = (time = Date.now()) => {
  const date = new Date(time);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return localDay(date.getTime());
};
export const daysThisWeek = (days, time = Date.now()) => {
  const start = weekStart(time);
  return new Set(days.filter((day) => day >= start && day <= localDay(time))).size;
};

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
  // Earned streak stickers and buddy items stay earned after the run ends.
  data.bestStreak = Math.max(data.bestStreak || 0, streakOf(data.days));
  const week = weekStart();
  if (daysThisWeek(data.days) >= data.goal && !data.goalWeeks.includes(week)) data.goalWeeks = [...data.goalWeeks, week].slice(-60);
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
  // Step by calendar day (setDate), not by 24h: a daylight-saving change makes a day 23 or 25 hours long.
  const cursor = new Date();
  if (!set.has(localDay(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let run = 0;
  while (set.has(localDay(cursor.getTime()))) {
    run += 1;
    cursor.setDate(cursor.getDate() - 1);
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
    boss: Object.entries(trail.stations).filter(([id, entry]) => id.endsWith(":boss") && entry.stars >= 2).length,
    facts,
    plays: data.plays,
    best: data.best,
    scenes: data.scenes.length,
    goalWeeks: data.goalWeeks.length,
    retired: data.retired,
    strategyTotal: Object.values(data.strategies).reduce((sum, count) => sum + count, 0),
    streak: streakOf(data.days),
    bestStreak: Math.max(data.bestStreak || 0, streakOf(data.days)),
  };
}

export const earnedIds = (summary) =>
  STICKERS.filter((sticker) => sticker.test(summary)).map((sticker) => sticker.id);

const scoreOf = (summary) => summary.stars + summary.plays * 2 + summary.scenes * 3 + (summary.boss || 0) * 5;

export const rankIndex = (summary) => RANKS.reduce((best, rank, i) => (scoreOf(summary) >= rank.at ? i : best), 0);

export function rankFor(summary) {
  const index = rankIndex(summary);
  const next = RANKS[index + 1] ? { ...RANKS[index + 1], name: t(RANKS[index + 1].name) } : null;
  return { ...RANKS[index], name: t(RANKS[index].name), next, score: scoreOf(summary) };
}

// Stickers earned since the learner last looked; marks them seen.
export function claimNewStickers(data, summary) {
  const fresh = earnedIds(summary).filter((id) => !data.seen.includes(id));
  if (fresh.length) data.seen = [...data.seen, ...fresh];
  return fresh.map((id) => STICKERS.find((sticker) => sticker.id === id));
}

export const stickerToast = (stickers) =>
  stickers.length
    ? `<div class="rw-toast" role="status"><b>${stickers.length > 1 ? t("New stickers!") : t("New sticker!")}</b> ${stickers.map((s) => `<span title="${t(s.name)}">${s.icon} ${t(s.name)}</span>`).join("")}</div>`
    : "";

export function stickerShelf(summary) {
  const earned = new Set(earnedIds(summary));
  return `<ul class="rw-shelf" aria-label="${t("Sticker book, {n} of {m} earned", { n: earned.size, m: STICKERS.length })}">${STICKERS.map(
    (s) =>
      earned.has(s.id)
        ? `<li class="on"><span aria-hidden="true">${s.icon}</span><b>${t(s.name)}</b><small>${t(s.hint)}</small></li>`
        : `<li><span aria-hidden="true" class="lock">?</span><b>${t(s.name)}</b><small>${t(s.hint)}</small></li>`,
  ).join("")}</ul>`;
}

export function rewardStrip(grade, avatarHtml = "") {
  const data = loadRewards();
  const summary = summarize(loadTrail(), data);
  const rank = rankFor(summary);
  const toNext = rank.next ? t("{n} more to {rank}", { n: rank.next.at - rank.score, rank: rank.next.name }) : t("Top rank");
  const streak = summary.streak;
  const week = daysThisWeek(data.days);
  const goalMet = week >= data.goal;
  return `<div class="rw-strip" aria-label="${t("Your rewards")}">
    ${avatarHtml ? `<span class="rw-buddy" aria-hidden="true">${avatarHtml}</span>` : ""}
    <span class="rw-chip"><b aria-hidden="true">${rank.icon}</b>${rank.name}<small>${toNext}</small></span>
    <span class="rw-chip"><b aria-hidden="true">🔥</b>${streak === 1 ? t("{n} day in a row", { n: streak }) : t("{n} days in a row", { n: streak })}<small>${streak ? t("Come back tomorrow") : t("Practice today to start")}</small></span>
    <span class="rw-chip${goalMet ? " met" : ""}"><b aria-hidden="true">${goalMet ? "✅" : "🎯"}</b>${t("This week: {a} of {b} days", { a: Math.min(week, data.goal), b: data.goal })}<small>${goalMet ? t("Goal reached!") : t("Your weekly goal")}</small></span>
    <button type="button" class="rw-chip rw-go" data-daily-game="${dailyGame(Date.now(), grade)}"><b aria-hidden="true">🎮</b>${t("Play today’s game")}<small>${t(GAMES_BY_ID_NAME[dailyGame(Date.now(), grade)])}</small></button>
    <span class="rw-chip"><b aria-hidden="true">🎖️</b>${t("{n} of {m} stickers", { n: earnedIds(summary).length, m: STICKERS.length })}<small>${TRAILS[grade] ? t("See the Games tab") : ""}</small></span>
  </div>`;
}

// Confetti that only moves for people who have not asked for reduced motion.
export function celebrate(host) {
  chime("win");
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
