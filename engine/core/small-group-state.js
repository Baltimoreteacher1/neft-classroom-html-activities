// small-group-state.js — device-local persistence for a small-group studio
// session. Complements (never replaces) the shared nsr save/resume engine:
// nsr snapshots raw form fields; this store keeps the studio's *structural*
// state — readiness pulses, solved practice items, completed phases, proof
// path — so a student who reloads mid-studio lands where they left off.
// Privacy: everything stays in localStorage on this device; nothing is sent.

const PREFIX = "nt-sg:";

export function createStudioStore(lessonId) {
  const key = `${PREFIX}${lessonId || "lesson"}`;
  let data = {};
  try {
    data = JSON.parse(window.localStorage.getItem(key)) || {};
  } catch {
    data = {};
  }
  const hadData = Object.keys(data).length > 0;
  let timer = 0;
  let dirty = false;
  const write = () => {
    window.clearTimeout(timer);
    if (!dirty) return;
    dirty = false;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      /* storage full/blocked — the studio still works, it just won't resume */
    }
  };
  const persist = () => {
    dirty = true;
    window.clearTimeout(timer);
    timer = window.setTimeout(write, 200);
  };
  // The 200 ms debounce is for typing; a reload or tab close inside that window must not
  // lose the last answer, so the pending write is flushed when the page is hidden.
  window.addEventListener("pagehide", write);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") write();
  });
  return {
    get(name, fallback) {
      return data[name] === undefined ? fallback : data[name];
    },
    set(name, value) {
      data[name] = value;
      persist();
    },
    addTo(name, value) {
      const list = Array.isArray(data[name]) ? data[name] : [];
      if (!list.includes(value)) {
        data[name] = [...list, value];
        persist();
      }
    },
    has(name, value) {
      return Array.isArray(data[name]) && data[name].includes(value);
    },
    isReturning() {
      return hadData;
    },
    clear() {
      data = {};
      dirty = false;
      window.clearTimeout(timer);
      try {
        window.localStorage.removeItem(key);
      } catch {}
    },
  };
}

export default createStudioStore;
