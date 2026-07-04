/*!
 * lesson-focus.js — Neft Lesson Platform · Layer: Focus & Study Studio.
 *
 * Additive, dependency-free, deploy-safe overlay for self-contained math lesson
 * HTML pages (see docs/superpowers/specs/INTEGRATION-CONTRACT.md). Pairs with
 * lesson-focus.css. Exposes window.NTFocus.init() (idempotent, auto-boots).
 *
 * A premium "study studio" for students with executive-function / ESOL / IEP
 * support needs. ONE small launcher (bottom-left, the only free corner —
 * juice owns top-right, the AI tutor + save bar own bottom-right/bottom-edge)
 * opens three calm tools that never touch the lesson's grading logic or DOM:
 *
 *   1. Focus Mode — spotlights one question at a time, dimming the rest with a
 *      soft backdrop, and follows the student's progress (.q-card.correct) so
 *      the next unanswered problem is always the one lit. Cuts overwhelm.
 *   2. Study Timer — a gentle focus countdown (default 10 min) with a calm
 *      progress ring and a "nice focus — stretch break" cue at zero. Elapsed
 *      time survives reload (sessionStorage), so a refresh never resets it.
 *   3. Scratchpad — a draggable lined notepad that auto-saves per-lesson to
 *      localStorage (namespaced by pathname), so working notes persist across
 *      sessions alongside the existing save/resume engine.
 *
 * Hard guarantees (same contract as the other platform layers):
 *   - Never throws into the page: every public path is wrapped in try/catch.
 *   - Idempotent: a second init() is a no-op; safe to load twice.
 *   - Honors prefers-reduced-motion and window.NT_MUTED (no sound of its own).
 *   - Adds nothing to print/PDF output and hides itself in ?embed=1 mode.
 *   - Only new global is window.NTFocus. Touches no lesson-local selectors
 *     except reading .q-card[data-q] state, exactly as juice/adaptive already do.
 */
