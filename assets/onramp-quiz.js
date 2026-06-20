/* =============================================================================
 * onramp-quiz.js — interaction + Save/Resume persistence for ESOL on-ramp
 * activities. Replaces the per-page inline IIFE.
 *
 * Behavior:
 *   - Wires .choice buttons inside each [data-q]: correct → mark + lock + count;
 *     wrong → mark + disable that button. One completion per question.
 *   - Per-page feedback strings come from <body data-onramp-ok / data-onramp-retry>;
 *     warm generic defaults are used if absent.
 *   - Persists quiz progress through the shared Save/Resume engine via a custom
 *     state provider + restorer, so "X of N complete" and the correct answers
 *     come back on resume (the reflection textarea is already a captured field).
 *
 * Load order: this file is included AFTER save-resume-engine.js (both deferred),
 * so window.NeftSaveResume exists when this runs and we register synchronously
 * — before the engine's async restore resolves.
 * ========================================================================== */
(function () {
  function run() {
    var body = document.body;
    var okMsg = (body && body.getAttribute("data-onramp-ok")) || "✅ Correct — nice thinking!";
    var retryMsg =
      (body && body.getAttribute("data-onramp-retry")) ||
      "Not yet — take another look and try again.";

    var counter = document.querySelector("[data-done]");
    var questions = [].slice.call(document.querySelectorAll("[data-q]"));
    if (!questions.length) return;
    var state = questions.map(function () {
      return false;
    });

    function refreshCount() {
      var done = state.filter(Boolean).length;
      if (counter) counter.textContent = done;
    }

    function complete(q, idx, restoring) {
      state[idx] = true;
      var fb = q.querySelector(".fb");
      var correct = q.querySelector(".choice[data-correct]");
      [].forEach.call(q.querySelectorAll(".choice"), function (b) {
        b.disabled = true;
      });
      if (correct) correct.classList.add("correct");
      if (fb) {
        fb.textContent = restoring ? "✅ Saved — you finished this one." : okMsg;
        fb.className = "fb show ok";
      }
    }

    questions.forEach(function (q, idx) {
      var fb = q.querySelector(".fb");
      [].forEach.call(q.querySelectorAll(".choice"), function (btn) {
        btn.addEventListener("click", function () {
          if (state[idx]) return;
          if (btn.hasAttribute("data-correct")) {
            complete(q, idx, false);
            refreshCount();
          } else {
            btn.classList.add("wrong");
            btn.disabled = true;
            if (fb) {
              fb.textContent = retryMsg;
              fb.className = "fb show no";
            }
          }
        });
      });
    });

    function restore(saved) {
      if (!saved || !Array.isArray(saved.quiz)) return;
      saved.quiz.forEach(function (wasDone, idx) {
        if (wasDone && questions[idx] && !state[idx]) complete(questions[idx], idx, true);
      });
      refreshCount();
    }

    // Register with the Save/Resume engine if present (synchronously — the engine
    // script ran just before us and its restore resolves asynchronously).
    var SR = window.NeftSaveResume;
    if (SR && typeof SR.registerStateProvider === "function") {
      SR.registerStateProvider(function () {
        return { quiz: state.slice() };
      });
      SR.registerStateRestorer(function (mine) {
        restore(mine);
      });
    }
  }

  // Deferred script: DOM is parsed (readyState 'interactive' or 'complete'),
  // so run immediately; fall back to DOMContentLoaded only if still loading.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
