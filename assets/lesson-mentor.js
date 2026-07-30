/*!
 * lesson-mentor.js — Neft Lesson Platform · Math Mentor (identity layer).
 *
 * Carries the mentor a student chose in Unit 0 (/mentor-lab/) through every
 * lesson, small group, game and project on the platform. Registered in the
 * LAYERS manifest of assets/lesson-platform.js, so it reaches every page
 * through the single existing platform tag — ZERO per-lesson edits.
 *
 * WHAT A MENTOR IS (and is not):
 *   A mentor is someone a student works WITH, not a costume they wear. This
 *   layer never speaks in the mentor's voice, never uses first person for a
 *   real person who lived, and never asks a student to pretend to be one. What
 *   the mentor gives is a THINKING MOVE — their lab — that applies to the math
 *   actually on the page.
 *
 * HARD RULES:
 *   - Skippable. A student with no mentor loses nothing; the layer shows one
 *     quiet chip and otherwise stays out of the way. Never a blocking modal.
 *   - Never earned. A mentor is not a reward and is not performance-gated;
 *     gating it would turn the roster into a status hierarchy.
 *   - Struggle, not trophies. The story offered after a hard stretch is about
 *     the hard part. Achievement-only stories do nothing for the students who
 *     need them most, so this layer does not tell them.
 *
 * INTEGRATION (all best-effort, never fatal):
 *   - Read-only idempotent tap on window.NTtelemetry.track — the same pattern
 *     lesson-passport.js uses. No new tracking, no network, no D1 writes.
 *   - Own storage key `nt_mentor`. Deliberately NOT nt_student, which has many
 *     writers (see the alias/name identity bug in docs/teaching-loop.md).
 *
 * Mirrors its sibling layers: never throws into the host lesson, every DOM
 * lookup null-checked, single window sentinel, honors prefers-reduced-motion
 * and window.NT_MUTED, no external dependencies.
 *
 * Exposes window.NTMentor with init(), get(), set(id), clear(), open(), close().
 */
