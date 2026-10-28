// The guided family session, as pure logic: what to learn, try, play and explain tonight, what to suggest next, and the
// small local record that lets a reload pick up where it stopped. No DOM here. Everything a family does stays on this
// device. Games, hints and scoring come from the existing Family Math 2.0 modules; this file only chooses and records.
// @fm2 FM-003 FM-004 FM-005 FM-026 FM-027 FM-030
import { profileKey } from "../profile-key.js";
import { coachingCard, explain as coachExplain, strandKey } from "../coach.js";
import { covers } from "../inventory.js";
import { recommend } from "../recommend.js";
import { makeRng, seedFrom } from "../rng.js";
import { FALLBACK_PARENT, PARENT, STEP_IDS } from "./guided-copy.js";

export const GUIDED_KEY = "ewl-fm2-guided-v1";
export const DUEL_ID = "family-math-duel";
export const MINUTES = [5, 10];
export const ROUNDS = { 5: { try: 3, play: 2 }, 10: { try: 4, play: 4 } };
export const EXPLAIN_OPTIONS = ["idea", "model", "known", "check", "unsure"];
export const FLOW = STEP_IDS;
const MAX_HISTORY = 30;
const ID = /^[a-z][a-z0-9-]{1,40}$/;

const clamp = (value, min, max, fallback) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
const gradeOf = (grade) => clamp(Number(grade), 0, 8, 1);
const skillIn = (game, skillId) => game?.skills.find((skill) => skill.id === skillId) || null;
const strandOf = (game, skill) => strandKey(skill?.strand, skill?.id, game?.id);

// ---- choosing tonight -----------------------------------------------------------------------------------------------
// target: the skill to learn and try (a pinned skill, else the top recommendation); play: a different game, preferring the
// same strand so the second half uses the same idea in a new setting.
export function pickTonight({
  grade,
  games = [],
  state = null,
  minutes = 5,
  pinned = null,
  seed = 1,
  now = Date.now(),
}) {
  const g = gradeOf(grade);
  const mins = MINUTES.includes(Number(minutes)) ? Number(minutes) : 5;
  const pool = games.filter((game) => game.skills.some((skill) => covers(skill, g)));
  if (!pool.length) return null;
  const byId = new Map(pool.map((game) => [game.id, game]));
  const recs = recommend({ state, grade: g, games: pool, now, limit: 60 }).filter(
    (rec) => byId.has(rec.gameId) && skillIn(byId.get(rec.gameId), rec.skillId),
  );
  const solo = recs.filter((rec) => rec.gameId !== DUEL_ID);
  const pinnedSkill = pinned && byId.has(pinned.gameId) ? skillIn(byId.get(pinned.gameId), pinned.skillId) : null;
  const usable = Boolean(pinnedSkill) && covers(pinnedSkill, g);
  let target = usable ? recs.find((rec) => rec.gameId === pinned.gameId && rec.skillId === pinned.skillId) : null;
  if (!target && usable) target = { gameId: pinned.gameId, skillId: pinned.skillId, level: clamp(pinned.level, 1, 3, 1), reason: "new" };
  target = target || solo[0] || recs[0];
  if (!target) return null;
  const targetGame = byId.get(target.gameId);
  const targetStrand = strandOf(targetGame, skillIn(targetGame, target.skillId));
  const others = solo.filter((rec) => rec.gameId !== target.gameId);
  const sameStrand = others.find(
    (rec) =>
      strandOf(byId.get(rec.gameId), skillIn(byId.get(rec.gameId), rec.skillId)) === targetStrand,
  );
  let play = sameStrand || others[0];
  if (!play) {
    const game = pool.find(
      (x) => x.id !== target.gameId && x.id !== DUEL_ID && x.skills.some((s) => covers(s, g)),
    );
    const skill = game?.skills.find((s) => covers(s, g));
    play = game
      ? { gameId: game.id, skillId: skill.id, level: 1, reason: "new" }
      : { gameId: target.gameId, skillId: target.skillId, level: target.level, reason: "new" };
  }
  const level = clamp(target.level, 1, 3, 1);
  return {
    grade: g,
    minutes: mins,
    seed: clamp(seed, 0, 4294967295, 1),
    target: {
      gameId: target.gameId,
      skillId: target.skillId,
      level,
      reason: target.reason || "new",
    },
    play: {
      gameId: play.gameId,
      skillId: play.skillId,
      level: Math.min(clamp(play.level, 1, 3, 1), level),
    },
    rounds: { ...ROUNDS[mins] },
  };
}

