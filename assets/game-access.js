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
    // Heuristic: Spanish-specific characters / stopwords in the read text.
    if (/[¿¡ñ]|(\b(el|la|los|las|una|resuelve|calcula|fracci[oó]n)\b)/i.test(text)) {
      return "es-ES";
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
    } catch (e) {
      /* speech unsupported — silently ignore */
    }
  }

  /* ---------- Calm mode ---------- */
  function applyCalm(on) {
    doc.documentElement.classList.toggle("nt-calm", !!on);
  }
  function setCalm(on, btn) {
    try {
      localStorage.setItem(CALM_KEY, on ? "1" : "0");
    } catch (e) {}
    applyCalm(on);
    if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  /* ---------- Text size ---------- */
  // Scales the DOM/menu chrome (titles, instructions, buttons, our controls).
  // Applied as a root class so any game's HTML UI inherits it. Canvas-rendered
  // gameplay text is unaffected; this targets the readable HTML around it.
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
    } catch (e) {}
    return v < 0 || v > 2 ? 0 : v;
  }
  function cycleText(btn) {
    var next = (currentText() + 1) % 3;
    try {
      localStorage.setItem(TEXT_KEY, String(next));
    } catch (e) {}
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
    } catch (e) {}
  }

  /* ---------- build the floating control cluster ---------- */
  function build() {
    try {
      if (doc.querySelector(".nt-ga-controls")) return;
      var wrap = doc.createElement("div");
      wrap.className = "nt-ga-controls";

      // Read-aloud is the one student-facing control. Calm mode is handled
      // silently by the OS "reduce motion" setting (see the CSS media query) —
      // no button, since a manual toggle added clutter with little benefit on
      // these already-calm games. window.NeftCalm.setCalm() still exists for
      // programmatic use.
      var read = doc.createElement("button");
      read.type = "button";
      read.className = "nt-ga-btn";
      read.setAttribute("aria-label", "Read the problem aloud");
      read.title = "Read aloud";
      read.innerHTML = "🔊 <span>Read</span>";
      read.addEventListener("click", function () {
        speak(read);
      });

      // Text-size cycle — normal → large → x-large. Helps low-vision readers
      // and anyone on a small screen read the HTML instructions/menus.
      var textBtn = doc.createElement("button");
      textBtn.type = "button";
      textBtn.className = "nt-ga-btn nt-ga-text";
      var startStep = currentText();
      var startLabels = ["Text size: normal", "Text size: large", "Text size: extra large"];
      textBtn.title = startLabels[startStep];
      textBtn.setAttribute("aria-label", startLabels[startStep]);
      textBtn.setAttribute("aria-pressed", startStep ? "true" : "false");
      textBtn.innerHTML = 'A<span aria-hidden="true">+</span>';
      textBtn.addEventListener("click", function () {
        cycleText(textBtn);
      });

      wrap.appendChild(read);
      wrap.appendChild(textBtn);
      doc.body.appendChild(wrap);

      // Comfortable tap targets on obvious answer controls.
      doc.body.classList.add("nt-ga-tap-hint");

      // Stop speech when leaving the page.
      window.addEventListener("pagehide", function () {
        try {
          if (window.speechSynthesis) window.speechSynthesis.cancel();
        } catch (e) {}
      });
    } catch (e) {
      /* never break the game */
    }
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
  };

  // Apply any saved text-size preference as early as possible.
  try {
    applyText(currentText());
  } catch (e) {}

  ready(build);
})();
