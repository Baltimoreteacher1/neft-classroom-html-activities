/**
 * Practice Studio chrome (window.EWLChrome): the status bar, the pathway choice, the theme choice, the activity state
 * machine, the structured logger and the boot self-test. Loaded BEFORE runtime.js so the pathway is known when the
 * runtime expands its first item.
 *
 *   EWLChrome.pathway      { id: 1|2|3, scaffold: boolean }   1 Foundational (practice, one level easier, a hint showing)
 *                                                              2 On-grade (the practice studio)  3 Challenge (the night twin)
 *   EWLChrome.state()      INIT | IDLE | MANIPULATING | VALIDATING | FEEDBACK_DIAGNOSTIC | TASK_COMPLETE | LESSON_MASTERED
 *   EWLChrome.validateConfig(data) -> string[]   problems with the page's lesson data; empty means sound
 *   EWLChrome.selfTest()   -> { ok, results[] }   run on boot (after the runtime mounts); failures show a calm notice
 *   EWLLogger              silent unless ?debug=true or Ctrl+Shift+D; then a live state and event inspector panel
 *
 * The settings record (pathway, theme, state, stats) lives under ewl_u{unit}_l{lesson}_v2. Lesson progress stays in the
 * studio's own save (neft_studio_<id>_<mode>_v2), so this record can be reset without touching progress and vice versa
 * ("Reset activity" clears both). Nothing here knows any mathematics.
 */
