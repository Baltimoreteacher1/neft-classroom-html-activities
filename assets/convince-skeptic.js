/*!
 * convince-skeptic.js — Neft Lesson Platform · "Convince the Skeptic" AI Classmate Engine.
 *
 * An AI classmate who is politely, confidently wrong; the student must argue them
 * into the right answer to build retention through explanation.
 */
(function (global) {
  "use strict";

  if (global.NTSkeptic && global.NTSkeptic.__booted) return;

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
      document.addEventListener("DOMContentLoaded", setupSkepticCards);
    } else {
      setupSkepticCards();
    }
  }

  function setupSkepticCards() {
    var containers = document.querySelectorAll(
      ".try-it, .learn-it, .skeptic-container, [data-skeptic-challenge]"
    );
    containers.forEach(function (container) {
      if (container.dataset.skepticEnhanced) return;
      container.dataset.skepticEnhanced = "true";

      // Insert Skeptic Challenge Card into the section
      renderSkepticCard(container);
    });
  }

  function renderSkepticCard(container) {
    var card = document.createElement("div");
    card.className = "skeptic-card";
    card.innerHTML =
      '<div class="skeptic-header">' +
      '<div class="skeptic-avatar">🧑‍🎓</div>' +
      '<div><div class="skeptic-name">Sam (AI Classmate)</div><div class="skeptic-subtitle">Convince the Skeptic Challenge</div></div>' +
      "</div>" +
      '<div class="skeptic-quote">"I think if a ratio is 3 to 5, and we double it, the ratio becomes 6 to 10 so the relationship completely changes! Right?"</div>' +
      '<div class="skeptic-options">' +
      '<button type="button" class="skeptic-option-btn" data-correct="false">"Yes, larger numbers mean a bigger relationship."</button>' +
      '<button type="button" class="skeptic-option-btn" data-correct="true">"No, scaling both terms by 2 keeps the ratio equivalent: 3/5 = 6/10."</button>' +
      '<button type="button" class="skeptic-option-btn" data-correct="false">"No, you should add 2 to both numbers instead."</button>' +
      "</div>" +
      '<div class="skeptic-feedback"></div>';

    var feedback = card.querySelector(".skeptic-feedback");
    var buttons = card.querySelectorAll(".skeptic-option-btn");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isCorrect = btn.dataset.correct === "true";
        if (isCorrect) {
          feedback.className = "skeptic-feedback is-convinced";
          feedback.innerHTML =
            '🎉 <strong>Sam:</strong> "Ah! I see now! Because both terms were multiplied by the exact same scale factor, the relationship stays equivalent. You convinced me!"';

          if (global.NTtelemetry && typeof global.NTtelemetry.track === "function") {
            safe(function () {
              global.NTtelemetry.track("skeptic_convinced", { success: true });
            });
          }
        } else {
          feedback.className = "skeptic-feedback";
          feedback.style.display = "block";
          feedback.style.background = "#fff1f2";
          feedback.style.color = "#9f1239";
          feedback.style.border = "1px solid #fecdd3";
          feedback.innerHTML =
            '🤔 <strong>Sam:</strong> "Hmm, I am not convinced yet. Think about scale factors or equivalent ratios!"';
        }
      });
    });

    container.appendChild(card);
  }

  global.NTSkeptic = {
    __booted: true,
    init: init,
    render: renderSkepticCard,
  };

  init();
})(typeof window !== "undefined" ? window : this);
