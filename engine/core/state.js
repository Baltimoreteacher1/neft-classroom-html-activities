const STORAGE_PREFIX = "rma_";

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

export function findSavedStudents(lessonId) {
  const prefix = `${STORAGE_PREFIX}${lessonId}_`;
  const students = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(prefix)) {
      try {
        const saved = JSON.parse(localStorage.getItem(k));
        if (saved.studentName) {
          const phaseDone = (saved.phases || []).filter(
            (p) => p.status === "completed",
          ).length;
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
    phases: [],
    responses: {},
    startedAt: null,
    lastSavedAt: null,
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        return { ...defaults, ...saved };
      }
    } catch (_) {
      /* ignore corrupt storage */
    }
    return { ...defaults, startedAt: Date.now() };
  }

  function save() {
    state.lastSavedAt = Date.now();
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (_) {
      /* storage full — silent fail */
    }
  }

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function initPhases(phaseConfigs) {
    if (state.phases.length === phaseConfigs.length) return;
    state.phases = phaseConfigs.map((cfg, i) => ({
      id: i,
      name: cfg.name,
      icon: cfg.icon,
      status: i === 0 ? "active" : "locked",
      stars: 0,
      xpEarned: 0,
      attempts: 0,
      correct: 0,
    }));
    save();
    notify();
  }

  return {
    get: () => state,

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
      if (!phase || phase.status === "locked") return;
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

      const next = state.phases[index + 1];
      if (next && next.status === "locked") next.status = "active";

      save();
      notify();
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

    reset() {
      localStorage.removeItem(key);
      state = { ...defaults, startedAt: Date.now() };
      notify();
    },
  };
}
