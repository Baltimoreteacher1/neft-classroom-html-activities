/* projects-coach.js — AI Socratic coach for unit culminating projects.
 *
 * Reuses the existing backend at /api/tutor (Claude Haiku, Socratic system
 * prompts that NEVER give the final answer for hints). This file is CLIENT-ONLY.
 *
 * Safety / design:
 *   - HEALTH-GATED: probes GET /api/tutor/health first and only mounts the dock
 *     when a live backend is reported. With no ANTHROPIC_API_KEY configured the
 *     coach renders nothing — zero impact, safe to ship before the key is set.
 *   - Cheating resistance is enforced server-side (mode "hint" never reveals the
 *     answer); the client only ever requests hint / explain / diagnose.
 *   - Context is the ACTIVE step's text + the student's own inputs on that step.
 *     No PII is sent; the backend length-caps and does not store anything.
 *   - Fully guarded: any failure leaves the project completely usable.
 */
(function () {
  "use strict";

  var TUTOR = "/api/tutor";
  var MAX_CTX = 1600; // keep payloads small
  var history = [];
  var busy = false;
  var dead = false;
  var els = {};

  function isEs() {
    var b = document.getElementById("body");
    return !!(b && b.classList.contains("es"));
  }
  function t(en, es) {
    return isEs() ? es : en;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Unit label from the path, e.g. /math/unit-3/... -> "Grade 6 Unit 3".
  function standardLabel() {
    var m = location.pathname.match(/unit-(\d+)/);
    if (m) return "Grade 6 Unit " + m[1];
    if (/statistics/.test(location.pathname)) return "Grade 6 Statistics";
    return "Grade 6";
  }

  // Text of the currently active step, in the active language, capped.
  function activeStepText() {
    var panel = document.querySelector(".step-panel.active");
    if (!panel) return "";
    var sel = isEs() ? ".es-text" : ".en-text";
    var parts = Array.prototype.map
      .call(panel.querySelectorAll(sel), function (el) {
        return (el.textContent || "").trim();
      })
      .filter(function (x) {
        return x.length > 1;
      });
    // Fall back to the whole panel text if there are no lang spans.
    var text = parts.length ? parts.join(". ") : (panel.textContent || "").trim();
    return text.slice(0, MAX_CTX);
  }

  // The student's own work on the active step (inputs + reflection), capped.
  function activeStudentWork() {
    var panel = document.querySelector(".step-panel.active");
    if (!panel) return "";
    var bits = [];
    Array.prototype.forEach.call(
      panel.querySelectorAll("input[type=text], input[type=number], textarea"),
      function (el) {
        var v = (el.value || "").trim();
        if (v) bits.push(v);
      },
    );
    return bits.join(" | ").slice(0, MAX_CTX);
  }

  function scrollLog() {
    if (els.log) els.log.scrollTop = els.log.scrollHeight;
  }

  function addMsg(kind, text) {
    var div = document.createElement("div");
    div.className = "ntc-msg " + kind;
    div.textContent = text;
    els.log.appendChild(div);
    scrollLog();
    return div;
  }

  function setBusy(on) {
    busy = on;
    if (els.send) els.send.disabled = on;
    Array.prototype.forEach.call(els.panel.querySelectorAll(".ntc-chip"), function (c) {
      c.disabled = on;
    });
  }

  // Backend confirmed unable to serve (invalid key / not configured / upstream
  // down): degrade gracefully so students don't keep clicking a dead button.
  function goOffline() {
    dead = true;
    addMsg(
      "sys",
      t(
        "The coach isn't available right now. Keep going — you've got this!",
        "El entrenador no está disponible ahora. ¡Sigue adelante, tú puedes!",
      ),
    );
    if (els.launch) els.launch.style.display = "none";
    if (els.send) els.send.disabled = true;
    if (els.input) els.input.disabled = true;
    Array.prototype.forEach.call(els.panel.querySelectorAll(".ntc-chip"), function (c) {
      c.disabled = true;
    });
  }

  // Unified request path. displayText = the student's chat bubble; userText =
  // what to store in history; extraWork = free-text appended to studentWork.
  function send(mode, displayText, userText, extraWork) {
    if (busy || dead) return;
    var itemText = activeStepText();
    if (!itemText) {
      addMsg("sys", t("Open a project step first.", "Abre un paso del proyecto primero."));
      return;
    }
    // Language directive appended to context so replies match the UI language.
    if (isEs()) itemText = "[Responde en español sencillo]\n" + itemText;

    var work = activeStudentWork();
    if (extraWork) work = (work + " | " + extraWork).slice(0, MAX_CTX);

    addMsg("me", displayText);
    var typing = document.createElement("div");
    typing.className = "ntc-typing";
    typing.textContent = t("Coach is thinking…", "El entrenador está pensando…");
    els.log.appendChild(typing);
    scrollLog();
    setBusy(true);

    fetch(TUTOR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: mode,
        standard: standardLabel(),
        itemText: itemText,
        studentWork: work,
        history: history.slice(-8),
      }),
    })
      .then(function (r) {
        return r.json().catch(function () {
          return null;
        });
      })
      .then(function (data) {
        typing.remove();
        setBusy(false);
        if (data && data.ok && data.reply) {
          addMsg("coach", data.reply);
          history.push({ role: "user", text: userText });
          history.push({ role: "assistant", text: data.reply });
        } else if (data && data.error === "rate-limited") {
          // Transient — keep the coach alive, just ask them to wait.
          addMsg(
            "sys",
            t(
              "One moment — try again in a few seconds.",
              "Un momento — inténtalo de nuevo en unos segundos.",
            ),
          );
        } else {
          // offline / unavailable / not-configured: the backend can't serve.
          goOffline();
        }
      })
      .catch(function () {
        typing.remove();
        setBusy(false);
        // Network error is likely connectivity, not a dead backend — keep coach.
        addMsg(
          "sys",
          t(
            "Could not reach the coach. Check your connection and try again.",
            "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
          ),
        );
      });
  }

  function sendFreeText() {
    var v = (els.input.value || "").trim();
    if (!v || busy || dead) return;
    els.input.value = "";
    // Free-text questions are treated as hint requests server-side (Socratic).
    send("hint", v, v, v);
  }

  function togglePanel(open) {
    var show = open === undefined ? !els.panel.classList.contains("open") : open;
    els.panel.classList.toggle("open", show);
    els.launch.style.display = show ? "none" : "";
    if (show && !els.log.childElementCount) {
      addMsg(
        "coach",
        t(
          "Hi! I'm your project coach. I give hints and questions — never the answer. What step are you on?",
          "¡Hola! Soy tu entrenador. Doy pistas y preguntas, nunca la respuesta. ¿En qué paso estás?",
        ),
      );
    }
  }

  function mount() {
    if (document.querySelector(".ntc-launch")) return;

    var launch = document.createElement("button");
    launch.type = "button";
    launch.className = "ntc-launch no-print";
    launch.innerHTML =
      "🤖 <span>" + esc(t("Stuck? Ask the coach", "¿Atascado? Pregunta")) + "</span>";

    var panel = document.createElement("div");
    panel.className = "ntc-panel no-print";
    panel.innerHTML =
      '<div class="ntc-head">🤖 ' +
      esc(t("Project Coach", "Entrenador")) +
      '<button type="button" class="ntc-x" aria-label="Close">×</button></div>' +
      '<div class="ntc-note">' +
      esc(
        t(
          "The coach gives hints and questions to help you think — it will not give the final answer.",
          "El entrenador da pistas y preguntas para ayudarte a pensar; no dará la respuesta final.",
        ),
      ) +
      "</div>" +
      '<div class="ntc-log" aria-live="polite"></div>' +
      '<div class="ntc-actions">' +
      '<button type="button" class="ntc-chip" data-mode="hint">💡 ' +
      esc(t("Hint", "Pista")) +
      "</button>" +
      '<button type="button" class="ntc-chip" data-mode="explain">📖 ' +
      esc(t("Explain", "Explica")) +
      "</button>" +
      '<button type="button" class="ntc-chip" data-mode="diagnose">🔎 ' +
      esc(t("Check my thinking", "Revisa mi trabajo")) +
      "</button>" +
      "</div>" +
      '<div class="ntc-compose">' +
      '<textarea class="ntc-input" rows="1" aria-label="' +
      esc(t("Ask the coach", "Pregunta al entrenador")) +
      '" placeholder="' +
      esc(t("Type a question…", "Escribe una pregunta…")) +
      '"></textarea>' +
      '<button type="button" class="ntc-send">' +
      esc(t("Send", "Enviar")) +
      "</button></div>";

    document.body.appendChild(launch);
    document.body.appendChild(panel);

    els = {
      launch: launch,
      panel: panel,
      log: panel.querySelector(".ntc-log"),
      input: panel.querySelector(".ntc-input"),
      send: panel.querySelector(".ntc-send"),
    };

    launch.addEventListener("click", function () {
      togglePanel(true);
    });
    panel.querySelector(".ntc-x").addEventListener("click", function () {
      togglePanel(false);
    });
    els.send.addEventListener("click", sendFreeText);
    els.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendFreeText();
      }
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".ntc-chip"), function (chip) {
      chip.addEventListener("click", function () {
        var mode = chip.getAttribute("data-mode");
        var label = chip.textContent.trim();
        send(mode, label, label);
      });
    });
  }

  // Health-gate: only mount when a live backend is reported.
  function boot() {
    fetch(TUTOR + "/health", { method: "GET" })
      .then(function (r) {
        return r.json().catch(function () {
          return null;
        });
      })
      .then(function (data) {
        if (data && data.live) {
          try {
            mount();
          } catch (e) {
            if (window.console) console.warn("[projects-coach] disabled:", e);
          }
        }
      })
      .catch(function () {
        /* no backend reachable — coach silently absent */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
