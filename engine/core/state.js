const STORAGE_PREFIX = "rma_";

// PRIVACY: Student progress is local-first only. Remote sync was removed because
// it silently sent children's real names + free-text responses to an
// unauthenticated, legacy endpoint with no consent. Work persists in
// localStorage (see save()/load()). These functions are kept as no-ops so
// existing callers keep working; reintroduce sync only behind explicit opt-in,
// a pseudonymous id, auth, and a first-party, owned endpoint.
export async function loadFromServer(_lessonId, _studentName) {
  return null;
}

export function syncToServer(lessonId, state, _studentName, _studentPeriod) {
  if (typeof globalThis === "undefined" || !globalThis.CurriculumProgressBridge) return;
  const bridge = globalThis.CurriculumProgressBridge;
  if (!bridge.canSync || !bridge.canSync()) return;
  const phases = state.phases || [];
  const done = phases.filter((p) => p.status === "completed").length;
  const total = phases.length || 1;
  const allDone = done === total && total > 0;
  bridge.syncToggle(lessonId, `/lessons/${lessonId}/`, allDone);
  if (allDone) {
    bridge.syncToggle(lessonId, `lesson:${lessonId}:complete`, true);
  }
}

export function normalizeStudentId(name) {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function buildStorageKey(lessonId, studentId) {
  if (studentId) return `${STORAGE_PREFIX}${lessonId}_${studentId}`;
  return `${STORAGE_PREFIX}${lessonId}`;
}

// Remove every saved-state key for a lesson on this device — the base key AND
// all per-student variants (`rma_<lessonId>` and `rma_<lessonId>_<studentId>`).
// Powers the teacher-only "Clear answers" control: a teacher can reset a lesson
// to blank between class periods (wiping last period's saved work) without
// signing in as a student. state.js owns the key format, so the wipe lives here.
export function clearLessonStorage(lessonId) {
  if (!lessonId) return;
  const base = `${STORAGE_PREFIX}${lessonId}`;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k === base || (k && k.startsWith(`${base}_`))) localStorage.removeItem(k);
    }
  } catch (_) {
    /* storage blocked — a reload still clears in-memory answers */
  }
}

export function findSavedStudents(lessonId) {
  const prefix = `${STORAGE_PREFIX}${lessonId}_`;
  const students = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(prefix)) {
      try {
        const saved = JSON.parse(localStorage.getItem(k));
        if (saved.studentName) {
          const phaseDone = (saved.phases || []).filter((p) => p.status === "completed").length;
          students.push({
            name: saved.studentName,
            period: saved.studentPeriod || "",
            id: k.slice(prefix.length),
            phasesCompleted: phaseDone,
            lastSaved: saved.lastSavedAt,
          });
        }
      } catch (_) {}
    }
  }
  return students.sort((a, b) => (b.lastSaved || 0) - (a.lastSaved || 0));
}

