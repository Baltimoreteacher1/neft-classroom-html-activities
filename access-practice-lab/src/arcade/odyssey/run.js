// run.js — the Skyline Runner's run state: pure functions, no DOM, so progression, saving and shard rules are testable.
//
// A run plays ONE chapter: three levels, each three platform sequences ending at a language gate. The state below is
// everything the world needs to be rebuilt at a checkpoint: the sequence layout is deterministic (levels.js), so only
// the choices that shaped it (the ability target and Auto-walk at the time the screen was built) are stored.
import { CHAPTER_COUNT, LEVELS_PER_CHAPTER, SEQUENCES_PER_LEVEL, levelId, gateCount } from "./levels.js";

export const STATE_VERSION = 1;
/** World Shard values and caps. World pickups are never academic evidence; the session adds its own run-wide cap. */
export const SHARD_VALUE = 1;
export const HIGH_SHARD_VALUE = 2;
export const LEVEL_SHARD_CAP = 12; // main-route pickups per level
export const LEVEL_BONUS_CAP = 6; // optional high-route pickups per level
export const EXIT_PAD = 24;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);

export const emptyStats = () => ({ falls: 0, grapples: 0, gates: 0, first: 0, world: 0, bump: 0, levels: 0 });

export function newRun({ chapter = 1, auto = false, look = "" } = {}) {
  return {
    v: STATE_VERSION,
    chapter: clamp(int(chapter, 1), 1, CHAPTER_COUNT),
    level: 1,
    seq: 1,
    dp: { target: null, auto: Boolean(auto) }, // the inputs the CURRENT screen's layout was built from
    auto: Boolean(auto), // Auto-walk selected: applies from the next screen
    cp: null, // { plat, x } checkpoint on the current screen
    gates: [], // bridge kind per gate of the current screen: "full" | "segments" | null
    pending: null, // gate index whose question is open
    qAt: 0, // session.questions when that gate opened (tells an answered gate from an unanswered one after a reload)
    taken: [], // world shard ids collected on the current level
    levelWorld: 0, // main-route world shards credited this level
    levelBonus: 0,
    done: [], // level ids completed in this run
    stats: emptyStats(),
    look,
  };
}

/** Tolerant restore: anything missing or out of range falls back to a safe value; a wrong version returns null. */
export function restoreRun(raw) {
  if (!raw || typeof raw !== "object" || raw.v !== STATE_VERSION) return null;
  const r = newRun({ chapter: raw.chapter, auto: raw.auto, look: typeof raw.look === "string" ? raw.look : "" });
  r.level = clamp(int(raw.level, 1), 1, LEVELS_PER_CHAPTER);
  r.seq = clamp(int(raw.seq, 1), 1, SEQUENCES_PER_LEVEL);
  r.dp = {
    target: raw.dp && Number.isFinite(Number(raw.dp.target)) ? clamp(int(raw.dp.target), 1, 6) : null,
    auto: Boolean(raw.dp?.auto),
  };
  const gc = gateCount(r.chapter, r.level);
  r.gates = Array.from({ length: gc }, (_, i) => (["full", "segments"].includes(raw.gates?.[i]) ? raw.gates[i] : null));
  r.pending = Number.isInteger(raw.pending) && raw.pending >= 0 && raw.pending < gc ? raw.pending : null;
  r.qAt = Math.max(0, int(raw.qAt));
  r.cp = raw.cp && Number.isFinite(raw.cp.plat) && Number.isFinite(raw.cp.x) ? { plat: int(raw.cp.plat), x: int(raw.cp.x) } : null;
  r.taken = Array.isArray(raw.taken) ? raw.taken.filter((s) => typeof s === "string").slice(0, 80) : [];
  r.levelWorld = clamp(int(raw.levelWorld), 0, 99);
  r.levelBonus = clamp(int(raw.levelBonus), 0, 99);
  r.done = Array.isArray(raw.done) ? raw.done.filter((s) => /^od-ch\d-l\d$/.test(s)).slice(0, 9) : [];
  r.stats = { ...emptyStats(), ...Object.fromEntries(Object.keys(emptyStats()).map((k) => [k, Math.max(0, int(raw.stats?.[k]))])) };
  return r;
}

/** A powered gate: first-try correct builds the full energy bridge; any other result leaves stepping pads (a recoverable obstacle). */
export const bridgeKindFrom = (records = []) => (records.length && records[records.length - 1].firstCorrect ? "full" : "segments");

/** Which shard credit a pickup earns, and whether this level's cap leaves room. Returns { n, main } (n = 0 when capped). */
export function shardCredit(run, shard) {
  const high = Boolean(shard.high);
  const used = high ? run.levelBonus : run.levelWorld;
  const cap = high ? LEVEL_BONUS_CAP : LEVEL_SHARD_CAP;
  const value = high ? HIGH_SHARD_VALUE : SHARD_VALUE;
  if (used + value > cap) return { n: 0, high };
  return { n: value, high };
}

/** Move to the next screen, or report the level/chapter finished. Mutates `run`. Returns "seq" | "level" | "chapter". */
export function advance(run) {
  run.cp = null;
  run.pending = null;
  run.qAt = 0;
  run.dp = { target: null, auto: run.auto };
  if (run.seq < SEQUENCES_PER_LEVEL) {
    run.seq += 1;
    run.gates = [];
    return "seq";
  }
  const id = levelId(run.chapter, run.level);
  if (!run.done.includes(id)) run.done.push(id);
  run.stats.levels += 1;
  run.taken = [];
  run.levelWorld = 0;
  run.levelBonus = 0;
  if (run.level < LEVELS_PER_CHAPTER) {
    run.level += 1;
    run.seq = 1;
    run.gates = [];
    return "level";
  }
  return "chapter";
}

/** Cosmetic unlocks earned by this run (cosmetics never gate learning). Unlock ids are stored by the host. */
export function unlocksFor(run, { bestStreak = 0 } = {}) {
  const out = [];
  const full = (c) => run.done.includes(levelId(c, LEVELS_PER_CHAPTER));
  if (full(1)) out.push("od-scarf-gold");
  if (full(2)) out.push("od-scarf-teal");
  if (full(3)) out.push("od-hat-cap");
  if (run.stats.first >= 3) out.push("od-trail-spark");
  if (bestStreak >= 5) out.push("od-trail-glow");
  return out;
}

/** The highest level id finished in this run (the host records one completedLevel; earlier levels of the chapter are implied). */
export const completedLevel = (run) => {
  const mine = run.done.filter((id) => id.startsWith(`od-ch${run.chapter}-`));
  return mine.length ? mine[mine.length - 1] : "";
};

export const progressText = (run) => ({ chapter: run.chapter, level: run.level, seq: run.seq, seqs: SEQUENCES_PER_LEVEL, levels: LEVELS_PER_CHAPTER });
