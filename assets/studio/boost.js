/**
 * Daily Boost wiring (window.StudioBoost): remembers, per device, how well each generated skill is known, and builds
 * today's mixed review from that memory (see boost-core.js). Loaded on every studio page:
 *
 *   - on a lesson studio it listens for answers and updates the Leitner box of the skill that was answered;
 *   - on the Boost page (the one with #boost-catalog) it rewrites the studio's data before the runtime reads it, so
 *     the five sections hold today's ten skills, saved for the day so a reload shows the same set.
 *
 * Nothing leaves the device. Contract: docs/specs/studio-enhancements.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const Core = W.StudioBoostCore;
  if (!Core) return;
  const KEY = "ewl_boost_v1";
  const today = () => Core.ymd(new Date());

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && raw.v === 1 && typeof raw.skills === "object") return raw;
    } catch (_e) {
      /* storage blocked or damaged: start clean */
    }
    return { v: 1, skills: {}, days: [], today: null };
  }
  function save(/** @type {any} */ store) {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (_e) {
      /* storage blocked: the Boost still runs, it just will not remember */
    }
  }
  const seeded = (/** @type {string} */ text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  };

  /* ---- every studio: learn from each answer ---------------------------------------------------------- */
  const bus = W.StudioBus;
  if (bus?.on) {
    bus.on("answer", (/** @type {any} */ e) => {
      if (!e.ok || !e.gen) return;
      const store = load();
      Core.record(store, e.gen, (e.tries || 1) === 1 && !(e.hints > 0), today(), e.lesson);
      save(store);
    });
    bus.on("complete", (/** @type {any} */ e) => {
      const banner = document.getElementById("complete-banner");
      const actions = banner?.querySelector(".banner-actions");
      if (e.lesson === "0-0") {
        const store = load();
        if (!store.days.includes(today())) store.days = [...store.days, today()].slice(-90);
        save(store);
        return;
      }
      if (actions && !actions.querySelector("[data-boost-link]")) {
        const a = document.createElement("a");
        a.className = "btn btn-sm";
        a.href = "/math/practice-studio/boost/";
        a.setAttribute("data-boost-link", "");
        a.textContent = "⚡ Keep it fresh: Daily Boost";
        actions.append(a);
      }
    });
  }

  /* ---- the Boost page: build today's set before the runtime reads the data ---------------------------- */
  const catNode = document.getElementById("boost-catalog");
  const dataNode = document.getElementById("studio-data");
  if (!catNode || !dataNode) return;
  const catalog = JSON.parse(catNode.textContent || "[]");
  const data = JSON.parse(dataNode.textContent || "{}");
  const store = load();
  const t = today();
  if (!store.today || store.today.date !== t) {
    let opened = [];
    try {
      opened = Object.entries(W.StudioStore.passport.read().lessons || {})
        .filter(([, v]) => /** @type {any} */ (v).p?.[0] > 0 || /** @type {any} */ (v).c?.[0] > 0)
        .map(([k]) => k);
    } catch (_e) {
      /* no passport yet */
    }
    const total = data.sections.reduce((a, /** @type {any} */ s) => a + s.items.length, 0);
    store.today = {
      date: t,
      items: Core.plan(store, catalog, t, seeded(`boost|${t}`), total, opened),
    };
    save(store);
  }
  const picks = store.today.items;
  let k = 0;
  for (const s of data.sections)
    s.items = s.items.map((/** @type {any} */ _spec) => {
      const p = picks[k % picks.length];
      k++;
      return {
        k: "gen",
        g: p.g,
        level: p.level,
        lab: W.StudioGen?.registry?.[p.g]?.title || p.title,
        id: `b${t.replace(/-/g, "")}_${k}`,
      };
    });
  data.storageKey = `neft_studio_boost_${t}_v2`;
  const prior = Core.streak(store.days || [], t);
  data.bannerText = `Boost complete! That is ${prior + (store.days.includes(t) ? 0 : 1)} ${prior + (store.days.includes(t) ? 0 : 1) === 1 ? "day" : "days"} in a row.`;
  data.bannerTextEs = "¡Refuerzo completo! Vuelve mañana para mantener tu racha.";
  dataNode.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
  const count = document.getElementById("header-progress-count");
  if (count) count.textContent = `0 / ${picks.length}`;
  W.StudioBoost = { today: store.today, streak: prior };
})();