(function () {
  "use strict";

  if (window.NTFocus && window.NTFocus.__loaded) return;

  var DEFAULT_MINUTES = 10;
  var prefersReduced = false;
  try {
    prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    /* default false */
  }

  function isEmbed() {
    try {
      return (
        document.documentElement.classList.contains("nt-embed") ||
        /[?&]embed=1\b/.test(window.location.search)
      );
    } catch (e) {
      return false;
    }
  }

  function nsKey() {
    // Per-lesson namespace for persisted notes. Mirrors how save-resume scopes.
    try {
      return "ntfocus:" + (window.location.pathname || "/");
    } catch (e) {
      return "ntfocus:default";
    }
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function lsGet(k) {
    try {
      return window.localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function lsSet(k, v) {
    try {
      window.localStorage.setItem(k, v);
    } catch (e) {
      /* private mode / quota — degrade silently */
    }
  }
  function ssGet(k) {
    try {
      return window.sessionStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function ssSet(k, v) {
    try {
      window.sessionStorage.setItem(k, v);
    } catch (e) {
      /* degrade silently */
    }
  }

  // ── Focus Mode ──────────────────────────────────────────────────────────
  // Spotlights the active question, dims the rest. The "active" card is the
  // first .q-card that is not yet marked .correct (the same signal juice and
  // adaptive read); falls back to the first card if all/none are correct.
  var Focus = {
    on: false,
    backdrop: null,
    current: null,
    cards: function () {
      try {
        return Array.prototype.slice.call(document.querySelectorAll(".q-card[data-q]"));
      } catch (e) {
        return [];
      }
    },
    activeCard: function () {
      var cards = this.cards();
      if (!cards.length) return null;
      for (var i = 0; i < cards.length; i++) {
        if (!cards[i].classList.contains("correct")) return cards[i];
      }
      return cards[cards.length - 1];
    },
    spotlight: function (card) {
      if (!card) return;
      if (this.current && this.current !== card) {
        this.current.classList.remove("ntf-spot");
      }
      this.current = card;
      card.classList.add("ntf-spot");
      try {
        card.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "center",
        });
      } catch (e) {
        /* older browsers: ignore */
      }
    },
    enable: function () {
      if (this.on) return;
      this.on = true;
      document.documentElement.classList.add("ntf-focus-on");
      if (!this.backdrop) {
        this.backdrop = el("div", "ntf-backdrop");
        document.body.appendChild(this.backdrop);
      }
      this.spotlight(this.activeCard());
    },
    disable: function () {
      this.on = false;
      document.documentElement.classList.remove("ntf-focus-on");
      if (this.current) this.current.classList.remove("ntf-spot");
      this.current = null;
    },
    toggle: function () {
      this.on ? this.disable() : this.enable();
      return this.on;
    },
    // Re-spotlight when the active question changes (a card just went correct).
    sync: function () {
      if (!this.on) return;
      var next = this.activeCard();
      if (next && next !== this.current) this.spotlight(next);
    },
  };

  // ── Study Timer ─────────────────────────────────────────────────────────
  var Timer = {
    minutes: DEFAULT_MINUTES,
    remaining: DEFAULT_MINUTES * 60,
    running: false,
    tick: null,
    ringEl: null,
    labelEl: null,
    btnEl: null,
    restore: function () {
      var saved = ssGet("ntfocus-timer-remaining");
      var n = parseInt(saved, 10);
      if (!isNaN(n) && n >= 0 && n <= 60 * 60) this.remaining = n;
    },
    persist: function () {
      ssSet("ntfocus-timer-remaining", String(this.remaining));
    },
    fmt: function () {
      var m = Math.floor(this.remaining / 60);
      var s = this.remaining % 60;
      return m + ":" + (s < 10 ? "0" + s : s);
    },
    render: function () {
      if (this.labelEl) this.labelEl.textContent = this.fmt();
      if (this.ringEl) {
        var total = this.minutes * 60 || 1;
        var pct = Math.max(0, Math.min(1, this.remaining / total));
        // Conic ring drains clockwise as time passes.
        this.ringEl.style.background =
          "conic-gradient(var(--ntf-accent) " + pct * 360 + "deg, var(--ntf-ring-track) 0)";
      }
      if (this.btnEl) {
        this.btnEl.textContent = this.running ? "Pause" : "Start";
        this.btnEl.setAttribute(
          "aria-label",
          this.running ? "Pause study timer" : "Start study timer",
        );
      }
    },
    start: function () {
      if (this.running) return;
      this.running = true;
      var self = this;
      this.tick = window.setInterval(function () {
        if (self.remaining <= 0) {
          self.complete();
          return;
        }
        self.remaining -= 1;
        self.persist();
        self.render();
      }, 1000);
      this.render();
    },
    pause: function () {
      this.running = false;
      if (this.tick) window.clearInterval(this.tick);
      this.tick = null;
      this.render();
    },
    toggle: function () {
      this.running ? this.pause() : this.start();
    },
    reset: function () {
      this.pause();
      this.remaining = this.minutes * 60;
      this.persist();
      this.render();
    },
    complete: function () {
      this.pause();
      this.remaining = 0;
      this.persist();
      this.render();
      toast("Nice focus! 🌿 Stand up and stretch for a minute.");
    },
  };

  // ── Scratchpad ──────────────────────────────────────────────────────────
  var Pad = {
    panel: null,
    area: null,
    open: false,
    saveT: null,
    load: function () {
      if (this.area) this.area.value = lsGet(nsKey() + ":notes") || "";
    },
    save: function () {
      if (this.area) lsSet(nsKey() + ":notes", this.area.value);
    },
    scheduleSave: function () {
      var self = this;
      if (this.saveT) window.clearTimeout(this.saveT);
      this.saveT = window.setTimeout(function () {
        self.save();
      }, 400);
    },
    toggle: function () {
      this.open = !this.open;
      if (this.panel) this.panel.classList.toggle("ntf-open", this.open);
      if (this.open && this.area) {
        this.load();
        try {
          this.area.focus();
        } catch (e) {
          /* ignore */
        }
      }
      return this.open;
    },
  };

  // Make the scratchpad draggable by its header (pointer events, no deps).
  function makeDraggable(panel, handle) {
    var sx = 0,
      sy = 0,
      ox = 0,
      oy = 0,
      dragging = false;
    function down(e) {
      dragging = true;
      var p = e.touches ? e.touches[0] : e;
      sx = p.clientX;
      sy = p.clientY;
      var r = panel.getBoundingClientRect();
      ox = r.left;
      oy = r.top;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      document.addEventListener("mousemove", move);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("mouseup", up);
      document.addEventListener("touchend", up);
    }
    function move(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      if (e.cancelable) e.preventDefault();
      var nx = ox + (p.clientX - sx);
      var ny = oy + (p.clientY - sy);
      var maxX = window.innerWidth - 60;
      var maxY = window.innerHeight - 40;
      panel.style.left = Math.max(0, Math.min(maxX, nx)) + "px";
      panel.style.top = Math.max(0, Math.min(maxY, ny)) + "px";
    }
    function up() {
      dragging = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchend", up);
    }
    handle.addEventListener("mousedown", down);
    handle.addEventListener("touchstart", down, { passive: true });
  }

  // ── Shared toast ──────────────────────────────────────────────────────────
  var toastEl = null;
  function toast(msg) {
    try {
      if (!toastEl) {
        toastEl = el("div", "ntf-toast");
        toastEl.setAttribute("role", "status");
        toastEl.setAttribute("aria-live", "polite");
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg;
      toastEl.classList.add("ntf-toast-show");
      window.setTimeout(function () {
        if (toastEl) toastEl.classList.remove("ntf-toast-show");
      }, 4200);
    } catch (e) {
      /* ignore */
    }
  }

  // ── UI assembly ───────────────────────────────────────────────────────────
  function buildUI() {
    var dock = el("div", "ntf-dock");
    dock.setAttribute("aria-label", "Focus & study tools");

    // Launcher
    var launcher = el(
      "button",
      "ntf-launcher",
      '<span class="ntf-launcher-icon" aria-hidden="true">📓</span><span class="ntf-launcher-text">Study</span>',
    );
    launcher.type = "button";
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Open focus and study tools");

    // Menu
    var menu = el("div", "ntf-menu");
    menu.setAttribute("role", "menu");

    var btnFocus = el("button", "ntf-item", '<span aria-hidden="true">🔦</span> Focus mode');
    btnFocus.type = "button";
    btnFocus.setAttribute("role", "menuitemcheckbox");
    btnFocus.setAttribute("aria-checked", "false");

    var btnPad = el("button", "ntf-item", '<span aria-hidden="true">✏️</span> Scratchpad');
    btnPad.type = "button";
    btnPad.setAttribute("role", "menuitem");

    // Timer block
    var timerWrap = el("div", "ntf-timer");
    var ring = el("div", "ntf-ring");
    var ringLabel = el("span", "ntf-ring-label", "10:00");
    ring.appendChild(ringLabel);
    var tctrls = el("div", "ntf-timer-ctrls");
    var btnTimer = el("button", "ntf-mini", "Start");
    btnTimer.type = "button";
    var btnReset = el("button", "ntf-mini ntf-mini-ghost", "Reset");
    btnReset.type = "button";
    btnReset.setAttribute("aria-label", "Reset study timer");
    tctrls.appendChild(btnTimer);
    tctrls.appendChild(btnReset);
    var tlabel = el("div", "ntf-timer-title", "Focus timer");
    timerWrap.appendChild(tlabel);
    timerWrap.appendChild(ring);
    timerWrap.appendChild(tctrls);

    menu.appendChild(btnFocus);
    menu.appendChild(btnPad);
    menu.appendChild(timerWrap);

    dock.appendChild(menu);
    dock.appendChild(launcher);
    document.body.appendChild(dock);

    // Scratchpad panel (separate fixed element so it can be dragged free)
    var pad = el("div", "ntf-pad");
    var padHead = el("div", "ntf-pad-head", '<span class="ntf-pad-title">Scratchpad</span>');
    var padClose = el("button", "ntf-pad-close", "×");
    padClose.type = "button";
    padClose.setAttribute("aria-label", "Close scratchpad");
    padHead.appendChild(padClose);
    var area = el("textarea", "ntf-pad-area");
    area.setAttribute(
      "placeholder",
      "Jot your thinking, steps, or questions here. Saved automatically.",
    );
    area.setAttribute("aria-label", "Scratchpad notes");
    pad.appendChild(padHead);
    pad.appendChild(area);
    document.body.appendChild(pad);

    // wire references
    Timer.ringEl = ring;
    Timer.labelEl = ringLabel;
    Timer.btnEl = btnTimer;
    Pad.panel = pad;
    Pad.area = area;

    // ── interactions ──
    var menuOpen = false;
    function setMenu(open) {
      menuOpen = open;
      dock.classList.toggle("ntf-dock-open", open);
      launcher.setAttribute("aria-expanded", open ? "true" : "false");
    }
    launcher.addEventListener("click", function () {
      setMenu(!menuOpen);
    });

    btnFocus.addEventListener("click", function () {
      var on = Focus.toggle();
      btnFocus.setAttribute("aria-checked", on ? "true" : "false");
      btnFocus.classList.toggle("ntf-item-on", on);
    });

    btnPad.addEventListener("click", function () {
      Pad.toggle();
    });
    padClose.addEventListener("click", function () {
      Pad.toggle();
    });
    area.addEventListener("input", function () {
      Pad.scheduleSave();
    });
    makeDraggable(pad, padHead);

    btnTimer.addEventListener("click", function () {
      Timer.toggle();
    });
    btnReset.addEventListener("click", function () {
      Timer.reset();
    });

    // Esc closes the open scratchpad / menu
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (Pad.open) Pad.toggle();
        else if (menuOpen) setMenu(false);
      }
    });

    // Keep Focus spotlight in step with grading. The lesson marks .q-card
    // .correct on a right answer; observe that mutation cheaply.
    try {
      var mo = new MutationObserver(function () {
        Focus.sync();
      });
      mo.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    } catch (e) {
      /* MutationObserver unsupported: focus still works, just no auto-advance */
    }
  }

  function init() {
    try {
      if (window.NTFocus && window.NTFocus.__ui) return window.NTFocus;
      if (isEmbed()) return window.NTFocus; // no chrome in embed/PDF contexts
      if (!document.body) return window.NTFocus;
      Timer.restore();
      buildUI();
      Timer.render();
      window.NTFocus.__ui = true;
    } catch (e) {
      try {
        if (window.console && console.warn) console.warn("[lesson-focus] init failed", e);
      } catch (e2) {
        /* never break the lesson */
      }
    }
    return window.NTFocus;
  }

  window.NTFocus = {
    __loaded: true,
    __ui: false,
    init: init,
    focus: Focus,
    timer: Timer,
    pad: Pad,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
