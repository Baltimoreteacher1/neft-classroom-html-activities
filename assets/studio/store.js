/**
 * Practice Studio v2 — versioned saves, the event bus and the cross-lesson passport.
 *
 *   StudioStore.fresh()              a brand-new state object (schema v2)
 *   StudioStore.load(key)            read + migrate; a corrupt or blocked store only means a fresh start
 *   StudioStore.save(key, state)
 *   StudioStore.passport.*           one small record per lesson, shared by every studio and the finder page
 *   StudioBus.on(type, fn) / emit()  every answer, solve, section and completion — the hook later versions plug into
 *
 * Contract: docs/specs/practice-studio-v2.md section 8. Nothing here knows any mathematics.
 */
(() => {
  const W = /** @type {any} */ (window);
  const SCHEMA = 2;
  const PASSPORT_KEY = "neft_studio_passport_v1";

  /* ---- bus ------------------------------------------------------------------------------------ */
  /** @type {Record<string, Array<(d: any) => void>>} */
  const listeners = {};
  const _bus = (W.StudioBus = W.StudioBus || {
    on(/** @type {string} */ type, /** @type {(d: any) => void} */ fn) {
      (listeners[type] ||= []).push(fn);
    },
    emit(/** @type {string} */ type, /** @type {any} */ detail) {
      for (const fn of listeners[type] || [])
        try {
          fn(detail);
        } catch (e) {
          console.warn("StudioBus listener failed", type, e);
        }
      try {
        window.dispatchEvent(new CustomEvent(`studio:${type}`, { detail }));
      } catch (_e) {
        /* an old browser without CustomEvent still gets the in-page listeners */
      }
    },
  });

  /* ---- state ---------------------------------------------------------------------------------- */
  const store = (W.StudioStore = W.StudioStore || {});
  store.SCHEMA = SCHEMA;
  store.key = (/** @type {string} */ lesson, /** @type {string} */ mode) =>
    `neft_studio_${lesson}_${mode}_v${SCHEMA}`;

  store.fresh = () => ({
    v: SCHEMA,
    activeTab: 1,
    showEs: false,
    idx: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    solved1: {},
    solved2: {},
    solved3: {},
    solved4: {},
    solved5: {},
    play: {},
    picks: {},
    cells: {},
    notes: {},
    hints: {},
    seeds: {},
    solvedSeed: {},
    acts: {},
    sorts: {},
    matches: {},
    lines: {},
    ticks: {},
    calib: {},
    misses: {},
    missLog: [],
    rubric: {},
    stats: { tries: 0, first: 0, streak: 0, best: 0, reps: 0, hints: 0 },
  });

  /** Upgrade whatever is stored to the current shape without losing a child's progress. */
  store.migrate = (/** @type {any} */ raw) => {
    const base = store.fresh();
    if (!raw || typeof raw !== "object") return base;
    if (raw.v !== SCHEMA) return { ...base, showEs: !!raw.showEs };
    for (const k of Object.keys(base)) {
      const v = raw[k];
      if (v === undefined || v === null) continue;
      if (typeof v !== typeof (/** @type {any} */ (base)[k])) continue;
      /** @type {any} */ (base)[k] = v;
    }
    base.stats = { ...store.fresh().stats, ...(raw.stats || {}) };
    base.idx = { ...store.fresh().idx, ...(raw.idx || {}) };
    return base;
  };

  store.load = (/** @type {string} */ key) => {
    try {
      return store.migrate(JSON.parse(localStorage.getItem(key) || "null"));
    } catch (_e) {
      return store.fresh();
    }
  };
  store.save = (/** @type {string} */ key, /** @type {any} */ state) => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (_e) {
      /* progress stays in memory for this visit */
    }
  };
  store.clear = (/** @type {string} */ key) => {
    try {
      localStorage.removeItem(key);
    } catch (_e) {
      /* nothing stored to clear */
    }
  };

  /* ---- passport: lesson -> { p:[done,total], c:[done,total], g:0|1 } -------------------------- */
  const passport = (store.passport = {
    read() {
      try {
        const d = JSON.parse(localStorage.getItem(PASSPORT_KEY) || "null");
        if (d && d.v === 1 && d.lessons && typeof d.lessons === "object") return d;
      } catch (_e) {
        /* fall through to an empty passport */
      }
      return { v: 1, lessons: {} };
    },
    /** Record progress for one studio. `gold` is true once the Challenge boss tab is complete. */
    update(
      /** @type {string} */ lesson,
      /** @type {"practice"|"challenge"} */ mode,
      /** @type {number} */ done,
      /** @type {number} */ total,
      /** @type {boolean} */ gold,
    ) {
      const d = passport.read();
      const rec = (d.lessons[lesson] ||= { p: [0, 0], c: [0, 0], g: 0 });
      rec[mode === "practice" ? "p" : "c"] = [done, total];
      if (gold) rec.g = 1;
      try {
        localStorage.setItem(PASSPORT_KEY, JSON.stringify(d));
      } catch (_e) {
        /* the stamp is a convenience, never required */
      }
      return rec;
    },
    stamps() {
      const lessons = passport.read().lessons;
      let practice = 0;
      let challenge = 0;
      let gold = 0;
      for (const rec of Object.values(/** @type {Record<string, any>} */ (lessons))) {
        if (rec.p[1] && rec.p[0] >= rec.p[1]) practice++;
        if (rec.c[1] && rec.c[0] >= rec.c[1]) challenge++;
        if (rec.g) gold++;
      }
      return { practice, challenge, gold };
    },
  });
})();
