// Language Quest saved state: one key on this device, `accessPracticeLab:v1:quest`. Same rules as the rest of the lab:
// no accounts, nothing uploaded, nothing shared unless the learner presses Copy, Print or Download. Drafts are saved so a
// reload resumes the mission and the portfolio can compare a draft with its revision; Start fresh (reset.js) clears the
// prefix with everything else.
import { safeJson, storage } from "../util.js";

export const QUEST_KEY = "accessPracticeLab:v1:quest";
export const QUEST_VERSION = 1;
const blank = () => ({ v: QUEST_VERSION, look: 0, rung: "", runs: {}, prog: {}, interests: [], teacher: {}, picks: [], reflections: {}, creations: [] });

export function loadQuest() {
  const saved = safeJson(storage.get(QUEST_KEY), null);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return blank();
  return { ...blank(), ...saved, runs: saved.runs || {}, prog: saved.prog || {}, picks: Array.isArray(saved.picks) ? saved.picks : [], creations: Array.isArray(saved.creations) ? saved.creations : [] };
}
export const saveQuest = (st) => (storage.set(QUEST_KEY, JSON.stringify(st)), st);

/** A mission's saved run, created on first open. `items` holds each item's own state. */
export function runFor(st, missionId, rung = "frame") {
  st.runs[missionId] ||= { started: new Date().toISOString(), stage: 0, rung, items: {}, flags: [], helpUsed: false, hints: 0, completed: "" };
  return st.runs[missionId];
}
export const itemState = (run, id) => (run.items[id] ||= {});

/**
 * Close a run into history. `prog[missionId].runs` keeps one small record per finished run (no text), which is all the
 * pathway reads. The run itself stays so the portfolio can show drafts. A replay starts a fresh run.
 */
export function finishRun(st, mission, run, { requiredMet = true } = {}) {
  const revised = Object.values(run.items).some((s) => (s.versions?.length || 0) > 1);
  const rec = { fn: mission.functions, rung: run.rung, help: Boolean(run.helpUsed), hints: run.hints || 0, revised, requiredMet, at: new Date().toISOString() };
  const p = (st.prog[mission.id] ||= { runs: [] });
  p.runs.push(rec);
  p.runs = p.runs.slice(-8);
  run.completed = rec.at;
  return rec;
}
/** Start a replay: the old run is archived under `<id>#<n>` so the portfolio keeps it. */
export function archiveRun(st, missionId) {
  const run = st.runs[missionId];
  if (!run) return;
  const n = Object.keys(st.runs).filter((k) => k.startsWith(`${missionId}#`)).length + 1;
  st.runs[`${missionId}#${n}`] = run;
  delete st.runs[missionId];
}
/** Per-function history for the fading rule, newest last. */
export function historyFor(st, missions, fn) {
  return missions
    .filter((m) => m.functions.includes(fn))
    .flatMap((m) => (st.prog[m.id]?.runs || []).map((r) => r))
    .sort((a, b) => (a.at || "").localeCompare(b.at || ""));
}
