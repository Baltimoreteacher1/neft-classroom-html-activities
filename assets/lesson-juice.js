// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* Neft Teacher — Lesson Juice (engagement / production layer).
 *
 * Pairs with lesson-juice.css. Exposes window.NTJuice.init() which adds a
 * premium, restrained gamification layer ON TOP of a self-contained math lesson
 * page, without touching its grading logic or DOM contract:
 *   - sticky progress arc + bar tied to items completed (.q-card.correct)
 *   - streak counter (consecutive correct), XP + level with a level-up moment
 *   - correct/incorrect micro-animations (reuses window.GameFX where present)
 *   - synthesized WebAudio chimes (no asset files) gated by window.NT_MUTED,
 *     with a visible mute toggle
 *   - optional speechSynthesis read-aloud button for problem text
 *   - a completion certificate when every problem is mastered
 *   - optional per-unit theming from window.NT_UNIT_THEME {name,color,emoji}
 *
 * Hard rules: never throws into the host lesson (everything guarded + try/catch),
 * never alters scoring or the lesson's own DOM/CSS, idempotent (window sentinel),
 * honors prefers-reduced-motion (state kept, motion off) and a global mute flag
 * (window.NT_MUTED). All ids/classes are namespaced `ntj-`; the only new global
 * is window.NTJuice. Layer 2 of the lesson platform; assumes nothing about
 * Layer 1 but cooperates with GameFX/NeftSaveResume if they exist. */
