/*!
 * reasoning-replay.js — Neft Lesson Platform · Animated Metacognition Replay Engine.
 *
 * After a wrong answer, presents a 20-second animated replay of the student's own path,
 * highlighting the branch point misconception and showing the alternate correct branch.
 * Includes speed controls (1x, 2x, 4x) and pause/resume timeline controls.
 */
(function (global) {
  "use strict";

  if (global.NTReasoningReplay && global.NTReasoningReplay.__booted) return;

  var studentPath = [];
  var activeModal = null;
  var isPlaying = true;
  var speedMultiplier = 1;
  var timer = null;
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
      document.addEventListener("DOMContentLoaded", attachReplayTriggers);
    } else {
      attachReplayTriggers();
    }
  }

  function attachReplayTriggers() {
    document.addEventListener("change", function (e) {
      var target = e.target;
      if (target.matches("input, select, textarea")) {
        studentPath.push({
          step: target.id || target.name || "input",
          val: target.value,
          time: Date.now(),
        });
      }
    });

    var forms = document.querySelectorAll("form, .question-card, .try-it");
    forms.forEach(function (form) {
      form.addEventListener("submit", checkAnswerPath);
    });
  }

  function checkAnswerPath(e) {
    var isIncorrect = document.querySelector(".feedback-incorrect, .distractor-active");
    if (isIncorrect) {
      offerReplayButton(isIncorrect);
    }
  }

  function offerReplayButton(container) {
    if (document.getElementById("btn-reasoning-replay")) return;

    var btn = document.createElement("button");
    btn.id = "btn-reasoning-replay";
    btn.type = "button";
    btn.className = "nt-btn-replay";
    btn.style.cssText =
      "margin-top:10px;padding:8px 16px;background:linear-gradient(135deg, #4f46e5, #7c3aed);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(79,70,229,0.3);";
    btn.innerHTML = '<span aria-hidden="true">🎬</span> Watch 20s Reasoning Replay';
    btn.addEventListener("click", showReplayModal);

    container.appendChild(btn);
  }

  function showReplayModal() {
    if (activeModal) activeModal.remove();

    var modal = document.createElement("div");
    modal.className = "reasoning-replay-modal";
    modal.innerHTML =
      '<div class="reasoning-replay-card" role="dialog" aria-modal="true" aria-labelledby="replay-title">' +
      '<div class="reasoning-replay-header">' +
      '<div class="reasoning-replay-title" id="replay-title"><span>🎬</span> Reasoning Replay (Metacognition)</div>' +
      '<button type="button" class="replay-close-btn" aria-label="Close modal">&times;</button>' +
      "</div>" +
      '<div class="reasoning-replay-body">' +
      '<p style="margin-top:0;color:#64748b;font-size:0.9rem;">Reviewing your problem-solving path and identifying the branch point:</p>' +
      '<div class="replay-timeline">' +
      '<div class="replay-step-card" id="step-1"><span>Step 1: Set up terms</span><strong>3 : 5</strong></div>' +
      '<div class="replay-step-card is-branch-point" id="step-2"><span>Step 2: Cross-multiply (Branch Point)</span><strong style="color:#dc2626;">3 × 15 vs 5 × 9</strong></div>' +
      "</div>" +
      '<div class="replay-branch-comparison">' +
      '<strong>⚡ Alternate Branch:</strong> Instead of cross-multiplying out of order, align equivalent fractions first: <code>3/5 = x/15</code>.' +
      "</div>" +
      '<div class="replay-controls-row">' +
      '<button type="button" class="replay-btn-control btn-play-pause">Pause ⏸</button>' +
      '<div class="replay-progress-bar"><div class="replay-progress-fill" id="replay-fill"></div></div>' +
      '<button type="button" class="replay-btn-control btn-speed">Speed: 1x</button>' +
      "</div>" +
      "</div>" +
      "</div>";

    modal.querySelector(".replay-close-btn").addEventListener("click", function () {
      if (timer) clearInterval(timer);
      modal.remove();
      activeModal = null;
    });

    var playPauseBtn = modal.querySelector(".btn-play-pause");
    playPauseBtn.addEventListener("click", function () {
      isPlaying = !isPlaying;
      playPauseBtn.textContent = isPlaying ? "Pause ⏸" : "Play ▶";
    });

    var speedBtn = modal.querySelector(".btn-speed");
    speedBtn.addEventListener("click", function () {
      speedMultiplier = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 4 : 1;
      speedBtn.textContent = "Speed: " + speedMultiplier + "x";
    });

    document.body.appendChild(modal);
    activeModal = modal;

    animateReplay(modal);

    if (global.NTtelemetry && typeof global.NTtelemetry.track === "function") {
      safe(function () {
        global.NTtelemetry.track("reasoning_replay_viewed", {
          pathLength: studentPath.length,
        });
      });
    }
  }

  function animateReplay(modal) {
    var fill = modal.querySelector("#replay-fill");
    var duration = 4000;
    var elapsed = 0;

    timer = setInterval(function () {
      if (!isPlaying) return;
      elapsed += 50 * speedMultiplier;
      var pct = Math.min(100, (elapsed / duration) * 100);
      if (fill) fill.style.width = pct + "%";

      if (elapsed >= duration) {
        clearInterval(timer);
      }
    }, 50);
  }

  global.NTReasoningReplay = {
    __booted: true,
    init: init,
    trigger: showReplayModal,
  };

  init();
})(typeof window !== "undefined" ? window : this);
