// Adaptive support from what the learner actually did, in plain deterministic rules. The only inputs are
// recorded attempts (right or wrong, with a help flag and a named slip); there is no hidden score. "Independent"
// means no hint was opened before the answer. This is a pattern in recent answers, not a mastery measure.
import { readLocal, writeLocal } from "../school-tools.js";

const KEY = "ewl-studio-v1";
const KEEP = 12;
const read = () => {
  const v = readLocal(KEY, null);
  return v && typeof v === "object" ? { skills: v.skills || {}, badges: v.badges || {} } : { skills: {}, badges: {} };
};

// entry: { kind: "try" | "predict" | "detective", ok, supported, tag? }
export function record(skillKey, entry) {
  const data = read();
  const list = [...(data.skills[skillKey] || []), { kind: entry.kind, ok: Boolean(entry.ok), supported: Boolean(entry.supported), tag: entry.tag || null }];
  data.skills[skillKey] = list.slice(-KEEP);
  writeLocal(KEY, data);
  return data.skills[skillKey];
}
export const history = (skillKey) => read().skills[skillKey] || [];

export function independentStreak(list) {
  let streak = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const e = list[i];
    if (e.kind !== "try") continue;
    if (e.ok && !e.supported) streak += 1;
    else break;
  }
  return streak;
}

// 3 = full support (watch first), 2 = build first, 1 = try with hints on offer, 0 = try, help folded away.
export function scaffold(list) {
  const tries = list.filter((e) => e.kind === "try");
  const lastMiss = tries.length > 0 && !tries.at(-1).ok;
  let level = Math.max(0, 3 - Math.floor(independentStreak(list) / 2));
  if (tries.length === 0) level = 3;
  if (lastMiss) level = Math.max(level, 2);
  return level;
}

// A slip named twice in the last six attempts is a pattern worth a targeted model.
export function recurringTag(list) {
  const counts = {};
  for (const e of list.slice(-6)) if (e.tag) counts[e.tag] = (counts[e.tag] || 0) + 1;
  const [tag, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  return n >= 2 ? tag : null;
}

export function startTab(level, canBuild) {
  if (level >= 3) return "watch";
  if (level === 2) return canBuild ? "build" : "watch";
  return "try";
}

export function awardBadge(engineId) {
  const data = read();
  if (data.badges[engineId]) return false;
  data.badges[engineId] = true;
  writeLocal(KEY, data);
  return true;
}
export const badges = () => read().badges;
export const clearAll = () => writeLocal(KEY, { skills: {}, badges: {} });
