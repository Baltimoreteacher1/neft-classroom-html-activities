/*!
 * lesson-passport.js — Neft Lesson Platform · Student Passport (premium meta-layer).
 *
 * A persistent, cross-curriculum student profile that turns the per-lesson XP
 * the juice layer already shows into a lifetime identity: total XP + level,
 * a DAILY practice streak (true habit loop), distinct lessons touched/mastered,
 * and an achievement (badge) system. One small floating "passport" pill lives
 * in the only free corner (top-left); clicking it opens a profile panel.
 *
 * Why this is the missing premium piece: lesson-juice persists XP/streak keyed
 * PER lesson slug (STORE_KEY + ":" + slug), so progress is siloed and resets the
 * sense of momentum on every page. The Passport aggregates across every lesson
 * under one localStorage key (nt_passport) so a student carries one growing
 * record through the whole math program.
 *
 * Integration (all best-effort, never fatal):
 *   - Wraps window.NTtelemetry.track (idempotent) as a read-only tap so it
 *     ingests the signals the platform already emits: item_attempt (correct),
 *     lesson_complete, mastery_reached. No new tracking, no network.
 *   - Reuses the shared identity in localStorage "nt_student" for the name.
 *   - Honors prefers-reduced-motion and window.NT_MUTED. Idempotent boot.
 *
 * Hard rules (mirrors sibling layers): never throws into the host lesson,
 * every DOM lookup null-checked, single window sentinel, no external deps.
 *
 * Exposes window.NTPassport with init(), award(xp, reason), get() (read-only
 * snapshot), and open()/close() for the panel.
 */
