/* Neft Teacher — Futures Tutor (additive, deploy-safe, standalone).
 * =============================================================================
 * A calm, self-paced AI learning companion that layers three research-backed
 * study moves onto any lesson it is injected into. It talks to the SAME
 * safety-hardened proxy as the classic tutor (POST /api/tutor), so it inherits
 * that endpoint's rate limiting, PII-free contract, and graceful-offline
 * behavior. If the backend is not configured it shows a friendly "resting"
 * state and the lesson keeps working — this layer NEVER blocks the page.
 *
 * Study moves:
 *   1. Check my thinking (mode:"diagnose") — names the MISCONCEPTION in the
 *      student's own work, not just the wrong answer (error-analysis).
 *   2. Teach Robo (mode:"teach") — the student teaches a curious AI learner;
 *      Robo asks naive questions back (the protege effect / ICAP).
 *   3. Explain the idea (mode:"explain") — concept explanation.
 *   Voice: optional speech-to-text input + text-to-speech replies (Web Speech
 *   API). Degrades silently where unsupported. EN/ES toggle for multilingual
 *   learners. No timers, no streaks, no fail states.
 *
 * Hard rules (match the classic tutor's integration contract):
 *   - Never throws into the host lesson (everything guarded, DOM null-checked).
 *   - No student PII is sent (no names, no save codes) — only problem text and
 *     the work the student chooses to type/dictate here.
 *   - Honors window.NT_MUTED and prefers-reduced-motion; TTS is opt-in (off by
 *     default). Idempotent: boots at most once. Namespaced window.NeftFutures /
 *     `nt-fx-` ids+classes to avoid collisions with NT_/lp-tutor-/gfx/q-card.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.NeftFutures) return;

  var ENDPOINT = "/api/tutor";
  var MAX_HISTORY = 8;
  var CAP_ITEM = 1800;
  var CAP_WORK = 1800;

  var reduce = !!(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  function muted() {
    return !!window.NT_MUTED;
  }

  // ---- tiny safe DOM helpers ---------------------------------------------
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function on(node, ev, fn) {
    if (node && node.addEventListener) node.addEventListener(ev, fn);
  }
  function warn(msg, e) {
    try {
      if (window.console && console.warn) console.warn("[futures-tutor] " + msg, e || "");
    } catch (x) {}
  }

  // ---- best-effort problem/context extraction (never critical) -----------
  function currentStandard() {
    try {
      return (
        (typeof window.NT_LESSON_STANDARD === "string" && window.NT_LESSON_STANDARD) ||
        ""
      ).slice(0, 40);
    } catch (e) {
      return "";
    }
  }
  function firstText(sel) {
    try {
      var n = document.querySelector(sel);
      if (!n) return "";
      var t = (n.textContent || "").replace(/\s+/g, " ").trim();
      return t;
    } catch (e) {
      return "";
    }
  }
  function problemText() {
    // Try the likeliest carriers of the active problem, then fall back to the
    // lesson title. Purely advisory context for the model.
    var candidates = [
      "[data-problem]",
      ".q-card .prompt",
      ".q-card",
      ".nt-problem",
      "main h1",
      "h1",
    ];
    for (var i = 0; i < candidates.length; i++) {
      var t = firstText(candidates[i]);
      if (t && t.length > 8) return t.slice(0, CAP_ITEM);
    }
    try {
      return (document.title || "this math problem").slice(0, CAP_ITEM);
    } catch (e) {
      return "this math problem";
    }
  }

  // ---- state --------------------------------------------------------------
  var state = {
    open: false,
    booted: false,
    mode: "diagnose",
    tts: false,
    lang: "en", // "en" | "es"
    history: [], // {role, text}
    listening: false,
  };

  var nodes = {}; // cached element refs

  var STR = {
    en: {
      launch: "Study Buddy",
      title: "Futures Study Buddy",
      diagnose: "🔎 Check my thinking",
      teach: "🤖 Teach Robo",
      explain: "💡 Explain the idea",
      workLabel: "Type or say your work / your explanation:",
      workPlaceholder: "e.g. First I flipped the second fraction, then I multiplied…",
      send: "Send",
      mic: "Speak",
      stop: "Stop",
      close: "Close",
      ttsOn: "🔊 Voice replies on",
      ttsOff: "🔇 Voice replies off",
      resting: "Your Study Buddy is resting right now. Keep working — you've got this! 💪",
      thinking: "thinking…",
      hello: {
        diagnose:
          "Paste or type your work, then tap Send. I'll spot where your thinking slipped — not just the answer.",
        teach:
          "You're the teacher! Explain a step to Robo below. Robo will ask questions back to learn from you.",
        explain:
          "Tell me which idea to explain, or just tap Send to hear the idea behind this problem.",
      },
      error: "Hmm, I couldn't reach the tutor. Try again in a moment.",
    },
    es: {
      launch: "Compañero",
      title: "Compañero de Estudio",
      diagnose: "🔎 Revisa mi pensamiento",
      teach: "🤖 Enseña a Robo",
      explain: "💡 Explica la idea",
      workLabel: "Escribe o di tu trabajo / tu explicación:",
      workPlaceholder: "ej. Primero volteé la segunda fracción, luego multipliqué…",
      send: "Enviar",
      mic: "Hablar",
      stop: "Detener",
      close: "Cerrar",
      ttsOn: "🔊 Voz activada",
      ttsOff: "🔇 Voz desactivada",
      resting: "Tu compañero está descansando. ¡Sigue trabajando, tú puedes! 💪",
      thinking: "pensando…",
      hello: {
        diagnose:
          "Escribe tu trabajo y toca Enviar. Encontraré dónde se equivocó tu pensamiento, no solo la respuesta.",
        teach:
          "¡Tú eres el maestro! Explícale un paso a Robo. Robo te hará preguntas para aprender de ti.",
        explain: "Dime qué idea explicar, o toca Enviar para escuchar la idea de este problema.",
      },
      error: "No pude comunicarme con el tutor. Intenta de nuevo en un momento.",
    },
  };
  function t() {
    return STR[state.lang] || STR.en;
  }

  // ---- speech (optional, degrades) ---------------------------------------
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var recog = null;
  function speechSupported() {
    return !!SR;
  }
  function ttsSupported() {
    try {
      return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
    } catch (e) {
      return false;
    }
  }
  function speak(text) {
    if (!state.tts || muted() || !ttsSupported() || !text) return;
    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = state.lang === "es" ? "es-ES" : "en-US";
      u.rate = 0.98;
      window.speechSynthesis.speak(u);
    } catch (e) {
      warn("tts failed", e);
    }
  }
  function stopListening() {
    state.listening = false;
    try {
      if (recog) recog.stop();
    } catch (e) {}
    updateMicUi();
  }
  function startListening() {
    if (!speechSupported()) return;
    try {
      recog = new SR();
      recog.lang = state.lang === "es" ? "es-ES" : "en-US";
      recog.interimResults = false;
      recog.maxAlternatives = 1;
      recog.onresult = function (ev) {
        try {
          var said = ev.results[0][0].transcript || "";
          if (nodes.work) {
            nodes.work.value = (nodes.work.value ? nodes.work.value + " " : "") + said;
          }
        } catch (e) {}
      };
      recog.onerror = function () {
        state.listening = false;
        updateMicUi();
      };
      recog.onend = function () {
        state.listening = false;
        updateMicUi();
      };
      state.listening = true;
      updateMicUi();
      recog.start();
    } catch (e) {
      state.listening = false;
      updateMicUi();
      warn("speech start failed", e);
    }
  }
  function updateMicUi() {
    if (!nodes.mic) return;
    nodes.mic.textContent = state.listening ? "⏹ " + t().stop : "🎤 " + t().mic;
    nodes.mic.setAttribute("aria-pressed", state.listening ? "true" : "false");
  }

  // ---- networking ---------------------------------------------------------
  function addTurn(role, text) {
    state.history.push({ role: role, text: text });
    if (state.history.length > MAX_HISTORY) state.history = state.history.slice(-MAX_HISTORY);
  }
  function renderTurn(role, text, pending) {
    var row = el("div", "nt-fx-turn nt-fx-" + role);
    var who = el("span", "nt-fx-who", role === "assistant" ? "🤖" : "🧑");
    var body = el("div", "nt-fx-bubble" + (pending ? " nt-fx-pending" : ""), text);
    row.appendChild(who);
    row.appendChild(body);
    if (nodes.log) {
      nodes.log.appendChild(row);
      nodes.log.scrollTop = nodes.log.scrollHeight;
    }
    return body;
  }

  function send() {
    if (!nodes.log) return;
    var work = nodes.work ? nodes.work.value.trim().slice(0, CAP_WORK) : "";
    // For teach/diagnose the student's own words ARE the message; echo them.
    if (work) renderTurn("user", work);
    var pending = renderTurn("assistant", t().thinking, true);

    var payload = {
      mode: state.mode,
      standard: currentStandard(),
      itemText: problemText(),
      studentWork: work,
      history: state.history.slice(),
    };
    if (work) addTurn("user", work);
    if (nodes.work) nodes.work.value = "";

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { status: r.status, ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (res.data && res.data.offline) {
          pending.classList.remove("nt-fx-pending");
          pending.textContent = t().resting;
          return;
        }
        if (!res.ok || !res.data || !res.data.reply) {
          pending.classList.remove("nt-fx-pending");
          pending.textContent = t().error;
          return;
        }
        pending.classList.remove("nt-fx-pending");
        pending.textContent = res.data.reply;
        addTurn("assistant", res.data.reply);
        speak(res.data.reply);
      })
      .catch(function (e) {
        pending.classList.remove("nt-fx-pending");
        pending.textContent = t().error;
        warn("request failed", e);
      });
  }

  // ---- UI -----------------------------------------------------------------
  function setMode(mode) {
    state.mode = mode;
    state.history = [];
    if (nodes.chips) {
      var kids = nodes.chips.children;
      for (var i = 0; i < kids.length; i++) {
        var active = kids[i].getAttribute("data-mode") === mode;
        kids[i].classList.toggle("nt-fx-chip-on", active);
        kids[i].setAttribute("aria-pressed", active ? "true" : "false");
      }
    }
    if (nodes.log) nodes.log.textContent = "";
    renderTurn("assistant", t().hello[mode] || "", false);
  }

  function applyStrings() {
    var s = t();
    if (nodes.title) nodes.title.textContent = s.title;
    if (nodes.launch) nodes.launch.setAttribute("aria-label", s.title);
    if (nodes.work) nodes.work.setAttribute("placeholder", s.workPlaceholder);
    if (nodes.workLabel) nodes.workLabel.textContent = s.workLabel;
    if (nodes.sendBtn) nodes.sendBtn.textContent = s.send;
    if (nodes.ttsBtn) nodes.ttsBtn.textContent = state.tts ? s.ttsOn : s.ttsOff;
    var map = { diagnose: s.diagnose, teach: s.teach, explain: s.explain };
    if (nodes.chips) {
      var kids = nodes.chips.children;
      for (var i = 0; i < kids.length; i++) {
        var m = kids[i].getAttribute("data-mode");
        if (map[m]) kids[i].textContent = map[m];
      }
    }
    updateMicUi();
  }

  function openPanel() {
    if (!nodes.panel) return;
    state.open = true;
    nodes.panel.classList.add("nt-fx-show");
    nodes.panel.setAttribute("aria-hidden", "false");
    if (nodes.work) {
      try {
        nodes.work.focus();
      } catch (e) {}
    }
  }
  function closePanel() {
    if (!nodes.panel) return;
    state.open = false;
    stopListening();
    try {
      if (ttsSupported()) window.speechSynthesis.cancel();
    } catch (e) {}
    nodes.panel.classList.remove("nt-fx-show");
    nodes.panel.setAttribute("aria-hidden", "true");
  }

  function build() {
    var launch = el("button", "nt-fx-launch");
    launch.type = "button";
    launch.innerHTML = "✨";
    var lbl = el("span", "nt-fx-launch-lbl", t().launch);
    launch.appendChild(lbl);
    nodes.launch = launch;
    on(launch, "click", function () {
      state.open ? closePanel() : openPanel();
    });

    var panel = el("section", "nt-fx-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-hidden", "true");
    if (reduce) panel.classList.add("nt-fx-noanim");
    nodes.panel = panel;

    var head = el("header", "nt-fx-head");
    var title = el("h2", "nt-fx-title", t().title);
    nodes.title = title;

    var langBtn = el("button", "nt-fx-mini", "EN / ES");
    langBtn.type = "button";
    langBtn.title = "English / Español";
    on(langBtn, "click", function () {
      state.lang = state.lang === "en" ? "es" : "en";
      applyStrings();
      setMode(state.mode);
    });

    var ttsBtn = el("button", "nt-fx-mini", t().ttsOff);
    ttsBtn.type = "button";
    nodes.ttsBtn = ttsBtn;
    if (!ttsSupported()) ttsBtn.style.display = "none";
    on(ttsBtn, "click", function () {
      state.tts = !state.tts;
      if (!state.tts) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      ttsBtn.textContent = state.tts ? t().ttsOn : t().ttsOff;
    });

    var closeBtn = el("button", "nt-fx-mini nt-fx-x", "✕");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", t().close);
    on(closeBtn, "click", closePanel);

    head.appendChild(title);
    head.appendChild(langBtn);
    head.appendChild(ttsBtn);
    head.appendChild(closeBtn);

    var chips = el("div", "nt-fx-chips");
    nodes.chips = chips;
    [
      ["diagnose", t().diagnose],
      ["teach", t().teach],
      ["explain", t().explain],
    ].forEach(function (pair) {
      var c = el("button", "nt-fx-chip", pair[1]);
      c.type = "button";
      c.setAttribute("data-mode", pair[0]);
      on(c, "click", function () {
        setMode(pair[0]);
      });
      chips.appendChild(c);
    });

    var log = el("div", "nt-fx-log");
    log.setAttribute("aria-live", "polite");
    nodes.log = log;

    var workLabel = el("label", "nt-fx-worklabel", t().workLabel);
    workLabel.setAttribute("for", "nt-fx-work");
    nodes.workLabel = workLabel;

    var work = el("textarea", "nt-fx-work");
    work.id = "nt-fx-work";
    work.rows = 3;
    work.setAttribute("placeholder", t().workPlaceholder);
    nodes.work = work;

    var actions = el("div", "nt-fx-actions");
    var mic = el("button", "nt-fx-btn nt-fx-mic", "🎤 " + t().mic);
    mic.type = "button";
    nodes.mic = mic;
    if (!speechSupported()) mic.style.display = "none";
    on(mic, "click", function () {
      state.listening ? stopListening() : startListening();
    });

    var sendBtn = el("button", "nt-fx-btn nt-fx-send", t().send);
    sendBtn.type = "button";
    nodes.sendBtn = sendBtn;
    on(sendBtn, "click", send);

    actions.appendChild(mic);
    actions.appendChild(sendBtn);

    panel.appendChild(head);
    panel.appendChild(chips);
    panel.appendChild(log);
    panel.appendChild(workLabel);
    panel.appendChild(work);
    panel.appendChild(actions);

    var host = document.body || document.documentElement;
    host.appendChild(launch);
    host.appendChild(panel);

    setMode("diagnose");
    applyStrings();
  }

  function boot() {
    if (state.booted) return;
    if (!document.body) {
      return;
    }
    state.booted = true;
    try {
      build();
    } catch (e) {
      warn("build failed — layer disabled", e);
    }
  }

  window.NeftFutures = {
    version: "1.0.0",
    open: openPanel,
    close: closePanel,
    mode: setMode,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