(function () {
  "use strict";

  if (window.NTMentor && window.NTMentor.__booted) return;

  var STORE_KEY = "nt_mentor";
  var STATE_VERSION = 1;
  var UNIT0_URL = "/mentor-lab/";
  var BASE = "/assets/";
  var WRONG_BEFORE_STORY = 2; // incorrect attempts before ONE story offer

  var reduce = false;
  try {
    reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_e) {
    /* ignore */
  }

  /* ── session-only counters (never persisted) ───────────────────────────── */
  var wrongThisSession = 0;
  var storyOfferedThisSession = false;

  var els = {}; // pill, panel, toast
  var booted = false;

  function warn(msg, err) {
    try {
      if (window.console && console.warn) console.warn("[lesson-mentor] " + msg, err || "");
    } catch (_e) {
      /* ignore */
    }
  }

  /* ── state ─────────────────────────────────────────────────────────────── */

  function blank() {
    return {
      version: STATE_VERSION,
      id: null,
      chosenAt: null,
      moves: [],
      seenStories: [],
      lang: "en",
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      if (!s || typeof s !== "object") return blank();
      return {
        version: STATE_VERSION,
        id: typeof s.id === "string" ? s.id : null,
        chosenAt: s.chosenAt || null,
        moves: Array.isArray(s.moves) ? s.moves.slice() : [],
        seenStories: Array.isArray(s.seenStories) ? s.seenStories.slice() : [],
        // Set in Unit 0. This layer has no toggle of its own — it follows the
        // choice the student already made rather than resetting them to English.
        lang: s.lang === "es" ? "es" : "en",
      };
    } catch (_e) {
      return blank();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (_e) {
      /* quota or private mode — the layer still works for this session */
    }
  }

  var state = load();

  /* ── language ──────────────────────────────────────────────────────────────
   * Chosen in Unit 0 and carried on the shared record. The layer shows the
   * student's language for every mentor string, including the long story.
   */
  var STR = {
    en: {
      youWork: "You work with",
      sayIt: "say it",
      theirMove: "Their move",
      thought: "What they thought about",
      hard: "The hard part",
      collected: "Moves you have collected",
      of: "of",
      notYet: "not yet",
      visit: "Visit the mentor lab",
      choose: "Choose your mentor",
      chooseAria: "Choose your math mentor — opens Unit 0",
      close: "Close",
      hardToo: "had a hard time too",
      readHard: "Read the hard part",
      thatIs: "That is",
      sMove: "'s move",
      dismiss: "Dismiss",
    },
    es: {
      youWork: "Trabajas con",
      sayIt: "se dice",
      theirMove: "Su manera",
      thought: "En qué pensaban",
      hard: "La parte difícil",
      collected: "Maneras que has reunido",
      of: "de",
      notYet: "todavía no",
      visit: "Ir al laboratorio de mentores",
      choose: "Escoge tu mentor",
      chooseAria: "Escoge tu mentor de matemáticas — abre la Unidad 0",
      close: "Cerrar",
      hardToo: "también pasó por algo difícil",
      readHard: "Leer la parte difícil",
      thatIs: "Esa es la manera de",
      sMove: "",
      dismiss: "Descartar",
    },
  };

  function s_(key) {
    var L = STR[state.lang === "es" ? "es" : "en"] || STR.en;
    return L[key] != null ? L[key] : STR.en[key] || "";
  }

  function mField(m, field) {
    if (state.lang === "es" && m && m.es && m.es[field]) return m.es[field];
    return (m && m[field]) || "";
  }

  function labF(lab, field) {
    if (state.lang === "es" && lab && lab.es && lab.es[field]) return lab.es[field];
    return (lab && lab[field]) || "";
  }

  /* ── roster access (the roster may load after us) ──────────────────────── */

  function roster() {
    return window.NTMentorRoster && window.NTMentorRoster.__loaded ? window.NTMentorRoster : null;
  }

  function currentMentor() {
    var R = roster();
    return R && state.id ? R.getMentor(state.id) : null;
  }

  function currentLab() {
    var R = roster();
    var m = currentMentor();
    return R && m ? R.getLab(m.lab) : null;
  }

  function medallion(mentor, lab, size) {
    try {
      if (window.NTMentorAvatar && window.NTMentorAvatar.svg) {
        return window.NTMentorAvatar.svg(mentor, lab, size);
      }
    } catch (_e) {
      /* fall through */
    }
    return "";
  }

  /** Ensure a dependency script is present; resolve when it has defined `global`. */
  function ensureScript(file, global, done) {
    try {
      if (window[global]) return done();
      var existing = document.querySelector('script[src*="' + file + '"]');
      if (!existing) {
        var s = document.createElement("script");
        s.src = BASE + file;
        s.defer = true;
        s.onload = function () {
          done();
        };
        s.onerror = function () {
          warn("could not load " + file);
          done();
        };
        (document.head || document.documentElement).appendChild(s);
        return;
      }
      // Present but maybe not executed yet.
      var tries = 0;
      var t = setInterval(function () {
        if (window[global] || ++tries > 40) {
          clearInterval(t);
          done();
        }
      }, 25);
    } catch (e) {
      warn("ensureScript failed for " + file, e);
      done();
    }
  }

  function ensureCss() {
    try {
      var href = BASE + "lesson-mentor.css";
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for (var i = 0; i < links.length; i++) {
        if ((links[i].getAttribute("href") || "").indexOf("lesson-mentor.css") !== -1) return;
      }
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      (document.head || document.documentElement).appendChild(l);
    } catch (e) {
      warn("could not add stylesheet", e);
    }
  }

  /* ── small DOM helpers ─────────────────────────────────────────────────── */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── the pill (top-left corner) ────────────────────────────────────────── */

  function renderPill() {
    try {
      if (!document.body) return;
      if (els.pill && els.pill.parentNode) els.pill.parentNode.removeChild(els.pill);

      var mentor = currentMentor();
      var lab = currentLab();

      if (!mentor) {
        // No mentor yet: one quiet, ignorable invitation. Never a modal.
        var chip = el("a", "ntm-chip");
        chip.href = UNIT0_URL;
        chip.innerHTML =
          '<span class="ntm-chip-dot" aria-hidden="true">✦</span> ' + esc(s_("choose"));
        chip.setAttribute("aria-label", s_("chooseAria"));
        els.pill = chip;
        document.body.appendChild(chip);
        return;
      }

      var pill = el("button", "ntm-pill");
      pill.type = "button";
      pill.setAttribute("aria-label", "Your mentor: " + mentor.name + ". Open mentor panel.");
      pill.style.setProperty("--ntm-color", (lab && lab.color) || "#334155");
      pill.innerHTML =
        '<span class="ntm-pill-med" aria-hidden="true">' +
        medallion(mentor, lab, 30) +
        "</span>" +
        '<span class="ntm-pill-text">' +
        '<span class="ntm-pill-name">' +
        esc(mentor.name) +
        "</span>" +
        '<span class="ntm-pill-lab">' +
        esc(labF(lab, "name")) +
        "</span>" +
        "</span>";
      pill.addEventListener("click", function () {
        open();
      });
      els.pill = pill;
      document.body.appendChild(pill);
    } catch (e) {
      warn("renderPill failed", e);
    }
  }

  /* ── the panel ─────────────────────────────────────────────────────────── */

  function collectedHtml() {
    var R = roster();
    if (!R) return "";
    var out = "";
    for (var i = 0; i < R.labs.length; i++) {
      var lab = R.labs[i];
      var has = state.moves.indexOf(lab.id) !== -1;
      out +=
        '<li class="ntm-move' +
        (has ? " is-earned" : "") +
        '" style="--ntm-color:' +
        esc(lab.color) +
        '">' +
        '<span class="ntm-move-emblem" aria-hidden="true">' +
        esc(lab.emblem) +
        "</span>" +
        '<span class="ntm-move-body">' +
        '<span class="ntm-move-name">' +
        esc(labF(lab, "move")) +
        "</span>" +
        '<span class="ntm-move-lab">' +
        esc(labF(lab, "name")) +
        (has ? "" : " · " + esc(s_("notYet"))) +
        "</span>" +
        "</span>" +
        "</li>";
    }
    return out;
  }

  function buildPanel() {
    var mentor = currentMentor();
    var lab = currentLab();
    if (!mentor) return null;

    var wrap = el("div", "ntm-panel-wrap");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Your math mentor");

    var earned = state.moves.length;

    wrap.innerHTML =
      '<div class="ntm-backdrop" data-ntm-close="1"></div>' +
      '<div class="ntm-panel" style="--ntm-color:' +
      esc((lab && lab.color) || "#334155") +
      '">' +
      '<button class="ntm-close" type="button" data-ntm-close="1" aria-label="' +
      esc(s_("close")) +
      '">✕</button>' +
      '<div class="ntm-head">' +
      '<div class="ntm-head-med" aria-hidden="true">' +
      medallion(mentor, lab, 76) +
      "</div>" +
      '<div class="ntm-head-text">' +
      '<p class="ntm-eyebrow">' +
      esc(s_("youWork")) +
      "</p>" +
      "<h2>" +
      esc(mentor.name) +
      "</h2>" +
      '<p class="ntm-say">' +
      esc(s_("sayIt")) +
      ": " +
      esc(mentor.say) +
      "</p>" +
      '<p class="ntm-where">' +
      esc(mentor.years) +
      " · " +
      esc(mentor.where) +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="ntm-movecard">' +
      '<p class="ntm-eyebrow">' +
      esc(s_("theirMove")) +
      "</p>" +
      '<p class="ntm-movecard-move">' +
      esc(labF(lab, "move")) +
      "</p>" +
      '<p class="ntm-movecard-blurb">' +
      esc(labF(lab, "blurb")) +
      "</p>" +
      "</div>" +
      '<div class="ntm-section">' +
      '<p class="ntm-eyebrow">' +
      esc(s_("thought")) +
      "</p>" +
      "<p>" +
      esc(mField(mentor, "thought")) +
      "</p>" +
      "<p>" +
      esc(mField(mentor, "did")) +
      "</p>" +
      "</div>" +
      '<details class="ntm-story"' +
      (state.seenStories.indexOf(mentor.id) !== -1 ? "" : "") +
      ">" +
      "<summary>" +
      esc(s_("hard")) +
      "</summary>" +
      "<p>" +
      esc(mField(mentor, "struggle")) +
      "</p>" +
      "</details>" +
      '<div class="ntm-section">' +
      '<p class="ntm-eyebrow">' +
      esc(s_("collected")) +
      " · " +
      earned +
      " " +
      esc(s_("of")) +
      " 8</p>" +
      '<ul class="ntm-moves">' +
      collectedHtml() +
      "</ul>" +
      "</div>" +
      '<div class="ntm-foot">' +
      '<a class="ntm-link" href="' +
      UNIT0_URL +
      '">' +
      esc(s_("visit")) +
      "</a>" +
      "</div>" +
      "</div>";

    wrap.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t && t.getAttribute && t.getAttribute("data-ntm-close")) close();
    });

    var story = wrap.querySelector(".ntm-story");
    if (story) {
      story.addEventListener("toggle", function () {
        if (story.open && state.seenStories.indexOf(mentor.id) === -1) {
          state.seenStories.push(mentor.id);
          save(state);
        }
      });
    }

    return wrap;
  }

  function onKey(ev) {
    if (ev && ev.key === "Escape") close();
  }

  function open() {
    try {
      if (els.panel) return;
      var panel = buildPanel();
      if (!panel || !document.body) return;
      els.panel = panel;
      document.body.appendChild(panel);
      document.addEventListener("keydown", onKey);
      var c = panel.querySelector(".ntm-close");
      if (c && c.focus) c.focus();
    } catch (e) {
      warn("open failed", e);
    }
  }

  function close() {
    try {
      if (els.panel && els.panel.parentNode) els.panel.parentNode.removeChild(els.panel);
      els.panel = null;
      document.removeEventListener("keydown", onKey);
      if (els.pill && els.pill.focus) els.pill.focus();
    } catch (e) {
      warn("close failed", e);
    }
  }

  /* ── toast (move earned / story offer) ─────────────────────────────────── */

  function toast(html, onClick) {
    try {
      if (!document.body) return;
      if (els.toast && els.toast.parentNode) els.toast.parentNode.removeChild(els.toast);
      var lab = currentLab();
      var t = el("div", "ntm-toast" + (reduce ? " is-still" : ""));
      t.style.setProperty("--ntm-color", (lab && lab.color) || "#334155");
      t.innerHTML =
        '<div class="ntm-toast-body">' +
        html +
        "</div>" +
        '<button class="ntm-toast-x" type="button" aria-label="' + esc(s_("dismiss")) + '">✕</button>';
      t.querySelector(".ntm-toast-x").addEventListener("click", function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      });
      if (onClick) {
        var act = t.querySelector("[data-ntm-act]");
        if (act) {
          act.addEventListener("click", function () {
            if (t.parentNode) t.parentNode.removeChild(t);
            onClick();
          });
        }
      }
      els.toast = t;
      document.body.appendChild(t);
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 14000);
    } catch (e) {
      warn("toast failed", e);
    }
  }

  /* ── telemetry tap ─────────────────────────────────────────────────────── */

  /* Reinforcement, NOT collection.
   *
   * A mentor's lab is granted the moment they are chosen, so "earning" it again
   * on mastery would grant nothing while showing a "Move collected" toast — a
   * reward animation for a no-op. Moves are collected by actually PRACTISING a
   * lab's Try-It over in Unit 0 (see mentor-lab.js), which is the only place a
   * student does the thinking the move describes.
   *
   * So mastery here just names the move the student already holds, at the
   * moment it paid off. No false progress. */
  function reinforceMove() {
    var lab = currentLab();
    var mentor = currentMentor();
    if (!lab || !mentor) return;
    toast(
      "<strong>That is " + esc(mentor.name) + "'s move</strong><span>" + esc(lab.move) + "</span>",
    );
  }

  function offerStory() {
    var mentor = currentMentor();
    if (!mentor) return;
    if (storyOfferedThisSession) return;
    if (state.seenStories.indexOf(mentor.id) !== -1) return;
    storyOfferedThisSession = true;
    toast(
      "<strong>" +
        esc(mentor.name) +
        " " +
        esc(s_("hardToo")) +
        "</strong>" +
        '<button class="ntm-toast-act" type="button" data-ntm-act="1">' +
        esc(s_("readHard")) +
        "</button>",
      function () {
        open();
        try {
          var d = els.panel && els.panel.querySelector(".ntm-story");
          if (d) {
            d.open = true;
            d.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
          }
        } catch (_e) {
          /* ignore */
        }
      },
    );
  }

  function tapTelemetry() {
    try {
      var T = window.NTtelemetry;
      if (!T || typeof T.track !== "function") return false;
      if (T.__ntmTapped) return true;

      var original = T.track;
      T.track = function (event, props) {
        try {
          handle(event, props);
        } catch (e) {
          warn("tap handler failed", e);
        }
        return original.apply(this, arguments);
      };
      T.__ntmTapped = true;
      return true;
    } catch (e) {
      warn("could not tap telemetry", e);
      return false;
    }
  }

  function handle(event, props) {
    if (!state.id) return; // no mentor: the layer stays silent
    var p = props || {};

    if (event === "item_attempt") {
      // `correct` is the platform's own flag; anything explicitly false counts.
      if (p.correct === false) {
        wrongThisSession++;
        if (wrongThisSession >= WRONG_BEFORE_STORY) offerStory();
      }
      return;
    }

    if (event === "mastery_reached") {
      reinforceMove();
      return;
    }
  }

  /* ── boot ──────────────────────────────────────────────────────────────── */

  function start() {
    if (booted) return;
    booted = true;
    ensureCss();
    renderPill();

    // The telemetry layer boots before us in the manifest, but tolerate any
    // order: retry briefly, then give up quietly.
    if (!tapTelemetry()) {
      var tries = 0;
      var t = setInterval(function () {
        if (tapTelemetry() || ++tries > 40) clearInterval(t);
      }, 50);
    }
  }

  function init() {
    try {
      ensureScript("mentor-avatar.js", "NTMentorAvatar", function () {
        ensureScript("mentor-roster.js", "NTMentorRoster", function () {
          if (document.body) start();
          else document.addEventListener("DOMContentLoaded", start);
        });
      });
    } catch (e) {
      warn("init failed", e);
    }
  }

  /* ── public API ────────────────────────────────────────────────────────── */

  window.NTMentor = {
    __booted: true,
    init: init,
    get: function () {
      return {
        id: state.id,
        moves: state.moves.slice(),
        seenStories: state.seenStories.slice(),
        chosenAt: state.chosenAt,
      };
    },
    set: function (id) {
      var R = roster();
      if (!R || !R.getMentor(id)) return false;
      state.id = id;
      state.chosenAt = new Date().toISOString();
      var m = R.getMentor(id);
      if (m && state.moves.indexOf(m.lab) === -1) state.moves.push(m.lab);
      save(state);
      renderPill();
      return true;
    },
    clear: function () {
      state = blank();
      save(state);
      renderPill();
    },
    open: open,
    close: close,
  };

  init();
})();
