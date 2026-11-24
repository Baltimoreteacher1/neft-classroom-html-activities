/* Forecast Engine — state, saving, profiles and lesson-grade sync.
 * One state object, one save key (existing classes keep loading), and a
 * one-step undo for anything destructive. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { S, M } = NFE;

  const STORAGE_KEY = "nfe_gold_state_v5";
  const PROFILE_PREFIX = "nfe_profile_";
  const LESSON_GRADEBOOK_KEY = "rma_gradebook";

  const SETTINGS = {
    ...M.DEFAULTS,
    groupCap: 5,
    minutes: 15,
    sessions: 3,
    weeklyMinutes: 90,
  };
  const SCENARIO = {
    standard: "all",
    weeks: 4,
    gain: 6,
    scope: "below",
    participation: 90,
    goal: 80,
    seed: 2026,
  };

  const today = () => new Date().toISOString().slice(0, 10);
  const bound = (v) => S.clamp(Math.round(Number.isFinite(Number(v)) ? Number(v) : 0), 0, 100);

  function makeEvidence(student, standard, score, max, date, assessment, syncKey) {
    const sc = Number(score);
    const mx = Number(max);
    const ok = Number.isFinite(sc) && Number.isFinite(mx) && mx > 0;
    const row = {
      id: `e_${Math.random().toString(36).slice(2, 10)}`,
      student,
      standard,
      score: ok ? sc : 0,
      max: ok ? mx : 100,
      pct: ok ? Math.round(S.clamp((sc / mx) * 100, 0, 100) * 10) / 10 : 0,
      date: date || today(),
      assessment: assessment || "Evidence",
    };
    if (syncKey) row.syncKey = String(syncKey);
    return row;
  }

  /** A believable 14-student sample class, built from a fixed seed. */
  function sampleState() {
    const rng = S.mulberry32(6);
    const names = [
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
      "Echo",
      "Foxtrot",
      "Golf",
      "Hotel",
      "India",
      "Juliet",
      "Kilo",
      "Lima",
      "Mike",
      "November",
    ];
    const tags = {
      Bravo: "IEP",
      Delta: "Newcomer",
      Foxtrot: "ML",
      Hotel: "ML",
      Kilo: "IEP",
      Mike: "ML",
    };
    const standards = [
      ["6.GR.A.1", "Find area of polygons", 0],
      ["6.GR.A.2", "Find volume of rectangular prisms", -4],
      ["6.GR.A.4", "Use nets and surface area", -8],
      ["6.DS.A.1", "Recognize statistical questions", 5],
    ];
    const weeks = [
      "2026-10-06",
      "2026-10-13",
      "2026-10-20",
      "2026-10-27",
      "2026-11-03",
      "2026-11-10",
    ];
    const students = names.map((n, i) => ({
      id: `S${String(i + 1).padStart(3, "0")}`,
      name: `Student ${n}`,
      tags: tags[n] || "",
    }));
    const evidence = [];
    students.forEach((st, i) => {
      const ability = 52 + ((i * 37) % 42);
      const growth = -0.4 + ((i * 53) % 50) / 16;
      standards.forEach(([code, , offset], si) => {
        const count = 3 + ((i + si) % 4);
        for (let k = 0; k < count; k += 1) {
          const wk = weeks.length - count + k;
          const pct = S.clamp(ability + offset + growth * wk + S.randNormal(rng) * 5.5, 12, 100);
          const max = [20, 25, 10, 20][(si + k) % 4];
          evidence.push(
            makeEvidence(
              st.id,
              code,
              Math.round((pct / 100) * max),
              max,
              weeks[wk],
              ["Exit Ticket", "Quiz", "Check-in", "Warm-up"][(si + k) % 4],
            ),
          );
        }
      });
    });
    return {
      class: { id: "C1", name: "Sample class · Period 1 Math", grade: "Grade 6" },
      students,
      standards: standards.map(([code, desc]) => ({ code, desc })),
      evidence,
      sample: true,
    };
  }

  function baseState() {
    return {
      active: "overview",
      theme: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      profile: "Default",
      class: { id: "C1", name: "My class", grade: "" },
      students: [],
      standards: [],
      evidence: [],
      settings: { ...SETTINGS },
      scn: { ...SCENARIO },
      scenarios: [],
      groupNames: {},
      groupMoves: {},
      sample: false,
      updatedAt: new Date().toISOString(),
    };
  }
  const seedState = () => ({ ...baseState(), ...sampleState() });
  const emptyState = () => baseState();

  const num = (v, fallback, lo, hi) =>
    Number.isFinite(Number(v)) && Number(v) >= lo && Number(v) <= hi ? Number(v) : fallback;

  function normalize(raw) {
    const input = raw && typeof raw === "object" ? raw : {};
    const base = baseState();
    const legacyTarget = input.threshold;
    const s = { ...SETTINGS, ...(input.settings || {}) };
    if (legacyTarget !== undefined && !input.settings) s.target = legacyTarget;
    const settings = {
      method: ["smart", "average", "recent", "trend"].includes(s.method)
        ? s.method
        : SETTINGS.method,
      halfLife: num(s.halfLife, SETTINGS.halfLife, 3, 120),
      level: [0.8, 0.9, 0.95].includes(Number(s.level)) ? Number(s.level) : SETTINGS.level,
      horizon: num(s.horizon, SETTINGS.horizon, 0, 84),
      borrow: [0, 0.5, 1].includes(Number(s.borrow)) ? Number(s.borrow) : SETTINGS.borrow,
      target: num(s.target, SETTINGS.target, 40, 95),
      groupCap: num(s.groupCap, SETTINGS.groupCap, 2, 10),
      minutes: num(s.minutes, SETTINGS.minutes, 5, 60),
      sessions: num(s.sessions, SETTINGS.sessions, 1, 5),
      weeklyMinutes: num(s.weeklyMinutes, SETTINGS.weeklyMinutes, 15, 400),
    };
    const c = { ...SCENARIO, ...(input.scn || {}) };
    const scn = {
      standard: String(c.standard || "all"),
      weeks: num(c.weeks, SCENARIO.weeks, 1, 12),
      gain: num(c.gain, SCENARIO.gain, 0, 25),
      scope: ["below", "near", "all"].includes(c.scope) ? c.scope : SCENARIO.scope,
      participation: num(c.participation, SCENARIO.participation, 40, 100),
      goal: num(c.goal, SCENARIO.goal, 40, 100),
      seed: num(c.seed, SCENARIO.seed, 1, 999999),
    };
    return {
      ...base,
      ...input,
      threshold: undefined,
      settings,
      scn,
      class: { ...base.class, ...(input.class || {}) },
      students: (Array.isArray(input.students) ? input.students : []).map((x) => ({
        id: String(x.id || "").trim(),
        name: String(x.name || x.id || "Unnamed student").trim(),
        tags: String(x.tags || "").trim(),
      })),
      standards: (Array.isArray(input.standards) ? input.standards : []).map((x) => ({
        code: String(x.code || "").trim(),
        desc: String(x.desc || "Imported standard").trim(),
      })),
      evidence: (Array.isArray(input.evidence) ? input.evidence : []).map((r) => {
        const row = makeEvidence(
          r.student,
          r.standard,
          Number(r.score),
          Number(r.max),
          r.date,
          r.assessment,
          r.syncKey,
        );
        if (r.id) row.id = String(r.id);
        return row;
      }),
      scenarios: Array.isArray(input.scenarios) ? input.scenarios.slice(0, 4) : [],
      groupNames: input.groupNames && typeof input.groupNames === "object" ? input.groupNames : {},
      groupMoves: input.groupMoves && typeof input.groupMoves === "object" ? input.groupMoves : {},
      sample: Boolean(input.sample),
    };
  }

  /* ── The store ──────────────────────────────────────────────────────── */
  const listeners = new Set();
  const store = (NFE.store = {
    state: null,
    rev: 0,
    undoSnapshot: null,
    makeEvidence,
    normalizeState: normalize,
    today,
    bound,
    on: (fn) => listeners.add(fn),
    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        store.state = raw ? normalize(raw) : seedState();
      } catch (_) {
        store.state = seedState();
      }
      return store.state;
    },
    /** Apply a change, remember how to undo it, save, and tell the views. */
    mutate(fn, { undoable = false } = {}) {
      if (undoable) store.undoSnapshot = JSON.stringify(store.state);
      fn(store.state);
      store.changed();
    },
    /** Change data without redrawing the open view (typing in a table cell). */
    quiet(fn) {
      fn(store.state);
      store.rev += 1;
      store.save();
    },
    changed() {
      store.rev += 1;
      store.save();
      listeners.forEach((fn) => fn());
    },
    undo() {
      if (!store.undoSnapshot) return false;
      store.state = normalize(JSON.parse(store.undoSnapshot));
      store.undoSnapshot = null;
      store.changed();
      return true;
    },
    save: (() => {
      let timer = 0;
      return () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            store.state.updatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
            document.dispatchEvent(new CustomEvent("nfe:saved", { detail: { ok: true } }));
          } catch (_) {
            document.dispatchEvent(new CustomEvent("nfe:saved", { detail: { ok: false } }));
          }
        }, 150);
      };
    })(),
    /** Quiet save for UI-only changes (tab, theme): no view refresh. */
    touch() {
      store.save();
    },
    loadSample() {
      store.mutate(
        (s) => {
          const next = seedState();
          Object.assign(s, { ...next, theme: s.theme, profile: s.profile, active: s.active });
        },
        { undoable: true },
      );
    },
    /** Remove sample data (or everything) and keep the settings. */
    startFresh() {
      store.mutate(
        (s) => {
          const keep = {
            theme: s.theme,
            profile: s.profile,
            settings: s.settings,
            active: s.active,
          };
          Object.assign(s, emptyState(), keep);
        },
        { undoable: true },
      );
    },
    /** A teacher's first real data replaces the sample class instead of mixing in. */
    leaveSample() {
      if (!store.state.sample) return false;
      const keep = {
        theme: store.state.theme,
        profile: store.state.profile,
        settings: store.state.settings,
        active: store.state.active,
      };
      Object.assign(store.state, emptyState(), keep);
      return true;
    },
    /* Profiles */
    profiles: () =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PROFILE_PREFIX))
        .map((k) => k.slice(PROFILE_PREFIX.length))
        .sort(),
    saveProfile(name) {
      localStorage.setItem(PROFILE_PREFIX + name, JSON.stringify(store.state));
      store.state.profile = name;
      store.changed();
    },
    loadProfile(name) {
      const raw = localStorage.getItem(PROFILE_PREFIX + name);
      if (!raw) return false;
      store.undoSnapshot = JSON.stringify(store.state);
      store.state = normalize(JSON.parse(raw));
      store.state.profile = name;
      store.changed();
      return true;
    },
    deleteProfile: (name) => localStorage.removeItem(PROFILE_PREFIX + name),
    /* Lookups */
    student: (id) => store.state.students.find((s) => s.id === id) || null,
    studentName: (id) => store.student(id)?.name || id,
    resetSettings() {
      store.mutate((s) => {
        s.settings = { ...SETTINGS };
        s.scn = { ...SCENARIO };
      });
    },
  });

  /* ── Lesson-grade sync (rma_gradebook, read-only) ───────────────────── */
  function readGradebook() {
    try {
      const arr = JSON.parse(localStorage.getItem(LESSON_GRADEBOOK_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }
  function lessonStudentId(r) {
    const seed =
      `${String(r.studentName || "").trim()}|${String(r.studentPeriod || "").trim()}`.toLowerCase();
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return `L_${h.toString(36)}`;
  }
  /** Merge completed lesson results into the evidence; returns how many rows changed. */
  store.syncLessons = () => {
    const book = readGradebook();
    const s = store.state;
    const usable = (r) => r && r.studentName && r.standard && r.lessonId;
    if (s.sample && book.some(usable)) store.leaveSample();
    let n = 0;
    book.forEach((r) => {
      if (!r || typeof r !== "object") return;
      const name = String(r.studentName || "").trim();
      const standard = String(r.standard || "").trim();
      const lessonId = String(r.lessonId || "").trim();
      if (!name || !standard || !lessonId) return;
      const attempts = Number(r.attempts);
      const has = Number.isFinite(attempts) && attempts > 0;
      const score = has
        ? Number.isFinite(Number(r.correct))
          ? Number(r.correct)
          : 0
        : Number.isFinite(Number(r.pct))
          ? Number(r.pct)
          : 0;
      const syncKey = `${name.toLowerCase()}||${lessonId}`;
      const id = lessonStudentId(r);
      let student =
        s.students.find((x) => x.id === id) ||
        s.students.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!student) {
        student = { id, name, tags: "" };
        s.students.push(student);
      }
      if (!s.standards.some((x) => x.code === standard))
        s.standards.push({ code: standard, desc: "Synced from lesson" });
      const row = makeEvidence(
        student.id,
        standard,
        score,
        has ? attempts : 100,
        String(r.date || "").trim() || today(),
        String(r.lessonTitle || lessonId),
        syncKey,
      );
      const idx = s.evidence.findIndex((e) => e.syncKey === syncKey);
      if (idx >= 0) {
        row.id = s.evidence[idx].id;
        s.evidence[idx] = row;
      } else s.evidence.push(row);
      n += 1;
    });
    return n;
  };
})();
