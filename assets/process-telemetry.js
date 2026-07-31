/*!
 * process-telemetry.js — Real-Time Mid-Solve Telemetry & Misconception Intervention Engine.
 *
 * Tracks the attempt in progress (order of steps, stroke/input erasures, hesitation delays >3s)
 * and intervenes MID-SOLVE before submit (e.g., detecting inverted ratio terms).
 */
(function (global) {
  "use strict";

  if (global.NTProcessTelemetry && global.NTProcessTelemetry.__booted) return;

  var HESITATION_THRESHOLD_MS = 3500;
  var stepHistory = [];
  var erasureCount = 0;
  var hesitationTimer = null;
  var activeHintNode = null;
  var booted = false;

  function safe(fn) {
    try {
      return fn();
    } catch (_e) {
      return null;
    }
  }

  function init() {
    if (booted) return;
    booted = true;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attachListeners);
    } else {
      attachListeners();
    }
  }

  function attachListeners() {
    var inputs = document.querySelectorAll(
      ".try-it input, .learn-it input, [data-step-input], .answer-input, .ratio-input",
    );

    inputs.forEach(function (input) {
      input.addEventListener("input", onStepInput);
      input.addEventListener("keydown", onStepKeydown);
      input.addEventListener("focus", resetHesitationTimer);
      input.addEventListener("blur", clearHesitationTimer);
    });

    // Tap canvas erasure events if canvas present
    var canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.addEventListener("canvas-erased", function () {
        erasureCount++;
        trackProcessEvent("stroke_erased", { erasureCount: erasureCount });
      });
    }
  }

  function onStepInput(e) {
    resetHesitationTimer();
    var input = e.target;
    var val = input.value.trim();
    var stepId = input.id || input.name || "step_" + stepHistory.length;

    stepHistory.push({
      stepId: stepId,
      val: val,
      time: Date.now(),
    });

    trackProcessEvent("step_input_change", { stepId: stepId, length: val.length });

    // Mid-solve misconception check (e.g. inverted ratio detection)
    checkMidSolveMisconceptions(input, val);
  }

  function onStepKeydown(e) {
    if (e.key === "Backspace" || e.key === "Delete") {
      if (e.target.value.length === 1) {
        erasureCount++;
        trackProcessEvent("input_erased", { erasureCount: erasureCount });
      }
    }
  }

  function resetHesitationTimer() {
    clearHesitationTimer();
    hesitationTimer = setTimeout(function () {
      trackProcessEvent("hesitation_detected", { pauseMs: HESITATION_THRESHOLD_MS });
    }, HESITATION_THRESHOLD_MS);
  }

  function clearHesitationTimer() {
    if (hesitationTimer) {
      clearTimeout(hesitationTimer);
      hesitationTimer = null;
    }
  }

  function checkMidSolveMisconceptions(input, val) {
    var targetRatio = input.dataset.expectedRatio; // e.g. "3:5" or "3/5"
    if (!targetRatio || !val) return;

    var expectedParts = targetRatio.split(/[:\/]/).map(function (s) {
      return s.trim();
    });
    var inputParts = val.split(/[:\/]/).map(function (s) {
      return s.trim();
    });

    if (expectedParts.length === 2 && inputParts.length === 2) {
      // Inverted ratio check: student typed 5:3 when 3:5 was expected
      if (inputParts[0] === expectedParts[1] && inputParts[1] === expectedParts[0]) {
        showMidSolveIntervention(
          "Check term order",
          "It looks like your ratio terms might be upside down! Compare part-to-whole or part-to-part.",
        );
        trackProcessEvent("misconception_mid_solve", { type: "inverted_ratio", val: val });
      }
    }
  }

  function showMidSolveIntervention(title, message) {
    if (activeHintNode) {
      activeHintNode.remove();
    }

    var card = document.createElement("div");
    card.className = "process-telemetry-hint";
    card.setAttribute("role", "alert");
    card.innerHTML =
      '<span class="process-telemetry-hint__icon" aria-hidden="true">💡</span>' +
      '<div class="process-telemetry-hint__content">' +
      '<div class="process-telemetry-hint__title">' +
      escapeHtml(title) +
      "</div>" +
      "<div>" +
      escapeHtml(message) +
      "</div>" +
      "</div>" +
      '<button type="button" class="process-telemetry-hint__close" aria-label="Close hint">&times;</button>';

    card.querySelector(".process-telemetry-hint__close").addEventListener("click", function () {
      card.remove();
      activeHintNode = null;
    });

    document.body.appendChild(card);
    activeHintNode = card;

    setTimeout(function () {
      if (activeHintNode === card) {
        card.remove();
        activeHintNode = null;
      }
    }, 7000);
  }

  function trackProcessEvent(eventName, details) {
    if (global.NTtelemetry && typeof global.NTtelemetry.track === "function") {
      safe(function () {
        global.NTtelemetry.track(eventName, details);
      });
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  global.NTProcessTelemetry = {
    __booted: true,
    init: init,
    intervene: showMidSolveIntervention,
  };

  init();
})(typeof window !== "undefined" ? window : this);
