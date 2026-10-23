// Studio state: everything a learner makes in the Speaking Studio, Writing Studio, Missions and
// Error Detective that is not already an activity record. One device-local JSON document, merged
// (never overwritten) when a backup is imported. Stores the learner's own words and structured
// choices; audio itself never lands here (see audio-store.js).
import { safeJson, storage } from "../util.js";

export const STUDIO_KEY = "accessPracticeLab:v1:studio";
const MAX_VERSIONS = 12;
const MAX_TAKES = 6;

const empty = () => ({
  v: 1,
  writing: {},
  speaking: {},
  missions: {},
  detective: {},
  portfolio: { picks: [] },
});

export function loadStudio(read = (k) => storage.get(k)) {
  const raw = safeJson(read(STUDIO_KEY), null);
  const base = empty();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    writing: raw.writing && typeof raw.writing === "object" ? raw.writing : {},
    speaking: raw.speaking && typeof raw.speaking === "object" ? raw.speaking : {},
    missions: raw.missions && typeof raw.missions === "object" ? raw.missions : {},
    detective: raw.detective && typeof raw.detective === "object" ? raw.detective : {},
    portfolio: { picks: Array.isArray(raw.portfolio?.picks) ? raw.portfolio.picks : [] },
  };
}
export function saveStudio(studio, write = (k, v) => storage.set(k, v)) {
  return write(STUDIO_KEY, JSON.stringify(studio));
}

const uid = (p = "v") => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// ── writing ───────────────────────────────────────────────────────────────────
export const writingState = (studio, taskId) =>
  (studio.writing[taskId] ||= {
    stage: "",
    organizer: {},
    versions: [],
    reflection: "",
    used: {},
    notes: "",
  });

/** Append a version unless the text is identical to the last one. kind: "draft" | "revision" | "final". */
export function addVersion(state, text, kind = "draft", meta = {}) {
  const last = state.versions.at(-1);
  if (last && last.text.trim() === String(text).trim()) return last;
  const v = { id: uid(), t: new Date().toISOString(), kind, text: String(text), ...meta };
  state.versions.push(v);
  if (state.versions.length > MAX_VERSIONS)
    state.versions.splice(1, state.versions.length - MAX_VERSIONS); // always keep the first draft
  return v;
}

// ── speaking ──────────────────────────────────────────────────────────────────
export const speakingState = (studio, taskId) =>
  (studio.speaking[taskId] ||= { stage: "", plan: {}, rehearsed: false, takes: [], used: {} });

/** Take metadata kept after reload (the audio lives in memory/IndexedDB; this is the evidence trail). */
export function addTake(state, take) {
  state.takes.push({
    id: take.id,
    t: new Date().toISOString(),
    seconds: take.seconds,
    audio: take.audio || null,
    transcript: "",
    selfReview: null,
    teacherReview: [],
    keptAudio: false,
    ...take.extra,
  });
  if (state.takes.length > MAX_TAKES) state.takes.splice(0, state.takes.length - MAX_TAKES);
  return state.takes.at(-1);
}

// ── missions ──────────────────────────────────────────────────────────────────
export const missionState = (studio, id) =>
  (studio.missions[id] ||= { started: "", decisions: {}, board: [], answers: {}, tasks: {}, unlocked: [], flags: [], done: false });

// ── detective ─────────────────────────────────────────────────────────────────
export const detectiveState = (studio, patternId) =>
  (studio.detective[patternId] ||= { seen: 0, fixedFirst: 0, helped: 0, transfer: [], lastT: "" });

// ── merge on import ───────────────────────────────────────────────────────────
const byId = (a = [], b = []) => {
  const seen = new Set(a.map((x) => x.id));
  return [...a, ...b.filter((x) => x?.id && !seen.has(x.id))];
};
/** Union of two studio documents. Local values win; items only in `incoming` are added. */
export function mergeStudio(local, incoming) {
  const out = loadStudio(() => JSON.stringify(local));
  const inc = loadStudio(() => JSON.stringify(incoming));
  for (const [id, w] of Object.entries(inc.writing)) {
    const l = out.writing[id];
    if (!l) out.writing[id] = w;
    else
      l.versions = byId(l.versions, w.versions).sort((x, y) =>
        String(x.t).localeCompare(String(y.t)),
      );
  }
  for (const [id, s] of Object.entries(inc.speaking)) {
    const l = out.speaking[id];
    if (!l) out.speaking[id] = s;
    else l.takes = byId(l.takes, s.takes);
  }
  for (const [id, m] of Object.entries(inc.missions)) out.missions[id] ||= m;
  for (const [id, d] of Object.entries(inc.detective)) {
    const l = out.detective[id];
    if (!l) out.detective[id] = d;
    else l.transfer = byId(l.transfer, d.transfer);
  }
  out.portfolio.picks = byId(out.portfolio.picks, inc.portfolio.picks);
  return out;
}

export function validStudio(doc) {
  return (
    Boolean(doc) &&
    typeof doc === "object" &&
    !Array.isArray(doc) &&
    ["writing", "speaking", "missions", "detective"].every(
      (k) => doc[k] === undefined || (typeof doc[k] === "object" && !Array.isArray(doc[k])),
    )
  );
}

/** What the learner's mission decisions add to an inline speaking/writing task (see byFlag in STUDIO-CONTENT.md). */
export function choiceEffects(task, mission, studio) {
  const out = { promptAdd: [], hints: {}, revise: [] };
  if (!mission || !task.byFlag) return out;
  for (const flag of missionState(studio, mission.id).flags) {
    const e = task.byFlag[flag];
    if (!e) continue;
    if (e.promptAdd) out.promptAdd.push(e.promptAdd);
    Object.assign(out.hints, e.plannerHint || {});
    if (e.revisionPrompt) out.revise.push(e.revisionPrompt);
  }
  return out;
}
