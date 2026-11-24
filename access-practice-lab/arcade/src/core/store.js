// Local-first progression for the arcade. Mirrors the lab's approach: no account,
// no network, no learner names — everything is saved on this device and can be
// cleared from the journey panel. XP is a practice motivator, never a grade.

const KEY = "tlp.activityArcade.v1";

const DEFAULTS = {
  version: 1,
  xp: 0,
  games: {}, // id -> { plays, best, stars, band, lastPlayed, missed: {tag: count} }
  badges: [],
  stats: { rounds: 0, correct: 0, minutes: 0 },
  streak: { days: 0, last: null },
  daily: { date: null, done: [] },
  last: { game: null, band: null },
  settings: { lang: "en", sound: true, motion: true, text: 0 },
};

const BADGES = [
  { id: "first-steps", name: "First Steps", es: "Primeros pasos", desc: "Finish your first activity.", icon: "▲" },
  { id: "clean-run", name: "Clean Run", es: "Ronda limpia", desc: "Finish an activity with no misses.", icon: "✦" },
  { id: "hot-streak", name: "Hot Streak", es: "Racha viva", desc: "Get five answers right in a row.", icon: "↗" },
  { id: "all-skills", name: "Four Skills", es: "Cuatro destrezas", desc: "Play an activity in every skill.", icon: "◎" },
  { id: "two-bands", name: "Bridge Builder", es: "Constructor de puentes", desc: "Play at both grade bands.", icon: "≡" },
  { id: "returner", name: "Come Back Strong", es: "Vuelve con fuerza", desc: "Practice on three different days.", icon: "☀" },
];

const listeners = new Set();
let state = load();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULTS);
    const saved = JSON.parse(raw);
    return {
      ...clone(DEFAULTS),
      ...saved,
      games: { ...saved.games },
      stats: { ...DEFAULTS.stats, ...saved.stats },
      streak: { ...DEFAULTS.streak, ...saved.streak },
      daily: { ...DEFAULTS.daily, ...saved.daily },
      settings: { ...DEFAULTS.settings, ...saved.settings },
      last: { ...DEFAULTS.last, ...saved.last },
    };
  } catch {
    return clone(DEFAULTS);
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage can be full or blocked; the session still plays */
  }
  listeners.forEach((fn) => fn(state));
}

function mutate(fn) {
  fn(state);
  persist();
  return state;
}

/** Cumulative XP needed to reach a level. */
export function xpForLevel(level) {
  const n = Math.max(0, level - 1);
  return Math.round(150 * n + 90 * n * n);
}

export function levelInfo(xp = state.xp) {
  let level = 1;
  while (level < 40 && xp >= xpForLevel(level + 1)) level += 1;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const into = Math.max(0, xp - floor);
  const span = Math.max(1, ceil - floor);
  return {
    level,
    rank: rankFor(level),
    into,
    span,
    pct: Math.min(100, Math.round((into / span) * 100)),
    next: Math.max(0, ceil - xp),
  };
}

export function rankFor(level) {
  if (level >= 14) return { en: "Studio Legend", es: "Leyenda del estudio" };
  if (level >= 11) return { en: "Language Navigator", es: "Navegante del idioma" };
  if (level >= 9) return { en: "Evidence Hunter", es: "Cazador de evidencia" };
  if (level >= 7) return { en: "Sentence Scout", es: "Explorador de oraciones" };
  if (level >= 5) return { en: "Sound Engineer", es: "Ingeniero de sonido" };
  if (level >= 3) return { en: "Trail Reader", es: "Lector de senderos" };
  return { en: "Word Wanderer", es: "Viajero de palabras" };
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function touchDay() {
  const today = todayKey();
  if (state.daily.date !== today) {
    state.daily = { date: today, done: [] };
  }
  if (state.streak.last !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(yesterday.getDate()).padStart(2, "0")}`;
    state.streak.days = state.streak.last === y ? state.streak.days + 1 : 1;
    state.streak.last = today;
  }
}

export const store = {
  get state() {
    return state;
  },
  get settings() {
    return state.settings;
  },
  badges: BADGES,

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  setSetting(key, value) {
    mutate((s) => {
      s.settings[key] = value;
    });
  },

  addXp(amount) {
    const before = levelInfo(state.xp).level;
    mutate((s) => {
      s.xp += Math.max(0, Math.round(amount));
      touchDay();
    });
    const after = levelInfo(state.xp).level;
    return { gained: Math.round(amount), levelUp: after > before, level: after };
  },

  hasBadge(id) {
    return state.badges.includes(id);
  },

  awardBadge(id) {
    if (!id || state.badges.includes(id)) return null;
    const badge = BADGES.find((b) => b.id === id);
    if (!badge) return null;
    mutate((s) => s.badges.push(id));
    return badge;
  },

  /** Record a finished session and return any badges it unlocked. */
  recordGame({ id, band, skill, score, accuracy, bestStreak, missed = [], minutes = 0 }) {
    const unlocked = [];
    const stars = accuracy >= 0.85 ? 3 : accuracy >= 0.6 ? 2 : 1;

    mutate((s) => {
      const prev = s.games[id] || {
        plays: 0,
        best: 0,
        stars: 0,
        bands: [],
        lastPlayed: null,
        missed: {},
        skills: [],
      };
      prev.plays += 1;
      prev.best = Math.max(prev.best, score);
      prev.stars = Math.max(prev.stars, stars);
      prev.lastPlayed = new Date().toISOString();
      prev.band = band;
      if (!prev.bands.includes(band)) prev.bands.push(band);
      if (skill && !prev.skills.includes(skill)) prev.skills.push(skill);
      missed.forEach((tag) => {
        if (tag) prev.missed[tag] = (prev.missed[tag] || 0) + 1;
      });
      s.games[id] = prev;

      s.stats.rounds += 1;
      s.stats.minutes += minutes;
      s.last = { game: id, band };

      if (stars === 3) unlocked.push("clean-run");
      if (bestStreak >= 5) unlocked.push("hot-streak");
      if (prev.plays === 1) unlocked.push("first-steps");
      if (state.streak.days >= 3) unlocked.push("returner");
    });

    // Skill / band breadth badges.
    const allSkills = new Set();
    const allBands = new Set();
    Object.values(state.games).forEach((g) => {
      (g.skills || []).forEach((s) => allSkills.add(s));
      (g.bands || []).forEach((b) => allBands.add(b));
    });
    if (allSkills.size >= 4) unlocked.push("all-skills");
    if (allBands.size >= 2) unlocked.push("two-bands");

    return { stars, badges: unlocked.map((b) => this.awardBadge(b)).filter(Boolean) };
  },

  markDaily(taskId) {
    touchDay();
    if (!state.daily.done.includes(taskId)) {
      mutate((s) => s.daily.done.push(taskId));
    }
    return state.daily.done;
  },

  dailyDone() {
    const today = todayKey();
    if (state.daily.date !== today) {
      state.daily = { date: today, done: [] };
      persist();
    }
    return state.daily.done;
  },

  bestStars() {
    return Object.values(state.games).reduce((sum, g) => sum + (g.stars || 0), 0);
  },

  /** The skill with the most recorded misses, used for next-step suggestions. */
  weakestTag() {
    const tally = {};
    Object.values(state.games).forEach((g) => {
      Object.entries(g.missed || {}).forEach(([tag, n]) => {
        tally[tag] = (tally[tag] || 0) + n;
      });
    });
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : "";
  },

  reset() {
    state = clone(DEFAULTS);
    persist();
  },
};
