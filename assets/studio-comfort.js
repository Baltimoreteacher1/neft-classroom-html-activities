/**
 * Practice studio comfort layer (window.EWLComfort). One button opens a panel with the settings that decide whether a
 * student can read and use a studio at all: text size, reading font, spacing, high contrast, a reading ruler and calm
 * mode. The same panel holds the two earned-feedback switches: sound effects (off until chosen) and celebrations.
 *
 * Settings live in this browser only (localStorage, with a safe fallback) and are applied as data-comfort-* attributes
 * on <html> before first paint of the studio, so the page never flashes at the wrong size. Celebrations listen to the
 * studio's own events (studio:solved, studio:progress, studio:complete, studio:quest) and fire only for things the
 * student earned: a streak, a finished section, a finished studio, a finished quest. Nothing is timed.
 */
(() => {
  const W = /** @type {any} */ (window);
  const KEY = "ewl_comfort_v1";
  const DEFAULTS = {
    size: 1,
    font: "default",
    space: "normal",
    contrast: "normal",
    calm: false,
    ruler: false,
    sound: false,
    celebrate: true,
  };
  const FONT_SHEET = {
    lexend: "/assets/fonts/small-group.css",
    atkinson: "/assets/fonts/lesson-group.css",
  };

  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") return { ...DEFAULTS, ...raw };
    } catch (_e) {
      /* blocked or damaged storage: use the defaults */
    }
    return { ...DEFAULTS };
  }
  /** @type {any} */
  let s = read();
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (_e) {
      /* the settings still apply for this visit */
    }
  };
  const root = document.documentElement;

  function apply() {
    root.dataset.comfortSize = String(s.size);
    root.dataset.comfortFont = s.font;
    root.dataset.comfortSpace = s.space;
    root.dataset.comfortContrast = s.contrast;
    root.dataset.comfortCalm = s.calm ? "on" : "off";
    root.dataset.comfortRuler = s.ruler ? "on" : "off";
    const sheet = /** @type {Record<string, string>} */ (FONT_SHEET)[s.font];
    if (sheet && !document.querySelector(`link[data-comfort-font="${s.font}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = sheet;
      l.dataset.comfortFont = s.font;
      document.head.append(l);
    }
  }
  apply();

  /* ---- reading ruler -------------------------------------------------------------------------------- */
  function ruler() {
    let r = document.getElementById("comfort-ruler");
    if (!r) {
      r = document.createElement("div");
      r.id = "comfort-ruler";
      r.setAttribute("aria-hidden", "true");
      document.body.append(r);
      const place = (/** @type {number} */ y) => {
        const h = /** @type {HTMLElement} */ (r).offsetHeight || 40;
        /** @type {HTMLElement} */ (r).style.top = `${Math.max(0, y - h / 2)}px`;
      };
      document.addEventListener("pointermove", (e) => {
        if (s.ruler) place(e.clientY);
      });
      document.addEventListener("focusin", (e) => {
        if (!s.ruler) return;
        const b = /** @type {HTMLElement} */ (e.target).getBoundingClientRect?.();
        if (b) place(b.top + b.height / 2);
      });
    }
  }

  /* ---- sound and celebration (earned moments only) -------------------------------------------------- */
  /** @type {any} */
  let audio = null;
  const CUES = {
    solve: [660],
    streak: [523, 659, 784],
    section: [587, 784, 988],
    done: [523, 659, 784, 1047],
    quest: [523, 784, 1047],
  };
  function tone(/** @type {keyof typeof CUES} */ cue) {
    if (!s.sound || s.calm) return;
    try {
      const A = W.AudioContext || W.webkitAudioContext;
      if (!A) return;
      audio ||= new A();
      if (audio.state === "suspended") audio.resume?.();
      CUES[cue].forEach((hz, i) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        const t = audio.currentTime + i * 0.11;
        o.type = "sine";
        o.frequency.value = hz;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(cue === "solve" ? 0.03 : 0.08, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g);
        g.connect(audio.destination);
        o.start(t);
        o.stop(t + 0.18);
      });
    } catch (_e) {
      /* no audio device: the visual feedback still shows */
    }
  }
  /** @type {any} */
  let toastTimer = 0;
  function toast(/** @type {string} */ text) {
    if (!s.celebrate || s.calm) return;
    let t = document.getElementById("comfort-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "comfort-toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.append(t);
    }
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t?.classList.remove("show"), 3600);
  }
  function confetti() {
    if (!s.celebrate || s.calm || W.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return;
    const c = document.createElement("div");
    c.className = "comfort-confetti";
    c.setAttribute("aria-hidden", "true");
    c.innerHTML = Array.from(
      { length: 28 },
      (_, i) => `<i style="--i:${i};left:${(i * 37) % 100}%"></i>`,
    ).join("");
    document.body.append(c);
    setTimeout(() => c.remove(), 3200);
  }
  const MILESTONES = {
    3: "🔥 3 in a row!",
    5: "🔥 5 in a row, nice focus!",
    8: "🔥 8 in a row!",
    12: "🔥 12 in a row, unstoppable!",
  };
  let lastDone = 0;
  const sectionsDone = () => document.querySelectorAll(".tab-btn.tab-complete").length;
  let lastSections = -1;

  window.addEventListener("studio:solved", () => {
    const streak = W.StudioRT?.api?.state?.stats?.streak || 0;
    const msg = /** @type {Record<number, string>} */ (MILESTONES)[streak];
    if (msg) {
      toast(msg);
      tone("streak");
    } else tone("solve");
  });
  window.addEventListener("studio:progress", (/** @type {any} */ e) => {
    const done = e.detail?.done || 0;
    const sections = sectionsDone();
    if (lastSections < 0) lastSections = sections;
    else if (sections > lastSections && done > lastDone) {
      toast("🌟 Section complete!");
      tone("section");
      confetti();
    }
    lastSections = sections;
    lastDone = done;
  });
  window.addEventListener("studio:complete", () => {
    toast("🏆 Studio complete!");
    tone("done");
    confetti();
  });
  window.addEventListener("studio:quest", (/** @type {any} */ e) => {
    const stars = e.detail?.stars || 0;
    if (stars > 0) {
      toast(`🎯 Quest complete: ${"★".repeat(stars)}`);
      tone("quest");
      if (stars === 3) confetti();
    }
  });

  /* ---- the panel ------------------------------------------------------------------------------------ */
  const radio = (/** @type {string} */ name, /** @type {Array<[any, string]>} */ opts) =>
    `<div class="comfort-choices" role="radiogroup">${opts
      .map(
        ([v, label]) =>
          `<label><input type="radio" name="comfort-${name}" value="${v}"${String(s[name]) === String(v) ? " checked" : ""}><span>${label}</span></label>`,
      )
      .join("")}</div>`;
  const toggle = (/** @type {string} */ name, /** @type {string} */ label) =>
    `<label class="comfort-toggle"><input type="checkbox" data-toggle="${name}"${(name === "contrast" ? s.contrast === "high" : s[name]) ? " checked" : ""}><span>${label}</span></label>`;

  function open() {
    document.getElementById("comfort-dialog")?.remove();
    const d = document.createElement("dialog");
    d.id = "comfort-dialog";
    d.className = "comfort-dialog";
    d.setAttribute("aria-labelledby", "comfort-title");
    d.innerHTML = `<div class="comfort-head"><h2 id="comfort-title">Make it comfortable</h2><div class="comfort-actions"><button type="button" data-close>Done</button></div></div>
      <div class="comfort-body">
        <fieldset><legend>Text size</legend>${radio("size", [
          [1, "Normal"],
          [2, "Large"],
          [3, "Extra large"],
        ])}</fieldset>
        <fieldset><legend>Reading font</legend>${radio("font", [
          ["default", "Studio"],
          ["lexend", "Lexend"],
          ["atkinson", "Atkinson Hyperlegible"],
        ])}</fieldset>
        <fieldset><legend>Spacing</legend>${radio("space", [
          ["normal", "Normal"],
          ["roomy", "Roomy"],
        ])}</fieldset>
        <div class="comfort-toggles">
          ${toggle("contrast", "High contrast")}
          ${toggle("ruler", "Reading ruler (follows your pointer or focus)")}
          ${toggle("calm", "Calm mode (no motion, no sound)")}
          ${toggle("sound", "Sound effects for things I earn")}
          ${toggle("celebrate", "Celebrations when I finish something")}
        </div>
        <div class="comfort-actions"><button type="button" data-reset>Back to the usual settings</button></div>
      </div>`;
    document.body.append(d);
    const sync = () => {
      for (const n of ["size", "font", "space"]) {
        const v = /** @type {HTMLInputElement|null} */ (
          d.querySelector(`input[name="comfort-${n}"]:checked`)
        )?.value;
        if (v !== undefined) s[n] = n === "size" ? Number(v) : v;
      }
      for (const t of /** @type {NodeListOf<HTMLInputElement>} */ (
        d.querySelectorAll("[data-toggle]")
      )) {
        const n = /** @type {string} */ (t.dataset.toggle);
        s[n] = n === "contrast" ? (t.checked ? "high" : "normal") : t.checked;
      }
      if (s.sound) tone("solve");
      apply();
      if (s.ruler) ruler();
      write();
    };
    d.addEventListener("change", sync);
    d.querySelector("[data-reset]")?.addEventListener("click", () => {
      s = { ...DEFAULTS };
      apply();
      write();
      open();
    });
    d.querySelector("[data-close]")?.addEventListener("click", () => d.close());
    d.addEventListener("close", () => {
      d.remove();
      document.getElementById("comfort-btn")?.focus();
    });
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
  }

  function mount() {
    if (document.getElementById("comfort-btn") || !document.body) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "comfort-btn";
    b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML = '<span aria-hidden="true">Aa</span> <span>Comfort</span>';
    b.addEventListener("click", open);
    // in the studio header when there is one (beside Español); a quiet round button on the hand-built pages
    const actions = document.querySelector(".header-actions");
    if (actions) {
      b.className = "top-btn";
      b.innerHTML = '<span aria-hidden="true">Aa</span> Comfort';
      actions.insertBefore(b, document.getElementById("toggle-es-btn") || actions.firstChild);
    } else document.body.append(b);
    if (s.ruler) ruler();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  W.EWLComfort = { settings: () => ({ ...s }), apply, open, DEFAULTS };
})();