(function () {
  "use strict";

  if (window.NTPassport && window.NTPassport.__booted) return;

  var STORE_KEY = "nt_passport";
  var XP_PER_LEVEL = 250; // lifetime band; wider than the per-lesson juice band
  var XP_CORRECT = 15; // a correct first attempt
  var XP_LESSON_COMPLETE = 60;
  var XP_MASTERY = 120;

  var reduce = false;
  try {
    reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function muted() {
    return !!window.NT_MUTED;
  }

  /* ── Date helpers (local day keys) ─────────────────────────────────────── */
  function dayKey(d) {
    var x = d || new Date();
    return (
      x.getFullYear() +
      "-" +
      String(x.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(x.getDate()).padStart(2, "0")
    );
  }
  function daysBetween(a, b) {
    // a, b are "YYYY-MM-DD"; returns whole-day difference b - a.
    try {
      var pa = a.split("-"),
        pb = b.split("-");
      var ta = Date.UTC(+pa[0], +pa[1] - 1, +pa[2]);
      var tb = Date.UTC(+pb[0], +pb[1] - 1, +pb[2]);
      return Math.round((tb - ta) / 86400000);
    } catch (e) {
      return 99;
    }
  }

  /* ── Persistence ───────────────────────────────────────────────────────── */
  var defaultState = function () {
    return {
      v: 1,
      xp: 0,
      lessons: {}, // slug -> { touched: 1, complete: 0, mastered: 0 }
      daily: 0, // current consecutive-day streak
      bestDaily: 0,
      lastDay: "", // last active local day key
      badges: {}, // id -> earned day key
      created: dayKey(),
    };
  };

  var state = defaultState();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === "object") {
          state = Object.assign(defaultState(), o);
          if (!state.lessons || typeof state.lessons !== "object") state.lessons = {};
          if (!state.badges || typeof state.badges !== "object") state.badges = {};
        }
      }
    } catch (e) {}
  }
  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function pageSlug() {
    try {
      var p = location.pathname.replace(/\/index\.html?$/i, "/");
      return p.replace(/^\/+|\/+$/g, "") || "home";
    } catch (e) {
      return "home";
    }
  }

  function levelForXp(xp) {
    return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  }
  function levelProgress(xp) {
    var into = xp % XP_PER_LEVEL;
    return Math.max(0, Math.min(1, into / XP_PER_LEVEL));
  }

  function lessonStats() {
    var touched = 0,
      mastered = 0,
      complete = 0;
    for (var k in state.lessons) {
      if (!state.lessons.hasOwnProperty(k)) continue;
      var l = state.lessons[k];
      touched++;
      if (l && l.mastered) mastered++;
      if (l && l.complete) complete++;
    }
    return { touched: touched, mastered: mastered, complete: complete };
  }

  /* ── Badge catalog ─────────────────────────────────────────────────────── */
  var BADGES = [
    {
      id: "first_steps",
      icon: "🌱",
      name: "First Steps",
      desc: "Earn your first XP",
    },
    {
      id: "streak3",
      icon: "🔥",
      name: "On a Roll",
      desc: "3-day practice streak",
    },
    {
      id: "streak7",
      icon: "⚡",
      name: "Week Warrior",
      desc: "7-day practice streak",
    },
    {
      id: "streak30",
      icon: "🏔️",
      name: "Unstoppable",
      desc: "30-day practice streak",
    },
    { id: "level5", icon: "⭐", name: "Rising Star", desc: "Reach Level 5" },
    { id: "level10", icon: "🌟", name: "All-Star", desc: "Reach Level 10" },
    { id: "level20", icon: "💫", name: "Legend", desc: "Reach Level 20" },
    {
      id: "explorer5",
      icon: "🧭",
      name: "Explorer",
      desc: "Practice 5 different lessons",
    },
    {
      id: "scholar15",
      icon: "📚",
      name: "Scholar",
      desc: "Practice 15 different lessons",
    },
    {
      id: "master5",
      icon: "🎯",
      name: "Sharp Shooter",
      desc: "Master 5 lessons",
    },
    {
      id: "master10",
      icon: "🏆",
      name: "Math Champion",
      desc: "Master 10 lessons",
    },
    {
      id: "xp1000",
      icon: "💎",
      name: "Gem Collector",
      desc: "Earn 1,000 lifetime XP",
    },
    {
      id: "xp5000",
      icon: "👑",
      name: "Math Royalty",
      desc: "Earn 5,000 lifetime XP",
    },
  ];
  function badgeById(id) {
    for (var i = 0; i < BADGES.length; i++) if (BADGES[i].id === id) return BADGES[i];
    return null;
  }

  function checkBadges() {
    var lvl = levelForXp(state.xp);
    var s = lessonStats();
    var earned = [];
    function grant(id) {
      if (!state.badges[id]) {
        state.badges[id] = dayKey();
        earned.push(id);
      }
    }
    if (state.xp > 0) grant("first_steps");
    if (state.daily >= 3) grant("streak3");
    if (state.daily >= 7) grant("streak7");
    if (state.daily >= 30) grant("streak30");
    if (lvl >= 5) grant("level5");
    if (lvl >= 10) grant("level10");
    if (lvl >= 20) grant("level20");
    if (s.touched >= 5) grant("explorer5");
    if (s.touched >= 15) grant("scholar15");
    if (s.mastered >= 5) grant("master5");
    if (s.mastered >= 10) grant("master10");
    if (state.xp >= 1000) grant("xp1000");
    if (state.xp >= 5000) grant("xp5000");
    return earned;
  }

  /* ── Daily streak ──────────────────────────────────────────────────────── */
  function touchDay() {
    var today = dayKey();
    if (state.lastDay === today) return;
    if (!state.lastDay) {
      state.daily = 1;
    } else {
      var gap = daysBetween(state.lastDay, today);
      if (gap === 1) state.daily += 1;
      else if (gap > 1) state.daily = 1; // missed a day → reset
      // gap <= 0 (clock skew) → leave as-is
    }
    state.lastDay = today;
    if (state.daily > state.bestDaily) state.bestDaily = state.daily;
  }

  /* ── Identity ──────────────────────────────────────────────────────────── */
  function studentName() {
    try {
      var raw = localStorage.getItem("nt_student");
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.name) return String(o.name);
      }
    } catch (e) {}
    try {
      if (window.NeftSaveResume && typeof window.NeftSaveResume.getTeacherSummary === "function") {
        var sm = window.NeftSaveResume.getTeacherSummary();
        if (sm && sm.studentName) return String(sm.studentName);
      }
    } catch (e) {}
    return "";
  }
  function initials(name) {
    if (!name) return "👤";
    var parts = String(name).trim().split(/\s+/);
    var a = parts[0] ? parts[0][0] : "";
    var b = parts[1] ? parts[1][0] : "";
    return (a + b).toUpperCase() || "👤";
  }

  /* ── Core mutation: award XP + recompute ───────────────────────────────── */
  var nodes = {};
  function award(xp, reason) {
    xp = Math.max(0, Math.floor(xp || 0));
    var beforeLevel = levelForXp(state.xp);
    if (xp > 0) state.xp += xp;
    touchDay();
    var newBadges = checkBadges();
    persist();
    render();
    var afterLevel = levelForXp(state.xp);
    if (afterLevel > beforeLevel) celebrate("Level " + afterLevel + "! 🎉");
    for (var i = 0; i < newBadges.length; i++) {
      var b = badgeById(newBadges[i]);
      if (b) toastBadge(b);
    }
    return state.xp;
  }

  function noteLesson(slug, kind) {
    slug = slug || pageSlug();
    var l = state.lessons[slug] || { touched: 1, complete: 0, mastered: 0 };
    l.touched = 1;
    if (kind === "complete") l.complete = 1;
    if (kind === "mastered") {
      l.mastered = 1;
      l.complete = 1;
    }
    state.lessons[slug] = l;
  }

  /* ── Telemetry tap (read-only wrap; idempotent) ────────────────────────── */
  function wrapTelemetry() {
    try {
      var t = window.NTtelemetry;
      if (!t || typeof t.track !== "function" || t.__passportTap) return false;
      var orig = t.track;
      t.track = function (event, props) {
        try {
          ingest(event, props || {});
        } catch (e) {}
        return orig.apply(this, arguments);
      };
      t.__passportTap = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  var seenLessonComplete = false;
  function ingest(event, props) {
    if (event === "item_attempt") {
      // Count a correct first-try item as XP toward the lifetime profile.
      if (props && (props.correct === true || props.first_try_correct === true)) {
        noteLesson(pageSlug(), null);
        award(XP_CORRECT, "correct");
      } else {
        noteLesson(pageSlug(), null);
        touchDay();
        persist();
        render();
      }
    } else if (event === "lesson_complete") {
      if (!seenLessonComplete) {
        seenLessonComplete = true;
        noteLesson(pageSlug(), "complete");
        award(XP_LESSON_COMPLETE, "lesson_complete");
      }
    } else if (event === "mastery_reached") {
      noteLesson(pageSlug(), "mastered");
      award(XP_MASTERY, "mastery");
    }
  }

  /* ── UI ────────────────────────────────────────────────────────────────── */
  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  function buildPill() {
    if (nodes.pill) return;
    var pill = el("button", "ntp-pill", {
      type: "button",
      "aria-label": "Open my passport",
      title: "My Passport — lifetime progress",
    });
    pill.innerHTML =
      '<span class="ntp-pill-ring"><span class="ntp-pill-avatar"></span></span>' +
      '<span class="ntp-pill-meta">' +
      '<span class="ntp-pill-lvl"></span>' +
      '<span class="ntp-pill-streak"></span>' +
      "</span>";
    pill.addEventListener("click", open);
    nodes.pill = pill;
    nodes.avatar = pill.querySelector(".ntp-pill-avatar");
    nodes.lvl = pill.querySelector(".ntp-pill-lvl");
    nodes.streak = pill.querySelector(".ntp-pill-streak");
    document.body.appendChild(pill);
  }

  function buildPanel() {
    if (nodes.panel) return;
    var ov = el("div", "ntp-overlay", {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "My Passport",
    });
    var panel = el("div", "ntp-panel");
    panel.innerHTML =
      '<button class="ntp-close" type="button" aria-label="Close passport">×</button>' +
      '<div class="ntp-hero">' +
      '<div class="ntp-hero-ring"><span class="ntp-hero-avatar"></span><svg class="ntp-arc" viewBox="0 0 120 120" aria-hidden="true"><circle class="ntp-arc-bg" cx="60" cy="60" r="52"></circle><circle class="ntp-arc-fg" cx="60" cy="60" r="52"></circle></svg></div>' +
      '<div class="ntp-hero-txt"><div class="ntp-name"></div><div class="ntp-level"></div><div class="ntp-xpbar"><span class="ntp-xpfill"></span></div><div class="ntp-xpnote"></div></div>' +
      "</div>" +
      '<div class="ntp-stats">' +
      '<div class="ntp-stat"><span class="ntp-stat-v ntp-daily"></span><span class="ntp-stat-l">🔥 day streak</span></div>' +
      '<div class="ntp-stat"><span class="ntp-stat-v ntp-touched"></span><span class="ntp-stat-l">📘 lessons</span></div>' +
      '<div class="ntp-stat"><span class="ntp-stat-v ntp-mastered"></span><span class="ntp-stat-l">🎯 mastered</span></div>' +
      "</div>" +
      '<div class="ntp-badges-h">Achievements</div>' +
      '<div class="ntp-badges"></div>';
    ov.appendChild(panel);
    ov.addEventListener("click", function (e) {
      if (e.target === ov) close();
    });
    panel.querySelector(".ntp-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && ov.classList.contains("is-open")) close();
    });
    nodes.overlay = ov;
    nodes.panel = panel;
    document.body.appendChild(ov);
  }

  function renderPanel() {
    if (!nodes.panel) return;
    var name = studentName();
    var lvl = levelForXp(state.xp);
    var s = lessonStats();
    var p = levelProgress(state.xp);
    var q = nodes.panel.querySelector.bind(nodes.panel);
    q(".ntp-hero-avatar").textContent = initials(name);
    q(".ntp-name").textContent = name || "Math Explorer";
    q(".ntp-level").textContent = "Level " + lvl;
    q(".ntp-xpfill").style.width = Math.round(p * 100) + "%";
    var into = state.xp % XP_PER_LEVEL;
    q(".ntp-xpnote").textContent =
      state.xp.toLocaleString() + " XP · " + (XP_PER_LEVEL - into) + " to next level";
    var arc = q(".ntp-arc-fg");
    if (arc) {
      var C = 2 * Math.PI * 52;
      arc.style.strokeDasharray = C;
      arc.style.strokeDashoffset = C * (1 - p);
    }
    q(".ntp-daily").textContent = state.daily;
    q(".ntp-touched").textContent = s.touched;
    q(".ntp-mastered").textContent = s.mastered;
    var grid = q(".ntp-badges");
    grid.innerHTML = "";
    for (var i = 0; i < BADGES.length; i++) {
      var b = BADGES[i];
      var earned = !!state.badges[b.id];
      var cell = el("div", "ntp-badge" + (earned ? " is-earned" : " is-locked"), {
        title: b.name + " — " + b.desc + (earned ? "" : " (locked)"),
      });
      cell.innerHTML =
        '<span class="ntp-badge-i">' +
        (earned ? b.icon : "🔒") +
        "</span>" +
        '<span class="ntp-badge-n">' +
        b.name +
        "</span>";
      grid.appendChild(cell);
    }
  }

  function render() {
    if (!nodes.pill) return;
    var lvl = levelForXp(state.xp);
    if (nodes.avatar) nodes.avatar.textContent = initials(studentName());
    if (nodes.lvl) nodes.lvl.textContent = "Lv " + lvl;
    if (nodes.streak) nodes.streak.textContent = state.daily > 0 ? "🔥 " + state.daily : "";
    if (nodes.pill) {
      var p = levelProgress(state.xp);
      nodes.pill.style.setProperty("--ntp-prog", Math.round(p * 360) + "deg");
    }
    if (nodes.overlay && nodes.overlay.classList.contains("is-open")) renderPanel();
  }

  function open() {
    buildPanel();
    renderPanel();
    nodes.overlay.classList.add("is-open");
  }
  function close() {
    if (nodes.overlay) nodes.overlay.classList.remove("is-open");
  }

  /* ── Celebration toasts ────────────────────────────────────────────────── */
  function celebrate(text) {
    fx();
    showToast(text, "ntp-toast-level");
  }
  function toastBadge(b) {
    fx();
    showToast(b.icon + "  " + b.name + " unlocked!", "ntp-toast-badge");
  }
  function fx() {
    if (reduce || muted()) return;
    try {
      if (window.GameFX && typeof window.GameFX.burst === "function") {
        window.GameFX.burst(40, 60);
      }
    } catch (e) {}
  }
  function showToast(text, cls) {
    try {
      var t = el("div", "ntp-toast " + (cls || ""));
      t.textContent = text;
      document.body.appendChild(t);
      requestAnimationFrame(function () {
        t.classList.add("is-in");
      });
      setTimeout(function () {
        t.classList.remove("is-in");
        setTimeout(function () {
          if (t.parentNode) t.parentNode.removeChild(t);
        }, 400);
      }, 2600);
    } catch (e) {}
  }

  /* ── Boot ──────────────────────────────────────────────────────────────── */
  function init() {
    if (window.NTPassport && window.NTPassport.__booted) return;
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", init, { once: true });
      return;
    }
    load();
    // Record a visit to this lesson + advance the day streak even before any
    // correct answer, so simply opening a lesson each day keeps the streak alive.
    noteLesson(pageSlug(), null);
    touchDay();
    checkBadges();
    persist();
    buildPill();
    render();
    // Tap telemetry now and shortly after (it may boot a beat later).
    if (!wrapTelemetry()) {
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (wrapTelemetry() || tries > 20) clearInterval(iv);
      }, 300);
    }
    window.NTPassport.__booted = true;
  }

  window.NTPassport = {
    __booted: false,
    init: init,
    award: award,
    open: open,
    close: close,
    get: function () {
      return JSON.parse(JSON.stringify(state));
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