// ---- Learn: one idea, one worked example, one grown-up line ---------------------------------------------------------
// The idea is the game's own strategy hint and the example is its worked step on DIFFERENT numbers, so neither can state
// the answer to the rounds that follow (tools/fm2 suites prove tiers 0-2 never leak). The parent lines come from fixed copy.
// True when `answer` appears in `text` as its own token run (so "6" is found in "= 6" but not in "16").
export function mentions(text, answer) {
  const needle = String(answer ?? "").trim().toLowerCase();
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}.,/])${escaped}($|[^\\p{L}\\p{N}/]|[.,](?!\\d))`, "u").test(String(text).toLowerCase());
}

const LEARN_TRIES = 16;

export function buildLearn({ game, skill, grade, level = 1, seed = 1 }) {
  const g = gradeOf(grade);
  const key = strandOf(game, skill);
  const card = coachingCard({ gameId: game.id, skillId: skill.id, strand: skill.strand, grade: g });
  const words = PARENT[key] || FALLBACK_PARENT;
  // The game's own tier 2 is a worked example on other numbers. Redraw until neither line happens to contain this round's
  // answer, so the Learn card can never be read as the key to a round the family is about to play.
  let round;
  let idea;
  let example;
  let tries = 0;
  for (; tries < LEARN_TRIES; tries += 1) {
    round = game.makeRound(skill.id, clamp(level, 1, 3, 1), makeRng(seedFrom(seed, "learn", tries, game.id, skill.id)), g);
    idea = game.hint(round, 1, null);
    example = game.hint(round, 2, null);
    const answer = game.answerText(round);
    const clean = ["en", "es"].every((lang) => !mentions(idea[lang], answer) && !mentions(example[lang], answer));
    if (clean) break;
  }
  return { strand: key, title: skill.title, idea, example, ask: card.ask, lookFor: card.lookFor, ifStuck: card.ifStuck, say: words.say, avoid: words.avoid, round, redraws: tries };
}

// The same card read from the pre-generated learn bank (tools/generate-guided-skill-index.mjs), so the Learn screen never has to
// load a game module. A skill that spans grades keeps a harder card for its upper half.
export function learnFromBank({ card, gameId, skill, grade }) {
  const g = gradeOf(grade);
  const [low, high] = skill.grades;
  const pick = card.hi && g >= Math.ceil((low + high) / 2) ? card.hi : card.lo;
  const key = strandOf({ id: gameId }, skill);
  const coached = coachingCard({ gameId, skillId: skill.id, strand: skill.strand, grade: g });
  const words = PARENT[key] || FALLBACK_PARENT;
  return { strand: key, title: skill.title, idea: pick.idea, example: pick.example, ask: coached.ask, lookFor: coached.lookFor, ifStuck: coached.ifStuck, say: words.say, avoid: words.avoid };
}

// ---- Explain: the child says why aloud, then taps what helped. Nothing is graded and nothing leaves the device -----------
export function buildExplain({ game, skill, grade, seed = 1, idea }) {
  const ask = coachExplain({ game, skill, grade: gradeOf(grade), round: { prompt: seed } });
  return { ask, idea, options: EXPLAIN_OPTIONS.slice() };
}

// ---- Continue: the next session follows what happened ---------------------------------------------------------------
export function accuracy(result) {
  return result && result.rounds > 0 ? result.correct / result.rounds : 0;
}

export function nextPlan({ active, games = [], state = null, now = Date.now() }) {
  const { target, tryRes, explain } = active;
  const acc = accuracy(tryRes);
  const same = (level) => ({
    gameId: target.gameId,
    skillId: target.skillId,
    level: clamp(level, 1, 3, 1),
  });
  if (explain === "unsure" || acc < 0.5) return { kind: "again", ...same(target.level - 1) };
  if (acc >= 0.8) {
    const recs = recommend({ state, grade: active.grade, games, now, limit: 60 }).filter(
      (rec) =>
        rec.gameId !== DUEL_ID && !(rec.gameId === target.gameId && rec.skillId === target.skillId),
    );
    if (recs[0])
      return {
        kind: "next",
        gameId: recs[0].gameId,
        skillId: recs[0].skillId,
        level: clamp(recs[0].level, 1, 3, 1),
      };
    return { kind: "keep", ...same(target.level + 1) };
  }
  return { kind: "keep", ...same(target.level) };
}

// ---- the local record ----------------------------------------------------------------------------------------------
export const emptyGuided = () => ({
  v: 1,
  grade: null,
  minutes: 5,
  active: null,
  history: [],
  next: null,
});

const cleanSlot = (raw) =>
  raw && ID.test(raw.gameId || "") && ID.test(raw.skillId || "")
    ? { gameId: raw.gameId, skillId: raw.skillId, level: clamp(raw.level, 1, 3, 1) }
    : null;
const cleanResult = (raw) =>
  raw && typeof raw === "object"
    ? {
        correct: clamp(raw.correct, 0, 12, 0),
        rounds: clamp(raw.rounds, 0, 12, 0),
        hints: clamp(raw.hints, 0, 99, 0),
      }
    : null;

function cleanActive(raw) {
  if (!raw || typeof raw !== "object" || !STEP_IDS.includes(raw.step)) return null;
  const target = cleanSlot(raw.target);
  const play = cleanSlot(raw.play);
  if (!target || !play || typeof raw.id !== "string") return null;
  const minutes = MINUTES.includes(raw.minutes) ? raw.minutes : 5;
  return {
    id: raw.id.slice(0, 40),
    grade: gradeOf(raw.grade),
    minutes,
    seed: clamp(raw.seed, 0, 4294967295, 1),
    target,
    play,
    rounds: { ...ROUNDS[minutes] },
    step: raw.step,
    playStarted: Boolean(raw.playStarted),
    tryRes: cleanResult(raw.tryRes),
    playRes: cleanResult(raw.playRes),
    explain: EXPLAIN_OPTIONS.includes(raw.explain) ? raw.explain : null,
    recorded: Boolean(raw.recorded),
    startedAt: clamp(raw.startedAt, 0, 4e12, 0),
  };
}

export function sanitizeGuided(raw) {
  const out = emptyGuided();
  if (!raw || typeof raw !== "object" || raw.v !== 1) return out;
  out.grade = Number.isFinite(raw.grade) ? gradeOf(raw.grade) : null;
  out.minutes = MINUTES.includes(raw.minutes) ? raw.minutes : 5;
  out.active = cleanActive(raw.active);
  out.next = cleanSlot(raw.next)
    ? {
        ...cleanSlot(raw.next),
        kind: ["again", "keep", "next"].includes(raw.next.kind) ? raw.next.kind : "keep",
      }
    : null;
  out.history = (Array.isArray(raw.history) ? raw.history : [])
    .filter(
      (h) => h && Number.isFinite(h.at) && ID.test(h.gameId || "") && ID.test(h.skillId || ""),
    )
    .slice(-MAX_HISTORY)
    .map((h) => ({
      at: h.at,
      grade: gradeOf(h.grade),
      gameId: h.gameId,
      skillId: h.skillId,
      correct: clamp(h.correct, 0, 24, 0),
      total: clamp(h.total, 0, 24, 0),
      explain: EXPLAIN_OPTIONS.includes(h.explain) ? h.explain : null,
    }));
  return out;
}

// A store bound to one learner. `storage` is injectable; the default is localStorage with an in-memory fallback, and
// onUnavailable fires once if the browser refuses to save, so the session keeps working without remembering anything.
export function createGuidedStore({
  profile = 0,
  storage = null,
  onUnavailable = () => {},
  now = () => Date.now(),
} = {}) {
  const memory = new Map();
  let backing = storage;
  if (!backing) {
    try {
      backing = typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
      backing = null;
    }
  }
  const key = profileKey(GUIDED_KEY, profile);
  let warned = false;
  const read = () => {
    try {
      return backing ? backing.getItem(key) : (memory.get(key) ?? null);
    } catch {
      return memory.get(key) ?? null;
    }
  };
  let state;
  try {
    state = sanitizeGuided(JSON.parse(read()));
  } catch {
    state = emptyGuided();
  }
  const save = () => {
    const text = JSON.stringify(state);
    memory.set(key, text);
    let saved = false;
    try {
      if (backing) {
        backing.setItem(key, text);
        saved = true;
      }
    } catch {
      saved = false;
    }
    // No storage at all (blocked site data) and a write that throws are the same to a family: tell them once, keep going.
    if (!saved && !warned) {
      warned = true;
      onUnavailable();
    }
  };
  return {
    profile,
    get state() {
      return state;
    },
    save,
    begin(plan) {
      state.grade = plan.grade;
      state.minutes = plan.minutes;
      state.active = cleanActive({
        ...plan,
        id: `${now()}`,
        step: "learn",
        startedAt: now(),
        tryRes: null,
        playRes: null,
        explain: null,
        recorded: false,
      });
      save();
      return state.active;
    },
    update(patch) {
      if (!state.active) return null;
      state.active = cleanActive({ ...state.active, ...patch });
      save();
      return state.active;
    },
    // Record the finished session once: a history line and the next plan. Returns the line.
    finish(next) {
      const a = state.active;
      if (!a || a.recorded) return null;
      const line = {
        at: now(),
        grade: a.grade,
        gameId: a.target.gameId,
        skillId: a.target.skillId,
        correct: a.tryRes?.correct ?? 0,
        total: a.tryRes?.rounds ?? 0,
        explain: a.explain,
      };
      state.history = [...state.history, line].slice(-MAX_HISTORY);
      state.next = next
        ? { gameId: next.gameId, skillId: next.skillId, level: next.level, kind: next.kind }
        : null;
      state.active = cleanActive({ ...a, recorded: true });
      save();
      return line;
    },
    clearActive() {
      state.active = null;
      save();
    },
  };
}
