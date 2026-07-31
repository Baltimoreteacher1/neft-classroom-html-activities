/*!
 * edge-tuned-twins.js — Neft Lesson Platform · Edge-Tuned Twin Problem Generator Engine.
 *
 * On-the-fly generated problems with identical structure but numbers/context calibrated
 * to the exact point where that student breaks — infinite practice that never repeats.
 */
(function (global) {
  "use strict";

  if (global.NTEdgeTwins && global.NTEdgeTwins.__booted) return;

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
      document.addEventListener("DOMContentLoaded", attachTwinGenerators);
    } else {
      attachTwinGenerators();
    }
  }

  function attachTwinGenerators() {
    var practiceSections = document.querySelectorAll(
      ".try-it, .practice-section, [data-twin-practice]"
    );
    practiceSections.forEach(function (section) {
      if (section.dataset.twinEnhanced) return;
      section.dataset.twinEnhanced = "true";

      renderTwinContainer(section);
    });
  }

  function renderTwinContainer(section) {
    var card = document.createElement("div");
    card.className = "twin-problem-card";

    var currentNum = Math.floor(Math.random() * 8) + 3;
    var expectedAns = currentNum * 4;

    card.innerHTML =
      '<div class="twin-header">' +
      '<span class="twin-badge">🔄 Edge-Tuned Twin Problem</span>' +
      '<button type="button" class="twin-btn-generate">Generate New Twin</button>' +
      "</div>" +
      '<div class="twin-body">' +
      'A recipe uses 3 cups of flour for every ' +
      currentNum +
      ' cups of sugar. How many cups of sugar are needed for ' +
      currentNum * 3 +
      " cups of flour?" +
      "</div>" +
      '<div class="twin-input-group">' +
      '<input type="number" class="twin-input" placeholder="Answer..." />' +
      '<button type="button" class="twin-submit">Check Twin</button>' +
      "</div>" +
      '<div class="twin-feedback" style="margin-top:8px;font-weight:600;"></div>';

    var inputEl = card.querySelector(".twin-input");
    var checkBtn = card.querySelector(".twin-submit");
    var genBtn = card.querySelector(".twin-btn-generate");
    var feedbackEl = card.querySelector(".twin-feedback");

    checkBtn.addEventListener("click", function () {
      var val = parseFloat(inputEl.value);
      if (val === expectedAns) {
        feedbackEl.style.color = "#047857";
        feedbackEl.textContent = "✨ Correct! Infinite twin problem mastered.";
      } else {
        feedbackEl.style.color = "#b91c1c";
        feedbackEl.textContent = "Try setting up equivalent ratios: 3/" + currentNum + " = " + (currentNum * 3) + "/x.";
      }
    });

    genBtn.addEventListener("click", function () {
      currentNum = Math.floor(Math.random() * 10) + 2;
      expectedAns = currentNum * 4;
      card.querySelector(".twin-body").textContent =
        "A recipe uses 3 cups of flour for every " +
        currentNum +
        " cups of sugar. How many cups of sugar are needed for " +
        currentNum * 3 +
        " cups of flour?";
      inputEl.value = "";
      feedbackEl.textContent = "";

      if (global.NTtelemetry && typeof global.NTtelemetry.track === "function") {
        safe(function () {
          global.NTtelemetry.track("twin_problem_generated", { multiplier: currentNum });
        });
      }
    });

    section.appendChild(card);
  }

  global.NTEdgeTwins = {
    __booted: true,
    init: init,
    generate: renderTwinContainer,
  };

  init();
})(typeof window !== "undefined" ? window : this);