export function createState(lessonId, studentId) {
  const key = buildStorageKey(lessonId, studentId);
  const listeners = new Set();

  const defaults = {
    studentName: "",
    studentPeriod: "",
    currentPhase: 0,
    xp: 0,
    maxXp: 200,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    coins: 0,
    hintsUsed: 0,
    badges: [],
    phases: [],
    responses: {},
    misconceptions: {},
    startedAt: null,
    lastSavedAt: null,
  };

  let state = load();
  let lastServerSync = 0;
  let serverSyncTimer = null;

  function scheduleServerSync() {
    if (!state.studentName) return;
    const now = Date.now();
    const elapsed = now - lastServerSync;
    const delay = Math.max(0, 30000 - elapsed);
    if (serverSyncTimer) return;
    serverSyncTimer = setTimeout(() => {
      serverSyncTimer = null;
      lastServerSync = Date.now();
      syncToServer(lessonId, state, state.studentName, state.studentPeriod);
    }, delay);
  }

  function load() {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        return migrateVocabPhaseRemoval({ ...defaults, ...saved });
      }
    } catch (_) {
      /* ignore corrupt storage */
    }
    return { ...defaults, startedAt: Date.now() };
  }

  // One-time migration: the graded "Vocabulary" phase (old index 1) was removed
  // (vocabulary now lives only in the Vocab tab). Only migrate if a phase named
  // "Vocabulary" is explicitly in the saved phases array.
  function migrateVocabPhaseRemoval(s) {
    if (!Array.isArray(s.phases)) return s;
    const vocabIdx = s.phases.findIndex((p) => p && (p.name === "Vocabulary" || p.name === "Vocabulario"));
    if (vocabIdx === -1) return s;

    s.phases = s.phases.filter((_, i) => i !== vocabIdx).map((p, i) => ({ ...p, id: i }));
    const remapped = {};
    for (const k in s.responses || {}) {
      const m = /^(\d+)_([\s\S]*)$/.exec(k);
      if (!m) {
        remapped[k] = s.responses[k];
        continue;
      }
      let p = Number(m[1]);
      if (p === vocabIdx) continue;
      if (p > vocabIdx) p -= 1;
      remapped[`${p}_${m[2]}`] = s.responses[k];
    }
    s.responses = remapped;
    if (typeof s.currentPhase === "number" && s.currentPhase > vocabIdx) {
      s.currentPhase -= 1;
    }
    return s;
  }

  function save() {
    state.lastSavedAt = Date.now();
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (_) {
      /* storage full — silent fail */
    }
    scheduleServerSync();
  }

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function initPhases(phaseConfigs) {
    const isCorruptOrOld =
      !Array.isArray(state.phases) ||
      state.phases.length !== phaseConfigs.length ||
      state.phases.some((p, i) => !p || p.name !== phaseConfigs[i].name);

    if (isCorruptOrOld) {
      state.phases = phaseConfigs.map((cfg, i) => ({
        id: i,
        name: cfg.name,
        icon: cfg.icon,
        status: i === 0 ? "active" : "available",
        stars: 0,
        xpEarned: 0,
        attempts: 0,
        correct: 0,
      }));
      save();
      notify();
    }
  }

  return {
    get: () => state,

    async hydrateFromServer() {
      const name = state.studentName;
      if (!name) return false;
      const remote = await loadFromServer(lessonId, name);
      if (!remote) return false;
      const remoteSaved = remote.savedAt || remote.lastSavedAt || 0;
      const localSaved = state.lastSavedAt || 0;
      if (remoteSaved > localSaved) {
        state = { ...defaults, ...remote };
        try {
          localStorage.setItem(key, JSON.stringify(state));
        } catch (_) {
          /* storage full — silent fail */
        }
        notify();
        return true;
      }
      return false;
    },

    set(patch) {
      Object.assign(state, patch);
      save();
      notify();
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    initPhases,

    setPhase(index) {
      const phase = state.phases[index];
      if (!phase) return;
      state.currentPhase = index;
      if (phase.status !== "completed") phase.status = "active";
      save();
      notify();
    },

    completePhase(index, { correct, total, xp }) {
      const phase = state.phases[index];
      if (!phase) return;
      phase.status = "completed";
      phase.correct = correct;
      phase.attempts = total;
      phase.xpEarned = xp;

      const pct = total > 0 ? correct / total : 1;
      phase.stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;

      state.xp = state.phases.reduce((sum, p) => sum + p.xpEarned, 0);

      save();
      notify();
    },

    // Mark a non-graded phase complete without manufacturing a score. Warmup,
    // Objectives, and the final goal review use this before their Continue or
    // Finish action; the renderer has long called this API, but the state store
    // did not expose it, so those buttons threw and never advanced.
    markCompleted(index) {
      const phase = state.phases[index];
      if (!phase) return false;
      phase.status = "completed";
      save();
      notify();
      return true;
    },

    saveResponse(phaseId, questionId, value) {
      const rKey = `${phaseId}_${questionId}`;
      state.responses[rKey] = value;
      save();
    },

    getResponse(phaseId, questionId) {
      return state.responses[`${phaseId}_${questionId}`] ?? null;
    },

    recordAnswer(isCorrect) {
      state.totalAttempts++;
      if (isCorrect) {
        state.totalCorrect++;
        state.streak++;
        if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      } else {
        state.streak = 0;
      }
      save();
      notify();
    },

    awardCoin(count = 1) {
      state.coins = (state.coins || 0) + count;
      save();
      notify();
    },

    recordHintUsed() {
      state.hintsUsed = (state.hintsUsed || 0) + 1;
      save();
      notify();
    },

    // Per-lesson misconception counts, keyed by the authored tag. Persists with
    // the rest of the lesson state so the stuck-support "Fix the mix-up" chip
    // and teacher mode can see what this student keeps tripping on.
    recordMisconception(tag) {
      if (!tag) return;
      if (!state.misconceptions) state.misconceptions = {};
      state.misconceptions[tag] = (state.misconceptions[tag] || 0) + 1;
      save();
      notify();
    },

    awardPhaseParticipation(phaseIndex, amount = 2) {
      state.coins = (state.coins || 0) + amount;
      const phase = state.phases[phaseIndex];
      if (phase) phase.participationCoins = (phase.participationCoins || 0) + amount;
      save();
      notify();
    },

    reset() {
      localStorage.removeItem(key);
      state = { ...defaults, startedAt: Date.now() };
      notify();
    },

    // Clear only ONE page (phase) worth of answers on this device — used by the
    // teacher "Clear answers" control so a projector can be reset page-by-page
    // instead of wiping the whole lesson. Removes every response keyed to this
    // phase (`${phaseIndex}_…`) and zeroes that phase's answer-driven progress
    // (stars / earned XP / attempts) while leaving other pages, coins, streaks,
    // and the student identity untouched. Caller re-renders the phase to blank
    // the on-screen inputs (no reload, so Save/Resume can't re-fill it).
    clearPhaseResponses(phaseIndex) {
      const prefix = `${phaseIndex}_`;
      for (const rk of Object.keys(state.responses || {})) {
        if (rk.startsWith(prefix)) delete state.responses[rk];
      }
      const ph = state.phases[phaseIndex];
      if (ph) {
        state.xp = Math.max(0, (state.xp || 0) - (ph.xpEarned || 0));
        ph.xpEarned = 0;
        ph.stars = 0;
        ph.attempts = 0;
        ph.correct = 0;
      }
      save();
      notify();
    },
  };
}