(function () {
  "use strict";
  if (window.NTJuice && window.NTJuice.__loaded) return;

  var SENTINEL = "__ntJuice";
  if (window[SENTINEL]) return;
  window[SENTINEL] = true;

  /* ── Config / constants ── */
  var XP_PER_ITEM = 20; // XP for a correct first solve
  var XP_PER_LEVEL = 100; // XP needed per level band
  var STORE_KEY = "ntj:v1"; // distinct from nsr:/nt_/gfx
  var reduce = false;
  try {
    reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (_e) {}

  /* ── Tiny safe helpers ── */
  function $(sel, root) {
    try {
      return (root || document).querySelector(sel);
    } catch (_e) {
      return null;
    }
  }
  function $all(sel, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    } catch (_e) {
      return [];
    }
  }
  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs)
      for (var k in attrs)
        if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }
  function isMuted() {
    return !!window.NT_MUTED;
  }
  function pageSlug() {
    try {
      return (location.pathname || "lesson").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    } catch (_e) {
      return "lesson";
    }
  }

  /* ── Persistence (best-effort; never fatal) ── */
  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY + ":" + pageSlug());
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }
  function saveStore(data) {
    try {
      localStorage.setItem(STORE_KEY + ":" + pageSlug(), JSON.stringify(data));
    } catch (_e) {}
  }

  /* ── WebAudio synthesized chimes (no asset files) ── */
  var audioCtx = null;
  function ctx() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (_e) {
      audioCtx = null;
    }
    return audioCtx;
  }
  function tone(freq, start, dur, gainPeak, type) {
    var ac = ctx();
    if (!ac) return;
    try {
      var osc = ac.createOscillator();
      var g = ac.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, ac.currentTime + start);
      g.gain.setValueAtTime(0.0001, ac.currentTime + start);
      g.gain.exponentialRampToValueAtTime(gainPeak, ac.currentTime + start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(ac.currentTime + start);
      osc.stop(ac.currentTime + start + dur + 0.02);
    } catch (_e) {}
  }
  function chime(kind) {
    if (isMuted()) return;
    var ac = ctx();
    if (!ac) return;
    try {
      if (ac.state === "suspended") ac.resume();
    } catch (_e) {}
    if (kind === "correct") {
      tone(523.25, 0, 0.16, 0.16, "sine"); // C5
      tone(659.25, 0.09, 0.18, 0.15, "sine"); // E5
      tone(783.99, 0.18, 0.24, 0.14, "sine"); // G5
    } else if (kind === "incorrect") {
      tone(330, 0, 0.14, 0.1, "triangle");
      tone(247, 0.1, 0.2, 0.09, "triangle");
    } else if (kind === "levelup") {
      tone(523.25, 0, 0.14, 0.14, "sine");
      tone(659.25, 0.1, 0.14, 0.14, "sine");
      tone(783.99, 0.2, 0.14, 0.14, "sine");
      tone(1046.5, 0.3, 0.34, 0.16, "sine");
    } else if (kind === "complete") {
      tone(659.25, 0, 0.16, 0.14, "sine");
      tone(783.99, 0.12, 0.16, 0.14, "sine");
      tone(1046.5, 0.24, 0.16, 0.15, "sine");
      tone(1318.5, 0.36, 0.42, 0.17, "sine");
    }
  }

  /* ── Per-unit theming ── */
  var theme = { name: "", color: "", emoji: "🎯" };
  function applyTheme() {
    try {
      var t = window.NT_UNIT_THEME;
      if (t && typeof t === "object") {
        if (t.name) theme.name = String(t.name);
        if (t.emoji) theme.emoji = String(t.emoji);
        if (t.color && /^#?[0-9a-f]{3,8}$/i.test(String(t.color))) {
          theme.color = String(t.color).charAt(0) === "#" ? String(t.color) : "#" + t.color;
          document.documentElement.style.setProperty("--ntj-accent", theme.color);
        }
      }
    } catch (_e) {}
  }

  /* ── State ── */
  var state = {
    total: 0,
    completed: 0,
    streak: 0,
    bestStreak: 0,
    xp: 0,
    level: 1,
    counted: {}, // data-q ids already credited (no double count)
    certShown: false,
  };
  var nodes = {}; // cached HUD nodes
  var live = null;

  function levelForXp(xp) {
    return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  }
  function announce(msg) {
    if (live) {
      try {
        live.textContent = "";
        live.textContent = msg;
      } catch (_e) {}
    }
  }

  /* ── HUD build ── */
  var ARC_R = 19;
  var ARC_C = 2 * Math.PI * ARC_R;
  function buildHud() {
    var hud = el("div", "ntj-hud", {
      id: "ntj-hud",
      role: "group",
      "aria-label": "Lesson progress",
    });

    // Progress arc
    var arc = el("div", "ntj-arc");
    arc.innerHTML =
      '<svg viewBox="0 0 44 44" aria-hidden="true">' +
      '<circle class="ntj-arc-track" cx="22" cy="22" r="' +
      ARC_R +
      '"></circle>' +
      '<circle class="ntj-arc-fill" cx="22" cy="22" r="' +
      ARC_R +
      '" ' +
      'stroke-dasharray="' +
      ARC_C +
      '" stroke-dashoffset="' +
      ARC_C +
      '"></circle>' +
      "</svg>" +
      '<span class="ntj-arc-label" id="ntj-arc-label">0%</span>';
    nodes.arcFill = arc.querySelector(".ntj-arc-fill");
    nodes.arcLabel = arc.querySelector("#ntj-arc-label");
    hud.appendChild(arc);

    // Streak
    var streak = el("div", "ntj-stat ntj-flame", { title: "Streak" });
    streak.innerHTML =
      '<span class="ntj-stat-val" id="ntj-streak">0</span>' +
      '<span class="ntj-stat-label">🔥 streak</span>';
    nodes.streak = streak.querySelector("#ntj-streak");
    hud.appendChild(streak);

    // Level / XP
    var lvl = el("div", "ntj-stat", { title: "Level" });
    lvl.innerHTML =
      '<span class="ntj-stat-val" id="ntj-level">1</span>' +
      '<span class="ntj-stat-label" id="ntj-xp">0 XP</span>';
    nodes.level = lvl.querySelector("#ntj-level");
    nodes.xp = lvl.querySelector("#ntj-xp");
    hud.appendChild(lvl);

    // Read-aloud toggle (only if speechSynthesis exists)
    if (window.speechSynthesis) {
      var read = el("button", "ntj-btn", {
        type: "button",
        id: "ntj-read",
        "aria-pressed": "false",
        "aria-label": "Read problems aloud",
        title: "Read problems aloud",
      });
      read.textContent = "🗣️";
      read.addEventListener("click", toggleReadAloud);
      nodes.read = read;
      hud.appendChild(read);
    }

    // Mute toggle
    var mute = el("button", "ntj-btn", {
      type: "button",
      id: "ntj-mute",
      "aria-pressed": isMuted() ? "true" : "false",
      "aria-label": isMuted() ? "Unmute sounds" : "Mute sounds",
      title: "Mute / unmute sounds",
    });
    mute.textContent = isMuted() ? "🔇" : "🔊";
    mute.addEventListener("click", toggleMute);
    nodes.mute = mute;
    hud.appendChild(mute);

    document.body.appendChild(hud);
    nodes.hud = hud;

    // Live region for SR feedback
    live = el("div", "ntj-sr", {
      "aria-live": "polite",
      "aria-atomic": "true",
    });
    document.body.appendChild(live);
  }

  function toggleMute() {
    window.NT_MUTED = !isMuted();
    if (nodes.mute) {
      nodes.mute.setAttribute("aria-pressed", isMuted() ? "true" : "false");
      nodes.mute.setAttribute("aria-label", isMuted() ? "Unmute sounds" : "Mute sounds");
      nodes.mute.textContent = isMuted() ? "🔇" : "🔊";
    }
    if (isMuted() && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {}
    }
    announce(isMuted() ? "Sounds muted" : "Sounds on");
    persist();
  }

  /* ── Read-aloud (speechSynthesis) ── */
  var reading = false;
  function gatherProblemText() {
    var parts = [];
    $all("article.q-card").forEach(function (card) {
      var prompt = $(".q-prompt", card) || card;
      var txt = (prompt.textContent || "").replace(/\s+/g, " ").trim();
      if (txt) parts.push(txt);
    });
    return parts.join(". ");
  }
  function toggleReadAloud() {
    if (!window.speechSynthesis) return;
    try {
      if (reading) {
        window.speechSynthesis.cancel();
        reading = false;
        if (nodes.read) nodes.read.setAttribute("aria-pressed", "false");
        announce("Stopped reading");
        return;
      }
      var text = gatherProblemText();
      if (!text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92;
      u.onend = u.onerror = function () {
        reading = false;
        if (nodes.read) nodes.read.setAttribute("aria-pressed", "false");
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      reading = true;
      if (nodes.read) nodes.read.setAttribute("aria-pressed", "true");
      announce("Reading problems aloud");
    } catch (_e) {
      reading = false;
    }
  }

  /* ── Visual micro-feedback ── */
  function xpFloat(x, y, amount) {
    if (reduce) return;
    try {
      var f = el("div", "ntj-xp-float");
      f.textContent = "+" + amount + " XP";
      f.style.left = x + "px";
      f.style.top = y + "px";
      document.body.appendChild(f);
      setTimeout(function () {
        if (f.parentNode) f.parentNode.removeChild(f);
      }, 1000);
    } catch (_e) {}
  }
  function celebrateCard(card) {
    try {
      if (window.GameFX && typeof window.GameFX.celebrate === "function") {
        window.GameFX.celebrate(card);
      }
    } catch (_e) {}
  }
  function shakeOnce(card) {
    if (reduce || !card) return;
    try {
      card.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 320, easing: "ease-in-out" },
      );
    } catch (_e) {}
  }

  /* ── Progress + XP rendering ── */
  function renderHud() {
    var pct = state.total ? Math.round((state.completed / state.total) * 100) : 0;
    if (nodes.arcFill) {
      var off = ARC_C * (1 - pct / 100);
      nodes.arcFill.setAttribute("stroke-dashoffset", String(off));
    }
    if (nodes.arcLabel) nodes.arcLabel.textContent = pct + "%";
    if (nodes.streak) nodes.streak.textContent = String(state.streak);
    if (nodes.level) nodes.level.textContent = String(state.level);
    if (nodes.xp) nodes.xp.textContent = state.xp + " XP";
  }
  function popStat(node) {
    if (reduce || !node || !window.GameFX || typeof window.GameFX.pop !== "function") return;
    try {
      window.GameFX.pop(node);
    } catch (_e) {}
  }
  function persist() {
    saveStore({
      completed: state.completed,
      streak: state.streak,
      bestStreak: state.bestStreak,
      xp: state.xp,
      level: state.level,
      counted: state.counted,
      certShown: state.certShown,
    });
  }

  /* ── Grading event handling ── */
  function creditCorrect(card) {
    var id = card.getAttribute("data-q") || "";
    if (!id) id = "q" + Math.random().toString(36).slice(2, 7);
    if (state.counted[id]) return; // already credited
    state.counted[id] = true;
    state.completed = Math.min(state.total, state.completed + 1);
    state.streak += 1;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;

    var prevLevel = state.level;
    state.xp += XP_PER_ITEM;
    state.level = levelForXp(state.xp);

    // Visual + audio
    celebrateCard(card);
    chime("correct");
    popStat(nodes.level);
    try {
      var r = card.getBoundingClientRect();
      if (r.width) xpFloat(r.left + r.width / 2, r.top + 14, XP_PER_ITEM);
    } catch (_e) {}
    announce("Correct. Streak " + state.streak + ". " + state.xp + " XP.");

    renderHud();
    persist();

    if (state.level > prevLevel) levelUp(state.level);
    checkComplete();
  }

  function registerIncorrect(card) {
    state.streak = 0;
    chime("incorrect");
    shakeOnce(card);
    renderHud();
    persist();
    announce("Not quite. Try again. Streak reset.");
  }

  /* ── Level-up + completion moments ── */
  function overlay(html, onClose) {
    var ov = el("div", "ntj-overlay", { role: "dialog", "aria-modal": "true" });
    ov.innerHTML = html;
    document.body.appendChild(ov);
    var close = function () {
      try {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      } catch (_e) {}
      document.removeEventListener("keydown", onKey);
      if (typeof onClose === "function") onClose();
    };
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    $all("[data-ntj-close]", ov).forEach(function (b) {
      b.addEventListener("click", close);
    });
    ov.addEventListener("click", function (e) {
      if (e.target === ov) close();
    });
    document.addEventListener("keydown", onKey);
    var focusTarget = $(".ntj-cta", ov) || ov;
    try {
      focusTarget.focus();
    } catch (_e) {}
    return close;
  }

  function levelUp(level) {
    chime("levelup");
    var emoji = theme.emoji || "⭐";
    overlay(
      '<div class="ntj-card" tabindex="-1">' +
        '<div class="ntj-card-emoji">' +
        emoji +
        "</div>" +
        "<h2>Level " +
        level +
        "!</h2>" +
        "<p>You leveled up" +
        (theme.name ? " in " + escapeHtml(theme.name) : "") +
        ".</p>" +
        '<p class="ntj-muted">' +
        state.xp +
        " XP earned. Keep the streak going.</p>" +
        '<div class="ntj-card-actions">' +
        '<button class="ntj-cta" data-ntj-close type="button">Keep going</button>' +
        "</div></div>",
    );
    announce("Level up! You reached level " + level + ".");
  }

  function checkComplete() {
    if (state.certShown) return;
    if (state.total > 0 && state.completed >= state.total) {
      state.certShown = true;
      persist();
      setTimeout(showCertificate, 450);
    }
  }

  function studentName() {
    // Reuse identity captured by sibling engines if available — read-only.
    try {
      var raw = localStorage.getItem("nt_student");
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.name) return String(o.name);
      }
    } catch (_e) {}
    try {
      if (window.NeftSaveResume && typeof window.NeftSaveResume.getTeacherSummary === "function") {
        var s = window.NeftSaveResume.getTeacherSummary();
        if (s && s.studentName) return String(s.studentName);
      }
    } catch (_e) {}
    return "";
  }

  function showCertificate() {
    chime("complete");
    if (!reduce && window.GameFX && typeof window.GameFX.burst === "function") {
      try {
        var cx = window.innerWidth / 2;
        window.GameFX.burst(cx, window.innerHeight * 0.35);
        setTimeout(function () {
          window.GameFX.burst(cx - 80, window.innerHeight * 0.4);
          window.GameFX.burst(cx + 80, window.innerHeight * 0.4);
        }, 160);
      } catch (_e) {}
    }
    var name = studentName();
    var title = "";
    try {
      title = (document.title || "this lesson").split("|")[0].trim();
    } catch (_e) {
      title = "this lesson";
    }
    var emoji = theme.emoji || "🏆";
    overlay(
      '<div class="ntj-card" tabindex="-1">' +
        '<div class="ntj-card-emoji">' +
        emoji +
        "</div>" +
        "<h2>Lesson Mastered!</h2>" +
        (name ? '<div class="ntj-cert-name">' + escapeHtml(name) + "</div>" : "") +
        "<p>You completed every problem in " +
        escapeHtml(title) +
        ".</p>" +
        '<p class="ntj-muted">Level ' +
        state.level +
        " · " +
        state.xp +
        " XP · best streak " +
        state.bestStreak +
        "</p>" +
        '<div class="ntj-card-actions">' +
        '<button class="ntj-cta" data-ntj-close type="button">Nice!</button>' +
        '<button class="ntj-cta ntj-ghost" id="ntj-print" type="button">Print certificate</button>' +
        "</div></div>",
    );
    var printBtn = $("#ntj-print");
    if (printBtn)
      printBtn.addEventListener("click", function () {
        try {
          window.print();
        } catch (_e) {}
      });
    announce("Lesson mastered! You completed every problem.");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  /* ── Observe lesson grading (state in .q-card classes) ── */
  function scanInitial() {
    var cards = $all("article.q-card");
    state.total = cards.length;
    cards.forEach(function (card) {
      if (card.classList.contains("correct")) {
        var id = card.getAttribute("data-q") || "";
        if (id && !state.counted[id]) {
          state.counted[id] = true;
          state.completed += 1;
        }
      }
    });
    // Reconcile completed with counted map (handles restored store).
    var n = 0;
    for (var k in state.counted) if (Object.prototype.hasOwnProperty.call(state.counted, k)) n++;
    state.completed = Math.min(state.total, Math.max(state.completed, n));
  }

  function watch() {
    if (!window.MutationObserver) return;
    try {
      var obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var t = muts[i].target;
          if (!t || t.nodeType !== 1 || !t.classList || !t.classList.contains("q-card")) continue;
          if (t.classList.contains("correct")) {
            creditCorrect(t);
          } else if (t.classList.contains("incorrect")) {
            var id = t.getAttribute("data-q");
            if (!id || !state.counted[id]) registerIncorrect(t);
          }
        }
      });
      obs.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    } catch (_e) {}
  }

  /* ── Init ── */
  function init() {
    try {
      if (!document.body) return;
      if (window.NTJuice && window.NTJuice.__started) return;
      window.NTJuice.__started = true;

      applyTheme();

      // Restore prior progress for this page (best-effort).
      var stored = loadStore();
      if (stored && typeof stored === "object") {
        state.xp = +stored.xp || 0;
        state.level = levelForXp(state.xp);
        state.bestStreak = +stored.bestStreak || 0;
        state.certShown = !!stored.certShown;
        if (stored.counted && typeof stored.counted === "object") state.counted = stored.counted;
      }

      buildHud();
      scanInitial();
      renderHud();
      watch();

      // First user gesture unlocks audio (browsers gate AudioContext).
      var unlock = function () {
        var ac = ctx();
        if (ac && ac.state === "suspended") {
          try {
            ac.resume();
          } catch (_e) {}
        }
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
      };
      document.addEventListener("pointerdown", unlock, { once: true });
      document.addEventListener("keydown", unlock, { once: true });
    } catch (_e) {
      /* never break the lesson */
    }
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  window.NTJuice = {
    __loaded: true,
    __started: false,
    init: function () {
      ready(init);
      return window.NTJuice;
    },
    // Manual hooks for lessons that want to drive the layer directly.
    chime: chime,
    toggleMute: toggleMute,
    getState: function () {
      return {
        total: state.total,
        completed: state.completed,
        streak: state.streak,
        bestStreak: state.bestStreak,
        xp: state.xp,
        level: state.level,
      };
    },
    version: "1.0.0",
  };

  // Auto-init so the injector only needs to drop the <script>; explicit
  // NTJuice.init() is still safe (idempotent via __started).
  window.NTJuice.init();
})();
