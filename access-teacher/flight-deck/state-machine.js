const initial = { mode: "plan", lessonId: "1-1", projector: false, timer: 0, timerRunning: false, scaffolds: { bilingual: false, frames: false, visual: false, timerOff: false }, diagnostic: 0, drawerOpen: false };
const safeRead = () => { try { return JSON.parse(localStorage.getItem("ewl-flight-deck-v1") || "null"); } catch { return null; } };
const safeWrite = (value) => { try { localStorage.setItem("ewl-flight-deck-v1", JSON.stringify(value)); } catch { /* storage can be blocked; state remains usable in memory */ } };
export function createPortalStateMachine(onChange) {
  const saved = safeRead(); let state = { ...initial, ...(saved && typeof saved === "object" ? saved : {}), scaffolds: { ...initial.scaffolds, ...(saved?.scaffolds || {}) } };
  let timerHandle = null;
  const publish = () => { safeWrite(state); onChange({ ...state, scaffolds: { ...state.scaffolds } }); };
  const set = (patch) => { state = { ...state, ...patch }; publish(); };
  const actions = {
    mode(mode) { if (["plan", "live", "triage"].includes(mode)) set({ mode }); },
    lesson(id) { if (typeof id === "string") set({ lessonId: id }); },
    projector(value = !state.projector) { set({ projector: Boolean(value) }); },
    scaffold(key, value) { if (key in state.scaffolds) set({ scaffolds: { ...state.scaffolds, [key]: Boolean(value) } }); },
    diagnostic(index) { set({ diagnostic: Math.max(0, Math.min(2, Number(index) || 0)) }); },
    timerStart(minutes = 10) { clearInterval(timerHandle); const seconds = Math.max(1, Number(minutes) || 10) * 60; set({ timer: seconds, timerRunning: true }); timerHandle = setInterval(() => { if (state.timer <= 1) { clearInterval(timerHandle); timerHandle = null; set({ timer: 0, timerRunning: false }); } else { state = { ...state, timer: state.timer - 1 }; publish(); } }, 1000); },
    timerStop() { clearInterval(timerHandle); timerHandle = null; set({ timer: 0, timerRunning: false }); },
    drawer(value) { set({ drawerOpen: Boolean(value) }); },
    snapshot() { return { ...state, scaffolds: { ...state.scaffolds } }; },
  };
  publish(); return Object.freeze(actions);
}
export const PortalStateMachine = Object.freeze({ create: createPortalStateMachine });
export const TeacherPortalController = Object.freeze({ create: createPortalStateMachine });