(() => {
  const W = /** @type {any} */ (window);
  const node = document.getElementById("studio-data");
  if (!node) return;

  /* ---- logger: silent in production --------------------------------------------------------------------------- */
  const Logger = (W.EWLLogger = {
    on: false,
    /** @type {Array<{t: number, level: string, msg: string, ctx?: any}>} */
    entries: [],
    log(/** @type {string} */ level, /** @type {string} */ msg, /** @type {any} */ ctx) {
      this.entries.push({ t: Date.now(), level, msg, ctx });
      if (this.entries.length > 200) this.entries.shift();
      if (this.on) {
        const fn =
          level === "error" ? console.error : level === "warn" ? console.warn : console.debug;
        fn(`[EWL] ${msg}`, ctx ?? "");
        panel.refresh();
      }
    },
    enable() {
      this.on = true;
      panel.show();
    },
    disable() {
      this.on = false;
      panel.hide();
    },
  });

  /* ---- config validation: fail fast with a clear reason --------------------------------------------------------- */
  const KINDS = ["mc", "num", "err", "tbl", "wr", "sort", "match", "nline", "gen", "pool", "act"];
  /** @param {any} d @returns {string[]} */
  function validateConfig(d) {
    /** @type {string[]} */
    const p = [];
    if (!d || typeof d !== "object") return ["the lesson data is missing"];
    if (!/^\d+-\d+$/.test(String(d.lesson))) p.push(`lesson id "${d.lesson}" is not unit-lesson`);
    if (d.mode !== "practice" && d.mode !== "challenge")
      p.push(`mode "${d.mode}" is not practice or challenge`);
    if (!Array.isArray(d.sections) || d.sections.length !== 5)
      p.push("the studio needs exactly 5 sections");
    else {
      const ids = new Set();
      d.sections.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
        if (!Array.isArray(s.items) || !s.items.length) p.push(`section ${i + 1} has no items`);
        for (const [j, it] of (s.items || []).entries()) {
          if (!KINDS.includes(it.k))
            p.push(`section ${i + 1} item ${j + 1}: unknown kind "${it.k}"`);
          const id = it.id || `t${i + 1}i${j + 1}`;
          if (ids.has(id)) p.push(`duplicate item id ${id}`);
          ids.add(id);
          if (it.k === "mc" && !(Number.isInteger(it.a) && it.c && it.a >= 0 && it.a < it.c.length))
            p.push(`section ${i + 1} item ${j + 1}: the answer index is outside the choices`);
          if (it.k === "gen" && !W.StudioGen?.registry?.[it.g])
            p.push(`section ${i + 1} item ${j + 1}: generator "${it.g}" is not registered`);
          if (it.k === "act" && !W.StudioAct?.registry?.[it.kind])
            p.push(`section ${i + 1} item ${j + 1}: activity "${it.kind}" is not registered`);
        }
      });
    }
    return p;
  }

  /** @type {any} */
  let data;
  try {
    data = JSON.parse(node.textContent || "{}");
  } catch (e) {
    Logger.log("error", "studio data does not parse", String(e));
    notice(
      "This activity could not load its lesson data. Reload the page; your saved work is untouched.",
    );
    return;
  }
  const [UNIT, LESSON_NO] = String(data.lesson).split("-");
  const REC_KEY = `ewl_u${UNIT}_l${LESSON_NO}_v2`;
  const params = new URLSearchParams(location.search);

  /* ---- the settings record (a small, validated store) ---------------------------------------------------------- */
  const fresh = () => ({
    v: 2,
    lesson: data.lesson,
    pathway: 2,
    theme: null,
    state: "IDLE",
    mastered: false,
    stats: { answered: 0, correct: 0, streak: 0, best: 0 },
    updated: 0,
  });
  /** @returns {any} */
  function readRec() {
    try {
      const r = JSON.parse(localStorage.getItem(REC_KEY) || "null");
      if (r && r.v === 2 && r.lesson === data.lesson && [1, 2, 3].includes(r.pathway))
        return { ...fresh(), ...r };
    } catch (_e) {
      /* fall through to a fresh record */
    }
    return fresh();
  }
  const rec = readRec();
  function writeRec() {
    rec.updated = Date.now();
    try {
      localStorage.setItem(REC_KEY, JSON.stringify(rec));
    } catch (_e) {
      /* settings are a convenience; the studio works without them */
    }
  }

  /* ---- pathway: known before the runtime starts ----------------------------------------------------------------- */
  const asked = Number(params.get("path"));
  const pathwayId =
    data.mode === "challenge" ? 3 : asked === 1 || asked === 2 ? asked : rec.pathway === 1 ? 1 : 2;
  const pathway = { id: pathwayId, scaffold: pathwayId === 1 };
  rec.pathway = pathwayId;

  /* ---- state machine -------------------------------------------------------------------------------------------- */
  const FLOW = {
    INIT: ["IDLE"],
    IDLE: ["MANIPULATING", "VALIDATING", "IDLE", "LESSON_MASTERED"],
    MANIPULATING: ["VALIDATING", "IDLE", "MANIPULATING"],
    VALIDATING: ["FEEDBACK_DIAGNOSTIC", "TASK_COMPLETE", "VALIDATING"],
    FEEDBACK_DIAGNOSTIC: ["MANIPULATING", "IDLE", "VALIDATING", "FEEDBACK_DIAGNOSTIC"],
    TASK_COMPLETE: ["IDLE", "LESSON_MASTERED"],
    LESSON_MASTERED: ["IDLE"],
  };
  let current = "INIT";
  function go(/** @type {string} */ to, /** @type {string} */ why) {
    if (to === current) return true;
    if (!FLOW[/** @type {keyof typeof FLOW} */ (current)]?.includes(to)) {
      Logger.log("warn", `ignored transition ${current} -> ${to}`, why);
      return false;
    }
    Logger.log("info", `${current} -> ${to}`, why);
    current = to;
    rec.state = to;
    if (to === "LESSON_MASTERED") rec.mastered = true;
    document.body.dataset.ewlState = to;
    writeRec();
    panel.refresh();
    return true;
  }

  /* ---- theme ---------------------------------------------------------------------------------------------------- */
  const THEMES = ["auto", "light", "dark"];
  const nativeTheme = data.mode === "challenge" ? "dark" : "light";
  const resolve = (/** @type {string|null} */ t) =>
    t === "light" || t === "dark"
      ? t
      : t === "auto"
        ? matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : nativeTheme;
  function applyTheme() {
    document.body.dataset.theme = resolve(rec.theme);
    const b = document.getElementById("ewl-theme-btn");
    if (b) {
      const label =
        rec.theme === "auto"
          ? "Auto"
          : rec.theme === "light"
            ? "Light"
            : rec.theme === "dark"
              ? "Dark"
              : resolve(null) === "dark"
                ? "Dark"
                : "Light";
      b.textContent = `◐ ${label}`;
      b.setAttribute("aria-label", `Theme: ${label}. Press to change.`);
    }
  }

  /* ---- status bar ------------------------------------------------------------------------------------------------ */
  const title = (document.querySelector(".brand-title")?.childNodes[0]?.textContent || "").trim();
  const PATHS = [
    { id: 1, name: "Foundational", es: "Fundamental" },
    { id: 2, name: "On-grade", es: "Del grado" },
    { id: 3, name: "Challenge", es: "Reto" },
  ];
  function buildBar() {
    const header = document.querySelector(".app-header");
    if (!header || document.getElementById("ewl-hud")) return;
    const bar = document.createElement("div");
    bar.id = "ewl-hud";
    bar.className = "ewl-hud";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Activity status");
    const esc = (/** @type {string} */ s) =>
      s.replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[/** @type {"&"} */ (c)],
      );
    bar.innerHTML = `
      <span class="ewl-hud-id"><strong>${data.lesson === "0-0" ? "Daily Boost" : `Lesson ${esc(data.lesson)}`}</strong><span class="ewl-hud-title"> · ${esc(title)}</span></span>
      <div class="ewl-hud-path" role="radiogroup" aria-label="Pathway">${PATHS.map(
        (p) =>
          `<button type="button" role="radio" class="ewl-hud-opt" data-path="${p.id}" aria-checked="${p.id === pathway.id}" tabindex="${p.id === pathway.id ? 0 : -1}">${p.name}<span class="es-text" lang="es">${p.es}</span></button>`,
      ).join("")}</div>
      <span class="ewl-hud-stat" id="ewl-acc" title="Right on the first try">Accuracy <strong>—</strong></span>
      <span class="ewl-hud-stat" id="ewl-streak" title="Right on the first try, in a row">Streak <strong>0</strong></span>
      <button type="button" class="ewl-hud-btn" id="ewl-theme-btn"></button>`;
    header.after(bar);
    document.body.classList.add("ewl-hud-on");
    const foot = document.querySelector(".footer-wrap");
    if (foot && !foot.querySelector(".ewl-brand")) {
      const b = document.createElement("span");
      b.className = "ewl-brand";
      b.textContent = "Neft · EduWonderLab";
      foot.append(b);
    }
    const choose = (/** @type {number} */ id) => {
      if (id === pathway.id) return;
      rec.pathway = id === 3 ? rec.pathway : id;
      writeRec();
      Logger.log("info", `pathway ${pathway.id} -> ${id}`);
      const practice = data.mode === "challenge" ? data.otherUrl : location.pathname;
      const challenge = data.mode === "challenge" ? location.pathname : data.otherUrl;
      location.assign(id === 3 ? challenge : `${practice}${id === 1 ? "?path=1" : "?path=2"}`);
    };
    const opts = [...bar.querySelectorAll(".ewl-hud-opt")];
    opts.forEach((b, i) => {
      b.addEventListener("click", () =>
        choose(Number(/** @type {HTMLElement} */ (b).dataset.path)),
      );
      b.addEventListener("keydown", (e) => {
        const ev = /** @type {KeyboardEvent} */ (e);
        const d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        ev.preventDefault();
        /** @type {HTMLElement} */ (opts[(i + d + opts.length) % opts.length]).focus();
      });
    });
    document.getElementById("ewl-theme-btn")?.addEventListener("click", () => {
      const at = THEMES.indexOf(rec.theme || (nativeTheme === "dark" ? "dark" : "light"));
      rec.theme = THEMES[(at + 1) % THEMES.length];
      writeRec();
      applyTheme();
    });
    applyTheme();
  }

  function refreshStats() {
    const s = W.StudioRT?.api?.state?.stats;
    if (!s) return;
    const acc = s.tries ? Math.round((100 * s.first) / s.tries) : null;
    rec.stats = {
      answered: s.tries || 0,
      correct: s.first || 0,
      streak: s.streak || 0,
      best: Math.max(rec.stats.best, s.streak || 0),
    };
    const a = document.querySelector("#ewl-acc strong");
    const k = document.querySelector("#ewl-streak strong");
    if (a) a.textContent = acc === null ? "—" : `${acc}%`;
    if (k) k.textContent = String(s.streak || 0);
  }

  /* ---- debug panel ------------------------------------------------------------------------------------------------ */
  const panel = {
    /** @type {HTMLElement|null} */ el: null,
    show() {
      if (!this.el) {
        this.el = document.createElement("aside");
        this.el.id = "ewl-debug";
        this.el.setAttribute("aria-label", "Diagnostics");
        this.el.className = "ewl-debug";
        document.body.append(this.el);
      }
      this.el.hidden = false;
      this.refresh();
    },
    hide() {
      if (this.el) this.el.hidden = true;
    },
    refresh() {
      if (!this.el || this.el.hidden) return;
      const st = W.StudioRT?.api?.state;
      const rows = Logger.entries
        .slice(-25)
        .map(
          (e) =>
            `${new Date(e.t).toISOString().slice(11, 19)} ${e.level} ${e.msg}${e.ctx ? ` ${typeof e.ctx === "string" ? e.ctx : JSON.stringify(e.ctx).slice(0, 80)}` : ""}`,
        )
        .join("\n");
      const test = lastTest
        ? lastTest.results
            .map((r) => `${r.ok ? "ok  " : "FAIL"} ${r.name}${r.detail ? `: ${r.detail}` : ""}`)
            .join("\n")
        : "(self-test has not run)";
      this.el.textContent = "";
      const pre = document.createElement("pre");
      pre.textContent = `EWL diagnostics  Ctrl+Shift+D closes\nstate: ${current}   pathway: ${pathway.id}   theme: ${document.body.dataset.theme}\nkey: ${REC_KEY}\nstats: ${JSON.stringify(rec.stats)}\nactive tab: ${st?.activeTab ?? "?"}\n\nSELF-TEST\n${test}\n\nLOG\n${rows}`;
      this.el.append(pre);
    },
  };

  /* ---- self-test --------------------------------------------------------------------------------------------------- */
  /** @type {{ok: boolean, results: Array<{name: string, ok: boolean, detail: string}>}|null} */
  let lastTest = null;
  function selfTest() {
    /** @type {Array<{name: string, ok: boolean, detail: string}>} */
    const results = [];
    const t = (/** @type {string} */ name, /** @type {() => string|true} */ fn) => {
      try {
        const r = fn();
        results.push({ name, ok: r === true, detail: r === true ? "" : String(r) });
      } catch (e) {
        results.push({ name, ok: false, detail: /** @type {Error} */ (e).message });
      }
    };
    t("lesson data is sound", () => {
      const p = validateConfig(data);
      return p.length ? p[0] : true;
    });
    t("every section has its mount points", () => {
      for (let i = 1; i <= 5; i++)
        for (const id of [`tab-${i}`, `panel-${i}`, `stage-${i}`, `dots-${i}`])
          if (!document.getElementById(id)) return `#${id} is missing`;
      return true;
    });
    t("settings key has the deterministic form", () =>
      /^ewl_u\d+_l\d+_v2$/.test(REC_KEY) ? true : REC_KEY,
    );
    t("generated items check themselves", () => {
      const G = W.StudioGen;
      if (!G?.verify) return true;
      let n = 0;
      for (const sec of data.sections)
        for (const it of sec.items) {
          if (it.k !== "gen" || n >= 12) continue;
          const made = G.make(it.g, it.level, 4242 + n);
          const v = G.verify(made);
          if (v !== true && !(v && v.ok)) return `${it.g} failed its own check`;
          n++;
        }
      return true;
    });
    t("state machine reaches IDLE", () =>
      current === "IDLE" || current === "MANIPULATING" ? true : `state is ${current}`,
    );
    lastTest = { ok: results.every((r) => r.ok), results };
    return lastTest;
  }

  function notice(/** @type {string} */ msg) {
    const n = document.createElement("div");
    n.className = "ewl-notice";
    n.setAttribute("role", "alert");
    n.textContent = msg;
    (document.querySelector(".main-container") || document.body).prepend(n);
  }

  /* ---- boot ------------------------------------------------------------------------------------------------------ */
  const problems = validateConfig(data);
  if (problems.length) {
    Logger.log("error", "lesson data failed validation", problems);
    notice(
      `This activity could not verify its own content (${problems[0]}). Reload the page. If it keeps happening, tell your teacher.`,
    );
  }

  W.EWLChrome = {
    pathway,
    state: () => current,
    validateConfig,
    selfTest,
    record: () => rec,
    key: REC_KEY,
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.body.dataset.theme = resolve(rec.theme);
    document.body.dataset.pathway = String(pathway.id);
    buildBar();
    go("IDLE", "boot");
    const stage = document.querySelector(".main-container");
    stage?.addEventListener("focusin", (e) => {
      if (/** @type {HTMLElement} */ (e.target).closest?.(".stage-card"))
        go("MANIPULATING", "focus in a task");
    });
    stage?.addEventListener("pointerdown", (e) => {
      if (/** @type {HTMLElement} */ (e.target).closest?.(".stage-card"))
        go("MANIPULATING", "pointer in a task");
    });
    const bus = W.StudioBus;
    bus?.on?.("answer", (/** @type {any} */ e) => {
      go("VALIDATING", `check ${e.itemId}`);
      if (e.ok) {
        go("TASK_COMPLETE", `${e.itemId} solved in ${e.tries}`);
        go("IDLE", "next");
      } else go("FEEDBACK_DIAGNOSTIC", e.tag || "miss");
      refreshStats();
      writeRec();
    });
    bus?.on?.("section", () => {
      go("IDLE", "section change");
      refreshStats();
    });
    bus?.on?.("complete", () => go("LESSON_MASTERED", "every section done"));
    document.getElementById("reset-all-btn")?.addEventListener("click", () => {
      // runtime.js confirms and clears the lesson save; the settings record is cleared with it
      setTimeout(() => {
        if (!W.StudioRT?.api?.state?.stats?.tries) {
          try {
            localStorage.removeItem(REC_KEY);
          } catch (_e) {
            /* nothing to clear */
          }
          Object.assign(rec, fresh(), { pathway: pathway.id });
          go("IDLE", "reset");
          refreshStats();
        }
      }, 50);
    });
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        Logger.on ? Logger.disable() : Logger.enable();
      }
    });
    if (params.get("debug") === "true") Logger.enable();
  });

  window.addEventListener("load", () => {
    refreshStats();
    const r = selfTest();
    Logger.log(
      r.ok ? "info" : "error",
      r.ok ? "self-test passed" : "self-test failed",
      r.results.filter((x) => !x.ok),
    );
    if (!r.ok && !document.querySelector(".ewl-notice"))
      notice(
        `This activity found a problem while checking itself (${r.results.find((x) => !x.ok)?.name}). Reload the page; your work is saved.`,
      );
    panel.refresh();
  });
})();
