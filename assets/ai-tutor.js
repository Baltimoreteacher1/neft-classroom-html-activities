/* Neft Teacher — AI Tutor client (additive, deploy-safe).
 *
 * Pairs with ai-tutor.css. Adds a floating, accessible tutor panel to any
 * lesson it is injected into:
 *   - Socratic "Hint" ladder (never gives the final answer).
 *   - "Explain why" (concept explanation).
 *   - "Give me another problem" (infinite on-level practice).
 *
 * It POSTs to /api/tutor with {mode, standard, itemText, studentWork, history}
 * and sends NO student PII (no names, no save codes). It reads the optional
 * window.NT_LESSON_STANDARD and the current problem text from the DOM. If the
 * endpoint is missing or errors, it shows a friendly "Tutor is offline right
 * now" state and the lesson keeps working — the tutor NEVER blocks the page.
 *
 * Hard rules: never throws into the host lesson (everything is guarded), every
 * DOM lookup is null-checked, motion respects prefers-reduced-motion, and a
 * global window.NT_MUTED flag is honored. Idempotent: loads at most once.
 * Namespacing: window.NeftTutor, `lp-tutor-` classes/ids (avoids NT_/nsr/gfx/
 * q-card collisions documented in the integration contract).
 */
(function () {
  "use strict";
  if (window.NeftTutor) return;

  var ENDPOINT = "/api/tutor";
  var MAX_HISTORY = 8; // turns sent upstream
  var reduce = !!(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // ---- small safe helpers -------------------------------------------------
  function muted() {
    return !!window.NT_MUTED;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clamp(s, n) {
    return typeof s === "string" ? s.slice(0, n) : "";
  }

  // Read the standard from the global hook or a badge on the page. Optional.
  function readStandard() {
    try {
      if (typeof window.NT_LESSON_STANDARD === "string") {
        return clamp(window.NT_LESSON_STANDARD, 40);
      }
      var badge = document.querySelector(".standard-badge,[data-standard]");
      if (badge) {
        var v = badge.getAttribute("data-standard") || badge.textContent || "";
        // Pull a CCSS-style token if present, else the trimmed text.
        var m = v.match(/[0-9]+\.?[A-Za-z]{1,3}\.?[A-Za-z0-9.]*/);
        return clamp((m ? m[0] : v).trim(), 40);
      }
    } catch (_e) {}
    return "";
  }

  // Find the problem the student is most likely looking at. Prefer a card that
  // is on-screen and not yet correct; fall back to the first card. Guarded.
  function currentItem() {
    try {
      var cards = document.querySelectorAll("article.q-card[data-q]");
      if (!cards.length) {
        // Fallback: any prominent prompt-like element.
        var p = document.querySelector(".q-prompt,.question,[class*='prompt']");
        return { text: p ? extractText(p) : "", work: "" };
      }
      var best = null;
      var bestScore = -Infinity;
      var vh = window.innerHeight || 800;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var rect = c.getBoundingClientRect();
        var visible = rect.bottom > 0 && rect.top < vh;
        var done = c.classList.contains("correct");
        // Score: prefer visible, not-done, nearer the top of viewport.
        var score = (visible ? 1000 : 0) + (done ? -500 : 0) - Math.abs(rect.top);
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (!best) best = cards[0];
      return { text: extractCardText(best), work: extractStudentWork(best) };
    } catch (_e) {
      return { text: "", work: "" };
    }
  }

  function extractText(node) {
    if (!node) return "";
    var t = (node.textContent || "").replace(/\s+/g, " ").trim();
    return clamp(t, 2000);
  }

  // Build a clean prompt from a card: prompt + option labels (no answer keys —
  // answers for MCQ live in JS, not the DOM, per the integration contract).
  function extractCardText(card) {
    var parts = [];
    var prompt = card.querySelector(".q-prompt");
    if (prompt) parts.push(extractText(prompt));
    var opts = card.querySelectorAll(".mc-btn,.tf-btn");
    if (opts.length) {
      var labels = [];
      for (var i = 0; i < opts.length; i++) {
        var txt = (opts[i].textContent || "").replace(/\s+/g, " ").trim();
        if (txt) labels.push(txt);
      }
      if (labels.length) parts.push("Choices: " + labels.join(" | "));
    }
    if (!parts.length) parts.push(extractText(card));
    return clamp(parts.join("\n"), 2000);
  }

  // Capture what the student typed/selected so far (never their name).
  function extractStudentWork(card) {
    var bits = [];
    try {
      var fills = card.querySelectorAll("input.fill-input");
      for (var i = 0; i < fills.length; i++) {
        var v = (fills[i].value || "").trim();
        if (v) bits.push(v);
      }
      var sel = card.querySelector(".mc-btn.selected,.tf-btn.selected");
      if (sel) bits.push("chose: " + (sel.textContent || "").replace(/\s+/g, " ").trim());
    } catch (_e) {}
    return clamp(bits.join("; "), 2000);
  }

  // ---- UI construction ----------------------------------------------------
  var state = {
    root: null,
    panel: null,
    log: null,
    launcher: null,
    actions: [],
    history: [], // [{role, text}]
    busy: false,
    liveProbe: null, // null=unknown, true/false after /health
  };

  function buildUI() {
    var root = el("div", "lp-tutor-root");

    var launcher = el("button", "lp-tutor-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.setAttribute("aria-expanded", "false");
    launcher.id = "lp-tutor-launcher";
    launcher.appendChild(el("span", "lp-tutor-launcher-icon", "💡")); // 💡
    launcher.appendChild(el("span", null, "Ask the Tutor"));
    launcher.addEventListener("click", openPanel);

    var panel = el("div", "lp-tutor-panel");
    panel.id = "lp-tutor-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "lp-tutor-title");
    panel.setAttribute("hidden", "");

    var header = el("div", "lp-tutor-header");
    var title = el("h2", "lp-tutor-title");
    title.id = "lp-tutor-title";
    title.appendChild(el("span", null, "💡")); // 💡
    title.appendChild(el("span", null, "Math Tutor"));
    var close = el("button", "lp-tutor-close", "×"); // ×
    close.type = "button";
    close.setAttribute("aria-label", "Close tutor");
    close.addEventListener("click", closePanel);
    header.appendChild(title);
    header.appendChild(close);

    var log = el("div", "lp-tutor-log");
    log.id = "lp-tutor-log";
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    log.setAttribute("aria-atomic", "false");

    var actions = el("div", "lp-tutor-actions");
    var defs = [
      { mode: "hint", icon: "🧭", label: "Hint" }, // 🧭
      { mode: "explain", icon: "📘", label: "Explain why" }, // 📘
      { mode: "another", icon: "🔁", label: "Another problem" }, // 🔁
    ];
    state.actions = [];
    defs.forEach(function (d) {
      var b = el("button", "lp-tutor-action");
      b.type = "button";
      b.setAttribute("data-mode", d.mode);
      b.appendChild(el("span", "lp-tutor-action-icon", d.icon));
      b.appendChild(el("span", null, d.label));
      b.addEventListener("click", function () {
        requestTutor(d.mode);
      });
      actions.appendChild(b);
      state.actions.push(b);
    });

    var foot = el("div", "lp-tutor-foot", "Hints guide you — they won't give the answer.");

    panel.appendChild(header);
    panel.appendChild(log);
    panel.appendChild(actions);
    panel.appendChild(foot);

    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
      }
    });

    state.root = root;
    state.panel = panel;
    state.log = log;
    state.launcher = launcher;
  }

  // ---- panel open/close ---------------------------------------------------
  function openPanel() {
    if (!state.root) return;
    state.root.classList.add("lp-tutor-open");
    state.panel.removeAttribute("hidden");
    state.launcher.setAttribute("aria-expanded", "true");
    if (!state.log.childNodes.length) {
      addMessage("tutor", "Hi! Pick an option below and I'll help you with the problem you're on.");
    }
    // Move focus into the dialog for keyboard users.
    var firstAction = state.actions[0];
    if (firstAction) {
      try {
        firstAction.focus();
      } catch (_e) {}
    }
    maybeProbeHealth();
  }

  function closePanel() {
    if (!state.root) return;
    state.root.classList.remove("lp-tutor-open");
    state.panel.setAttribute("hidden", "");
    state.launcher.setAttribute("aria-expanded", "false");
    try {
      state.launcher.focus();
    } catch (_e) {}
  }

  // ---- messages -----------------------------------------------------------
  function addMessage(kind, text) {
    if (!state.log) return null;
    var cls = "lp-tutor-msg lp-tutor-msg-" + kind;
    var node = el("div", cls, text);
    state.log.appendChild(node);
    scrollLog();
    return node;
  }

  function addTyping() {
    if (!state.log) return null;
    var wrap = el("div", "lp-tutor-msg lp-tutor-msg-tutor");
    var dots = el("span", "lp-tutor-typing");
    dots.setAttribute("aria-label", "Tutor is thinking");
    dots.appendChild(el("span"));
    dots.appendChild(el("span"));
    dots.appendChild(el("span"));
    wrap.appendChild(dots);
    state.log.appendChild(wrap);
    scrollLog();
    return wrap;
  }

  function scrollLog() {
    try {
      state.log.scrollTop = state.log.scrollHeight;
    } catch (_e) {}
  }

  function setBusy(on) {
    state.busy = on;
    state.actions.forEach(function (b) {
      b.disabled = on;
    });
  }

  function offlineMessage() {
    addMessage(
      "error",
      "Tutor is offline right now. Keep working — you can try the problem on your own, and ask again later.",
    );
  }

  // ---- network ------------------------------------------------------------
  function maybeProbeHealth() {
    if (state.liveProbe !== null) return;
    fetch(ENDPOINT + "/health", { method: "GET" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        state.liveProbe = !!(d && d.live);
        if (state.liveProbe === false) {
          addMessage("system", "The live tutor isn't set up on this site yet.");
        }
      })
      .catch(function () {
        // Leave unknown; the POST itself will reveal availability.
        state.liveProbe = null;
      });
  }

  function requestTutor(mode) {
    if (state.busy || !MODES_OK(mode)) return;

    var item = currentItem();
    if (!item.text) {
      addMessage(
        "system",
        "I couldn't find a problem on the page. Scroll to a question and try again.",
      );
      return;
    }

    // Echo the student's intent (no PII).
    addMessage(
      "student",
      mode === "hint"
        ? "Give me a hint."
        : mode === "explain"
          ? "Explain why this works."
          : "Give me another problem like this.",
    );

    setBusy(true);
    var typing = addTyping();

    var payload = {
      mode: mode,
      standard: readStandard(),
      itemText: item.text,
      studentWork: item.work,
      history: state.history.slice(-MAX_HISTORY),
    };

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r
          .json()
          .catch(function () {
            return null;
          })
          .then(function (data) {
            return { status: r.status, ok: r.ok, data: data };
          });
      })
      .then(function (res) {
        removeNode(typing);
        if (res.ok && res.data && res.data.reply) {
          var reply = String(res.data.reply);
          addMessage("tutor", reply);
          // Track history so follow-up hints build on the thread.
          state.history.push({ role: "user", text: payloadEcho(mode) });
          state.history.push({ role: "assistant", text: reply });
          if (state.history.length > MAX_HISTORY * 2) {
            state.history = state.history.slice(-MAX_HISTORY * 2);
          }
          celebrateIfAllowed();
        } else if (res.status === 429) {
          addMessage("error", "You're asking quickly! Give it a few seconds and try again.");
        } else {
          offlineMessage();
        }
      })
      .catch(function () {
        removeNode(typing);
        offlineMessage();
      })
      .then(function () {
        setBusy(false);
      });
  }

  function payloadEcho(mode) {
    return mode === "hint"
      ? "Hint please (not the answer)."
      : mode === "explain"
        ? "Explain why this works."
        : "Another problem like this.";
  }

  function MODES_OK(mode) {
    return mode === "hint" || mode === "explain" || mode === "another";
  }

  function removeNode(n) {
    if (n && n.parentNode) {
      try {
        n.parentNode.removeChild(n);
      } catch (_e) {}
    }
  }

  // Light celebratory pop on a fresh reply — reuses GameFX if present, honors
  // reduced-motion and the global mute flag. Never required.
  function celebrateIfAllowed() {
    if (reduce || muted()) return;
    try {
      var last = state.log && state.log.lastElementChild;
      if (last && window.GameFX && typeof window.GameFX.pop === "function") {
        window.GameFX.pop(last);
      }
    } catch (_e) {}
  }

  // ---- boot ---------------------------------------------------------------
  function boot() {
    try {
      if (!document.body) return;
      buildUI();
    } catch (_e) {
      // Never let tutor setup break the lesson.
    }
  }

  // Public, minimal API (for tests / programmatic open).
  window.NeftTutor = {
    version: "1.0.0",
    open: openPanel,
    close: closePanel,
    ask: function (mode) {
      try {
        openPanel();
        requestTutor(mode);
      } catch (_e) {}
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
