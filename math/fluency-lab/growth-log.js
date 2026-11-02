// Growth log: at most one small snapshot per skill per local day, kept on the device with the learner's other
// progress and carried in the JSON backup. It lets a teacher or family see a skill's score over time without
// storing any answer text, name or timestamp finer than the moment the snapshot was written.
import { MASTERY_STATES, REVIEW_LADDER, ladderIndex } from "./mastery-model.js";
import { readLocal, writeLocal, profileKey, profiles } from "./school-tools.js";
import { DAY, evidence, findSkill, localDay } from "./tutor-engine.js";

const KEY = "ewl-fluency-growth-v1";
export const GROWTH_MAX_DAYS = 120;
export const GROWTH_MAX_ENTRIES = 400;
export const RETAINED_MIN_DAYS = 14;
const HELD = new Set(["proficient", "mastered"]);

export const emptyGrowthLog = () => ({ version: 1, snapshots: [] });

const byTime = (a, b) => a.at - b.at || a.key.localeCompare(b.key);

function cleanSnapshot(entry) {
  if (!entry || typeof entry !== "object" || !findSkill(entry.key)) return null;
  const at = Number(entry.at);
  const score = Number(entry.score);
  if (
    !Number.isFinite(at) ||
    at <= 0 ||
    !Number.isFinite(score) ||
    !MASTERY_STATES.includes(entry.state)
  )
    return null;
  const clamp = (value, max) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
  return {
    key: entry.key,
    at: Math.floor(at),
    score: clamp(score, 100),
    state: entry.state,
    independent: clamp(entry.independent, 99),
    ladderStep: clamp(entry.ladderStep, REVIEW_LADDER.length - 1),
  };
}

// Never more than the caps: one entry per skill per local day (the latest wins), 120 per skill, 400 in all.
// Over the total cap the oldest entries go first, but each skill keeps its first entry as the "start" point.
function capLog(entries) {
  const perDay = new Map();
  for (const entry of [...entries].sort(byTime))
    perDay.set(`${entry.key}|${localDay(entry.at)}`, entry);
  const perSkill = new Map();
  for (const entry of [...perDay.values()].sort(byTime)) {
    const list = perSkill.get(entry.key) || [];
    list.push(entry);
    perSkill.set(entry.key, list);
  }
  let kept = [];
  for (const list of perSkill.values()) kept.push(...list.slice(-GROWTH_MAX_DAYS));
  kept.sort(byTime);
  if (kept.length > GROWTH_MAX_ENTRIES) {
    const firsts = new Set(
      [...perSkill.values()].map((list) => list.at(-GROWTH_MAX_DAYS) ?? list[0]),
    );
    const droppable = kept.filter((entry) => !firsts.has(entry));
    const drop = new Set(droppable.slice(0, kept.length - GROWTH_MAX_ENTRIES));
    kept = kept.filter((entry) => !drop.has(entry));
    kept = kept.slice(-GROWTH_MAX_ENTRIES);
  }
  return kept;
}

export function sanitizeGrowthLog(value) {
  if (!value || typeof value !== "object" || value.version !== 1 || !Array.isArray(value.snapshots))
    return emptyGrowthLog();
  return {
    version: 1,
    snapshots: capLog(
      value.snapshots
        .slice(0, GROWTH_MAX_ENTRIES * 4)
        .map(cleanSnapshot)
        .filter(Boolean),
    ),
  };
}

// Snapshot every skill that has evidence and was practised today (or has no snapshot yet). A second visit on
// the same day replaces that day's snapshot so the log always ends at the latest score.
export function recordSnapshot(tutor, now = Date.now(), log = null) {
  const current = sanitizeGrowthLog(log ?? loadGrowthLog());
  const today = localDay(now);
  const seen = new Set(current.snapshots.map((entry) => entry.key));
  const added = [];
  for (const [key, record] of Object.entries(tutor?.records || {})) {
    const skill = findSkill(key);
    if (!skill || !Array.isArray(record?.recent) || !record.recent.length) continue;
    const practicedToday = Number.isFinite(record.lastAt) && localDay(record.lastAt) === today;
    if (!practicedToday && seen.has(key)) continue;
    const status = evidence(tutor, skill, now);
    if (status.score === null) continue;
    added.push({
      key,
      at: now,
      score: status.score,
      state: status.state,
      independent: status.independent,
      ladderStep: record.interval > 0 ? ladderIndex(record.interval) : 0,
    });
  }
  return {
    version: 1,
    snapshots: capLog([
      ...current.snapshots.filter((entry) => entry.at > now - GROWTH_MAX_DAYS * DAY * 4),
      ...added,
    ]),
  };
}

export function growthFor(log, skillKey) {
  const history = (log?.snapshots || [])
    .filter((entry) => entry.key === skillKey)
    .sort(byTime)
    .map(({ at, score, state }) => ({ at, score, state }));
  const start = history[0] || null;
  const latest = history.at(-1) || null;
  return {
    start,
    now: latest,
    history,
    delta: history.length > 1 ? latest.score - start.score : 0,
    points: history.length,
  };
}

// A skill is "retained" when it was proficient or mastered, stayed that way at every later snapshot, and a
// fresh independent success at review came at least 14 days after it first reached that level.
export function retainedSkills(log, tutor, now = Date.now()) {
  const keys = [...new Set((log?.snapshots || []).map((entry) => entry.key))];
  const out = [];
  for (const key of keys) {
    const skill = findSkill(key);
    const record = tutor?.records?.[key];
    if (!skill || !record) continue;
    if (!HELD.has(evidence(tutor, skill, now).state)) continue;
    const history = log.snapshots.filter((entry) => entry.key === key).sort(byTime);
    let runStart = null;
    for (let index = history.length - 1; index >= 0 && HELD.has(history[index].state); index -= 1)
      runStart = history[index];
    if (!runStart) continue;
    const reviews = (record.recent || []).filter(
      (entry) => entry.independent && entry.correct && entry.level >= 1 && entry.at >= runStart.at,
    );
    if (!reviews.length) continue;
    const daysHeld = Math.floor(
      (Math.max(...reviews.map((entry) => entry.at)) - runStart.at) / DAY,
    );
    if (daysHeld >= RETAINED_MIN_DAYS) out.push({ key, daysHeld });
  }
  return out.sort((a, b) => b.daysHeld - a.daysHeld || a.key.localeCompare(b.key));
}

export function correctedMisconceptions(tutor) {
  return (tutor?.mistakes || [])
    .filter((entry) => entry.category && entry.resolvedAt)
    .map((entry) => ({ key: entry.key, category: entry.category, resolvedAt: entry.resolvedAt }))
    .sort((a, b) => b.resolvedAt - a.resolvedAt || a.key.localeCompare(b.key));
}

const storageKey = (id = profiles().active) => profileKey(KEY, id);
export const loadGrowthLog = (id) => sanitizeGrowthLog(readLocal(storageKey(id), null));
export const saveGrowthLog = (log, id) => writeLocal(storageKey(id), sanitizeGrowthLog(log));

// Called after each save of the learner's progress. Writes only when something changed.
export function recordGrowth(tutor, now = Date.now()) {
  const before = loadGrowthLog();
  const after = recordSnapshot(tutor, now, before);
  if (JSON.stringify(before) !== JSON.stringify(after)) saveGrowthLog(after);
  return after;
}
