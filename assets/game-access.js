// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* Neft Calm & Accessible Games layer (additive, gameplay-neutral).
 * Injected by tools/inject-game-access.js. Pairs with assets/game-access.css.
 *
 * Provides, with zero network calls and no dependencies:
 *   1. TTS "Read aloud" — speaks the visible game prompt via the Web Speech API,
 *      language-aware (EN/ES) for ESOL learners. (The only student-facing button.)
 *   2. Calm mode — no button; motion is damped automatically for users whose OS
 *      requests reduced motion (see the CSS media query). window.NeftCalm.setCalm()
 *      remains for programmatic use.
 *   3. Growth-mindset helper — window.NeftCalm.encourage() shows a "not yet"
 *      toast. Passive: games may call it, nothing is forced.
 *
 * Fail-safe: every step is wrapped so a game keeps running if anything here
 * throws or an API (speechSynthesis) is unavailable.
 */
(function () {
  "use strict";

  if (window.__neftGameAccess) return; // idempotent
  window.__neftGameAccess = true;

  var CALM_KEY = "nt-calm-mode";
  var TEXT_KEY = "nt-text-size"; // "0" normal | "1" large | "2" x-large
  var doc = document;

  function ready(fn) {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  /* ---------- language detection for TTS ---------- */
  function pickLang(text) {
    var htmlLang = (doc.documentElement.getAttribute("lang") || "").toLowerCase();
    if (htmlLang.indexOf("es") === 0) return "es-ES";
    if (htmlLang.indexOf("fr") === 0) return "fr-FR";
    if (htmlLang.indexOf("ar") === 0) return "ar-SA";
    if (htmlLang.indexOf("ht") === 0) return "ht-HT";
    if (htmlLang.indexOf("uk") === 0) return "uk-UA";
    // Heuristic: Spanish-specific characters / stopwords in the read text.
    if (/[¿¡ñ]|(\b(el|la|los|las|una|resuelve|calcula|fracci[oó]n|consejos)\b)/i.test(text)) {
      return "es-ES";
    }
    if (/[éèêëàâùûç]|(\b(le|la|les|une|résous|calcule|fraction)\b)/i.test(text)) {
      return "fr-FR";
    }
    if (/[\u0600-\u06FF]/.test(text)) {
      return "ar-SA";
    }
    if (/[іїєґ]/.test(text)) {
      return "uk-UA";
    }
    return "en-US";
  }

  /* ---------- collect the "current prompt" text to read ---------- */
  function readableText() {
    // Prefer an explicit opt-in region if a game marks one.
    var marked = doc.querySelector(
      "[data-read-aloud], .nt-read-aloud, .question, .prompt, .problem",
    );
    var root = marked || doc.querySelector("main, #game, #app, .game, body");
    if (!root) return "";
    // Clone, strip our own controls + script/style, collapse whitespace.
    var clone = root.cloneNode(true);
    clone
      .querySelectorAll(".nt-ga-controls, .nt-ga-toast, script, style, noscript, svg")
      .forEach(function (n) {
        n.remove();
      });
    var txt = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
    return txt.slice(0, 600); // keep it a sensible utterance length
  }

  /* ---------- TTS ---------- */
  var speaking = false;
  function speak(btn) {
    try {
      var synth = window.speechSynthesis;
      if (!synth) return;
      if (speaking) {
        synth.cancel();
        return; // toggle off; onend resets state
      }
      var text = readableText();
      if (!text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = pickLang(text);
      u.rate = 0.95;
      u.onstart = function () {
        speaking = true;
        if (btn) btn.classList.add("nt-ga-speaking");
      };
      u.onend = u.onerror = function () {
        speaking = false;
        if (btn) btn.classList.remove("nt-ga-speaking");
      };
      synth.cancel();
      synth.speak(u);
    } catch (_e) {
      /* speech unsupported — silently ignore */
    }
  }

  /* ---------- WonderPass Avatar & Star Aggregation ---------- */
  var WONDERPASS_KEY = "ewl-wonderpass-v1";
  function getWonderPass() {
    try {
      var raw = localStorage.getItem(WONDERPASS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_e) {}
    return { stars: 0, avatar: "🧙‍♂️", title: "Math Adventurer", badge: "Level 1" };
  }

  function addWonderPassStars(count, gameId) {
    try {
      var pass = getWonderPass();
      pass.stars = (pass.stars || 0) + (count || 1);
      pass.games = pass.games || {};
      pass.games[gameId || "general"] = (pass.games[gameId || "general"] || 0) + (count || 1);
      if (pass.stars >= 50) {
        pass.title = "Math Mastermind";
        pass.avatar = "👑";
        pass.badge = "Level 4";
      } else if (pass.stars >= 25) {
        pass.title = "Problem Solver";
        pass.avatar = "🦁";
        pass.badge = "Level 3";
      } else if (pass.stars >= 10) {
        pass.title = "Arcade Hero";
        pass.avatar = "🚀";
        pass.badge = "Level 2";
      }
      localStorage.setItem(WONDERPASS_KEY, JSON.stringify(pass));
      updateWonderPassChip();
    } catch (_e) {}
  }

  function updateWonderPassChip() {
    try {
      var pass = getWonderPass();
      var chip = doc.getElementById("ewl-wonderpass-chip");
      if (chip) {
        chip.innerHTML =
          '<span class="wp-avatar">' +
          pass.avatar +
          '</span> <span class="wp-stars">⭐ ' +
          pass.stars +
          '</span> <span class="wp-title">' +
          pass.title +
          "</span>";
      }
    } catch (_e) {}
  }

  /* ---------- Calm mode ---------- */
  function applyCalm(on) {
    doc.documentElement.classList.toggle("nt-calm", !!on);
  }
  function setCalm(on, btn) {
    try {
      localStorage.setItem(CALM_KEY, on ? "1" : "0");
    } catch (_e) {}
    applyCalm(on);
    if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  /* ---------- Text size ---------- */
  var TEXT_CLASSES = ["nt-text-lg", "nt-text-xl"];
  function applyText(step) {
    var root = doc.documentElement;
    TEXT_CLASSES.forEach(function (c) {
      root.classList.remove(c);
    });
    if (step === 1) root.classList.add("nt-text-lg");
    else if (step === 2) root.classList.add("nt-text-xl");
  }
  function currentText() {
    var v = 0;
    try {
      v = parseInt(localStorage.getItem(TEXT_KEY) || "0", 10) || 0;
    } catch (_e) {}
    return v < 0 || v > 2 ? 0 : v;
  }
  function _cycleText(btn) {
    var next = (currentText() + 1) % 3;
    try {
      localStorage.setItem(TEXT_KEY, String(next));
    } catch (_e) {}
    applyText(next);
    if (btn) {
      btn.setAttribute("aria-pressed", next ? "true" : "false");
      var labels = ["Text size: normal", "Text size: large", "Text size: extra large"];
      btn.title = labels[next];
      btn.setAttribute("aria-label", labels[next]);
    }
  }

  /* ---------- Growth-mindset toast (public API) ---------- */
  var toastEl = null;
  var toastTimer = null;
  function encourage(msg) {
    try {
      if (!toastEl) {
        toastEl = doc.createElement("div");
        toastEl.className = "nt-ga-toast";
        toastEl.setAttribute("role", "status");
        toastEl.setAttribute("aria-live", "polite");
        doc.body.appendChild(toastEl);
      }
      toastEl.textContent = msg || "Not yet — try again 💪";
      toastEl.classList.add("nt-ga-show");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toastEl.classList.remove("nt-ga-show");
      }, 2600);
    } catch (_e) {}
  }

  /* ---------- Math Talk Coach (Voice Spoken Reasoning) ---------- */
  var MATH_KEYWORDS = [
    "factor",
    "prime",
    "composite",
    "multiple",
    "ratio",
    "rate",
    "percent",
    "fraction",
    "area",
    "volume",
    "equation",
    "expression",
    "variable",
    "coordinate",
    "mean",
    "median",
    "range",
  ];

  function startMathTalkCoach(btn) {
    try {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        encourage("🎙️ Math Talk requires Chrome/Edge speech support.");
        return;
      }
      var recog = new SpeechRecognition();
      recog.lang = pickLang(readableText());
      recog.interimResults = false;
      recog.maxAlternatives = 1;

      if (btn) btn.classList.add("nt-ga-listening");
      encourage("🎙️ Listening... Explain your math solution out loud!");

      recog.onresult = function (evt) {
        var transcript = evt.results[0][0].transcript.toLowerCase();
        var foundKeywords = MATH_KEYWORDS.filter(function (k) {
          return transcript.indexOf(k) !== -1;
        });
        if (btn) btn.classList.remove("nt-ga-listening");

        if (foundKeywords.length > 0) {
          encourage("🎙️ Orator Badge Earned! Used: " + foundKeywords.join(", ") + " 🌟");
          addWonderPassStars(2, "math-talk");
        } else {
          encourage(
            '🎙️ Recorded: "' + transcript.slice(0, 45) + '..." — Try using target math words!',
          );
        }
      };

      recog.onerror = recog.onend = function () {
        if (btn) btn.classList.remove("nt-ga-listening");
      };

      recog.start();
    } catch (_e) {
      encourage("🎙️ Mic permission needed for Math Talk Coach.");
    }
  }

  /* ---------- Socratic Math Talk Engine ---------- */
  function triggerMathCoach() {
    try {
      encourage("💡 Math Coach: Try decomposing or drawing a visual model!");
    } catch (_e) {}
  }

  /* ---------- Universal Switch Accessibility Engine ---------- */
  var switchElements = [];
  var switchIndex = -1;

  function _initSwitchAccess() {
    try {
      window.addEventListener("keydown", function (evt) {
        // Space / Tab for Switch Scanning
        if (evt.key === "Tab" && evt.shiftKey === false) {
          scanSwitchTargets();
        }
      });
    } catch (_e) {}
  }

  function scanSwitchTargets() {
    try {
      switchElements = [].slice.call(
        doc.querySelectorAll("button, [role='button'], .opt, .choice, input"),
      );
      if (switchElements.length === 0) return;
      if (switchIndex >= 0 && switchElements[switchIndex]) {
        switchElements[switchIndex].classList.remove("nt-ga-switch-target");
      }
      switchIndex = (switchIndex + 1) % switchElements.length;
      var target = switchElements[switchIndex];
      if (target) {
        target.classList.add("nt-ga-switch-target");
        target.focus();
      }
    } catch (_e) {}
  }

  /* ---------- build the floating control cluster ---------- */
  function build() {
    /* Side buttons (Read, Talk, Lo-Fi, etc.) removed from all games per user request */
    return;
  }

  // Public, passive API for games that want to opt in.
  window.NeftCalm = {
    encourage: encourage,
    speak: function () {
      speak(null);
    },
    setCalm: function (on) {
      setCalm(!!on, null);
    },
    addStars: addWonderPassStars,
    getWonderPass: getWonderPass,
    triggerCoach: triggerMathCoach,
    startMathTalk: startMathTalkCoach,
  };

  window.WonderPass = {
    addStars: addWonderPassStars,
    getProfile: getWonderPass,
  };

  try {
    applyText(currentText());
  } catch (_e) {}

  ready(build);
})();
